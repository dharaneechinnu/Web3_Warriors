import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { downloadCertificate } from "../../utils/certificateGenerator";
import { ownerOf, tokenURI, getCertificatesForUser } from "../../web3/services/certificateNFTService";
import { BLOCK_EXPLORER } from "../../web3/config";

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
  const [verifying, setVerifying] = useState(null); // certId being verified on-chain
  const [chainData, setChainData] = useState({}); // { certId: { owner, uri, verified } }

  // On-chain NFT collection (scanned from CertificateNFT contract)
  const [nfts, setNfts] = useState([]);        // [{ tokenId, uri }]
  const [nftLoading, setNftLoading] = useState(false);

  const uid = () => localStorage.getItem("userId");
  const walletKey = uid() ? `walletAddress:${uid()}` : 'walletAddress';

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

  // Fetch on-chain NFTs for the connected wallet
  const fetchNFTs = useCallback(async () => {
    const userId = uid();
    const key = userId ? `walletAddress:${userId}` : 'walletAddress';
    const walletAddress = localStorage.getItem(key);
    if (!walletAddress) return;
    setNftLoading(true);
    try {
      const tokens = await getCertificatesForUser(walletAddress);
      setNfts(tokens);
    } catch (err) {
      console.error("[MyCertificates] NFT fetch error:", err);
    } finally {
      setNftLoading(false);
    }
  }, []);

  useEffect(() => { fetchCertificates(); fetchNFTs(); }, [fetchCertificates, fetchNFTs]);

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
    if (!cert.nftTokenId && cert.nftTokenId !== 0) {
      showToast('No NFT token ID found for this certificate.');
      return;
    }
    const key = cert.certificateId;
    setVerifying(key);
    try {
      const [owner, uri] = await Promise.all([
        ownerOf(cert.nftTokenId),
        tokenURI(cert.nftTokenId),
      ]);
      setChainData(prev => ({
        ...prev,
        [key]: { owner, uri, verified: true, error: null },
      }));
      showToast('✅ NFT verified on blockchain!');
    } catch (err) {
      setChainData(prev => ({
        ...prev,
        [key]: { verified: false, error: err.message || 'Verification failed' },
      }));
    } finally {
      setVerifying(null);
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
                        <span style={{ ...S.value, color: "#a78bfa" }}>#{cert.nftTokenId}</span>
                      </div>
                    )}

                    {/* On-chain verification result */}
                    {chainData[cert.certificateId]?.verified && (
                      <div style={{
                        background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
                        borderRadius: "0.5rem", padding: "0.6rem 0.75rem", marginTop: "0.5rem",
                        fontSize: "0.78rem", color: "#86efac"
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>✅ Blockchain Verified</div>
                        <div style={{ color: "#94a3b8", wordBreak: "break-all" }}>
                          Owner: {chainData[cert.certificateId].owner}
                        </div>
                      </div>
                    )}
                    {chainData[cert.certificateId]?.error && (
                      <div style={{
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: "0.5rem", padding: "0.6rem 0.75rem", marginTop: "0.5rem",
                        fontSize: "0.78rem", color: "#fca5a5"
                      }}>
                        ⚠️ {chainData[cert.certificateId].error}
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
                      <button style={S.btn("")} onClick={() => handleCopyLink(cert)}>
                        🔗 Share
                      </button>
                      {cert.nftTokenId != null && (
                        <button
                          style={S.btn("")}
                          onClick={() => handleVerifyOnChain(cert)}
                          disabled={verifying === cert.certificateId}
                        >
                          {verifying === cert.certificateId ? "⏳" : "⛓️"} {verifying === cert.certificateId ? "Checking…" : "On-Chain"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── On-Chain NFT Section ───────────────────────────────── */}
      <div style={{ marginTop: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ ...S.title, fontSize: "1.3rem" }}>⛓️ Blockchain NFT Certificates</div>
          <button
            style={{ ...S.btn(""), fontSize: "0.8rem", padding: "0.4rem 0.9rem" }}
            onClick={fetchNFTs}
            disabled={nftLoading}
          >
            {nftLoading ? "⏳ Scanning…" : "🔄 Refresh"}
          </button>
        </div>

        {!localStorage.getItem(walletKey) && (
          <div style={{ color: "#64748b", fontSize: "0.9rem", padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)" }}>
            🔗 Connect your MetaMask wallet on login to view your on-chain certificate NFTs.
          </div>
        )}

        {localStorage.getItem(walletKey) && !nftLoading && nfts.length === 0 && (
          <div style={{ color: "#64748b", fontSize: "0.9rem", padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.07)" }}>
            🎓 No NFT certificates found on-chain yet. Complete a course to earn one!
          </div>
        )}

        {nfts.length > 0 && (
          <div style={S.grid}>
            {nfts.map(nft => (
              <motion.div
                key={nft.tokenId}
                style={{ ...S.card, borderColor: "rgba(124,58,237,0.4)" }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <div style={{ ...S.banner, background: "linear-gradient(135deg,#1e1b4b,#7c3aed,#06b6d4)" }}>
                  <div style={S.bannerBadge}>NFT #{nft.tokenId}</div>
                  <div style={S.bannerIcon}>🏅</div>
                  <div style={S.bannerCourse}>Certificate NFT #{nft.tokenId}</div>
                  <div style={S.bannerMentor}>⛓️ On-chain credential</div>
                </div>
                <div style={S.body}>
                  {nft.uri && (
                    <div style={S.infoRow}>
                      <span style={S.label}>Metadata URI</span>
                      <a
                        href={nft.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#06b6d4", fontSize: "0.78rem", wordBreak: "break-all" }}
                      >
                        {nft.uri.length > 40 ? nft.uri.slice(0, 40) + "…" : nft.uri}
                      </a>
                    </div>
                  )}
                  <div style={{ ...S.certId, color: "#06b6d4", borderColor: "rgba(6,182,212,0.2)" }}>
                    Token ID: {nft.tokenId}
                  </div>
                  <div style={S.actions}>
                    <a
                      href={`${BLOCK_EXPLORER}/token/${localStorage.getItem(walletKey)}?tab=nfts`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...S.btn("primary"), textDecoration: "none", fontSize: "0.82rem" }}
                    >
                      🔍 View on Explorer
                    </a>
                    <button
                      style={S.btn("green")}
                      onClick={() => handleVerifyOnChain({ nftTokenId: nft.tokenId, certificateId: `nft-${nft.tokenId}` })}
                      disabled={verifying === `nft-${nft.tokenId}`}
                    >
                      {verifying === `nft-${nft.tokenId}` ? "⏳" : "⛓️"} Verify
                    </button>
                  </div>
                  {chainData[`nft-${nft.tokenId}`]?.verified && (
                    <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "0.5rem", padding: "0.6rem", marginTop: "0.75rem", fontSize: "0.78rem", color: "#86efac" }}>
                      ✅ Owner: {chainData[`nft-${nft.tokenId}`].owner?.slice(0, 10)}…
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
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
