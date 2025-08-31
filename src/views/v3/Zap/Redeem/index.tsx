// import type { ReactNode } from 'react';
// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useTimer } from 'react-timer-hook';
// import { useTheme } from '@mui/material/styles';
// import Box from '@mui/material/Box';
// import CircularProgress from '@mui/material/CircularProgress';
// import ChevronLeft from '@mui/icons-material/ChevronLeft';
// import IconButton from '@mui/material/IconButton';
// import Stack from '@mui/material/Stack';
// import Typography from '@mui/material/Typography';
// import {
//   isAttested,
//   isCompleted,
//   isDestinationQueued,
//   isRefunded,
//   isFailed,
//   routes,
//   isNative,
// } from '@wormhole-foundation/sdk';
// import { getTokenDetails, getTransferDetails } from 'telemetry';

// import AlertBannerV3 from 'components/v3/AlertBanner';
// import ConfigurablePageHeader from 'components/ConfigurablePageHeader';
// import Button from 'components/v3/Button';
// import config from 'config';
// import { RouteContext } from 'contexts/RouteContext';
// import useTrackTransfer from 'hooks/useTrackTransfer';
// import PoweredByIcon from 'icons/PoweredBy';
// import { SDKv2Signer } from 'routes/sdkv2/signer';
// import { setRoute } from 'store/router';
// import { useUSDamountGetter } from 'hooks/useUSDamountGetter';
// import { interpretTransferError } from 'utils/errors';
// import {
//   removeTxFromLocalStorage,
//   updateTxInLocalStorage,
// } from 'utils/inProgressTxCache';
// import {
//   millisToMinutesAndSeconds,
//   minutesAndSecondsWithPadding,
// } from 'utils/transferValidation';
// import { TransferWallet } from 'utils/wallet';
// import TransactionDetails from 'views/Zap/Redeem/TransactionDetails';
// import WalletSidebar from 'views/v3/Bridge/WalletConnector/Sidebar';
// import { useConnectToLastUsedWallet } from 'hooks/useConnectToLastUsedWallet';
// import useWalletProvider from 'hooks/useWalletProvider';

// import type { RootState } from 'store';
// import TxCompleteIcon from 'icons/TxComplete';
// import TxWarningIcon from 'icons/TxWarning';
// import TxFailedIcon from 'icons/TxFailed';
// import { getAssociatedTokenAddressSync, NATIVE_MINT } from '@solana/spl-token';
// import { PublicKey } from '@solana/web3.js';
// import TxReadyForClaim from 'icons/TxReadyForClaim';
// import { useGetZapAssets } from 'hooks/zap/useGetZapAssets';
// import { tokenIdFromTuple } from 'config/tokens';
// import { clearZapRedeem } from 'store/zap';
// import { setSearch } from 'store/search';
// import { isExecutorRoute } from 'utils';

// function ZapRedeem() {
//   const dispatch = useDispatch();
//   const theme = useTheme();

//   const [claimError, setClaimError] = useState('');
//   const [isClaimInProgress, setIsClaimInProgress] = useState(false);
//   const [transferSuccessEventFired, setTransferSuccessEventFired] =
//     useState(false);
//   const [etaExpired, setEtaExpired] = useState(false);

//   const [isWalletSidebarOpen, setIsWalletSidebarOpen] = useState(false);

//   const routeContext = React.useContext(RouteContext);
//   const { walletProvider, connectWallet } = useWalletProvider();

//   const { zapAssets } = useGetZapAssets();

//   const styles = useMemo(
//     () => ({
//       spacer: {
//         display: 'flex',
//         flexDirection: 'column',
//         gap: '16px',
//         alignItems: 'center',
//         justifyContent: 'center',
//         width: '100%',
//       },
//       container: {
//         margin: 'auto',
//         maxWidth: '650px',
//       },
//       header: {
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         width: '100%',
//       },
//       actionButton: {
//         padding: '12px 16px',
//         backgroundColor: theme.palette.primary.main,
//         color: theme.palette.primary.contrastText,
//         border: 'none',
//         borderRadius: '8px',
//         cursor: 'pointer',
//         fontSize: '14px',
//         fontWeight: 600,
//         '&:hover': {
//           backgroundColor: theme.palette.primary.dark,
//         },
//         '&:disabled': {
//           backgroundColor: theme.palette.action.disabled,
//           cursor: 'not-allowed',
//         },
//       },
//       backButton: {
//         color: theme.palette.text.secondary,
//         '&:hover': {
//           backgroundColor: theme.palette.action.hover,
//         },
//       },
//       poweredBy: {
//         display: 'flex',
//         alignItems: 'center',
//         gap: '8px',
//         color: theme.palette.text.secondary,
//         fontSize: '12px',
//       },
//     }),
//     [theme],
//   );

