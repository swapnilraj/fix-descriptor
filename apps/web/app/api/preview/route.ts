import { NextRequest, NextResponse } from 'next/server';
import {
  buildCanonicalTree,
  enumerateLeaves,
  computeRoot,
  buildMerkleTreeStructure,
  type DescriptorTree,
  type GroupNode
} from 'fixdescriptorkit-typescript';
export const runtime = 'nodejs';

// FIX Tag reference
const FIX_TAGS: Record<string, { name: string; description: string }> = {
  "15": { name: "Currency", description: "Currency of the instrument" },
  "22": { name: "SecurityIDSource", description: "Source of SecurityID (1=CUSIP, 4=ISIN)" },
  "48": { name: "SecurityID", description: "Primary security identifier" },
  "55": { name: "Symbol", description: "Ticker or common symbol" },
  "167": { name: "SecurityType", description: "Type of security (TBOND, CORP, CS, etc.)" },
  "223": { name: "CouponRate", description: "Interest rate for fixed income" },
  "447": { name: "PartyIDSource", description: "Source of PartyID" },
  "448": { name: "PartyID", description: "Party identifier" },
  "452": { name: "PartyRole", description: "Role of the party (1=Issuer, 24=Trustee)" },
  "453": { name: "NoPartyIDs", description: "Number of party entries" },
  "454": { name: "NoSecurityAltID", description: "Number of alternative security IDs" },
  "455": { name: "SecurityAltID", description: "Alternative security identifier" },
  "456": { name: "SecurityAltIDSource", description: "Source of alternative ID" },
  "461": { name: "CFICode", description: "ISO 10962 Classification of Financial Instruments" },
  "541": { name: "MaturityDate", description: "Maturity date (YYYYMMDD)" },
  "802": { name: "NoPartySubIDs", description: "Number of party sub-identifiers" }
};

type TreeNodeData = {
  tag?: string;
  name?: string;
  value?: string;
  type: 'scalar' | 'group' | 'entry' | 'root';
  children?: TreeNodeData[];
  path?: number[];
  isExpanded?: boolean;
};

// Convert DescriptorTree to TreeNodeData format
function descriptorTreeToTreeData(tree: DescriptorTree, schemaFieldMapping: Record<string, { name: string; type: string }> = {}): TreeNodeData {
  const root: TreeNodeData = {
    type: 'root',
    name: 'FIX Descriptor',
    children: [],
    isExpanded: true
  };

  const children: TreeNodeData[] = [];

  for (const [tagNum, value] of Object.entries(tree)) {
    const tag = String(tagNum);
    // Use schema field mapping first, fallback to FIX_TAGS
    const schemaField = schemaFieldMapping[tag];
    const tagInfo = schemaField || FIX_TAGS[tag];
    const fieldName = schemaField ? schemaField.name : (FIX_TAGS[tag]?.name || `Tag ${tag}`);

    if (typeof value === 'string') {
      // Scalar field
      children.push({
        type: 'scalar',
        tag,
        name: fieldName,
        value,
        path: [Number(tag)],
        isExpanded: false
      });
    } else {
      // Group
      const groupNode = value as GroupNode;
      const groupChildren: TreeNodeData[] = [];

      groupNode.entries.forEach((entry, index) => {
        const entryChildren: TreeNodeData[] = [];
        
        for (const [entryTagNum, entryValue] of Object.entries(entry)) {
          const entryTag = String(entryTagNum);
          const schemaEntryField = schemaFieldMapping[entryTag];
          const entryFieldName = schemaEntryField ? schemaEntryField.name : (FIX_TAGS[entryTag]?.name || `Tag ${entryTag}`);
          
          entryChildren.push({
            type: 'scalar',
            tag: entryTag,
            name: entryFieldName,
            value: entryValue as string,
            path: [Number(tag), index + 1, Number(entryTag)],
            isExpanded: false
          });
        }

        groupChildren.push({
          type: 'entry',
          name: `Entry ${index + 1}`,
          children: entryChildren,
          path: [Number(tag), index + 1],
          isExpanded: false
        });
      });

      children.push({
        type: 'group',
        tag,
        name: fieldName,
        value: String(groupNode.entries.length),
        children: groupChildren,
        path: [Number(tag)],
        isExpanded: false
      });
    }
  }

  root.children = children;
  return root;
}

// Convert DescriptorTree to parsed fields array for display
function descriptorTreeToFields(tree: DescriptorTree): Array<{ tag: string; value: string; tagInfo?: typeof FIX_TAGS[string] }> {
  const fields: Array<{ tag: string; value: string; tagInfo?: typeof FIX_TAGS[string] }> = [];

  for (const [tagNum, value] of Object.entries(tree)) {
    const tag = String(tagNum);
    const tagInfo = FIX_TAGS[tag];

    if (typeof value === 'string') {
      fields.push({ tag, value, tagInfo });
    } else {
      const groupNode = value as GroupNode;
      fields.push({ tag, value: String(groupNode.entries.length), tagInfo });
    }
  }

  return fields;
}

