import { NextRequest, NextResponse } from 'next/server';
import { DEMO_FIX_SCHEMA, parseFixDescriptor, buildCanonicalTree, enumerateLeaves, generateProof } from 'fixdescriptorkit-typescript';
export const runtime = 'nodejs';
import { LicenseManager } from 'fixparser';

export async function POST(req: NextRequest) {
  try {
    const key = process.env.FIXPARSER_LICENSE_KEY;
    if (key) { try { await LicenseManager.setLicenseKey(key); } catch {} }
    const { fixRaw, path } = await req.json();
    const tree = parseFixDescriptor(fixRaw, { schema: DEMO_FIX_SCHEMA, allowSOH: true });
    const canonical = buildCanonicalTree(tree);
    const leaves = enumerateLeaves(canonical);
    const { pathCBOR, valueBytes, proof, directions } = generateProof(leaves, path);
    const pathCBORHex = '0x' + Buffer.from(pathCBOR).toString('hex');
    const valueHex = '0x' + Buffer.from(valueBytes).toString('hex');
    return NextResponse.json({ pathCBORHex, valueHex, proof, directions });
  } catch (e: unknown) {
    const msg = e instanceof Error
      ? e.message
      : (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
         ? (e as { message: string }).message
         : 'Proof failed');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
