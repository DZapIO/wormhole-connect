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
  type ReactNode,
} from 'react';
import { type ZapPoolData, type ZapPositionData } from '../zap/sdk';

interface ZapContextType {
  getPool: (pool: ZapPoolData) => ZapAsset;
  getPosition: (position: ZapPositionData) => ZapAsset;
}

export const ZapContext = createContext<ZapContextType | undefined>(undefined);
interface ZapProviderProps {
  children: ReactNode;
}

export const ZapProvider: React.FC<ZapProviderProps> = ({ children }) => {
  const getPool = useCallback((pool: ZapPoolData): ZapAsset => {
    const zapAsset = getZapAssetFromPool(pool);

    if (config.zapAssets.get(zapAsset.tokenId)) {
      return zapAsset;
    }

    config.zapAssets.add(zapAsset);
    config.zapAssets.persist();

    return zapAsset;
  }, []);

  const getPosition = useCallback((position: ZapPositionData): ZapAsset => {
    const zapAsset = getZapAssetFromPosition(position);

    // don't check cache for positions
    config.zapAssets.add(zapAsset);
    config.zapAssets.persist();

    return zapAsset;
  }, []);

  return (
    <ZapContext.Provider
      value={{
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
