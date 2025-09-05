require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    testnet: {
      url: process.env.TESTNET_RPC_URL || "https://evmrpc-testnet.0g.ai",
      chainId: 16601,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://evmrpc.0g.ai",
      chainId: parseInt(process.env.MAINNET_CHAIN_ID || "20000"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000
    }
  },
  etherscan: {
    apiKey: {
      testnet: process.env.EXPLORER_API_KEY || "placeholder",
      mainnet: process.env.EXPLORER_API_KEY || "placeholder"
    },
    customChains: [
      {
        network: "testnet",
        chainId: 16601,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/api",
          browserURL: "https://chainscan-galileo.0g.ai"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};