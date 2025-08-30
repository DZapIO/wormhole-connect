import React, { memo, useState } from 'react';
import { useTheme, Tabs, Tab, Box } from '@mui/material';
import Popover from '@mui/material/Popover';
import { bindPopover } from 'material-ui-popup-state/hooks';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { type Chain } from '@wormhole-foundation/sdk';

import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import type { Token } from 'config/tokens';
import type { Balances } from 'utils/wallet/types';
import ChainList from 'views/v3/Zap/AssetPicker/ChainList';
import TokenList from 'views/v3/Zap/AssetPicker/token/TokenList';
import PoolList from 'views/v3/Zap/AssetPicker/pool/PoolList';
import PositionList from 'views/v3/Zap/AssetPicker/position/PositionList';
import ProtocolList from './ProtocolList';
import type { ZapPool, ZapPosition } from 'config/zapAsset';

interface AssetPickerPopoverProps {
  popupState: PopupState;
  anchorEl: HTMLElement | null;
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
  onPoolSelect?: (pool: ZapPool) => void;
  onPositionSelect?: (position: ZapPosition) => void;
}

function AssetPickerPopover({
  popupState,
  anchorEl,
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
  onPoolSelect,
  onPositionSelect,
}: AssetPickerPopoverProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Popover
      {...bindPopover(popupState)}
      transitionDuration={200}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      marginThreshold={4}
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            maxWidth: '420px',
            borderRadius: '8px',
            background: theme.palette.input.background,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
          },
        },
        root: {
          sx: {
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
          },
        },
      }}
    >
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

          <Box>
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
                    {onPoolSelect && !isSource && (
                      <Box sx={{ mb: 2 }}>
                        <PoolList
                          selectedChainConfig={chainConfig}
                          wallet={wallet}
                          onSelectPool={onPoolSelect}
                          provider={selectedProvider}
                          isConnectingWallet={isConnectingWallet}
                        />
                      </Box>
                    )}

                    {/* Show positions only for connected wallet when isSource is true */}
                    {onPositionSelect && wallet?.address && isSource && (
                      <Box sx={{ mt: 2 }}>
                        <PositionList
                          selectedChainConfig={chainConfig}
                          wallet={wallet}
                          onSelectPosition={onPositionSelect}
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
    </Popover>
  );
}

export default memo(AssetPickerPopover);
