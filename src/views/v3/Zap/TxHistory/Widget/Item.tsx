// import Box from '@mui/material/Box';
// import Card from '@mui/material/Card';
// import CardActionArea from '@mui/material/CardActionArea';
// import CardContent from '@mui/material/CardContent';
// import CircularProgress from '@mui/material/CircularProgress';
// import Stack from '@mui/material/Stack';
// import { useTheme } from '@mui/material/styles';
// import Typography from '@mui/material/Typography';
// import React, { useCallback, useContext, useMemo, useState } from 'react';
// import { useDispatch } from 'react-redux';

// import AlertBannerV3 from 'components/v3/AlertBanner';
// import config from 'config';
// import { RouteContext } from 'contexts/RouteContext';
// import ArrowRight from 'icons/ArrowRight';
// import ChainIcon from 'icons/ChainIcons';
// import TxCompleteIcon from 'icons/TxComplete';
// import { setRoute as setAppRoute } from 'store/router';
// import {
//   setIsResumeTx,
//   setTimestamp,
//   setTxDetails,
//   setRoute as setZapRedeemRoute,
// } from 'store/zap';

// import type { ZapTransactionLocal } from 'config/types';

// type Props = {
//   data: ZapTransactionLocal;
//   disabled: boolean;
// };

// const ZapWidgetItem = (props: Props) => {
//   const [error, setError] = useState('');
//   const [etaExpired, setEtaExpired] = useState(false);

//   const dispatch = useDispatch();
//   const routeContext = useContext(RouteContext);
//   const theme = useTheme();
//   const styles = useMemo(
//     () => ({
//       alertBanner: {
//         marginTop: '12px',
//       },
//       arrowIcon: {
//         fontSize: '16px',
//         margin: '0 4px',
//       },
//       card: {
//         width: '100%',
//         boxShadow: `0px 0px 3.5px 0px ${theme.palette.primary.main}`,
//       },
//       cardContent: {
//         padding: '16px 20px',
//         ':last-child': {
//           padding: '16px 20px',
//         },
//       },
//       cardActionArea: {
//         height: '72px',
//       },
//       chainIconContainer: {
//         border: `2px solid ${theme.palette.input.background}`,
//         borderRadius: '6px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: '2px',
//       },
//       completedIcon: {
//         color: theme.palette.success.main,
//         height: '24px',
//         width: '24px',
//       },
//       container: {
//         width: '100%',
//         maxWidth: '420px',
//       },
//       progressBar: {
//         borderRadius: '4px',
//         marginTop: '8px',
//       },
//     }),
//     [theme],
//   );

//   const { data: transaction } = props;

//   // Handle card click to navigate to redeem
//   const handleCardClick = useCallback(() => {
//     if (props.disabled) return;

//     dispatch(setZapRedeemRoute(transaction.route || ''));
//     dispatch(setTimestamp(transaction.timestamp));
//     dispatch(setTxDetails(transaction));
//     dispatch(setIsResumeTx(true));
//     dispatch(setAppRoute('zap-redeem'));
//   }, [dispatch, transaction, props.disabled]);

//   // Render transaction status
//   const renderStatus = useMemo(() => {
//     if (transaction.status === 'completed') {
//       return (
//         <Stack direction="row" alignItems="center" spacing={1}>
//           <TxCompleteIcon sx={styles.completedIcon} />
//           <Typography fontSize={14} color={theme.palette.success.main}>
//             Completed
//           </Typography>
//         </Stack>
//       );
//     }

//     if (transaction.status === 'pending') {
//       return (
//         <Stack direction="row" alignItems="center" spacing={1}>
//           <CircularProgress size={16} />
//           <Typography fontSize={14} color={theme.palette.warning.main}>
//             Pending
//           </Typography>
//         </Stack>
//       );
//     }

//     if (transaction.status === 'failed') {
//       return (
//         <Typography fontSize={14} color={theme.palette.error.main}>
//           Failed
//         </Typography>
//       );
//     }

//     return (
//       <Typography fontSize={14} color={theme.palette.text.secondary}>
//         {transaction.status || 'Unknown'}
//       </Typography>
//     );
//   }, [transaction.status, styles.completedIcon, theme.palette]);

//   // Render chain icons
//   const renderChainIcons = useMemo(() => {
//     const fromChainConfig = config.chains[transaction.fromChain];
//     const toChainConfig = config.chains[transaction.toChain];

//     if (!fromChainConfig || !toChainConfig) return null;

//     return (
//       <Stack direction="row" alignItems="center" spacing={1}>
//         <Box sx={styles.chainIconContainer}>
//           <ChainIcon chain={transaction.fromChain} size={20} />
//         </Box>
//         <ArrowRight sx={styles.arrowIcon} />
//         <Box sx={styles.chainIconContainer}>
//           <ChainIcon chain={transaction.toChain} size={20} />
//         </Box>
//       </Stack>
//     );
//   }, [
//     transaction.fromChain,
//     transaction.toChain,
//     styles.chainIconContainer,
//     styles.arrowIcon,
//   ]);

//   // Render amount information
//   const renderAmounts = useMemo(() => {
//     return (
//       <Stack
//         direction="row"
//         alignItems="center"
//         justifyContent="space-between"
//         width="100%"
//       >
//         <Stack direction="column" alignItems="flex-start">
//           <Typography fontSize={16} fontWeight={600}>
//             {transaction.amount} {transaction.fromToken?.symbol}
//           </Typography>
//           <Typography fontSize={12} color={theme.palette.text.secondary}>
//             {fromChainConfig?.displayName}
//           </Typography>
//         </Stack>

//         <ArrowRight sx={styles.arrowIcon} />

//         <Stack direction="column" alignItems="flex-end">
//           <Typography fontSize={16} fontWeight={600}>
//             {transaction.receiveAmount} {transaction.toToken?.symbol}
//           </Typography>
//           <Typography fontSize={12} color={theme.palette.text.secondary}>
//             {toChainConfig?.displayName}
//           </Typography>
//         </Stack>
//       </Stack>
//     );
//   }, [transaction, styles.arrowIcon, theme.palette.text.secondary]);

//   const fromChainConfig = config.chains[transaction.fromChain];
//   const toChainConfig = config.chains[transaction.toChain];

//   return (
//     <Box sx={styles.container}>
//       <Card sx={styles.card}>
//         <CardActionArea
//           onClick={handleCardClick}
//           disabled={props.disabled}
//           sx={styles.cardActionArea}
//         >
//           <CardContent sx={styles.cardContent}>
//             <Stack
//               direction="row"
//               alignItems="center"
//               justifyContent="space-between"
//               width="100%"
//             >
//               {/* Chain Icons */}
//               {renderChainIcons}

//               {/* Status */}
//               {renderStatus}
//             </Stack>

//             {/* Amounts */}
//             <Box sx={{ marginTop: '12px' }}>{renderAmounts}</Box>
//           </CardContent>
//         </CardActionArea>
//       </Card>

//       {/* Error Banner */}
//       {error && (
//         <AlertBannerV3
//           severity="error"
//           title="Error"
//           message={error}
//           sx={styles.alertBanner}
//         />
//       )}
//     </Box>
//   );
// };

// export default ZapWidgetItem;
