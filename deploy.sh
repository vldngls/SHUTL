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
export PATH="./node_modules/.bin:$PATH"

# Function to check if dependencies need to be installed
should_install_deps() {
    local dir=$1
    local lock_file="$dir/package-lock.json"
    local node_modules="$dir/node_modules"
    
    # If node_modules doesn't exist, we need to install
    if [ ! -d "$node_modules" ]; then
        return 0
    fi
    
    # If package-lock.json is newer than node_modules, we need to install
    if [ "$lock_file" -nt "$node_modules" ]; then
        return 0
    fi
    
    return 1
}

# Install backend dependencies if needed
log "📦 Checking backend dependencies..."
cd backend
if should_install_deps .; then
    log "📦 Installing backend dependencies..."
    npm ci --prefer-offline
else
    log "📦 Backend dependencies up to date, skipping installation"
fi
cd ..

# Install frontend dependencies and build
log "📦 Checking frontend dependencies..."
cd frontend
if should_install_deps .; then
    log "📦 Installing frontend dependencies..."
    npm ci --prefer-offline
else
    log "📦 Frontend dependencies up to date, skipping installation"
fi

log "🏗 Building frontend..."
npm run build

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