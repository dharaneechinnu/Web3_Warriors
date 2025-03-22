import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useParams } from 'react-router-dom';

function MentorProfile() {
  const { id } = useParams();
  console.log("MentorID",id)
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: [],
    coursesCompleted: 0,
    coursesTaught: 0,
    tokenBalance: 0,
    averageRating: 0,
    github: '',
    linkedin: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchMentorProfile();
  }, []);

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await api.get(`mentorship/getMentor/${id}`);
      console.log("Mentor:",response.data)
      setProfile(response.data);
      setFormData({
        name: response.data.mentorship.name || '',
        email: response.data.mentorship.email || '',
        skills: response.data.mentorship.skills || [],
        coursesCompleted: response.data.mentorship.coursesCompleted || 0,
        coursesTaught: response.data.mentorship.coursesTaught || 0,
        tokenBalance: response.data.mentorship.tokenBalance || 0,
        averageRating: response.data.mentorship.averageRating || 0,
        github: response.data.mentorship.github || '',
        linkedin: response.data.mentorship.linkedin || ''
      });
    } catch (err) {
      console.error('Error fetching mentor profile:', err);
      setError('Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const token = localStorage.getItem('token');
      await api.put('/mentor/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await fetchMentorProfile();
      setEditMode(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Mentor Profile</h1>
            <button
              onClick={() => setEditMode(!editMode)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/20 text-red-500 p-4 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-500/20 text-green-500 p-4 rounded-lg mb-6"
            >
              {success}
            </motion.div>
          )}

          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills.join(', ')}
                  onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(skill => skill.trim())})}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">GitHub Profile</label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">LinkedIn Profile</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg ${
                  loading
                    ? 'bg-blue-500/50 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } transition-colors text-white font-medium`}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Name</h2>
                <p className="text-gray-300">{profile?.mentorship?.name}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Email</h2>
                <p className="text-gray-300">{profile?.mentorship?.email}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile?.mentorship?.skills?.map((skill, index) => (
                    <span key={index} className="bg-blue-500 px-2 py-1 rounded text-sm text-white">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Courses</h2>
                <p className="text-gray-300">
                  Completed: {profile?.mentorship?.coursesCompleted || 0} | 
                  Taught: {profile?.mentorship?.coursesTaught || 0}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Token Balance</h2>
                <p className="text-gray-300">{profile?.mentorship?.tokenBalance || 0} tokens</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Rating</h2>
                <p className="text-gray-300">
                  {profile?.mentorship?.averageRating ? `${profile.mentorship.averageRating} / 5` : 'No ratings yet'}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Social Links</h2>
                <div className="flex gap-4">
                  {profile?.mentorship?.github && (
                    <a href={profile.mentorship.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      GitHub
                    </a>
                  )}
                  {profile?.mentorship?.linkedin && (
                    <a href={profile.mentorship.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default MentorProfile;
