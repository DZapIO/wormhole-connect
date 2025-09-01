import type { ZapQuoteResponse } from '@dzapio/sdk';
import type { Chain } from '@wormhole-foundation/sdk';
import type { ChainConfig } from 'config';
import config from 'config';
import { getChainId } from './chainMapping';
import { getUSDFormat } from 'utils';

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
  chainConfig?: ChainConfig,
  prevProvider?: string | undefined,
) => {
  const chainId = chainConfig ? getChainId(chainConfig.sdkName) : undefined;
  const protocols = Object.values(config.protocols);
  console.log(chainId);
  const supportedProviders = chainId
    ? protocols.filter((protocol) =>
        protocol.supportedChainIds.includes(chainId),
      )
    : undefined;

  if (
    prevProvider &&
    supportedProviders?.some((protocol) => protocol.id === prevProvider)
  ) {
    return prevProvider;
  }
  return supportedProviders?.[0]?.id || undefined;
};

export const getZapPoolAmountUSD = (quote: ZapQuoteResponse | undefined) => {
  if (!quote) {
    return null;
  }
  const path = quote.path;
  if (path && Array.isArray(path) && path.length > 0) {
    const lastPathItem = path[path.length - 1];
    const output = lastPathItem?.output;
    if (output && Array.isArray(output) && output.length > 0) {
      const amountUSD = output[0]?.amountUSD;
      return amountUSD ? getUSDFormat(parseFloat(amountUSD)) : null;
    }
  }
  return null;
};
