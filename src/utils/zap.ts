import type { ChainConfig } from 'config';
import config from 'config';

export const getDefaultProtocol = (
  chainConfig?: ChainConfig,
  prevProtocol?: string | undefined,
) => {
  const chain = chainConfig ? chainConfig.sdkName : undefined;
  const protocols = Object.values(config.protocols);
  const supportedProviders = chain
    ? protocols.filter((protocol) => protocol.supportedChains.includes(chain))
    : undefined;

  if (
    prevProtocol &&
    supportedProviders?.some((protocol) => protocol.id === prevProtocol)
  ) {
    return prevProtocol;
  }
  return supportedProviders?.[0]?.id || undefined;
};

/**
 * Format APR for display
 */
export function getFormattedAPR(apr?: number | string): string {
  return apr && !isNaN(Number(apr)) ? `${Number(apr).toFixed(2)}%` : 'N/A';
}
