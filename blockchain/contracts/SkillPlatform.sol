// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SkillToken.sol";
import "./SkillCredentialNFT.sol";

/**
 * @title SkillPlatform
 * @dev Central contract for the SkillPlatform ecosystem.
 *
 *  Courses
 *  -------
 *  • Admin creates a course with a SKT price.
 *  • Learner approves SkillPlatform to spend course price, then calls buyCourse().
 *  • 10% commission goes to platform treasury. Mentor receives 90%.
 *  • On purchase, a COURSE_CERTIFICATE NFT is minted for the learner.
 *
 *  Challenges
 *  ----------
 *  • Admin creates a challenge. Entry fee = 10 SKT.
 *  • Participants call joinChallenge() (platform collects entry fee via transferFrom).
 *  • Admin calls declareWinners() with 3 addresses:
 *      1st → 50 SKT + CHALLENGE_GOLD NFT
 *      2nd → 25 SKT + CHALLENGE_SILVER NFT
 *      3rd → 10 SKT + CHALLENGE_BRONZE NFT
 *  • 10% of the reward pool is kept as platform commission before distribution.
 *
 *  Reward Pool
 *  -----------
 *  • fundRewardPool() lets owner top-up the contract's SKT balance.
 *  • Rewards are pulled from the contract's own balance.
 */
