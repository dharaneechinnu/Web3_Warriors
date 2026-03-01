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

  @media (max-width: 768px) {
    padding: 1rem;
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
  background: linear-gradient(135deg, #f97316, #06b6d4);
  color: white;
  border-radius: 2rem;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 1rem 0;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
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
    box-shadow: 0 15px 40px rgba(249, 115, 22, 0.3);
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
  background: linear-gradient(to right, #f97316, #06b6d4, #d946ef);
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
    background: linear-gradient(to bottom, #f97316, #06b6d4);
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
    border-color: rgba(249, 115, 22, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(249, 115, 22, 0.2);
  }
`;

const CourseTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
`;

const CourseInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
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
  margin-bottom: 1rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)'};
  color: ${props => props.status === 'Active' ? '#22c55e' : '#94a3b8'};
  border: 1px solid ${props => props.status === 'Active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148, 163, 184, 0.3)'};
`;

const Button = styled.button`
  width: 100%;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #f97316, #06b6d4);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4);
  }
`;

const ReviewCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.15);
  margin-bottom: 1rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(249, 115, 22, 0.5);
    transform: translateX(5px);
  }
`;

const ReviewInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ReviewDetails = styled.div`
  flex: 1;
`;

const LearnerName = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.3rem;
`;

const CourseName = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.3rem;
`;

const SubmissionDate = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
`;

const ActivityCard = styled(motion.div)`
  background: rgba(30, 41, 59, 0.4);
  border-radius: 0.8rem;
  padding: 1.2rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${props => {
    if (props.type === 'approval') return '#22c55e';
    if (props.type === 'rejection') return '#ef4444';
    if (props.type === 'credential') return '#d946ef';
    return '#f97316';
  }};
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(5px);
    background: rgba(30, 41, 59, 0.6);
  }
`;

const ActivityTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.3rem;
`;

const ActivityMessage = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
`;

const ActivityTime = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const ReputationCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(124, 58, 237, 0.15);
  text-align: center;
`;

const ReputationScore = styled.div`
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(to right, #f97316, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
`;

const ReputationLabel = styled.p`
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
`;

const ReputationDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  text-align: center;
`;

const ReputationStat = styled.div`
  color: rgba(255, 255, 255, 0.8);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
`;

// ============= MAIN COMPONENT =============

const MentorHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mentorData, setMentorData] = useState({
    name: "Mentor",
    stats: {
      totalCourses: 0,
      activeLearners: 0,
      pendingReviews: 0,
      tokensEarned: 0
    },
    courses: [],
    pendingReviews: [],
    recentActivity: [],
    reputation: {
      score: 0,
      averageRating: 0,
      totalValidations: 0
    }
  });

  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName') || "Mentor";
      const tokenBalance = localStorage.getItem('tokencoin') || 0;

      if (!userId) {
        console.warn('No userId found in localStorage');
        setMentorData({
          name: userName,
          stats: { totalCourses: 0, activeLearners: 0, pendingReviews: 0, tokensEarned: tokenBalance },
          courses: [],
          pendingReviews: [],
          recentActivity: [],
          reputation: { score: 0, averageRating: 0, totalValidations: 0 }
        });
        return;
      }

      // Fetch data from actual APIs
      const [
        mentorCoursesRes,
        pendingReviewsRes,
        activityRes,
        reputationRes
      ] = await Promise.allSettled([
        api.get(`/courses/mentor/${userId}`).catch(() => ({ data: { courses: [] } })),
        api.get(`/reviews/pending/${userId}`).catch(() => ({ data: [] })),
        api.get(`/activity/mentor/${userId}`).catch(() => ({ data: [] })),
        api.get(`/mentor/reputation/${userId}`).catch(() => ({ data: { score: 0, averageRating: 0, totalValidations: 0 } }))
      ]);

      // Process mentor courses
      const courses = mentorCoursesRes.status === 'fulfilled' ? 
        (Array.isArray(mentorCoursesRes.value.data.courses) ? mentorCoursesRes.value.data.courses : []) : [];

      const processedCourses = courses.map(course => {
        const mentorIdVal = course.mentorId || course.mentor || course.mentor?._id || course.instructor || userId;
        return {
          id: course._id || course.id,
          name: course.title || course.name || 'Untitled Course',
          difficulty: course.difficulty || 'Beginner',
          enrolledLearners: course.enrolledCount || course.learners?.length || 0,
          status: course.status || 'Active',
          mentorId: mentorIdVal,
          isOwner: String(mentorIdVal) === String(userId)
        };
      });

      // Process pending reviews
      const pendingReviews = pendingReviewsRes.status === 'fulfilled' ? 
        (Array.isArray(pendingReviewsRes.value.data) ? pendingReviewsRes.value.data : []) : [];

      const processedReviews = pendingReviews.map(review => ({
        id: review._id || review.id,
        learnerName: review.learnerName || review.learner?.name || 'Unknown Learner',
        courseName: review.courseName || review.course?.title || 'Unknown Course',
        submissionDate: review.submissionDate || review.createdAt ? 
          new Date(review.submissionDate || review.createdAt).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        status: 'Pending Review'
      }));

      // Process recent activity
      const activity = activityRes.status === 'fulfilled' ? 
        (Array.isArray(activityRes.value.data) ? activityRes.value.data : []) : [];

      const processedActivity = activity.slice(0, 5).map(act => ({
        id: act._id || act.id,
        type: act.type || 'general',
        title: act.title || 'Activity',
        message: act.message || act.description || '',
        time: act.time || (act.createdAt ? getRelativeTime(new Date(act.createdAt)) : 'Recently')
      }));

      // Process reputation
      const reputation = reputationRes.status === 'fulfilled' ? reputationRes.value.data : 
        { score: 0, averageRating: 0, totalValidations: 0 };

      // Calculate stats
      const activeLearners = processedCourses.reduce((total, course) => total + course.enrolledLearners, 0);

      const mentorData = {
        name: userName,
        stats: {
          totalCourses: processedCourses.length,
          activeLearners: activeLearners,
          pendingReviews: processedReviews.length,
          tokensEarned: tokenBalance
        },
        courses: processedCourses,
        pendingReviews: processedReviews,
        recentActivity: processedActivity,
        reputation: {
          score: reputation.score || 0,
          averageRating: reputation.averageRating || 0,
          totalValidations: reputation.totalValidations || 0
        }
      };

      setMentorData(mentorData);
    } catch (error) {
      console.error("Error fetching mentor data:", error);
      // Set empty data structure on error
      setMentorData({
        name: localStorage.getItem('userName') || "Mentor",
        stats: { 
          totalCourses: 0, 
          activeLearners: 0, 
          pendingReviews: 0, 
          tokensEarned: localStorage.getItem('tokencoin') || 0 
        },
        courses: [],
        pendingReviews: [],
        recentActivity: [],
        reputation: { score: 0, averageRating: 0, totalValidations: 0 }
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

  const handleViewCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleReviewSubmission = (reviewId) => {
    navigate(`/review/${reviewId}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <Container>
          <EmptyState>Loading your mentor dashboard...</EmptyState>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <WelcomeTitle>Welcome, {mentorData.name}! 👨‍🏫</WelcomeTitle>
              <RoleBadge>🎯 Role: Mentor</RoleBadge>
              <Subtitle>Teach → Validate → Build Trust</Subtitle>
            </div>
            <motion.button
              onClick={() => navigate('/course-upload')}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-fuchsia-500/25 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
              Upload Course
            </motion.button>
          </div>
        </HeaderSection>

        {/* Udemy-style Course Management Quick Actions */}
        <UdemyStyleQuickActions />

        {/* Mentor Summary (Dashboard Stats) */}
        <StatsGrid>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <StatLabel>Total Courses Created</StatLabel>
            <StatValue>{mentorData.stats.totalCourses}</StatValue>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StatLabel>Active Learners</StatLabel>
            <StatValue>{mentorData.stats.activeLearners}</StatValue>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <StatLabel>Pending Reviews</StatLabel>
            <StatValue>{mentorData.stats.pendingReviews}</StatValue>
          </StatCard>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <StatLabel>Tokens Earned</StatLabel>
            <StatValue>{mentorData.stats.tokensEarned}</StatValue>
          </StatCard>
        </StatsGrid>

        {/* My Courses Section */}
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <SectionTitle>📚 My Courses</SectionTitle>
          {mentorData.courses.length > 0 ? (
            <CourseGrid>
              {mentorData.courses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <CourseTitle>{course.name}</CourseTitle>
                  <DifficultyBadge level={course.difficulty}>{course.difficulty}</DifficultyBadge>
                  <CourseInfo>
                    <span>👥 Enrolled</span>
                    <span>{course.enrolledLearners} learners</span>
                  </CourseInfo>
                  <CourseInfo>
                    <span>Status</span>
                    <StatusBadge status={course.status}>{course.status}</StatusBadge>
                  </CourseInfo>
                  {!course.isOwner && (
                    <Button onClick={() => handleViewCourse(course.id)}>
                      View Course
                    </Button>
                  )}
                </CourseCard>
              ))}
            </CourseGrid>
          ) : (
            <EmptyState>No courses created yet. Create your first course to start teaching!</EmptyState>
          )}
        </Section>

        {/* Pending Reviews Section */}
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <SectionTitle>⏳ Pending Reviews</SectionTitle>
          {mentorData.pendingReviews.length > 0 ? (
            mentorData.pendingReviews.map((review, index) => (
              <ReviewCard
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ReviewInfo>
                  <ReviewDetails>
                    <LearnerName>{review.learnerName}</LearnerName>
                    <CourseName>📖 Course: {review.courseName}</CourseName>
                    <SubmissionDate>📅 Submitted on {review.submissionDate}</SubmissionDate>
                  </ReviewDetails>
                  <StatusBadge status="Pending">Pending Review</StatusBadge>
                </ReviewInfo>
                <Button onClick={() => handleReviewSubmission(review.id)}>
                  Review Submission
                </Button>
              </ReviewCard>
            ))
          ) : (
            <EmptyState>No pending reviews. All caught up!</EmptyState>
          )}
        </Section>

        {/* Recent Activity Section */}
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <SectionTitle>📈 Recent Activity</SectionTitle>
          {mentorData.recentActivity.length > 0 ? (
            mentorData.recentActivity.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                type={activity.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ActivityTitle>{activity.title}</ActivityTitle>
                <ActivityMessage>{activity.message}</ActivityMessage>
                <ActivityTime>{activity.time}</ActivityTime>
              </ActivityCard>
            ))
          ) : (
            <EmptyState>No recent activity.</EmptyState>
          )}
        </Section>

        {/* Mentor Reputation Snapshot */}
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <SectionTitle>⭐ Mentor Reputation</SectionTitle>
          <ReputationCard>
            <ReputationScore>{mentorData.reputation.score.toFixed(1)}</ReputationScore>
            <ReputationLabel>Overall Reputation Score</ReputationLabel>
            <ReputationDetails>
              <ReputationStat>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f97316' }}>
                  {mentorData.reputation.averageRating.toFixed(1)}⭐
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Average Rating</div>
              </ReputationStat>
              <ReputationStat>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#06b6d4' }}>
                  {mentorData.reputation.totalValidations}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Validations Completed</div>
              </ReputationStat>
            </ReputationDetails>
          </ReputationCard>
        </Section>

        {/* ── Mentor Management Quick Links ── */}
        <Section>
          <SectionTitle>⚡ Mentor Tools</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={() => navigate('/mentor/sessions')}
              style={{
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '1rem 2rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 200px',
              }}
            >
              📅 Manage Sessions
            </button>
            <button
              onClick={() => navigate('/mentor/challenges')}
              style={{
                background: 'rgba(249, 115, 22, 0.2)',
                color: '#fdba74',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                borderRadius: '0.75rem',
                padding: '1rem 2rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 200px',
              }}
            >
              🏆 My Challenges
            </button>
            <button
              onClick={() => navigate('/mentor/submissions')}
              style={{
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#67e8f9',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '0.75rem',
                padding: '1rem 2rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 200px',
              }}
            >
              📋 Review Submissions
            </button>
            <button
              onClick={() => navigate('/mentor/profile')}
              style={{
                background: 'rgba(124, 58, 237, 0.2)',
                color: '#c4b5fd',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                borderRadius: '0.75rem',
                padding: '1rem 2rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 200px',
              }}
            >
              👤 My Profile
            </button>
          </div>
        </Section>
      </Container>
    </PageContainer>
  );
};

export default MentorHome;