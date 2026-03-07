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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid rgba(124,58,237,0.35)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.4 }}>
              Enroll in Course
            </div>
            <div style={{ color: '#a78bfa', fontSize: '0.92rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {course.title}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '0 0.2rem' }}
          >
            ×
          </button>
        </div>

        {/* Cost info */}
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '0.65rem',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>
            🪙 Enrollment Cost
          </div>
          <div style={{ color: '#fde68a', fontSize: '1.1rem', fontWeight: 700 }}>
            {course.price > 0 ? course.price : 1} token{(course.price > 0 ? course.price : 1) !== 1 ? 's' : ''}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            This amount will be deducted from your wallet balance.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '0.55rem', padding: '0.6rem 0.9rem',
            color: '#fca5a5', fontSize: '0.84rem', marginBottom: '1rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '0.6rem',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={loading}
            style={{
              padding: '0.55rem 1.4rem', borderRadius: '0.6rem',
              background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.88rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳ Enrolling...' : '✅ Confirm Enroll'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPopup;
