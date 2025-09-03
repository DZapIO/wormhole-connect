import { Box, ListItemButton, Typography, useTheme } from '@mui/material';
import type { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';
import { type ZapAsset } from 'config/zapAsset';
import React from 'react';
import { displayAddress, getUSDFormat } from 'utils';
import TokenBalance from 'components/TokenBalance';
import TokenIcon from 'icons/TokenIcons';

interface Props {
  isSource: boolean;
  asset: ZapAsset;
  chain: Chain;
  balance: sdkAmount.Amount | null;
  onClick: () => void;
  isSelected: boolean;
}

const AssetItem = ({
  asset,
  chain,
  onClick,
  isSelected,
  balance,
  isSource,
}: Props) => {
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
    assetInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
    },
    assetDetails: {
      display: 'flex',
      flexDirection: 'column' as const,
      flex: 1,
      minWidth: 0,
    },
    assetName: {
      fontSize: '14px',
      fontWeight: 500,
      color: theme.palette.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    assetAddress: {
      fontSize: '12px',
      color: theme.palette.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    assetStats: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      gap: '2px',
    },
    primaryStat: {
      fontSize: '12px',
      color: theme.palette.text.secondary,
    },
    apy: {
      fontSize: '12px',
      color: theme.palette.success.main,
      fontWeight: 500,
    },
  };
  // Get the primary stat (TVL for pools, amount USD for positions)
  const getPrimaryStat = () => {
    if (balance && isSource) {
      return <TokenBalance balance={balance} />;
    }
    if (asset.zapTokenInfo?.tvl && !isSource) {
      return `TVL: ${getUSDFormat(Number(asset.zapTokenInfo?.tvl || 0))}`;
    }
    return null;
  };

  return (
    <ListItemButton sx={styles.container} onClick={onClick} dense>
      <Box sx={styles.assetInfo}>
        <TokenIcon icon={asset.icon} />

        <Box sx={styles.assetDetails}>
          <Typography sx={styles.assetName}>{asset.name}</Typography>
          <Typography sx={styles.assetAddress}>
            {displayAddress(chain, asset.address?.toString() || '')}
          </Typography>
        </Box>

        <Box sx={styles.assetStats}>
          {getPrimaryStat() && (
            <Typography sx={styles.primaryStat}>{getPrimaryStat()}</Typography>
          )}
          <Typography sx={styles.apy}>
            APR:{' '}
            {asset.zapTokenInfo?.apr
              ? `${Number(asset.zapTokenInfo.apr).toFixed(2)}%`
              : 'N/A'}
          </Typography>
        </Box>
      </Box>
    </ListItemButton>
  );
};

export default AssetItem;
