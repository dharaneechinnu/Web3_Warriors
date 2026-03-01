import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import api from "../../services/api";

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
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #06b6d4, #d946ef, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
`;

const CreateButton = styled(motion.button)`
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #f97316, #06b6d4);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4);
  }
`;

// Stats
const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(249, 115, 22, 0.3);
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  background: ${props => props.gradient || 'linear-gradient(to right, #f97316, #06b6d4)'};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Filters
const FilterRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterTab = styled.button`
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  border: 1px solid ${props => props.active ? 'rgba(249, 115, 22, 0.5)' : 'rgba(124, 58, 237, 0.2)'};
  background: ${props => props.active ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(6, 182, 212, 0.2))' : 'rgba(30, 41, 59, 0.4)'};
  color: ${props => props.active ? '#f97316' : 'rgba(255, 255, 255, 0.6)'};
  font-weight: ${props => props.active ? '600' : '400'};
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(249, 115, 22, 0.4);
    color: white;
  }
`;

// Course grid
const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CourseCard = styled(motion.div)`
  background: rgba(17, 17, 27, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.2);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(249, 115, 22, 0.5);
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(249, 115, 22, 0.2);
  }
`;

const CourseThumbnail = styled.div`
  width: 100%;
  height: 180px;
  background: ${props => props.src ? `url(${props.src}) center/cover no-repeat` : 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(249, 115, 22, 0.3))'};
  position: relative;
`;

const CourseSourceBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${props => props.source === 'udemy' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(249, 115, 22, 0.3)'};
  color: ${props => props.source === 'udemy' ? '#06b6d4' : '#f97316'};
  border: 1px solid ${props => props.source === 'udemy' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(249, 115, 22, 0.4)'};
  backdrop-filter: blur(10px);
`;

const StatusBadge = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${props => {
    if (props.status === 'published') return 'rgba(34, 197, 94, 0.3)';
    if (props.status === 'draft') return 'rgba(234, 179, 8, 0.3)';
    return 'rgba(148, 163, 184, 0.3)';
  }};
  color: ${props => {
    if (props.status === 'published') return '#22c55e';
    if (props.status === 'draft') return '#eab308';
    return '#94a3b8';
  }};
  border: 1px solid ${props => {
    if (props.status === 'published') return 'rgba(34, 197, 94, 0.4)';
    if (props.status === 'draft') return 'rgba(234, 179, 8, 0.4)';
    return 'rgba(148, 163, 184, 0.4)';
  }};
  backdrop-filter: blur(10px);
`;

const CourseBody = styled.div`
  padding: 1.5rem;
`;

const CourseTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CourseDescription = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
`;

const CourseMetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
`;

const DifficultyBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    if (props.level === 'beginner') return 'rgba(34, 197, 94, 0.2)';
    if (props.level === 'intermediate') return 'rgba(234, 179, 8, 0.2)';
    return 'rgba(239, 68, 68, 0.2)';
  }};
  color: ${props => {
    if (props.level === 'beginner') return '#22c55e';
    if (props.level === 'intermediate') return '#eab308';
    return '#ef4444';
  }};
  border: 1px solid ${props => {
    if (props.level === 'beginner') return 'rgba(34, 197, 94, 0.3)';
    if (props.level === 'intermediate') return 'rgba(234, 179, 8, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  }};
  text-transform: capitalize;
`;

const CourseStatsRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(124, 58, 237, 0.1);
`;

const CourseStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);

  span.value {
    color: white;
    font-weight: 600;
  }
`;

const CourseActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.6rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ViewButton = styled(ActionButton)`
  background: linear-gradient(135deg, #f97316, #06b6d4);
  color: white;

  &:hover {
    box-shadow: 0 5px 15px rgba(249, 115, 22, 0.4);
  }
`;

const EditButton = styled(ActionButton)`
  background: rgba(124, 58, 237, 0.15);
  color: #d946ef;
  border: 1px solid rgba(124, 58, 237, 0.3);

  &:hover {
    background: rgba(124, 58, 237, 0.25);
    box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
  }
`;

