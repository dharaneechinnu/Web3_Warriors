import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/Navbar';
import ToastNotifications from './components/ToastNotifications';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CourseUpload from './pages/CourseUpload';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import Profile from './pages/Profile';
import MentorProfile from './pages/MentorProfile';
import LiveSessions from './pages/LiveSessions';
import Wallet from './pages/Wallet';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import LoginLearner from './pages/learner/Login';
import LoginMentor from './pages/mentor/Login';
import RegisterLearner from './pages/learner/Register';
import RegisterMentor from './pages/mentor/Register';
import LearnerHome from './pages/learner/LearnerHome';
import LearnerCourseDashboard from './pages/learner/LearnerCourseDashboard';
import MentorHome from './pages/mentor/MentorHome';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyLearner from './pages/learner/Verify';
import VerifyMentor from './pages/mentor/Verify';

// Udemy-style Course System Components
import LearnerCourseView from './pages/learner/LearnerCourseView';
import Challenges from './pages/learner/Challenges';
import SubmissionStatus from './pages/learner/SubmissionStatus';
import LearnerProfile from './pages/learner/LearnerProfile';
import MentorChallenges from './pages/mentor/MentorChallenges';
import SessionManagement from './pages/mentor/SessionManagement';
import SubmissionReview from './pages/mentor/SubmissionReview';
import MentorProfileDashboard from './pages/mentor/MentorProfileDashboard';
import MentorMyCourses from './pages/mentor/MentorMyCourses';
import BookSession from './pages/learner/BookSession';
import VideoRoom from './pages/VideoRoom';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

// Protected Route Components
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Redirect authenticated users away from auth pages
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }


  return children;
};

function AppRoutes() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const isVideoRoom = location.pathname.startsWith('/room/');

  // While auth state is initializing, show loading to avoid route flicker
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background-light text-gray-800">
      {!isVideoRoom && <Navbar />}
      <ToastNotifications />
      <Routes>
        {/* Root: show landing page if unauthenticated, else redirect to role home */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'mentor' ? '/mentor-home' : '/learner-home'} replace />
            ) : (
              <LandingPage />
            )
          }
        />

        {/* Landing Page */}
        <Route path="/landingpage" element={<LandingPage />} />
        
        {/* Auth Routes - redirect to dashboard if already logged in */}
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/login/learner" element={<AuthRoute><LoginLearner /></AuthRoute>} />
        <Route path="/login/mentor" element={<AuthRoute><LoginMentor /></AuthRoute>} />
        <Route path="/register/learner" element={<AuthRoute><RegisterLearner /></AuthRoute>} />
        <Route path="/register/mentor" element={<AuthRoute><RegisterMentor /></AuthRoute>} />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
        <Route path="/reset-password" element={<AuthRoute><ResetPassword /></AuthRoute>} />
        <Route path="/verify/learner" element={<AuthRoute><VerifyLearner /></AuthRoute>} />
        <Route path="/verify/mentor" element={<AuthRoute><VerifyMentor /></AuthRoute>} />
        
      
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/mentor/:id" element={
          <ProtectedRoute>
            <MentorProfile />
          </ProtectedRoute>
        } />
        <Route path="/mentor-profile-dashboard" element={
          <ProtectedRoute>
            <MentorProfile />
          </ProtectedRoute>
        } />
        <Route path="/live-sessions" element={
          <ProtectedRoute>
            <LiveSessions />
          </ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        } />
        <Route path="/learner-home" element={
          <ProtectedRoute>
            <LearnerHome />
          </ProtectedRoute>
        } />
        <Route path="/learner-dashboard" element={
          <ProtectedRoute>
            <LearnerCourseDashboard />
          </ProtectedRoute>
        } />
        <Route path="/learn/:courseId" element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        } />
        <Route path="/mentor-home" element={
          <ProtectedRoute>
            <MentorHome />
          </ProtectedRoute>
        } />
        <Route path="/course-upload" element={
          <ProtectedRoute>
            <CourseUpload />
          </ProtectedRoute>
        } />
        <Route path="/mentor/course-creation-wizard" element={
          <ProtectedRoute>
            <CourseUpload />
          </ProtectedRoute>
        } />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/course/:courseId" element={<CourseDetail />} />
        <Route path="/course/:courseId/learn" element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        } />

        {/* Udemy-style Course System Routes */}
        

  
   
        <Route path="/learner/course/:courseId" element={
          <ProtectedRoute>
            <LearnerCourseView />
          </ProtectedRoute>
        } />

        {/* Learner feature routes */}
        <Route path="/challenges" element={
          <ProtectedRoute><Challenges /></ProtectedRoute>
        } />
        <Route path="/submissions" element={
          <ProtectedRoute><SubmissionStatus /></ProtectedRoute>
        } />
        <Route path="/learner/profile" element={
          <ProtectedRoute><LearnerProfile /></ProtectedRoute>
        } />
        {/* Learner session booking (replaces LiveSessions for learners) */}
        <Route path="/sessions" element={
          <ProtectedRoute><BookSession /></ProtectedRoute>
        } />

        {/* WebRTC Video Room — fullscreen, no Navbar */}
        <Route path="/room/:roomId" element={
          <ProtectedRoute><VideoRoom /></ProtectedRoute>
        } />

        {/* Mentor feature routes */}
        <Route path="/mentor/challenges" element={
          <ProtectedRoute><MentorChallenges /></ProtectedRoute>
        } />
        <Route path="/mentor/sessions" element={
          <ProtectedRoute><SessionManagement /></ProtectedRoute>
        } />
        <Route path="/mentor/submissions" element={
          <ProtectedRoute><SubmissionReview /></ProtectedRoute>
        } />
        <Route path="/mentor/profile" element={
          <ProtectedRoute><MentorProfileDashboard /></ProtectedRoute>
        } />
        <Route path="/mentor/my-courses" element={
          <ProtectedRoute><MentorMyCourses /></ProtectedRoute>
        } />

        {/* Catch all route - redirect based on auth state */}
        <Route path="*" element={
         <Navigate to="/" replace />
        } />
      </Routes>
    </div>
  );
}

// Main App component with Auth Provider
function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;