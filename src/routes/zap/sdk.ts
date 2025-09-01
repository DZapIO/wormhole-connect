import type { Chain, ChainContext, Network } from '@wormhole-foundation/sdk';
import type { ZapProviderConstructor } from './types';

export class ZapSDK {
  constructor(readonly pc: ZapProviderConstructor) {}

  get name() {
    return this.pc.meta.name;
  }

  get provider() {
    return this.pc.meta.provider;
  }

  supportedNetworks(): Network[] {
    return this.pc.supportedNetworks();
  }

  supportedChains(network: Network): Chain[] {
    return this.pc.supportedChains(network);
  }

  supportsSameChainSwaps(network: Network, chain: Chain): boolean {
    return this.pc.supportsSameChainSwaps?.(network, chain) ?? false;
  }

  isProtocolSupported<N extends Network>(chain: ChainContext<N>): boolean {
    return this.pc.isProtocolSupported(chain);
  }

  // Delegate to the provider instance methods
  async getPools(chain: Chain, provider: string, limit?: number) {
    const providerInstance = new this.pc();
    return providerInstance.getPools(chain, provider, limit);
  }

  async getPositions(
    chain: Chain,
    provider: string,
    userAddress: string,
    limit?: number,
  ) {
    const providerInstance = new this.pc();
    return providerInstance.getPositions(chain, provider, userAddress, limit);
  }

  isSupportedProvider(provider: string, chain: Chain): boolean {
    const providerInstance = new this.pc();
    return providerInstance.isSupportedProvider(provider, chain);
  }
}
