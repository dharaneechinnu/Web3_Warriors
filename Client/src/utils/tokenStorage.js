/**
 * Token Storage Utility
 * Centralized storage management for authentication tokens and user data
 */

class TokenStorage {
  // Storage keys
  static KEYS = {
    TOKEN: 'token',
    USER_ID: 'userId',
    USER_ROLE: 'userRole',
    TOKEN_BALANCE: 'tokencoin',
    USER_NAME: 'userName'
  };

  // Get token from localStorage
  static getToken() {
    return localStorage.getItem(this.KEYS.TOKEN);
  }

  // Set token in localStorage
  static setToken(token) {
    localStorage.setItem(this.KEYS.TOKEN, token);
  }

  // Remove token from localStorage
  static removeToken() {
    localStorage.removeItem(this.KEYS.TOKEN);
  }

  // Get user ID from localStorage
  static getUserId() {
    return localStorage.getItem(this.KEYS.USER_ID);
  }

  // Set user ID in localStorage
  static setUserId(userId) {
    localStorage.setItem(this.KEYS.USER_ID, userId);
  }

  // Get user role from localStorage
  static getUserRole() {
    return localStorage.getItem(this.KEYS.USER_ROLE);
  }

  // Set user role in localStorage
  static setUserRole(role) {
    localStorage.setItem(this.KEYS.USER_ROLE, role);
  }

  // Get token balance from localStorage
  static getTokenBalance() {
    return localStorage.getItem(this.KEYS.TOKEN_BALANCE);
  }

  // Set token balance in localStorage
  static setTokenBalance(balance) {
    localStorage.setItem(this.KEYS.TOKEN_BALANCE, balance);
  }

  // Store complete auth data
  static setAuthData({ token, userId, role, tokenBalance }) {
    if (token) this.setToken(token);
    if (userId) this.setUserId(userId);
    if (role) this.setUserRole(role);
    if (tokenBalance !== undefined) this.setTokenBalance(tokenBalance);
  }

  // Get complete auth data
  static getAuthData() {
    return {
      token: this.getToken(),
      userId: this.getUserId(),
      userRole: this.getUserRole(),
      tokenBalance: this.getTokenBalance()
    };
  }

  // Clear all auth data
  static clearAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Check if user is authenticated (has valid token)
  static isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  // Create authorization header for API requests
  static getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Listen for storage changes
  static onStorageChange(callback) {
    const handleStorageChange = (event) => {
      if (Object.values(this.KEYS).includes(event.key)) {
        callback(event);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Return cleanup function
    return () => window.removeEventListener('storage', handleStorageChange);
  }
}

export default TokenStorage;