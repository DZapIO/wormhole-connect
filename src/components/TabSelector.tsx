import { Box, Tab, Tabs, useTheme } from '@mui/material';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'store';
import { setRoute } from 'store/router';

const TabSelector = () => {
  const theme: any = useTheme();
  const route = useSelector((state: RootState) => state.router.route);

  const dispatch = useDispatch();

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      const newRoute = newValue as 'bridge' | 'zap';
      dispatch(setRoute(newRoute));
    },
    [dispatch],
  );

  const styles = useMemo(
    () => ({
      container: {
        width: '100%',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
      },
      tabs: {
        backgroundColor: theme.palette.background.default,
        borderRadius: '12px',
        padding: '4px',
        minHeight: 'unset',
        '& .MuiTabs-indicator': {
          display: 'none',
        },
        '& .MuiTabs-flexContainer': {
          gap: '4px',
        },
      },
      tab: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '14px',
        minHeight: '40px',
        minWidth: '100px',
        borderRadius: '8px',
        color: theme.palette.text.secondary,
        '&.Mui-selected': {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '&:hover': {
          backgroundColor: theme.palette.background.paper,
        },
      },
    }),
    [theme],
  );

  return (
    <Box sx={styles.container}>
      <Tabs value={route} onChange={handleTabChange} sx={styles.tabs}>
        <Tab
          value="bridge"
          label="Bridge"
          data-testid="bridge-tab"
          sx={styles.tab}
        />
        <Tab value="zap" label="Zap" data-testid="zap-tab" sx={styles.tab} />
      </Tabs>
    </Box>
  );
};

export default TabSelector;
