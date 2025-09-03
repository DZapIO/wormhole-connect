import type { Token } from 'config/tokens';
import type { ChainConfig } from 'config/types';
import type { ZapAsset } from 'config/zapAsset';
import { useMemo } from 'react';
import type { WalletData } from 'store/wallet';
import {
  applyCustomPoolSupport,
  applyPoolSearch,
  filterPoolsByBalance,
  sortPoolsByPreference,
} from 'utils/poolListUtils';
import type { Balance } from 'utils/wallet/types';

export interface PoolBalance extends Balance {
  amountUSD?: string;
}

export interface PoolBalances {
  [key: string]: PoolBalance;
}
interface UsePositionListParams {
  poolList: ZapAsset[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: ZapAsset;
  sourceToken?: ZapAsset;
  wallet: WalletData;
  balances: PoolBalances;
  isSourceList?: boolean; // true for source tokens, false for destination tokens
  isFetchingBalances?: boolean;
}

export const usePositionList = ({
  poolList,
  searchQuery,
  selectedChainConfig,
  selectedToken,
  sourceToken,
  wallet,
  balances,
  isSourceList = false,
  isFetchingBalances = false,
}: UsePositionListParams): Token[] => {
  return useMemo(() => {
    if (!poolList.length) return [];

    // Apply search input - find pools with exact match of address, or partial match of symbol
    let tokens = applyPoolSearch(poolList, searchQuery, selectedChainConfig);

    tokens = sortPoolsByPreference(tokens, selectedToken, balances);

    // Apply custom pool support handler if configured
    tokens = applyCustomPoolSupport(tokens, sourceToken);

    // Filter by balance for source pools when not searching
    // This allows users to search for zero-balance tokens by contract address if needed
    // Never filter destination pools by balance and while fetching balances
    if (isSourceList && !searchQuery && !isFetchingBalances) {
      tokens = filterPoolsByBalance(tokens, balances, wallet.address);
    }

    return tokens;
  }, [
    poolList,
    searchQuery,
    selectedChainConfig,
    selectedToken,
    wallet.address,
    balances,
    isSourceList,
    sourceToken,
    isFetchingBalances,
  ]);
};
