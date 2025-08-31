import type { Token } from 'config/tokens';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import { getTokenFromTuple } from 'utils/tokens';

export const useGetTokens = (): {
  sourceToken: Token | undefined;
  destToken: Token | undefined;
} => {
  const { token: sourceTokenTuple, destToken: destTokenTuple } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const sourceToken = useMemo(
    () => (sourceTokenTuple ? getTokenFromTuple(sourceTokenTuple) : undefined),
    [sourceTokenTuple],
  );

  const destToken = useMemo(
    () => (destTokenTuple ? getTokenFromTuple(destTokenTuple) : undefined),
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
    () => (txData?.token ? getTokenFromTuple(txData?.token) : undefined),
    [txData],
  );

  const destToken = useMemo(
    () =>
      txData?.receivedToken
        ? getTokenFromTuple(txData?.receivedToken)
        : undefined,
    [txData],
  );

  return {
    sourceToken,
    destToken,
  };
};
