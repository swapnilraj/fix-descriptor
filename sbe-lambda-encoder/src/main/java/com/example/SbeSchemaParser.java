package com.example;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.w3c.dom.Element;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Parses SBE XML schema to extract field names.
 */
public class SbeSchemaParser {
    
    /**
     * Extract mapping of field ID to field name from SBE schema.
     * This allows direct mapping from FIX tag (e.g., 11) to SBE field name (e.g., "orderId")
     * based on the field's id attribute: <field name="orderId" id="11" .../>
     * 
     * @param schemaXml SBE schema XML string
     * @return Map of field ID (as string) to field name
     */
    public static Map<String, String> extractFieldIdMapping(String schemaXml) throws Exception {
        Map<String, String> idToName = new HashMap<>();
        
        // Parse XML
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false); // Don't use namespace-aware parsing
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(schemaXml.getBytes("UTF-8")));
        
        // Extract field id→name mappings from <field name="..." id="..."> elements
        // Try both with and without namespace prefix
        NodeList fieldNodes = doc.getElementsByTagName("field");
        if (fieldNodes.getLength() == 0) {
            fieldNodes = doc.getElementsByTagName("sbe:field");
        }
        
        for (int i = 0; i < fieldNodes.getLength(); i++) {
            Element field = (Element) fieldNodes.item(i);
            String fieldId = field.getAttribute("id");
            String fieldName = field.getAttribute("name");
            
            if (fieldId != null && !fieldId.isEmpty() && fieldName != null && !fieldName.isEmpty()) {
                idToName.put(fieldId, fieldName);
            }
        }
        
        // Also extract data field id→name mappings from <data name="..." id="..."> elements
        NodeList dataNodes = doc.getElementsByTagName("data");
        if (dataNodes.getLength() == 0) {
            dataNodes = doc.getElementsByTagName("sbe:data");
        }
        
        for (int i = 0; i < dataNodes.getLength(); i++) {
            Element field = (Element) dataNodes.item(i);
            String fieldId = field.getAttribute("id");
            String fieldName = field.getAttribute("name");
            
            if (fieldId != null && !fieldId.isEmpty() && fieldName != null && !fieldName.isEmpty()) {
                idToName.put(fieldId, fieldName);
            }
        }
        
        return idToName;
    }
    
    /**
     * Extract mapping of field name to field ID from SBE schema.
     * This is the reverse of extractFieldIdMapping, used for decoding.
     * 
     * @param schemaXml SBE schema XML string
     * @return Map of field name to field ID (as string)
     */
    public static Map<String, String> extractFieldNameToIdMapping(String schemaXml) throws Exception {
        Map<String, String> nameToId = new HashMap<>();
        
        // Parse XML
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(schemaXml.getBytes("UTF-8")));
        
        // Extract field name→id mappings from <field name="..." id="..."> elements
        NodeList fieldNodes = doc.getElementsByTagName("field");
        if (fieldNodes.getLength() == 0) {
            fieldNodes = doc.getElementsByTagName("sbe:field");
        }
        
        for (int i = 0; i < fieldNodes.getLength(); i++) {
            Element field = (Element) fieldNodes.item(i);
            String fieldId = field.getAttribute("id");
            String fieldName = field.getAttribute("name");
            
            if (fieldId != null && !fieldId.isEmpty() && fieldName != null && !fieldName.isEmpty()) {
                nameToId.put(fieldName, fieldId);
            }
        }
        
        // Also extract data field name→id mappings from <data name="..." id="..."> elements
        NodeList dataNodes = doc.getElementsByTagName("data");
        if (dataNodes.getLength() == 0) {
            dataNodes = doc.getElementsByTagName("sbe:data");
        }
        
        for (int i = 0; i < dataNodes.getLength(); i++) {
            Element field = (Element) dataNodes.item(i);
            String fieldId = field.getAttribute("id");
            String fieldName = field.getAttribute("name");
            
            if (fieldId != null && !fieldId.isEmpty() && fieldName != null && !fieldName.isEmpty()) {
                nameToId.put(fieldName, fieldId);
            }
        }
        
        return nameToId;
    }
    
    /**
     * Extract SBE field names from schema XML.
     * @param schemaXml SBE schema XML string
     * @return List of SBE field names
     */
    public static List<String> extractFieldNames(String schemaXml) throws Exception {
        List<String> fieldNames = new ArrayList<>();
        
        // Parse XML
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(false);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(schemaXml.getBytes("UTF-8")));
        
        // Extract field names from <field name="..."> elements
        NodeList fieldNodes = doc.getElementsByTagName("field");
        if (fieldNodes.getLength() == 0) {
            fieldNodes = doc.getElementsByTagName("sbe:field");
        }
        
        for (int i = 0; i < fieldNodes.getLength(); i++) {
            Element field = (Element) fieldNodes.item(i);
            String fieldName = field.getAttribute("name");
            if (fieldName != null && !fieldName.isEmpty()) {
                fieldNames.add(fieldName);
            }
        }
        
        // Also extract data field names from <data name="..."> elements
        NodeList dataNodes = doc.getElementsByTagName("data");
        if (dataNodes.getLength() == 0) {
            dataNodes = doc.getElementsByTagName("sbe:data");
        }
        
        for (int i = 0; i < dataNodes.getLength(); i++) {
            Element field = (Element) dataNodes.item(i);
            String fieldName = field.getAttribute("name");
            if (fieldName != null && !fieldName.isEmpty()) {
                fieldNames.add(fieldName);
            }
        }
        
        return fieldNames;
    }
    
    /**
     * Fuzzy match FIX field name to SBE field name.
     * Examples:
     *   - ClOrdID → orderId (remove prefix, lowercase)
     *   - OrderQty → quantity (partial match)
     *   - Symbol → symbol (exact match, case insensitive)
     */
    public static String fuzzyMatch(String fixFieldName, List<String> sbeFieldNames) {
        if (fixFieldName == null || sbeFieldNames == null) {
            return null;
        }
        
        String fixLower = fixFieldName.toLowerCase();
        
        // Try exact match (case insensitive)
        for (String sbeField : sbeFieldNames) {
            if (sbeField.equalsIgnoreCase(fixFieldName)) {
                return sbeField;
            }
        }
        
        // Try removing common FIX prefixes (Cl, No, Avg, etc.) and matching
        String withoutPrefix = fixLower.replaceFirst("^(cl|no|avg|cum|end|begin|msg|leg)", "");
        for (String sbeField : sbeFieldNames) {
            if (sbeField.equalsIgnoreCase(withoutPrefix)) {
                return sbeField;
            }
        }
        
        // Try partial match (FIX name contains SBE name or vice versa)
        for (String sbeField : sbeFieldNames) {
            String sbeLower = sbeField.toLowerCase();
            if (fixLower.contains(sbeLower) || sbeLower.contains(fixLower)) {
                return sbeField;
            }
        }
        
        // Try matching by removing all vowels (fuzzy phonetic match)
        String fixNoVowels = fixLower.replaceAll("[aeiou]", "");
        for (String sbeField : sbeFieldNames) {
            String sbeNoVowels = sbeField.toLowerCase().replaceAll("[aeiou]", "");
            if (fixNoVowels.equals(sbeNoVowels)) {
                return sbeField;
            }
        }
        
        return null;
    }
}

