import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { assetUrl } from "../../config";
import { declareWinners } from "../../web3/services/skillPlatformService";
import { transfer as transferSKT } from "../../web3/services/skillTokenService";

const BLOCK_EXPLORER = process.env.REACT_APP_BLOCK_EXPLORER || 'https://sepolia.etherscan.io';

const MentorChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [view, setView] = useState("list"); // list | create | submissions
  const [selected, setSelected] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    rewardTokens: "",
    prizeFirst: 50,
    prizeSecond: 30,
    prizeThird: 20,
  });
  const [saving, setSaving] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [announcedWinners, setAnnouncedWinners] = useState(null); // winners after announce step
  const [minting, setMinting] = useState(false);
  const [mintResults, setMintResults] = useState([]); // [{rank, walletAddress, txHash?, error?}]
  const [mentorId] = useState(localStorage.getItem("userId"));

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/challenges/mentor/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChallenges(res.data.challenges || []);
    } catch {
      setError("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/challenges/create",
        {
          mentorId,
          title: form.title,
          description: form.description,
          deadline: form.deadline || null,
          rewardTokens: Number(form.rewardTokens),
          prizeDistribution: {
            first: Number(form.prizeFirst),
            second: Number(form.prizeSecond),
            third: Number(form.prizeThird),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Challenge created!");
      setForm({ title: "", description: "", deadline: "", rewardTokens: "", prizeFirst: 50, prizeSecond: 30, prizeThird: 20 });
      setView("list");
      fetchChallenges();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create challenge");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/challenges/status/${id}`, { status, mentorId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchChallenges();
    } catch (err) {
      setError(err.response?.data?.message || "Status update failed");
    }
  };

  const openSubmissions = async (challenge) => {
    setSelected(challenge);
    setView("submissions");
    setAnnouncedWinners(null);
    setMintResults([]);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/challenges/${challenge._id}/submissions?mentorId=${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(res.data.submissions || []);
    } catch {
      setSubmissions([]);
    }
  };

  const handleRank = async (submissionId, rank, score, feedback) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/challenges/${selected._id}/submissions/${submissionId}/rank`,
        { rank, score, feedback, mentorId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Submission ranked!");
      openSubmissions(selected);
    } catch (err) {
      setError("Ranking failed");
    }
  };

  // ── Step 1: Announce winners + credit DB token balances ──────────────────────
  const handleAnnounceWinners = async () => {
    // Check if at least one submission is ranked
    const anyRanked = submissions.some(s => s.rank && s.rank >= 1);
    if (!anyRanked) {
      setError("Please rank at least one submission before announcing winners.");
      return;
    }
    const rankedCount = submissions.filter(s => s.rank && s.rank >= 1).length;
    const isSingle = rankedCount === 1;
    const confirmMsg = isSingle
      ? `Announce 1 winner who gets all ${selected.rewardTokens} tokens? This cannot be undone.`
      : `Announce ${rankedCount} winner(s) and distribute ${selected.rewardTokens} tokens? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    setDistributing(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/challenges/${selected._id}/distribute-rewards`, { mentorId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const winners = res.data.winners || [];
      setAnnouncedWinners(winners);
      // Refresh selected challenge metadata so rewardsDistributed flag is updated
      try {
        const r2 = await api.get(`/challenges/${selected._id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (r2.data.challenge) setSelected(r2.data.challenge);
      } catch { /* non-critical */ }
      setSuccess(`🏆 Winner${winners.length > 1 ? 's' : ''} announced! Token credits applied to ${winners.length} learner account(s). Now mint on-chain.`);
      fetchChallenges();
    } catch (err) {
      setError(err.response?.data?.message || "Distribution failed");
    } finally {
      setDistributing(false);
    }
  };

  // ── Step 2: On-chain SKT minting via SkillPlatform.declareWinners ────────────
  const handleMintTokens = async () => {
    const winners = announcedWinners || [];
    const withWallet = winners.filter(w => w.walletAddress && w.tokens > 0);

    if (winners.length === 0) {
      setError("No winners to mint tokens for.");
      return;
    }
    if (withWallet.length === 0) {
      setError("None of the winners have a connected wallet address. Ask them to connect MetaMask in their Wallet page first.");
      return;
    }

    if (!window.confirm(
      `You are about to transfer ${withWallet.reduce((s, w) => s + w.tokens, 0)} SKT from your connected wallet to ${withWallet.length} winner(s).\n\nMake sure your MetaMask wallet has enough SKT tokens."`
    )) return;

    setMinting(true);
    setMintResults([]);
    setError(null);
    const token = localStorage.getItem("token");
    const results = [];

    const byRank = [...withWallet].sort((a, b) => a.rank - b.rank);
    const ZERO = "0x0000000000000000000000000000000000000000";
    const goldAddr   = byRank.find(w => w.rank === 1)?.walletAddress || ZERO;
    const silverAddr = byRank.find(w => w.rank === 2)?.walletAddress || ZERO;
    const bronzeAddr = byRank.find(w => w.rank === 3)?.walletAddress || ZERO;

    const onChainId = selected.onChainChallengeId || parseInt(selected._id.slice(-8), 16);

    // If only 1 winner, skip declareWinners (which expects pool participants) and
    // go straight to mintToWinner so the single winner gets all the tokens.
    const isSingleWinner = byRank.length === 1;

    if (!isSingleWinner) {
      // Primary: SkillPlatform.declareWinners (batch — distributes challenge pool)
      try {
        const batchTx = await declareWinners(onChainId, goldAddr, silverAddr, bronzeAddr);
        for (const w of byRank) {
          results.push({ rank: w.rank, learnerName: w.learnerName, walletAddress: w.walletAddress, tokens: w.tokens, txHash: batchTx.transactionHash });
          api.patch(
            `/challenges/${selected._id}/winner-txhash`,
            { learnerId: w.learnerId, txHash: batchTx.transactionHash, mentorId },
            { headers: { Authorization: `Bearer ${token}` } }
          ).catch(() => {});
        }
        setMintResults(results);
        setSuccess(`⛓️ On-chain distribution complete! ${results.length} winner(s) credited via SkillPlatform.`);
        setMinting(false);
        return;
      } catch (batchErr) {
        console.warn("[MentorChallenges] declareWinners failed, falling back to mintTo:", batchErr.message);
      }
    }

    // Fallback (or single winner): direct ERC20 transfer from mentor's wallet
    for (const w of byRank) {
      try {
        const tx = await transferSKT(w.walletAddress, String(w.tokens));
        const txHash = tx.transactionHash;
        results.push({ rank: w.rank, learnerName: w.learnerName, walletAddress: w.walletAddress, tokens: w.tokens, txHash });
        api.patch(
          `/challenges/${selected._id}/winner-txhash`,
          { learnerId: w.learnerId, txHash, mentorId },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
      } catch (txErr) {
        results.push({ rank: w.rank, learnerName: w.learnerName, walletAddress: w.walletAddress, tokens: w.tokens, error: txErr.message });
      }
    }

    setMintResults(results);
    const ok = results.filter(r => r.txHash).length;
    if (ok > 0) {
      setSuccess(`⛓️ ${ok}/${byRank.length} SKT token transfer(s) completed on-chain.`);
    } else {
      setError(`⚠️ Token transfer failed. Make sure your MetaMask wallet has enough SKT tokens and is connected to the correct network.`);
    }
    setMinting(false);
  };

  const statusBadge = (s) => {
    const colors = { draft: "bg-gray-600", published: "bg-green-700", closed: "bg-yellow-700", completed: "bg-blue-700" };
    return <span className={`text-xs px-2 py-1 rounded-full ${colors[s] || "bg-gray-600"}`}>{s}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6 pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Challenges</h1>
          <button
            onClick={() => setView(view === "create" ? "list" : "create")}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold"
          >
            {view === "create" ? "Back to List" : "+ New Challenge"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-white">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">{success}</div>
        )}

        {/* Create form */}
        {view === "create" && (
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Challenge</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Challenge Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                rows={4}
                placeholder="Challenge description and requirements..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Deadline (optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Total Reward Tokens</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g. 300"
                    value={form.rewardTokens}
                    onChange={(e) => setForm({ ...form, rewardTokens: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Prize Distribution (%)</label>
                <div className="grid grid-cols-3 gap-4">
                  {["prizeFirst", "prizeSecond", "prizeThird"].map((key, i) => (
                    <div key={key}>
                      <label className="text-xs text-yellow-400 mb-1 block">{["🥇 1st", "🥈 2nd", "🥉 3rd"][i]}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create Challenge"}
              </button>
            </form>
          </div>
        )}

        {/* Challenge list */}
        {view === "list" && (
          <>
            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading…</div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No challenges yet. Create one!</div>
            ) : (
              <div className="space-y-4">
                {challenges.map((ch) => (
                  <div key={ch._id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{ch.title}</h3>
                          {statusBadge(ch.status)}
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">{ch.description}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                          <span>🏆 {ch.rewardTokens} tokens</span>
                          <span>👥 {ch.participants?.length || 0} participants</span>
                          <span>📋 {ch.submissions?.length || 0} submissions</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2 min-w-max">
                        <button
                          onClick={() => openSubmissions(ch)}
                          className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1 rounded text-sm"
                        >
                          View Submissions
                        </button>
                        {ch.status === "draft" && (
                          <button
                            onClick={() => handleStatusChange(ch._id, "published")}
                            className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm"
                          >
                            ✅ Publish
                          </button>
                        )}
                        {ch.status === "published" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(ch._id, "draft")}
                              className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                            >
                              🔒 Unpublish
                            </button>
                            <button
                              onClick={() => handleStatusChange(ch._id, "closed")}
                              className="bg-yellow-700 hover:bg-yellow-600 px-3 py-1 rounded text-sm"
                            >
                              🔐 Close
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Submissions view */}
        {view === "submissions" && selected && (
          <div>
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button onClick={() => setView("list")} className="text-gray-400 hover:text-white">
                ← Back
              </button>
              <h2 className="text-xl font-semibold flex-1">{selected.title}</h2>
              {statusBadge(selected.status)}

              {/* Step 1 – Announce Winners (DB credit) */}
              {selected.status === "closed" && !selected.rewardsDistributed && (
                <button
                  onClick={handleAnnounceWinners}
                  disabled={distributing}
                  className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  {distributing ? '⏳ Announcing…' : '📢 Announce Winners'}
                </button>
              )}

              {/* Step 2 – Transfer SKT tokens to winners from mentor's wallet */}
              {announcedWinners && mintResults.length === 0 && (
                <button
                  onClick={handleMintTokens}
                  disabled={minting}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  {minting ? '⏳ Sending tokens…' : '⛓️ Send SKT to Winners'}
                </button>
              )}
            </div>

            {/* Winner Announcement Panel */}
            {(announcedWinners || selected.rewardsDistributed) && (
              <WinnerPanel
                winners={announcedWinners || []}
                mintResults={mintResults}
                rewardTokens={selected.rewardTokens}
                prizeDistribution={selected.prizeDistribution}
              />
            )}

            {/* Submissions list */}
            {submissions.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No submissions yet.</div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <SubmissionCard key={sub._id} sub={sub} onRank={handleRank} locked={selected.rewardsDistributed} />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const STATUS_COLOR = {
  submitted: 'bg-gray-700',
  reviewed: 'bg-blue-700',
  rewarded: 'bg-yellow-600',
};

const SubmissionCard = ({ sub, onRank, locked }) => {
  const [rank, setRank] = useState(sub.rank || "");
  const [score, setScore] = useState(sub.score || "");
  const [feedback, setFeedback] = useState(sub.feedback || "");

  return (
    <div className={`bg-gray-800/60 border rounded-xl p-5 ${sub.rank && sub.rank <= 3 ? 'border-yellow-600/50' : 'border-gray-700'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold flex items-center gap-2">
            {sub.rank && MEDAL[sub.rank] && <span className="text-lg">{MEDAL[sub.rank]}</span>}
            {sub.learnerName || "Learner"}
          </p>
          <p className="text-xs text-gray-400">{sub.learnerEmail}</p>
          <p className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[sub.status] || 'bg-gray-700'}`}>
            {sub.status || "submitted"}
          </span>
          {sub.rewardTokens > 0 && (
            <span className="text-xs text-yellow-400">+{sub.rewardTokens} SKT</span>
          )}
        </div>
      </div>
      {sub.submissionText && (
        <p className="text-gray-300 text-sm mb-3">{sub.submissionText}</p>
      )}
      {sub.fileUrl && (
        <a href={assetUrl(sub.fileUrl)} target="_blank" rel="noreferrer" className="text-purple-400 text-sm underline block mb-3">
          View submission file
        </a>
      )}
      {sub.rewardTxHash && (
        <a
          href={`${BLOCK_EXPLORER}/tx/${sub.rewardTxHash}`}
          target="_blank" rel="noreferrer"
          className="text-green-400 text-xs underline block mb-3"
        >
          ⛓️ On-chain tx: {sub.rewardTxHash.slice(0, 20)}…
        </a>
      )}
      {!locked && (
        <>
          {/* Quick action: single winner button */}
          {!sub.rank && (
            <button
              onClick={() => onRank(sub._id, 1, score || 100, feedback || 'Winner')}
              className="mb-3 w-full bg-yellow-600 hover:bg-yellow-500 py-2 rounded text-sm font-semibold"
            >
              🏆 Mark as Winner (Rank #1)
            </button>
          )}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Rank</label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Score (0–100)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Feedback</label>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => onRank(sub._id, rank, score, feedback)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
          >
            Save Ranking
          </button>
        </>
      )}
    </div>
  );
};

// ── Winner Panel ──────────────────────────────────────────────────────────────
const WinnerPanel = ({ winners, mintResults, rewardTokens, prizeDistribution }) => {
  const byRank = [...winners].sort((a, b) => a.rank - b.rank);
  const isSingle = byRank.length === 1;

  // Mirror server-side dynamic prize logic
  const getPrize = (w) => {
    if (isSingle) return rewardTokens;
    const pd = prizeDistribution || {};
    if (byRank.length === 2) {
      const total = (pd.first || 50) + (pd.second || 30);
      return w.rank === 1
        ? Math.round(rewardTokens * (pd.first  || 50) / total)
        : Math.round(rewardTokens * (pd.second || 30) / total);
    }
    const map = { 1: pd.first || 50, 2: pd.second || 30, 3: pd.third || 20 };
    return Math.round(rewardTokens * (map[w.rank] || 0) / 100);
  };

  if (byRank.length === 0) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-xl p-4 mb-6 text-yellow-300 text-sm">
        ⚠️ No ranked submissions found. Use "Mark as Winner" or set a rank before announcing.
      </div>
    );
  }

  const SLOT_STYLE = {
    1: 'bg-yellow-900/40 border border-yellow-500/50',
    2: 'bg-gray-700/50 border border-gray-500/50',
    3: 'bg-orange-900/30 border border-orange-700/40',
  };

  return (
    <div className="bg-gray-800/80 border border-yellow-600/40 rounded-xl p-5 mb-6">
      <h3 className="font-bold text-lg mb-4 text-yellow-400">
        🏆 {isSingle ? 'Contest Winner' : 'Contest Winners'}
      </h3>

      {/* Single winner — full-width hero card */}
      {isSingle && (() => {
        const w = byRank[0];
        const mintR = mintResults.find(x => x.rank === w.rank);
        return (
          <div className="rounded-xl p-6 text-center bg-yellow-900/40 border border-yellow-500/50">
            <div className="text-5xl mb-2">🏆</div>
            <p className="font-bold text-xl text-yellow-300">{w.learnerName}</p>
            <p className="text-yellow-400 mt-1 font-semibold">+{rewardTokens} SKT (100% prize pool)</p>
            {w.walletAddress ? (
              <p className="text-gray-400 text-xs mt-2 font-mono">{w.walletAddress.slice(0, 16)}…</p>
            ) : (
              <p className="text-red-400 text-xs mt-2">⚠️ No wallet address — mint will be skipped</p>
            )}
            {mintR?.txHash && (
              <a href={`${BLOCK_EXPLORER}/tx/${mintR.txHash}`} target="_blank" rel="noreferrer"
                className="text-green-400 text-sm underline block mt-2">
                ✅ On-chain confirmed
              </a>
            )}
            {mintR?.error && (
              <p className="text-red-400 text-xs mt-2">❌ Mint failed: {mintR.error}</p>
            )}
          </div>
        );
      })()}

      {/* Multi-winner grid — only show slots that have actual winners */}
      {!isSingle && (
        <div className={`grid gap-4 ${byRank.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {byRank.slice(0, 3).map((w) => {
            const mintR = mintResults.find(x => x.rank === w.rank);
            return (
              <div key={w.rank} className={`rounded-lg p-4 text-center ${SLOT_STYLE[w.rank] || 'bg-gray-700/40 border border-gray-600'}`}>
                <div className="text-3xl mb-1">{MEDAL[w.rank] || `#${w.rank}`}</div>
                <p className="font-semibold text-sm">{w.learnerName}</p>
                <p className="text-yellow-400 text-xs mt-1">+{getPrize(w)} SKT</p>
                {w.walletAddress ? (
                  <p className="text-gray-400 text-xs mt-1 font-mono">{w.walletAddress.slice(0, 10)}…</p>
                ) : (
                  <p className="text-red-400 text-xs mt-1">No wallet</p>
                )}
                {mintR?.txHash && (
                  <a href={`${BLOCK_EXPLORER}/tx/${mintR.txHash}`} target="_blank" rel="noreferrer"
                    className="text-green-400 text-xs underline block mt-1">
                    ✅ On-chain
                  </a>
                )}
                {mintR?.error && (
                  <p className="text-red-400 text-xs mt-1">❌ Mint failed</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MentorChallenges;

