import type {
  ProviderDetails,
  ZappingPoolTokenData,
  ZappingPositionTokenData,
} from '@dzapio/sdk';
import type { Chain, TokenAddress, TokenId } from '@wormhole-foundation/sdk';
import { isNative, toNative, chainToPlatform } from '@wormhole-foundation/sdk';
import type { TokenTuple } from './tokens';
import { tokenIdToTuple, tokenIdFromTuple } from './tokens';
import { getWormholeContextV2 } from './index';
import { isValidSuiType } from '@wormhole-foundation/sdk-sui';
import { fetchTokenMetadata } from 'utils/coingecko';
import { canonicalAddress, UniversalAddress } from '@wormhole-foundation/sdk';
import type { WrappedTokenAddresses, ZapAssetConfig } from './types';
// Import types from the actual dzapio/sdk
export type {
  ZappingChains,
  ZappingPoolDetails,
  ZappingPools,
  ZappingPoolTokenData,
  ZappingPositions,
  ZappingPositionTokenData,
  ZapPoolDetailsRequest,
  ZapPoolsRequest,
  ZapPositionsRequest,
  ZappingProviders,
} from '@dzapio/sdk';

// Re-export for convenience and add local types
export type ZapPosition = ZappingPositionTokenData;
export type ZapPool = ZappingPoolTokenData;

// Union type for zap data (positions or pools from SDK)
export type ZapData = ZapPosition | ZapPool;

// Type guards for SDK data
export function isZapPosition(asset: ZapAssetTuple) {
  return asset[2] === ZapAssetType.POSITION;
}

export function isZapPool(asset: ZapAssetTuple) {
  return asset[2] === ZapAssetType.POOL;
}

// Asset type enum for UI purposes
export enum ZapAssetType {
  TOKEN = 'token',
  POOL = 'pool',
  POSITION = 'position',
}

// Variable length tuple for zap assets - minimum 3, maximum 5 elements
// [Chain, address, type] | [Chain, address, type, provider] | [Chain, address, type, provider, nftId]
export type ZapAssetTuple =
  | [Chain, string, string] // Token: chain, address, type
  | [Chain, string, string, string] // Pool or position : chain, address, type, provider
  | [Chain, string, string, string, string]; // Position: chain, address, type, provider, nftId

