import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

/* -- helpers -- */
const tok = () => localStorage.getItem("token");
const uid = () => localStorage.getItem("userId");

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : "--";

const isUpcoming = (s) => {
  if (s.status !== "confirmed") return false;
  return !s.completedAt;
};

/* -- styles -- */
const S = {
  page:  { minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem 1rem" },
  wrap:  { maxWidth: 980, margin: "0 auto" },
  h1:    { fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" },
  sub:   { color: "#94a3b8", marginBottom: "2rem" },
  tabs:  { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  tab:   (a) => ({
    padding: "0.55rem 1.4rem", borderRadius: "2rem", border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: "0.95rem",
    background: a ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.07)",
    color: a ? "#fff" : "#94a3b8", transition: "all 0.2s"
  }),
  card:  {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "1.1rem", padding: "1.4rem", marginBottom: "1rem"
  },
  confirmed: {
    background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)",
    borderRadius: "1.1rem", padding: "1.4rem", marginBottom: "1rem"
  },
  btn:   (v) => ({
    padding: "0.5rem 1.2rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: "0.88rem",
    background: v === "primary" ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
              : v === "green"   ? "linear-gradient(135deg,#059669,#10b981)"
              : v === "danger"  ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.08)",
    color: v === "danger" ? "#ef4444" : "#fff", transition: "opacity 0.2s"
  }),
  pending: {
    background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: "1.1rem", padding: "1.4rem", marginBottom: "1rem"
  },
  badge: (s) => {
    const m = {
      pending: "#f59e0b", confirmed: "#06b6d4", completed: "#7c3aed",
      cancelled: "#ef4444", rejected: "#ef4444"
    };
    return {
      display: "inline-block", padding: "0.22rem 0.75rem", borderRadius: "2rem",
      fontSize: "0.72rem", fontWeight: 700, background: m[s] || "#64748b",
      color: "#fff", textTransform: "uppercase", letterSpacing: "0.04em"
    };
  },
  alert: (t) => ({
    padding: "0.9rem 1.1rem", borderRadius: "0.6rem", marginBottom: "1rem",
    background: t === "error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
    color: t === "error" ? "#fca5a5" : "#86efac",
    border: `1px solid ${t === "error" ? "#ef4444" : "#22c55e"}40`
  }),
};

