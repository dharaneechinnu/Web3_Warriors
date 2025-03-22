import React from 'react';
import { motion } from 'framer-motion';

function LiveSessions() {
  const sessions = [
    {
      title: 'Web Development Fundamentals',
      mentor: 'John Doe',
      time: '2:00 PM',
      date: '2024-03-23',
      status: 'Live',
      participants: 24
    },
    {
      title: 'Blockchain Basics',
      mentor: 'Jane Smith',
      time: '4:00 PM',
      date: '2024-03-23',
      status: 'Upcoming',
      participants: 18
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Live Sessions</h1>
        <p className="text-gray-400">Join interactive learning sessions with expert mentors</p>
      </motion.div>

      {/* Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{session.title}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    session.status === 'Live'
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-blue-500/20 text-blue-500'
                  }`}
                >
                  {session.status}
                </span>
              </div>
              <div className="space-y-2 text-gray-400">
                <p>Mentor: {session.mentor}</p>
                <p>Time: {session.time}</p>
                <p>Date: {session.date}</p>
                <p>Participants: {session.participants}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {session.status === 'Live' ? 'Join Session' : 'Register'}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recorded Sessions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12"
      >
        <h2 className="text-2xl font-bold mb-6">Recorded Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-gray-800 rounded-lg p-4"
            >
              <div className="aspect-video bg-gray-700 rounded-lg mb-4"></div>
              <h3 className="font-semibold mb-2">Advanced JavaScript Concepts</h3>
              <p className="text-gray-400 text-sm">Duration: 1h 30m</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LiveSessions;
