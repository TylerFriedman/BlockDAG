// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MinesGame
 * @dev A blockchain-based implementation of the Mines game
 */
contract MinesGame {
    address public owner;
    uint256 public houseBalance;
    uint256 public constant MAX_WITHDRAWAL = 200 ether; // 200 tokens per 24 hours
    uint256 public constant MAX_TRANSFER = 10 ether; // 10 tokens per transfer
    
    mapping(address => uint256) public lastWithdrawalTime;
    mapping(address => uint256) public withdrawalAmount;
    mapping(address => uint256) public playerBalances;
    
    // Game state variables
    struct Game {
        uint256 betAmount;
        uint256 numMines;
        uint256 numTiles;
        bytes32 seed;
        bool active;
        uint256[] revealedIndices;
        bool cashoutExecuted;
        uint256 potentialMultiplier;
    }
    
    mapping(address => Game) public games;
    
    // Events
    event GameStarted(address indexed player, uint256 betAmount, uint256 numMines, uint256 numTiles, bytes32 seed);
    event TileRevealed(address indexed player, uint256 index, bool isMine, uint256 currentMultiplier);
    event GameEnded(address indexed player, bool won, uint256 amountWon);
    event TokensWithdrawn(address indexed player, uint256 amount);
    event TokensDeposited(address indexed player, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
    
    receive() external payable {
        if (msg.sender != owner) {
            playerBalances[msg.sender] += msg.value;
            emit TokensDeposited(msg.sender, msg.value);
        } else {
            houseBalance += msg.value;
        }
    }
    
    function depositToHouse() external payable onlyOwner {
        houseBalance += msg.value;
    }
    
    /**
     * @dev Start a new game of Mines
     * @param _numMines Number of mines on the grid
     * @param _numTiles Total number of tiles on the grid
     * @param _betAmount Amount of tokens to bet
     * @param _clientSeed Client-provided seed for provably fair gameplay
     */
    function startGame(uint256 _numMines, uint256 _numTiles, uint256 _betAmount, bytes32 _clientSeed) external {
        require(!games[msg.sender].active, "You already have an active game");
        require(_numMines < _numTiles, "Invalid number of mines");
        require(_betAmount > 0, "Bet amount must be greater than 0");
        require(playerBalances[msg.sender] >= _betAmount, "Insufficient balance");
        
        // Transfer bet amount from player balance
        playerBalances[msg.sender] -= _betAmount;
        
        // Generate a server seed and combine with client seed
        bytes32 serverSeed = keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1), msg.sender));
        bytes32 combinedSeed = keccak256(abi.encodePacked(_clientSeed, serverSeed));
        
        // Initialize game state
        games[msg.sender] = Game({
            betAmount: _betAmount,
            numMines: _numMines,
            numTiles: _numTiles,
            seed: combinedSeed,
            active: true,
            revealedIndices: new uint256[](0),
            cashoutExecuted: false,
            potentialMultiplier: 100 // Starting at 1.00x (stored as 100 for precision)
        });
        
        emit GameStarted(msg.sender, _betAmount, _numMines, _numTiles, combinedSeed);
    }
    
    /**
     * @dev Reveal a tile on the game grid
     * @param _index Index of the tile to reveal
     */
    function revealTile(uint256 _index) external {
        Game storage game = games[msg.sender];
        require(game.active, "No active game");
        require(_index < game.numTiles, "Invalid tile index");
        require(!tileAlreadyRevealed(game.revealedIndices, _index), "Tile already revealed");
        
        // Check if the selected tile has a mine using the provably fair algorithm
        bool isMine = isTileMine(game.seed, _index, game.numMines, game.numTiles, game.revealedIndices);
        
        if (isMine) {
            // Game over - player hit a mine
            game.active = false;
            emit GameEnded(msg.sender, false, 0);
        } else {
            // Update revealed tiles
            game.revealedIndices.push(_index);
            
            // Update multiplier - This is a simplified calculation
            // In a real game, you would use a more sophisticated formula
            game.potentialMultiplier = calculateMultiplier(
                game.numTiles, 
                game.numMines, 
                game.revealedIndices.length
            );
            
            // Check if all non-mine tiles have been revealed (perfect game)
            if (game.revealedIndices.length == game.numTiles - game.numMines) {
                // Auto cashout on perfect game
                executeCashout(msg.sender);
            }
            
            emit TileRevealed(msg.sender, _index, false, game.potentialMultiplier);
        }
    }
    
    /**
     * @dev Cash out current winnings without revealing more tiles
     */
    function cashout() external {
        require(games[msg.sender].active, "No active game");
        require(!games[msg.sender].cashoutExecuted, "Already cashed out");
        
        executeCashout(msg.sender);
    }
    
    /**
     * @dev Internal function to execute the cashout logic
     * @param _player Address of the player
     */
    function executeCashout(address _player) internal {
        Game storage game = games[_player];
        
        // Calculate winnings
        uint256 winnings = (game.betAmount * game.potentialMultiplier) / 100;
        
        // Check if house has enough balance
        require(houseBalance >= winnings, "Insufficient house balance");
        
        // Update balances
        houseBalance -= winnings;
        playerBalances[_player] += winnings;
        
        // Mark game as completed
        game.active = false;
        game.cashoutExecuted = true;
        
        emit GameEnded(_player, true, winnings);
    }
    
    /**
     * @dev Withdraw tokens from player balance, respecting limits
     * @param _amount Amount to withdraw
     */
    function withdrawTokens(uint256 _amount) external {
        require(playerBalances[msg.sender] >= _amount, "Insufficient balance");
        require(_amount <= MAX_TRANSFER, "Exceeds max transfer limit");
        
        // Check 24-hour withdrawal limit
        uint256 daysPassed = (block.timestamp - lastWithdrawalTime[msg.sender]) / 86400;
        
        if (daysPassed >= 1) {
            // Reset if 24 hours have passed
            withdrawalAmount[msg.sender] = 0;
            lastWithdrawalTime[msg.sender] = block.timestamp;
        }
        
        require(withdrawalAmount[msg.sender] + _amount <= MAX_WITHDRAWAL, "Exceeds daily withdrawal limit");
        
        // Update tracking
        withdrawalAmount[msg.sender] += _amount;
        playerBalances[msg.sender] -= _amount;
        
        // Transfer tokens
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit TokensWithdrawn(msg.sender, _amount);
    }
    
    /**
     * @dev Emergency withdrawal function for the owner
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= houseBalance, "Insufficient house balance");
        
        houseBalance -= _amount;
        
        (bool success, ) = owner.call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Calculate the multiplier based on game progress
     * This is a simplified version - real games would use more complex formulas
     */
    function calculateMultiplier(uint256 _numTiles, uint256 _numMines, uint256 _revealedTiles) internal pure returns (uint256) {
        // If no tiles revealed yet, return 1.00x (100)
        if (_revealedTiles == 0) return 100;
        
        // This is a simplified multiplier calculation
        // The more tiles revealed without hitting a mine, the higher the multiplier
        uint256 baseMultiplier = 100; // 1.00x
        uint256 riskFactor = (_numMines * 100) / _numTiles; // Risk percentage
        
        // Increases exponentially with each revealed tile
        uint256 multiplier = baseMultiplier;
        for (uint256 i = 0; i < _revealedTiles; i++) {
            multiplier = (multiplier * (100 + riskFactor)) / 100;
        }
        
        return multiplier;
    }
    
    /**
     * @dev Check if a tile is already revealed
     */
    function tileAlreadyRevealed(uint256[] memory _revealedIndices, uint256 _index) internal pure returns (bool) {
        for (uint256 i = 0; i < _revealedIndices.length; i++) {
            if (_revealedIndices[i] == _index) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Provably fair algorithm to determine if a tile has a mine
     * This implementation is simplified but demonstrates the concept
     */
    function isTileMine(
        bytes32 _seed, 
        uint256 _index, 
        uint256 _numMines, 
        uint256 _numTiles,
        uint256[] memory _revealedIndices
    ) internal pure returns (bool) {
        // Create a mapping of mine locations based on the seed
        bool[] memory mineLocations = new bool[](_numTiles);
        uint256 minesPlaced = 0;
        
        uint256 nonce = 0;
        while (minesPlaced < _numMines) {
            bytes32 hash = keccak256(abi.encodePacked(_seed, nonce));
            uint256 position = uint256(hash) % _numTiles;
            
            if (!mineLocations[position]) {
                mineLocations[position] = true;
                minesPlaced++;
            }
            
            nonce++;
        }
        
        return mineLocations[_index];
    }
    
    /**
     * @dev Get the current game state for a player
     */
    function getGameState(address _player) external view returns (
        uint256 betAmount,
        uint256 numMines,
        uint256 numTiles,
        bool active,
        uint256[] memory revealedIndices,
        uint256 potentialMultiplier
    ) {
        Game storage game = games[_player];
        return (
            game.betAmount,
            game.numMines,
            game.numTiles,
            game.active,
            game.revealedIndices,
            game.potentialMultiplier
        );
    }
    
    /**
     * @dev Get player balance
     */
    function getPlayerBalance(address _player) external view returns (uint256) {
        return playerBalances[_player];
    }
    
    /**
     * @dev Check if a specific tile has a mine (for client verification after game)
     */
    function verifyTile(
        bytes32 _seed, 
        uint256 _index, 
        uint256 _numMines, 
        uint256 _numTiles
    ) external pure returns (bool) {
        uint256[] memory emptyArray = new uint256[](0);
        return isTileMine(_seed, _index, _numMines, _numTiles, emptyArray);
    }
}