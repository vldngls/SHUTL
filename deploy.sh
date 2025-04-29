#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process..."

# Function to log messages with timestamps
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors
handle_error() {
    log "❌ Error occurred on line $1"
    log "Cleaning up..."
    if [ -d "build_artifacts" ]; then
        rm -rf build_artifacts
    fi
    exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Pull latest changes
log "📡 Pulling latest changes..."
git fetch --all
git reset --hard origin/deployment

# Set environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"

# Install backend dependencies
log "📦 Installing backend dependencies..."
cd backend
npm ci --prefer-offline
cd ..

# Install frontend dependencies and build
log "📦 Installing frontend dependencies..."
cd frontend
npm ci --prefer-offline

log "🏗 Building frontend..."
npm run build -- --mode production

# Verify build artifacts
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    log "❌ Build verification failed"
    exit 1
fi
cd ..

# Restart services
log "🔄 Restarting services..."
pm2 restart all --update-env
pm2 save

# Reload nginx
log "🔄 Reloading nginx..."
sudo systemctl reload nginx

log "✅ Deployment complete!"