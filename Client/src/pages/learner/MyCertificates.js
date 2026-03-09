import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { downloadCertificate } from "../../utils/certificateGenerator";
import { Web3 } from 'web3';
import SkillPlatformABI from '../../web3/abi/SkillPlatformABI.json';
import { SKILL_PLATFORM_ADDRESS } from '../../services/contractAddress';

/* ── inline style helpers ─────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",
    padding: "2rem 1rem",
  },
  container: { maxWidth: 1080, margin: "0 auto" },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
  },
  count: {
    background: "rgba(124,58,237,0.2)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "9999px",
    padding: "0.25rem 0.8rem",
    color: "#a78bfa",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "rgba(30,27,75,0.7)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: "1.25rem",
    overflow: "hidden",
    backdropFilter: "blur(12px)",
  },
  /* gradient banner that mimics the certificate top bar */
  banner: {
    background: "linear-gradient(135deg,#1e3a5f 0%,#7c3aed 60%,#b8860b 100%)",
    padding: "2rem 1.5rem 1.5rem",
    position: "relative",
  },
  bannerBadge: {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "9999px",
    padding: "0.2rem 0.6rem",
    fontSize: "0.72rem",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: "0.05em",
  },
  bannerIcon: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  bannerCourse: {
    fontWeight: 800,
    fontSize: "1.05rem",
    color: "#fff",
    lineHeight: 1.3,
    marginBottom: "0.35rem",
    wordBreak: "break-word",
  },
  bannerMentor: { color: "rgba(255,255,255,0.7)", fontSize: "0.83rem" },
  body: { padding: "1.25rem 1.5rem 1.5rem" },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  label: { color: "#64748b", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" },
  value: { color: "#cbd5e1", fontSize: "0.88rem", fontWeight: 600 },
  certId: {
    fontFamily: "monospace",
    fontSize: "0.72rem",
    color: "#7c3aed",
    background: "rgba(124,58,237,0.1)",
    border: "1px solid rgba(124,58,237,0.2)",
    borderRadius: "0.4rem",
    padding: "0.35rem 0.6rem",
    marginTop: "0.75rem",
    marginBottom: "1.25rem",
    wordBreak: "break-all",
    letterSpacing: "0.04em",
  },
  actions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  btn: (v) => ({
    padding: "0.5rem 0.9rem",
    borderRadius: "0.6rem",
    border: "none",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 600,
    transition: "all 0.2s",
    ...(v === "primary"
      ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff" }
      : v === "green"
      ? { background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }
      : { background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }),
  }),
  empty: {
    textAlign: "center",
    padding: "5rem 2rem",
    color: "#64748b",
  },
  spinner: {
    textAlign: "center",
    padding: "5rem 2rem",
    color: "#94a3b8",
  },
  toast: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    background: "rgba(34,197,94,0.15)",
    border: "1px solid rgba(34,197,94,0.4)",
    borderRadius: "0.75rem",
    padding: "0.75rem 1.25rem",
    color: "#4ade80",
    fontWeight: 600,
    fontSize: "0.9rem",
    zIndex: 2000,
    maxWidth: "min(480px, 90vw)",
    wordBreak: "break-word",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.6rem",
    padding: "0.45rem 0.9rem",
    color: "#94a3b8",
    fontSize: "0.85rem",
    cursor: "pointer",
    marginBottom: "1.5rem",
  },
};

const gradeColor = (g) => {
  if (!g) return "#94a3b8";
  if (g === "A+" || g === "A") return "#4ade80";
  if (g === "B+" || g === "B") return "#60a5fa";
  if (g === "C+" || g === "C") return "#fbbf24";
  return "#94a3b8";
};

