/**
 * Authentication Module
 * Handles user authentication state and UI updates
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.init();
  }

  init() {
    // Load user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
        this.updateUI();
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearUser();
      }
    }
  }

  async register(userData) {
    try {
      const response = await api.register(userData);
      
      if (response.success) {
        this.setUser(response.data.user);
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async login(credentials) {
    try {
      const response = await api.login(credentials);
      
      if (response.success) {
        this.setUser(response.data.user);
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async logout() {
    try {
      await api.logout();
    } finally {
      this.clearUser();
      window.location.href = '/';
    }
  }

  setUser(userData) {
    this.user = userData;
    localStorage.setItem('user', JSON.stringify(userData));
    this.updateUI();
  }

  clearUser() {
    this.user = null;
    localStorage.removeItem('user');
    this.updateUI();
  }

  isAuthenticated() {
    return this.user !== null && localStorage.getItem('accessToken') !== null;
  }

  isPremium() {
    return this.user && this.user.subscription && this.user.subscription.tier === 'premium';
  }

  getUser() {
    return this.user;
  }

  updateUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const accountBtn = document.getElementById('accountBtn');

    if (!authButtons || !userMenu) return;

    if (this.isAuthenticated()) {
      authButtons.classList.add('hidden');
      userMenu.classList.remove('hidden');
      
      if (accountBtn && this.user) {
        accountBtn.textContent = this.user.username;
      }
    } else {
      authButtons.classList.remove('hidden');
      userMenu.classList.add('hidden');
    }
  }

  requireAuth(redirectUrl = '/pages/login.html') {
    if (!this.isAuthenticated()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  requirePremium(redirectUrl = '/pages/subscription.html') {
    if (!this.isPremium()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }
}

// Create global instance
window.auth = new AuthManager();

// Logout button handler
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        auth.logout();
      }
    });
  }
});
