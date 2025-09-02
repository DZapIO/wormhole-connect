import React from 'react';

import type { ChainConfig } from 'config/types';
import type { ZapAsset, ZapPosition } from 'config/zapAsset';
import useComputePosition from 'hooks/zap/useGetPositions';
import type { WalletData } from 'store/wallet';
import AssetList from './AssetList';

type Props = {
  selectedChainConfig: ChainConfig;
  selectedPosition?: ZapPosition;
  wallet: WalletData;
  onSelectPosition: (position: ZapAsset) => void;
  provider: string;
  isConnectingWallet?: boolean;
};

const PositionList = (props: Props) => {
  const { positions, isFetching } = useComputePosition({
    chain: props.selectedChainConfig.sdkName,
    provider: props.provider,
    userAddress: props.wallet?.address,
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
      loading={isFetching}
    />
  );
};

export default React.memo(PositionList);
