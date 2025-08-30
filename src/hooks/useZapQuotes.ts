import { useMemo } from 'react';
import type { amount, Chain } from '@wormhole-foundation/sdk';
import useFetchZapQuotes from 'hooks/useFetchZapQuotes';
import type { ZapQuoteParams, ZapQuoteResult } from 'hooks/useFetchZapQuotes';
import type { ZapAsset } from 'config/zapAsset';
import type { WalletData } from 'store/wallet';
import type { Token } from 'config/tokens';

type HookReturn = {
  quote: ZapQuoteResult | undefined;
  isFetching: boolean;
};

interface UseSortedZapQuotesArgs {
  amount?: amount.Amount;
  fromChain?: Chain;
  toChain?: Chain;
  slippage: number;
  sourceToken?: ZapAsset | Token;
  destToken?: ZapAsset | Token;
  receivingWallet: WalletData;
  positionDetails?: {
    nftId: string;
  };
  poolDetails?: {
    lowerTick: number;
    upperTick: number;
    metadata?: unknown;
  };
  allowedBridges?: string[];
  allowedDexes?: string[];
}

export const useZapQuotes = ({
  amount,
  fromChain,
  toChain,
  slippage,
  sourceToken,
  destToken,
  receivingWallet,
  positionDetails,
  poolDetails,
  allowedBridges,
  allowedDexes,
}: UseSortedZapQuotesArgs): HookReturn => {
  const quoteParams: ZapQuoteParams = useMemo(
    () => ({
      amount,
      sourceChain: fromChain,
      sourceToken,
      destChain: toChain,
      destToken,
      slippage,
      recipient: receivingWallet?.address,
      refundee: receivingWallet?.address,
      positionDetails,
      poolDetails,
      allowedBridges,
      allowedDexes,
    }),
    [
      amount,
      fromChain,
      sourceToken,
      destToken,
      toChain,
      slippage,
      receivingWallet?.address,
      positionDetails,
      poolDetails,
      allowedBridges,
      allowedDexes,
    ],
  );

  const { quote, isFetchingInitialQuotes: isFetching } =
    useFetchZapQuotes(quoteParams);

  console.log({ quote, isFetching });

  return {
    quote,
    isFetching,
  };
};
