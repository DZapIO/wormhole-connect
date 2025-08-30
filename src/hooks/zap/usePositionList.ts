import type { ZapAsset } from 'config/zapAsset';
import { useZap } from 'contexts/ZapContext';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  positions: ZapAsset[];
  loading: boolean;
  refetch: () => Promise<void>;
} => {
  const [positions, setPositions] = useState<ZapAsset[]>([]);

  // Use centralized cache-first method from ZapContext
  const { getOrFetchPositions, isFetchingPositions } = useZap();

  const fetchPositions = useCallback(async () => {
    const positions = await getOrFetchPositions(
      chainId,
      provider,
      walletAddress,
    );
    setPositions(positions);
  }, [chainId, provider, getOrFetchPositions, walletAddress]);

  // Re-fetch when cache updates (like bridge does with lastTokenCacheUpdate)
  useEffect(() => {
    if (walletAddress) {
      fetchPositions();
    }
  }, [fetchPositions, walletAddress]);

  const filteredPositions = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return positions;
    }

    const query = searchQuery.toLowerCase().trim();
    return positions.filter((position) => {
      const searchFields = [
        position.name?.toLowerCase(),
        position.address?.toString().toLowerCase(),
      ].filter(Boolean);

      return searchFields.some((field) => field?.includes(query));
    });
  }, [positions, searchQuery]);

  return {
    positions: filteredPositions,
    loading: isFetchingPositions,
    refetch: fetchPositions,
  };
};
