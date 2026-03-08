/**
 * platformContract.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SkillPlatform contract wrapper (mirrors the tokenContract.js / nftContract.js pattern).
 * Loads ABI + address from the shared blockchain/contractsABI directory.
 *
 * Exports:
 *   getPlatformContract()                    → web3 Contract instance
 *   buyCourse(userAddress, courseId, metadataURI)
 *   joinChallenge(userAddress, challengeId)
 *   declareWinners(challengeId, w1, w2, w3, goldURI, silverURI, bronzeURI)
 *   mintCourseCertificate(recipientAddress, metadataURI)
 *   mintMentorBadge(mentorAddress, metadataURI)
 *   createCourse(title, mentorAddress, priceInSKT)
 *   createChallenge(title)
 *   fundRewardPool(amountInSKT)
 *   getContractSKTBalance()
 *   hasPurchasedCourse(courseId, learnerAddress)
 *   hasJoinedChallenge(challengeId, participantAddress)
 */

const path = require('path');
const fs   = require('fs');
const { web3, adminAccount } = require('./web3Provider');

// ── Load ABI & address ────────────────────────────────────────────────────────
const ABI_PATH  = path.join(__dirname, '../../blockchain/contractsABI/platformABI.json');
const ADDR_PATH = path.join(__dirname, '../../blockchain/contractsABI/addresses.json');

let platformABI     = null;
let platformAddress = null;

function loadContractConfig() {
  try {
    if (!fs.existsSync(ABI_PATH)) {
      console.warn('[platformContract] platformABI.json not found — run deployAll.js first');
      return false;
    }
    if (!fs.existsSync(ADDR_PATH)) {
      console.warn('[platformContract] addresses.json not found — run deployAll.js first');
      return false;
    }
    platformABI     = JSON.parse(fs.readFileSync(ABI_PATH,  'utf8'));
    const addresses = JSON.parse(fs.readFileSync(ADDR_PATH, 'utf8'));
    platformAddress = addresses.SkillPlatform;

    if (!platformAddress) {
      console.warn('[platformContract] SkillPlatform address missing in addresses.json');
      return false;
    }
    console.log(`[platformContract] ✓  SkillPlatform at ${platformAddress}`);
    return true;
  } catch (err) {
    console.error('[platformContract] loadContractConfig error:', err.message);
    return false;
  }
}

loadContractConfig();

