import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import type { routes } from '@wormhole-foundation/sdk';
import React, { memo } from 'react';

import type { ZapQuoteResult } from 'hooks/useFetchZapQuotes';
import SingleRoute from './SingleRoute';

interface RoutesDesktopProps {
  open: boolean;
  routesWithQuotes: string[];
  highlightedRoute?: string;
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>;
  fastestRoute: { name: string; eta: number };
  cheapestRoute: { name: string; amountOut: bigint };
  selectButtonDisabled: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onGasChange: (value: number) => void;
  onRouteSelect: (route: string) => void;
  onRouteConfirm: () => void;
  route: ZapQuoteResult;
}

function RoutesDesktop({
  open,
  onClose,
  routesWithQuotes,
  highlightedRoute,
  quotes,
  fastestRoute,
  cheapestRoute,
  isLoading,
  onRouteSelect,
  onGasChange,
  route,
}: RoutesDesktopProps) {
  const theme = useTheme();

  // Header section - static content, no need to memoize
  const routesHeader = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Typography component={'span'} fontSize="16px" fontWeight={600}>
        Route
      </Typography>
      <IconButton sx={{ opacity: 0.5, padding: 0 }} onClick={onClose}>
        <CloseIcon sx={{ height: '24px', width: '24px' }} />
      </IconButton>
    </Box>
  );

  return (
    <Modal
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', // Safari support
          },
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          padding: '24px',
          borderRadius: '12px',
          gap: '16px',
          display: 'flex',
          flexDirection: 'column',
          width: '420px',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)', // Safari support
        }}
      >
        {routesHeader}
        <SingleRoute
          key={route.name}
          route={route.name}
          error={quoteError}
          isSelected={route.name === highlightedRoute}
          isFastest={route.name === fastestRoute.name}
          isCheapest={route.name === cheapestRoute.name}
          isOnlyChoice={routesWithQuotes.length === 1}
          onSelect={onRouteSelect}
          onGasChange={onGasChange}
          quote={quote}
          isLoading={isLoading}
        />
      </Box>
    </Modal>
  );
}

export default memo(RoutesDesktop);
