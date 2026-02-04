"""
VPS Mobile VSCode Configuration
Central configuration management for the entire system
"""

import os
from pathlib import Path
from typing import List

# Base paths
BASE_DIR = Path("/opt/mobile-vscode")
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"
WORKSPACE_DIR = BASE_DIR / "workspace"
LOGS_DIR = Path("/var/log/mobile-vscode")

# Instance management
INSTANCES_DIR = BACKEND_DIR / "instances"
SESSIONS_DIR = BACKEND_DIR / "sessions"
USERS_DIR = BACKEND_DIR / "users"

# Claude configuration
AVAILABLE_MODELS = {
    "claude-sonnet-4-20250514": {
        "name": "Sonnet 4",
        "memory_mb": 800,
        "max_concurrent": 2
    },
    "claude-sonnet-4-5-20250929": {
        "name": "Sonnet 4.5",
        "memory_mb": 900,
        "max_concurrent": 2
    },
    "glm-4.6": {
        "name": "GLM-4.6",
        "memory_mb": 700,
        "max_concurrent": 3
    }
}

# Resource limits
MAX_INSTANCES_PER_USER = 2
MAX_INSTANCES_TOTAL = 4
MIN_FREE_MEMORY_MB = 512
INSTANCE_IDLE_TIMEOUT_MINUTES = 30

# API configuration
API_HOST = "127.0.0.1"
API_PORT = 8112
API_WORKERS = 4

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production-use-openssl-rand-hex-32")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

# Rate limiting
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW_SECONDS = 60

# WebSocket
WS_PING_INTERVAL = 30
WS_PING_TIMEOUT = 10

# File operations
MAX_FILE_SIZE_MB = 10
ALLOWED_FILE_EXTENSIONS = {
    '.py', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.md',
    '.txt', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
    '.sh', '.bash', '.zsh', '.fish',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico'
}

# Git operations
GIT_AUTO_COMMIT = True
GIT_COMMIT_MESSAGE = "Auto-commit from Mobile VSCode"
GIT_PUSH_INTERVAL_MINUTES = 60

# Monitoring
MONITOR_INTERVAL_SECONDS = 60
ALERT_THRESHOLD_CPU_PERCENT = 80
ALERT_THRESHOLD_MEMORY_PERCENT = 85
ALERT_THRESHOLD_DISK_PERCENT = 90

# Logging
LOG_FORMAT = "%(asctime)s | %(name)s | %(levelname)s | %(message)s"
LOG_LEVEL = "INFO"
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
LOG_BACKUP_COUNT = 5

# Ensure directories exist
def ensure_directories():
    """Create all required directories"""
    directories = [
        BASE_DIR, BACKEND_DIR, FRONTEND_DIR, WORKSPACE_DIR,
        INSTANCES_DIR, SESSIONS_DIR, USERS_DIR, LOGS_DIR
    ]

    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

    # Set permissions
    os.chmod(LOGS_DIR, 0o755)

# Get system resources
def get_system_memory_mb() -> int:
    """Get total system memory in MB"""
    try:
        import psutil
        return psutil.virtual_memory().total // (1024 * 1024)
    except:
        return 4096  # Default to 4GB

def get_available_memory_mb() -> int:
    """Get available memory in MB"""
    try:
        import psutil
        return psutil.virtual_memory().available // (1024 * 1024)
    except:
        return 2048  # Default to 2GB

def calculate_max_instances() -> int:
    """Calculate max instances based on available memory"""
    total_memory = get_system_memory_mb()
    if total_memory >= 8192:  # 8GB+
        return 6
    elif total_memory >= 4096:  # 4GB+
        return 4
    else:  # 2GB+
        return 2

# Initialize
MAX_INSTANCES_TOTAL = calculate_max_instances()
