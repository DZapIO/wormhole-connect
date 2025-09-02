import type { ZapPool, ZapPosition, ZapUnderlyingToken } from '@dzapio/sdk';
import type { Chain, TokenId, amount } from '@wormhole-foundation/sdk';
import { isChain, UniversalAddress } from '@wormhole-foundation/sdk';
import type { ZapPoolData, ZapPositionData } from 'routes/sdkZap';
import type { TokenJson, TokenTuple } from './tokens';
import {
  Token,
  tokenIdFromTuple,
  TokenIdLazy,
  tokenIdToTuple,
  TokenMapping,
} from './tokens';
import type { TokenIcon, WrappedTokenAddresses } from './types';
// Import types from the actual dzapio/sdk
export type {
  ZapChains,
  ZapPool,
  ZapPoolDetails,
  ZapPoolDetailsRequest,
  ZapPoolsRequest,
  ZapPosition,
  ZapPositionsRequest,
} from '@dzapio/sdk';

export type ZapTokenInfo = {
  type: ZapAssetType;
  provider: string;
  underlyingAssets: ZapUnderlyingToken[];
  apr: number;
  tvl?: string;
};

export type ZapPositionDetails = {
  amount: amount.Amount;
  amountUSD: string;
  nftId?: string;
};

// Asset type enum for UI purposes
export enum ZapAssetType {
  POOL = 'pool',
  POSITION = 'position',
}

// Union type for zap data (positions or pools from SDK)
export type ZapData = ZapPosition | ZapPool;

const getZapAssetFieldsFromTupleKey = (key: string) => {
  const [address, type, provider, nftId] = key.split('/');
  return { address, type, provider, nftId };
};

const getTupleKeyFromZapAssetFields = (fields: {
  address: string;
  type?: ZapAssetType;
  provider?: string;
  nftId?: string;
}) => {
  const parts: string[] = [fields.address];
  if (fields.type) {
    parts.push(fields.type);
  }
  if (fields.provider) {
    parts.push(fields.provider);
  }
  if (fields.nftId) {
    parts.push(fields.nftId);
  }
  return parts.join('/');
};

export function getZapAssetFromPool(pool: ZapPoolData): ZapAsset {
  return new ZapAsset(
    pool.chain,
    pool.address,
    pool.decimals,
    pool.name,
    pool.symbol,
    pool.logo || '',
    undefined,
    undefined,
    {
      type: ZapAssetType.POOL,
      provider: pool.provider,
      underlyingAssets: pool.details?.underlyingAssets || [],
      apr: pool.apr ?? 0,
      tvl: pool.tvl?.toString(),
    },
  );
}

export function getZapAssetFromPosition(position: ZapPositionData): ZapAsset {
  return new ZapAsset(
    position.chain,
    position.address,
    position.decimals,
    position.name,
    position.name,
    position.logo || '',
    undefined,
    undefined,
    {
      type: ZapAssetType.POSITION,
      provider: position.provider,
      underlyingAssets: position.details?.underlyingAssets || [],
      apr: position.details?.apr ?? 0,
    },
    {
      amount: position.amount,
      amountUSD: position.amountUSD?.toString() || '',
      nftId: position.details?.nftId,
    },
  );
}

export function isZapPoolOrPositionTuple(tuple: any): tuple is TokenTuple {
  if (!Array.isArray(tuple) || tuple.length !== 2 || !isChain(tuple[0])) {
    return false;
  }
  const [, key] = tuple;
  const { type } = getZapAssetFieldsFromTupleKey(key);
  return type === ZapAssetType.POSITION || type === ZapAssetType.POOL;
}

// Type guards for SDK data
export function isZapPosition(asset: TokenTuple) {
  const [, key] = asset;
  const { type } = getZapAssetFieldsFromTupleKey(key);
  return type === ZapAssetType.POSITION;
}

export function isZapPool(asset: TokenTuple) {
  const [, key] = asset;
  const { type } = getZapAssetFieldsFromTupleKey(key);
  return type === ZapAssetType.POOL;
}

export function getZapAssetTuple(zapAsset: ZapAsset): TokenTuple {
  const zapAssetKey = getTupleKeyFromZapAssetFields({
    address: zapAsset.addressString,
    ...zapAsset.zapTokenInfo,
  });

  return [zapAsset.chain, zapAssetKey];
}

