import { createPublicClient, http, Chain, type Address } from 'viem';

export const chainFromEnv: Chain = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111), // Default to Sepolia testnet
  name: process.env.NEXT_PUBLIC_CHAIN_ID ? 'Configured' : 'Sepolia Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'] },
    public: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'] },
  },
};

export const publicClient = createPublicClient({ chain: chainFromEnv, transport: http(chainFromEnv.rpcUrls.default.http[0]) });

/**
 * Get the FIX Dictionary contract address from environment
 * @throws Error if NEXT_PUBLIC_DICTIONARY_ADDRESS is not set
 */
export function getDictionaryAddress(): Address {
  const address = process.env.NEXT_PUBLIC_DICTIONARY_ADDRESS;
  if (!address) {
    throw new Error(
      'NEXT_PUBLIC_DICTIONARY_ADDRESS environment variable is not set. ' +
      'Please deploy a FixDictionary contract and set the address in your .env.local file.'
    );
  }
  return address as Address;
}

/**
 * Get the dictionary address if available, or return null
 * Useful for optional dictionary features
 */
export function getDictionaryAddressOptional(): Address | null {
  const address = process.env.NEXT_PUBLIC_DICTIONARY_ADDRESS;
  return address ? (address as Address) : null;
}
