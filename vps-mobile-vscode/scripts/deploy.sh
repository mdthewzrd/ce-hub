#!/bin/bash
################################################################################
# VPS Mobile VSCode - One-Command Deployment Script
# Deploys complete multi-instance Claude system on any VPS
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/mobile-vscode"
DOMAIN=""
EMAIL=""
ADMIN_USER="admin"
ADMIN_PASS=""
ENABLE_SSL=true

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root (use: sudo ./deploy.sh)"
        exit 1
    fi
}

detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        VERSION=$VERSION_ID
    else
        log_error "Cannot detect Linux distribution"
        exit 1
    fi
    log_info "Detected: $DISTRO $VERSION"
}

update_system() {
    log_info "Updating system packages..."
    if [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ]; then
        apt-get update -y
        apt-get upgrade -y
    elif [ "$DISTRO" = "centos" ] || [ "$DISTRO" = "rhel" ]; then
        yum update -y
    fi
    log_success "System updated"
}

install_dependencies() {
    log_info "Installing core dependencies..."

    if [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ]; then
        apt-get install -y \
            nginx \
            python3.11 \
            python3.11-venv \
            python3-pip \
            nodejs \
            npm \
            git \
            tmux \
            supervisor \
            certbot \
            python3-certbot-nginx \
            curl \
            wget \
            build-essential \
            htop \
            fail2ban \
            ufw
    elif [ "$DISTRO" = "centos" ] || [ "$DISTRO" = "rhel" ]; then
        yum install -y \
            nginx \
            python3.11 \
            python3-pip \
            nodejs \
            npm \
            git \
            tmux \
            supervisor \
            certbot \
            curl \
            wget \
            gcc \
            make \
            htop \
            fail2ban
    fi

    log_success "Dependencies installed"
}

install_claude_cli() {
    log_info "Installing Claude CLI..."

    # Check if claude already exists
    if command -v claude &> /dev/null; then
        log_warning "Claude CLI already installed, skipping..."
        return
    fi

    # Install Claude CLI via npm
    npm install -g @anthropic-ai/claude-code

    log_success "Claude CLI installed"
}

