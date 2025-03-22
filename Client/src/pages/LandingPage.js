import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Learn Web3 from the Best
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with expert mentors, join live sessions, and master blockchain technology
            through hands-on learning experiences.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Login
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Expert Mentors</h3>
            <p className="text-gray-300">
              Learn from experienced blockchain developers and industry experts who will guide
              you through your Web3 journey.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Live Sessions</h3>
            <p className="text-gray-300">
              Join interactive live sessions where you can ask questions and get real-time
              feedback from mentors.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Token Economy</h3>
            <p className="text-gray-300">
              Use platform tokens to book sessions, reward mentors, and participate in the
              Web3 Warriors ecosystem.
            </p>
          </div>
        </motion.div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Create an Account</h3>
                <p className="text-gray-300">
                  Sign up and complete your profile to join the Web3 Warriors community.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Browse Sessions</h3>
                <p className="text-gray-300">
                  Explore available live sessions and choose the ones that match your learning goals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Book and Learn</h3>
                <p className="text-gray-300">
                  Use your tokens to book sessions and start learning from expert mentors.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 p-8 rounded-lg text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Web3 Journey?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Join Web3 Warriors today and take the first step towards mastering blockchain
            technology with expert guidance.
          </p>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block"
          >
            Join Now
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default LandingPage;
