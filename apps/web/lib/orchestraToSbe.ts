/**
 * Convert FIX Orchestra XML to SBE Schema XML
 * 
 * Orchestra is the standard format for FIX specifications
 * This converts it to SBE format for use with the encoder
 */

export interface OrchestraField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

/**
 * Generate a full SBE schema with ALL message types from Orchestra
 */
export function orchestraToSbeFullSchema(orchestraXml: string): string {
  try {
    // Parse Orchestra XML
    const parser = new DOMParser();
    const orchestraDoc = parser.parseFromString(orchestraXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = orchestraDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }

    // Build field dictionary
    const fieldDictionary = buildFieldDictionary(orchestraDoc);
    
    // Extract components and groups
    const { components, groups } = extractComponentsAndGroups(orchestraDoc);
    
    // Find all message definitions
    const allMessages = orchestraDoc.getElementsByTagName('*');
    const messageElements: Array<{ element: Element; name: string; id: string }> = [];
    
    for (let i = 0; i < allMessages.length; i++) {
      const el = allMessages[i];
      const localName = el.localName || el.tagName.split(':').pop();
      if (localName === 'message') {
        const name = el.getAttribute('name');
        const id = el.getAttribute('id');
        if (name && id) {
          messageElements.push({ element: el, name, id });
        }
      }
    }
    
    console.log(`Found ${messageElements.length} messages in Orchestra XML`);
    
    if (messageElements.length === 0) {
      throw new Error('No message definitions found in Orchestra XML');
    }
    
    // Process each message
    const messages: Array<{ name: string; id: string; fields: OrchestraField[] }> = [];
    
    for (const { element, name, id } of messageElements) {
      const fieldIds = extractFieldIdsFromMessage(element, components, groups);
      const fields = buildFieldsFromIds(fieldIds, fieldDictionary);
      
      if (fields.length > 0) {
        messages.push({ name, id, fields });
      }
    }
    
    // Generate full SBE schema with all messages
    return generateFullSbeSchema(messages);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Orchestra to SBE full schema conversion failed: ${error.message}`);
    }
    throw new Error('Orchestra to SBE full schema conversion failed');
  }
}

/**
 * Convert single message type from Orchestra to SBE
 */
export function orchestraToSbe(orchestraXml: string, messageType?: string): string {
  try {
    // Parse Orchestra XML
    const parser = new DOMParser();
    const orchestraDoc = parser.parseFromString(orchestraXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = orchestraDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }

    // Build field dictionary
    const fieldDictionary = buildFieldDictionary(orchestraDoc);
    
    // Extract components and groups
    const { components, groups } = extractComponentsAndGroups(orchestraDoc);

    // Find the specified message definition in Orchestra
    if (!messageType) {
      throw new Error('Message type is required');
    }
    
    // Find message by name
    let messageElement: Element | null = null;
    const messages = orchestraDoc.getElementsByTagName('*');
    for (let i = 0; i < messages.length; i++) {
      const el = messages[i];
      const localName = el.localName || el.tagName.split(':').pop();
      if (localName === 'message' && el.getAttribute('name') === messageType) {
        messageElement = el;
        break;
      }
    }
    
    if (!messageElement) {
      throw new Error(`Message type "${messageType}" not found in Orchestra XML`);
    }
    
    // Get the actual message name and ID from Orchestra
    const messageName = messageElement.getAttribute('name') || messageType;
    const messageId = messageElement.getAttribute('id') || '1';
    
    console.log(`Found message definition for ${messageType} (name: ${messageName}, id: ${messageId})`);
    
    // Extract field IDs from message structure
    const fieldIds = extractFieldIdsFromMessage(messageElement, components, groups);
    
    console.log(`Extracted ${fieldIds.size} field IDs from ${messageType} message definition`);
    
    // Build fields from IDs
    const fields = buildFieldsFromIds(fieldIds, fieldDictionary);
    
    console.log(`Generated SBE schema with ${fields.length} fields`);

    if (fields.length === 0) {
      throw new Error('No valid fields found in Orchestra file');
    }

    // Generate SBE schema with the actual message name and ID from Orchestra
    return generateSbeSchema(messageName, messageId, fields);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Orchestra to SBE conversion failed: ${error.message}`);
    }
    throw new Error('Orchestra to SBE conversion failed');
  }
}

