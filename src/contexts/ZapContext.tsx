import type { HexString } from '@dzapio/sdk';
import { DZapClient } from '@dzapio/sdk';
import type { Chain } from '@wormhole-foundation/sdk';
import { toNative } from '@wormhole-foundation/sdk';
import config, { clearWormholeContextV2 } from 'config';
import type {
  ZapAsset,
  ZapAssetId,
  ZapPool,
  ZapPoolDetails,
  ZapPoolDetailsRequest,
  ZapPoolsRequest,
  ZapPosition,
  ZapPositionsRequest,
} from 'config/zapAsset';
import { ZapAssetType } from 'config/zapAsset';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useDispatch } from 'react-redux';
import { setZappingChains, setZappingProviders } from 'store/zap';
import { getChainFromId } from 'utils/chainMapping';
import { cacheZapPools, cacheZapPositions } from 'utils/zapAssetCache';

interface ZapContextType {
  getOrFetchZapAsset: (zapAssetId: ZapAssetId) => Promise<ZapAsset | undefined>;
  isFetchingZapAsset: boolean;
  lastZapAssetCacheUpdate: Date;

  // Cache-first methods following TokensContext pattern
  getOrFetchPools: (
    chainId: number,
    provider?: string,
    limit?: number,
  ) => Promise<ZapPool[]>;
  getOrFetchPositions: (
    chainId: number,
    provider: string,
    walletAddress?: string,
  ) => Promise<ZapPosition[]>;
  isFetchingPools: boolean;
  isFetchingPositions: boolean;

  // Direct API methods (for fallback use)
  getZapPositions: (request: ZapPositionsRequest) => Promise<ZapPosition[]>;
  getZapPools: (request: ZapPoolsRequest) => Promise<ZapPool[]>;
  getZapPoolDetails: (
    request: ZapPoolDetailsRequest,
  ) => Promise<ZapPoolDetails>;

  getSupportedChains: () => Promise<Chain[]>;
  getSupportedProviders: () => Promise<string[]>;
  sdk: DZapClient;
}

export const ZapContext = createContext<ZapContextType | undefined>(undefined);

interface ZapProviderProps {
  children: ReactNode;
}

