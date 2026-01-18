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

export function orchestraToSbe(orchestraXml: string, messageIndex: number = 0): string {
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
    let fieldsContainer: Element | null = null;
    let fieldsContainerList = orchestraDoc.getElementsByTagName('fields');
    if (fieldsContainerList.length === 0) {
      fieldsContainerList = orchestraDoc.getElementsByTagName('fixr:fields');
    }
    if (fieldsContainerList.length > 0) {
      fieldsContainer = fieldsContainerList[0];
      
      // Only get field elements that are direct children of the fields container
      const children = fieldsContainer.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const tagName = child.tagName.toLowerCase();
        if (tagName === 'field' || tagName === 'fixr:field') {
          const id = child.getAttribute('id');
          const name = child.getAttribute('name');
          const type = child.getAttribute('type');
          if (id && name && type) {
            fieldDictionary.set(id, { name, type });
          }
        }
      }
    }

    // Extract message information (handle both namespace-aware and non-namespace queries)
    let messages = orchestraDoc.getElementsByTagName('message');
    if (messages.length === 0) {
      messages = orchestraDoc.getElementsByTagName('fixr:message');
    }
    
    if (messages.length === 0) {
      throw new Error('No messages found in Orchestra XML');
    }

    // Use specified message index (default to first)
    const actualIndex = Math.min(messageIndex, messages.length - 1);
    const message = messages[actualIndex];
    const messageName = message.getAttribute('name') || 'Message';
    const messageId = message.getAttribute('id') || '1';
    
    // Extract fields from the message
    const fields: OrchestraField[] = [];
    
    // Try to find structure element (first direct child)
    let structure: Element | null = null;
    for (let i = 0; i < message.children.length; i++) {
      const child = message.children[i];
      const tagName = child.tagName.toLowerCase();
      if (tagName === 'structure' || tagName === 'fixr:structure') {
        structure = child;
        break;
      }
    }

    const sourceElement = structure || message;
    
    // Check for fieldRef elements (repository-style with field references)
    // Only get direct children to avoid nested components/groups
    let hasFieldRefs = false;
    for (let i = 0; i < sourceElement.children.length; i++) {
      const child = sourceElement.children[i];
      const tagName = child.tagName.toLowerCase();
      
      if (tagName === 'fieldref' || tagName === 'fixr:fieldref') {
        hasFieldRefs = true;
        const id = child.getAttribute('id');
        const required = child.getAttribute('presence') === 'required';
        
        if (id && fieldDictionary.has(id)) {
          const fieldDef = fieldDictionary.get(id)!;
          fields.push({
            id,
            name: fieldDef.name,
            type: mapOrchestraTypeToSbe(fieldDef.type),
            required,
            description: undefined
          });
        }
        // Skip if field not found - it might be a component or group ref
      }
    }
    
    // If no fieldRefs found, look for inline field definitions (simple Orchestra format)
    if (!hasFieldRefs) {
      for (let i = 0; i < sourceElement.children.length; i++) {
        const child = sourceElement.children[i];
        const tagName = child.tagName.toLowerCase();
        
        if (tagName === 'field' || tagName === 'fixr:field') {
          const id = child.getAttribute('id');
          const name = child.getAttribute('name');
          const type = child.getAttribute('type');
          const required = child.getAttribute('presence') === 'required' || 
                         child.getAttribute('required') === 'Y';
          
          if (id && name && type) {
            fields.push({
              id,
              name,
              type: mapOrchestraTypeToSbe(type),
              required,
              description: child.getAttribute('description') || undefined
            });
          }
        }
      }
    }

    if (fields.length === 0) {
      throw new Error(`No fields found in Orchestra message "${messageName}". Message may only contain components/groups which are not yet supported for SBE conversion.`);
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
  const sbeFields = fields.map(field => {
    const isVarLength = field.type === 'varStringEncoding' || field.type === 'varDataEncoding';
    
    if (isVarLength) {
      return `    <data name="${field.name}" id="${field.id}" type="${field.type}"/>`;
    } else {
      return `    <field name="${field.name}" id="${field.id}" type="${field.type}"/>`;
    }
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
  <sbe:message name="${messageName}" id="${messageId}">
${sbeFields}
  </sbe:message>
</sbe:messageSchema>`;
}


