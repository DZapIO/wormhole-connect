import type { Chain, Network } from '@wormhole-foundation/sdk';
import type { ZapDataProviderConstructor } from './types';

export class ZapDataProvider {
  constructor(readonly pc: ZapDataProviderConstructor) {}

  isDataProviderSupported<N extends Network>(
    Network: N,
    chain: Chain,
    provider: string,
  ): boolean {
    return this.pc.isProviderSupported(Network, chain, provider);
  }

  // Delegate to the provider instance methods
  async getPools(
    network: Network,
    chain: Chain,
    provider: string,
    limit?: number,
  ) {
    if (!this.pc.isProviderSupported(network, chain, provider)) {
      return [];
    }
    const providerInstance = new this.pc();
    return providerInstance.getPools(chain, provider, limit);
  }

  async getPositions(
    network: Network,
    chain: Chain,
    provider: string,
    userAddress: string,
    limit?: number,
  ) {
    if (!this.pc.isProviderSupported(network, chain, provider)) {
      return [];
    }
    const providerInstance = new this.pc();
    return providerInstance.getPositions(chain, provider, userAddress, limit);
  }
}
