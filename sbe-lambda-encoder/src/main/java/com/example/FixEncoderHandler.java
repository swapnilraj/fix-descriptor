package com.example;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import uk.co.real_logic.sbe.SbeTool;

import java.io.File;
import java.io.FileWriter;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;

/**
 * AWS Lambda handler that generates SBE codec classes at runtime,
 * compiles them, and uses them to encode messages.
 */
public class FixEncoderHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private static final String TMP_DIR = "/tmp/sbe-encoder";
    private static final Map<String, Class<?>> CLASS_CACHE = new HashMap<>();
    
    @Override
    public Map<String, Object> handleRequest(Map<String, Object> input, Context context) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            context.getLogger().log("Received request");
            
            // Handle Lambda Function URL format (body is a JSON string)
            if (input.containsKey("body") && input.get("body") instanceof String) {
                String body = (String) input.get("body");
                input = gson.fromJson(body, Map.class);
                context.getLogger().log("Parsed Function URL body");
            }
            
            // Get schema
            String schemaXml = (String) input.get("schema");
            if (schemaXml == null || schemaXml.isEmpty()) {
                throw new IllegalArgumentException("'schema' is required");
            }
            
            // Get messageId (SBE template ID - numeric like 1, 2, 3)
            Object messageIdObj = input.get("messageId");
            Integer messageId = null;
            if (messageIdObj != null) {
                if (messageIdObj instanceof Number) {
                    messageId = ((Number) messageIdObj).intValue();
                } else if (messageIdObj instanceof String) {
                    try {
                        messageId = Integer.parseInt((String) messageIdObj);
                    } catch (NumberFormatException e) {
                        context.getLogger().log("Warning: Invalid messageId format: " + messageIdObj);
                    }
                }
            }
            
            // Check if this is encode or decode request
            String encodedMessage = (String) input.get("encodedMessage");
            String fixMessage = (String) input.get("fixMessage");
            
            if (encodedMessage != null && !encodedMessage.isEmpty()) {
                // DECODE mode
                return handleDecode(encodedMessage, schemaXml, messageId, input, context);
            } else if (fixMessage != null && !fixMessage.isEmpty()) {
                // ENCODE mode
                return handleEncode(fixMessage, schemaXml, messageId, input, context);
            } else {
                throw new IllegalArgumentException("Either 'fixMessage' (for encode) or 'encodedMessage' (for decode) is required");
            }
            
            
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("errorType", e.getClass().getSimpleName());
            return response;
        }
    }
    
    /**
     * Handle encode request
     */
    private Map<String, Object> handleEncode(String fixMessage, String schemaXml, Integer messageId,
                                              Map<String, Object> input, Context context) throws Exception {
        Map<String, Object> response = new HashMap<>();
        
        // Parse FIX message (tag=value format)
        Map<String, String> fixFields = parseFixMessage(fixMessage);
        context.getLogger().log("Parsed " + fixFields.size() + " FIX fields");
        
        // Validate messageId is provided
        if (messageId == null) {
            throw new IllegalArgumentException("messageId is required - specify the SBE template ID (e.g., 1, 2, 3)");
        }
        context.getLogger().log("Using SBE messageId (templateId): " + messageId);
        
        // Map FIX tags directly to SBE fields using schema field IDs
        Map<String, Object> fields = mapFixToSbeByFieldId(fixFields, schemaXml, context);
        
        // Generate schema hash for caching
        String schemaHash = hashSchema(schemaXml);
        context.getLogger().log("Schema hash: " + schemaHash);
        
        // Get or generate encoder class
        Class<?> encoderClass = getOrGenerateEncoderClass(schemaXml, schemaHash, messageId, context);
        
        // Encode message using generated class
        byte[] encodedMessage = encodeMessage(encoderClass, fields, context);
        
        // Prepare response
        response.put("success", true);
        response.put("mode", "encode");
        response.put("messageId", messageId);
        response.put("fixMessage", fixMessage);
        response.put("parsedFields", fixFields);
        response.put("mappedFields", fields);
        response.put("schemaHash", schemaHash);
        response.put("encodedBytes", encodedMessage.length);
        response.put("encodedBase64", Base64.getEncoder().encodeToString(encodedMessage));
        response.put("encodedHex", bytesToHex(encodedMessage));
        
        context.getLogger().log("Successfully encoded message: " + encodedMessage.length + " bytes");
        return response;
    }
    
    /**
     * Handle decode request
     */
    private Map<String, Object> handleDecode(String encodedMessage, String schemaXml, Integer messageId,
                                              Map<String, Object> input, Context context) throws Exception {
        Map<String, Object> response = new HashMap<>();
        
        // Decode Base64 or Hex to bytes
        byte[] messageBytes;
        if (encodedMessage.matches("^[0-9a-fA-F]+$")) {
            // Hex format
            messageBytes = hexToBytes(encodedMessage);
            context.getLogger().log("Decoded from hex: " + messageBytes.length + " bytes");
        } else {
            // Assume Base64 format
            messageBytes = Base64.getDecoder().decode(encodedMessage);
            context.getLogger().log("Decoded from base64: " + messageBytes.length + " bytes");
        }
        
        // Generate schema hash for caching
        String schemaHash = hashSchema(schemaXml);
        context.getLogger().log("Schema hash: " + schemaHash);
        
        // If messageId not provided, try to extract from header
        if (messageId == null) {
            messageId = extractMessageIdFromHeader(messageBytes, context);
            if (messageId != null) {
                context.getLogger().log("Extracted messageId from SBE header: " + messageId);
            }
        }
        
        // Get or generate decoder class (uses same generation as encoder)
        Class<?> decoderClass = getOrGenerateDecoderClass(schemaXml, schemaHash, messageId, context);
        
        // Decode message using generated class
        Map<String, Object> decodedFields = decodeMessage(decoderClass, messageBytes, schemaXml, context);
        
        // Convert SBE fields back to FIX message format
        String fixMessage = convertSbeToFixMessage(decodedFields, schemaXml, context);
        
        // Prepare response
        response.put("success", true);
        response.put("mode", "decode");
        if (messageId != null) response.put("messageId", messageId);
        response.put("encodedMessage", encodedMessage);
        response.put("encodedBytes", messageBytes.length);
        response.put("decodedFields", decodedFields);
        response.put("fixMessage", fixMessage);
        response.put("schemaHash", schemaHash);
        
        context.getLogger().log("Successfully decoded message: " + decodedFields.size() + " fields");
        return response;
    }
    
    /**
     * Get cached encoder class or generate new one
     */
    private Class<?> getOrGenerateEncoderClass(String schemaXml, String schemaHash, Integer messageId, Context context) throws Exception {
        String cacheKey = schemaHash + "_" + (messageId != null ? messageId.toString() : "default");
        
        // Check in-memory cache
        if (CLASS_CACHE.containsKey(cacheKey)) {
            context.getLogger().log("Using cached encoder class");
            return CLASS_CACHE.get(cacheKey);
        }
        
        // Check if compiled class exists on disk
        Path classDir = Paths.get(TMP_DIR, schemaHash, "compiled");
        if (Files.exists(classDir)) {
            context.getLogger().log("Loading existing compiled classes from disk");
            Class<?> encoderClass = loadCompiledClass(classDir, schemaHash, schemaXml, messageId, context);
            CLASS_CACHE.put(cacheKey, encoderClass);
            return encoderClass;
        }
        
        // Generate, compile, and load new classes
        context.getLogger().log("Generating new SBE codec classes");
        return generateAndCompileClasses(schemaXml, schemaHash, messageId, context);
    }
    
    /**
     * Generate SBE classes, compile them, and load
     */
    private Class<?> generateAndCompileClasses(String schemaXml, String schemaHash, Integer messageId, Context context) throws Exception {
        Path workDir = Paths.get(TMP_DIR, schemaHash);
        Path schemaFile = workDir.resolve("schema.xml");
        Path generatedDir = workDir.resolve("generated");
        Path compiledDir = workDir.resolve("compiled");
        
        // Create directories
        Files.createDirectories(workDir);
        Files.createDirectories(generatedDir);
        Files.createDirectories(compiledDir);
        
        // Write schema file
        Files.writeString(schemaFile, schemaXml, StandardCharsets.UTF_8);
        context.getLogger().log("Wrote schema to: " + schemaFile);
        
        // Run SBE code generator
        context.getLogger().log("Running SBE code generator...");
        System.setProperty("sbe.output.dir", generatedDir.toString());
        System.setProperty("sbe.target.language", "Java");
        SbeTool.main(new String[]{schemaFile.toString()});
        context.getLogger().log("Generated SBE classes in: " + generatedDir);
        
        // Compile generated classes
        context.getLogger().log("Compiling generated classes...");
        compileJavaFiles(generatedDir, compiledDir, context);
        
        // Load compiled encoder class
        Class<?> encoderClass = loadCompiledClass(compiledDir, schemaHash, schemaXml, messageId, context);
        
        // Cache it
        String cacheKey = schemaHash + "_" + (messageId != null ? messageId.toString() : "default");
        CLASS_CACHE.put(cacheKey, encoderClass);
        
        return encoderClass;
    }
    
    /**
     * Compile all Java files in directory (recursively)
     */
    private void compileJavaFiles(Path sourceDir, Path outputDir, Context context) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            throw new RuntimeException("No Java compiler available. Need JDK (not JRE) at runtime.");
        }
        
        // Get all .java files recursively
        java.util.List<File> javaFiles = new java.util.ArrayList<>();
        Files.walk(sourceDir)
            .filter(p -> p.toString().endsWith(".java"))
            .forEach(p -> javaFiles.add(p.toFile()));
        
        if (javaFiles.isEmpty()) {
            throw new RuntimeException("No Java files found in " + sourceDir);
        }
        
        context.getLogger().log("Compiling " + javaFiles.size() + " Java files");
        
        // Build classpath
        String classpath = System.getProperty("java.class.path");
        
        // Compile
        String[] args = new String[javaFiles.size() + 4];
        args[0] = "-d";
        args[1] = outputDir.toString();
        args[2] = "-cp";
        args[3] = classpath;
        for (int i = 0; i < javaFiles.size(); i++) {
            args[i + 4] = javaFiles.get(i).getAbsolutePath();
        }
        
        int result = compiler.run(null, null, null, args);
        if (result != 0) {
            throw new RuntimeException("Compilation failed with exit code: " + result);
        }
        
        context.getLogger().log("Compilation successful");
    }
    
    /**
     * Load compiled encoder class
     */
    private Class<?> loadCompiledClass(Path classDir, String schemaHash, String schemaXml, Integer messageId, Context context) throws Exception {
        // Create custom ClassLoader
        URL[] urls = { classDir.toUri().toURL() };
        URLClassLoader classLoader = new URLClassLoader(urls, this.getClass().getClassLoader());
        
        // Find the encoder class (typically named after message type + "Encoder")
        // Search recursively for *Encoder.class files
        java.util.List<Path> encoderClasses = new java.util.ArrayList<>();
        Files.walk(classDir)
            .filter(p -> p.toString().endsWith("Encoder.class"))
            .filter(p -> !p.toString().contains("MessageHeader")) // Skip header encoder
            .filter(p -> !p.toString().contains("VarString")) // Skip string encoder
            .forEach(encoderClasses::add);
        
        if (encoderClasses.isEmpty()) {
            throw new RuntimeException("No encoder class found in " + classDir);
        }
        
        // Find the matching encoder by messageId
        Path encoderPath = null;
        String messageTypeName = null;
        
        if (messageId != null) {
            context.getLogger().log("Looking for encoder with SBE message ID: " + messageId);
            
            // Parse schema to get message name for this ID
            try {
                javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
                factory.setNamespaceAware(true);
                javax.xml.parsers.DocumentBuilder builder = factory.newDocumentBuilder();
                org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(schemaXml.getBytes("UTF-8")));
                
                org.w3c.dom.NodeList messageNodes = doc.getElementsByTagName("message");
                if (messageNodes.getLength() == 0) {
                    messageNodes = doc.getElementsByTagNameNS("http://fixprotocol.io/2016/sbe", "message");
                }
                
                for (int i = 0; i < messageNodes.getLength(); i++) {
                    org.w3c.dom.Element message = (org.w3c.dom.Element) messageNodes.item(i);
                    String idStr = message.getAttribute("id");
                    if (idStr.equals(messageId.toString())) {
                        messageTypeName = message.getAttribute("name");
                        context.getLogger().log("  Found message name for ID " + messageId + ": " + messageTypeName);
                        break;
                    }
                }
                
                if (messageTypeName == null) {
                    throw new RuntimeException("Message ID " + messageId + " not found in schema");
                }
            } catch (Exception e) {
                throw new RuntimeException("Could not parse schema to find message name for ID " + messageId + ": " + e.getMessage());
            }
            
            // Find the matching encoder class
            context.getLogger().log("Looking for encoder class: " + messageTypeName + "Encoder");
            for (Path path : encoderClasses) {
                String fileName = path.getFileName().toString();
                String classMessageType = fileName.replace("Encoder.class", "");
                
                if (classMessageType.equalsIgnoreCase(messageTypeName)) {
                    encoderPath = path;
                    context.getLogger().log("  ✓ Found encoder: " + fileName);
                    break;
                }
            }
            
            if (encoderPath == null) {
                throw new RuntimeException("Encoder class for message '" + messageTypeName + "' not found");
            }
        } else {
            // No messageId specified, use the first encoder found
            encoderPath = encoderClasses.get(0);
            context.getLogger().log("No messageId specified, using first encoder: " + encoderPath.getFileName());
        }
        
        // Convert file path to fully qualified class name
        // e.g., /tmp/.../compiled/com/example/sbe/OrderEncoder.class -> com.example.sbe.OrderEncoder
        String relativePath = classDir.relativize(encoderPath).toString();
        String className = relativePath
            .replace(File.separator, ".")
            .replace(".class", "");
        
        context.getLogger().log("Loading encoder class: " + className);
        return classLoader.loadClass(className);
    }
    
    /**
     * Encode message using generated encoder class via reflection
     */
    private byte[] encodeMessage(Class<?> encoderClass, Map<String, Object> fields, Context context) throws Exception {
        // Create buffer (use Agrona UnsafeBuffer for SBE)
        // Increased from 4096 to 16384 to support larger schemas with all FIX fields
        byte[] bufferArray = new byte[16384];
        org.agrona.concurrent.UnsafeBuffer buffer = new org.agrona.concurrent.UnsafeBuffer(bufferArray);
        
        // Create encoder instance
        Object encoder = encoderClass.getDeclaredConstructor().newInstance();
        
        // Wrap buffer (SBE encoders have wrap(MutableDirectBuffer, int) method)
        Method wrapMethod = encoderClass.getMethod("wrap", org.agrona.MutableDirectBuffer.class, int.class);
        wrapMethod.invoke(encoder, buffer, 0);
        
        // Set each field using reflection
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            String fieldName = entry.getKey();
            Object value = entry.getValue();
            
            try {
                // Find setter method (typically fieldName(Type value))
                Method[] methods = encoderClass.getMethods();
                boolean fieldSet = false;
                
                // Debug: log all methods with this field name
                context.getLogger().log("Looking for setter methods for field: " + fieldName);
                
                // Generate possible method name variations
                String camelCaseFieldName = toCamelCase(fieldName);
                String pascalCaseFieldName = capitalize(fieldName);
                
                for (Method m : methods) {
                    String methodName = m.getName();
                    if (methodName.equals(fieldName) || 
                        methodName.equals(camelCaseFieldName) ||
                        methodName.equals("put" + pascalCaseFieldName) ||
                        methodName.equals("put" + camelCaseFieldName)) {
                        context.getLogger().log("  Found method: " + methodName + " with " + m.getParameterCount() + " params: " + java.util.Arrays.toString(m.getParameterTypes()));
                    }
                }
                
                for (Method method : methods) {
                    String methodName = method.getName();
                    // Try multiple naming variations:
                    // 1. fieldName as-is (e.g., "couponRate")
                    // 2. camelCase (e.g., "couponRate" from "CouponRate")
                    // 3. putFieldName (e.g., "putSymbol")
                    // 4. putCamelCase (e.g., "putCouponRate")
                    if (!methodName.equals(fieldName) && 
                        !methodName.equals(camelCaseFieldName) &&
                        !methodName.equals("put" + pascalCaseFieldName) &&
                        !methodName.equals("put" + camelCaseFieldName)) {
                        continue;
                    }
                    
                    // Handle variable-length data fields (byte[], int, int) or (DirectBuffer, int, int)
                    if (method.getParameterCount() == 3) {
                        Class<?>[] paramTypes = method.getParameterTypes();
                        // Check if it's a variable data field: (byte[], srcOffset, length)
                        if (paramTypes[0] == byte[].class && paramTypes[1] == int.class && paramTypes[2] == int.class) {
                            byte[] bytes = value.toString().getBytes(StandardCharsets.UTF_8);
                            method.invoke(encoder, bytes, 0, bytes.length);
                            context.getLogger().log("Set variable field " + fieldName + " = " + value + " (" + bytes.length + " bytes)");
                            fieldSet = true;
                            break;
                        }
                    }
                    // Handle fixed-length fields (single parameter)
                    else if (method.getParameterCount() == 1) {
                        Class<?> paramType = method.getParameterTypes()[0];
                        
                        // Special handling for CharSequence (String) fields
                        if (CharSequence.class.isAssignableFrom(paramType)) {
                            method.invoke(encoder, value.toString());
                            context.getLogger().log("Set string field " + fieldName + " = " + value);
                            fieldSet = true;
                            break;
                        }
                        
                        // Handle numeric fields
                        Object convertedValue = convertValue(value, paramType);
                        method.invoke(encoder, convertedValue);
                        context.getLogger().log("Set fixed field " + fieldName + " = " + convertedValue);
                        fieldSet = true;
                        break;
                    }
                }
                
                if (!fieldSet) {
                    context.getLogger().log("Warning: Could not find setter for field " + fieldName);
                }
            } catch (Exception e) {
                context.getLogger().log("Warning: Could not set field " + fieldName + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // Get encoded length
        Method encodedLengthMethod = encoderClass.getMethod("encodedLength");
        int length = (int) encodedLengthMethod.invoke(encoder);
        
        // Extract encoded bytes
        byte[] result = new byte[length];
        buffer.getBytes(0, result, 0, length);
        
        return result;
    }
    
    /**
     * Convert value to target type
     */
    private Object convertValue(Object value, Class<?> targetType) {
        if (value == null) return null;
        
        if (targetType == value.getClass()) {
            return value;
        }
        
        if (targetType == int.class || targetType == Integer.class) {
            return ((Number) value).intValue();
        } else if (targetType == long.class || targetType == Long.class) {
            return ((Number) value).longValue();
        } else if (targetType == short.class || targetType == Short.class) {
            return ((Number) value).shortValue();
        } else if (targetType == byte.class || targetType == Byte.class) {
            return ((Number) value).byteValue();
        } else if (targetType == double.class || targetType == Double.class) {
            return ((Number) value).doubleValue();
        } else if (targetType == float.class || targetType == Float.class) {
            return ((Number) value).floatValue();
        } else if (targetType == String.class) {
            return value.toString();
        }
        
        return value;
    }
    
    /**
     * Hash schema for caching
     */
    private String hashSchema(String schema) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(schema.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash).substring(0, 16);
    }
    
    /**
     * Parse FIX message from tag=value format
     */
    private Map<String, String> parseFixMessage(String fixMessage) {
        Map<String, String> fields = new HashMap<>();
        
        // Replace SOH with pipe for easier parsing
        String normalized = fixMessage.replace('\u0001', '|');
        
        String[] pairs = normalized.split("\\|");
        for (String pair : pairs) {
            pair = pair.trim();
            if (pair.isEmpty()) continue;
            
            int equalsIndex = pair.indexOf('=');
            if (equalsIndex > 0) {
                String tag = pair.substring(0, equalsIndex).trim();
                String value = pair.substring(equalsIndex + 1).trim();
                fields.put(tag, value);
            }
        }
        
        return fields;
    }
    
    
    /**
     * Map FIX tags directly to SBE fields using the schema's field ID attribute.
     * SBE field with id="11" maps to FIX tag 11.
     */
    private Map<String, Object> mapFixToSbeByFieldId(Map<String, String> fixFields, 
                                                      String schemaXml, 
                                                      Context context) throws Exception {
        Map<String, Object> sbeFields = new HashMap<>();
        
        // Extract field ID to name mapping from SBE schema
        Map<String, String> tagToFieldName = SbeSchemaParser.extractFieldIdMapping(schemaXml);
        context.getLogger().log("Schema defines " + tagToFieldName.size() + " field mappings");
        
        // Map FIX tags to SBE fields
        for (Map.Entry<String, String> entry : fixFields.entrySet()) {
            String fixTag = entry.getKey();
            String fixValue = entry.getValue();
            
            // Look up SBE field name by tag/id
            String sbeFieldName = tagToFieldName.get(fixTag);
            
            if (sbeFieldName != null) {
                Object convertedValue = convertFixValue(fixValue);
                sbeFields.put(sbeFieldName, convertedValue);
                context.getLogger().log("  Tag " + fixTag + " → " + sbeFieldName + " = " + convertedValue);
            } else {
                context.getLogger().log("  WARNING: FIX tag " + fixTag + " not defined in SBE schema");
            }
        }
        
        if (sbeFields.isEmpty()) {
            throw new IllegalArgumentException("No FIX tags matched SBE schema field IDs. Check your schema.");
        }
        
        return sbeFields;
    }
    
    /**
     * Convert FIX string value to appropriate type
     */
    private Object convertFixValue(String value) {
        // Try to parse as number
        try {
            if (value.contains(".")) {
                // Decimal number - convert to long (fixed point)
                // Multiply by 100000000 for 8 decimal places
                double doubleValue = Double.parseDouble(value);
                return (long) (doubleValue * 100000000);
            } else {
                // Try parsing as long
                return Long.parseLong(value);
            }
        } catch (NumberFormatException e) {
            // Return as string
            return value;
        }
    }
    
    /**
     * Get or generate decoder class (same as encoder generation)
     */
    private Class<?> getOrGenerateDecoderClass(String schemaXml, String schemaHash, Integer messageId,
                                                Context context) throws Exception {
        // Decoders are generated alongside encoders, so we can reuse the same generation
        return getOrGenerateEncoderClass(schemaXml, schemaHash, messageId, context);
    }
    
    /**
     * Extract messageId (templateId) from SBE message header
     */
    private Integer extractMessageIdFromHeader(byte[] messageBytes, Context context) throws Exception {
        if (messageBytes.length < 4) {
            return null;
        }
        
        // SBE header format (little endian):
        // [0-1]: blockLength (uint16)
        // [2-3]: templateId (uint16) <-- this is the messageId
        // [4-5]: schemaId (uint16)
        // [6-7]: version (uint16)
        
        // Read templateId from bytes 2-3 (little endian)
        int templateId = (messageBytes[2] & 0xFF) | ((messageBytes[3] & 0xFF) << 8);
        context.getLogger().log("Extracted templateId from header: " + templateId);
        return templateId;
    }
    
    /**
     * Decode binary message using generated SBE decoder class
     */
    private Map<String, Object> decodeMessage(Class<?> decoderClass, byte[] messageBytes, 
                                               String schemaXml, Context context) throws Exception {
        Map<String, Object> fields = new HashMap<>();
        
        // Get the decoder class name (e.g., OrderDecoder)
        String decoderClassName = decoderClass.getName().replace("Encoder", "Decoder");
        Class<?> actualDecoderClass = decoderClass.getClassLoader().loadClass(decoderClassName);
        
        context.getLogger().log("Using decoder class: " + actualDecoderClass.getName());
        
        // Create decoder instance
        Object decoder = actualDecoderClass.getDeclaredConstructor().newInstance();
        
        // Wrap bytes in UnsafeBuffer
        Class<?> unsafeBufferClass = Class.forName("org.agrona.concurrent.UnsafeBuffer");
        Object buffer = unsafeBufferClass.getDeclaredConstructor(byte[].class).newInstance(messageBytes);
        
        // SBE decoders use wrap(buffer, offset, actingBlockLength, actingVersion)
        // actingBlockLength is the size of FIXED fields only (not including variable data)
        // For our schema: orderId (8) + quantity (8) + price (8) = 24 bytes
        // Variable data (symbol) comes after the fixed block
        
        // Calculate block length by counting fixed-size fields in schema
        int blockLength = calculateBlockLength(schemaXml, context);
        context.getLogger().log("Calculated block length: " + blockLength + " bytes");
        
        try {
            // Try the full wrap method with block length and version
            Method wrapMethod = actualDecoderClass.getMethod("wrap",
                Class.forName("org.agrona.DirectBuffer"), int.class, int.class, int.class);
            wrapMethod.invoke(decoder, buffer, 0, blockLength, 0);
            context.getLogger().log("Wrapped decoder with blockLength=" + blockLength);
        } catch (NoSuchMethodException e) {
            // Fallback to simpler wrap if available
            Method wrapMethod = actualDecoderClass.getMethod("wrap",
                Class.forName("org.agrona.DirectBuffer"), int.class);
            wrapMethod.invoke(decoder, buffer, 0);
            context.getLogger().log("Wrapped decoder with simple signature");
        }
        
        // Get field name to ID mapping to identify actual data fields
        Map<String, String> nameToId = SbeSchemaParser.extractFieldNameToIdMapping(schemaXml);
        Set<String> dataFieldNames = nameToId.keySet();
        
        context.getLogger().log("Expected data fields: " + dataFieldNames);
        
        // Debug: log all decoder methods
        Method[] allMethods = actualDecoderClass.getDeclaredMethods();
        for (String fieldName : dataFieldNames) {
            context.getLogger().log("Methods for field '" + fieldName + "':");
            for (Method m : allMethods) {
                if (m.getName().toLowerCase().contains(fieldName.toLowerCase())) {
                    context.getLogger().log("  - " + m.getName() + "(" + java.util.Arrays.toString(m.getParameterTypes()) + ")");
                }
            }
        }
        
        // First, decode all fixed-length fields
        for (String fieldName : dataFieldNames) {
            try {
                // Try camelCase version of field name
                String camelFieldName = toCamelCase(fieldName);
                Method method = null;
                
                // Try to find the getter method (no parameters, returns value)
                try {
                    method = actualDecoderClass.getMethod(camelFieldName);
                } catch (NoSuchMethodException e) {
                    // Try original field name
                    try {
                        method = actualDecoderClass.getMethod(fieldName);
                    } catch (NoSuchMethodException e2) {
                        // Not a fixed field, will try as variable field later
                        continue;
                    }
                }
                
                // Check if it's a getter (no params, returns value)
                if (method.getParameterCount() == 0 && !method.getReturnType().equals(Void.TYPE)) {
                    Object value = method.invoke(decoder);
                    
                    // Skip null or default values
                    if (value == null) {
                        continue;
                    }
                    
                    // Handle CharSequence (string) types
                    if (value instanceof CharSequence) {
                        value = value.toString();
                    }
                    
                    fields.put(fieldName, value);
                    context.getLogger().log("  Decoded fixed field: " + fieldName + " = " + value);
                }
            } catch (Exception e) {
                // Skip fields that fail to decode
                context.getLogger().log("  Skipped fixed field: " + fieldName + " (error: " + e.getMessage() + ")");
            }
        }
        
        // Then, decode variable-length data fields
        for (String fieldName : dataFieldNames) {
            // Check if this field has a length method (indicating it's variable-length)
            try {
                String camelFieldName = toCamelCase(fieldName);
                Method lengthMethod = null;
                
                // Try camelCase + "Length"
                try {
                    lengthMethod = actualDecoderClass.getMethod(camelFieldName + "Length");
                } catch (NoSuchMethodException e) {
                    // Try original + "Length"
                    try {
                        lengthMethod = actualDecoderClass.getMethod(fieldName + "Length");
                    } catch (NoSuchMethodException e2) {
                        // Not a variable-length field
                        continue;
                    }
                }
                
                int length = (int) lengthMethod.invoke(decoder);
                context.getLogger().log("  Variable field " + fieldName + " has length: " + length);
                
                if (length > 0) {
                    // Find the getter method: getFieldName(byte[], int, int)
                    try {
                        Method getMethod = actualDecoderClass.getMethod("get" + capitalize(fieldName), 
                            byte[].class, int.class, int.class);
                        byte[] bytes = new byte[length];
                        int bytesRead = (int) getMethod.invoke(decoder, bytes, 0, bytes.length);
                        String value = new String(bytes, 0, bytesRead, StandardCharsets.UTF_8);
                        fields.put(fieldName, value);
                        context.getLogger().log("  Decoded variable field: " + fieldName + " = " + value + " (" + bytesRead + " bytes)");
                    } catch (NoSuchMethodException e) {
                        context.getLogger().log("  Could not find getter for variable field: " + fieldName);
                        e.printStackTrace();
                    } catch (Exception e) {
                        context.getLogger().log("  Error calling getter for variable field " + fieldName + ": " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            } catch (Exception e) {
                context.getLogger().log("  Error decoding variable field " + fieldName + ": " + e.getClass().getSimpleName() + " - " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return fields;
    }
    
    /**
     * Convert SBE fields back to FIX message format (tag=value|tag=value)
     */
    private String convertSbeToFixMessage(Map<String, Object> sbeFields, String schemaXml, 
                                           Context context) throws Exception {
        // Get field name to ID mapping (reverse of what we use for encoding)
        Map<String, String> nameToId = SbeSchemaParser.extractFieldNameToIdMapping(schemaXml);
        
        StringBuilder fixMessage = new StringBuilder();
        boolean first = true;
        
        for (Map.Entry<String, Object> entry : sbeFields.entrySet()) {
            String fieldName = entry.getKey();
            Object value = entry.getValue();
            
            // Look up FIX tag from field name
            String fixTag = nameToId.get(fieldName);
            
            if (fixTag != null) {
                if (!first) {
                    fixMessage.append("|");
                }
                
                // Format value
                String formattedValue;
                if (value instanceof Long) {
                    long longValue = (Long) value;
                    // Check if this looks like a price (large number)
                    if (longValue > 100000000) {
                        // Convert back from fixed point (8 decimal places)
                        double doubleValue = longValue / 100000000.0;
                        formattedValue = String.format("%.2f", doubleValue);
                    } else {
                        formattedValue = String.valueOf(longValue);
                    }
                } else {
                    formattedValue = String.valueOf(value);
                }
                
                fixMessage.append(fixTag).append("=").append(formattedValue);
                first = false;
                
                context.getLogger().log("  " + fieldName + " → tag " + fixTag + " = " + formattedValue);
            }
        }
        
        return fixMessage.toString();
    }
    
    /**
     * Convert hex string to bytes
     */
    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                                + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
    
    /**
     * Calculate the block length (size of fixed fields) from schema
     */
    private int calculateBlockLength(String schemaXml, Context context) throws Exception {
        // Parse schema to count fixed field sizes
        // uint64 = 8 bytes, int64 = 8 bytes, etc.
        int blockLength = 0;
        
        javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);
        javax.xml.parsers.DocumentBuilder builder = factory.newDocumentBuilder();
        org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(schemaXml.getBytes("UTF-8")));
        
        // Get all <field> elements (not <data> elements, which are variable)
        org.w3c.dom.NodeList fieldNodes = doc.getElementsByTagName("field");
        if (fieldNodes.getLength() == 0) {
            fieldNodes = doc.getElementsByTagName("sbe:field");
        }
        
        for (int i = 0; i < fieldNodes.getLength(); i++) {
            org.w3c.dom.Element field = (org.w3c.dom.Element) fieldNodes.item(i);
            String type = field.getAttribute("type");
            
            // Map SBE types to sizes
            int fieldSize = 0;
            if (type.equals("uint8") || type.equals("int8")) {
                fieldSize = 1;
            } else if (type.equals("uint16") || type.equals("int16")) {
                fieldSize = 2;
            } else if (type.equals("uint32") || type.equals("int32") || type.equals("float")) {
                fieldSize = 4;
            } else if (type.equals("uint64") || type.equals("int64") || type.equals("double")) {
                fieldSize = 8;
            }
            
            blockLength += fieldSize;
            context.getLogger().log("  Field " + field.getAttribute("name") + " (" + type + ") = " + fieldSize + " bytes");
        }
        
        return blockLength;
    }
    
    /**
     * Capitalize first letter of a string
     */
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
    
    /**
     * Convert PascalCase to camelCase (e.g., "CouponRate" -> "couponRate")
     */
    private String toCamelCase(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toLowerCase() + str.substring(1);
    }
    
    /**
     * Convert bytes to hex string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}

