import type { ProtocolsConfig } from '../types';

export const MAINNET_PROTOCOLS: ProtocolsConfig = {
  aave: {
    name: 'Aave',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7278.png',
    id: 'aave',
    supportedChainIds: [42161, 8453, 1, 137, 56, 10],
  },
  aerodrome: {
    name: 'Aerodrome',
    id: 'aerodrome',
    icon: 'https://aerodrome.finance/svg/AERO/appLogo.svg',
    supportedChainIds: [8453],
  },
  balancer: {
    name: 'Balancer',
    id: 'balancer',
    icon: 'https://balancer.fi/favicon.ico',
    supportedChainIds: [1, 42161, 43114, 8453, 137, 10],
  },
  bedrock: {
    name: 'Bedrock',
    icon: 'https://www.bedrock.technology/favicon.ico',
    id: 'bedrock',
    supportedChainIds: [
      1, 56, 7000, 42161, 10, 60808, 5000, 34443, 4200, 200901, 223, 80094,
    ],
  },
  camelot: {
    name: 'Camelot',
    id: 'camelot',
    icon: 'https://app.camelot.exchange/favicon.svg',
    supportedChainIds: [42161, 1625],
  },
  compound: {
    name: 'Compound',
    icon: 'https://v3-app.compound.finance/favicon.ico',
    id: 'compound',
    supportedChainIds: [1, 42161, 8453, 137, 10, 5000, 534352, 59144],
  },
  curve: {
    name: 'Curve',
    icon: 'https://www.curve.finance/favicon-32x32.png',
    id: 'curve',
    supportedChainIds: [
      1, 137, 250, 42161, 10, 100, 1313161554, 1284, 2222, 42220, 1101, 324,
      8453, 252, 56, 196,
    ],
  },
  ethena: {
    name: 'Ethena',
    icon: 'https://app.ethena.fi/shared/ethena.svg',
    id: 'ethena',
    supportedChainIds: [1],
  },
  etherfi: {
    name: 'EtherFi',
    icon: 'https://www.ether.fi/images/favicon/favicon-dark-32x32.png',
    id: 'etherfi',
    supportedChainIds: [1, 8453, 42161, 534352, 80094, 21000000, 81457, 59144],
  },
  extrafi: {
    name: 'ExtraFi',
    id: 'extrafi',
    icon: 'https://app.extrafi.io/logo512x512.png',
    supportedChainIds: [8453, 10],
  },
  extrafixlend: {
    name: 'Extrafi Xlend',
    icon: 'https://xlend.extrafi.io/brand/favicon.ico',
    id: 'extrafixlend',
    supportedChainIds: [10, 8453],
  },
  fluid: {
    name: 'Fluid',
    icon: 'https://fluid.instadapp.io/icons/favicon-32x32.png',
    id: 'fluid',
    supportedChainIds: [1, 8453, 42161],
  },
  minterest: {
    name: 'Minterest',
    icon: 'https://mantle.minterest.com/favicon-32x32.png',
    id: 'minterest',
    supportedChainIds: [5000, 1, 167000],
  },
  moonwell: {
    name: 'Moonwell',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20734.png',
    id: 'moonwell',
    supportedChainIds: [8453, 10, 1284, 1285],
  },
  puffer: {
    name: 'Puffer',
    icon: 'https://www.puffer.fi/favicon/favicon-32x32.png',
    id: 'puffer',
    supportedChainIds: [1],
  },
  quickswap: {
    name: 'Quickswap',
    id: 'quickswap',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/19966.png',
    supportedChainIds: [137],
  },
  resolv: {
    name: 'Resolv',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32873.png',
    id: 'resolv',
    supportedChainIds: [1],
  },
  silo: {
    name: 'Silo',
    icon: 'https://v2.silo.finance/favicon.ico',
    id: 'silo',
    supportedChainIds: [146, 42161, 57073],
  },
  sushiswap: {
    name: 'Sushiswap',
    id: 'sushiswap',
    icon: 'https://www.sushi.com/favicon-32x32.png?v=1',
    supportedChainIds: [
      42161, 1, 56, 8453, 43114, 137, 534352, 81457, 10, 59144, 1116, 100, 30,
      2222, 250, 1088, 7000,
    ],
  },
  truf: {
    name: 'Truflation',
    icon: 'https://etherscan.io/token/images/truflation_32.png?=v2',
    id: 'truf',
    supportedChainIds: [1],
  },
  uniswap: {
    name: 'Uniswap',
    id: 'uniswap',
    icon: 'https://app.uniswap.org/favicon.png',
    supportedChainIds: [1, 56, 137, 8453, 42220, 10, 42161, 81457, 43114, 324],
  },
  velodrome: {
    name: 'Velodrome',
    id: 'velodrome',
    icon: 'https://velodrome.finance/svg/VELO/appLogo.svg',
    supportedChainIds: [10],
  },
};