setup_directories() {
    log_info "Setting up directory structure..."

    mkdir -p $INSTALL_DIR/{backend,frontend,config,logs,workspace}
    mkdir -p $INSTALL_DIR/backend/{instances,sessions,users}
    mkdir -p /var/log/mobile-vscode

    # Copy files if running from source
    if [ -d "./vps-mobile-vscode" ]; then
        cp -r ./vps-mobile-vscode/* $INSTALL_DIR/
    fi

    # Set permissions
    chmod -R 755 $INSTALL_DIR

    log_success "Directories created"
}

setup_python_env() {
    log_info "Setting up Python virtual environment..."

    cd $INSTALL_DIR/backend
    python3.11 -m venv venv
    source venv/bin/activate

    # Install Python dependencies
    pip install --upgrade pip
    pip install \
        fastapi \
        uvicorn[standard] \
        websockets \
        pydantic \
        python-multipart \
        passlib[bcrypt] \
        python-jose[cryptography] \
        pyyaml \
        psutil \
        aiofiles

    log_success "Python environment ready"
}

configure_nginx() {
    log_info "Configuring NGINX..."

    # Create NGINX config
    cat > /etc/nginx/sites-available/mobile-vscode << 'EOF'
server {
    listen 80;
    server_name _;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=5r/s;

    # API endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:8112;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # WebSocket endpoints
    location /ws/ {
        limit_req zone=ws_limit burst=10 nodelay;
        proxy_pass http://127.0.0.1:8112;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Static files
    location / {
        root $INSTALL_DIR/frontend;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/mobile-vscode /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test NGINX config
    nginx -t

    log_success "NGINX configured"
}

configure_supervisor() {
    log_info "Configuring Supervisor..."

    cat > /etc/supervisor/conf.d/mobile-vscode.conf << 'EOF'
[program:mobile-vscode-api]
command=/opt/mobile-vscode/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8112 --workers 4
directory=/opt/mobile-vscode/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/mobile-vscode/api-error.log
stdout_logfile=/var/log/mobile-vscode/api.log
environment=PYTHONUNBUFFERED="1"

[program:mobile-vscode-monitor]
command=/opt/mobile-vscode/backend/venv/bin/python monitor.py
directory=/opt/mobile-vscode/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/mobile-vscode/monitor-error.log
stdout_logfile=/var/log/mobile-vscode/monitor.log
EOF

    supervisorctl reread
    supervisorctl update

    log_success "Supervisor configured"
}

configure_firewall() {
    log_info "Configuring firewall..."

    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw allow 22/tcp comment 'SSH'
        ufw allow 80/tcp comment 'HTTP'
        ufw allow 443/tcp comment 'HTTPS'
        ufw reload
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
    fi

    log_success "Firewall configured"
}

setup_ssl() {
    if [ "$ENABLE_SSL" = true ] && [ -n "$DOMAIN" ]; then
        log_info "Setting up SSL certificate..."

        # Stop nginx temporarily
        systemctl stop nginx

        # Get certificate
        certbot certonly --standalone \
            -d $DOMAIN \
            --email $EMAIL \
            --agree-tos \
            --non-interactive

        # Update NGINX config for SSL
        cat > /etc/nginx/sites-available/mobile-vscode << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=ws_limit:10m rate=5r/s;

    # API endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:8112;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # WebSocket endpoints
    location /ws/ {
        limit_req zone=ws_limit burst=10 nodelay;
        proxy_pass http://127.0.0.1:8112;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 86400;
    }

    # Static files
    location / {
        root $INSTALL_DIR/frontend;
        try_files \$uri \$uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

        # Start nginx
        systemctl start nginx

        log_success "SSL configured"
    else
        log_warning "SSL setup skipped (no domain provided)"
    fi
}

create_admin_user() {
    log_info "Creating admin user..."

    cd $INSTALL_DIR/backend
    source venv/bin/activate

    python3 << EOF
import sys
sys.path.insert(0, '.')
from auth import create_user

create_user("$ADMIN_USER", "$ADMIN_PASS", admin=True)
print("Admin user created: $ADMIN_USER")
EOF

    log_success "Admin user created"
}

start_services() {
    log_info "Starting services..."

    systemctl enable nginx
    systemctl start nginx

    supervisorctl start mobile-vscode-api
    supervisorctl start mobile-vscode-monitor

    log_success "All services started"
}

print_summary() {
    cat << EOF

${GREEN}╔════════════════════════════════════════════════════════════╗
║         VPS Mobile VSCode Deployment Complete!          ║
╚════════════════════════════════════════════════════════════╝${NC}

${BLUE}Access Information:${NC}
  • Admin User: $ADMIN_USER
  • Admin Password: $ADMIN_PASS
  • API URL: http://$(hostname -I | awk '{print $1}'):8112
  • Web URL: http://$(hostname -I | awk '{print $1}')

${BLUE}Management Commands:${NC}
  • Stop services: supervisorctl stop mobile-vscode-*
  • Start services: supervisorctl start mobile-vscode-*
  • Restart services: supervisorctl restart mobile-vscode-*
  • View logs: tail -f /var/log/mobile-vscode/api.log
  • View status: supervisorctl status

${BLUE}Next Steps:${NC}
  1. Login at: http://$(hostname -I | awk '{print $1}')
  2. Create Claude instances
  3. Connect from mobile device

${GREEN}Deployment successful!${NC}

EOF
}

# Main deployment flow
main() {
    echo -e "${BLUE}
╔════════════════════════════════════════════════════════════╗
║     VPS Mobile VSCode - One-Command Deployment          ║
╚════════════════════════════════════════════════════════════╝
${NC}"

    # Prompt for configuration
    read -p "Enter domain name (optional, for SSL): " DOMAIN
    read -p "Enter email for SSL (optional): " EMAIL
    read -sp "Enter admin password: " ADMIN_PASS
    echo

    if [ -z "$ADMIN_PASS" ]; then
        log_error "Admin password is required"
        exit 1
    fi

    # Run deployment steps
    check_root
    detect_distro
    update_system
    install_dependencies
    install_claude_cli
    setup_directories
    setup_python_env
    configure_nginx
    configure_supervisor
    configure_firewall

    if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
        setup_ssl
    fi

    create_admin_user
    start_services
    print_summary
}

# Run main function
main "$@"