function getPlatformContract() {
  if (!platformABI || !platformAddress) {
    if (!loadContractConfig()) {
      throw new Error('[platformContract] Contract not configured. Deploy contracts first.');
    }
  }
  return new web3.eth.Contract(platformABI, platformAddress);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const toWei = (skt) => web3.utils.toWei(skt.toString(), 'ether');

async function estimateAndSend(method, from, extraGas = 0) {
  const gas = await method.estimateGas({ from });
  return method.send({ from, gas: BigInt(gas) + BigInt(extraGas) });
}

// ── Course functions ──────────────────────────────────────────────────────────

/**
 * Admin creates a course on-chain.
 * @param {string} title
 * @param {string} mentorAddress  - Ethereum address of the mentor
 * @param {number} priceInSKT     - Price in whole SKT (will be converted to wei)
 */
async function createCourse(title, mentorAddress, priceInSKT) {
  try {
    const contract = getPlatformContract();
    const priceWei = toWei(priceInSKT);
    const method   = contract.methods.createCourse(title, mentorAddress, priceWei);
    const receipt  = await estimateAndSend(method, adminAccount, 50000);
    console.log(`[platformContract] createCourse tx: ${receipt.transactionHash}`);
    return { success: true, txHash: receipt.transactionHash, courseId: Number(receipt.events?.CourseCreated?.returnValues?.courseId ?? -1) };
  } catch (err) {
    console.error('[platformContract] createCourse error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Learner buys a course.
 * NOTE: The learner must first approve the platform to spend SKT (done on the frontend).
 * The backend triggers this call on behalf of the admin (for server-side flows only).
 * In a fully decentralised flow the user sends this tx directly from MetaMask.
 *
 * @param {string} userAddress
 * @param {number} courseId
 * @param {string} metadataURI  - IPFS URI for the certificate NFT
 */
async function buyCourse(userAddress, courseId, metadataURI) {
  try {
    const contract = getPlatformContract();
    const method   = contract.methods.buyCourse(courseId, metadataURI);
    const receipt  = await estimateAndSend(method, userAddress, 100000);
    const nftId    = receipt.events?.CoursePurchased?.returnValues?.nftTokenId;
    console.log(`[platformContract] buyCourse tx: ${receipt.transactionHash}`);
    return { success: true, txHash: receipt.transactionHash, nftTokenId: nftId ? Number(nftId) : null };
  } catch (err) {
    console.error('[platformContract] buyCourse error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Challenge functions ───────────────────────────────────────────────────────

async function createChallenge(title) {
  try {
    const contract = getPlatformContract();
    const method   = contract.methods.createChallenge(title);
    const receipt  = await estimateAndSend(method, adminAccount, 50000);
    const challengeId = receipt.events?.ChallengeCreated?.returnValues?.challengeId;
    console.log(`[platformContract] createChallenge tx: ${receipt.transactionHash}`);
    return { success: true, txHash: receipt.transactionHash, challengeId: challengeId ? Number(challengeId) : null };
  } catch (err) {
    console.error('[platformContract] createChallenge error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Participant joins a challenge (must have approved 10 SKT spend first).
 */
async function joinChallenge(userAddress, challengeId) {
  try {
    const contract = getPlatformContract();
    const method   = contract.methods.joinChallenge(challengeId);
    const receipt  = await estimateAndSend(method, userAddress, 80000);
    console.log(`[platformContract] joinChallenge tx: ${receipt.transactionHash}`);
    return { success: true, txHash: receipt.transactionHash };
  } catch (err) {
    console.error('[platformContract] joinChallenge error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Admin declares winners and distributes rewards + NFTs.
 */
async function declareWinners(challengeId, winner1, winner2, winner3, goldURI, silverURI, bronzeURI) {
  try {
    const contract = getPlatformContract();
    const method   = contract.methods.declareWinners(
      challengeId, winner1, winner2, winner3, goldURI, silverURI, bronzeURI
    );
    const receipt = await estimateAndSend(method, adminAccount, 200000);
    console.log(`[platformContract] declareWinners tx: ${receipt.transactionHash}`);
    return { success: true, txHash: receipt.transactionHash };
  } catch (err) {
    console.error('[platformContract] declareWinners error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── NFT minting ───────────────────────────────────────────────────────────────

async function mintCourseCertificate(recipientAddress, metadataURI) {
  try {
    const contract = getPlatformContract();
    const method   = contract.methods.mintCourseCertificate(recipientAddress, metadataURI);
    const receipt  = await estimateAndSend(method, adminAccount, 100000);
    const tokenId  = receipt.events?.NFTMinted?.returnValues?.tokenId;
    console.log(`[platformContract] mintCourseCertificate tx: ${receipt.transactionHash}`);
    return { success: true, txHash: receipt.transactionHash, tokenId: tokenId ? Number(tokenId) : null };
  } catch (err) {
    console.error('[platformContract] mintCourseCertificate error:', err.message);
    return { success: false, error: err.message };
  }
}

async function mintMentorBadge(mentorAddress, metadataURI) {
  try {
    const contract = getPlatformContract();
    const method   = contract.methods.mintMentorBadge(mentorAddress, metadataURI);
    const receipt  = await estimateAndSend(method, adminAccount, 100000);
    const tokenId  = receipt.events?.NFTMinted?.returnValues?.tokenId;
    console.log(`[platformContract] mintMentorBadge tx: ${receipt.transactionHash}`);
    return { success: true, txHash: receipt.transactionHash, tokenId: tokenId ? Number(tokenId) : null };
  } catch (err) {
    console.error('[platformContract] mintMentorBadge error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Reward pool ───────────────────────────────────────────────────────────────

async function fundRewardPool(amountInSKT) {
  try {
    const contract = getPlatformContract();
    const amountWei = toWei(amountInSKT);
    const method    = contract.methods.fundRewardPool(amountWei);
    const receipt   = await estimateAndSend(method, adminAccount, 60000);
    console.log(`[platformContract] fundRewardPool tx: ${receipt.transactionHash}`);
    return { success: true, txHash: receipt.transactionHash };
  } catch (err) {
    console.error('[platformContract] fundRewardPool error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── View helpers ──────────────────────────────────────────────────────────────

async function getContractSKTBalance() {
  try {
    const contract = getPlatformContract();
    const wei      = await contract.methods.contractSKTBalance().call();
    return { success: true, balanceWei: wei.toString(), balanceSKT: Number(web3.utils.fromWei(wei, 'ether')) };
  } catch (err) {
    console.error('[platformContract] getContractSKTBalance error:', err.message);
    return { success: false, error: err.message };
  }
}

async function hasPurchasedCourse(courseId, learnerAddress) {
  try {
    const contract = getPlatformContract();
    return await contract.methods.hasPurchasedCourse(courseId, learnerAddress).call();
  } catch (err) {
    console.error('[platformContract] hasPurchasedCourse error:', err.message);
    return false;
  }
}

async function hasJoinedChallenge(challengeId, participantAddress) {
  try {
    const contract = getPlatformContract();
    return await contract.methods.hasJoinedChallenge(challengeId, participantAddress).call();
  } catch (err) {
    console.error('[platformContract] hasJoinedChallenge error:', err.message);
    return false;
  }
}

module.exports = {
  getPlatformContract,
  createCourse,
  buyCourse,
  createChallenge,
  joinChallenge,
  declareWinners,
  mintCourseCertificate,
  mintMentorBadge,
  fundRewardPool,
  getContractSKTBalance,
  hasPurchasedCourse,
  hasJoinedChallenge,
};
