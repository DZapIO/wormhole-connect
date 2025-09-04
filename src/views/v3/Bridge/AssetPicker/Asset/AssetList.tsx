import { Box, Card, CardContent, Skeleton, useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import React, { useMemo, useState } from 'react';

import type { ChainConfig } from 'config/types';
import type { ZapAsset } from 'config/zapAsset';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';
import AssetItem from './AssetItem';
import type { Balances } from 'utils/wallet/types';

type Props = {
  isSource: boolean;
  selectedChainConfig: ChainConfig;
  wallet: WalletData;
  provider: string;
  isConnectingWallet?: boolean;
  assets: ZapAsset[];
  balances: Balances;
  isFetchingBalances: boolean;
  loading: boolean;
  error?: string | null;
  onSelectAsset: (asset: ZapAsset) => void;
  selectedAsset?: ZapAsset;
};

const AssetList = (props: Props) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const assets = props.assets;
  const isFetching = props.loading;

  const isFetchingBalances = props.isFetchingBalances;

  const emptyMessage = useMemo(() => {
    let message = '';

    if (props.isSource) {
      if (!props.wallet?.address) {
        message = 'Connect wallet to see available pools';
      } else {
        message = 'No pools found for this provider';
      }
    } else {
      if (!props.wallet?.address && !props.isConnectingWallet) {
        message = 'Connect your wallet to view positions';
      } else if (props.isConnectingWallet) {
        message = 'Connecting wallet...';
      } else {
        message = 'No positions found for this provider';
      }
    }

    return (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        {message}
      </Typography>
    );
  }, [
    props.isSource,
    props.wallet?.address,
    props.isConnectingWallet,
    theme.palette.grey.A400,
  ]);

  const placeholder = props.isSource
    ? 'Search for a pool'
    : 'Search for a position';
  const title = props.isSource ? 'Select a pool' : 'Select a position';
  const listTitle = props.isSource
    ? `Pools on ${props.selectedChainConfig.displayName}`
    : `Your Positions on ${props.selectedChainConfig.displayName}`;

  const styles = useMemo(
    () => ({
      card: {
        background: theme.palette.input.background,
        maxWidth: '420px',
      },
      listContainer: {
        padding: '16px 0 0 0 !important',
      },
      title: {
        fontSize: 14,
        marginBottom: '8px',
      },
      loader: {
        padding: 0,
        display: 'flex',
        justifyContent: 'space-between',
      },
      list: {
        maxHeight: '360px',
        [theme.breakpoints.down('sm')]: {
          maxHeight: '520px',
        },
      },
    }),
    [theme],
  );

  // Determine the current state of the list
  const listState = useMemo(() => {
    if (props.isSource) {
      // Currently fetching initial data
      if (isFetching) {
        return 'loading';
      }

      // We have data but no pools to show
      if (assets.length === 0) {
        return 'empty';
      }

      // Normal state - show the pool list
      return 'ready';
    } else {
      // No wallet connected - show empty state with connect message
      if (!props.wallet?.address && !props.isConnectingWallet) {
        return 'empty';
      }

      // Wallet is connecting - show loading
      if (props.isConnectingWallet) {
        return 'loading';
      }

      // Currently fetching positions for connected wallet
      if (isFetching && props.wallet?.address) {
        return 'loading';
      }

      // We have a connected wallet but no positions to show
      if (props.wallet?.address && assets.length === 0) {
        return 'empty';
      }

      // Normal state - show the position list
      return 'ready';
    }
  }, [
    props.isSource,
    isFetching,
    assets.length,
    props.wallet?.address,
    props.isConnectingWallet,
  ]);

  const shouldShowLoadingState = listState === 'loading';
  const shouldShowEmptyMessage = listState === 'empty';

  const filterFn = useMemo(() => {
    if (props.isSource) {
      return (asset: ZapAsset, query: string) => {
        if (query.length === 0) return true;

        const queryLC = query.toLowerCase();

        const symbolMatch = [asset.symbol, asset.name].some((criteria) =>
          criteria?.toLowerCase()?.startsWith?.(queryLC),
        );
        if (symbolMatch) return true;

        if (asset.address?.toString().toLowerCase() === queryLC) {
          return true;
        }

        return false;
      };
    } else {
      return (asset: ZapAsset, query: string) => {
        if (query.length === 0) return true;

        const queryLC = query.toLowerCase();

        const nameMatch = asset.name?.toLowerCase()?.includes?.(queryLC);
        if (nameMatch) return true;

        if (asset.address?.toString().toLowerCase() === queryLC) {
          return true;
        }

        return false;
      };
    }
  }, [props.isSource]);

  const searchList = (
    <SearchableList<ZapAsset>
      searchPlaceholder={placeholder}
      sx={styles.list}
      dataTestId={`${props.isSource ? 'pool' : 'position'}-search-list`}
      searchQuery={searchQuery}
      listTitle={
        shouldShowEmptyMessage ? (
          emptyMessage
        ) : (
          <Box display="flex" width="100%">
            <Typography
              style={{ flexGrow: '2' }}
              fontSize={14}
              color={theme.palette.text.secondary}
            >
              {listTitle}
            </Typography>
          </Box>
        )
      }
      loading={
        shouldShowLoadingState &&
        [1, 2, 3].map((x) => (
          <ListItemButton sx={styles.loader} dense key={x}>
            <Box padding="8px 16px">
              <Skeleton variant="circular" width="36px" height="36px" />
            </Box>
          </ListItemButton>
        ))
      }
      items={assets}
      onQueryChange={setSearchQuery}
      filterFn={filterFn}
      renderFn={(asset: ZapAsset) => {
        return (
          <AssetItem
            isSource={props.isSource}
            key={asset.key}
            asset={asset}
            chain={props.selectedChainConfig.sdkName}
            onClick={() => {
              props.onSelectAsset?.(asset);
            }}
            isSelected={
              props.selectedAsset ? asset.equals(props.selectedAsset) : false
            }
            balance={props.balances?.[asset.key]?.balance}
          />
        );
      }}
    />
  );

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.listContainer}>
        <Box sx={{ display: 'flex', padding: '0 16px' }}>
          <Typography width="100%" sx={styles.title}>
            {title}
          </Typography>
          {isFetching || isFetchingBalances ? (
            <CircularProgress
              sx={{ alignSelf: 'flex-end', marginBottom: '12px' }}
              size={14}
            />
          ) : null}
        </Box>
        {searchList}
      </CardContent>
    </Card>
  );
};

export default React.memo(AssetList);
