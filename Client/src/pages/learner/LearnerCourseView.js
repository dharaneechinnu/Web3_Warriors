import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, 
  FaPause, 
  FaCheck, 
  FaLock, 
  FaChevronDown, 
  FaChevronRight,
  FaVideo,
  FaTasks,
  FaFileAlt,
  FaUpload,
  FaDownload,
  FaEye,
  FaClock,
  FaPlayCircle
} from 'react-icons/fa';
import api from '../../services/api';
import { API_BASE_URL } from '../../config';
import LectureVideoPlayer from '../../components/LectureVideoPlayer';
import { downloadCertificate } from '../../utils/certificateGenerator';



const LearnerContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: white;
`;

const VideoSection = styled.div`
  background: #000;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(124, 58, 237, 0.3);
`;

const VideoPlayer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.3);
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const PlayButton = styled.button`
  background: rgba(124, 58, 237, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  font-size: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(124, 58, 237, 1);
    transform: scale(1.1);
  }
`;

const VideoControls = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 1rem;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin-bottom: 0.5rem;
  cursor: pointer;
`;

const Progress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #6366f1);
  border-radius: 3px;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LeftControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TimeDisplay = styled.span`
  font-size: 0.875rem;
  opacity: 0.8;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  padding: 2rem;
  min-height: calc(100vh - 4rem);
  
  @media (max-width: 1400px) {
    grid-template-columns: 350px 1fr;
    gap: 1.5rem;
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
`;

const LeftSidebar = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
  position: sticky;
  top: 2rem;
  
  @media (max-width: 1200px) {
    display: none;
  }
`;

const VideoContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ContentArea = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const LectureTitle = styled.h1`
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const LectureDescription = styled.div`
  color: #e2e8f0;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const AssignmentCard = styled(motion.div)`
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const QuizCard = styled(motion.div)`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ArticleCard = styled(motion.div)`
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const QuizTitle = styled.h3`
  color: #3b82f6;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ArticleTitle = styled.h3`
  color: #22c55e;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ArticleContent = styled.div`
  line-height: 1.6;
  
  h1, h2, h3, h4, h5, h6 {
    color: #e2e8f0;
    margin: 1.5rem 0 1rem 0;
  }
  
  p {
    margin-bottom: 1rem;
  }
  
  ul, ol {
    margin: 1rem 0;
    padding-left: 2rem;
  }
  
  img {
    max-width: 100%;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0;
  }
`;

const AssignmentTitle = styled.h3`
  color: #ef4444;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AssignmentActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  background: ${props => {
    switch (props.variant) {
      case 'primary': return 'linear-gradient(135deg, #7c3aed, #6366f1)';
      case 'success': return 'linear-gradient(135deg, #22c55e, #16a34a)';
      case 'danger': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      default: return 'rgba(255,255,255,0.1)';
    }
  }};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Sidebar = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
  position: sticky;
  top: 2rem;
  
  @media (max-width: 768px) {
    position: relative;
    top: 0;
    max-height: none;
  }
`;

const MobileContentSection = styled.div`
  display: none;
  
  @media (max-width: 1200px) {
    display: block;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(124, 58, 237, 0.2);
  background: rgba(124, 58, 237, 0.1);
  border-radius: 16px 16px 0 0;
`;

const SidebarTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
`;

const SectionItem = styled.div`
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
`;

const SectionHeader = styled.div`
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.expanded ? 'rgba(124, 58, 237, 0.05)' : 'transparent'};
  transition: all 0.3s ease;

  &:hover {
    background: rgba(124, 58, 237, 0.05);
  }
`;

const SectionTitle = styled.div`
  font-weight: 500;
  font-size: 1rem;
`;

const LectureList = styled(motion.div)`
  background: rgba(0, 0, 0, 0.2);
`;

const LectureItem = styled.div`
  padding: 0.75rem 1.5rem 0.75rem 3rem;
  cursor: ${props => props.locked ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => {
    if (props.active) return 'rgba(124, 58, 237, 0.1)';
    if (props.locked) return 'rgba(107, 114, 128, 0.05)';
    return 'transparent';
  }};
  border-left: 3px solid ${props => {
    if (props.active) return '#7c3aed';
    if (props.locked) return '#6b7280';
    return 'transparent';
  }};
  opacity: ${props => props.locked ? 0.5 : 1};
  transition: all 0.3s ease;

  &:hover {
    background: ${props => {
      if (props.locked) return 'rgba(107, 114, 128, 0.05)';
      return 'rgba(124, 58, 237, 0.05)';
    }};
  }
`;

const LectureInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LectureIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.type) {
      case 'video': return '#f59e0b';
      case 'assignment': return '#ef4444';
      case 'resource': return '#06b6d4';
      default: return '#6b7280';
    }
  }};
`;

const LectureName = styled.span`
  font-size: 0.875rem;
  ${props => props.completed && `
    color: #22c55e;
    font-weight: 500;
  `}
  ${props => props.locked && `
    color: #6b7280;
  `}
`;

const LectureStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.status) {
      case 'completed': return '#22c55e';
      case 'locked': return '#6b7280';
      default: return 'transparent';
    }
  }};
  border: 2px solid ${props => {
    switch (props.status) {
      case 'completed': return '#22c55e';
      case 'locked': return '#6b7280';
      default: return '#7c3aed';
    }
  }};
  font-size: 0.75rem;
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(124, 58, 237, 0.3);
`;

const FileUpload = styled.div`
  border: 2px dashed rgba(124, 58, 237, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  margin: 1rem 0;

  &:hover {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.05);
  }
`;

const SubmissionStatus = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  background: ${props => {
    switch (props.status) {
      case 'submitted': return 'rgba(34, 197, 94, 0.1)';
      case 'evaluated': return 'rgba(59, 130, 246, 0.1)';
      default: return 'rgba(251, 191, 36, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'submitted': return 'rgba(34, 197, 94, 0.3)';
      case 'evaluated': return 'rgba(59, 130, 246, 0.3)';
      default: return 'rgba(251, 191, 36, 0.3)';
    }
  }};
`;

const CourseProgressSection = styled.div`
  background: rgba(17, 17, 27, 0.8);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const ProgressBarContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const CourseProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const VideoBottomContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  color: white;
  padding: 2rem 1.5rem 1rem 1.5rem;
  transform: translateY(${props => props.show ? '0' : '100%'});
  transition: transform 0.3s ease;
`;

const ResumeIndicator = styled.div`
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(20, 184, 166, 0.1));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #10b981;
  animation: resumePulse 2s infinite;
  
  @keyframes resumePulse {
    0%, 100% { 
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.3);
    }
    50% { 
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    }
  }
`;

const ResumeText = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  
  .resume-icon {
    font-size: 1.25rem;
    color: #10b981;
  }
  
  .resume-message {
    font-size: 1rem;
    
    .resume-time {
      font-weight: 700;
      color: #059669;
    }
  }
`;

const ResumeButton = styled.button`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const NextContentInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const NextContentDetails = styled.div`
  flex: 1;
`;

const NextLabel = styled.div`
  font-size: 0.875rem;
  opacity: 0.8;
  margin-bottom: 0.25rem;
`;

const NextTitle = styled.div`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const NextMeta = styled.div`
  font-size: 0.8rem;
  opacity: 0.6;
`;

const NextButton = styled.button`
  background: ${props => props.enabled ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.1)'};
  color: ${props => props.enabled ? 'white' : 'rgba(255,255,255,0.5)'};
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: ${props => props.enabled ? 'pointer' : 'not-allowed'};
  font-weight: 500;
  transition: all 0.3s ease;
  margin-left: 1rem;

  &:hover {
    transform: ${props => props.enabled ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.enabled ? '0 5px 15px rgba(124, 58, 237, 0.3)' : 'none'};
  }
`;

const CompletionMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

