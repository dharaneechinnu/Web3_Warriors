// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SkillToken (SKT)
 * @dev ERC-20 utility token for the SkillPlatform ecosystem.
 *      - 10,000,000 SKT minted to deployer on construction.
 *      - Only the owner (SkillPlatform contract or deployer) can mint new tokens.
 *      - registerUser() drips 100 SKT to new users (called by SkillPlatform).
 */
contract SkillToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10 ** 18; // 10M SKT
    uint256 public constant USER_REGISTRATION_DRIP = 100 * 10 ** 18; // 100 SKT per new user

    // Track registered users so we don't drip twice
    mapping(address => bool) public registered;

    event UserRegistered(address indexed user, uint256 dripAmount);
    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("SkillToken", "SKT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint tokens. Only owner (SkillPlatform / deployer) can call.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Register a new user and drip 100 SKT. Callable by owner only.
     *      Idempotent — second call for same user is a no-op.
     */
    function registerUser(address user) external onlyOwner {
        if (registered[user]) return;
        registered[user] = true;
        _mint(user, USER_REGISTRATION_DRIP);
        emit UserRegistered(user, USER_REGISTRATION_DRIP);
    }

    /**
     * @dev Convenience view: return balance in whole SKT (not wei).
     */
    function balanceOfWhole(address account) external view returns (uint256) {
        return balanceOf(account) / 10 ** 18;
    }
}
