import React from 'react';

import type { ChainConfig } from 'config/types';
import type { ZapAsset, ZapPosition } from 'config/zapAsset';
import { usePositionList } from 'hooks/zap/usePositionList';
import type { WalletData } from 'store/wallet';
import { getChainId } from 'utils/chainMapping';
import AssetList from './AssetList';

type Props = {
  selectedChainConfig: ChainConfig;
  selectedPosition?: ZapPosition;
  wallet: WalletData;
  onSelectPosition: (position: ZapAsset) => void;
  provider?: string;
  isConnectingWallet?: boolean;
};

const PositionList = (props: Props) => {
  const { positions, loading } = usePositionList({
    chainId: getChainId(props.selectedChainConfig.sdkName) || 0,
    provider: props.provider || '',
    walletAddress: props.wallet?.address,
  });

  return (
    <AssetList
      mode="positions"
      selectedChainConfig={props.selectedChainConfig}
      selectedAsset={props.selectedPosition}
      wallet={props.wallet}
      onSelectAsset={props.onSelectPosition}
      provider={props.provider}
      isConnectingWallet={props.isConnectingWallet}
      assets={positions}
      loading={loading}
    />
  );
};

export default React.memo(PositionList);
