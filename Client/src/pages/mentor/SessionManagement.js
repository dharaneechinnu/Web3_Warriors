import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [view, setView] = useState("list"); // list | create
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    duration: 60,
    price: 0,
    meetingLink: "",
    maxParticipants: 1,
  });
  const [saving, setSaving] = useState(false);
  const [mentorId] = useState(localStorage.getItem("userId"));
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/sessions/mentor/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data.sessions || res.data || []);
    } catch {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/sessions/create",
        { ...form, mentorId, duration: Number(form.duration), price: Number(form.price) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Session created successfully!");
      setForm({ title: "", description: "", date: "", duration: 60, price: 0, meetingLink: "", maxParticipants: 1 });
      setView("list");
      fetchSessions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create session");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem("token");
      const endpoints = {
        accept: `/sessions/accept/${id}`,
        reject: `/sessions/reject/${id}`,
        complete: `/sessions/complete/${id}`,
      };
      await api.patch(endpoints[action], { mentorId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(`Session ${action}ed!`);
      fetchSessions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Action failed`);
    }
  };

  const filtered = statusFilter === "all" ? sessions : sessions.filter((s) => s.status === statusFilter);

  const statusColors = {
    available: "bg-blue-700",
    pending: "bg-yellow-700",
    confirmed: "bg-green-700",
    completed: "bg-purple-700",
    cancelled: "bg-red-700",
    rejected: "bg-gray-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6 pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Session Management</h1>
          <button
            onClick={() => setView(view === "create" ? "list" : "create")}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold"
          >
            {view === "create" ? "← Back to List" : "+ New Session"}
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
            <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Session Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                rows={3}
                placeholder="What will you cover in this session?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Session Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Price (tokens)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Meeting Link</label>
                  <input
                    type="url"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="https://meet.google.com/..."
                    value={form.meetingLink}
                    onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create Session"}
              </button>
            </form>
          </div>
        )}

        {/* Session list */}
        {view === "list" && (
          <>
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              {["all", "available", "pending", "confirmed", "completed", "cancelled"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition ${statusFilter === f ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No sessions found.</div>
            ) : (
              <div className="space-y-4">
                {filtered.map((session) => (
                  <motion.div
                    key={session._id}
                    className="bg-gray-800/60 border border-gray-700 rounded-xl p-5"
                    whileHover={{ scale: 1.005 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[session.status] || "bg-gray-700"}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{session.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <span>📅 {new Date(session.date).toLocaleString()}</span>
                          <span>⏱ {session.duration} min</span>
                          <span>🪙 {session.price} tokens</span>
                          {session.learnerName && <span>👤 {session.learnerName}</span>}
                        </div>
                        {session.meetingLink && session.status === "confirmed" && (
                          <a href={session.meetingLink} target="_blank" rel="noreferrer"
                            className="text-purple-400 text-sm mt-2 inline-block hover:underline">
                            🔗 Join Meeting
                          </a>
                        )}
                        {session.rating && (
                          <p className="text-yellow-400 text-sm mt-1">⭐ {session.rating}/5 — {session.review}</p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col gap-2 min-w-max">
                        {session.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAction(session._id, "accept")}
                              className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleAction(session._id, "reject")}
                              className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {session.status === "confirmed" && (
                          <button
                            onClick={() => handleAction(session._id, "complete")}
                            className="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded text-sm"
                          >
                            Mark Complete
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
      </motion.div>
    </div>
  );
};

export default SessionManagement;