/**
 * Build field dictionary from Orchestra XML
 */
function buildFieldDictionary(orchestraDoc: Document): Map<string, { name: string; type: string }> {
  const fieldDictionary = new Map<string, { name: string; type: string }>();
  
  // Find the <fields> container element first
  // Try multiple approaches to handle different namespace styles
  let fieldsContainer: Element | null = null;
  
  // Method 1: Try without namespace prefix
  let fieldsContainerList = orchestraDoc.getElementsByTagName('fields');
  
  // Method 2: Try with namespace URI
  if (fieldsContainerList.length === 0) {
    fieldsContainerList = orchestraDoc.getElementsByTagNameNS('http://fixprotocol.io/2016/fixrepository', 'fields');
  }
  
  // Method 3: Try to find any element with local name 'fields'
  if (fieldsContainerList.length === 0) {
    const allElements = orchestraDoc.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.localName === 'fields' || el.tagName.endsWith(':fields')) {
        fieldsContainer = el;
        break;
      }
    }
  } else {
    fieldsContainer = fieldsContainerList[0];
  }
  
  if (fieldsContainer) {
    console.log(`Found fields container with ${fieldsContainer.children.length} children`);
    
    // Only get field elements that are direct children of the fields container
    const children = fieldsContainer.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const localName = child.localName || child.tagName.split(':').pop();
      
      if (localName === 'field') {
        const id = child.getAttribute('id');
        const name = child.getAttribute('name');
        let type = child.getAttribute('type');
        
        // Some fields might have the type in a different attribute or not have a type
        // Default to String for fields without a type
        if (!type) {
          type = 'String';
        }
        
        if (id && name) {
          fieldDictionary.set(id, { name, type });
        }
      }
    }
  } else {
    console.warn('Could not find fields container in Orchestra XML');
  }
  
  return fieldDictionary;
}

/**
 * Extract components and groups from Orchestra XML
 */
function extractComponentsAndGroups(orchestraDoc: Document): { 
  components: Element[]; 
  groups: Element[] 
} {
  // Extract component information (handle both namespace-aware and non-namespace queries)
  let componentsCollection = orchestraDoc.getElementsByTagName('component');
  if (componentsCollection.length === 0) {
    componentsCollection = orchestraDoc.getElementsByTagNameNS('http://fixprotocol.io/2016/fixrepository', 'component');
  }
  
  // Convert to array for easier searching
  const components: Element[] = [];
  for (let i = 0; i < componentsCollection.length; i++) {
    components.push(componentsCollection[i]);
  }
  
  // Also check for fixr:component
  const fixrComponents = orchestraDoc.getElementsByTagName('*');
  for (let i = 0; i < fixrComponents.length; i++) {
    const el = fixrComponents[i];
    const localName = el.localName || el.tagName.split(':').pop();
    if (localName === 'component' && !components.includes(el)) {
      components.push(el);
    }
  }
  
  console.log(`Found ${components.length} components in Orchestra XML`);
  
  // Get groups for resolving group references
  const allGroups = orchestraDoc.getElementsByTagName('*');
  const groups: Element[] = [];
  for (let i = 0; i < allGroups.length; i++) {
    const el = allGroups[i];
    const localName = el.localName || el.tagName.split(':').pop();
    if (localName === 'group') {
      groups.push(el);
    }
  }
  
  return { components, groups };
}

/**
 * Extract field IDs from message structure with presence information
 */
