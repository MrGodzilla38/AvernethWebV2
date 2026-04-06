#!/bin/bash

# Server Setup Script for Averneth Web
# Run this script on the server to prepare it for deployment

set -e

echo "🔧 Setting up server for Averneth Web deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    print_warning "Node.js is already installed: $(node --version)"
fi

# Install PM2
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    print_warning "PM2 is already installed: $(pm2 --version)"
fi

# Install Nginx
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
else
    print_warning "Nginx is already installed: $(nginx -v)"
fi

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p /var/www/averneth-web
chown -R $SUDO_USER:$SUDO_USER /var/www/averneth-web

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/averneth-web << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static/ {
        alias /var/www/averneth-web/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/averneth-web /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

# Setup PM2 startup
print_status "Setting up PM2 startup..."
pm2 startup
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

# Create log directory
mkdir -p /var/log
chmod 755 /var/log

# Check MySQL connection
print_status "Checking MySQL connection..."
if command -v mysql &> /dev/null; then
    if mysql -u root -e "USE nLogin;" 2>/dev/null; then
        print_status "MySQL nLogin database found and accessible"
    else
        print_warning "MySQL nLogin database not found. Please ensure it exists before deployment."
    fi
else
    print_warning "MySQL is not installed. Please install MySQL and create nLogin database."
fi

# Check if API server is running
print_status "Checking API server..."
if curl -f http://localhost:3001 2>/dev/null; then
    print_status "API server is running on port 3001"
else
    print_warning "API server is not running on port 3001. Please start it before deployment."
fi

# Open firewall ports if UFW is available
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

print_status "✅ Server setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Deploy the application using: ./scripts/deploy.sh"
print_status "2. Configure your domain name in Nginx configuration"
print_status "3. Set up SSL certificate with: certbot --nginx -d your-domain.com"
print_status ""
print_status "Server is ready for Averneth Web deployment!"
