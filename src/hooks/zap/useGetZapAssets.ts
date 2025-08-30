import config from 'config';
import { isZapPoolOrPositionTuple, type ZapAsset } from 'config/zapAsset';
import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import type { RootState } from 'store';

export const useGetZapAssets = (): {
  sourceToken: ZapAsset | undefined;
  destToken: ZapAsset | undefined;
} => {
  const { token: selectedSourceToken, destToken: selectedDestToken } =
    useSelector((state: RootState) => state.zapInput, shallowEqual);

  const sourceToken = useMemo(
    () =>
      selectedSourceToken ? config.tokens.get(selectedSourceToken) : undefined,
    [selectedSourceToken],
  );

  const destToken = useMemo(
    () =>
      selectedDestToken ? config.tokens.get(selectedDestToken) : undefined,
    [selectedDestToken],
  );

  const sourceZapAsset = useMemo(
    () =>
      selectedSourceToken && isZapPoolOrPositionTuple(selectedSourceToken)
        ? config.zapAssets.get(selectedSourceToken)
        : undefined,
    [selectedSourceToken],
  );

  const destZapAsset = useMemo(
    () =>
      selectedDestToken && isZapPoolOrPositionTuple(selectedDestToken)
        ? config.zapAssets.get(selectedDestToken)
        : undefined,
    [selectedDestToken],
  );

  return {
    sourceToken: sourceZapAsset || sourceToken,
    destToken: destZapAsset || destToken,
  };
};
