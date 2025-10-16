/**
 * Block Explorer Utilities
 * Provides functions to generate block explorer URLs for different networks
 */

export type SupportedChainId = 1 | 11155111; // Mainnet, Sepolia

/**
 * Get the base block explorer URL for a given chain ID
 */
export function getBlockExplorerUrl(chainId: number): string {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return 'https://etherscan.io';
    case 11155111: // Sepolia Testnet
      return 'https://sepolia.etherscan.io';
    default:
      // Fallback to Sepolia for unknown chains
      return 'https://sepolia.etherscan.io';
  }
}

/**
 * Get the block explorer URL for a transaction
 */
export function getTransactionUrl(chainId: number, txHash: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get the block explorer URL for an address
 */
export function getAddressUrl(chainId: number, address: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return `${baseUrl}/address/${address}`;
}

/**
 * Shorten an Ethereum address for display
 * @param address - The full address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 */
export function shortenAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Shorten a transaction hash for display
 * @param hash - The full transaction hash
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 */
export function shortenHash(
  hash: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!hash || hash.length < startChars + endChars) {
    return hash;
  }
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

