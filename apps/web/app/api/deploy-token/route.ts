import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, decodeEventLog, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { abi as TokenFactoryAbi } from '@/lib/abis/AssetTokenFactory';

/**
 * POST /api/deploy-token
 *
 * Deploys a token with descriptor from the backend using AssetTokenFactory
 * No wallet connection required - backend absorbs gas costs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      symbol,
      initialSupply,
      cborHex,
      root
    } = body;

    // Validate inputs
    if (!name || !symbol || !initialSupply) {
      return NextResponse.json(
        { error: 'Missing required token parameters (name, symbol, initialSupply)' },
        { status: 400 }
      );
    }

    if (!cborHex || !root) {
      return NextResponse.json(
        { error: 'Missing descriptor data (cborHex, root)' },
        { status: 400 }
      );
    }

    // Get environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    const factoryAddress = process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS;
    const dictionaryAddress = process.env.NEXT_PUBLIC_DICTIONARY_ADDRESS;

    if (!privateKey) {
      return NextResponse.json(
        { error: 'Backend wallet not configured (PRIVATE_KEY missing)' },
        { status: 500 }
      );
    }

    if (!rpcUrl) {
      return NextResponse.json(
        { error: 'RPC URL not configured (NEXT_PUBLIC_RPC_URL missing)' },
        { status: 500 }
      );
    }

    if (!factoryAddress) {
      return NextResponse.json(
        { error: 'Token factory not configured (NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS missing)' },
        { status: 500 }
      );
    }

    // Create wallet from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // Create wallet client for signing transactions
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(rpcUrl)
    });

    // Create public client for reading blockchain state
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl)
    });

    // Dictionary hash for DEMO_FIX_SCHEMA
    const dictHash = '0xb24215c985384ddaa6767272d452780aa4352201a1df669564cde3905cb6a215' as `0x${string}`;

    // Prepare descriptor
    const descriptor = {
      fixMajor: 4,
      fixMinor: 4,
      dictHash: dictHash,
      fixRoot: root as `0x${string}`,
      fixCBORPtr: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      fixCBORLen: 0,
      fixURI: '',
      dictionaryContract: (dictionaryAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`
    };

    // Convert supply to wei (18 decimals)
    const supplyInWei = BigInt(initialSupply) * BigInt(10 ** 18);

    // Ensure CBOR hex has 0x prefix
    const cborHexData = cborHex.startsWith('0x')
      ? cborHex as `0x${string}`
      : `0x${cborHex}` as `0x${string}`;

    console.log('Deploying token with parameters:', {
      name,
      symbol,
      supply: supplyInWei.toString(),
      cborLength: cborHexData.length,
      root,
      factoryAddress
    });

    // Deploy the token
    const hash = await walletClient.writeContract({
      address: factoryAddress as `0x${string}`,
      abi: TokenFactoryAbi,
      functionName: 'deployWithDescriptor',
      args: [
        name,
        symbol,
        supplyInWei,
        cborHexData,
        descriptor
      ]
    });

    console.log('Transaction submitted:', hash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log('Transaction confirmed:', {
      hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status
    });

    // Decode the AssetTokenDeployed event to get token address
    let tokenAddress: string | null = null;

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: TokenFactoryAbi,
          data: log.data,
          topics: log.topics
        });

        if (decoded.eventName === 'AssetTokenDeployed') {
          const args = decoded.args as { tokenAddress?: Address; deployer?: Address; name?: string; symbol?: string; initialSupply?: bigint };
          if (args.tokenAddress) {
            tokenAddress = args.tokenAddress;
            console.log('Token deployed successfully:', {
              tokenAddress: args.tokenAddress,
              deployer: args.deployer,
              name: args.name,
              symbol: args.symbol,
              initialSupply: args.initialSupply?.toString()
            });
            break;
          }
        }
      } catch {
        // Skip logs that don't match our ABI
        continue;
      }
    }

    if (!tokenAddress) {
      console.warn('Could not decode token address from events, check transaction manually');
      tokenAddress = 'Check transaction';
    }

    // Return success response
    return NextResponse.json({
      success: true,
      transactionHash: hash,
      tokenAddress: tokenAddress,
      blockNumber: receipt.blockNumber.toString(),
      status: receipt.status
    });

  } catch (error) {
    console.error('Error deploying token:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deploy-token
 *
 * Returns deployment information
 */
export async function GET() {
  return NextResponse.json({
    factoryAddress: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS || null,
    dataFactoryAddress: process.env.NEXT_PUBLIC_DATA_FACTORY_ADDRESS || null,
    dictionaryAddress: process.env.NEXT_PUBLIC_DICTIONARY_ADDRESS || null,
    instructions: {
      step1: 'Generate FIX descriptor using /api/preview',
      step2: 'Deploy token using POST /api/deploy-token with { name, symbol, initialSupply, cborHex, root }',
      step3: 'Backend handles wallet signing and gas fees automatically',
      step4: 'Receive tokenAddress and transactionHash in response'
    },
    gaslessDeployment: true,
    note: 'No wallet connection required - backend absorbs all gas costs'
  });
}
