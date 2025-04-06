// This script deploys the MinesGame and BlockDAGToken contracts

const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy BlockDAGToken first
  const BlockDAGToken = await ethers.getContractFactory("BlockDAGToken");
  const blockDAGToken = await BlockDAGToken.deploy();
  await blockDAGToken.deployed();
  
  console.log(`BlockDAGToken deployed to: ${blockDAGToken.address}`);

  // Deploy MinesGame
  const MinesGame = await ethers.getContractFactory("MinesGame");
  const minesGame = await MinesGame.deploy();
  await minesGame.deployed();
  
  console.log(`MinesGame deployed to: ${minesGame.address}`);

  // Fund the house wallet with initial balance (optional)
  // This sends 1000 ETH (or native currency of the chain) to the game contract
  const [deployer] = await ethers.getSigners();
  const initialHouseFunding = ethers.utils.parseEther("1000");
  
  console.log(`Funding house wallet with ${ethers.utils.formatEther(initialHouseFunding)} tokens...`);
  
  const fundTx = await deployer.sendTransaction({
    to: minesGame.address,
    value: initialHouseFunding
  });
  
  await fundTx.wait();
  console.log("House wallet funded successfully!");

  console.log("Deployment completed!");
  
  // Export the addresses for use in the frontend
  console.log("\nContract addresses to use in your frontend:");
  console.log(`REACT_APP_MINES_GAME_ADDRESS=${minesGame.address}`);
  console.log(`REACT_APP_BLOCKDAG_TOKEN_ADDRESS=${blockDAGToken.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });