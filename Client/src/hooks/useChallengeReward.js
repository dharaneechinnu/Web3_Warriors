import { useState, useCallback } from 'react';
import { mintToWinner } from '../web3/services/skillTokenService';
import { useWalletOwner } from './useWalletOwner';
import api from '../services/api';

// ═══════════════════════════════════════════════════════════════════
// useChallengeReward
//
// Admin-only: distribute on-chain PTKN to challenge winners.
//
// distribute(challengeId, winners)
//   - First checks if the connected wallet is the contract owner
//   - If NOT owner → returns { notOwner: true }  (caller shows info, not error)
//   - If no eligible winners (no wallet address) → returns { noEligible: true }
//   - Otherwise → loops winners sorted by rank, calls PlatformToken.reward()
//   - Per-winner tx failure → console.log only, result marked as { skipped: true }
//   - Patches backend with txHash after each successful mint (fire and forget)
//
// winners shape expected:
//   [{ rank, learnerId, learnerName, walletAddress, tokens }]
//
// Returns:
//   distribute        {function}
//   minting           {boolean}
//   mintResults       {Array}  — [{ rank, learnerName, walletAddress, tokens, txHash?, skipped? }]
//   isOwnerConnected  {boolean}
//   checking          {boolean}
//   reset             {function}  — clear mintResults
// ═══════════════════════════════════════════════════════════════════

export function useChallengeReward() {
  const { isOwner, checking } = useWalletOwner();

  const [minting,     setMinting]     = useState(false);
  const [mintResults, setMintResults] = useState([]);

  const reset = useCallback(() => setMintResults([]), []);

  const distribute = useCallback(async (challengeId, winners = []) => {
    const eligible = winners.filter(w => w.walletAddress && w.tokens > 0);

    // Guard: not contract owner
    if (!isOwner) {
      console.log('[useChallengeReward] Skipped: connected wallet is not the contract owner');
      return { notOwner: true };
    }

    // Guard: no winners have wallet addresses
    if (eligible.length === 0) {
      console.log('[useChallengeReward] Skipped: no eligible winners with wallet addresses');
      return { noEligible: true };
    }

    setMinting(true);
    setMintResults([]);

    const authToken = localStorage.getItem('token');
    const mentorId  = localStorage.getItem('userId');
    const results   = [];

    // Process winners in rank order
    const sorted = [...eligible].sort((a, b) => a.rank - b.rank);

    for (const w of sorted) {
      try {
        const { txHash } = await mintToWinner(w.walletAddress, String(w.tokens));

        results.push({
          rank:          w.rank,
          learnerName:   w.learnerName,
          walletAddress: w.walletAddress,
          tokens:        w.tokens,
          txHash,
        });

        // Persist txHash to backend — fire and forget
        api.patch(
          `/challenges/${challengeId}/winner-txhash`,
          { learnerId: w.learnerId, txHash, mentorId },
          { headers: { Authorization: `Bearer ${authToken}` } }
        ).catch(() => {});

      } catch (err) {
        // Never surface this error to the user
        console.log(`[useChallengeReward] Mint failed for rank ${w.rank}:`, err.message);
        results.push({
          rank:          w.rank,
          learnerName:   w.learnerName,
          walletAddress: w.walletAddress,
          tokens:        w.tokens,
          skipped:       true,
        });
      }
    }

    setMintResults(results);
    setMinting(false);
    return { results };
  }, [isOwner]);

  return {
    distribute,
    minting,
    mintResults,
    isOwnerConnected: isOwner,
    checking,
    reset,
  };
}
