import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaVideo, 
  FaTasks, 
  FaFileAlt, 
  FaEdit, 
  FaTrash, 
  FaGripVertical,
  FaCheck,
  FaUpload 
} from 'react-icons/fa';
import api from '../../services/api';

const BuilderContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: white;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(124, 58, 237, 0.3);
`;

const Title = styled.h1`
  background: linear-gradient(135deg, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
`;

const PublishButton = styled.button`
  background: ${props => props.disabled ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #22c55e, #16a34a)'};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover {
    transform: ${props => !props.disabled && 'translateY(-2px)'};
    box-shadow: ${props => !props.disabled && '0 10px 25px rgba(34, 197, 94, 0.3)'};
  }
`;

const Section = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  background: rgba(124, 58, 237, 0.1);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const SectionTitle = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SectionActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'danger' ? '#ef4444' : 'rgba(255,255,255,0.1)'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.variant === 'danger' ? '#dc2626' : 'rgba(255,255,255,0.2)'};
  }
`;

const LectureList = styled.div`
  padding: 1rem;
`;

const LectureItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(124, 58, 237, 0.1);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LectureInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LectureIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.type) {
      case 'video': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'assignment': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'resource': return 'linear-gradient(135deg, #06b6d4, #0284c7)';
      default: return 'rgba(255,255,255,0.1)';
    }
  }};
  color: white;
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem;
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
  }
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

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #e2e8f0;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;

  option {
    background: #1e293b;
    color: white;
  }

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button`
  background: ${props => props.variant === 'secondary' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #6366f1)'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
  }
`;

const FileUpload = styled.div`
  border: 2px dashed rgba(124, 58, 237, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.05);
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
`;

