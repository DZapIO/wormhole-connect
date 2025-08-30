import React, { useMemo, useState } from 'react';
import { Box, Card, CardContent, Skeleton, useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';

import type { ChainConfig } from 'config/types';
import type { ZapPool } from 'config/zapAsset';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';
import PoolItem from './PoolItem';
import { usePoolList } from 'hooks/usePoolList';
import { getChainId } from 'utils/chainMapping';

type Props = {
  selectedChainConfig: ChainConfig;
  selectedPool?: ZapPool;
  wallet: WalletData;
  onSelectPool: (pool: ZapPool) => void;
  provider?: string;
  isConnectingWallet?: boolean;
};

const PoolList = (props: Props) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch pools for the selected chain and provider
  const {
    pools,
    loading: isFetching,
    error: _poolsError,
  } = usePoolList({
    chainId: getChainId(props.selectedChainConfig.sdkName),
    provider: props.provider,
    searchQuery,
  });

  const sortedPools = pools;
  console.log('pools', { sortedPools });

  const emptyMessage = useMemo(() => {
    let message = '';

    if (!props.wallet?.address) {
      message = 'Connect wallet to see available pools';
    } else {
      message = 'No pools found for this provider';
    }

    return (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        {message}
      </Typography>
    );
  }, [props.wallet?.address, theme.palette.grey.A400]);

  const placeholder = 'Search for a pool';

  const styles = useMemo(
    () => ({
      card: {
        background: theme.palette.input.background,
        maxWidth: '420px',
      },
      poolListContainer: {
        padding: '16px 0 0 0 !important',
      },
      title: {
        fontSize: 14,
        marginBottom: '8px',
      },
      poolLoader: {
        padding: 0,
        display: 'flex',
        justifyContent: 'space-between',
      },
      poolList: {
        maxHeight: '360px',
        [theme.breakpoints.down('sm')]: {
          maxHeight: '520px',
        },
      },
    }),
    [theme],
  );

  // Determine the current state of the pool list
  const listState = useMemo(() => {
    // Currently fetching initial data
    if (isFetching) {
      return 'loading';
    }

    // We have data but no pools to show
    if (sortedPools.length === 0) {
      return 'empty';
    }

    // Normal state - show the pool list
    return 'ready';
  }, [isFetching, sortedPools.length]);

  const shouldShowLoadingState = listState === 'loading';
  const shouldShowEmptyMessage = listState === 'empty';

  const searchList = (
    <SearchableList<ZapPool>
      searchPlaceholder={placeholder}
      sx={styles.poolList}
      dataTestId="pool-search-list"
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
              Pools on {props.selectedChainConfig.displayName}
            </Typography>
          </Box>
        )
      }
      loading={
        shouldShowLoadingState &&
        [1, 2, 3].map((x) => (
          <ListItemButton sx={styles.poolLoader} dense key={x}>
            <Box padding="8px 16px">
              <Skeleton variant="circular" width="36px" height="36px" />
            </Box>
          </ListItemButton>
        ))
      }
      items={sortedPools}
      onQueryChange={setSearchQuery}
      filterFn={(pool, query) => {
        if (query.length === 0) return true;

        const queryLC = query.toLowerCase();

        const symbolMatch = [pool.symbol, pool.name].some((criteria) =>
          criteria?.toLowerCase()?.startsWith?.(queryLC),
        );
        if (symbolMatch) return true;

        if (pool.address?.toString().toLowerCase() === queryLC) {
          return true;
        }

        return false;
      }}
      renderFn={(pool: ZapPool) => {
        return (
          <PoolItem
            key={pool.address || pool.symbol}
            pool={pool}
            chain={props.selectedChainConfig.sdkName}
            onClick={() => {
              props.onSelectPool(pool);
            }}
            isSelected={pool.address === props.selectedPool?.address}
          />
        );
      }}
    />
  );

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.poolListContainer}>
        <Box sx={{ display: 'flex', padding: '0 16px' }}>
          <Typography width="100%" sx={styles.title}>
            Select a pool
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

export default React.memo(PoolList);
