import type { Chain } from '@wormhole-foundation/sdk';
import config from 'config';
import { DZapDataProvider } from './dZap';
import { ZapDataProvider } from './sdk/provider';
import type {
  ZapDataProviderConstructor,
  ZapPoolData,
  ZapPositionData,
} from './sdk/types';
import { getZapAssetKey, ZapAssetType } from 'config/zapAsset';

export interface ZapPoolResult {
  pools: ZapPoolData[];
  provider: string;
  chain: Chain;
  timestamp: Date;
}

export interface ZapPositionResult {
  positions: ZapPositionData[];
  provider: string;
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
  provider: string;
  limit?: number;
}

export interface ZapPositionParams {
  chain: Chain;
  provider: string;
  userAddress: string;
  limit?: number;
}

function getPositionKey(position: ZapPositionData): string {
  return getZapAssetKey(
    position.chain,
    position.address.toString(),
    ZapAssetType.POSITION,
    position.provider,
    position.details?.nftId,
  );
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

  async forEachZap<T>(callback: forEachCallback<T>): Promise<T[]> {
    return Promise.all(
      this.preference.map((name) => callback(name, this.zapRoutes[name])),
    );
  }

  async getPools(params: ZapPoolParams): Promise<ZapPoolResult> {
    const supported: Set<string> = new Set();
    const pools: ZapPoolData[] = [];

    await this.forEachZap(async (name, route) => {
      try {
        const zapPoolResults = await route.getPools(
          config.network,
          params.chain,
          params.provider,
        );

        for (const pool of zapPoolResults) {
          if (supported.has(pool.address.toLowerCase())) {
            continue;
          }
          supported.add(pool.address.toLowerCase());
          pools.push(pool);
        }
      } catch (e) {
        console.error('Error fetching pools', name, e);
      }
    });

    return {
      pools,
      provider: params.provider,
      chain: params.chain,
      timestamp: new Date(),
    };
  }

  async getPositions(params: ZapPositionParams): Promise<ZapPositionResult> {
    const supported: Set<string> = new Set();
    const positions: ZapPositionData[] = [];

    await this.forEachZap(async (name, route) => {
      try {
        const zapPositionResults = await route.getPositions(
          config.network,
          params.chain,
          params.provider,
          params.userAddress,
          params.limit,
        );

        for (const position of zapPositionResults) {
          if (supported.has(getPositionKey(position))) {
            continue;
          }
          supported.add(getPositionKey(position));
          positions.push(position);
        }
      } catch (e) {
        console.error('Error fetching positions', name, e);
      }
    });

    return {
      positions,
      provider: params.provider,
      chain: params.chain,
      userAddress: params.userAddress,
      timestamp: new Date(),
    };
  }
}
