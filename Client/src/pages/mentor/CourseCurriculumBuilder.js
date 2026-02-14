import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaChevronDown, 
  FaChevronRight,
  FaVideo,
  FaFileAlt,
  FaClipboardCheck,
  FaEdit,
  FaTrash,
  FaUpload,
  FaSave,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const BuilderContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #2d3748;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #718096;
`;

const CourseTitle = styled.div`
  background: #f7fafc;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  border-left: 4px solid #667eea;
`;

const CourseName = styled.h2`
  font-size: 1.8rem;
  color: #2d3748;
  margin: 0;
`;

const AddSectionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }
`;

const SectionCard = styled(motion.div)`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: ${props => props.isExpanded ? '#f7fafc' : 'white'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #f7fafc;
  }
`;

const SectionHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
`;

const ExpandIcon = styled.div`
  color: #667eea;
  font-size: 1.2rem;
  transition: transform 0.3s ease;
  transform: ${props => props.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'};
`;

const SectionTitleWrapper = styled.div`
  flex: 1;
`;

const SectionTitleInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #cbd5e0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
`;

const SectionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  color: #718096;
  font-size: 0.9rem;
`;

const SectionActions = styled.div`
  display: flex;
  gap: 10px;
`;

const IconButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.danger ? '#fc8181' : '#e2e8f0'};
  color: ${props => props.danger ? 'white' : '#4a5568'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.danger ? '#f56565' : '#cbd5e0'};
    transform: translateY(-1px);
  }
`;

const SectionContent = styled(motion.div)`
  padding: 20px;
  background: #fafafa;
  border-top: 1px solid #e2e8f0;
`;

const AddLectureButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  color: #667eea;
  border: 2px dashed #667eea;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 15px;
  width: 100%;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: #f7fafc;
    border-color: #764ba2;
    color: #764ba2;
  }
`;

const LectureItem = styled(motion.div)`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
      case 'video': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'assignment': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'quiz': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'article': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      default: return '#e2e8f0';
    }
  }};
  color: white;
`;

const LectureContent = styled.div`
  flex: 1;
`;

const LectureTitle = styled.div`
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 5px;
`;

const LectureTitleInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const LectureMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.85rem;
  color: #718096;
`;

