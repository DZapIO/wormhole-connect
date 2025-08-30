import { Box, Card, CardContent, Skeleton, useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import React, { useMemo, useState } from 'react';

import type { ChainConfig } from 'config/types';
import type { ZapAsset, ZapPosition } from 'config/zapAsset';
import { usePositionList } from 'hooks/zap/usePositionList';
import type { WalletData } from 'store/wallet';
import { getChainId } from 'utils/chainMapping';
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';
import PositionItem from './PositionItem';

type Props = {
  selectedChainConfig: ChainConfig;
  selectedPosition?: ZapPosition;
  wallet: WalletData;
  onSelectPosition: (position: ZapAsset) => void;
  provider?: string;
  isConnectingWallet?: boolean;
};

const PositionList = (props: Props) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch positions for the selected chain and provider
  const { positions, loading: isFetching } = usePositionList({
    chainId: getChainId(props.selectedChainConfig.sdkName) || 0,
    provider: props.provider || '',
    walletAddress: props.wallet?.address,
    searchQuery,
  });

  const sortedPositions = positions;

  const emptyMessage = useMemo(() => {
    let message = '';

    if (!props.wallet?.address && !props.isConnectingWallet) {
      message = 'Connect your wallet to view positions';
    } else if (props.isConnectingWallet) {
      message = 'Connecting wallet...';
    } else {
      message = 'No positions found for this provider';
    }

    return (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        {message}
      </Typography>
    );
  }, [
    props.wallet?.address,
    props.isConnectingWallet,
    theme.palette.grey.A400,
  ]);

  const placeholder = 'Search for a position';

  const styles = useMemo(
    () => ({
      card: {
        background: theme.palette.input.background,
        maxWidth: '420px',
      },
      positionListContainer: {
        padding: '16px 0 0 0 !important',
      },
      title: {
        fontSize: 14,
        marginBottom: '8px',
      },
      positionLoader: {
        padding: 0,
        display: 'flex',
        justifyContent: 'space-between',
      },
      positionList: {
        maxHeight: '360px',
        [theme.breakpoints.down('sm')]: {
          maxHeight: '520px',
        },
      },
    }),
    [theme],
  );

  // Determine the current state of the position list
  const listState = useMemo(() => {
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
    if (props.wallet?.address && sortedPositions.length === 0) {
      return 'empty';
    }

    // Normal state - show the position list
    return 'ready';
  }, [
    props.wallet?.address,
    props.isConnectingWallet,
    isFetching,
    sortedPositions.length,
  ]);

  const shouldShowLoadingState = listState === 'loading';
  const shouldShowEmptyMessage = listState === 'empty';

  const searchList = (
    <SearchableList<ZapAsset>
      searchPlaceholder={placeholder}
      sx={styles.positionList}
      dataTestId="position-search-list"
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
              Your Positions on {props.selectedChainConfig.displayName}
            </Typography>
          </Box>
        )
      }
      loading={
        shouldShowLoadingState &&
        [1, 2, 3].map((x) => (
          <ListItemButton sx={styles.positionLoader} dense key={x}>
            <Box padding="8px 16px">
              <Skeleton variant="circular" width="36px" height="36px" />
            </Box>
          </ListItemButton>
        ))
      }
      items={sortedPositions}
      onQueryChange={setSearchQuery}
      filterFn={(position, query) => {
        if (query.length === 0) return true;

        const queryLC = query.toLowerCase();

        const nameMatch = position.name?.toLowerCase()?.includes?.(queryLC);
        if (nameMatch) return true;

        if (position.address?.toString().toLowerCase() === queryLC) {
          return true;
        }

        return false;
      }}
      renderFn={(position: ZapAsset) => {
        return (
          <PositionItem
            key={position.address?.toString() || position.name}
            position={position}
            chain={props.selectedChainConfig.sdkName}
            onClick={() => {
              props.onSelectPosition(position);
            }}
            isSelected={position.address === props.selectedPosition?.address}
          />
        );
      }}
    />
  );

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.positionListContainer}>
        <Box sx={{ display: 'flex', padding: '0 16px' }}>
          <Typography width="100%" sx={styles.title}>
            Select a position
          </Typography>
          {isFetching ? (
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

export default React.memo(PositionList);
