import axios from 'axios';
import TokenStorage from '../utils/tokenStorage';
import { API_BASE_URL } from '../config';

export { API_BASE_URL };

const api = axios.create({
  baseURL: `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        // Clear auth data and redirect to landing page
        TokenStorage.clearAll();

        // Only redirect if not already on auth pages
        const currentPath = window.location.pathname;
        const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/landingpage'];

        if (!authPages.includes(currentPath)) {
          window.location.href = '/landingpage';
        }
      }
    
    return Promise.reject(error);
  }
);

export default api;