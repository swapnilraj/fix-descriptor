import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_FIX_SCHEMA,
  parseFixDescriptor,
  buildCanonicalTree,
  encodeCanonicalCBOR,
  enumerateLeaves,
  computeRoot,
  buildMerkleTreeStructure,
  type DescriptorTree,
  type GroupNode
} from 'fixdescriptorkit-typescript';
export const runtime = 'nodejs';
import { LicenseManager } from 'fixparser';

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
function descriptorTreeToTreeData(tree: DescriptorTree): TreeNodeData {
  const root: TreeNodeData = {
    type: 'root',
    name: 'FIX Descriptor',
    children: [],
    isExpanded: true
  };

  const children: TreeNodeData[] = [];

  for (const [tagNum, value] of Object.entries(tree)) {
    const tag = String(tagNum);
    const tagInfo = FIX_TAGS[tag];

    if (typeof value === 'string') {
      // Scalar field
      children.push({
        type: 'scalar',
        tag,
        name: tagInfo?.name || `Tag ${tag}`,
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
          const entryTagInfo = FIX_TAGS[entryTag];
          
          entryChildren.push({
            type: 'scalar',
            tag: entryTag,
            name: entryTagInfo?.name || `Tag ${entryTag}`,
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
        name: tagInfo?.name || `Tag ${tag}`,
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

export async function POST(req: NextRequest) {
  try {
    // Try to set license if provided (best-effort)
    const key = process.env.FIXPARSER_LICENSE_KEY;
    if (key) {
      try { await LicenseManager.setLicenseKey(key); } catch {}
    }

    const { fixRaw } = await req.json();
    const tree = parseFixDescriptor(fixRaw, { schema: DEMO_FIX_SCHEMA, allowSOH: true });
    const canonical = buildCanonicalTree(tree);
    const cbor = encodeCanonicalCBOR(canonical);
    const leaves = enumerateLeaves(canonical);
    
    // Build complete Merkle tree structure with all real keccak256 hashes
    const merkleTree = buildMerkleTreeStructure(leaves);
    
    const paths: number[][] = leaves.map((l) => l.path);
    const root = computeRoot(leaves);
    const cborHex = '0x' + Buffer.from(cbor).toString('hex');
    
    // Convert parsed tree to UI-friendly formats
    const treeData = descriptorTreeToTreeData(tree);
    const parsedFields = descriptorTreeToFields(tree);
    
    return NextResponse.json({ 
      root, 
      cborHex, 
      leavesCount: leaves.length, 
      paths,
      merkleTree, // Complete tree structure with all real hashes
      treeData, // Structured tree data for tree view
      parsedFields // Flat list of fields for display
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
