import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import config from 'config';
import type { ChainConfig } from 'config/types';
import type { ZapAsset } from 'config/zapAsset';
import { getZapAssetKey, isSameZapAsset } from 'config/zapAsset';
import type { PoolBalances } from 'hooks/usePositionList';

export const getPoolPreferenceScore = (
  token: ZapAsset,
  selectedToken?: ZapAsset,
): number => {
  // Currently selected token should be shown first
  if (selectedToken && isSameZapAsset(selectedToken, token)) {
    return 1;
  }
  // The rest is all the same as far as preference
  return 0;
};

export const applyPoolSearch = (
  tokenList: ZapAsset[],
  searchQuery: string,
  selectedChainConfig: ChainConfig,
): ZapAsset[] => {
  if (!searchQuery) return [...tokenList];

  const unsortedTokens = [...tokenList];
  let searchResults: ZapAsset[] = [];

  const byAddress = config.zapAssets.get(
    selectedChainConfig.sdkName,
    searchQuery,
  );
  if (byAddress) {
    searchResults.push(byAddress);
  }

  const queryResults = config.zapAssets.queryBySymbol(
    selectedChainConfig.sdkName,
    searchQuery,
  );

  if (queryResults.length > 0) {
    searchResults = searchResults.concat(queryResults);
  }

  for (const result of searchResults) {
    if (!tokenList.find((existing) => isSameZapAsset(result, existing))) {
      unsortedTokens.push(result);
    }
  }

  return unsortedTokens;
};

export const sortPoolsByPreference = (
  tokens: ZapAsset[],
  selectedToken: ZapAsset | undefined,
  balances: PoolBalances,
): ZapAsset[] => {
  return tokens.sort((a, b) => {
    const scoreA = getPoolPreferenceScore(a, selectedToken);
    const scoreB = getPoolPreferenceScore(b, selectedToken);
    if (scoreA > scoreB) return -1;
    if (scoreB > scoreA) return 1;

    const balanceA = Number(balances[a.key]?.amountUSD || 0);
    const balanceB = Number(balances[b.key]?.amountUSD || 0);

    if (!balanceA && !balanceB) {
      return (b.zapPoolInfo?.apr || 0) - (a.zapPoolInfo?.apr || 0);
    }

    if (balanceA !== balanceB) {
      return balanceB - balanceA;
    } else {
      // If equal scores and USD balance, compare by symbol
      return a.symbol.localeCompare(b.symbol);
    }
  });
};

export const applyCustomPoolSupport = (
  tokens: ZapAsset[],
  sourceToken?: ZapAsset,
): ZapAsset[] => {
  const filter = config.isTokenSupportedHandler;
  if (!filter) {
    return tokens;
  }
  return tokens.filter((t) => filter(t, sourceToken));
};

export const filterPoolsByBalance = (
  tokens: ZapAsset[],
  balances: PoolBalances,
  walletAddress?: string,
): ZapAsset[] => {
  if (!walletAddress) return tokens;
  if (Object.keys(balances).length === 0) return tokens;
  return tokens.filter((t) => {
    const bal =
      balances[
        getZapAssetKey(
          t.chain,
          t.addressString,
          t.tokenId?.protocol,
          t.tokenId?.nftId,
        )
      ]?.balance;

    return bal && sdkAmount.units(bal) > 0n;
  });
};
