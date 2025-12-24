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
  FaEye
} from 'react-icons/fa';
import api from '../../services/api';
import LectureVideoPlayer from '../../components/LectureVideoPlayer';

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
  grid-template-columns: 400px 1fr 350px;
  gap: 2rem;
  padding: 2rem;
  min-height: calc(100vh - 4rem);
  
  @media (max-width: 1400px) {
    grid-template-columns: 350px 1fr 300px;
    gap: 1.5rem;
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 300px;
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
const QuizContent = ({ quiz, onSubmit, result }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    const result = await onSubmit(answers);
    setSubmitted(true);
  };

  if (result) {
    return (
      <div>
        <div style={{
          background: result.passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${result.passed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: 0, color: result.passed ? '#22c55e' : '#ef4444' }}>
            {result.passed ? '✅ Quiz Passed!' : '❌ Quiz Failed'}
          </h4>
          <p>Score: {result.score}/{result.totalQuestions}</p>
          <p>Percentage: {Math.round((result.score / result.totalQuestions) * 100)}%</p>
          {result.feedback && <p>{result.feedback}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Instructions:</strong> {quiz.instructions || 'Answer all questions and click submit.'}
      </div>
      
      {quiz.questions?.map((question, index) => (
        <div key={question._id || index} style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ marginTop: 0 }}>{index + 1}. {question.question}</h4>
          
          {question.type === 'multiple-choice' && (
            <div>
              {question.options?.map((option, optionIndex) => (
                <label key={optionIndex} style={{ display: 'block', margin: '0.5rem 0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`question-${question._id || index}`}
                    value={option}
                    onChange={() => handleAnswerChange(question._id || index, option)}
                    style={{ marginRight: '0.5rem' }}
                    disabled={submitted}
                  />
                  {option}
                </label>
              ))}
            </div>
          )}
          
          {question.type === 'text' && (
            <textarea
              value={answers[question._id || index] || ''}
              onChange={(e) => handleAnswerChange(question._id || index, e.target.value)}
              placeholder="Enter your answer..."
              disabled={submitted}
              style={{
                width: '100%',
                minHeight: '100px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                padding: '0.5rem',
                marginTop: '0.5rem'
              }}
            />
          )}
        </div>
      ))}
      
      <ActionButton 
        variant="primary"
        onClick={handleSubmit}
        disabled={submitted || !quiz.questions?.every(q => answers[q._id] || answers[quiz.questions.indexOf(q)])}
      >
        {submitted ? 'Submitting...' : 'Submit Quiz'}
      </ActionButton>
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
  const [userProgress, setUserProgress] = useState({ lectureProgress: [] });
  const [assignments, setAssignments] = useState({});
  const [quizzes, setQuizzes] = useState({});
  const [articles, setArticles] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [overallCourseProgress, setOverallCourseProgress] = useState(0);
  const [currentLectureCompleted, setCurrentLectureCompleted] = useState(false);
  const [nextContent, setNextContent] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      fetchUserProgress();
    }
  }, [courseId]);

  useEffect(() => {
    // Update next content when current lecture changes
    if (currentLecture && sections.length > 0) {
      setNextContent(getNextContent());
    }
  }, [currentLecture, sections]);

  useEffect(() => {
    // When user progress loads, find and select first incomplete lecture
    if (sections.length > 0 && userProgress.lectureProgress && !currentLecture) {
      const findFirstIncompleteLecture = () => {
        for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
          const section = sections[sectionIdx];
          if (section.lectures && section.lectures.length > 0) {
            for (let lectureIdx = 0; lectureIdx < section.lectures.length; lectureIdx++) {
              const lecture = section.lectures[lectureIdx];
              const progress = userProgress.lectureProgress.find(
                lp => lp.lectureId === lecture._id
              );
              
              // If lecture is not completed, select it
              if (!progress?.completed) {
                return {
                  lecture,
                  sectionId: section._id || section.id,
                  sectionIndex: sectionIdx
                };
              }
            }
          }
        }
        // If all lectures completed, return null
        return null;
      };
      
      const firstIncomplete = findFirstIncompleteLecture();
      if (firstIncomplete) {
        const lectureWithSection = {
          ...firstIncomplete.lecture,
          sectionId: firstIncomplete.sectionId
        };
        setCurrentLecture(lectureWithSection);
        setExpandedSections(prev => ({
          ...prev,
          [firstIncomplete.sectionId]: true
        }));
        console.log('Selected first incomplete lecture:', lectureWithSection);
      }
    }
  }, [userProgress.lectureProgress, sections]);

  const fetchContentData = async (lectureId, contentType) => {
    try {
      console.log(`Fetching ${contentType} data for lecture:`, lectureId);
      
      // Check if we have mock data first
      if (lectureId === 'mock-lecture-2' && contentType === 'quiz') {
        // Use mock quiz data
        const mockQuiz = {
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
        };
        setQuizzes(prev => ({ ...prev, [lectureId]: mockQuiz }));
        console.log('Mock quiz data loaded:', mockQuiz);
        return;
      }
      
      switch (contentType) {
        case 'quiz':
          const quizResponse = await api.get(`/courses/${courseId}/quiz/${lectureId}`);
          console.log('Quiz API response:', quizResponse.data);
          if (quizResponse.data.success) {
            setQuizzes(prev => ({ ...prev, [lectureId]: quizResponse.data.quiz }));
          }
          break;
        case 'article':
          const articleResponse = await api.get(`/courses/${courseId}/article/${lectureId}`);
          if (articleResponse.data.success) {
            setArticles(prev => ({ ...prev, [lectureId]: articleResponse.data.article }));
          }
          break;
        case 'assignment':
          const assignmentResponse = await api.get(`/courses/${courseId}/assignment/${lectureId}`);
          if (assignmentResponse.data.success) {
            setAssignments(prev => ({ ...prev, [lectureId]: assignmentResponse.data.assignment }));
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${contentType} data:`, error);
      
      // Fallback to mock data for testing
      if (contentType === 'quiz' && lectureId === 'mock-lecture-2') {
        const mockQuiz = {
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
            }
          ]
        };
        setQuizzes(prev => ({ ...prev, [lectureId]: mockQuiz }));
        console.log('Using fallback mock quiz data');
      }
    }
  };

  const submitQuiz = async (lectureId, answers) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.post(`/courses/${courseId}/quiz/${lectureId}/submit`, {
        learnerId: userId,
        answers,
        submittedAt: new Date().toISOString()
      });
      
      if (response.data.success) {
        setQuizResults(prev => ({ ...prev, [lectureId]: response.data.result }));
        // Mark quiz as completed if passed
        if (response.data.result.passed) {
          markLectureCompleted(lectureId, 'quiz');
        }
      }
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
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
      formData.append('submittedAt', new Date().toISOString());

      const response = await api.post(`/courses/${courseId}/assignment/${lectureId}/submit`, formData, {
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
      return { success: false, error: error.message };
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
          
          // Auto-select first incomplete lecture instead of always first lecture
          const findFirstIncompleteLecture = () => {
            for (let sectionIdx = 0; sectionIdx < response.data.curriculum.sections.length; sectionIdx++) {
              const section = response.data.curriculum.sections[sectionIdx];
              if (section.lectures && section.lectures.length > 0) {
                for (let lectureIdx = 0; lectureIdx < section.lectures.length; lectureIdx++) {
                  const lecture = section.lectures[lectureIdx];
                  // Check if lecture is incomplete (will be updated after fetchUserProgress)
                  return {
                    lecture,
                    sectionId: section._id || section.id || 0,
                    sectionIndex: sectionIdx
                  };
                }
              }
            }
            return null;
          };
          
          const firstLecture = findFirstIncompleteLecture();
          if (firstLecture) {
            const lectureWithSection = {
              ...firstLecture.lecture,
              sectionId: firstLecture.sectionId
            };
            console.log('Auto-selecting first lecture:', lectureWithSection);
            setCurrentLecture(lectureWithSection);
            setExpandedSections({ [firstLecture.sectionId]: true });
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
          
          // Auto-select first mock lecture
          const firstLecture = {
            ...mockCurriculum.sections[0].lectures[0],
            sectionId: mockCurriculum.sections[0]._id
          };
          setCurrentLecture(firstLecture);
          setExpandedSections({ [mockCurriculum.sections[0]._id]: true });
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const response = await api.get(`/courses/progress/${userId}/${courseId}`);
        console.log('Progress response:', response.data);
        if (response.data && response.data.success) {
          setUserProgress({
            ...response.data.progress,
            lectureProgress: response.data.progress?.lectureProgress || []
          });
          console.log('User progress loaded:', response.data.progress);
        } else {
          setUserProgress({ lectureProgress: [] });
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      setUserProgress({ lectureProgress: [] });
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
      const response = await api.post('/courses/updateLectureProgress', {
        learnerId: userId,
        courseId,
        lectureId,
        sectionId: currentLecture?.sectionId,
        completed: true,
        videoProgress: contentType === 'video' ? 100 : 0,
        contentType,
        completedAt: new Date().toISOString(),
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

  const selectLecture = (lecture, sectionId) => {
    const status = getLectureStatus(lecture, sectionId);
    
    // Allow access to available and completed lectures
    if (status === 'available' || status === 'completed') {
      const lectureWithSection = { 
        ...lecture, 
        sectionId: sectionId 
      };
      setCurrentLecture(lectureWithSection);
      
      // Fetch content data based on lecture type
      if (['quiz', 'article', 'assignment'].includes(lecture.type)) {
        fetchContentData(lecture._id, lecture.type);
      }
      
      // Check if lecture is already completed
      const lectureProgress = userProgress.lectureProgress?.find(
        lp => lp.lectureId === lecture._id
      );
      setCurrentLectureCompleted(lectureProgress?.completed || false);
      
      // For completed lectures, start from beginning to allow replay
      // For new lectures, start from saved progress
      if (status === 'completed') {
        setVideoProgress(0); // Allow full replay
      } else {
        setVideoProgress(lectureProgress?.videoProgress || 0);
      }
      
      console.log('Selected lecture:', lectureWithSection, 'Status:', status);
    } else {
      console.log('Lecture is locked:', lecture.title);
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
      lp => lp.lectureId === lecture._id
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
        lp => lp.lectureId === prevLecture._id
      );
      if (prevProgress?.completed) return 'available';
    }
    
    // For first lecture of subsequent sections, check if previous section is completed
    if (lectureIndex === 0 && sectionIndex > 0) {
      const prevSection = sections[sectionIndex - 1];
      const allPrevSectionLecturesCompleted = prevSection.lectures.every(prevLecture => {
        const prevProgress = userProgress.lectureProgress?.find(
          lp => lp.lectureId === prevLecture._id
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
                              selectLecture(lecture, section._id);
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
          {/* Video Section */}
          {currentLecture?.type === 'video' && (
            <VideoSection>
              {currentLecture.videoUrl ? (
                <div style={{ position: 'relative' }}>
                  <LectureVideoPlayer
                    videoUrl={currentLecture.videoUrl}
                    courseId={courseId}
                    lectureId={currentLecture._id}
                    sectionId={currentLecture.sectionId}
                    onProgressUpdate={handleLectureProgress}
                    onLectureComplete={handleLectureComplete}
                    onCourseProgressUpdate={handleCourseProgressUpdate}
                  />
                  
                  {/* Bottom Content Area */}
                  <VideoBottomContent show={nextContent}>
                    {currentLectureCompleted && (
                      <CompletionMessage>
                        <FaCheck style={{ color: '#22c55e' }} />
                        Lecture completed! Great job!
                      </CompletionMessage>
                    )}
                    
                    {nextContent && (
                      <NextContentInfo>
                        <NextContentDetails>
                          <NextLabel>
                            Next {nextContent.type === 'section' ? 'Section' : 'Lecture'}: 
                            {nextContent.type === 'section' && ` ${nextContent.sectionTitle}`}
                          </NextLabel>
                          <NextTitle>{nextContent.title}</NextTitle>
                          <NextMeta>
                            Section {nextContent.sectionNumber}, Lecture {nextContent.lectureNumber}
                            {nextContent.duration && ` • ${nextContent.duration}`}
                          </NextMeta>
                        </NextContentDetails>
                        
                        <NextButton 
                          enabled={currentLectureCompleted}
                          onClick={() => {
                            if (currentLectureCompleted && nextContent) {
                              selectLecture(nextContent.data, nextContent.sectionId);
                              if (nextContent.type === 'section') {
                                setExpandedSections(prev => ({
                                  ...prev,
                                  [nextContent.sectionId]: true
                                }));
                              }
                            }
                          }}
                        >
                          {currentLectureCompleted ? 'Continue' : 'Complete to Continue'}
                        </NextButton>
                      </NextContentInfo>
                    )}
                    
                    {!nextContent && currentLectureCompleted && (
                      <CompletionMessage>
                        <FaCheck style={{ color: '#22c55e' }} />
                        🎉 Congratulations! You've completed the entire course!
                      </CompletionMessage>
                    )}
                  </VideoBottomContent>
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
              <LectureTitle>{currentLecture.title}</LectureTitle>
              
              {/* Course Progress Display */}
              <CourseProgressSection>
                <h3>Course Progress</h3>
                <ProgressText>
                  <span>Overall Completion</span>
                  <span>{calculateCourseCompletion()}%</span>
                </ProgressText>
                <ProgressBarContainer>
                  <CourseProgressBar progress={calculateCourseCompletion()} />
                </ProgressBarContainer>
                
                {calculateCourseCompletion() === 100 && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginTop: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '2rem' }}>🎉</span>
                      <h4 style={{ margin: 0, color: '#22c55e' }}>Congratulations!</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                      You have successfully completed the entire course!
                    </p>
                    <ActionButton 
                      variant="success"
                      style={{ marginTop: '1rem' }}
                      onClick={() => {
                        console.log('Generate certificate or handle course completion');
                      }}
                    >
                      🏆 Get Certificate
                    </ActionButton>
                  </div>
                )}
              </CourseProgressSection>
              
              <LectureDescription>
                <p>{currentLecture.content || currentLecture.description}</p>
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
                    <QuizContent quiz={quizzes[currentLecture._id]} 
                                onSubmit={(answers) => submitQuiz(currentLecture._id, answers)}
                                result={quizResults[currentLecture._id]} />
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
                  
                  {articles[currentLecture._id] ? (
                    <ArticleContent>
                      <div dangerouslySetInnerHTML={{ __html: articles[currentLecture._id].content }} />
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
                  ) : (
                    <div>Loading article...</div>
                  )}
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
                  <ActionButton variant="success">
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

        {/* Right Sidebar - Course Progress & Next Steps */}
        <Sidebar>
          <SidebarHeader>
            <SidebarTitle>Course Progress</SidebarTitle>
          </SidebarHeader>
          
          {/* Course Progress Display */}
          <div style={{ padding: '1.5rem' }}>
            <ProgressText>
              <span>Overall Completion</span>
              <span>{calculateCourseCompletion()}%</span>
            </ProgressText>
            <ProgressBarContainer>
              <CourseProgressBar progress={calculateCourseCompletion()} />
            </ProgressBarContainer>
            
            {calculateCourseCompletion() === 100 && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                <h4 style={{ margin: 0, color: '#22c55e', fontSize: '1rem' }}>Course Complete!</h4>
                <ActionButton 
                  variant="success"
                  style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  onClick={() => {
                    console.log('Generate certificate or handle course completion');
                  }}
                >
                  🏆 Get Certificate
                </ActionButton>
              </div>
            )}
          </div>

          {/* Mobile Course Content */}
          <MobileContentSection>
            <div style={{ borderTop: '1px solid rgba(124, 58, 237, 0.2)', paddingTop: '1rem' }}>
              <div style={{ padding: '0 1.5rem 1rem 1.5rem' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Course Content</h3>
              </div>
              
              {sections.map((section, sectionIndex) => (
                <SectionItem key={`mobile-${section._id}`}>
                  <SectionHeader
                    expanded={expandedSections[section._id]}
                    onClick={() => toggleSection(section._id)}
                  >
                    <SectionTitle style={{ fontSize: '0.875rem' }}>
                      Section {sectionIndex + 1}: {section.title}
                      <span style={{ 
                        fontSize: '0.75rem', 
                        opacity: 0.7, 
                        marginLeft: '0.5rem' 
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
                              key={`mobile-${lecture._id}`}
                              active={currentLecture?._id === lecture._id}
                              locked={status === 'locked'}
                              onClick={() => {
                                if (status !== 'locked') {
                                  selectLecture(lecture, section._id);
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
                                  style={{ fontSize: '0.8rem' }}
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
            </div>
          </MobileContentSection>
        </Sidebar>
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
                        console.log('Assignment submitted successfully');
                      } else {
                        console.error('Assignment submission failed:', result.error);
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