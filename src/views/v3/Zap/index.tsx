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
import type { Token } from 'config/tokens';
import type { ZapAsset } from 'config/zapAsset';
import { ZapAssetType } from 'config/zapAsset';

import { useConnectToLastUsedWallet } from 'hooks/useConnectToLastUsedWallet';
import useGetTokenBalances from 'hooks/useGetTokenBalances';

import { useWalletCompatibility } from 'hooks/useWalletCompatibility';
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
import { getFilteredChains } from 'utils/sdkv2';
import { getChainFromId } from 'utils/chainMapping';
import { OPACITY } from 'utils/style';
import { useValidate } from 'utils/transferValidation';
import { TransferWallet } from 'utils/wallet';
import AssetPicker from 'views/v3/Zap/AssetPicker';
import SwapInputs from 'views/v3/Bridge/SwapInputs';
import WalletConnector from 'views/v3/Bridge/WalletConnector';
import TxHistoryWidget from 'views/v3/TxHistory/Widget';
import TxHistory from '../TxHistory';
import AmountValidationError from '../Bridge/AmountValidationError';
import { useTokens } from 'contexts/TokensContext';
import { useZapQuotes } from 'hooks/useZapQuotes';
import Button from 'components/v3/Button';

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

  // --- pipeline usage ---
  // Convert zapAssets back to tokens for compatibility with existing components
  // For backward compatibility with existing components that expect Token objects
  // Only return Token objects for token assets, undefined for pools/positions
  // Get the actual zap asset data (for pools and positions) - for future use
  const sourceToken = useMemo(() => {
    if (!sourceZapAsset) return undefined;
    const [chain, address, type, provider, nftId] = sourceZapAsset;
    if (type === ZapAssetType.TOKEN) {
      return config.tokens.get(chain, address);
    }
    if (type === ZapAssetType.POOL || type === ZapAssetType.POSITION) {
      return config.zapAssets.get(
        chain,
        address,
        type as ZapAssetType,
        provider,
        nftId,
      );
    }

    return undefined;
  }, [sourceZapAsset]);

  const destToken = useMemo(() => {
    if (!destZapAsset) return undefined;

    const [chain, address, type, provider, nftId] = destZapAsset;
    if (type === ZapAssetType.TOKEN) {
      return config.tokens.get(chain, address);
    }
    if (type === ZapAssetType.POOL || type === ZapAssetType.POSITION) {
      return config.zapAssets.get(
        chain,
        address,
        type as ZapAssetType,
        provider,
        nftId,
      );
    }

    return undefined;
  }, [destZapAsset]);

  console.log({ sourceToken, destToken });

  const { quote, isFetching: isFetchingQuotes } = useZapQuotes({
    amount,
    fromChain: sourceChain,
    toChain: destChain,
    slippage: 0.5, // TODO: Add slippage control
    sourceToken,
    destToken,
    receivingWallet,
  });

  // TODO: Implement zap-specific transaction confirmation
  const txError = null;
  const txErrorInternal = null as { message: string } | null;

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
    const sourceAssets: (Token | ZapAsset)[] = [];
    if (sourceChain) {
      const [, , type, provider] = sourceZapAsset || [];
      if (type === ZapAssetType.POSITION && provider) {
        const zapPositions =
          config.zapAssets.getAllPositionsForChainAndProvider(
            sourceChain,
            provider,
          );
        sourceAssets.push(...zapPositions);
      }
      sourceAssets.push(...config.tokens.getAllForChain(sourceChain));
      return sourceAssets;
    } else {
      return [];
    }
    // Disabled because we're using the global cache and we have to monitor values that aren't directly used in this hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceChain, lastTokenCacheUpdate]);

  // Supported chains for the source network
  const supportedSourceChains = useMemo(() => {
    return getFilteredChains(supportedChains, sourceChain);
  }, [sourceChain, supportedChains]);

  // Supported chains for the destination network
  const supportedDestChains = useMemo(() => {
    return getFilteredChains(supportedChains, sourceChain);
  }, [sourceChain, supportedChains]);

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
  }, [sourceChain, sendingWallet, sourceTokens]);

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
    (value: Token) => {
      // Convert Token to ZapAssetTuple for tokens
      const zapAssetTuple = [
        value.chain,
        value.addressString,
        ZapAssetType.TOKEN,
      ];
      console.log('zapAssetTuple', zapAssetTuple);
      dispatch(setToken(zapAssetTuple as any));
    },
    [dispatch],
  );

  // Handlers for pool and position selection
  const handleSourcePoolSelect = useCallback(
    (pool: any) => {
      // Convert pool to ZapAssetTuple
      const zapAssetTuple = [
        sourceChain!,
        pool.address,
        ZapAssetType.POOL,
        pool.provider,
      ];
      dispatch(setToken(zapAssetTuple as any));
    },
    [dispatch, sourceChain],
  );

  const handleSourcePositionSelect = useCallback(
    (position: any) => {
      // Convert position to ZapAssetTuple
      const zapAssetTuple = [
        sourceChain!,
        position.address,
        ZapAssetType.POSITION,
        position.provider,
        position.nftId || '',
      ];
      dispatch(setToken(zapAssetTuple as any));
    },
    [dispatch, sourceChain],
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
    (value: Token) => {
      // Convert Token to ZapAssetTuple for tokens
      const zapAssetTuple = [value.chain, value.address, ZapAssetType.TOKEN];
      dispatch(setDestToken(zapAssetTuple as any));
    },
    [dispatch],
  );

  // Handlers for destination pool and position selection
  const handleDestPoolSelect = useCallback(
    (pool: any) => {
      // Convert pool to ZapAssetTuple
      const zapAssetTuple = [
        destChain!,
        pool.address,
        ZapAssetType.POOL,
        pool.provider,
      ];
      dispatch(setDestToken(zapAssetTuple as any));
    },
    [dispatch, destChain],
  );

  const handleDestPositionSelect = useCallback(
    (position: any) => {
      // Convert position to ZapAssetTuple
      const zapAssetTuple = [
        destChain!,
        position.address,
        ZapAssetType.POSITION,
        position.provider,
        position.nftId || '',
      ];
      dispatch(setDestToken(zapAssetTuple as any));
    },
    [dispatch, destChain],
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
  // const {
  //   error: txError,
  //   errorInternal: txErrorInternal,
  //   onConfirm,
  // } = useConfirmTransaction({ quotes });

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
        onClick={() => {}}
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

  console.log('sourceToken', sourceToken);
  console.log('destToken', destToken);
  const bridgeContent = (
    <>
      <Stack sx={{ gap: '4px', position: 'relative' }}>
        {/* Source asset picker */}
        <Box ref={popoverAnchorRef}>
          <AssetPicker
            chain={sourceChain}
            chainList={supportedSourceChains}
            token={sourceToken as any}
            tokenList={sourceTokens}
            setChain={handleSourceChainChange}
            setToken={handleSourceZapAssetChange}
            onPoolSelect={handleSourcePoolSelect}
            onPositionSelect={handleSourcePositionSelect}
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
          chainList={supportedDestChains}
          token={destToken as any}
          sourceToken={sourceToken as any}
          tokenList={undefined}
          isFetchingQuotes={isFetchingQuotes}
          isFetchingTokens={false}
          setChain={handleDestChainChange}
          setToken={handleDestZapAssetChange}
          onPoolSelect={handleDestPoolSelect}
          onPositionSelect={handleDestPositionSelect}
          wallet={receivingWallet}
          isSameChainSwap={isSameChainSwap}
          isSource={false}
          isTransactionInProgress={isTransactionInProgress}
          dataTestId="dest-asset-picker"
          isConnectingWallet={isConnectingWallet}
          balances={balances.destination.balances}
          isFetchingBalances={balances.isFetching}
          quote={
            destQuoteResult?.success ? (destQuoteResult as any) : undefined
          }
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
        {showHistory ? <TxHistory /> : <>{bridgeContent}</>}
      </Box>
      {/* {hasEnteredAmount && !showHistory && quote && (
        <Box sx={{ marginTop: '12px', width: '100%' }}>
          <Routes selectedRoute={quote} isLoading={isFetchingQuotes} />
        </Box>
      )} */}
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
