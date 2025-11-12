# 🎮 KnightGaming Portal

A production-ready full-stack gaming hub with live player counts, news, leaderboards, reviews, community features, paid subscriptions, and AI-powered content updates.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [API Keys Setup](#api-keys-setup)
- [Database Setup](#database-setup)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [GDPR Compliance](#gdpr-compliance)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- **Live Player Statistics**: Real-time player counts from Steam API
- **Gaming News**: Latest news aggregated from NewsAPI and curated sources
- **Leaderboards**: Competitive rankings with anti-cheat verification
- **User Reviews**: Community-driven game reviews with voting system
- **Community Hub**: User profiles, favorite games, and social features

### Premium Features
- **AI-Powered Summaries**: OpenAI-generated article summaries
- **Trend Highlights**: AI analysis of player count trends
- **Social Post Generator**: AI-powered social media content suggestions
- **Ad-Free Experience**: Clean interface without advertisements
- **Detailed Analytics**: Advanced statistics and insights

### Technical Features
- **Authentication**: JWT-based auth with refresh tokens
- **Stripe Integration**: Subscription payments via Stripe Checkout
- **Rate Limiting**: Protect APIs from abuse
- **Caching Layer**: Redis for improved performance
- **Worker Scripts**: Automated data updates via cron jobs
- **Responsive Design**: Mobile-first modern UI
- **Dark/Light Themes**: User preference theme switching

## 🛠 Tech Stack

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Redis** - Caching layer
- **JWT** - Authentication
- **Stripe** - Payment processing
- **OpenAI API** - AI features
- **Winston** - Logging

### Frontend
- **HTML5/CSS3** - Markup and styling
- **Vanilla JavaScript** - Client-side logic
- **Fetch API** - HTTP requests

### External APIs
- **Steam Web API** - Player counts and game data
- **RAWG.io API** - Game metadata
- **NewsAPI** - Gaming news
- **OpenAI API** - AI content generation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PM2** - Process manager
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL certificates

## 📦 Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** 7.0 or higher
- **Redis** 7.x (optional but recommended)
- **npm** 9.x or higher
- **Git**

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd knightgaming

# Copy environment file
cp .env.example .env

# Edit .env with your API keys (see Environment Configuration)
nano .env

# Start all services
docker-compose up -d

# Seed the database
docker-compose exec backend npm run seed

# Access the application
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

### Manual Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd knightgaming

# Install backend dependencies
cd backend
npm install

# Copy environment file
cp ../.env.example ../.env

# Edit .env with your API keys
nano ../.env

# Start MongoDB and Redis
sudo systemctl start mongod
sudo systemctl start redis

# Seed the database
npm run seed

# Start the backend
npm run dev

# In a new terminal, serve the frontend
cd ../frontend
npx http-server -p 8080

# Access the application
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

## ⚙️ Environment Configuration

Create a `.env` file in the root directory. Use `.env.example` as a template.

### Required Variables

```env
# Server
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:8080

# Database
MONGODB_URI=mongodb://localhost:27017/knightgaming

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long

# Stripe (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_MONTHLY_PRICE_ID=price_your_price_id_here

# OpenAI (Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-key-here

# External APIs
RAWG_API_KEY=your-rawg-key-here
STEAM_API_KEY=your-steam-key-here
NEWS_API_KEY=your-newsapi-key-here

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=ChangeThisPassword123!

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

## 🔑 API Keys Setup

### 1. Stripe (Payment Processing)

**Required for**: Subscription payments

1. Sign up at [Stripe](https://stripe.com)
2. Go to [Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
3. Copy **Secret Key** and **Publishable Key**
4. Create a product and price:
   - Go to [Products](https://dashboard.stripe.com/products)
   - Create a new product "KnightGaming Premium"
   - Add a price: $1.99/month recurring
   - Copy the **Price ID** (starts with `price_`)
5. Set up webhook:
   - Go to [Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Copy **Webhook Signing Secret**

**Test Mode**: Use test keys (starting with `sk_test_` and `pk_test_`) for development

**Costs**: Stripe charges 2.9% + $0.30 per transaction

### 2. OpenAI (AI Features)

**Required for**: AI summaries, trend highlights, social post generation

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Go to [API Keys](https://platform.openai.com/api-keys)
3. Create a new secret key
4. Copy the key (starts with `sk-`)

**Costs**: 
- GPT-3.5-turbo: ~$0.002 per 1,000 tokens
- Estimated cost: $0.10-$1.00 per 1,000 AI requests
- Set `OPENAI_DAILY_LIMIT` to control costs

### 3. RAWG (Game Metadata)

**Required for**: Game information, screenshots, genres

1. Sign up at [RAWG.io](https://rawg.io/apidocs)
2. Get your free API key from the dashboard
3. Free tier: 20,000 requests/month

### 4. Steam Web API (Player Counts)

**Required for**: Live player counts, game details

1. Get your key at [Steam Web API](https://steamcommunity.com/dev/apikey)
2. You need a Steam account
3. Free and unlimited

### 5. NewsAPI (Gaming News)

**Required for**: News articles

1. Sign up at [NewsAPI](https://newsapi.org/)
2. Get your API key
3. Free tier: 100 requests/day (upgrade to paid for more)

## 💾 Database Setup

### MongoDB

The application uses MongoDB for data storage. Sample credentials:

```javascript
// Default admin credentials (created by seed script)
Email: admin@knightgaming.com
Password: Admin123!ChangeMe

// Sample user credentials
Email: gamer@example.com
Password: Password123!
```

### Seed Data

```bash
# Run the seed script to populate sample data
npm run seed

# This creates:
# - Admin user
# - 2 sample users
# - 5 games (CS2, Apex, Dota 2, PUBG, NARAKA)
# - 3 news articles
# - Sample reviews and leaderboard entries
```

### Database Backup

```bash
# Backup
mongodump --db knightgaming --out ./backup

# Restore
mongorestore --db knightgaming ./backup/knightgaming
```

## 💻 Development

### Backend Development

```bash
cd backend

# Development mode with hot reload
npm run dev

# Run worker scripts manually
npm run worker:games
npm run worker:counts
npm run worker:news
npm run worker:reviews

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend Development

The frontend is vanilla HTML/CSS/JS. Any static server will work:

```bash
cd frontend

# Using http-server
npx http-server -p 8080

# Using Python
python3 -m http.server 8080

# Using PHP
php -S localhost:8080
```

### API Testing

Use the included Postman collection:

```bash
# Import tests/postman_collection.json into Postman
# Or use with Newman:
npm install -g newman
newman run tests/postman_collection.json --environment your-env.json
```

## 🧪 Testing

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/auth.test.js

# Watch mode
npm test -- --watch
```

## 🌐 Deployment

### Hostinger VPS Deployment (Recommended)

#### Step 1: Provision VPS

1. Purchase a VPS plan from [Hostinger](https://www.hostinger.com/vps-hosting)
2. Recommended: VPS 2 or higher (4GB RAM minimum)
3. Choose Ubuntu 22.04 LTS
4. Set up SSH access

#### Step 2: Run Installation Script

```bash
# SSH into your server
ssh root@your-server-ip

# Download and run the install script
wget https://raw.githubusercontent.com/your-repo/knightgaming/main/scripts/install.sh
chmod +x install.sh
sudo ./install.sh
```

#### Step 3: Deploy Application

```bash
# Clone your repository
cd /var/www/knightgaming
git clone <your-repo-url> .

# Install dependencies
cd backend
npm install

# Configure environment
cp ../.env.example ../.env
nano ../.env  # Edit with your production values

# Seed database
npm run seed

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/knightgaming

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        root /var/www/knightgaming/frontend;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/knightgaming /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 5: SSL Certificate

```bash
# Install SSL certificate with Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Step 6: Set Up Cron Jobs (Using PM2)

PM2 will automatically manage worker scripts based on `ecosystem.config.js`. The configuration includes:

- **Player Counts**: Every minute
- **Games Update**: Daily at 2 AM
- **News Update**: Every 15 minutes
- **Reviews Import**: Daily at 3 AM

PM2 handles this automatically when you start with:

```bash
pm2 start ecosystem.config.js
```

### Hostinger Shared Hosting (Limited)

⚠️ **Warning**: Shared hosting has significant limitations. VPS is strongly recommended.

**Limitations**:
- Cannot run Node.js backend
- Cannot run worker scripts
- Cannot install MongoDB/Redis

**Workaround**:
1. Host frontend on Hostinger shared hosting
2. Deploy backend to:
   - [Heroku](https://www.heroku.com/) (Free tier available)
   - [Railway](https://railway.app/) (Free tier available)
   - [Render](https://render.com/) (Free tier available)
3. Update `API_BASE_URL` in frontend to point to your backend

### Using Docker in Production

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Stripe Webhook Testing

#### Local Development

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test webhook
stripe trigger checkout.session.completed
```

#### Production

Configure webhook endpoint in Stripe Dashboard:
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: Select all subscription and payment events

## 📚 API Documentation

### Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
GET /api/auth/profile (Protected)
PUT /api/auth/profile (Protected)
```

### Games

```http
GET /api/games
GET /api/games/trending
GET /api/games/featured
GET /api/games/:id
GET /api/games/:id/player-count
GET /api/games/:id/player-count/history
GET /api/games/:id/stats (Premium)
```

### News

```http
GET /api/news
GET /api/news/headlines
GET /api/news/trending
GET /api/news/:id
POST /api/news/:id/like (Protected)
```

### Reviews

```http
GET /api/reviews/game/:gameId
POST /api/reviews (Protected)
PUT /api/reviews/:id (Protected)
DELETE /api/reviews/:id (Protected)
POST /api/reviews/:id/vote (Protected)
```

### Leaderboards

```http
GET /api/leaderboards/game/:gameId
POST /api/leaderboards (Protected)
GET /api/leaderboards/game/:gameId/my-rank (Protected)
```

### Subscriptions

```http
GET /api/subscriptions/plans
POST /api/subscriptions/checkout (Protected)
GET /api/subscriptions/status (Protected)
POST /api/subscriptions/cancel (Protected)
```

### AI Features

```http
POST /api/ai/summarize (Protected)
POST /api/ai/highlight-trends (Protected)
POST /api/ai/social-suggest (Protected)
GET /api/ai/summary/:articleId
```

### Admin

```http
GET /api/admin/dashboard (Admin)
GET /api/admin/users (Admin)
PUT /api/admin/users/:userId/role (Admin)
GET /api/admin/reviews/pending (Admin/Moderator)
PUT /api/admin/reviews/:reviewId/moderate (Admin/Moderator)
POST /api/admin/news (Admin/Moderator)
```

## 📁 Project Structure

```
knightgaming/
├── backend/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   └── redis.js         # Redis connection
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── gamesController.js
│   │   ├── newsController.js
│   │   ├── reviewsController.js
│   │   ├── leaderboardsController.js
│   │   ├── subscriptionsController.js
│   │   ├── aiController.js
│   │   └── adminController.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # Authentication
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── errorHandler.js  # Error handling
│   ├── models/              # Mongoose models
│   │   ├── User.js
│   │   ├── Game.js
│   │   ├── NewsArticle.js
│   │   ├── Review.js
│   │   ├── LeaderboardEntry.js
│   │   ├── SteamPlayerCount.js
│   │   ├── AISummaryCache.js
│   │   └── StripeWebhookEvent.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── games.js
│   │   ├── news.js
│   │   ├── reviews.js
│   │   ├── leaderboards.js
│   │   ├── subscriptions.js
│   │   ├── ai.js
│   │   ├── admin.js
│   │   └── webhooks.js
│   ├── services/            # External API services
│   │   ├── steamService.js
│   │   ├── rawgService.js
│   │   ├── newsService.js
│   │   ├── openaiService.js
│   │   └── stripeService.js
│   ├── utils/               # Utility functions
│   │   ├── logger.js
│   │   ├── jwt.js
│   │   ├── validators.js
│   │   └── email.js
│   ├── workers/             # Cron job workers
│   │   ├── updateGames.js
│   │   ├── updatePlayerCounts.js
│   │   ├── updateNews.js
│   │   └── updateReviews.js
│   ├── package.json
│   └── server.js            # Entry point
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css    # Main stylesheet
│   │   ├── js/
│   │   │   ├── api.js       # API client
│   │   │   ├── auth.js      # Auth manager
│   │   │   ├── theme.js     # Theme switcher
│   │   │   └── app.js       # Main app logic
│   │   └── images/
│   ├── pages/               # Additional HTML pages
│   └── index.html           # Homepage
├── scripts/
│   ├── seed.js              # Database seeder
│   └── install.sh           # VPS installation script
├── tests/
│   ├── auth.test.js         # Auth tests
│   └── postman_collection.json
├── docs/                    # Documentation
├── .env.example             # Environment template
├── .gitignore
├── Dockerfile               # Docker image
├── docker-compose.yml       # Docker Compose config
├── nginx.conf               # Nginx configuration
├── ecosystem.config.js      # PM2 configuration
├── package.json
└── README.md                # This file
```

## 🔐 Security

### Best Practices Implemented

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Rate limiting on all endpoints
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ MongoDB injection prevention
- ✅ Secrets stored in environment variables
- ✅ HTTPS enforced in production
- ✅ Webhook signature verification (Stripe)

### Important Security Notes

1. **Change Default Credentials**: Update admin password immediately after deployment
2. **Use Strong Secrets**: Generate secure JWT secrets (32+ characters)
3. **API Keys**: Never commit API keys to version control
4. **HTTPS Only**: Always use HTTPS in production
5. **Regular Updates**: Keep dependencies up to date
6. **Backup**: Regular database backups
7. **Monitoring**: Monitor logs for suspicious activity

### Generating Secure Secrets

```bash
# Generate JWT secret (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT secret (OpenSSL)
openssl rand -hex 64
```

## 🛡️ GDPR Compliance

### User Data Deletion

Users can delete their account and all associated data:

```http
DELETE /api/auth/account
Authorization: Bearer <token>
Body: { "password": "user_password" }
```

This will:
- Delete user account
- Remove all user-created content (reviews, leaderboard entries)
- Cancel active subscriptions
- Remove personal data

### Data Retention

- User data: Deleted on account deletion
- Player count history: 90 days (auto-deleted)
- AI cache: 24-48 hours
- Logs: 14 days
- Webhook events: 30 days

### Privacy Policy

Include a privacy policy page explaining:
- What data is collected
- How it's used
- How users can request deletion
- Cookie usage

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/knightgaming
```

#### Redis Connection Error

```bash
# Redis is optional, disable if not needed
REDIS_ENABLED=false

# Or start Redis
sudo systemctl start redis
```

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

#### API Key Errors

- Verify all API keys are correctly set in `.env`
- Check API key quotas and rate limits
- Ensure no spaces or quotes around keys

#### Stripe Webhook Failures

```bash
# Check webhook secret is correct
# Verify endpoint URL is accessible
# Check Stripe Dashboard → Webhooks → Recent deliveries
```

### Logs

```bash
# Backend logs
tail -f logs/combined-*.log
tail -f logs/error-*.log

# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f backend
```

## 💰 Cost Estimation

### Monthly Operating Costs

**Minimal Setup (Shared Hosting + External Services)**:
- Hostinger Shared: $3-10/month
- Backend (Railway/Render Free Tier): $0
- MongoDB Atlas Free Tier: $0
- OpenAI (100 requests/day): $3-5/month
- Stripe fees: 2.9% + $0.30 per transaction
- **Total: ~$10-20/month** (excluding Stripe fees)

**Recommended Setup (VPS)**:
- Hostinger VPS 2: $15-25/month
- MongoDB (self-hosted): $0
- Redis (self-hosted): $0
- OpenAI (1000 requests/day): $10-30/month
- Stripe fees: 2.9% + $0.30 per transaction
- **Total: ~$30-60/month** (excluding Stripe fees)

**Production Setup (High Traffic)**:
- Dedicated Server/Cloud: $100-300/month
- MongoDB Atlas: $25-100/month
- Redis Cloud: $5-20/month
- OpenAI (10,000+ requests/day): $50-200/month
- CDN (Cloudflare): $0-20/month
- Stripe fees: 2.9% + $0.30 per transaction
- **Total: ~$200-650/month** (excluding Stripe fees)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@yourdomain.com

## 🙏 Acknowledgments

- [Steam Web API](https://steamcommunity.com/dev)
- [RAWG.io](https://rawg.io/)
- [NewsAPI](https://newsapi.org/)
- [OpenAI](https://openai.com/)
- [Stripe](https://stripe.com/)

---

**⚠️ Important Reminders**

1. **Never commit `.env` file** - Always use `.env.example` as template
2. **Change default credentials** - Update admin password immediately
3. **Test webhooks locally** - Use Stripe CLI for local development
4. **Monitor API costs** - Set limits on OpenAI and other paid services
5. **Regular backups** - Backup database regularly
6. **Update dependencies** - Keep packages up to date for security

**Built with ❤️ by the KnightGaming Team**
