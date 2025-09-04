import type { Chain } from '@wormhole-foundation/sdk-connect';
import config from 'config';
import { getZapAssetKey } from 'config/zapAsset';
import { DZapDataProvider } from './dZap';
import { ZapDataProvider } from './sdk/provider';
import type {
  ZapDataProviderConstructor,
  ZapPoolData,
  ZapPositionData,
} from './sdk/types';

export interface ZapPoolResult {
  pools: ZapPoolData[];
  protocol: string;
  chain: Chain;
  timestamp: Date;
}

export interface ZapPositionResult {
  positions: ZapPositionData[];
  protocol: string;
  chain: Chain;
  userAddress: string;
  timestamp: Date;
}

type forEachCallback<T> = (name: string, route: ZapDataProvider) => T;

export const DEFAULT_ZAP_PROVIDERS = [
  // Add providers here as they are implemented
  DZapDataProvider,
];

export interface ZapPoolParams {
  chain: Chain;
  protocol: string;
  limit?: number;
}

export interface ZapPositionParams {
  chain: Chain;
  protocol: string;
  userAddress: string;
}

function getPositionKey(position: ZapPositionData): string {
  return getZapAssetKey(
    position.chain,
    position.address.toString(),
    position.protocol,
    position.details?.nftId,
  );
}

function getPoolKey(pool: ZapPoolData): string {
  return getZapAssetKey(pool.chain, pool.address.toString(), pool.protocol);
}

export default class ZapDataAggregator {
  zapRoutes: Record<string, ZapDataProvider>;
  preference: string[];

  constructor(zapRoutes: ZapDataProviderConstructor[] = DEFAULT_ZAP_PROVIDERS) {
    const providerMap = {};
    const providerClassMap = {};
    const preference: string[] = [];

    for (const zc of zapRoutes) {
      const name = zc.meta.name;
      if (name === '') {
        throw new Error(`Provider has empty name`);
      } else if (name in providerMap) {
        throw new Error(`Provider has duplicate name: ${name}`);
      }
      providerMap[name] = new ZapDataProvider(zc);
      providerClassMap[name] = zc;
      preference.push(name);
    }

    this.zapRoutes = providerMap;
    this.preference = preference;
  }

  async forEach<T>(callback: forEachCallback<T>): Promise<T[]> {
    return Promise.all(
      this.preference.map((name) => callback(name, this.zapRoutes[name])),
    );
  }

  async getPools(params: ZapPoolParams): Promise<ZapPoolResult> {
    const supported: Set<string> = new Set();
    const pools: ZapPoolData[] = [];

    await this.forEach(async (name, route) => {
      try {
        if (
          !route.isDataProviderSupported(
            config.network,
            params.chain,
            params.protocol,
          )
        ) {
          return;
        }
        const zapPoolResults = await route.getPools(
          config.network,
          params.chain,
          params.protocol,
          params.limit,
        );

        for (const pool of zapPoolResults) {
          const key = getPoolKey(pool);
          if (supported.has(key)) {
            continue;
          }
          supported.add(key);
          pools.push(pool);
        }
      } catch (e) {
        console.error('Error fetching pools', name, e);
      }
    });

    return {
      pools,
      protocol: params.protocol,
      chain: params.chain,
      timestamp: new Date(),
    };
  }

  async getPositions(params: ZapPositionParams): Promise<ZapPositionResult> {
    const supported: Set<string> = new Set();
    const positions: ZapPositionData[] = [];

    await this.forEach(async (name, route) => {
      try {
        if (
          !route.isDataProviderSupported(
            config.network,
            params.chain,
            params.protocol,
          )
        ) {
          return;
        }
        const zapPositionResults = await route.getPositions(
          config.network,
          params.chain,
          params.protocol,
          params.userAddress,
        );

        for (const position of zapPositionResults) {
          const key = getPositionKey(position);
          if (supported.has(key)) {
            continue;
          }
          supported.add(key);
          positions.push(position);
        }
      } catch (e) {
        console.error('Error fetching positions', name, e);
      }
    });

    return {
      positions,
      protocol: params.protocol,
      chain: params.chain,
      userAddress: params.userAddress,
      timestamp: new Date(),
    };
  }
}
