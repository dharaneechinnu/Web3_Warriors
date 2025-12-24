import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FaGraduationCap, 
  FaLightbulb, 
  FaTags, 
  FaCheckCircle,
  FaArrowRight 
} from 'react-icons/fa';
import api from '../../services/api';

const CreateContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: white;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  background: linear-gradient(135deg, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 1rem 0;
  font-size: 3rem;
  font-weight: bold;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  opacity: 0.8;
  margin: 0;
`;

const FormContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(124, 58, 237, 0.3);
  padding: 3rem;
  backdrop-filter: blur(10px);
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${props => props.active ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.1)'};
  border-radius: 25px;
  margin: 0 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  color: #e2e8f0;
  font-size: 1.5rem;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #e2e8f0;
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(124, 58, 237, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
    background: rgba(255, 255, 255, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(124, 58, 237, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
    background: rgba(255, 255, 255, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(124, 58, 237, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  option {
    background: #1e293b;
    color: white;
    padding: 0.5rem;
  }

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const SkillGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const SkillCard = styled.div`
  padding: 1rem;
  border: 2px solid ${props => props.selected ? '#7c3aed' : 'rgba(124, 58, 237, 0.3)'};
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  background: ${props => props.selected ? 'rgba(124, 58, 237, 0.1)' : 'transparent'};
  transition: all 0.3s ease;

  &:hover {
    border-color: #7c3aed;
    background: rgba(124, 58, 237, 0.05);
    transform: translateY(-2px);
  }
`;

const OutcomeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const OutcomeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 12px;
`;

const OutcomeInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #7c3aed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(34, 197, 94, 0.3);
  }
`;

const RemoveButton = styled.button`
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
  }
`;

const CreateButton = styled(motion.button)`
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const CourseCreationForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    skillLevel: '',
    description: '',
    learningOutcomes: ['']
  });

  const skillLevels = [
    { value: 'beginner', label: 'Beginner', description: 'No prior experience needed' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience required' },
    { value: 'advanced', label: 'Advanced', description: 'Extensive experience required' },
    { value: 'expert', label: 'Expert', description: 'Professional level expertise' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleOutcomeChange = (index, value) => {
    const newOutcomes = [...formData.learningOutcomes];
    newOutcomes[index] = value;
    setFormData(prev => ({
      ...prev,
      learningOutcomes: newOutcomes
    }));
  };

  const addOutcome = () => {
    setFormData(prev => ({
      ...prev,
      learningOutcomes: [...prev.learningOutcomes, '']
    }));
  };

  const removeOutcome = (index) => {
    const newOutcomes = formData.learningOutcomes.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      learningOutcomes: newOutcomes.length > 0 ? newOutcomes : ['']
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Course title is required');
      return false;
    }
    if (!formData.skillLevel) {
      setError('Please select a skill level');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Course description is required');
      return false;
    }
    const validOutcomes = formData.learningOutcomes.filter(outcome => outcome.trim());
    if (validOutcomes.length === 0) {
      setError('At least one learning outcome is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const courseData = {
        ...formData,
        learningOutcomes: formData.learningOutcomes.filter(outcome => outcome.trim())
      };

      const response = await api.post('/udemy-courses/create', courseData);
      
      if (response.data.success) {
        // Redirect to course builder
        navigate(`/mentor/course-builder/${response.data.course._id}`);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      setError(error.response?.data?.message || 'Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CreateContainer>
      <Header>
        <Title>Create Your Course</Title>
        <Subtitle>Share your expertise with the world</Subtitle>
      </Header>

      <FormContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StepIndicator>
          <Step active={true}>
            <FaGraduationCap />
            Course Details
          </Step>
        </StepIndicator>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle>
              <IconWrapper>
                <FaGraduationCap />
              </IconWrapper>
              Course Information
            </SectionTitle>
            
            <FormGroup>
              <Label>Course Title</Label>
              <Input
                type="text"
                placeholder="What's the title of your course?"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength="100"
              />
            </FormGroup>

            <FormGroup>
              <Label>Course Description</Label>
              <TextArea
                placeholder="Describe what your course is about and what students will learn..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                maxLength="1000"
              />
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>
              <IconWrapper>
                <FaTags />
              </IconWrapper>
              Skill Level
            </SectionTitle>
            
            <SkillGrid>
              {skillLevels.map((level) => (
                <SkillCard
                  key={level.value}
                  selected={formData.skillLevel === level.value}
                  onClick={() => handleInputChange('skillLevel', level.value)}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{level.label}</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>
                    {level.description}
                  </p>
                </SkillCard>
              ))}
            </SkillGrid>
          </FormSection>

          <FormSection>
            <SectionTitle>
              <IconWrapper>
                <FaLightbulb />
              </IconWrapper>
              Learning Outcomes
            </SectionTitle>
            
            <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
              What will students be able to do after completing your course?
            </p>

            <OutcomeList>
              {formData.learningOutcomes.map((outcome, index) => (
                <OutcomeItem key={index}>
                  <FaCheckCircle style={{ color: '#22c55e' }} />
                  <OutcomeInput
                    type="text"
                    placeholder="Students will be able to..."
                    value={outcome}
                    onChange={(e) => handleOutcomeChange(index, e.target.value)}
                  />
                  {formData.learningOutcomes.length > 1 && (
                    <RemoveButton
                      type="button"
                      onClick={() => removeOutcome(index)}
                    >
                      ×
                    </RemoveButton>
                  )}
                </OutcomeItem>
              ))}
            </OutcomeList>
            
            <div style={{ marginTop: '1rem' }}>
              <AddButton
                type="button"
                onClick={addOutcome}
              >
                +
              </AddButton>
            </div>
          </FormSection>

          <CreateButton
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Creating Course...' : 'Create Course'}
            <FaArrowRight />
          </CreateButton>
        </form>
      </FormContainer>
    </CreateContainer>
  );
};

export default CourseCreationForm;