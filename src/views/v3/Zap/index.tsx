import CopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ConfigurablePageHeader from 'components/ConfigurablePageHeader';
import FooterNavBar from 'components/FooterNavBar';
import Header from 'components/Header';
import AlertBannerV3 from 'components/v3/AlertBanner';
import config from 'config';
import { type ZapAsset } from 'config/zapAsset';

import { useConnectToLastUsedWallet } from 'hooks/useConnectToLastUsedWallet';
import useGetTokenBalances from 'hooks/useGetTokenBalances';

import Button from 'components/v3/Button';
import { useTokens } from 'contexts/TokensContext';
import { useSortedRoutesWithQuotes } from 'hooks/useSortedRoutesWithQuotes';
import { useWalletCompatibility } from 'hooks/useWalletCompatibility';
import useComputeZapDestinationTokens from 'hooks/zap/useComputeZapDestinationTokens';
import useConfirmZapTransaction from 'hooks/zap/useConfirmZapTransaction';
import { useGetZapAssets } from 'hooks/zap/useGetZapAssets';
import HistoryIcon from 'icons/History';
import PoweredByIcon from 'icons/PoweredBy';
import type { RootState } from 'store';
import {
  clearDestToken,
  clearToken,
  selectFromChain,
  selectToChain,
  setDestToken,
  setToken,
  setTransferRoute,
} from 'store/zap';
import { copyTextToClipboard } from 'utils';
import { getChainFromId } from 'utils/chainMapping';
import { OPACITY } from 'utils/style';
import { useValidate } from 'utils/transferValidation';
import { TransferWallet } from 'utils/wallet';
import { getZapChainConfigs } from 'utils/zap';
import SwapInputs from 'views/v3/Bridge/SwapInputs';
import WalletConnector from 'views/v3/Bridge/WalletConnector';
import AmountValidationError from '../Bridge/AmountValidationError';
import Routes from '../Bridge/Routes';
import TxHistory from '../TxHistory';
import AssetPicker from './AssetPicker';
// import ZapTxHistoryWidget from './TxHistory/Widget';

export type ZapProps = {
  showHistory?: boolean;
};

