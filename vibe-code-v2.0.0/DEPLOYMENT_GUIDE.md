# 🚀 Vibe Code - Deployment Guide

Complete guide for deploying Vibe Code to production.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Deploy (Automated)](#quick-deploy-automated)
- [Manual Deploy](#manual-deploy)
- [Deploy Environments](#deploy-environments)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Rollback](#rollback)
- [Security](#security)

---

## ✅ Prerequisites

### Required

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (Usually comes with Docker Desktop)
- **Node.js** 20+ (for local testing)
- **At least one AI API key**:
  - Anthropic Claude API key (recommended)
  - OR OpenAI GPT API key
  - OR Google Gemini API key

### Recommended

- **E2B API key** (for sandbox execution)
- **2GB+ RAM** available
- **5GB+ disk space** for Docker images
- **SSL certificate** for HTTPS (production)

### System Requirements

| Environment | CPU | RAM | Disk | Bandwidth |
|-------------|-----|-----|------|-----------|
| Development | 2 cores | 4GB | 10GB | N/A |
| Staging | 2 cores | 4GB | 20GB | 100 Mbps |
| Production | 4+ cores | 8GB+ | 50GB+ | 500 Mbps+ |

---

## 🚀 Quick Deploy (Automated)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/vibe-code.git
cd vibe-code/vibe-code-v2.0.0
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env
# or
vim .env
```

**Minimum required in `.env`:**
```bash
# At least ONE of these is required
ANTHROPIC_API_KEY=sk-ant-your-key-here  # Recommended
# OR
OPENAI_API_KEY=sk-your-key-here
# OR
GOOGLE_API_KEY=your-key-here

# Optional but recommended
E2B_API_KEY=your-e2b-key-here
```

### 3. Run Deploy Script

```bash
./deploy.sh
```

That's it! The script will:
- ✅ Verify prerequisites
- ✅ Run tests
- ✅ Build Docker image
- ✅ Start containers
- ✅ Wait for health check
- ✅ Display logs

**Access your app:** http://localhost:3000

---

## 📝 Manual Deploy

### Step 1: Run Tests

```bash
npm install
npm test
```

Ensure all tests pass before deploying.

### Step 2: Build Docker Image

```bash
docker build -t vibe-code:latest .
```

**Build takes ~5-10 minutes** (first time only, subsequent builds use cache).

### Step 3: Start with Docker Compose

```bash
docker-compose up -d
```

### Step 4: Verify Health

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoint
curl http://localhost:3000/api/health
```

### Step 5: Access Application

Open browser: http://localhost:3000

---

## 🌍 Deploy Environments

### Local Development

```bash
# Start development server
npm run dev
```

- Hot reload enabled
- Debug mode active
- No Docker needed

### Staging

```bash
# Use staging environment variables
docker-compose --env-file .env.staging up -d
```

- Full production build
- Isolated from production
- Test before production deploy

### Production

```bash
# Use production environment variables
docker-compose --env-file .env.production up -d

# With nginx proxy
docker-compose --profile production up -d
```

- Optimized build
- Health checks enabled
- Automatic restart
- SSL/HTTPS support

---

## ⚙️ Configuration

### Environment Variables

#### Required

```bash
# AI Models (at least one required)
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx

# Sandbox (recommended)
E2B_API_KEY=your-key
```

#### Optional

```bash
# Model Configuration
DEFAULT_MODEL=claude-sonnet-4     # Default: claude-sonnet-4
FALLBACK_MODEL=gpt-4              # Default: gpt-4

# Feature Flags
ENABLE_AUTOFIX=true               # Default: true
ENABLE_BACKGROUND_AGENTS=false    # Default: false
ENABLE_RAG_SYSTEM=false           # Default: false

# Performance
MAX_CONCURRENT_GENERATIONS=5      # Default: 5
CACHE_TTL=300000                  # Default: 5 minutes (ms)

# Networking
PORT=3000                         # Default: 3000
HOSTNAME=0.0.0.0                  # Default: 0.0.0.0
```

### Docker Compose Profiles

```bash
# Basic (just the app)
docker-compose up -d

# With Redis caching
docker-compose --profile production up -d

# With Nginx proxy
docker-compose --profile production up -d nginx
```

---

## 📊 Monitoring

### Health Checks

```bash
# Check if app is healthy
curl http://localhost:3000/api/health

# Should return: {"status":"ok"}
```

### Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f vibe-code
```

### Metrics

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Network info
docker network inspect vibe-network
```

### Resource Usage

```bash
# Check CPU and memory
docker-compose top

# Detailed resource usage
docker-compose exec vibe-code sh -c "top"
```

---

## 🐛 Troubleshooting

### Issue: Container won't start

**Symptoms:** Container exits immediately

**Solutions:**
```bash
# Check logs
docker-compose logs

# Check if port 3000 is already in use
lsof -i :3000

# Kill process using port 3000
kill -9 $(lsof -t -i:3000)

# Restart
docker-compose restart
```

### Issue: Health check failing

**Symptoms:** Container shows as "unhealthy"

**Solutions:**
```bash
# Check health status
docker-compose ps

# Check app logs
docker-compose logs vibe-code

# Manually test health endpoint
curl -v http://localhost:3000/api/health

# Restart container
docker-compose restart vibe-code
```

### Issue: Build fails

**Symptoms:** Docker build error

**Solutions:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Node version
docker run node:20-alpine node --version
```

### Issue: Out of memory

**Symptoms:** Container crashes with OOM error

**Solutions:**
```bash
# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory > 4GB+

# Check memory usage
docker stats

# Reduce concurrent generations in .env
MAX_CONCURRENT_GENERATIONS=2
```

### Issue: Slow performance

**Symptoms:** App responds slowly

**Solutions:**
```bash
# Check resource usage
docker stats

# Enable Redis caching
docker-compose --profile production up -d

# Increase cache TTL in .env
CACHE_TTL=600000  # 10 minutes

# Reduce concurrent load
MAX_CONCURRENT_GENERATIONS=3
```

---

## 🔄 Rollback

### To Previous Version

```bash
# Stop current version
docker-compose down

# Pull previous image
docker pull vibe-code:previous

# Start with previous image
docker run -d -p 3000:3000 --env-file .env vibe-code:previous
```

### With Git

```bash
# Find previous working commit
git log --oneline

# Checkout previous version
git checkout <commit-hash>

# Rebuild and deploy
./deploy.sh
```

### Quick Rollback

```bash
# Keep both versions running
docker tag vibe-code:latest vibe-code:backup

# If new version fails
docker-compose down
docker tag vibe-code:backup vibe-code:latest
docker-compose up -d
```

---

## 🔒 Security

### Best Practices

✅ **DO:**
- Use environment variables for secrets
- Run as non-root user (already configured)
- Keep Docker images updated
- Enable HTTPS in production
- Use strong API keys
- Limit network exposure
- Enable rate limiting
- Monitor logs for suspicious activity

❌ **DON'T:**
- Commit `.env` file to git
- Use default passwords
- Expose unnecessary ports
- Run as root user
- Disable security features

### SSL/HTTPS Setup

#### With Nginx (Recommended)

1. **Get SSL Certificate:**

```bash
# Using Let's Encrypt (certbot)
sudo certbot certonly --standalone -d yourdomain.com
```

2. **Configure Nginx:**

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://vibe-code:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Start with SSL:**

```bash
docker-compose --profile production up -d
```

#### With Cloudflare (Easy)

1. Add your domain to Cloudflare
2. Enable "Full (strict)" SSL mode
3. Point A record to your server IP
4. Done! Cloudflare handles SSL automatically

### Firewall Configuration

```bash
# Allow HTTP (80) and HTTPS (443)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optional: Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

---

## 📈 Performance Optimization

### 1. Enable Redis Caching

```bash
docker-compose --profile production up -d
```

### 2. Optimize Node.js

```bash
# In .env
NODE_OPTIONS="--max-old-space-size=4096"
```

### 3. CDN for Static Assets

Use Cloudflare or AWS CloudFront for:
- Images
- CSS/JS files
- Public assets

### 4. Horizontal Scaling

```bash
# Run multiple instances behind load balancer
docker-compose up --scale vibe-code=3
```

---

## 📦 Backup & Restore

### Backup

```bash
# Backup volumes
docker run --rm \
  -v vibe-code_cache-data:/cache \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/cache-backup.tar.gz -C /cache .

# Backup environment
cp .env ./backup/.env.backup
```

### Restore

```bash
# Restore volumes
docker run --rm \
  -v vibe-code_cache-data:/cache \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/cache-backup.tar.gz -C /cache

# Restore environment
cp ./backup/.env.backup .env
```

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] All tests passing (`npm test`)
- [ ] Environment variables configured
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Resource limits configured
- [ ] Health checks enabled
- [ ] Logs being collected
- [ ] Rate limiting configured
- [ ] Security scan passed
- [ ] Load testing completed
- [ ] Rollback plan ready
- [ ] Team notified

---

## 🌐 Cloud Deployment

### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init vibe-code

# Create environment
eb create vibe-code-prod

# Deploy
eb deploy
```

### Google Cloud (Cloud Run)

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/vibe-code

# Deploy
gcloud run deploy vibe-code \
  --image gcr.io/PROJECT-ID/vibe-code \
  --platform managed
```

### Azure (Container Instances)

```bash
# Create resource group
az group create --name vibe-code --location eastus

# Deploy container
az container create \
  --resource-group vibe-code \
  --name vibe-code \
  --image vibe-code:latest \
  --dns-name-label vibe-code \
  --ports 3000
```

### DigitalOcean (App Platform)

1. Push code to GitHub
2. Connect repository in App Platform
3. Configure environment variables
4. Deploy!

---

## 📞 Support

### Documentation

- Main README: `README.md`
- How to Use: `HOW_TO_USE.md`
- Intelligent Systems: `INTELLIGENT_SYSTEMS.md`
- Test Coverage: `TEST_COVERAGE.md`

### Issues

Report bugs: https://github.com/your-org/vibe-code/issues

### Community

- Discord: [Join our community](#)
- Twitter: [@vibecodehq](#)

---

## 📄 License

MIT License - See LICENSE file for details

---

**Version:** 2.1.0
**Last Updated:** 2025-01-30
**Status:** ✅ Production-Ready

