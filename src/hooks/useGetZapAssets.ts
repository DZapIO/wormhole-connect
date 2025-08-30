import config from 'config';
import type { ZapAsset, ZapAssetTuple } from 'config/zapAsset';
import { isZapPool, isZapPosition, ZapAssetType } from 'config/zapAsset';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';

export const useGetZapAssets = (): {
  sourceToken: ZapAsset | undefined;
  destToken: ZapAsset | undefined;
  sourceZapAsset: ZapAssetTuple | undefined;
  destZapAsset: ZapAssetTuple | undefined;
  sourceAssetType: ZapAssetType | undefined;
  destAssetType: ZapAssetType | undefined;
} => {
  const zapInput = useSelector((state: RootState) => state.zapInput);

  // Get traditional tokens
  const sourceToken = useMemo(
    () => (zapInput.token ? config.zapAssets.get(zapInput.token) : undefined),
    [zapInput.token],
  );

  const destToken = useMemo(
    () =>
      zapInput.destToken ? config.zapAssets.get(zapInput.destToken) : undefined,
    [zapInput.destToken],
  );

  // Get zap assets
  const sourceZapAsset = useMemo(() => zapInput.token, [zapInput.token]);

  const destZapAsset = useMemo(() => zapInput.destToken, [zapInput.destToken]);

  // Determine asset types
  const sourceAssetType = useMemo(() => {
    if (sourceZapAsset) {
      if (isZapPosition(sourceZapAsset)) return ZapAssetType.POSITION;
      if (isZapPool(sourceZapAsset)) return ZapAssetType.POOL;
    }
    if (sourceToken) return ZapAssetType.TOKEN;
    return undefined;
  }, [sourceZapAsset, sourceToken]);

  const destAssetType = useMemo(() => {
    if (destZapAsset) {
      if (isZapPosition(destZapAsset)) return ZapAssetType.POSITION;
      if (isZapPool(destZapAsset)) return ZapAssetType.POOL;
    }
    if (destToken) return ZapAssetType.TOKEN;
    return undefined;
  }, [destZapAsset, destToken]);

  return {
    sourceToken,
    destToken,
    sourceZapAsset,
    destZapAsset,
    sourceAssetType,
    destAssetType,
  };
};
