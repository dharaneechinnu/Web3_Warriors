// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * SkillExchangeToken (SET) – ERC-20
 * ----------------------------------
 * All state-changing functions are onlyOwner so the backend
 * (the Ganache deployer account) can call them on behalf of users.
 */
contract SkillExchangeToken is ERC20, Ownable {
    mapping(address => bool) public registered;

    uint256 public constant REGISTRATION_REWARD = 10 * 1e18;   // 10 SET
    uint256 public constant COMMISSION_PCT      = 2;            // 2 %

    event UserRegistered(address indexed user, uint256 reward);
    event CourseTransfer(address indexed learner, address indexed mentor, uint256 amount, uint256 commission);
    event MentorshipTransfer(address indexed learner, address indexed mentor, uint256 amount, uint256 commission);
    event UserRewarded(address indexed user, uint256 amount, string reason);

    constructor() ERC20("SkillExchangeToken", "SET") Ownable(msg.sender) {
        // Pre-mint 1 000 000 SET to deployer (platform treasury)
        _mint(msg.sender, 1_000_000 * 1e18);
    }

    // ── Registration ──────────────────────────────────────────────
    function registerUser(address user) external onlyOwner {
        require(!registered[user], "Already registered");
        registered[user] = true;
        _mint(user, REGISTRATION_REWARD);
        emit UserRegistered(user, REGISTRATION_REWARD);
    }

    // ── Course purchase ───────────────────────────────────────────
    function transferForCourse(address learner, address mentor, uint256 amount) external onlyOwner {
        require(balanceOf(learner) >= amount, "Insufficient balance");
        uint256 commission = (amount * COMMISSION_PCT) / 100;
        uint256 net = amount - commission;
        _transfer(learner, mentor, net);
        _transfer(learner, owner(), commission);
        emit CourseTransfer(learner, mentor, amount, commission);
    }

    // ── Mentorship / session booking ──────────────────────────────
    function transferForMentorship(address learner, address mentor, uint256 amount) external onlyOwner {
        require(balanceOf(learner) >= amount, "Insufficient balance");
        uint256 commission = (amount * COMMISSION_PCT) / 100;
        uint256 net = amount - commission;
        _transfer(learner, mentor, net);
        _transfer(learner, owner(), commission);
        emit MentorshipTransfer(learner, mentor, amount, commission);
    }

    // ── Reward (challenge, quiz, etc.) ────────────────────────────
    function rewardUser(address user, uint256 amount, string calldata reason) external onlyOwner {
        _mint(user, amount);
        emit UserRewarded(user, amount, reason);
    }

    // ── Read balance (view) ───────────────────────────────────────
    // balanceOf is inherited from ERC20
}
