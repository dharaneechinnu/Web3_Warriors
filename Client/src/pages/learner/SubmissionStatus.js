import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

const statusColors = {
  submitted: "bg-yellow-700 text-yellow-100",
  graded: "bg-green-700 text-green-100",
  returned: "bg-blue-700 text-blue-100",
  needs_revision: "bg-red-700 text-red-100",
};

const SubmissionStatus = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [learnerId] = useState(localStorage.getItem("userId"));

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const courseParam = selectedCourse !== "all" ? selectedCourse : "all";
      const url = courseParam !== "all"
        ? `/courses/submissions/learner/${learnerId}/${courseParam}`
        : `/courses/submissions/learner/${learnerId}/all`;
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [learnerId, selectedCourse]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/courses/enrolled/${learnerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEnrolledCourses(res.data.courses || res.data || []);
      } catch {
        setEnrolledCourses([]);
      }
    };
    fetchCourses();
  }, [learnerId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6 pt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Submissions</h1>
        <p className="text-gray-400 mb-6">Track the status of your assignment submissions.</p>

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {/* Course filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCourse("all")}
            className={`px-3 py-1 rounded-full text-sm ${selectedCourse === "all" ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"}`}
          >
            All Courses
          </button>
          {enrolledCourses.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCourse(c._id)}
              className={`px-3 py-1 rounded-full text-sm ${selectedCourse === c._id ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"}`}
            >
              {c.title || c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No submissions found.</p>
            <p className="text-gray-600 text-sm mt-2">Complete lectures with assignments to see them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <motion.div
                key={sub._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800/60 border border-gray-700 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">Lecture: {sub.lectureId}</p>
                    <p className="text-gray-400 text-sm">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                    {sub.gradedAt && (
                      <p className="text-gray-400 text-sm">Reviewed: {new Date(sub.gradedAt).toLocaleString()}</p>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${statusColors[sub.status] || "bg-gray-700"}`}>
                    {sub.status?.replace("_", " ") || "submitted"}
                  </span>
                </div>

                {sub.description && (
                  <p className="text-gray-300 text-sm mb-3">{sub.description}</p>
                )}

                {sub.fileUrl && (
                  <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-purple-400 text-sm underline block mb-3">
                    📎 View submitted file
                  </a>
                )}

                {/* Grade & feedback shown after review */}
                {(sub.grade !== null && sub.grade !== undefined) && (
                  <div className="bg-gray-900/60 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Grade</p>
                        <p className="text-2xl font-bold text-green-400">{sub.grade}</p>
                      </div>
                      {sub.feedback && (
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">Mentor Feedback</p>
                          <p className="text-gray-300 text-sm">{sub.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {sub.status === "needs_revision" && (
                  <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-sm font-medium">⚠ Revision needed — go to your course to resubmit.</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SubmissionStatus;
