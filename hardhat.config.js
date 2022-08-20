require('dotenv').config()

require('@nomiclabs/hardhat-etherscan')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-ethers')
require('hardhat-gas-reporter')
require('hardhat-deploy')
require('solidity-coverage')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  mocha: {
    timeout: 100000000
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.4.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
    ],
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    hardhat: {
      chainId: 1337,
    },
    devnet: {
      url: 'https://d3i5oa30ftn5.cloudfront.net',
      chainid: 1024,
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/ed08a8c8e8cc42ce869a2ca650ddf3f3',
      chainId: 4,
      accounts: ['ecb9e7ccedb0c170aa8067824703b03415be3d22347c9faa9e79ebfdb60ee395'],
    },
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: 'e2d737ae-c334-4a87-9ff4-24eeb1087b76',
  },
}
