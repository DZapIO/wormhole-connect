// import type { ReactNode } from 'react';
// import React, { useMemo } from 'react';
// import { useSelector } from 'react-redux';
// import { useTheme, Box } from '@mui/material';
// import Card from '@mui/material/Card';
// import CardContent from '@mui/material/CardContent';
// import CircularProgress from '@mui/material/CircularProgress';
// import Divider from '@mui/material/Divider';
// import Link from '@mui/material/Link';
// import Typography from '@mui/material/Typography';
// import Stack from '@mui/material/Stack';

// import config from 'config';
// import { RouteContext } from 'contexts/RouteContext';
// import AssetBadge from 'components/AssetBadge';
// import ExplorerLink from 'components/ExplorerLink';
// import {
//   calculateUSDPrice,
//   getTransactionExplorerUrl,
//   getWalletExplorerUrl,
//   millisToHumanString,
//   trimAddress,
// } from 'utils';
// import { getExplorerInfo } from 'utils/sdkv2';
// import { amount as sdkAmount } from '@wormhole-foundation/sdk';

// import type { RootState } from 'store';
// import { useTokens } from 'contexts/TokensContext';

// const TransactionDetails = () => {
//   const theme = useTheme();
//   const routeContext = React.useContext(RouteContext);

//   const styles = useMemo(
//     () => ({
//       container: {
//         width: '100%',
//         maxWidth: '420px',
//         backgroundColor: theme.palette.input.background,
//       },
//       card: {
//         width: '100%',
//         backgroundColor: theme.palette.input.background,
//       },
//     }),
//     [theme],
//   );

//   // Get Zap redeem transaction data from store
//   const {
//     sendTx,
//     sender,
//     amount,
//     recipient,
//     toChain,
//     fromChain,
//     token,
//     receivedToken,
//     receiveAmount,
//     receiveNativeAmount,
//     eta,
//   } = useSelector((state: RootState) => state.zap.redeemTxData) || {};

//   const { route: routeName } = useSelector((state: RootState) => state.zap.redeemRoute) || {};

//   const sourceToken = token ? config.tokens.get(token) : undefined;
//   const destToken = receivedToken ? config.tokens.get(receivedToken) : undefined;

//   const { getTokenPrice, isFetchingTokenPrices, lastTokenPriceUpdate } =
//     useTokens();

//   // Separator with a unicode dot in the middle
//   const separator = useMemo(
//     () => (
//       <Typography component="span" padding="0px 8px">{`\u00B7`}</Typography>
//     ),
//     [],
//   );

//   // Render details for the sent amount
//   const sentAmount = useMemo(() => {
//     if (!sourceToken || !fromChain) {
//       return <></>;
//     }

//     const sourceTokenConfig = config.tokens.get(token);
//     const sourceChainConfig = config.chains[fromChain]!;

//     const usdAmount = calculateUSDPrice(
//       getTokenPrice,
//       amount,
//       sourceTokenConfig,
//     );

//     const senderAddress = sender ? trimAddress(sender) : '';
//     const explorerUrl = sender ? getWalletExplorerUrl(fromChain, sender) : '';

//     const formattedAmount = amount ? sdkAmount.display(sdkAmount.truncate(amount, 6)) : '0';

//     return (
//       <Stack alignItems="center" direction="row" justifyContent="flex-start">
//         <AssetBadge chainConfig={sourceChainConfig} token={sourceToken} />
//         <Stack direction="column" marginLeft="12px">
//           <Typography fontSize={16}>
//             {formattedAmount} {sourceToken?.symbol}
//           </Typography>
//           <Typography color={theme.palette.text.secondary} fontSize={14}>
//             {usdAmount ? (
//               <>
//                 {usdAmount}
//                 {separator}
//               </>
//             ) : null}
//             {sourceChainConfig?.displayName}
//           </Typography>
//           {senderAddress && (
//             <Typography color={theme.palette.text.secondary} fontSize={12}>
//               From: {explorerUrl ? (
//                 <Link href={explorerUrl} target="_blank" rel="noopener">
//                   {senderAddress}
//                 </Link>
//               ) : (
//                 senderAddress
//               )}
//             </Typography>
//           )}
//         </Stack>
//       </Stack>
//     );
//   }, [
//     sourceToken,
//     fromChain,
//     token,
//     amount,
//     getTokenPrice,
//     separator,
//     theme.palette.text.secondary,
//     sender,
//   ]);

