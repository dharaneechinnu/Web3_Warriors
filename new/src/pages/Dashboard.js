import React from 'react';
import { motion } from 'framer-motion';

function Dashboard() {
  const stats = [
    { label: 'Skills Verified', value: '12' },
    { label: 'Token Balance', value: '2500' },
    { label: 'Sessions Completed', value: '25' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 p-6 rounded-lg"
          >
            <h3 className="text-lg text-gray-400">{stat.label}</h3>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 rounded-lg p-6 mb-8"
      >
        <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
        <div className="space-y-4">
          {/* Placeholder for sessions */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="font-semibold">Web Development Basics</p>
            <p className="text-gray-400">Next session in 2 hours</p>
          </div>
        </div>
      </motion.div>

      {/* Recommended Mentors */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Recommended Mentors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for mentor cards */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="font-semibold">John Doe</p>
            <p className="text-gray-400">Full Stack Developer</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
