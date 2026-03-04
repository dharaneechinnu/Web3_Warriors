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
  badge: (active) => ({
    display: "inline-block", padding: "0.22rem 0.8rem", borderRadius: "2rem",
    fontSize: "0.72rem", fontWeight: 700, background: active ? "#06b6d4" : "#64748b",
    color: "#fff", textTransform: "uppercase"
  })
};

const MentorAvailability = () => {
  const mentorId = uid();
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingDay, setEditingDay] = useState(null);

  const [formData, setFormData] = useState({
    dayOfWeek: "monday",
    startTime: "09:00",
    endTime: "17:00",
    sessionDuration: 60
  });

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const durations = [30, 45, 60, 90, 120];

  // Fetch availabilities
  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/availability/${mentorId}/availability`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setAvailabilities(res.data.availabilities || []);
    } catch (err) {
      console.error("Failed to fetch availabilities:", err);
      setError("Failed to load your availability settings.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit availability
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.startTime || !formData.endTime) {
        setError("Please enter both start and end times.");
        setLoading(false);
        return;
      }

      const startMin = parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1]);
      const endMin = parseInt(formData.endTime.split(':')[0]) * 60 + parseInt(formData.endTime.split(':')[1]);

      if (startMin >= endMin) {
        setError("Start time must be before end time.");
        setLoading(false);
        return;
      }

      // Save availability
      await api.post(`/availability/${mentorId}/availability`, formData, {
        headers: { Authorization: `Bearer ${token()}` }
      });

      // Auto-generate slots after setting availability
      setSuccess("⏳ Generating time slots for next 30 days...");
      
      try {
        const slotsRes = await api.post(`/availability/${mentorId}/generate-slots`, 
          { daysAhead: 30 }, 
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        
        setSuccess(`✅ Availability saved! ${slotsRes.data.message || 'Time slots generated for learners to book.'}`);
      } catch (slotErr) {
        console.error("Slot generation warning:", slotErr);
        setSuccess("✅ Availability saved! (Slot generation will continue in background)");
      }

      setEditingDay(null);
      setFormData({ dayOfWeek: "monday", startTime: "09:00", endTime: "17:00", sessionDuration: 60 });
      
      setTimeout(() => {
        setSuccess(null);
        fetchAvailabilities();
      }, 2500);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to set availability.");
    } finally {
      setLoading(false);
    }
  };

  // Delete availability
  const handleDelete = async (availabilityId) => {
    if (!window.confirm("Delete this availability slot?")) return;

    setLoading(true);
    try {
      await api.delete(`/availability/availability/${availabilityId}`, {
        headers: { Authorization: `Bearer ${token()}` },
        data: { mentorId }
      });
      setSuccess("✅ Availability deleted");
      setTimeout(() => {
        setSuccess(null);
        fetchAvailabilities();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete availability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <h1 style={S.h1}>⏰ Availability Settings</h1>
        <p style={S.sub}>Set your availability so learners can book mentorship sessions with you.</p>

        {error && <div style={S.alert("error")}>{error}</div>}
        {success && <div style={S.alert("success")}>{success}</div>}

        {/* Form */}
        {editingDay && (
          <motion.div style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Add/Edit Availability</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                {/* Day selection */}
                <div>
                  <label style={S.label}>Day of Week *</label>
                  <select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleChange}
                    style={{ ...S.input, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day} style={{ background: "#1e293b", color: "#fff" }}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time range */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={S.label}>Start Time *</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      style={S.input}
                    />
                  </div>
                  <div>
                    <label style={S.label}>End Time *</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      style={S.input}
                    />
                  </div>
                </div>

                {/* Session duration */}
                <div>
                  <label style={S.label}>Session Duration *</label>
                  <select
                    name="sessionDuration"
                    value={formData.sessionDuration}
                    onChange={handleChange}
                    style={{ ...S.input, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                  >
                    {durations.map(dur => (
                      <option key={dur} value={dur} style={{ background: "#1e293b", color: "#fff" }}>
                        {dur} minutes
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="submit" style={{ ...S.btn("primary"), flex: 1 }} disabled={loading}>
                  {loading ? "⏳ Saving..." : "💾 Save Availability"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  style={S.btn("")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Current availabilities */}
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", marginTop: "2rem" }}>
            Your Current Availability
          </h3>

          {loading && !editingDay ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>⏳ Loading...</div>
          ) : availabilities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              <p>No availability set yet.</p>
              <button
                style={{ ...S.btn("primary"), marginTop: "1rem" }}
                onClick={() => setEditingDay("monday")}
              >
                ➕ Add Availability
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {daysOfWeek.map(day => {
                const avail = availabilities.find(a => a.dayOfWeek === day);
                return (
                  <motion.div key={day} style={S.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, textTransform: "capitalize" }}>
                          📅 {day}
                        </div>
                        {avail ? (
                          <div style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                            🕐 {avail.startTime} – {avail.endTime} ({avail.sessionDuration} min slots)
                          </div>
                        ) : (
                          <div style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                            Not set
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          style={S.btn("primary")}
                          onClick={() => {
                            if (avail) {
                              setFormData({
                                dayOfWeek: day,
                                startTime: avail.startTime,
                                endTime: avail.endTime,
                                sessionDuration: avail.sessionDuration
                              });
                            } else {
                              setFormData({ dayOfWeek: day, startTime: "09:00", endTime: "17:00", sessionDuration: 60 });
                            }
                            setEditingDay(day);
                          }}
                        >
                          {avail ? "✏️ Edit" : "➕ Add"}
                        </button>
                        {avail && (
                          <button
                            style={S.btn("danger")}
                            onClick={() => handleDelete(avail._id)}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        <div style={{
          background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)",
          borderRadius: "0.7rem", padding: "1rem", marginTop: "2rem",
          fontSize: "0.85rem", color: "#67e8f9"
        }}>
          ℹ️ <strong>How it works:</strong> Set your availability for each day, and the system will automatically generate time slots. 
          Learners can then select from your available slots when booking mentorship sessions.
        </div>
      </div>
    </div>
  );
};

export default MentorAvailability;
