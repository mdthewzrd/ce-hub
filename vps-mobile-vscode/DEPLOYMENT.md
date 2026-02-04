# VPS Mobile VSCode - Complete Deployment Guide

This guide walks you through deploying a production-ready multi-instance Claude system on any VPS provider.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Selection](#vps-selection)
3. [Initial Server Setup](#initial-server-setup)
4. [Automated Deployment](#automated-deployment)
5. [Manual Deployment](#manual-deployment)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Testing Your Deployment](#testing-your-deployment)
9. [Maintenance and Monitoring](#maintenance-and-monitoring)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- A VPS with Ubuntu 22.04 or similar
- At least 4GB RAM (8GB recommended for multiple users)
- 20GB+ disk space
- Root or sudo access
- Domain name (optional but recommended for SSL)
- Basic knowledge of command line

## VPS Selection

### Recommended VPS Providers

| Provider | Plan | RAM | CPU | Storage | Price/Month |
|----------|------|-----|-----|---------|-------------|
| DigitalOcean | Basic-4GB | 4GB | 2 vCPUs | 80GB SSD | $24 |
| Linode | 4GB | 4GB | 2 vCPUs | 80GB SSD | $20 |
| Vultr | 4GB | 4GB | 2 vCPUs | 75GB SSD | $24 |
| AWS Lightsail | 4GB | 4GB | 2 vCPUs | 80GB SSD | $20 |

### Capacity Planning

**4GB VPS** (Recommended for single user):
- Max instances: 4
- Max users: 1-2
- Concurrent sessions: 2-3

**8GB VPS** (Recommended for teams):
- Max instances: 6-8
- Max users: 3-4
- Concurrent sessions: 4-6

## Initial Server Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Update System

```bash
apt update && apt upgrade -y
```

### Step 3: Set Hostname (Optional)

```bash
hostnamectl set-hostname mobile-vscode
```

### Step 4: Create Non-Root User (Optional but Recommended)

```bash
# Create user
adduser mike
usermod -aG sudo mike

# Switch to user
su - mike
```

## Automated Deployment

### Step 1: Upload Files to VPS

```bash
# On your local machine
cd vps-mobile-vscode
scp -r . mike@your-vps-ip:/home/mike/mobile-vscode
```

### Step 2: Run Deployment Script

```bash
# On your VPS
cd /home/mike/mobile-vscode
sudo ./scripts/deploy.sh
```

The script will prompt for:
- Domain name (for SSL)
- Email for SSL certificate
- Admin password

### Step 3: Access Your Instance

Once deployment completes:

1. Open browser to `http://your-vps-ip`
2. Login with admin credentials
3. Create your first Claude instance!

## Manual Deployment

If you prefer manual setup or need to customize:

### Step 1: Install Dependencies

```bash
# Install system packages
sudo apt update
sudo apt install -y \
    nginx \
    python3.11 \
    python3.11-venv \
    python3-pip \
    nodejs \
    npm \
    git \
    tmux \
    supervisor \
    curl \
    wget \
    build-essential \
    htop \
    fail2ban \
    ufw
```

### Step 2: Install Claude CLI

```bash
# Install Claude CLI globally
sudo npm install -g @anthropic-ai/claude-code

# Verify installation
which claude
claude --version
```

### Step 3: Create Directory Structure

```bash
# Create directories
sudo mkdir -p /opt/mobile-vscode/{backend,frontend,config,logs,workspace}
sudo mkdir -p /opt/mobile-vscode/backend/{instances,sessions,users}

# Set permissions
sudo chmod -R 755 /opt/mobile-vscode
sudo chown -R www-data:www-data /opt/mobile-vscode
```

### Step 4: Setup Backend

```bash
# Copy backend files
sudo cp -r backend/* /opt/mobile-vscode/backend/
sudo cp config/supervisor.conf /etc/supervisor/conf.d/mobile-vscode.conf

# Create Python virtual environment
cd /opt/mobile-vscode/backend
sudo -u www-data python3.11 -m venv venv
sudo -u www-data venv/bin/pip install --upgrade pip
sudo -u www-data venv/bin/pip install -r requirements.txt
```

### Step 5: Setup Frontend

```bash
# Copy frontend files
sudo cp -r frontend/* /opt/mobile-vscode/frontend/
```

### Step 6: Configure NGINX

```bash
# Copy NGINX config
sudo cp config/nginx.conf /etc/nginx/sites-available/mobile-vscode

# Edit domain name
sudo nano /etc/nginx/sites-available/mobile-vscode
# Change "your-domain.com" to your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/mobile-vscode /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### Step 7: Configure Firewall

```bash
# Configure UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
sudo ufw status
```

### Step 8: Start Services

```bash
# Start with supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start mobile-vscode:*
```

## SSL Certificate Setup

### Option 1: With Domain Name (Recommended)

```bash
# Stop NGINX temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d your-domain.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# Start NGINX
sudo systemctl start nginx

# Verify
curl -I https://your-domain.com
```

### Option 2: Self-Signed Certificate (For Testing)

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/mobile-vscode-selfsigned.key \
  -out /etc/ssl/certs/mobile-vscode-selfsigned.crt

# Update NGINX config to use self-signed cert
sudo nano /etc/nginx/sites-available/mobile-vscode
# Change ssl_certificate and ssl_certificate_key paths
```

## Post-Deployment Configuration

### Create Admin User

```bash
cd /opt/mobile-vscode/backend
sudo -u www-data venv/bin/python3 << EOF
from auth import create_user
create_user("admin", "your-secure-password", "admin@example.com", admin=True)
print("Admin user created")
EOF
```

### Configure Instance Limits

Edit `/opt/mobile-vscode/backend/config.py`:

```python
# For 4GB VPS
MAX_INSTANCES_PER_USER = 2
MAX_INSTANCES_TOTAL = 4

# For 8GB VPS
MAX_INSTANCES_PER_USER = 3
MAX_INSTANCES_TOTAL = 6
```

Restart after changes:

```bash
sudo supervisorctl restart mobile-vscode-api
```

### Set Up Automated Backups

```bash
# Create backup script
sudo nano /opt/mobile-vscode/scripts/backup.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/opt/mobile-vscode/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /opt/mobile-vscode/workspace "$BACKUP_DIR/"
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"
find /opt/mobile-vscode/backups -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /opt/mobile-vscode/scripts/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/mobile-vscode/scripts/backup.sh
```

## Testing Your Deployment

### 1. Check Service Status

```bash
sudo supervisorctl status mobile-vscode:*
```

Expected output:
```
mobile-vscode-api:mobile-vscode-api    RUNNING   pid 1234, uptime 0:01:23
mobile-vscode-monitor:mobile-vscode-monitor    RUNNING   pid 1235, uptime 0:01:23
```

### 2. Check API Health

```bash
curl http://localhost:8112/api/health
```

Expected output:
```json
{"status":"healthy","instances_running":0}
```

### 3. Test Authentication

```bash
# Get token
curl -X POST http://localhost:8112/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

### 4. Test Web Interface

1. Open browser to `http://your-vps-ip`
2. Login with admin credentials
3. Create a test instance
4. Verify it starts successfully

### 5. Test WebSocket Connection

```bash
# Use wscat or similar tool
wscat -c "ws://your-vps-ip/ws/instance/test?token=your-jwt-token"
```

## Maintenance and Monitoring

### Daily Tasks

- Check service status: `sudo supervisorctl status`
- Review logs: `tail -f /var/log/mobile-vscode/api.log`
- Monitor resources: `htop`

### Weekly Tasks

- Review user accounts
- Clean up old instances
- Check disk space: `df -h`
- Review SSL certificate expiry

### Monthly Tasks

- Update system packages: `sudo apt update && sudo apt upgrade -y`
- Review and rotate logs
- Test backup restoration
- Review security updates

### Monitoring Commands

```bash
# System resources
free -h              # Memory
df -h                # Disk space
htop                 # Interactive process viewer

# Application logs
tail -f /var/log/mobile-vscode/api.log
tail -f /var/log/mobile-vscode/monitor.log

# NGINX logs
tail -f /var/log/nginx/mobile-vscode-access.log
tail -f /var/log/nginx/mobile-vscode-error.log

# Claude instances
tmux list-sessions | grep mobile-vscode
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo tail -f /var/log/mobile-vscode/api-error.log

# Common issues:
# 1. Port already in use
sudo lsof -i :8112

# 2. Permission issues
sudo chown -R www-data:www-data /opt/mobile-vscode

# 3. Missing dependencies
cd /opt/mobile-vscode/backend
sudo -u www-data venv/bin/pip install -r requirements.txt
```

### Instance Won't Start

```bash
# Check Claude CLI
which claude
claude --version

# Check available memory
free -h

# Check tmux sessions
tmux list-sessions

# Check instance logs
sudo tail -f /var/log/mobile-vscode/api.log
```

### WebSocket Connection Issues

```bash
# Check NGINX config
sudo nginx -t

# Check if port is open
sudo netstat -tlnp | grep 8112

# Test WebSocket locally
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8112/
```

### High Memory Usage

```bash
# Check running instances
tmux list-sessions | grep mobile-vscode

# Stop idle instances via API or CLI
tmux kill-session -t mobile-vscode-instance-id

# Monitor memory usage
watch -n 1 free -h
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## Performance Optimization

### Increase Worker Count

Edit `/etc/supervisor/conf.d/mobile-vscode.conf`:

```ini
command=/opt/mobile-vscode/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8112 --workers 8
```

### Enable NGINX Caching

Add to `/etc/nginx/sites-available/mobile-vscode`:

```nginx
# Add to http block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

# Add to location block
proxy_cache api_cache;
proxy_cache_valid 200 5m;
```

### Optimize Python Performance

Edit `/opt/mobile-vscode/backend/config.py`:

```python
# Increase worker processes
API_WORKERS = os.cpu_count()  # Use all CPU cores

# Adjust instance limits
MAX_INSTANCES_TOTAL = calculate_max_instances()
```

## Security Hardening

### Enable Fail2Ban

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Add NGINX protection
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
maxretry = 10

# Restart
sudo systemctl restart fail2ban
```

### Rate Limiting

Already configured in NGINX. Adjust in `/etc/nginx/sites-available/mobile-vscode`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=5r/s;  # Reduce from 10r/s
```

### Regular Updates

```bash
# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## Backup and Restore

### Backup

```bash
# Full backup
sudo tar -czf mobile-vscode-backup-$(date +%Y%m%d).tar.gz /opt/mobile-vscode

# Database only
sudo cp -r /opt/mobile-vscode/backend/users /backup/
sudo cp -r /opt/mobile-vscode/backend/sessions /backup/
```

### Restore

```bash
# Extract backup
sudo tar -xzf mobile-vscode-backup-20240101.tar.gz -C /

# Restart services
sudo supervisorctl restart mobile-vscode:*
```

## Scaling Considerations

When you need to scale beyond a single VPS:

1. **Load Balancing**: Use NGINX as a load balancer across multiple backend servers
2. **Database**: Move to PostgreSQL for user/session data
3. **File Storage**: Use S3 or similar for workspace files
4. **Monitoring**: Implement Prometheus + Grafana for monitoring
5. **Logging**: Centralize logs with ELK stack

## Support and Resources

- Documentation: `/opt/mobile-vscode/README.md`
- Logs: `/var/log/mobile-vscode/`
- Config: `/opt/mobile-vscode/backend/config.py`
- Issues: Check GitHub issues

---

**Deployment complete!** Enjoy your multi-instance Claude system! 🚀
