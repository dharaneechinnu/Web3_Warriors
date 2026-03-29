import { useState, useCallback } from 'react';
import {
  transfer,
  sendRegisterReward as sendRegisterRewardOnChain,
} from '../web3/services/skillTokenService';
import { useWalletOwner } from './useWalletOwner';
import api from '../services/api';

// ═══════════════════════════════════════════════════════════════════
// useTokenPayment
//
// Centralised PTKN payment logic. Two operations:
//
// 1. enroll(courseId, learnerId, mentorAddress)
//    - Web2 enrollment always runs first and always succeeds
//    - Then attempts a 1 PTKN transfer learner → mentor (best-effort)
//    - PTKN failures are console.log only — user never sees an error
//    - Price is always 1 PTKN (flat fee)
//
// 2. sendRegistrationReward(userWalletAddress)
//    - Sends 10 PTKN to a newly registered learner
//    - Silently skips if the connected wallet is NOT the contract owner
//    - Silently skips if userWalletAddress is empty / null
//
// Returns:
//   enroll                  {function}
//   sendRegistrationReward  {function}
//   status  'idle'|'pending'|'success'|'error'
//   txHash  {string}
//   message {string}
//   reset   {function}  — reset status back to idle
// ═══════════════════════════════════════════════════════════════════

export function useTokenPayment() {
  const { isOwner } = useWalletOwner();

  const [status,  setStatus]  = useState('idle');
  const [txHash,  setTxHash]  = useState('');
  const [message, setMessage] = useState('');

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash('');
    setMessage('');
  }, []);

  // ─── Course Enrollment ─────────────────────────────────────────
  const enroll = useCallback(async (courseId, learnerId, mentorAddress) => {
    setStatus('pending');
    setMessage('Enrolling in course…');
    setTxHash('');

    let web3TxHash = '';

    try {
      // Step 1 — Web2 enrollment (always runs, never skipped)
      await api.post('/courses/enroll', { learnerId, courseId });
      setMessage('Enrolled! Sending 1 PTKN to instructor…');

      // Step 2 — 1 PTKN transfer learner → mentor (best-effort)
      if (mentorAddress) {
        try {
          const tx  = await transfer(mentorAddress, '1');
          web3TxHash = tx.transactionHash || '';
          setTxHash(web3TxHash);

          // Record on-chain txHash in backend — fire and forget
          api.post('/courses/enroll/txhash', {
            learnerId,
            courseId,
            txHash: web3TxHash,
          }).catch(() => {});
        } catch (web3Err) {
          // Never show this to the user — enrollment already secured
          console.log('[useTokenPayment] PTKN transfer skipped:', web3Err.message);
        }
      }

      setStatus('success');
      setMessage(
        web3TxHash
          ? 'Enrolled! 1 PTKN sent to instructor on-chain ✅'
          : 'Enrolled successfully! ✅'
      );
      return { success: true, txHash: web3TxHash };

    } catch (err) {
      // Only reaches here if Web2 itself failed
      console.log('[useTokenPayment] Enrollment failed:', err.message);
      setStatus('error');
      setMessage(err.response?.data?.message || 'Enrollment failed. Please try again.');
      return { success: false };
    }
  }, []);

  // ─── Registration Reward (onlyOwner) ──────────────────────────
  const sendRegistrationReward = useCallback(async (userWalletAddress) => {
    // Nothing to do without a recipient address
    if (!userWalletAddress) {
      console.log('[useTokenPayment] Registration reward skipped: no wallet address provided');
      return;
    }
    // Only the contract owner can call reward()
    if (!isOwner) {
      console.log('[useTokenPayment] Registration reward skipped: connected wallet is not contract owner');
      return;
    }
    try {
      await sendRegisterRewardOnChain(userWalletAddress, '10');
      console.log('[useTokenPayment] Registration reward (10 PTKN) sent to', userWalletAddress);
    } catch (err) {
      console.log('[useTokenPayment] Registration reward failed:', err.message);
    }
  }, [isOwner]);

  return { enroll, sendRegistrationReward, status, txHash, message, reset };
}
