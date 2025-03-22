import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

function MentorProfile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    expertise: '',
    hourlyRate: ''
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
      const response = await api.get('/mentor/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        bio: response.data.bio || '',
        expertise: response.data.expertise || '',
        hourlyRate: response.data.hourlyRate || ''
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
                <label className="block text-gray-400 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Expertise</label>
                <input
                  type="text"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Hourly Rate (tokens)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  required
                  min="0"
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
                <p className="text-gray-300">{profile?.name}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Bio</h2>
                <p className="text-gray-300">{profile?.bio || 'No bio provided'}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Expertise</h2>
                <p className="text-gray-300">{profile?.expertise || 'Not specified'}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Hourly Rate</h2>
                <p className="text-gray-300">{profile?.hourlyRate || 0} tokens</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Rating</h2>
                <p className="text-gray-300">
                  {profile?.rating ? `${profile.rating} / 5` : 'No ratings yet'}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Total Sessions</h2>
                <p className="text-gray-300">{profile?.totalSessions || 0}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default MentorProfile;
