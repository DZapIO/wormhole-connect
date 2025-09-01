import React from 'react';

import type { ChainConfig } from 'config/types';
import type { ZapAsset } from 'config/zapAsset';
import { usePoolList } from 'hooks/zap/usePoolList';
import type { WalletData } from 'store/wallet';
import { getChainId } from 'utils/chainMapping';
import AssetList from './AssetList';

type Props = {
  selectedChainConfig: ChainConfig;
  selectedPool?: ZapAsset;
  wallet: WalletData;
  onSelectPool: (pool: ZapAsset) => void;
  provider?: string;
  isConnectingWallet?: boolean;
};

const PoolList = (props: Props) => {
  const { pools, loading, error } = usePoolList({
    chainId: getChainId(props.selectedChainConfig.sdkName),
    provider: props.provider,
  });

  return (
    <AssetList
      mode="pools"
      selectedChainConfig={props.selectedChainConfig}
      selectedAsset={props.selectedPool}
      wallet={props.wallet}
      onSelectAsset={props.onSelectPool}
      provider={props.provider}
      isConnectingWallet={props.isConnectingWallet}
      assets={pools}
      loading={loading}
      error={error}
    />
  );
};

export default React.memo(PoolList);
