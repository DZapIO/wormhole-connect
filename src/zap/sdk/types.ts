import type {
  Chain,
  Network,
  amount as sdkAmount,
} from '@wormhole-foundation/sdk';

type Amount = sdkAmount.Amount;

export interface ZapDataProvider<P = any, T = any> {
  getPools(
    chain: Chain,
    protocol: string,
    limit?: number,
  ): Promise<ZapPoolData<P>[]>;
  getPositions(
    chain: Chain,
    protocol: string,
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
  isProtocolSupported<N extends Network>(
    Network: N,
    chain: Chain,
    protocol: string,
  ): boolean;
}

export interface ZapPoolData<D = any> {
  address: string;
  name: string;
  protocol: string;
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
  protocol: string;
  chain: Chain;
  decimals: number;
  userAddress: string;
  amount: Amount;
  logo?: string;
  amountUSD?: number;
  details?: D;
}
