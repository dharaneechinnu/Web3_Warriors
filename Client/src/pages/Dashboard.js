import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [userRole] = useState(localStorage.getItem('userRole') || 'user');
  const location = useLocation();
  const initialTab = location.state?.tab || 'learner';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [courses, setCourses] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [editForm, setEditForm] = useState({
    name: '',
    mobileNo: '',
    UserWalletAddress: '',
    skills: [],
    gender: '',
    dob: ''
  });
  
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    image: null,
    thumbnail: null,
    video: null
  });
  
  const userId = localStorage.getItem('userId');
  
  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  // Update activeTab when route state changes (e.g., navigation from Navbar)
  useEffect(() => {
    const tabFromState = location.state?.tab;
    if (tabFromState && tabFromState !== activeTab) {
      setActiveTab(tabFromState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      switch(activeTab) {
        case 'learner':
          const coursesRes = await api.get('/courses/getall', { headers });
          setCourses(coursesRes.data);
          break;
        case 'profile':
          const profileRes = await api.get(`/User/${userId}`);
          setUserProfile(profileRes.data);
          setEditForm({
            name: profileRes.data.name,
            email: profileRes.data.email,
            skills: profileRes.data.skills || []
          });
          break;
        case 'mentor':
          const mentorCoursesRes = await api.get(`/courses/mentor/${userId}`, { headers });
          setCourses(mentorCoursesRes.data.courses);
          break;
        case 'enrolled':
          const enrolledRes = await api.get(`/courses/enrolled/${userId}`, { headers });
          setEnrolledCourses(Array.isArray(enrolledRes.data) ? enrolledRes.data : []);
          break;
        case 'mentorship':
          const mentorsRes = await api.get('/mentorship/getallmentor');
          setMentors(Array.isArray(mentorsRes.data.mentorship) ? mentorsRes.data.mentorship : []);
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = async (courseId) => {
    try {
      await api.post('/courses/enroll', {
        learnerId: userId,
        courseId: courseId
      });

      setSelectedCourse(courseId);
    } catch (err) {
      setError('Failed to enroll in course. Please try again.');
    }
  };

  const handleCourseComplete = async (courseId) => {
    try {
      const response = await api.post("/courses/complete", {
        learnerId: userId,
        courseId: courseId
      });
      
      if(response.status === 200){
        alert("Course completed successfully!");
      } else if(response.status === 400){
        alert(response.message);
      }
      
      setSelectedCourse(null);
      fetchInitialData();
    } catch (error) {
      setError('Failed to mark course as complete. Please try again.');
    }
  };

  const handleCourseUpload = async (e) => {
    e.preventDefault();
    try {
      // Validate mentor details
      if (!user || user.role !== 'mentor') {
        setError('Only mentors can upload courses');
        return;
      }

      // Validate form data
      if (!courseForm.title || !courseForm.description || !courseForm.category) {
        setError('Please fill in all required fields');
        return;
      }

      const formData = new FormData();
      
      // Course details
      formData.append('title', courseForm.title);
      formData.append('description', courseForm.description);
      formData.append('price', courseForm.price || '0');
      formData.append('duration', courseForm.duration || '1 hour');
      formData.append('level', courseForm.level);
      formData.append('category', courseForm.category);
      
      // Mentor details
      formData.append('mentorId', user._id);
      formData.append('mentorName', user.name);
      formData.append('mentorEmail', user.email);
      
      // Files
      if (courseForm.image) {
        formData.append('image', courseForm.image);
      }
      if (courseForm.thumbnail) {
        formData.append('thumbnail', courseForm.thumbnail);
      }
      if (courseForm.video) {
        formData.append('video', courseForm.video);
      }

      const response = await api.post('/courses/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200 || response.status === 201) {
        // Reset form
        setCourseForm({
          title: '',
          description: '',
          price: '',
          duration: '',
          level: 'beginner',
          category: '',
          image: null,
          thumbnail: null,
          video: null
        });
        
        // Clear file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => input.value = '');
        
        setError(null);
        alert('Course uploaded successfully!');
        fetchInitialData();
      }
    } catch (err) {
      console.error('Course upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload course. Please try again.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const users = localStorage.getItem("userId");
      
      const response = await api.put(`User/profile/${users}`, editForm);
  
      if (response.status === 200) {
        setIsEditing(false);
        fetchInitialData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Animated Background - Similar to landing page */}
      <div className="fixed inset-0 bg-grid-white/5 opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-cyan-900/20 via-fuchsia-900/20 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Dashboard Content - Can be expanded based on needs */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
            Dashboard
          </h2>
          <p className="text-gray-300">
            Welcome to your dashboard. Use the navigation menu to access different features.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;