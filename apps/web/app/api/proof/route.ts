import { NextRequest, NextResponse } from 'next/server';
import { buildCanonicalTree, enumerateLeaves, generateProof, type DescriptorTree } from 'fixdescriptorkit-typescript';
export const runtime = 'nodejs';

// Build DescriptorTree from SBE parsed fields (same as preview API)
function buildTreeFromSbeFields(parsedFields: Record<string, string>): DescriptorTree {
  const tree: DescriptorTree = {};
  
  for (const [tag, value] of Object.entries(parsedFields)) {
    // Simple scalar fields (no group support yet, but can be added if needed)
    tree[Number(tag)] = String(value);
  }
  
  return tree;
}

export async function POST(req: NextRequest) {
  try {
    const { fixRaw, path, schema, messageId } = await req.json();
    
    // Get SBE encoder endpoint from environment
    const sbeEncoderUrl = process.env.SBE_ENCODER_URL || process.env.NEXT_PUBLIC_SBE_ENCODER_URL;
    
    if (!sbeEncoderUrl) {
      throw new Error('SBE_ENCODER_URL environment variable is not configured');
    }
    
    // Call SBE encoder API to parse the FIX message (same as preview)
    const sbeResponse = await fetch(sbeEncoderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema,
        fixMessage: fixRaw,
        messageId: messageId || undefined
      })
    });
    
    if (!sbeResponse.ok) {
      const errorText = await sbeResponse.text();
      throw new Error(`SBE encoding failed: ${errorText}`);
    }
    
    const sbeResult = await sbeResponse.json();
    
    if (!sbeResult.success) {
      throw new Error(`SBE encoding failed: ${sbeResult.error || 'Unknown error'}`);
    }
    
    // Build tree from SBE parsed fields (same as preview)
    const tree = buildTreeFromSbeFields(sbeResult.parsedFields || {});
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
