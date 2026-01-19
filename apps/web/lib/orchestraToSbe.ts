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

    // Extract component information (handle both namespace-aware and non-namespace queries)
    let components = orchestraDoc.getElementsByTagName('component');
    if (components.length === 0) {
      components = orchestraDoc.getElementsByTagName('fixr:component');
    }
    
    if (components.length === 0) {
      throw new Error('No components found in Orchestra XML');
    }

    // Collect all fields from components
    const allComponentFields = new Map<string, OrchestraField>();
    const componentNames: string[] = [];
    
    // If fieldIds provided, only include components that have those fields
    // Otherwise, include all components
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const componentName = component.getAttribute('name') || `Component${i}`;
      const componentFields: OrchestraField[] = [];
      
      // Try to find structure element
      let structure: Element | null = null;
      for (let j = 0; j < component.children.length; j++) {
        const child = component.children[j];
        const tagName = child.tagName.toLowerCase();
        if (tagName === 'structure' || tagName === 'fixr:structure') {
          structure = child;
          break;
        }
      }

      const sourceElement = structure || component;
      
      // Extract fieldRef elements
      for (let j = 0; j < sourceElement.children.length; j++) {
        const child = sourceElement.children[j];
        const tagName = child.tagName.toLowerCase();
        
        if (tagName === 'fieldref' || tagName === 'fixr:fieldref') {
          const id = child.getAttribute('id');
          const required = child.getAttribute('presence') === 'required';
          
          if (id && fieldDictionary.has(id)) {
            const fieldDef = fieldDictionary.get(id)!;
            componentFields.push({
              id,
              name: fieldDef.name,
              type: mapOrchestraTypeToSbe(fieldDef.type),
              required,
              description: undefined
            });
          }
        } else if (tagName === 'field' || tagName === 'fixr:field') {
          // Inline field definition
          const id = child.getAttribute('id');
          const name = child.getAttribute('name');
          const type = child.getAttribute('type');
          if (id && name && type) {
            componentFields.push({
              id,
              name,
              type: mapOrchestraTypeToSbe(type),
              required: child.getAttribute('presence') === 'required',
              description: undefined
            });
          }
        }
      }
      
      // If fieldIds specified, only include this component if it has matching fields
      // If fieldIds not specified, include all components
      const shouldInclude = !fieldIds || componentFields.some(f => fieldIds.includes(f.id));
      
      if (shouldInclude && componentFields.length > 0) {
        componentNames.push(componentName);
        componentFields.forEach(field => {
          if (!allComponentFields.has(field.id)) {
            allComponentFields.set(field.id, field);
          }
        });
      }
    }
    
    const fields: OrchestraField[] = Array.from(allComponentFields.values());
    const messageName = componentNames.length > 0 ? componentNames.join('_') : 'SecurityDefinition';
    const messageId = '1';

    if (fields.length === 0) {
      throw new Error(`No fields found in Orchestra components. Components may only contain nested groups which are not yet supported for SBE conversion.`);
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


