import type { Chain } from '@wormhole-foundation/sdk';

/**
 * Maps Wormhole Chain names to their corresponding chain IDs
 * This mapping is used for converting Chain enum values to numeric chain IDs
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

export const zapChainIdToChain: Record<number, Chain> = Object.fromEntries(
  Object.entries(chainToChainId)
    .filter(([_, id]) => id !== undefined)
    .map(([chain, id]) => [id!, chain as Chain]),
);

export function getChainId(chain: Chain): number | undefined {
  return chainToChainId[chain];
}

export function getChainFromId(chainId: number): Chain | undefined {
  return zapChainIdToChain[chainId];
}
