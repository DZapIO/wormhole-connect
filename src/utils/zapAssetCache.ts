import { UniversalAddress, type Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import type { ZapAsset } from 'config/zapAsset';
import {
  getZapAssetFromPool,
  getZapAssetFromPosition,
  ZapAssetType,
  type ZapPool,
  type ZapPosition,
} from 'config/zapAsset';

/**
 * Converts a ZapPool to a ZapAsset and adds it to the cache
 */
export function cacheZapPool(
  pool: ZapPool,
  chain: Chain,
  provider: string,
): ZapAsset | null {
  const zapAsset = getZapAssetFromPool(pool);
  if (zapAsset) {
    config.zapAssets.add(zapAsset);
  }
  return zapAsset;
}

/**
 * Converts a ZapPosition to a ZapAsset and adds it to the cache
 */
export function cacheZapPosition(
  position: ZapPosition,
  chain: Chain,
  provider: string,
): ZapAsset | null {
  const zapAsset = getZapAssetFromPosition(position);

  if (zapAsset) {
    config.zapAssets.add(zapAsset);
  }
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
  return pools
    .map((pool) => cacheZapPool(pool, chain, provider))
    .filter((zapAsset) => zapAsset !== null);
}

/**
 * Batch cache multiple positions
 */
export function cacheZapPositions(
  positions: ZapPosition[],
  chain: Chain,
  provider: string,
): ZapAsset[] {
  return positions
    .map((position) => cacheZapPosition(position, chain, provider))
    .filter((zapAsset) => zapAsset !== null);
}

/**
 * Get cached pool by key
 */
export function getCachedPool(
  chain: Chain,
  address: string,
  provider: string,
): ZapAsset | undefined {
  return config.zapAssets.get({
    chain,
    address: new UniversalAddress(address),
    type: ZapAssetType.POOL,
    provider,
  });
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
  return config.zapAssets.get({
    chain,
    address: new UniversalAddress(address),
    type: ZapAssetType.POSITION,
    provider,
    nftId,
  });
}
