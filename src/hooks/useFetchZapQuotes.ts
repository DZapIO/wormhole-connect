import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';
import type { RootState } from 'store';
import type {
  HexString,
  ZapPath,
  ZapQuoteRequest,
  ZapQuoteResponse,
} from '@dzapio/sdk';
import { useZap } from 'contexts/ZapContext';
import type { ZapAsset } from 'config/zapAsset';
import { getChainId } from 'utils/chainMapping';
import type { Token } from 'config/tokens';

export type ZapQuoteParams = {
  amount?: sdkAmount.Amount;
  sourceChain?: Chain;
  sourceToken?: ZapAsset | Token;
  destChain?: Chain;
  destToken?: ZapAsset | Token;
  slippage: number;
  recipient?: string;
  refundee?: string;
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
};

export type ZapQuoteResult = {
  success: boolean;
  amountOut?: string;
  approvalData?: {
    callTo: string;
    approveTo: string;
    amount: string;
  } | null;
  path?: ZapPath[];
  error?: string;
  expires?: Date;
};

type HookReturn = {
  quote: ZapQuoteResult | undefined;
  isFetchingInitialQuotes: boolean;
};

const useFetchZapQuotes = (params: ZapQuoteParams): HookReturn => {
  const [nonce, setNonce] = useState(new Date().valueOf());
  const refreshTimeout = useRef<undefined | ReturnType<typeof setTimeout>>(
    undefined,
  );
  const [isFetchingInitialQuotes, setIsFetchingInitialQuotes] = useState(false);
  const [quote, setQuote] = useState<ZapQuoteResult | undefined>(undefined);
  const [isVisible, setIsVisible] = useState(true);

  const { isTransactionInProgress } = useSelector(
    (state: RootState) => state.zapInput,
  );

  // Get SDK client instance from context
  const { sdk } = useZap();

  useEffect(() => {
    const visibilityHandler = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  // Main quote fetching effect
  useEffect(() => {
    let unmounted = false;
    const cleanup = () => {
      unmounted = true;
    };

    if (
      !params.sourceChain ||
      !params.sourceToken ||
      !params.destChain ||
      !params.destToken ||
      !params.amount ||
      !params.recipient
    ) {
      // Clear quote if we are missing any inputs
      setQuote(undefined);
      setIsFetchingInitialQuotes(false);
      return cleanup;
    }

    if (isTransactionInProgress || !isVisible) {
      // Leave quote alone if the user initiated a transfer,
      // or if the tab is not visible.
      return cleanup;
    }

    // Let the hook caller know when we are fetching for the first time
    if (!quote) {
      setIsFetchingInitialQuotes(true);
    }

    const fetchZapQuotes = async () => {
      try {
        if (!params.sourceChain || !params.destChain) {
          throw new Error('Source and destination chains are required');
        }

        const srcChainId = getChainId(params.sourceChain);
        const destChainId = getChainId(params.destChain);

        if (!srcChainId || !destChainId) {
          throw new Error('Unsupported chain');
        }

        const zapQuoteRequest: ZapQuoteRequest = {
          srcToken: (params.sourceToken?.address as HexString) ?? '',
          srcChainId,
          destToken: (params.destToken?.address as HexString) ?? '',
          destChainId,
          recipient: params.recipient as HexString,
          refundee:
            (params.refundee as HexString) || (params.recipient as HexString),
          slippage: params.slippage,
          account: params.recipient as HexString,
          amount: params.amount?.amount.toString() ?? '',
          positionDetails: params.positionDetails,
          poolDetails: params.poolDetails,
          allowedBridges: params.allowedBridges,
          allowedDexes: params.allowedDexes,
        };

        const response: ZapQuoteResponse = await sdk.getZapQuote(
          zapQuoteRequest,
        );

        const quoteResult: ZapQuoteResult = {
          success: true,
          amountOut: response.amountOut,
          approvalData: response.approvalData,
          path: response.path,
          expires: new Date(Date.now() + 65_000), // 65 seconds from now (1 min refresh with 5s buffer)
        };

        if (!unmounted) {
          setQuote(quoteResult);
          setIsFetchingInitialQuotes(false);
        }
      } catch (error) {
        const errorResult: ZapQuoteResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        if (!unmounted) {
          setQuote(errorResult);
          setIsFetchingInitialQuotes(false);
        }
      }
    };

    fetchZapQuotes();

    return cleanup;
    // Note: 'quote' is intentionally excluded to prevent infinite refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nonce,
    params.amount,
    params.slippage,
    params.recipient,
    isVisible,
    sdk,
    isTransactionInProgress,
    params.allowedBridges,
    params.allowedDexes,
    params.destChain,
    params.destToken,
    params.poolDetails,
    params.positionDetails,
    params.refundee,
    params.sourceChain,
    params.sourceToken,
  ]);

  // Quote expiry management
  useEffect(() => {
    // Determine when the quote expires
    let timeTilNextFetch = 0;

    if (quote?.expires) {
      // Fetch again 5 seconds before the expiry
      timeTilNextFetch = quote.expires.valueOf() - Date.now() - 5_000;
    }

    if (!timeTilNextFetch || timeTilNextFetch <= 0) {
      return;
    }

    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }

    console.debug(
      `Waiting ${timeTilNextFetch / 1000}s until next zap quote fetch`,
      params,
    );

    refreshTimeout.current = setTimeout(
      () => setNonce(Date.now()),
      timeTilNextFetch,
    );

    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
    };
  }, [quote, params]);

  return {
    quote,
    isFetchingInitialQuotes,
  };
};

export default useFetchZapQuotes;
