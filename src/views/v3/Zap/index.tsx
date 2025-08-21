import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { useCallback, useMemo, useState } from 'react';

import ConfigurablePageHeader from 'components/ConfigurablePageHeader';
import FooterNavBar from 'components/FooterNavBar';
import Header from 'components/Header';
import config from 'config';
import HistoryIcon from 'icons/History';
import PoweredByIcon from 'icons/PoweredBy';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import { OPACITY } from 'utils/style';
import TxHistoryWidget from 'views/v3/TxHistory/Widget';
import TxHistory from '../TxHistory';

export type ZapProps = {
  showHistory?: boolean;
};

function Zap(props: ZapProps) {
  const theme: any = useTheme();
  const [showHistory, setShowHistory] = useState(props.showHistory ?? false);
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const styles = useMemo(
    () => ({
      zapContent: {
        margin: 'auto',
        maxWidth: '452px',
      },
      zapHeader: {
        width: '100%',
        minHeight: '28px',
        display: 'flex',
        alignItems: 'center',
        padding: '20px 0',
      },
      formContent: {
        backgroundColor: theme.palette.background.form + OPACITY[20],
        borderRadius: '8px',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        width: '452px',
        gap: '16px',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', // Safari support
      },
      formContentMobile: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      },
      titleContent: {
        maxWidth: mobile ? '420px' : '452px',
      },
    }),
    [mobile, theme.palette.background.form],
  );

  const { sending: sendingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  // Handler for history toggle
  const handleHistoryToggle = useCallback(() => {
    setShowHistory((value) => !value);
    config.triggerEvent({
      type: 'history.load',
      details: {
        wallet: sendingWallet?.address,
      },
    });
  }, [sendingWallet?.address]);

  const isTxHistoryDisabled = !sendingWallet?.address;

  const iconTooltip =
    (!sendingWallet?.address && 'No connected wallets found') ||
    (showHistory ? 'Show zap' : 'Show history');

  return (
    <Box sx={{ ...styles.zapContent }} data-testid="zap-view">
      <Box sx={styles.titleContent}>
        <ConfigurablePageHeader />
        {config.ui.showInProgressWidget && (
          <TxHistoryWidget disabled={isTxHistoryDisabled} />
        )}
        <Box sx={styles.zapHeader}>
          <Header
            align="left"
            text={config.ui.title ?? 'Wormhole Zap'}
            size={18}
            testId="zap-view-header"
          />
          <Tooltip title={iconTooltip}>
            <span>
              <IconButton
                data-testid="history-button"
                aria-label={showHistory ? 'Show zap' : 'Show history'}
                sx={{
                  backgroundColor: theme.palette.background.form + OPACITY[20],
                  padding: '12px',
                  width: '40px',
                  height: '40px',
                  border: `1px solid ${theme.palette.input.border}`,
                  borderRadius: '40px',
                }}
                disabled={isTxHistoryDisabled}
                onClick={handleHistoryToggle}
              >
                {showHistory ? (
                  <SwapHorizIcon sx={{ fontSize: '16px' }} />
                ) : (
                  <HistoryIcon sx={{ fontSize: '16px' }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      <Box
        sx={
          mobile ? { ...styles.formContentMobile } : { ...styles.formContent }
        }
      >
        {showHistory ? <TxHistory /> : <></>}
      </Box>
      {config.ui.showFooter && (
        <>
          <PoweredByIcon color={theme.palette.text.primary} />
          <FooterNavBar />
        </>
      )}
    </Box>
  );
}

export default React.memo(Zap);
