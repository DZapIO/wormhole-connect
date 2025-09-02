import type {
  Chain,
  Network,
  routes,
  amount as sdkAmount,
} from '@wormhole-foundation/sdk';

type Amount = sdkAmount.Amount;

export interface ZapProvider<P = any, T = any>
  extends routes.StaticRouteMethods<routes.RouteConstructor<any>> {
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
}

export interface ZapProviderConstructor<P = any, T = any>
  extends routes.RouteConstructor<any> {
  new (...args: any[]): ZapProvider<P, T>;
  isProviderSupported<N extends Network>(
    Network: N,
    chain: Chain,
    provider: string,
  ): boolean;
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
