import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/decode-sbe
 * 
 * Decodes SBE-encoded message back to FIX format
 */
export async function POST(req: NextRequest) {
  try {
    const { encodedMessage, schema } = await req.json();
    
    if (!encodedMessage || !schema) {
      return NextResponse.json(
        { error: 'Missing encodedMessage or schema' },
        { status: 400 }
      );
    }

    // Get SBE encoder endpoint from environment
    const sbeEncoderUrl = process.env.SBE_ENCODER_URL || process.env.NEXT_PUBLIC_SBE_ENCODER_URL;
    
    if (!sbeEncoderUrl) {
      return NextResponse.json(
        { error: 'SBE_ENCODER_URL environment variable is not configured' },
        { status: 500 }
      );
    }

    // Log schema info for debugging
    console.log('Decoding with schema length:', schema.length, 'chars');
    console.log('Schema preview (first 500 chars):', schema.substring(0, 500));
    console.log('Encoded message:', encodedMessage.substring(0, 100));
    
    // Count how many message definitions are in the schema
    const messageCount = (schema.match(/<sbe:message/g) || []).length;
    console.log('Schema contains', messageCount, 'message definitions');

    // Call Lambda to decode SBE
    const lambdaResponse = await fetch(sbeEncoderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encodedMessage,
        schema,
        mode: 'decode'
      })
    });

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text();
      return NextResponse.json(
        { error: `Lambda decode failed: ${errorText}` },
        { status: 500 }
      );
    }

    const result = await lambdaResponse.json();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Decoding failed' },
        { status: 400 }
      );
    }
    console.log('Decoded SBE:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error decoding SBE:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

