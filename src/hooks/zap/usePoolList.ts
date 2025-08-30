import type { ZapAsset } from 'config/zapAsset';
import { useZap } from 'contexts/ZapContext';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UsePoolListParams {
  chainId?: number;
  provider?: string;
  searchQuery?: string;
  limit?: number;
}

export const usePoolList = ({
  chainId,
  provider,
  searchQuery,
  limit = 100,
}: UsePoolListParams = {}): {
  pools: ZapAsset[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const [pools, setPools] = useState<ZapAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use centralized cache-first method from ZapContext
  const { getOrFetchPools, isFetchingPools, lastZapAssetCacheUpdate } =
    useZap();

  const fetchPools = useCallback(async () => {
    if (!chainId) {
      setPools([]);
      return;
    }

    try {
      if (!provider) {
        setPools([]);
        return;
      }
      setError(null);
      // Use cache-first method from context (like bridge uses getOrFetchToken)
      const fetchedPools = await getOrFetchPools(chainId, provider, limit);
      setPools(fetchedPools);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch pools';
      setError(errorMessage);
      console.error('Error fetching pools:', err);
    }
  }, [chainId, provider, limit, getOrFetchPools]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  // Re-fetch when cache updates (like bridge does with lastTokenCacheUpdate)
  useEffect(() => {
    if (chainId) {
      fetchPools();
    }
  }, [lastZapAssetCacheUpdate, fetchPools, chainId]);

  const filteredPools = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return pools;
    }

    const query = searchQuery.toLowerCase().trim();
    return pools.filter((pool) => {
      // Search by pool symbol, name, or address
      const searchFields = [
        pool.symbol?.toLowerCase(),
        pool.name?.toLowerCase(),
        pool.address?.toString().toLowerCase(),
      ].filter(Boolean);

      return searchFields.some((field) => field?.includes(query));
    });
  }, [pools, searchQuery]);

  return {
    pools: filteredPools,
    loading: isFetchingPools,
    error,
    refetch: fetchPools,
  };
};