export default function MyCertificates() {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [downloading, setDownloading] = useState(null); // certId being downloaded
  const [verifyingOnChain, setVerifyingOnChain] = useState(null); // tokenId being verified

  const uid = () => localStorage.getItem("userId");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const fetchCertificates = useCallback(async () => {
    const userId = uid();
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/courses/certificate/user/${userId}`);
      setCerts(res.data.certificates || []);
    } catch (err) {
      console.error("[MyCertificates] fetch error:", err?.response?.data || err.message);
      setError("Failed to load certificates. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  const handleDownload = async (cert) => {
    setDownloading(cert.certificateId);
    try {
      downloadCertificate({
        learnerName: cert.learnerName || localStorage.getItem("userName") || "Learner",
        courseName: cert.courseName,
        mentorName: cert.mentorName || "Instructor",
        certificateId: cert.certificateId,
        completedDate: cert.completedDate,
        grade: cert.grade || "Pass",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleCopyLink = (cert) => {
    const url = `${window.location.origin}/certificate/${cert.certificateId}`;
    navigator.clipboard.writeText(url).then(() => showToast("✅ Verification link copied!"));
  };

  const handleVerify = (cert) => {
    navigate(`/certificate/${cert.certificateId}`);
  };

  const handleVerifyOnChain = async (cert) => {
    if (!cert.nftTokenId) return;
    setVerifyingOnChain(cert.nftTokenId);
    try {
      const provider = window.ethereum
        ? window.ethereum
        : 'http://127.0.0.1:7545'; // Ganache fallback (read-only)
      const web3 = new Web3(provider);
      const contract = new web3.eth.Contract(SkillPlatformABI, SKILL_PLATFORM_ADDRESS);
      const result = await contract.methods.verifyCertificate(cert.nftTokenId).call();
      const [learner, , courseName, mentorName, issuedAt] = result;
      const date = new Date(Number(issuedAt) * 1000).toLocaleDateString();
      showToast(`✅ On-chain verified! Course: ${courseName} · Mentor: ${mentorName} · Issued: ${date} · Holder: ${learner.slice(0, 8)}…`);
    } catch (err) {
      showToast('⚠️ On-chain verification failed: ' + err.message);
    } finally {
      setVerifyingOnChain(null);
    }
  };

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <div style={S.spinner}>⏳ Loading your certificates...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Back button */}
        <button style={S.backBtn} onClick={() => navigate("/learner-home")}>
          ← Back to Dashboard
        </button>

        {/* Page header */}
        <div style={S.header}>
          <div>
            <div style={S.title}>🏆 My Certificates</div>
            <div style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "0.25rem" }}>
              Verify, download, and share your earned credentials
            </div>
          </div>
          {certs.length > 0 && (
            <span style={S.count}>{certs.length} certificate{certs.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.75rem", padding: "1rem", color: "#fca5a5", marginBottom: "1.5rem" }}>
            {error}
            <button style={{ ...S.btn(""), marginLeft: "1rem", fontSize: "0.78rem" }} onClick={fetchCertificates}>Retry</button>
          </div>
        )}

        {!error && certs.length === 0 ? (
          <motion.div style={S.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎓</div>
            <div style={{ color: "#94a3b8", fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              No certificates yet
            </div>
            <div style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: 400, margin: "0 auto 2rem" }}>
              Complete all lectures in an enrolled course to earn your first certificate of completion.
            </div>
            <button style={S.btn("primary")} onClick={() => navigate("/learner-dashboard")}>
              📚 Browse My Courses
            </button>
          </motion.div>
        ) : (
          <div style={S.grid}>
            <AnimatePresence>
              {certs.map((cert, idx) => (
                <motion.div
                  key={cert._id || cert.certificateId}
                  style={S.card}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                >
                  {/* Colourful banner */}
                  <div style={S.banner}>
                    <div style={S.bannerBadge}>VERIFIED</div>
                    <div style={S.bannerIcon}>🎓</div>
                    <div style={S.bannerCourse}>{cert.courseName}</div>
                    <div style={S.bannerMentor}>👨‍🏫 {cert.mentorName || "Instructor"}</div>
                  </div>

                  {/* Card body */}
                  <div style={S.body}>
                    <div style={S.infoRow}>
                      <span style={S.label}>Completed</span>
                      <span style={S.value}>
                        {new Date(cert.completedDate).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>

                    <div style={S.infoRow}>
                      <span style={S.label}>Grade</span>
                      <span style={{ ...S.value, color: gradeColor(cert.grade), fontWeight: 700 }}>
                        {cert.grade || "Pass"}
                      </span>
                    </div>

                    {cert.nftTokenId != null && (
                      <div style={S.infoRow}>
                        <span style={S.label}>NFT Token</span>
                        <span style={{
                          ...S.value, color: "#a78bfa",
                          background: "rgba(124,58,237,0.12)",
                          padding: "0.15rem 0.5rem", borderRadius: "0.4rem", fontSize: "0.78rem",
                          fontFamily: "monospace"
                        }}>
                          ⛓ #{cert.nftTokenId}
                        </span>
                      </div>
                    )}

                    {/* Credential ID */}
                    <div style={S.certId}>
                      🔐 {cert.certificateId}
                    </div>

                    {/* Actions */}
                    <div style={S.actions}>
                      <button
                        style={S.btn("primary")}
                        onClick={() => handleDownload(cert)}
                        disabled={downloading === cert.certificateId}
                      >
                        {downloading === cert.certificateId ? "⏳" : "⬇"} Download
                      </button>
                      <button style={S.btn("green")} onClick={() => handleVerify(cert)}>
                        👁 View
                      </button>
                      {cert.nftTokenId != null && (
                        <button
                          style={{ ...S.btn("green"), background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
                          onClick={() => handleVerifyOnChain(cert)}
                          disabled={verifyingOnChain === cert.nftTokenId}
                        >
                          {verifyingOnChain === cert.nftTokenId ? "⏳" : "⛓"} On-Chain
                        </button>
                      )}
                      <button style={S.btn("")} onClick={() => handleCopyLink(cert)}>
                        🔗 Share
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            style={S.toast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
