// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SkillExchangeToken is ERC20, Ownable {
    // Mapping to store course titles for each user and the number of courses completed.
    mapping(address => mapping(string => bool)) public completedCourses; // Track if a user completed a specific course
    mapping(address => uint256) public totalCompletedCourses; // Track total completed courses for each user
    mapping(address => bool) public hasRegistered; // Ensure a user has registered

    uint256 public constant REWARD_PER_COURSE = 1; // Reward for completing a course
    uint256 public totalCommission;
    uint256 public constant COMMISSION_PERCENT = 2; // Commission for mentorship
    uint256 public constant REGISTRATION_REWARD = 10; // Tokens rewarded for registration

    event CourseCompleted(address indexed user, string courseTitle, uint256 reward);
    event TokenTransferredForMentorship(address indexed from, address indexed mentor, uint256 amount);
    event CommissionWithdrawn(address indexed owner, uint256 amount);
    event UserRegistered(address indexed user, uint256 reward);


    constructor() ERC20("SkillExchangeToken", "SET") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }


     // Function to register a user and reward them with 10 tokens upon successful registration.
    function registerUser() external {
        require(!hasRegistered[msg.sender], "User already registered"); // Check if the user is already registered
        hasRegistered[msg.sender] = true; // Mark the user as registered
        _mint(msg.sender, REGISTRATION_REWARD); // Mint 10 tokens for the user

        emit UserRegistered(msg.sender, REGISTRATION_REWARD);
    }


    // Function to reward a user when they complete a course and store the course title.
    function rewardForCourseCompletion(address user, string memory courseTitle) external {
        require(user != address(0), "Invalid user address");
        require(bytes(courseTitle).length > 0, "Course title cannot be empty");

        // Ensure that the user has not already completed the course.
        if (!completedCourses[user][courseTitle]) {
            completedCourses[user][courseTitle] = true; // Mark course as completed for the user
            totalCompletedCourses[user] += 1; // Increment the total number of completed courses for the user
            _mint(user, REWARD_PER_COURSE); // Mint tokens for completing the course

            emit CourseCompleted(user, courseTitle, REWARD_PER_COURSE);
        }
    }

    // Function to transfer tokens to a mentor for mentorship and deduct commission.
    function transferForMentorship(address mentor, uint256 amount) external {
        require(mentor != address(0), "Invalid mentor address");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 commission = (amount * COMMISSION_PERCENT) / 100;
        uint256 netAmount = amount - commission;
        
        _transfer(msg.sender, mentor, netAmount); // Transfer net amount to mentor
        totalCommission += commission; // Add commission to total commission pool
        _mint(address(this), commission); // Mint commission tokens for the owner

        emit TokenTransferredForMentorship(msg.sender, mentor, netAmount);
    }

    // Function for the owner to withdraw accumulated commission.
    function withdrawCommission() external onlyOwner {
        require(totalCommission > 0, "No commission available");
        uint256 amount = totalCommission;
        totalCommission = 0;
        _transfer(address(this), owner(), amount); // Transfer commission to the owner
        emit CommissionWithdrawn(owner(), amount);
    }

    // Helper function to check if a user has completed a specific course.
    function hasCompletedCourse(address user, string memory courseTitle) public view returns (bool) {
        return completedCourses[user][courseTitle];
    }

    // Helper function to get the total number of courses completed by a user.
    function getTotalCompletedCourses(address user) public view returns (uint256) {
        return totalCompletedCourses[user];
    }
}
