import { NextRequest, NextResponse } from 'next/server';
import { decodeCanonicalCBOR, treeToFixMessage, applyTagNames } from 'fixdescriptorkit-typescript';

export async function POST(request: NextRequest) {
  try {
    const { cborHex } = await request.json();

    if (!cborHex || typeof cborHex !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: cborHex is required' },
        { status: 400 }
      );
    }

    // Convert hex to Uint8Array
    const hexString = cborHex.startsWith('0x') ? cborHex.slice(2) : cborHex;
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Decode CBOR to tree structure
    const tree = decodeCanonicalCBOR(bytes);

    // Convert tree to FIX format with numeric tags
    const fixMessage = treeToFixMessage(tree);
    
    // Convert tree to FIX format with human-readable tag names
    const fixMessageNamed = applyTagNames(tree);

    return NextResponse.json({
      success: true,
      fixMessage,         // numeric tags: "55=AAPL|48=US..."
      fixMessageNamed,    // named tags: "Symbol=AAPL|SecurityID=US..."
      tree
    });
  } catch (error) {
    console.error('Failed to decode CBOR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to decode CBOR: ${errorMessage}` },
      { status: 500 }
    );
  }
}
