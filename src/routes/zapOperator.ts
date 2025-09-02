import type { Chain, routes } from '@wormhole-foundation/sdk';
import config from 'config';
import Routeperator, { DEFAULT_ROUTES } from 'routes/operator';
import { DZapRoute } from './dZap';
import { ZapSDK } from './sdkZap/route';
import type {
  ZapPoolData,
  ZapPositionData,
  ZapProviderConstructor,
} from './sdkZap/types';

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

type forEachCallback<T> = (name: string, route: ZapSDK) => T;

export const DEFAULT_ZAP_PROVIDERS = [
  // Add providers here as they are implemented
  DZapRoute,
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

export default class ZapOperator extends Routeperator {
  zapRoutes: Record<string, ZapSDK>;

  constructor(
    routesConfig: routes.RouteConstructor<any>[] = DEFAULT_ROUTES,
    zapRoutes: ZapProviderConstructor[] = DEFAULT_ZAP_PROVIDERS,
  ) {
    super(routesConfig);
    const providerMap = {};
    const providerClassMap = {};

    for (const zc of zapRoutes) {
      const name = zc.meta.name;
      if (name === '') {
        throw new Error(`Provider has empty name`);
      } else if (name in providerMap) {
        throw new Error(`Provider has duplicate name: ${name}`);
      }
      providerMap[name] = new ZapSDK(zc);
      providerClassMap[name] = zc;
    }

    this.zapRoutes = providerMap;
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
          if (supported.has(position.address.toLowerCase())) {
            continue;
          }
          supported.add(position.address.toLowerCase());
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
