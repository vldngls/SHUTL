#!/bin/bash

echo "🚀 Starting deployment process..."

# Function to check if files have changed
check_changes() {
    local dir=$1
    local last_hash_file=".last_${dir}_hash"
    local current_hash=$(find $dir -type f -name "package.json" -o -name "package-lock.json" | sort | xargs cat | md5sum | cut -d' ' -f1)
    
    if [ -f "$last_hash_file" ]; then
        local last_hash=$(cat "$last_hash_file")
        if [ "$current_hash" = "$last_hash" ]; then
            return 1  # No changes
        fi
    fi
    
    echo "$current_hash" > "$last_hash_file"
    return 0  # Changes detected
}

# Pull latest changes (force sync with remote)
echo "📡 Pulling latest changes..."
git fetch --all
git reset --hard origin/deployment  # ⚠️ WARNING: This will discard local changes!

# Create a temporary directory for npm cache
NPM_CACHE_DIR="/tmp/npm_cache_$(date +%s)"
mkdir -p "$NPM_CACHE_DIR"

# Export npm cache directory and increase memory limits
export npm_config_cache="$NPM_CACHE_DIR"
export NODE_OPTIONS="--max-old-space-size=8192"  # Increased to 8GB
export VITE_MAX_WORKERS=2  # Reduced to 2 workers to prevent memory issues
export NODE_ENV=production

# Function to install dependencies with caching
install_deps() {
    local dir=$1
    if check_changes "$dir"; then
        echo "📦 Installing dependencies in $dir..."
        cd "$dir"
        npm ci --prefer-offline --no-audit
        cd ..
    else
        echo "📦 Skipping dependency installation in $dir (no changes detected)"
    fi
}

# Run backend and frontend installations in parallel
echo "🛠 Installing dependencies..."
(install_deps "backend") &
(install_deps "frontend") &
wait

# Frontend build with optimized settings
echo "📦 Building frontend..."
cd frontend

# Clean previous build artifacts
echo "🧹 Cleaning previous build..."
rm -rf dist
rm -rf node_modules/.vite

# Run build with optimized settings
echo "🏗 Building with optimized settings..."
# Run build in a subshell to handle potential memory issues
(
    npm run build -- --profile --mode production
    BUILD_EXIT_CODE=$?
    if [ $BUILD_EXIT_CODE -eq 0 ]; then
        echo "✅ Frontend build completed successfully"
        # Move build artifacts to a safe location before cleanup
        mkdir -p ../build_artifacts
        cp -r dist/* ../build_artifacts/
    else
        echo "❌ Frontend build failed with exit code $BUILD_EXIT_CODE"
        exit $BUILD_EXIT_CODE
    fi
) || {
    echo "❌ Frontend build failed! Exiting...";
    exit 1;
}

cd ..

# If we have build artifacts, move them to the correct location
if [ -d "build_artifacts" ]; then
    echo "📦 Moving build artifacts to final location..."
    rm -rf frontend/dist
    mkdir -p frontend/dist
    cp -r build_artifacts/* frontend/dist/
    rm -rf build_artifacts
fi

# Restart services with PM2 (without reinstalling)
echo "🔄 Restarting services..."
pm2 restart all --update-env
pm2 save

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Cleanup npm cache
echo "🧹 Cleaning up temporary files..."
rm -rf "$NPM_CACHE_DIR"

echo "✅ Deployment complete!"
