import React from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface RoutesLinkProps {
  onClick: () => void;
}

function RoutesLink({ onClick }: RoutesLinkProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Link
        component="span"
        data-testid="other-routes-toggle"
        underline="none"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: theme.palette.text.primary,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 700,
          opacity: 0.5,
        }}
        onClick={onClick}
      >
        <span style={{ fontWeight: 600 }}>
          Routing <span style={{ fontWeight: 400 }}>via Dzap</span>
        </span>
        <ChevronRightIcon fontSize="small" sx={{ marginLeft: '4px' }} />
      </Link>
    </Box>
  );
}

export default React.memo(RoutesLink);
