import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [userRole] = useState(localStorage.getItem('userRole') || 'user');
  const [activeTab, setActiveTab] = useState('learner');
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
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('title', courseForm.title);
      formData.append('description', courseForm.description);
      formData.append('mentorId', userId);
      formData.append('image', courseForm.image);
      formData.append('thumbnail', courseForm.thumbnail);
      formData.append('video', courseForm.video);

      await api.post('/courses/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setCourseForm({
        title: '',
        description: '',
        image: null,
        thumbnail: null,
        video: null
      });
      
      fetchInitialData();
    } catch (err) {
      setError('Failed to upload course. Please try again.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
    
  
      if (!userId) {
        setError('User ID is missing.');
        return;
      }
  
  
      console.log("User ID in dashboard for profile update:", userId);
      
      const response = await api.put(`User/profile/${userId}`, editForm);
  
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-wrap justify-center space-x-2 md:space-x-4"
        >
          {['learner', 'mentor', 'mentorship', 'profile'].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 rounded-xl mb-2 transition-colors mt-[80px] ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-orange-500 text-white' 
                  : 'bg-white/5 backdrop-blur-lg text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-center mb-4 bg-red-900/20 p-3 rounded-lg border border-red-700"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-xl overflow-hidden border border-white/10"
        >
          <div className="bg-gradient-to-br from-cyan-900/30 via-fuchsia-900/30 to-orange-900/30 p-8">
            {activeTab === 'learner' && (
              <div>
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-500">
                  Available Courses
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const thumbnailPath = course.thumbnail ? `http://localhost:3500/uploads/images/${course.thumbnail.split('\\').pop()}` : '/fallback-image.jpg';
                    const videoPath = course.video ? `http://localhost:3500/uploads/videos/${course.video.split('\\').pop()}` : '';
                    
                    return (
                      <motion.div 
                        key={course._id} 
                        whileHover={{ y: -5 }}
                        className="group backdrop-blur-xl bg-white/5 rounded-2xl overflow-hidden shadow-lg border border-white/10 hover:border-fuchsia-500/50 transition-colors"
                      >
                        {selectedCourse === course._id ? (
                          <div className="p-4">
                            <video className="w-full rounded-xl" controls>
                              <source src={videoPath} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <motion.button 
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleCourseComplete(course._id)}
                              className="mt-4 w-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-orange-500 text-white px-4 py-3 rounded-xl transition-all"
                            >
                              Complete Course
                            </motion.button>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <img 
                                src={thumbnailPath} 
                                onError={(e) => e.target.src = '/fallback-image.jpg'} 
                                alt={course.title} 
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-70"></div>
                            </div>
                            <div className="p-6">
                              <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                              <p className="text-gray-300 text-sm mb-6 line-clamp-2">{course.description}</p>
                              <motion.button 
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleEnrollCourse(course._id)} 
                                className="w-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-orange-500 text-white px-4 py-3 rounded-xl transition-all"
                              >
                                Start Learning
                              </motion.button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'enrolled' && (
              <div>
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-500">
                  My Enrolled Courses
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.length === 0 ? (
                    <div className="col-span-3 text-center py-12">
                      <div className="text-6xl mb-4">📚</div>
                      <h3 className="text-2xl font-semibold mb-2">No courses enrolled yet</h3>
                      <p className="text-gray-400">Explore the learner section to find your first course</p>
                    </div>
                  ) : enrolledCourses.map((course) => {
                    const thumbnailPath = course.thumbnail ? `http://localhost:3500/uploads/images/${course.thumbnail.split('\\').pop()}` : '/fallback-image.jpg';
                    const videoPath = course.video ? `http://localhost:3500/uploads/videos/${course.video.split('\\').pop()}` : '';
                    
                    return (
                      <motion.div 
                        key={course._id} 
                        whileHover={{ y: -5 }}
                        className="group backdrop-blur-xl bg-white/5 rounded-2xl overflow-hidden shadow-lg border border-white/10 hover:border-fuchsia-500/50 transition-colors"
                      >
                        <div className="relative">
                          <img 
                            src={thumbnailPath}
                            onError={(e) => e.target.src = '/fallback-image.jpg'}
                            alt={course.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-70"></div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                          <p className="text-gray-300 text-sm mb-4">{course.description}</p>
                          
                          <div className="mb-4">
                            <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{course.progress || 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-orange-500 rounded-full" 
                                style={{ width: `${course.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <motion.button 
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedCourse(course._id)}
                            className="w-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-orange-500 text-white px-4 py-3 rounded-xl transition-all"
                          >
                            Continue Learning
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'mentor' && (
              <div>
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-500">
                  Upload New Course
                </h2>
                <div className="group backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                  <form onSubmit={handleCourseUpload} className="space-y-5">
                    <div>
                      <label className="block text-gray-300 mb-2">Course Title</label>
                      <input
                        type="text"
                        placeholder="Enter an engaging course title"
                        className="w-full p-3 rounded-xl bg-white/5 backdrop-blur-lg text-white border border-white/10 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/50 transition-all"
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Course Description</label>
                      <textarea
                        placeholder="Describe what learners will achieve"
                        rows="4"
                        className="w-full p-3 rounded-xl bg-white/5 backdrop-blur-lg text-white border border-white/10 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/50 transition-all"
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="block text-gray-300 mb-1">Course Image</label>
                        <div className="relative bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-dashed border-white/10 hover:border-fuchsia-500/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCourseForm({...courseForm, image: e.target.files[0]})}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                          <div className="text-center">
                            <div className="mb-2 text-fuchsia-400">
                              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                            </div>
                            <p className="text-sm text-gray-400">
                              {courseForm.image ? courseForm.image.name : 'Click to upload image'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-gray-300 mb-1">Thumbnail</label>
                        <div className="relative bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-dashed border-white/10 hover:border-fuchsia-500/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.files[0]})}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                          <div className="text-center">
                            <div className="mb-2 text-fuchsia-400">
                              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                            </div>
                            <p className="text-sm text-gray-400">
                              {courseForm.thumbnail ? courseForm.thumbnail.name : 'Click to upload thumbnail'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-gray-300 mb-1">Course Video</label>
                        <div className="relative bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-dashed border-white/10 hover:border-fuchsia-500/50 transition-colors">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setCourseForm({...courseForm, video: e.target.files[0]})}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                          <div className="text-center">
                            <div className="mb-2 text-fuchsia-400">
                              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                              </svg>
                            </div>
                            <p className="text-sm text-gray-400">
                              {courseForm.video ? courseForm.video.name : 'Click to upload video'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      className="mt-6 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 transition-all"
                    >
                      Upload Course
                    </motion.button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'profile' && userProfile && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-500">
                    Profile Information
                  </h2>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className={`mt-4 md:mt-0 px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isEditing 
                        ? 'bg-white/5 backdrop-blur-lg text-gray-300 hover:bg-white/10' 
                        : 'bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-orange-500 text-white'
                    }`}
                  >
                    {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                  </motion.button>
                </div>

    {isEditing ? (
      <form onSubmit={handleProfileUpdate} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block mb-1">Mobile Number</label>
          <input
            type="text"
            value={editForm.mobileNo}
            onChange={(e) => setEditForm({ ...editForm, mobileNo: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block mb-1">Wallet Address</label>
          <input
            type="text"
            value={editForm.UserWalletAddress}
            onChange={(e) => setEditForm({ ...editForm, UserWalletAddress: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block mb-1">Gender</label>
          <select
            value={editForm.gender}
            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            value={editForm.dob}
            onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block mb-1">Skills (comma-separated)</label>
          <input
            type="text"
            value={editForm.skills.join(', ')}
            onChange={(e) =>
              setEditForm({ ...editForm, skills: e.target.value.split(',').map(skill => skill.trim()) })
            }
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          Save Changes
        </button>
      </form>
    ) : (
      <div className="space-y-2">
        <p><span className="font-semibold">Name:</span> {userProfile.name}</p>
        <p><span className="font-semibold">Mobile No:</span> {userProfile.mobileNo || 'N/A'}</p>
        <p><span className="font-semibold">Wallet Address:</span> {userProfile.UserWalletAddress || 'N/A'}</p>
        <p><span className="font-semibold">Gender:</span> {userProfile.gender || 'N/A'}</p>
        <p><span className="font-semibold">Date of Birth:</span> {userProfile.dob || 'N/A'}</p>
        <p><span className="font-semibold">Tokens:</span> {userProfile.tokens}</p>
        <div>
          <span className="font-semibold">Skills:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {userProfile.skills?.map((skill, index) => (
              <span key={index} className="bg-blue-500 px-2 py-1 rounded text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <p><span className="font-semibold">Courses Completed:</span> {userProfile.coursesCompleted?.length}</p>
        <p><span className="font-semibold">Courses Taught:</span> {userProfile.coursesTaught?.length}</p>
      </div>
    )}
  </div>
)}

            {activeTab === 'mentorship' && (
              <div>
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Available Mentors
                </h2>
                
                {mentors.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-semibold mb-2">No mentors available yet</h3>
                    <p className="text-gray-400">Check back later for expert guidance</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentors.map((mentor) => (
                      <motion.div 
                        key={mentor._id} 
                        whileHover={{ y: -5 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-indigo-500 transition-colors"
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                            {mentor.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-xl font-semibold">{mentor.name}</h3>
                            <p className="text-indigo-400">{mentor.email}</p>
                          </div>
                        </div>
                        
                        {mentor.skills && mentor.skills.length > 0 && (
                          <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-2">Expertise in:</p>
                            <div className="flex flex-wrap gap-2">
                              {mentor.skills.map((skill, index) => (
                                <span key={index} className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 px-3 py-1 rounded-lg text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate(`/mentor/${mentor.mentorId}`)}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl transition-all"
                        >
                          View Profile
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Web3 Learning Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;