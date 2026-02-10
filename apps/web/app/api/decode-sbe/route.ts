import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/decode-sbe
 * 
 * Decodes SBE-encoded message back to FIX format
 */
export async function POST(req: NextRequest) {
  try {
    const { encodedMessage, schema, messageId } = await req.json();
    
    if (!encodedMessage || !schema) {
      return NextResponse.json(
        { error: 'Missing encodedMessage or schema' },
        { status: 400 }
      );
    }

    // Get SBE encoder endpoint from environment
    const encoderBaseUrl = process.env.ENCODER_URL;
    
    if (!encoderBaseUrl) {
      return NextResponse.json(
        { error: 'ENCODER_URL environment variable is not configured' },
        { status: 500 }
      );
    }
    const encoderUrl = `${encoderBaseUrl.replace(/\/$/, '')}/decode`;

    // Log schema info for debugging
    console.log('Decoding with schema length:', schema.length, 'chars');
    console.log('Schema preview (first 500 chars):', schema.substring(0, 500));
    console.log('Encoded message:', encodedMessage.substring(0, 100));
    
    // Count how many message definitions are in the schema
    const messageCount = (schema.match(/<sbe:message/g) || []).length;
    console.log('Schema contains', messageCount, 'message definitions');

    // Call encoder service to decode SBE
    const encoderResponse = await fetch(encoderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encodedMessage,
        schema,
        messageId: messageId || undefined
      })
    });

    if (!encoderResponse.ok) {
      const errorText = await encoderResponse.text();
      return NextResponse.json(
        { error: `Encoder decode failed: ${errorText}` },
        { status: 500 }
      );
    }

    const result = await encoderResponse.json();
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

