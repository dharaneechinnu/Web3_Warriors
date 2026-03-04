import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyApplication } from '../services/mentorApplicationService';
import api from '../services/api';
import styled from 'styled-components';
import { 
  FaPlus, 
  FaChevronDown, 
  FaChevronLeft,
  FaChevronRight,
  FaVideo,
  FaFileAlt,
  FaClipboardCheck,
  FaEdit,
  FaTrash,
  FaUpload,
  FaSave,
  FaClock,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';

// Styled Components for Section/Lecture Management
const SectionCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.5);
  border: 2px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: ${props => props.isExpanded ? 'rgba(30, 41, 59, 0.8)' : 'rgba(30, 41, 59, 0.5)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.8);
  }
`;

const SectionHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
`;

const ExpandIcon = styled.div`
  color: #a78bfa;
  font-size: 1.2rem;
  transition: transform 0.3s ease;
  transform: ${props => props.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'};
`;

const SectionTitleInput = styled.input`
  flex: 1;
  padding: 10px 15px;
  background: rgba(51, 65, 85, 0.5);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #a78bfa;
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
`;

const SectionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  color: #94a3b8;
  font-size: 0.9rem;
`;

const SectionActions = styled.div`
  display: flex;
  gap: 10px;
`;

const IconButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.danger ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'};
  color: ${props => props.danger ? 'white' : '#cbd5e1'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.danger ? '#dc2626' : 'rgba(148, 163, 184, 0.3)'};
    transform: translateY(-1px);
  }
`;

const SectionContent = styled(motion.div)`
  padding: 20px;
  background: rgba(15, 23, 42, 0.5);
  border-top: 1px solid rgba(148, 163, 184, 0.2);
`;

const AddLectureButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  color: #a78bfa;
  border: 2px dashed #a78bfa;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 15px;
  width: 100%;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(167, 139, 250, 0.1);
    border-color: #c4b5fd;
    color: #c4b5fd;
  }
`;

const LectureItem = styled(motion.div)`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(167, 139, 250, 0.15);
    transform: translateX(5px);
  }
`;

const LectureIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: ${props => {
    switch(props.type) {
      case 'video': return 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)';
      case 'assignment': return 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)';
      case 'quiz': return 'linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)';
      case 'article': return 'linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)';
      default: return 'rgba(148, 163, 184, 0.3)';
    }
  }};
  color: white;
  flex-shrink: 0;
`;

const LectureContent = styled.div`
  flex: 1;
`;

const LectureTitleInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;

  &:focus {
    outline: none;
    border-color: #a78bfa;
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const LectureMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.85rem;
  color: #94a3b8;
  flex-wrap: wrap;
`;

const LectureType = styled.select`
  padding: 6px 10px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  font-size: 0.85rem;
  color: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #a78bfa;
  }

  option {
    background: #1e293b;
  }
