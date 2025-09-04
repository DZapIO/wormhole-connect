import type { Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import type { ZapAsset } from 'config/zapAsset';
import { useZap } from 'contexts/ZapContext';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setDestToken } from 'store/transferInput';
import type { ZapPoolData } from 'zap/sdk';

type Props = {
  protocol?: string;
  chain: Chain | undefined;
  limit?: number;
};

type ReturnProps = {
  pools: ZapAsset[];
  isFetching: boolean;
};

const computePoolsForChainAndProvider = async (
  chain: Chain | undefined,
  protocol: string,
  getPool: (token: ZapPoolData) => ZapAsset | undefined,
  limit?: number,
): Promise<ZapAsset[]> => {
  if (!chain) {
    return [];
  }

  const cachedPools = config.zapAssets.getPoolsForChainAndProtocol(
    chain,
    protocol,
  );

  if (cachedPools.length > 0) {
    return cachedPools;
  }

  // Both chains selected - fetch supported tokens from routes
  const poolsResult = await config.zapDataAggregator.getPools({
    chain,
    protocol: protocol,
    limit,
  });

  const pools = await Promise.all(poolsResult.pools.map(getPool));
  const supportedPools = pools.filter((pool) => !!pool);

  return supportedPools;
};

const useGetPools = (props: Props): ReturnProps => {
  const { chain, protocol, limit } = props;

  const dispatch = useDispatch();
  const { getPool } = useZap();

  const [pools, setPools] = useState<ZapAsset[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const computeDestTokens = useCallback(async () => {
    if (!protocol) {
      return;
    }
    setPools([]);
    setIsFetching(true);

    try {
      const supported = await computePoolsForChainAndProvider(
        chain,
        protocol,
        getPool,
        limit,
      );

      setPools(supported);

      // Auto-select if there's only one option
      if (chain && supported.length === 1) {
        dispatch(setDestToken(supported[0].tuple));
      }
    } finally {
      setIsFetching(false);
    }
  }, [chain, protocol, limit, dispatch, getPool]);

  useEffect(() => {
    computeDestTokens();
  }, [computeDestTokens]);

  return {
    pools,
    isFetching,
  };
};

export default useGetPools;
