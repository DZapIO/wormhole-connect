import type {
  HexString,
  ZapBuildTxnRequest,
  ZapBuildTxnResponse,
  ZapQuoteRequest,
  ZapQuoteResponse,
} from '@dzapio/sdk';
import { DZapClient } from '@dzapio/sdk';
import type {
  Chain,
  ChainAddress,
  ChainContext,
  Network,
  Signer,
  SourceInitiatedTransferReceipt,
  TokenId,
  TransactionId,
} from '@wormhole-foundation/sdk-connect';
import {
  TransferState,
  amount,
  canonicalAddress,
  isAttested,
  isCompleted,
  isNative,
  isRedeemed,
  isRefunded,
  isSignAndSendSigner,
  isSignOnlySigner,
  isSourceFinalized,
  isSourceInitiated,
  nativeChainIds,
  routes,
} from '@wormhole-foundation/sdk-connect';
import type { EvmChains } from '@wormhole-foundation/sdk-evm';
import {
  EvmPlatform,
  EvmUnsignedTransaction,
} from '@wormhole-foundation/sdk-evm';
import axios from 'axios';
import { getChainId } from 'utils/chainMapping';
import { getAllZapTokenIdsForChain } from '../../utils/tokenHelpers';
import {
  getNativeContractAddress,
  getTransactionStatus,
  isDZapNativeContractAddress,
  isTestnetSupportedChain,
  supportedChains,
  txStatusToReceipt,
} from './utils';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DZapRoute {
  export type Options = {
    slippage: number;
  };
  export type NormalizedParams = {
    slippage: number;
  };
  export interface ValidatedParams
    extends routes.ValidatedTransferParams<Options> {
    normalizedParams: NormalizedParams;
  }
}

type Op = DZapRoute.Options;
type Vp = DZapRoute.ValidatedParams;
type Q = routes.Quote<Op, Vp, ZapQuoteResponse>;
type QR = routes.QuoteResult<Op, Vp, ZapQuoteResponse>;
type R = routes.Receipt;

type Tp = routes.TransferParams<Op>;
type Vr = routes.ValidationResult<Op>;

class DZapRouteBase<N extends Network> extends routes.AutomaticRoute<
  N,
  Op,
  Vp,
  R