// Quiz Component
const QuizContent = ({ quiz, onSubmit, result, currentAttempts = 0, onRetry }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Initialize timer if quiz has time limit
  useEffect(() => {
    if (quiz.timeLimitMinutes && quiz.timeLimitMinutes > 0) {
      setTimeRemaining(quiz.timeLimitMinutes * 60); // Convert to seconds
    }
  }, [quiz]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isSubmitted) {
      // Time's up - auto submit
      handleSubmit();
    }
  }, [timeRemaining, isSubmitted]);

  const handleAnswerSelect = (questionId, answer) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    // Convert answers to expected format
    const formattedAnswers = quiz.questions.map((question, index) => ({
      questionId: question._id,
      questionIndex: index,
      selectedIndex: question.type === 'single_correct' ? 
        (question.choices ? question.choices.indexOf(selectedAnswers[question._id]) : -1) : undefined,
      selectedIndices: question.type === 'multiple_correct' ? 
        (selectedAnswers[question._id] || []).map(ans => question.choices.indexOf(ans)) : undefined,
      textAnswer: question.type === 'short_answer' ? selectedAnswers[question._id] : undefined
    }));
    
    console.log('Formatted answers for submission:', formattedAnswers);
    setIsSubmitted(true);
    onSubmit(formattedAnswers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAnswered = (questionId) => {
    return selectedAnswers[questionId] !== undefined && selectedAnswers[questionId] !== null && selectedAnswers[questionId] !== '';
  };

  const allQuestionsAnswered = () => {
    return quiz.questions.every(q => isAnswered(q._id));
  };

  if (quiz.error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fecaca', 
        borderRadius: '8px',
        color: '#dc2626',
        textAlign: 'center'
      }}>
        <p>❌ {quiz.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (result) {
    const maxAttempts = result.maxAttempts || quiz.attemptsAllowed || 3;
    const attemptsUsed = result.attemptsUsed || result.attemptNumber || 1;
    const hasAttemptsLeft = result.hasAttemptsLeft !== undefined ? result.hasAttemptsLeft : attemptsUsed < maxAttempts;
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '10px' 
          }}>
            {result.passed ? '🎉' : result.autoCompleted ? '📝' : '😔'}
          </div>
          <h3 style={{ 
            color: result.passed ? '#059669' : result.autoCompleted ? '#f59e0b' : '#dc2626',
            marginBottom: '10px'
          }}>
            {result.passed ? 'Congratulations!' : result.autoCompleted ? 'Quiz Completed' : 'Keep Learning!'}
          </h3>
          <p>{result.message}</p>
          
          {/* Attempt Information */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '10px',
            borderRadius: '8px',
            marginTop: '15px',
            fontSize: '14px'
          }}>
            📊 Attempt {attemptsUsed} of {maxAttempts === -1 ? '∞' : maxAttempts}
            {result.autoCompleted && (
              <div style={{ marginTop: '5px', color: '#fbbf24' }}>
                ⚠️ All attempts used - Quiz marked as complete
              </div>
            )}
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '15px',
          marginBottom: '20px' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
              {result.earnedMarks}/{result.totalMarks}
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '14px' }}>Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
              {result.percentage}%
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '14px' }}>Percentage</div>
          </div>
        </div>
        
        {result.tokenReward > 0 && (
          <div style={{ 
            textAlign: 'center', 
            backgroundColor: 'rgba(254, 243, 199, 0.2)',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            🪙 You earned {result.tokenReward} tokens!
          </div>
        )}
        
        {/* Retry Button */}
        {!result.passed && hasAttemptsLeft && !result.autoCompleted && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => {
                if (onRetry) {
                  onRetry(); // Clear the result to show quiz form again
                }
              }}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Try Again ({maxAttempts - attemptsUsed} attempts left)
            </button>
          </div>
        )}
        
        {result.results && (
          <div style={{ textAlign: 'left', marginTop: '20px' }}>
            <h4>Question Review:</h4>
            {result.results.map((questionResult, index) => (
              <div key={index} style={{
                marginBottom: '15px',
                padding: '15px',
                backgroundColor: questionResult.isCorrect ? 
                  'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${questionResult.isCorrect ? 
                  'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                borderRadius: '8px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Q{index + 1}: {questionResult.question}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  Your answer: {JSON.stringify(questionResult.yourAnswer?.selectedIndex !== undefined ? 
                    quiz.questions[index]?.choices?.[questionResult.yourAnswer.selectedIndex] : 
                    questionResult.yourAnswer?.textAnswer || 'Not answered')}
                </div>
                {questionResult.correctAnswer && (
                  <div style={{ color: '#059669' }}>
                    Correct answer: {JSON.stringify(questionResult.correctAnswer)}
                  </div>
                )}
                {questionResult.explanation && (
                  <div style={{ marginTop: '8px', fontStyle: 'italic', color: '#e5e7eb' }}>
                    💡 {questionResult.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Quiz Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(124, 58, 237, 0.3)'
      }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: '5px' }}>{quiz.title || 'Quiz'}</h3>
          {quiz.description && (
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>{quiz.description}</p>
          )}
        </div>
        {timeRemaining !== null && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: timeRemaining < 300 ? '#fef2f2' : 'rgba(59, 130, 246, 0.1)',
            color: timeRemaining < 300 ? '#dc2626' : '#3b82f6',
            borderRadius: '6px',
            fontWeight: 'bold',
            border: `1px solid ${timeRemaining < 300 ? '#fecaca' : 'rgba(59, 130, 246, 0.3)'}`
          }}>
            ⏰ {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {/* Quiz Info */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '25px',
        flexWrap: 'wrap',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        <div>📝 {quiz.questions.length} Questions</div>
        <div>🎯 {quiz.passingScore || 70}% to Pass</div>
        {quiz.tokenReward > 0 && <div>🪙 {quiz.tokenReward} Tokens</div>}
        <div>🔄 Max Attempts: {quiz.attemptsAllowed === -1 ? 'Unlimited' : (quiz.attemptsAllowed || 3)}</div>
        {currentAttempts > 0 && (
          <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>
            📊 Attempt {currentAttempts + 1} of {quiz.attemptsAllowed === -1 ? '∞' : (quiz.attemptsAllowed || 3)}
          </div>
        )}
      </div>

      {/* Questions */}
      <div style={{ marginBottom: '30px' }}>
        {quiz.questions.map((question, qIndex) => (
          <div key={question._id || qIndex} style={{
            marginBottom: '25px',
            padding: '20px',
            border: '2px solid rgba(124, 58, 237, 0.3)',
            borderRadius: '12px',
            backgroundColor: isAnswered(question._id) ? 
              'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              Q{qIndex + 1}: {question.question}
              {question.marks && question.marks > 1 && (
                <span style={{ 
                  marginLeft: '10px', 
                  fontSize: '12px', 
                  color: '#9ca3af' 
                }}>
                  ({question.marks} marks)
                </span>
              )}
            </div>
            
            {(question.type === 'single_correct' || question.type === 'multiple-choice') && (
              <div>
                {question.choices?.map((choice, cIndex) => (
                  <label key={cIndex} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px',
                    padding: '12px',
                    backgroundColor: selectedAnswers[question._id] === choice ? 
                      'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={choice}
                      checked={selectedAnswers[question._id] === choice}
                      onChange={() => handleAnswerSelect(question._id, choice)}
                      disabled={isSubmitted}
                      style={{ marginRight: '12px' }}
                    />
                    <span>{choice}</span>
                  </label>
                ))}
              </div>
            )}
            
            {question.type === 'multiple_correct' && (
              <div>
                <div style={{ marginBottom: '10px', fontSize: '14px', color: '#9ca3af' }}>
                  Select all correct answers:
                </div>
                {question.choices?.map((choice, cIndex) => {
                  const currentAnswers = selectedAnswers[question._id] || [];
                  return (
                    <label key={cIndex} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '10px',
                      padding: '12px',
                      backgroundColor: currentAnswers.includes(choice) ? 
                        'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <input
                        type="checkbox"
                        checked={currentAnswers.includes(choice)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleAnswerSelect(question._id, [...currentAnswers, choice]);
                          } else {
                            handleAnswerSelect(question._id, currentAnswers.filter(a => a !== choice));
                          }
                        }}
                        disabled={isSubmitted}
                        style={{ marginRight: '12px' }}
                      />
                      <span>{choice}</span>
                    </label>
                  );
                })}
              </div>
            )}
            
            {question.type === 'short_answer' && (
              <textarea
                placeholder="Enter your answer here..."
                value={selectedAnswers[question._id] || ''}
                onChange={(e) => handleAnswerSelect(question._id, e.target.value)}
                disabled={isSubmitted}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white'
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div style={{ textAlign: 'center' }}>
        <ActionButton
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitted || !allQuestionsAnswered()}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: isSubmitted || !allQuestionsAnswered() ? 0.5 : 1,
            cursor: isSubmitted || !allQuestionsAnswered() ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitted ? '✓ Submitted' : 'Submit Quiz'}
        </ActionButton>
        
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#9ca3af' }}>
          {allQuestionsAnswered() ? 
            '✓ All questions answered' : 
            `${Object.keys(selectedAnswers).length}/${quiz.questions.length} questions answered`
          }
        </div>
      </div>
    </div>
  );
};

const LearnerCourseView = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [videoProgress, setVideoProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [videoWatchedPercentage, setVideoWatchedPercentage] = useState(0);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);
  const [videoCompleteThreshold] = useState(0.9); // 90% completion threshold
  const [lastWatchedPosition, setLastWatchedPosition] = useState(0);
  const [userProgress, setUserProgress] = useState({ lectureProgress: [] });
  const [assignments, setAssignments] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [articles, setArticles] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [quizAttempts, setQuizAttempts] = useState({}); // Track attempts per quiz
  const [overallCourseProgress, setOverallCourseProgress] = useState(0);
  const [currentLectureCompleted, setCurrentLectureCompleted] = useState(false);
  const [nextContent, setNextContent] = useState(null);
  const [autoResumeActive, setAutoResumeActive] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0); // Track last time progress was saved
  const [isLoadingLecture, setIsLoadingLecture] = useState(false); // Loading state for lecture switching
  const saveIntervalRef = React.useRef(null); // Ref for periodic save interval

  // Helper function to format time for resume indicator
  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  useEffect(() => {
    if (courseId) {
      // fetchCourseData now handles both course loading and position selection
      fetchCourseData();
      fetchUserProgress();
      // retryFailedSaves removed when progress tracking was disabled
    }
  }, [courseId]);

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Save progress before leaving
      if (currentLecture && lastWatchedPosition > 0 && !currentLectureCompleted) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          // Use navigator.sendBeacon for reliable delivery on page unload
          const data = JSON.stringify({
            learnerId: userId,
            courseId: courseId,
            lectureId: currentLecture._id,
            sectionId: currentLecture.sectionId || null,
            currentTime: Math.round(lastWatchedPosition),
            videoProgress: Math.round(videoWatchedPercentage),
            completed: false,
            contentType: 'video'
          });
          
          navigator.sendBeacon(
            `${API_BASE_URL}/courses/updateLectureProgress`,
            new Blob([data], { type: 'application/json' })
          );
          console.log('🚀 CLIENT: Progress saved via beacon on page unload');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save on component unmount
      if (currentLecture && lastWatchedPosition > 0 && !currentLectureCompleted) {
        saveVideoProgress(currentLecture._id, lastWatchedPosition, videoWatchedPercentage, false);
      }
    };
  }, [currentLecture, lastWatchedPosition, videoWatchedPercentage, currentLectureCompleted, courseId]);

  // Add debugging useEffect to track state changes
  useEffect(() => {
    if (currentLecture) {
      console.log('🔍 CLIENT STATE DEBUG:', {
        currentLecture: currentLecture.title,
        lectureType: currentLecture.type,
        lastWatchedPosition,
        videoWatchedPercentage,
        currentLectureCompleted,
        hasVideoStarted,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentLecture, lastWatchedPosition, videoWatchedPercentage, currentLectureCompleted, hasVideoStarted]);

  useEffect(() => {
    // Update next content when current lecture changes
    if (currentLecture && sections.length > 0) {
      setNextContent(getNextContent());
    }
  }, [currentLecture, sections]);

  // Ensure we fetch quiz/article/assignment content when a lecture becomes current
  useEffect(() => {
    if (!currentLecture) return;

    const fetchIfNeeded = async () => {
      try {
        const type = currentLecture.type;
        const id = currentLecture._id;

        // Only fetch if not already present in state
        if (type === 'quiz' && !quizzes[id]) {
          setIsLoadingLecture(true);
          await fetchContentData(id, 'quiz');
          setIsLoadingLecture(false);
        } else if (type === 'article' && !articles[id]) {
          setIsLoadingLecture(true);
          await fetchContentData(id, 'article');
          setIsLoadingLecture(false);
        } else if (type === 'assignment' && !assignments[id]) {
          setIsLoadingLecture(true);
          await fetchContentData(id, 'assignment');
          setIsLoadingLecture(false);
        }
      } catch (e) {
        console.error('Error auto-fetching lecture content:', e);
        setIsLoadingLecture(false);
      }
    };

    fetchIfNeeded();
  }, [currentLecture, quizzes, articles, assignments]);

  // Remove the conflicting useEffect that was trying to select lectures
  // fetchCourseData now handles all position logic
  // fetchCourseData now handles all position logic

  const fetchContentData = async (lectureId, contentType) => {
    try {
      // locate lecture indices
      let sectionIndex = -1;
      let lectureIndex = -1;

      if (course?.curriculum?.sections) {
        for (let i = 0; i < course.curriculum.sections.length; i++) {
          const section = course.curriculum.sections[i];
          if (!section.lectures) continue;
          for (let j = 0; j < section.lectures.length; j++) {
            const lecture = section.lectures[j];
            if (String(lecture._id) === String(lectureId)) {
              sectionIndex = i;
              lectureIndex = j;
              break;
            }
          }
          if (sectionIndex !== -1) break;
        }
      }

      // fallback: try learner-content endpoint if indices not found
      if (sectionIndex === -1 || lectureIndex === -1) {
        try {
          const learnerResponse = await api.get(`/courses/${courseId}/learner-content`);
          if (learnerResponse.data?.success && learnerResponse.data.course) {
            const courseData = learnerResponse.data.course;
            for (const section of courseData.curriculum?.sections || []) {
              for (const lecture of section.lectures || []) {
                if (String(lecture._id) === String(lectureId) && lecture.type === contentType) {
                  if (contentType === 'quiz' && lecture.quiz) setQuizzes(prev => ({ ...prev, [lectureId]: lecture.quiz }));
                  if (contentType === 'article' && lecture.article) setArticles(prev => ({ ...prev, [lectureId]: lecture.article }));
                  if (contentType === 'assignment' && lecture.assignment) setAssignments(prev => ({ ...prev, [lectureId]: lecture.assignment }));
                  return;
                }
              }
            }
          }
        } catch (e) {
          console.error('Error fetching learner content fallback:', e);
        }
        return;
      }

      // fetch based on content type
      if (contentType === 'quiz') {
        const res = await api.get(`/courses/${courseId}/section/${sectionIndex}/lecture/${lectureIndex}/quiz`);
        if (res.data?.success) setQuizzes(prev => ({ ...prev, [lectureId]: res.data.quiz }));
      } else if (contentType === 'article') {
        const res = await api.get(`/courses/${courseId}/section/${sectionIndex}/lecture/${lectureIndex}/article`);
        if (res.data?.success) setArticles(prev => ({ ...prev, [lectureId]: res.data.article }));
      } else if (contentType === 'assignment') {
        const res = await api.get(`/courses/${courseId}/section/${sectionIndex}/lecture/${lectureIndex}/assignment`);
        if (res.data?.success) setAssignments(prev => ({ ...prev, [lectureId]: res.data.assignment }));
      } else {
        console.log('Unknown content type:', contentType);
      }
    } catch (error) {
      console.error(`Error fetching ${contentType} data:`, error);
      if (contentType === 'quiz') {
        setQuizzes(prev => ({ ...prev, [lectureId]: { error: true, message: 'Failed to load quiz. Please try again.' } }));
      }
    }
  };

  const submitQuiz = async (lectureId, answers) => {
    try {
      console.log('Submitting quiz answers:', { lectureId, answers });
      
      // Find section and lecture indices
      let sectionIndex = -1;
      let lectureIndex = -1;
      
      if (course && course.curriculum && course.curriculum.sections) {
        for (let i = 0; i < course.curriculum.sections.length; i++) {
          const section = course.curriculum.sections[i];
          if (section.lectures) {
            for (let j = 0; j < section.lectures.length; j++) {
              const lecture = section.lectures[j];
              if (String(lecture._id) === String(lectureId)) {
                sectionIndex = i;
                lectureIndex = j;
                break;
              }
            }
          }
        }
      }
      
      if (sectionIndex === -1 || lectureIndex === -1) {
        console.error('Could not find lecture indices for quiz submission');
        alert('Error: Could not find lecture. Please refresh and try again.');
        return { success: false, error: 'Lecture not found' };
      }
      
      const userId = localStorage.getItem('userId');
      
      // Track attempt count
      const currentAttempts = quizAttempts[lectureId] || 0;
      const newAttemptCount = currentAttempts + 1;
      
      const response = await api.post(
        `/courses/${courseId}/section/${sectionIndex}/lecture/${lectureIndex}/quiz/submit`,
        {
          learnerId: userId,
          answers: answers,
          submittedAt: new Date().toISOString(),
          attemptNumber: newAttemptCount
        }
      );
      
      console.log('Quiz submission response:', response.data);
      
      if (response.data.success) {
        // Update attempt count
        setQuizAttempts(prev => ({ 
          ...prev, 
          [lectureId]: newAttemptCount 
        }));
        
        // Store quiz result
        const result = response.data.result;
        setQuizResults(prev => ({ 
          ...prev, 
          [lectureId]: {
            ...result,
            attemptNumber: newAttemptCount,
            attemptsUsed: newAttemptCount
          }
        }));
        
        // Get the quiz data to check max attempts
        const currentQuiz = quizzes[lectureId];
        const maxAttempts = currentQuiz?.attemptsAllowed || 3;
        const hasAttemptsLeft = newAttemptCount < maxAttempts;
        
        if (result.passed) {
          // Passed - mark as completed
          markLectureCompleted(lectureId, 'quiz');
          alert(`🎉 Congratulations! You passed with ${result.percentage}%`);
        } else {
          // Failed
          if (hasAttemptsLeft) {
            const remainingAttempts = maxAttempts - newAttemptCount;
            alert(`📚 You scored ${result.percentage}% (Need ${result.passingScore}% to pass)\nYou have ${remainingAttempts} attempt(s) remaining.`);
          } else {
            // No attempts left - auto-complete as attempted
            markLectureCompleted(lectureId, 'quiz');
            alert(`📚 Quiz attempts exhausted. You used all ${maxAttempts} attempts.\nThe quiz has been marked as completed so you can continue with the course.`);
          }
        }
        
        // Update result with attempt info
        setQuizResults(prev => ({ 
          ...prev, 
          [lectureId]: {
            ...result,
            attemptNumber: newAttemptCount,
            attemptsUsed: newAttemptCount,
            maxAttempts: maxAttempts,
            hasAttemptsLeft: hasAttemptsLeft,
            autoCompleted: !result.passed && !hasAttemptsLeft
          }
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Quiz submission error:', error);
      alert('Failed to submit quiz. Please try again.');
      return { success: false, error: error.message };
    }
  };

  const submitAssignment = async (lectureId, file, description = '') => {
    try {
      const userId = localStorage.getItem('userId');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('lectureId', lectureId);
      formData.append('courseId', courseId);
      formData.append('learnerId', userId);

      const response = await api.post('/courses/submit-assignment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setAssignments(prev => ({
          ...prev,
          [lectureId]: {
            ...prev[lectureId],
            submission: response.data.submission
          }
        }));
        setShowSubmissionModal(false);
        markLectureCompleted(lectureId, 'assignment');
      }
      return response.data;
    } catch (error) {
      console.error('Error submitting assignment:', error);
      const msg = error.response?.data?.message || error.message;
      return { success: false, error: msg };
    }
  };


  // Fetch saved progress for current lecture using the new API endpoint
  const fetchLectureProgress = async (lectureId) => {
    try {
      const userId = localStorage.getItem('userId');
      console.log('📡 CLIENT: Fetching specific lecture progress:', {
        userId,
        courseId,
        lectureId,
        endpoint: `/courses/progress/${userId}/${courseId}/${lectureId}`
      });
      
      if (userId) {
        const response = await api.get(`/courses/progress/${userId}/${courseId}/${lectureId}`);
        console.log('📊 CLIENT: Lecture progress response:', {
          status: response.status,
          success: response.data?.success,
          hasProgress: response.data?.hasProgress,
          data: response.data?.progress
        });
        
        if (response.data && response.data.success && response.data.hasProgress) {
          const progress = response.data.progress;
          console.log('✅ CLIENT: Found saved lecture progress:', {
            currentTime: progress.currentTime,
            videoProgress: progress.videoProgress,
            completed: progress.completed,
            lastAccessed: progress.lastAccessed
          });
          return progress;
        } else {
          console.log('📝 CLIENT: No saved progress for this lecture');
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ CLIENT: Error fetching lecture progress:', error);
      return null;
    }
  };

  // Fetch saved progress for current lecture (legacy method)
  const fetchLectureProgressLegacy = async (lectureId) => {
    try {
      const userId = localStorage.getItem('userId');
      console.log('📡 CLIENT: Fetching lecture progress:', {
        userId,
        courseId,
        lectureId,
        endpoint: `/courses/progress/${userId}/${courseId}`
      });
      
      const response = await api.get(`/courses/progress/${userId}/${courseId}`);
      
      if (response.data.success) {
        const lectureProgress = response.data.progress.lectureProgress.find(
          p => p.lectureId === lectureId
        );
        
        console.log('📊 CLIENT: Fetched progress data:', {
          totalRecords: response.data.progress.lectureProgress.length,
          foundLectureProgress: lectureProgress,
          allProgress: response.data.progress.lectureProgress
        });
        
        return lectureProgress || null;
      }
    } catch (error) {
      console.error('❌ CLIENT: Error fetching lecture progress:', error.response?.data || error.message);
    }
    return null;
  };

  // Video event handlers
  const handleVideoTimeUpdate = (currentTime, duration) => {
    if (duration > 0) {
      const progressPercent = (currentTime / duration) * 100;
      setVideoProgress(progressPercent);
      setVideoWatchedPercentage(progressPercent);
      setLastWatchedPosition(currentTime);
      
      // Save progress every 10 seconds while playing
      const now = Date.now();
      if (now - lastSaveTime >= 10000 && currentLecture && isPlaying) {
        setLastSaveTime(now);
        saveVideoProgress(currentLecture._id, currentTime, progressPercent, false);
      }
      
      // Auto-mark video as complete when 90% watched
      if (progressPercent >= (videoCompleteThreshold * 100) && !currentLectureCompleted && currentLecture) {
        console.log('Video 90% completed, marking lecture as complete');
        markLectureCompleted(currentLecture._id, 'video');
        
        // Auto-move to next lecture after a short delay
        setTimeout(() => {
          moveToNextLecture();
        }, 2000);
      }
    }
  };

  // Save video progress to server
  const saveVideoProgress = async (lectureId, currentTime, progressPercent, completed = false) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId || !lectureId) return;
      
      console.log('💾 CLIENT: Saving video progress:', {
        lectureId,
        currentTime: Math.round(currentTime),
        progressPercent: Math.round(progressPercent),
        completed
      });
      
      await api.post('/courses/updateLectureProgress', {
        learnerId: userId,
        courseId: courseId,
        lectureId: lectureId,
        sectionId: currentLecture?.sectionId || null,
        currentTime: Math.round(currentTime),
        videoProgress: Math.round(progressPercent),
        completed: completed,
        contentType: 'video'
      });
      
      console.log('✅ CLIENT: Progress saved successfully');
    } catch (error) {
      console.error('❌ CLIENT: Error saving progress:', error.response?.data || error.message);
    }
  };

  const handleVideoPlay = () => {
    console.log('▶️ CLIENT: Video play triggered:', {
      lectureTitle: currentLecture?.title,
      currentPosition: lastWatchedPosition
    });
    setIsPlaying(true);
    setHasVideoStarted(true);
  };

  const handleVideoPause = () => {
    console.log('⏸️ CLIENT: Video pause triggered:', {
      lectureTitle: currentLecture?.title,
      pausedAt: lastWatchedPosition,
      progress: videoWatchedPercentage
    });
    setIsPlaying(false);
    
    // Save current progress immediately on pause
    if (currentLecture && lastWatchedPosition > 0) {
      saveVideoProgress(currentLecture._id, lastWatchedPosition, videoWatchedPercentage, false);
    }
  };

  const handleVideoEnded = async () => {
    setIsPlaying(false);
    
    console.log('🎬 CLIENT: Video ended naturally - marking as completed and saving final progress');
    
    if (currentLecture && !currentLectureCompleted) {
      // Save 100% completion progress to server
      await saveVideoProgress(currentLecture._id, lastWatchedPosition, 100, true);
      
      // Mark lecture as complete locally
      setCurrentLectureCompleted(true);
      setVideoWatchedPercentage(100);

      // Refresh local progress state
      try {
        await fetchUserProgress();
        console.log('🔄 CLIENT: User progress refreshed after completion');
      } catch (e) {
        console.error('Error refreshing user progress after completion:', e);
      }

      // Auto-move to next lecture after a short delay
      setTimeout(() => moveToNextLecture(), 2000);
    }
  };

  // Move to next incomplete lecture
  const moveToNextLecture = () => {
    const nextContent = getNextContent();
    if (nextContent) {
      console.log('Moving to next lecture:', nextContent.title);
      // `getNextContent` returns a wrapper with the actual lecture in `data`.
      // Ensure we pass the raw lecture object to `selectLecture`.
      const lectureObj = nextContent.data || nextContent;
      const sectionId = nextContent.sectionId || lectureObj.sectionId || null;
      selectLecture(lectureObj, sectionId);
    } else {
      console.log('Course completed!');
      // Mark course as complete
      markCourseAsComplete();
    }
  };

  // Mark entire course as complete
  const markCourseAsComplete = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.post(`/courses/complete/${courseId}/${userId}`);
      if (response.data.success) {
        console.log('Course marked as complete');
        setOverallCourseProgress(100);
        alert('🎉 Congratulations! You have completed the entire course!');
      }
    } catch (error) {
      console.error('Error marking course as complete:', error);
    }
  };

  // Update lecture progress on server
  const updateLectureProgress = async (lectureId, watchedTime, progressPercent) => {
    try {
      const userId = localStorage.getItem('userId');
      const completed = progressPercent >= 90;
      
      console.log('🔄 CLIENT: updateLectureProgress (legacy) called:', {
        lectureId,
        watchedTime,
        progressPercent,
        completed
      });
      
      await api.post('/courses/updateLectureProgress', {
        learnerId: userId,
        courseId: courseId,
        lectureId: lectureId,
        sectionId: currentLecture?.sectionId || null,
        currentTime: watchedTime,
        videoProgress: progressPercent,
        progress: Math.round(progressPercent),
        completed: completed,
        contentType: 'video'
      });
      
      console.log('✅ CLIENT: Legacy progress update successful');
    } catch (error) {
      console.error('❌ CLIENT: Error updating lecture progress (legacy):', error.response?.data || error.message);
    }
  };

  const fetchCourseData = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      console.log('Course data response:', response.data);
      
      if (response.data) {
        setCourse(response.data);
        
        // Extract sections from curriculum if available
        if (response.data.curriculum && response.data.curriculum.sections) {
          console.log('Course sections found:', response.data.curriculum.sections);
          setSections(response.data.curriculum.sections);
          
          // Ensure we have the user's progress loaded (used to find next incomplete)
          const progressResponse = await fetchUserProgress();
          const progressData = progressResponse || { lectureProgress: [] };

          // Get user's current position to determine where to continue
          const currentPosition = await fetchUserCurrentPosition();
          
          if (currentPosition && !currentPosition.shouldStartFromBeginning) {
            // User has progress - continue from their current position
            console.log('🎯 CLIENT: Continuing from user position:', currentPosition);
            console.log('🎯 CLIENT: Using progress data:', progressData);
            
            // Find the lecture in the course structure
            let targetLecture = null;
            let targetSectionId = null;
            
            for (const section of response.data.curriculum.sections) {
              const foundLecture = section.lectures.find(
                lecture => lecture._id.toString() === currentPosition.lectureId
              );
              
              if (foundLecture) {
                targetLecture = {
                  ...foundLecture,
                  sectionId: section._id || section.id || 0
                };
                targetSectionId = section._id || section.id || 0;
                break;
              }
            }
            
            if (targetLecture) {
              console.log('✅ CLIENT: Found target lecture for restoration:', targetLecture.title);
              // If the saved position indicates the lecture is completed, try to advance to next incomplete
              if (currentPosition.isCompleted) {
                console.log('🔁 CLIENT: Current position is completed; searching for next incomplete lecture');
                const next = findNextIncompleteFrom(targetLecture, targetSectionId, progressData);
                if (next) {
                  console.log('➡️ CLIENT: Auto-starting next incomplete lecture:', next.title);
                  // Call selectLecture to properly set up the lecture (including fetching content data)
                  await selectLecture(next.data, next.sectionId);
                } else {
                  // Check if course is 100% complete — if so, show the certificate view
                  const allSections = response.data.curriculum.sections;
                  const totalLectures = allSections.reduce((t, s) => t + (s.lectures?.length || 0), 0);
                  const completedCount = progressData.lectureProgress?.filter(p => p.completed).length || 0;
                  const isFullyComplete = totalLectures > 0 && completedCount >= totalLectures;

                  if (isFullyComplete) {
                    console.log('🎓 CLIENT: Course is 100% complete — showing certificate view');
                    // Don't set currentLecture so the certificate/completion UI renders
                    setExpandedSections({ [targetSectionId]: true });
                    setCurrentLectureCompleted(true);
                  } else {
                    console.log('⚠️ CLIENT: No next incomplete lecture found; staying on completed lecture');
                    setCurrentLecture(targetLecture);
                    setExpandedSections({ [targetSectionId]: true });
                    setCurrentLectureCompleted(true);
                  }
                }
              } else {
                // Set the lecture and prepare for resume
                setCurrentLecture(targetLecture);
                setExpandedSections({ [targetSectionId]: true });
                
                // Set resume position if not completed
                if (!currentPosition.isCompleted && currentPosition.currentTime > 0) {
                  setLastWatchedPosition(currentPosition.currentTime);
                  setVideoWatchedPercentage(currentPosition.videoProgress || 0);
                  setAutoResumeActive(true);
                  console.log(`⏮️ CLIENT: AUTOMATIC RESUME configured - will resume from ${currentPosition.currentTime}s (${(currentPosition.videoProgress || 0).toFixed(2)}%)`);
                  
                  // Show auto-resume notification to user
                  console.log(`🎯 CLIENT: AUTO-RESUME ACTIVE - User will continue from where they left off`);
                } else if (currentPosition.isNext) {
                  console.log('➡️ CLIENT: Starting next incomplete lecture');
                  setLastWatchedPosition(0);
                  setVideoWatchedPercentage(0);
                  setAutoResumeActive(false);
                }
              }
              setCurrentLectureCompleted(currentPosition.isCompleted || false);
            } else {
              // Fallback to first lecture if target not found
              console.log('⚠️ CLIENT: Target lecture not found, falling back to first');
              selectFirstLecture(response.data.curriculum.sections);
            }
          } else {
            // No progress or should start from beginning — but double-check completion
            const allSections = response.data.curriculum.sections;
            const totalLectures = allSections.reduce((t, s) => t + (s.lectures?.length || 0), 0);
            const completedCount = progressData?.lectureProgress?.filter(p => p.completed).length || 0;
            const isFullyComplete = totalLectures > 0 && completedCount >= totalLectures;

            if (isFullyComplete) {
              console.log('🎓 CLIENT: Course is 100% complete — showing certificate view');
              // Don't set currentLecture so the certificate/completion UI renders
            } else {
              console.log('🆕 CLIENT: Starting course from beginning');
              selectFirstLecture(response.data.curriculum.sections);
            }
          }
        } else {
          console.log('No curriculum found in course data, adding mock curriculum for testing');
          // Mock curriculum for testing when backend doesn't have curriculum
          const mockCurriculum = {
            sections: [
              {
                _id: 'mock-section-1',
                order: 1,
                title: 'Getting Started',
                description: 'Introduction to the course',
                lectures: [
                  {
                    _id: 'mock-lecture-1',
                    order: 1,
                    title: 'Welcome Video',
                    type: 'video',
                    duration: '5:30',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    content: 'Welcome to this course! This is a sample video.'
                  },
                  {
                    _id: 'mock-lecture-2', 
                    order: 2,
                    title: 'Knowledge Check Quiz',
                    type: 'quiz',
                    duration: '10:00',
                    content: 'Test your understanding with this quiz.',
                    quizData: {
                      instructions: 'Please answer all questions to the best of your ability.',
                      passingScore: 70,
                      questions: [
                        {
                          _id: 'q1',
                          question: 'What is the main purpose of this course?',
                          type: 'multiple-choice',
                          options: [
                            'To learn programming',
                            'To understand web development',
                            'To master React.js',
                            'All of the above'
                          ],
                          correctAnswer: 'All of the above'
                        },
                        {
                          _id: 'q2',
                          question: 'Which technology is primarily used for frontend development?',
                          type: 'multiple-choice',
                          options: [
                            'Node.js',
                            'MongoDB',
                            'React.js',
                            'Express.js'
                          ],
                          correctAnswer: 'React.js'
                        }
                      ]
                    }
                  },
                  {
                    _id: 'mock-lecture-3',
                    order: 3,
                    title: 'Course Overview',
                    type: 'video',
                    duration: '8:45',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                    content: 'Here\'s what you\'ll learn in this course.'
                  }
                ]
              }
            ]
          };
          
          setSections(mockCurriculum.sections);
          
          // Even with mock curriculum, check user's current position
          const currentPosition = await fetchUserCurrentPosition();
          
          if (currentPosition && !currentPosition.shouldStartFromBeginning) {
            // User has progress - find the lecture in mock curriculum
            console.log('🎯 CLIENT: (Mock) Continuing from user position:', currentPosition);
            
            let targetLecture = null;
            let targetSectionId = null;
            
            for (const section of mockCurriculum.sections) {
              const foundLecture = section.lectures.find(
                lecture => lecture._id.toString() === currentPosition.lectureId
              );
              
              if (foundLecture) {
                targetLecture = {
                  ...foundLecture,
                  sectionId: section._id
                };
                targetSectionId = section._id;
                break;
              }
            }
            
            if (targetLecture) {
              console.log('✅ CLIENT: (Mock) Found target lecture:', targetLecture.title);
              setCurrentLecture(targetLecture);
              setExpandedSections({ [targetSectionId]: true });
              
              // Set resume position if not completed
              if (!currentPosition.isCompleted && currentPosition.currentTime > 0) {
                setLastWatchedPosition(currentPosition.currentTime);
                setVideoWatchedPercentage(currentPosition.videoProgress || 0);
                console.log(`⏮️ CLIENT: (Mock) Will resume from ${currentPosition.currentTime}s`);
              } else if (currentPosition.isNext) {
                console.log('➡️ CLIENT: (Mock) Starting next incomplete lecture');
                setLastWatchedPosition(0);
                setVideoWatchedPercentage(0);
              }
              
              setCurrentLectureCompleted(currentPosition.isCompleted || false);
            } else {
              console.log('⚠️ CLIENT: (Mock) Target lecture not found, selecting first');
              selectFirstLecture(mockCurriculum.sections);
            }
          } else {
            console.log('🆕 CLIENT: (Mock) Starting from beginning');
            selectFirstLecture(mockCurriculum.sections);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const userId = localStorage.getItem('userId');
      console.log('📡 CLIENT: Fetching user progress with details:', {
        userId,
        courseId,
        endpoint: `/courses/progress/${userId}/${courseId}`,
        userIdExists: !!userId,
        courseIdExists: !!courseId
      });
      
      if (userId) {
        const response = await api.get(`/courses/progress/${userId}/${courseId}`);
        console.log('📋 CLIENT: Full progress response:', {
          status: response.status,
          data: response.data,
          success: response.data?.success,
          progressExists: !!response.data?.courseProgress
        });
        
        if (response.data && response.data.success) {
          // API returns courseProgress, not progress
          const progressData = response.data.courseProgress || response.data.progress || {};
          const userProgressData = {
            ...progressData,
            lectureProgress: progressData.lectureProgress || []
          };
          setUserProgress(userProgressData);
          console.log('User progress loaded:', userProgressData);
          return userProgressData;
        } else {
          console.log('⚠️ CLIENT: No valid progress data received');
          const emptyProgress = { lectureProgress: [] };
          setUserProgress(emptyProgress);
          return emptyProgress;
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      const emptyProgress = { lectureProgress: [] };
      setUserProgress(emptyProgress);
      return emptyProgress;
    }
  };

  // New function to fetch user's current position and determine where to continue
  const fetchUserCurrentPosition = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return null;
      
      console.log('🎯 CLIENT: Fetching user current position...', {
        userId,
        courseId,
        endpoint: `/courses/current-position/${userId}/${courseId}`
      });
      
      const response = await api.get(`/courses/current-position/${userId}/${courseId}`);
      
      if (response.data && response.data.success) {
        console.log('📍 CLIENT: Current position response:', response.data.currentPosition);
        return response.data.currentPosition;
      }
      
      // If no current position found, call debug endpoint to understand why
      console.log('🐛 CLIENT: No current position found, calling debug endpoint...');
      try {
        const debugResponse = await api.get(`/courses/debug-progress/${userId}/${courseId}`);
        console.log('🐛 CLIENT: Debug response:', debugResponse.data);
      } catch (debugError) {
        console.log('🐛 CLIENT: Debug endpoint failed:', debugError);
      }
      
      console.log('⚠️ CLIENT: No current position data received');
      return null;
    } catch (error) {
      console.error('❌ CLIENT: Error fetching current position:', error);
      console.error('❌ CLIENT: Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return null;
    }
  };

  // Helper function to select the first available lecture
  const selectFirstLecture = (sections) => {
    for (const section of sections) {
      if (section.lectures && section.lectures.length > 0) {
        const firstLecture = {
          ...section.lectures[0],
          sectionId: section._id || section.id || 0
        };
        console.log('📍 CLIENT: Selecting first lecture:', firstLecture.title);
        setCurrentLecture(firstLecture);
        setExpandedSections({ [section._id || section.id || 0]: true });
        setLastWatchedPosition(0);
        setVideoWatchedPercentage(0);
        setCurrentLectureCompleted(false);
        return;
      }
    }
  };

  const handleLectureProgress = (videoProgress, completed) => {
    if (currentLecture) {
      setUserProgress(prev => {
        const updatedProgress = {
          ...prev,
          lectureProgress: prev.lectureProgress || []
        };
        
        // Find existing progress or create new one
        const existingProgressIndex = updatedProgress.lectureProgress.findIndex(
          lp => lp.lectureId === currentLecture._id
        );
        
        const progressUpdate = {
          lectureId: currentLecture._id,
          videoProgress,
          completed,
          lastAccessed: new Date()
        };
        
        if (existingProgressIndex >= 0) {
          updatedProgress.lectureProgress[existingProgressIndex] = progressUpdate;
        } else {
          updatedProgress.lectureProgress.push(progressUpdate);
        }
        
        return updatedProgress;
      });
      
      // Update completion status for UI
      setCurrentLectureCompleted(completed);
      
      // If lecture is completed, auto-advance to next available lecture after delay
      if (completed) {
        setTimeout(() => {
          autoAdvanceToNextLecture();
        }, 3000); // Wait 3 seconds before auto-advancing
      }
    }
  };

  const handleCourseProgressUpdate = (courseProgress) => {
    if (courseProgress) {
      setOverallCourseProgress(courseProgress.overallProgress || 0);
      console.log(`Course progress updated: ${courseProgress.overallProgress}%`);
    }
  };

  const handleLectureComplete = (lectureId) => {
    console.log(`Lecture ${lectureId} completed`);
    // Refresh progress data to ensure UI is updated
    fetchUserProgress().then(() => {
      // Auto-advance to next lecture after progress is updated
      setTimeout(() => {
        autoAdvanceToNextLecture();
      }, 1500);
    });
  };

  const markLectureCompleted = async (lectureId, contentType = 'video') => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      // Update local progress state first
      setUserProgress(prev => {
        const updatedProgress = {
          ...prev,
          lectureProgress: prev.lectureProgress || []
        };
        
        const existingProgressIndex = updatedProgress.lectureProgress.findIndex(
          lp => lp.lectureId === lectureId
        );
        
        const progressUpdate = {
          lectureId,
          videoProgress: contentType === 'video' ? 100 : 0,
          completed: true,
          completedAt: new Date().toISOString(),
          contentType,
          lastAccessed: new Date().toISOString()
        };
        
        if (existingProgressIndex >= 0) {
          updatedProgress.lectureProgress[existingProgressIndex] = progressUpdate;
        } else {
          updatedProgress.lectureProgress.push(progressUpdate);
        }
        
        return updatedProgress;
      });
      
      // Update server with comprehensive data
      console.log('🎯 CLIENT: markLectureCompleted - sending to server:', {
        learnerId: userId,
        courseId,
        lectureId,
        contentType,
        completed: true
      });
      
      const response = await api.post('/courses/updateLectureProgress', {
        learnerId: userId,
        courseId,
        lectureId,
        sectionId: currentLecture?.sectionId || null,
        completed: true,
        videoProgress: contentType === 'video' ? 100 : 0,
        progress: contentType === 'video' ? 100 : 0,
        currentTime: contentType === 'video' ? (lastWatchedPosition || 0) : 0, // Add required currentTime
        contentType,
        watchTime: 0,
        totalDuration: 0
      });
      
      console.log('Progress updated on server:', response.data);
      
      // Auto-advance after manual completion
      setTimeout(() => {
        autoAdvanceToNextLecture();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const calculateCourseCompletion = () => {
    if (!sections.length) return 0;
    
    const totalLectures = sections.reduce((total, section) => 
      total + (section.lectures?.length || 0), 0
    );
    
    if (totalLectures === 0) return 0;
    
    const completedLectures = userProgress.lectureProgress?.filter(
      progress => progress.completed
    ).length || 0;
    
    return Math.round((completedLectures / totalLectures) * 100);
  };

  const getNextContent = () => {
    if (!currentLecture || !sections.length) return null;
    
    const currentSectionIndex = sections.findIndex(s => (s._id || s.id) === currentLecture.sectionId);
    const currentLectureIndex = sections[currentSectionIndex]?.lectures?.findIndex(l => l._id === currentLecture._id);
    
    if (currentSectionIndex === -1 || currentLectureIndex === -1) return null;
    
    const currentSection = sections[currentSectionIndex];
    
    // Check for next lecture in same section
    if (currentLectureIndex < currentSection.lectures.length - 1) {
      const nextLecture = currentSection.lectures[currentLectureIndex + 1];
      return {
        type: 'lecture',
        title: nextLecture.title,
        duration: nextLecture.duration,
        sectionTitle: currentSection.title,
        sectionNumber: currentSectionIndex + 1,
        lectureNumber: currentLectureIndex + 2,
        data: nextLecture,
        sectionId: currentLecture.sectionId
      };
    }
    
    // Check for next section
    if (currentSectionIndex < sections.length - 1) {
      const nextSection = sections[currentSectionIndex + 1];
      if (nextSection.lectures && nextSection.lectures.length > 0) {
        const firstLectureOfNextSection = nextSection.lectures[0];
        return {
          type: 'section',
          title: firstLectureOfNextSection.title,
          duration: firstLectureOfNextSection.duration,
          sectionTitle: nextSection.title,
          sectionNumber: currentSectionIndex + 2,
          lectureNumber: 1,
          data: firstLectureOfNextSection,
          sectionId: nextSection._id || nextSection.id
        };
      }
    }
    
    return null;
  };

  const autoAdvanceToNextLecture = () => {
    if (!currentLecture || !sections.length) return;
    
    // Check if current lecture is completed
    const currentProgress = userProgress.lectureProgress?.find(
      lp => lp.lectureId === currentLecture._id
    );
    
    if (!currentProgress?.completed) {
      console.log('Current lecture not completed, cannot advance');
      return;
    }
    
    const currentSectionIndex = sections.findIndex(s => (s._id || s.id) === currentLecture.sectionId);
    const currentLectureIndex = sections[currentSectionIndex]?.lectures?.findIndex(l => l._id === currentLecture._id);
    
    if (currentSectionIndex === -1 || currentLectureIndex === -1) return;
    
    const currentSection = sections[currentSectionIndex];
    
    // Try to advance to next incomplete lecture in same section
    for (let i = currentLectureIndex + 1; i < currentSection.lectures.length; i++) {
      const nextLecture = currentSection.lectures[i];
      const nextLectureProgress = userProgress.lectureProgress?.find(
        lp => lp.lectureId === nextLecture._id
      );
      
      // Find first incomplete lecture
      if (!nextLectureProgress?.completed) {
        const nextLectureStatus = getLectureStatus(nextLecture, currentLecture.sectionId);
        if (nextLectureStatus === 'available') {
          console.log('Auto-advancing to next incomplete lecture:', nextLecture.title);
          selectLecture(nextLecture, currentLecture.sectionId);
          return;
        }
      }
    }
    
    // Try to advance to first incomplete lecture of next section
    for (let sectionIdx = currentSectionIndex + 1; sectionIdx < sections.length; sectionIdx++) {
      const nextSection = sections[sectionIdx];
      if (nextSection.lectures && nextSection.lectures.length > 0) {
        for (let lectureIdx = 0; lectureIdx < nextSection.lectures.length; lectureIdx++) {
          const nextLecture = nextSection.lectures[lectureIdx];
          const nextLectureProgress = userProgress.lectureProgress?.find(
            lp => lp.lectureId === nextLecture._id
          );
          
          // Find first incomplete lecture
          if (!nextLectureProgress?.completed) {
            const nextLectureStatus = getLectureStatus(nextLecture, nextSection._id || nextSection.id);
            if (nextLectureStatus === 'available') {
              console.log('Auto-advancing to next section:', nextSection.title);
              setExpandedSections(prev => ({
                ...prev,
                [nextSection._id || nextSection.id]: true
              }));
              selectLecture(nextLecture, nextSection._id || nextSection.id);
              return;
            }
          }
        }
      }
    }
    
    console.log('All lectures completed! Course finished.');
    setCurrentLecture(null); // Clear current lecture when course is complete
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Find the next incomplete lecture after a given lecture (searches same section then subsequent sections)
  const findNextIncompleteFrom = (lecture, sectionId, progressData = null) => {
    if (!sections || sections.length === 0) return null;

    // Use provided progressData or fall back to state
    const lectureProgress = progressData?.lectureProgress || userProgress.lectureProgress || [];

    const sectionIndex = sections.findIndex(s => (s._id || s.id) === sectionId);
    if (sectionIndex === -1) return null;

    const lecturesInSection = sections[sectionIndex]?.lectures || [];
    const lectureIndex = lecturesInSection.findIndex(l => String(l._id) === String(lecture._id));
    if (lectureIndex === -1) return null;

    // Look in same section for next incomplete
    for (let i = lectureIndex + 1; i < lecturesInSection.length; i++) {
      const candidate = lecturesInSection[i];
      const prog = lectureProgress.find(lp => String(lp.lectureId) === String(candidate._id));
      if (!prog?.completed) {
        return { data: candidate, sectionId: sectionId, sectionNumber: sectionIndex + 1, lectureNumber: i + 1, title: candidate.title };
      }
    }

    // Look in following sections
    for (let s = sectionIndex + 1; s < sections.length; s++) {
      const sec = sections[s];
      if (!sec.lectures || sec.lectures.length === 0) continue;
      for (let j = 0; j < sec.lectures.length; j++) {
        const candidate = sec.lectures[j];
        const prog = lectureProgress.find(lp => String(lp.lectureId) === String(candidate._id));
        if (!prog?.completed) {
          return { data: candidate, sectionId: sec._id || sec.id, sectionNumber: s + 1, lectureNumber: j + 1, title: candidate.title };
        }
      }
    }

    return null;
  };

  const selectLecture = async (lecture, sectionId, forceLoad = false) => {
    console.log('Selecting lecture:', lecture.title, 'Type:', lecture.type, 'ForceLoad:', forceLoad);

    // Check lecture access status
    const status = getLectureStatus(lecture, sectionId);
    console.log('Lecture access status:', status);

    // If locked, ignore
    if (status === 'locked') {
      console.log('Lecture not accessible (locked):', lecture.title);
      return;
    }

    // If lecture already completed and not forcing load, auto-advance to next incomplete lecture
    if (status === 'completed' && !forceLoad) {
      console.log('Lecture already completed, searching for next incomplete...');
      const next = findNextIncompleteFrom(lecture, sectionId);
      if (next) {
        console.log('Auto-advancing to next incomplete lecture:', next.title);
        // select the lecture object
        await selectLecture(next.data, next.sectionId, false);
        return;
      } else {
        console.log('No next incomplete lecture found — loading completed lecture');
        // Fall through to load the completed lecture
      }
    }

    // Allow access to available or completed lectures
    if (status === 'available' || status === 'completed') {
      // Set loading state
      setIsLoadingLecture(true);
      
      const lectureWithSection = { 
        ...lecture, 
        sectionId: sectionId 
      };
      setCurrentLecture(lectureWithSection);
      
      // Reset video states for new lecture
      setVideoProgress(0);
      setVideoWatchedPercentage(0);
      setHasVideoStarted(false);
      setLastWatchedPosition(0);
      setIsPlaying(false);
      setAutoResumeActive(false);
      
      let savedProgress = null;
      
      try {
        // For video lectures, fetch saved progress for resume functionality
        if (lecture.type === 'video') {
          console.log('🎥 CLIENT: Processing video lecture:', {
            lectureId: lecture._id,
            lectureTitle: lecture.title
          });
          
          savedProgress = await fetchLectureProgress(lecture._id);
          console.log('📋 CLIENT: Fetched saved progress for lecture:', savedProgress);
          
          if (savedProgress) {
            const isCompleted = savedProgress.completed || false;
            const resumeTime = savedProgress.currentTime || 0;
            const resumeProgress = savedProgress.videoProgress || 0;
            
            console.log('🔄 CLIENT: Resume logic:', {
              isCompleted,
              resumeTime,
              resumeProgress,
              willAutoPlay: !isCompleted,
              startPosition: isCompleted ? 0 : resumeTime
            });
            
            setCurrentLectureCompleted(isCompleted);
            
            // Always restore saved timestamp for resume, regardless of completion status
            if (resumeTime > 0) {
              setLastWatchedPosition(resumeTime);
              setVideoWatchedPercentage(resumeProgress);
              setAutoResumeActive(true);
              console.log(`✨ CLIENT: RESUMING from checkpoint: ${resumeTime}s (${resumeProgress.toFixed(2)}%) - Completed: ${isCompleted}`);
            } else {
              // New video or no saved time, start from beginning
              setLastWatchedPosition(0);
              setVideoWatchedPercentage(isCompleted ? 100 : 0);
              setAutoResumeActive(false);
              console.log(`🆕 CLIENT: ${isCompleted ? 'Completed video' : 'New video'}, starting from beginning`);
            }
          } else {
            console.log('📝 CLIENT: No saved progress found, starting fresh');
            setLastWatchedPosition(0);
            setVideoWatchedPercentage(0);
            setAutoResumeActive(false);
          }
        }
        
        // Check if lecture is already completed (fallback to old method)
        if (!savedProgress) {
          const lectureProgress = userProgress.lectureProgress?.find(
            lp => String(lp.lectureId) === String(lecture._id)
          );
          setCurrentLectureCompleted(lectureProgress?.completed || false);
          
          // For completed lectures, load saved progress
          if (lectureProgress?.currentTime) {
            setLastWatchedPosition(lectureProgress.currentTime);
            setVideoWatchedPercentage(lectureProgress.videoProgress || 0);
            if (lectureProgress.currentTime > 0) {
              setAutoResumeActive(true);
            }
          }
        }
        
        console.log('Selected lecture:', lectureWithSection);
        
        // Fetch content data based on lecture type
        if (['quiz', 'article', 'assignment'].includes(lecture.type)) {
          console.log(`🎯 CLIENT: Fetching ${lecture.type} content for:`, lecture.title);
          await fetchContentData(lecture._id, lecture.type);
        }
      } finally {
        // Clear loading state
        setIsLoadingLecture(false);
      }
    } else {
      console.log('Lecture not accessible:', status);
    }
  };

  const handleVideoProgress = (event) => {
    const progress = (event.target.currentTime / event.target.duration) * 100;
    setVideoProgress(progress);
    
    // Auto-complete when video reaches 90%
    if (progress >= 90 && !userProgress[currentLecture._id]?.completed) {
      markLectureCompleted(currentLecture._id);
    }
  };

  const getLectureStatus = (lecture, sectionId) => {
    // Check if lecture is completed in new progress structure
    const lectureProgress = userProgress.lectureProgress?.find(
      lp => String(lp.lectureId) === String(lecture._id)
    );
    
    if (lectureProgress?.completed) return 'completed';
    
    const sectionIndex = sections.findIndex(s => (s._id || s.id) === sectionId);
    const lectureIndex = sections[sectionIndex]?.lectures?.findIndex(l => l._id === lecture._id);
    
    // First lecture of first section is always available
    if (sectionIndex === 0 && lectureIndex === 0) return 'available';
    
    // For other lectures in the same section, check if previous lecture is completed
    if (lectureIndex > 0) {
      const prevLecture = sections[sectionIndex].lectures[lectureIndex - 1];
      const prevProgress = userProgress.lectureProgress?.find(
        lp => String(lp.lectureId) === String(prevLecture._id)
      );
      if (prevProgress?.completed) return 'available';
    }
    
    // For first lecture of subsequent sections, check if previous section is completed
    if (lectureIndex === 0 && sectionIndex > 0) {
      const prevSection = sections[sectionIndex - 1];
      const allPrevSectionLecturesCompleted = prevSection.lectures.every(prevLecture => {
        const prevProgress = userProgress.lectureProgress?.find(
          lp => String(lp.lectureId) === String(prevLecture._id)
        );
        return prevProgress?.completed;
      });
      
      if (allPrevSectionLecturesCompleted) return 'available';
    }
    
    return 'locked';
  };

  const getLectureIcon = (type) => {
    switch (type) {
      case 'video': return <FaVideo />;
      case 'assignment': return <FaTasks />;
      case 'resource': return <FaFileAlt />;
      default: return <FaFileAlt />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheck />;
      case 'locked': return <FaLock />;
      default: return null;
    }
  };

  if (!course) {
    return (
      <LearnerContainer>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
          <h2>Loading course...</h2>
          <p>Please wait while we fetch the course content.</p>
        </div>
      </LearnerContainer>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <LearnerContainer>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
          <h2>Course Content</h2>
          <p>This course doesn't have any curriculum content yet.</p>
          <p>Course Title: {course.title}</p>
          <p>Please contact the instructor to add course content.</p>
        </div>
      </LearnerContainer>
    );
  }

  return (
    <LearnerContainer>
      <MainContent>
        {/* Left Sidebar - Course Content */}
        <LeftSidebar>
          <SidebarHeader>
            <SidebarTitle>Course Content</SidebarTitle>
          </SidebarHeader>
          
          {sections.map((section, sectionIndex) => (
            <SectionItem key={section._id}>
              <SectionHeader
                expanded={expandedSections[section._id]}
                onClick={() => toggleSection(section._id)}
              >
                <SectionTitle>
                  Section {sectionIndex + 1}: {section.title}
                  <span style={{ 
                    fontSize: '0.8rem', 
                    opacity: 0.7, 
                    marginLeft: '1rem' 
                  }}>
                    ({section.lectures?.filter(lecture => {
                      const progress = userProgress.lectureProgress?.find(lp => lp.lectureId === lecture._id);
                      return progress?.completed;
                    }).length || 0}/{section.lectures?.length || 0})
                  </span>
                </SectionTitle>
                {expandedSections[section._id] ? <FaChevronDown /> : <FaChevronRight />}
              </SectionHeader>
              
              <AnimatePresence>
                {expandedSections[section._id] && (
                  <LectureList
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {section.lectures?.map((lecture, lectureIndex) => {
                      const status = getLectureStatus(lecture, section._id);
                      return (
                        <LectureItem
                          key={lecture._id}
                          active={currentLecture?._id === lecture._id}
                          locked={status === 'locked'}
                          onClick={() => {
                            if (status !== 'locked') {
                              // Force load when user explicitly clicks on a lecture
                              selectLecture(lecture, section._id, true);
                            }
                          }}
                        >
                          <LectureInfo>
                            <LectureIcon type={lecture.type}>
                              {getLectureIcon(lecture.type)}
                            </LectureIcon>
                            <LectureName 
                              completed={status === 'completed'}
                              locked={status === 'locked'}
                            >
                              {lecture.title}
                              {status === 'completed' && ' ✓'}
                              {status === 'locked' && ' 🔒'}
                            </LectureName>
                          </LectureInfo>
                          <LectureStatus>
                            <StatusIcon status={status}>
                              {getStatusIcon(status)}
                            </StatusIcon>
                          </LectureStatus>
                        </LectureItem>
                      );
                    })}
                  </LectureList>
                )}
              </AnimatePresence>
            </SectionItem>
          ))}
        </LeftSidebar>

        {/* Main Content Area */}
        <VideoContentArea>
          {/* Loading Indicator */}
          {isLoadingLecture && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              background: 'rgba(124, 58, 237, 0.1)',
              borderRadius: '12px',
              marginBottom: '1rem',
              border: '1px solid rgba(124, 58, 237, 0.3)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                color: '#7c3aed'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(124, 58, 237, 0.3)',
                  borderTop: '3px solid #7c3aed',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Loading lecture content...</span>
              </div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* Video Section */}
          {currentLecture?.type === 'video' && (
            <VideoSection>
              {/* Resume Indicator */}
              {lastWatchedPosition > 30 && !currentLectureCompleted && (
                <ResumeIndicator>
                  <ResumeText>
                    <FaClock className="resume-icon" />
                    <div className="resume-message">
                      {autoResumeActive ? 'Auto-resuming' : 'Resume'} from <span className="resume-time">{formatTime(lastWatchedPosition)}</span>
                      {videoWatchedPercentage > 0 && (
                        <span> ({Math.round(videoWatchedPercentage)}% watched)</span>
                      )}
                      {autoResumeActive && (
                        <div style={{fontSize: '0.85em', opacity: 0.8, marginTop: '4px'}}>
                          ✨ Automatically restored your last position
                        </div>
                      )}
                    </div>
                  </ResumeText>
                  <ResumeButton onClick={() => {
                    // Video player will automatically seek to lastWatchedPosition
                    // This button just provides visual confirmation
                    setAutoResumeActive(false);
                    console.log('🎯 CLIENT: Resume clicked - will start from:', lastWatchedPosition);
                  }}>
                    <FaPlayCircle />
                    {autoResumeActive ? 'Continue' : 'Resume'}
                  </ResumeButton>
                </ResumeIndicator>
              )}
              
              {currentLecture.videoUrl ? (
                <div style={{ position: 'relative' }}>
                  {/* Debug Info for Resume Position */}
                  {console.log('🎥 CLIENT: Rendering LectureVideoPlayer with:', {
                    lectureId: currentLecture._id,
                    lectureTitle: currentLecture.title,
                    startTime: lastWatchedPosition || 0,
                    videoWatchedPercentage: videoWatchedPercentage,
                    currentLectureCompleted: currentLectureCompleted,
                    hasVideoStarted: hasVideoStarted
                  })}
                  
                  <LectureVideoPlayer
                    videoUrl={currentLecture.videoUrl}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                    autoPlay={false}
                    startTime={lastWatchedPosition || 0}
                    showCompletionOverlay={false}
                  />
                  
                  {/* Next Content Info - Non-blocking */}
                  {nextContent && (
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      right: '20px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      maxWidth: '300px',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      zIndex: 5
                    }}>
                      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#7c3aed' }}>
                        Up Next: {nextContent.title}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        Section {nextContent.sectionNumber}, Lecture {nextContent.lectureNumber}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <VideoPlayer>
                  <VideoOverlay show={true}>
                    <div style={{ textAlign: 'center' }}>
                      <h3>Video not available</h3>
                      <p>This video hasn't been uploaded yet.</p>
                    </div>
                  </VideoOverlay>
                </VideoPlayer>
              )}
            </VideoSection>
          )}

          <ContentArea>
          {currentLecture ? (
            <>
              <LectureTitle>
                {currentLecture.title}
              </LectureTitle>
              
              {/* Course progress removed from content area - progress shown in left sidebar only */}
              
              <LectureDescription>
                {(() => {
                  const content = currentLecture.content || currentLecture.description || '';
                  const title = currentLecture.title || '';
                  // Avoid repeating the title if content equals or starts with the title
                  if (!content) return null;
                  if (content.trim() === title.trim()) return null;
                  if (content.trim().startsWith(title.trim())) {
                    // Remove the repeated title prefix
                    return <p>{content.trim().slice(title.trim().length).trim()}</p>;
                  }
                  return <p>{content}</p>;
                })()}
              </LectureDescription>

              {/* Quiz Handling */}
              {currentLecture.type === 'quiz' && (
                <QuizCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <QuizTitle>
                    <FaTasks />
                    Quiz: {currentLecture.title}
                  </QuizTitle>
                  
                  {quizzes[currentLecture._id] ? (
                    <QuizContent 
                      quiz={quizzes[currentLecture._id]} 
                      onSubmit={(answers) => submitQuiz(currentLecture._id, answers)}
                      result={quizResults[currentLecture._id]}
                      currentAttempts={quizAttempts[currentLecture._id] || 0}
                      onRetry={() => {
                        // Clear current result to show quiz form again
                        setQuizResults(prev => ({
                          ...prev,
                          [currentLecture._id]: null
                        }));
                      }}
                    />
                  ) : (
                    <div>Loading quiz...</div>
                  )}
                </QuizCard>
              )}

              {/* Article Handling */}
              {currentLecture.type === 'article' && (
                <ArticleCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ArticleTitle>
                    <FaFileAlt />
                    Article: {currentLecture.title}
                  </ArticleTitle>
                  
                  {(() => {
                    const entry = articles[currentLecture._id];
                    const localFallback = currentLecture?.article?.content || currentLecture?.content || null;
                    const hasFetched = typeof entry !== 'undefined';
                    const contentHtml = entry?.content || entry?.textPreview || localFallback;

                    if (!hasFetched && !contentHtml) {
                      return <div>Loading article...</div>;
                    }

                    if (contentHtml) {
                      return (
                        <ArticleContent>
                          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                          <ActionButton 
                            variant="success"
                            onClick={() => markLectureCompleted(currentLecture._id, 'article')}
                            style={{ marginTop: '2rem' }}
                            disabled={currentLectureCompleted}
                          >
                            <FaCheck />
                            {currentLectureCompleted ? 'Article Completed' : 'Mark as Read'}
                          </ActionButton>
                        </ArticleContent>
                      );
                    }

                    return <div>No article content available.</div>;
                  })()}
                </ArticleCard>
              )}

              {/* Assignment Handling */}
              {currentLecture.type === 'assignment' && (
                <AssignmentCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AssignmentTitle>
                    <FaTasks />
                    Assignment: {currentLecture.title}
                  </AssignmentTitle>
                  <p>{currentLecture.description || assignments[currentLecture._id]?.description}</p>
                  
                  {assignments[currentLecture._id]?.submission ? (
                    <SubmissionStatus status={assignments[currentLecture._id].submission.status}>
                      <h4>Submission Status: {assignments[currentLecture._id].submission.status}</h4>
                      <p>Submitted: {new Date(assignments[currentLecture._id].submission.submittedAt).toLocaleDateString()}</p>
                      {assignments[currentLecture._id].submission.feedback && (
                        <div>
                          <strong>Feedback:</strong>
                          <p>{assignments[currentLecture._id].submission.feedback}</p>
                          {assignments[currentLecture._id].submission.grade && (
                            <p><strong>Grade:</strong> {assignments[currentLecture._id].submission.grade}</p>
                          )}
                        </div>
                      )}
                    </SubmissionStatus>
                  ) : (
                    <AssignmentActions>
                      <ActionButton 
                        variant="primary"
                        onClick={() => setShowSubmissionModal(true)}
                      >
                        <FaUpload />
                        Submit Assignment
                      </ActionButton>
                    </AssignmentActions>
                  )}
                </AssignmentCard>
              )}

              {/* Resource Handling */}
              {currentLecture.type === 'resource' && (
                <div style={{ marginTop: '2rem' }}>
                  <h3>Course Resources</h3>
                  <ActionButton variant="primary">
                    <FaDownload />
                    Download Resource
                  </ActionButton>
                </div>
              )}

              {/* Mark as Complete Button */}
              {!currentLectureCompleted && 
               ['video', 'article'].includes(currentLecture.type) && (
                <ActionButton 
                  variant="success"
                  onClick={() => markLectureCompleted(currentLecture._id, currentLecture.type)}
                  style={{ marginTop: '2rem' }}
                >
                  <FaCheck />
                  Mark as Complete
                </ActionButton>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              {calculateCourseCompletion() === 100 ? (
                <>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
                  <h2>Course Completed!</h2>
                  <p style={{ opacity: 0.8, marginBottom: '2rem' }}>Congratulations on completing the entire course!</p>
                  <ActionButton
                    variant="success"
                    onClick={async () => {
                      try {
                        const userId = localStorage.getItem('userId');
                        const res = await api.post(`/courses/certificate/generate/${courseId}/${userId}`);
                        if (res.data.success) {
                          const cert = res.data.certificate;
                          downloadCertificate({
                            learnerName: cert.learnerName || localStorage.getItem('userName') || 'Learner',
                            courseName: cert.courseName || course?.title || 'Course',
                            mentorName: cert.mentorName || 'Instructor',
                            certificateId: cert.certificateId || '',
                            completedDate: cert.completedDate || new Date().toISOString(),
                            grade: cert.grade || 'Pass',
                          });
                        } else {
                          alert(res.data.message || 'Could not generate certificate.');
                        }
                      } catch (err) {
                        console.error('Certificate error:', err);
                        alert(err.response?.data?.message || 'Failed to generate certificate. Please try again.');
                      }
                    }}
                  >
                    🏆 Download Certificate
                  </ActionButton>
                </>
              ) : (
                <>
                  <h2>Select a lecture to continue</h2>
                  <p style={{ opacity: 0.8 }}>Choose a lecture from the course content to start learning.</p>
                </>
              )}
            </div>
          )}
        </ContentArea>
        </VideoContentArea>

        {/* Right Sidebar removed — layout simplified to two columns */}
      </MainContent>

      {/* Assignment Submission Modal */}
      <AnimatePresence>
        {showSubmissionModal && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowSubmissionModal(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2>Submit Assignment</h2>
              <p>{currentLecture?.assignmentDescription}</p>
              
              <FileUpload>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  id="assignment-file"
                  onChange={async (e) => {
                    if (e.target.files[0]) {
                      const result = await submitAssignment(currentLecture._id, e.target.files[0]);
                      if (result.success) {
                        alert('Assignment submitted successfully!');
                      } else {
                        alert(result.error || 'Assignment submission failed. Please try again.');
                      }
                    }
                  }}
                />
                <label htmlFor="assignment-file" style={{ cursor: 'pointer' }}>
                  <FaUpload style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                  <p>Click to upload your assignment file</p>
                  <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                    Supports: .zip, .pdf, .doc, .txt files
                  </p>
                </label>
              </FileUpload>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <ActionButton 
                  variant="secondary" 
                  onClick={() => setShowSubmissionModal(false)}
                >
                  Cancel
                </ActionButton>
              </div>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </LearnerContainer>
  );
};

export default LearnerCourseView;