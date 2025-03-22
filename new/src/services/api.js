import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3500/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
  }
};

// User API
export const user = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getDashboard: () => api.get('/users/dashboard'),
  getWallet: () => api.get('/users/wallet'),
  transferTokens: (data) => api.post('/users/wallet/transfer', data),
  getSessions: () => api.get('/users/sessions'),
  enrollSession: (sessionId) => api.post(`/users/sessions/${sessionId}/enroll`),
  getStats: () => api.get('/users/stats')
};

// Mentor API
export const mentor = {
  getProfile: () => api.get('/mentors/profile'),
  updateProfile: (data) => api.put('/mentors/profile', data),
  createSession: (data) => api.post('/mentors/sessions', data),
  getSessions: () => api.get('/mentors/sessions'),
  updateSession: (sessionId, data) => api.put(`/mentors/sessions/${sessionId}`, data),
  deleteSession: (sessionId) => api.delete(`/mentors/sessions/${sessionId}`),
  getStats: () => api.get('/mentors/stats'),
  getEarnings: () => api.get('/mentors/earnings')
};

// Session API
export const session = {
  getAll: () => api.get('/sessions'),
  getById: (id) => api.get(`/sessions/${id}`),
  search: (params) => api.get('/sessions/search', { params })
};

export default api;
