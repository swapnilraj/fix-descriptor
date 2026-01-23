/**
 * Etherscan API Client
 * Handles contract verification on Etherscan and compatible block explorers
 */

export interface VerifyContractParams {
  contractAddress: string;
  sourceCode: string;
  contractName: string;
  compilerVersion: string;
  optimizationUsed: boolean;
  runs: number;
  constructorArguments: string;
  chainId: number;
  evmVersion?: string;
  viaIR?: boolean;
  codeFormat?: string; // 'solidity-single-file' or 'solidity-standard-json-input'
}

export interface VerificationResponse {
  status: string;
  message: string;
  result: string;
}

export interface VerificationStatusResponse {
  status: string;
  message: string;
  result: string;
}

/**
 * Get the Etherscan API V2 URL for a given chain ID
 * Uses the unified V2 endpoint with chainid parameter
 * @see https://docs.etherscan.io/v2-migration
 */
export function getEtherscanApiUrl(chainId: number): string {
  // V2 API uses a unified endpoint with chainid parameter
  return `https://api.etherscan.io/v2/api?chainid=${chainId}`;
}

/**
 * Submit a contract for verification on Etherscan
 * Includes retry logic for "unable to locate contract code" errors
 */
export async function verifyContract(
  params: VerifyContractParams,
  apiKey: string,
  maxRetries: number = 5,
  retryDelayMs: number = 5000
): Promise<VerificationResponse> {
  const apiUrl = getEtherscanApiUrl(params.chainId);

  const formData = new URLSearchParams({
    apikey: apiKey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: params.contractAddress,
    sourceCode: params.sourceCode,
    codeformat: params.codeFormat || 'solidity-single-file',
    contractname: params.contractName,
    compilerversion: params.compilerVersion,
    optimizationUsed: params.optimizationUsed ? '1' : '0',
    runs: params.runs.toString(),
    constructorArguements: params.constructorArguments, // Note: Etherscan API typo
    // V2 API additions
    licenseType: '3', // MIT License (3 is MIT on Etherscan)
  });

  // Add optional parameters
  if (params.evmVersion) {
    formData.append('evmversion', params.evmVersion);
  }
  
  // Add viaIR if specified
  if (params.viaIR) {
    formData.append('viaIR', '1');
  }

  // Retry logic for "unable to locate contract code" errors
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`Etherscan API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if we got the "unable to locate contract code" error
      if (data.status === '0' && 
          data.result && 
          typeof data.result === 'string' &&
          data.result.toLowerCase().includes('unable to locate contract code')) {
        
        // If this is not the last attempt, wait and retry
        if (attempt < maxRetries - 1) {
          console.log(`Contract code not indexed yet (attempt ${attempt + 1}/${maxRetries}), retrying in ${retryDelayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }
        
        // Last attempt failed, return the error
        return data as VerificationResponse;
      }
      
      // Success or other error - return immediately
      return data as VerificationResponse;
      
    } catch (error) {
      // Network or other error - if not last attempt, retry
      if (attempt < maxRetries - 1) {
        console.log(`Verification request failed (attempt ${attempt + 1}/${maxRetries}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Verification failed after all retries');
}

/**
 * Check the verification status of a contract
 */
export async function checkVerificationStatus(
  guid: string,
  chainId: number,
  apiKey: string
): Promise<VerificationStatusResponse> {
  const apiUrl = getEtherscanApiUrl(chainId);

  const params = new URLSearchParams({
    apikey: apiKey,
    module: 'contract',
    action: 'checkverifystatus',
    guid: guid,
  });

  // apiUrl already contains chainid, append other params with &
  const response = await fetch(`${apiUrl}&${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Etherscan API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data as VerificationStatusResponse;
}

/**
 * Poll verification status until complete or timeout
 */
export async function pollVerificationStatus(
  guid: string,
  chainId: number,
  apiKey: string,
  maxAttempts: number = 15,
  delayMs: number = 5000
): Promise<VerificationStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Checking verification status (attempt ${attempt + 1}/${maxAttempts})...`);
    
    const status = await checkVerificationStatus(guid, chainId, apiKey);
    
    console.log(`Status response:`, status);

    // Check if verification is complete (success or failure)
    if (status.status === '1') {
      // Success
      console.log('✅ Verification successful!');
      return status;
    } else if (status.status === '0' && status.result !== 'Pending in queue') {
      // Check if already verified - treat as success
      if (status.result && typeof status.result === 'string' && 
          status.result.toLowerCase().includes('already verified')) {
        console.log('✅ Contract already verified!');
        return {
          status: '1',
          message: 'OK',
          result: 'Contract is already verified'
        };
      }
      // Failed (but not just pending)
      console.log('❌ Verification failed:', status.result);
      return status;
    }

    // Still pending, wait before next attempt
    if (attempt < maxAttempts - 1) {
      console.log(`Still pending, waiting ${delayMs}ms before next check...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Timeout
  console.log('⏱️ Verification polling timeout');
  return {
    status: '0',
    message: 'NOTOK',
    result: 'Verification timeout - please check Etherscan manually',
  };
}

