import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Api, { session, user } from '../services/api';

function LiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    tags: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await Api.get("/courses/getall");
      setSessions(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (sessionId) => {
    try {
      await user.enrollSession(sessionId);
      fetchSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 p-6 rounded-lg mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">Find Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="search"
            placeholder="Search sessions..."
            value={filters.search}
            onChange={handleFilterChange}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="tags"
            placeholder="Tags (comma separated)"
            value={filters.tags}
            onChange={handleFilterChange}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </motion.div>

      {/* Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <motion.div
            key={session._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{session.title}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  session.status === 'scheduled' ? 'bg-green-600' :
                  session.status === 'ongoing' ? 'bg-blue-600' :
                  'bg-gray-600'
                }`}>
                  {session.status}
                </span>
              </div>
              <p className="text-gray-400 mb-4">{session.description}</p>
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="text-gray-400">Mentor:</span>{' '}
                  {session.mentor?.username}
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Date:</span>{' '}
                  {new Date(session.startTime).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Time:</span>{' '}
                  {new Date(session.startTime).toLocaleTimeString()}
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Duration:</span>{' '}
                  {session.duration} minutes
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Price:</span>{' '}
                  ${session.price}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {session.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-700 px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  {session.participants?.length || 0}/{session.maxParticipants} spots filled
                </p>
                {session.status === 'scheduled' && (
                  <button
                    onClick={() => handleEnroll(session._id)}
                    disabled={session.participants?.length >= session.maxParticipants}
                    className={`px-4 py-2 rounded-lg ${
                      session.participants?.length >= session.maxParticipants
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {session.participants?.length >= session.maxParticipants
                      ? 'Full'
                      : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {sessions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No sessions found matching your criteria
        </div>
      )}
    </div>
  );
}

export default LiveSessions;
