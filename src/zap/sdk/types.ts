import type {
  Chain,
  Network,
  amount as sdkAmount,
} from '@wormhole-foundation/sdk';

type Amount = sdkAmount.Amount;

export interface ZapDataProvider<P = any, T = any> {
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

export interface ZapDataProviderConstructor<P = any, T = any> {
  new (...args: any[]): ZapDataProvider<P, T>;
  readonly meta: {
    name: string;
    provider: string;
  };
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

export class ZapDataProviderError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ZapDataProviderError';
  }
}

export class ZapDataProviderNetworkError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ZapDataProviderNetworkError';
  }
}

export class ZapDataProviderRateLimitError extends Error {
  constructor(
    message: string,

    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'ZapDataProviderRateLimitError';
  }
}
