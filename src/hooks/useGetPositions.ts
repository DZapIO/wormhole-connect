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

  // Both chains selected - fetch supported tokens from routes
  const positionsResult = await config.zapDataAggregator.getPositions({
    chain,
    userAddress: userAddress,
    provider,
    limit,
  });

  const positions = await Promise.all(
    positionsResult.positions.map(getPosition),
  );
  const supportedPositions = positions.filter((position) => !!position);

  return supportedPositions;
};

const useGetPositions = (props: Props): ReturnProps => {
  const { chain, provider, limit, userAddress } = props;

  const { getPosition } = useZap();

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
  }, [computeDestTokens]);

  return {
    positions,
    isFetching,
  };
};

export default useGetPositions;
