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
import ChainList from 'views/v3/Zap/AssetPicker/ChainList';
import PoolList from 'views/v3/Zap/AssetPicker/pool/PoolList';
import PositionList from 'views/v3/Zap/AssetPicker/position/PositionList';
import TokenList from 'views/v3/Zap/AssetPicker/token/TokenList';
import ProtocolList from './ProtocolList';

interface AssetPickerDrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (value: boolean) => void;
  chainList: Array<ChainConfig>;
  chainConfig?: ChainConfig;
  showChainSearch: boolean;
  setShowChainSearch: (value: boolean) => void;
  selectedProvider?: string;
  showProviderSearch: boolean;
  setShowProviderSearch: (value: boolean) => void;
  wallet: WalletData;
  sortedTokens: Token[];
  balances: Balances;
  isFetchingBalances: boolean;
  isConnectingWallet?: boolean;
  isFetchingTokens?: boolean;
  isSameChainSwap: boolean;
  token?: Token;
  sourceToken?: Token;
  isSource: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onChainSelect: (value: Chain) => void;
  onProviderSelect: (providerId: string) => void;
  onTokenSelect: (value: Token) => void;
}

function AssetPickerDrawer({
  isDrawerOpen,
  setIsDrawerOpen,
  chainList,
  chainConfig,
  showChainSearch,
  setShowChainSearch,
  selectedProvider,
  showProviderSearch,
  setShowProviderSearch,
  wallet,
  sortedTokens,
  balances,
  isFetchingBalances,
  isConnectingWallet,
  isFetchingTokens,
  isSameChainSwap,
  token,
  sourceToken,
  isSource,
  searchQuery,
  setSearchQuery,
  onChainSelect,
  onProviderSelect,
  onTokenSelect,
}: AssetPickerDrawerProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Debug logging

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
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

      {/* Tabs */}
      {!showChainSearch && (
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
            {activeTab === 0 && chainConfig && (
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

            {activeTab === 1 && (
              <Box>
                <ProtocolList
                  selectedProvider={selectedProvider}
                  showSearch={showProviderSearch}
                  setShowSearch={setShowProviderSearch}
                  onProviderSelect={onProviderSelect}
                  selectedChainConfig={chainConfig}
                />

                {/* Pools and Positions sections under Protocols */}
                {selectedProvider && chainConfig && !showProviderSearch && (
                  <Box sx={{ mt: 2 }}>
                    {/* Show pools for general browsing */}
                    {
                      <Box sx={{ mb: 2 }}>
                        <PoolList
                          selectedChainConfig={chainConfig}
                          wallet={wallet}
                          onSelectPool={onTokenSelect}
                          provider={selectedProvider}
                          isConnectingWallet={isConnectingWallet}
                        />
                      </Box>
                    }

                    {/* Show positions only for connected wallet when isSource is true */}
                    {wallet?.address && isSource && (
                      <Box sx={{ mt: 2 }}>
                        <PositionList
                          selectedChainConfig={chainConfig}
                          wallet={wallet}
                          onSelectPosition={onTokenSelect}
                          provider={selectedProvider}
                          isConnectingWallet={isConnectingWallet}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </>
      )}
    </SwipeableDrawer>
  );
}

export default memo(AssetPickerDrawer);
