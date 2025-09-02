// Legacy SDK
import type { ChainResourceMap, WormholeConfig } from 'sdklegacy';

// SDKv2
import type {
  AttestationReceipt,
  Chain,
  Network,
  routes,
  Wormhole as WormholeV2,
} from '@wormhole-foundation/sdk';

import type { PriorityFeeOptions } from '@wormhole-foundation/sdk-solana';

import type {
  TransferDetails,
  TriggerEventHandler,
  WormholeConnectEventHandler,
} from 'telemetry/types';

import type { ZapOperator } from 'routes/sdkZap';
import type { TransferInfo } from 'utils/sdkv2';
import type { Token, TokenCache, TokenTuple } from './tokens';
import type { UiConfig } from './ui';
import type { ZapAssetCache, ZapAssetType } from './zapAsset';

export * from './ui';

export enum TokenIcon {
  'AVAX' = 1,
  'BNB',
  'BSC',
  'CELO',
  'ETH',
  'FANTOM',
  'POLYGON',
  'SOLANA',
  'USDC',
  'GLMR',
  'DAI',
  'USDT',
  'BUSD',
  'WBTC',
  'SUI',
  'APT',
  'SEI',
  'BASE',
  'OSMO',
  'TBTC',
  'WSTETH',
  'ARBITRUM',
  'OPTIMISM',
  'ATOM',
  'EVMOS',
  'KUJI',
  'PYTH',
  'INJ',
  'KLAY',
  'NTT',
  'SCROLL',
  'XLAYER',
  'MANTLE',
  'WORLDCHAIN',
  'BERA',
  'BTC',
  'SONIC',
  'PLUME',
  'FOGO',
  'HYPE',
  'XRP',
}

// Used in bridging components
export type TransferSide = 'source' | 'destination';

export interface ExtendedTransferDetails extends TransferDetails {
  fromWalletAddress: string;
  toWalletAddress: string;
}

export interface ValidateTransferResult {
  isValid: boolean;
  error?: string;
}

export type ValidateTransferHandler = (
  transferDetails: ExtendedTransferDetails,
) => Promise<ValidateTransferResult>;

export type IsRouteSupportedHandler = (
  transferDetails: TransferDetails,
) => Promise<boolean>;

export type IsTokenSupportedHandler = (
  token: Token,
  sourceToken?: Token, // The selected source token, if applicable
) => boolean;

// This is the integrator-provided config
export interface WormholeConnectConfig {
  network?: Network; // New name for this, consistent with SDKv2

  // External resources
  rpcs?: ChainResourceMap;
  // API keys for EVM indexers like GoldRush of Alchemy
  // Used for fetching token balances
  evmIndexers?: {
    alchemy?: string;
    goldRush?: string;
  };
  coingecko?: {
    apiKey?: string;
    customUrl?: string;
  };

  // White lists
  chains?: Chain[];
  tokens?: (string | TokenTuple)[];
  routes?: routes.RouteConstructor<any>[];

  protocols?: ProtocolsConfig;

  // Custom tokens
  tokensConfig?: TokensConfig;

  // Used to namespace localStorage caches
  cacheNamespace?: string;

  // Wormhole-wrapped token addresses
  wrappedTokens?: WrappedTokenAddresses;

  // Callbacks
  eventHandler?: WormholeConnectEventHandler;

  // validateTransferHandler can be used to validate the transfer before signing the transaction
  validateTransferHandler?: ValidateTransferHandler;

  // isRouteSupportedHandler can be used to disable certain routes from being selected
  isRouteSupportedHandler?: IsRouteSupportedHandler;

  // isTokenSupportedHandler can be used to disable certain tokens from being selected
  isTokenSupportedHandler?: IsTokenSupportedHandler;

  // filterRoutes can be used to filter the routes that are shown to the user
  filterRoutes?: (routes: string[]) => string[];

  // UI details
  ui?: UiConfig;

  // Transaction settings (e.g. priority / gas fees)
  transactionSettings?: TransactionSettings;
}

