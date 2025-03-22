import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('authData'));
    setIsAuthenticated(!!authData?.token);
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('authData'); // Remove auth data from local storage
    setIsAuthenticated(false);
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-primary-600 flex items-center">
            <motion.span initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-2xl mr-2">
              🎓
            </motion.span>
            SkillEx
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 px-3 py-2 transition-colors">
            can Be  Mentor 
            </Link>
            <Link to="/sessions" className="text-gray-600 hover:text-primary-600 px-3 py-2 transition-colors">
            Learner
            </Link>
            <Link to="/wallet" className="text-gray-600 hover:text-primary-600 px-3 py-2 transition-colors">
              Mentorship 
            </Link>
            <div className="flex items-center space-x-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className="text-primary-600 hover:text-primary-700 px-4 py-2 rounded-lg transition-colors font-medium">
                    Sign In
                  </Link>
                  <Link to="/register" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-primary-600 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-white border-b border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/dashboard" className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md transition-colors">
              Learner
            </Link>
            <Link to="/sessions" className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md transition-colors">
             Can Be mentor
            </Link>
            <Link to="/wallet" className="block text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md transition-colors">
              MEntorship 
            </Link>
            <div className="pt-4 pb-3 border-t border-gray-100">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="block bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors font-medium w-full text-left"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className="block text-primary-600 hover:text-primary-700 px-3 py-2 rounded-md transition-colors font-medium">
                    Sign In
                  </Link>
                  <Link to="/register" className="block bg-primary-500 text-white px-3 py-2 rounded-md hover:bg-primary-600 transition-colors font-medium mt-2">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

export default Navbar;
