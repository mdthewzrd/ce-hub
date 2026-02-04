# VPS Mobile VSCode - Quick Start Guide

Get your multi-instance Claude system running in 10 minutes!

## 🚀 Quick Deploy (Recommended)

### Prerequisites
- Ubuntu 22.04 VPS with 4GB+ RAM
- Root/sudo access

### Step 1: Upload Files (2 minutes)
```bash
# On your local machine
cd vps-mobile-vscode
scp -r . root@your-vps-ip:/root/mobile-vscode
```

### Step 2: Deploy (5 minutes)
```bash
# On your VPS
cd /root/mobile-vscode
sudo ./scripts/deploy.sh
```

You'll be prompted for:
- Domain name (optional, press Enter to skip)
- Email for SSL (optional, press Enter to skip)
- Admin password (required)

### Step 3: Access (1 minute)
```bash
# Open your browser to:
http://your-vps-ip

# Login with:
Username: admin
Password: (what you set in step 2)
```

### Step 4: Create Instance (2 minutes)
1. Tap the **+** button
2. Select a model (Sonnet 4, Sonnet 4.5, or GLM-4.6)
3. Tap "Create Instance"
4. Wait 5-10 seconds for startup
5. Tap on the instance to open the terminal

**That's it!** You now have a cloud-based Claude instance accessible from your phone! 🎉

## 📱 Mobile Interface Guide

### Dashboard (Home)
- View all your instances
- See status (running/idle/stopped)
- Quick actions (open/stop)
- Resource usage overview

### Terminal
- Real-time Claude interaction
- Type commands and see responses
- Scroll through history
- Clear terminal button

### Files
- Browse your workspace
- View file contents
- Edit files (coming soon)

### Settings
- User preferences
- Theme options (coming soon)

## 🔧 Common Commands

### Check Service Status
```bash
sudo supervisorctl status mobile-vscode:*
```

### View Logs
```bash
# API logs
tail -f /var/log/mobile-vscode/api.log

# Error logs
tail -f /var/log/mobile-vscode/api-error.log

# Monitor logs
tail -f /var/log/mobile-vscode/monitor.log
```

### Restart Services
```bash
sudo supervisorctl restart mobile-vscode:*
```

### List Claude Instances
```bash
tmux list-sessions | grep mobile-vscode
```

### Stop a Specific Instance
```bash
tmux kill-session -t mobile-vscode-instance-id
```

## 🎯 Model Selection Guide

### Sonnet 4 (800MB RAM)
✅ Best for: General coding, debugging, explanations
✅ Pros: Fast, balanced performance
✅ Use when: You need quick responses

### Sonnet 4.5 (900MB RAM)
✅ Best for: Complex tasks, large codebases
✅ Pros: Most capable, handles complexity
✅ Use when: You need maximum capability

### GLM-4.6 (700MB RAM)
✅ Best for: Lightweight tasks, quick queries
✅ Pros: Fastest, least memory
✅ Use when: Resources are limited

## 🔐 Security Tips

### 1. Change Admin Password
```bash
cd /opt/mobile-vscode/backend
sudo -u www-data venv/bin/python3 << EOF
from auth import UserManager
mgr = UserManager()
mgr.update_user("admin", {"password": "new-secure-password"})
EOF
```

### 2. Enable SSL (Recommended)
```bash
# Stop NGINX
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d your-domain.com \
  --email your@email.com \
  --agree-tos

# Start NGINX
sudo systemctl start nginx
```

### 3. Configure Firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

## 📊 Resource Limits

### 4GB VPS (Standard)
- Max instances: 4 total
- Per user: 2 instances
- RAM per instance: 700-900MB

### 8GB VPS (Recommended for teams)
- Max instances: 6-8 total
- Per user: 3 instances
- RAM per instance: 700-900MB

### Monitoring
```bash
# Check memory
free -h

# Check disk
df -h

# Check CPU
htop
```

## 🐛 Troubleshooting

### Instance Won't Start
**Problem**: Instance shows "starting" but never reaches "running"

**Solution**:
```bash
# Check Claude CLI
which claude

# Check memory
free -h

# Check logs
tail -f /var/log/mobile-vscode/api.log
```

### Can't Access Web Interface
**Problem**: Browser won't connect to VPS

**Solution**:
```bash
# Check NGINX
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Check API
curl http://localhost:8112/api/health
```

### WebSocket Connection Failed
**Problem**: Terminal won't connect

**Solution**:
```bash
# Check WebSocket proxy
sudo nginx -t

# Restart API
sudo supervisorctl restart mobile-vscode-api
```

### Out of Memory
**Problem**: Instances stopping randomly

**Solution**:
```bash
# Stop idle instances
tmux list-sessions | grep mobile-vscode

# Reduce instance count
# Edit /opt/mobile-vscode/backend/config.py
# Change MAX_INSTANCES_TOTAL to 2 or 3
```

## 💡 Pro Tips

### 1. Auto-Start Instances
Create instances at boot by adding to crontab:
```bash
sudo crontab -e
@reboot sleep 30 && curl -X POST http://localhost:8112/api/instances \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"model": "claude-sonnet-4-20250514"}'
```

### 2. Custom Workspace
Add files to your workspace before starting:
```bash
# Copy files to user workspace
cp -r my-project/* /opt/mobile-vscode/workspace/username/
```

### 3. Monitor Resources
Set up alerts in `/opt/mobile-vscode/backend/config.py`:
```python
ALERT_THRESHOLD_CPU_PERCENT = 70  # More sensitive
ALERT_THRESHOLD_MEMORY_PERCENT = 75
```

### 4. Backup Workspace
```bash
# Quick backup
tar -czf workspace-backup.tar.gz /opt/mobile-vscode/workspace

# Restore
tar -xzf workspace-backup.tar.gz -C /
```

## 📞 Getting Help

### Documentation
- Full Guide: `README.md`
- Deployment: `DEPLOYMENT.md`
- Summary: `PROJECT_SUMMARY.md`

### Logs
- API: `/var/log/mobile-vscode/api.log`
- Monitor: `/var/log/mobile-vscode/monitor.log`
- NGINX: `/var/log/nginx/mobile-vscode-error.log`

### Community
- GitHub Issues
- Documentation Wiki

## 🎓 Learning Resources

### Claude CLI
```bash
# Help
claude --help

# Version
claude --version

# Models
claude --model list
```

### tmux (Instance Manager)
```bash
# List sessions
tmux list-sessions

# Attach to session
tmux attach-session -t mobile-vscode-instance-id

# Detach from session
Ctrl+B, then D

# Kill session
tmux kill-session -t mobile-vscode-instance-id
```

### System Monitoring
```bash
# Interactive process viewer
htop

# Disk usage
du -sh /opt/mobile-vscode

# Memory by process
ps aux --sort=-%mem | head
```

## ✨ Next Steps

1. ✅ Deploy your VPS
2. ✅ Create your first instance
3. ✅ Try all three models
4. ✅ Upload some code to workspace
5. ✅ Have Claude help you code!
6. ✅ Share with team members

## 🎉 You're Ready!

Your VPS Mobile VSCode system is now running. Here's what you can do:

- **Code on the go**: Access Claude from anywhere
- **Multiple instances**: Run different models simultaneously
- **Team collaboration**: Share with colleagues
- **Always on**: No need to keep your computer running
- **Secure**: JWT authentication and SSL support

Enjoy coding in the cloud! ☁️💻

---

**Need help?** Check the full documentation in `README.md` or `DEPLOYMENT.md`
