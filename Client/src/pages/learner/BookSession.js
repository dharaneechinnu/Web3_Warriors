import { useState, useEffect, useRef } from "react";
import Web3 from "web3";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { assetUrl, API_BASE_URL } from "../../config";
import TransactionStatus from "../../components/TransactionStatus";
import SkillPlatformABI from "../../web3/abi/SkillPlatform.json";
import { SKILL_PLATFORM_ADDRESS, BLOCK_EXPLORER, EXPECTED_CHAIN_ID, NETWORK_NAME, SESSION_FEE_ETH } from "../../web3/config";
import { bookSession as web3BookSession } from "../../web3/services/skillPlatformService";

/* -- helpers -- */
const token = () => localStorage.getItem("token");
const uid   = () => localStorage.getItem("userId");
const uname = () => localStorage.getItem("userName") || "Learner";

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : "--";

/* -- styles -- */
const S = {
  page:  { minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem 1rem" },
  wrap:  { maxWidth: 1020, margin: "0 auto" },
  h1:    { fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" },
  sub:   { color: "#94a3b8", marginBottom: "2rem", fontSize: "1rem" },
  tabs:  { display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" },
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
  badge: (s) => {
    const m = {
      pending:   { bg: "#f59e0b", color: "#000" },
      confirmed: { bg: "#06b6d4", color: "#fff" },
      completed: { bg: "#7c3aed", color: "#fff" },
      cancelled: { bg: "#ef4444", color: "#fff" },
      rejected:  { bg: "#ef4444", color: "#fff" },
    };
    const c = m[s] || { bg: "#64748b", color: "#fff" };
    return {
      display: "inline-block", padding: "0.22rem 0.8rem", borderRadius: "2rem",
      fontSize: "0.72rem", fontWeight: 700, background: c.bg, color: c.color,
      textTransform: "uppercase", letterSpacing: "0.04em"
    };
  },
  btn:   (v) => ({
    padding: "0.55rem 1.3rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: "0.9rem",
    background: v === "primary" ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
              : v === "danger"  ? "rgba(239,68,68,0.15)"
              : v === "green"   ? "linear-gradient(135deg,#059669,#10b981)"
              : "rgba(255,255,255,0.08)",
    color: v === "danger" ? "#ef4444" : "#fff", transition: "opacity 0.2s"
  }),
  input: {
    width: "100%", padding: "0.7rem 1rem", borderRadius: "0.6rem",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", fontSize: "0.95rem", boxSizing: "border-box", outline: "none"
  },

  label: { display: "block", marginBottom: "0.35rem", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 },
  alert: (t) => ({
    padding: "0.9rem 1.1rem", borderRadius: "0.6rem", marginBottom: "1rem",
    background: t === "error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
    color: t === "error" ? "#fca5a5" : "#86efac",
    border: `1px solid ${t === "error" ? "#ef4444" : "#22c55e"}40`
  }),
  search: {
    width: "100%", padding: "0.7rem 1rem 0.7rem 2.6rem", borderRadius: "0.75rem",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", fontSize: "0.95rem", boxSizing: "border-box", outline: "none"
  },
};

/* == component == */
export default function BookSession() {
  const navigate = useNavigate();
  const [tab, setTab]             = useState("browse");
  const [mentors, setMentors]     = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState("");

  // modal form
  const [topic, setTopic]         = useState("");
  const [message, setMessage]     = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsFetchError, setSlotsFetchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Web3 state (direct initialization, no singleton service)
  const [web3, setWeb3]           = useState(null);
  const [account, setAccount]     = useState(null);
  const contractRef               = useRef(null);

  // Web3 transaction state
  const [txVisible, setTxVisible] = useState(false);
  const [txStatus, setTxStatus] = useState('wallet');
  const [txMessage, setTxMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  // ── Initialize Web3 + contract on mount ──────────────────────────
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        if (!window.ethereum) return; // MetaMask not installed — silent; error shown on submit
        const w3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await w3.eth.getAccounts();
        setWeb3(w3);
        setAccount(accounts[0] || null);
        contractRef.current = new w3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);
      } catch (err) {
        console.warn("[BookSession] Web3 init skipped:", err.message);
      }
    };
    initWeb3();

    // Re-sync account on MetaMask account change
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accs) => setAccount(accs[0] || null));
    }
  }, []);

  useEffect(() => {
    if (tab === "browse")         fetchMentors();
    if (tab === "my-mentorships") fetchMySessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* -- fetch -- */
  const fetchMentors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/User/mentors", { headers: { Authorization: `Bearer ${token()}` } });
      console.log("[BookSession] mentors response:", res.data);
      const list = res.data.mentors || res.data || [];
      setMentors(list);
      if (list.length === 0) {
        console.log("[BookSession] No mentors returned from API");
      }
    } catch (err) {
      console.error("[BookSession] fetch mentors error:", err?.response?.data || err.message);
      try {
        const r2 = await api.get("/sessions?status=available", { headers: { Authorization: `Bearer ${token()}` } });
        const unique = {};
        (r2.data.sessions || []).forEach(s => {
          unique[s.mentorId] = { _id: s.mentorId, name: s.mentorName, email: s.mentorEmail, skills: [] };
        });
        setMentors(Object.values(unique));
      } catch { setError("Could not load mentors. Please try again."); }
    } finally { setLoading(false); }
  };

  const fetchMySessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/sessions/learner/${uid()}`, { headers: { Authorization: `Bearer ${token()}` } });
      setSessions(res.data.sessions || res.data || []);
    } catch { setError("Failed to load your mentorships"); }
    finally { setLoading(false); }
  };

  /* -- fetch available slots for mentor -- */
  const fetchAvailableSlots = async (mentorId) => {
    setSlotsLoading(true);
    setSlotsFetchError(null);
    try {
      const res = await api.get(`/slots/mentor/${mentorId}/available`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.data.success && !res.data.slots) {
        throw new Error(res.data.message || "Unexpected response from server");
      }
      const slots = res.data.slots || [];
      setAvailableSlots(
        slots.sort((a, b) => new Date(a.startTimeRaw || a.startTime) - new Date(b.startTimeRaw || b.startTime))
      );
    } catch (err) {
      console.error("[BookSession] fetch slots error:", err?.response?.data || err.message);
      const msg =
        err?.response?.status === 400 ? "Invalid mentor — cannot load slots." :
        err?.response?.status === 404 ? "Mentor not found." :
        err?.response?.status >= 500  ? "Server error while loading slots. Please retry." :
        err?.message || "Failed to load available slots. Please try again.";
      setSlotsFetchError(msg);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  /* -- book mentorship (Web3 direct + MongoDB via API) -- */
  const applyMentorship = async () => {
    if (!topic.trim())  return setError("Please enter a topic");
    if (!selectedSlot)  return setError("Please select an available time slot");

    // Guard: MetaMask must be present
    if (!window.ethereum) {
      return setError("MetaMask is not installed. Please install MetaMask to book a session.");
    }

    // Resolve mentor wallet (field may differ between API responses)
    const mentorWallet = selected.walletAddress || selected.UserWalletAddress || null;
    if (!mentorWallet) {
      return setError("This mentor hasn't connected a wallet yet. They must link a wallet before sessions can be booked.");
    }

    setSubmitting(true);
    setError(null);

    // ── Step 1: Ensure MetaMask account is connected ────────────────
    let w3 = web3;
    let fromAccount = account;
    try {
      if (!w3) {
        w3 = new Web3(window.ethereum);
        setWeb3(w3);
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await w3.eth.getAccounts();
      fromAccount = accounts[0];
      setAccount(fromAccount);
      if (!fromAccount) throw new Error("No MetaMask account connected.");

      // Ensure correct network if EXPECTED_CHAIN_ID is configured
      const chainId = Number(await w3.eth.getChainId());
      if (typeof EXPECTED_CHAIN_ID !== 'undefined' && EXPECTED_CHAIN_ID !== null) {
        if (chainId !== EXPECTED_CHAIN_ID) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: Web3.utils.toHex(EXPECTED_CHAIN_ID) }],
          });
        }
      }

      // Instantiate contract if not already done
      if (!contractRef.current) {
        contractRef.current = new w3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);
      }
    } catch (err) {
      setError(
        err?.code === 4902
          ? (NETWORK_NAME ? `Please add ${NETWORK_NAME} to MetaMask first.` : 'Please add the required network to MetaMask.')
          : err.message || "Could not connect MetaMask."
      );
      setSubmitting(false);
      return;
    }

    // ── Step 2: On-chain bookSession — sends exactly 1 ETH to mentor ─
    setTxVisible(true);
    setTxStatus('wallet');
    setTxMessage(`Confirm payment of ${SESSION_FEE_ETH} ETH to mentor in MetaMask…`);
    setTxHash('');

    let blockchainTxHash = '';
    let onChainBookingId = null;
    try {
      const { tx, bookingId } = await web3BookSession(w3, contractRef.current, fromAccount, mentorWallet);
      blockchainTxHash = tx.transactionHash || '';
      onChainBookingId = bookingId;

      setTxStatus('pending');
      setTxMessage('Payment confirmed on-chain! Saving your request…');
      setTxHash(blockchainTxHash);
    } catch (err) {
      setTxStatus('error');
      const msg =
        err?.code === 4001   ? 'Transaction rejected in MetaMask.' :
        err?.code === -32603 ? 'Contract error: must send exactly 1 ETH and mentor address must be valid.' :
        err.message          || 'Blockchain transaction failed.';
      setTxMessage(msg);
      setSubmitting(false);
      return;
    }

    // ── Step 3: Save mentorship request to MongoDB via API ──────────
    try {
      await api.post(
        `/mentorship-requests/${uid()}/send-request`,
        {
          slotId:          selectedSlot._id,
          topic:           topic.trim(),
          message:         message.trim(),
          txHash:          blockchainTxHash,
          onChainBookingId: onChainBookingId != null ? String(onChainBookingId) : undefined,
          sessionFee:      SESSION_FEE_ETH,
          learnerWallet:   fromAccount,
          mentorWallet:    mentorWallet,
        },
        { headers: { Authorization: `Bearer ${token()}` } }
      );

      setTxStatus('success');
      setTxMessage(`✅ ${SESSION_FEE_ETH} ETH sent to mentor on-chain & request submitted!`);
      setSelected(null);
      setTopic("");
      setMessage("");
      setSelectedSlot(null);
      setAvailableSlots([]);
      setTimeout(() => { setTab("my-mentorships"); fetchMySessions(); }, 2000);
    } catch (err) {
      setTxStatus('error');
      setTxMessage(err.response?.data?.message || 'Blockchain tx succeeded but failed to save request. Note your txHash for support.');
    } finally {
      setSubmitting(false);
    }
  };

  const joinRoom = (session) => {
    api.get(`/sessions/join/${session._id}?userId=${uid()}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => navigate(`/room/${r.data.roomId}`, { state: { session, role: "learner", userName: uname() } }))
      .catch(e => setError(e.response?.data?.message || "Cannot join room yet"));
  };

  /* -- filtered mentors -- */
  const filteredMentors = mentors.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (m.name || "").toLowerCase().includes(q) ||
           (m.email || "").toLowerCase().includes(q) ||
           (m.skills || []).some(s => s.toLowerCase().includes(q)) ||
           (m.bio || "").toLowerCase().includes(q);
  });

  /* -- render -- */
  return (
    <div style={S.page}>
      <TransactionStatus
        visible={txVisible}
        status={txStatus}
        message={txMessage}
        txHash={txHash}
        explorer={BLOCK_EXPLORER}
        onClose={() => setTxVisible(false)}
      />
      <div style={S.wrap}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={S.h1}>{"\uD83E\uDD1D"} Book a Mentorship</h1>
          <p style={S.sub}>1-on-1 private video sessions — pick a mentor, choose a time, get notified once confirmed.</p>
        </div>

        {error   && <div style={S.alert("error")}>{error}</div>}
        {success && <div style={S.alert("success")}>{success}</div>}

        {/* Tabs */}
        <div style={S.tabs}>
          {[["browse","\uD83D\uDD0D Find a Mentor"],["my-mentorships","\uD83D\uDCC5 My Mentorships"]].map(([k,l]) => (
            <button key={k} style={S.tab(tab===k)} onClick={() => { setTab(k); setError(null); setSuccess(null); }}>{l}
              {k === "my-mentorships" && sessions.filter(s=>s.status==="pending").length > 0 && (
                <span style={{
                  marginLeft: 6, background: "#f59e0b", color: "#000", borderRadius: "50%",
                  width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 800
                }}>{sessions.filter(s=>s.status==="pending").length}</span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: "3rem 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{"\u23F3"}</div>
            Loading...
          </div>
        )}

        {/* -- FIND A MENTOR -- */}
        {tab === "browse" && !loading && (
          <>
            {/* Search bar */}
            {mentors.length > 0 && (
              <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem", pointerEvents: "none" }}>{"\uD83D\uDD0D"}</span>
                <input
                  style={S.search}
                  placeholder="Search by name, email, skill..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}

            {mentors.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{"\uD83E\uDDD1\u200D\uD83C\uDFEB"}</div>
                <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#94a3b8" }}>No mentors available right now</p>
                <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", maxWidth: 400, margin: "0.5rem auto 0" }}>
                  Mentors will appear here once they register. Check back later!
                </p>
                <button style={{ ...S.btn("primary"), marginTop: "1.5rem" }} onClick={fetchMentors}>
                  {"\uD83D\uDD04"} Refresh
                </button>
              </div>
            )}

            {mentors.length > 0 && filteredMentors.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
                <div style={{ fontSize: "2.5rem" }}>{"\uD83D\uDD0E"}</div>
                <p style={{ marginTop: "0.5rem" }}>No mentors match "{search}"</p>
                <button style={{ ...S.btn(""), marginTop: "1rem" }} onClick={() => setSearch("")}>
                  Clear search
                </button>
              </div>
            )}

            {/* Mentor count */}
            {filteredMentors.length > 0 && (
              <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Showing {filteredMentors.length} mentor{filteredMentors.length !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {filteredMentors.map(m => (
                <motion.div key={m._id} style={S.card}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ borderColor: "rgba(124,58,237,0.4)", boxShadow: "0 0 20px rgba(124,58,237,0.1)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    {m.profileImage ? (
                      <img src={m.profileImage.startsWith("http") ? m.profileImage : `${API_BASE_URL}/${m.profileImage}`}
                        alt={m.name}
                        style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(124,58,237,0.4)" }}
                        onError={e => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }}
                      />
                    ) : null}
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                      display: m.profileImage ? "none" : "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "1.2rem", color: "#fff", flexShrink: 0
                    }}>
                      {(m.name || "M")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "1.05rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name || "Mentor"}</div>
                      <div style={{ color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</div>
                      {/* Wallet status */}
                      <div style={{ marginTop: 6, fontSize: '0.78rem' }}>
                        { (m.UserWalletAddress || m.walletAddress) ? (
                          <span style={{ color: '#86efac' }}>🟢 Wallet: {(m.UserWalletAddress || m.walletAddress).slice(0,6)}...{(m.UserWalletAddress || m.walletAddress).slice(-4)}</span>
                        ) : (
                          <span style={{ color: '#fca5a5' }}>🔴 Wallet not connected</span>
                        ) }
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {m.bio && (
                    <p style={{ color: "#94a3b8", fontSize: "0.83rem", marginBottom: "0.75rem", lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {m.bio}
                    </p>
                  )}

                  {/* Experience */}
                  {m.experience && (
                    <div style={{ color: "#64748b", fontSize: "0.78rem", marginBottom: "0.6rem" }}>
                      {"\uD83D\uDCBC"} {m.experience}
                    </div>
                  )}

                  {/* Skills */}
                  {m.skills?.length > 0 && (
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                      {m.skills.slice(0, 5).map(s => (
                        <span key={s} style={{
                          padding: "0.15rem 0.55rem", borderRadius: "2rem", fontSize: "0.72rem",
                          background: "rgba(124,58,237,0.18)", color: "#a78bfa", fontWeight: 600
                        }}>{s}</span>
                      ))}
                      {m.skills.length > 5 && (
                        <span style={{ padding: "0.15rem 0.55rem", borderRadius: "2rem", fontSize: "0.72rem",
                          background: "rgba(255,255,255,0.06)", color: "#64748b", fontWeight: 600
                        }}>+{m.skills.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Rating */}
                  {m.averageRating > 0 && (
                    <div style={{ color: "#fbbf24", fontSize: "0.83rem", marginBottom: "0.75rem" }}>
                      {"\u2B50".repeat(Math.round(m.averageRating))} <span style={{ color: "#94a3b8" }}>{m.averageRating.toFixed(1)}</span>
                      {m.ratings?.length > 0 && <span style={{ color: "#64748b", fontSize: "0.75rem" }}> ({m.ratings.length} review{m.ratings.length !== 1 ? "s" : ""})</span>}
                    </div>
                  )}

                  <button style={{ ...S.btn("primary"), width: "100%" }}
                    onClick={() => { 
                      setSelected(m);
                      setError(null);
                      setSlotsFetchError(null);
                      setAvailableSlots([]);
                      setSelectedSlot(null);
                      fetchAvailableSlots(m._id);
                    }}>
                    {"\uD83D\uDCE9"} Apply for Mentorship
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* -- MY MENTORSHIPS -- */}
        {tab === "my-mentorships" && !loading && (
          <>
            {sessions.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
                <div style={{ fontSize: "3rem" }}>{"\uD83D\uDCC5"}</div>
                <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#94a3b8", marginTop: "0.5rem" }}>No mentorships yet</p>
                <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Browse mentors and send a mentorship request to get started!</p>
                <button style={{ ...S.btn("primary"), marginTop: "1.5rem" }} onClick={() => setTab("browse")}>
                  {"\uD83D\uDD0D"} Find a Mentor {"\u2192"}
                </button>
              </div>
            )}
            {sessions.map(s => (
              <motion.div key={s._id}
                style={s.status === "confirmed" ? {
                  ...S.card, background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)"
                } : s.status === "pending" ? {
                  ...S.card, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)"
                } : S.card}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <span style={S.badge(s.status)}>{s.status}</span>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", marginTop: "0.5rem" }}>
                      {"\uD83C\uDFAF"} {s.topic || s.title}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      {"\uD83E\uDDD1\u200D\uD83C\uDFEB"} {s.mentorName || "Mentor"}  {"\u00B7"}  {"\u23F1"} {s.duration} min
                    </div>
                    {(s.scheduledAt || s.date) && (
                      <div style={{
                        marginTop: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        background: s.status === "confirmed" ? "rgba(6,182,212,0.1)" : "rgba(245,158,11,0.1)",
                        padding: "0.3rem 0.7rem", borderRadius: "0.5rem", fontSize: "0.85rem",
                        color: s.status === "confirmed" ? "#67e8f9" : "#fbbf24"
                      }}>
                        {"\uD83D\uDCC5"} {fmt(s.scheduledAt || s.date)}
                      </div>
                    )}
                    {s.learnerMessage && (
                      <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.4rem", fontStyle: "italic" }}>
                        {"\uD83D\uDCAC"} "{s.learnerMessage}"
                      </div>
                    )}
                    {s.status === "pending" && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#f59e0b" }}>
                        {"\u23F3"} Waiting for mentor to accept your request...
                      </div>
                    )}
                    {s.status === "rejected" && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#ef4444" }}>
                        {"\u274C"} This request was declined.{s.cancelReason && ` Reason: "${s.cancelReason}"`}
                      </div>
                    )}
                    {/* On-chain payment receipt */}
                    {s.txHash && (
                      <div style={{
                        marginTop: "0.6rem", padding: "0.5rem 0.7rem",
                        background: "rgba(6,182,212,0.07)", borderRadius: "0.5rem",
                        border: "1px solid rgba(6,182,212,0.2)", fontSize: "0.75rem",
                      }}>
                        <span style={{ color: "#67e8f9", fontWeight: 600 }}>⛓️ Payment tx: </span>
                        <a
                          href={`${BLOCK_EXPLORER}/tx/${s.txHash}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: "#06b6d4", fontFamily: "monospace", wordBreak: "break-all" }}
                        >
                          {s.txHash.slice(0, 10)}…{s.txHash.slice(-8)}
                        </a>
                        {s.sessionFee && (
                          <span style={{ marginLeft: "0.5rem", color: "#94a3b8" }}>({s.sessionFee} ETH)</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    {s.status === "confirmed" && s.roomId && (
                      <button style={S.btn("green")} onClick={() => joinRoom(s)}>
                        {"\uD83D\uDCF9"} Join Video Call
                      </button>
                    )}
                    {s.status === "completed" && s.rating && (
                      <div style={{ color: "#fbbf24", fontSize: "0.85rem" }}>
                        {"\u2B50".repeat(s.rating)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* -- APPLY MODAL -- */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
            }}
            onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setSlotsFetchError(null); } }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{ background: "#1e293b", borderRadius: "1.25rem", padding: "2rem", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "1.2rem", color: "#fff"
                }}>
                  {(selected.name || "M")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>Apply for Mentorship</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>with {selected.name}</div>
                </div>
              </div>

              <div style={{
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "0.7rem", padding: "0.8rem 1rem", marginBottom: "1.25rem",
                fontSize: "0.85rem", color: "#fbbf24"
              }}>
                {"\uD83D\uDCEC"} Your request will be sent to the mentor. You'll receive an <strong>email &amp; in-app notification</strong> once they accept.
              </div>

              {error && <div style={S.alert("error")}>{error}</div>}

              <label style={S.label}>Topic *</label>
              <input style={{ ...S.input, marginBottom: "1rem" }}
                value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. React hooks, System design, Career advice..." />

              <label style={S.label}>Message to mentor (optional)</label>
              <textarea style={{ ...S.input, marginBottom: "1.5rem", height: 75, resize: "vertical" }}
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Tell them your goals or what you need help with..." />

              {/* Available Slots */}
              <label style={S.label}>Available Time Slots *</label>
              {slotsLoading ? (
                <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8", marginBottom: "1.5rem" }}>
                  ⏳ Loading available slots...
                </div>
              ) : slotsFetchError ? (
                <div style={{
                  padding: "1rem", textAlign: "center", marginBottom: "1.5rem",
                  background: "rgba(239,68,68,0.08)", borderRadius: "0.6rem",
                  border: "1px solid rgba(239,68,68,0.25)"
                }}>
                  <div style={{ color: "#fca5a5", fontSize: "0.9rem", marginBottom: "0.75rem" }}>⚠️ {slotsFetchError}</div>
                  <button
                    style={{ ...S.btn(""), fontSize: "0.8rem", padding: "0.4rem 1rem" }}
                    onClick={() => fetchAvailableSlots(selected._id)}
                  >
                    🔄 Retry
                  </button>
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{
                  padding: "1rem", textAlign: "center", color: "#64748b", marginBottom: "1.5rem",
                  background: "rgba(255,255,255,0.03)", borderRadius: "0.6rem",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>📭</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "0.6rem", fontWeight: 500 }}>
                    No upcoming mentorship slots available.
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.8rem" }}>
                    This mentor hasn't scheduled any available time slots yet. Check back later or try another mentor.
                  </div>
                  <button
                    style={{ ...S.btn(""), fontSize: "0.8rem", padding: "0.4rem 1rem" }}
                    onClick={() => fetchAvailableSlots(selected._id)}
                  >
                    🔄 Refresh
                  </button>
                </div>
              ) : (
                <div style={{
                  display: "grid", gap: "0.5rem", marginBottom: "1.5rem",
                  maxHeight: "250px", overflowY: "auto", paddingRight: "0.5rem"
                }}>
                  {availableSlots.map(slot => {
                    const isSelected = selectedSlot?._id === slot._id;

                    return (
                      <label key={slot._id} style={{
                        display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem",
                        background: isSelected ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
                        border: isSelected ? "2px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "0.6rem", cursor: "pointer", transition: "all 0.2s"
                      }}>
                        <input
                          type="radio"
                          name="slot"
                          checked={isSelected}
                          onChange={() => setSelectedSlot(slot)}
                          style={{ cursor: "pointer", width: 18, height: 18 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                            📅 {slot.date} – {slot.startTime}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button style={{ ...S.btn("primary"), flex: 1, opacity: submitting ? 0.7 : 1 }} onClick={applyMentorship} disabled={submitting}>
                  {submitting ? "\u23F3 Sending Request..." : "\uD83D\uDCE9 Send Mentorship Request"}
                </button>
                <button style={S.btn("")} onClick={() => { setSelected(null); setError(null); setSelectedSlot(null); setSlotsFetchError(null); }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
