// import { useCallback, useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import type { RootState } from 'store';
// import type { ZapTransaction } from 'config/types';

// interface UseZapTransactionHistoryProps {
//   page: number;
//   limit?: number;
// }

// interface UseZapTransactionHistoryReturn {
//   transactions: ZapTransaction[] | null;
//   isFetching: boolean;
//   hasMore: boolean;
//   error: string | null;
//   refetch: () => void;
// }

// const useZapTransactionHistory = ({
//   page,
//   limit = 20,
// }: UseZapTransactionHistoryProps): UseZapTransactionHistoryReturn => {
//   const [transactions, setTransactions] = useState<ZapTransaction[] | null>(null);
//   const [isFetching, setIsFetching] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const sendingWallet = useSelector((state: RootState) => state.wallet.sending);

//   // Mock function to fetch Zap transactions
//   // In a real implementation, this would call an API or blockchain
//   const fetchZapTransactions = useCallback(async () => {
//     if (!sendingWallet.address) {
//       setTransactions([]);
//       setHasMore(false);
//       return;
//     }

//     setIsFetching(true);
//     setError(null);

//     try {
//       // Simulate API call delay
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Mock data - replace with actual API call
//       const mockTransactions: ZapTransaction[] = [
//         {
//           txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
//           amount: '100',
//           amountUsd: '150.00',
//           fromChain: 'ethereum',
//           fromToken: { symbol: 'USDC', decimals: 6, address: '0x1234' },
//           toChain: 'solana',
//           toToken: { symbol: 'USDC', decimals: 6, address: '0x5678' },
//           receiveAmount: '100',
//           senderTimestamp: Date.now() - 3600000, // 1 hour ago
//           explorerLink: 'https://etherscan.io/tx/0x1234...',
//           zapRoute: 'Uniswap V3 + Wormhole',
//           status: 'completed',
//         },
//         {
//           txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
//           amount: '50',
//           amountUsd: '75.00',
//           fromChain: 'solana',
//           fromToken: { symbol: 'SOL', decimals: 9, address: '0xabcd' },
//           toChain: 'ethereum',
//           toToken: { symbol: 'WETH', decimals: 18, address: '0xefgh' },
//           receiveAmount: '0.025',
//           senderTimestamp: Date.now() - 7200000, // 2 hours ago
//           explorerLink: 'https://solscan.io/tx/0xabcd...',
//           zapRoute: 'Raydium + Wormhole',
//           status: 'pending',
//         },
//       ];

//       // Simulate pagination
//       const startIndex = page * limit;
//       const endIndex = startIndex + limit;
//       const paginatedTransactions = mockTransactions.slice(startIndex, endIndex);

//       if (page === 0) {
//         setTransactions(paginatedTransactions);
//       } else {
//         setTransactions(prev => prev ? [...prev, ...paginatedTransactions] : paginatedTransactions);
//       }

//       setHasMore(endIndex < mockTransactions.length);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
//     } finally {
//       setIsFetching(false);
//     }
//   }, [sendingWallet.address, page, limit]);

//   // Refetch function
//   const refetch = useCallback(() => {
//     fetchZapTransactions();
//   }, [fetchZapTransactions]);

//   // Fetch transactions when dependencies change
//   useEffect(() => {
//     fetchZapTransactions();
//   }, [fetchZapTransactions]);

//   return {
//     transactions,
//     isFetching,
//     hasMore,
//     error,
//     refetch,
//   };
// };

// export default useZapTransactionHistory;
