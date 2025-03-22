import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

function LiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await api.get('/sessions/getall', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSessions(response.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (sessionId) => {
    try {
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      await api.post(`/sessions/enroll`, {
        userId,
        sessionId
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('Successfully enrolled in session!');
      
      // Refresh sessions list
      fetchSessions();
    } catch (err) {
      console.error('Enrollment error:', err);
      setError(err.response?.data?.message || 'Failed to enroll in session');
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply time filter
    const now = new Date();
    if (filter === 'upcoming') {
      filtered = filtered.filter(session => new Date(session.startTime) > now);
    } else if (filter === 'past') {
      filtered = filtered.filter(session => new Date(session.startTime) < now);
    }
    
    return filtered;
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'upcoming'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'past'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 text-red-500 p-4 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-500/20 text-green-500 p-4 rounded-lg"
          >
            {success}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filterSessions().map((session) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-800 p-6 rounded-lg shadow-lg"
            >
              <h3 className="text-xl font-bold text-white mb-2">{session.title}</h3>
              <p className="text-gray-400 mb-4">{session.description}</p>
              
              <div className="space-y-2 mb-4">
                <p className="text-gray-300">
                  <span className="font-medium">Mentor:</span> {session.mentor.name}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(session.startTime).toLocaleDateString()}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Time:</span>{' '}
                  {new Date(session.startTime).toLocaleTimeString()}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Duration:</span> {session.duration} minutes
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Price:</span> {session.price} tokens
                </p>
              </div>

              {new Date(session.startTime) > new Date() && !session.enrolled && (
                <button
                  onClick={() => handleEnroll(session._id)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Enroll Now
                </button>
              )}

              {session.enrolled && (
                <div className="text-green-400 font-medium text-center py-2">
                  ✓ Enrolled
                </div>
              )}

              {new Date(session.startTime) < new Date() && (
                <div className="text-gray-500 font-medium text-center py-2">
                  Session Ended
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filterSessions().length === 0 && (
          <div className="text-center text-gray-400">
            No sessions found
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default LiveSessions;
