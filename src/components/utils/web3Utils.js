import { ethers } from 'ethers';
import MinesGameABI from '../artifacts/contracts/MinesGame.sol/MinesGame.json';
import BlockDAGTokenABI from '../artifacts/contracts/BlockDAGToken.sol/BlockDAGToken.json';

// Contract addresses (these will be set after deployment)
const MINES_GAME_ADDRESS = process.env.REACT_APP_MINES_GAME_ADDRESS || '0x0000000000000000000000000000000000000000';
const BLOCKDAG_TOKEN_ADDRESS = process.env.REACT_APP_BLOCKDAG_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';

/**
 * Connect to Metamask wallet
 */
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install it to use this app.");
    }
    
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    throw error;
  }
};

/**
 * Get contract instances for the game
 */
export const getContractInstances = async (provider, signer) => {
  try {
    // Create contract instances
    const minesGame = new ethers.Contract(
      MINES_GAME_ADDRESS,
      MinesGameABI.abi,
      signer
    );
    
    const blockDAGToken = new ethers.Contract(
      BLOCKDAG_TOKEN_ADDRESS,
      BlockDAGTokenABI.abi,
      signer
    );
    
    return {
      minesGame,
      blockDAGToken
    };
  } catch (error) {
    console.error("Error initializing contracts:", error);
    throw error;
  }
};

/**
 * Generate a random seed for provably fair gameplay
 */
export const generateClientSeed = () => {
  return ethers.utils.hexlify(ethers.utils.randomBytes(32));
};

/**
 * Format a number to display as currency
 */
export const formatCurrency = (value) => {
  return parseFloat(value).toFixed(2);
};