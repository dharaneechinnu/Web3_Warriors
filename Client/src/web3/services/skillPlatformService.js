import Web3 from "web3";
import { SKILL_PLATFORM_ADDRESS, EXPECTED_CHAIN_ID, SESSION_FEE_ETH } from "../config";
import SkillPlatformABI from "../abi/SkillPlatform.json";

// ═══════════════════════════════════════════════════════════════════
// SkillPlatform — Frontend Service
//
// bookSession: anyone (learner) can call — sends exactly 1 ETH.
// ETH is transferred directly to the mentor (no escrow).
// ═══════════════════════════════════════════════════════════════════

function getReadContract() {
  const provider = window.ethereum || "https://rpc.sepolia.org";
  const w3 = new Web3(provider);
  return { w3, contract: new w3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS) };
}

// ─── READ ─────────────────────────────────────────────────────────

/** Total sessions booked so far */
export async function getBookingCount() {
  try {
    const { contract } = getReadContract();
    return Number(await contract.methods.bookingCounter().call());
  } catch { return 0; }
}

/**
 * Get details of a specific booking.
 * @param {number} bookingId
 * @returns {{ learner, mentor, amount, timestamp }}
 */
export async function getBooking(bookingId) {
  const { w3, contract } = getReadContract();
  const result = await contract.methods.getBooking(bookingId).call();
  return {
    learner:   result[0],
    mentor:    result[1],
    amount:    w3.utils.fromWei(result[2].toString(), "ether"),
    timestamp: Number(result[3]),
    date:      new Date(Number(result[3]) * 1000).toLocaleString(),
  };
}

// ─── WRITE ────────────────────────────────────────────────────────

/**
 * Learner books a session by sending exactly 1 ETH to the mentor.
 * ETH is transferred instantly — no escrow, no confirmation step.
 *
 * @param {Web3}   w3            - Initialized Web3 instance
 * @param {object} contract      - Initialized contract instance
 * @param {string} fromAccount   - Learner's MetaMask address
 * @param {string} mentorAddress - Mentor's wallet address (payable)
 * @returns tx receipt with bookingId in SessionBooked event
 */
export async function bookSession(w3, contract, fromAccount, mentorAddress) {
  if (!mentorAddress) throw new Error("Mentor wallet address is required.");

  const weiValue = w3.utils.toWei(SESSION_FEE_ETH, "ether"); // always 1 ETH

  const tx = await contract.methods
    .bookSession(mentorAddress)
    .send({ from: fromAccount, value: weiValue });

  const bookingId = tx.events?.SessionBooked?.returnValues?.bookingId || null;
  console.log(`[SkillPlatform] Session booked. bookingId=${bookingId}`, tx.transactionHash);

  return { tx, bookingId: bookingId ? Number(bookingId) : null };
}

// ─── OPTIONAL ON-CHAIN HELPERS (may not exist on deployed SkillPlatform) ──
/**
 * Attempt to perform an on-chain course purchase.
 * Signature used by UI: `purchaseCourse(learnerAddr, mentorAddr)`
 * Note: contract may not implement this — callers should handle failures.
 */
export async function purchaseCourse(learnerAddr, mentorAddr) {
  if (!window.ethereum) throw new Error('No web3 provider available');
  const provider = window.ethereum;
  const w3 = new Web3(provider);
  const contract = new w3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);

  // use connected account if available, otherwise fall back to provided learnerAddr
  const accounts = await w3.eth.requestAccounts().catch(() => []);
  const from = (accounts && accounts[0]) || learnerAddr;

  // If the contract implements purchaseCourse, call it. Otherwise fail fast.
  if (contract.methods && typeof contract.methods.purchaseCourse === 'function') {
    const tx = await contract.methods.purchaseCourse(mentorAddr).send({ from });
    return tx;
  }

  throw new Error('purchaseCourse is not implemented on the deployed SkillPlatform contract');
}

/**
 * Confirm a session on-chain (admin/mentor-only action in some deployments).
 * UI calls: `confirmSession(blockchainSessionId)`
 */
export async function confirmSession(sessionId) {
  if (!window.ethereum) throw new Error('No web3 provider available');
  const provider = window.ethereum;
  const w3 = new Web3(provider);
  const contract = new w3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);
  const accounts = await w3.eth.requestAccounts().catch(() => []);
  const from = accounts && accounts[0];

  if (contract.methods && typeof contract.methods.confirmSession === 'function') {
    const tx = await contract.methods.confirmSession(sessionId).send({ from });
    return tx;
  }

  throw new Error('confirmSession is not implemented on the deployed SkillPlatform contract');
}

/**
 * Cancel a session on-chain (if supported).
 */
export async function cancelSession(sessionId) {
  if (!window.ethereum) throw new Error('No web3 provider available');
  const provider = window.ethereum;
  const w3 = new Web3(provider);
  const contract = new w3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);
  const accounts = await w3.eth.requestAccounts().catch(() => []);
  const from = accounts && accounts[0];

  if (contract.methods && typeof contract.methods.cancelSession === 'function') {
    const tx = await contract.methods.cancelSession(sessionId).send({ from });
    return tx;
  }

  throw new Error('cancelSession is not implemented on the deployed SkillPlatform contract');
}
