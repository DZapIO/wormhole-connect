import type {
  Chain,
  amount as sdkAmount,
  routes,
  Network,
  ChainContext,
} from '@wormhole-foundation/sdk';

type Amount = sdkAmount.Amount;

export type ZapProvider<P = any, T = any> = routes.StaticRouteMethods<
  routes.RouteConstructor<any>
> & {
  isSupportedProvider(provider: string, chain: Chain): boolean;
  getPools(
    chain: Chain,
    provider: string,
    limit?: number,
  ): Promise<ZapPoolData<P>[]>;
  getPositions(
    chain: Chain,
    provider: string,
    userAddress: string,
    limit?: number,
  ): Promise<ZapPositionData<T>[]>;
};

export interface ZapProviderConstructor<P = any, T = any> {
  new (...args: any[]): ZapProvider<P, T>;
  /** Details about the provider provided by the implementation */
  readonly meta: { name: string; provider: string };
  /** get the list of networks this provider supports */
  supportedNetworks(): Network[];
  /** get the list of chains this provider supports */
  supportedChains(network: Network): Chain[];
  /** get if the chain allows same-chain swaps */
  supportsSameChainSwaps?(network: Network, chain: Chain): boolean;
  /** check if the provider is supported for a given chain */
  isProtocolSupported<N extends Network>(chain: ChainContext<N>): boolean;
  // REMOVE these instance methods from here:
  // getPools, getPositions, isSupportedProvider
}

export interface ZapPoolData<D = any> {
  address: string;
  name: string;
  provider: string;
  symbol: string;
  chain: Chain;
  apr?: number;
  tvl?: number;
  decimals: number;
  logo?: string;
  details?: D;
}

export interface ZapPositionData<D = any> {
  address: string;
  name: string;
  symbol: string;
  provider: string;
  chain: Chain;
  decimals: number;
  userAddress: string;
  amount: Amount;
  logo?: string;
  amountUSD?: number;
  details?: D;
}

export class ZapProviderError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ZapProviderError';
  }
}

export class ZapNetworkError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ZapNetworkError';
  }
}

export class ZapRateLimitError extends Error {
  constructor(
    message: string,

    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'ZapRateLimitError';
  }
}
