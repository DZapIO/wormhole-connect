import {
  DZapClient,
  type ZapStatusResponse,
  type HexString,
} from '@dzapio/sdk';
import type {
  AttestationReceipt,
  Chain,
  CompletedTransferReceipt,
  Network,
  RefundedTransferReceipt,
  Signer,
  SourceInitiatedTransferReceipt,
  TokenId,
  TransactionId,
  routes,
} from '@wormhole-foundation/sdk-connect';
import {
  TransferState,
  Wormhole,
  circle,
} from '@wormhole-foundation/sdk-connect';
import { isEvmNativeSigner } from '@wormhole-foundation/sdk-evm';
import type { ethers } from 'ethers';
import { getChainFromId, getChainId } from 'utils/chainMapping';

export function getNativeContractAddress(chain: Chain): HexString {
  return '0x0000000000000000000000000000000000000000';
}

export function isDZapNativeContractAddress(address: string): boolean {
  return address === '0x0000000000000000000000000000000000000000';
}

const chainNameMap = {
  // EVM Chains
  Ethereum: 1,
  Bsc: 56,
  Polygon: 137,
  Avalanche: 43114,
  Fantom: 250,
  Arbitrum: 42161,
  Optimism: 10,
  Base: 8453,
  Celo: 42220,
  Moonbeam: 1284,
  Klaytn: 8217,
  Scroll: 534352,
  Mantle: 5000,
  Linea: 59144,
  Berachain: 118,
  Seievm: 119,
  Xlayer: 117,
} as Record<Chain, number>;

export function toDZapChainId(network: Network, chain: Chain): number {
  if (network === 'Mainnet') {
    if (!chainNameMap[chain]) throw new Error(`Chain ${chain} not supported`);
    return chainNameMap[chain];
  } else if (network === 'Testnet') {
    throw new Error(`Chain ${chain} not supported`);
  }
  throw new Error(`Unsupported network: ${network}`);
}

export function isTestnetSupportedChain(chain: Chain): boolean {
  return false;
}

export function fromDZapChainId(dZapChainId: number): Chain {
  for (const [wormholeChain, chainId] of Object.entries(chainNameMap)) {
    if (dZapChainId === chainId) {
      return wormholeChain as Chain;
    }
  }
  throw new Error(`Unknown DZap chain ${dZapChainId}`);
}

export function toWormholeChainName(chainId: number): Chain {
  return getChainFromId(chainId)!;
}

export function supportedChains(network?: Network): Chain[] {
  if (network === 'Testnet') {
    // Return only chains that are supported on testnet
    return [];
  }
  return Object.keys(chainNameMap) as Chain[];
}

export function dZapEvmSigner(signer: Signer): ethers.Signer {
  if (isEvmNativeSigner(signer))
    return signer.unwrap() as unknown as ethers.Signer;

  throw new Error('Signer must be an EvmNativeSigner');
}

export function dZapEvmProvider(signer: ethers.Signer) {
  return {
    getBlock: async function (): Promise<{ timestamp: number }> {
      const block = await signer.provider!.getBlock('latest');
      if (block === null)
        throw new Error('Failed to get latest Ethereum block');
      return block;
    },
  };
}

export enum DZapTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum MayanTransactionGoal {
  // send from evm to solana
  Send = 'SEND',
  // bridge to destination chain
  Bridge = 'BRIDGE',
  // perform the swap
  Swap = 'SWAP',
  // register for auction
  Register = 'REGISTER',
  // settle on destination
  Settle = 'SETTLE',
}

export interface Tx {
  txHash: string;
  goals: MayanTransactionGoal[];
  scannerUrl: string;
}

export function txStatusToReceipt(txStatus: ZapStatusResponse): routes.Receipt {
  const lastStep = txStatus.steps[txStatus.steps.length - 1];
  const firstStep = txStatus.steps[0];
  const srcChainId = firstStep.chainId;
  const dstChainId = lastStep.chainId;
  const srcChain = toWormholeChainName(srcChainId);
  const dstChain = toWormholeChainName(dstChainId);

  const originTxs = [
    {
      chain: srcChain,
      txid: firstStep.hash,
    },
  ].filter((tx) => tx.txid !== undefined) as Array<
    TransactionId<typeof srcChain>
  >;

  const destinationTxs = [
    {
      chain: dstChain,
      txid: lastStep.hash,
    },
  ].filter((tx) => tx.txid !== undefined) as Array<
    TransactionId<typeof dstChain>
  >;

  const refundTxs: Array<{ chain: Chain; txid: string }> = [];
  if (lastStep.status === DZapTransactionStatus.FAILED && lastStep.hash) {
    refundTxs.push({
      chain: toWormholeChainName(lastStep.chainId),
      txid: lastStep.hash,
    });
  }

  // TODO this is a hack. The Receipt type should ideally not require an Attestation.
  const attestation: AttestationReceipt<'WormholeCore'> =
    {} as AttestationReceipt<'WormholeCore'>;

  if (txStatus.status === DZapTransactionStatus.COMPLETED) {
    return {
      from: srcChain,
      to: dstChain,
      originTxs,
      destinationTxs,
      state: TransferState.DestinationFinalized,
      attestation,
    } satisfies CompletedTransferReceipt<AttestationReceipt<'WormholeCore'>>;
  } else if (txStatus.status === DZapTransactionStatus.FAILED) {
    return {
      from: srcChain,
      to: dstChain,
      originTxs,
      refundTxs,
      state: TransferState.Refunded,
      attestation,
    } satisfies RefundedTransferReceipt<AttestationReceipt<'WormholeCore'>>;
  } else if (txStatus.status === DZapTransactionStatus.PENDING) {
    return {
      from: srcChain,
      to: dstChain,
      originTxs,
      state: TransferState.SourceInitiated,
    } satisfies SourceInitiatedTransferReceipt;
  } else {
    throw new Error(`Unknown DZap transaction status ${txStatus.status}`);
  }
}

export async function getTransactionStatus(
  network: Network,
  tx: TransactionId,
): Promise<ZapStatusResponse | null> {
  try {
    return await DZapClient.getInstance().getZapTxnStatus({
      chainId: getChainId(tx.chain),
      txnHash: tx.txid,
    });
  } catch {
    return null;
  }
}

export function getUSDCTokenId(
  chain: Chain,
  network: Network,
): TokenId | undefined {
  const usdcContract = circle.usdcContract.get(network, chain);
  if (!usdcContract) {
    return undefined;
  }

  return Wormhole.tokenId(chain, usdcContract);
}
