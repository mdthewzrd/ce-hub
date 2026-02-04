# VPS Mobile VSCode - Multi-Instance Claude System

Transform your existing local mobile VS Code bridge into a robust VPS-deployable system capable of running multiple Claude instances simultaneously. Deploy on any VPS provider, access from mobile, no local computer required.

## Features

- 🚀 **Multi-Instance Claude**: Run 3-4 Claude instances simultaneously on a 4GB VPS
- 👥 **Multi-User Support**: Each user gets isolated instances and workspaces
- 📱 **Mobile-Optimized Interface**: Touch-friendly UI designed for mobile browsers
- 🎯 **Multiple Model Support**: GLM-4.6, Sonnet 4, Sonnet 4.5
- 📁 **File Management**: Browse, edit, and manage files per workspace
- 🔐 **JWT Authentication**: Secure user authentication and authorization
- 🔄 **WebSocket Streaming**: Real-time terminal output via WebSocket
- 📊 **Resource Monitoring**: Built-in CPU, memory, and disk monitoring
- 🔒 **Security**: Rate limiting, SSL/TLS support, user isolation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VPS (4GB RAM, $20-40/mo)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │         NGINX Reverse Proxy (443/80)                  │  │
│  │  SSL/TLS + Domain + Load Balancing                    │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                           │
│  ┌───────────────▼───────────────────────────────────────┐  │
│  │       Multi-Instance Manager (FastAPI)               │  │
│  │   - User authentication & authorization               │  │
│  │   - Per-user instance quotas                          │  │
│  │   - Session routing & management                      │  │
│  │   - Model selection & launching                      │  │
│  │   - Resource monitoring                              │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                           │
│  ┌───────────────▼───────────────────────────────────────┐  │
│  │     Claude Instance Manager (tmux + supervisor)      │  │
│  │  ┌─────────────┬─────────────┬─────────────┐        │  │
│  │  │ User A      │ User A      │ User B      │        │  │
│  │  │ Sonnet 4    │ GLM-4.6     │ Sonnet 4.5  │        │  │
│  │  │ tmux session│ tmux session│ tmux session│        │  │
│  │  └─────────────┴─────────────┴─────────────┘        │  │
│  └───────────────────────────────────────────────────────┘  │
│                  │                                           │
│  ┌───────────────▼───────────────────────────────────────┐  │
│  │       File System & Workspace Manager                │  │
│  │   /home/user_a/workspace/                             │  │
│  │   /home/user_b/workspace/                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/WebSocket
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Mobile Devices (Browser/PWA)                   │
│  User A: - Mobile VS Code interface                         │
│         - Manage their instances                           │
│         - Isolated workspace                               │
│                                                              │
│  User B: - Same interface, different instances              │
│         - Completely isolated from User A                   │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Ubuntu 22.04 VPS with 4GB+ RAM
- Domain name (optional, for SSL)
- Root/sudo access

### One-Command Deployment

```bash
# Clone repository
git clone <your-repo>
cd vps-mobile-vscode

# Run deployment script
sudo ./scripts/deploy.sh
```

The deployment script will:
1. Install all dependencies (NGINX, Python, Node.js, Claude CLI, tmux, supervisor)
2. Configure NGINX reverse proxy
3. Set up SSL certificates (if domain provided)
4. Create directory structure
5. Start all services

### Manual Deployment

If you prefer manual setup:

```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y nginx python3.11 python3-pip nodejs npm tmux supervisor certbot

# 2. Install Claude CLI
npm install -g @anthropic-ai/claude-code

# 3. Create directories
sudo mkdir -p /opt/mobile-vscode/{backend,frontend,config,logs,workspace}

# 4. Setup Python environment
cd /opt/mobile-vscode/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Configure NGINX
sudo cp config/nginx.conf /etc/nginx/sites-available/mobile-vscode
sudo ln -s /etc/nginx/sites-available/mobile-vscode /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Start services
sudo ./scripts/start.sh
```

## Configuration

### Environment Variables

Edit `/opt/mobile-vscode/backend/config.py`:

```python
# Instance limits
MAX_INSTANCES_PER_USER = 2
MAX_INSTANCES_TOTAL = 4
INSTANCE_IDLE_TIMEOUT_MINUTES = 30

# Security
SECRET_KEY = "your-secret-key-here"  # Change in production!

# Resource thresholds
ALERT_THRESHOLD_CPU_PERCENT = 80
ALERT_THRESHOLD_MEMORY_PERCENT = 85
```

### NGINX Configuration

Located at `/etc/nginx/sites-available/mobile-vscode`:

- SSL/TLS termination
- Rate limiting
- WebSocket proxying
- Static file serving

## Usage

### First Time Setup

1. **Access the web interface**: Open `http://your-vps-ip` in your browser

2. **Create admin user** (if not created during deployment):
   ```bash
   cd /opt/mobile-vscode/backend
   source venv/bin/activate
   python3 -c "from auth import create_user; create_user('admin', 'password', admin=True)"
   ```

3. **Login**: Use your credentials to log in

### Creating Instances

1. Tap the **+** button in the header
2. Select a model:
   - **Sonnet 4**: Fast & balanced (800MB RAM)
   - **Sonnet 4.5**: Most capable (900MB RAM)
   - **GLM-4.6**: Lightweight (700MB RAM)
3. Tap "Create Instance"

### Managing Instances

