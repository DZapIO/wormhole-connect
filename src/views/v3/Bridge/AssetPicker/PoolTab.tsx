import { Box } from '@mui/material';
import React, { memo, useCallback, useEffect } from 'react';

import type { Token } from 'config/tokens';
import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import type { Balances } from 'utils/wallet/types';
import PoolList from 'views/v3/Bridge/AssetPicker/Asset/PoolList';
import ProtocolList from './ProtocolList';
import { getDefaultProtocol } from 'utils/zap';

interface PoolsTabProps {
  isSource: boolean;
  selectedProtocol?: string;
  showProtocolSearch?: boolean;
  setShowProtocolSearch?: (value: boolean) => void;
  selectedChainConfig?: ChainConfig;
  sortedPoolList?: Token[];
  wallet: WalletData;
  onTokenSelect: (value: Token) => void;
  isPoolsFetching?: boolean;
  isPoolsBalancesFetching?: boolean;
  poolBalances?: Balances;
  setProtocol?: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function PoolsTab({
  isSource,
  selectedProtocol,
  showProtocolSearch,
  setShowProtocolSearch,
  selectedChainConfig,
  sortedPoolList,
  wallet,
  onTokenSelect,
  isPoolsFetching,
  isPoolsBalancesFetching,
  poolBalances,
  setProtocol,
}: PoolsTabProps) {
  // Update selected protocol when chain changes
  useEffect(() => {
    if (setProtocol) {
      setProtocol((prev) => getDefaultProtocol(selectedChainConfig, prev));
    }
  }, [selectedChainConfig, setProtocol]);

  const handleProtocolSelect = useCallback(
    (protocolId: string) => {
      setProtocol?.(protocolId);
    },
    [setProtocol],
  );

  // Don't render if required props are not provided
  if (
    showProtocolSearch === undefined ||
    !setShowProtocolSearch ||
    !setProtocol
  ) {
    return null;
  }

  return (
    <Box>
      <ProtocolList
        selectedProtocol={selectedProtocol}
        showSearch={showProtocolSearch}
        setShowSearch={setShowProtocolSearch}
        onProtocolSelect={handleProtocolSelect}
        selectedChainConfig={selectedChainConfig}
      />

      {/* Pools and Positions sections under Protocols */}
      {selectedProtocol && selectedChainConfig && !showProtocolSearch && (
        <Box sx={{ mt: 2 }}>
          {/* Show pools for general browsing */}
          <Box sx={{ mb: 2 }}>
            <PoolList
              isSource={isSource}
              selectedChainConfig={selectedChainConfig}
              pools={sortedPoolList || []}
              wallet={wallet}
              onSelectPool={onTokenSelect}
              protocol={selectedProtocol}
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

export default memo(PoolsTab);