export const ZapProvider: React.FC<ZapProviderProps> = ({ children }) => {
  const [isFetchingZapAsset, setIsFetchingZapAsset] = useState(false);
  const [isFetchingPools, setIsFetchingPools] = useState(false);
  const [isFetchingPositions, setIsFetchingPositions] = useState(false);
  const [lastZapAssetCacheUpdate, setLastZapAssetCacheUpdate] = useState(
    config.zapAssets.lastUpdate,
  );

  const dispatch = useDispatch();
  const sdk = DZapClient.getInstance();

  const getOrFetchZapAsset = useCallback(
    async (zapAssetId: ZapAssetId): Promise<ZapAsset | undefined> => {
      const cached = config.zapAssets.get(zapAssetId);
      if (cached) return cached;

      try {
        setIsFetchingZapAsset(true);
        // For now, we'll use addFromTokenId and convert to ZapAsset
        // This will need to be updated when we have proper zap asset metadata fetching
        const tokenId = {
          chain: zapAssetId.chain,
          address: toNative(zapAssetId.chain, zapAssetId.address),
        };
        const zapAsset = await config.zapAssets.addFromTokenId(
          tokenId,
          zapAssetId.type,
          zapAssetId.provider,
          zapAssetId.nftId,
        );
        setLastZapAssetCacheUpdate(config.zapAssets.lastUpdate);
        console.info('Added new zap asset to cache', zapAsset);
        config.zapAssets.persist();
        clearWormholeContextV2();
        return zapAsset;
      } catch (e) {
        console.error('Error getting zap asset', e);
        return undefined;
      } finally {
        setIsFetchingZapAsset(false);
      }
    },
    [],
  );

  const getZapPositions = useCallback(
    async (request: ZapPositionsRequest): Promise<ZapPosition[]> => {
      try {
        const response = await sdk.getZapPositions(request);
        return response.positions;
      } catch (e) {
        console.error('Error fetching zap positions:', e);
        return [];
      }
    },
    [sdk],
  );

  const getZapPools = useCallback(
    async (request: ZapPoolsRequest): Promise<ZapPool[]> => {
      try {
        const response = await sdk.getZapPools(request);
        return response.pools;
      } catch (e) {
        console.error('Error fetching zap pools:', e);
        return [];
      }
    },
    [sdk],
  );

  const getZapPoolDetails = useCallback(
    async (request: ZapPoolDetailsRequest): Promise<ZapPoolDetails> => {
      return await sdk.getZapPoolDetails(request);
    },
    [sdk],
  );

  const getSupportedChains = useCallback(async (): Promise<Chain[]> => {
    try {
      const response = await sdk.getZapChains();
      dispatch(setZappingChains(response));
      return response;
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      return [];
    }
  }, [sdk, dispatch]);

  const getSupportedProviders = useCallback(async (): Promise<string[]> => {
    try {
      const response = await sdk.getZapProviders();
      dispatch(setZappingProviders(response));
      return response;
    } catch (error) {
      console.error('Error fetching supported providers:', error);
      return [];
    }
  }, [sdk, dispatch]);

  // Cache-first pool fetching (following TokensContext pattern)
  const getOrFetchPools = useCallback(
    async (
      chainId: number,
      provider?: string,
      limit?: number,
    ): Promise<ZapPool[]> => {
      const chain = getChainFromId(chainId);
      if (!chain) {
        console.error('Invalid chainId:', chainId);
        return [];
      }

      // Check cache first (like getOrFetchToken)
      const allCachedAssets = config.zapAssets.getAllForChain(chain);
      const cachedPools = allCachedAssets
        .filter((asset) => asset.type === ZapAssetType.POOL)
        .filter((asset) => !provider || asset.provider === provider);

      // If we have cached pools, return them (cache hit)
      if (cachedPools.length > 0) {
        console.log('🎯 Cache hit: Using cached pools for', chain, provider);
        // Convert ZapAssets back to ZapPool format - simplified version
        return cachedPools.map((asset) => ({
          address: asset.address,
          symbol: asset.symbol,
          name: asset.name,
          provider: asset.provider,
          chainId,
          decimals: asset.decimals,
          underlyingAssets: [],
          tvl: '0',
          apr: 0,
        })) as ZapPool[];
      }

      // Cache miss - fetch from API and cache results
      try {
        setIsFetchingPools(true);
        const request: Partial<ZapPoolsRequest> = { chainId };
        if (provider) request.provider = provider;
        if (limit) request.limit = limit;

        const fetchedPools = await getZapPools(request as ZapPoolsRequest);

        // Cache the fetched pools
        if (fetchedPools.length > 0) {
          cacheZapPools(fetchedPools, chain, provider || 'default');
          setLastZapAssetCacheUpdate(config.zapAssets.lastUpdate);
          config.zapAssets.persist();
          console.log(
            '💾 Cached',
            fetchedPools.length,
            'pools for',
            chain,
            provider,
          );
        }

        return fetchedPools;
      } catch (error) {
        console.error('Error fetching pools:', error);
        return [];
      } finally {
        setIsFetchingPools(false);
      }
    },
    [getZapPools],
  );

  // Cache-first position fetching (following TokensContext pattern)
  const getOrFetchPositions = useCallback(
    async (
      chainId: number,
      provider: string,
      walletAddress?: string,
    ): Promise<ZapPosition[]> => {
      if (!walletAddress) {
        return [];
      }

      const chain = getChainFromId(chainId);
      if (!chain) {
        console.error('Invalid chainId:', chainId);
        return [];
      }

      // Check cache first (like getOrFetchToken)
      const allCachedAssets = config.zapAssets.getAllForChain(chain);
      const cachedPositions = allCachedAssets
        .filter((asset) => asset.type === ZapAssetType.POSITION)
        .filter((asset) => asset.provider === provider);

      // If we have cached positions, return them (cache hit)
      if (cachedPositions.length > 0) {
        console.log(
          '🎯 Cache hit: Using cached positions for',
          chain,
          provider,
        );
        // Convert ZapAssets back to ZapPosition format - simplified version
        return cachedPositions.map((asset) => ({
          address: asset.address,
          name: asset.name,
          provider: asset.provider,
          nftId: asset.nftId,
          chainId,
          amount: '0', // string format required
          decimals: asset.decimals,
          underlyingAssets: [],
          amountUSD: '0', // string format required
          apr: 0,
        })) as ZapPosition[];
      }

      // Cache miss - fetch from API and cache results
      try {
        setIsFetchingPositions(true);
        const request: ZapPositionsRequest = {
          chainId,
          provider,
          account: walletAddress as HexString,
        };

        const fetchedPositions = await getZapPositions(request);

        // Cache the fetched positions
        if (fetchedPositions.length > 0) {
          cacheZapPositions(fetchedPositions, chain, provider);
          setLastZapAssetCacheUpdate(config.zapAssets.lastUpdate);
          config.zapAssets.persist();
          console.log(
            '💾 Cached',
            fetchedPositions.length,
            'positions for',
            chain,
            provider,
          );
        }

        return fetchedPositions;
      } catch (error) {
        console.error('Error fetching positions:', error);
        return [];
      } finally {
        setIsFetchingPositions(false);
      }
    },
    [getZapPositions],
  );

  useEffect(() => {
    getSupportedProviders();
    getSupportedChains();
  }, [getSupportedProviders, getSupportedChains]);

  return (
    <ZapContext.Provider
      value={{
        getOrFetchZapAsset,
        isFetchingZapAsset,
        lastZapAssetCacheUpdate,

        // Cache-first methods
        getOrFetchPools,
        getOrFetchPositions,
        isFetchingPools,
        isFetchingPositions,

        // Direct API methods
        getZapPositions,
        getZapPools,
        getZapPoolDetails,
        getSupportedChains,
        getSupportedProviders,
        sdk,
      }}
    >
      {children}
    </ZapContext.Provider>
  );
};

export const useZap = (): ZapContextType => {
  const context = useContext(ZapContext);
  if (context === undefined) {
    throw new Error('useZap must be used within a ZapProvider');
  }
  return context;
};
