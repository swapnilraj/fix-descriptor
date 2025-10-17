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
 */
export async function verifyContract(
  params: VerifyContractParams,
  apiKey: string
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
  return data as VerificationResponse;
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
  maxAttempts: number = 10,
  delayMs: number = 3000
): Promise<VerificationStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkVerificationStatus(guid, chainId, apiKey);

    // Check if verification is complete (success or failure)
    if (status.status === '1') {
      // Success
      return status;
    } else if (status.status === '0' && status.result !== 'Pending in queue') {
      // Failed
      return status;
    }

    // Still pending, wait before next attempt
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Timeout
  return {
    status: '0',
    message: 'NOTOK',
    result: 'Verification timeout - please check Etherscan manually',
  };
}

