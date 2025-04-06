import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import WalletConnection from './components/WalletConnection';
import GameBoard from './components/GameBoard';
import GameSettings from './components/GameSettings';
import PlayerStats from './components/PlayerStats';
import { connectWallet, getContractInstances } from './utils/web3Utils';
import './App.css';

// Hardcoded house wallet mnemonic (ONLY FOR DEMO - NEVER DO THIS IN PRODUCTION)
const HOUSE_WALLET_MNEMONIC = "test test test test test test test test test test test junk";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3a5a;
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
`;

const Logo = styled.h1`
  font-size: 28px;
  color: #4361ee;
  margin: 0;
`;

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [playerBalance, setPlayerBalance] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    gridSize: 5, // 5x5 grid = 25 tiles
    numMines: 5,
    betAmount: 1,
  });
  const [gameState, setGameState] = useState({
    tiles: [],
    revealedIndices: [],
    multiplier: 100, // 1.00x
    potentialWinnings: 0,
  });
  const [loading, setLoading] = useState(false);

  // Initialize Web3 and contracts when the component mounts
  useEffect(() => {
    const init = async () => {
      try {
        // Check if MetaMask is installed
        if (window.ethereum) {
          // Request account access if needed
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create a Web3Provider from the Ethereum provider
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          
          setProvider(provider);
          setSigner(signer);
          setAccount(address);
          
          // Initialize contracts
          const contracts = await getContractInstances(provider, signer);
          setContracts(contracts);
          
          // Load player balance
          if (contracts.minesGame) {
            const balance = await contracts.minesGame.getPlayerBalance(address);
            setPlayerBalance(ethers.utils.formatEther(balance));
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
              setAccount(accounts[0]);
            } else {
              setAccount(null);
            }
          });
        }
      } catch (error) {
        console.error("Failed to initialize web3:", error);
      }
    };
    
    init();
    
    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  
  // Update player balance when account changes
  useEffect(() => {
    const updateBalance = async () => {
      if (contracts && contracts.minesGame && account) {
        const balance = await contracts.minesGame.getPlayerBalance(account);
        setPlayerBalance(ethers.utils.formatEther(balance));
      }
    };
    
    updateBalance();
  }, [contracts, account]);
  
  // Initialize game board tiles
  useEffect(() => {
    if (gameSettings.gridSize) {
      const totalTiles = gameSettings.gridSize * gameSettings.gridSize;
      const newTiles = Array(totalTiles).fill().map((_, index) => ({
        index,
        revealed: false,
        isMine: false,
        isGem: false,
      }));
      
      setGameState(prev => ({
        ...prev,
        tiles: newTiles,
        revealedIndices: [],
      }));
    }
  }, [gameSettings.gridSize]);
  
  // Start a new game
  const startGame = async () => {
    try {
      setLoading(true);
      
      const totalTiles = gameSettings.gridSize * gameSettings.gridSize;
      const betAmountWei = ethers.utils.parseEther(gameSettings.betAmount.toString());
      
      // Generate a client seed
      const clientSeed = ethers.utils.randomBytes(32);
      
      // Start the game on the blockchain
      const tx = await contracts.minesGame.startGame(
        gameSettings.numMines,
        totalTiles,
        betAmountWei,
        ethers.utils.hexlify(clientSeed)
      );
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      setGameActive(true);
      setGameState(prev => ({
        ...prev,
        revealedIndices: [],
        multiplier: 100,
        potentialWinnings: gameSettings.betAmount,
      }));
      
      // Update player balance
      const balance = await contracts.minesGame.getPlayerBalance(account);
      setPlayerBalance(ethers.utils.formatEther(balance));
      
    } catch (error) {
      console.error("Failed to start game:", error);
      alert("Failed to start game. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Reveal a tile
  const revealTile = async (index) => {
    try {
      if (!gameActive) return;
      
      setLoading(true);
      
      // Check if the tile is already revealed
      if (gameState.revealedIndices.includes(index)) {
        setLoading(false);
        return;
      }
      
      // Reveal the tile on the blockchain
      const tx = await contracts.minesGame.revealTile(index);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      // Parse events to determine if the player hit a mine
      const tileRevealedEvent = receipt.events.find(e => e.event === 'TileRevealed');
      const gameEndedEvent = receipt.events.find(e => e.event === 'GameEnded');
      
      if (tileRevealedEvent) {
        // Player revealed a tile successfully
        const isMine = tileRevealedEvent.args.isMine;
        const currentMultiplier = tileRevealedEvent.args.currentMultiplier;
        
        if (!isMine) {
          // Update game state with the revealed tile
          setGameState(prev => {
            const newTiles = [...prev.tiles];
            newTiles[index] = {
              ...newTiles[index],
              revealed: true,
              isGem: true,
            };
            
            return {
              ...prev,
              tiles: newTiles,
              revealedIndices: [...prev.revealedIndices, index],
              multiplier: currentMultiplier,
              potentialWinnings: (gameSettings.betAmount * currentMultiplier) / 100,
            };
          });
        }
      }
      
      if (gameEndedEvent) {
        // Game has ended (either player hit a mine or achieved a perfect game)
        const won = gameEndedEvent.args.won;
        const amountWon = ethers.utils.formatEther(gameEndedEvent.args.amountWon);
        
        if (!won) {
          // Player hit a mine
          setGameState(prev => {
            const newTiles = [...prev.tiles];
            newTiles[index] = {
              ...newTiles[index],
              revealed: true,
              isMine: true,
            };
            
            return {
              ...prev,
              tiles: newTiles,
            };
          });
          
          alert(`Game Over! You hit a mine.`);
        } else {
          // Player won (perfect game or cashout)
          alert(`Congratulations! You won ${amountWon} BDAG tokens!`);
        }
        
        // Update player balance
        const balance = await contracts.minesGame.getPlayerBalance(account);
        setPlayerBalance(ethers.utils.formatEther(balance));
        
        // Reset game state
        setGameActive(false);
      }
      
    } catch (error) {
      console.error("Failed to reveal tile:", error);
      alert("Failed to reveal tile. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Cash out current winnings
  const cashout = async () => {
    try {
      if (!gameActive) return;
      
      setLoading(true);
      
      // Cash out on the blockchain
      const tx = await contracts.minesGame.cashout();
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      // Parse events to get the amount won
      const gameEndedEvent = receipt.events.find(e => e.event === 'GameEnded');
      
      if (gameEndedEvent) {
        const amountWon = ethers.utils.formatEther(gameEndedEvent.args.amountWon);
        alert(`Congratulations! You won ${amountWon} BDAG tokens!`);
        
        // Update player balance
        const balance = await contracts.minesGame.getPlayerBalance(account);
        setPlayerBalance(ethers.utils.formatEther(balance));
        
        // Reset game state
        setGameActive(false);
      }
      
    } catch (error) {
      console.error("Failed to cash out:", error);
      alert("Failed to cash out. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Deposit tokens to the player's account
  const depositTokens = async (amount) => {
    try {
      setLoading(true);
      
      // Convert amount to wei
      const amountWei = ethers.utils.parseEther(amount.toString());
      
      // Send transaction to deposit tokens
      const tx = await signer.sendTransaction({
        to: contracts.minesGame.address,
        value: amountWei,
      });
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      // Update player balance
      const balance = await contracts.minesGame.getPlayerBalance(account);
      setPlayerBalance(ethers.utils.formatEther(balance));
      
      alert(`Successfully deposited ${amount} tokens!`);
      
    } catch (error) {
      console.error("Failed to deposit tokens:", error);
      alert("Failed to deposit tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Withdraw tokens from the player's account
  const withdrawTokens = async (amount) => {
    try {
      setLoading(true);
      
      // Convert amount to wei
      const amountWei = ethers.utils.parseEther(amount.toString());
      
      // Send transaction to withdraw tokens
      const tx = await contracts.minesGame.withdrawTokens(amountWei);
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      // Update player balance
      const balance = await contracts.minesGame.getPlayerBalance(account);
      setPlayerBalance(ethers.utils.formatEther(balance));
      
      alert(`Successfully withdrew ${amount} tokens!`);
      
    } catch (error) {
      console.error("Failed to withdraw tokens:", error);
      alert("Failed to withdraw tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Update game settings
  const updateGameSettings = (newSettings) => {
    setGameSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };
  
  return (
    <AppContainer>
      <Header>
        <Logo>BlockDAG Mines Game</Logo>
        <WalletConnection 
          account={account}
          playerBalance={playerBalance}
          onConnect={connectWallet}
        />
      </Header>
      
      <div className="container">
        <div className="card">
          <PlayerStats 
            playerBalance={playerBalance}
            onDeposit={depositTokens}
            onWithdraw={withdrawTokens}
          />
        </div>
        
        {account && (
          <GameContainer>
            <div className="card">
              <GameSettings 
                settings={gameSettings}
                onUpdateSettings={updateGameSettings}
                onStartGame={startGame}
                disabled={gameActive || loading}
              />
            </div>
            
            <div className="card">
              <GameBoard 
                tiles={gameState.tiles}
                onRevealTile={revealTile}
                onCashout={cashout}
                gameActive={gameActive}
                loading={loading}
                multiplier={gameState.multiplier / 100}
                potentialWinnings={gameState.potentialWinnings}
                disabled={loading}
              />
            </div>
          </GameContainer>
        )}
      </div>
    </AppContainer>
  );
}

export default App;