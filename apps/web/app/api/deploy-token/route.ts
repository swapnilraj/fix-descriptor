import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/deploy-token
 * 
 * Prepares deployment parameters for AssetTokenFactory.deployWithDescriptor()
 * This endpoint doesn't deploy directly - it returns the prepared data for the web app to sign and send
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      symbol,
      initialSupply,
      cborHex,
      descriptor
    } = body;

    // Validate inputs
    if (!name || !symbol || !initialSupply) {
      return NextResponse.json(
        { error: 'Missing required token parameters' },
        { status: 400 }
      );
    }

    if (!cborHex || !descriptor) {
      return NextResponse.json(
        { error: 'Missing descriptor data' },
        { status: 400 }
      );
    }

    // Validate descriptor structure
    if (!descriptor.fixMajor || !descriptor.fixMinor || !descriptor.dictHash || !descriptor.fixRoot) {
      return NextResponse.json(
        { error: 'Invalid descriptor structure' },
        { status: 400 }
      );
    }

    // Convert initialSupply to BigInt string (web app will parse it)
    const supply = BigInt(initialSupply).toString();

    // Return the prepared data
    return NextResponse.json({
      success: true,
      params: {
        name,
        symbol,
        initialSupply: supply,
        cborData: cborHex,
        descriptor: {
          fixMajor: descriptor.fixMajor,
          fixMinor: descriptor.fixMinor,
          dictHash: descriptor.dictHash,
          fixRoot: descriptor.fixRoot,
          fixCBORPtr: '0x0000000000000000000000000000000000000000', // Will be set by factory
          fixCBORLen: 0, // Will be set by factory
          fixURI: descriptor.fixURI || ''
        }
      }
    });
  } catch (error) {
    console.error('Error preparing deployment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deploy-token
 * 
 * Returns factory deployment information
 */
export async function GET() {
  return NextResponse.json({
    factoryAddress: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS || null,
    dataFactoryAddress: process.env.NEXT_PUBLIC_DATA_FACTORY_ADDRESS || null,
    instructions: {
      step1: 'Generate FIX descriptor using /api/preview',
      step2: 'Prepare deployment parameters using POST /api/deploy-token',
      step3: 'Sign and send transaction using the returned parameters',
      step4: 'Factory will deploy CBOR, deploy token, and set descriptor in one transaction'
    }
  });
}