- **Open**: Tap on an instance card to open the terminal
- **Stop**: Tap the stop button to terminate an instance
- **Switch**: Use the dropdown in the header to switch between instances

### File Management

1. Tap the **Files** tab in the bottom navigation
2. Browse your workspace files
3. Tap on a file to view/edit (coming soon)

## API Reference

### Authentication

```bash
# Register user
POST /api/auth/register
{
  "username": "user",
  "password": "pass123",
  "email": "user@example.com"
}

# Login
POST /api/auth/login
{
  "username": "user",
  "password": "pass123"
}
```

### Instances

```bash
# List instances
GET /api/instances
Authorization: Bearer <token>

# Create instance
POST /api/instances
Authorization: Bearer <token>
{
  "model": "claude-sonnet-4-20250514"
}

# Get instance details
GET /api/instances/{instance_id}
Authorization: Bearer <token>

# Stop instance
DELETE /api/instances/{instance_id}
Authorization: Bearer <token>

# Send command
POST /api/instances/{instance_id}/command
Authorization: Bearer <token>
{
  "command": "help"
}
```

### WebSocket

```javascript
// Connect to instance
const ws = new WebSocket('ws://your-server/ws/instance/{instance_id}?token={token}');

// Send command
ws.send(JSON.stringify({ command: 'your command' }));

// Receive output
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.output);
};
```

## Management

### Service Management

```bash
# Start all services
sudo /opt/mobile-vscode/scripts/start.sh start

# Stop all services
sudo /opt/mobile-vscode/scripts/start.sh stop

# Restart services
sudo /opt/mobile-vscode/scripts/start.sh restart

# Check status
sudo /opt/mobile-vscode/scripts/start.sh status
```

### View Logs

```bash
# API logs
tail -f /var/log/mobile-vscode/api.log

# Monitor logs
tail -f /var/log/mobile-vscode/monitor.log

# Error logs
tail -f /var/log/mobile-vscode/api-error.log
```

### List Claude Instances

```bash
# List all tmux sessions
tmux list-sessions | grep mobile-vscode

# Attach to an instance
tmux attach-session -t mobile-vscode-{instance_id}

# Kill an instance
tmux kill-session -t mobile-vscode-{instance_id}
```

## Security

### SSL/TLS Setup

```bash
# Stop nginx
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d your-domain.com \
  --email your@email.com \
  --agree-tos

# Start nginx
sudo systemctl start nginx
```

### Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Rate Limiting

NGINX is configured with rate limiting:
- API endpoints: 10 requests/second
- WebSocket endpoints: 5 requests/second

Adjust in `/etc/nginx/sites-available/mobile-vscode`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=5r/s;
```

## Troubleshooting

### Instance Won't Start

1. Check Claude CLI is installed:
   ```bash
   which claude
   ```

2. Check available memory:
   ```bash
   free -h
   ```

3. Check instance logs:
   ```bash
   tail -f /var/log/mobile-vscode/api.log
   ```

### WebSocket Connection Issues

1. Verify NGINX WebSocket proxying:
   ```bash
   sudo nginx -t
   ```

2. Check if port 8112 is accessible:
   ```bash
   sudo netstat -tlnp | grep 8112
   ```

### High Memory Usage

1. List running instances:
   ```bash
   tmux list-sessions | grep mobile-vscode
   ```

2. Stop idle instances via the web interface or:
   ```bash
   tmux kill-session -t mobile-vscode-{instance_id}
   ```

## Performance Tuning

### Increase Instance Limits

Edit `/opt/mobile-vscode/backend/config.py`:

```python
# For 8GB VPS
MAX_INSTANCES_TOTAL = 6
MAX_INSTANCES_PER_USER = 3

# Reduce memory requirements
AVAILABLE_MODELS["claude-sonnet-4-20250514"]["memory_mb"] = 600
```

### Enable Auto-Cleanup

The monitor automatically cleans up idle instances after 30 minutes. Adjust:

```python
INSTANCE_IDLE_TIMEOUT_MINUTES = 15  # More aggressive cleanup
```

## Backup and Restore

### Backup Workspaces

```bash
# Create backup script
cat > /opt/mobile-vscode/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/mobile-vscode/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
cp -r /opt/mobile-vscode/workspace "$BACKUP_DIR/"
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
EOF

chmod +x /opt/mobile-vscode/scripts/backup.sh

# Run backup
sudo /opt/mobile-vscode/scripts/backup.sh
```

### Automated Backups

Add to crontab:

```bash
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/mobile-vscode/scripts/backup.sh
```

## VPS Providers

Recommended VPS providers:

- **DigitalOcean**: $24/month (4GB RAM, 2 vCPUs, 80GB SSD)
- **Linode**: $20/month (4GB RAM, 2 vCPUs, 80GB SSD)
- **Vultr**: $24/month (4GB RAM, 2 vCPUs, 75GB SSD)
- **AWS Lightsail**: $20/month (4GB RAM, 2 vCPUs, 80GB SSD)

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Documentation: [Full documentation link]

## Roadmap

- [ ] PWA installation support
- [ ] Background sync
- [ ] File upload/download
- [ ] Git operations
- [ ] Instance auto-suspend
- [ ] Resource usage alerts per user
- [ ] Dark/light theme toggle
- [ ] Custom font sizes
- [ ] Keyboard shortcuts

---

**Built with ❤️ for mobile developers**
