import React from 'react';
import { Box, ListItemButton, Typography, useTheme } from '@mui/material';
import type { Chain } from '@wormhole-foundation/sdk';
import type { ZapPosition } from 'config/zapAsset';
import PoolIcon from '../pool/PoolIcon';
import { displayAddress } from 'utils';

interface Props {
  position: ZapPosition;
  chain: Chain;
  onClick: () => void;
  isSelected: boolean;
}

const PositionItem = ({ position, chain, onClick, isSelected }: Props) => {
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
    positionInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
    },
    positionDetails: {
      display: 'flex',
      flexDirection: 'column' as const,
      flex: 1,
      minWidth: 0,
    },
    positionName: {
      fontSize: '14px',
      fontWeight: 500,
      color: theme.palette.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    positionSymbol: {
      fontSize: '12px',
      color: theme.palette.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    positionStats: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      gap: '2px',
    },
    amountUsd: {
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
      <Box sx={styles.positionInfo}>
        <PoolIcon
          underlyingAssets={position.underlyingAssets}
          fallbackSymbol={position.name?.charAt(0) || 'P'}
          size={36}
        />

        <Box sx={styles.positionDetails}>
          <Typography sx={styles.positionName}>{position.name}</Typography>
          <Typography sx={styles.positionSymbol}>
            {displayAddress(chain, position.address)}
          </Typography>
        </Box>

        <Box sx={styles.positionStats}>
          {position.amountUSD && (
            <Typography sx={styles.amountUsd}>
              ${Number(position.amountUSD).toLocaleString()}
            </Typography>
          )}
          {position.apr && (
            <Typography sx={styles.apy}>
              {Number(position.apr).toFixed(2)}% APY
            </Typography>
          )}
        </Box>
      </Box>
    </ListItemButton>
  );
};

export default PositionItem;
