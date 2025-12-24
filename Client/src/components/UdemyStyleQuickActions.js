import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FaPlus, 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaBookOpen,
  FaArrowRight 
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const QuickActionsContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  padding: 2rem;
  margin: 2rem 0;
`;

const SectionTitle = styled.h2`
  background: linear-gradient(135deg, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 1.5rem 0;
  font-size: 1.75rem;
  font-weight: bold;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const ActionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(124, 58, 237, 0.2);
    border-color: rgba(124, 58, 237, 0.4);
  }
`;

const ActionIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const ActionTitle = styled.h3`
  color: #e2e8f0;
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const ActionDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const ActionButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7c3aed;
  font-weight: 500;
  font-size: 0.875rem;
`;

const UdemyStyleQuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const mentorActions = [
    {
      icon: <FaPlus />,
      title: 'Upload New Course',
      description: 'Create a professional course with our Udemy-style upload wizard. Add videos, thumbnails, and complete details.',
      action: () => navigate('/course-upload'),
      buttonText: 'Start Upload'
    },
 
  ];

  const learnerActions = [
    {
      icon: <FaGraduationCap />,
      title: 'Browse Courses',
      description: 'Discover new courses from expert mentors and start your learning journey.',
      action: () => navigate('/courses'),
      buttonText: 'Explore Now'
    },
    {
      icon: <FaBookOpen />,
      title: 'My Learning',
      description: 'Continue with your enrolled courses and track your progress.',
      action: () => navigate('/learner-home'),
      buttonText: 'Continue Learning'
    }
  ];

  const actions = user?.role === 'mentor' ? mentorActions : learnerActions;

  return (
    <QuickActionsContainer>
      <SectionTitle>
        {user?.role === 'mentor' ? 'Course Management' : 'Learning Hub'}
      </SectionTitle>
      
      <ActionsGrid>
        {actions.map((action, index) => (
          <ActionCard
            key={index}
            onClick={action.action}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ActionIcon>
              {action.icon}
            </ActionIcon>
            <ActionTitle>{action.title}</ActionTitle>
            <ActionDescription>{action.description}</ActionDescription>
            <ActionButton>
              {action.buttonText}
              <FaArrowRight />
            </ActionButton>
          </ActionCard>
        ))}
      </ActionsGrid>
    </QuickActionsContainer>
  );
};

export default UdemyStyleQuickActions;