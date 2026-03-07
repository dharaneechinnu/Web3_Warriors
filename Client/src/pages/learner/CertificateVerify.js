import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";
import { downloadCertificate } from "../../utils/certificateGenerator";

/* ── styles ─────────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",
    padding: "2rem 1rem",
    fontFamily: "'Segoe UI','Helvetica Neue',sans-serif",
    color: "#f1f5f9",
  },
  container: { maxWidth: 780, margin: "0 auto" },
  spinner: { textAlign: "center", padding: "6rem 2rem", color: "#94a3b8", fontSize: "1.1rem" },
  errorBox: {
    textAlign: "center", padding: "4rem 2rem",
    background: "rgba(239,68,68,0.08)", borderRadius: "1rem",
    border: "1px solid rgba(239,68,68,0.2)",
  },
  /* Verified top banner */
  verifiedBanner: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: "0.75rem", padding: "0.75rem 1.5rem",
    marginBottom: "1.75rem",
    color: "#4ade80", fontWeight: 700, fontSize: "1rem",
  },
  /* main certificate card */
  certCard: {
    background: "#fefce8",
    borderRadius: "1.25rem",
    overflow: "hidden",
    border: "3px solid #b8860b",
    boxShadow: "0 0 60px rgba(184,134,11,0.2), 0 20px 60px rgba(0,0,0,0.5)",
    marginBottom: "2rem",
  },
  certTop: {
    background: "linear-gradient(135deg,#1e3a5f 0%,#7c3aed 60%,#b8860b 100%)",
    padding: "2rem 2.5rem 1.5rem",
    textAlign: "center",
  },
  certTopLabel: {
    color: "#daa520", fontWeight: 700, fontSize: "0.8rem",
    letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem",
  },
  certTopTitle: {
    color: "#fff", fontSize: "1.8rem", fontWeight: 800,
    fontFamily: "'Georgia','Times New Roman',serif",
    marginBottom: "0.25rem",
  },
  certTopSub: { color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" },
  certBody: { padding: "2rem 2.5rem" },
  awardedTo: { color: "#64748b", fontSize: "0.9rem", textAlign: "center", marginBottom: "0.4rem" },
  learnerName: {
    fontSize: "2.2rem", fontWeight: 800, color: "#1e3a5f",
    textAlign: "center", fontFamily: "'Georgia','Times New Roman',serif",
    marginBottom: "0.25rem",
  },
  learnerUnderline: {
    height: 2, background: "#daa520", width: "60%",
    margin: "0 auto 1.25rem",
  },
  completedFor: { color: "#64748b", fontSize: "0.88rem", textAlign: "center", marginBottom: "0.4rem" },
  courseName: {
    fontSize: "1.2rem", fontWeight: 700, color: "#7c3aed",
    textAlign: "center", fontFamily: "'Georgia','Times New Roman',serif",
    marginBottom: "1.5rem",
    wordBreak: "break-word",
  },
  metaRow: {
    display: "flex", justifyContent: "center", gap: "2.5rem",
    flexWrap: "wrap", marginBottom: "1.5rem",
  },
  metaItem: { textAlign: "center" },
  metaLabel: { color: "#94a3b8", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" },
  metaValue: { color: "#1e293b", fontWeight: 700, fontSize: "0.95rem" },
  sigRow: {
    display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1rem",
    borderTop: "1px solid #daa52066", paddingTop: "1.25rem", marginTop: "0.5rem",
  },
  sigBox: { textAlign: "center" },
  sigName: { color: "#1e293b", fontSize: "1rem", fontWeight: 700, fontFamily: "'Georgia',serif" },
  sigLine: { width: 140, height: 1, background: "#94a3b8", margin: "0.35rem auto 0.25rem" },
  sigRole: { color: "#64748b", fontSize: "0.78rem" },
  credId: {
    textAlign: "center", color: "#94a3b8", fontSize: "0.72rem",
    fontFamily: "monospace", letterSpacing: "0.04em",
    paddingBottom: "1.25rem",
  },
  actionsRow: {
    display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem",
  },
  btn: (v) => ({
    padding: "0.6rem 1.4rem", borderRadius: "0.65rem", border: "none",
    cursor: "pointer", fontWeight: 700, fontSize: "0.88rem", transition: "opacity 0.2s",
    ...(v === "primary"
      ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff" }
      : v === "green"
      ? { background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }
      : { background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.12)" }),
  }),
  shareBox: {
    background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: "1rem", padding: "1.25rem 1.5rem", textAlign: "center",
  },
  shareLabel: { color: "#a78bfa", fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.88rem" },
  shareUrl: {
    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "0.5rem", padding: "0.6rem 1rem", color: "#c4b5fd",
    fontSize: "0.78rem", fontFamily: "monospace", wordBreak: "break-all",
    marginBottom: "0.75rem", textAlign: "left",
    display: "block",
  },
  toast: {
    position: "fixed", bottom: "2rem", right: "2rem",
    background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)",
    borderRadius: "0.75rem", padding: "0.75rem 1.25rem",
    color: "#4ade80", fontWeight: 600, fontSize: "0.9rem", zIndex: 2000,
  },
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.6rem", padding: "0.45rem 0.9rem",
    color: "#94a3b8", fontSize: "0.85rem", cursor: "pointer", marginBottom: "1.5rem",
  },
};

const gradeColor = (g) => {
  if (!g || g === "Pass") return "#4ade80";
  if (g === "A+" || g === "A") return "#4ade80";
  if (g === "B+" || g === "B") return "#60a5fa";
  return "#fbbf24";
};

export default function CertificateVerify() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/courses/certificate/verify/${certificateId}`);
        if (res.data.success) {
          setCert(res.data.certificate);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("[CertificateVerify]", err?.response?.data || err.message);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (certificateId) fetchCert();
  }, [certificateId]);

  const handleDownload = () => {
    if (!cert) return;
    downloadCertificate({
      learnerName: cert.learnerName || "Learner",
      courseName: cert.courseName,
      mentorName: cert.mentorName || "Instructor",
      certificateId: cert.certificateId,
      completedDate: cert.completedDate,
      grade: cert.grade || "Pass",
    });
  };

  const handleCopy = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => showToast("✅ Verification link copied!"));
  };

  const shareUrl = `${window.location.origin}/certificate/${certificateId}`;

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <div style={S.spinner}>🔍 Verifying certificate...</div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <div style={S.errorBox}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
            <div style={{ color: "#fca5a5", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Certificate Not Found
            </div>
            <div style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              This certificate ID does not exist or may have been revoked.
            </div>
            <button style={S.btn("primary")} onClick={() => navigate("/")}>
              ← Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completedStr = cert?.completedDate
    ? new Date(cert.completedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  /* ── resolved learnerName ─────────────────────────────────────── */
  const learnerName =
    cert.learnerName ||
    cert.userId?.name ||
    cert.userId?.email ||
    "Learner";

  const courseName = cert.courseName || cert.courseId?.title || "Course";
  const mentorName = cert.mentorName || cert.mentorId?.name || cert.mentorId?.email || "Instructor";

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* back button (visible only if user has history) */}
        <button style={S.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* ── Verified banner ──────────────────────────────────── */}
        <motion.div style={S.verifiedBanner} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <span style={{ fontSize: "1.2rem" }}>✅</span>
          <span>Authentic Certificate — Issued by HackVerse Academy</span>
        </motion.div>

        {/* ── Certificate card ─────────────────────────────────── */}
        <motion.div style={S.certCard} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          {/* Coloured top */}
          <div style={S.certTop}>
            <div style={S.certTopLabel}>★&nbsp;&nbsp;HackVerse Academy&nbsp;&nbsp;★</div>
            <div style={S.certTopTitle}>Certificate of Completion</div>
            <div style={S.certTopSub}>Issued upon successful course completion</div>
          </div>

          {/* Body */}
          <div style={S.certBody}>
            <div style={S.awardedTo}>This certificate is proudly awarded to</div>
            <div style={S.learnerName}>{learnerName}</div>
            <div style={S.learnerUnderline} />

            <div style={S.completedFor}>for successfully completing the course</div>
            <div style={S.courseName}>{courseName}</div>

            {/* Meta */}
            <div style={S.metaRow}>
              <div style={S.metaItem}>
                <div style={S.metaLabel}>Completed On</div>
                <div style={S.metaValue}>{completedStr}</div>
              </div>
              <div style={S.metaItem}>
                <div style={S.metaLabel}>Grade</div>
                <div style={{ ...S.metaValue, color: gradeColor(cert.grade) }}>{cert.grade || "Pass"}</div>
              </div>
              {cert.nftTokenId != null && (
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>NFT Token</div>
                  <div style={{ ...S.metaValue, color: "#a78bfa" }}>#{cert.nftTokenId}</div>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div style={S.sigRow}>
              <div style={S.sigBox}>
                <div style={S.sigName}>{mentorName}</div>
                <div style={S.sigLine} />
                <div style={S.sigRole}>Course Instructor</div>
              </div>
              <div style={S.sigBox}>
                <div style={S.sigName}>HackVerse Academy</div>
                <div style={S.sigLine} />
                <div style={S.sigRole}>Platform</div>
              </div>
            </div>

            {/* Credential ID */}
            <div style={S.credId}>Certificate ID: {cert.certificateId}</div>
          </div>
        </motion.div>

        {/* ── Action buttons ─────────────────────────────────── */}
        <div style={S.actionsRow}>
          <button style={S.btn("primary")} onClick={handleDownload}>⬇ Download PDF / PNG</button>
          <button style={S.btn("")} onClick={handleCopy}>🔗 Copy Link</button>
        </div>

        {/* ── Share section ──────────────────────────────────── */}
        <div style={S.shareBox}>
          <div style={S.shareLabel}>🔗 Share this credential</div>
          <span style={S.shareUrl}>{shareUrl}</span>
          <button style={S.btn("green")} onClick={handleCopy}>Copy Verification URL</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div style={S.toast} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {toast}
        </motion.div>
      )}
    </div>
  );
}