`;

const DurationInput = styled.input`
  width: 100px;
  padding: 6px 10px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  font-size: 0.85rem;
  color: white;

  &:focus {
    outline: none;
    border-color: #a78bfa;
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const FileUploadWrapper = styled.div`
  margin-top: 10px;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${props => props.uploaded ? '#10b981' : '#a78bfa'};
  color: white;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover {
    background: ${props => props.uploaded ? '#059669' : '#8b5cf6'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
  }
`;

const UploadStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: ${props => props.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(167, 139, 250, 0.1)'};
  border-radius: 6px;
  font-size: 0.85rem;
  color: ${props => props.success ? '#10b981' : '#a78bfa'};
  border: 1px solid ${props => props.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(167, 139, 250, 0.3)'};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #a78bfa 0%, #c4b5fd 100%);
  border-radius: 10px;
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  border: 2px solid rgba(148, 163, 184, 0.2);
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #94a3b8;
  margin-top: 5px;
`;

// Quiz Section Styles (match platform purple theme)
const QuizSection = styled.div`
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  border-left: 4px solid #8b5cf6;
  color: #1f2937;
`;

const QuizSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SettingsRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SettingsLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
`;

const TimeInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const QuizActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #8b5cf6;
  color: white;
  border: 2px solid transparent;

  &:hover {
    background: #7c3aed;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Assignment Section Styles
const AssignmentSection = styled.div`
  background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  border-left: 4px solid #8b5cf6;
`;

const AssignmentSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SelectInput = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  width: 100%;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

// Article Section Styles
const ArticleSection = styled.div`
  background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  border-left: 4px solid #0ea5e9;
`;

const ArticleSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ArticleStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(14, 165, 233, 0.2);
  font-size: 0.875rem;
  color: #0369a1;
`;

// Wizard Stage Styles
const WizardContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
`;

const StageHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  margin-top: 35px;
  margin-bottom: 20px;
  color: white;
`;

const StageProgress = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const StageStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 20px;
`;

const StepCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  background: ${props => 
    props.active ? '#8b5cf6' : 
    props.completed ? '#10b981' : 
    '#e5e7eb'
  };
  color: ${props => 
    props.active || props.completed ? 'white' : 
    '#6b7280'
  };
  border: 2px solid ${props => 
    props.active ? '#8b5c f6' : 
    props.completed ? '#10b981' : 
    '#e5e7eb'
  };
`;

const StepLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
  text-align: center;
  max-width: 80px;
  color: ${props => 'white'
  };
`;

const StageTitle = styled.h2`
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-align: center;
`;

const StageSubtitle = styled.p`
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  text-align: center;
`;

const StageContent = styled(motion.div)`
  background: transparent;
  border-radius: 16px;
  padding: ${props => props.stage === 1 ? '48px' : '32px'};
  min-height: 400px;
`;

const StageNavigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const NavButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${props => props.primary ? `
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
`;

const FormInput = styled.input`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const FormSelect = styled.select`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const FormTextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

// Course Details card with colored background and white text
const CourseDetailsCard = styled.div`
  background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 24px rgba(99,102,241,0.08);

  ${FormLabel} {
    color: rgba(255,255,255,0.95);
  }

  ${FormInput}, ${FormSelect}, ${FormTextArea} {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    color: white;
  }

  ${FormInput}::placeholder, ${FormTextArea}::placeholder {
    color: rgba(255,255,255,0.7);
  }

  ${FormSelect} {
    color: white;
  }
`;

// Pricing & Description card with solid purple background and white text
const PricingCard = styled.div`
  background: #8b5cf6;
  border-radius: 12px;
  padding: 24px;
  color: white;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 24px rgba(139,92,246,0.08);

  ${FormLabel} {
    color: rgba(255,255,255,0.95);
  }

  ${FormInput}, ${FormSelect}, ${FormTextArea} {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    color: white;
  }

  ${FormInput}::placeholder, ${FormTextArea}::placeholder {
    color: rgba(255,255,255,0.7);
  }

  ${FormSelect} {
    color: white;
  }
`;

const MediaUploadArea = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  background: #f9fafb;
  
  &:hover {
    border-color: #8b5cf6;
    background: #f5f3ff;
  }
  
  ${props => props.hasFile && `
    border-color: #10b981;
    background: #f0fdf4;
    border-style: solid;
  `}
`;

const MediaPreview = styled.div`
  margin-top: 16px;
  
  img, video {
    max-width: 200px;
    max-height: 200px;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const ReviewSection = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border-left: 4px solid #8b5cf6;
`;

const ReviewTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
`;

const ReviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const ReviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ReviewLabel = styled.span`
  font-weight: 500;
  color: #6b7280;
`;

const ReviewValue = styled.span`
  font-weight: 600;
  color: #1f2937;
  text-align: right;
`;

const AgreementSection = styled.div`
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
`;

const StyledCheckbox = styled.input`
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
`;

const AgreementText = styled.label`
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  cursor: pointer;
  
  a {
    color: #8b5cf6;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const CourseUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    getMyApplication().then(res => {
      if (res.success && res.data) {
        setVerificationStatus(res.data.application?.mentorStatus || 'pending');
      } else if (res.notFound) {
        setVerificationStatus('not_applied');
      } else {
        setVerificationStatus('pending');
      }
    }).catch(() => setVerificationStatus('pending'));
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Edit mode state
  const isEditMode = location.state?.editMode;
  const editCourse = location.state?.course;
  
  // Basic course info
  const [courseForm, setCourseForm] = useState({
    title: editCourse?.title || '',
    description: editCourse?.description || '',
    price: editCourse?.price || '',
    level: editCourse?.level || 'beginner',
    category: editCourse?.category || '',
    thumbnail: null,
    promoVideo: null
  });

  // Curriculum state (sections and lectures)
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingLecture, setUploadingLecture] = useState(null);
  const [quizDrafts, setQuizDrafts] = useState({}); // { lectureId: { title, description, questions: [...] } }
  const [expandedLectureDetails, setExpandedLectureDetails] = useState({}); // { lectureId: boolean }
  const [quizPreviewOpen, setQuizPreviewOpen] = useState({});
  
  // Stage Management
  const [currentStage, setCurrentStage] = useState(1);
  const [stageValidation, setStageValidation] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ type: '', title: '', message: '' });
  
  const stages = [
    { id: 1, title: 'Course Details', subtitle: 'Title, Category & Difficulty' },
    { id: 2, title: 'Course Media', subtitle: 'Thumbnail & Promo Video' },
    { id: 3, title: 'Pricing & Description', subtitle: 'Course Information' },
    { id: 4, title: 'Course Curriculum', subtitle: 'Sections & Lectures' },
    { id: 5, title: 'Review & Publish', subtitle: 'Final Review' }
  ];

  const [previewImage, setPreviewImage] = useState(
    editCourse?.thumbnail ? `${api.defaults.baseURL}${editCourse.thumbnail.replace(/\\/g, '/')}` : null
  );

  // Redirect if not a mentor
  React.useEffect(() => {
    if (!user || user.role !== 'mentor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Section Management
  const addSection = () => {
    const newSection = {
      id: Date.now(),
      title: '',
      lectures: [],
      isEditing: true
    };
    setSections([...sections, newSection]);
    setExpandedSections({ ...expandedSections, [newSection.id]: true });
  };

  // Get duration (in seconds) from a video File object
  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        let resolved = false;
        const cleanup = () => {
          if (video) {
            video.removeAttribute('src');
            video.load();
          }
          URL.revokeObjectURL(url);
        };

        video.preload = 'metadata';
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          const duration = video.duration;
          resolved = true;
          cleanup();
          resolve(duration);
        });
        video.addEventListener('error', (e) => {
          if (!resolved) {
            cleanup();
            reject(new Error('Failed to load video metadata'));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  const deleteSection = (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setSections(sections.filter(s => s.id !== sectionId));
      const newExpanded = { ...expandedSections };
      delete newExpanded[sectionId];
      setExpandedSections(newExpanded);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    });
  };

  const updateSectionTitle = (sectionId, title) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, title } : s
    ));
  };

  // Finish editing (called on blur or Enter)
  const finishEditingSection = (sectionId) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, isEditing: false } : s
    ));
  };

  // Lecture Management
  const addLecture = (sectionId) => {
    const newLecture = {
      id: Date.now(),
      title: '',
      type: 'video',
      duration: '',
      file: null,
      fileName: '',
      fileSize: 0,
      isUploaded: false
    };
    
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, lectures: [...s.lectures, newLecture] }
        : s
    ));
  };

  const deleteLecture = (sectionId, lectureId) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, lectures: s.lectures.filter(l => l.id !== lectureId) }
          : s
      ));
    }
  };

  const updateLecture = (sectionId, lectureId, updates) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? {
            ...s,
            lectures: s.lectures.map(l => 
              l.id === lectureId ? { ...l, ...updates } : l
            )
          }
        : s
    ));
  };

  // Quiz Management Functions
  const updateQuizDraft = (lectureId, updater) => {
    setQuizDrafts(prev => ({
      ...prev,
      [lectureId]: typeof updater === 'function' ? updater(prev[lectureId] || {}) : { ...(prev[lectureId] || {}), ...updater }
    }));
  };

  const addQuizQuestion = (lectureId) => {
    updateQuizDraft(lectureId, draft => ({
      ...draft,
      questions: [ ...(draft.questions || []), { 
        question: '', 
        type: 'single_correct', 
        choices: ['', '', '', ''], 
        correctIndex: 0, 
        correctIndices: [],
        marks: 1,
        sampleAnswer: ''
      } ]
    }));
  };

  const removeQuizQuestion = (lectureId, qIndex) => {
    updateQuizDraft(lectureId, draft => ({
      ...draft,
      questions: (draft.questions || []).filter((_,i) => i !== qIndex)
    }));
  };

  const updateQuestionField = (lectureId, qIndex, field, value) => {
    updateQuizDraft(lectureId, draft => {
      const questions = (draft.questions || []).map((q, i) => i === qIndex ? { ...q, [field]: value } : q);
      return { ...draft, questions };
    });
  };

  const addChoiceToQuestion = (lectureId, qIndex) => {
    updateQuizDraft(lectureId, draft => {
      const questions = (draft.questions || []).map((q, i) => i === qIndex ? { ...q, choices: [...(q.choices||[]), ''] } : q);
      return { ...draft, questions };
    });
  };

  const openQuizEditor = async (lecture) => {
    console.log('openQuizEditor called for lecture:', lecture.id, lecture.title);
    
    if (lecture.quiz) {
      setQuizDrafts(prev => ({ ...prev, [lecture.id]: { ...lecture.quiz } }));
      return;
    }

    if (quizDrafts[lecture.id]) {
      return;
    }

    setQuizDrafts(prev => ({ 
      ...prev, 
      [lecture.id]: { 
        title: `${lecture.title} Quiz`, 
        description: '', 
        questions: [],
        passingScore: 60,
        timeLimitMinutes: 30,
        attemptsAllowed: 'unlimited',
        tokenReward: 10
      } 
    }));
  };

  const saveQuiz = async (lectureId) => {
    const quiz = quizDrafts[lectureId];
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      alert('Quiz must have at least one question');
      return;
    }

    try {
      setSections(sections.map(s => ({
        ...s,
        lectures: s.lectures.map(l => l.id === lectureId ? { ...l, quiz: quiz } : l)
      })));

      setQuizDrafts(prev => { const p = { ...prev }; delete p[lectureId]; return p; });
      alert('Quiz saved successfully!');
    } catch (err) {
      console.error('Save quiz error', err);
      alert('Failed to save quiz');
    }
  };

  const saveLectureDetails = async (sectionId, lectureId, updates) => {
    try {
      updateLecture(sectionId, lectureId, updates);
      alert('Lecture details saved successfully!');
    } catch (err) {
      console.error('Save lecture details error', err);
      alert('Failed to save lecture details');
    }
  };

  // Stage validation functions
  const validateStage = (stageId) => {
    switch (stageId) {
      case 1:
        return !!(courseForm.title && courseForm.category && courseForm.difficulty);
      case 2:
        return !!previewImage; // At least thumbnail is required
      case 3:
        return !!(courseForm.price && courseForm.description);
      case 4:
        return sections.length > 0 && sections.some(section => section.lectures.length > 0);
      case 5:
        return agreedToTerms;
      default:
        return false;
    }
  };

  const canMoveToNextStage = () => {
    return validateStage(currentStage);
  };

  const nextStage = () => {
    if (canMoveToNextStage() && currentStage < stages.length) {
      setCurrentStage(currentStage + 1);
    }
  };

  const prevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const goToStage = (stageId) => {
    // Only allow going to earlier stages or if current stage is valid
    if (stageId <= currentStage || validateStage(currentStage)) {
      setCurrentStage(stageId);
    }
  };

  const isStageCompleted = (stageId) => {
    return stageId < currentStage || (stageId === currentStage && validateStage(stageId));
  };

  // File Upload for Lectures
  const handleLectureVideoUpload = async (sectionId, lectureId, file) => {
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, AVI, MOV, WMV, WEBM)');
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 500MB');
      return;
    }

    const formData = new FormData();
    formData.append('lecture_video', file);
    formData.append('sectionId', sectionId);
    formData.append('lectureId', lectureId);

    // detect duration and include it
    try {
      const duration = await getVideoDuration(file);
      // seconds (float) — round to 2 decimals
      const rounded = Math.round(duration * 100) / 100;
      formData.append('duration', String(rounded));
      // update local lecture state so UI shows duration immediately
      updateLecture(sectionId, lectureId, { duration: rounded });
    } catch (err) {
      console.warn('Could not determine video duration:', err);
    }

    try {
      setUploadingLecture(lectureId);
      setUploadProgress({ ...uploadProgress, [lectureId]: 0 });

      const response = await api.post('/udemy-courses/upload-lecture-video', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(prev => ({ ...prev, [lectureId]: percentCompleted }));
        }
      });

      updateLecture(sectionId, lectureId, {
        file: response.data.filePath,
        fileName: file.name,
        fileSize: file.size,
        isUploaded: true
      });

      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[lectureId];
          return updated;
        });
        setUploadingLecture(null);
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Failed to upload video. Please try again.');
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[lectureId];
        return updated;
      });
      setUploadingLecture(null);
    }
  };

  const handleFileChange = (fieldName, file) => {
    setCourseForm(prev => ({ ...prev, [fieldName]: file }));
    
    if (fieldName === 'thumbnail' && file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setCourseForm(prev => ({ ...prev, [fieldName]: value }));
  };

  const validateForm = () => {
    try {
      console.log('🔍 Starting form validation...');
      
      // Basic course info validation
      if (!courseForm.title.trim()) {
        throw new Error('📝 Course title is required');
      }
      if (!courseForm.description.trim()) {
        throw new Error('📄 Course description is required');
      }
      if (!courseForm.category) {
        throw new Error('🏷️ Course category is required');
      }
      if (!previewImage) {
        throw new Error('🖼️ Course thumbnail is required');
      }
      
      // Curriculum validation
      if (sections.length === 0) {
        throw new Error('📚 Please add at least one section with lectures');
      }
      
      let totalLectures = 0;
      let totalQuizzes = 0;
      let totalAssignments = 0;
      let totalArticles = 0;
      let totalVideos = 0;
      
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const section = sections[sectionIndex];
        
        if (!section.title.trim()) {
          throw new Error(`📑 Section ${sectionIndex + 1} title is required`);
        }
        
        if (section.lectures.length === 0) {
          throw new Error(`📚 Section "${section.title}" has no lectures. Each section needs at least one lecture.`);
        }
        
        for (let lectureIndex = 0; lectureIndex < section.lectures.length; lectureIndex++) {
          const lecture = section.lectures[lectureIndex];
          totalLectures++;
          
          if (!lecture.title.trim()) {
            throw new Error(`📝 Lecture ${lectureIndex + 1} in section "${section.title}" needs a title`);
          }
          
          // Type-specific validation
          switch (lecture.type) {
            case 'video':
              totalVideos++;
              if (!lecture.isUploaded || !lecture.file) {
                throw new Error(`🎥 Please upload video for "${lecture.title}" in section "${section.title}"`);
              }
              break;
              
            case 'quiz':
              totalQuizzes++;
              const quizData = quizDrafts[lecture.id] || lecture.quiz;
              if (!quizData) {
                throw new Error(`❓ Quiz "${lecture.title}" in section "${section.title}" has no data. Please configure the quiz.`);
              }
              if (!quizData.questions || quizData.questions.length === 0) {
                throw new Error(`❓ Quiz "${lecture.title}" needs at least one question`);
              }
              
              // Validate each question
              for (let i = 0; i < quizData.questions.length; i++) {
                const q = quizData.questions[i];
                if (!q.question || !q.question.trim()) {
                  throw new Error(`❓ Question ${i + 1} in quiz "${lecture.title}" is empty`);
                }
                
                if (q.type === 'single_correct' || q.type === 'multiple_correct') {
                  const validChoices = (q.choices || []).filter(c => c && c.trim());
                  if (validChoices.length < 2) {
                    throw new Error(`❓ Question ${i + 1} in quiz "${lecture.title}" needs at least 2 answer choices`);
                  }
                  
                  if (q.type === 'single_correct' && (q.correctIndex === undefined || q.correctIndex === null)) {
                    throw new Error(`❓ Question ${i + 1} in quiz "${lecture.title}" needs a correct answer selected`);
                  }
                  
                  if (q.type === 'multiple_correct' && (!q.correctIndices || q.correctIndices.length === 0)) {
                    throw new Error(`❓ Question ${i + 1} in quiz "${lecture.title}" needs at least one correct answer selected`);
                  }
                }
              }
              break;
              
            case 'article':
              totalArticles++;
              // Normalize article content: strip HTML tags, NBSPs and collapse whitespace
              const rawContent = lecture.content || '';
              const normalizedContent = rawContent.replace(/\u00A0/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

              if (!normalizedContent) {
                throw new Error(`📄 Article "${lecture.title}" in section "${section.title}" has no content (found: ${JSON.stringify(rawContent.slice(0,80))})`);
              }

              const wordCountArticle = normalizedContent.split(/\s+/).filter(Boolean).length;
              if (normalizedContent.length < 50 && wordCountArticle < 10) {
                throw new Error(`📄 Article "${lecture.title}" content is too short. Please add more meaningful content (current length: ${normalizedContent.length}, words: ${wordCountArticle}).`);
              }
              break;
              
            case 'assignment':
              totalAssignments++;
              // Accept either legacy `assignmentDescription` or structured `assignment.instructions`
              const rawInstructions = (lecture.assignment && (lecture.assignment.instructions || lecture.assignment.description)) || lecture.assignmentDescription || '';
              const normalizedInstructions = String(rawInstructions).replace(/\u00A0/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

              if (!normalizedInstructions) {
                throw new Error(`📋 Assignment "${lecture.title}" in section "${section.title}" needs instructions`);
              }

              // Require a minimum of characters or words for clarity
              const wordCount = normalizedInstructions.split(/\s+/).filter(Boolean).length;
              if (normalizedInstructions.length < 20 && wordCount < 3) {
                throw new Error(`📋 Assignment "${lecture.title}" instructions are too short. Please provide clear instructions (at least 20 characters).`);
              }

              break;
              
            default:
              throw new Error(`❓ Unknown lecture type "${lecture.type}" in "${lecture.title}"`);
          }
        }
      }
      
      console.log('✅ Validation passed:', {
        sections: sections.length,
        lectures: totalLectures,
        videos: totalVideos,
        quizzes: totalQuizzes,
        articles: totalArticles,
        assignments: totalAssignments
      });
      
      return null;
    } catch (error) {
      console.log('❌ Validation failed:', error.message);
      return error.message;
    }
  };

  const diagnosticCurriculum = () => {
    try {
      console.group('📋 Curriculum Diagnostics');
      if (!sections || sections.length === 0) {
        console.warn('No sections found');
        console.groupEnd();
        return { sections: 0, incomplete: true };
      }

      let incompleteCount = 0;
      sections.forEach((section, si) => {
        console.group(`Section ${si + 1}: ${section.title || '(untitled section)'}`);
        if (!section.title || !String(section.title).trim()) {
          console.warn(' - MISSING: section title');
          incompleteCount++;
        }
        if (!section.lectures || section.lectures.length === 0) {
          console.warn(' - MISSING: no lectures in this section');
          incompleteCount++;
        } else {
          section.lectures.forEach((lecture, li) => {
            const lt = lecture.type || 'unknown';
            console.group(` Lecture ${li + 1}: ${lecture.title || '(untitled)'} [${lt}]`);

            // Common checks
            if (!lecture.title || !String(lecture.title).trim()) {
              console.warn('  - MISSING: lecture title'); incompleteCount++;
            }

            if (lt === 'video') {
              const isUploaded = !!lecture.isUploaded || !!lecture.file;
              console.log(`  - video uploaded: ${isUploaded}`);
              if (!isUploaded) { console.warn('  - MISSING: video file not uploaded'); incompleteCount++; }
            } else if (lt === 'article') {
              const raw = lecture.content || '';
              const norm = String(raw).replace(/\u00A0/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
              console.log(`  - article length: ${norm.length}, words: ${norm.split(/\s+/).filter(Boolean).length}`);
              if (!norm) { console.warn('  - MISSING: article content'); incompleteCount++; }
            } else if (lt === 'assignment') {
              const raw = (lecture.assignment && (lecture.assignment.instructions || lecture.assignment.description)) || lecture.assignmentDescription || '';
              const norm = String(raw).replace(/\u00A0/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
              console.log(`  - assignment instructions length: ${norm.length}, words: ${norm.split(/\s+/).filter(Boolean).length}`);
              if (!norm) { console.warn('  - MISSING: assignment instructions'); incompleteCount++; }
            } else if (lt === 'quiz') {
              const quiz = quizDrafts[lecture.id] || lecture.quiz || {};
              const qCount = (quiz.questions || []).length;
              console.log(`  - quiz questions: ${qCount}`);
              if (qCount === 0) { console.warn('  - MISSING: quiz questions'); incompleteCount++; }
            }

            console.groupEnd();
          });
        }
        console.groupEnd();
      });

      console.log(`✅ Sections: ${sections.length}, incomplete items: ${incompleteCount}`);
      console.groupEnd();
      return { sections: sections.length, incomplete: incompleteCount > 0 };
    } catch (err) {
      console.error('Diagnostics error', err);
      return { sections: sections.length || 0, incomplete: true };
    }
  };

  const handleCourseUpload = async (e) => {
    console.log('🚀 handleCourseUpload called');
    e.preventDefault();

    // Emit diagnostics for each section/lecture to help debug missing fields
    const diag = diagnosticCurriculum();
    console.log('📊 Curriculum diagnostic result:', diag);

    const validationError = validateForm();
    if (validationError) {
      console.log('❌ Validation error:', validationError);
      setError(validationError);
      // Show validation error in modal so user sees details and can dismiss
      setModalData({
        type: 'error',
        title: 'Validation Failed',
        message: validationError
      });
      setShowModal(true);
      return;
    }

    console.log('✅ Validation passed, starting upload...');
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create/Update course with basic info
      const basicFormData = new FormData();
      basicFormData.append('title', courseForm.title.trim());
      basicFormData.append('description', courseForm.description.trim());
      basicFormData.append('price', courseForm.price || '0');
      basicFormData.append('level', courseForm.difficulty); // Map difficulty to level
      basicFormData.append('category', courseForm.category);
      basicFormData.append('language', courseForm.language || 'english');
      basicFormData.append('learningOutcomes', courseForm.learningOutcomes || '');
      basicFormData.append('mentorId', user._id);
      basicFormData.append('mentorName', user.name);
      basicFormData.append('mentorEmail', user.email);
      
      if (courseForm.thumbnail) {
        basicFormData.append('thumbnail', courseForm.thumbnail);
      }
      if (courseForm.promoVideo) {
        basicFormData.append('promo_video', courseForm.promoVideo);
      }

      let courseResponse;
      if (isEditMode) {
        courseResponse = await api.put(`/courses/update/${editCourse._id}`, basicFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        courseResponse = await api.post('/courses/upload', basicFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const courseId = courseResponse.data.course?._id || courseResponse.data._id;

      // Step 2: Save curriculum (sections and lectures) with full quiz, article, assignment data
      const curriculumData = {
        courseId,
        courseName: courseForm.title,
        mentorId: user._id,
        sections: sections.map((section, sIndex) => ({
          order: sIndex + 1,
          title: section.title,
          description: section.description || '',
          lectures: section.lectures.map((lecture, lIndex) => {
            // Base lecture data
            const lectureData = {
              order: lIndex + 1,
              title: lecture.title,
              type: lecture.type,
              duration: lecture.duration,
              resources: lecture.resources || []
            };

            // Add type-specific data
            if (lecture.type === 'video') {
              // Video data
              lectureData.videoUrl = lecture.file;
              lectureData.fileName = lecture.fileName;
              lectureData.fileSize = lecture.fileSize;
              lectureData.isUploaded = lecture.isUploaded;
            } else if (lecture.type === 'quiz') {
              // Quiz data - get from quizDrafts or lecture.quiz
              const quizData = quizDrafts[lecture.id] || lecture.quiz || {};
              lectureData.quiz = {
                title: quizData.title || lecture.title,
                description: quizData.description || '',
                questions: (quizData.questions || []).map((q, qi) => ({
                  question: q.question || '',
                  type: q.type || 'single_correct',
                  choices: q.choices || [],
                  correctIndex: q.correctIndex,
                  correctIndices: q.correctIndices || [],
                  marks: q.marks || 1,
                  sampleAnswer: q.sampleAnswer || '',
                  explanation: q.explanation || ''
                })),
                passingScore: quizData.passingScore || 60,
                timeLimitMinutes: quizData.timeLimitMinutes || 30,
                attemptsAllowed: quizData.attemptsAllowed === 'unlimited' ? -1 : (parseInt(quizData.attemptsAllowed) || 3),
                tokenReward: quizData.tokenReward || 10,
                shuffleQuestions: quizData.shuffleQuestions || false,
                showCorrectAnswers: quizData.showCorrectAnswers !== false
              };
              console.log(`📝 Quiz data for "${lecture.title}":`, lectureData.quiz);
            } else if (lecture.type === 'article') {
              // Article data
              lectureData.article = {
                content: lecture.content || '',
                articleTitle: lecture.articleTitle || lecture.title,
                readingTime: lecture.readingTime || 5,
                resourceLinks: lecture.resourceLinks || []
              };
              lectureData.content = lecture.content || ''; // Keep for backward compatibility
              lectureData.readingTime = lecture.readingTime || 5;
              console.log(`📄 Article data for "${lecture.title}":`, {
                contentLength: (lecture.content || '').length,
                readingTime: lecture.readingTime
              });
            } else if (lecture.type === 'assignment') {
              // Assignment data - prefer structured `lecture.assignment` fields, fallback to legacy `assignmentDescription`
              const instr = (lecture.assignment && (lecture.assignment.instructions || lecture.assignment.description)) || lecture.assignmentDescription || '';
              const desc = (lecture.assignment && lecture.assignment.description) || lecture.assignmentDescription || '';
              lectureData.assignment = {
                description: desc,
                instructions: instr,
                submissionType: (lecture.assignment && lecture.assignment.submissionType) || lecture.submissionType || 'file_upload',
                evaluationType: (lecture.assignment && lecture.assignment.evaluationType) || lecture.evaluationType || 'manual',
                tokenReward: (lecture.assignment && lecture.assignment.tokenReward) || lecture.tokenReward || 0,
                deadline: (lecture.assignment && lecture.assignment.deadline) || lecture.deadline || null,
                allowedFileTypes: (lecture.assignment && lecture.assignment.allowedFileTypes) || lecture.allowedFileTypes || [],
                minWords: (lecture.assignment && lecture.assignment.minWords) || lecture.minWords || 0,
                maxWords: (lecture.assignment && lecture.assignment.maxWords) || lecture.maxWords || 0,
                linkInstructions: (lecture.assignment && lecture.assignment.linkInstructions) || lecture.linkInstructions || '',
                maxScore: (lecture.assignment && lecture.assignment.maxScore) || lecture.maxScore || 100
              };
              console.log(`📋 Assignment data for "${lecture.title}":`, lectureData.assignment);
            }

            return lectureData;
          })
        }))
      };

      console.log('🚀 Sending curriculum data:', JSON.stringify(curriculumData, null, 2));

      await api.post('/courses/save-curriculum', curriculumData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess(true);
      setError(null);
      
      // Show success modal
      setModalData({
        type: 'success',
        title: '🎉 Success!',
        message: `Course ${isEditMode ? 'updated' : 'published'} successfully! You will be redirected to your dashboard.`
      });
      setShowModal(true);
      
      setTimeout(() => {
        navigate('/mentor-home');
      }, 3000);

    } catch (err) {
      console.error('💥 Course upload/update error:', err);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (err.response?.data?.message) {
        // Server validation error
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your course content.';
      } else if (err.response?.status === 401) {
        errorMessage = 'You are not authorized. Please log in again.';
      } else if (err.response?.status === 413) {
        errorMessage = 'File size too large. Please use smaller files.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show error modal
      setModalData({
        type: 'error',
        title: '❌ Upload Failed',
        message: errorMessage
      });
      setShowModal(true);
      
      // Also set error for inline display as fallback
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

    // Form submit handler for the multi-stage wizard
    const handleSubmit = (e) => {
      console.log('🎯 handleSubmit called');
      console.log('📊 Current stage:', currentStage);
      console.log('📊 Stages length:', stages.length);
      console.log('✅ Agreed to terms:', agreedToTerms);
      console.log('🔄 Loading state:', loading);
      
      // If called from a button click (no event) allow direct navigation
      if (e && e.preventDefault) e.preventDefault();

      // If not on final stage, try to advance (will validate current stage)
      if (currentStage < stages.length) {
        console.log('⏩ Moving to next stage...');
        if (canMoveToNextStage()) {
          nextStage();
          setError(null);
        } else {
          setError('Please complete required fields in this step before proceeding.');
        }
        return;
      }

      console.log('🚀 On final stage, checking terms agreement...');
      
      // Final stage: ensure agreement then perform course upload
      if (!agreedToTerms) {
        console.log('❌ Terms not agreed');
        setError('⚠️ Please check the "I agree to the Terms of Service and Privacy Policy" checkbox below before publishing your course.');
        return;
      }

      console.log('✅ All checks passed, calling handleCourseUpload...');
      // Call existing upload handler
      handleCourseUpload(e);
    };

  // Helper functions
  const getLectureIcon = (type) => {
    switch(type) {
      case 'video': return <FaVideo />;
      case 'assignment': return <FaClipboardCheck />;
      case 'quiz': return <FaClipboardCheck />;
      case 'article': return <FaFileAlt />;
      default: return <FaFileAlt />;
    }
  };

  const totalLectures = sections.reduce((acc, s) => acc + s.lectures.length, 0);
  const totalVideos = sections.reduce((acc, s) => 
    acc + s.lectures.filter(l => l.type === 'video').length, 0
  );
  const uploadedVideos = sections.reduce((acc, s) => 
    acc + s.lectures.filter(l => l.type === 'video' && l.isUploaded).length, 0
  );
  const videoUploadProgress = totalVideos > 0 ? Math.round((uploadedVideos / totalVideos) * 100) : 100;

  if (!user || user.role !== 'mentor') {
    return null; // Will redirect in useEffect
  }

  // Stage render functions
  const renderStage1 = () => (
    <CourseDetailsCard>
      <FormGrid>
      <FormGroup>
        <FormLabel>Course Title *</FormLabel>
        <FormInput
          type="text"
          placeholder="Enter course title"
          value={courseForm.title}
          onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </FormGroup>

      <FormGroup>
        <FormLabel>Category *</FormLabel>
        <FormSelect
          value={courseForm.category}
          onChange={(e) => setCourseForm(prev => ({ ...prev, category: e.target.value }))}
          required
        >
          <option value="">Select Category</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
          <option value="marketing">Marketing</option>
          <option value="data-science">Data Science</option>
          <option value="artificial-intelligence">Artificial Intelligence</option>
          <option value="web-development">Web Development</option>
          <option value="mobile-development">Mobile Development</option>
        </FormSelect>
      </FormGroup>

      <FormGroup>
        <FormLabel>Difficulty Level *</FormLabel>
        <FormSelect
          value={courseForm.difficulty}
          onChange={(e) => setCourseForm(prev => ({ ...prev, difficulty: e.target.value }))}
          required
        >
          <option value="">Select Difficulty</option>
          <option value="beginner">🟢 Beginner</option>
          <option value="intermediate">🟡 Intermediate</option>
          <option value="advanced">🔴 Advanced</option>
          <option value="expert">⚫ Expert</option>
        </FormSelect>
      </FormGroup>

      <FormGroup>
        <FormLabel>Course Duration (Optional)</FormLabel>
        <FormInput
          type="text"
          placeholder="e.g., 8 weeks, 20 hours"
          value={courseForm.duration || ''}
          onChange={(e) => setCourseForm(prev => ({ ...prev, duration: e.target.value }))}
        />
      </FormGroup>
      </FormGrid>
    </CourseDetailsCard>
  );

  const renderStage2 = () => (
    <div>
      <FormGroup style={{ marginBottom: '32px' }}>
        <FormLabel>Course Thumbnail *</FormLabel>
        <MediaUploadArea hasFile={previewImage}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange('thumbnail', e.target.files[0])}
            style={{ display: 'none' }}
            id="thumbnail-upload"
          />
          <label htmlFor="thumbnail-upload" style={{ cursor: 'pointer' }}>
            {previewImage ? (
              <MediaPreview>
                <img src={previewImage} alt="Course thumbnail preview" />
                <p style={{ marginTop: '12px', color: '#10b981', fontWeight: '600' }}>
                  ✓ Thumbnail uploaded
                </p>
              </MediaPreview>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Upload Course Thumbnail
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Recommended: 1280x720px (16:9) • Max 5MB • JPG, PNG
                </p>
              </div>
            )}
          </label>
        </MediaUploadArea>
      </FormGroup>

      <FormGroup>
        <FormLabel>Promo Video (Optional)</FormLabel>
        <MediaUploadArea hasFile={courseForm.promoVideo}>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange('promoVideo', e.target.files[0])}
            style={{ display: 'none' }}
            id="promo-video-upload"
          />
          <label htmlFor="promo-video-upload" style={{ cursor: 'pointer' }}>
            {courseForm.promoVideo ? (
              <MediaPreview>
                <video controls style={{ maxWidth: '300px' }}>
                  <source src={URL.createObjectURL(courseForm.promoVideo)} />
                </video>
                <p style={{ marginTop: '12px', color: '#10b981', fontWeight: '600' }}>
                  ✓ Promo video uploaded: {courseForm.promoVideo.name}
                </p>
              </MediaPreview>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Upload Promo Video
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Optional marketing video • Max 100MB • MP4, WebM, MOV
                </p>
              </div>
            )}
          </label>
        </MediaUploadArea>
      </FormGroup>
    </div>
  );

  const renderStage3 = () => (
    <PricingCard>
      <FormGrid>
      <FormGroup>
        <FormLabel>Course Price *</FormLabel>
        <FormInput
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={courseForm.price}
          onChange={(e) => setCourseForm(prev => ({ ...prev, price: e.target.value }))}
          required
        />
      </FormGroup>

      <FormGroup>
        <FormLabel>Course Language</FormLabel>
        <FormSelect
          value={courseForm.language || 'english'}
          onChange={(e) => setCourseForm(prev => ({ ...prev, language: e.target.value }))}
        >
          <option value="english">🇺🇸 English</option>
          <option value="hindi">🇮🇳 Hindi</option>
          <option value="spanish">🇪🇸 Spanish</option>
          <option value="french">🇫🇷 French</option>
          <option value="german">🇩🇪 German</option>
        </FormSelect>
      </FormGroup>

      <div style={{ gridColumn: '1 / -1' }}>
        <FormGroup>
          <FormLabel>Course Description *</FormLabel>
          <FormTextArea
            placeholder="Describe your course, what students will learn, prerequisites, and outcomes..."
            value={courseForm.description}
            onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
            rows={6}
            required
          />
        </FormGroup>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <FormGroup>
          <FormLabel>What You'll Learn (Learning Outcomes)</FormLabel>
          <FormTextArea
            placeholder="• Master fundamental concepts&#10;• Build real-world projects&#10;• Gain practical experience..."
            value={courseForm.learningOutcomes || ''}
            onChange={(e) => setCourseForm(prev => ({ ...prev, learningOutcomes: e.target.value }))}
            rows={4}
          />
        </FormGroup>
      </div>
      </FormGrid>
    </PricingCard>
  );

  const renderStage4 = () => (
    <div>
      {/* This will contain the existing curriculum builder */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
          Course Curriculum
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Build your course curriculum with sections and lectures. Add videos, quizzes, assignments, and articles.
        </p>
      </div>
      
      {/* Existing curriculum content will be rendered here */}
      {renderCurriculumBuilder()}
    </div>
  );

  const renderStage5 = () => (
    <div>
      <ReviewSection>
        <ReviewTitle>📋 Course Overview</ReviewTitle>
        <ReviewGrid>
          <ReviewItem>
            <ReviewLabel>Course Title</ReviewLabel>
            <ReviewValue>{courseForm.title || 'Not set'}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Category</ReviewLabel>
            <ReviewValue>{courseForm.category || 'Not set'}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Difficulty</ReviewLabel>
            <ReviewValue>{courseForm.difficulty || 'Not set'}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Price</ReviewLabel>
            <ReviewValue>${courseForm.price || '0.00'}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Language</ReviewLabel>
            <ReviewValue>{courseForm.language || 'english'}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Has Thumbnail</ReviewLabel>
            <ReviewValue>{previewImage ? '✅ Yes' : '❌ No'}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Has Promo Video</ReviewLabel>
            <ReviewValue>{courseForm.promoVideo ? '✅ Yes' : '❌ No'}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Total Sections</ReviewLabel>
            <ReviewValue>{sections.length}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Total Lectures</ReviewLabel>
            <ReviewValue>{totalLectures}</ReviewValue>
          </ReviewItem>
        </ReviewGrid>
      </ReviewSection>

      <ReviewSection>
        <ReviewTitle>📚 Course Content</ReviewTitle>
        {sections.map((section, index) => (
          <div key={section.id} style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
              Section {index + 1}: {section.title}
            </div>
            <div style={{ paddingLeft: '16px' }}>
              {section.lectures.map((lecture, lectureIndex) => (
                <div key={lecture.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '4px 0',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  <span>
                    {lectureIndex + 1}. {lecture.title} 
                    <span style={{ marginLeft: '8px' }}>
                      ({lecture.type === 'video' ? '🎥' : 
                        lecture.type === 'quiz' ? '❓' : 
                        lecture.type === 'assignment' ? '📝' : '📄'} {lecture.type})
                    </span>
                  </span>
                  <span>{lecture.duration || 'No duration'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </ReviewSection>

      <AgreementSection>
        <CheckboxWrapper>
          <StyledCheckbox
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            id="terms-agreement"
          />
          <AgreementText htmlFor="terms-agreement">
            I agree to the <a href="/terms" target="_blank">Terms of Service</a> and{' '}
            <a href="/privacy" target="_blank">Privacy Policy</a>. I confirm that this course content 
            is original or I have the right to distribute it. I understand that false information 
            may result in course rejection or account suspension.
          </AgreementText>
        </CheckboxWrapper>
      </AgreementSection>
    </div>
  );

  // Curriculum Builder Component
  const renderCurriculumBuilder = () => (
    <div>
      <StatsBar>
        <StatItem>
          <StatValue>{sections.length}</StatValue>
          <StatLabel>Sections</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{totalLectures}</StatValue>
          <StatLabel>Lectures</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{sections.reduce((total, section) => 
            total + section.lectures.filter(lecture => lecture.duration).length, 0
          )}</StatValue>
          <StatLabel>With Duration</StatLabel>
        </StatItem>
      </StatsBar>

      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          onClick={addSection}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaPlus /> Add New Section
        </button>
      </div>

      {/* Existing curriculum content */}
      {sections.length > 0 && (
        <div>
          {sections.map((section, sectionIndex) => (
            <SectionCard
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SectionHeader isExpanded={expandedSections[section.id]}>
                <SectionHeaderLeft onClick={() => toggleSection(section.id)}>
                  <ExpandIcon isExpanded={expandedSections[section.id]}>
                    <FaChevronDown />
                  </ExpandIcon>
                  {section.isEditing ? (
                    <SectionTitleInput
                      placeholder={`Section ${sectionIndex + 1}: Enter section title`}
                      value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      onBlur={() => finishEditingSection(section.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); finishEditingSection(section.id); } }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <SectionTitle>
                      Section {sectionIndex + 1}: {section.title || 'Untitled Section'}
                    </SectionTitle>
                  )}
                </SectionHeaderLeft>
                
                <SectionMeta>
                  <span>{section.lectures.length} lecture{section.lectures.length !== 1 ? 's' : ''}</span>
                </SectionMeta>

                <SectionActions onClick={(e) => e.stopPropagation()}>
                  <IconButton onClick={() => setSections(sections.map(s => 
                    s.id === section.id ? { ...s, isEditing: true } : s
                  ))}>
                    <FaEdit />
                  </IconButton>
                  <IconButton danger onClick={() => deleteSection(section.id)}>
                    <FaTrash />
                  </IconButton>
                </SectionActions>
              </SectionHeader>

              <AnimatePresence>
                {expandedSections[section.id] && (
                  <SectionContent
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <AddLectureButton
                      type="button"
                      onClick={() => addLecture(section.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <FaPlus /> Add Lecture
                    </AddLectureButton>

                    <AnimatePresence>
                      {section.lectures.map((lecture, lectureIndex) => (
                        <LectureItem
                          key={lecture.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 100 }}
                        >
                          <LectureIcon type={lecture.type}>
                            {getLectureIcon(lecture.type)}
                          </LectureIcon>

                          <LectureContent>
                            <LectureTitleInput
                              placeholder={`Lecture ${lectureIndex + 1}: Enter lecture title`}
                              value={lecture.title}
                              onChange={(e) => updateLecture(section.id, lecture.id, { 
                                title: e.target.value 
                              })}
                            />
                            
                            <LectureMeta>
                              <div className="flex items-center gap-2">
                                <label className="text-xs">Type:</label>
                                <LectureType
                                  value={lecture.type}
                                  onChange={(e) => {
                                    const newType = e.target.value;
                                    console.log('Lecture type changed to:', newType, 'for lecture ID:', lecture.id);
                                    
                                    // First update the lecture with new type
                                    let updates = { type: newType };
                                    updateLecture(section.id, lecture.id, updates);
                                    
                                    // Then handle type-specific logic
                                    if (newType === 'quiz') {
                                      const quizUpdates = { 
                                        ...updates, 
                                        duration: lecture.duration || '30 min' 
                                      };
                                      updateLecture(section.id, lecture.id, quizUpdates);
                                      setExpandedLectureDetails(prev => ({ ...prev, [lecture.id]: true }));
                                      
                                      if (!lecture.quiz && !quizDrafts[lecture.id]) {
                                        setTimeout(() => {
                                          openQuizEditor({ ...lecture, ...quizUpdates });
                                        }, 200);
                                      }
                                    } else if (newType === 'article') {
                                      const articleUpdates = {
                                        ...updates,
                                        duration: lecture.readingTime ? `${lecture.readingTime} min read` : '5 min read',
                                        readingTime: lecture.readingTime || 5
                                      };
                                      updateLecture(section.id, lecture.id, articleUpdates);
                                      setExpandedLectureDetails(prev => ({ ...prev, [lecture.id]: true }));
                                    } else if (newType === 'assignment') {
                                      const assignmentUpdates = {
                                        ...updates,
                                        duration: 'Assignment'
                                      };
                                      updateLecture(section.id, lecture.id, assignmentUpdates);
                                      setExpandedLectureDetails(prev => ({ ...prev, [lecture.id]: true }));
                                    } else if (newType === 'video') {
                                      const videoUpdates = {
                                        ...updates,
                                        duration: lecture.duration || ''
                                      };
                                      updateLecture(section.id, lecture.id, videoUpdates);
                                      setExpandedLectureDetails(prev => ({ ...prev, [lecture.id]: false }));
                                    }
                                  }}
                                >
                                  <option value="video">🎥 Video</option>
                                  <option value="quiz">❓ Quiz</option>
                                  <option value="assignment">📝 Assignment</option>
                                  <option value="article">📄 Article</option>
                                </LectureType>
                              </div>

                              <div className="flex items-center gap-2">
                                <FaClock />
                                <DurationInput
                                  type="text"
                                  placeholder="e.g., 10:30"
                                  value={lecture.duration}
                                  onChange={(e) => updateLecture(section.id, lecture.id, { 
                                    duration: e.target.value 
                                  })}
                                />
                              </div>
                            </LectureMeta>

                            {/* Video Upload Section */}
                            {lecture.type === 'video' && (
                              <FileUploadWrapper>
                                <FileInput
                                  id={`file-${lecture.id}`}
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleLectureVideoUpload(
                                    section.id, 
                                    lecture.id, 
                                    e.target.files[0]
                                  )}
                                  disabled={uploadingLecture === lecture.id}
                                />
                                <UploadButton 
                                  htmlFor={`file-${lecture.id}`}
                                  uploaded={lecture.isUploaded}
                                  disabled={uploadingLecture === lecture.id}
                                >
                                  {lecture.isUploaded ? (
                                    <><FaCheckCircle /> Video Uploaded</>
                                  ) : uploadingLecture === lecture.id ? (
                                    <><FaUpload /> Uploading...</>
                                  ) : (
                                    <><FaUpload /> Upload Video</>
                                  )}
                                </UploadButton>
                                
                                {lecture.isUploaded && lecture.fileName && (
                                  <UploadStatus success>
                                    <FaCheckCircle />
                                    <span>{lecture.fileName}</span>
                                    {lecture.fileSize && (
                                      <span className="text-xs opacity-75">
                                        ({(lecture.fileSize / (1024 * 1024)).toFixed(2)} MB)
                                      </span>
                                    )}
                                  </UploadStatus>
                                )}
                                
                                {uploadProgress[lecture.id] !== null && uploadProgress[lecture.id] !== undefined && (
                                  <div>
                                    <ProgressBar>
                                      <ProgressFill
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress[lecture.id]}%` }}
                                      />
                                    </ProgressBar>
                                    <div className="text-xs text-center mt-1" style={{ color: '#a78bfa' }}>
                                      {uploadProgress[lecture.id]}% uploaded
                                    </div>
                                  </div>
                                )}
                              </FileUploadWrapper>
                            )}

                            {/* Quiz Preview */}
                            {lecture.quiz && quizPreviewOpen[lecture.id] && (
                              <div style={{ marginTop: 16, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #374151' }}>
                                <h4 style={{ color: '#e5e7eb', marginBottom: 8, fontSize: '16px', fontWeight: '600' }}>📋 {lecture.quiz.title || 'Quiz Preview'}</h4>
                                <p style={{ color: '#9ca3af', marginBottom: 16 }}>{lecture.quiz.description}</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 16, fontSize: '12px' }}>
                                  <div style={{ color: '#6b7280' }}>⏰ {lecture.quiz.timeLimitMinutes || 'No'} time limit</div>
                                  <div style={{ color: '#6b7280' }}>📊 {lecture.quiz.passingScore || 60}% to pass</div>
                                  <div style={{ color: '#6b7280' }}>🎯 {lecture.quiz.attemptsAllowed === 'unlimited' ? 'Unlimited' : lecture.quiz.attemptsAllowed} attempts</div>
                                  <div style={{ color: '#6b7280' }}>🪙 {lecture.quiz.tokenReward || 0} tokens</div>
                                </div>
                                {(lecture.quiz.questions || []).map((q, qi) => (
                                  <div key={qi} style={{ marginBottom: 12, padding: 12, borderRadius: 6, background: '#111827', border: '1px solid #1f2937' }}>
                                    <div style={{ color: '#e5e7eb', fontWeight: '500', marginBottom: 8 }}>Q{qi + 1}. {q.question} <span style={{ color: '#6b7280', fontSize: '12px' }}>({q.marks || 1} mark{(q.marks || 1) > 1 ? 's' : ''})</span></div>
                                    {(q.type === 'single_correct' || q.type === 'multiple_correct') && (q.choices || []).map((c, ci) => (
                                      <div key={ci} style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#9ca3af', marginBottom: 4 }}>
                                        <input type={q.type === 'single_correct' ? 'radio' : 'checkbox'} disabled checked={q.type === 'single_correct' ? q.correctIndex === ci : (q.correctIndices || []).includes(ci)} />
                                        <span>{String.fromCharCode(65 + ci)}. {c}</span>
                                        {(q.type === 'single_correct' ? q.correctIndex === ci : (q.correctIndices || []).includes(ci)) && <span style={{ color: '#10b981' }}>✓</span>}
                                      </div>
                                    ))}
                                    {q.type === 'short_answer' && (
                                      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Short answer question</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Quiz Section */}
                            {lecture.type === 'quiz' && expandedLectureDetails[lecture.id] && (
                              <QuizSection>
                                <QuizSettings>
                                  <SettingsRow>
                                    <SettingsLabel>Quiz Settings</SettingsLabel>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-xs">Max Attempts:</label>
                                        <TimeInput
                                          type="number"
                                          min="1"
                                          max="10"
                                          value={lecture.quiz?.maxAttempts || 3}
                                          onChange={(e) => updateLecture(section.id, lecture.id, { 
                                            quiz: { ...lecture.quiz, maxAttempts: parseInt(e.target.value) }
                                          })}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs">Pass %:</label>
                                        <TimeInput
                                          type="number"
                                          min="1"
                                          max="100"
                                          value={lecture.quiz?.passPercentage || 80}
                                          onChange={(e) => updateLecture(section.id, lecture.id, { 
                                            quiz: { ...lecture.quiz, passPercentage: parseInt(e.target.value) }
                                          })}
                                        />
                                      </div>
                                    </div>
                                  </SettingsRow>
                                  
                                  <QuizActions>
                                    <ActionButton
                                      type="button"
                                      onClick={() => openQuizEditor(lecture)}
                                    >
                                      {lecture.quiz?.questions?.length > 0 
                                        ? `Edit Quiz (${lecture.quiz.questions.length} questions)` 
                                        : 'Add Questions'
                                      }
                                    </ActionButton>
                                    
                                    {lecture.quiz?.questions?.length > 0 && (
                                      <ActionButton
                                        type="button"
                                        onClick={() => setQuizPreviewOpen(prev => ({ ...prev, [lecture.id]: !prev[lecture.id] }))}
                                      >
                                        {quizPreviewOpen[lecture.id] ? 'Hide Preview' : 'Preview Quiz'}
                                      </ActionButton>
                                    )}
                                  </QuizActions>

                                  {/* Inline Quiz Editor (appears when quizDraft exists) */}
                                  {quizDrafts[lecture.id] && (
                                    <div style={{ marginTop: 12 }}>
                                      <FormGroup>
                                        <FormLabel>Quiz Title</FormLabel>
                                        <FormInput
                                          type="text"
                                          value={quizDrafts[lecture.id].title}
                                          onChange={(e) => updateQuizDraft(lecture.id, d => ({ ...d, title: e.target.value }))}
                                        />
                                      </FormGroup>

                                      <FormGroup>
                                        <FormLabel>Quiz Description</FormLabel>
                                        <FormTextArea
                                          rows={3}
                                          value={quizDrafts[lecture.id].description}
                                          onChange={(e) => updateQuizDraft(lecture.id, d => ({ ...d, description: e.target.value }))}
                                        />
                                      </FormGroup>

                                      {/* Questions List */}
                                      {(quizDrafts[lecture.id].questions || []).map((q, qi) => (
                                        <div key={qi} style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e6e6f7' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong>Question {qi + 1}</strong>
                                            <div>
                                              <button type="button" onClick={() => removeQuizQuestion(lecture.id, qi)} style={{ marginRight: 8 }} className="btn btn-link">Remove</button>
                                            </div>
                                          </div>

                                          <FormGroup>
                                            <FormLabel>Question Text</FormLabel>
                                            <FormTextArea
                                              rows={2}
                                              value={q.question}
                                              onChange={(e) => updateQuestionField(lecture.id, qi, 'question', e.target.value)}
                                            />
                                          </FormGroup>

                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12 }}>
                                            <div>
                                              <FormLabel>Choices (for choice questions)</FormLabel>
                                              {(q.choices || []).map((c, ci) => (
                                                <div key={ci} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                                  <input
                                                    type="text"
                                                    value={c}
                                                    onChange={(e) => {
                                                      const newChoices = [...(q.choices || [])];
                                                      newChoices[ci] = e.target.value;
                                                      updateQuestionField(lecture.id, qi, 'choices', newChoices);
                                                    }}
                                                    style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                                                  />
                                                  <button type="button" onClick={() => {
                                                    const newChoices = (q.choices || []).filter((_,i) => i !== ci);
                                                    updateQuestionField(lecture.id, qi, 'choices', newChoices);
                                                  }} className="btn btn-link">✖</button>
                                                </div>
                                              ))}
                                              <div>
                                                <button type="button" onClick={() => addChoiceToQuestion(lecture.id, qi)} className="btn btn-sm" style={{ marginTop: 6 }}>
                                                  + Add Choice
                                                </button>
                                              </div>
                                            </div>

                                            <div>
                                              <FormGroup>
                                                <FormLabel>Question Type</FormLabel>
                                                <FormSelect value={q.type} onChange={(e) => updateQuestionField(lecture.id, qi, 'type', e.target.value)}>
                                                  <option value="single_correct">Single Correct</option>
                                                  <option value="multiple_correct">Multiple Correct</option>
                                                  <option value="short_answer">Short Answer</option>
                                                </FormSelect>
                                              </FormGroup>

                                              <FormGroup>
                                                <FormLabel>Marks</FormLabel>
                                                <TimeInput type="number" value={q.marks} onChange={(e) => updateQuestionField(lecture.id, qi, 'marks', parseInt(e.target.value || 0))} />
                                              </FormGroup>

                                              <FormGroup>
                                                <FormLabel>Correct Answer Index (for single choice)</FormLabel>
                                                <TimeInput type="number" min={0} max={(q.choices||[]).length - 1} value={q.correctIndex} onChange={(e) => updateQuestionField(lecture.id, qi, 'correctIndex', parseInt(e.target.value || 0))} />
                                              </FormGroup>
                                            </div>
                                          </div>
                                        </div>
                                      ))}

                                      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                                        <button type="button" onClick={() => addQuizQuestion(lecture.id)} className="btn btn-primary">+ Add Question</button>
                                        <button type="button" onClick={() => saveQuiz(lecture.id)} className="btn btn-success">Save Quiz</button>
                                        <button type="button" onClick={() => setQuizDrafts(prev => { const p = { ...prev }; delete p[lecture.id]; return p; })} className="btn btn-danger">Cancel</button>
                                      </div>
                                    </div>
                                  )}
                                </QuizSettings>
                              </QuizSection>
                            )}

                            {/* Assignment Section */}
                            {lecture.type === 'assignment' && expandedLectureDetails[lecture.id] && (
                              <AssignmentSection>
                                <AssignmentSettings>
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <SettingsLabel>Submission Type:</SettingsLabel>
                                      <SelectInput
                                        value={lecture.assignment?.submissionType || 'file'}
                                        onChange={(e) => updateLecture(section.id, lecture.id, { 
                                          assignment: { ...lecture.assignment, submissionType: e.target.value }
                                        })}
                                      >
                                        <option value="file">File Upload</option>
                                        <option value="text">Text Submission</option>
                                        <option value="url">URL/Link</option>
                                        <option value="both">File + Text</option>
                                      </SelectInput>
                                    </div>
                                    
                                    <div>
                                      <SettingsLabel>Max File Size:</SettingsLabel>
                                      <SelectInput
                                        value={lecture.assignment?.maxFileSize || '10MB'}
                                        onChange={(e) => updateLecture(section.id, lecture.id, { 
                                          assignment: { ...lecture.assignment, maxFileSize: e.target.value }
                                        })}
                                      >
                                        <option value="5MB">5 MB</option>
                                        <option value="10MB">10 MB</option>
                                        <option value="25MB">25 MB</option>
                                        <option value="50MB">50 MB</option>
                                      </SelectInput>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-4">
                                    <SettingsLabel>Max Score:</SettingsLabel>
                                    <TimeInput
                                      type="number"
                                      min="1"
                                      max="1000"
                                      value={lecture.assignment?.maxScore || 100}
                                      onChange={(e) => updateLecture(section.id, lecture.id, { 
                                        assignment: { ...lecture.assignment, maxScore: parseInt(e.target.value) }
                                      })}
                                      placeholder="100"
                                    />
                                  </div>
                                  
                                  <div className="mb-4">
                                    <SettingsLabel>Allowed File Types:</SettingsLabel>
                                    <TimeInput
                                      value={lecture.assignment?.allowedFileTypes || 'pdf,doc,docx,txt'}
                                      onChange={(e) => updateLecture(section.id, lecture.id, { 
                                        assignment: { ...lecture.assignment, allowedFileTypes: e.target.value }
                                      })}
                                      placeholder="pdf,doc,docx,txt,jpg,png"
                                    />
                                  </div>
                                  
                                  <div>
                                    <SettingsLabel>Instructions:</SettingsLabel>
                                    <TextArea
                                      value={lecture.assignment?.instructions || ''}
                                      onChange={(e) => updateLecture(section.id, lecture.id, { 
                                        assignment: { ...lecture.assignment, instructions: e.target.value }
                                      })}
                                      placeholder="Provide clear instructions for this assignment..."
                                      rows={3}
                                    />
                                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                      <button type="button" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm" onClick={() => {
                                        console.log('💾 Save Assignment (CourseUpload) clicked', { sectionId: section.id, lectureId: lecture.id });
                                        saveLectureDetails(section.id, lecture.id, { assignment: { ...lecture.assignment } });
                                      }}>💾 Save</button>
                                      <span style={{ color: '#9ca3af', fontSize: 12, alignSelf: 'center' }}>Save assignment instructions</span>
                                    </div>
                                  </div>
                                </AssignmentSettings>
                              </AssignmentSection>
                            )}

                            {/* Article Section */}
                            {lecture.type === 'article' && expandedLectureDetails[lecture.id] && (
                              <ArticleSection>
                                <ArticleSettings>
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <SettingsLabel>Reading Time:</SettingsLabel>
                                      <div className="flex items-center gap-2">
                                        <TimeInput
                                          type="number"
                                          min="1"
                                          max="120"
                                          value={lecture.readingTime || 5}
                                          onChange={(e) => {
                                            const time = parseInt(e.target.value);
                                            updateLecture(section.id, lecture.id, { 
                                              readingTime: time,
                                              duration: `${time} min read`
                                            });
                                          }}
                                          placeholder="5"
                                        />
                                        <span className="text-sm text-gray-400">minutes</span>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <SettingsLabel>Category:</SettingsLabel>
                                      <SelectInput
                                        value={lecture.article?.category || 'lesson'}
                                        onChange={(e) => updateLecture(section.id, lecture.id, { 
                                          article: { ...lecture.article, category: e.target.value }
                                        })}
                                      >
                                        <option value="lesson">📖 Lesson</option>
                                        <option value="reference">📚 Reference</option>
                                        <option value="tutorial">🛠️ Tutorial</option>
                                        <option value="guide">📋 Guide</option>
                                      </SelectInput>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-4">
                                    <SettingsLabel>Article Content:</SettingsLabel>
                                    <TextArea
                                      value={lecture.article?.content || ''}
                                      onChange={(e) => {
                                        const content = e.target.value;
                                        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
                                        const readingTime = Math.max(1, Math.ceil(wordCount / 200));
                                        
                                        updateLecture(section.id, lecture.id, { 
                                          article: { ...lecture.article, content, wordCount },
                                          readingTime,
                                          duration: `${readingTime} min read`
                                        });
                                      }}
                                      placeholder="Write your article content here... Supports Markdown formatting."
                                      rows={6}
                                    />
                                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                      <button type="button" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm" onClick={() => {
                                        console.log('💾 Save Article (CourseUpload) clicked', { sectionId: section.id, lectureId: lecture.id });
                                        saveLectureDetails(section.id, lecture.id, { article: { ...lecture.article }, content: lecture.article?.content, readingTime: lecture.readingTime, resourceLinks: lecture.article?.resources });
                                      }}>💾 Save</button>
                                      <span style={{ color: '#9ca3af', fontSize: 12, alignSelf: 'center' }}>Save article content</span>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-4">
                                    <SettingsLabel>Additional Resources:</SettingsLabel>
                                    <TextArea
                                      value={lecture.article?.resources || ''}
                                      onChange={(e) => updateLecture(section.id, lecture.id, { 
                                        article: { ...lecture.article, resources: e.target.value }
                                      })}
                                      placeholder="Additional resources, links, references..."
                                      rows={2}
                                    />
                                  </div>
                                  
                                  <ArticleStats>
                                    <div className="text-sm text-gray-400">
                                      Words: {lecture.article?.wordCount || 0} • Reading: ~{lecture.readingTime || 5} min
                                    </div>
                                  </ArticleStats>
                                </ArticleSettings>
                              </ArticleSection>
                            )}
                          </LectureContent>

                          <div className="flex-shrink-0">
                            <IconButton danger onClick={() => deleteLecture(section.id, lecture.id)}>
                              <FaTrash />
                            </IconButton>
                          </div>
                        </LectureItem>
                      ))}
                    </AnimatePresence>
                  </SectionContent>
                )}
              </AnimatePresence>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );

  // Block unverified mentors from accessing the upload wizard
  if (verificationStatus !== null && verificationStatus !== 'approved') {
    const isRejected = verificationStatus === 'rejected';
    return (
      <div className="min-h-screen bg-slate-900 text-white" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            background: isRejected ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${isRejected ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
            borderRadius: '1.25rem',
            padding: '3rem 2.5rem',
            maxWidth: 520,
            width: '90%',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            {isRejected ? '🚫' : verificationStatus === 'not_applied' ? '📋' : '⏳'}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            {isRejected ? 'Course Upload Unavailable' : verificationStatus === 'not_applied' ? 'Application Required' : 'Verification Pending'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {isRejected
              ? 'Your mentor application was rejected. You cannot upload courses until you reapply and are approved by an admin.'
              : verificationStatus === 'not_applied'
              ? 'You need to submit a mentor application and receive admin approval before uploading courses.'
              : 'Your mentor application is under review. Course upload will be unlocked once an admin approves your account.'}
          </p>
          <button
            onClick={() => navigate('/mentor/application-status')}
            style={{
              padding: '0.7rem 1.8rem', borderRadius: '0.6rem', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
              background: isRejected ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: '#fff', marginRight: '0.75rem',
            }}
          >
            {isRejected ? 'View Rejection & Reapply →' : 'View Application Status →'}
          </button>
          <button
            onClick={() => navigate('/mentor-home')}
            style={{
              padding: '0.7rem 1.4rem', borderRadius: '0.6rem',
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem',
              background: 'transparent', color: '#94a3b8', marginTop: '0.5rem',
            }}
          >
            ← Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-white/5 opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-cyan-900/20 via-fuchsia-900/20 to-transparent pointer-events-none"></div>
      
      <WizardContainer>
        {/* Stage Header */}
        <StageHeader>
          <StageProgress>
            {stages.map((stage, index) => (
              <StageStep
                key={stage.id}
                index={index}
                completed={isStageCompleted(stage.id)}
              >
                <StepCircle
                  active={currentStage === stage.id}
                  completed={isStageCompleted(stage.id)}
                  onClick={() => goToStage(stage.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {isStageCompleted(stage.id) && currentStage !== stage.id ? '✓' : stage.id}
                </StepCircle>
                <StepLabel
                  active={currentStage === stage.id}
                  completed={isStageCompleted(stage.id)}
                >
                  {stage.title}
                </StepLabel>
              </StageStep>
            ))}
          </StageProgress>
          
          <StageTitle>
            {stages.find(stage => stage.id === currentStage)?.title}
          </StageTitle>
          <StageSubtitle>
            {stages.find(stage => stage.id === currentStage)?.subtitle}
          </StageSubtitle>
        </StageHeader>

        {/* Stage Content */}
        <form onSubmit={handleSubmit}>
          <StageContent
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            key={currentStage}
            stage={currentStage}
          >
            {currentStage === 1 && renderStage1()}
            {currentStage === 2 && renderStage2()}
            {currentStage === 3 && renderStage3()}
            {currentStage === 4 && renderStage4()}
            {currentStage === 5 && renderStage5()}
          </StageContent>

          {/* Error Display */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <span>Course {isEditMode ? 'updated' : 'published'} successfully! Redirecting...</span>
            </div>
          )}

          {/* Navigation */}
          <StageNavigation>
            <NavButton
              type="button"
              onClick={prevStage}
              disabled={currentStage === 1}
            >
              <FaChevronLeft /> Previous
            </NavButton>

            <div style={{ display: 'flex', gap: '12px' }}>
              <NavButton
                type="button"
                onClick={() => navigate('/mentor-home')}
              >
                Cancel
              </NavButton>

              {currentStage < stages.length ? (
                <NavButton
                  type="button"
                  primary
                  onClick={nextStage}
                  disabled={!canMoveToNextStage()}
                >
                  Next <FaChevronRight />
                </NavButton>
              ) : (
                <NavButton
                  type="button"
                  primary
                  disabled={!agreedToTerms || loading}
                  onClick={(e) => {
                    console.log('🔘 Publish button clicked');
                    console.log('📊 Current stage:', currentStage);
                    console.log('✅ Agreed to terms:', agreedToTerms);
                    handleSubmit(e);
                  }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? 'Updating...' : 'Publishing...'}
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      {isEditMode ? 'Update Course' : 'Publish Course'}
                    </>
                  )}
                </NavButton>
              )}
            </div>
          </StageNavigation>
        </form>
      </WizardContainer>
      
      {/* Success/Error Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              {modalData.type === 'success' ? '🎉' : '❌'}
            </div>
            
            <h2 style={{
              color: modalData.type === 'success' ? '#059669' : '#dc2626',
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '16px',
              margin: 0
            }}>
              {modalData.title}
            </h2>
            
            <p style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '24px',
              whiteSpace: 'pre-line'
            }}>
              {modalData.message}
            </p>
            
            <button
              onClick={() => setShowModal(false)}
              style={{
                backgroundColor: modalData.type === 'success' ? '#059669' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = modalData.type === 'success' ? '#047857' : '#b91c1c';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = modalData.type === 'success' ? '#059669' : '#dc2626';
              }}
            >
              {modalData.type === 'success' ? 'Great!' : 'Got it'}
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default CourseUpload;