import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaPlay, 
  FaStar, 
  FaClock, 
  FaUsers, 
  FaBookmark,
  FaGraduationCap,
  FaTags,
  FaCheckCircle
} from 'react-icons/fa';
import api from '../../services/api';

const DashboardContainer = styled.div`
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

const SearchSection = styled.div`
  max-width: 800px;
  margin: 0 auto 3rem auto;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SearchBar = styled.div`
  position: relative;
  flex: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
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

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.25rem;
`;

const FilterButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.1)'};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.2)'};
    transform: translateY(-2px);
  }
`;

const FilterTags = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const FilterTag = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.1)'};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.2)'};
    transform: translateY(-1px);
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const CourseCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
    border-color: rgba(124, 58, 237, 0.4);
  }
`;

const CourseImage = styled.div`
  height: 200px;
  background: ${props => props.image ? `url(${props.image})` : 'linear-gradient(135deg, #7c3aed, #6366f1)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const PlayOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;

  ${CourseCard}:hover & {
    opacity: 1;
  }
`;

const PlayButton = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(124, 58, 237, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const CourseContent = styled.div`
  padding: 1.5rem;
`;

const CourseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CourseTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  flex: 1;
`;

const BookmarkButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.bookmarked ? '#f59e0b' : 'rgba(255,255,255,0.5)'};
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.3s ease;

  &:hover {
    color: #f59e0b;
    transform: scale(1.1);
  }
`;

const CourseDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CourseMetadata = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const SkillLevel = styled.span`
  background: ${props => {
    switch (props.level) {
      case 'beginner': return 'linear-gradient(135deg, #22c55e, #16a34a)';
      case 'intermediate': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'advanced': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'expert': return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
      default: return 'rgba(255,255,255,0.1)';
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const CompletionBadge = styled.div`
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
`;

const CourseActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  gap: 1rem;
`;

const ContinueButton = styled.button`
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
  }
`;

const ProgressSection = styled.div`
  width: 100%;
  margin-bottom: 1rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProgressText = styled.span`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
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
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const EnrollButton = styled.button`
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
  }
`;

const Price = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #22c55e;
`;

const LoadingCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.2);
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);

  h3 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
`;

const LearnerCourseDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [bookmarkedCourses, setBookmarkedCourses] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const skillLevels = ['all', 'beginner', 'intermediate', 'advanced', 'expert'];

  useEffect(() => {
    fetchEnrolledCourses();
    fetchBookmarks();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/courses/enrolled/${userId}`);
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await api.get('/udemy-courses/bookmarks');
      if (response.data.success) {
        setBookmarkedCourses(new Set(response.data.bookmarks.map(b => b.courseId)));
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const toggleBookmark = async (courseId, event) => {
    event.stopPropagation();
    try {
      const isBookmarked = bookmarkedCourses.has(courseId);
      if (isBookmarked) {
        await api.delete(`/udemy-courses/bookmark/${courseId}`);
        setBookmarkedCourses(prev => {
          const newSet = new Set(prev);
          newSet.delete(courseId);
          return newSet;
        });
      } else {
        await api.post(`/udemy-courses/bookmark/${courseId}`);
        setBookmarkedCourses(prev => new Set([...prev, courseId]));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const enrollInCourse = async (courseId, event) => {
    event.stopPropagation();
    try {
      const response = await api.post(`/udemy-courses/enroll/${courseId}`);
      if (response.data.success) {
        navigate(`/learner/course/${courseId}`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      if (error.response?.status === 409) {
        // Already enrolled, redirect to course
        navigate(`/learner/course/${courseId}`);
      }
    }
  };

  const continueLearning = (courseId, event) => {
    if (event) event.stopPropagation();
    navigate(`/learner/course/${courseId}`);
  };

  const getId = (val) => {
    if (!val && val !== 0) return null;
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') return String(val._id || val.id || '');
    return null;
  };

  const isCourseMentor = (course) => {
    const mentorIdVal = getId(course.mentor) || getId(course.mentorId) || getId(course.instructor) || getId(course.owner);
    const userIdVal = getId(localStorage.getItem('userId')) || null;
    return Boolean(mentorIdVal && userIdVal && String(mentorIdVal) === String(userIdVal));
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = skillFilter === '' || skillFilter === 'all' || course.skillLevel === skillFilter;
    return matchesSearch && matchesSkill;
  });

  return (
    <DashboardContainer>
      <Header>
        <Title>My Learning</Title>
        <Subtitle>Continue your learning journey</Subtitle>
      </Header>

      <SearchSection>
        <SearchContainer>
          <SearchBar>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search for courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>
          <FilterButton
            active={showFilters}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filters
          </FilterButton>
        </SearchContainer>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FilterTags>
                {skillLevels.map(level => (
                  <FilterTag
                    key={level}
                    active={skillFilter === level}
                    onClick={() => setSkillFilter(skillFilter === level ? '' : level)}
                  >
                    {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                  </FilterTag>
                ))}
              </FilterTags>
            </motion.div>
          )}
        </AnimatePresence>
      </SearchSection>

      {loading ? (
        <CoursesGrid>
          {[...Array(6)].map((_, index) => (
            <LoadingCard key={index}>
              <div>Loading courses...</div>
            </LoadingCard>
          ))}
        </CoursesGrid>
      ) : filteredCourses.length === 0 ? (
        <EmptyState>
          <FaGraduationCap size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No enrolled courses</h3>
          <p>Start your learning journey by browsing our course catalog.</p>
        </EmptyState>
      ) : (
        <CoursesGrid>
          <AnimatePresence>
            {filteredCourses.map((course, index) => (
              <CourseCard
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => navigate(`/learner/course/${course._id}`)}
              >
                <CourseImage image={course.thumbnail}>
                  <PlayOverlay>
                    <PlayButton>
                      <FaPlay />
                    </PlayButton>
                  </PlayOverlay>
                </CourseImage>

                <CourseContent>
                  <CourseHeader>
                    <CourseTitle>{course.title}</CourseTitle>
                    <BookmarkButton
                      bookmarked={bookmarkedCourses.has(course._id)}
                      onClick={(e) => toggleBookmark(course._id, e)}
                    >
                      <FaBookmark />
                    </BookmarkButton>
                  </CourseHeader>

                  <CourseDescription>{course.description}</CourseDescription>

                  <CourseMetadata>
                    <MetadataItem>
                      <FaClock />
                      {course.totalDuration || 'Self-paced'}
                    </MetadataItem>
                    {course.lastAccessed && (
                      <MetadataItem>
                        <FaPlay />
                        Last accessed: {new Date(course.lastAccessed).toLocaleDateString()}
                      </MetadataItem>
                    )}
                    {course.averageRating && (
                      <MetadataItem>
                        <FaStar style={{ color: '#f59e0b' }} />
                        {course.averageRating.toFixed(1)}
                      </MetadataItem>
                    )}
                  </CourseMetadata>

                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                    <SkillLevel level={course.skillLevel}>
                      {course.skillLevel}
                    </SkillLevel>
                    {/* Completion badge removed - progress tracking disabled */}
                  </div>

                  <ProgressSection>
                    <ProgressHeader>
                      <ProgressText>Status</ProgressText>
                      <ProgressText>Enrolled</ProgressText>
                    </ProgressHeader>
                      <ProgressBarContainer>
                        {/* Show learner's course progress percentage */}
                        <ProgressBar progress={course.overallProgress || 0} />
                      </ProgressBarContainer>
                  </ProgressSection>

                  <CourseActions>
                    <ContinueButton onClick={(e) => continueLearning(course._id, e)}>
                      {(course.overallProgress || 0) > 0 ? `Continue (${course.overallProgress}% )` : 'Start Course'}
                    </ContinueButton>
                  </CourseActions>
                </CourseContent>
              </CourseCard>
            ))}
          </AnimatePresence>
        </CoursesGrid>
      )}
    </DashboardContainer>
  );
};

export default LearnerCourseDashboard;