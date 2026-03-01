import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("browse");
  const [selected, setSelected] = useState(null);
  const [submitText, setSubmitText] = useState("");
  const [submitFile, setSubmitFile] = useState(null);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [learnerId] = useState(localStorage.getItem("userId"));

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/challenges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChallenges(res.data.challenges || res.data || []);
    } catch (err) {
      setError("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (challengeId) => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      await api.post(
        `/challenges/${challengeId}/join`,
        { learnerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Joined challenge!");
      fetchChallenges();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not join challenge");
    }
  };

  const openChallenge = async (challenge) => {
    setSelected(challenge);
    setActiveTab("detail");
    setSubmitText("");
    setSubmitFile(null);
    setSubmitUrl("");
    try {
      const token = localStorage.getItem("token");
      const [lbRes, statusRes] = await Promise.all([
        api.get(`/challenges/${challenge._id}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/challenges/${challenge._id}/learner-status?learnerId=${learnerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setLeaderboard(lbRes.data.leaderboard || []);
      setMyStatus(statusRes.data);
    } catch {
      setLeaderboard([]);
      setMyStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("learnerId", learnerId);
      formData.append("learnerName", localStorage.getItem("userName") || "Learner");
      formData.append("description", submitText);
      if (submitUrl) formData.append("submissionUrl", submitUrl);
      if (submitFile) formData.append("file", submitFile);

      await api.post(`/challenges/${selected._id}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess("Submission received!");
      setSubmitText("");
      setSubmitFile(null);
      setSubmitUrl("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s) =>
    s === "published" ? "text-green-400" : s === "closed" ? "text-yellow-400" : s === "completed" ? "text-blue-400" : "text-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6 pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Competitive Challenges</h1>
        <p className="text-gray-400 mb-6">Win tokens by competing in skill challenges hosted by mentors.</p>

        {error && <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">{success}</div>}

        {/* Tab bar */}
        <div className="flex gap-3 mb-6">
          {["browse", "detail"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              disabled={t === "detail" && !selected}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                activeTab === t ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"
              } disabled:opacity-40`}
            >
              {t === "detail" && selected ? selected.title : "Browse"}
            </button>
          ))}
        </div>

        {/* ═══ Two-column page layout: Content (left) | Leaderboard (right) ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ──── Left Column: Main Content ──── */}
          <div className="min-w-0">

            {/* Browse tab */}
            {activeTab === "browse" && (
              <>
                {loading ? (
                  <div className="text-center py-20 text-gray-400">Loading challenges…</div>
                ) : challenges.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">No challenges available right now.</div>
                ) : (
                  <div className="grid gap-4">
                    {challenges.map((ch) => (
                      <motion.div
                        key={ch._id}
                        className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 hover:border-purple-500 transition cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                        onClick={() => openChallenge(ch)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg">{ch.title}</h3>
                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{ch.description}</p>
                            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-400">
                              <span>🏆 {ch.rewardTokens} tokens</span>
                              <span>👥 {ch.participants?.length || 0} participants</span>
                              {ch.deadline && (
                                <span>⏰ Deadline: {new Date(ch.deadline).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col items-end gap-2">
                            <span className={`text-xs font-semibold capitalize ${statusColor(ch.status)}`}>
                              {ch.status}
                            </span>
                            {ch.status === "published" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleJoin(ch._id); }}
                                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Detail tab */}
            {activeTab === "detail" && selected && (
              <div className="space-y-6">
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-2">{selected.title}</h2>
                  <p className="text-gray-300 mb-4">{selected.description}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <InfoCard label="Prize Pool" value={`${selected.rewardTokens} tokens`} />
                    <InfoCard label="Participants" value={selected.participants?.length || 0} />
                    <InfoCard label="Status" value={selected.status} />
                    {selected.deadline && (
                      <InfoCard label="Deadline" value={new Date(selected.deadline).toLocaleDateString()} />
                    )}
                  </div>
                </div>

                {/* My status */}
                {myStatus && (
                  <div className="bg-blue-900/30 border border-blue-500/40 rounded-xl p-4 text-sm">
                    <strong>My Status:</strong> {myStatus.joined ? "Joined" : "Not joined"} |{" "}
                    {myStatus.submitted ? `Submitted (Rank: ${myStatus.rank || "Pending"}, Score: ${myStatus.score ?? "—"})` : "Not yet submitted"}
                  </div>
                )}

                {/* Submit form or Already Submitted */}
                {selected.status === "published" && !myStatus?.submitted ? (
                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Submit Your Entry</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <textarea
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        rows={4}
                        placeholder="Describe your solution..."
                        value={submitText}
                        onChange={(e) => setSubmitText(e.target.value)}
                        required
                      />
                      <input
                        type="url"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        placeholder="Solution URL (GitHub, CodePen, etc.) — optional"
                        value={submitUrl}
                        onChange={(e) => setSubmitUrl(e.target.value)}
                      />
                      <input
                        type="file"
                        className="w-full text-gray-400"
                        onChange={(e) => setSubmitFile(e.target.files[0])}
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold disabled:opacity-50"
                      >
                        {submitting ? "Submitting…" : "Submit Entry"}
                      </button>
                    </form>
                  </div>
                ) : myStatus?.submitted ? (
                  <div className="bg-green-900/30 border border-green-500/40 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-green-400 mb-2">Already Submitted</h3>
                    <p className="text-gray-400">You have already submitted your entry for this challenge. Only one submission is allowed.</p>
                    {myStatus.score != null && (
                      <div className="mt-4 bg-gray-900/60 rounded-lg px-6 py-3">
                        <span className="text-gray-400 text-sm">Your Score: </span>
                        <span className="text-purple-400 font-bold text-lg">{myStatus.score} pts</span>
                      </div>
                    )}
                    {myStatus.rank && (
                      <div className="mt-2 text-gray-400 text-sm">Rank: <span className="text-yellow-400 font-semibold">#{myStatus.rank}</span></div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 flex items-center justify-center text-center">
                    <p className="text-gray-400">Submissions are closed for this challenge.</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ──── Right Column: Leaderboard (always visible) ──── */}
          <div className="sticky top-24 self-start bg-gray-800/60 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">🏆 Leaderboard</h3>
            {leaderboard.length > 0 ? (
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                {leaderboard.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900/60 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-500"}`}>
                        #{entry.rank || i + 1}
                      </span>
                      <span className="truncate">{entry.learnerName || `Learner ${i + 1}`}</span>
                    </div>
                    <div className="text-right text-sm flex-shrink-0 ml-2">
                      <div className="text-purple-400">{entry.score ?? "—"} pts</div>
                      {entry.rewardTokens > 0 && <div className="text-green-400">+{entry.rewardTokens} tokens</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2">📊</div>
                <p>No entries on the leaderboard yet. Be the first!</p>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="bg-gray-900/60 rounded-lg p-3">
    <p className="text-gray-400 text-xs">{label}</p>
    <p className="font-semibold capitalize">{value}</p>
  </div>
);

export default Challenges;
