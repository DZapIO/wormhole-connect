import type { Chain, TokenId } from '@wormhole-foundation/sdk';
import config from 'config';
import memoize from 'fast-memoize';

/**
 * Returns all token IDs for a given chain.
 * Used by routes that support swapping between any tokens on a chain.
 */
export const getAllTokenIdsForChain = memoize(
  (chain: Chain): TokenId[] => {
    return config.tokens.getAllForChain(chain).map((token) => token.tokenId);
  },
  {
    // Invalidate when token cache updates by including lastUpdate in the key
    serializer: (args: unknown[]) =>
      `${String(args[0])}|${config.tokens.lastUpdate.getTime()}`,
  },
);

/**
 * Returns all token and pool IDs for a given chain.
 * Used by routes that support Zap
 */
export const getAllZapTokenIdsForChain = memoize(
  (chain: Chain): TokenId[] => {
    return [
      ...config.tokens.getAllForChain(chain).map((token) => token.tokenId),
      ...config.zapAssets.getAllForChain(chain).map((asset) => asset.tokenId),
    ];
  },
  {
    // Invalidate when token cache updates by including lastUpdate in the key
    serializer: (args: unknown[]) =>
      `${String(
        args[0],
      )}|${config.tokens.lastUpdate.getTime()}|${config.zapAssets.lastUpdate.getTime()}`,
  },
);
