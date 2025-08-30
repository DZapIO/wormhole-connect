import type { Chain } from '@wormhole-foundation/sdk';

/**
 * Maps Wormhole Chain names to their corresponding chain IDs
 * This mapping is used for converting Chain enum values to numeric chain IDs
 * required by various APIs and SDKs
 */
export const chainToChainId: Partial<Record<Chain, number>> = {
  // EVM Chains
  Ethereum: 1,
  Bsc: 56,
  Polygon: 137,
  Avalanche: 43114,
  Fantom: 250,
  Arbitrum: 42161,
  Optimism: 10,
  Base: 8453,
  Celo: 42220,
  Moonbeam: 1284,
  Klaytn: 8217,
  Scroll: 534352,
  Mantle: 5000,
  Linea: 59144,
  Berachain: 118,
  Seievm: 119,
  Xlayer: 117,

  // Non-EVM Chains
  Solana: 101,
  Sui: 102,
  Aptos: 103,
  Osmosis: 104,
  Cosmoshub: 105,
  Evmos: 106,
  Kujira: 107,
  Injective: 108,
  Near: 114,
  Wormchain: 115,
  Sei: 116,
  Neutron: 123,
  Celestia: 124,
  Stargaze: 125,
  Seda: 126,
  Dymension: 127,

  // Legacy/Other Chains
  Btc: 112,
  Algorand: 113,
};

/**
 * Maps chain ID numbers back to Chain names
 */
export const zapChainIdToChain: Record<number, Chain> = Object.fromEntries(
  Object.entries(chainToChainId)
    .filter(([_, id]) => id !== undefined)
    .map(([chain, id]) => [id!, chain as Chain]),
);

/**
 * Converts a Chain enum value to its corresponding chain ID
 * @param chain - The Chain enum value
 * @returns The numeric chain ID, or undefined if not found
 */
export function getChainId(chain: Chain): number | undefined {
  return chainToChainId[chain];
}

/**
 * Converts a chain ID number to its corresponding Chain enum value
 * @param chainId - The numeric chain ID
 * @returns The Chain enum value, or undefined if not found
 */
export function getChainFromId(chainId: number): Chain | undefined {
  return zapChainIdToChain[chainId];
}

/**
 * Checks if a chain ID is valid
 * @param chainId - The numeric chain ID to validate
 * @returns True if the chain ID exists in our mapping
 */
export function isValidChainId(chainId: number): boolean {
  return chainId in zapChainIdToChain;
}

/**
 * Gets all available chain IDs as an array
 * @returns Array of all available chain IDs
 */
export function getAllChainIds(): number[] {
  return Object.values(chainToChainId);
}

/**
 * Gets all available chains as an array
 * @returns Array of all available Chain enum values
 */
export function getAllChains(): Chain[] {
  return Object.keys(chainToChainId) as Chain[];
}
