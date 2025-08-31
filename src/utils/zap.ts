import type { ZapChains } from '@dzapio/sdk';
import type { Chain } from '@wormhole-foundation/sdk';
import type { ChainConfig } from 'config';
import config from 'config';
import { getChainId } from './chainMapping';
import type { ZapQuoteResult } from 'hooks/zap/useFetchZapQuotes';
import { formatWithCommas } from './formatNumber';

export function getZapChainConfigs(
  supportedChains: Array<Chain>,
  chainToOmit?: Chain | undefined,
) {
  return config.chainsArr.filter((chain) => {
    if (!supportedChains.includes(chain.sdkName)) {
      return false;
    }
    const isChainOmitted = chainToOmit === chain.sdkName;
    return !isChainOmitted;
  });
}

export const getDefaultProvider = (
  zappingChains: ZapChains,
  chainConfig?: ChainConfig,
  prevProvider?: string | undefined,
) => {
  const chainId = chainConfig ? getChainId(chainConfig.sdkName) : undefined;
  console.log(chainId);
  const supportedProviders = chainId
    ? zappingChains[chainId]?.supportedProviders
    : undefined;
  if (prevProvider && supportedProviders?.includes(prevProvider)) {
    return prevProvider;
  }
  return supportedProviders?.[0] || undefined;
};

export const getZapPoolAmountUSD = (quote: ZapQuoteResult | undefined) => {
  if (!quote) {
    return null;
  }
  const path = quote.path;
  if (path && Array.isArray(path) && path.length > 0) {
    const lastPathItem = path[path.length - 1];
    const output = lastPathItem?.output;
    if (output && Array.isArray(output) && output.length > 0) {
      const amountUSD = output[0]?.amountUSD;
      return amountUSD ? formatWithCommas(amountUSD) : null;
    }
  }
};
