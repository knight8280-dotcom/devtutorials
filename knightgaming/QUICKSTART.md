# ⚡ Quick Start Guide

Get KnightGaming running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MongoDB installed and running
- Git installed

## Installation

### 1. Get the Code

```bash
# Clone or extract the repository
cd knightgaming
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your API keys
# At minimum, set these:
# - JWT_SECRET (generate a random 32+ character string)
# - JWT_REFRESH_SECRET (generate another random 32+ character string)
# - ADMIN_PASSWORD (change from default)
```

**Quick Secret Generation**:
```bash
# Generate JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up Database

```bash
# Make sure MongoDB is running
sudo systemctl start mongod  # Linux
# or brew services start mongodb-community  # Mac

# Seed the database with sample data
cd backend
npm run seed
cd ..
```

You should see output confirming:
- Admin user created
- Sample users created
- Games added
- News articles added
- Reviews and leaderboards populated

### 5. Start the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npx http-server -p 8080
```

### 6. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Status**: http://localhost:3000/status

## Default Credentials

```
Admin Account:
Email: admin@knightgaming.com
Password: Admin123!ChangeMe

Sample User:
Email: gamer@example.com
Password: Password123!
```

## Testing the Application

1. **Homepage**: Visit http://localhost:8080
2. **Login**: Click "Login" and use admin credentials
3. **View Games**: Navigate to "Live Stats"
4. **Check News**: Navigate to "News"
5. **Admin Panel**: Access http://localhost:8080/pages/admin.html (admin only)

## Optional: Enable Full Features

To enable all features, you'll need API keys (all free to start):

### 1. Steam API (Free, Unlimited)
- Get key: https://steamcommunity.com/dev/apikey
- Add to `.env`: `STEAM_API_KEY=your_key`

### 2. RAWG API (Free, 20k requests/month)
- Get key: https://rawg.io/apidocs
- Add to `.env`: `RAWG_API_KEY=your_key`

### 3. NewsAPI (Free, 100 requests/day)
- Get key: https://newsapi.org/
- Add to `.env`: `NEWS_API_KEY=your_key`

### 4. OpenAI (Paid, ~$0.002 per request)
- Get key: https://platform.openai.com/api-keys
- Add to `.env`: `OPENAI_API_KEY=your_key`

### 5. Stripe (Free test mode)
- Create account: https://stripe.com
- Get test keys: https://dashboard.stripe.com/apikeys
- Add to `.env`:
  ```
  STRIPE_SECRET_KEY=sk_test_your_key
  STRIPE_PUBLISHABLE_KEY=pk_test_your_key
  ```

## Running with Docker (Alternative)

If you prefer Docker:

```bash
# Start all services
docker-compose up -d

# Seed database
docker-compose exec backend npm run seed

# View logs
docker-compose logs -f

# Access application
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

## Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB
sudo systemctl start mongod

# Verify it's running
sudo systemctl status mongod
```

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=3001
```

### Cannot Connect to Backend
- Make sure backend is running on port 3000
- Check `API_BASE_URL` in `frontend/public/js/api.js`
- Verify no firewall is blocking the connection

### No Games Showing
- Make sure you ran `npm run seed`
- Check backend logs for errors
- Verify MongoDB is running and accessible

## Next Steps

1. **Add Real Data**: Run worker scripts to fetch live data
   ```bash
   cd backend
   npm run worker:games
   npm run worker:counts
   npm run worker:news
   ```

2. **Customize**: Edit frontend files in `frontend/` directory

3. **API Testing**: Import `tests/postman_collection.json` into Postman

4. **Deploy**: Follow deployment guide in README.md

## Need Help?

- Read the full README.md for detailed documentation
- Check logs in `backend/logs/` for errors
- Review API endpoints at http://localhost:3000/api

## Common First-Time Issues

1. **"Cannot find module"**: Run `npm install` in backend directory
2. **"MongoDB connection failed"**: Start MongoDB service
3. **"Port 3000 in use"**: Change PORT in .env or kill existing process
4. **"Invalid API key"**: Check API keys in .env (many features work without keys)
5. **"CORS error"**: Make sure backend is running and CORS_ORIGIN in .env matches frontend URL

---

**You're all set!** 🎉

Visit http://localhost:8080 to start using KnightGaming!
