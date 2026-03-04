import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

// Helpers
const tok = () => localStorage.getItem("token");
const uid = () => localStorage.getItem("userId");

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : "--";

// Styles
const S = {
  page: { minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem 1rem" },
  wrap: { maxWidth: 980, margin: "0 auto" },
  h1: { fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" },
  sub: { color: "#94a3b8", marginBottom: "2rem" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  tab: (a) => ({
    padding: "0.55rem 1.4rem", borderRadius: "2rem", border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: "0.95rem",
    background: a ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.07)",
    color: a ? "#fff" : "#94a3b8", transition: "all 0.2s"
  }),
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "1.1rem", padding: "1.4rem", marginBottom: "1rem"
  },
  pending: {
    background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: "1.1rem", padding: "1.4rem", marginBottom: "1rem"
  },
  btn: (v) => ({
    padding: "0.5rem 1.2rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: "0.88rem",
    background: v === "primary" ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
              : v === "green" ? "linear-gradient(135deg,#059669,#10b981)"
              : v === "danger" ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.08)",
    color: v === "danger" ? "#ef4444" : "#fff", transition: "opacity 0.2s"
  }),
  badge: (s) => {
    const m = {
      pending: "#f59e0b", accepted: "#06b6d4", rejected: "#ef4444"
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
  })
};

// Component
const MentorMentorshipRequests = () => {
  const mentorId = uid();
  const [tab, setTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/mentorship-requests/mentor/${mentorId}/all`, {
        headers: { Authorization: `Bearer ${tok()}` }
      });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError("Failed to load mentorship requests");
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Accept request
  const handleAccept = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/mentorship-requests/${requestId}/accept`, 
        { mentorId }, 
        { headers: { Authorization: `Bearer ${tok()}` } }
      );
      setSuccess("✅ Request accepted! Session created.");
      setTimeout(() => {
        setSuccess(null);
        fetchRequests();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to accept request");
    } finally {
      setLoading(false);
    }
  };

  // Reject request
  const handleReject = async (requestId) => {
    const reason = window.prompt("Reason for declining (optional):");
    if (reason === null) return; // User cancelled

    setLoading(true);
    setRejectingId(requestId);
    setError(null);
    try {
      await api.patch(`/mentorship-requests/${requestId}/reject`, 
        { mentorId, rejectReason: reason || "" }, 
        { headers: { Authorization: `Bearer ${tok()}` } }
      );
      setSuccess("Request declined.");
      setTimeout(() => {
        setSuccess(null);
        fetchRequests();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request");
    } finally {
      setLoading(false);
      setRejectingId(null);
    }
  };

  // Filter requests by status
  const filteredRequests = requests.filter(r => {
    if (tab === "pending") return r.status === "pending";
    if (tab === "accepted") return r.status === "accepted";
    if (tab === "rejected") return r.status === "rejected";
    return true;
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const acceptedCount = requests.filter(r => r.status === "accepted").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <h1 style={S.h1}>📬 Mentorship Requests</h1>
        <p style={S.sub}>Review and respond to learners requesting mentorship sessions</p>

        {error && <div style={S.alert("error")}>{error}</div>}
        {success && <div style={S.alert("success")}>{success}</div>}

        {/* Tabs */}
        <div style={S.tabs}>
          <button style={S.tab(tab === "pending")} onClick={() => { setTab("pending"); setError(null); }}>
            📬 Pending {pendingCount > 0 && (
              <span style={{
                marginLeft: 6, background: "#f59e0b", color: "#000", borderRadius: "50%",
                width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 800
              }}>{pendingCount}</span>
            )}
          </button>
          <button style={S.tab(tab === "accepted")} onClick={() => { setTab("accepted"); setError(null); }}>
            ✅ Accepted {acceptedCount > 0 && `(${acceptedCount})`}
          </button>
          <button style={S.tab(tab === "rejected")} onClick={() => { setTab("rejected"); setError(null); }}>
            ❌ Rejected {rejectedCount > 0 && `(${rejectedCount})`}
          </button>
        </div>

        {loading && <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>⏳ Loading...</div>}

        {!loading && filteredRequests.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
              {tab === "pending" ? "📬" : tab === "accepted" ? "✅" : "❌"}
            </div>
            <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
              {tab === "pending" ? "No pending requests" : tab === "accepted" ? "No accepted requests" : "No rejected requests"}
            </p>
          </div>
        )}

        {/* Requests list */}
        {filteredRequests.map(request => (
          <motion.div
            key={request._id}
            style={request.status === "pending" ? S.pending : S.card}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              {/* Left content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Learner info */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "1rem", color: "#fff", flexShrink: 0
                  }}>
                    {(request.learnerId?.name || "L")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      {request.learnerId?.name || "Unknown Learner"}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      {request.learnerId?.email}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <span style={S.badge(request.status)}>{request.status}</span>
                  </div>
                </div>

                {/* Topic */}
                <div style={{ marginBottom: "0.5rem" }}>
                  <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.2rem" }}>
                    Topic
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>🎯 {request.topic}</div>
                </div>

                {/* Message */}
                {request.message && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.2rem" }}>
                      Learner's Message
                    </div>
                    <div style={{ 
                      color: "#94a3b8", 
                      fontSize: "0.85rem", 
                      fontStyle: "italic",
                      background: "rgba(255,255,255,0.02)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      borderLeft: "2px solid rgba(124,58,237,0.4)"
                    }}>
                      "{request.message}"
                    </div>
                  </div>
                )}

                {/* Requested Slot */}
                {request.slotId?.startTime && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.2rem" }}>
                      Requested Slot
                    </div>
                    <div style={{ 
                      display: "inline-flex", alignItems: "center", gap: "0.4rem",
                      background: request.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(6,182,212,0.1)",
                      padding: "0.3rem 0.7rem", borderRadius: "0.5rem", fontSize: "0.85rem",
                      color: request.status === "pending" ? "#fbbf24" : "#67e8f9"
                    }}>
                      📅 {fmt(request.slotId.startTime)}
                    </div>
                  </div>
                )}

                {/* Request timestamp */}
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.75rem" }}>
                  Received {new Date(request.createdAt).toLocaleString("en-IN", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </div>
              </div>

              {/* Actions */}
              {request.status === "pending" && (
                <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column", alignItems: "flex-end" }}>
                  <button
                    style={S.btn("green")}
                    onClick={() => handleAccept(request._id)}
                    disabled={loading}
                  >
                    ✓ Accept
                  </button>
                  <button
                    style={S.btn("danger")}
                    onClick={() => handleReject(request._id)}
                    disabled={loading || rejectingId === request._id}
                  >
                    ✗ Decline
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MentorMentorshipRequests;
