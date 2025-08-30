import React from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import ClockIcon from 'icons/Clock';
import { millisToHumanString } from 'utils';
import type { ZapQuoteResult } from 'hooks/useFetchZapQuotes';

interface EtaProps {
  route?: ZapQuoteResult;
}

function Eta({ route }: EtaProps) {
  const theme: any = useTheme();

  if (!route || !route.success || !route.path) {
    return null;
  }

  // Calculate total ETA by summing all estimatedDuration from path steps
  const totalEtaSeconds = route.path.reduce((total, step) => {
    return total + (step.estimatedDuration || 0);
  }, 0);

  // Convert seconds to milliseconds for millisToHumanString
  const eta = totalEtaSeconds * 1000;

  return (
    <Box
      sx={{
        display: 'flex',
        fontSize: '14px',
        justifyContent: 'flex-end',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          height: '32px',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 0',
        }}
      >
        <ClockIcon
          sx={{
            color: '#7A8390',
            width: '12px',
            height: '12px',
          }}
        />
        <Typography
          component="span"
          color={theme.palette.text.primary}
          fontSize="14px"
          lineHeight="14px"
        >
          {millisToHumanString(eta)}
        </Typography>
      </Box>
    </Box>
  );
}

export default React.memo(Eta);