// Empty state
const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1.5rem;
`;

// Loading
const LoadingContainer = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(124, 58, 237, 0.2);
  border-top: 3px solid #d946ef;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ============= ANIMATION VARIANTS =============

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// ============= MAIN COMPONENT =============

const MentorMyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const userId = localStorage.getItem("userId");
  const baseUrl = "http://localhost:3500";

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/mentor/${userId}`);
      const data = res.data.courses || res.data || [];
      setCourses(data);
    } catch (err) {
      console.error("Error fetching mentor courses:", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCourses = () => {
    if (filter === "all") return courses;
    if (filter === "published") return courses.filter(c => c.status === "published" || c.isPublished);
    if (filter === "draft") return courses.filter(c => c.status === "draft" || !c.isPublished);
    return courses;
  };

  const filteredCourses = getFilteredCourses();

  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrolledCount || c.enrolledLearnersCount || 0), 0);
  const publishedCount = courses.filter(c => c.status === "published" || c.isPublished).length;
  const draftCount = courses.filter(c => c.status === "draft" || (!c.isPublished && c.status !== "published")).length;

  const getThumbnailUrl = (course) => {
    const thumb = course.thumbnail || course.image;
    if (!thumb) return null;
    if (thumb.startsWith("http")) return thumb;
    return `${baseUrl}${thumb.startsWith("/") ? "" : "/"}${thumb}`;
  };

  if (loading) {
    return (
      <PageContainer>
        <Container>
          <LoadingContainer>
            <Spinner />
            <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading your courses...</p>
          </LoadingContainer>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* Header */}
          <HeaderSection variants={itemVariants}>
            <div>
              <PageTitle>My Courses</PageTitle>
              <Subtitle>Manage all your created and published courses</Subtitle>
            </div>
            <CreateButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/course-upload")}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
              Create New Course
            </CreateButton>
          </HeaderSection>

          {/* Stats */}
          <StatsRow>
            <StatCard variants={itemVariants}>
              <StatValue gradient="linear-gradient(to right, #06b6d4, #22d3ee)">{courses.length}</StatValue>
              <StatLabel>Total Courses</StatLabel>
            </StatCard>
            <StatCard variants={itemVariants}>
              <StatValue gradient="linear-gradient(to right, #22c55e, #10b981)">{publishedCount}</StatValue>
              <StatLabel>Published</StatLabel>
            </StatCard>
            <StatCard variants={itemVariants}>
              <StatValue gradient="linear-gradient(to right, #eab308, #f59e0b)">{draftCount}</StatValue>
              <StatLabel>Drafts</StatLabel>
            </StatCard>
            <StatCard variants={itemVariants}>
              <StatValue gradient="linear-gradient(to right, #d946ef, #a855f7)">{totalEnrolled}</StatValue>
              <StatLabel>Total Enrolled</StatLabel>
            </StatCard>
          </StatsRow>

          {/* Filters */}
          <FilterRow>
            {[
              { key: "all", label: `All (${courses.length})` },
              { key: "published", label: `Published (${publishedCount})` },
              { key: "draft", label: `Drafts (${draftCount})` },
            ].map(tab => (
              <FilterTab
                key={tab.key}
                active={filter === tab.key}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </FilterTab>
            ))}
          </FilterRow>

          {/* Course Grid */}
          {filteredCourses.length > 0 ? (
            <CourseGrid>
              {filteredCourses.map((course, index) => (
                <CourseCard
                  key={course._id}
                  variants={itemVariants}
                >
                  <CourseThumbnail src={getThumbnailUrl(course)}>
                    <StatusBadge status={course.status || (course.isPublished ? "published" : "draft")}>
                      {course.status === "published" || course.isPublished ? "Published" : "Draft"}
                    </StatusBadge>
                    {course.source && (
                      <CourseSourceBadge source={course.source}>
                        {course.source === "udemy" ? "Advanced" : "Standard"}
                      </CourseSourceBadge>
                    )}
                  </CourseThumbnail>

                  <CourseBody>
                    <CourseTitle>{course.title}</CourseTitle>
                    {course.description && (
                      <CourseDescription>{course.description}</CourseDescription>
                    )}

                    <CourseMetaRow>
                      <DifficultyBadge level={(course.level || course.skillLevel || "beginner").toLowerCase()}>
                        {course.level || course.skillLevel || "Beginner"}
                      </DifficultyBadge>
                      {course.category && (
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                          {course.category}
                        </span>
                      )}
                    </CourseMetaRow>

                    <CourseStatsRow>
                      <CourseStat>
                        👥 <span className="value">{course.enrolledCount || course.enrolledLearnersCount || 0}</span> students
                      </CourseStat>
                      {course.totalSections !== undefined && (
                        <CourseStat>
                          📁 <span className="value">{course.totalSections}</span> sections
                        </CourseStat>
                      )}
                      {course.totalLectures !== undefined && (
                        <CourseStat>
                          🎬 <span className="value">{course.totalLectures}</span> lectures
                        </CourseStat>
                      )}
                    </CourseStatsRow>

                    <CourseActions>
                      <ViewButton onClick={() => navigate(`/course/${course._id}`)}>
                        View Course
                      </ViewButton>
                      <EditButton onClick={() => navigate(`/course-upload?edit=${course._id}`)}>
                        Edit
                      </EditButton>
                    </CourseActions>
                  </CourseBody>
                </CourseCard>
              ))}
            </CourseGrid>
          ) : (
            <EmptyState>
              <EmptyIcon>📚</EmptyIcon>
              <EmptyTitle>
                {filter === "all" ? "No courses yet" : `No ${filter} courses`}
              </EmptyTitle>
              <EmptyText>
                {filter === "all"
                  ? "Create your first course and start teaching!"
                  : "Try switching to a different filter."}
              </EmptyText>
              {filter === "all" && (
                <CreateButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/course-upload")}
                  style={{ margin: "0 auto" }}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                  Create Your First Course
                </CreateButton>
              )}
            </EmptyState>
          )}

        </motion.div>
      </Container>
    </PageContainer>
  );
};

export default MentorMyCourses;
