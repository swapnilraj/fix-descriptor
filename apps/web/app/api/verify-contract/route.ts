import { NextRequest, NextResponse } from 'next/server';
import { encodeAbiParameters } from 'viem';
import { verifyContract, pollVerificationStatus } from '@/lib/etherscan';
import {
  ASSET_TOKEN_ERC20_STANDARD_JSON,
  ASSET_TOKEN_CONTRACT_NAME,
  COMPILER_VERSION,
  OPTIMIZATION_ENABLED,
  OPTIMIZATION_RUNS,
} from '@/lib/contractSources';

/**
 * POST /api/verify-contract
 * 
 * Verifies a deployed AssetTokenERC20 contract on Etherscan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      contractAddress,
      tokenName,
      tokenSymbol,
      initialSupply,
      initialOwner,
      chainId,
    } = body;

    // Validate inputs
    if (!contractAddress || !tokenName || !tokenSymbol || !initialSupply || !initialOwner || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Etherscan API key not configured',
          message: 'Please set NEXT_PUBLIC_ETHERSCAN_API_KEY in your environment'
        },
        { status: 500 }
      );
    }

    // Encode constructor arguments
    // AssetTokenERC20 constructor: (string name, string symbol, uint256 initialSupply, address initialOwner)
    const constructorArgs = encodeAbiParameters(
      [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'symbol' },
        { type: 'uint256', name: 'initialSupply' },
        { type: 'address', name: 'initialOwner' },
      ],
      [tokenName, tokenSymbol, BigInt(initialSupply), initialOwner as `0x${string}`]
    );

    // Remove '0x' prefix for Etherscan API
    const constructorArgsHex = constructorArgs.slice(2);

    // Get the standard JSON input
    const standardJsonInput = ASSET_TOKEN_ERC20_STANDARD_JSON;
    
    // Format as JSON string for Etherscan API
    const sourceCode = JSON.stringify(standardJsonInput);

    console.log('Submitting contract for verification:', {
      contractAddress,
      chainId,
      compilerVersion: COMPILER_VERSION,
      constructorArgsLength: constructorArgsHex.length,
      sourceFormat: 'JSON',
    });

    // Submit verification request using standard JSON format
    const verificationResponse = await verifyContract(
      {
        contractAddress,
        sourceCode,
        contractName: ASSET_TOKEN_CONTRACT_NAME,
        compilerVersion: COMPILER_VERSION,
        optimizationUsed: OPTIMIZATION_ENABLED,
        runs: OPTIMIZATION_RUNS,
        constructorArguments: constructorArgsHex,
        chainId: Number(chainId),
        viaIR: true, // Foundry uses via-ir
        codeFormat: 'solidity-standard-json-input', // Use standard JSON format
      },
      apiKey,
      1, // Only 1 attempt in backend - frontend will handle retries
      0  // No delay in backend
    );

    console.log('Verification response:', verificationResponse);

    // Check if submission was successful
    if (verificationResponse.status !== '1') {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification submission failed',
          message: verificationResponse.result || verificationResponse.message,
          canRetry: verificationResponse.result && 
                    typeof verificationResponse.result === 'string' &&
                    verificationResponse.result.toLowerCase().includes('unable to locate'),
        },
        { status: 400 }
      );
    }

    const guid = verificationResponse.result;

    // Poll for verification status with reduced attempts (frontend will retry if needed)
    console.log('Polling verification status for GUID:', guid);
    const statusResponse = await pollVerificationStatus(guid, Number(chainId), apiKey, 10, 3000);

    console.log('Final verification status:', statusResponse);

    if (statusResponse.status === '1') {
      return NextResponse.json({
        success: true,
        message: 'Contract verified successfully',
        guid,
        result: statusResponse.result,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Verification failed or timed out',
        guid,
        result: statusResponse.result,
        error: statusResponse.message,
      });
    }
  } catch (error) {
    console.error('Error verifying contract:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

