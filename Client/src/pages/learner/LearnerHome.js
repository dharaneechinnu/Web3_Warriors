import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import api from "../../services/api";
import UdemyStyleQuickActions from "../../components/UdemyStyleQuickActions";

// ============= STYLED COMPONENTS =============

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%);
  padding: 2rem;
  padding-top: 6rem;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 5rem;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Header Section
const HeaderSection = styled(motion.div)`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #06b6d4, #d946ef);
  color: white;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 1rem 0;
  box-shadow: 0 4px 15px rgba(217, 70, 239, 0.4);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 1rem;
`;

// Stats Section
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(217, 70, 239, 0.3);
  }
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

// Section Components
const Section = styled(motion.div)`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
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

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
`;

const CourseCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.15);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(217, 70, 239, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(217, 70, 239, 0.2);
  }
`;

const CourseTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
`;

const CourseMentor = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin: 1rem 0;
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

const Button = styled.button`
  width: 100%;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #06b6d4, #d946ef);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(217, 70, 239, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DifficultyBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    if (props.level === 'Beginner') return 'rgba(34, 197, 94, 0.2)';
    if (props.level === 'Intermediate') return 'rgba(234, 179, 8, 0.2)';
    return 'rgba(239, 68, 68, 0.2)';
  }};
  color: ${props => {
    if (props.level === 'Beginner') return '#22c55e';
    if (props.level === 'Intermediate') return '#eab308';
    return '#ef4444';
  }};
  border: 1px solid ${props => {
    if (props.level === 'Beginner') return 'rgba(34, 197, 94, 0.3)';
    if (props.level === 'Intermediate') return 'rgba(234, 179, 8, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  }};
`;

const CourseInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const CredentialCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.15);
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(217, 70, 239, 0.5);
    transform: translateX(5px);
  }
`;

const CredentialTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
`;

const CredentialDate = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
`;

const CredentialButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SmallButton = styled.button`
  flex: 1;
  padding: 0.6rem 1rem;
  background: ${props => props.secondary ? 'rgba(124, 58, 237, 0.2)' : 'linear-gradient(135deg, #06b6d4, #d946ef)'};
  color: white;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(217, 70, 239, 0.3);
  }
`;

const TokenActivity = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(124, 58, 237, 0.1);
`;

const TokenInfo = styled.div`
  flex: 1;
`;

const TokenReason = styled.p`
  color: white;
  font-weight: 500;
  margin-bottom: 0.2rem;
`;

const TokenDate = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
`;

const TokenAmount = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(to right, #06b6d4, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const InfoText = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 1rem;
  padding: 0.8rem;
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  border-radius: 0.3rem;
`;

const NotificationCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 0.8rem;
  padding: 1.2rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${props => {
    if (props.type === 'feedback') return '#06b6d4';
    if (props.type === 'approval') return '#22c55e';
    if (props.type === 'credential') return '#d946ef';
    return '#f97316';
  }};
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(5px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  }
`;

const NotificationTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.3rem;
`;

const NotificationMessage = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
`;

const NotificationTime = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
`;

const ProgressText = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// ============= MAIN COMPONENT =============

const LearnerHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [learnerData, setLearnerData] = useState({
    name: "Learner",
    stats: {
      enrolledCourses: 0,
      completedCourses: 0,
      credentialsEarned: 0,
      tokenBalance: 0
    },
    activeCourses: [],
    recommendedCourses: [],
    recentCredentials: [],
    tokenActivities: [],
    notifications: []
  });

  useEffect(() => {
    fetchLearnerData();
  }, []);

  const fetchLearnerData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName') || "Learner";
      const tokenBalance = localStorage.getItem('tokencoin') || 0;

      if (!userId) {
        console.warn('No userId found in localStorage');
        setLearnerData({
          name: userName,
          stats: { enrolledCourses: 0, completedCourses: 0, credentialsEarned: 0, tokenBalance: tokenBalance },
          activeCourses: [],
          recommendedCourses: [],
          recentCredentials: [],
          tokenActivities: [],
          notifications: []
        });
        return;
      }

      // Fetch data from actual APIs
      const [
        enrolledCoursesRes,
        allCoursesRes,
        credentialsRes,
        tokenActivitiesRes,
        notificationsRes
      ] = await Promise.allSettled([
        api.get(`/courses/enrolled/${userId}`).catch(() => ({ data: [] })),
        api.get('/courses/getall').catch(() => ({ data: [] })),
        api.get(`/credentials/${userId}`).catch(() => ({ data: [] })),
        api.get(`/token-activities/${userId}`).catch(() => ({ data: [] })),
        api.get(`/notifications/${userId}`).catch(() => ({ data: [] }))
      ]);

      // Process enrolled courses
      const enrolledCourses = enrolledCoursesRes.status === 'fulfilled' ? 
        (enrolledCoursesRes.value.data.success ? enrolledCoursesRes.value.data.courses : 
         Array.isArray(enrolledCoursesRes.value.data) ? enrolledCoursesRes.value.data : []) : [];
      
      // Process all available courses for recommendations (exclude enrolled ones)
      const allCourses = allCoursesRes.status === 'fulfilled' ? 
        (Array.isArray(allCoursesRes.value.data) ? allCoursesRes.value.data : []) : [];
      
      const enrolledCourseIds = enrolledCourses.map(course => course._id || course.id);
      const recommendedCourses = allCourses
        .filter(course => !enrolledCourseIds.includes(course._id || course.id))
        .slice(0, 6)
        .map(course => ({
          id: course._id || course.id,
          title: course.title || course.name || 'Untitled Course',
          difficulty: course.difficulty || 'Beginner',
          duration: course.duration || 'Not specified',
          rewardTokens: course.rewardTokens || course.tokens || 0
        }));

      // Process active courses with progress and status
      const activeCourses = enrolledCourses.map(course => ({
        id: course._id || course.id,
        name: course.title || course.name || 'Untitled Course',
        mentor: course.mentorName || course.mentor?.name || 'Unknown Mentor',
        progress: course.progress || 0,
        status: course.status || (course.completed ? 'Completed' : 'In Progress'),
        thumbnail: course.thumbnail,
        duration: course.duration,
        level: course.level
      }));

      // Process credentials
      const credentials = credentialsRes.status === 'fulfilled' ? 
        (Array.isArray(credentialsRes.value.data) ? credentialsRes.value.data : []) : [];
      
      const recentCredentials = credentials
        .slice(0, 3)
        .map(cred => ({
          id: cred._id || cred.id,
          skillName: cred.skillName || cred.skill || cred.title || 'Unknown Skill',
          issueDate: cred.issueDate || cred.createdAt ? 
            new Date(cred.issueDate || cred.createdAt).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0]
        }));

      // Process token activities
      const tokenActivities = tokenActivitiesRes.status === 'fulfilled' ? 
        (Array.isArray(tokenActivitiesRes.value.data) ? tokenActivitiesRes.value.data : []) : [];
      
      const recentTokenActivities = tokenActivities
        .slice(0, 3)
        .map(activity => ({
          id: activity._id || activity.id,
          reason: activity.reason || activity.description || 'Token reward',
          amount: activity.amount || activity.tokens || 0,
          date: activity.date || activity.createdAt ? 
            new Date(activity.date || activity.createdAt).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0]
        }));

      // Process notifications
      const notifications = notificationsRes.status === 'fulfilled' ? 
        (Array.isArray(notificationsRes.value.data) ? notificationsRes.value.data : []) : [];
      
      const recentNotifications = notifications.map(notif => ({
        id: notif._id || notif.id,
        type: notif.type || 'general',
        title: notif.title || 'Notification',
        message: notif.message || notif.content || '',
        time: notif.time || (notif.createdAt ? 
          getRelativeTime(new Date(notif.createdAt)) : 
          'Recently')
      }));

      // Calculate stats
      const completedCourses = activeCourses.filter(course => 
        course.status === 'Completed' || course.progress === 100
      ).length;

      const learnerData = {
        name: userName,
        stats: {
          enrolledCourses: enrolledCourses.length,
          completedCourses: completedCourses,
          credentialsEarned: credentials.length,
          tokenBalance: tokenBalance
        },
        activeCourses: activeCourses,
        recommendedCourses: recommendedCourses,
        recentCredentials: recentCredentials,
        tokenActivities: recentTokenActivities,
        notifications: recentNotifications
      };

      setLearnerData(learnerData);
    } catch (error) {
      console.error("Error fetching learner data:", error);
      // Set empty data structure on error
      setLearnerData({
        name: localStorage.getItem('userName') || "Learner",
        stats: { 
          enrolledCourses: 0, 
          completedCourses: 0, 
          credentialsEarned: 0, 
          tokenBalance: localStorage.getItem('tokencoin') || 0 
        },
        activeCourses: [],
        recommendedCourses: [],
        recentCredentials: [],
        tokenActivities: [],
        notifications: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
  };

  const handleContinueLearning = (courseId) => {
    // Navigate to learner course view with progress tracking
    navigate(`/learner/course/${courseId}`);
  };

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleViewCredential = (credentialId) => {
    navigate(`/credential/${credentialId}`);
  };

  const handleShareCredential = (credentialId) => {
    // Implement share functionality
    alert(`Share credential ${credentialId}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <Container>
          <EmptyState>Loading your dashboard...</EmptyState>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        {/* Header / Welcome Section */}
        <HeaderSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WelcomeTitle>Welcome back, {learnerData.name}! 👋</WelcomeTitle>
          <RoleBadge>🎓 Role: Learner</RoleBadge>
          <Subtitle>Learn → Validate → Earn Credentials</Subtitle>
        </HeaderSection>

        {/* Udemy-style Learning Hub Quick Actions */}
        <UdemyStyleQuickActions />

        {/* Learning Summary (Dashboard Stats) */}
        <StatsGrid>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <StatLabel>Enrolled Courses</StatLabel>
            <StatValue>{learnerData.stats.enrolledCourses}</StatValue>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StatLabel>Completed Courses</StatLabel>
            <StatValue>{learnerData.stats.completedCourses}</StatValue>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <StatLabel>Credentials Earned</StatLabel>
            <StatValue>{learnerData.stats.credentialsEarned}</StatValue>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <StatLabel>Token Balance</StatLabel>
            <StatValue>{learnerData.stats.tokenBalance}</StatValue>
          </StatCard>
        </StatsGrid>

        {/* Active Learning Section */}
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SectionTitle>📚 Active Learning</SectionTitle>
          {learnerData.activeCourses.length > 0 ? (
            <CourseGrid>
              {learnerData.activeCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <StatusBadge status={course.status}>{course.status}</StatusBadge>
                  <CourseTitle>{course.name}</CourseTitle>
                  <CourseMentor>👨‍🏫 Mentor: {course.mentor}</CourseMentor>
                  <ProgressBarContainer>
                    <ProgressBar progress={course.progress || 0} />
                  </ProgressBarContainer>
                  <CourseInfo>
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </CourseInfo>
                  <Button onClick={() => handleContinueLearning(course.id)}>
                    Continue Learning
                  </Button>
                </CourseCard>
              ))}
            </CourseGrid>
          ) : (
            <EmptyState>No active courses. Start learning today!</EmptyState>
          )}
        </Section>

        {/* Recommended Courses Section */}
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <SectionTitle>💡 Recommended Courses</SectionTitle>
          {learnerData.recommendedCourses.length > 0 ? (
            <CourseGrid>
              {learnerData.recommendedCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <CourseTitle>{course.title}</CourseTitle>
                  <div style={{ marginBottom: '1rem' }}>
                    <DifficultyBadge level={course.difficulty}>
                      {course.difficulty}
                    </DifficultyBadge>
                  </div>
                  <CourseInfo>
                    <span>⏱️ Duration</span>
                    <span>{course.duration}</span>
                  </CourseInfo>
                  <CourseInfo>
                    <span>🪙 Reward</span>
                    <span>{course.rewardTokens} tokens</span>
                  </CourseInfo>
                  <Button onClick={() => handleViewCourse(course.id)}>
                    View Course
                  </Button>
                </CourseCard>
              ))}
            </CourseGrid>
          ) : (
            <EmptyState>No recommended courses available.</EmptyState>
          )}
        </Section>

        {/* Credentials Preview Section */}
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <SectionTitle>🏆 Recent Credentials</SectionTitle>
          {learnerData.recentCredentials.length > 0 ? (
            learnerData.recentCredentials.map((credential, index) => (
              <CredentialCard
                key={credential.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CredentialTitle>{credential.skillName}</CredentialTitle>
                <CredentialDate>📅 Issued on {credential.issueDate}</CredentialDate>
                <CredentialButtons>
                  <SmallButton onClick={() => handleViewCredential(credential.id)}>
                    View Credential
                  </SmallButton>
                  <SmallButton secondary onClick={() => handleShareCredential(credential.id)}>
                    Share / Verify
                  </SmallButton>
                </CredentialButtons>
              </CredentialCard>
            ))
          ) : (
            <EmptyState>No credentials earned yet. Complete courses to earn credentials!</EmptyState>
          )}
        </Section>

        {/* Token Snapshot Section */}
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <SectionTitle>🪙 Token Snapshot</SectionTitle>
          <StatCard style={{ marginBottom: '1.5rem' }}>
            <StatLabel>Total Tokens Earned</StatLabel>
            <StatValue>{learnerData.stats.tokenBalance}</StatValue>
          </StatCard>
          {learnerData.tokenActivities.length > 0 ? (
            learnerData.tokenActivities.map((activity, index) => (
              <TokenActivity key={activity.id}>
                <TokenInfo>
                  <TokenReason>{activity.reason}</TokenReason>
                  <TokenDate>{activity.date}</TokenDate>
                </TokenInfo>
                <TokenAmount>+{activity.amount}</TokenAmount>
              </TokenActivity>
            ))
          ) : (
            <EmptyState>No token activity yet.</EmptyState>
          )}
          <InfoText>
            ℹ️ Tokens are earned after mentor validation and course completion
          </InfoText>
        </Section>

      
      </Container>
    </PageContainer>
  );
};

export default LearnerHome;
