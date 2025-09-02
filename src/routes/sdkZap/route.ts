import type { Chain, Network } from '@wormhole-foundation/sdk';
import type { ZapProviderConstructor } from './types';
import SDKv2Route from 'routes/sdkv2';

export class ZapSDK extends SDKv2Route {
  constructor(readonly pc: ZapProviderConstructor) {
    super(pc);
  }

  isProviderSupported<N extends Network>(
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
      throw new Error(
        `Provider ${provider} is not supported on chain ${chain}`,
      );
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
      throw new Error(
        `Provider ${provider} is not supported on chain ${chain}`,
      );
    }
    const providerInstance = new this.pc();
    return providerInstance.getPositions(chain, provider, userAddress, limit);
  }
}
