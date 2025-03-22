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
  const [mentors, setMentors] = useState([]); // Initialize as empty array
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    skills: []
  });
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    image: null,
    thumbnail: null,
    video: null
  });
  const userId = localStorage.getItem('userId');
  console.log("userId : ",userId)
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
          console.log("Course details : ",coursesRes.data)
          setCourses(coursesRes.data);
          break;
        case 'profile':
          const profileRes = await api.get(`/User/${userId}`);
          console.log("Profile",profileRes)
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
          console.log("Enrolled",enrolledRes.data)
          setEnrolledCourses(Array.isArray(enrolledRes.data) ? enrolledRes.data : []);
          break;
        case 'mentorship':
          const mentorsRes = await api.get('/mentorship/getallmentor');
          setMentors(Array.isArray(mentorsRes.data.mentorship) ? mentorsRes.data.mentorship : []); // Ensure array
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
      
      console.log("user Id in enroll : ",userId);
      console.log("course Id in enroll : ",courseId);
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
      const response = await api.post("/courses/complete",{
        learnerId: userId,
        courseId: courseId
      })
      console.log("learnerId complete userId : ",userId);
      console.log("courseId complete courseId : ",courseId);
     if(response.status===200){
      alert("Course complete successFully...");
     }
     else if(response.status===400){
      alert(response.message)
     }
      setSelectedCourse(null);
      fetchInitialData();
    } catch (error) {
      setError('Failed to mark course as complete. Please try again.',error);
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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await api.put(`/profile/${userId}`, editForm);
      
      setIsEditing(false);
      fetchInitialData();
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-center space-x-4">
        <button 
          onClick={() => setActiveTab('learner')}
          className={`px-4 py-2 rounded ${activeTab === 'learner' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Learner
        </button>
        <button 
          onClick={() => setActiveTab('mentor')}
          className={`px-4 py-2 rounded ${activeTab === 'mentor' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Mentor
        </button>
        <button 
          onClick={() => setActiveTab('mentorship')}
          className={`px-4 py-2 rounded ${activeTab === 'mentorship' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Mentorship
        </button>
        <button 
          onClick={() => setActiveTab('enrolled')}
          className={`px-4 py-2 rounded ${activeTab === 'enrolled' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Enrolled Courses
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded ${activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Profile
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-center mb-4">{error}</div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-6 rounded-lg shadow-lg"
      >

        
      {activeTab === 'learner' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Available Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const thumbnailPath = course.thumbnail ? `http://localhost:3500/uploads/images/${course.thumbnail.split('\\').pop()}` : '/fallback-image.jpg';
                const videoPath = course.video ? `http://localhost:3500/uploads/videos/${course.video.split('\\').pop()}` : '';
                
                return (
                  <div key={course._id} className="bg-gray-700 rounded-lg overflow-hidden shadow-xl transition-transform hover:scale-105">
                    {selectedCourse === course._id ? (
                      <div className="p-4">
                        <video className="w-full rounded-lg" controls>
                          <source src={videoPath} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <button 
                          onClick={() => handleCourseComplete(course._id)}
                          className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Complete Course
                        </button>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={thumbnailPath} 
                          onError={(e) => e.target.src = '/fallback-image.jpg'} 
                          alt={course.title} 
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{course.description}</p>
                          <button 
                            onClick={() => handleEnrollCourse(course._id)} 
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Start Learning
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'enrolled' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">My Enrolled Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => {
                const thumbnailPath = course.thumbnail ? `http://localhost:3500/uploads/images/${course.thumbnail.split('\\').pop()}` : '/fallback-image.jpg';
                const videoPath = course.video ? `http://localhost:3500/uploads/videos/${course.video.split('\\').pop()}` : '';
                console.log(course._id)
                return (
                  <div key={course._id} className="bg-gray-700 rounded-lg overflow-hidden shadow-xl">
                    <img 
                      src={thumbnailPath}
                      onError={(e) => e.target.src = '/fallback-image.jpg'}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                      <p className="text-gray-300 text-sm mb-4">{course.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Progress: {course.progress || 0}%</span>
                        <button 
                          onClick={() => setSelectedCourse(course._id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          Continue Learning
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'mentor' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Upload New Course</h2>
            <form onSubmit={handleCourseUpload} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Course Title"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                />
              </div>
              <div>
                <textarea
                  placeholder="Course Description"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCourseForm({...courseForm, image: e.target.files[0]})}
                  className="text-white"
                />
                <p className="text-gray-400 text-sm">Course Image</p>
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.files[0]})}
                  className="text-white"
                />
                <p className="text-gray-400 text-sm">Course Thumbnail</p>
              </div>
              <div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setCourseForm({...courseForm, video: e.target.files[0]})}
                  className="text-white"
                />
                <p className="text-gray-400 text-sm">Course Video</p>
              </div>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Upload Course
              </button>
            </form>
          </div>
        )}

        {activeTab === 'profile' && userProfile && (
          <div className="text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Profile Information</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            
            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.skills.join(', ')}
                    onChange={(e) => setEditForm({...editForm, skills: e.target.value.split(',').map(skill => skill.trim())})}
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
                <p><span className="font-semibold">Email:</span> {userProfile.email}</p>
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
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Available Mentors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <div key={mentor._id} className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-2">{mentor.name}</h3>
                  <p className="text-gray-300 mb-2">{mentor.email}</p>
                  {mentor.skills && (
                    <div className="mb-4">
                      <p className="font-semibold mb-1">Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {mentor.skills.map((skill, index) => (
                          <span key={index} className="bg-blue-500 px-2 py-1 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/mentor/${mentor.mentorId}`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Dashboard;
