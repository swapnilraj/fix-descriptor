import { NextRequest, NextResponse } from 'next/server';
import { buildCanonicalTree, enumerateLeaves, generateProof, type DescriptorTree } from 'fixdescriptorkit-typescript';
export const runtime = 'nodejs';

// Build DescriptorTree from SBE parsed fields (same as preview API)
function buildTreeFromSbeFields(parsedFields: Record<string, unknown>): DescriptorTree {
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
    const encoderBaseUrl = process.env.ENCODER_URL;
    
    if (!encoderBaseUrl) {
      throw new Error('ENCODER_URL environment variable is not configured');
    }
    const encoderBase = encoderBaseUrl.replace(/\/$/, '');
    const encodeUrl = `${encoderBase}/encode`;
    const decodeUrl = `${encoderBase}/decode`;
    
    // Call encoder service to encode the FIX message
    const encodeResponse = await fetch(encodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema,
        fixMessage: fixRaw,
        messageId: messageId || undefined
      })
    });
    
    if (!encodeResponse.ok) {
      const errorText = await encodeResponse.text();
      throw new Error(`SBE encoding failed: ${errorText}`);
    }
    
    const encodeResult = await encodeResponse.json();
    const encodedHex = encodeResult.encodedHex;
    if (!encodedHex) {
      throw new Error('SBE encoding failed: missing encodedHex');
    }

    // Decode to get parsed fields for proof generation
    const decodeResponse = await fetch(decodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema,
        encodedMessage: encodedHex,
        messageId: messageId || undefined
      })
    });
    if (!decodeResponse.ok) {
      const errorText = await decodeResponse.text();
      throw new Error(`SBE decoding failed: ${errorText}`);
    }
    const decodeResult = await decodeResponse.json();
    
    // Build tree from SBE parsed fields (same as preview)
    const tree = buildTreeFromSbeFields(decodeResult.decodedFields || {});
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