function extractFieldIdsFromMessage(
  messageElement: Element,
  components: Element[],
  groups: Element[]
): Map<string, { required: boolean }> {
  const fieldIds = new Map<string, { required: boolean }>();
  
  const structure = messageElement.querySelector('structure') || 
                   messageElement.querySelector('fixr\\:structure') ||
                   Array.from(messageElement.children).find(el => 
                     (el.localName || el.tagName.split(':').pop()) === 'structure'
                   );
  
  if (structure) {
    // Helper function to recursively extract fields
    // inheritedPresence: the presence from the parent componentRef/groupRef
    // According to Orchestra spec, when presence is not specified, it defaults to "optional"
    const extractFields = (element: Element, depth: number = 0, inheritedPresence: string = 'optional'): void => {
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        const localName = (child.localName || child.tagName.split(':').pop() || '').toLowerCase();
        
        if (localName === 'fieldref') {
          const fieldId = child.getAttribute('id');
          if (fieldId) {
            // Check presence attribute - defaults to "optional" per Orchestra spec if not specified
            const fieldPresence = child.getAttribute('presence') || inheritedPresence;
            const isRequired = fieldPresence === 'required';
            fieldIds.set(fieldId, { required: isRequired });
          }
        } else if (localName === 'componentref') {
          const compId = child.getAttribute('id');
          if (compId) {
            const comp = components.find(c => c.getAttribute('id') === compId);
            if (comp) {
              // Get presence from componentRef - defaults to "optional" if not specified
              const compPresence = child.getAttribute('presence') || 'optional';
              extractFields(comp, depth + 1, compPresence);
            }
          }
        } else if (localName === 'groupref') {
          const groupId = child.getAttribute('id');
          if (groupId) {
            const group = groups.find(g => g.getAttribute('id') === groupId);
            if (group) {
              // Get presence from groupRef - defaults to "optional" if not specified
              const groupPresence = child.getAttribute('presence') || 'optional';
              extractFields(group, depth + 1, groupPresence);
            }
          }
        }
      }
    };
    
    extractFields(structure, 0);
  }
  
  return fieldIds;
}

/**
 * Build fields array from field IDs and dictionary
 */
function buildFieldsFromIds(
  fieldIds: Map<string, { required: boolean }>,
  fieldDictionary: Map<string, { name: string; type: string }>
): OrchestraField[] {
  const messageFields = new Map<string, OrchestraField>();
  
  // First pass: collect all data fields to identify length fields to exclude
  const dataFieldNames = new Set<string>();
  for (const [fieldId, _] of fieldIds) {
    if (fieldDictionary.has(fieldId)) {
      const fieldDef = fieldDictionary.get(fieldId)!;
      const sbeType = mapOrchestraTypeToSbe(fieldDef.type);
      if (sbeType === 'varStringEncoding' || sbeType === 'varDataEncoding') {
        dataFieldNames.add(fieldDef.name);
      }
    }
  }
  
  // Second pass: add fields, excluding length fields that have corresponding data fields
  const lengthFieldPattern = /^(.+)(Len|Length)$/i;
  
  for (const [fieldId, fieldPresence] of fieldIds) {
    if (fieldDictionary.has(fieldId)) {
      const fieldDef = fieldDictionary.get(fieldId)!;
      const fieldName = fieldDef.name;
      
      // Check if this is a length field
      const lengthMatch = fieldName.match(lengthFieldPattern);
      if (lengthMatch) {
        const baseName = lengthMatch[1];
        // Skip if corresponding data field exists
        if (dataFieldNames.has(baseName)) {
          continue;
        }
        // Also check for "Encoded" prefix pattern (e.g., EncodedIssuerLen -> EncodedIssuer)
        if (baseName.startsWith('Encoded') && dataFieldNames.has(baseName)) {
          continue;
        }
      }
      
      // Sanitize field name to avoid Java reserved keywords
      let sanitizedName = fieldDef.name;
      const lowerName = sanitizedName.toLowerCase();
      // List of Java keywords that would cause compilation errors
      const javaKeywords = ['yield', 'class', 'interface', 'return', 'void', 'new', 'this', 'super'];
      if (javaKeywords.includes(lowerName)) {
        sanitizedName = sanitizedName + 'Value';
      }
      
      messageFields.set(fieldId, {
        id: fieldId,
        name: sanitizedName,
        type: mapOrchestraTypeToSbe(fieldDef.type),
        required: fieldPresence.required,
        description: undefined
      });
    }
  }
  
  return Array.from(messageFields.values());
}