export function getTupleFromZapAssetId(zapAssetId: ZapAssetId): TokenTuple {
  const key = getTupleKeyFromZapAssetFields({
    ...zapAssetId,
    address: zapAssetId.address.toString(),
  });

  return [zapAssetId.chain, key];
}

export function getZapAssetIdFromTuple(tuple: TokenTuple): ZapAssetId {
  const [chain, key] = tuple;
  const { type, provider, nftId, address } = getZapAssetFieldsFromTupleKey(key);
  return {
    address: new UniversalAddress(address),
    chain,
    type: type as ZapAssetType,
    provider,
    nftId,
  };
}

export function isSameZapAsset(a: ZapAsset, b: ZapAsset): boolean {
  return (
    a.chain === b.chain &&
    a.addressString === b.addressString &&
    a.zapTokenInfo?.type === b.zapTokenInfo?.type &&
    a.zapTokenInfo?.provider === b.zapTokenInfo?.provider &&
    a.zapPositionDetails?.nftId === b.zapPositionDetails?.nftId
  );
}

// Cache interfaces
export interface ZapPositionsCache {
  positions: ZapPosition[];
  timestamp: Date;
}

export interface ZapPoolsCache {
  pools: ZapPool[];
  timestamp: Date;
}

// Check if localStorage is available
const HAS_LOCALSTORAGE = typeof Storage !== 'undefined';

// Cache version for versioning
const ZAP_CACHE_VERSION = 1;

export function getZapAssetKey(
  chain: Chain,
  address: string,
  type?: ZapAssetType,
  provider?: string,
  nftId?: string,
): string {
  return JSON.stringify([
    chain,
    getTupleKeyFromZapAssetFields({
      address,
      type,
      provider,
      nftId,
    }),
  ]);
}

export function parseZapAssetKey(key: string): ZapAssetId {
  const tuple = JSON.parse(key) as TokenTuple;
  return getZapAssetIdFromTuple(tuple);
}

// JSON interface for ZapAsset serialization
interface ZapAssetJson extends TokenJson {
  zapTokenInfo?: ZapTokenInfo;
  zapPositionDetails?: ZapPositionDetails;
}

export type ZapAssetId = TokenId & {
  type?: ZapAssetType;
  provider?: string;
  nftId?: string;
};
export class ZapAsset extends Token {
  zapTokenInfo?: ZapTokenInfo;
  zapPositionDetails?: ZapPositionDetails;

  constructor(
    chain: Chain,
    address: string,
    decimals: number,
    symbol: string,
    name?: string,
    icon?: TokenIcon | string,
    tokenBridgeOriginalTokenId?: TokenId,
    coingeckoId?: string,
    zapTokenInfo?: ZapTokenInfo,
    zapPositionDetails?: ZapPositionDetails,
  ) {
    super(
      chain,
      address,
      decimals,
      symbol,
      name,
      icon,
      tokenBridgeOriginalTokenId,
      coingeckoId,
    );
    this.zapTokenInfo = zapTokenInfo;
    this.zapPositionDetails = zapPositionDetails;
  }

  get key(): string {
    return getZapAssetKey(
      this.chain,
      this.addressString,
      this.zapTokenInfo?.type,
      this.zapTokenInfo?.provider,
      this.zapPositionDetails?.nftId,
    );
  }

  get tuple(): TokenTuple {
    return [
      this.chain,
      getTupleKeyFromZapAssetFields({
        address: this.addressString,
        type: this.zapTokenInfo?.type,
        provider: this.zapTokenInfo?.provider,
        nftId: this.zapPositionDetails?.nftId,
      }),
    ];
  }

  equals(other: ZapAsset): boolean {
    return isSameZapAsset(this, other);
  }

  get tokenId(): ZapAssetId {
    return {
      chain: this.chain,
      address: this.address,
      nftId: this.zapPositionDetails?.nftId,
      provider: this.zapTokenInfo?.provider,
      type: this.zapTokenInfo?.type,
    };
  }

