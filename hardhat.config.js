require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');

module.exports = {
  solidity: '0.8.4',
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        url: process.env.NEXT_PUBLIC_NETWORK_URL || 'https://rpc.gnosischain.com',
        blockNumber: 28445500,
      },
    },
  },
  paths: {
    tests: './tests/web3',
    artifacts: './tests/web3/artifacts',
  },
}; 