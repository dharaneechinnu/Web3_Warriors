import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const LearnerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", skills: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({ enrolled: 0, completed: 0, tokens: 0, submissions: 0 });
  const [learnerId] = useState(localStorage.getItem("userId"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const [profileRes, enrolledRes, completedRes, walletRes] = await Promise.all([
          api.get(`/User/${learnerId}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/courses/enrolled/${learnerId}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/courses/completed/${learnerId}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/wallet/${learnerId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const p = profileRes.data.user || profileRes.data;
        setProfile(p);
        setForm({ name: p.name || "", bio: p.bio || "", skills: (p.skills || []).join(", ") });

        const enrolled = enrolledRes.data.courses || enrolledRes.data || [];
        const completed = completedRes.data.completedCourses || completedRes.data || [];
        const wallet = walletRes.data.wallet || walletRes.data || {};
        setStats({
          enrolled: enrolled.length,
          completed: completed.length,
          tokens: wallet.balance || 0,
          totalEarned: wallet.totalEarned || 0,
        });
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [learnerId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      await api.put(
        `/User/profile/${learnerId}`,
        { name: form.name, bio: form.bio, skills },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile((prev) => ({ ...prev, name: form.name, bio: form.bio, skills }));
      setSuccess("Profile updated!");
      setEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6 pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">{success}</div>
        )}

        {/* Header card */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-purple-700 flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {profile?.name?.[0]?.toUpperCase() || "L"}
            </div>
            <div className="flex-1">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <input
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                  <textarea
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                  <input
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="Skills (comma-separated)"
                  />
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm">
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold">{profile?.name}</h1>
                    <button
                      onClick={() => setEditing(true)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full"
                    >
                      Edit Profile
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{profile?.email}</p>
                  <p className="text-gray-300 text-sm">{profile?.bio || "No bio added yet."}</p>
                  {profile?.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.skills.map((sk) => (
                        <span key={sk} className="bg-purple-900/60 text-purple-200 px-3 py-1 rounded-full text-xs">{sk}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Enrolled Courses", value: stats.enrolled, icon: "📚" },
            { label: "Completed", value: stats.completed, icon: "🎓" },
            { label: "Token Balance", value: stats.tokens, icon: "🪙" },
            { label: "Total Earned", value: stats.totalEarned, icon: "💰" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "My Courses", path: "/learner-dashboard", icon: "📚" },
              { label: "Wallet", path: "/wallet", icon: "💼" },
              { label: "Challenges", path: "/challenges", icon: "🏆" },
              { label: "Sessions", path: "/sessions", icon: "📅" },
              { label: "Submissions", path: "/submissions", icon: "📋" },
              { label: "Browse Courses", path: "/courses", icon: "🔍" },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex items-center gap-2 bg-gray-900/60 hover:bg-purple-900/40 border border-gray-700 hover:border-purple-500 rounded-lg p-3 transition text-sm"
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LearnerProfile;
