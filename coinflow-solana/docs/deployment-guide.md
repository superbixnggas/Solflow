# CoinFlow Solana - Deployment Guide

Panduan lengkap untuk deployment aplikasi CoinFlow Solana ke production environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Worker Setup](#worker-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Security Checklist](#security-checklist)

## Prerequisites

### Required Services

1. **VPS/Server** (untuk backend & worker)
   - Ubuntu 22.04 LTS atau lebih baru
   - Minimal 2GB RAM
   - 20GB storage
   - Recommended: DigitalOcean, AWS EC2, atau Hetzner

2. **PostgreSQL Database**
   - PostgreSQL 14+
   - Option 1: Self-hosted di VPS yang sama
   - Option 2: Managed service (Supabase, Railway, Neon)

3. **Redis** (Optional, untuk caching)
   - Redis 6+
   - Option 1: Self-hosted
   - Option 2: Managed service (Upstash, Railway)

4. **Domain & SSL**
   - Domain untuk API backend
   - SSL certificate (Let's Encrypt gratis via Certbot)

5. **API Keys**
   - Helius API key (gratis tier available)
   - Jupiter API (tidak perlu key)
   - Pyth API (tidak perlu key)

## Database Setup

### Option 1: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE coinflow_solana;
CREATE USER coinflow_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE coinflow_solana TO coinflow_user;
\q
```

### Option 2: Managed Database (Supabase)

1. Buat project di [Supabase](https://supabase.com)
2. Copy connection string dari Settings > Database
3. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### Option 3: Railway/Neon

1. Buat database di [Railway](https://railway.app) atau [Neon](https://neon.tech)
2. Copy connection string yang diberikan

## Backend Deployment

### Step 1: Prepare Server

```bash
# SSH ke server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Deploy Backend Code

```bash
# Clone repository
git clone <your-repo-url>
cd coinflow-solana/backend

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
nano .env
```

Konfigurasi `.env` untuk production:

```env
PORT=3001
NODE_ENV=production

# Database - gunakan connection string dari setup sebelumnya
DATABASE_URL="postgresql://user:password@host:5432/database"

# Solana RPC
SOLANA_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY"
NETWORK=mainnet-beta

# APIs
JUPITER_API_URL="https://quote-api.jup.ag/v6"
PYTH_API_URL="https://hermes.pyth.network/v2"

# Redis (jika menggunakan)
REDIS_URL="redis://localhost:6379"
ENABLE_CACHE=true

# Worker
REBALANCE_CRON_SCHEDULE="*/5 * * * *"

# CORS - ganti dengan domain frontend Anda
ALLOWED_ORIGINS="https://your-frontend-domain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Build & Run Migrations

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma migrate deploy

# Build backend
pnpm build
```

### Step 4: Start with PM2

```bash
# Start backend
pm2 start dist/index.js --name coinflow-backend

# Start worker (optional, bisa digabung dengan backend)
pm2 start dist/workers/rebalanceWorker.js --name coinflow-worker

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow instructions yang muncul
```

### Step 5: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/coinflow-api
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/coinflow-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Setup SSL with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is setup automatically
```

## Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

cd coinflow-frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Environment variables di Vercel dashboard:
- `VITE_API_URL`: `https://api.yourdomain.com/api`
- `VITE_SOLANA_RPC_URL`: Your RPC URL
- `VITE_NETWORK`: `mainnet-beta`

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

cd coinflow-frontend

# Build
pnpm build

# Deploy
netlify deploy --prod
```

### Option 3: Self-Hosted (Nginx)

```bash
cd coinflow-frontend

# Update .env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_NETWORK=mainnet-beta

# Build
pnpm build

# Copy to server
scp -r dist/* user@server:/var/www/coinflow-frontend/
```

Nginx config untuk frontend:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/coinflow-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Worker Setup

Worker sudah berjalan jika Anda menggunakan PM2 setup di atas. Untuk monitoring:

```bash
# Check worker logs
pm2 logs coinflow-worker

# Restart worker
pm2 restart coinflow-worker

# Monitor
pm2 monit
```

## Monitoring & Maintenance

### Logging

```bash
# View backend logs
pm2 logs coinflow-backend

# Save logs to file
pm2 logs coinflow-backend > logs.txt

# Monitor in real-time
pm2 monit
```

### Database Monitoring

```bash
# Connect to database
psql $DATABASE_URL

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT count(*) FROM pg_stat_activity;
```

### Health Checks

Setup monitoring dengan UptimeRobot atau similar:
- Endpoint: `https://api.yourdomain.com/health`
- Interval: 5 minutes
- Alert via email/SMS jika down

### Backups

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload to S3 or backup storage

# Setup cron job
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

## Security Checklist

- [ ] Environment variables tidak di-commit ke git
- [ ] PostgreSQL password kuat (20+ karakter)
- [ ] Firewall aktif, hanya port 22, 80, 443 terbuka
- [ ] SSH key-based authentication, disable password login
- [ ] SSL certificate aktif dan auto-renewal setup
- [ ] CORS dikonfigurasi dengan domain spesifik
- [ ] Rate limiting aktif
- [ ] Database backups otomatis
- [ ] PM2 startup script setup
- [ ] Monitoring & alerts aktif

## Troubleshooting

### Backend tidak start
```bash
# Check logs
pm2 logs coinflow-backend

# Check port
sudo netstat -tulpn | grep 3001

# Restart
pm2 restart coinflow-backend
```

### Database connection error
```bash
# Test connection
psql $DATABASE_URL

# Check Prisma
cd backend
pnpm prisma:generate
```

### Frontend tidak load
```bash
# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

## Performance Optimization

### Backend
- Enable Redis caching
- Use connection pooling (sudah dikonfigurasi di Prisma)
- Optimize database indexes
- Enable gzip compression di Nginx

### Frontend
- Enable Vercel/Netlify CDN
- Lazy load components
- Optimize images
- Enable browser caching

## Scaling

Jika traffic meningkat:

1. **Horizontal scaling**: Deploy multiple backend instances dengan load balancer
2. **Database**: Upgrade ke managed PostgreSQL dengan read replicas
3. **Caching**: Implement Redis untuk price data
4. **CDN**: Use Cloudflare untuk frontend assets

## Updates & Maintenance

```bash
# Update backend
cd backend
git pull
pnpm install
pnpm build
pm2 restart coinflow-backend

# Update frontend
cd coinflow-frontend
git pull
pnpm install
pnpm build
# Deploy ke Vercel/Netlify atau copy ke Nginx
```

## Support

Jika ada masalah saat deployment:
1. Check logs di PM2
2. Verify environment variables
3. Test API endpoints dengan curl
4. Check database connectivity
5. Review Nginx error logs

---

**Deployment Checklist Summary**:
1. Setup database (PostgreSQL)
2. Deploy backend ke VPS dengan PM2
3. Configure Nginx reverse proxy
4. Setup SSL with Certbot
5. Deploy frontend ke Vercel/Netlify
6. Configure environment variables
7. Test semua endpoints
8. Setup monitoring & backups
9. Review security checklist

Selamat! Aplikasi CoinFlow Solana Anda sekarang live di production.
