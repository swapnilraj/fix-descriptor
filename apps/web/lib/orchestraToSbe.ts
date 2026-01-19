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

export function orchestraToSbe(orchestraXml: string, fieldIds?: string[]): string {
  try {
    // Parse Orchestra XML
    const parser = new DOMParser();
    const orchestraDoc = parser.parseFromString(orchestraXml, 'text/xml');
    
    // Check for parsing errors
    const parserError = orchestraDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }

    // Build field dictionary from <fields> section ONLY (repository-style Orchestra)
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

    // Extract component information (handle both namespace-aware and non-namespace queries)
    let components = orchestraDoc.getElementsByTagName('component');
    if (components.length === 0) {
      components = orchestraDoc.getElementsByTagNameNS('http://fixprotocol.io/2016/fixrepository', 'component');
    }
    
    console.log(`Found ${components.length} components in Orchestra XML`);

    // Generate schema only for the fields present in the input message
    const messageFields = new Map<string, OrchestraField>();
    
    if (!fieldIds || fieldIds.length === 0) {
      throw new Error('No field IDs provided. Cannot generate SBE schema without knowing which fields to include.');
    }
    
    console.log(`Generating SBE schema for ${fieldIds.length} field(s): ${fieldIds.join(', ')}`);
    
    // Add each requested field from the field dictionary
    for (const fieldId of fieldIds) {
      if (fieldDictionary.has(fieldId)) {
        const fieldDef = fieldDictionary.get(fieldId)!;
        messageFields.set(fieldId, {
          id: fieldId,
          name: fieldDef.name,
          type: mapOrchestraTypeToSbe(fieldDef.type),
          required: false,
          description: undefined
        });
      } else {
        console.warn(`Field ID ${fieldId} not found in Orchestra field dictionary`);
      }
    }
    
    const fields: OrchestraField[] = Array.from(messageFields.values());
    console.log(`Generated SBE schema with ${fields.length} fields`);
    
    const messageName = 'FIXMessage';
    const messageId = '1';

    if (fields.length === 0) {
      throw new Error(`No valid fields found. Requested field IDs: ${fieldIds.join(', ')}`);
    }

    // Generate SBE schema
    return generateSbeSchema(messageName, messageId, fields);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Orchestra to SBE conversion failed: ${error.message}`);
    }
    throw new Error('Orchestra to SBE conversion failed');
  }
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
    'XMLData': 'varDataEncoding'
  };

  // Check if it's a variable-length string
  if (orchestraType.toLowerCase().includes('string')) {
    return 'varStringEncoding';
  }

  return typeMap[orchestraType] || 'int64'; // Default to int64 for unknown types
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
    
    if (isVarLength) {
      varFields.push(`    <data name="${field.name}" id="${field.id}" type="${field.type}"/>`);
    } else {
      fixedFields.push(`    <field name="${field.name}" id="${field.id}" type="${field.type}"/>`);
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


