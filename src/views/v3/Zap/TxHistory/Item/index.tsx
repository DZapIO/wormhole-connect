// import React, { useMemo } from 'react';
// import { useTheme } from '@mui/material/styles';
// import Card from '@mui/material/Card';
// import CardActionArea from '@mui/material/CardActionArea';
// import CardContent from '@mui/material/CardContent';
// import CardHeader from '@mui/material/CardHeader';
// import Typography from '@mui/material/Typography';
// import Stack from '@mui/material/Stack';
// import Box from '@mui/material/Box';

// import config from 'config';
// import AssetBadge from 'components/AssetBadge';
// import {
//   calculateUSDPrice,
//   getTransactionExplorerUrl,
//   getUSDFormat,
//   millisToRelativeTime,
//   trimTxHash,
// } from 'utils';

// import type { ZapTransaction } from 'config/types';
// import { useTokens } from 'contexts/TokensContext';
// import ExplorerLink from 'components/ExplorerLink';

// type Props = {
//   data: ZapTransaction;
// };

// const ZapTxHistoryItem = (props: Props) => {
//   const theme = useTheme();
//   const styles = useMemo(
//     () => ({
//       container: {
//         width: '100%',
//         maxWidth: '420px',
//       },
//       card: {
//         width: '100%',
//         borderRadius: '8px',
//         border: `1px solid ${theme.palette.input.border}`,
//       },
//       cardHeader: {
//         paddingBottom: 0,
//       },
//     }),
//     [theme],
//   );

//   const {
//     txHash,
//     amount,
//     amountUsd,
//     fromChain,
//     fromToken,
//     toChain,
//     toToken,
//     receiveAmount,
//     senderTimestamp,
//     explorerLink,
//     zapRoute,
//     status,
//   } = props.data;

//   // Separator with a unicode dot in the middle
//   const separator = useMemo(
//     () => (
//       <Typography component="span" padding="0px 8px">{`\u00B7`}</Typography>
//     ),
//     [],
//   );
//   const { getTokenPrice, lastTokenPriceUpdate } = useTokens();

//   // Render details for the sent amount
//   const sentAmount = useMemo(() => {
//     const sourceChainConfig = config.chains[fromChain]!;

//     return (
//       <Stack alignItems="center" direction="row" justifyContent="flex-start">
//         <AssetBadge chainConfig={sourceChainConfig} token={fromToken} />
//         <Stack direction="column" marginLeft="12px">
//           <Typography fontSize={16}>
//             {amount} {fromToken?.symbol}
//           </Typography>
//           <Typography color={theme.palette.text.secondary} fontSize={14}>
//             {amountUsd ? (
//               <>
//                 {getUSDFormat(amountUsd)}
//                 {separator}
//               </>
//             ) : null}
//             {sourceChainConfig?.displayName}
//           </Typography>
//         </Stack>
//       </Stack>
//     );
//   }, [
//     amount,
//     amountUsd,
//     fromChain,
//     separator,
//     theme.palette.text.secondary,
//     fromToken,
//   ]);

//   // Render details for the received amount
//   const receivedAmount = useMemo(() => {
//     const destChainConfig = config.chains[toChain]!;

//     return (
//       <Stack alignItems="center" direction="row" justifyContent="flex-start">
//         <AssetBadge chainConfig={destChainConfig} token={toToken} />
//         <Stack direction="column" marginLeft="12px">
//           <Typography fontSize={16}>
//             {receiveAmount} {toToken?.symbol}
//           </Typography>
//           <Typography color={theme.palette.text.secondary} fontSize={14}>
//             {destChainConfig?.displayName}
//           </Typography>
//         </Stack>
//       </Stack>
//     );
//   }, [
//     receiveAmount,
//     toChain,
//     theme.palette.text.secondary,
//     toToken,
//   ]);

//   // Render transaction hash
//   const transactionHash = useMemo(() => {
//     const explorerUrl = explorerLink || getTransactionExplorerUrl(fromChain, txHash);
//     const txHashTrimmed = trimTxHash(txHash);

//     return (
//       <Stack direction="row" alignItems="center" justifyContent="space-between">
//         <Typography color={theme.palette.text.secondary} fontSize={12}>
//           Transaction Hash
//         </Typography>
//         {explorerUrl ? (
//           <ExplorerLink href={explorerUrl} text={txHashTrimmed} />
//         ) : (
//           <Typography fontSize={12}>{txHashTrimmed}</Typography>
//         )}
//       </Stack>
//     );
//   }, [explorerLink, fromChain, txHash, theme.palette.text.secondary]);

//   // Render timestamp
//   const timestamp = useMemo(() => {
//     if (!senderTimestamp) return null;

//     return (
//       <Stack direction="row" alignItems="center" justifyContent="space-between">
//         <Typography color={theme.palette.text.secondary} fontSize={12}>
//           Time
//         </Typography>
//         <Typography fontSize={12}>
//           {millisToRelativeTime(senderTimestamp)}
//         </Typography>
//       </Stack>
//     );
//   }, [senderTimestamp]);

//   // Render Zap route
//   const routeDisplay = useMemo(() => {
//     if (!zapRoute) return null;

//     return (
//       <Stack direction="row" alignItems="center" justifyContent="space-between">
//         <Typography color={theme.palette.text.secondary} fontSize={12}>
//           Zap Route
//         </Typography>
//         <Typography fontSize={12}>
//           {zapRoute}
//         </Typography>
//       </Stack>
//     );
//   }, [zapRoute]);

//   // Render status
//   const statusDisplay = useMemo(() => {
//     if (!status) return null;

//     const getStatusColor = (status: string) => {
//       switch (status.toLowerCase()) {
//         case 'completed':
//           return theme.palette.success.main;
//         case 'pending':
//           return theme.palette.warning.main;
//         case 'failed':
//           return theme.palette.error.main;
//         default:
//           return theme.palette.text.secondary;
//       }
//     };

//     return (
//       <Stack direction="row" alignItems="center" justifyContent="space-between">
//         <Typography color={theme.palette.text.secondary} fontSize={12}>
//           Status
//         </Typography>
//         <Typography
//           fontSize={12}
//           color={getStatusColor(status)}
//           sx={{ textTransform: 'capitalize' }}
//         >
//           {status}
//         </Typography>
//       </Stack>
//     );
//   }, [status, theme.palette]);

//   return (
//     <Box sx={styles.container}>
//       <Card sx={styles.card}>
//         <CardHeader
//           sx={styles.cardHeader}
//           title={
//             <Stack direction="row" alignItems="center" spacing={1}>
//               <Typography variant="h6" fontSize={14}>
//                 Zap Transaction
//               </Typography>
//             </Stack>
//           }
//         />
//         <CardContent>
//           <Stack spacing={2}>
//             {/* Sent Amount */}
//             <Box>
//               <Typography
//                 color={theme.palette.text.secondary}
//                 fontSize={12}
//                 marginBottom="8px"
//               >
//                 SENT
//               </Typography>
//               {sentAmount}
//             </Box>

//             {/* Received Amount */}
//             <Box>
//               <Typography
//                 color={theme.palette.text.secondary}
//                 fontSize={12}
//                 marginBottom="8px"
//               >
//                 RECEIVED
//               </Typography>
//               {receivedAmount}
//             </Box>

//             {/* Transaction Details */}
//             <Stack spacing={1}>
//               {transactionHash}
//               {timestamp}
//               {routeDisplay}
//               {statusDisplay}
//             </Stack>
//           </Stack>
//         </CardContent>
//       </Card>
//     </Box>
//   );
// };

// export default ZapTxHistoryItem;
