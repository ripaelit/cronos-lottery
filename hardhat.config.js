require('dotenv').config()
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan');
require('@cronos-labs/hardhat-cronoscan');

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const mnemonic = "manual miracle sword lizard spider catalog interest foam throw lion fog clock";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'cronosTest',
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    rinkeby: {
      url: `${process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL}`,
      accounts: [`0x${process.env.METAMASK_PRIVATE_KEY}`]
    },
    goerli: {
      url: "https://goerli.infura.io/v3/f629b791925b4e98a8048281f9c03e44",
      accounts: [process.env.METAMASK_PRIVATE_KEY || ""],
    },
    cronosTest: {
      url: "https://evm-t3.cronos.org",
      accounts: {mnemonic: mnemonic},
      chainId: 338
    }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  mocha: {
    timeout: 40000000000000
  },
  etherscan: {
    apiKey: `${process.env.ETHERSCAN_API_KEY}`,
    customChains: [
      {
        network: "cronosTest",
        chainId: 338,
        urls: {
          apiURL: "https://api-goerli.etherscan.io/api",
          browserURL: "https://cronos.crypto.org/explorer/testnet3/"
        }
      }
    ]
  }
}
