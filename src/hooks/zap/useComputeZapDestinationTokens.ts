import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import config from 'config';
import { setDestToken } from 'store/zap';

import type { Token } from 'config/tokens';
import { isZapPosition, type ZapAsset } from 'config/zapAsset';

import type { Chain } from '@wormhole-foundation/sdk';
import { useTokens } from 'contexts/TokensContext';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: ZapAsset | undefined;
  destChain: Chain | undefined;
};

type ReturnProps = {
  supportedDestTokens: Token[];
  isFetching: boolean;
};

/**
 * Compute the destination tokens for a given source token and chains.
 * This handles the following cases:
 * 1. No destination chain selected - returns empty array
 * 2. Missing source chain, source token returns all tokens on destination chain
 * 3. Source token is a position - returns all tokens on destination chain
 */
const computeDestTokensForChains = async (
  sourceChain: Chain | undefined,
  destChain: Chain | undefined,
  sourceToken: ZapAsset | undefined,
): Promise<Token[]> => {
  if (!destChain) {
    return [];
  }

  // If no source chain/token is selected, or if the source is a position,
  // return all available tokens on the destination chain
  if (!sourceChain || !sourceToken || isZapPosition(sourceToken.tuple)) {
    return config.tokens.getAllForChain(destChain);
  }

  // TODO: Implement route-based destination token fetching for zap functionality
  // This will query the available routes to determine which destination tokens are supported
  // for the given source token and chain combination
  // const supportedTokenIds = await config.routes.allSupportedDestTokens(
  //   sourceToken,
  //   sourceChain,
  //   destChain,
  // );
  return [];
};

const useComputeZapDestinationTokens = (props: Props): ReturnProps => {
  const { sourceChain, destChain, sourceToken } = props;

  const dispatch = useDispatch();
  const { lastTokenCacheUpdate } = useTokens();

  const [supportedDestTokens, setSupportedDestTokens] = useState<Token[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const computeDestTokens = useCallback(async () => {
    setSupportedDestTokens([]);
    setIsFetching(true);

    try {
      const supported = await computeDestTokensForChains(
        sourceChain,
        destChain,
        sourceToken,
      );

      setSupportedDestTokens(supported);

      // Auto-select if there's only one option
      if (destChain && supported.length === 1) {
        dispatch(setDestToken(supported[0].tuple));
      }
    } finally {
      setIsFetching(false);
    }
  }, [sourceToken, sourceChain, destChain, dispatch]);

  useEffect(() => {
    computeDestTokens();
  }, [computeDestTokens, lastTokenCacheUpdate]);

  return {
    supportedDestTokens,
    isFetching,
  };
};

export default useComputeZapDestinationTokens;
