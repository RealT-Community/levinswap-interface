import { Token } from '@levinswap/uniswap-sdk'

export async function addTokenToMetamask(ethereum: any, token: Token) {
  const IMAGE_URL =
    'https://raw.githubusercontent.com/Levinswap/default-token-list/master/src/assets/xdai/0x71850b7E9Ee3f13Ab46d67167341E4bDc905Eef9/logo.png'
  try {
    await ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: token.address,
          symbol: token.symbol ? token.symbol : '',
          decimals: token.decimals,
          image: IMAGE_URL
        }
      }
    })
  } catch (error) {
    console.log(error)
  }
}
