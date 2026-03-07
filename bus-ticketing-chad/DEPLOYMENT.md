# Production Deployment Guide

## Overview

This guide covers deploying the Bus Tchad ticketing system to production in Chad. The system is designed for:
- Unstable internet connections
- Mobile-first usage
- Manual administrative overrides
- WhatsApp as primary communication

## Infrastructure Requirements

### Minimum Server Specifications

**Backend Server:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- OS: Ubuntu 20.04 LTS or higher
- Network: Stable connection (can be modest bandwidth)

**Database Server (can be same as backend):**
- PostgreSQL 14+
- 2GB dedicated RAM
- 10GB storage

### Recommended Cloud Providers for Chad

1. **Local Options:**
   - Contact local data centers in N'Djamena
   - Consider co-location for better reliability

2. **International Options:**
   - AWS (Africa/South Africa region)
   - DigitalOcean (Frankfurt datacenter - closest to Chad)
   - Linode
   - Vultr

## Pre-Deployment Checklist

### 1. Environment Setup

```bash
# On production server
sudo apt update
sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx as reverse proxy
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE bus_ticketing_chad;
CREATE USER buschad WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bus_ticketing_chad TO buschad;
\q
```

### 3. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/bus-ticketing
cd /var/www/bus-ticketing

# Clone repository
git clone <your-repo-url> .

# Backend setup
cd backend
npm install --production
cp .env.example .env

# Edit .env with production values
nano .env
```

### 4. Production Environment Variables

**Backend `.env`:**

```env
# Database
DATABASE_URL="postgresql://buschad:your_password@localhost:5432/bus_ticketing_chad"

# JWT (generate strong secret)
JWT_SECRET="<generate-with: openssl rand -base64 32>"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=production

# WhatsApp Business API (required)
WHATSAPP_API_URL="https://graph.facebook.com/v18.0"
WHATSAPP_ACCESS_TOKEN="<your-production-whatsapp-token>"
WHATSAPP_PHONE_NUMBER_ID="<your-phone-number-id>"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="<your-production-email>"
SMTP_PASSWORD="<your-app-password>"
SMTP_FROM="Bus Tchad <noreply@buschad.td>"

# Mobile Money (configure with actual provider)
MOMO_API_URL="<production-momo-api-url>"
MOMO_API_KEY="<production-api-key>"
MOMO_MERCHANT_ID="<your-merchant-id>"

# Frontend URL
FRONTEND_URL="https://buschad.td"

# Luggage Configuration
DEFAULT_FREE_LUGGAGE_KG=20
EXTRA_LUGGAGE_FEE_PER_KG=500
```

**Frontend `.env.production`:**

```env
NEXT_PUBLIC_API_URL=https://api.buschad.td/api
```

### 5. Database Migration

```bash
cd /var/www/bus-ticketing/backend

# Run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

### 6. Build Applications

```bash
# Build backend (if using TypeScript) - for JavaScript, skip this
cd /var/www/bus-ticketing/backend
# No build needed for plain Node.js

# Build frontend
cd /var/www/bus-ticketing/frontend
npm install
npm run build
```

### 7. PM2 Process Management

```bash
# Start backend with PM2
cd /var/www/bus-ticketing/backend
pm2 start src/server.js --name bus-backend

# Start frontend with PM2
cd /var/www/bus-ticketing/frontend
pm2 start npm --name bus-frontend -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### 8. Nginx Configuration

Create `/etc/nginx/sites-available/buschad`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.buschad.td;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for slow connections
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Frontend
server {
    listen 80;
    server_name buschad.td www.buschad.td;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/buschad /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. SSL Certificate (HTTPS)

```bash
# Get SSL certificates for both domains
sudo certbot --nginx -d buschad.td -d www.buschad.td
sudo certbot --nginx -d api.buschad.td

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

### 10. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## WhatsApp Business API Setup

### Required Steps:

1. **Create Facebook Business Account:**
   - Go to business.facebook.com
   - Create business account

2. **Set up WhatsApp Business API:**
   - Go to developers.facebook.com
   - Create app → Business → WhatsApp
   - Get Phone Number ID
   - Generate Access Token
   - Add your WhatsApp Business number

3. **Configure Webhook (optional):**
   - Set webhook URL: `https://api.buschad.td/api/whatsapp/webhook`
   - Verify token setup

4. **Test Integration:**
   ```bash
   # Test sending message
   curl -X POST \
     'https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/messages' \
     -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{
       "messaging_product": "whatsapp",
       "to": "23566666666",
       "type": "text",
       "text": {
         "body": "Test message from Bus Tchad"
       }
     }'
   ```

