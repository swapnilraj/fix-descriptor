import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cborHex, schema } = await request.json();

    if (!cborHex || typeof cborHex !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: cborHex (encoded hex) is required' },
        { status: 400 }
      );
    }

    if (!schema) {
      return NextResponse.json(
        { error: 'Invalid request: schema is required for SBE decoding' },
        { status: 400 }
      );
    }

    // Get SBE encoder endpoint from environment
    const sbeEncoderUrl = process.env.SBE_ENCODER_URL || process.env.NEXT_PUBLIC_SBE_ENCODER_URL;
    
    if (!sbeEncoderUrl) {
      throw new Error('SBE_ENCODER_URL environment variable is not configured');
    }

    // Call SBE decoder API
    const hexString = cborHex.startsWith('0x') ? cborHex.slice(2) : cborHex;
    
    const sbeResponse = await fetch(sbeEncoderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema,
        encodedMessage: hexString
      })
    });

    if (!sbeResponse.ok) {
      const errorText = await sbeResponse.text();
      throw new Error(`SBE decoding failed: ${errorText}`);
    }

    const sbeResult = await sbeResponse.json();

    if (!sbeResult.success) {
      throw new Error(`SBE decoding failed: ${sbeResult.error || 'Unknown error'}`);
    }

    // Build FIX message from decoded fields
    const decodedFields = sbeResult.decodedFields || {};
    const fixMessage = Object.entries(decodedFields)
      .map(([tag, value]) => `${tag}=${value}`)
      .join('|');

    return NextResponse.json({
      success: true,
      fixMessage,
      decodedFields: sbeResult.decodedFields,
      decodedMessage: sbeResult.decodedMessage
    });
  } catch (error) {
    console.error('Failed to decode:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to decode: ${errorMessage}` },
      { status: 500 }
    );
  }
}
