import type { Chain } from '@wormhole-foundation/sdk';
import type { ChainConfig } from 'config';
import config from 'config';
import type { ZapPoolData, ZapPositionData } from 'zap/sdk';

export function getZapChainConfigs(
  supportedChains: Array<Chain>,
  chainToOmit?: Chain | undefined,
) {
  return config.chainsArr.filter((chain) => {
    if (!supportedChains.includes(chain.sdkName)) {
      return false;
    }
    const isChainOmitted = chainToOmit === chain.sdkName;
    return !isChainOmitted;
  });
}

export const getDefaultProvider = (
  chainConfig?: ChainConfig,
  prevProvider?: string | undefined,
) => {
  const chain = chainConfig ? chainConfig.sdkName : undefined;
  const protocols = Object.values(config.protocols);
  const supportedProviders = chain
    ? protocols.filter((protocol) => protocol.supportedChains.includes(chain))
    : undefined;

  if (
    prevProvider &&
    supportedProviders?.some((protocol) => protocol.id === prevProvider)
  ) {
    return prevProvider;
  }
  return supportedProviders?.[0]?.id || undefined;
};

/**
 * Sort pools by TVL (descending)
 */
export function sortPoolsByTVL(pools: ZapPoolData[]): ZapPoolData[] {
  return pools.sort((a, b) => {
    const tvlA = a.tvl || 0;
    const tvlB = b.tvl || 0;
    return tvlB - tvlA;
  });
}

/**
 * Sort pools by APR (descending)
 */
export function sortPoolsByAPR(pools: ZapPoolData[]): ZapPoolData[] {
  return pools.sort((a, b) => {
    const aprA = a.apr || 0;
    const aprB = b.apr || 0;
    return aprB - aprA;
  });
}

/**
 * Sort positions by USD value (descending)
 */
export function sortPositionsByUSDValue(
  positions: ZapPositionData[],
): ZapPositionData[] {
  return positions.sort((a, b) => {
    const valueA = a.amountUSD || 0;
    const valueB = b.amountUSD || 0;
    return valueB - valueA;
  });
}

/**
 * Search pools by name or symbol
 */
export function searchPools(
  pools: ZapPoolData[],
  query: string,
): ZapPoolData[] {
  const lowercaseQuery = query.toLowerCase();
  return pools.filter(
    (pool) =>
      pool.name.toLowerCase().includes(lowercaseQuery) ||
      pool.symbol.toLowerCase().includes(lowercaseQuery) ||
      pool.address.toLowerCase().includes(lowercaseQuery),
  );
}

/**
 * Search positions by name or symbol
 */
export function searchPositions(
  positions: ZapPositionData[],
  query: string,
): ZapPositionData[] {
  const lowercaseQuery = query.toLowerCase();
  return positions.filter(
    (position) =>
      position.name.toLowerCase().includes(lowercaseQuery) ||
      position.symbol.toLowerCase().includes(lowercaseQuery) ||
      position.address.toLowerCase().includes(lowercaseQuery),
  );
}

/**
 * Get unique providers from pools
 */
export function getUniqueProvidersFromPools(pools: ZapPoolData[]): string[] {
  const providers = new Set<string>();
  pools.forEach((pool) => providers.add(pool.protocol));
  return Array.from(providers);
}

/**
 * Format APR for display
 */
export function formatAPR(apr: number): string {
  return `${apr.toFixed(2)}%`;
}
