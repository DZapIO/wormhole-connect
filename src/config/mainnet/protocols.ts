import type { ProtocolsConfig } from '../types';

export const MAINNET_PROTOCOLS: ProtocolsConfig = {
  aave: {
    name: 'Aave',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png',
    id: 'aave',
    supportedChains: ['Arbitrum', 'Base', 'Ethereum', 'Optimism'],
  },
  balancer: {
    name: 'Balancer',
    id: 'balancer',
    icon: 'https://balancer.fi/favicon.ico',
    supportedChains: ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon'],
  },
  bedrock: {
    name: 'Bedrock',
    icon: 'https://www.bedrock.technology/favicon.ico',
    id: 'bedrock',
    supportedChains: ['Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon'],
  },
};