export function isZapAssetTuple(thing: any): thing is ZapAssetTuple {
  return (
    Array.isArray(thing) &&
    thing.length >= 3 &&
    thing.length <= 5 &&
    typeof thing[0] === 'string' &&
    typeof thing[1] === 'string' &&
    Object.values(ZapAssetType).includes(thing[2])
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

export type ZapAssetId<C extends Chain = Chain> = {
  chain: C;
  address: string;
  type: ZapAssetType;
  provider?: string;
  nftId?: string;
};

// A ZapAssetId initialized from a string address, similar to TokenIdLazy but for zap assets
export class ZapAssetIdLazy<C extends Chain = Chain> implements ZapAssetId<C> {
  chain: C;
  address: string;
  type: ZapAssetType;
  provider?: string;
  nftId?: string;
  _tokenAddress?: TokenAddress<Chain>;

  constructor(
    chain: C,
    address: string,
    type: ZapAssetType,
    provider?: string,
    nftId?: string,
  ) {
    this.chain = chain;
    this.address = address;
    this.type = type;
    this.provider = provider;
    this.nftId = nftId;
  }

  get tokenAddress(): TokenAddress<C> {
    if (isNative(this.address)) return this.address;

    if (!this._tokenAddress) {
      this._tokenAddress = toNative(
        this.chain,
        this.address,
      ) as TokenAddress<C>;
    }
    return this._tokenAddress as TokenAddress<C>;
  }

  get key(): string {
    return getZapAssetKey(
      this.chain,
      this.address,
      this.type,
      this.provider,
      this.nftId,
    );
  }

  static fromZapAssetTuple(tuple: ZapAssetTuple): ZapAssetIdLazy {
    const [chain, address, type, provider, nftId] = tuple;
    return new ZapAssetIdLazy(
      chain,
      address,
      type as ZapAssetType,
      provider,
      nftId,
    );
  }
}

// Utility functions for ZapAssetId
export function zapAssetIdToTuple(zapAssetId: ZapAssetId): ZapAssetTuple {
  const base: [Chain, string, string] = [
    zapAssetId.chain,
    zapAssetId.address,
    zapAssetId.type,
  ];

  // Add provider if it exists
  if (zapAssetId.provider) {
    const withProvider: [Chain, string, string, string] = [
      ...base,
      zapAssetId.provider,
    ];

    // Add nftId if it exists
    if (zapAssetId.nftId) {
      return [...withProvider, zapAssetId.nftId] as ZapAssetTuple;
    }
    return withProvider;
  }

  return base;
}

export function zapAssetIdFromTuple(tuple: ZapAssetTuple): ZapAssetId {
  const [chain, address, type, provider, nftId] = tuple;
  return {
    chain,
    address,
    type: type as ZapAssetType,
    provider: provider || undefined,
    nftId: nftId || undefined,
  };
}

export function getZapAssetKey(
  chainId: string,
  address: string,
  type: ZapAssetType,
  provider?: string,
  nftId?: string,
): string {
  const parts = [chainId, address, type];
  if (provider) {
    parts.push(provider);
    if (nftId) {
      parts.push(nftId);
    }
  }
  return parts.join(':');
}

export function parseZapAssetKey(key: string): ZapAssetId {
  const parts = key.split(':');
  if (parts.length < 3 || parts.length > 5) {
    throw new Error(
      `Invalid zap asset key "${key}"; expected 3-5 parts, got ${parts.length}`,
    );
  }

  return {
    chain: parts[0] as Chain,
    address: parts[1],
    type: parts[2] as ZapAssetType,
    provider: parts[3] === 'none' || !parts[3] ? undefined : parts[3],
    nftId: parts[4] === 'none' || !parts[4] ? undefined : parts[4],
  };
}

// JSON interface for ZapAsset serialization
interface ZapAssetJson {
  chain: string;
  address: string;
  type: string;
  provider?: string;
  nftId?: string;
  decimals: number;
  symbol: string;
  name: string;
  icon: string | string[];
  tokenBridgeOriginalTokenId: TokenTuple | undefined;
  coingeckoWebId: string | undefined;
}

export class ZapAsset extends ZapAssetIdLazy {
  decimals: number;
  symbol: string;
  name?: string;

  // Display info
  icon?: string | string[];

  // If this is a Wormhole Token Bridge wrapped token, tokenBridgeOriginalTokenId
  // is the original token's TokenId. Otherwise, it's just undefined.
  tokenBridgeOriginalTokenId?: TokenId;

  // web_slug in Coingecko API response
  // Corresponds to URLs like https://www.coingecko.com/en/coins/:id
  coingeckoWebId?: string;

  // Flag that's set to true if the token was built in to Connect via config
  // Used when filtering out unknown/unverified tokens
  isBuiltin?: boolean;

  constructor(
    chain: Chain,
    address: string,
    type: ZapAssetType,
    decimals: number,
    symbol: string,
    name?: string,
    icon?: string | string[],
    provider?: string,
    nftId?: string,
    tokenBridgeOriginalTokenId?: TokenId,
    coingeckoId?: string,
  ) {
    super(chain, address, type, provider, nftId);
    this.decimals = decimals;
    this.symbol = symbol;
    this.name = name;
    this.icon = icon;
    this.tokenBridgeOriginalTokenId = tokenBridgeOriginalTokenId;
    this.coingeckoWebId = coingeckoId;
  }

  get display(): string {
    if (this.name) {
      return this.name;
    }
    if (this.symbol !== '') {
      return this.symbol;
    }
    return this.shortAddress;
  }

  get shortAddress(): string {
    const addr = this.address;
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 6)}`;
  }

  get tuple(): ZapAssetTuple {
    return zapAssetIdToTuple(this);
  }

  get key(): string {
    return getZapAssetKey(
      this.chain,
      this.address,
      this.type,
      this.provider,
      this.nftId,
    );
  }

  get assetId(): ZapAssetId {
    return {
      chain: this.chain,
      address: this.address,
      type: this.type,
      provider: this.provider,
      nftId: this.nftId,
    };
  }

  get isNativeGasToken() {
    return isNative(this.address);
  }

  get isTokenBridgeWrappedToken() {
    return !!this.tokenBridgeOriginalTokenId;
  }

  get nativeChain() {
    // This returns the chain of the original token, for wormhole-wrapped tokens.
    return this.tokenBridgeOriginalTokenId?.chain || this.chain;
  }

  equals(other: ZapAsset): boolean {
    return (
      this.chain === other.chain &&
      this.address === other.address &&
      this.type === other.type &&
      this.provider === other.provider &&
      this.nftId === other.nftId
    );
  }

  toJson(): ZapAssetJson {
    return {
      chain: this.chain,
      address: this.address,
      type: this.type,
      provider: this.provider,
      nftId: this.nftId,
      decimals: this.decimals,
      symbol: this.symbol,
      name: this.name ?? '',
      icon: this.icon || '',
      tokenBridgeOriginalTokenId: this.tokenBridgeOriginalTokenId
        ? tokenIdToTuple(this.tokenBridgeOriginalTokenId)
        : undefined,
      coingeckoWebId: this.coingeckoWebId,
    };
  }

  static fromJson({
    chain,
    address,
    type,
    provider,
    nftId,
    decimals,
    symbol,
    name,
    icon,
    tokenBridgeOriginalTokenId,
    coingeckoWebId,
  }: ZapAssetJson) {
    return new ZapAsset(
      chain as Chain,
      address,
      type as ZapAssetType,
      decimals,
      symbol,
      name,
      icon === '' ? undefined : icon,
      provider,
      nftId,
      tokenBridgeOriginalTokenId
        ? tokenIdFromTuple(tokenBridgeOriginalTokenId)
        : undefined,
      coingeckoWebId,
    );
  }
}

// Mapping of zap assets to some value - simplified version
export class ZapAssetMapping<T> {
  lastUpdate: Date;
  _localStorageKey?: string;

  // Simple key-value mapping using zap asset keys
  private _mapping: Map<string, T>;
  size: number;

  constructor() {
    this.lastUpdate = new Date();
    this._mapping = new Map();
    this.size = 0;
  }

  add(zapAsset: ZapAssetId, value: T) {
    const key = getZapAssetKey(
      zapAsset.chain,
      zapAsset.address,
      zapAsset.type,
      zapAsset.provider,
      zapAsset.nftId,
    );

    if (!this._mapping.has(key)) {
      this.size += 1;
    }
    this._mapping.set(key, value);
    this.lastUpdate = new Date();
  }

  // Simple get methods
  get(key: string): T | undefined;
  get(zapAssetId: ZapAssetId): T | undefined;
  get(zapAssetTuple: ZapAssetTuple): T | undefined;
  get(
    chain: Chain,
    address: string,
    type: ZapAssetType,
    provider?: string,
    nftId?: string,
  ): T | undefined;
  get(
    keyOrAsset: string | ZapAssetId | ZapAssetTuple | Chain,
    address?: string,
    type?: ZapAssetType,
    provider?: string,
    nftId?: string,
  ): T | undefined {
    let key: string;

    if (typeof keyOrAsset === 'string' && !address) {
      // Direct key lookup
      key = keyOrAsset;
    } else if (typeof keyOrAsset === 'string' && address && type) {
      // Build key from parameters
      key = getZapAssetKey(keyOrAsset as Chain, address, type, provider, nftId);
    } else if (typeof keyOrAsset === 'object' && 'chain' in keyOrAsset) {
      // ZapAssetId object
      key = getZapAssetKey(
        keyOrAsset.chain,
        keyOrAsset.address,
        keyOrAsset.type,
        keyOrAsset.provider,
        keyOrAsset.nftId,
      );
    } else if (Array.isArray(keyOrAsset) && isZapAssetTuple(keyOrAsset)) {
      // ZapAssetTuple
      const zapAssetId = zapAssetIdFromTuple(keyOrAsset);
      key = getZapAssetKey(
        zapAssetId.chain,
        zapAssetId.address,
        zapAssetId.type,
        zapAssetId.provider,
        zapAssetId.nftId,
      );
    } else {
      return undefined;
    }

    return this._mapping.get(key);
  }

  has(zapAssetId: ZapAssetId): boolean {
    const key = getZapAssetKey(
      zapAssetId.chain,
      zapAssetId.address,
      zapAssetId.type,
      zapAssetId.provider,
      zapAssetId.nftId,
    );
    return this._mapping.has(key);
  }

  delete(zapAssetId: ZapAssetId): boolean {
    const key = getZapAssetKey(
      zapAssetId.chain,
      zapAssetId.address,
      zapAssetId.type,
      zapAssetId.provider,
      zapAssetId.nftId,
    );
    const deleted = this._mapping.delete(key);
    if (deleted) {
      this.size -= 1;
      this.lastUpdate = new Date();
    }
    return deleted;
  }

  getAllForChain(chain: Chain): T[] {
    return Array.from(this._mapping.entries())
      .filter(([key]) => {
        try {
          const zapAssetId = parseZapAssetKey(key);
          return zapAssetId.chain === chain;
        } catch {
          return false;
        }
      })
      .map(([, value]) => value);
  }

  getAll(): T[] {
    return Array.from(this._mapping.values());
  }

  get chains(): Chain[] {
    const chains = new Set<Chain>();
    for (const key of this._mapping.keys()) {
      try {
        const zapAssetId = parseZapAssetKey(key);
        chains.add(zapAssetId.chain);
      } catch {
        // Skip invalid keys
      }
    }
    return Array.from(chains);
  }

  clear() {
    this._mapping.clear();
    this.size = 0;
    this.lastUpdate = new Date();
  }

  forEach(callback: (zapAssetId: ZapAssetId, value: T) => void) {
    this._mapping.forEach((value, key) => {
      try {
        const zapAssetId = parseZapAssetKey(key);
        callback(zapAssetId, value);
      } catch {
        // Skip invalid keys
      }
    });
  }

  get empty(): boolean {
    return this.size === 0;
  }

  clone(): ZapAssetMapping<T> {
    const cloned = new ZapAssetMapping<T>();
    this._mapping.forEach((value, key) => {
      cloned._mapping.set(key, value);
    });
    cloned.size = this.size;
    cloned.lastUpdate = this.lastUpdate;
    return cloned;
  }
}

export class ZapAssetCache extends ZapAssetMapping<ZapAsset> {
  add(zapAsset: ZapAsset) {
    if (zapAsset.tokenBridgeOriginalTokenId) {
      // Try to find the original asset to copy metadata
      const originalKey = getZapAssetKey(
        zapAsset.tokenBridgeOriginalTokenId.chain,
        zapAsset.tokenBridgeOriginalTokenId.address.toString(),
        zapAsset.type, // Keep same type for original
        zapAsset.provider,
        zapAsset.nftId,
      );
      const original = this.get(originalKey);
      if (original) {
        zapAsset.icon = original.icon;
        zapAsset.name = original.name;
        zapAsset.symbol = original.symbol;
      }
    }
    super.add(zapAsset.assetId, zapAsset);
  }

  // Fetches gas token as zap asset
  getGasToken(chain: Chain): ZapAsset | undefined {
    if (chain === 'Celo') {
      // special case... Celo has multiple gas tokens (?!?!)
      return this.findBySymbol(chain, 'CELO');
    }

    return this.get(chain, 'native', ZapAssetType.TOKEN);
  }

  findByAddressOrSymbol(
    chain: Chain,
    addressOrSymbol: string,
    type: ZapAssetType = ZapAssetType.TOKEN,
  ): ZapAsset | undefined {
    const byAddress = this.get(chain, addressOrSymbol, type);
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

  async addFromTokenId(
    tokenId: TokenId,
    type: ZapAssetType = ZapAssetType.TOKEN,
    provider?: string,
    nftId?: string,
  ): Promise<ZapAsset> {
    if (
      tokenId.chain === 'Sui' &&
      !isValidSuiType(tokenId.address.toString())
    ) {
      throw new Error(
        `Not a valid Sui token address: ${tokenId.address.toString()}`,
      );
    }

    const wh = await getWormholeContextV2();
    const chain = wh.getChain(tokenId.chain);
    const decimals = await chain.getDecimals(tokenId.address);

    const metadata = await fetchTokenMetadata(tokenId);

    let symbol = metadata?.symbol?.toUpperCase() || '';
    let name = metadata?.name || '';
    let image = metadata?.image?.large || null;
    const coingeckoId = metadata?.web_slug;

    if (!symbol) {
      // Attempt to get the symbol from on-chain
      const { getTokenMetadataFromRpc } = await import('utils/tokens');
      const metadataRpc = await getTokenMetadataFromRpc(tokenId);
      if (metadataRpc) {
        console.info('Got metadata from RPC', metadataRpc);
        symbol = metadataRpc.symbol;
        name = metadataRpc.name;
        image = metadataRpc.icon;
      }
    }

    // Check if this is a Token Bridge wrapped token
    let tokenBridgeOriginalTokenId: TokenId | undefined = undefined;
    const tb = await chain.getTokenBridge();
    if (await tb.isWrappedAsset(tokenId.address)) {
      tokenBridgeOriginalTokenId = await tb.getOriginalAsset(tokenId.address);

      if (UniversalAddress.instanceof(tokenBridgeOriginalTokenId.address)) {
        // For move based platforms like Sui and Aptos we have to convert from UniversalAddress to NativeAddress
        tokenBridgeOriginalTokenId.address = await wh.getTokenNativeAddress(
          tokenBridgeOriginalTokenId.chain,
          tokenBridgeOriginalTokenId.chain,
          tokenBridgeOriginalTokenId.address,
        );
      }

      // For wrapped tokens, if we have an icon & symbol for its original token,
      // override the wrapped token's metadata with those to ensure they match.
      if (tokenBridgeOriginalTokenId) {
        const originalKey = getZapAssetKey(
          tokenBridgeOriginalTokenId.chain,
          tokenBridgeOriginalTokenId.address.toString(),
          type,
          provider,
          nftId,
        );
        const originalAsset = this.get(originalKey);
        if (originalAsset && originalAsset.icon) {
          image = originalAsset.icon;
          symbol = originalAsset.symbol;
        }
      }
    }

    const zapAsset = new ZapAsset(
      tokenId.chain,
      canonicalAddress(tokenId),
      type,
      decimals,
      symbol,
      name,
      image,
      provider,
      nftId,
      tokenBridgeOriginalTokenId,
      coingeckoId,
    );

    this.add(zapAsset);

    return zapAsset;
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
  tokens: ZapAssetConfig[],
  wrappedTokens: WrappedTokenAddresses,
  cacheKey: string,
): ZapAssetCache {
  const cache = ZapAssetCache.load(cacheKey);

  for (const { zapAssetId, symbol, name, icon, decimals } of tokens) {
    const zapAsset = new ZapAsset(
      zapAssetId.chain,
      zapAssetId.address.toString(),
      ZapAssetType.TOKEN,
      decimals,
      symbol,
      name,
      icon,
    );
    zapAsset.isBuiltin = true;
    cache.add(zapAsset);
  }

  // Temporary hack... use wrappedTokens to populate the cache with all of the known
  // token bridge foreign assets. When we are able to fetch full token balances for every chain
  // this will become unnecessary.
  for (const chain in wrappedTokens) {
    for (const addr in wrappedTokens[chain]) {
      const wts = wrappedTokens[chain][addr];
      for (const otherChain in wts) {
        const originalAsset = cache.get(
          chain as Chain,
          addr,
          ZapAssetType.TOKEN,
        );
        if (originalAsset) {
          const wrappedAddr = wts[otherChain];

          let decimals =
            chainToPlatform(otherChain as Chain) === 'Evm' ? 18 : 8;

          decimals = Math.min(decimals, originalAsset.decimals);

          const wrappedAsset = new ZapAsset(
            otherChain as Chain,
            wrappedAddr,
            ZapAssetType.TOKEN,
            decimals,
            originalAsset.symbol,
            originalAsset.name,
            originalAsset.icon,
            undefined, // provider
            undefined, // nftId
            {
              chain: originalAsset.chain,
              address: toNative(originalAsset.chain, originalAsset.address),
            },
          );
          wrappedAsset.isBuiltin = true;

          cache.add(wrappedAsset);
        }
      }
    }
  }

  cache.persist();
  return cache;
}
