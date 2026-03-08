/**
 * web3Controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Express controllers for Web3 on-chain operations.
 * All write operations are admin-only (enforced in router via adminAuth middleware).
 * Read / user-specific operations use authMiddleware.
 *
 * Routes:
 *   POST  /web3/course/create               (admin)
 *   POST  /web3/course/buy                  (user)
 *   POST  /web3/course/mint-certificate     (admin)
 *   POST  /web3/challenge/create            (admin)
 *   POST  /web3/challenge/join              (user)
 *   POST  /web3/challenge/declare-winners   (admin)
 *   POST  /web3/mentor/mint-badge           (admin)
 *   GET   /web3/platform/balance            (admin)
 *   GET   /web3/course/:courseId/purchased  (user)
 *   GET   /web3/challenge/:challengeId/joined (user)
 */

const web3Service = require('../services/web3Service');

// ── Helpers ───────────────────────────────────────────────────────────────────
function validateAddress(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

// ── Course controllers ────────────────────────────────────────────────────────

const createCourse = async (req, res) => {
  try {
    const { title, mentorAddress, priceInSKT } = req.body;

    if (!title || !mentorAddress || !priceInSKT) {
      return res.status(400).json({ success: false, message: 'title, mentorAddress, priceInSKT are required.' });
    }
    if (!validateAddress(mentorAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid mentorAddress.' });
    }
    if (isNaN(Number(priceInSKT)) || Number(priceInSKT) <= 0) {
      return res.status(400).json({ success: false, message: 'priceInSKT must be a positive number.' });
    }

    const result = await web3Service.createCourse(title, mentorAddress, Number(priceInSKT));

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, message: 'Course created on-chain.', data: result });
  } catch (err) {
    console.error('[web3Controller] createCourse:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const buyCourse = async (req, res) => {
  try {
    const { userAddress, courseId, courseTitle } = req.body;

    if (!userAddress || courseId === undefined || !courseTitle) {
      return res.status(400).json({ success: false, message: 'userAddress, courseId, courseTitle are required.' });
    }
    if (!validateAddress(userAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid userAddress.' });
    }

    const result = await web3Service.buyCourse(userAddress, Number(courseId), courseTitle);

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    return res.json({ success: true, message: 'Course purchased. NFT certificate minted.', data: result });
  } catch (err) {
    console.error('[web3Controller] buyCourse:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const mintCourseCertificate = async (req, res) => {
  try {
    const { userAddress, courseTitle, userName } = req.body;

    if (!userAddress || !courseTitle) {
      return res.status(400).json({ success: false, message: 'userAddress, courseTitle are required.' });
    }
    if (!validateAddress(userAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid userAddress.' });
    }

    const result = await web3Service.mintCourseCertificate(userAddress, courseTitle, userName || '');

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, message: 'Course certificate NFT minted.', data: result });
  } catch (err) {
    console.error('[web3Controller] mintCourseCertificate:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const checkCoursePurchased = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { learnerAddress } = req.query;

    if (!learnerAddress || !validateAddress(learnerAddress)) {
      return res.status(400).json({ success: false, message: 'Valid learnerAddress query param required.' });
    }

    const purchased = await web3Service.hasPurchasedCourse(Number(courseId), learnerAddress);
    return res.json({ success: true, courseId: Number(courseId), learnerAddress, purchased });
  } catch (err) {
    console.error('[web3Controller] checkCoursePurchased:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── Challenge controllers ─────────────────────────────────────────────────────

const createChallenge = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }

    const result = await web3Service.createChallenge(title);

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, message: 'Challenge created on-chain.', data: result });
  } catch (err) {
    console.error('[web3Controller] createChallenge:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const joinChallenge = async (req, res) => {
  try {
    const { userAddress, challengeId } = req.body;

    if (!userAddress || challengeId === undefined) {
      return res.status(400).json({ success: false, message: 'userAddress, challengeId are required.' });
    }
    if (!validateAddress(userAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid userAddress.' });
    }

    const result = await web3Service.joinChallenge(userAddress, Number(challengeId));

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    return res.json({ success: true, message: 'Successfully joined challenge.', data: result });
  } catch (err) {
    console.error('[web3Controller] joinChallenge:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /web3/challenge/declare-winners
 * Body: { challengeId, challengeTitle, winners: [{ address, name }, x3] }
 */
const declareWinners = async (req, res) => {
  try {
    const { challengeId, challengeTitle, winners } = req.body;

    if (challengeId === undefined || !challengeTitle) {
      return res.status(400).json({ success: false, message: 'challengeId, challengeTitle are required.' });
    }
    if (!Array.isArray(winners) || winners.length !== 3) {
      return res.status(400).json({ success: false, message: 'winners must be an array of exactly 3 objects.' });
    }
    for (let i = 0; i < 3; i++) {
      if (!winners[i].address || !validateAddress(winners[i].address)) {
        return res.status(400).json({ success: false, message: `winners[${i}].address is invalid.` });
      }
    }

    const result = await web3Service.declareWinners(
      Number(challengeId),
      challengeTitle,
      winners
    );

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    return res.json({ success: true, message: 'Winners declared. NFTs minted. SKT distributed.', data: result });
  } catch (err) {
    console.error('[web3Controller] declareWinners:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const checkChallengeJoined = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { participantAddress } = req.query;

    if (!participantAddress || !validateAddress(participantAddress)) {
      return res.status(400).json({ success: false, message: 'Valid participantAddress query param required.' });
    }

    const joined = await web3Service.hasJoinedChallenge(Number(challengeId), participantAddress);
    return res.json({ success: true, challengeId: Number(challengeId), participantAddress, joined });
  } catch (err) {
    console.error('[web3Controller] checkChallengeJoined:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── Mentor badge ──────────────────────────────────────────────────────────────

const mintMentorBadge = async (req, res) => {
  try {
    const { mentorAddress, mentorName } = req.body;

    if (!mentorAddress) {
      return res.status(400).json({ success: false, message: 'mentorAddress is required.' });
    }
    if (!validateAddress(mentorAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid mentorAddress.' });
    }

    const result = await web3Service.mintMentorBadge(mentorAddress, mentorName || '');

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, message: 'Mentor badge NFT minted.', data: result });
  } catch (err) {
    console.error('[web3Controller] mintMentorBadge:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── Platform info ─────────────────────────────────────────────────────────────

const getPlatformBalance = async (req, res) => {
  try {
    const result = await web3Service.getContractSKTBalance();
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[web3Controller] getPlatformBalance:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  createCourse,
  buyCourse,
  mintCourseCertificate,
  checkCoursePurchased,
  createChallenge,
  joinChallenge,
  declareWinners,
  checkChallengeJoined,
  mintMentorBadge,
  getPlatformBalance,
};