/**
 * Map Orchestra field types to SBE types
 */
function mapOrchestraTypeToSbe(orchestraType: string): string {
  const typeMap: Record<string, string> = {
    // String types
    'String': 'varStringEncoding',
    'MultipleStringValue': 'varStringEncoding',
    'MultipleCharValue': 'varStringEncoding',
    'char': 'char',
    
    // Integer types
    'int': 'int64',
    'Int': 'int64',
    'Length': 'uint32',
    'SeqNum': 'uint32',
    'NumInGroup': 'uint16',
    'TagNum': 'uint16',
    
    // Numeric types
    'Qty': 'int64',
    'Price': 'int64',
    'PriceOffset': 'int64',
    'Amt': 'int64',
    'float': 'float',
    'double': 'double',
    
    // Date/Time types
    'UTCTimestamp': 'uint64',
    'UTCTimeOnly': 'uint64',
    'UTCDateOnly': 'uint32',
    'LocalMktDate': 'uint32',
    'MonthYear': 'uint32',
    'TZTimeOnly': 'uint64',
    'TZTimestamp': 'uint64',
    
    // Boolean
    'Boolean': 'uint8',
    
    // Raw data
    'data': 'varDataEncoding',
    'XMLData': 'varDataEncoding',
    
    // Common FIX-specific types (CodeSets, enums, etc.)
    'Currency': 'varStringEncoding',
    'Exchange': 'varStringEncoding',
    'Country': 'varStringEncoding',
    'Percentage': 'varStringEncoding'
  };

  // Check if it's a variable-length string
  if (orchestraType.toLowerCase().includes('string')) {
    return 'varStringEncoding';
  }
  
  // Check if it's a CodeSet (enum) - these should be strings
  if (orchestraType.includes('CodeSet')) {
    return 'varStringEncoding';
  }

  // Default to varStringEncoding for unknown types (safer than int64)
  return typeMap[orchestraType] || 'varStringEncoding';
}

/**
 * Get appropriate null value for SBE type (for optional fields)
 */
function getNullValue(sbeType: string): string {
  // According to SBE spec, null values are typically:
  // - Unsigned integers: max value for the type
  // - Signed integers: min value for the type  
  // - Float/Double: NaN
  // - Char: 0 (null character)
  const nullValues: Record<string, string> = {
    'uint8': '255',
    'uint16': '65535',
    'uint32': '4294967295',
    'uint64': '18446744073709551615',
    'int8': '-128',
    'int16': '-32768',
    'int32': '-2147483648',
    'int64': '-9223372036854775808',
    'float': 'NaN',
    'double': 'NaN',
    'char': '\\0',
  };
  
  return nullValues[sbeType] || '0';
}

/**
 * Generate complete SBE schema XML with all messages
 */
