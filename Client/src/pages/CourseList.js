import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import EnrollmentPopup from '@/components/ui/EnrollmentPopup';
import api from '../services/api';

const CourseList = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showEnrollmentPopup, setShowEnrollmentPopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  const categories = [
    'Programming', 'Web Development', 'Mobile Development', 'Data Science',
    'Machine Learning', 'Artificial Intelligence', 'Blockchain', 'Cybersecurity',
    'Cloud Computing', 'DevOps', 'UI/UX Design', 'Digital Marketing', 'Business'
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchCourses();
    if (isAuthenticated && user) {
      fetchEnrolledCourses();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedCategory, selectedLevel]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/getall');
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await api.get(`/courses/enrolled/${user._id}`);
      const enrolled = response.data.courses || response.data.enrolledCourses || [];
      setEnrolledCourses(enrolled.map(course => course._id));
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
      // Don't show error for this, just continue without enrollment data
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.mentorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Filter by level
    if (selectedLevel) {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    setFilteredCourses(filtered);
  };

  const handleCourseClick = (course) => {
    // Navigate to course details or enrollment page
    navigate(`/course/${course._id}`, { state: { course } });
  };

  const handleEnrollClick = async (e, course) => {
    e.stopPropagation(); // Prevent course click
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if already enrolled
    if (enrolledCourses.includes(course._id)) {
      alert('You are already enrolled in this course!');
      return;
    }

    // Show enrollment popup
    setSelectedCourse(course);
    setShowEnrollmentPopup(true);
  };

  const getId = (val) => {
    if (!val && val !== 0) return null;
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') return String(val._id || val.id || '');
    return null;
  };

  const isCourseMentor = (course) => {
    const mentorIdVal = getId(course.mentor) || getId(course.mentorId) || getId(course.instructor) || getId(course.owner);
    const userIdVal = getId(user?._id) || getId(user?.id) || getId(localStorage.getItem('userId'));
    return Boolean(mentorIdVal && userIdVal && String(mentorIdVal) === String(userIdVal));
  };

  const handleEnrollSuccess = (enrolledCourse) => {
    // Add course to enrolled list using data passed from popup
    const courseId = enrolledCourse?._id || selectedCourse?._id;
    const courseTitle = enrolledCourse?.title || selectedCourse?.title;
    setEnrolledCourses(prev => [...prev, courseId]);
    setShowEnrollmentPopup(false);
    setSelectedCourse(null);
    
    // Show success message
    alert(`Successfully enrolled in ${courseTitle}!`);
  };

  const handleEnrollmentClose = () => {
    setShowEnrollmentPopup(false);
    setSelectedCourse(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-white/5 opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-cyan-900/20 via-fuchsia-900/20 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
            Discover Courses
          </h1>
          <p className="text-gray-300 text-lg">
            Explore our extensive library of courses and start your learning journey
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700"
        >
          {/* Main Search Bar - Center */}
          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                placeholder="Search for courses, instructors, or topics..."
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level} className="capitalize">{level}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-center text-gray-400">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Course Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course, index) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleCourseClick(course)}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 hover:border-fuchsia-500/50 transition-all duration-300 cursor-pointer hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-fuchsia-500/20"
              >
                {/* Course Image */}
                {(course.thumbnail || course.image) && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={`${api.defaults.baseURL}${(course.thumbnail || course.image)?.replace(/\\/g, '/')}`}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        course.level === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        course.level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Course Title */}
                  <h3 className="text-xl font-bold mb-2 text-white line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Mentor Name */}
                  {course.mentorName && (
                    <p className="text-sm text-gray-400 mb-2">
                      by {course.mentorName}
                    </p>
                  )}

                  {/* Course Description */}
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course Details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.category && (
                      <span className="px-2 py-1 bg-slate-700/50 text-xs rounded-full text-gray-300">
                        {course.category}
                      </span>
                    )}
                    {course.duration && (
                      <span className="px-2 py-1 bg-slate-700/50 text-xs rounded-full text-gray-300">
                        {course.duration}
                      </span>
                    )}
                  </div>

                  {/* Price and Enroll Button */}
                  <div className="flex items-center justify-between">
                    <div>
                      {course.price > 0 ? (
                        <span className="text-2xl font-bold text-green-400">
                          ${course.price}
                        </span>
                      ) : (
                        <span className="text-xl font-bold text-fuchsia-400">
                          Free
                        </span>
                      )}
                    </div>
                    
                    {enrolledCourses.includes(course._id) ? (
                      <div className="px-4 py-2 bg-green-500/20 border border-green-500 text-green-400 font-semibold rounded-lg">
                        ✅ Enrolled
                      </div>
                    ) : isCourseMentor(course) ? (
                      <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500 text-yellow-300 font-semibold rounded-lg">
                        Instructor
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleEnrollClick(e, course)}
                        className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-fuchsia-500/25"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-300">No courses found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || selectedCategory || selectedLevel 
                  ? 'Try adjusting your search criteria or filters'
                  : 'No courses available at the moment'}
              </p>
              {(searchTerm || selectedCategory || selectedLevel) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-lg transition-all duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Enrollment Popup */}
      <EnrollmentPopup
        isOpen={showEnrollmentPopup}
        onClose={handleEnrollmentClose}
        course={selectedCourse}
        learnerId={user?._id}
        onEnrollSuccess={handleEnrollSuccess}
      />
    </div>
  );
};

export default CourseList;