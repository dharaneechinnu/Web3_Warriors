import api from './api';

class AuthService {
  // Login user
  static async login(credentials) {
    try {
      const response = await api.post('/Auth/login', credentials);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  }

  // Register user
  static async register(userData) {
    try {
      const response = await api.post('/Auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  // Verify OTP
  static async verifyOtp(otpData) {
    try {
      const response = await api.post('/Auth/verify-otp', otpData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'OTP verification failed'
      };
    }
  }

  // Send OTP
  static async sendOtp(email) {
    try {
      const response = await api.post('/Auth/send-otp', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send OTP'
      };
    }
  }

  // Reset password
  static async resetPassword(email) {
    try {
      const response = await api.post('/Auth/reset-password', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password reset failed'
      };
    }
  }

  // Update password
  static async updatePassword(passwordData) {
    try {
      const response = await api.post('/Auth/update-password', passwordData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password update failed'
      };
    }
  }

  // Get current user profile
  static async getCurrentUser() {
    try {
      const response = await api.get('/Auth/profile');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get user profile'
      };
    }
  }

  // Update user profile
  static async updateProfile(profileData) {
    try {
      const response = await api.put('/Auth/profile', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Profile update failed'
      };
    }
  }

  // Logout user (optional server-side logout if needed)
  static async logout() {
    try {
      await api.post('/Auth/logout');
      return { success: true };
    } catch (error) {
      // Even if server logout fails, we still consider it successful
      // as the client-side logout will clear local storage
      return { success: true };
    }
  }

  // Validate token on server
  static async validateToken() {
    try {
      const response = await api.get('/Auth/validate-token');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Token validation failed'
      };
    }
  }
}

export default AuthService;