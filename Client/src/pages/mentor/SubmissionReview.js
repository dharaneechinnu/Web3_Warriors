import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

const statusColors = {
  submitted: "bg-yellow-700 text-yellow-100",
  graded: "bg-green-700 text-green-100",
  returned: "bg-blue-700 text-blue-100",
  needs_revision: "bg-red-700 text-red-100",
};

const SubmissionReview = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mentorId] = useState(localStorage.getItem("userId"));

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/courses/mentor/${mentorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data.courses || res.data || []);
      } catch {
        setError("Failed to load courses");
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, [mentorId]);

  const fetchSubmissions = useCallback(async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/courses/submissions/mentor/${courseId}?mentorId=${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    fetchSubmissions(course._id);
  };

  const handleGrade = async (submissionId, status, grade, feedback) => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      await api.put(
        `/courses/submissions/${submissionId}/grade`,
        { mentorId, status, grade, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Submission reviewed successfully!");
      fetchSubmissions(selectedCourse._id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review submission");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6 pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Submission Review</h1>
        <p className="text-gray-400 mb-6">Grade and review student assignment submissions.</p>

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-3 hover:text-white">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-green-900/40 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">{success}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course list */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Courses</h2>
            {coursesLoading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : courses.length === 0 ? (
              <p className="text-gray-500 text-sm">No courses yet.</p>
            ) : (
              <div className="space-y-2">
                {courses.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleSelectCourse(c)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${
                      selectedCourse?._id === c._id
                        ? "bg-purple-700 text-white"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    {c.title || c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submissions panel */}
          <div className="lg:col-span-3">
            {!selectedCourse ? (
              <div className="text-center py-20 text-gray-500">Select a course to view submissions.</div>
            ) : loading ? (
              <div className="text-center py-20 text-gray-400">Loading submissions…</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No submissions for this course yet.</div>
            ) : (
              <div className="space-y-5">
                {submissions.map((sub) => (
                  <SubmissionGradeCard key={sub._id} sub={sub} onGrade={handleGrade} />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SubmissionGradeCard = ({ sub, onGrade }) => {
  const [grade, setGrade] = useState(sub.grade ?? "");
  const [feedback, setFeedback] = useState(sub.feedback || "");
  const [status, setStatus] = useState(sub.status === "submitted" ? "graded" : sub.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onGrade(sub._id, status, grade, feedback);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/60 border border-gray-700 rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-lg">{sub.learnerName || "Learner"}</p>
          <p className="text-gray-400 text-sm">{sub.learnerEmail}</p>
          <p className="text-gray-500 text-xs mt-1">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
          sub.status === "submitted" || !sub.status ? "bg-yellow-700 text-yellow-100" : "bg-green-700 text-green-100"
        }`}>
          {(sub.status || "submitted").replace("_", " ")}
        </span>
      </div>

      {sub.description && (
        <div className="bg-gray-900/60 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-400 mb-1">Submission</p>
          <p className="text-gray-200 text-sm">{sub.description}</p>
        </div>
      )}

      {sub.fileUrl && (
        <a href={sub.fileUrl} target="_blank" rel="noreferrer"
          className="text-purple-400 text-sm underline block mb-4">
          📎 View submission file
        </a>
      )}

      {sub.submissionUrl && (
        <a href={sub.submissionUrl} target="_blank" rel="noreferrer"
          className="text-purple-400 text-sm underline block mb-4">
          🔗 View submission link
        </a>
      )}

      {/* Grade form */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Review</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Status</label>
            <select
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="graded">Graded ✅</option>
              <option value="returned">Returned 🔄</option>
              <option value="needs_revision">Needs Revision ⚠</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Grade (0–100)</label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="—"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Feedback</label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="Short feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Review"}
        </button>
      </div>
    </motion.div>
  );
};

export default SubmissionReview;
