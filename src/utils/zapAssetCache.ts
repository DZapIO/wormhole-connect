import { UniversalAddress, type Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import type { ZapAsset } from 'config/zapAsset';
import { ZapAssetType } from 'config/zapAsset';

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
