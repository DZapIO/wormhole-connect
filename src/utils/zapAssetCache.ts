import config from 'config';
import {
  ZapAsset,
  ZapAssetType,
  type ZapPool,
  type ZapPosition,
} from 'config/zapAsset';
import type { Chain } from '@wormhole-foundation/sdk';

/**
 * Converts a ZapPool to a ZapAsset and adds it to the cache
 */
export function cacheZapPool(
  pool: ZapPool,
  chain: Chain,
  provider: string,
): ZapAsset {
  const zapAsset = new ZapAsset(
    chain,
    pool.address,
    ZapAssetType.POOL,
    18, // Default decimals for pools
    pool.symbol || pool.name || 'Pool',
    pool.name,
    pool.underlyingAssets?.[0]?.logo,
    provider,
    undefined, // No nftId for pools
  );

  config.zapAssets.add(zapAsset);
  return zapAsset;
}

/**
 * Converts a ZapPosition to a ZapAsset and adds it to the cache
 */
export function cacheZapPosition(
  position: ZapPosition,
  chain: Chain,
  provider: string,
): ZapAsset {
  const zapAsset = new ZapAsset(
    chain,
    position.address,
    ZapAssetType.POSITION,
    18, // Default decimals for positions
    position.name || 'Position',
    position.name,
    position.underlyingAssets?.[0]?.logo,
    provider,
    undefined, // nftId - will be set from the API response separately
  );

  config.zapAssets.add(zapAsset);
  return zapAsset;
}

/**
 * Batch cache multiple pools
 */
export function cacheZapPools(
  pools: ZapPool[],
  chain: Chain,
  provider: string,
): ZapAsset[] {
  return pools.map((pool) => cacheZapPool(pool, chain, provider));
}

/**
 * Batch cache multiple positions
 */
export function cacheZapPositions(
  positions: ZapPosition[],
  chain: Chain,
  provider: string,
): ZapAsset[] {
  return positions.map((position) =>
    cacheZapPosition(position, chain, provider),
  );
}

/**
 * Get cached pool by key
 */
export function getCachedPool(
  chain: Chain,
  address: string,
  provider: string,
): ZapAsset | undefined {
  return config.zapAssets.get(chain, address, ZapAssetType.POOL, provider);
}

/**
 * Get cached position by key
 */
export function getCachedPosition(
  chain: Chain,
  address: string,
  provider: string,
  nftId?: string,
): ZapAsset | undefined {
  return config.zapAssets.get(
    chain,
    address,
    ZapAssetType.POSITION,
    provider,
    nftId,
  );
}
