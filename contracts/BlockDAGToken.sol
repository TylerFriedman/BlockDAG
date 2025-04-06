// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockDAGToken
 * @dev ERC20 token for the BlockDAG Mines game
 */
contract BlockDAGToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1 million tokens
    
    constructor() ERC20("BlockDAGToken", "BDAG") Ownable(msg.sender) {
        // Mint initial supply to the contract creator
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    /**
     * @dev Allows the owner to mint additional tokens if needed
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}