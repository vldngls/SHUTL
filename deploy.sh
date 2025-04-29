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
    cleanup_swap
    if [ -d "build_artifacts" ]; then
        rm -rf build_artifacts
    fi
    exit 1
}

# Function to setup swap
setup_swap() {
    log "🔧 Setting up additional swap space..."
    # Clean up any existing swapfile2 first
    if [ -f "/swapfile2" ]; then
        sudo swapoff /swapfile2 2>/dev/null || true
        sudo rm -f /swapfile2
    fi
    # Create new swap
    sudo fallocate -l 2G /swapfile2
    sudo chmod 600 /swapfile2
    sudo mkswap /swapfile2
    sudo swapon /swapfile2
}

# Function to cleanup swap
cleanup_swap() {
    log "🧹 Cleaning up swap space..."
    if [ -f "/swapfile2" ]; then
        sudo swapoff /swapfile2 2>/dev/null || true
        sudo rm -f /swapfile2
    fi
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Pull latest changes
log "📡 Pulling latest changes..."
git fetch --all
git reset --hard origin/deployment

# Set environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"

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

# Setup swap before build
setup_swap

log "🏗 Building frontend..."
npm run build

# Cleanup swap after build
cleanup_swap

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