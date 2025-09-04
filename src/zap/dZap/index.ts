import {
  type HexString,
  type ZapPool,
  type ZapPoolsRequest,
  type ZapPoolsResponse,
  type ZapPosition,
  type ZapPositionsRequest,
  type ZapPositionsResponse,
} from '@dzapio/sdk';
import type { Chain, Network } from '@wormhole-foundation/sdk-connect';
import { amount } from '@wormhole-foundation/sdk-connect';
import axios from 'axios';
import { dZapConfig } from 'routes/dZap';
import { getChainId } from 'routes/dZap/utils';
import type {
  ZapDataProvider,
  ZapPoolData,
  ZapPositionData,
} from '../sdk/types';

type PoolD = ZapPool;
type PosD = ZapPosition;

export class DZapDataProvider implements ZapDataProvider<PoolD, PosD> {
  static meta = {
    name: 'DZap',
    provider: 'DZap',
  };

  async getPools(
    chain: Chain,
    protocol: string,
    limit?: number,
  ): Promise<ZapPoolData<PoolD>[]> {
    try {
      const chainId = getChainId(chain);
      if (!chainId) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const request: ZapPoolsRequest = {
        chainId,
        provider: protocol,
        limit: limit || 100,
      };

      const pools: ZapPoolsResponse = await dZapConfig.sdk.getZapPools(request);
      return pools.pools.map((pool) => this.mapZapPoolToPoolData(pool, chain));
    } catch (error) {
      this.handleError(error, 'getPools');
    }
  }

  async getPositions(
    chain: Chain,
    protocol: string,
    userAddress: string,
  ): Promise<ZapPositionData<PosD>[]> {
    try {
      const chainId = getChainId(chain);
      if (!chainId) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      const request: ZapPositionsRequest = {
        chainId,
        provider: protocol,
        account: userAddress as HexString,
      };

      const positions: ZapPositionsResponse =
        await dZapConfig.sdk.getZapPositions(request);
      return positions.positions.map((position) =>
        this.mapZapPositionToPositionData(
          position,
          userAddress as HexString,
          chain,
        ),
      );
    } catch (error) {
      this.handleError(error, 'getPositions');
    }
  }
  static isProtocolSupported<N extends Network>(
    Network: N,
    chain: Chain,
    protocol: string,
  ): boolean {
    return dZapConfig.isProviderSupported(Network, chain, protocol);
  }

  /**
   * Map dZap SDK ZapPool to our ZapPoolData format
   */
  private mapZapPoolToPoolData = (
    pool: ZapPool,
    chain: Chain,
  ): ZapPoolData<PoolD> => {
    return {
      address: pool.address,
      name: pool.name,
      symbol: pool.symbol,
      protocol: pool.provider,
      chain: chain,
      apr: pool.apr,
      tvl: pool.tvl ? parseFloat(pool.tvl) : undefined,
      decimals: pool.decimals,
      logo: pool.underlyingAssets?.[0]?.logo,
      details: pool,
      underlyingAssets: pool.underlyingAssets.map((asset) => ({
        address: asset.address,
        name: asset.name || '',
        symbol: asset.symbol || '',
        decimals: asset.decimals,
        logo: asset.logo || '',
      })),
    };
  };

  /**
   * Map dZap SDK ZapPosition to our ZapPositionData format
   */
  private mapZapPositionToPositionData = (
    position: ZapPosition,
    account: HexString,
    chain: Chain,
  ): ZapPositionData<PosD> => {
    return {
      address: position.address,
      name: position.name,
      symbol: position.name,
      protocol: position.provider,
      chain: chain,
      decimals: position.decimals,
      userAddress: account,
      amount: amount.fromBaseUnits(
        BigInt(position.amount || '0'),
        position.decimals,
      ),
      underlyingAssets: position.underlyingAssets.map((asset) => ({
        address: asset.address,
        name: asset.name || '',
        symbol: asset.symbol || '',
        decimals: asset.decimals,
        logo: asset.logo || '',
      })),
      logo: position.underlyingAssets?.[0]?.logo || '',
      amountUSD: position.amountUSD
        ? parseFloat(position.amountUSD)
        : undefined,
      details: position,
    };
  };

  /**
   * Handle errors from dZap SDK calls
   */
  private handleError(error: any, operation: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const data = error.response?.data;

      throw new Error(`${operation} failed: ${status} ${data}`);
    }
    throw new Error(`${operation} failed: ${error.message}`);
  }
}
