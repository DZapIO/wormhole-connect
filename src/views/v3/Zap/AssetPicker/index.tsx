import { Box, TextField, Tooltip, useMediaQuery } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Color from 'color';
import AssetBadge from 'components/AssetBadge';
import config from 'config';
import type { ChainConfig } from 'config/types';
import { ZapAssetType, type ZapAsset } from 'config/zapAsset';
import { useTokens } from 'contexts/TokensContext';
import type { AmountValidationResult } from 'hooks/useAmountValidation';
import type { ZapQuoteResult } from 'hooks/zap/useFetchZapQuotes';
import { useTokenList } from 'hooks/useTokenList';
import type { RootState } from 'store';
import type { WalletData } from 'store/wallet';
import { isDisabledChain, setAmount } from 'store/zap';
import { calculateUSDPrice } from 'utils';
import { formatWithCommas } from 'utils/formatNumber';
import { OPACITY } from 'utils/style';
import { TransferWallet } from 'utils/wallet';
import type { Balances } from 'utils/wallet/types';
import WalletController from 'views/v3/Bridge/WalletConnector/Controller';
import AmountInput from 'views/v3/Zap/AmountInput';
import AssetPickerDrawer from 'views/v3/Zap/AssetPicker/PickerBottomSheet';
import AssetPickerPopover from 'views/v3/Zap/AssetPicker/PickerModal';
import { getDefaultProvider, getZapPoolAmountUSD } from 'utils/zap';

type Props = {
  chain?: Chain | undefined;
  chainList: Array<ChainConfig>;
  token?: ZapAsset;
  sourceToken?: ZapAsset;
  tokenList?: Array<ZapAsset> | undefined;
  isFetchingQuotes?: boolean;
  isFetchingTokens?: boolean;
  setToken: (value: ZapAsset) => void;
  setChain: (value: Chain) => void;
  wallet: WalletData;
  isSameChainSwap: boolean;
  isSource: boolean;
  isTransactionInProgress: boolean;
  dataTestId?: string;
  balances: Balances;
  isFetchingBalances: boolean;
  isConnectingWallet?: boolean;
  amountValidation?: AmountValidationResult;
  quote?: ZapQuoteResult | undefined;
  anchorEl: HTMLElement | null;
};

