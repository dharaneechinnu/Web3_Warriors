import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { assetUrl } from "../../config";

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

  const handleDistribute = async () => {
    if (!window.confirm("Distribute rewards to top 3? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await api.post(`/challenges/${selected._id}/distribute-rewards`, { mentorId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Rewards distributed!");
      fetchChallenges();
    } catch (err) {
      setError(err.response?.data?.message || "Distribution failed");
    }
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
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setView("list")} className="text-gray-400 hover:text-white">← Back</button>
              <h2 className="text-xl font-semibold">Submissions — {selected.title}</h2>
              {selected.status === "closed" && (
                <button
                  onClick={handleDistribute}
                  className="ml-auto bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Distribute Rewards
                </button>
              )}
            </div>
            {submissions.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No submissions yet.</div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <SubmissionCard key={sub._id} sub={sub} onRank={handleRank} />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const SubmissionCard = ({ sub, onRank }) => {
  const [rank, setRank] = useState(sub.rank || "");
  const [score, setScore] = useState(sub.score || "");
  const [feedback, setFeedback] = useState(sub.feedback || "");

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold">{sub.learnerName || "Learner"}</p>
          <p className="text-xs text-gray-400">{sub.learnerEmail}</p>
          <p className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${sub.status === "ranked" ? "bg-green-700" : "bg-gray-700"}`}>
          {sub.status || "submitted"}
        </span>
      </div>
      <p className="text-gray-300 text-sm mb-3">{sub.description}</p>
      {sub.fileUrl && (
        <a href={assetUrl(sub.fileUrl)} target="_blank" rel="noreferrer" className="text-purple-400 text-sm underline block mb-3">
          View submission file
        </a>
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
          <label className="text-xs text-gray-400 block mb-1">Score</label>
          <input
            type="number"
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
    </div>
  );
};

export default MentorChallenges;
