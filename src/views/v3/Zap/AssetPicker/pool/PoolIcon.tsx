import React from 'react';
import { Box, useTheme } from '@mui/material';
import type { ZapUnderlyingToken } from '@dzapio/sdk';

interface Props {
  underlyingAssets?: ZapUnderlyingToken[];
  size?: number;
  fallbackSymbol?: string;
}

const PoolIcon = ({
  underlyingAssets,
  size = 36,
  fallbackSymbol = 'P',
}: Props) => {
  const theme = useTheme();

  const iconSize = size;
  const smallIconSize = size * 0.7;
  const spacing = size * 0.25;

  const baseIconStyle = {
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: theme.palette.grey[200],
  };

  // No assets - show fallback
  if (!underlyingAssets?.length) {
    return (
      <Box sx={{ ...baseIconStyle, width: iconSize, height: iconSize }}>
        {fallbackSymbol.charAt(0).toUpperCase()}
      </Box>
    );
  }

  // Single asset
  if (underlyingAssets.length === 1) {
    const asset = underlyingAssets[0];
    return (
      <Box sx={{ ...baseIconStyle, width: iconSize, height: iconSize }}>
        {asset.logo ? (
          <img src={asset.logo} alt={asset.symbol} width="100%" height="100%" />
        ) : (
          asset.symbol?.charAt(0).toUpperCase() || 'T'
        )}
      </Box>
    );
  }

  // Multiple assets - overlapping
  const maxVisible = 3;
  const visibleAssets = underlyingAssets.slice(0, maxVisible);

  return (
    <Box sx={{ position: 'relative', width: iconSize, height: iconSize }}>
      {visibleAssets.map((asset, index) => (
        <Box
          key={asset.address || index}
          sx={{
            ...baseIconStyle,
            position: 'absolute',
            width: smallIconSize,
            height: smallIconSize,
            left: index * spacing,
            zIndex: maxVisible - index,
            border: `2px solid ${theme.palette.background.paper}`,
          }}
        >
          {asset.logo ? (
            <img
              src={asset.logo}
              alt={asset.symbol}
              width="100%"
              height="100%"
            />
          ) : (
            asset.symbol?.charAt(0).toUpperCase() || (index + 1).toString()
          )}
        </Box>
      ))}

      {underlyingAssets.length > maxVisible && (
        <Box
          sx={{
            ...baseIconStyle,
            position: 'absolute',
            width: smallIconSize,
            height: smallIconSize,
            left: maxVisible * spacing,
            zIndex: 0,
            border: `2px solid ${theme.palette.background.paper}`,
            fontSize: size * 0.2,
          }}
        >
          +{underlyingAssets.length - maxVisible}
        </Box>
      )}
    </Box>
  );
};

export default PoolIcon;
