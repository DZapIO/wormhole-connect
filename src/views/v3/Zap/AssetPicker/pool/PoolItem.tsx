import { Box, ListItemButton, Typography, useTheme } from '@mui/material';
import type { Chain } from '@wormhole-foundation/sdk';
import React from 'react';
import { displayAddress } from 'utils';
import PoolIcon from './PoolIcon';
import type { ZapAsset } from 'config/zapAsset';

interface Props {
  pool: ZapAsset;
  chain: Chain;
  onClick: () => void;
  isSelected: boolean;
}

const PoolItem = ({ pool, chain, onClick, isSelected }: Props) => {
  const theme = useTheme();

  const styles = {
    container: {
      padding: '8px 16px',
      borderRadius: '8px',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      ...(isSelected && {
        backgroundColor: theme.palette.primary.main + '20',
        border: `1px solid ${theme.palette.primary.main}`,
      }),
    },
    poolInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
    },

    poolDetails: {
      display: 'flex',
      flexDirection: 'column' as const,
      flex: 1,
      minWidth: 0,
    },
    poolName: {
      fontSize: '14px',
      fontWeight: 500,
      color: theme.palette.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    poolSymbol: {
      fontSize: '12px',
      color: theme.palette.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    poolStats: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      gap: '2px',
    },
    tvl: {
      fontSize: '12px',
      color: theme.palette.text.secondary,
    },
    apy: {
      fontSize: '12px',
      color: theme.palette.success.main,
      fontWeight: 500,
    },
  };

  return (
    <ListItemButton sx={styles.container} onClick={onClick} dense>
      <Box sx={styles.poolInfo}>
        <PoolIcon
          underlyingAssets={pool.zapTokenInfo?.underlyingAssets}
          fallbackSymbol={pool.symbol || 'P'}
          size={36}
        />

        <Box sx={styles.poolDetails}>
          <Typography sx={styles.poolName}>{pool.name}</Typography>
          <Typography sx={styles.poolSymbol}>
            {displayAddress(chain, pool.address.toString())}
          </Typography>
        </Box>

        <Box sx={styles.poolStats}>
          {pool.zapTokenInfo?.tvl && (
            <Typography sx={styles.tvl}>
              TVL: ${Number(pool.zapTokenInfo?.tvl).toLocaleString()}
            </Typography>
          )}
          {pool.zapTokenInfo?.apr && (
            <Typography sx={styles.apy}>
              {Number(pool.zapTokenInfo?.apr).toFixed(2)}% APY
            </Typography>
          )}
        </Box>
      </Box>
    </ListItemButton>
  );
};

export default PoolItem;
