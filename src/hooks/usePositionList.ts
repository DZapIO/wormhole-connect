import { useMemo } from 'react';
import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import { useTokens } from 'contexts/TokensContext';
import type { Balances } from 'utils/wallet/types';
import {
  applyPoolSearch,
  sortPoolsByPreference,
  applyCustomPoolSupport,
  filterPoolsByBalance,
} from 'utils/poolListUtils';
import type { ZapAsset } from 'config/zapAsset';

interface UseTokenListParams {
  poolList: ZapAsset[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: ZapAsset;
  sourceToken?: ZapAsset;
  wallet: WalletData;
  balances: Balances;
  isSourceList?: boolean; // true for source tokens, false for destination tokens
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
}: UseTokenListParams): Token[] => {
  const { getTokenPrice, lastTokenPriceUpdate } = useTokens();

  return useMemo(() => {
    if (!poolList) return [];

    // Apply search input - find pools with exact match of address, or partial match of symbol
    let tokens = applyPoolSearch(poolList, searchQuery, selectedChainConfig);

    tokens = sortPoolsByPreference(
      tokens,
      selectedToken,
      balances,
      getTokenPrice,
    );

    // Apply custom pool support handler if configured
    tokens = applyCustomPoolSupport(tokens, sourceToken);

    // Filter by balance for source pools when not searching
    // This allows users to search for zero-balance tokens by contract address if needed
    // Never filter destination pools by balance
    if (isSourceList && !searchQuery) {
      tokens = filterPoolsByBalance(tokens, balances, wallet.address);
    }

    return tokens;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    poolList,
    searchQuery,
    selectedChainConfig,
    selectedToken,
    wallet.address,
    balances,
    getTokenPrice,
    lastTokenPriceUpdate,
    isSourceList,
    sourceToken,
  ]);
};
