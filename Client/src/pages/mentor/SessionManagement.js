import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getMyApplication } from "../../services/mentorApplicationService";
import { Web3 } from 'web3';
import SkillPlatformABI from '../../web3/abi/SkillPlatformABI.json';
import { SKILL_PLATFORM_ADDRESS } from '../../services/contractAddress';

/* -- helpers -- */
const tok = () => localStorage.getItem("token");
const uid = () => localStorage.getItem("userId");

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : "--";

// `isUpcoming` removed (unused) to satisfy linter and avoid build failure on CI

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
  input: {
    width: "100%", padding: "0.7rem 1rem", borderRadius: "0.6rem",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", fontSize: "0.95rem", boxSizing: "border-box", outline: "none"
  },
  label: { display: "block", marginBottom: "0.35rem", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 },
  slotBadge: (status) => ({
    display: "inline-block", padding: "0.22rem 0.8rem", borderRadius: "2rem",
    fontSize: "0.72rem", fontWeight: 700,
    background: status === "available" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
    color: status === "available" ? "#86efac" : "#fca5a5",
    textTransform: "uppercase"
  }),
  slotGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem"
  }
};

/* == component == */
const SessionManagement = () => {
  const navigate = useNavigate();
  const mentorId = uid();

  const [tab, setTab]                   = useState("pending");
  const [all, setAll]                   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); // null|'pending'|'approved'|'rejected'|'not_applied'

  /* -- slot management state -- */
  const [slotForm, setSlotForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "10:00"
  });
  const [slots, setSlots]             = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [slotError, setSlotError]     = useState(null);
  const [slotSuccess, setSlotSuccess] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [bulkDeleting, setBulkDeleting]   = useState(false);

  /* -- Web3 on-chain state -- */
  const [registering, setRegistering]       = useState(null);   // slotId currently being registered on-chain
  const [onChainPrices, setOnChainPrices]   = useState({});     // slotId -> ethPrice string
  const [web3TxMsg, setWeb3TxMsg]           = useState(null);   // { type:'success'|'error', text }

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

  /* -- fetch slots -- */
  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const res = await api.get(`/slots/mentor/${mentorId}/all`, {
        headers: { Authorization: `Bearer ${tok()}` }
      });
      setSlots(res.data.slots || []);
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    } finally {
      setSlotsLoading(false);
    }
  }, [mentorId]);

  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setSlotForm(prev => ({ ...prev, [name]: value }));
  };

  /* Parse a date+time string as IST (Asia/Kolkata, UTC+5:30) */
  const parseIST = (date, time) => new Date(`${date}T${time}:00+05:30`);

  /* Build optimistic slot preview cards client-side so they appear instantly */
  const computeOptimisticSlots = (date, startTime, endTime) => {
    let cursor = parseIST(date, startTime);
    const end  = parseIST(date, endTime);
    const out  = [];
    while (cursor < end) {
      const slotEnd = new Date(cursor.getTime() + 60 * 60000);
      out.push({ _id: `opt-${cursor.getTime()}`, startTime: cursor.toISOString(), endTime: slotEnd.toISOString(), status: "available", _optimistic: true });
      cursor = slotEnd;
    }
    return out;
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    setSlotSubmitting(true);
    setSlotError(null);
    setSlotSuccess(null);
    // Optimistic: show generated slots immediately in the grid
    const optimistic = computeOptimisticSlots(slotForm.date, slotForm.startTime, slotForm.endTime);
    const prevSlots  = slots;
    if (optimistic.length > 0) setSlots(prev => [...prev, ...optimistic]);
    try {
      const res = await api.post(
        `/slots/mentor/${mentorId}/create`,
        slotForm,
        { headers: { Authorization: `Bearer ${tok()}` } }
      );
      if (res.data.success) {
        setSlotSuccess(`✅ ${res.data.message}`);
        setSlotForm({ date: new Date().toISOString().split('T')[0], startTime: "09:00", endTime: "10:00" });
        fetchSlots(); // replace optimistic entries with real server data
        setTimeout(() => setSlotSuccess(null), 3000);
      }
    } catch (err) {
      setSlots(prevSlots); // rollback optimistic entries
      setSlotError(err.response?.data?.message || "Failed to create slots");
    } finally {
      setSlotSubmitting(false);
    }
  };

  /* Single delete — optimistic remove, rollback on failure */
  const handleDeleteSlot = async (slotId) => {
    const prev = slots;
    setSlots(s => s.filter(sl => sl._id !== slotId));
    setSelectedSlots(sel => { const n = new Set(sel); n.delete(slotId); return n; });
    try {
      await api.delete(`/slots/${slotId}`, { headers: { Authorization: `Bearer ${tok()}` } });
      setSlotSuccess("✅ Slot deleted");
      setTimeout(() => setSlotSuccess(null), 2000);
    } catch {
      setSlots(prev); // rollback
      setSlotError("Failed to delete slot. It has been restored.");
    }
  };

  /* Bulk delete — optimistic, rollback on any failure */
  const handleBulkDelete = async () => {
    if (selectedSlots.size === 0) return;
    const ids  = [...selectedSlots];
    const prev = slots;
    setSlots(s => s.filter(sl => !selectedSlots.has(sl._id)));
    setSelectedSlots(new Set());
    setBulkDeleting(true);
    setSlotError(null);
    try {
      await Promise.all(ids.map(id => api.delete(`/slots/${id}`, { headers: { Authorization: `Bearer ${tok()}` } })));
      setSlotSuccess(`✅ Deleted ${ids.length} slot${ids.length > 1 ? "s" : ""}`);
      setTimeout(() => setSlotSuccess(null), 2500);
    } catch {
      setSlots(prev); // rollback all
      setSelectedSlots(new Set(ids));
      setSlotError("Some slots could not be deleted — they have been restored. Please try again.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectSlot = (id) => {
    setSelectedSlots(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const formatSlotDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" });
  };

  const fmtISTTime = (dateStr) => new Date(dateStr).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

  useEffect(() => {
    // Check verification status before loading sessions
    getMyApplication().then(res => {
      if (res.success) {
        setVerificationStatus(res.data?.application?.mentorStatus || 'pending');
      } else if (res.notFound) {
        setVerificationStatus('not_applied');
      } else {
        setVerificationStatus('pending');
      }
    });
    fetchAll();
    fetchSlots();
  }, [fetchAll, fetchSlots]);

  /* -- derived lists -- */
  const pending   = all.filter(s => s.status === "pending" || s.status === "requested");
  const upcoming  = all.filter(s => s.status === "confirmed");
  const completed = all.filter(s => s.status === "completed");

  /* -- slot derived -- */
  const availableSlots       = slots.filter(sl => sl.status === "available" && !sl._optimistic);
  const allAvailableSelected = availableSlots.length > 0 && availableSlots.every(sl => selectedSlots.has(sl._id));
  const toggleSelectAll      = () =>
    setSelectedSlots(allAvailableSelected ? new Set() : new Set(availableSlots.map(sl => sl._id)));

  /* -- Web3: register a slot on-chain with a price so learners can pay ETH -- */
  const registerSlotOnChain = async (slot) => {
    if (!window.ethereum) return setWeb3TxMsg({ type: 'error', text: '🦊 MetaMask is not installed. Install it to enable ETH payments.' });
    // eslint-disable-next-line no-alert
    const ethPrice = window.prompt('Enter session price in ETH (e.g. 0.01):');
    if (!ethPrice || isNaN(parseFloat(ethPrice)) || parseFloat(ethPrice) <= 0) return;
    setRegistering(slot._id);
    setWeb3TxMsg(null);
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const contract = new web3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);
      const priceWei = web3.utils.toWei(ethPrice, 'ether');
      const receipt = await contract.methods.createSession(slot._id, priceWei).send({ from: accounts[0] });
      setOnChainPrices(prev => ({ ...prev, [slot._id]: ethPrice }));
      setWeb3TxMsg({ type: 'success', text: `⛓ Slot registered on-chain! Learners will pay ${ethPrice} ETH to book. TX: ${receipt.transactionHash.slice(0, 18)}…` });
    } catch (err) {
      if (err.code === 4001 || err.message?.includes('User denied')) {
        setWeb3TxMsg({ type: 'error', text: '❌ MetaMask transaction cancelled.' });
      } else {
        setWeb3TxMsg({ type: 'error', text: `⚠️ On-chain registration failed: ${err.message}` });
      }
    } finally {
      setRegistering(null);
    }
  };

  /* -- Web3: mentor confirms session → releases ETH escrow to mentor wallet -- */
  const confirmSessionOnChain = async (bookingId) => {
    if (bookingId == null || !window.ethereum) return;
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const contract = new web3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);
      await contract.methods.confirmSession(bookingId).send({ from: accounts[0] });
      setSuccess(prev => (prev || '') + ' ⛓ ETH escrow released to your wallet!');
    } catch (err) {
      if (err.code !== 4001 && !err.message?.includes('User denied')) {
        console.warn('[SessionManagement] confirmSession on-chain failed:', err.message);
      }
    }
  };

  /* -- Web3: cancel booking → refunds ETH to learner -- */
  const cancelSessionOnChain = async (bookingId) => {
    if (bookingId == null || !window.ethereum) return;
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const contract = new web3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);
      await contract.methods.cancelSession(bookingId).send({ from: accounts[0] });
    } catch (err) {
      console.warn('[SessionManagement] cancelSession on-chain failed:', err.message);
    }
  };

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
    // eslint-disable-next-line no-alert
    const reason = window.prompt("Reason for declining (optional):") || "";
    try {
      await api.patch(`/sessions/reject-request/${session._id}`, {
        mentorId,
        cancelReason: reason
      }, { headers: { Authorization: `Bearer ${tok()}` } });
      setSuccess("Request declined.");
      fetchAll();
      // If this booking was paid on-chain, cancel it so learner gets refunded
      if (session?.onChainBookingId != null) {
        await cancelSessionOnChain(session.onChainBookingId);
      }
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
    const session = all.find(s => s._id === id);
    try {
      await api.patch(`/sessions/complete/${id}`, { mentorId }, { headers: { Authorization: `Bearer ${tok()}` } });
      setSuccess("Session marked as completed!");
      fetchAll();
      // If ETH was held in escrow, release it to the mentor wallet via MetaMask
      if (session?.onChainBookingId != null) {
        await confirmSessionOnChain(session.onChainBookingId);
      }
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

  // Block the page entirely until verification is confirmed
  if (verificationStatus !== null && verificationStatus !== 'approved') {
    const isRejected = verificationStatus === 'rejected';
    return (
      <div style={S.page}>
        <div style={{ ...S.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              background: isRejected ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${isRejected ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
              borderRadius: '1.25rem',
              padding: '3rem 2.5rem',
              maxWidth: 520,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
              {isRejected ? '🚫' : verificationStatus === 'not_applied' ? '📋' : '⏳'}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
              {isRejected
                ? 'Mentor Application Rejected'
                : verificationStatus === 'not_applied'
                ? 'No Mentor Application Found'
                : 'Account Pending Verification'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {isRejected
                ? 'Your mentor application was rejected. You cannot manage sessions until you reapply and are approved by an administrator.'
                : verificationStatus === 'not_applied'
                ? 'You need to submit a mentor application and get approved before you can manage sessions.'
                : 'Your mentor application is under review. Session management will be available once an admin approves your account. Check back soon!'}
            </p>
            <button
              onClick={() => navigate('/mentor/application-status')}
              style={{
                padding: '0.7rem 1.8rem',
                borderRadius: '0.6rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: isRejected
                  ? 'linear-gradient(135deg,#ef4444,#b91c1c)'
                  : 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: '#fff',
              }}
            >
              {isRejected ? 'View Rejection & Reapply →' : 'View Application Status →'}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

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
          <button style={S.tab(tab === "slots")} onClick={() => { setTab("slots"); setError(null); fetchSlots(); }}>
            🗓️ Time Slots
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

        {/* -- TIME SLOTS -- */}
        {tab === "slots" && (
          <>
            {slotError   && <div style={S.alert("error")}>{slotError}</div>}
            {slotSuccess && <div style={S.alert("success")}>{slotSuccess}</div>}
            {web3TxMsg   && <div style={S.alert(web3TxMsg.type === 'success' ? 'success' : 'error')}>{web3TxMsg.text}</div>}

            {/* Create Slot Form */}
            <motion.div
              style={{
                ...S.card,
                background: slotSubmitting ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.04)",
                border:     slotSubmitting ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.09)",
                transition: "background 0.3s, border 0.3s"
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                ➕ Add New Time Slot
                {slotSubmitting && (
                  <span style={{ fontSize: "0.76rem", color: "#a78bfa", fontWeight: 600, background: "rgba(124,58,237,0.15)", padding: "0.18rem 0.6rem", borderRadius: "1rem" }}>
                    saving…
                  </span>
                )}
              </h3>
              {/* Quick-pick time ranges */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {[
                  { label: "🌅 Morning", start: "09:00", end: "12:00" },
                  { label: "☀️ Afternoon", start: "13:00", end: "17:00" },
                  { label: "🌆 Evening", start: "18:00", end: "21:00" },
                ].map(({ label, start, end }) => (
                  <button key={label} type="button"
                    onClick={() => setSlotForm(f => ({ ...f, startTime: start, endTime: end }))}
                    style={{
                      padding: "0.3rem 0.85rem", borderRadius: "2rem", border: "1px solid rgba(124,58,237,0.35)",
                      background: slotForm.startTime === start && slotForm.endTime === end
                        ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
                      color: "#c4b5fd", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer"
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSlotSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={S.label}>Date *</label>
                    <input type="date" name="date" value={slotForm.date} onChange={handleSlotChange}
                      style={{ ...S.input, opacity: slotSubmitting ? 0.5 : 1 }} disabled={slotSubmitting} required />
                  </div>
                  <div>
                    <label style={S.label}>Start Time * <span style={{ color: "#475569", fontWeight: 400 }}>(IST)</span></label>
                    <input type="time" name="startTime" value={slotForm.startTime} onChange={handleSlotChange}
                      style={{ ...S.input, opacity: slotSubmitting ? 0.5 : 1 }} disabled={slotSubmitting} required />
                  </div>
                  <div>
                    <label style={S.label}>End Time * <span style={{ color: "#475569", fontWeight: 400 }}>(IST)</span></label>
                    <input type="time" name="endTime" value={slotForm.endTime} onChange={handleSlotChange}
                      style={{ ...S.input, opacity: slotSubmitting ? 0.5 : 1 }} disabled={slotSubmitting} required />
                  </div>
                </div>
                {/* Slot preview */}
                {(() => {
                  const preview = computeOptimisticSlots(slotForm.date, slotForm.startTime, slotForm.endTime);
                  if (!preview.length) return null;
                  return (
                    <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "0.6rem", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.82rem", color: "#86efac", fontWeight: 700, marginBottom: "0.4rem" }}>
                        ✅ Will create {preview.length} slot{preview.length > 1 ? "s" : ""} (1 hour each, IST):
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {preview.map((s, i) => (
                          <span key={i} style={{ fontSize: "0.78rem", background: "rgba(34,197,94,0.12)", color: "#4ade80", padding: "0.2rem 0.6rem", borderRadius: "1rem" }}>
                            {new Date(s.startTime).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true })}
                            {" – "}
                            {new Date(s.endTime).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <button type="submit" disabled={slotSubmitting}
                  style={{ ...S.btn("primary"), width: "100%", padding: "0.75rem", opacity: slotSubmitting ? 0.7 : 1, cursor: slotSubmitting ? "not-allowed" : "pointer" }}>
                  {slotSubmitting ? "⏳ Creating slots…" : "✨ Create Slots"}
                </button>
              </form>
            </motion.div>

            {/* Slots list */}
            <div style={{ marginTop: "1.5rem" }}>

              {/* Header: title + select-all + bulk-delete toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                  📆 Your Slots
                  {slots.length > 0 && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.78rem", color: "#475569", fontWeight: 500 }}>
                      ({slots.filter(s => !s._optimistic).length} total · {availableSlots.length} available)
                    </span>
                  )}
                </h3>

                {availableSlots.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    {/* Select all checkbox */}
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.85rem", color: "#94a3b8", userSelect: "none" }}>
                      <input type="checkbox" checked={allAvailableSelected} onChange={toggleSelectAll}
                        style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#7c3aed" }} />
                      Select all
                    </label>

                    {/* Bulk delete button — appears when ≥1 selected */}
                    {selectedSlots.size > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        onClick={handleBulkDelete} disabled={bulkDeleting}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.35rem",
                          padding: "0.4rem 0.9rem", borderRadius: "0.55rem",
                          border: "1px solid rgba(239,68,68,0.45)", background: "rgba(239,68,68,0.12)",
                          color: "#f87171", fontWeight: 700, fontSize: "0.82rem",
                          cursor: bulkDeleting ? "not-allowed" : "pointer", opacity: bulkDeleting ? 0.6 : 1,
                          transition: "opacity 0.2s"
                        }}
                      >
                        {bulkDeleting ? "⏳ Deleting…" : `🗑️ Delete (${selectedSlots.size})`}
                      </motion.button>
                    )}
                  </div>
                )}
              </div>

              {slotsLoading ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>⏳ Loading slots…</div>
              ) : slots.length === 0 ? (
                <div style={{ textAlign: "center", color: "#64748b", padding: "3rem 0" }}>
                  <div style={{ fontSize: "2.5rem" }}>📭</div>
                  <p style={{ marginTop: "0.75rem" }}>No slots yet. Create your first slot above!</p>
                </div>
              ) : (
                <div style={S.slotGrid}>
                  {slots.map(slot => {
                    const isOpt      = !!slot._optimistic;
                    const isAvail    = slot.status === "available" && !isOpt;
                    const isSelected = selectedSlots.has(slot._id);
                    return (
                      <motion.div
                        key={slot._id}
                        layout
                        style={{
                          ...S.card,
                          border:     isOpt      ? "1px solid rgba(124,58,237,0.4)"
                                    : isSelected ? "1px solid rgba(239,68,68,0.5)"
                                    :              "1px solid rgba(255,255,255,0.09)",
                          background: isOpt      ? "rgba(124,58,237,0.07)"
                                    : isSelected ? "rgba(239,68,68,0.07)"
                                    :              "rgba(255,255,255,0.04)",
                          opacity: isOpt ? 0.6 : 1,
                          position: "relative",
                          marginBottom: 0,
                          transition: "border 0.2s, background 0.2s, opacity 0.2s"
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: isOpt ? 0.6 : 1, scale: 1 }}
                      >
                        {/* Per-card checkbox (available only) */}
                        {isAvail && (
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelectSlot(slot._id)}
                            style={{ position: "absolute", top: "0.9rem", right: "0.9rem", width: 16, height: 16, cursor: "pointer", accentColor: "#ef4444" }} />
                        )}

                        <div style={{ paddingRight: isAvail ? "1.6rem" : 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "0.2rem" }}>
                            {isOpt ? "⏳ " : "📅 "}{formatSlotDateTime(slot.startTime)}
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "0.65rem" }}>
                            → {fmtISTTime(slot.endTime)}
                          </div>
                          <span style={{ ...S.slotBadge(slot.status), ...(isOpt ? { background: "rgba(124,58,237,0.2)", color: "#c4b5fd" } : {}) }}>
                            {isOpt ? "saving…" : slot.status}
                          </span>
                        </div>

                        {isAvail && !isSelected && (
                          <>
                            <button onClick={() => handleDeleteSlot(slot._id)}
                              style={{ ...S.btn("danger"), width: "100%", marginTop: "0.65rem", fontSize: "0.8rem" }}>
                              🗑️ Delete
                            </button>
                            {window.ethereum && (
                              <button
                                onClick={() => registerSlotOnChain(slot)}
                                disabled={registering === slot._id}
                                style={{ ...S.btn("primary"), width: "100%", marginTop: "0.45rem", fontSize: "0.78rem", opacity: registering === slot._id ? 0.65 : 1 }}>
                                {registering === slot._id
                                  ? "⏳ Registering…"
                                  : onChainPrices[slot._id]
                                    ? `⛓ On-Chain (${onChainPrices[slot._id]} ETH)`
                                    : "⛓ Register On-Chain"}
                              </button>
                            )}
                          </>
                        )}
                        {isAvail && isSelected && (
                          <div style={{ textAlign: "center", fontSize: "0.78rem", color: "#f87171", marginTop: "0.5rem", padding: "0.35rem", background: "rgba(239,68,68,0.09)", borderRadius: "0.4rem" }}>
                            ✓ Marked for deletion
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default SessionManagement;
