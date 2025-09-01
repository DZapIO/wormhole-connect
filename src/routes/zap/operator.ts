import type { Chain, routes } from '@wormhole-foundation/sdk';
import Routeperator, { DEFAULT_ROUTES } from 'routes/operator';
import { DZapRoute } from './providers/dZap';
import { ZapSDK } from './sdk';
import type {
  ZapPoolData,
  ZapPositionData,
  ZapProviderConstructor,
} from './types';

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
  preference: string[];
  providers: Record<string, ZapSDK>;
  providerClasses: Record<string, ZapProviderConstructor>;
  poolCache: ZapPoolCache;
  positionCache: ZapPositionCache;

  constructor(
    routesConfig: routes.RouteConstructor<any>[] = DEFAULT_ROUTES,
    providers: ZapProviderConstructor[] = DEFAULT_ZAP_PROVIDERS,
  ) {
    super(routesConfig);
    const providerMap = {};
    const providerClassMap = {};
    const preference: string[] = [];

    for (const zc of providers) {
      const name = zc.meta.name;
      if (name === '') {
        throw new Error(`Provider has empty name`);
      } else if (name in providerMap) {
        throw new Error(`Provider has duplicate name: ${name}`);
      }
      preference.push(name);
      providerMap[name] = new ZapSDK(zc);
      providerClassMap[name] = zc;
    }

    this.providers = providerMap;
    this.providerClasses = providerClassMap;
    this.preference = preference;
    this.poolCache = new ZapPoolCache();
    this.positionCache = new ZapPositionCache();
  }

  async getPools(
    providers: string[],
    params: ZapPoolParams,
  ): Promise<Record<string, ZapPoolResult>> {
    const results = await Promise.allSettled(
      providers.map((provider) => {
        const cachedResult = this.poolCache.get(provider, params);
        if (cachedResult) {
          return cachedResult;
        } else {
          return this.poolCache.fetch(
            provider,
            params,
            this.providers[provider],
          );
        }
      }),
    );

    // Convert the array of promise results to a providerName=>result map
    const poolResults = {};

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const result = results[i];
      if (result.status === 'rejected') {
        poolResults[provider] = {
          pools: [],
          provider,
          chain: params.chain,
          timestamp: new Date(),
          error: result.reason,
        };
      } else {
        poolResults[provider] = result.value;
      }
    }

    return poolResults;
  }

  async getPositions(
    providers: string[],
    params: ZapPositionParams,
  ): Promise<Record<string, ZapPositionResult>> {
    const results = await Promise.allSettled(
      providers.map((provider) => {
        const cachedResult = this.positionCache.get(provider, params);
        if (cachedResult) {
          return cachedResult;
        } else {
          return this.positionCache.fetch(
            provider,
            params,
            this.providers[provider],
          );
        }
      }),
    );

    // Convert the array of promise results to a providerName=>result map
    const positionResults = {};

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const result = results[i];
      if (result.status === 'rejected') {
        positionResults[provider] = {
          positions: [],
          provider,
          chain: params.chain,
          userAddress: params.userAddress,
          timestamp: new Date(),
          error: result.reason,
        };
      } else {
        positionResults[provider] = result.value;
      }
    }

    return positionResults;
  }
}

// Cache for pool results
class ZapPoolCache {
  cache: Record<string, ZapPoolCacheEntry>;
  pending: Record<string, ZapPoolPromiseHandlers[]>;

  constructor() {
    this.cache = {};
    this.pending = {};
  }

  poolParamsKey(providerName: string, params: ZapPoolParams): string {
    return `${providerName}:${params.chain}:${params.provider}:${
      params.limit || 'default'
    }`;
  }

  get(providerName: string, params: ZapPoolParams): ZapPoolResult | null {
    const key = this.poolParamsKey(providerName, params);
    const cachedVal = this.cache[key];
    if (cachedVal) {
      if (cachedVal.ttl() > 5) {
        return cachedVal.result;
      } else {
        delete this.cache[key];
      }
    }

    return null;
  }

  async fetch(
    providerName: string,
    params: ZapPoolParams,
    provider: ZapSDK,
  ): Promise<ZapPoolResult> {
    console.debug('Fetching pools', providerName, params);

    const key = this.poolParamsKey(providerName, params);
    const pending = this.pending[key];
    if (pending) {
      // We already have a pending request for this key, so don't create a new one.
      // Instead, subscribe to its result when it resolves
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    } else {
      // Initialize list of promises awaiting this result
      const returnPromise: Promise<ZapPoolResult> = new Promise(
        (resolve, reject) => {
          this.pending[key] = [{ resolve, reject }];
        },
      );

      // We don't yet have a pending request for this key, so initiate one
      provider
        .getPools(params.chain, params.provider, params.limit)
        .then((pools: any[]) => {
          const pending = this.pending[key];
          const result: ZapPoolResult = {
            pools,
            provider: params.provider,
            chain: params.chain,
            timestamp: new Date(),
          };

          for (const { resolve } of pending) {
            resolve(result);
          }
          delete this.pending[key];

          console.debug(`Fetched pools`, providerName, result);

          this.cache[key] = new ZapPoolCacheEntry(result);
        })
        .catch((err: any) => {
          console.debug(`Error fetching pools`, providerName, err);
          const pending = this.pending[key];
          for (const { reject } of pending) {
            reject(err);
          }
          delete this.pending[key];

          // Cache uncaught error
          this.cache[key] = new ZapPoolCacheEntry({
            pools: [],
            provider: params.provider,
            chain: params.chain,
            timestamp: new Date(),
          });
        });

      return returnPromise;
    }
  }
}