//   // Get redeem transaction data from store
//   const redeemTxData = useSelector((state: RootState) => state.zap.redeemTxData);
//   const redeemRoute = useSelector((state: RootState) => state.zap.redeemRoute);

//   // Handle back navigation
//   const handleBack = useCallback(() => {
//     dispatch(clearZapRedeem());
//     dispatch(setRoute('zap'));
//   }, [dispatch]);

//   // Handle wallet connection
//   const handleConnectWallet = useCallback(async () => {
//     if (walletProvider) {
//       await connectWallet();
//     } else {
//       setIsWalletSidebarOpen(true);
//     }
//   }, [walletProvider, connectWallet]);

//   // Handle claim transaction
//   const handleClaim = useCallback(async () => {
//     if (!redeemTxData || !walletProvider) return;

//     setIsClaimInProgress(true);
//     setClaimError('');

//     try {
//       // Implement claim logic for Zap transactions
//       // This would be similar to v3 but adapted for Zap
//       console.log('Claiming Zap transaction:', redeemTxData);
//     } catch (error) {
//       setClaimError(error instanceof Error ? error.message : 'Claim failed');
//     } finally {
//       setIsClaimInProgress(false);
//     }
//   }, [redeemTxData, walletProvider]);

//   // Render transaction status
//   const renderTransactionStatus = useMemo(() => {
//     if (!redeemTxData) return null;

//     // Implement status rendering logic based on transaction state
//     return (
//       <Box sx={styles.spacer}>
//         <Typography variant="h6" textAlign="center">
//           Transaction Status
//         </Typography>
//         {/* Add transaction status indicators here */}
//       </Box>
//     );
//   }, [redeemTxData, styles.spacer]);

//   return (
//     <Box sx={styles.container}>
//       <ConfigurablePageHeader />

//       {/* Header */}
//       <Box sx={styles.header}>
//         <IconButton onClick={handleBack} sx={styles.backButton}>
//           <ChevronLeft />
//         </IconButton>
//         <Typography variant="h5">Zap Redeem</Typography>
//         <Box sx={{ width: 40 }} /> {/* Spacer for centering */}
//       </Box>

//       {/* Main Content */}
//       <Box sx={styles.spacer}>
//         {redeemTxData ? (
//           <>
//             <TransactionDetails />
//             {renderTransactionStatus}

//             {/* Action Buttons */}
//             <Stack direction="row" spacing={2} width="100%">
//               <Button
//                 onClick={handleClaim}
//                 disabled={isClaimInProgress || !walletProvider}
//                 sx={styles.actionButton}
//                 fullWidth
//               >
//                 {isClaimInProgress ? (
//                   <CircularProgress size={20} color="inherit" />
//                 ) : (
//                   'Claim'
//                 )}
//               </Button>
//             </Stack>

//             {claimError && (
//               <AlertBannerV3
//                 severity="error"
//                 title="Claim Error"
//                 message={claimError}
//               />
//             )}
//           </>
//         ) : (
//           <Typography variant="body1" textAlign="center">
//             No redeem transaction found
//           </Typography>
//         )}
//       </Box>

//       {/* Wallet Sidebar */}
//       <WalletSidebar
//         open={isWalletSidebarOpen}
//         onClose={() => setIsWalletSidebarOpen(false)}
//       />

//       {/* Powered By */}
//       <Box sx={styles.poweredBy}>
//         <PoweredByIcon />
//         <Typography variant="caption">Powered by Wormhole</Typography>
//       </Box>
//     </Box>
//   );
// }

// export default ZapRedeem;
