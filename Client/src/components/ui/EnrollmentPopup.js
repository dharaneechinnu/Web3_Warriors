import React, { useState } from 'react';
import api from '../../services/api';

const EnrollmentPopup = ({ isOpen, onClose, course, onEnrollSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !course) {
    return null;
  }

  const handleEnroll = async () => {
    const learnerId = localStorage.getItem('userId');
    if (!learnerId) {
      setError('You must be logged in to enroll in a course.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tokenCost = course.price > 0 ? course.price : 1;
      await api.post('/courses/enroll', {
        learnerId,
        courseId: course._id,
        tokenCost,
      });
      onEnrollSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Enrollment failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Enroll in {course.title}</h2>
        <p className="mb-2">The enrollment cost is {course.price > 0 ? course.price : 1} tokens.</p>
        <p className="mb-4">This will be deducted from your wallet.</p>
        {error && (
          <p className="mb-4 text-red-600 text-sm">{error}</p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="mr-4 px-4 py-2 rounded bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50"
          >
            {loading ? 'Enrolling...' : 'Enroll'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPopup;