const LectureType = styled.select`
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #4a5568;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const DurationInput = styled.input`
  width: 80px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #4a5568;

  &:focus {
    outline: none;
    border-color: #667eea;
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
  background: ${props => props.uploaded ? '#43e97b' : '#667eea'};
  color: white;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover {
    background: ${props => props.uploaded ? '#38f9d7' : '#764ba2'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
  }
`;

const UploadStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: ${props => props.success ? 'rgba(67, 233, 123, 0.1)' : 'rgba(102, 126, 234, 0.1)'};
  border-radius: 6px;
  font-size: 0.85rem;
  color: ${props => props.success ? '#43e97b' : '#667eea'};
`;

const FileSize = styled.span`
  font-size: 0.75rem;
  color: #a0aec0;
  margin-left: 8px;
`;

const OverallProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 15px;
`;

const OverallProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
`;

const FileName = styled.span`
  font-size: 0.85rem;
  color: #4a5568;
  margin-left: 10px;
`;

const LectureActions = styled.div`
  display: flex;
  gap: 8px;
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  border: 2px solid rgba(102, 126, 234, 0.2);
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #718096;
  margin-top: 5px;
`;

const SaveButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 40px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 30px;
  box-shadow: 0 4px 15px rgba(67, 233, 123, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(67, 233, 123, 0.5);
  }

  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 10px;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
`;

const CourseCurriculumBuilder = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [courseName, setCourseName] = useState('My Awesome Course');
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingLecture, setUploadingLecture] = useState(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [quizDrafts, setQuizDrafts] = useState({}); // { lectureId: { title, description, questions: [...] } }
  const [quizPreviewOpen, setQuizPreviewOpen] = useState({});
  const [expandedLectureDetails, setExpandedLectureDetails] = useState({}); // { lectureId: boolean }

  // Add new section
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

  // Fetch lecture details (quiz, submissions) from server and merge into local lecture
  const fetchLectureDetails = async (lectureId) => {
    try {
      const res = await api.get(`/courses/lecture/${lectureId}`);
      if (res.data && res.data.lecture) {
        const { lecture, quiz, submissions } = res.data;
        // update local lecture state
        setSections(prev => prev.map(s => ({
          ...s,
          lectures: s.lectures.map(l => l.id === lectureId ? { ...l, ...lecture, quiz, submissions } : l)
        })));
        return { lecture, quiz, submissions };
      }
    } catch (err) {
      console.error('Fetch lecture details error', err);
    }
    return null;
  };

  // Open quiz editor for a lecture (preload existing quiz if present, fetching from server if needed)
  const openQuizEditor = async (lecture) => {
    console.log('openQuizEditor called for lecture:', lecture.id, lecture.title);
    
    // If lecture already has quiz attached locally, use it
    if (lecture.quiz) {
      console.log('Using existing quiz data from lecture');
      setQuizDrafts(prev => ({ ...prev, [lecture.id]: { ...lecture.quiz } }));
      return;
    }

    // If we have a draft already, just open it
    if (quizDrafts[lecture.id]) {
      console.log('Quiz draft already exists for lecture:', lecture.id);
      return;
    }

    console.log('Creating new quiz draft for lecture:', lecture.id);
    
    // Try to fetch from server first
    try {
      const data = await fetchLectureDetails(lecture.id);
      if (data && data.quiz) {
        console.log('Loaded quiz from server:', data.quiz);
        setQuizDrafts(prev => ({ ...prev, [lecture.id]: { ...data.quiz } }));
      } else {
        console.log('No existing quiz found, creating new one');
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
      }
    } catch (error) {
      console.error('Error fetching lecture details:', error);
      // Create a new quiz draft anyway
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
    }
  };

  // Save quiz to server
  const saveQuiz = async (lectureId) => {
    const quiz = quizDrafts[lectureId];
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      alert('Quiz must have at least one question');
      return;
    }

    try {
      const response = await api.post(`/courses/lecture/${lectureId}/quiz`, { ...quiz, courseId: courseId || 'new' }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      // Attach returned quiz to lecture in local state
      setSections(sections.map(s => ({
        ...s,
        lectures: s.lectures.map(l => l.id === lectureId ? { ...l, quiz: response.data.quiz } : l)
      })));

      // remove draft
      setQuizDrafts(prev => { const p = { ...prev }; delete p[lectureId]; return p; });
      alert('Quiz saved');
    } catch (err) {
      console.error('Save quiz error', err);
      alert(err.response?.data?.message || 'Failed to save quiz');
    }
  };

  // Save lecture details for assignment/article (PUT)
  const saveLectureDetails = async (sectionId, lectureId, updates) => {
    try {
      const response = await api.put(`/courses/lecture/${lectureId}`, updates, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      updateLecture(sectionId, lectureId, response.data.lecture || updates);
      alert('Lecture details saved');
    } catch (err) {
      console.error('Save lecture details error', err);
      alert(err.response?.data?.message || 'Failed to save lecture details');
    }
  };

  // Helpers to edit quiz draft in local state
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

  const addChoiceToQuestion = (lectureId, qIndex) => {
    updateQuizDraft(lectureId, draft => {
      const questions = (draft.questions || []).map((q, i) => i === qIndex ? { ...q, choices: [...(q.choices||[]), ''] } : q);
      return { ...draft, questions };
    });
  };

  const updateQuestionField = (lectureId, qIndex, field, value) => {
    updateQuizDraft(lectureId, draft => {
      const questions = (draft.questions || []).map((q, i) => i === qIndex ? { ...q, [field]: value } : q);
      return { ...draft, questions };
    });
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

  // Delete section
  const deleteSection = (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setSections(sections.filter(s => s.id !== sectionId));
      const newExpanded = { ...expandedSections };
      delete newExpanded[sectionId];
      setExpandedSections(newExpanded);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    });
  };

  // Update section title
  const updateSectionTitle = (sectionId, title) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, title, isEditing: false } : s
    ));
  };

  // Add lecture to section
  const addLecture = (sectionId) => {
    const newLecture = {
      id: Date.now(),
      title: '',
      type: 'video',
      duration: '',
      file: null,
      fileName: '',
      fileSize: 0,
      isEditing: true,
      isUploaded: false
    };
    
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, lectures: [...s.lectures, newLecture] }
        : s
    ));
  };

  // Delete lecture
  const deleteLecture = (sectionId, lectureId) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, lectures: s.lectures.filter(l => l.id !== lectureId) }
          : s
      ));
    }
  };

  // Update lecture
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

  // Handle file upload for lecture
  const handleFileUpload = async (sectionId, lectureId, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, AVI, MOV, WMV, WEBM)');
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 500MB');
      return;
    }

    const formData = new FormData();
    formData.append('lecture_video', file);
    formData.append('sectionId', sectionId);
    formData.append('lectureId', lectureId);
    formData.append('courseId', courseId || 'new');

    // detect duration and include it
    try {
      const duration = await getVideoDuration(file);
      const rounded = Math.round(duration * 100) / 100;
      formData.append('duration', String(rounded));
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

      // Update lecture with uploaded file info
      updateLecture(sectionId, lectureId, {
        file: response.data.filePath,
        fileName: file.name,
        fileSize: file.size,
        isUploaded: true
      });

      alert('Video uploaded successfully!');

      // Clear progress after 1 second
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

  // Save curriculum
  const saveCurriculum = async () => {
    // Validate
    if (sections.length === 0) {
      alert('Please add at least one section');
      return;
    }

    for (let section of sections) {
      if (!section.title.trim()) {
        alert('Please fill in all section titles');
        return;
      }
      if (section.lectures.length === 0) {
        alert(`Section "${section.title}" has no lectures`);
        return;
      }
      for (let lecture of section.lectures) {
        if (!lecture.title.trim()) {
          alert(`Please fill in all lecture titles in section "${section.title}"`);
          return;
        }
        
        // Type-specific validation
        if (lecture.type === 'video' && !lecture.isUploaded) {
          alert(`Please upload video for "${lecture.title}" in section "${section.title}"`);
          return;
        }
        
        if (lecture.type === 'quiz') {
          const quizData = quizDrafts[lecture.id] || lecture.quiz;
          if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            alert(`Please add at least one question to quiz "${lecture.title}" in section "${section.title}"`);
            return;
          }
          // Check each question has content
          for (let i = 0; i < quizData.questions.length; i++) {
            const q = quizData.questions[i];
            if (!q.question || !q.question.trim()) {
              alert(`Question ${i + 1} in quiz "${lecture.title}" is empty. Please add question text.`);
              return;
            }
            if ((q.type === 'single_correct' || q.type === 'multiple_correct') && (!q.choices || q.choices.filter(c => c && c.trim()).length < 2)) {
              alert(`Question ${i + 1} in quiz "${lecture.title}" needs at least 2 answer options.`);
              return;
            }
          }
        }
        
        if (lecture.type === 'article') {
          if (!lecture.content || !lecture.content.trim()) {
            alert(`Please add content to article "${lecture.title}" in section "${section.title}"`);
            return;
          }
        }
        
        if (lecture.type === 'assignment') {
          if (!lecture.assignmentDescription || !lecture.assignmentDescription.trim()) {
            alert(`Please add instructions to assignment "${lecture.title}" in section "${section.title}"`);
            return;
          }
        }
      }
    }

    setSaving(true);
    setOverallProgress(0);

    try {
      const curriculumData = {
        courseId: courseId || 'new',
        courseName,
        mentorId: user?.id || user?._id,
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
              // Assignment data
              lectureData.assignment = {
                description: lecture.assignmentDescription || '',
                instructions: lecture.assignmentDescription || '', // Using same field for now
                submissionType: lecture.submissionType || 'file_upload',
                evaluationType: lecture.evaluationType || 'manual',
                tokenReward: lecture.tokenReward || 0,
                deadline: lecture.deadline || null,
                allowedFileTypes: lecture.allowedFileTypes || [],
                minWords: lecture.minWords || 0,
                maxWords: lecture.maxWords || 0,
                linkInstructions: lecture.linkInstructions || '',
                maxScore: 100
              };
              console.log(`📋 Assignment data for "${lecture.title}":`, lectureData.assignment);
            }

            return lectureData;
          })
        }))
      };

      console.log('🚀 Sending curriculum data:', JSON.stringify(curriculumData, null, 2));
      setOverallProgress(50);

      const response = await api.post('/courses/save-curriculum', curriculumData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setOverallProgress(100);
      
      alert(`✅ Course curriculum saved successfully!\n📚 ${response.data.stats.sections} sections\n🎥 ${response.data.stats.lectures} lectures`);
      
      // Navigate to course preview or dashboard
      setTimeout(() => {
        if (response.data.courseId) {
          navigate(`/mentor-home`);
        }
      }, 1500);

    } catch (error) {
      console.error('Save failed:', error);
      alert(error.response?.data?.message || 'Failed to save curriculum. Please try again.');
      setOverallProgress(0);
    } finally {
      setSaving(false);
    }
  };

  // Get lecture icon
  const getLectureIcon = (type) => {
    switch(type) {
      case 'video': return <FaVideo />;
      case 'assignment': return <FaClipboardCheck />;
      case 'quiz': return <FaClipboardCheck />;
      case 'article': return <FaFileAlt />;
      default: return <FaFileAlt />;
    }
  };

  // Calculate total lectures and uploaded videos
  const totalLectures = sections.reduce((acc, s) => acc + s.lectures.length, 0);
  const totalVideos = sections.reduce((acc, s) => 
    acc + s.lectures.filter(l => l.type === 'video').length, 0
  );
  const uploadedVideos = sections.reduce((acc, s) => 
    acc + s.lectures.filter(l => l.type === 'video' && l.isUploaded).length, 0
  );
  const uploadProgressPercent = totalVideos > 0 ? Math.round((uploadedVideos / totalVideos) * 100) : 100;

  return (
    <BuilderContainer>
      <ContentWrapper>
        <Header>
          <Title>Build Your Course Curriculum</Title>
          <Subtitle>Create sections and add lectures to structure your course content</Subtitle>
        </Header>

        <CourseTitle>
          <CourseName>{courseName}</CourseName>
        </CourseTitle>

        <AddSectionButton
          onClick={addSection}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaPlus /> Add Section
        </AddSectionButton>

        {sections.length > 0 && (
          <StatsBar>
            <StatItem>
              <StatValue>{sections.length}</StatValue>
              <StatLabel>Sections</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{totalLectures}</StatValue>
              <StatLabel>Total Lectures</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{totalVideos}</StatValue>
              <StatLabel>Video Lectures</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{uploadedVideos}/{totalVideos}</StatValue>
              <StatLabel>Videos Uploaded</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{uploadProgressPercent}%</StatValue>
              <StatLabel>Upload Progress</StatLabel>
            </StatItem>
          </StatsBar>
        )}

        <AnimatePresence>
          {sections.map((section, sectionIndex) => (
            <SectionCard
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <SectionHeader 
                isExpanded={expandedSections[section.id]}
              >
                <SectionHeaderLeft onClick={() => toggleSection(section.id)}>
                  <ExpandIcon isExpanded={expandedSections[section.id]}>
                    <FaChevronDown />
                  </ExpandIcon>
                  {section.isEditing ? (
                    <SectionTitleWrapper onClick={(e) => e.stopPropagation()}>
                      <SectionTitleInput
                        placeholder={`Section ${sectionIndex + 1}: Enter section title`}
                        value={section.title}
                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                        onBlur={() => updateSectionTitle(section.id, section.title)}
                        autoFocus
                      />
                    </SectionTitleWrapper>
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
                    <FaEdit /> Edit
                  </IconButton>
                  <IconButton danger onClick={() => deleteSection(section.id)}>
                    <FaTrash /> Delete
                  </IconButton>
                </SectionActions>
              </SectionHeader>

              <AnimatePresence>
                {expandedSections[section.id] && (
                  <SectionContent
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AddLectureButton
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
                              <LectureType
                                value={lecture.type}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  console.log('Lecture type changed to:', newType, 'for lecture ID:', lecture.id);
                                  
                                  // Clear type-specific data when switching types
                                  let updates = { type: newType };
                                  
                                  // First update the lecture with new type
                                  updateLecture(section.id, lecture.id, updates);
                                  
                                  // Then handle type-specific logic
                                  if (newType === 'quiz') {
                                    // Initialize quiz with default duration and auto-expand
                                    const quizUpdates = { 
                                      ...updates, 
                                      duration: lecture.duration || '30 min' 
                                    };
                                    updateLecture(section.id, lecture.id, quizUpdates);
                                    
                                    // Auto-expand details
                                    setExpandedLectureDetails(prev => {
                                      console.log('Expanding quiz details for lecture:', lecture.id);
                                      return { ...prev, [lecture.id]: true };
                                    });
                                    
                                    // Auto-open quiz editor for new quizzes
                                    if (!lecture.quiz && !quizDrafts[lecture.id]) {
                                      setTimeout(() => {
                                        console.log('Opening quiz editor for:', lecture.id);
                                        openQuizEditor({ ...lecture, ...quizUpdates });
                                      }, 200);
                                    }
                                  } else if (newType === 'article') {
                                    // Initialize article with reading time and expand details
                                    const articleUpdates = {
                                      ...updates,
                                      duration: lecture.readingTime ? `${lecture.readingTime} min read` : '5 min read',
                                      readingTime: lecture.readingTime || 5
                                    };
                                    updateLecture(section.id, lecture.id, articleUpdates);
                                    setExpandedLectureDetails(prev => ({ ...prev, [lecture.id]: true }));
                                  } else if (newType === 'assignment') {
                                    // Initialize assignment and expand details
                                    const assignmentUpdates = {
                                      ...updates,
                                      duration: lecture.duration || 'No deadline'
                                    };
                                    updateLecture(section.id, lecture.id, assignmentUpdates);
                                    setExpandedLectureDetails(prev => ({ ...prev, [lecture.id]: true }));
                                  } else if (newType === 'video') {
                                    // Keep existing duration for video and collapse details
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

                              {(lecture.type === 'video' || lecture.type === 'quiz') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <FaClock />
                                  <DurationInput
                                    type="text"
                                    placeholder={lecture.type === 'quiz' ? 'Quiz Duration' : 'Video Duration'}
                                    value={lecture.duration || ''}
                                    onChange={(e) => updateLecture(section.id, lecture.id, { 
                                      duration: e.target.value 
                                    })}
                                  />
                                </div>
                              )}

                              {lecture.type === 'article' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <FaClock />
                                  <DurationInput
                                    type="number"
                                    placeholder="Reading time"
                                    value={lecture.readingTime || ''}
                                    onChange={(e) => {
                                      const time = parseInt(e.target.value) || 0;
                                      updateLecture(section.id, lecture.id, { 
                                        readingTime: time,
                                        duration: `${time} min read`
                                      });
                                    }}
                                  />
                                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>min read</span>
                                </div>
                              )}

                              {lecture.type === 'assignment' && lecture.deadline && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b' }}>
                                  <FaClock />
                                  <span style={{ fontSize: '12px' }}>
                                    Due: {new Date(lecture.deadline).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

                              {lecture.fileName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <FaCheckCircle style={{ color: '#43e97b' }} />
                                  <FileName>{lecture.fileName}</FileName>
                                </div>
                              )}
                            </LectureMeta>

                            {/* Lecture Details Toggle Button */}
                            {(lecture.type === 'quiz' || lecture.type === 'assignment' || lecture.type === 'article') && (
                              <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <button 
                                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md"
                                  onClick={() => {
                                    console.log('Toggle details for lecture:', lecture.id);
                                    setExpandedLectureDetails(prev => ({ ...prev, [lecture.id]: !prev[lecture.id] }));
                                  }}
                                >
                                  <span>{expandedLectureDetails[lecture.id] ? '🔼' : '🔽'}</span>
                                  {expandedLectureDetails[lecture.id] ? 'Hide Details' : `Configure ${lecture.type.charAt(0).toUpperCase() + lecture.type.slice(1)} Settings`}
                                </button>
                                {expandedLectureDetails[lecture.id] && (
                                  <div style={{ marginTop: 8, textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                                    ⚡ Details panel is now open below
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Lecture Type Details - Conditional Display */}
                            {expandedLectureDetails[lecture.id] && (
                              <>
                            {/* Debug info */}
                            <div style={{ 
                              backgroundColor: '#fef3c7', 
                              color: '#92400e', 
                              padding: '8px 12px', 
                              borderRadius: '6px', 
                              fontSize: '12px', 
                              marginTop: '8px',
                              border: '1px solid #fbbf24' 
                            }}>
                              🐛 DEBUG: Lecture Type = {lecture.type} | Details Expanded = {expandedLectureDetails[lecture.id] ? 'YES' : 'NO'} | Quiz Draft = {quizDrafts[lecture.id] ? 'EXISTS' : 'NONE'}
                            </div>
                            
                            {lecture.type === 'quiz' && (
                              <div style={{ marginTop: 16, padding: 20, background: '#1a202c', borderRadius: 12, border: '1px solid #2d3748' }}>
                                {!quizDrafts[lecture.id] ? (
                                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg font-medium hover:from-fuchsia-700 hover:to-pink-700 transition-all" onClick={() => openQuizEditor(lecture)}>📝 Create Quiz</button>
                                    {lecture.quiz && (
                                      <>
                                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>✅ Quiz saved with {lecture.quiz.questions?.length || 0} question(s)</span>
                                        <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all" onClick={() => setQuizPreviewOpen(prev => ({ ...prev, [lecture.id]: !prev[lecture.id] }))}>
                                          {quizPreviewOpen[lecture.id] ? '🙈 Hide Preview' : '👁️ Preview Quiz'}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div className="quiz-builder">
                                    {/* Quiz Settings */}
                                    <div style={{ marginBottom: 24, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #374151' }}>
                                      <h4 style={{ color: '#e5e7eb', marginBottom: 12, fontSize: '16px', fontWeight: '600' }}>🎯 Quiz Settings</h4>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                        <div>
                                          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Quiz Title</label>
                                          <input className="w-full p-2 bg-slate-800 border border-gray-600 rounded text-white" value={quizDrafts[lecture.id].title || ''} onChange={(e) => updateQuizDraft(lecture.id, { title: e.target.value })} placeholder="Enter quiz title" />
                                        </div>
                                        <div>
                                          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Passing Percentage (%)</label>
                                          <input type="number" className="w-full p-2 bg-slate-800 border border-gray-600 rounded text-white" min="0" max="100" value={quizDrafts[lecture.id].passingScore || ''} onChange={(e) => updateQuizDraft(lecture.id, { passingScore: parseInt(e.target.value) || 0 })} placeholder="60" />
                                        </div>
                                        <div>
                                          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Time Limit (minutes)</label>
                                          <input type="number" className="w-full p-2 bg-slate-800 border border-gray-600 rounded text-white" min="0" value={quizDrafts[lecture.id].timeLimitMinutes || ''} onChange={(e) => updateQuizDraft(lecture.id, { timeLimitMinutes: parseInt(e.target.value) || 0 })} placeholder="30" />
                                        </div>
                                        <div>
                                          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Attempts Allowed</label>
                                          <select className="w-full p-2 bg-slate-800 border border-gray-600 rounded text-white" value={quizDrafts[lecture.id].attemptsAllowed || 'unlimited'} onChange={(e) => updateQuizDraft(lecture.id, { attemptsAllowed: e.target.value })}>
                                            <option value="unlimited">Unlimited</option>
                                            <option value="1">1 attempt</option>
                                            <option value="2">2 attempts</option>
                                            <option value="3">3 attempts</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Token Reward</label>
                                          <input type="number" className="w-full p-2 bg-slate-800 border border-gray-600 rounded text-white" min="0" value={quizDrafts[lecture.id].tokenReward || ''} onChange={(e) => updateQuizDraft(lecture.id, { tokenReward: parseInt(e.target.value) || 0 })} placeholder="10" />
                                        </div>
                                      </div>
                                      <div style={{ marginTop: 12 }}>
                                        <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Description</label>
                                        <textarea className="w-full p-2 bg-slate-800 border border-gray-600 rounded text-white" rows={2} value={quizDrafts[lecture.id].description || ''} onChange={(e) => updateQuizDraft(lecture.id, { description: e.target.value })} placeholder="Quiz description or instructions" />
                                      </div>
                                    </div>

                                    {/* Questions Builder */}
                                    <div style={{ marginBottom: 20 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h4 style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: '600' }}>❓ Questions ({(quizDrafts[lecture.id].questions || []).length})</h4>
                                        <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-green-700 transition-all" onClick={() => addQuizQuestion(lecture.id)}>➕ Add Question</button>
                                      </div>

                                      {(quizDrafts[lecture.id].questions || []).map((q, qi) => (
                                        <div key={qi} style={{ marginBottom: 16, padding: 16, background: '#0f1419', border: '1px solid #374151', borderRadius: 8 }}>
                                          {/* Question Header */}
                                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div style={{ flex: 1 }}>
                                              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Question {qi + 1}</label>
                                              <input className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" value={q.question || ''} onChange={(e) => updateQuestionField(lecture.id, qi, 'question', e.target.value)} placeholder="Enter your question..." />
                                            </div>
                                            <div style={{ minWidth: '140px' }}>
                                              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Type</label>
                                              <select className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" value={q.type || 'single_correct'} onChange={(e) => updateQuestionField(lecture.id, qi, 'type', e.target.value)}>
                                                <option value="single_correct">Single Correct</option>
                                                <option value="multiple_correct">Multiple Correct</option>
                                                <option value="short_answer">Short Answer</option>
                                              </select>
                                            </div>
                                            <div style={{ minWidth: '80px' }}>
                                              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Marks</label>
                                              <input type="number" className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" min="1" value={q.marks || 1} onChange={(e) => updateQuestionField(lecture.id, qi, 'marks', parseInt(e.target.value) || 1)} />
                                            </div>
                                            <button className="mt-6 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all" onClick={() => removeQuizQuestion(lecture.id, qi)}>🗑️</button>
                                          </div>

                                          {/* Options for MCQ */}
                                          {(q.type === 'single_correct' || q.type === 'multiple_correct') && (
                                            <div style={{ marginTop: 12 }}>
                                              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 8 }}>Answer Options</label>
                                              {Array.from({ length: 4 }, (_, ci) => (
                                                <div key={ci} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                  <span style={{ color: '#6b7280', minWidth: '20px' }}>{String.fromCharCode(65 + ci)}.</span>
                                                  <input className="flex-1 p-2 bg-slate-800 border border-gray-600 rounded text-white" value={(q.choices && q.choices[ci]) || ''} onChange={(e) => updateQuestionField(lecture.id, qi, 'choices', Array.from({ length: 4 }, (_, i) => i === ci ? e.target.value : ((q.choices && q.choices[i]) || '')))} placeholder={`Option ${String.fromCharCode(65 + ci)}`} />
                                                  {q.type === 'single_correct' ? (
                                                    <label style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '14px', minWidth: '70px' }}>
                                                      <input type="radio" name={`correct-${lecture.id}-${qi}`} checked={q.correctIndex === ci} onChange={() => updateQuestionField(lecture.id, qi, 'correctIndex', ci)} style={{ marginRight: '6px' }} />
                                                      Correct
                                                    </label>
                                                  ) : (
                                                    <label style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '14px', minWidth: '70px' }}>
                                                      <input type="checkbox" checked={(q.correctIndices && q.correctIndices.includes(ci)) || false} onChange={(e) => {
                                                        const current = q.correctIndices || [];
                                                        const updated = e.target.checked ? [...current, ci] : current.filter(i => i !== ci);
                                                        updateQuestionField(lecture.id, qi, 'correctIndices', updated);
                                                      }} style={{ marginRight: '6px' }} />
                                                      Correct
                                                    </label>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Short Answer */}
                                          {q.type === 'short_answer' && (
                                            <div style={{ marginTop: 12 }}>
                                              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 4 }}>Sample Answer (Optional)</label>
                                              <textarea className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" rows={3} value={q.sampleAnswer || ''} onChange={(e) => updateQuestionField(lecture.id, qi, 'sampleAnswer', e.target.value)} placeholder="Provide a sample answer for reference..." />
                                            </div>
                                          )}
                                        </div>
                                      ))}

                                      {(quizDrafts[lecture.id].questions || []).length === 0 && (
                                        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#111827', borderRadius: 8, border: '2px dashed #374151' }}>
                                          <div style={{ fontSize: '48px', marginBottom: 12 }}>❓</div>
                                          <p>No questions added yet. Click "Add Question" to get started!</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #374151' }}>
                                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all" onClick={() => setQuizDrafts(prev => { const p = { ...prev }; delete p[lecture.id]; return p; })}>❌ Cancel</button>
                                      <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all" onClick={() => console.log('Save as draft')}>💾 Save Draft</button>
                                      <button className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg font-medium hover:from-fuchsia-700 hover:to-pink-700 transition-all" onClick={() => saveQuiz(lecture.id)}>✅ Save Quiz</button>
                                    </div>
                                  </div>
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
                              </div>
                            )}

                            {lecture.type === 'assignment' && (
                              <div style={{ marginTop: 16, padding: 20, background: '#1a202c', borderRadius: 12, border: '1px solid #2d3748' }}>
                                <h4 style={{ color: '#e5e7eb', marginBottom: 16, fontSize: '16px', fontWeight: '600' }}>📝 Assignment Details</h4>
                                
                                {/* Assignment Instructions */}
                                <div style={{ marginBottom: 20 }}>
                                  <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Assignment Instructions</label>
                                  <textarea className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" rows={6} value={lecture.assignmentDescription || ''} onChange={(e) => updateLecture(section.id, lecture.id, { assignmentDescription: e.target.value })} placeholder="Provide clear instructions for the assignment...&#10;&#10;Example:&#10;- Create a React component that displays user data&#10;- Implement proper error handling&#10;- Use CSS modules for styling" style={{ resize: 'vertical' }} />
                                </div>

                                {/* Assignment Settings Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                                  <div>
                                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Submission Type</label>
                                    <select className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" value={lecture.submissionType || 'file_upload'} onChange={(e) => updateLecture(section.id, lecture.id, { submissionType: e.target.value })}>
                                      <option value="file_upload">📎 File Upload</option>
                                      <option value="text_answer">📝 Text Answer</option>
                                      <option value="external_link">🔗 External Link</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Evaluation Type</label>
                                    <select className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" value={lecture.evaluationType || 'manual'} onChange={(e) => updateLecture(section.id, lecture.id, { evaluationType: e.target.value })}>
                                      <option value="manual">👤 Manual Review</option>
                                      <option value="auto_approve">✅ Auto Approve</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Token Reward</label>
                                    <input type="number" className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" min="0" value={lecture.tokenReward || ''} onChange={(e) => updateLecture(section.id, lecture.id, { tokenReward: parseInt(e.target.value) || 0 })} placeholder="20" />
                                  </div>
                                  <div>
                                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Deadline</label>
                                    <input type="datetime-local" className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" value={lecture.deadline || ''} onChange={(e) => updateLecture(section.id, lecture.id, { deadline: e.target.value })} />
                                  </div>
                                </div>

                                {/* File Type Selection for File Upload */}
                                {lecture.submissionType === 'file_upload' && (
                                  <div style={{ marginBottom: 20, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #374151' }}>
                                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 12 }}>Allowed File Types</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                                      {['PDF', 'DOC/DOCX', 'TXT', 'ZIP/RAR', 'Images', 'Videos', 'Code Files'].map(fileType => (
                                        <label key={fileType} style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '14px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={(lecture.allowedFileTypes || []).includes(fileType)} onChange={(e) => {
                                            const current = lecture.allowedFileTypes || [];
                                            const updated = e.target.checked ? [...current, fileType] : current.filter(t => t !== fileType);
                                            updateLecture(section.id, lecture.id, { allowedFileTypes: updated });
                                          }} style={{ marginRight: 6 }} />
                                          {fileType}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Text Answer Settings */}
                                {lecture.submissionType === 'text_answer' && (
                                  <div style={{ marginBottom: 20, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #374151' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                      <div>
                                        <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Minimum Words</label>
                                        <input type="number" className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" min="0" value={lecture.minWords || ''} onChange={(e) => updateLecture(section.id, lecture.id, { minWords: parseInt(e.target.value) || 0 })} placeholder="100" />
                                      </div>
                                      <div>
                                        <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Maximum Words</label>
                                        <input type="number" className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" min="0" value={lecture.maxWords || ''} onChange={(e) => updateLecture(section.id, lecture.id, { maxWords: parseInt(e.target.value) || 0 })} placeholder="500" />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* External Link Settings */}
                                {lecture.submissionType === 'external_link' && (
                                  <div style={{ marginBottom: 20, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #374151' }}>
                                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Link Instructions</label>
                                    <textarea className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" rows={3} value={lecture.linkInstructions || ''} onChange={(e) => updateLecture(section.id, lecture.id, { linkInstructions: e.target.value })} placeholder="Example: Share a link to your deployed project, GitHub repository, or live demo..." />
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #374151' }}>
                                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all" onClick={() => console.log('Save as draft')}>💾 Save Draft</button>
                                  <button className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg font-medium hover:from-fuchsia-700 hover:to-pink-700 transition-all" onClick={() => saveLectureDetails(section.id, lecture.id, { 
                                    assignmentDescription: lecture.assignmentDescription, 
                                    submissionType: lecture.submissionType,
                                    evaluationType: lecture.evaluationType,
                                    tokenReward: lecture.tokenReward,
                                    deadline: lecture.deadline,
                                    allowedFileTypes: lecture.allowedFileTypes,
                                    minWords: lecture.minWords,
                                    maxWords: lecture.maxWords,
                                    linkInstructions: lecture.linkInstructions
                                  })}>✅ Save Assignment</button>
                                </div>
                              </div>
                            )}

                            {lecture.type === 'article' && (
                              <div style={{ marginTop: 16, padding: 20, background: '#1a202c', borderRadius: 12, border: '1px solid #2d3748' }}>
                                <h4 style={{ color: '#e5e7eb', marginBottom: 16, fontSize: '16px', fontWeight: '600' }}>📄 Article Editor</h4>
                                
                                {/* Article Settings */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #374151' }}>
                                  <div>
                                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Article Title</label>
                                    <input className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" value={lecture.articleTitle || lecture.title} onChange={(e) => updateLecture(section.id, lecture.id, { articleTitle: e.target.value })} placeholder="Enter article title" />
                                  </div>
                                  <div>
                                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Estimated Reading Time (minutes)</label>
                                    <input type="number" className="w-full p-3 bg-slate-800 border border-gray-600 rounded text-white" min="1" value={lecture.readingTime || ''} onChange={(e) => updateLecture(section.id, lecture.id, { readingTime: parseInt(e.target.value) || 0 })} placeholder="5" />
                                  </div>
                                </div>

                                {/* Large Text Editor */}
                                <div style={{ marginBottom: 20 }}>
                                  <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: 6 }}>Article Content</label>
                                  <div style={{ border: '1px solid #374151', borderRadius: 8, background: '#0f172a' }}>
                                    {/* Editor Toolbar */}
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #374151', display: 'flex', gap: 8, fontSize: '12px', color: '#9ca3af' }}>
                                      <span>💡 Tip: Use markdown syntax - **bold**, *italic*, # headings, - bullets, ``` code blocks</span>
                                    </div>
                                    <textarea className="w-full p-4 bg-transparent border-0 text-white resize-none" rows={15} value={lecture.content || ''} onChange={(e) => updateLecture(section.id, lecture.id, { content: e.target.value })} placeholder="# Article Title&#10;&#10;Write your article content here...&#10;&#10;## Subheading&#10;&#10;Use **bold** and *italic* text for emphasis.&#10;&#10;### Code Example&#10;```javascript&#10;const example = 'Hello World';&#10;```&#10;&#10;- Bullet point 1&#10;- Bullet point 2&#10;&#10;> Blockquote for important notes" style={{ outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }} />
                                  </div>
                                </div>

                                {/* Resource Links Section */}
                                <div style={{ marginBottom: 20, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #374151' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <label style={{ color: '#9ca3af', fontSize: '12px' }}>Resource Links</label>
                                    <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition-all" onClick={() => {
                                      const resources = lecture.resourceLinks || [];
                                      updateLecture(section.id, lecture.id, { resourceLinks: [...resources, { title: '', url: '', description: '' }] });
                                    }}>➕ Add Resource</button>
                                  </div>
                                  {(lecture.resourceLinks || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 20, color: '#6b7280', border: '2px dashed #374151', borderRadius: 8 }}>
                                      <div style={{ fontSize: '24px', marginBottom: 8 }}>🔗</div>
                                      <p>No resource links added yet</p>
                                    </div>
                                  ) : (
                                    (lecture.resourceLinks || []).map((resource, ri) => (
                                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                                        <div>
                                          <label style={{ color: '#9ca3af', fontSize: '10px', display: 'block', marginBottom: 4 }}>Title</label>
                                          <input className="w-full p-2 bg-slate-800 border border-gray-600 rounded text-white text-sm" value={resource.title || ''} onChange={(e) => {
                                            const updated = (lecture.resourceLinks || []).map((r, i) => i === ri ? { ...r, title: e.target.value } : r);
                                            updateLecture(section.id, lecture.id, { resourceLinks: updated });
                                          }} placeholder="Resource title" />
                                        </div>
                                        <div>
                                          <label style={{ color: '#9ca3af', fontSize: '10px', display: 'block', marginBottom: 4 }}>URL</label>
                                          <input className="w-full p-2 bg-slate-800 border border-gray-600 rounded text-white text-sm" value={resource.url || ''} onChange={(e) => {
                                            const updated = (lecture.resourceLinks || []).map((r, i) => i === ri ? { ...r, url: e.target.value } : r);
                                            updateLecture(section.id, lecture.id, { resourceLinks: updated });
                                          }} placeholder="https://..." />
                                        </div>
                                        <button className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all" onClick={() => {
                                          const updated = (lecture.resourceLinks || []).filter((_, i) => i !== ri);
                                          updateLecture(section.id, lecture.id, { resourceLinks: updated });
                                        }}>🗑️</button>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* Preview Toggle */}
                                {lecture.content && (
                                  <div style={{ marginBottom: 20 }}>
                                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all" onClick={() => {
                                      const isOpen = (lecture.previewOpen || false);
                                      updateLecture(section.id, lecture.id, { previewOpen: !isOpen });
                                    }}>
                                      {lecture.previewOpen ? '🙈 Hide Preview' : '👁️ Preview Article'}
                                    </button>
                                  </div>
                                )}

                                {/* Article Preview */}
                                {lecture.previewOpen && lecture.content && (
                                  <div style={{ marginBottom: 20, padding: 20, background: '#111827', borderRadius: 8, border: '1px solid #374151' }}>
                                    <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
                                      <h3 style={{ color: '#e5e7eb', fontSize: '20px', fontWeight: '600', margin: 0 }}>{lecture.articleTitle || lecture.title}</h3>
                                      {lecture.readingTime && <div style={{ color: '#6b7280', fontSize: '14px', marginTop: 4 }}>📖 {lecture.readingTime} min read</div>}
                                    </div>
                                    <div style={{ color: '#d1d5db', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{lecture.content}</div>
                                    {(lecture.resourceLinks || []).length > 0 && (
                                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #374151' }}>
                                        <h4 style={{ color: '#e5e7eb', fontSize: '16px', marginBottom: 12 }}>📎 Additional Resources</h4>
                                        {(lecture.resourceLinks || []).map((resource, ri) => (
                                          <div key={ri} style={{ marginBottom: 8 }}>
                                            <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
                                              🔗 {resource.title || resource.url}
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #374151' }}>
                                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all" onClick={() => console.log('Save draft')}>💾 Save Draft</button>
                                  <button className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg font-medium hover:from-fuchsia-700 hover:to-pink-700 transition-all" onClick={() => saveLectureDetails(section.id, lecture.id, { 
                                    content: lecture.content,
                                    articleTitle: lecture.articleTitle,
                                    readingTime: lecture.readingTime,
                                    resourceLinks: lecture.resourceLinks
                                  })}>✅ Save Article</button>
                                </div>
                              </div>
                            )}
                              </>
                            )}

                            {/* Video Upload Section - Always visible for video type */}
                            {lecture.type === 'video' && (
                              <FileUploadWrapper>
                                <FileInput
                                  id={`file-${lecture.id}`}
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleFileUpload(
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
                                      <FileSize>
                                        ({(lecture.fileSize / (1024 * 1024)).toFixed(2)} MB)
                                      </FileSize>
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
                                    <div style={{ fontSize: '0.75rem', color: '#667eea', marginTop: '5px', textAlign: 'center' }}>
                                      {uploadProgress[lecture.id]}% uploaded
                                    </div>
                                  </div>
                                )}
                              </FileUploadWrapper>
                            )}
                          </LectureContent>

                          <LectureActions>
                            <IconButton danger onClick={() => deleteLecture(section.id, lecture.id)}>
                              <FaTrash />
                            </IconButton>
                          </LectureActions>
                        </LectureItem>
                      ))}
                    </AnimatePresence>
                  </SectionContent>
                )}
              </AnimatePresence>
            </SectionCard>
          ))}
        </AnimatePresence>

        {sections.length > 0 && (
          <>
            <SaveButton
              onClick={saveCurriculum}
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              <FaSave /> {saving ? 'Saving Course...' : `Save & Publish Course (${sections.length} sections, ${totalLectures} lectures)`}
            </SaveButton>

            {saving && overallProgress > 0 && (
              <OverallProgressBar>
                <OverallProgressFill
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5 }}
                >
                  {overallProgress}%
                </OverallProgressFill>
              </OverallProgressBar>
            )}
          </>
        )}
      </ContentWrapper>
    </BuilderContainer>
  );
};

export default CourseCurriculumBuilder;
