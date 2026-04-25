# AvernethWebV2 Deployment Guide

## Server Structure
- **API Server**: `/opt/averneth-api/` (Node.js/Express on port 5001)
- **Web Frontend**: `/var/www/averneth/` (Static files)
- **New Next.js App**: `/var/www/AvernethWebV2/` (This project)

## Prerequisites
```bash
# Install Node.js 18+ if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx if not already installed
sudo apt update
sudo apt install nginx
```

## Deployment Steps

### 1. Upload Project Files
```bash
# Upload your AvernethWebV2 project to /var/www/
cd /var/www/
# Upload your project here (should create /var/www/AvernethWebV2/)
```

### 2. Install Dependencies
```bash
cd /var/www/AvernethWebV2
npm install --production
```

### 3. Configure Environment
```bash
# Copy production environment file
cp .env.production .env.local

# Edit if needed
nano .env.local
```

**Important**: Ensure debug logging is disabled in production (default):
```env
DEBUG=false
NEXT_PUBLIC_DEBUG=false
```

### 4. Build the Application
```bash
npm run build:prod
```

### 5. Start with PM2
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 6. Configure Nginx
Create Nginx configuration: `/etc/nginx/sites-available/AvernethWebV2`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:5000;
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
        proxy_pass http://localhost:5001;
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
        alias /var/www/AvernethWebV2/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/AvernethWebV2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Management Commands

### PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs AvernethWebV2

# Restart application
pm2 restart AvernethWebV2

# Stop application
pm2 stop AvernethWebV2

# Monitor application
pm2 monit
```

### Update Deployment
```bash
cd /var/www/AvernethWebV2
git pull origin main  # or upload new files
npm install --production
npm run build:prod
pm2 restart AvernethWebV2
```

## Environment Variables

The application uses these key environment variables (configured in `.env.production`):

- **Database**: MySQL connection settings for nLogin database
- **JWT**: Authentication token configuration
- **API**: Connection to backend API at localhost:5001
- **CORS**: Cross-origin settings for production domain
- **Debug**: `DEBUG` (server-side) and `NEXT_PUBLIC_DEBUG` (client-side) log control

### Debug Logging in Production

For performance and security, keep debug logging **disabled** in production:

```env
DEBUG=false          # Disables API/route console logs
NEXT_PUBLIC_DEBUG=false  # Disables browser console logs
```

If you need to enable logs temporarily for troubleshooting:
1. Edit `.env.local`: Set `DEBUG=true` and/or `NEXT_PUBLIC_DEBUG=true`
2. Restart the application: `pm2 restart AvernethWebV2`
3. Check logs: `pm2 logs AvernethWebV2`
4. Remember to disable and restart after debugging

## Troubleshooting

### Check Application Status
```bash
pm2 status
pm2 logs AvernethWebV2 --lines 50
```

### Check Nginx Configuration
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Check Database Connection
```bash
mysql -u root -p -e "USE nLogin; SHOW TABLES;"
```

### Port Conflicts
Ensure ports 5000 (frontend) and 5001 (API) are available:
```bash
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :5001
```

## Security Notes

1. **Firewall**: Ensure only necessary ports are open
2. **SSL**: Configure SSL certificates with Let's Encrypt
3. **Database**: Use strong MySQL passwords
4. **JWT**: Change the JWT_SECRET in production
5. **Debug Logs**: Keep `DEBUG` and `NEXT_PUBLIC_DEBUG` set to `false` in production
6. **Updates**: Keep Node.js and dependencies updated

## SSL Configuration (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

This deployment setup ensures your Next.js application runs seamlessly alongside the existing API server.
