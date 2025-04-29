#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process..."

# Function to check if npm install is needed
needs_install() {
    local dir=$1
    if [ ! -d "$dir/node_modules" ]; then
        return 0
    fi
    if [ ! -f "$dir/package-lock.json" ]; then
        return 0
    fi
    if [ "$dir/package.json" -nt "$dir/node_modules" ]; then
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
    npm install
fi
cd ..

# Check and install frontend dependencies if needed
cd frontend
if needs_install .; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build frontend
echo "🏗 Building frontend..."
npm run build

cd ..

# Restart PM2 and nginx
echo "🔄 Restarting services..."
pm2 restart all --update-env
pm2 save
sudo systemctl reload nginx

# Cleanup
echo "🧹 Cleaning up..."
# Clean npm cache
npm cache clean --force
# Remove any temp files
find . -type d -name ".temp" -exec rm -rf {} +
find . -type d -name ".cache" -exec rm -rf {} +
# Clean git objects
git gc --prune=now

echo "✅ Deployment complete!"