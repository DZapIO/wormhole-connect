import type { Chain } from '@wormhole-foundation/sdk';
import type { ZapPoolData, ZapPositionData } from './types';

export function filterPoolsByProvider(
  pools: ZapPoolData[],
  provider: string,
): ZapPoolData[] {
  return pools.filter((pool) => pool.provider === provider);
}

/**
 * Filter positions by provider
 */
export function filterPositionsByProvider(
  positions: ZapPositionData[],
  provider: string,
): ZapPositionData[] {
  return positions.filter((position) => position.provider === provider);
}

/**
 * Filter pools by chain
 */
export function filterPoolsByChain(
  pools: ZapPoolData[],
  chain: Chain,
): ZapPoolData[] {
  return pools.filter((pool) => pool.chain === chain);
}

/**
 * Filter positions by chain
 */
export function filterPositionsByChain(
  positions: ZapPositionData[],
  chain: Chain,
): ZapPositionData[] {
  return positions.filter((position) => position.chain === chain);
}

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
  pools.forEach((pool) => providers.add(pool.provider));
  return Array.from(providers);
}

/**
 * Get unique providers from positions
 */
export function getUniqueProvidersFromPositions(
  positions: ZapPositionData[],
): string[] {
  const providers = new Set<string>();
  positions.forEach((position) => providers.add(position.provider));
  return Array.from(providers);
}

/**
 * Get unique chains from pools
 */
export function getUniqueChainsFromPools(pools: ZapPoolData[]): Chain[] {
  const chains = new Set<Chain>();
  pools.forEach((pool) => chains.add(pool.chain));
  return Array.from(chains);
}

/**
 * Get unique chains from positions
 */
export function getUniqueChainsFromPositions(
  positions: ZapPositionData[],
): Chain[] {
  const chains = new Set<Chain>();
  positions.forEach((position) => chains.add(position.chain));
  return Array.from(chains);
}

/**
 * Calculate total TVL across all pools
 */
export function calculateTotalTVL(pools: ZapPoolData[]): number {
  return pools.reduce((total, pool) => {
    const tvl = pool.tvl || 0;
    return total + tvl;
  }, 0);
}

/**
 * Calculate total USD value across all positions
 */
export function calculateTotalUSDValue(positions: ZapPositionData[]): number {
  return positions.reduce((total, position) => {
    const value = position.amountUSD || 0;
    return total + value;
  }, 0);
}

/**
 * Get average APR across all pools
 */
export function getAverageAPR(pools: ZapPoolData[]): number {
  if (pools.length === 0) return 0;

  const totalAPR = pools.reduce((total, pool) => {
    return total + (pool.apr || 0);
  }, 0);

  return totalAPR / pools.length;
}

/**
 * Format TVL for display
 */
export function formatTVL(tvl: string | number): string {
  const num = typeof tvl === 'string' ? parseFloat(tvl) : tvl;

  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

/**
 * Format APR for display
 */
export function formatAPR(apr: number): string {
  return `${apr.toFixed(2)}%`;
}

/**
 * Format USD value for display
 */
export function formatUSDValue(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

/**
 * Validate pool data
 */
export function validatePoolData(pool: ZapPoolData): boolean {
  return !!(
    pool.address &&
    pool.name &&
    pool.symbol &&
    typeof pool.decimals === 'number' &&
    pool.provider
  );
}

/**
 * Validate position data
 */
export function validatePositionData(position: ZapPositionData): boolean {
  return !!(
    position.address &&
    position.name &&
    position.symbol &&
    typeof position.decimals === 'number' &&
    position.provider &&
    position.userAddress
  );
}
