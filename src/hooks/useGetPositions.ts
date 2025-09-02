import type { Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import type { Token } from 'config/tokens';
import type { ZapAsset } from 'config/zapAsset';
import { useZap } from 'contexts/ZapContext';
import { useCallback, useEffect, useState } from 'react';
import type { ZapPositionData } from 'zap/sdk';

type Props = {
  userAddress: string;
  provider: string;
  chain: Chain | undefined;
  limit?: number;
};

type ReturnProps = {
  positions: ZapAsset[];
  isFetching: boolean;
};

const computePositionsForChainAndProvider = async (
  userAddress: string,
  chain: Chain | undefined,
  provider: string,
  getPosition: (token: ZapPositionData) => ZapAsset | undefined,
  limit?: number,
): Promise<Token[]> => {
  if (!chain) {
    return [];
  }

  // const cachedPositions = config.zapAssets.getAllPositionsForChainAndProvider(
  //   chain,
  //   provider,
  // );

  // if (cachedPositions.length > 0) {
  //   return cachedPositions;
  // }

  // Both chains selected - fetch supported tokens from routes
  const supportedTokenIds = await config.zapDataProvider.getPositions({
    chain,
    userAddress: userAddress,
    provider,
    limit,
  });

  const tokens = await Promise.all(
    supportedTokenIds.positions.map(getPosition),
  );
  const supportedTokens = tokens.filter((token) => !!token);

  return supportedTokens;
};

const useGetPositions = (props: Props): ReturnProps => {
  const { chain, provider, limit, userAddress } = props;

  const { getPosition, lastZapAssetCacheUpdate } = useZap();

  const [positions, setPositions] = useState<ZapAsset[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const computeDestTokens = useCallback(async () => {
    setPositions([]);
    setIsFetching(true);

    try {
      const supported = await computePositionsForChainAndProvider(
        userAddress,
        chain,
        provider,
        getPosition,
        limit,
      );

      setPositions(supported);
    } finally {
      setIsFetching(false);
    }
  }, [chain, provider, limit, getPosition, userAddress]);

  useEffect(() => {
    computeDestTokens();
  }, [computeDestTokens, lastZapAssetCacheUpdate]);

  return {
    positions,
    isFetching,
  };
};

export default useGetPositions;
