import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if token is valid and not expired
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Initialize authentication state on app load
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userId');
        const storedUserRole = localStorage.getItem('userRole');
        const storedTokenBalance = localStorage.getItem('tokencoin');

        if (storedToken && isTokenValid(storedToken)) {
          const decoded = jwtDecode(storedToken);
          
          const userData = {
            _id: storedUserId,
            email: decoded.email,
            role: storedUserRole,
            tokenBalance: storedTokenBalance,
            name: localStorage.getItem('userName') || decoded.name || ''
          };

          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
          // schedule automatic logout when token expires
          scheduleTokenExpiryLogout(decoded.exp);
        } else {
          // Clear invalid/expired tokens
          clearAuthData();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Clear authentication data
  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('tokencoin');
    localStorage.removeItem('userName');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigate = useNavigate();
  const logoutTimerRef = useRef(null);

  const scheduleTokenExpiryLogout = (exp) => {
    // exp is in seconds since epoch
    if (!exp) return;
    const msUntilExpiry = (exp * 1000) - Date.now();
    if (msUntilExpiry <= 0) {
      // already expired
      clearAuthData();
      navigate('/landingpage', { replace: true });
      return;
    }

    // Clear existing timer
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    logoutTimerRef.current = setTimeout(() => {
      clearAuthData();
      navigate('/landingpage', { replace: true });
    }, msUntilExpiry + 1000); // add small buffer
  };

  // Login function
  const login = (authData) => {
    try {
      const { accessToken, user: userData } = authData;
      
      if (!accessToken || !userData) {
        throw new Error('Invalid authentication data');
      }

      // Store in localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('userId', userData._id);
      localStorage.setItem('userRole', userData.role || 'learner');
      localStorage.setItem('tokencoin', userData.tokenBalance || '0');
      // Store user name for UI rendering
      if (userData.name) {
        localStorage.setItem('userName', userData.name);
      }

      // Update state
      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    // Clear any scheduled timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    clearAuthData();
    // Navigate to landing page (replace history)
    try {
      navigate('/landingpage', { replace: true });
    } catch (err) {
      // fallback to full reload
      window.location.href = '/landingpage';
    }
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    
    // Update localStorage if specific fields are updated
    if (userData.tokenBalance) {
      localStorage.setItem('tokencoin', userData.tokenBalance);
    }
    if (userData.role) {
      localStorage.setItem('userRole', userData.role);
    }
    if (userData.name) {
      localStorage.setItem('userName', userData.name);
    }
  };

  // Check authentication status
  const checkAuthStatus = () => {
    const storedToken = localStorage.getItem('token');
    return isTokenValid(storedToken);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    clearAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;