/* == component == */
const SessionManagement = () => {
  const navigate = useNavigate();
  const mentorId = uid();

  const [tab, setTab]         = useState("pending");
  const [all, setAll]         = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  /* -- fetch all mentor sessions -- */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/sessions/mentor/${mentorId}`, {
        headers: { Authorization: `Bearer ${tok()}` }
      });
      setAll(res.data.sessions || res.data || []);
    } catch { setError("Failed to load mentorship sessions"); }
    finally { setLoading(false); }
  }, [mentorId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* -- derived lists -- */
  const pending   = all.filter(s => s.status === "pending" || s.status === "requested");
  const upcoming  = all.filter(s => s.status === "confirmed");
  const completed = all.filter(s => s.status === "completed");

  /* -- accept request -- */
  const acceptRequest = async (session) => {
    try {
      await api.patch(`/sessions/accept-request/${session._id}`, {
        mentorId,
        scheduledAt: session.scheduledAt || session.date
      }, { headers: { Authorization: `Bearer ${tok()}` } });
      setSuccess(`✅ Accepted mentorship with ${session.learnerName}! Room created.`);
      fetchAll();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to accept request");
    }
  };

  /* -- reject request -- */
  const rejectRequest = async (session) => {
    const reason = window.prompt("Reason for declining (optional):") || "";
    try {
      await api.patch(`/sessions/reject-request/${session._id}`, {
        mentorId,
        cancelReason: reason
      }, { headers: { Authorization: `Bearer ${tok()}` } });
      setSuccess("Request declined.");
      fetchAll();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request");
    }
  };

  /* -- join room -- */
  const joinRoom = async (session) => {
    try {
      const r = await api.get(`/sessions/join/${session._id}?userId=${mentorId}`, {
        headers: { Authorization: `Bearer ${tok()}` }
      });
      navigate(`/room/${r.data.roomId}`, {
        state: { session, role: "mentor", userName: localStorage.getItem("userName") || "Mentor" }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Cannot join room");
    }
  };

  /* -- mark complete -- */
  const markComplete = async (id) => {
    try {
      await api.patch(`/sessions/complete/${id}`, { mentorId }, { headers: { Authorization: `Bearer ${tok()}` } });
      setSuccess("Session marked as completed!");
      fetchAll();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete session");
    }
  };

  /* -- countdown helper -- */
  const timeUntil = (d) => {
    if (!d) return null;
    const diff = new Date(d) - new Date();
    if (diff < 0) return "Now / Overdue";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`;
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  };

  /* -- render -- */
  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Header */}
        <h1 style={S.h1}>🤝 My Mentorship Sessions</h1>
        <p style={S.sub}>Manage your 1-on-1 mentorship sessions — accept requests, join calls, track progress</p>

        {error   && <div style={S.alert("error")}>{error}</div>}
        {success && <div style={S.alert("success")}>{success}</div>}

        {/* Tabs */}
        <div style={S.tabs}>
          <button style={S.tab(tab === "pending")} onClick={() => { setTab("pending"); setError(null); }}>
            📬 Pending {pending.length > 0 && <span style={{
              marginLeft: 6, background: "#f59e0b", color: "#000", borderRadius: "50%",
              width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: 800
            }}>{pending.length}</span>}
          </button>
          <button style={S.tab(tab === "upcoming")} onClick={() => { setTab("upcoming"); setError(null); }}>
            📅 Upcoming {upcoming.length > 0 && `(${upcoming.length})`}
          </button>
          <button style={S.tab(tab === "completed")} onClick={() => { setTab("completed"); setError(null); }}>
            🎓 Completed {completed.length > 0 && `(${completed.length})`}
          </button>
        </div>

        {loading && (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: "3rem 0" }}>Loading...</div>
        )}

        {/* -- PENDING REQUESTS -- */}
        {tab === "pending" && !loading && (
          <>
            {pending.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
                <div style={{ fontSize: "3rem" }}>📬</div>
                <p style={{ marginTop: "1rem" }}>No pending requests right now.</p>
                <p style={{ fontSize: "0.85rem", color: "#475569", marginTop: "0.5rem" }}>
                  When a learner books a session, it will appear here for your approval.
                </p>
              </div>
            )}
            {pending.map(s => (
              <motion.div key={s._id} style={S.pending}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <span style={S.badge("pending")}>⏳ Pending</span>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", marginTop: "0.5rem" }}>
                      🎯 {s.topic || s.title}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      🎓 {s.learnerName || "Learner"}
                      {s.learnerEmail && <span style={{ opacity: 0.6 }}> · {s.learnerEmail}</span>}
                      &nbsp;·&nbsp; ⏱ {s.duration} min
                    </div>
                    {(s.scheduledAt || s.date) && (
                      <div style={{
                        marginTop: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        background: "rgba(245,158,11,0.1)", padding: "0.3rem 0.7rem",
                        borderRadius: "0.5rem", fontSize: "0.85rem", color: "#fbbf24"
                      }}>
                        📅 Requested: {fmt(s.scheduledAt || s.date)}
                      </div>
                    )}
                    {s.learnerMessage && (
                      <div style={{
                        marginTop: "0.6rem", padding: "0.5rem 0.75rem",
                        background: "rgba(255,255,255,0.04)", borderRadius: "0.5rem",
                        fontSize: "0.83rem", color: "#cbd5e1", fontStyle: "italic"
                      }}>
                        💬 "{s.learnerMessage}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    <button style={S.btn("green")} onClick={() => acceptRequest(s)}>
                      ✅ Accept
                    </button>
                    <button style={S.btn("danger")} onClick={() => rejectRequest(s)}>
                      ❌ Decline
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}

        {/* -- UPCOMING MENTORSHIPS -- */}
        {tab === "upcoming" && !loading && (
          <>
            {upcoming.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
                <div style={{ fontSize: "3rem" }}>📅</div>
                <p style={{ marginTop: "1rem" }}>No upcoming sessions yet.</p>
                <p style={{ fontSize: "0.85rem", color: "#475569", marginTop: "0.5rem" }}>
                  Accept pending requests to see confirmed sessions here.
                </p>
              </div>
            )}
            {upcoming.map(s => {
              const until = timeUntil(s.scheduledAt || s.date);
              return (
                <motion.div key={s._id} style={S.confirmed}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                        <span style={S.badge("confirmed")}>Confirmed</span>
                        {until && (
                          <span style={{
                            fontSize: "0.75rem", color: "#f59e0b", fontWeight: 700,
                            background: "rgba(245,158,11,0.1)", padding: "0.15rem 0.55rem", borderRadius: "2rem"
                          }}>
                            ⏰ {until}
                          </span>
                        )}
                      </div>

                      <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.3rem" }}>
                        🎯 {s.topic || s.title}
                      </div>

                      <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                        🎓 {s.learnerName || "Learner"}
                        {s.learnerEmail && <span style={{ opacity: 0.6 }}> · {s.learnerEmail}</span>}
                        &nbsp;·&nbsp; ⏱ {s.duration} min
                      </div>

                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        background: "rgba(6,182,212,0.1)", padding: "0.3rem 0.7rem",
                        borderRadius: "0.5rem", fontSize: "0.85rem", color: "#67e8f9"
                      }}>
                        📅 {fmt(s.scheduledAt || s.date)}
                      </div>

                      {s.learnerMessage && (
                        <div style={{
                          marginTop: "0.6rem", padding: "0.5rem 0.75rem",
                          background: "rgba(255,255,255,0.04)", borderRadius: "0.5rem",
                          fontSize: "0.83rem", color: "#cbd5e1", fontStyle: "italic"
                        }}>
                          💬 "{s.learnerMessage}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                      {s.roomId && (
                        <button style={S.btn("green")} onClick={() => joinRoom(s)}>
                          📹 Join Call
                        </button>
                      )}
                      <button style={S.btn("")} onClick={() => markComplete(s._id)}>
                        ✅ Mark Done
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}

        {/* -- COMPLETED -- */}
        {tab === "completed" && !loading && (
          <>
            {completed.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
                <div style={{ fontSize: "3rem" }}>🎓</div>
                <p style={{ marginTop: "1rem" }}>No completed sessions yet.</p>
              </div>
            )}
            {completed.map(s => (
              <motion.div key={s._id} style={S.card}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span style={S.badge("completed")}>Completed</span>
                    <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>🎯 {s.topic || s.title}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      🎓 {s.learnerName}  ·  {fmt(s.completedAt || s.scheduledAt)}  ·  ⏱ {s.duration} min
                    </div>
                    {s.price > 0 && (
                      <div style={{ color: "#fbbf24", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        🪙 +{s.price} tokens earned
                      </div>
                    )}
                    {s.rating && (
                      <div style={{ color: "#fbbf24", marginTop: "0.35rem" }}>
                        {"⭐".repeat(s.rating)} {s.review && `— "${s.review}"`}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}

      </div>
    </div>
  );
};

export default SessionManagement;
