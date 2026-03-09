import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import TransactionStatus from '../components/TransactionStatus';
import { approve } from '../web3/services/skillTokenService';
import { purchaseCourse } from '../web3/services/skillPlatformService';
import { SKILL_PLATFORM_ADDRESS, BLOCK_EXPLORER } from '../web3/config';

const CourseDetail = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [course, setCourse] = useState(location.state?.course || null);
  const [loading, setLoading] = useState(!course);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isMentorCourse, setIsMentorCourse] = useState(false);

  // Web3 transaction state
  const [txVisible, setTxVisible] = useState(false);
  const [txStatus, setTxStatus] = useState('wallet');
  const [txMessage, setTxMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    if (!course) {
      fetchCourseDetails();
    }
    if (course && user) {
      checkEnrollmentStatus();
      // mark if current user is the mentor of this course (robust for different shapes)
      const getId = (val) => {
        if (!val && val !== 0) return null;
        if (typeof val === 'string' || typeof val === 'number') return String(val);
        if (typeof val === 'object') return String(val._id || val.id || '');
        return null;
      };

      const mentorIdVal = getId(course.mentor) || getId(course.mentorId) || getId(course.mentor?._id) || getId(course.instructor) || getId(course.owner);
      const userIdVal = getId(user._id) || getId(user.id) || getId(localStorage.getItem('userId'));

      setIsMentorCourse(Boolean(userIdVal && mentorIdVal && String(userIdVal) === String(mentorIdVal)));
    }
  }, [courseId, course, user]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data);
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!user || !course) return;
    
    try {
      const response = await api.get(`/courses/enrolled/${user._id}`);
      // server returns { enrolledCourses: [...] } or an array
      let enrolledArr = [];
      if (Array.isArray(response.data)) enrolledArr = response.data;
      else if (Array.isArray(response.data.enrolledCourses)) enrolledArr = response.data.enrolledCourses;
      setIsEnrolled(enrolledArr.some(enrolled => String(enrolled._id) === String(course._id)));
    } catch (err) {
      console.error('Error checking enrollment status:', err);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    setTxVisible(true);
    setTxStatus('wallet');
    setTxMessage('Approve 1 SKT token for course enrollment…');
    setTxHash('');

    try {
      // Step 1: Learner approves 1 SKT for the SkillPlatform contract
      const approveTx = await approve(SKILL_PLATFORM_ADDRESS, '1');
      setTxStatus('pending');
      setTxMessage('Token approved! Processing course purchase on blockchain…');

      // Step 2: Attempt on-chain purchaseCourse (works if connected wallet is admin)
      try {
        const mentorAddr = course.mentorWallet || course.mentor?.walletAddress;
        const learnerAddr = user.walletAddress || (user && user._id ? localStorage.getItem(`walletAddress:${user._id}`) : localStorage.getItem('walletAddress'));
        if (mentorAddr && learnerAddr) {
          const purchaseTx = await purchaseCourse(learnerAddr, mentorAddr);
          setTxHash(purchaseTx.transactionHash || '');
        }
      } catch {
        // Non-admin wallet – approval done, backend handles the rest
      }

      // Step 3: API enrollment (always runs)
      await api.post('/courses/enroll', {
        learnerId: user._id,
        courseId: course._id
      });

      setTxStatus('success');
      setTxMessage('Enrolled successfully! 1 SKT transferred to the instructor.');
      setIsEnrolled(true);
    } catch (err) {
      setTxStatus('error');
      setTxMessage(err.message || err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-white mb-4">Course not found</h2>
          <p className="text-gray-400 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg transition-all duration-200"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <TransactionStatus
        visible={txVisible}
        status={txStatus}
        message={txMessage}
        txHash={txHash}
        explorer={BLOCK_EXPLORER}
        onClose={() => setTxVisible(false)}
      />
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-white/5 opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-cyan-900/20 via-fuchsia-900/20 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/courses')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Courses
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Course Image */}
              {((course.thumbnail || course.image)) && (
                <div className="relative mb-6 rounded-xl overflow-hidden">
                  {(() => {
                    const raw = (course.thumbnail || course.image) || '';
                    const normalized = String(raw).replace(/\\/g, '/');
                    const src = /^https?:\/\//i.test(normalized) ? normalized : `${api.defaults.baseURL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
                    return (
                      <img
                        src={src}
                        alt={course.title}
                        className="w-full h-64 lg:h-80 object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    );
                  })()}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      course.level === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      course.level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Course Title */}
              <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                {course.title}
              </h1>

              {/* Mentor Info */}
              {course.mentorName && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {course.mentorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Instructor</p>
                    <p className="text-white font-semibold">{course.mentorName}</p>
                  </div>
                </div>
              )}

              {/* Course Details */}
              <div className="flex flex-wrap gap-4 mb-6">
                {course.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📚</span>
                    <span className="text-gray-300">{course.category}</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">⏱️</span>
                    <span className="text-gray-300">{course.duration}</span>
                  </div>
                )}
                {course.createdAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📅</span>
                    <span className="text-gray-300">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Course Description */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 sticky top-8"
            >
              {/* Price */}
              <div className="text-center mb-6">
                {course.price > 0 ? (
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    ${course.price}
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-fuchsia-400 mb-2">
                    Free
                  </div>
                )}
              </div>

              {/* Enroll Button */}
              <div className="mb-6">
                {!isMentorCourse && (isEnrolled ? (
                  <div className="w-full py-4 bg-green-500/20 border border-green-500 text-green-400 text-center rounded-lg font-semibold">
                    ✅ Enrolled
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? '⏳ Processing Blockchain Tx…' : '🪙 Enroll Now (1 SKT)'}
                  </button>
                ))}
                {isMentorCourse && (
                  <div className="w-full py-4 bg-yellow-500/10 border border-yellow-500 text-yellow-300 text-center rounded-lg font-semibold">
                    You are the instructor for this course
                  </div>
                )}
              </div>

              {/* Course Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What you'll get:</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Lifetime access to course materials
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Direct access to instructor
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Certificate of completion
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Mobile and desktop access
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;