//   // Render details for the received amount
//   const receivedAmount = useMemo(() => {
//     if (!destToken || !toChain) {
//       return <></>;
//     }

//     const destTokenConfig = config.tokens.get(receivedToken);
//     const destChainConfig = config.chains[toChain]!;

//     const usdAmount = calculateUSDPrice(
//       getTokenPrice,
//       receiveAmount,
//       destTokenConfig,
//     );

//     const recipientAddress = recipient ? trimAddress(recipient) : '';
//     const explorerUrl = recipient ? getWalletExplorerUrl(toChain, recipient) : '';

//     return (
//       <Stack alignItems="center" direction="row" justifyContent="flex-start">
//         <AssetBadge chainConfig={destChainConfig} token={destToken} />
//         <Stack direction="column" marginLeft="12px">
//           <Typography fontSize={16}>
//             {receiveAmount || '0'} {destToken?.symbol}
//           </Typography>
//           <Typography color={theme.palette.text.secondary} fontSize={14}>
//             {usdAmount ? (
//               <>
//                 {usdAmount}
//                 {separator}
//               </>
//             ) : null}
//             {destChainConfig?.displayName}
//           </Typography>
//           {recipientAddress && (
//             <Typography color={theme.palette.text.secondary} fontSize={12}>
//               To: {explorerUrl ? (
//                 <Link href={explorerUrl} target="_blank" rel="noopener">
//                   {recipientAddress}
//                 </Link>
//               ) : (
//                 recipientAddress
//               )}
//             </Typography>
//           )}
//         </Stack>
//       </Stack>
//     );
//   }, [
//     destToken,
//     toChain,
//     receivedToken,
//     receiveAmount,
//     getTokenPrice,
//     separator,
//     theme.palette.text.secondary,
//     recipient,
//   ]);

//   // Render transaction hash
//   const transactionHash = useMemo(() => {
//     if (!sendTx) return null;

//     const explorerUrl = getTransactionExplorerUrl(fromChain, sendTx);
//     const txHash = trimAddress(sendTx);

//     return (
//       <Stack direction="row" alignItems="center" justifyContent="space-between">
//         <Typography color={theme.palette.text.secondary} fontSize={14}>
//           Transaction Hash
//         </Typography>
//         {explorerUrl ? (
//           <ExplorerLink href={explorerUrl} text={txHash} />
//         ) : (
//           <Typography fontSize={14}>{txHash}</Typography>
//         )}
//       </Stack>
//     );
//   }, [sendTx, fromChain, theme.palette.text.secondary]);

//   // Render ETA if available
//   const etaDisplay = useMemo(() => {
//     if (!eta) return null;

//     return (
//       <Stack direction="row" alignItems="center" justifyContent="space-between">
//         <Typography color={theme.palette.text.secondary} fontSize={14}>
//           Estimated Time
//         </Typography>
//         <Typography fontSize={14}>
//           {millisToHumanString(eta)}
//         </Typography>
//       </Stack>
//     );
//   }, [eta]);

//   // Render route information
//   const routeInfo = useMemo(() => {
//     if (!routeName) return null;

//     return (
//       <Stack direction="row" alignItems="center" justifyContent="space-between">
//         <Typography color={theme.palette.text.secondary} fontSize={14}>
//           Route
//         </Typography>
//         <Typography fontSize={14}>
//           {routeName}
//         </Typography>
//       </Stack>
//     );
//   }, [routeName]);

//   if (!sourceToken || !destToken) {
//     return (
//       <Box sx={styles.container}>
//         <Card sx={styles.card}>
//           <CardContent>
//             <Typography textAlign="center">
//               Transaction details not available
//             </Typography>
//           </CardContent>
//         </Card>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={styles.container}>
//       <Card sx={styles.card}>
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

//             <Divider />

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

//             <Divider />

//             {/* Transaction Details */}
//             <Stack spacing={1}>
//               {transactionHash}
//               {routeInfo}
//               {etaDisplay}
//             </Stack>
//           </Stack>
//         </CardContent>
//       </Card>
//     </Box>
//   );
// };

// export default TransactionDetails;