// This is the exported config value used throughout the code base
export interface InternalConfig<N extends Network> {
  network: N;
  // Cache. To be accessed via getWormholeContextV2(), not directly
  _v2Wormhole?: WormholeV2<N>;

  sdkConfig: WormholeConfig;

  isMainnet: boolean;

  // External resources
  rpcs: ChainResourceMap;
  // API keys for EVM indexers like GoldRush of Alchemy
  // Used for fetching token balances
  evmIndexers?: {
    alchemy?: string;
    goldRush?: string;
  };

  mayanApi: string;
  wormholeApi: string;
  wormholeRpcHosts: string[];
  coingecko?: {
    apiKey?: string;
    customUrl?: string;
  };

  tokens: TokenCache;
  tokenWhitelist?: (string | TokenTuple)[];
  zapAssets: ZapAssetCache;
  protocols: ProtocolsConfig;

  chains: ChainsConfig;
  chainsArr: ChainConfig[];

  routes: ZapOperator;

  // Callbacks
  triggerEvent: TriggerEventHandler;
  validateTransfer?: ValidateTransferHandler;
  isRouteSupportedHandler?: IsRouteSupportedHandler;
  isTokenSupportedHandler?: IsTokenSupportedHandler;
  filterRoutes?: (routes: string[]) => string[];

  // UI configuration
  ui: UiConfig;

  // Used to namespace localStorage caches
  cacheKey: (name: string) => string;

  guardianSet: GuardianSetData;

  transactionSettings: TransactionSettings;
}

export type TokenConfig = {
  symbol: string;
  name?: string;
  decimals: number;
  icon: TokenIcon | string;
  tokenId: {
    chain: Chain;
    address: string;
  };
};

export type ZapAssetConfig = {
  symbol: string;
  name?: string;
  decimals: number;
  icon: string[] | string;
  zapAssetId: {
    chain: Chain;
    address: string;
    type: ZapAssetType;
    provider?: string;
    nftId?: string;
  };
};

export type ZapAssetsConfig = { [key: string]: ZapAssetConfig };

export type TokensConfig = { [key: string]: TokenConfig };

export interface ChainConfig {
  sdkName: Chain;
  displayName: string;
  explorerUrl: string;
  explorerName: string;
  icon: Chain;
  symbol?: string;
}

export type ChainsConfig = {
  [chain in Chain]?: ChainConfig;
};

export type ProtocolConfig = {
  id: string;
  name: string;
  icon: string;
  supportedChains: Chain[];
};

export type ProtocolsConfig = {
  [protocol: string]: ProtocolConfig;
};

export type RpcMapping = { [chain in Chain]?: string };

export type GuardianSetData = {
  index: number;
  keys: string[];
};

export type NetworkData = {
  chains: ChainsConfig;
  tokens: TokenConfig[];
  wrappedTokens: WrappedTokenAddresses;
  rpcs: RpcMapping;
  guardianSet: GuardianSetData;
  protocols?: ProtocolsConfig;
};

export type WrappedTokenAddresses = {
  [chain in Chain]?: {
    [address: string]: {
      [otherChain in Chain]?: string;
    };
  };
};

// Transactions in Transaction History view
export interface Transaction {
  // Transaction hash
  txHash: string;

  // Stringified addresses
  sender?: string;
  recipient: string;

  amount?: string;
  amountUsd?: number;
  receiveAmount?: string;

  fromChain: Chain;
  fromToken?: Token;

  toChain: Chain;
  toToken?: Token;

  // Timestamps
  senderTimestamp: string;
  receiverTimestamp?: string;

  // Explorer link
  explorerLink: string;

  // In-progress status
  inProgress: boolean;
}

// Transaction data in local storage
export interface TransactionLocal {
  receipt: routes.Receipt<AttestationReceipt>;
  route: string;
  timestamp: number;
  txHash: string;
  txDetails: TransferInfo;
  isReadyToClaim?: boolean;
}

export interface TransactionSettings {
  Solana?: {
    priorityFee?: PriorityFeeOptions;
  };
}
