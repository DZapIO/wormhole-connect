import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Chain } from '@wormhole-foundation/sdk';
import { amount } from '@wormhole-foundation/sdk';
import config from 'config';
import type { Token, TokenTuple } from 'config/tokens';
import {
  isZapPoolOrPositionTuple,
  type ZapChains,
  type ZapProviders,
} from 'config/zapAsset';
import { TransferWallet, walletAcceptedChains } from 'utils/wallet';
import type { DataWrapper } from './helpers';
import {
  errorDataWrapper,
  fetchDataWrapper,
  getEmptyDataWrapper,
  receiveDataWrapper,
} from './helpers';
import type { WalletData } from './wallet';
import { clearWallet, setWalletError } from './wallet';

export type ValidationErr = string;

export type ZapValidations = {
  sendingWallet: ValidationErr;
  receivingWallet: ValidationErr;
  fromChain: ValidationErr;
  toChain: ValidationErr;
  amount: ValidationErr;
  toNativeToken: ValidationErr;
  relayerFee: ValidationErr;
  receiveAmount: ValidationErr;
};

export interface ZapInputState {
  showValidationState: boolean;
  validations: ZapValidations;
  fromChain: Chain | undefined;
  toChain: Chain | undefined;
  token: TokenTuple | undefined;
  destToken: TokenTuple | undefined;
  amount?: amount.Amount;
  receiveAmount: DataWrapper<string>;
  route?: string;
  foreignAsset: string;
  associatedTokenAddress: string;
  gasEst: {
    send: string;
    claim: string;
  };
  isTransactionInProgress: boolean;
  receiverNativeBalance: string | undefined;
  providers: ZapProviders;
  zappingChains: ZapChains;
  // Zap Redeem functionality
  redeemTxData?: any; // Replace with proper type
  redeemRoute?: string;
  isResumeTx?: boolean;
  timestamp?: number;
}

// This is a function because config might have changed since we last cleared this store
function getInitialState(): ZapInputState {
  const { fromChain, toChain } = config.ui.defaultInputs || {};

  return {
    showValidationState: false,
    validations: {
      fromChain: '',
      toChain: '',
      amount: '',
      toNativeToken: '',
      sendingWallet: '',
      receivingWallet: '',
      relayerFee: '',
      receiveAmount: '',
    },
    fromChain,
    toChain,
    token: undefined,
    destToken: undefined,
    amount: undefined,
    receiveAmount: getEmptyDataWrapper(),
    route: undefined,
    foreignAsset: '',
    associatedTokenAddress: '',
    gasEst: {
      send: '',
      claim: '',
    },
    isTransactionInProgress: false,
    receiverNativeBalance: '',
    providers: {},
    zappingChains: {},
  };
}

const performModificationsIfFromChainChanged = (state: ZapInputState) => {
  const { fromChain } = state;

  if (state.token) {
    const token = config.zapAssets.get(state.token);
    if (token && fromChain) {
      if (token.chain !== fromChain && token.symbol) {
        const withSameSymbol = config.zapAssets.findBySymbol(
          fromChain,
          token.symbol,
        );

        if (withSameSymbol) {
          state.token = withSameSymbol.tuple;
        }
      }
    }
  }
};

const performModificationsIfToChainChanged = (state: ZapInputState) => {
  const { toChain } = state;

  if (state.destToken) {
    const destToken = config.zapAssets.get(state.destToken);
    if (destToken && toChain) {
      if (destToken.chain !== toChain && destToken.symbol) {
        const withSameSymbol = config.zapAssets.findBySymbol(
          toChain,
          destToken.symbol,
        );

        if (withSameSymbol) {
          state.destToken = withSameSymbol.tuple;
        }
      }
    }
  }
};

