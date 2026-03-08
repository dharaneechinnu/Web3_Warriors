/**
 * web3Service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * High-level service combining IPFS metadata upload + on-chain contract calls.
 * Controllers call this service; it orchestrates ipfsService + platformContract.
 *
 * Exported functions:
 *   buyCourse(userAddress, courseId, courseTitle)
 *   joinChallenge(userAddress, challengeId)
 *   declareWinners(challengeId, winners)         winners = [{ address, name }] x3
 *   mintCourseCertificate(userAddress, courseTitle, userName)
 *   mintMentorBadge(mentorAddress, mentorName)
 *   createCourse(title, mentorAddress, priceInSKT)
 *   createChallenge(title)
 *   getContractSKTBalance()
 *   hasPurchasedCourse(courseId, learnerAddress)
 *   hasJoinedChallenge(challengeId, participantAddress)
 */

const { buildNFTMetadata, uploadMetadata } = require('./ipfsService');
const platform = require('../web3/platformContract');

// ── Course ────────────────────────────────────────────────────────────────────

/**
 * Buy a course: upload certificate metadata to IPFS, then call buyCourse on-chain.
 */
async function buyCourse(userAddress, courseId, courseTitle) {
  try {
    const metadata = buildNFTMetadata(
      'COURSE_CERTIFICATE',
      `${courseTitle} — Certificate`,
      `This certificate confirms that ${userAddress} has purchased and enrolled in the course: ${courseTitle}.`,
      [
        { trait_type: 'Course ID', value: courseId.toString() },
        { trait_type: 'Buyer',     value: userAddress },
      ]
    );

    const metadataURI = await uploadMetadata(metadata);
    const result      = await platform.buyCourse(userAddress, courseId, metadataURI);

    return {
      success    : result.success,
      txHash     : result.txHash,
      nftTokenId : result.nftTokenId,
      metadataURI,
      error      : result.error,
    };
  } catch (err) {
    console.error('[web3Service] buyCourse error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Join a challenge. Entry fee (10 SKT) must be pre-approved by the user.
 */
async function joinChallenge(userAddress, challengeId) {
  try {
    const result = await platform.joinChallenge(userAddress, challengeId);
    return result;
  } catch (err) {
    console.error('[web3Service] joinChallenge error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Declare challenge winners — upload 3 NFT metadata files, then call on-chain.
 *
 * @param {number} challengeId
 * @param {string} challengeTitle
 * @param {Array}  winners  Array of 3: [{ address, name }, ...]  (1st, 2nd, 3rd)
 */
async function declareWinners(challengeId, challengeTitle, winners) {
  try {
    if (!winners || winners.length < 3) {
      return { success: false, error: 'Exactly 3 winners required.' };
    }

    const tiers = [
      { type: 'CHALLENGE_GOLD',   rank: '1st', skt: 50 },
      { type: 'CHALLENGE_SILVER', rank: '2nd', skt: 25 },
      { type: 'CHALLENGE_BRONZE', rank: '3rd', skt: 10 },
    ];

    const uris = await Promise.all(
      tiers.map((tier, i) => {
        const winner   = winners[i];
        const metadata = buildNFTMetadata(
          tier.type,
          `${challengeTitle} — ${tier.rank} Place`,
          `${winner.name || winner.address} finished ${tier.rank} in ${challengeTitle} and earned ${tier.skt} SKT.`,
          [
            { trait_type: 'Challenge ID', value: challengeId.toString() },
            { trait_type: 'Rank',         value: tier.rank },
            { trait_type: 'SKT Reward',   value: tier.skt.toString() },
          ]
        );
        return uploadMetadata(metadata);
      })
    );

    const result = await platform.declareWinners(
      challengeId,
      winners[0].address,
      winners[1].address,
      winners[2].address,
      uris[0],
      uris[1],
      uris[2]
    );

    return {
      success    : result.success,
      txHash     : result.txHash,
      goldURI    : uris[0],
      silverURI  : uris[1],
      bronzeURI  : uris[2],
      error      : result.error,
    };
  } catch (err) {
    console.error('[web3Service] declareWinners error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Mint a course certificate NFT directly (admin-triggered after off-chain verification).
 */
async function mintCourseCertificate(userAddress, courseTitle, userName) {
  try {
    const metadata = buildNFTMetadata(
      'COURSE_CERTIFICATE',
      `${courseTitle} — Certificate`,
      `Awarded to ${userName || userAddress} for completing the course: ${courseTitle}.`,
      [
        { trait_type: 'Recipient', value: userAddress },
        { trait_type: 'Course',   value: courseTitle },
      ]
    );

    const metadataURI = await uploadMetadata(metadata);
    const result      = await platform.mintCourseCertificate(userAddress, metadataURI);

    return {
      success     : result.success,
      txHash      : result.txHash,
      tokenId     : result.tokenId,
      metadataURI,
      error       : result.error,
    };
  } catch (err) {
    console.error('[web3Service] mintCourseCertificate error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Mint a mentor badge NFT when a mentor is approved.
 */
async function mintMentorBadge(mentorAddress, mentorName) {
  try {
    const metadata = buildNFTMetadata(
      'MENTOR_BADGE',
      `SkillPlatform Mentor Badge — ${mentorName || mentorAddress}`,
      `${mentorName || mentorAddress} is a verified mentor on SkillPlatform.`,
      [
        { trait_type: 'Mentor',   value: mentorAddress },
        { trait_type: 'Verified', value: 'Yes' },
      ]
    );

    const metadataURI = await uploadMetadata(metadata);
    const result      = await platform.mintMentorBadge(mentorAddress, metadataURI);

    return {
      success     : result.success,
      txHash      : result.txHash,
      tokenId     : result.tokenId,
      metadataURI,
      error       : result.error,
    };
  } catch (err) {
    console.error('[web3Service] mintMentorBadge error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Admin helpers ─────────────────────────────────────────────────────────────

async function createCourse(title, mentorAddress, priceInSKT) {
  return platform.createCourse(title, mentorAddress, priceInSKT);
}

async function createChallenge(title) {
  return platform.createChallenge(title);
}

async function getContractSKTBalance() {
  return platform.getContractSKTBalance();
}

async function hasPurchasedCourse(courseId, learnerAddress) {
  return platform.hasPurchasedCourse(courseId, learnerAddress);
}

async function hasJoinedChallenge(challengeId, participantAddress) {
  return platform.hasJoinedChallenge(challengeId, participantAddress);
}

module.exports = {
  buyCourse,
  joinChallenge,
  declareWinners,
  mintCourseCertificate,
  mintMentorBadge,
  createCourse,
  createChallenge,
  getContractSKTBalance,
  hasPurchasedCourse,
  hasJoinedChallenge,
};