  toJson(): ZapAssetJson {
    return {
      chain: this.chain,
      address: this.addressString,
      decimals: this.decimals,
      symbol: this.symbol,
      name: this.name ?? '',
      icon: this.icon ? (this.icon as string) : '',
      tokenBridgeOriginalTokenId: this.tokenBridgeOriginalTokenId
        ? tokenIdToTuple(this.tokenBridgeOriginalTokenId)
        : undefined,
      coingeckoWebId: this.coingeckoWebId,
      zapTokenInfo: this.zapTokenInfo,
      zapPositionDetails: this.zapPositionDetails,
    };
  }

  static fromJson({
    chain,
    address,
    decimals,
    symbol,
    name,
    icon,
    tokenBridgeOriginalTokenId,
    coingeckoWebId,
    zapTokenInfo,
    zapPositionDetails,
  }: ZapAssetJson) {
    return new ZapAsset(
      chain as Chain,
      address,
      decimals,
      symbol,
      name,
      icon === '' ? undefined : icon,
      tokenBridgeOriginalTokenId
        ? tokenIdFromTuple(tokenBridgeOriginalTokenId)
        : undefined,
      coingeckoWebId,
      zapTokenInfo,
      zapPositionDetails,
    );
  }
}

export class ZapAssetMapping<T> extends TokenMapping<T> {
  add(token: ZapAssetId, value: T) {
    if (!this._mapping.has(token.chain)) {
      this._mapping.set(token.chain, new Map());
    }

    const key = getTupleKeyFromZapAssetFields({
      address: token.address.toString(),
      type: token.type,
      provider: token.provider,
      nftId: token.nftId,
    });

    this._mapping.get(token.chain)!.set(key, value);
    this.lastUpdate = new Date();
    this.size += 1;
  }

  get(key: string): T | undefined;
  get(tokenId: ZapAssetId): T | undefined;
  get(tokenTuple: TokenTuple): T | undefined;
  get(chain: Chain, address: string): T | undefined;
  get(
    firstArg: Chain | string | ZapAssetId | TokenTuple,
    address?: string,
  ): T | undefined {
    if (
      typeof firstArg === 'string' &&
      typeof address === 'string' &&
      isChain(firstArg)
    ) {
      const key = getZapAssetKey(firstArg, address);
      return this._mapping.get(firstArg)?.get(key);
    } else if (firstArg instanceof TokenIdLazy) {
      // Doing the instanceof TokenIdLazy check before isTokenId() is important here for perf reasons.
      // All we need is the stringified address. TokenIdLazy is optimized for that.
      // The Wormhole SDK's TokenId is not.
      //
      // Both a TokenIdLazy and vanilla TokenId will pass the isTokenId check. So we catch the lazy version
      // first, otherwise we will isTokenId will parse the TokenIdLazy's addressString and then we will
      // immediately re-stringifiy it.
      //
      // It's weird but it speeds up token cache operations a lot.
      return this._mapping.get(firstArg.chain)?.get(firstArg.addressString);
    } else if (isZapAssetId(firstArg)) {
      return this._mapping
        .get(firstArg.chain)
        ?.get(firstArg.address.toString());
    } else if (isZapPoolOrPositionTuple(firstArg)) {
      return this._mapping.get(firstArg[0] as Chain)?.get(firstArg[1]);
    } else {
      const tokenId = parseZapAssetKey(firstArg);
      return this._mapping.get(tokenId.chain)?.get(tokenId.address.toString());
    }
  }

  getAllPoolsForChain(chain: Chain): T[] {
    const zapAssets = this._mapping.get(chain);
    if (!zapAssets) return [];

    return Array.from(zapAssets.values()).filter(
      (asset: any) => asset.zapTokenInfo?.type === ZapAssetType.POOL,
    );
  }
  getAllPositionsForChain(chain: Chain): T[] {
    const zapAssets = this._mapping.get(chain);
    if (!zapAssets) return [];

    return Array.from(zapAssets.values()).filter(
      (asset: any) => asset.zapTokenInfo?.type === ZapAssetType.POSITION,
    );
  }
}

