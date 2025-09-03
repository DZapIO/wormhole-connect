import { Tab, Tabs, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { type Chain } from '@wormhole-foundation/sdk';
import React, { memo, useState } from 'react';

import type { Token } from 'config/tokens';
import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import type { Balances } from 'utils/wallet/types';
import ChainList from 'views/v3/Bridge/AssetPicker/ChainList';
import TokenList from 'views/v3/Bridge/AssetPicker/TokenList';
import ProtocolTab from './PoolTab';

interface AssetPickerDrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (value: boolean) => void;
  chainList: Array<ChainConfig>;
  chainConfig?: ChainConfig;
  showChainSearch: boolean;
  setShowChainSearch: (value: boolean) => void;
  wallet: WalletData;
  sortedTokens: Token[];
  sortedPoolList?: Token[];
  balances: Balances;
  poolBalances?: Balances;
  isFetchingBalances: boolean;
  isConnectingWallet?: boolean;
  isFetchingTokens?: boolean;
  isPoolsFetching?: boolean;
  isSameChainSwap: boolean;
  isPoolsBalancesFetching?: boolean;
  token?: Token;
  sourceToken?: Token;
  isSource: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onChainSelect: (value: Chain) => void;
  onTokenSelect: (value: Token) => void;
  // Zap-specific props (optional)
  selectedProtocol?: string;
  showProtocolSearch?: boolean;
  setShowProtocolSearch?: (value: boolean) => void;
  showTabs?: boolean; // Controls whether to show tabs for Protocols
  setProtocol?: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function AssetPickerDrawer({
  isDrawerOpen,
  setIsDrawerOpen,
  chainList,
  chainConfig,
  showChainSearch,
  setShowChainSearch,
  wallet,
  sortedTokens,
  sortedPoolList,
  balances,
  poolBalances,
  isFetchingBalances,
  isConnectingWallet,
  isFetchingTokens,
  isPoolsFetching,
  isPoolsBalancesFetching,
  isSameChainSwap,
  token,
  sourceToken,
  isSource,
  searchQuery,
  setSearchQuery,
  onChainSelect,
  onTokenSelect,
  // Zap-specific props (optional)
  selectedProtocol,
  showProtocolSearch,
  setShowProtocolSearch,
  showTabs = false,
  setProtocol,
}: AssetPickerDrawerProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'tokens' | 'pools'>('tokens');

  // Debug logging

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: 'tokens' | 'pools',
  ) => {
    setActiveTab(newValue);
  };

  // Drawer handle - static content, no need to memoize
  const drawerHandle = (
    <Stack alignItems="center" paddingBottom="4px" paddingTop="8px">
      <Box
        sx={{
          width: '40px',
          height: '5px',
          backgroundColor: theme.palette.text.secondary,
          borderRadius: '8px',
        }}
      />
    </Stack>
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={isDrawerOpen}
      slotProps={{
        paper: {
          sx: {
            background: theme.palette.input.background,
            borderRadius: '8px',
            height: 'calc(100vh - 40px)', // Force full-height on small mobile devices with 40px padding at the top
            maxWidth: '100vw', // Force full-width on small mobile devices
          },
        },
      }}
      transitionDuration={200}
      onOpen={() => setIsDrawerOpen(true)}
      onClose={() => setIsDrawerOpen(false)}
    >
      {drawerHandle}

      {/* Common Chain List */}
      <ChainList
        chainList={chainList}
        selectedChainConfig={chainConfig}
        showSearch={showChainSearch}
        setShowSearch={setShowChainSearch}
        wallet={wallet}
        onChainSelect={onChainSelect}
      />

      {/* Conditional rendering based on whether tabs are enabled (Zap mode) */}
      {!showChainSearch && showTabs && (
        <>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              },
            }}
          >
            <Tab label="Tokens" />
            <Tab label="Protocols" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ padding: 2, flex: 1, overflow: 'auto' }}>
            {activeTab === 'tokens' && chainConfig && (
              <TokenList
                tokenList={sortedTokens}
                balances={balances}
                isFetchingBalances={isFetchingBalances}
                isConnectingWallet={isConnectingWallet}
                isFetching={isFetchingTokens}
                selectedChainConfig={chainConfig}
                selectedToken={token}
                sourceToken={sourceToken}
                isSameChainSwap={isSameChainSwap}
                isSource={isSource}
                wallet={wallet}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSelectToken={onTokenSelect}
              />
            )}

            {activeTab === 'pools' && (
              <ProtocolTab
                isSource={isSource}
                selectedProtocol={selectedProtocol}
                showProtocolSearch={showProtocolSearch}
                setShowProtocolSearch={setShowProtocolSearch}
                selectedChainConfig={chainConfig}
                sortedPoolList={sortedPoolList}
                wallet={wallet}
                onTokenSelect={onTokenSelect}
                isConnectingWallet={isConnectingWallet}
                isPoolsFetching={isPoolsFetching}
                isPoolsBalancesFetching={isPoolsBalancesFetching}
                poolBalances={poolBalances}
                setProtocol={setProtocol}
              />
            )}
          </Box>
        </>
      )}

      {!showChainSearch && !showTabs && chainConfig && (
        <TokenList
          tokenList={sortedTokens}
          balances={balances}
          isFetchingBalances={isFetchingBalances}
          isConnectingWallet={isConnectingWallet}
          isFetching={isFetchingTokens}
          selectedChainConfig={chainConfig}
          selectedToken={token}
          sourceToken={sourceToken}
          isSameChainSwap={isSameChainSwap}
          isSource={isSource}
          wallet={wallet}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSelectToken={onTokenSelect}
        />
      )}
    </SwipeableDrawer>
  );
}

export default memo(AssetPickerDrawer);
