require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    // Add your BlockDAG testnet or mainnet configuration here
    blockdag: {
      url: "BLOCKDAG_RPC_URL", // Replace with actual BlockDAG RPC URL
      accounts: ["HOUSE_WALLET_PRIVATE_KEY"] // Replace with actual private key
    }
  },
  paths: {
    artifacts: "./src/artifacts",
  },
};