import config from 'config';
import {
  getZapAssetFromPool,
  getZapAssetFromPosition,
  type ZapAsset,
} from 'config/zapAsset';
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { type ZapPoolData, type ZapPositionData } from '../routes/sdkZap';

interface ZapContextType {
  lastZapAssetCacheUpdate: Date;
  getPool: (pool: ZapPoolData) => ZapAsset;
  getPosition: (position: ZapPositionData) => ZapAsset;
}

export const ZapContext = createContext<ZapContextType | undefined>(undefined);
interface ZapProviderProps {
  children: ReactNode;
}

export const ZapProvider: React.FC<ZapProviderProps> = ({ children }) => {
  const [lastZapAssetCacheUpdate, setLastZapAssetCacheUpdate] = useState(
    config.zapAssets.lastUpdate,
  );

  const getPool = useCallback((pool: ZapPoolData): ZapAsset => {
    const zapAsset = getZapAssetFromPool(pool);

    const cachedPools = config.zapAssets.get(zapAsset.tuple);

    if (cachedPools) {
      return cachedPools;
    }

    config.zapAssets.add(zapAsset);
    setLastZapAssetCacheUpdate(config.zapAssets.lastUpdate);
    config.zapAssets.persist();

    return zapAsset;
  }, []);

  // Cache-first position fetching (following TokensContext pattern)
  const getPosition = useCallback((position: ZapPositionData): ZapAsset => {
    const zapAsset = getZapAssetFromPosition(position);
    config.zapAssets.add(zapAsset);
    setLastZapAssetCacheUpdate(config.zapAssets.lastUpdate);
    config.zapAssets.persist();

    return zapAsset;
  }, []);

  return (
    <ZapContext.Provider
      value={{
        lastZapAssetCacheUpdate,
        getPool,
        getPosition,
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