const Progress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #6366f1);
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const MentorCourseBuilder = ({ courseId }) => {
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [sectionForm, setSectionForm] = useState({
    title: ''
  });

  const [lectureForm, setLectureForm] = useState({
    title: '',
    type: 'video',
    description: '',
    assignmentDescription: '',
    submissionType: 'code',
    evaluationInstructions: '',
    isRequired: true,
    isOptional: false
  });

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const response = await api.get(`/udemy-courses/edit/${courseId}`);
      if (response.data.success) {
        setCourse(response.data.course);
        setSections(response.data.sections);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const handleAddSection = async () => {
    try {
      const response = await api.post('/udemy-courses/section', {
        title: sectionForm.title,
        courseId,
        order: sections.length + 1
      });

      if (response.data.success) {
        setSections([...sections, { ...response.data.section, lectures: [] }]);
        setSectionForm({ title: '' });
        setShowSectionModal(false);
      }
    } catch (error) {
      console.error('Error adding section:', error);
    }
  };

  const handleEditSection = async () => {
    try {
      const response = await api.put(`/udemy-courses/section/${editingSection._id}`, {
        title: sectionForm.title,
        order: editingSection.order
      });

      if (response.data.success) {
        setSections(sections.map(section => 
          section._id === editingSection._id 
            ? { ...section, title: sectionForm.title }
            : section
        ));
        setSectionForm({ title: '' });
        setEditingSection(null);
        setShowSectionModal(false);
      }
    } catch (error) {
      console.error('Error editing section:', error);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm('Are you sure? This will delete all lectures in this section.')) {
      try {
        await api.delete(`/udemy-courses/section/${sectionId}`);
        setSections(sections.filter(section => section._id !== sectionId));
      } catch (error) {
        console.error('Error deleting section:', error);
      }
    }
  };

  const handleAddLecture = async () => {
    try {
      const lectureData = {
        ...lectureForm,
        sectionId: selectedSectionId,
        courseId,
        order: getSectionLectures(selectedSectionId).length + 1
      };

      const response = await api.post('/udemy-courses/lecture', lectureData);

      if (response.data.success) {
        setSections(sections.map(section => 
          section._id === selectedSectionId
            ? { 
                ...section, 
                lectures: [...(section.lectures || []), response.data.lecture] 
              }
            : section
        ));
        resetLectureForm();
        setShowLectureModal(false);
      }
    } catch (error) {
      console.error('Error adding lecture:', error);
    }
  };

  const handleVideoUpload = async (lectureId, file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('description', 'Video lecture');

    try {
      // Simulate progress for demo
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const response = await api.post(`/udemy-courses/upload/video/${lectureId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        fetchCourseData(); // Refresh data
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getSectionLectures = (sectionId) => {
    const section = sections.find(s => s._id === sectionId);
    return section?.lectures || [];
  };

  const resetLectureForm = () => {
    setLectureForm({
      title: '',
      type: 'video',
      description: '',
      assignmentDescription: '',
      submissionType: 'code',
      evaluationInstructions: '',
      isRequired: true,
      isOptional: false
    });
    setSelectedSectionId(null);
    setEditingLecture(null);
  };

  const openSectionModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({ title: section.title });
    } else {
      setEditingSection(null);
      setSectionForm({ title: '' });
    }
    setShowSectionModal(true);
  };

  const openLectureModal = (sectionId, lecture = null) => {
    setSelectedSectionId(sectionId);
    if (lecture) {
      setEditingLecture(lecture);
      setLectureForm(lecture);
    } else {
      resetLectureForm();
    }
    setShowLectureModal(true);
  };

  const canPublish = () => {
    const hasSection = sections.length > 0;
    const hasAssignment = sections.some(section => 
      section.lectures?.some(lecture => lecture.type === 'assignment')
    );
    return hasSection && hasAssignment;
  };

  const handlePublish = async () => {
    if (!canPublish()) {
      alert('Course must have at least one section and one assignment to publish.');
      return;
    }

    try {
      const response = await api.put(`/udemy-courses/publish/${courseId}`);
      if (response.data.success) {
        setCourse({ ...course, isPublished: true });
        alert('Course published successfully!');
      }
    } catch (error) {
      console.error('Error publishing course:', error);
      alert(error.response?.data?.message || 'Error publishing course');
    }
  };

  const getLectureIcon = (type) => {
    switch (type) {
      case 'video': return <FaVideo />;
      case 'assignment': return <FaTasks />;
      case 'resource': return <FaFileAlt />;
      default: return <FaFileAlt />;
    }
  };

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <BuilderContainer>
      <Header>
        <div>
          <Title>{course.title}</Title>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.7 }}>
            {course.skillLevel} • {sections.length} sections • {course.isPublished ? 'Published' : 'Draft'}
          </p>
        </div>
        <PublishButton 
          onClick={handlePublish}
          disabled={!canPublish() || course.isPublished}
        >
          <FaCheck />
          {course.isPublished ? 'Published' : 'Publish Course'}
        </PublishButton>
      </Header>

      <AddButton onClick={() => openSectionModal()}>
        <FaPlus />
        Add New Section
      </AddButton>

      <AnimatePresence>
        {sections.map((section, index) => (
          <Section
            key={section._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <SectionHeader>
              <SectionTitle>
                <FaGripVertical />
                Section {index + 1}: {section.title}
                <span style={{ fontSize: '0.875rem', opacity: 0.7, marginLeft: '0.5rem' }}>
                  ({section.lectures?.length || 0} lectures)
                </span>
              </SectionTitle>
              <SectionActions>
                <ActionButton onClick={() => openSectionModal(section)}>
                  <FaEdit />
                </ActionButton>
                <ActionButton 
                  variant="danger" 
                  onClick={() => handleDeleteSection(section._id)}
                >
                  <FaTrash />
                </ActionButton>
              </SectionActions>
            </SectionHeader>

            <LectureList>
              {section.lectures?.map((lecture, lectureIndex) => (
                <LectureItem
                  key={lecture._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: lectureIndex * 0.05 }}
                >
                  <LectureInfo>
                    <LectureIcon type={lecture.type}>
                      {getLectureIcon(lecture.type)}
                    </LectureIcon>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>{lecture.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
                        {lecture.type.charAt(0).toUpperCase() + lecture.type.slice(1)}
                        {lecture.type === 'video' && lecture.videoUrl && ' • Uploaded'}
                        {lecture.type === 'assignment' && lecture.isRequired && ' • Required'}
                      </p>
                    </div>
                  </LectureInfo>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {lecture.type === 'video' && !lecture.videoUrl && (
                      <ActionButton>
                        <label htmlFor={`video-${lecture._id}`} style={{ cursor: 'pointer' }}>
                          <FaUpload />
                        </label>
                        <input
                          id={`video-${lecture._id}`}
                          type="file"
                          accept="video/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleVideoUpload(lecture._id, e.target.files[0])}
                        />
                      </ActionButton>
                    )}
                    <ActionButton onClick={() => openLectureModal(section._id, lecture)}>
                      <FaEdit />
                    </ActionButton>
                  </div>
                </LectureItem>
              ))}

              <AddButton onClick={() => openLectureModal(section._id)}>
                <FaPlus />
                Add Lecture
              </AddButton>
            </LectureList>
          </Section>
        ))}
      </AnimatePresence>

      {/* Section Modal */}
      <AnimatePresence>
        {showSectionModal && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowSectionModal(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2>{editingSection ? 'Edit Section' : 'Add New Section'}</h2>
              <FormGroup>
                <Label>Section Title</Label>
                <Input
                  type="text"
                  placeholder="Enter section title"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                />
              </FormGroup>
              <ButtonGroup>
                <Button variant="secondary" onClick={() => setShowSectionModal(false)}>
                  Cancel
                </Button>
                <Button onClick={editingSection ? handleEditSection : handleAddSection}>
                  {editingSection ? 'Update' : 'Add'} Section
                </Button>
              </ButtonGroup>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>

      {/* Lecture Modal */}
      <AnimatePresence>
        {showLectureModal && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowLectureModal(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2>{editingLecture ? 'Edit Lecture' : 'Add New Lecture'}</h2>
              <FormGroup>
                <Label>Lecture Title</Label>
                <Input
                  type="text"
                  placeholder="Enter lecture title"
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Lecture Type</Label>
                <Select
                  value={lectureForm.type}
                  onChange={(e) => setLectureForm({ ...lectureForm, type: e.target.value })}
                >
                  <option value="video">Video</option>
                  <option value="assignment">Assignment</option>
                  <option value="resource">Resource</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  placeholder="Enter lecture description"
                  value={lectureForm.description}
                  onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                />
              </FormGroup>

              {lectureForm.type === 'assignment' && (
                <>
                  <FormGroup>
                    <Label>Assignment Description</Label>
                    <TextArea
                      placeholder="Describe the assignment task"
                      value={lectureForm.assignmentDescription}
                      onChange={(e) => setLectureForm({ ...lectureForm, assignmentDescription: e.target.value })}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Submission Type</Label>
                    <Select
                      value={lectureForm.submissionType}
                      onChange={(e) => setLectureForm({ ...lectureForm, submissionType: e.target.value })}
                    >
                      <option value="code">Code</option>
                      <option value="document">Document</option>
                      <option value="video">Video</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Evaluation Instructions</Label>
                    <TextArea
                      placeholder="How should this assignment be evaluated?"
                      value={lectureForm.evaluationInstructions}
                      onChange={(e) => setLectureForm({ ...lectureForm, evaluationInstructions: e.target.value })}
                    />
                  </FormGroup>
                </>
              )}

              {isUploading && (
                <div>
                  <Label>Upload Progress</Label>
                  <ProgressBar>
                    <Progress progress={uploadProgress} />
                  </ProgressBar>
                  <p style={{ textAlign: 'center', fontSize: '0.875rem', opacity: 0.7 }}>
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <ButtonGroup>
                <Button variant="secondary" onClick={() => setShowLectureModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLecture}>
                  {editingLecture ? 'Update' : 'Add'} Lecture
                </Button>
              </ButtonGroup>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </BuilderContainer>
  );
};

export default MentorCourseBuilder;