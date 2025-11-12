/**
 * Theme Manager
 * Handles dark/light theme switching
 */

class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'dark';
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupToggle();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    this.updateIcon();
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  updateIcon() {
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.textContent = this.theme === 'dark' ? '🌙' : '☀️';
    }
  }

  setupToggle() {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.toggleTheme());
    }
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();