function generateFullSbeSchema(
  messages: Array<{ name: string; id: string; fields: OrchestraField[] }>
): string {
  // Generate message definitions
  const messageDefinitions = messages.map(({ name, id, fields }) => {
    const fixedFields: string[] = [];
    const varFields: string[] = [];
    
    fields.forEach(field => {
      const isVarLength = field.type === 'varStringEncoding' || field.type === 'varDataEncoding';
      const presenceAttr = (!field.required && !isVarLength) ? ' presence="optional"' : '';
      const nullValueAttr = (!field.required && !isVarLength) ? ` nullValue="${getNullValue(field.type)}"` : '';
      
      if (isVarLength) {
        varFields.push(`    <data name="${field.name}" id="${field.id}" type="${field.type}"/>`);
      } else {
        fixedFields.push(`    <field name="${field.name}" id="${field.id}" type="${field.type}"${presenceAttr}${nullValueAttr}/>`);
      }
    });
    
    const sbeFields = [...fixedFields, ...varFields].join('\n');
    
    return `  <sbe:message name="${name}" id="${id}">
${sbeFields}
  </sbe:message>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sbe:messageSchema xmlns:sbe="http://fixprotocol.io/2016/sbe" 
                   package="com.example.sbe" 
                   id="1" 
                   version="0" 
                   byteOrder="littleEndian">
  <types>
    <composite name="messageHeader">
      <type name="blockLength" primitiveType="uint16"/>
      <type name="templateId" primitiveType="uint16"/>
      <type name="schemaId" primitiveType="uint16"/>
      <type name="version" primitiveType="uint16"/>
    </composite>
    <composite name="varStringEncoding">
      <type name="length" primitiveType="uint16"/>
      <type name="varData" primitiveType="uint8" length="0" characterEncoding="UTF-8"/>
    </composite>
    <composite name="varDataEncoding">
      <type name="length" primitiveType="uint16"/>
      <type name="varData" primitiveType="uint8" length="0"/>
    </composite>
  </types>
${messageDefinitions}
</sbe:messageSchema>`;
}

/**
 * Generate complete SBE schema XML
 */
function generateSbeSchema(
  messageName: string,
  messageId: string,
  fields: OrchestraField[]
): string {
  // Separate fixed-size fields from variable-length data fields
  // SBE requires all fields before all data elements
  const fixedFields: string[] = [];
  const varFields: string[] = [];
  
  fields.forEach(field => {
    const isVarLength = field.type === 'varStringEncoding' || field.type === 'varDataEncoding';
    const presenceAttr = (!field.required && !isVarLength) ? ' presence="optional"' : '';
    const nullValueAttr = (!field.required && !isVarLength) ? ` nullValue="${getNullValue(field.type)}"` : '';
    
    if (isVarLength) {
      varFields.push(`    <data name="${field.name}" id="${field.id}" type="${field.type}"/>`);
    } else {
      fixedFields.push(`    <field name="${field.name}" id="${field.id}" type="${field.type}"${presenceAttr}${nullValueAttr}/>`);
    }
  });
  
  // Concatenate fixed fields first, then variable fields
  const sbeFields = [...fixedFields, ...varFields].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sbe:messageSchema xmlns:sbe="http://fixprotocol.io/2016/sbe" 
                   package="com.example.sbe" 
                   id="1" 
                   version="0" 
                   byteOrder="littleEndian">
  <types>
    <composite name="messageHeader">
      <type name="blockLength" primitiveType="uint16"/>
      <type name="templateId" primitiveType="uint16"/>
      <type name="schemaId" primitiveType="uint16"/>
      <type name="version" primitiveType="uint16"/>
    </composite>
    <composite name="varStringEncoding">
      <type name="length" primitiveType="uint16"/>
      <type name="varData" primitiveType="uint8" length="0" characterEncoding="UTF-8"/>
    </composite>
    <composite name="varDataEncoding">
      <type name="length" primitiveType="uint16"/>
      <type name="varData" primitiveType="uint8" length="0"/>
    </composite>
  </types>
  <sbe:message name="${messageName}" id="${messageId}">
${sbeFields}
  </sbe:message>
</sbe:messageSchema>`;
}

/**
 * Extract message ID from SBE schema for a given message name
 */
export function extractMessageIdFromSbe(sbeSchema: string, messageName: string): string | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sbeSchema, 'text/xml');
    
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return null;
    }
    
    // Find message element by name
    const messages = doc.getElementsByTagName('*');
    for (let i = 0; i < messages.length; i++) {
      const el = messages[i];
      const localName = el.localName || el.tagName.split(':').pop();
      if (localName === 'message' && el.getAttribute('name') === messageName) {
        return el.getAttribute('id');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to extract message ID:', error);
    return null;
  }
}


