#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process..."

# Function to log messages with timestamps
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

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

# Function to handle errors
handle_error() {
    log "❌ Error occurred on line $1"
    log "Cleaning up..."
    # Cleanup code here
    if [ -d "$NPM_CACHE_DIR" ]; then
        rm -rf "$NPM_CACHE_DIR"
    fi
    if [ -d "build_artifacts" ]; then
        rm -rf build_artifacts
    fi
    exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Pull latest changes (force sync with remote)
log "📡 Pulling latest changes..."
git fetch --all
git reset --hard origin/deployment

# Create a temporary directory for npm cache
NPM_CACHE_DIR="/tmp/npm_cache_$(date +%s)"
mkdir -p "$NPM_CACHE_DIR"

# Export npm cache directory and conservative memory limits
export npm_config_cache="$NPM_CACHE_DIR"
export NODE_OPTIONS="--max-old-space-size=4096"  # Reduced to 4GB for stability
export VITE_MAX_WORKERS=1  # Single worker for stability
export NODE_ENV=production

# Function to install dependencies with caching and verification
install_deps() {
    local dir=$1
    if check_changes "$dir"; then
        log "📦 Installing dependencies in $dir..."
        cd "$dir"
        # Install with strict peer dependencies and verify
        npm ci --prefer-offline --no-audit --strict-peer-dependencies
        # Verify installation
        if [ ! -d "node_modules" ]; then
            log "❌ node_modules directory not found after installation"
            exit 1
        fi
        cd ..
    else
        log "📦 Skipping dependency installation in $dir (no changes detected)"
    fi
}

# Run backend and frontend installations sequentially for stability
log "🛠 Installing dependencies..."
install_deps "backend"
install_deps "frontend"

# Frontend build with conservative settings
log "📦 Building frontend..."
cd frontend

# Clean install dependencies
log "📦 Performing clean installation of dependencies..."
rm -rf node_modules
rm -f package-lock.json
npm install
npm install -D vite @vitejs/plugin-react

# Clean previous build artifacts
log "🧹 Cleaning previous build..."
rm -rf dist
rm -rf node_modules/.vite

# Run build with conservative settings
log "🏗 Building with conservative settings..."
# Run build in a subshell to handle potential memory issues
(
    npm run build -- --mode production
    BUILD_EXIT_CODE=$?
    if [ $BUILD_EXIT_CODE -eq 0 ]; then
        log "✅ Frontend build completed successfully"
        # Verify build artifacts
        if [ ! -d "dist" ]; then
            log "❌ dist directory not found after build"
            exit 1
        fi
        if [ ! -f "dist/index.html" ]; then
            log "❌ index.html not found in dist directory"
            exit 1
        fi
        # Move build artifacts to a safe location before cleanup
        mkdir -p ../build_artifacts
        cp -r dist/* ../build_artifacts/
    else
        log "❌ Frontend build failed with exit code $BUILD_EXIT_CODE"
        exit $BUILD_EXIT_CODE
    fi
) || {
    log "❌ Frontend build failed! Exiting...";
    exit 1;
}

cd ..

# If we have build artifacts, move them to the correct location
if [ -d "build_artifacts" ]; then
    log "📦 Moving build artifacts to final location..."
    rm -rf frontend/dist
    mkdir -p frontend/dist
    cp -r build_artifacts/* frontend/dist/
    rm -rf build_artifacts
fi

# Verify final build location
if [ ! -d "frontend/dist" ] || [ ! -f "frontend/dist/index.html" ]; then
    log "❌ Final build verification failed"
    exit 1
fi

# Restart services with PM2 (without reinstalling)
log "🔄 Restarting services..."
pm2 restart all --update-env
pm2 save

# Verify PM2 status
if ! pm2 list | grep -q "online"; then
    log "❌ Some PM2 processes are not online"
    exit 1
fi

# Reload nginx
log "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Verify nginx status
if ! sudo systemctl is-active --quiet nginx; then
    log "❌ Nginx is not running after reload"
    exit 1
fi

# Cleanup npm cache
log "🧹 Cleaning up temporary files..."
rm -rf "$NPM_CACHE_DIR"

log "✅ Deployment complete!"