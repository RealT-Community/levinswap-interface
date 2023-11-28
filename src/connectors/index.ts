import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectV2Connector } from '../utils/walletconnectV2Connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'
import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'

const NETWORK_URL = process.env.REACT_APP_NETWORK_URL
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID
const WALLET_CONNECT_V2_PROJECT_ID = process.env.REACT_APP_WALLET_CONNECT_V2_PROJECT_ID ?? ''

export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '1')

if (typeof NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_NETWORK_URL must be a defined environment variable`)
}

export const network = new NetworkConnector({
  urls: { [NETWORK_CHAIN_ID]: NETWORK_URL }
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds: [100]
})

export const walletConnectV2 = new WalletConnectV2Connector({
  projectId: WALLET_CONNECT_V2_PROJECT_ID,
  showQrModal: true,
  chains: [100],
  rpcMap: {
    ['100']: "https://rpc.gnosischain.com",
  },
})

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: 1
})

export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [100]
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL,
  appName: 'Levinswap',
  appLogoUrl:
    'https://raw.githubusercontent.com/Levinswap/levinswap-interface/master/public/images/192x192_App_Icon.png'
})
