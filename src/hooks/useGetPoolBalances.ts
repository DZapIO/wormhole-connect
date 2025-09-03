import type { Chain } from '@wormhole-foundation/sdk';
import { amount } from '@wormhole-foundation/sdk';
import { chainToPlatform } from '@wormhole-foundation/sdk-base';
import config from 'config';
import type { ZapAsset } from 'config/zapAsset';
import { useZap } from 'contexts/ZapContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WalletData } from 'store/wallet';
import { getCached, setCached } from 'utils/balanceCache';
import type { Balances } from 'utils/wallet/types';
import type { ZapPositionData } from 'zap/sdk';

export interface ChainBalanceRequest {
  chain: Chain;
  wallet: WalletData;
  poolList: ZapAsset[];
  protocol: string;
}

// Map of chain+wallet -> balances
type BalanceMap = Record<string, Balances>;

// Constants
const MAX_TOKENS_TO_PROCESS = 100;

// Helper to create request key
const getRequestKey = (chain: Chain, wallet: WalletData) =>
  `${chain}-${wallet.address}`;

interface UseGetPoolBalancesParams {
  source?: ChainBalanceRequest;
  destination?: ChainBalanceRequest;
}

interface ChainBalanceResult {
  balances: Balances;
}

interface UseGetPoolBalancesResult {
  isFetching: boolean;
  source: ChainBalanceResult;
  destination: ChainBalanceResult;
}

const useGetPoolBalances = ({
  source,
  destination,
}: UseGetPoolBalancesParams): UseGetPoolBalancesResult => {
  const [balances, setBalances] = useState<BalanceMap>({});
  const [fetchingKeys, setFetchingKeys] = useState<Set<string>>(new Set());

  const { getPool } = useZap();

  // Keep track of current request keys to avoid stale updates
  const currentRequestKeysRef = useRef<Set<string>>(new Set());

  // Process results from pools
  const processPositionResults = useCallback(
    async (
      positions: ZapPositionData[],
      chain: Chain,
      wallet: WalletData,
      updatedBalances: Balances,
      tokensToFetch: ZapAsset[],
    ) => {
      // Process positions and convert to balances
      for (const pool of positions) {
        const zapAsset = getPool(pool);
        if (zapAsset) {
          // Extract balance from position data
          const balanceValue = BigInt(pool.amount.amount) || 0n;
          const balance = amount.fromBaseUnits(balanceValue, zapAsset.decimals);
          const balanceData = {
            balance,
            lastUpdated: Date.now(),
          };
          updatedBalances[zapAsset.key] = balanceData;
          setCached(wallet, zapAsset, balance);
        }
      }

      // Set 0 balance values for tokens we wanted to check balances for which were not in the positions result
      for (const token of tokensToFetch) {
        if (updatedBalances[token.key] === undefined) {
          const balance = amount.fromBaseUnits(0n, token.decimals);
          updatedBalances[token.key] = {
            balance,
            lastUpdated: Date.now(),
          };
          setCached(wallet, token, balance);
        }
      }
    },
    [getPool],
  );

  // Fetch balances for a single chain using positions
  const fetchBalancesForChain = useCallback(
    async (
      chain: Chain,
      wallet: WalletData,
      tokens: ZapAsset[],
      protocol: string,
    ): Promise<Balances> => {
      const chainConfig = config.chains[chain];
      if (
        !chainConfig ||
        chainToPlatform(chainConfig.sdkName) !== wallet.type
      ) {
        return {};
      }

      const updatedBalances: Balances = {};

      // Check cache first
      const tokensToFetch: ZapAsset[] = [];
      for (const token of tokens) {
        const cached = getCached(wallet, token);
        if (cached) {
          updatedBalances[token.key] = cached;
        } else {
          tokensToFetch.push(token);
        }
      }

      if (tokensToFetch.length === 0) {
        return updatedBalances;
      }

      // Fetch positions using zapDataAggregator
      try {
        const positionsResult = await config.zapDataAggregator.getPositions({
          chain,
          userAddress: wallet.address,
          protocol,
          limit: MAX_TOKENS_TO_PROCESS,
        });

        await processPositionResults(
          positionsResult.positions,
          chain,
          wallet,
          updatedBalances,
          tokensToFetch,
        );
      } catch (e) {
        console.error(`Error calling getPositions on ${chain}:`, e);
      }

      return updatedBalances;
    },
    [processPositionResults],
  );

  // Effect to fetch balances
  useEffect(() => {
    // Build current request keys
    const newRequestKeys = new Set<string>();
    if (source) {
      newRequestKeys.add(getRequestKey(source.chain, source.wallet));
    }
    if (destination) {
      newRequestKeys.add(getRequestKey(destination.chain, destination.wallet));
    }

    // Update current keys ref
    currentRequestKeysRef.current = newRequestKeys;

    // Clear fetching states for removed keys
    setFetchingKeys((prev) => {
      const updated = new Set(prev);
      for (const key of prev) {
        if (!newRequestKeys.has(key)) {
          updated.delete(key);
        }
      }
      return updated;
    });

    if (newRequestKeys.size === 0) {
      return;
    }

    // Fetch balances for each request
    const fetchAll = async () => {
      const requests: ChainBalanceRequest[] = [];
      if (source) requests.push(source);
      if (destination) requests.push(destination);

      // Mark as fetching
      setFetchingKeys(new Set(newRequestKeys));

      try {
        const results = await Promise.all(
          requests.map(async (request) => {
            const key = getRequestKey(request.chain, request.wallet);

            // Check if this key is still current
            if (!currentRequestKeysRef.current.has(key)) {
              return { key, balances: {} };
            }

            const balances = await fetchBalancesForChain(
              request.chain,
              request.wallet,
              request.poolList,
              request.protocol,
            );
            return { key, balances };
          }),
        );

        // Update balances only for current requests
        setBalances((prevBalances) => {
          const newBalances: BalanceMap = { ...prevBalances };

          for (const { key, balances } of results) {
            if (
              currentRequestKeysRef.current.has(key) &&
              Object.keys(balances).length > 0
            ) {
              newBalances[key] = balances;
            }
          }

          // Remove balances for keys that are no longer current
          for (const key in newBalances) {
            if (!currentRequestKeysRef.current.has(key)) {
              delete newBalances[key];
            }
          }

          return newBalances;
        });
      } finally {
        // Clear fetching state
        setFetchingKeys((prev) => {
          const updated = new Set(prev);
          for (const key of newRequestKeys) {
            updated.delete(key);
          }
          return updated;
        });
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    source?.chain,
    source?.wallet?.address,
    source?.protocol,
    destination?.chain,
    destination?.wallet?.address,
    destination?.protocol,
  ]);

  // Extract results for source and destination
  const sourceKey = source ? getRequestKey(source.chain, source.wallet) : null;
  const destKey = destination
    ? getRequestKey(destination.chain, destination.wallet)
    : null;

  const sourceResult: ChainBalanceResult = useMemo(() => {
    return {
      balances: sourceKey ? balances[sourceKey] || {} : {},
    };
  }, [balances, sourceKey]);

  const destinationResult: ChainBalanceResult = useMemo(() => {
    return {
      balances: destKey ? balances[destKey] || {} : {},
    };
  }, [balances, destKey]);

  const isFetching = fetchingKeys.size > 0;

  return {
    isFetching,
    source: sourceResult,
    destination: destinationResult,
  };
};

export default useGetPoolBalances;