> {
  MAX_SLIPPAGE = 1;

  static NATIVE_GAS_DROPOFF_SUPPORTED = false;
  static override IS_AUTOMATIC = true;

  private sdk = DZapClient.getInstance();

  protected isTestnetRequest(request: routes.RouteTransferRequest<N>): boolean {
    // A request is considered testnet if either the source or destination chain is on testnet
    return (
      request.fromChain.network === 'Testnet' ||
      request.toChain.network === 'Testnet'
    );
  }

  getDefaultOptions(): Op {
    return {
      slippage: 0.5,
    };
  }

  static supportedNetworks(): Network[] {
    return ['Mainnet'];
  }

  static supportedChains(network: Network): Chain[] {
    return supportedChains(network);
  }

  static isProtocolSupported<N extends Network>(
    chain: ChainContext<N>,
  ): boolean {
    return supportedChains(chain.network).includes(chain.chain);
  }

  // DZap can handle any input and output token that has liquidity
  static async supportedDestinationTokens<N extends Network>(
    _token: TokenId,
    _fromChain: ChainContext<N>,
    toChain: ChainContext<N>,
  ): Promise<TokenId[]> {
    return getAllZapTokenIdsForChain(toChain.chain);
  }

  async isAvailable(): Promise<boolean> {
    // No way to check relayer availability so assume true
    return true;
  }

  async validate(
    request: routes.RouteTransferRequest<N>,
    params: Tp,
  ): Promise<Vr> {
    try {
      params.options = params.options ?? this.getDefaultOptions();

      return {
        valid: true,
        params: {
          ...params,
        },
      } as Vr;
    } catch (e) {
      return { valid: false, params, error: e as Error };
    }
  }

  protected bpsToPercent(bps: number): number {
    return bps / 10000;
  }

  protected toDZapAddress(tokenId: TokenId): string {
    return !isNative(tokenId.address)
      ? canonicalAddress(tokenId)
      : getNativeContractAddress(tokenId.chain);
  }

  getParsedAmount(
    request: routes.RouteTransferRequest<N>,
    amountString: string,
  ) {
    const decimals = request.source.decimals;
    const amt = amount.parse(amountString, decimals);

    return amt.amount;
  }

  protected async fetchQuote(
    request: routes.RouteTransferRequest<N>,
    params: Vp,
  ): Promise<ZapQuoteResponse | undefined> {
    const { fromChain, toChain } = request;

    if (this.isTestnetRequest(request)) {
      if (!isTestnetSupportedChain(fromChain.chain)) {
        throw new Error(
          `Chain ${
            fromChain.chain
          } is not supported on testnet. Supported testnet chains: ${supportedChains(
            'Testnet',
          ).join(', ')}`,
        );
      }
      if (!isTestnetSupportedChain(toChain.chain)) {
        throw new Error(
          `Chain ${
            toChain.chain
          } is not supported on testnet. Supported testnet chains: ${supportedChains(
            'Testnet',
          ).join(', ')}`,
        );
      }
    }

    const quoteParams: ZapQuoteRequest = {
      srcToken: request.source.id.address.toString() as HexString,
      srcChainId: getChainId(request.source.id.chain)!,
      destToken: request.destination.id.address.toString() as HexString,
      destChainId: getChainId(request.destination.id.chain)!,
      recipient: (request.recipient?.address.address ||
        request.sender?.address.address) as HexString,
      refundee: request.sender?.address.address as HexString,
      slippage: 0.5, // TODO: Add slippage control
      account: request.sender?.address.toString() as HexString,
      amount: this.getParsedAmount(request, params.amount),
      // TODO: Add position and pool details
      positionDetails: undefined,
      poolDetails: undefined,
      allowedBridges: undefined,
      allowedDexes: undefined,
    };
    return await this.sdk.getZapQuote(quoteParams);
  }

  getMinAmount(minAmountIn: string | number, decimals: number) {
    try {
      const minAmount = amount.parse(
        amount.denoise(minAmountIn, decimals),
        decimals,
      );
      return minAmount;
    } catch (e) {
      return null;
    }
  }

  async quote(
    request: routes.RouteTransferRequest<N>,
    params: Vp,
  ): Promise<QR> {
    try {
      const quote = await this.fetchQuote(request, params);
      if (!quote) {
        return {
          success: false,
          error: new routes.UnavailableError(
            new Error(`Couldn't fetch a quote`),
          ),
        };
      }

      const nativeFee = quote.path.reduce((acc, step) => {
        return step.fee.reduce((feeAcc, fee) => {
          if (fee.included && isDZapNativeContractAddress(fee.asset.address)) {
            return feeAcc + BigInt(fee.amount);
          }
          return feeAcc;
        }, 0n);
      }, 0n);

      const etaSeconds = quote.path.reduce((acc, step) => {
        return acc + step.estimatedDuration;
      }, 0);

      // 30 seconds from now
      const deadline64Seconds = Date.now() + 30_000;
      const expires = deadline64Seconds
        ? new Date(deadline64Seconds)
        : undefined;

      const fullQuote: Q = {
        success: true,
        params,
        sourceToken: {
          token: request.source.id,
          amount: amount.parse(params.amount, request.source.decimals),
        },
        destinationToken: {
          token: request.destination.id,
          amount: amount.fromBaseUnits(
            BigInt(quote.amountOut),
            request.destination.decimals,
          ),
        },
        relayFee: {
          token: {
            chain: request.fromChain.chain,
            address: 'native',
          },
          amount: amount.fromBaseUnits(nativeFee, 18),
        },
        destinationNativeGas: amount.fromBaseUnits(0n, 18),
        eta: etaSeconds * 1000,
        details: quote,
        expires,
      };
      return fullQuote;
    } catch (e: any) {
      if (axios.isAxiosError(e)) {
        const data = e?.response?.data;

        if (data?.code === 'AMOUNT_TOO_SMALL') {
          // When amount is too small, Mayan SDK returns errors in this format:
          //
          // {
          //   code: "AMOUNT_TOO_SMALL",
          //   data: { minAmountIn: 0.00055 },
          //   message: "Amount too small (min ~0.00055 ETH)"
          // }
          //
          // We parse this and return a standardized Wormhole SDK MinAmountError

          const minAmountIn = data?.data?.minAmountIn;
          const minAmount = this.getMinAmount(
            minAmountIn,
            request.source.decimals,
          );

          if (minAmount) {
            return {
              success: false,
              error: new routes.MinAmountError(minAmount),
            };
          }
        }

        if (data?.msg) {
          return {
            success: false,
            error: Error(`${data?.msg} ${{ cause: data }}`),
          };
        }
      }

      return {
        success: false,
        error: e as Error,
      };
    }
  }

  async initiate(
    request: routes.RouteTransferRequest<N>,
    signer: Signer<N>,
    quote: Q,
    to: ChainAddress,
  ) {
    try {
      const originAddress = signer.address();
      const destinationAddress = canonicalAddress(to);
      const txs: TransactionId[] = [];
      const rpc = await request.fromChain.getRpc();

      const txReqs: EvmUnsignedTransaction<N, EvmChains>[] = [];

      const nativeChainId = nativeChainIds.networkChainToNativeChainId.get(
        request.fromChain.network,
        request.fromChain.chain,
      );

      const tokenAddress = this.toDZapAddress(request.source.id);
      const isNativeToken = isNative(request.source.id.address);
      const contractAddress = quote.details?.approvalData?.approveTo;

      const amountUnits = amount.units(
        amount.parse(quote.params.amount, request.source.decimals),
      );

      if (!isNativeToken && contractAddress) {
        const tokenContract = EvmPlatform.getTokenImplementation(
          rpc,
          tokenAddress,
        );

        const allowance = await tokenContract.allowance(
          originAddress,
          contractAddress,
        );

        if (allowance < amountUnits) {
          const txReq = await tokenContract.approve.populateTransaction(
            contractAddress,
            amountUnits,
          );

          txReqs.push(
            new EvmUnsignedTransaction(
              {
                from: originAddress,
                chainId: nativeChainId as bigint,
                ...txReq,
              },
              request.fromChain.network,
              request.fromChain.chain as EvmChains,
              'Approve Allowance',
            ),
          );
        }
      }

      const buildRequest: ZapBuildTxnRequest = {
        account: originAddress as HexString,
        destChainId: getChainId(request.destination.id.chain)!,
        destToken: request.destination.id.address.toString() as HexString,
        srcChainId: getChainId(request.source.id.chain)!,
        srcToken: request.source.id.address.toString() as HexString,
        recipient: destinationAddress as HexString,
        refundee: originAddress as HexString,
        slippage: 0.5, // TODO: Add slippage control
        amount: this.getParsedAmount(request, quote.params.amount),
      };

      const buildResponse: ZapBuildTxnResponse = await this.sdk.buildZapTxn(
        buildRequest,
      );

      const txnData = buildResponse.steps.filter(
        (step) => step.action === 'execute',
      )[0].data;

      const txReq = {
        from: originAddress,
        to: txnData.callTo,
        data: txnData.callData,
        value: txnData.value,
        chainId: getChainId(request.fromChain.chain)!,
      };

      txReqs.push(
        new EvmUnsignedTransaction(
          txReq,
          request.fromChain.network,
          request.fromChain.chain as EvmChains,
          'Execute Swap',
        ),
      );

      if (isSignAndSendSigner(signer)) {
        const txids = await signer.signAndSend(txReqs);

        txs.push(
          ...txids.map((txid) => ({
            chain: request.fromChain.chain,
            txid,
          })),
        );
      } else if (isSignOnlySigner(signer)) {
        const signed = await signer.sign(txReqs);
        const txids = await EvmPlatform.sendWait(
          request.fromChain.chain,
          rpc,
          signed,
        );
        txs.push(
          ...txids.map((txid) => ({
            chain: request.fromChain.chain,
            txid,
          })),
        );
      }

      return {
        from: request.fromChain.chain,
        to: request.toChain.chain,
        state: TransferState.SourceInitiated,
        originTxs: txs,
      } satisfies SourceInitiatedTransferReceipt;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  public override async *track(receipt: R, timeout?: number) {
    if (isCompleted(receipt) || isRedeemed(receipt) || isRefunded(receipt))
      return receipt;

    // What should be the default if no timeout is provided?
    let leftover = timeout ? timeout : 60 * 60 * 1000;
    while (leftover > 0) {
      const start = Date.now();

      if (
        // this is awkward but there is not hasSourceInitiated like fn in sdk (todo)
        isSourceInitiated(receipt) ||
        isSourceFinalized(receipt) ||
        isAttested(receipt)
      ) {
        const txstatus = await getTransactionStatus(
          this.wh.network,
          receipt.originTxs[receipt.originTxs.length - 1]!,
        );

        if (txstatus) {
          receipt = txStatusToReceipt(txstatus);
          yield { ...receipt, txstatus };

          if (
            isCompleted(receipt) ||
            isRedeemed(receipt) ||
            isRefunded(receipt)
          )
            return receipt;
        }
      } else {
        throw new Error('Transfer must have been initiated');
      }

      // sleep for 1 second so we dont spam the endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      leftover -= Date.now() - start;
    }

    return receipt;
  }
}

export class DZapRoute<N extends Network>
  extends DZapRouteBase<N>
  implements routes.StaticRouteMethods<typeof DZapRoute>
{
  static meta = {
    name: 'DZap',
    provider: 'DZap',
  };
  static supportsSameChainSwaps(network: Network, chain: Chain) {
    return true;
  }
}
