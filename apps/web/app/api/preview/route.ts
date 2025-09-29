import { NextRequest, NextResponse } from 'next/server';
import { 
  DEMO_FIX_SCHEMA, 
  parseFixDescriptor, 
  buildCanonicalTree, 
  encodeCanonicalCBOR, 
  enumerateLeaves, 
  computeRoot,
  buildMerkleTreeStructure
} from 'fixdescriptorkit-typescript';
export const runtime = 'nodejs';
import { LicenseManager } from 'fixparser';

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
    
    return NextResponse.json({ 
      root, 
      cborHex, 
      leavesCount: leaves.length, 
      paths,
      merkleTree // Return complete tree structure with all real hashes
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
