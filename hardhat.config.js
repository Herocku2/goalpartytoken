require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const PRIVATE_KEY = "8cd524af2e8cee2b9b9165fe4fb6fd8d2c3c589942d66ae650a472ca9ac1fbaa";
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const BSCSCAN_API_KEY = "76BNAMVSJ6MCX1Q3XI8H1MTP3HNVB8GB21";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bscTestnet: {
      url: BSC_TESTNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 97,
      gasPrice: 10000000000, // 10 gwei
    },
  },
  etherscan: {
    apiKey: BSCSCAN_API_KEY,
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};