export const zapInputSlice = createSlice({
  name: 'zap',
  initialState: getInitialState(),
  reducers: {
    // validations
    setValidations: (
      state: ZapInputState,
      {
        payload: { showValidationState, validations },
      }: PayloadAction<{
        showValidationState: boolean;
        validations: ZapValidations;
      }>,
    ) => {
      Object.keys(validations).forEach((key) => {
        // @ts-ignore
        state.validations[key] = validations[key];
      });
      state.showValidationState = showValidationState;
    },
    // user input
    setToken: (
      state: ZapInputState,
      { payload }: PayloadAction<TokenTuple>,
    ) => {
      state.token = payload;
    },
    clearToken: (state: ZapInputState) => {
      state.token = undefined;
    },
    setDestToken: (
      state: ZapInputState,
      { payload }: PayloadAction<TokenTuple>,
    ) => {
      state.destToken = payload;
    },
    clearDestToken: (state: ZapInputState) => {
      state.destToken = undefined;
    },
    setFromChain: (state: ZapInputState, { payload }: PayloadAction<Chain>) => {
      state.fromChain = payload;
      performModificationsIfFromChainChanged(state);
    },
    setToChain: (state: ZapInputState, { payload }: PayloadAction<Chain>) => {
      state.toChain = payload;
      performModificationsIfToChainChanged(state);
    },
    setAmount: (state: ZapInputState, { payload }: PayloadAction<string>) => {
      let token: Token | undefined = undefined;
      if (state.token && state.fromChain) {
        if (isZapPoolOrPositionTuple(state.token)) {
          token = config.zapAssets.get(state.token);
        } else {
          token = config.tokens.get(state.token);
        }
        if (token) {
          const { decimals } = token;
          const parsed = amount.parse(payload, decimals);
          if (amount.units(parsed) === 0n) {
            state.amount = undefined;
          } else {
            state.amount = parsed;
          }
        }
      } else {
        console.warn(`Can't call setAmount without a fromChain and token`);
      }
    },
    setReceiveAmount: (
      state: ZapInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiveAmount = receiveDataWrapper(payload);
    },
    setFetchingReceiveAmount: (state: ZapInputState) => {
      state.receiveAmount = fetchDataWrapper();
    },
    setReceiveAmountError: (
      state: ZapInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiveAmount = errorDataWrapper(payload);
    },
    setTransferRoute: (
      state: ZapInputState,
      { payload }: PayloadAction<string | undefined>,
    ) => {
      if (!payload) {
        state.route = undefined;
        return;
      }
      state.route = payload;
    },
    // clear inputs
    clearTransfer: (state: ZapInputState) => {
      const initialState = getInitialState();
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
    setIsTransactionInProgress: (
      state: ZapInputState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.isTransactionInProgress = payload;
    },
    setZappingProviders: (state, { payload }: PayloadAction<ZapProviders>) => {
      state.providers = payload;
    },
    setZappingChains: (state, { payload }: PayloadAction<ZapChains>) => {
      state.zappingChains = payload;
    },
    // Zap Redeem actions
    setTxDetails: (state, { payload }: PayloadAction<any>) => {
      state.redeemTxData = payload;
    },
    setRoute: (state, { payload }: PayloadAction<string>) => {
      state.redeemRoute = payload;
    },
    setIsResumeTx: (state, { payload }: PayloadAction<boolean>) => {
      state.isResumeTx = payload;
    },
    setTimestamp: (state, { payload }: PayloadAction<number>) => {
      state.timestamp = payload;
    },
    clearZapRedeem: (state) => {
      state.redeemTxData = undefined;
      state.redeemRoute = undefined;
      state.isResumeTx = false;
      state.timestamp = undefined;
    },
    swapInputs: (state: ZapInputState) => {
      const tmpChain = state.fromChain;
      state.fromChain = state.toChain;
      state.toChain = tmpChain;
      const tmpToken = state.token;
      state.token = state.destToken;
      state.destToken = tmpToken;
      performModificationsIfFromChainChanged(state);
      performModificationsIfToChainChanged(state);
    },
  },
});

export const isDisabledChain = (chain: Chain, wallet: WalletData) => {
  // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
  {
    return !walletAcceptedChains(wallet.type).includes(chain);
  }
};

export const selectFromChain = async (
  dispatch: any,
  chain: Chain,
  wallet: WalletData,
) => {
  selectChain(TransferWallet.SENDING, dispatch, chain, wallet);
};

export const selectToChain = async (
  dispatch: any,
  chain: Chain,
  wallet: WalletData,
) => {
  selectChain(TransferWallet.RECEIVING, dispatch, chain, wallet);
};

export const selectChain = async (
  type: TransferWallet,
  dispatch: any,
  chain: Chain,
  wallet: WalletData,
) => {
  if (isDisabledChain(chain, wallet)) {
    dispatch(clearWallet(type));
    const payload = {
      type,
      error: 'Wallet disconnected, please connect a supported wallet',
    };
    dispatch(setWalletError(payload));
  }

  // Call wallet switchChain if the new chain is of the same type
  // and a cosmos chain (while the wallet is the same the address will
  // vary depending on the chain)
  const chainConfig = config.chains[chain];
  if (!chainConfig) return;
  dispatch(
    type === TransferWallet.SENDING ? setFromChain(chain) : setToChain(chain),
  );
};

export const {
  setValidations,
  setToken,
  clearToken,
  setDestToken,
  clearDestToken,
  setFromChain,
  setToChain,
  setAmount,
  setTransferRoute,
  clearTransfer,
  setIsTransactionInProgress,
  swapInputs,
  setZappingProviders,
  setZappingChains,
  // Zap Redeem actions
  setTxDetails,
  setRoute,
  setIsResumeTx,
  setTimestamp,
  clearZapRedeem,
} = zapInputSlice.actions;

export default zapInputSlice.reducer;
