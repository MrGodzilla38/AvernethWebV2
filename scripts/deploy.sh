#!/bin/bash

# AvernethWebV2 Deployment Script
# This script deploys the application to the production server

set -e  # Exit on any error

# Configuration
SERVER_HOST="your-server-ip"
SERVER_USER="root"
SERVER_PATH="/var/www/AvernethWebV2"
LOCAL_PATH="$(pwd)"

echo "🚀 Starting AvernethWebV2 deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if SSH key is available
if [ ! -f "$HOME/.ssh/id_rsa" ]; then
    print_warning "SSH key not found at ~/.ssh/id_rsa"
    print_warning "Make sure you have SSH access to the server"
fi

print_status "Building application for production..."

# Install dependencies
npm ci --only=production

# Build the application
npm run build:prod

print_status "Connecting to server and deploying..."

# Create deployment directory if it doesn't exist
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH" || {
    print_error "Failed to connect to server. Check your SSH configuration."
    exit 1
}

# Sync files to server (excluding unnecessary files)
print_status "Syncing files to server..."
rsync -avz --delete \
    --exclude='.git*' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='scripts/' \
    ./ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Install dependencies on server
print_status "Installing dependencies on server..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && npm install --production"

# Set up environment file
print_status "Setting up environment..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && cp .env.production .env.local"

# Build on server
print_status "Building on server..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && npm run build:prod"

# Restart application with PM2
print_status "Restarting application..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && pm2 restart AvernethWebV2 || pm2 start ecosystem.config.js"

# Save PM2 configuration
ssh $SERVER_USER@$SERVER_HOST "pm2 save"

# Health check
print_status "Performing health check..."
sleep 10

if curl -f http://$SERVER_HOST:3000 > /dev/null 2>&1; then
    print_status "✅ Deployment completed successfully!"
    print_status "Application is running at: http://$SERVER_HOST:3000"
else
    print_error "❌ Health check failed. Application may not be running properly."
    print_error "Please check the logs on the server: pm2 logs AvernethWebV2"
    exit 1
fi

print_status "🎉 AvernethWebV2 deployment completed!"
print_status "To view logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs AvernethWebV2'"
print_status "To manage: ssh $SERVER_USER@$SERVER_HOST 'pm2 list'"
