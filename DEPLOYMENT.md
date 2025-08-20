# 🚀 Production Deployment Guide

This guide covers deploying CV Search to production environments without Docker.

## Prerequisites

- Production server with Node.js 18+ support
- Domain name and SSL certificate
- OpenAI API key (production tier)
- Pinecone production account
- Environment variables configured
- Process manager (PM2 recommended)

## Environment Configuration

### Production Environment Variables

```env
# Production settings
NODE_ENV=production
BACKEND_PORT=3001
FRONTEND_PORT=3000

# OpenAI (Production tier recommended)
OPENAI_API_KEY=sk-your-production-openai-key
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-large

# Pinecone (Production environment)
PINECONE_API_KEY=your-production-pinecone-key
PINECONE_ENVIRONMENT=us-east1-aws
PINECONE_INDEX_NAME=cv-search-production

# Security
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=https://yourdomain.com

# Database (Optional - for production persistence)
DATABASE_URL=postgresql://user:password@host:port/database
```

## Production Setup

### 1. Server Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Node.js**: 18.x LTS
- **Memory**: Minimum 2GB RAM
- **Storage**: 20GB+ for CV storage
- **CPU**: 2+ cores recommended

### 2. Install Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PM2 Process Manager

```bash
sudo npm install -g pm2
```

### 4. Setup Application Directory

```bash
# Create application directory
sudo mkdir -p /opt/cv-search
sudo chown $USER:$USER /opt/cv-search
cd /opt/cv-search

# Clone repository
git clone <your-repo> .
git checkout main

# Install dependencies
npm install --prefix backend
npm install --prefix frontend
```

## Production Deployment

### 1. Build Applications

```bash
# Build backend
cd backend
npm run build
cd ..

# Build frontend
cd frontend
npm run build
cd ..
```

### 2. PM2 Configuration

Create `ecosystem.config.js` in the root directory:

```javascript
module.exports = {
  apps: [
    {
      name: 'cv-search-backend',
      script: './backend/dist/main.js',
      cwd: '/opt/cv-search',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: '.env',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10
    },
    {
      name: 'cv-search-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/cv-search/frontend',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '../.env',
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10
    }
  ]
};
```

### 3. Start Services

```bash
# Create logs directory
mkdir -p logs

# Start services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Nginx Configuration

### 1. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. SSL and Reverse Proxy Setup

Create `/etc/nginx/sites-available/cv-search`:

```nginx
upstream backend {
    server 127.0.0.1:3001;
}

upstream frontend {
    server 127.0.0.1:3000;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # File upload limits
        client_max_body_size 10M;
    }

    # Upload endpoint with stricter rate limiting
    location /api/upload/ {
        limit_req zone=upload burst=5 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        client_max_body_size 10M;
    }
}
```

### 3. Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/cv-search /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Security Considerations

### 1. Environment Security
- Never commit `.env` files to version control
- Use secrets management in production
- Rotate API keys regularly
- Use production-grade OpenAI and Pinecone accounts

### 2. Network Security
- Configure firewall rules
- Use VPN for admin access
- Implement rate limiting
- Enable HTTPS with strong SSL configuration

### 3. Data Security
- Encrypt data at rest
- Implement proper access controls
- Regular security audits
- Backup strategies for CV data

## Monitoring and Logging

### 1. Application Logs
```bash
# View PM2 logs
pm2 logs cv-search-backend
pm2 logs cv-search-frontend

# View application logs
tail -f logs/backend-combined.log
tail -f logs/frontend-combined.log
```

### 2. Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Frontend health
curl https://yourdomain.com/api/health
```

### 3. PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View status
pm2 status

# Restart services
pm2 restart cv-search-backend
pm2 restart cv-search-frontend
```

## Backup Strategy

### 1. CV Files
```bash
# Backup uploads directory
tar -czf cv-backup-$(date +%Y%m%d).tar.gz backend/uploads/

# Automated backup script
#!/bin/bash
BACKUP_DIR="/opt/backups/cv-search"
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/cv-backup-$(date +%Y%m%d).tar.gz /opt/cv-search/backend/uploads/
find $BACKUP_DIR -name "cv-backup-*.tar.gz" -mtime +30 -delete
```

### 2. Pinecone Data
- Pinecone provides automatic backups
- Consider exporting metadata regularly
- Document index configuration

### 3. Application Configuration
- Version control for configuration files
- Document environment setup
- Backup environment variables

## Scaling Considerations

### 1. Horizontal Scaling
- Multiple backend instances with PM2 cluster mode
- Redis for session management
- Shared file storage (S3, etc.)

### 2. Database Scaling
- Consider PostgreSQL for metadata persistence
- Implement connection pooling
- Read replicas for search queries

### 3. File Storage
- Move to cloud storage (S3, Azure Blob)
- Implement CDN for static assets
- Backup and disaster recovery

## Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Health checks working
- [ ] Performance benchmarks established
- [ ] Disaster recovery plan documented

## Support and Maintenance

- Regular security updates
- Monitor OpenAI and Pinecone usage
- Performance optimization
- User feedback collection
- Documentation updates

---

For additional support, refer to the main [README.md](README.md) or create an issue in the repository. 