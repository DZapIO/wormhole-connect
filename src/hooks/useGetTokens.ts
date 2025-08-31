import config from 'config';
import type { Token } from 'config/tokens';
import type { RootState } from 'store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isZapPoolOrPositionTuple } from 'config/zapAsset';

export const useGetTokens = (): {
  sourceToken: Token | undefined;
  destToken: Token | undefined;
} => {
  const { token: sourceTokenTuple, destToken: destTokenTuple } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const sourceToken = useMemo(
    () => (sourceTokenTuple ? config.tokens.get(sourceTokenTuple) : undefined),
    [sourceTokenTuple],
  );

  const destToken = useMemo(
    () => (destTokenTuple ? config.tokens.get(destTokenTuple) : undefined),
    [destTokenTuple],
  );

  return { sourceToken, destToken };
};

export const useGetRedeemTokens = (): {
  sourceToken: Token | undefined;
  destToken: Token | undefined;
} => {
  const { txData } = useSelector((state: RootState) => state.redeem);

  const sourceToken = useMemo(
    () => (txData?.token ? config.tokens.get(txData?.token) : undefined),
    [txData],
  );

  const destToken = useMemo(
    () =>
      txData?.receivedToken
        ? config.tokens.get(txData?.receivedToken)
        : undefined,
    [txData],
  );

  const sourceZapAsset = useMemo(
    () =>
      txData?.token && isZapPoolOrPositionTuple(txData?.token)
        ? config.zapAssets.get(txData?.token)
        : undefined,
    [txData],
  );

  const destZapAsset = useMemo(
    () =>
      txData?.receivedToken && isZapPoolOrPositionTuple(txData?.receivedToken)
        ? config.zapAssets.get(txData?.receivedToken)
        : undefined,
    [txData],
  );

  return {
    sourceToken: sourceZapAsset || sourceToken,
    destToken: destZapAsset || destToken,
  };
};