// Cache for position results
class ZapPositionCache {
  cache: Record<string, ZapPositionCacheEntry>;
  pending: Record<string, ZapPositionPromiseHandlers[]>;

  constructor() {
    this.cache = {};
    this.pending = {};
  }

  positionParamsKey(providerName: string, params: ZapPositionParams): string {
    return `${providerName}:${params.chain}:${params.provider}:${
      params.userAddress
    }:${params.limit || 'default'}`;
  }

  get(
    providerName: string,
    params: ZapPositionParams,
  ): ZapPositionResult | null {
    const key = this.positionParamsKey(providerName, params);
    const cachedVal = this.cache[key];
    if (cachedVal) {
      if (cachedVal.ttl() > 5) {
        return cachedVal.result;
      } else {
        delete this.cache[key];
      }
    }

    return null;
  }

  async fetch(
    providerName: string,
    params: ZapPositionParams,
    provider: ZapSDK,
  ): Promise<ZapPositionResult> {
    console.debug('Fetching positions', providerName, params);

    const key = this.positionParamsKey(providerName, params);
    const pending = this.pending[key];
    if (pending) {
      // We already have a pending request for this key, so don't create a new one.
      // Instead, subscribe to its result when it resolves
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    } else {
      // Initialize list of promises awaiting this result
      const returnPromise: Promise<ZapPositionResult> = new Promise(
        (resolve, reject) => {
          this.pending[key] = [{ resolve, reject }];
        },
      );

      // We don't yet have a pending request for this key, so initiate one
      provider
        .getPositions(
          params.chain,
          params.provider,
          params.userAddress,
          params.limit,
        )
        .then((positions: any[]) => {
          const pending = this.pending[key];
          const result: ZapPositionResult = {
            positions,
            provider: params.provider,
            chain: params.chain,
            userAddress: params.userAddress,
            timestamp: new Date(),
          };

          for (const { resolve } of pending) {
            resolve(result);
          }
          delete this.pending[key];

          console.debug(`Fetched positions`, providerName, result);

          this.cache[key] = new ZapPositionCacheEntry(result);
        })
        .catch((err: any) => {
          console.debug(`Error fetching positions`, providerName, err);
          const pending = this.pending[key];
          for (const { reject } of pending) {
            reject(err);
          }
          delete this.pending[key];

          // Cache uncaught error
          this.cache[key] = new ZapPositionCacheEntry({
            positions: [],
            provider: params.provider,
            chain: params.chain,
            userAddress: params.userAddress,
            timestamp: new Date(),
          });
        });

      return returnPromise;
    }
  }
}

interface ZapPoolPromiseHandlers {
  resolve: (result: ZapPoolResult) => void;
  reject: (err: Error) => void;
}

interface ZapPositionPromiseHandlers {
  resolve: (result: ZapPositionResult) => void;
  reject: (err: Error) => void;
}

class ZapPoolCacheEntry {
  result: ZapPoolResult;
  timestamp: Date;

  constructor(result: ZapPoolResult) {
    this.result = result;
    this.timestamp = new Date();
  }

  // Number of seconds this result is still valid for before we should fetch a new one
  expires(): Date {
    // Cache pool results for 5 minutes
    return new Date(this.timestamp.valueOf() + 5 * 60 * 1000);
  }

  // TTL in seconds before result expires
  ttl(): number {
    return (this.expires().valueOf() - Date.now().valueOf()) / 1000;
  }
}

class ZapPositionCacheEntry {
  result: ZapPositionResult;
  timestamp: Date;

  constructor(result: ZapPositionResult) {
    this.result = result;
    this.timestamp = new Date();
  }

  // Number of seconds this result is still valid for before we should fetch a new one
  expires(): Date {
    // Cache position results for 2 minutes (more dynamic than pools)
    return new Date(this.timestamp.valueOf() + 2 * 60 * 1000);
  }

  // TTL in seconds before result expires
  ttl(): number {
    return (this.expires().valueOf() - Date.now().valueOf()) / 1000;
  }
}