function Zap(props: ZapProps) {
  const theme: any = useTheme();
  const [showHistory, setShowHistory] = useState(props.showHistory ?? false);
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const popoverAnchorRef = useRef<HTMLElement>(null);
  const dispatch = useDispatch();
  const [errorCopied, setErrorCopied] = useState(false);
  const { lastTokenCacheUpdate } = useTokens();

  // Get zappingChains from Redux store
  const { zappingChains } = useSelector((state: RootState) => state.zapInput);

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
      ctaContainer: {
        width: '100%',
      },
      doneIcon: {
        fontSize: '14px',
        color: theme.palette.success.main,
      },
      confirmTransaction: {
        padding: '8px 16px',
        height: '48px',
        margin: 'auto',
        maxWidth: '420px',
        width: '100%',
      },
      copyIcon: {
        fontSize: '14px',
      },
    }),
    [mobile, theme.palette.background.form, theme.palette.success.main],
  );

  // --- pipeline state gathering ---
  // Connected wallets, if any
  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const {
    fromChain: sourceChain,
    toChain: destChain,
    route,
    amount,
    isTransactionInProgress,
    validations: _validations,
  } = useSelector((state: RootState) => ({
    ...state.zapInput,
    ...state.relay,
  }));

  // Get zap assets from zapInput store
  const { token: sourceZapAsset, destToken: destZapAsset } = useSelector(
    (state: RootState) => state.zapInput,
  );
  const isSameChainSwap = sourceChain === destChain;

  const { sourceToken, destToken } = useGetZapAssets();

  const {
    quotes,
    isFetching: isFetchingQuotes,
    sortedRoutes,
  } = useSortedRoutesWithQuotes({
    amount,
    fromChain: sourceChain,
    toChain: destChain,
    toNativeToken: 0,
    sourceToken,
    destToken,
    receivingWallet,
  });

  const quote = Object.values(quotes)[0];

  // For zap operations, we don't need route selection since there's only one zap provider
  useEffect(() => {
    if (quote?.success) {
      dispatch(setTransferRoute('zap'));
    } else {
      dispatch(setTransferRoute(''));
    }
  }, [quote, dispatch]);

  // Connect to any previously used wallets for the selected networks
  const { isConnecting: isConnectingWallet } = useConnectToLastUsedWallet(
    sourceChain,
    destChain,
  );

  // Call to initiate transfer inputs validations
  useValidate();

  // Get input validation result - disabled for now
  // const _isValid = useMemo(() => isTransferValid(_validations), [_validations]);

  // All supported chains for zapping functionality
  const supportedChains = useMemo(() => {
    return Object.keys(zappingChains)
      .map((chainId) => getChainFromId(Number(chainId)))
      .filter((chain): chain is Chain => chain !== undefined);
  }, [zappingChains]);

  // Get tokens for source chain (for token selection within unified picker)
  const sourceTokens = useMemo(() => {
    if (sourceChain) {
      return config.tokens.getAllForChain(sourceChain);
    } else {
      return [];
    }
    // Disabled because we're using the global cache and we have to monitor values that aren't directly used in this hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceChain, lastTokenCacheUpdate]);

  const { isFetching: isFetchingSupportedDestTokens, supportedDestTokens } =
    useComputeZapDestinationTokens({
      sourceChain,
      destChain,
      sourceToken,
    });

  // Supported chains for the source network
  const supportedZapChains = useMemo(() => {
    return getZapChainConfigs(supportedChains);
  }, [supportedChains]);

  // Build balance requests for source and destination
  const sourceBalanceRequest = useMemo(() => {
    if (sourceChain && sendingWallet?.address) {
      return {
        chain: sourceChain,
        wallet: sendingWallet,
        tokens: sourceTokens,
      };
    }
    return undefined;
  }, [sourceChain, sendingWallet, sourceTokens, sourceToken]);

  const destBalanceRequest = useMemo(() => {
    if (destChain && receivingWallet?.address) {
      return {
        chain: destChain,
        wallet: receivingWallet,
        tokens: config.tokens.getAllForChain(destChain),
      };
    }
    return undefined;
  }, [destChain, receivingWallet]);

  const balances = useGetTokenBalances({
    source: sourceBalanceRequest,
    destination: destBalanceRequest,
  });

  // TODO: Implement zap-specific amount validation
  const amountValidation = {
    error: undefined,
    warning: undefined,
    info: undefined,
  };

  // Handlers for source asset picker
  const handleSourceChainChange = useCallback(
    (value: Chain) => {
      selectFromChain(dispatch, value, sendingWallet);
      dispatch(clearToken());
    },
    [dispatch, sendingWallet],
  );

  const handleSourceZapAssetChange = useCallback(
    (value: ZapAsset) => {
      dispatch(setToken(value.tuple));
    },
    [dispatch],
  );

  // Handlers for destination asset picker
  const handleDestChainChange = useCallback(
    (value: Chain) => {
      selectToChain(dispatch, value, receivingWallet);
      dispatch(clearDestToken());
    },
    [dispatch, receivingWallet],
  );

  const handleDestZapAssetChange = useCallback(
    (value: ZapAsset) => {
      dispatch(setDestToken(value.tuple));
    },
    [dispatch],
  );

  const destQuoteResult = quote?.success ? quote : undefined;

  const handleHistoryToggle = useCallback(() => {
    setShowHistory((value) => !value);
    config.triggerEvent({
      type: 'history.load',
      details: {
        wallet: sendingWallet?.address,
      },
    });
  }, [sendingWallet?.address]);

  const isTxHistoryDisabled =
    !sendingWallet?.address || isTransactionInProgress;

  const walletConnectorProps = useMemo(() => {
    if (sendingWallet?.address && receivingWallet?.address) {
      return null;
    }
    if (sendingWallet?.address && !receivingWallet?.address) {
      return {
        disabled: !destChain,
        side: 'destination' as const,
        type: TransferWallet.RECEIVING,
      };
    }
    return {
      disabled: !sourceChain,
      side: 'source' as const,
      type: TransferWallet.SENDING,
    };
  }, [
    sendingWallet?.address,
    receivingWallet?.address,
    destChain,
    sourceChain,
  ]);

  const { isCompatible: _isWalletCompatible } = useWalletCompatibility({
    sendingWallet,
    receivingWallet,
    sourceChain,
    destChain,
    routes: quote ? ['zap'] : [],
  });

  const {
    error: txError,
    errorInternal: txErrorInternal,
    onConfirm,
  } = useConfirmZapTransaction({ quotes });

  const transactionError = useMemo(() => {
    if (!txError) {
      return null;
    }

    return (
      <Box sx={{ marginBottom: 2 }}>
        <AlertBannerV3 error testId="send-error-message">
          {txError}
        </AlertBannerV3>
        {txErrorInternal && txErrorInternal.message && config.ui.getHelpUrl ? (
          <Typography fontSize={14} sx={{ marginTop: 1 }}>
            Having trouble?{' '}
            <a
              href="#"
              onClick={() => {
                copyTextToClipboard(txErrorInternal.message);
                setErrorCopied(true);
                setTimeout(() => setErrorCopied(false), 3000);
              }}
            >
              Copy the error logs{' '}
              {errorCopied ? (
                <DoneIcon sx={styles.doneIcon} />
              ) : (
                <CopyIcon sx={styles.copyIcon} />
              )}
            </a>
            {' and '}
            <a href={config.ui.getHelpUrl} target="_blank" rel="noreferrer">
              ask for help
            </a>
            .
          </Typography>
        ) : null}
      </Box>
    );
  }, [styles.copyIcon, styles.doneIcon, errorCopied, txError, txErrorInternal]);

  const hasEnteredAmount = amount && sdkAmount.whole(amount) > 0;

  const hasConnectedWallets = sendingWallet.address && receivingWallet.address;

  const confirmButtonTooltip =
    !sourceChain || !sourceZapAsset
      ? 'Please select a source asset'
      : !destChain || !destZapAsset
      ? 'Please select a destination asset'
      : !hasEnteredAmount
      ? 'Please enter an amount'
      : isFetchingQuotes
      ? 'Loading quotes...'
      : !route
      ? 'Please select a quote'
      : '';
  const confirmTransactionDisabled =
    !sourceChain ||
    !sourceToken ||
    !destChain ||
    !destToken ||
    !hasConnectedWallets ||
    !route ||
    isFetchingQuotes ||
    !hasEnteredAmount ||
    isTransactionInProgress ||
    !!amountValidation.error;

  // Review transaction button is shown only when everything is ready
  const confirmTransactionButton = useMemo(() => {
    return (
      <Button
        disabled={confirmTransactionDisabled}
        data-testid="confirm-transaction-button"
        variant="primary"
        styleOverrides={styles.confirmTransaction}
        onClick={onConfirm}
      >
        {isTransactionInProgress ? (
          <Typography
            display="flex"
            alignItems="center"
            gap={1}
            textTransform="none"
          >
            {mobile ? 'Preparing' : 'Preparing transaction'}
          </Typography>
        ) : !isTransactionInProgress && isFetchingQuotes ? (
          <Typography
            display="flex"
            alignItems="center"
            gap={1}
            textTransform="none"
          >
            {mobile ? 'Refreshing' : 'Refreshing quote'}
          </Typography>
        ) : (
          <Typography textTransform="none">
            {mobile ? 'Confirm' : 'Confirm transaction'}
          </Typography>
        )}
      </Button>
    );
  }, [
    confirmTransactionDisabled,
    styles.confirmTransaction,
    isTransactionInProgress,
    mobile,
    isFetchingQuotes,
  ]);

  const bridgeContent = (
    <>
      <Stack sx={{ gap: '4px', position: 'relative' }}>
        {/* Source asset picker */}
        <Box ref={popoverAnchorRef}>
          <AssetPicker
            chain={sourceChain}
            chainList={supportedZapChains}
            token={sourceToken}
            tokenList={sourceTokens}
            setChain={handleSourceChainChange}
            setToken={handleSourceZapAssetChange}
            wallet={sendingWallet}
            isSameChainSwap={isSameChainSwap}
            isSource={true}
            isTransactionInProgress={isTransactionInProgress}
            dataTestId="source-asset-picker"
            isConnectingWallet={isConnectingWallet}
            balances={balances.source.balances}
            isFetchingBalances={balances.isFetching}
            anchorEl={popoverAnchorRef.current}
            amountValidation={amountValidation}
          />
        </Box>
        {/* Swap source/destination assets button */}
        <SwapInputs />
        {/* Destination asset picker */}
        <AssetPicker
          chain={destChain}
          chainList={supportedZapChains}
          token={destToken}
          sourceToken={sourceToken}
          tokenList={supportedDestTokens}
          isFetchingQuotes={isFetchingQuotes}
          isFetchingTokens={isFetchingSupportedDestTokens}
          setChain={handleDestChainChange}
          setToken={handleDestZapAssetChange}
          wallet={receivingWallet}
          isSameChainSwap={isSameChainSwap}
          isSource={false}
          isTransactionInProgress={isTransactionInProgress}
          dataTestId="dest-asset-picker"
          isConnectingWallet={isConnectingWallet}
          balances={balances.destination.balances}
          isFetchingBalances={balances.isFetching}
          quote={destQuoteResult?.success ? destQuoteResult : undefined}
          anchorEl={popoverAnchorRef.current}
        />
      </Stack>
      <Box component="span" sx={styles.ctaContainer}>
        {hasConnectedWallets ? (
          <Tooltip title={confirmButtonTooltip}>
            <span>{confirmTransactionButton}</span>
          </Tooltip>
        ) : walletConnectorProps ? (
          <WalletConnector {...walletConnectorProps} />
        ) : null}
      </Box>
      {transactionError}
      <AmountValidationError validation={amountValidation} />
    </>
  );

  const iconTooltip =
    (!sendingWallet?.address && 'No connected wallets found') ||
    (showHistory ? 'Show zap' : 'Show history');

  return (
    <Box sx={{ ...styles.zapContent }} data-testid="zap-view">
      <Box sx={styles.titleContent}>
        <ConfigurablePageHeader />
        {config.ui.showInProgressWidget && (
          // <ZapTxHistoryWidget
          //   transactions={[]} // TODO: Get actual Zap transactions
          //   disabled={isTxHistoryDisabled}
          // />
          <></>
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
        {showHistory ? <TxHistory /> : <>{bridgeContent}</>}
      </Box>
      {hasEnteredAmount && !showHistory && (
        <Box sx={{ marginTop: '12px', width: '100%' }}>
          <Routes
            routes={sortedRoutes}
            selectedRoute={route}
            onRouteChange={() => {}}
            quotes={quotes}
            isLoading={isFetchingQuotes}
          />
        </Box>
      )}
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