contract SkillPlatform is Ownable, ReentrancyGuard {
    // ── Constants ──────────────────────────────────────────────────────────────
    uint256 public constant ENTRY_FEE        = 10  * 10 ** 18; // 10 SKT
    uint256 public constant RANK1_REWARD     = 50  * 10 ** 18; // 50 SKT
    uint256 public constant RANK2_REWARD     = 25  * 10 ** 18; // 25 SKT
    uint256 public constant RANK3_REWARD     = 10  * 10 ** 18; // 10 SKT
    uint256 public constant COMMISSION_BPS   = 1000;           // 10% in basis points
    uint256 public constant BPS_DENOMINATOR  = 10000;

    // ── External contracts ─────────────────────────────────────────────────────
    SkillToken        public immutable skillToken;
    SkillCredentialNFT public immutable skillNFT;

    // ── Courses ────────────────────────────────────────────────────────────────
    struct Course {
        uint256  id;
        string   title;
        address  mentor;
        uint256  price;        // in SKT (wei)
        bool     active;
        uint256  totalSales;
    }

    uint256 public courseCount;
    mapping(uint256 => Course) public courses;
    // courseId => (learner => purchased)
    mapping(uint256 => mapping(address => bool)) public coursePurchased;

    // ── Challenges ─────────────────────────────────────────────────────────────
    enum ChallengeStatus { OPEN, CLOSED, WINNERS_DECLARED }

    struct Challenge {
        uint256         id;
        string          title;
        ChallengeStatus status;
        address[]       participants;
        mapping(address => bool) hasJoined;
        address         winner1;
        address         winner2;
        address         winner3;
        uint256         rewardPool;   // collected entry fees (in SKT wei)
    }

    uint256 public challengeCount;
    mapping(uint256 => Challenge) public challenges;

    // ── Treasury ───────────────────────────────────────────────────────────────
    uint256 public treasuryBalance; // accumulated commission in SKT wei

    // ── Events ─────────────────────────────────────────────────────────────────
    event CourseCreated(uint256 indexed courseId, string title, address indexed mentor, uint256 price);
    event CoursePurchased(uint256 indexed courseId, address indexed learner, uint256 amountPaid, uint256 nftTokenId);
    event ChallengeCreated(uint256 indexed challengeId, string title);
    event ChallengeJoined(uint256 indexed challengeId, address indexed participant);
    event ChallengeClosed(uint256 indexed challengeId);
    event WinnersDeclared(
        uint256 indexed challengeId,
        address winner1,
        address winner2,
        address winner3
    );
    event NFTMinted(uint256 indexed tokenId, address indexed recipient, SkillCredentialNFT.CredentialType credType);
    event RewardPoolFunded(uint256 amount);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

    // ── Constructor ────────────────────────────────────────────────────────────
    constructor(address skillTokenAddress, address skillNFTAddress) Ownable(msg.sender) {
        require(skillTokenAddress != address(0), "SkillPlatform: zero token address");
        require(skillNFTAddress  != address(0), "SkillPlatform: zero NFT address");
        skillToken = SkillToken(skillTokenAddress);
        skillNFT   = SkillCredentialNFT(skillNFTAddress);
    }

    // ── Course functions ───────────────────────────────────────────────────────

    /**
     * @dev Owner creates a new course.
     * @param title   Human-readable course title.
     * @param mentor  Address of the mentor who earns 90% of revenue.
     * @param price   Course price in SKT (in wei, e.g. 10*1e18 for 10 SKT).
     */
    function createCourse(
        string calldata title,
        address mentor,
        uint256 price
    ) external onlyOwner returns (uint256 courseId) {
        require(mentor != address(0), "SkillPlatform: zero mentor address");
        require(price > 0,            "SkillPlatform: price must be > 0");

        courseId = courseCount++;
        courses[courseId] = Course({
            id:         courseId,
            title:      title,
            mentor:     mentor,
            price:      price,
            active:     true,
            totalSales: 0
        });

        emit CourseCreated(courseId, title, mentor, price);
    }

    /**
     * @dev Learner buys a course.
     *      Pre-condition: learner must have called
     *        skillToken.approve(skillPlatformAddress, coursePrice)
     * @param courseId  The course to purchase.
     * @param metadataURI  IPFS URI for the certificate NFT metadata.
     */
    function buyCourse(
        uint256 courseId,
        string calldata metadataURI
    ) external nonReentrant returns (uint256 nftTokenId) {
        Course storage course = courses[courseId];
        require(course.active,                      "SkillPlatform: course not active");
        require(!coursePurchased[courseId][msg.sender], "SkillPlatform: already purchased");

        uint256 price      = course.price;
        uint256 commission = (price * COMMISSION_BPS) / BPS_DENOMINATOR; // 10%
        uint256 mentorShare = price - commission;

        // Pull full price from learner → this contract
        require(
            skillToken.transferFrom(msg.sender, address(this), price),
            "SkillPlatform: token transfer failed"
        );

        // Forward mentor share
        require(
            skillToken.transfer(course.mentor, mentorShare),
            "SkillPlatform: mentor transfer failed"
        );

        treasuryBalance    += commission;
        course.totalSales  += 1;
        coursePurchased[courseId][msg.sender] = true;

        // Mint certificate NFT
        nftTokenId = skillNFT.mintCredential(
            msg.sender,
            metadataURI,
            SkillCredentialNFT.CredentialType.COURSE_CERTIFICATE
        );

        emit CoursePurchased(courseId, msg.sender, price, nftTokenId);
        emit NFTMinted(nftTokenId, msg.sender, SkillCredentialNFT.CredentialType.COURSE_CERTIFICATE);
    }

    // ── Challenge functions ────────────────────────────────────────────────────

    /**
     * @dev Owner creates a new challenge.
     */
    function createChallenge(string calldata title) external onlyOwner returns (uint256 challengeId) {
        challengeId = challengeCount++;
        Challenge storage ch = challenges[challengeId];
        ch.id     = challengeId;
        ch.title  = title;
        ch.status = ChallengeStatus.OPEN;

        emit ChallengeCreated(challengeId, title);
    }

    /**
     * @dev Participant joins a challenge by paying the 10 SKT entry fee.
     *      Pre-condition: participant must have called
     *        skillToken.approve(skillPlatformAddress, 10 * 1e18)
     */
    function joinChallenge(uint256 challengeId) external nonReentrant {
        Challenge storage ch = challenges[challengeId];
        require(ch.status == ChallengeStatus.OPEN, "SkillPlatform: challenge not open");
        require(!ch.hasJoined[msg.sender],          "SkillPlatform: already joined");

        // Collect entry fee
        require(
            skillToken.transferFrom(msg.sender, address(this), ENTRY_FEE),
            "SkillPlatform: entry fee transfer failed"
        );

        ch.participants.push(msg.sender);
        ch.hasJoined[msg.sender] = true;
        ch.rewardPool            += ENTRY_FEE;

        emit ChallengeJoined(challengeId, msg.sender);
    }

    /**
     * @dev Owner closes the challenge (no more entries).
     */
    function closeChallenge(uint256 challengeId) external onlyOwner {
        Challenge storage ch = challenges[challengeId];
        require(ch.status == ChallengeStatus.OPEN, "SkillPlatform: not open");
        ch.status = ChallengeStatus.CLOSED;
        emit ChallengeClosed(challengeId);
    }

    /**
     * @dev Owner declares winners and distributes rewards.
     *      Rewards come from the contract's SKT balance (reward pool fund + collected fees).
     *      10% commission is deducted from reward pool before distribution.
     *
     * @param challengeId   The challenge being settled.
     * @param winner1Addr   1st place → 50 SKT + Gold NFT.
     * @param winner2Addr   2nd place → 25 SKT + Silver NFT.
     * @param winner3Addr   3rd place → 10 SKT + Bronze NFT.
     * @param gold_uri      IPFS URI for Gold NFT metadata.
     * @param silver_uri    IPFS URI for Silver NFT metadata.
     * @param bronze_uri    IPFS URI for Bronze NFT metadata.
     */
    function declareWinners(
        uint256 challengeId,
        address winner1Addr,
        address winner2Addr,
        address winner3Addr,
        string calldata gold_uri,
        string calldata silver_uri,
        string calldata bronze_uri
    ) external onlyOwner nonReentrant {
        Challenge storage ch = challenges[challengeId];
        require(
            ch.status == ChallengeStatus.OPEN || ch.status == ChallengeStatus.CLOSED,
            "SkillPlatform: winners already declared"
        );
        require(winner1Addr != address(0), "SkillPlatform: zero winner1");
        require(winner2Addr != address(0), "SkillPlatform: zero winner2");
        require(winner3Addr != address(0), "SkillPlatform: zero winner3");

        // Deduct 10% platform commission from collected entry fees
        uint256 commission = (ch.rewardPool * COMMISSION_BPS) / BPS_DENOMINATOR;
        treasuryBalance    += commission;

        // Total rewards: 50 + 25 + 10 = 85 SKT — paid from contract balance
        uint256 totalRewards = RANK1_REWARD + RANK2_REWARD + RANK3_REWARD;
        require(
            skillToken.balanceOf(address(this)) >= totalRewards,
            "SkillPlatform: insufficient reward pool"
        );

        ch.status  = ChallengeStatus.WINNERS_DECLARED;
        ch.winner1 = winner1Addr;
        ch.winner2 = winner2Addr;
        ch.winner3 = winner3Addr;

        // ── Transfer SKT rewards ──
        require(skillToken.transfer(winner1Addr, RANK1_REWARD), "SkillPlatform: rank1 transfer failed");
        require(skillToken.transfer(winner2Addr, RANK2_REWARD), "SkillPlatform: rank2 transfer failed");
        require(skillToken.transfer(winner3Addr, RANK3_REWARD), "SkillPlatform: rank3 transfer failed");

        // ── Mint NFTs ──
        uint256 goldId = skillNFT.mintCredential(
            winner1Addr, gold_uri, SkillCredentialNFT.CredentialType.CHALLENGE_GOLD
        );
        uint256 silverId = skillNFT.mintCredential(
            winner2Addr, silver_uri, SkillCredentialNFT.CredentialType.CHALLENGE_SILVER
        );
        uint256 bronzeId = skillNFT.mintCredential(
            winner3Addr, bronze_uri, SkillCredentialNFT.CredentialType.CHALLENGE_BRONZE
        );

        emit WinnersDeclared(challengeId, winner1Addr, winner2Addr, winner3Addr);
        emit NFTMinted(goldId,   winner1Addr, SkillCredentialNFT.CredentialType.CHALLENGE_GOLD);
        emit NFTMinted(silverId, winner2Addr, SkillCredentialNFT.CredentialType.CHALLENGE_SILVER);
        emit NFTMinted(bronzeId, winner3Addr, SkillCredentialNFT.CredentialType.CHALLENGE_BRONZE);
    }

    /**
     * @dev Mint a course certificate NFT directly (backend-triggered after off-chain completion check).
     */
    function mintCourseCertificate(
        address recipient,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        require(recipient != address(0), "SkillPlatform: zero recipient");
        tokenId = skillNFT.mintCredential(
            recipient,
            metadataURI,
            SkillCredentialNFT.CredentialType.COURSE_CERTIFICATE
        );
        emit NFTMinted(tokenId, recipient, SkillCredentialNFT.CredentialType.COURSE_CERTIFICATE);
    }

    /**
     * @dev Mint a mentor badge NFT.
     */
    function mintMentorBadge(
        address mentor,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        require(mentor != address(0), "SkillPlatform: zero mentor");
        tokenId = skillNFT.mintCredential(
            mentor,
            metadataURI,
            SkillCredentialNFT.CredentialType.MENTOR_BADGE
        );
        emit NFTMinted(tokenId, mentor, SkillCredentialNFT.CredentialType.MENTOR_BADGE);
    }

    // ── Reward pool / treasury ─────────────────────────────────────────────────

    /**
     * @dev Owner funds the reward pool by transferring SKT to this contract.
     *      Pre-condition: owner must approve the platform contract first.
     */
    function fundRewardPool(uint256 amount) external onlyOwner {
        require(amount > 0, "SkillPlatform: amount must be > 0");
        require(
            skillToken.transferFrom(msg.sender, address(this), amount),
            "SkillPlatform: funding transfer failed"
        );
        emit RewardPoolFunded(amount);
    }

    /**
     * @dev Owner withdraws treasury commission to a recipient address.
     */
    function withdrawTreasury(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0),          "SkillPlatform: zero address");
        require(amount <= treasuryBalance, "SkillPlatform: insufficient treasury");
        treasuryBalance -= amount;
        require(skillToken.transfer(to, amount), "SkillPlatform: treasury transfer failed");
        emit TreasuryWithdrawn(to, amount);
    }

    // ── View helpers ───────────────────────────────────────────────────────────

    function getChallengeParticipants(uint256 challengeId)
        external
        view
        returns (address[] memory)
    {
        return challenges[challengeId].participants;
    }

    function hasPurchasedCourse(uint256 courseId, address learner) external view returns (bool) {
        return coursePurchased[courseId][learner];
    }

    function hasJoinedChallenge(uint256 challengeId, address participant) external view returns (bool) {
        return challenges[challengeId].hasJoined[participant];
    }

    function contractSKTBalance() external view returns (uint256) {
        return skillToken.balanceOf(address(this));
    }
}
