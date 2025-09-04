import React from 'react';

import type { ChainConfig } from 'config/types';
import type { ZapAsset } from 'config/zapAsset';
import type { WalletData } from 'store/wallet';
import AssetList from './AssetList';
import type { Balances } from 'utils/wallet';

type Props = {
  isSource: boolean;
  selectedChainConfig: ChainConfig;
  selectedPool?: ZapAsset;
  wallet: WalletData;
  onSelectPool: (pool: ZapAsset) => void;
  protocol: string;
  isConnectingWallet?: boolean;
  pools: ZapAsset[];
  isPoolsFetching: boolean;
  isPoolsBalancesFetching: boolean;
  poolBalances?: Balances;
};

const PoolList = (props: Props) => {
  return (
    <AssetList
      isSource={props.isSource}
      selectedChainConfig={props.selectedChainConfig}
      selectedAsset={props.selectedPool}
      wallet={props.wallet}
      onSelectAsset={props.onSelectPool}
      protocol={props.protocol}
      assets={props.pools}
      loading={props.isPoolsFetching}
      isFetchingBalances={props.isPoolsBalancesFetching}
      balances={props.poolBalances || {}}
    />
  );
};

export default React.memo(PoolList);