## Mobile Money Integration

### For Airtel Money Chad:

1. Contact Airtel Money Business
2. Register as merchant
3. Obtain API credentials
4. Configure sandbox for testing
5. Move to production after testing

### For Moov Money:

1. Contact Moov Money Chad
2. Complete merchant registration
3. Get API documentation
4. Implement and test
5. Go live

## Monitoring & Logging

### 1. Application Logs

```bash
# View backend logs
pm2 logs bus-backend

# View frontend logs
pm2 logs bus-frontend

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 2. Database Monitoring

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Monitor active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor database size
sudo -u postgres psql -d bus_ticketing_chad -c "\l+"
```

### 3. Set up Log Rotation

Create `/etc/logrotate.d/bus-ticketing`:

```
/var/www/bus-ticketing/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
```

## Backup Strategy

### 1. Database Backups

Create backup script `/usr/local/bin/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/bus-ticketing"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump bus_ticketing_chad | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

Make executable and schedule:

```bash
chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-db.sh
```

### 2. Application Code Backup

```bash
# Backup application files
tar -czf /var/backups/app_backup_$(date +%Y%m%d).tar.gz /var/www/bus-ticketing
```

## Performance Optimization

### 1. Database Indexing

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_trips_date ON trips(departure_date);
CREATE INDEX idx_trips_route ON trips(route_id);
CREATE INDEX idx_passengers_booking ON passengers(booking_id);
```

### 2. Enable Gzip Compression

In Nginx configuration, add:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 3. Caching Strategy

- Cache static assets in Nginx
- Use Redis for session storage (optional)
- Implement API response caching where appropriate

## Security Hardening

### 1. Update System Regularly

```bash
# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 2. Secure PostgreSQL

```sql
-- Change postgres password
ALTER USER postgres WITH PASSWORD 'strong_password';

-- Restrict connections
-- Edit /etc/postgresql/14/main/pg_hba.conf
-- Change 'trust' to 'md5' for local connections
```

### 3. Application Security

- Keep dependencies updated: `npm audit fix`
- Use environment variables for secrets
- Implement rate limiting (already in code)
- Regular security audits

## Troubleshooting

### Issue: Application won't start

```bash
# Check PM2 logs
pm2 logs bus-backend --lines 100
pm2 logs bus-frontend --lines 100

# Check if ports are in use
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :3000
```

### Issue: Database connection fails

```bash
# Test database connection
psql -U buschad -d bus_ticketing_chad -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Issue: WhatsApp messages not sending

- Verify access token is valid
- Check phone number is verified
- Review API rate limits
- Check backend logs for errors

### Issue: Slow performance

```bash
# Check server resources
htop

# Check database performance
sudo -u postgres psql -d bus_ticketing_chad
# Run: EXPLAIN ANALYZE <your-slow-query>

# Check Nginx access logs for slow requests
awk '$NF > 1' /var/log/nginx/access.log
```

## Maintenance Schedule

### Daily:
- Monitor application logs
- Check backup completion
- Verify payment confirmations

### Weekly:
- Review system resources
- Check for security updates
- Analyze booking trends

### Monthly:
- Review and optimize database
- Update dependencies
- Review user feedback
- Test disaster recovery

## Support Contacts

### Technical Issues:
- Backend: Check PM2 logs first
- Database: Check PostgreSQL logs
- Network: Check Nginx logs

### Business Issues:
- Payment providers: Contact support directly
- WhatsApp API: Meta Business Support

## Scaling Considerations

When traffic grows:

1. **Vertical Scaling:**
   - Upgrade server CPU/RAM
   - Optimize database queries
   - Add database connection pooling

2. **Horizontal Scaling:**
   - Add load balancer
   - Deploy multiple backend instances
   - Use managed PostgreSQL (e.g., AWS RDS)
   - Implement Redis for caching

3. **Database Optimization:**
   - Add read replicas
   - Implement query caching
   - Optimize indexes

---

## Post-Deployment Checklist

- [ ] Backend API accessible at https://api.buschad.td
- [ ] Frontend accessible at https://buschad.td
- [ ] SSL certificates installed and valid
- [ ] Database migrations applied
- [ ] Admin account created and accessible
- [ ] Test booking flow end-to-end
- [ ] WhatsApp notifications working
- [ ] Mobile Money payment initiation working
- [ ] Backups scheduled and tested
- [ ] Monitoring set up
- [ ] Firewall configured
- [ ] PM2 startup script enabled
- [ ] Error logging working
- [ ] Performance acceptable on mobile
- [ ] Offline behavior graceful

This deployment guide ensures a production-ready system tailored for Chad's infrastructure challenges.
