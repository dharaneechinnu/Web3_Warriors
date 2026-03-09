import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Reusable blockchain transaction status overlay.
 *
 * Props:
 *   visible  : boolean
 *   status   : "wallet" | "pending" | "success" | "error"
 *   message  : string (optional override)
 *   txHash   : string (optional, shown on success)
 *   onClose  : () => void
 *   explorer : string (block explorer base URL, default Sepolia etherscan)
 */

const LABELS = {
  wallet:  { icon: "🦊", title: "Confirm in MetaMask",     sub: "Please confirm the transaction in your wallet." },
  pending: { icon: "⏳", title: "Transaction Processing",   sub: "Waiting for blockchain confirmation…" },
  success: { icon: "✅", title: "Transaction Confirmed",    sub: "Your transaction was successful!" },
  error:   { icon: "❌", title: "Transaction Failed",       sub: "Something went wrong." },
};

const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  card: {
    background: "linear-gradient(145deg, #1e293b, #0f172a)",
    border: "1px solid rgba(124,58,237,0.3)", borderRadius: "1.25rem",
    padding: "2.5rem 2rem", maxWidth: 420, width: "90%",
    textAlign: "center", boxShadow: "0 16px 60px rgba(0,0,0,0.5)",
  },
  icon: { fontSize: "3.5rem", marginBottom: "1rem" },
  title: { fontSize: "1.35rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" },
  sub: { color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.25rem" },
  spinner: {
    width: 48, height: 48, margin: "0 auto 1.25rem",
    border: "3px solid rgba(124,58,237,0.25)", borderTopColor: "#d946ef",
    borderRadius: "50%", animation: "txSpin 0.8s linear infinite",
  },
  txLink: {
    display: "inline-block", marginBottom: "1rem",
    color: "#06b6d4", fontSize: "0.85rem", wordBreak: "break-all",
    textDecoration: "underline",
  },
  btn: {
    padding: "0.65rem 2rem", borderRadius: "0.6rem", border: "none",
    fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
    background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff",
    transition: "transform 0.15s",
  },
};

const keyframes = `@keyframes txSpin { to { transform: rotate(360deg); } }`;

const TransactionStatus = ({
  visible,
  status = "wallet",
  message,
  txHash,
  onClose,
  explorer = "https://sepolia.etherscan.io",
}) => {
  const info = LABELS[status] || LABELS.wallet;

  return (
    <>
      <style>{keyframes}</style>
      <AnimatePresence>
        {visible && (
          <motion.div
            style={S.overlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              style={S.card}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {status === "pending" ? (
                <div style={S.spinner} />
              ) : (
                <div style={S.icon}>{info.icon}</div>
              )}

              <div style={S.title}>{info.title}</div>
              <div style={S.sub}>{message || info.sub}</div>

              {txHash && status === "success" && (
                <a
                  href={`${explorer}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={S.txLink}
                >
                  View on Explorer &rarr;
                </a>
              )}

              {(status === "success" || status === "error") && onClose && (
                <div>
                  <button style={S.btn} onClick={onClose}>
                    {status === "success" ? "Done" : "Close"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TransactionStatus;
