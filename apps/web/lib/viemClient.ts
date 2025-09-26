import { createPublicClient, http, Chain } from 'viem';

export const chainFromEnv: Chain = {
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 560048), // Default to Hoodi testnet
  name: process.env.NEXT_PUBLIC_CHAIN_ID ? 'Configured' : 'Hoodi Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-hoodi-rpc.publicnode.com'] },
    public: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-hoodi-rpc.publicnode.com'] },
  },
};

export const publicClient = createPublicClient({ chain: chainFromEnv, transport: http(chainFromEnv.rpcUrls.default.http[0]) });
