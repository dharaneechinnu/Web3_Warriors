import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { user, mentor } from '../services/api';

function Dashboard() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (userRole === 'mentor') {
        // Fetch mentor data
        const [profileData, sessionsData, earningsData] = await Promise.all([
          mentor.getProfile(),
          mentor.getSessions(),
          mentor.getEarnings()
        ]);
        
        setProfile(profileData.data);
        setSessions(sessionsData.data);
        setWallet(earningsData.data);
      } else {
        // Fetch user data
        const [profileData, dashboardData, walletData] = await Promise.all([
          user.getProfile(),
          user.getDashboard(),
          user.getWallet()
        ]);
        
        setProfile(profileData.data);
        setSessions(dashboardData.data?.sessions || []);
        setWallet(walletData.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Profile Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Profile</h2>
          {profile && (
            <div className="space-y-4">
              <p className="text-gray-300">Name: {profile.name}</p>
              <p className="text-gray-300">Email: {profile.email}</p>
              <p className="text-gray-300">Role: {profile.role}</p>
            </div>
          )}
        </div>

        {/* Wallet Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Wallet</h2>
          {wallet && (
            <div className="space-y-4">
              <p className="text-gray-300">Balance: {wallet.balance} tokens</p>
              {wallet.transactions && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Recent Transactions</h3>
                  <div className="space-y-2">
                    {wallet.transactions.slice(0, 3).map((tx, index) => (
                      <div key={index} className="text-sm text-gray-400">
                        {tx.description}: {tx.amount} tokens
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sessions Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4">
            {userRole === 'mentor' ? 'Your Sessions' : 'Enrolled Sessions'}
          </h2>
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <div key={index} className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                  <p className="text-gray-400">{session.description}</p>
                  <p className="text-gray-400">
                    {new Date(session.scheduledAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No sessions found</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
