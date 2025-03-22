import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MentorProfile from './pages/MentorProfile';
import LiveSessions from './pages/LiveSessions';
import Wallet from './pages/Wallet';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  console.log('ProtectedRoute - Token:', token); // Debug log

  if (!token) {
    console.log('No token found, redirecting to login...'); // Debug log
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('Token found, rendering protected content...'); // Debug log
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-background-light text-gray-800">
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/mentor/:id" element={
          <ProtectedRoute>
            <MentorProfile />
          </ProtectedRoute>
        } />
        <Route path="/sessions" element={
          <ProtectedRoute>
            <LiveSessions />
          </ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        } />

        {/* Catch all route - redirect to dashboard if authenticated, otherwise to login */}
        <Route path="*" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

// Wrap the app with Router
const AppWrapper = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;
