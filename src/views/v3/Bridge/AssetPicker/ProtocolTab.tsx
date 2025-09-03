import { Box } from '@mui/material';
import React, { memo, useCallback, useEffect } from 'react';

import type { Token } from 'config/tokens';
import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import type { Balances } from 'utils/wallet/types';
import PoolList from 'views/v3/Bridge/AssetPicker/Asset/PoolList';
import ProtocolList from './ProtocolList';
import { getDefaultProvider } from 'utils/zap';

interface ProtocolTabProps {
  selectedProvider?: string;
  showProviderSearch?: boolean;
  setShowProviderSearch?: (value: boolean) => void;
  selectedChainConfig?: ChainConfig;
  sortedPoolList?: Token[];
  wallet: WalletData;
  onTokenSelect: (value: Token) => void;
  isConnectingWallet?: boolean;
  isPoolsFetching?: boolean;
  isPoolsBalancesFetching?: boolean;
  poolBalances?: Balances;
  setProvider?: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function ProtocolTab({
  selectedProvider,
  showProviderSearch,
  setShowProviderSearch,
  selectedChainConfig,
  sortedPoolList,
  wallet,
  onTokenSelect,
  isConnectingWallet,
  isPoolsFetching,
  isPoolsBalancesFetching,
  poolBalances,
  setProvider,
}: ProtocolTabProps) {
  // Update selected provider when chain changes
  useEffect(() => {
    if (setProvider) {
      setProvider((prev) => getDefaultProvider(selectedChainConfig, prev));
    }
  }, [selectedChainConfig, setProvider]);

  const handleProviderSelect = useCallback(
    (providerId: string) => {
      setProvider?.(providerId);
    },
    [setProvider],
  );

  // Don't render if required props are not provided
  if (
    showProviderSearch === undefined ||
    !setShowProviderSearch ||
    !setProvider
  ) {
    return null;
  }

  return (
    <Box>
      <ProtocolList
        selectedProvider={selectedProvider}
        showSearch={showProviderSearch}
        setShowSearch={setShowProviderSearch}
        onProviderSelect={handleProviderSelect}
        selectedChainConfig={selectedChainConfig}
      />

      {/* Pools and Positions sections under Protocols */}
      {selectedProvider && selectedChainConfig && !showProviderSearch && (
        <Box sx={{ mt: 2 }}>
          {/* Show pools for general browsing */}
          <Box sx={{ mb: 2 }}>
            <PoolList
              selectedChainConfig={selectedChainConfig}
              pools={sortedPoolList || []}
              wallet={wallet}
              onSelectPool={onTokenSelect}
              provider={selectedProvider}
              isConnectingWallet={isConnectingWallet}
              isPoolsFetching={Boolean(isPoolsFetching)}
              isPoolsBalancesFetching={Boolean(isPoolsBalancesFetching)}
              poolBalances={poolBalances}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default memo(ProtocolTab);
