/**
 * API Client
 * Handles all API requests to the backend
 */

const API_BASE_URL = 'http://localhost:3000/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
  }

  // Get auth headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
          await this.refreshToken();
          // Retry the request
          return this.request(endpoint, options);
        }

        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (response.success && response.data.tokens) {
      this.setTokens(response.data.tokens);
    }

    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });

    if (response.success && response.data.tokens) {
      this.setTokens(response.data.tokens);
    }

    return response;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    } finally {
      this.clearTokens();
    }
  }

  setTokens(tokens) {
    this.token = tokens.accessToken;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  clearTokens() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Games API
  async getGames(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/games?${queryString}`);
  }

  async getGame(id) {
    return this.request(`/games/${id}`);
  }

  async getPlayerCount(id) {
    return this.request(`/games/${id}/player-count`);
  }

  async getPlayerCountHistory(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/games/${id}/player-count/history?${queryString}`);
  }

  async getTrendingGames() {
    return this.request('/games/trending');
  }

  async getFeaturedGames() {
    return this.request('/games/featured');
  }

  async searchGames(query) {
    return this.request(`/games/search?q=${encodeURIComponent(query)}`);
  }

  // News API
  async getNews(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/news?${queryString}`);
  }

  async getArticle(id) {
    return this.request(`/news/${id}`);
  }

  async getHeadlines() {
    return this.request('/news/headlines');
  }

  async getTrendingNews() {
    return this.request('/news/trending');
  }

  // Reviews API
  async getGameReviews(gameId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reviews/game/${gameId}?${queryString}`);
  }

  async createReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  async getUserReviews(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reviews/user/my-reviews?${queryString}`);
  }

  // Leaderboards API
  async getLeaderboard(gameId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/leaderboards/game/${gameId}?${queryString}`);
  }

  async submitLeaderboardEntry(entryData) {
    return this.request('/leaderboards', {
      method: 'POST',
      body: JSON.stringify(entryData)
    });
  }

  async getUserRank(gameId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/leaderboards/game/${gameId}/my-rank?${queryString}`);
  }

  // Subscription API
  async getPlans() {
    return this.request('/subscriptions/plans');
  }

  async createCheckout() {
    return this.request('/subscriptions/checkout', {
      method: 'POST'
    });
  }

  async getSubscriptionStatus() {
    return this.request('/subscriptions/status');
  }

  async cancelSubscription() {
    return this.request('/subscriptions/cancel', {
      method: 'POST'
    });
  }

  // AI API
  async generateSummary(text, maxWords = 120) {
    return this.request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ text, maxWords })
    });
  }

  async getArticleSummary(articleId) {
    return this.request(`/ai/summary/${articleId}`);
  }

  async highlightTrend(gameId, timeRange = '48h') {
    return this.request(`/ai/highlight-trends?timeRange=${timeRange}`, {
      method: 'POST',
      body: JSON.stringify({ gameId })
    });
  }

  // User API
  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async updatePreferences(preferences) {
    return this.request('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }
}

// Create global instance
window.api = new APIClient();