export class ZapAssetCache extends ZapAssetMapping<ZapAsset> {
  add(zapAsset: ZapAsset) {
    if (zapAsset.tokenBridgeOriginalTokenId) {
      // Try to find the original asset to copy metadata
      const originalKey = getZapAssetKey(
        zapAsset.tokenBridgeOriginalTokenId.chain,
        zapAsset.tokenBridgeOriginalTokenId.address.toString(),
        zapAsset.zapTokenInfo?.type,
        zapAsset.zapTokenInfo?.provider,
        zapAsset.zapPositionDetails?.nftId,
      );
      const original = this.get(originalKey);
      if (original) {
        zapAsset.icon = original.icon;
        zapAsset.name = original.name;
        zapAsset.symbol = original.symbol;
      }
    }
    super.add(zapAsset.tokenId, zapAsset);
  }

  findByAddressOrSymbol(
    chain: Chain,
    addressOrSymbol: string,
  ): ZapAsset | undefined {
    const byAddress = this.get(chain, addressOrSymbol);
    if (byAddress) return byAddress;

    const bySymbol = this.findBySymbol(chain, addressOrSymbol);
    if (bySymbol) return bySymbol;

    return undefined;
  }

  // Queries zap assets by symbol. If query is 1 or 2 characters, we look only for prefix matches
  queryBySymbol(chain: Chain, query: string): ZapAsset[] {
    return this.getAllForChain(chain).filter((asset) => {
      return (
        asset.symbol.toLowerCase().startsWith(query.toLowerCase()) ||
        asset.name?.toLowerCase().startsWith(query.toLowerCase())
      );
    });
  }

  // This should be used sparingly/never... use addresses instead.
  // Excludes wrapped tokens
  findBySymbol(chain: Chain, symbol: string): ZapAsset | undefined {
    let matching = this.getAllForChain(chain).filter(
      (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase(),
    );

    if (matching.length > 1) {
      // Exclude wrapped tokens if there's multiple matches
      matching = matching.filter((asset) => !asset.isTokenBridgeWrappedToken);
    }

    if (matching.length === 1) {
      return matching[0];
    } else if (matching.length > 1) {
      // This means there's more than one native asset (not wrapped) with this symbol
      console.error(`Ambiguous zap asset symbol: ${symbol}`);
    }

    return undefined;
  }

  setLocalStorageKey(key: string) {
    this._localStorageKey = key;
  }

  persist() {
    if (HAS_LOCALSTORAGE && this._localStorageKey) {
      try {
        const asJson = {
          version: ZAP_CACHE_VERSION,
          zapAssets: {},
        };
        this.forEach((zapAssetId, zapAsset) => {
          asJson.zapAssets[zapAsset.key] = zapAsset.toJson();
        });

        const jsonString = JSON.stringify(asJson);
        localStorage.setItem(this._localStorageKey, jsonString);
      } catch (e) {
        console.error('Error persisting zap asset cache:', e);
      }
    }
  }

  static load(localStorageKey: string): ZapAssetCache {
    if (HAS_LOCALSTORAGE) {
      try {
        const jsonString = localStorage.getItem(localStorageKey);
        if (jsonString) {
          const asJson = JSON.parse(jsonString);
          if (asJson.version === ZAP_CACHE_VERSION) {
            const cache = new ZapAssetCache();
            cache.setLocalStorageKey(localStorageKey);

            for (const [, zapAssetData] of Object.entries(asJson.zapAssets)) {
              const zapAsset = ZapAsset.fromJson(zapAssetData as ZapAssetJson);
              cache.add(zapAsset);
            }

            return cache;
          }
        }
      } catch (e) {
        console.error('Error loading zap asset cache:', e);
      }
    }

    // Fallback
    const cache = new ZapAssetCache();
    cache.setLocalStorageKey(localStorageKey);
    return cache;
  }
}

// Seed a new ZapAssetCache using hard-coded tokens
export function buildZapAssetCache(
  tokens: [],
  wrappedTokens: WrappedTokenAddresses,
  cacheKey: string,
): ZapAssetCache {
  const cache = ZapAssetCache.load(cacheKey);

  //TODO: Add initial zap assets to the cache

  cache.persist();
  return cache;
}

export function isZapAssetId(thing: any): thing is ZapAssetId {
  return thing.chain && thing.address && thing.type && thing.provider;
}
