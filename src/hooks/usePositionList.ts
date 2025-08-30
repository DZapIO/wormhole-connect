import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ZapPosition } from 'config/zapAsset';
import { useZap } from 'contexts/ZapContext';

interface UsePositionListParams {
  chainId: number;
  provider: string;
  walletAddress?: string;
  searchQuery?: string;
  limit?: number;
}

export const usePositionList = ({
  chainId,
  provider,
  walletAddress,
  searchQuery,
}: UsePositionListParams): {
  positions: ZapPosition[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const [positions, setPositions] = useState<ZapPosition[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use centralized cache-first method from ZapContext
  const { getOrFetchPositions, isFetchingPositions, lastZapAssetCacheUpdate } =
    useZap();

  const fetchPositions = useCallback(async () => {
    try {
      setError(null);
      // Use cache-first method from context (like bridge uses getOrFetchToken)
      const fetchedPositions = await getOrFetchPositions(
        chainId,
        provider,
        walletAddress,
      );
      setPositions(fetchedPositions);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(errorMessage);
      console.error('Error fetching positions:', err);
    }
  }, [chainId, provider, walletAddress, getOrFetchPositions]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Re-fetch when cache updates (like bridge does with lastTokenCacheUpdate)
  useEffect(() => {
    if (walletAddress) {
      fetchPositions();
    }
  }, [lastZapAssetCacheUpdate, fetchPositions, walletAddress]);

  const filteredPositions = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return positions;
    }

    const query = searchQuery.toLowerCase().trim();
    return positions.filter((position) => {
      const searchFields = [
        position.name?.toLowerCase(),
        position.address?.toLowerCase(),
      ].filter(Boolean);

      return searchFields.some((field) => field?.includes(query));
    });
  }, [positions, searchQuery]);

  return {
    positions: filteredPositions,
    loading: isFetchingPositions,
    error,
    refetch: fetchPositions,
  };
};
