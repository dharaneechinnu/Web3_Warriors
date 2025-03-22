import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { mentor } from '../services/api';

function MentorProfile() {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: '',
    maxParticipants: '',
    price: '',
    tags: ''
  });

  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      const [profileData, sessionsData, earningsData] = await Promise.all([
        mentor.getProfile(),
        mentor.getSessions(),
        mentor.getEarnings()
      ]);
      setProfile(profileData.data);
      setSessions(sessionsData.data);
      setEarnings(earningsData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const sessionData = {
        ...newSession,
        tags: newSession.tags.split(',').map(tag => tag.trim()),
        price: parseFloat(newSession.price),
        maxParticipants: parseInt(newSession.maxParticipants),
        duration: parseInt(newSession.duration)
      };
      await mentor.createSession(sessionData);
      setNewSession({
        title: '',
        description: '',
        startTime: '',
        duration: '',
        maxParticipants: '',
        price: '',
        tags: ''
      });
      fetchMentorData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateSession = async (sessionId, status) => {
    try {
      await mentor.updateSession(sessionId, { status });
      fetchMentorData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSession(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 p-6 rounded-lg mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{profile?.username}</h1>
            <p className="text-gray-400 mb-4">{profile?.profile?.bio}</p>
            <div className="flex flex-wrap gap-2">
              {profile?.profile?.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="bg-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${earnings?.total || 0}</p>
            <p className="text-gray-400">Total Earnings</p>
          </div>
        </div>
      </motion.div>

      {/* Create Session Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 p-6 rounded-lg mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">Create New Session</h2>
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="title"
              placeholder="Session Title"
              value={newSession.title}
              onChange={handleInputChange}
              required
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="tags"
              placeholder="Tags (comma separated)"
              value={newSession.tags}
              onChange={handleInputChange}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="datetime-local"
              name="startTime"
              value={newSession.startTime}
              onChange={handleInputChange}
              required
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="duration"
              placeholder="Duration (minutes)"
              value={newSession.duration}
              onChange={handleInputChange}
              required
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="maxParticipants"
              placeholder="Max Participants"
              value={newSession.maxParticipants}
              onChange={handleInputChange}
              required
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="price"
              placeholder="Price ($)"
              value={newSession.price}
              onChange={handleInputChange}
              required
              className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <textarea
            name="description"
            placeholder="Session Description"
            value={newSession.description}
            onChange={handleInputChange}
            required
            rows="4"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Create Session
          </button>
        </form>
      </motion.div>

      {/* Sessions List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 p-6 rounded-lg mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">Your Sessions</h2>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="bg-gray-700 p-4 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-xl">{session.title}</h3>
                  <p className="text-gray-400">{session.description}</p>
                  <div className="mt-2 space-y-1">
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
                      <span className="text-gray-400">Price:</span> ${session.price}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-400">Participants:</span>{' '}
                      {session.participants?.length || 0}/{session.maxParticipants}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    session.status === 'scheduled' ? 'bg-green-600' :
                    session.status === 'ongoing' ? 'bg-blue-600' :
                    session.status === 'completed' ? 'bg-gray-600' :
                    'bg-red-600'
                  }`}>
                    {session.status}
                  </span>
                  {session.status === 'scheduled' && (
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={() => handleUpdateSession(session._id, 'ongoing')}
                        className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleUpdateSession(session._id, 'cancelled')}
                        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-center text-gray-400">No sessions created yet</p>
          )}
        </div>
      </motion.div>

      {/* Earnings History */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800 p-6 rounded-lg"
      >
        <h2 className="text-2xl font-bold mb-4">Earnings History</h2>
        <div className="space-y-4">
          {earnings?.transactions?.map((transaction, index) => (
            <div
              key={index}
              className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{transaction.description}</p>
                <p className="text-sm text-gray-400">
                  {new Date(transaction.date).toLocaleString()}
                </p>
              </div>
              <p className="text-green-400 font-bold">
                +${transaction.amount}
              </p>
            </div>
          ))}
          {(!earnings?.transactions || earnings.transactions.length === 0) && (
            <p className="text-center text-gray-400">No earnings history</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default MentorProfile;
