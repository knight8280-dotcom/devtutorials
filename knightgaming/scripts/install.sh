#!/bin/bash

###############################################################################
# KnightGaming Installation Script for Ubuntu VPS (Hostinger)
# This script installs and configures all necessary dependencies
###############################################################################

set -e

echo "========================================="
echo "KnightGaming Installation Script"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB
echo "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Install Redis
echo "Installing Redis..."
apt install -y redis-server

# Configure Redis
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
systemctl restart redis
systemctl enable redis

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Install Nginx
echo "Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
echo "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install Git
echo "Installing Git..."
apt install -y git

# Create application directory
echo "Creating application directory..."
mkdir -p /var/www/knightgaming
chown -R $SUDO_USER:$SUDO_USER /var/www/knightgaming

# Configure firewall
echo "Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow 'OpenSSH'
ufw --force enable

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository to /var/www/knightgaming"
echo "2. Copy .env.example to .env and configure your environment variables"
echo "3. Run 'cd /var/www/knightgaming/backend && npm install'"
echo "4. Run 'npm run seed' to populate the database"
echo "5. Run 'pm2 start backend/server.js --name knightgaming-api'"
echo "6. Configure Nginx to serve your frontend"
echo "7. Set up SSL with: certbot --nginx -d yourdomain.com"
echo ""
echo "MongoDB is running on localhost:27017"
echo "Redis is running on localhost:6379"
echo ""