// Build DescriptorTree from SBE parsed fields
function buildTreeFromSbeFields(parsedFields: Record<string, string>): DescriptorTree {
  const tree: DescriptorTree = {};
  
  for (const [tag, value] of Object.entries(parsedFields)) {
    // Simple scalar fields (no group support yet, but can be added if needed)
    tree[Number(tag)] = String(value);
  }
  
  return tree;
}

// Parse SBE schema to extract field ID to name mapping
function parseSchemaFieldMapping(schemaXml: string): Record<string, { name: string; type: string }> {
  const mapping: Record<string, { name: string; type: string }> = {};
  
  try {
    // Simple regex-based parsing to extract field/data elements
    // Match both <field> and <data> elements
    const fieldRegex = /<(?:sbe:)?(?:field|data)\s+(?:[^>]*?\s+)?name=["']([^"']+)["'](?:[^>]*?\s+)?id=["'](\d+)["'](?:[^>]*?\s+)?type=["']([^"']+)["']/g;
    const fieldRegex2 = /<(?:sbe:)?(?:field|data)\s+(?:[^>]*?\s+)?id=["'](\d+)["'](?:[^>]*?\s+)?name=["']([^"']+)["'](?:[^>]*?\s+)?type=["']([^"']+)["']/g;
    
    let match;
    while ((match = fieldRegex.exec(schemaXml)) !== null) {
      const [, name, id, type] = match;
      mapping[id] = { name, type };
    }
    
    // Reset and try alternate attribute order
    while ((match = fieldRegex2.exec(schemaXml)) !== null) {
      const [, id, name, type] = match;
      mapping[id] = { name, type };
    }
  } catch (e) {
    console.error('Error parsing schema:', e);
  }
  
  return mapping;
}

export async function POST(req: NextRequest) {
  try {
    const { fixRaw, schema } = await req.json();
    
    // Get SBE encoder endpoint from environment
    const sbeEncoderUrl = process.env.SBE_ENCODER_URL || process.env.NEXT_PUBLIC_SBE_ENCODER_URL;
    
    if (!sbeEncoderUrl) {
      throw new Error('SBE_ENCODER_URL environment variable is not configured');
    }
    
    // Call SBE encoder API first (it will parse the FIX message)
    const sbeResponse = await fetch(sbeEncoderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema,
        fixMessage: fixRaw
      })
    });
    
    if (!sbeResponse.ok) {
      const errorText = await sbeResponse.text();
      throw new Error(`SBE encoding failed: ${errorText}`);
    }
    
    const sbeResult = await sbeResponse.json();
    

    console.log(sbeResult);
    // Build tree from SBE parsed fields
    const tree = buildTreeFromSbeFields(sbeResult.parsedFields || {});
    const canonical = buildCanonicalTree(tree);
    
    if (!sbeResult.success) {
      throw new Error(`SBE encoding failed: ${sbeResult.error || 'Unknown error'}`);
    }
    
    const sbeBase64 = sbeResult.encodedBase64;
    const sbeHex = sbeResult.encodedHex.startsWith('0x') ? sbeResult.encodedHex : `0x${sbeResult.encodedHex}`;
    
    const leaves = enumerateLeaves(canonical);
    
    // Build complete Merkle tree structure with all real keccak256 hashes
    const merkleTree = buildMerkleTreeStructure(leaves);
    
    const paths: number[][] = leaves.map((l) => l.path);
    const root = computeRoot(leaves);
    
    // Parse schema to get field metadata
    const schemaFieldMapping = parseSchemaFieldMapping(schema);
    
    // Convert parsed tree to UI-friendly formats with schema field names
    const treeData = descriptorTreeToTreeData(tree, schemaFieldMapping);
    
    // Use SBE encoder's parsed fields for display (includes field names from schema)
    const parsedFieldsFromSbe = sbeResult.parsedFields || {};
    const mappedFieldsFromSbe = sbeResult.mappedFields || {};
    
    // Build field display array with both tag ID and field name from schema
    const parsedFields = Object.entries(parsedFieldsFromSbe).map(([tag, value]) => {
      const fieldMetadata = schemaFieldMapping[tag];
      const fieldName = fieldMetadata ? fieldMetadata.name : `Tag ${tag}`;
      const fieldType = fieldMetadata ? fieldMetadata.type : 'unknown';
      
      return {
        tag,
        value: String(value),
        tagInfo: { 
          name: fieldName, 
          description: `Type: ${fieldType}`
        }
      };
    });
    
    return NextResponse.json({ 
      root, 
      sbeHex, // For deployment (contracts need hex)
      sbeBase64, // For display
      leavesCount: leaves.length, 
      paths,
      merkleTree, // Complete tree structure with all real hashes
      treeData, // Structured tree data for tree view
      parsedFields, // Fields from SBE encoder with schema metadata
      sbeMetadata: {
        mappedFields: mappedFieldsFromSbe,
        encodedBytes: sbeResult.encodedBytes,
        schemaFields: schemaFieldMapping
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error
      ? e.message
      : (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
         ? (e as { message: string }).message
         : 'Preview failed');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