function AssetPicker(props: Props) {
  const theme: any = useTheme();
  const dispatch = useDispatch();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    amount,
    token: zapToken,
    fromChain,
    zappingChains,
  } = useSelector((state: RootState) => state.zapInput);
  const { getTokenPrice } = useTokens();

  const chainConfig: ChainConfig | undefined = useMemo(() => {
    return props.chain ? config.chains[props.chain] : undefined;
  }, [props.chain]);

  const [showChainSearch, setShowChainSearch] = useState(false);
  const [showProviderSearch, setShowProviderSearch] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<
    string | undefined
  >();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [amountInput, setAmountInput] = useState(
    amount ? sdkAmount.display(amount) : '',
  );
  const [debouncedAmountInput, setDebouncedAmountInput] = useState(
    amount ? sdkAmount.display(amount) : '',
  );
  const [selectedPercentButton, setSelectedPercentButton] = useState(0);

  const sortedTokens = useTokenList({
    tokenList: props.tokenList || [],
    searchQuery,
    selectedChainConfig: props.chain ? config.chains[props.chain] : ({} as any),
    selectedToken: props.token,
    sourceToken: props.sourceToken,
    wallet: props.wallet,
    balances: props.balances,
    isSourceList: props.isSource, // true for source, false for destination
  });

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'asset-picker',
  });

  const tokenBalance = useMemo(() => {
    if (props.token?.zapPositionDetails) {
      const res = sdkAmount.fromBaseUnits(
        BigInt(props.token?.zapPositionDetails?.amount ?? '0'),
        props.token.decimals,
      );
      return res;
    }
    if (props.isSource && props.balances && props.token) {
      return props.balances[props.token.key]?.balance;
    }
    return null;
  }, [props.isSource, props.balances, props.token]);

  const tokenBalanceDisplay = useMemo(() => {
    if (!tokenBalance) {
      return null;
    }
    const displayValue = `Balance: ${sdkAmount.display(tokenBalance)}`;
    return (
      <Typography
        sx={{
          color: theme.palette.text.secondary,
          fontSize: '12px',
          maxWidth: '240px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ariaLabel: displayValue,
        }}
      >
        {displayValue}
      </Typography>
    );
  }, [theme.palette.text.secondary, tokenBalance]);

  // Side-effect to reset chain and provider search visibility.
  // Popover and drawer close has an animation, which requires to wait
  // a tiny bit before resetting showChainSearch and showProviderSearch.
  // 300 ms is the reference wait time in a double-click, that's why
  // we can use it as the min wait before user re-opens the popover.
  useEffect(() => {
    if ((mobile && !isDrawerOpen) || (!mobile && !popupState.isOpen)) {
      setTimeout(() => {
        setShowChainSearch(false);
        setShowProviderSearch(false);
      }, 300);
    }
  }, [isDrawerOpen, mobile, popupState.isOpen]);

  // Pre-selecting first allowed chain, when asset picker is opened
  useEffect(() => {
    if (
      (mobile && isDrawerOpen && !props.chain) ||
      (!mobile && popupState.isOpen && !props.chain)
    ) {
      const firstAllowedChain = props.chainList.find(
        (chain) => !isDisabledChain(chain.sdkName, props.wallet),
      );
      if (firstAllowedChain) {
        props.setChain(firstAllowedChain.sdkName);
      }
    }
    // Re-run only when popup/drawer state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, isDrawerOpen, popupState.isOpen]);

  // Update selected provider when chain changes
  useEffect(() => {
    setSelectedProvider((prev) =>
      getDefaultProvider(zappingChains, chainConfig, prev),
    );
  }, [chainConfig, zappingChains]);

  const selection = useMemo(() => {
    const tokenDisplay = props.token ? <>{props.token.display}</> : <>Select</>;

    return (
      <Tooltip title={props.token?.display ?? 'Select a token'}>
        <Typography
          component="div"
          fontSize="16px"
          fontWeight={500}
          maxWidth="64px"
          noWrap
        >
          {tokenDisplay}
        </Typography>
      </Tooltip>
    );
  }, [props.token]);

  const triggerProps =
    props.isTransactionInProgress || mobile ? {} : bindTrigger(popupState);

  const styles = useMemo(
    () => ({
      root: {
        maxWidth: '420px',
        background: theme.palette.input.background,
        borderRadius: '8px',
        padding: '16px',
      },
      container: {
        display: 'flex',
        flexDirection: 'column',
        height: '114px',
        maxWidth: '452px',
        gap: '16px',
      },
      title: {
        color: theme.palette.text.secondary,
        display: 'flex',
        height: '12px',
        justifyContent: 'space-between',
      },
      selector: {
        cursor: 'pointer',
        borderRadius: '50px',
        border: `1px solid ${theme.palette.input.border}`,
        background: Color(theme.palette.input.background).darken(0.2).hex(),
        minWidth: '120px',
        '&:hover': {
          borderColor: theme.palette.primary.main,
        },
      },
      cardContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '8px',
        paddingRight: '12px',
        paddingTop: '6px',
        paddingBottom: '6px',
        ':last-child': {
          paddingLeft: '8px',
          paddingRight: '12px',
          paddingTop: '6px',
          paddingBottom: '6px',
        },
      },
      chainSelector: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      disabled: {
        opacity: '0.6',
        cursor: 'default',
        pointerEvents: 'none',
      },
      percentButton: {
        borderRadius: '50px',
        color: theme.palette.text.primary,
        height: '22px',
        minWidth: '40px',
        backgroundColor: theme.palette.text.primary + OPACITY[10],
        opacity: 0.7,
      },
      percentButtonSelected: {
        color: theme.palette.background.form,
        backgroundColor: theme.palette.primary.main,
        opacity: 'unset',
      },
    }),
    [theme],
  );

  // If the amount input is empty, we don't need to check the quote which may be for the previous amount
  const receiveAmount =
    !props.isSource &&
    props.quote?.success &&
    props.quote.amountOut &&
    props.token
      ? sdkAmount.display(
          sdkAmount.fromBaseUnits(
            BigInt(props.quote.amountOut ?? '0'),
            props.token.decimals,
          ),
          props.token.decimals,
        )
      : '';

  const tokenPrice = useMemo(() => {
    const tokenAmount = props.isSource
      ? amount
      : props.quote?.success && props.quote.amountOut && props.token
      ? sdkAmount.fromBaseUnits(
          BigInt(props.quote.amountOut ?? '0'),
          props.token.decimals,
        )
      : undefined;
    if (props.token?.zapTokenInfo?.type === ZapAssetType.POOL) {
      return getZapPoolAmountUSD(props.quote);
    }
    if (props.token && tokenAmount) {
      return calculateUSDPrice(getTokenPrice, tokenAmount, props.token);
    }
    return null;
  }, [
    props.isSource,
    props.quote?.success,
    props.quote?.amountOut,
    props.token,
    amount,
    getTokenPrice,
  ]);

  const amountUSDValue =
    props.token && tokenPrice ? (
      <Typography color={theme.palette.text.secondary} fontSize="12px">
        ${tokenPrice ?? null}
      </Typography>
    ) : null;

  const handleAmountChange = useCallback((newValue: string): void => {
    setAmountInput(newValue);
    setSelectedPercentButton(0); // Reset selected percent button when amount changes
  }, []);

  const handleDebouncedAmountChange = useCallback(
    (newValue: string): void => {
      dispatch(setAmount(newValue));
      setDebouncedAmountInput(newValue);
    },
    [dispatch, amount, props.chain, props.token, zapToken, fromChain],
  );

  const handleChainSelect = useCallback(
    (chain: Chain) => {
      props.setChain(chain);
      setSearchQuery('');
      // Provider will be updated automatically by the useEffect when chainConfig changes
    },
    [props],
  );

  const handleTokenSelect = useCallback(
    (token: ZapAsset) => {
      if (props.isSource && props.token?.key !== token.key) {
        // Reset amount when source token is changed
        handleAmountChange('');
        handleDebouncedAmountChange('');
      }
      props.setToken(token);
    },
    [handleAmountChange, handleDebouncedAmountChange, props],
  );

  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    setSearchQuery('');
  }, []);

  // Clear the amount input value if the amount is reset outside of this component
  // This can happen if user swaps selected source and destination assets.
  useEffect(() => {
    if (!amount && (amountInput || debouncedAmountInput)) {
      handleAmountChange('');
      handleDebouncedAmountChange('');
    }
    // We should run this sife-effect only when the amount changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const renderPercentButton = useCallback(
    (percent: number) => (
      <Button
        sx={{
          ...styles.percentButton,
          ...(selectedPercentButton === percent
            ? styles.percentButtonSelected
            : {}),
        }}
        disabled={props.isTransactionInProgress}
        onClick={() => {
          if (tokenBalance) {
            const balancePercent =
              (sdkAmount.units(tokenBalance) * BigInt(percent)) / BigInt(100);
            const displayAmount = sdkAmount.display(
              sdkAmount.fromBaseUnits(balancePercent, tokenBalance.decimals),
            );
            handleAmountChange(displayAmount);
            handleDebouncedAmountChange(displayAmount);
            setSelectedPercentButton(percent);
          }
        }}
      >
        <Typography fontSize={12} fontWeight={600} textTransform="none">
          {percent === 100 ? 'Max' : `${percent}%`}
        </Typography>
      </Button>
    ),
    [
      styles.percentButton,
      styles.percentButtonSelected,
      selectedPercentButton,
      props.isTransactionInProgress,
      tokenBalance,
      handleAmountChange,
      handleDebouncedAmountChange,
    ],
  );

  const destTokenUnitPrice = useMemo(() => {
    if (!props.token) {
      return null;
    }
    const unitPrice = calculateUSDPrice(
      getTokenPrice,
      sdkAmount.parse('1', props.token.decimals),
      props.token,
    );

    if (!unitPrice) {
      return null;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          opacity: 0.7,
        }}
      >
        <Typography
          color={theme.palette.text.primary}
          fontSize="14px"
        >{`1 ${props.token.symbol} = ${unitPrice}`}</Typography>
      </Box>
    );
  }, [props.token, getTokenPrice, theme.palette.text.primary]);

  const percentButtons =
    !props.wallet.address || !tokenBalance ? null : (
      <Box sx={{ display: 'flex', gap: '6px' }}>
        {renderPercentButton(25)}
        {renderPercentButton(50)}
        {renderPercentButton(100)}
      </Box>
    );

  return (
    <Box sx={styles.root}>
      <Box sx={styles.container}>
        <Box sx={styles.title}>
          <Typography fontSize={12} fontWeight={500} variant="body2">
            {props.isSource ? 'From' : 'To'}
          </Typography>
          <WalletController
            type={
              props.isSource ? TransferWallet.SENDING : TransferWallet.RECEIVING
            }
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Card
            sx={[
              styles.selector,
              props.isTransactionInProgress && styles.disabled,
            ]}
            data-testid={props.dataTestId}
            variant="elevation"
            onMouseDown={(e) => {
              if (mobile) {
                setIsDrawerOpen(true);
              } else {
                popupState.open(e);
              }
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (mobile) {
                setIsDrawerOpen(true);
              } else {
                popupState.open(e);
              }
            }}
            {...triggerProps}
          >
            <CardContent sx={styles.cardContent}>
              <Typography sx={styles.chainSelector} component={'div'} gap={1}>
                <AssetBadge chainConfig={chainConfig} token={props.token} />
                {selection}
              </Typography>
            </CardContent>
          </Card>
          {props.isSource ? (
            <AmountInput
              value={amountInput}
              debouncedValue={debouncedAmountInput}
              receiveAmount={Number(receiveAmount)}
              supportedSourceTokens={props.tokenList || []}
              tokenBalance={tokenBalance}
              warning={props.amountValidation?.warning}
              error={props.amountValidation?.error}
              onChange={handleAmountChange}
              onDebouncedChange={handleDebouncedAmountChange}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignContent: 'center',
                alignItems: 'center',
                width: '100%',
                maxWidth: '250px',
                height: '50px',
              }}
            >
              <TextField
                fullWidth
                disabled
                placeholder="0"
                slotProps={{
                  htmlInput: {
                    maxLength: 22,
                    style: {
                      // Shrink the font size based on the length of the input value
                      fontSize:
                        receiveAmount.length > 12
                          ? '20px'
                          : receiveAmount.length > 6
                          ? '28px'
                          : '36px',
                      height: '36px',
                      textAlign: 'right',
                    },
                  },
                  input: {
                    disableUnderline: true,
                  },
                }}
                variant="standard"
                value={formatWithCommas(receiveAmount)}
              />
            </Box>
          )}
        </Box>
        <Box
          sx={{
            height: '22px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {props.isSource ? (
            <Box>{tokenBalanceDisplay}</Box>
          ) : (
            <Box>{destTokenUnitPrice}</Box>
          )}
          {props.isSource ? (
            <Box>{percentButtons}</Box>
          ) : (
            <Box>{amountUSDValue}</Box>
          )}
        </Box>
      </Box>
      {mobile ? (
        <AssetPickerDrawer
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          chainList={props.chainList}
          chainConfig={chainConfig}
          showChainSearch={showChainSearch}
          setShowChainSearch={setShowChainSearch}
          selectedProvider={selectedProvider}
          showProviderSearch={showProviderSearch}
          setShowProviderSearch={setShowProviderSearch}
          wallet={props.wallet}
          sortedTokens={sortedTokens}
          balances={props.balances}
          isFetchingBalances={props.isFetchingBalances}
          isConnectingWallet={props.isConnectingWallet}
          isFetchingTokens={props.isFetchingTokens}
          isSameChainSwap={props.isSameChainSwap}
          token={props.token}
          sourceToken={props.sourceToken}
          isSource={props.isSource}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onChainSelect={handleChainSelect}
          onProviderSelect={handleProviderSelect}
          onTokenSelect={(token: ZapAsset) => {
            handleTokenSelect(token);
            setIsDrawerOpen(false);
          }}
        />
      ) : (
        <AssetPickerPopover
          popupState={popupState}
          anchorEl={props.anchorEl}
          chainList={props.chainList}
          chainConfig={chainConfig}
          showChainSearch={showChainSearch}
          setShowChainSearch={setShowChainSearch}
          selectedProvider={selectedProvider}
          showProviderSearch={showProviderSearch}
          setShowProviderSearch={setShowProviderSearch}
          wallet={props.wallet}
          sortedTokens={sortedTokens}
          balances={props.balances}
          isFetchingBalances={props.isFetchingBalances}
          isConnectingWallet={props.isConnectingWallet}
          isFetchingTokens={props.isFetchingTokens}
          isSameChainSwap={props.isSameChainSwap}
          token={props.token}
          sourceToken={props.sourceToken}
          isSource={props.isSource}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onChainSelect={handleChainSelect}
          onProviderSelect={handleProviderSelect}
          onTokenSelect={(token: ZapAsset) => {
            handleTokenSelect(token);
            popupState.close();
          }}
        />
      )}
    </Box>
  );
}

export default memo(AssetPicker);
