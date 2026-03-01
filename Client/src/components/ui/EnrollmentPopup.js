import React, { useState } from 'react';
import api from '../../services/api';

const EnrollmentPopup = ({ isOpen, course, learnerId, onClose, onEnrollSuccess }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !course) {
    return null;
  }

  const handleConfirm = async () => {
    const resolvedLearnerId = learnerId || localStorage.getItem('userId');
    if (!resolvedLearnerId) {
      setError('You must be logged in to enroll.');
      return;
    }

    setEnrolling(true);
    setError(null);
    try {
      await api.post('/courses/enroll', {
        learnerId: resolvedLearnerId,
        courseId: course._id,
      });
      onEnrollSuccess(course);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll in course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
          Enroll in Course
        </h2>
        <p className="text-white font-semibold mb-4">{course.title}</p>
        {course.price > 0 ? (
          <p className="text-gray-300 mb-2">
            Enrollment cost: <span className="text-green-400 font-bold">{course.price} tokens</span>
          </p>
        ) : (
          <p className="text-gray-300 mb-2">This course is <span className="text-fuchsia-400 font-bold">Free</span>.</p>
        )}
        <p className="text-gray-400 text-sm mb-4">
          {course.price > 0
            ? 'The token cost will be deducted from your wallet balance.'
            : 'No tokens required to enroll.'}
        </p>
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={enrolling}
            className="px-5 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={enrolling}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrolling ? 'Enrolling...' : 'Confirm Enroll'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPopup;
