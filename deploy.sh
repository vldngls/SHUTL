#!/bin/bash

echo "🚀 Starting deployment process..."

# Pull latest changes (force sync with remote)
echo "📡 Pulling latest changes..."
git fetch --all
git reset --hard origin/deployment  # ⚠️ WARNING: This will discard local changes!

# Backend setup
echo "🛠 Installing backend dependencies..."
cd backend
npm install
cd ..

# Frontend build
echo "📦 Building frontend..."
cd frontend
npm install

# Increase memory limit to prevent 'JavaScript heap out of memory' error
export NODE_OPTIONS="--max-old-space-size=4096"

npm run build || { echo "❌ Frontend build failed! Exiting..."; exit 1; }

cd ..

# Restart services with PM2 (without reinstalling)
echo "🔄 Restarting services..."
pm2 restart all --update-env
pm2 save

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
