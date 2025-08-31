// import React, { useMemo } from 'react';
// import { Box, Typography } from '@mui/material';
// import { useTheme } from '@mui/material/styles';;
// import type { ZapTransactionLocal } from 'config/types';

// type Props = {
//   transactions: ZapTransactionLocal[];
//   disabled?: boolean;
// };

// const ZapTxHistoryWidget = (props: Props) => {
//   const theme = useTheme();
//   const { transactions, disabled = false } = props;

//   const styles = useMemo(
//     () => ({
//       container: {
//         width: '100%',
//         maxWidth: '420px',
//       },
//       header: {
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: '16px',
//       },
//       title: {
//         fontSize: '18px',
//         fontWeight: 600,
//         color: theme.palette.text.primary,
//       },
//       noTransactions: {
//         textAlign: 'center',
//         color: theme.palette.text.secondary,
//         padding: '20px',
//       },
//     }),
//     [theme],
//   );

//   if (!transactions || transactions.length === 0) {
//     return (
//       <Box sx={styles.container}>
//         <Box sx={styles.header}>
//           <Typography sx={styles.title}>Recent Zap Transactions</Typography>
//         </Box>
//         <Typography sx={styles.noTransactions}>
//           No recent Zap transactions
//         </Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={styles.container}>
//       <Box sx={styles.header}>
//         <Typography sx={styles.title}>Recent Zap Transactions</Typography>
//       </Box>

//       {/* Show only the most recent transactions (limit to 3) */}
//       {transactions.slice(0, 3).map((tx, idx) => (
//         <ZapTxHistoryWidgetItem
//           key={idx}
//           data={tx}
//           disabled={disabled}
//         />
//       ))}
//     </Box>
//   );
// };

// export default ZapTxHistoryWidget;
