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
import EnrolledCourses from './pages/learner/EnrolledCourses';
import Challenges from './pages/learner/Challenges';
import SubmissionStatus from './pages/learner/SubmissionStatus';
import LearnerProfile from './pages/learner/LearnerProfile';
import MentorChallenges from './pages/mentor/MentorChallenges';
import SessionManagement from './pages/mentor/SessionManagement';
import SubmissionReview from './pages/mentor/SubmissionReview';
import MentorProfileDashboard from './pages/mentor/MentorProfileDashboard';
import MentorMyCourses from './pages/mentor/MentorMyCourses';
import MentorSlotManagement from './pages/mentor/MentorSlotManagement';
import BookSession from './pages/learner/BookSession';
import MyCertificates from './pages/learner/MyCertificates';
import CertificateVerify from './pages/learner/CertificateVerify';
import VideoRoom from './pages/VideoRoom';

// Mentor application pages
import MentorApply from './pages/mentor/MentorApply';
import ApplicationStatus from './pages/mentor/ApplicationStatus';

// Admin panel pages (isolated layout — no main Navbar)
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import MentorApplicationsList from './pages/admin/MentorApplicationsList';
import MentorApplicationDetail from './pages/admin/MentorApplicationDetail';

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

// Redirect authenticated users away from auth pages to their role home
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    const role = user?.role || localStorage.getItem('userRole');
    if (role === 'mentor') return <Navigate to="/mentor-home" replace />;
    if (role === 'admin')  return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/learner-home" replace />;
  }

  return children;
};

// Mentor-only route guard
const MentorRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login/mentor" state={{ from: location }} replace />;

  const role = user?.role || localStorage.getItem('userRole');
  if (role !== 'mentor') {
    // Learner trying to reach mentor pages — send them home
    return <Navigate to="/learner-home" replace />;
  }
  return children;
};

// Learner-only route guard
const LearnerRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login/learner" state={{ from: location }} replace />;

  const role = user?.role || localStorage.getItem('userRole');
  if (role !== 'learner') {
    // Mentor / admin trying to reach learner-only pages — send them home
    return <Navigate to="/mentor-home" replace />;
  }
  return children;
};

// Admin-only route guard — redirects non-admins to admin login
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/landingpage" replace />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const isVideoRoom  = location.pathname.startsWith('/room/');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // While auth state is initializing, show loading to avoid route flicker
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background-light text-gray-800">
      {/* Hide main Navbar on video rooms and all admin pages */}
      {!isVideoRoom && !isAdminRoute && <Navbar />}
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
          <LearnerRoute>
            <LearnerHome />
          </LearnerRoute>
        } />
        <Route path="/enrolled-courses" element={
          <LearnerRoute>
            <EnrolledCourses />
          </LearnerRoute>
        } />
        <Route path="/learner-dashboard" element={
          <LearnerRoute>
            <LearnerCourseDashboard />
          </LearnerRoute>
        } />
        <Route path="/learn/:courseId" element={
          <LearnerRoute>
            <CourseDetail />
          </LearnerRoute>
        } />
        <Route path="/mentor-home" element={
          <MentorRoute>
            <MentorHome />
          </MentorRoute>
        } />
        <Route path="/course-upload" element={
          <MentorRoute>
            <CourseUpload />
          </MentorRoute>
        } />
        <Route path="/mentor/course-creation-wizard" element={
          <MentorRoute>
            <CourseUpload />
          </MentorRoute>
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

        {/* Learner certificates */}
        <Route path="/learner/certificates" element={
          <LearnerRoute><MyCertificates /></LearnerRoute>
        } />

        {/* Public certificate verification — no auth required */}
        <Route path="/certificate/:certificateId" element={<CertificateVerify />} />

        {/* WebRTC Video Room — fullscreen, no Navbar */}
        <Route path="/room/:roomId" element={
          <ProtectedRoute><VideoRoom /></ProtectedRoute>
        } />

        {/* Mentor-only feature routes */}
        <Route path="/mentor/challenges" element={
          <MentorRoute><MentorChallenges /></MentorRoute>
        } />
        <Route path="/mentor/sessions" element={
          <MentorRoute><SessionManagement /></MentorRoute>
        } />
        <Route path="/mentor/submissions" element={
          <MentorRoute><SubmissionReview /></MentorRoute>
        } />
        <Route path="/mentor/profile" element={
          <MentorRoute><MentorProfileDashboard /></MentorRoute>
        } />
        <Route path="/mentor/my-courses" element={
          <MentorRoute><MentorMyCourses /></MentorRoute>
        } />
        <Route path="/mentor/slots" element={
          <MentorRoute><MentorSlotManagement /></MentorRoute>
        } />

        {/* ── Mentor Application routes ───────────────────────────── */}
        <Route path="/mentor/apply" element={
          <MentorRoute><MentorApply /></MentorRoute>
        } />
        <Route path="/mentor/application-status" element={
          <MentorRoute><ApplicationStatus /></MentorRoute>
        } />

        {/* ── Admin Panel routes (isolated layout, no main Navbar) ── */}
        {/* Public admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes — wrapped in AdminLayout (sidebar) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* /admin → redirect to dashboard */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />

          {/* /admin/dashboard */}
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* /admin/mentors — applications list */}
          <Route path="mentors" element={<MentorApplicationsList />} />

          {/* /admin/mentors/:id — application detail */}
          <Route path="mentors/:id" element={<MentorApplicationDetail />} />
        </Route>

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