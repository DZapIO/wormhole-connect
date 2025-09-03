import type { Chain, Network } from '@wormhole-foundation/sdk';
import type { ZapDataProviderConstructor } from './types';

export class ZapDataProvider {
  constructor(readonly pc: ZapDataProviderConstructor) {}

  isDataProviderSupported<N extends Network>(
    Network: N,
    chain: Chain,
    protocol: string,
  ): boolean {
    return this.pc.isProtocolSupported(Network, chain, protocol);
  }

  // Delegate to the provider instance methods
  async getPools(
    network: Network,
    chain: Chain,
    protocol: string,
    limit?: number,
  ) {
    if (!this.pc.isProtocolSupported(network, chain, protocol)) {
      return [];
    }
    const providerInstance = new this.pc();
    return providerInstance.getPools(chain, protocol, limit);
  }

  async getPositions(
    network: Network,
    chain: Chain,
    protocol: string,
    userAddress: string,
    limit?: number,
  ) {
    if (!this.pc.isProtocolSupported(network, chain, protocol)) {
      return [];
    }
    const providerInstance = new this.pc();
    return providerInstance.getPositions(chain, protocol, userAddress, limit);
  }
}
