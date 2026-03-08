import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import api from "../../services/api";
import { FaArrowLeft, FaPlayCircle } from "react-icons/fa";

// ============= STYLED COMPONENTS =============

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const HeaderSection = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(124, 58, 237, 0.2);
  border: 1px solid rgba(124, 58, 237, 0.4);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(124, 58, 237, 0.4);
    transform: translateX(-3px);
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const SubtitleText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatBox = styled(motion.div)`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  text-align: center;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(217, 70, 239, 0.2);
  }
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(to right, #06b6d4, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const CoursesSection = styled.div`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:before {
    content: '';
    width: 4px;
    height: 1.8rem;
    background: linear-gradient(to bottom, #06b6d4, #d946ef);
    border-radius: 2px;
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
`;

const CourseCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.15);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: rgba(217, 70, 239, 0.5);
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(217, 70, 239, 0.2);
  }
`;

const CourseImage = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(217, 70, 239, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  ${CourseCard}:hover &::after {
    opacity: 1;
  }
`;

const PlayIcon = styled.div`
  position: absolute;
  font-size: 3rem;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${CourseCard}:hover & {
    opacity: 1;
  }
`;

const CourseContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CourseTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CourseMentor = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressSection = styled.div`
  margin: 1rem 0;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;

  span:first-child {
    color: rgba(255, 255, 255, 0.7);
  }

  span:last-child {
    background: linear-gradient(to right, #06b6d4, #d946ef);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600;
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(to right, #06b6d4, #d946ef);
  border-radius: 4px;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    if (props.status === 'Completed') return 'rgba(34, 197, 94, 0.2)';
    if (props.status === 'In Progress') return 'rgba(59, 130, 246, 0.2)';
    return 'rgba(234, 179, 8, 0.2)';
  }};
  color: ${props => {
    if (props.status === 'Completed') return '#22c55e';
    if (props.status === 'In Progress') return '#3b82f6';
    return '#eab308';
  }};
  border: 1px solid ${props => {
    if (props.status === 'Completed') return 'rgba(34, 197, 94, 0.3)';
    if (props.status === 'In Progress') return 'rgba(59, 130, 246, 0.3)';
    return 'rgba(234, 179, 8, 0.3)';
  }};
  margin-bottom: 1rem;
`;

const ContinueButton = styled.button`
  width: 100%;
  padding: 0.8rem 1.5rem;
  margin-top: auto;
  background: linear-gradient(135deg, #06b6d4, #d946ef);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(217, 70, 239, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.6);
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.5rem;
  color: white;
  margin-bottom: 0.5rem;
`;

const EmptyStateMessage = styled.p`
  font-size: 1rem;
  margin-bottom: 1.5rem;
`;

const ExploreCourseButton = styled.button`
  padding: 0.8rem 2rem;
  background: linear-gradient(135deg, #06b6d4, #d946ef);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(217, 70, 239, 0.4);
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.6);

  div {
    display: inline-block;
    margin-bottom: 1rem;
  }
`;

const Spinner = styled.div`
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid rgba(124, 58, 237, 0.3);
  border-top-color: #d946ef;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ============= MAIN COMPONENT =============

const EnrolledCourses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0
  });

  useEffect(() => {
    fetchEnrolledCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        console.warn('No userId found in localStorage');
        setLoading(false);
        return;
      }

      const response = await api.get(`/courses/enrolled/${userId}`);
      console.log('Enrolled courses response:', response.data);

      let enrolledCourses = [];
      if (response.data.success && response.data.courses) {
        enrolledCourses = response.data.courses;
      } else if (Array.isArray(response.data)) {
        enrolledCourses = response.data;
      }

      // Format courses with progress calculation
      const formattedCourses = enrolledCourses.map(course => {
        const progressPercentage = course.overallProgress || 0;
        const status = progressPercentage === 100 ? 'Completed' : progressPercentage > 0 ? 'In Progress' : 'Not Started';

        return {
          id: course._id || course.id,
          title: course.title || course.name || 'Untitled Course',
          mentor: course.mentorName || course.mentor?.name || 'Unknown Mentor',
          thumbnail: course.thumbnail,
          progress: progressPercentage,
          status: status,
          duration: course.duration,
          level: course.level || course.skillLevel,
          description: course.description
        };
      });

      // Calculate statistics
      const completedCount = formattedCourses.filter(c => c.status === 'Completed').length;
      const inProgressCount = formattedCourses.filter(c => c.status === 'In Progress').length;

      setCourses(formattedCourses);
      setStats({
        totalCourses: formattedCourses.length,
        completedCourses: completedCount,
        inProgressCourses: inProgressCount
      });
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      setCourses([]);
      setStats({
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLearning = (courseId) => {
    navigate(`/learner/course/${courseId}`);
  };

  const handleExploreCourses = () => {
    navigate('/courses');
  };

  const handleGoBack = () => {
    navigate('/learner-home');
  };

  if (loading) {
    return (
      <PageContainer>
        <Container>
          <LoadingState>
            <Spinner />
            <div style={{ marginTop: '1rem' }}>Loading your enrolled courses...</div>
          </LoadingState>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        {/* Header */}
        <HeaderSection
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackButton onClick={handleGoBack}>
            <FaArrowLeft /> Back
          </BackButton>
          <div>
            <Title>My Enrolled Courses</Title>
            <SubtitleText>Continue learning and track your progress</SubtitleText>
          </div>
        </HeaderSection>

        {/* Statistics */}
        {courses.length > 0 && (
          <StatsSection>
            <StatBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <StatLabel>Total Courses</StatLabel>
              <StatValue>{stats.totalCourses}</StatValue>
            </StatBox>
            <StatBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <StatLabel>Completed</StatLabel>
              <StatValue>{stats.completedCourses}</StatValue>
            </StatBox>
            <StatBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <StatLabel>In Progress</StatLabel>
              <StatValue>{stats.inProgressCourses}</StatValue>
            </StatBox>
          </StatsSection>
        )}

        {/* Courses Section */}
        <CoursesSection>
          {courses.length > 0 ? (
            <>
              <SectionTitle>📚 Your Courses ({courses.length})</SectionTitle>
              <CoursesGrid>
                {courses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <CourseImage>
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                      ) : (
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
                          No Image
                        </div>
                      )}
                      <PlayIcon>
                        <FaPlayCircle />
                      </PlayIcon>
                    </CourseImage>

                    <CourseContent>
                      <StatusBadge status={course.status}>{course.status}</StatusBadge>
                      <CourseTitle>{course.title}</CourseTitle>
                      <CourseMentor>👨‍🏫 {course.mentor}</CourseMentor>

                      <ProgressSection>
                        <ProgressLabel>
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </ProgressLabel>
                        <ProgressBarContainer>
                          <ProgressBar progress={course.progress} />
                        </ProgressBarContainer>
                      </ProgressSection>

                      <ContinueButton onClick={() => handleContinueLearning(course.id)}>
                        <FaPlayCircle size={16} /> Continue Learning
                      </ContinueButton>
                    </CourseContent>
                  </CourseCard>
                ))}
              </CoursesGrid>
            </>
          ) : (
            <EmptyState
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <EmptyStateIcon>📚</EmptyStateIcon>
              <EmptyStateTitle>No Courses Enrolled Yet</EmptyStateTitle>
              <EmptyStateMessage>
                You haven't enrolled in any courses yet. Start exploring courses to begin your learning journey!
              </EmptyStateMessage>
              <ExploreCourseButton onClick={handleExploreCourses}>
                Explore Courses
              </ExploreCourseButton>
            </EmptyState>
          )}
        </CoursesSection>
      </Container>
    </PageContainer>
  );
};

export default EnrolledCourses;
