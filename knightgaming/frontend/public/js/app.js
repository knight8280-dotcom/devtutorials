/**
 * Main Application JavaScript
 * Homepage functionality
 */

// Format numbers with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Load featured games
async function loadFeaturedGames() {
  const container = document.getElementById('featuredGames');
  
  try {
    const response = await api.getFeaturedGames();
    
    if (response.success && response.data.games.length > 0) {
      container.innerHTML = response.data.games.slice(0, 4).map(game => `
        <div class="card">
          <img src="${game.headerImage || 'https://picsum.photos/400/200'}" alt="${game.name}" class="card-img" loading="lazy">
          <div class="card-body">
            <h3 class="card-title">${game.name}</h3>
            <p class="card-text">${game.description ? game.description.substring(0, 100) + '...' : 'No description available'}</p>
            <div class="flex justify-between align-center">
              <span class="badge badge-primary">${game.rating ? game.rating.toFixed(1) + '★' : 'N/A'}</span>
              <a href="/pages/game.html?id=${game._id}" class="btn btn-secondary btn-sm">View Details</a>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="text-center">No featured games available</p>';
    }
  } catch (error) {
    console.error('Error loading featured games:', error);
    container.innerHTML = '<p class="text-center">Error loading games. Please try again later.</p>';
  }
}

// Load trending games
async function loadTrendingGames() {
  const container = document.getElementById('trendingGames');
  
  try {
    const response = await api.getTrendingGames();
    
    if (response.success && response.data.games.length > 0) {
      container.innerHTML = response.data.games.slice(0, 3).map(game => `
        <div class="card">
          <img src="${game.headerImage || 'https://picsum.photos/400/200'}" alt="${game.name}" class="card-img" loading="lazy">
          <div class="card-body">
            <div class="flex justify-between align-center mb-2">
              <h3 class="card-title">${game.name}</h3>
              <span class="badge badge-success">🔥 Trending</span>
            </div>
            <p class="card-text">Current Players: <strong>${formatNumber(game.currentPlayers || 0)}</strong></p>
            <a href="/pages/game.html?id=${game._id}" class="btn btn-primary btn-sm">View Stats</a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="text-center">No trending games available</p>';
    }
  } catch (error) {
    console.error('Error loading trending games:', error);
    container.innerHTML = '<p class="text-center">Error loading games. Please try again later.</p>';
  }
}

// Load latest news
async function loadLatestNews() {
  const container = document.getElementById('latestNews');
  
  try {
    const response = await api.getHeadlines();
    
    if (response.success && response.data.articles.length > 0) {
      container.innerHTML = response.data.articles.slice(0, 3).map(article => `
        <div class="card">
          <img src="${article.featuredImage || 'https://picsum.photos/400/200'}" alt="${article.title}" class="card-img" loading="lazy">
          <div class="card-body">
            <span class="badge badge-primary mb-2">${article.category}</span>
            <h3 class="card-title">${article.title}</h3>
            <p class="card-text text-muted">${formatDate(article.publishedAt)}</p>
            <a href="/pages/article.html?id=${article._id}" class="btn btn-secondary btn-sm">Read More</a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="text-center">No news articles available</p>';
    }
  } catch (error) {
    console.error('Error loading news:', error);
    container.innerHTML = '<p class="text-center">Error loading news. Please try again later.</p>';
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedGames();
  loadTrendingGames();
  loadLatestNews();
});
