#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process..."

# Function to check if npm install is needed
needs_install() {
    local dir=$1
    # If node_modules doesn't exist, we need to install
    if [ ! -d "$dir/node_modules" ]; then
        return 0
    fi
    # If package-lock.json doesn't exist, we need to install
    if [ ! -f "$dir/package-lock.json" ]; then
        return 0
    fi
    # Store current package-lock.json content hash
    local current_hash=$(md5sum "$dir/package-lock.json" | awk '{print $1}')
    # Pull latest without changing working directory
    git fetch origin deployment
    # Get hash of package-lock.json from deployment branch
    local new_hash=$(git show origin/deployment:"$dir/package-lock.json" | md5sum | awk '{print $1}')
    # Compare hashes
    if [ "$current_hash" != "$new_hash" ]; then
        return 0
    fi
    return 1
}

# Pull latest changes
echo "📡 Pulling latest changes..."
git fetch --all
git reset --hard origin/deployment

# Check and install backend dependencies if needed
cd backend
if needs_install .; then
    echo "📦 Installing backend dependencies..."
    NODE_OPTIONS="--max-old-space-size=1024" npm install
fi
cd ..

# Check and install frontend dependencies if needed
cd frontend
if needs_install .; then
    echo "📦 Installing frontend dependencies..."
    NODE_OPTIONS="--max-old-space-size=1024" npm install
fi

# Build frontend with reduced chunk size and memory optimizations
echo "🏗 Building frontend..."
export NODE_OPTIONS="--max-old-space-size=1024"
# Run build in production mode with optimizations
VITE_BUILD_CHUNKS=20 VITE_BUILD_MEMORY_LIMIT=800 npm run build -- --mode production --emptyOutDir

cd ..

# Restart PM2 and nginx
echo "🔄 Restarting services..."
pm2 restart all --update-env
pm2 save
sudo systemctl reload nginx

echo "✅ Deployment complete!"