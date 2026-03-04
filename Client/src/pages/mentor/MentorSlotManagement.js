import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

// Helpers
const token = () => localStorage.getItem("token");
const uid = () => localStorage.getItem("userId");

// Styles
const S = {
  page: { minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem 1rem" },
  wrap: { maxWidth: 900, margin: "0 auto" },
  h1: { fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" },
  sub: { color: "#94a3b8", marginBottom: "2rem" },
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "1.1rem", padding: "1.4rem", marginBottom: "1rem"
  },
  btn: (v) => ({
    padding: "0.55rem 1.3rem", borderRadius: "0.6rem", border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: "0.9rem",
    background: v === "primary" ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
              : v === "danger"  ? "rgba(239,68,68,0.15)"
              : v === "success" ? "rgba(34,197,94,0.15)"
              : "rgba(255,255,255,0.08)",
    color: v === "danger" ? "#ef4444" : v === "success" ? "#22c55e" : "#fff", 
    transition: "opacity 0.2s",
    cursor: "pointer"
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
  slotBadge: (status) => ({
    display: "inline-block", padding: "0.22rem 0.8rem", borderRadius: "2rem",
    fontSize: "0.72rem", fontWeight: 700,
    background: status === "available" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
    color: status === "available" ? "#86efac" : "#fca5a5",
    textTransform: "uppercase"
  }),
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem"
  }
};

export default function MentorSlotManagement() {
  const mentorId = uid();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "06:00",
    endTime: "08:00"
  });

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch slots on component mount
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/slots/mentor/${mentorId}/all`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setSlots(res.data.slots || []);
    } catch (err) {
      console.error("Failed to fetch slots:", err);
      setError("Failed to load your slots");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post(
        `/slots/mentor/${mentorId}/create`,
        formData,
        { headers: { Authorization: `Bearer ${token()}` } }
      );

      if (res.data.success) {
        setSuccess(`✅ ${res.data.message}`);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          startTime: "06:00",
          endTime: "08:00"
        });
        setTimeout(() => {
          setSuccess(null);
          fetchSlots();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create slots");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Delete this slot?")) return;

    try {
      await api.delete(`/slots/${slotId}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setSuccess("✅ Slot deleted");
      setTimeout(() => {
        setSuccess(null);
        fetchSlots();
      }, 1500);
    } catch (err) {
      setError("Failed to delete slot");
    }
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <h1 style={S.h1}>📅 Manage Your Time Slots</h1>
        <p style={S.sub}>Create time slots for learners to book your mentorship sessions.</p>

        {error && <div style={S.alert("error")}>{error}</div>}
        {success && <div style={S.alert("success")}>{success}</div>}

        {/* Create Slots Form */}
        <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
            ➕ Create New Time Slots
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {/* Date */}
              <div>
                <label style={S.label}>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  style={S.input}
                  required
                />
              </div>

              {/* Start Time */}
              <div>
                <label style={S.label}>Start Time *</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  style={S.input}
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label style={S.label}>End Time *</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  style={S.input}
                  required
                />
              </div>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem" }}>
              💡 Auto-generates 60-minute slots between start and end times
            </p>

            <button type="submit" style={{ ...S.btn("primary"), width: "100%" }} disabled={submitting}>
              {submitting ? "⏳ Creating..." : "✨ Create Slots"}
            </button>
          </form>
        </motion.div>

        {/* Available Slots */}
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>
            📆 Your Slots
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
              ⏳ Loading slots...
            </div>
          ) : slots.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: "2rem", ...S.card }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
              <p>No slots created yet. Create your first slot above!</p>
            </div>
          ) : (
            <div style={S.grid}>
              {slots.map(slot => (
                <motion.div
                  key={slot._id}
                  style={S.card}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                        📅 {formatDateTime(slot.startTime)}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                        to {new Date(slot.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <span style={S.slotBadge(slot.status)}>
                      {slot.status}
                    </span>
                  </div>

                  {slot.status === "available" && (
                    <button
                      onClick={() => handleDeleteSlot(slot._id)}
                      style={{ ...S.btn("danger"), width: "100%", marginTop: "0.75rem" }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
