import React from 'react';
import { motion } from 'framer-motion';

function MentorProfile() {
  const mentor = {
    name: 'John Doe',
    title: 'Senior Full Stack Developer',
    rating: 4.8,
    reviews: 156,
    skills: ['React', 'Node.js', 'Python', 'Blockchain'],
    achievements: [
      'Top Rated Mentor 2024',
      '500+ Teaching Hours',
      'Web3 Expert'
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 rounded-lg p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-32 h-32 rounded-full bg-gray-700"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{mentor.name}</h1>
            <p className="text-gray-400 mb-4">{mentor.title}</p>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="flex items-center">
                <span className="text-yellow-500 mr-1">★</span>
                <span>{mentor.rating}</span>
              </div>
              <span className="text-gray-400">({mentor.reviews} reviews)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skills & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h2 className="text-xl font-bold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {mentor.skills.map((skill, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h2 className="text-xl font-bold mb-4">Achievements</h2>
          <div className="space-y-2">
            {mentor.achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2"
              >
                <span className="text-yellow-500">🏆</span>
                <span>{achievement}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Book Session */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4">Book a Session</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
          >
            30 min (500 SKL)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
          >
            60 min (900 SKL)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
          >
            90 min (1200 SKL)
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default MentorProfile;
