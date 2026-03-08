/**
 * web3ContractService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side service for calling SkillPlatform backend Web3 endpoints.
 * All functions call /web3/* routes on the Express server.
 *
 * For user-initiated on-chain transactions (buyCourse, joinChallenge):
 *   1. Call requestApproval() from useMetaMask to approve SKT spending.
 *   2. Then call the relevant function here — the backend forwards the tx.
 *
 * For a fully decentralised alternative, these functions would call the
 * contract directly via ethers.js + MetaMask signer (not yet implemented here).
 */

import api from './api';

// ── Course ────────────────────────────────────────────────────────────────────

/**
 * Buy a course on-chain.
 * Prerequisites: user must call `requestApproval(platformAddress, coursePrice)` first.
 *
 * @param {string} userAddress
 * @param {number} courseId
 * @param {string} courseTitle
 */
export async function buyCourse(userAddress, courseId, courseTitle) {
  try {
    const res = await api.post('/web3/course/buy', { userAddress, courseId, courseTitle });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] buyCourse:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

/**
 * Mint a course certificate NFT for a learner (admin-triggered).
 */
export async function mintCourseCertificate(userAddress, courseTitle, userName) {
  try {
    const res = await api.post('/web3/course/mint-certificate', { userAddress, courseTitle, userName });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] mintCourseCertificate:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

/**
 * Check if a learner has purchased a specific course.
 */
export async function hasPurchasedCourse(courseId, learnerAddress) {
  try {
    const res = await api.get(`/web3/course/${courseId}/purchased`, {
      params: { learnerAddress },
    });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] hasPurchasedCourse:', err.response?.data || err.message);
    return { success: false, purchased: false };
  }
}

// ── Challenge ─────────────────────────────────────────────────────────────────

/**
 * Join a challenge on-chain.
 * Prerequisites: user must call `requestApproval(platformAddress, 10)` for 10 SKT first.
 *
 * @param {string} userAddress
 * @param {number} challengeId
 */
export async function joinChallenge(userAddress, challengeId) {
  try {
    const res = await api.post('/web3/challenge/join', { userAddress, challengeId });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] joinChallenge:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

/**
 * Check if a participant has joined a specific challenge.
 */
export async function hasJoinedChallenge(challengeId, participantAddress) {
  try {
    const res = await api.get(`/web3/challenge/${challengeId}/joined`, {
      params: { participantAddress },
    });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] hasJoinedChallenge:', err.response?.data || err.message);
    return { success: false, joined: false };
  }
}

/**
 * Declare challenge winners (admin only).
 *
 * @param {number} challengeId
 * @param {string} challengeTitle
 * @param {Array}  winners - [{ address, name }, { address, name }, { address, name }]
 */
export async function declareWinners(challengeId, challengeTitle, winners) {
  try {
    const res = await api.post('/web3/challenge/declare-winners', {
      challengeId,
      challengeTitle,
      winners,
    });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] declareWinners:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

// ── Mentor badge ──────────────────────────────────────────────────────────────

/**
 * Mint a mentor badge NFT (admin only).
 *
 * @param {string} mentorAddress
 * @param {string} mentorName
 */
export async function mintMentorBadge(mentorAddress, mentorName) {
  try {
    const res = await api.post('/web3/mentor/mint-badge', { mentorAddress, mentorName });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] mintMentorBadge:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

// ── Admin helpers ─────────────────────────────────────────────────────────────

/**
 * Admin: create a course on-chain.
 */
export async function createCourse(title, mentorAddress, priceInSKT) {
  try {
    const res = await api.post('/web3/course/create', { title, mentorAddress, priceInSKT });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] createCourse:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

/**
 * Admin: create a challenge on-chain.
 */
export async function createChallenge(title) {
  try {
    const res = await api.post('/web3/challenge/create', { title });
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] createChallenge:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

/**
 * Admin: get platform contract SKT balance.
 */
export async function getPlatformBalance() {
  try {
    const res = await api.get('/web3/platform/balance');
    return res.data;
  } catch (err) {
    console.error('[web3ContractService] getPlatformBalance:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || err.message };
  }
}
