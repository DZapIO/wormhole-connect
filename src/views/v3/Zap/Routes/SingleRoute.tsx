import { Box, useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { amount } from '@wormhole-foundation/sdk';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { ZapQuoteResult } from 'hooks/useFetchZapQuotes';
import TokenIcon from 'icons/TokenIcons';
import WarningIcon from 'icons/Warning';

import { useGetTokens } from 'hooks/useGetTokens';
import type { RootState } from 'store';
import ProviderWithAmount from './ProviderWithAmount';
import TimeToDestination from './TimeToDestination';

type Props = {
  isLoading?: boolean;
  route?: ZapQuoteResult;
};

const SingleRoute = (props: Props) => {
  const theme = useTheme();
  const styles = useMemo(
    () => ({
      container: {
        width: '100%',
      },
      card: {
        borderRadius: '8px',
        width: '100%',
        maxWidth: '412px',
      },
      cardSelected: {
        backgroundColor: theme.palette.card.background,
        borderColor: theme.palette.primary.main,
      },
      cardHeader: {
        padding: '20px 20px 0px',
      },
      cardContent: {
        marginTop: '18px',
        padding: '0px 20px 20px',
      },
      errorIcon: {
        color: theme.palette.error.main,
        height: '34px',
        width: '34px',
        marginRight: '24px',
      },
      messageContainer: {
        padding: '12px 0px 0px',
      },
      warningIcon: {
        color: theme.palette.warning.main,
        height: '34px',
        width: '34px',
        marginRight: '12px',
      },
      disabled: {
        opacity: '0.6',
        cursor: 'default',
        pointerEvents: 'none' as const,
      },
    }),
    [theme],
  );

  const {
    toChain: destChain,
    fromChain: sourceChain,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);

  const { route } = props;

  const { sourceToken, destToken } = useGetTokens();

  const messageDivider = useMemo(
    () => <Divider flexItem sx={{ marginTop: '24px' }} />,
    [],
  );

  const warningMessages = useMemo(() => {
    const messages: React.JSX.Element[] = [];
    messages.push(
      <div key="ManualTransactionWarning">
        {messageDivider}
        <Stack sx={styles.messageContainer} direction="row" alignItems="center">
          <WarningIcon sx={styles.warningIcon} />
          <Stack>
            <Typography
              color={theme.palette.warning.main}
              fontSize={14}
              lineHeight="18px"
            >
              This transfer requires two transactions.
            </Typography>
            <Typography
              color={theme.palette.text.secondary}
              fontSize={14}
              lineHeight="18px"
            >
              You will need to make two wallet approvals and have gas on the
              destination chain.
            </Typography>
          </Stack>
        </Stack>
      </div>,
    );
    return messages;
  }, [
    messageDivider,
    styles.warningIcon,
    styles.messageContainer,
    theme.palette.warning.main,
    theme.palette.text.secondary,
  ]);

  const receiveAmount = useMemo(() => {
    return route ? amount.whole(route?.amountOut ?? 0n) : undefined;
  }, [route]);

  const receiveAmountTrunc = useMemo(() => {
    if (route) {
      return amount.display(amount.truncate(route.amountOut ?? 0n, 6));
    } else {
      return undefined;
    }
  }, [route]);

  const routeCardHeader = useMemo(() => {
    if (receiveAmount === undefined || !destToken) {
      return null;
    }
    return (
      <Typography
        fontSize="18px"
        lineHeight="18px"
        component="div"
        marginBottom="6px"
      >
        {receiveAmountTrunc} {destToken.symbol}
      </Typography>
    );
  }, [receiveAmount, receiveAmountTrunc, destToken]);

  const routeCardSubHeader = useMemo(() => {
    if (!destChain || !destToken) {
      return null;
    }

    if (receiveAmount === undefined) {
      return null;
    }

    const usdValue = undefined;

    return (
      <Typography
        fontSize="14px"
        lineHeight="14px"
        color={theme.palette.text.secondary}
        component="div"
      >
        <ProviderWithAmount
          destChain={destChain}
          route={route}
          sourceChain={sourceChain}
          sourceTokenSymbol={sourceToken?.symbol}
          usdValue={usdValue}
        />
      </Typography>
    );
    // We want to recompute the price after we update conversion rates (lastTokenPriceUpdate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    destChain,
    destToken,
    props.route,
    receiveAmount,
    sourceChain,
    sourceToken,
    theme.palette.text.secondary,
  ]);

  if (!props.route) {
    return <></>;
  }

  return (
    <Box
      key={props.route}
      sx={{
        ...styles.container,
      }}
      data-testid={`route-${props.route}-selected`}
    >
      <Card
        sx={{
          ...styles.card,
          ...styles.cardSelected,
          ...(isTransactionInProgress && styles.disabled),
          ...{
            border: '1px solid',
            borderColor: theme.palette.primary.main,
            opacity: 1,
          },
        }}
      >
        <CardActionArea
          component="div"
          disabled={isTransactionInProgress}
          disableTouchRipple
        >
          <CardHeader
            sx={styles.cardHeader}
            avatar={<TokenIcon icon={destToken?.icon} />}
            title={routeCardHeader}
            subheader={routeCardSubHeader}
          />
          <CardContent sx={styles.cardContent}>
            <Stack gap="14px">
              <TimeToDestination destChain={destChain} eta={quote?.eta} />
            </Stack>
            {warningMessages}
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );
};

export default React.memo(SingleRoute);
