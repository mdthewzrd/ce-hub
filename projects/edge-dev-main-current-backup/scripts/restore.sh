#!/bin/bash
# Edge.dev Restore Script
# Usage: ./restore.sh <backup_file>

set -e

BACKUP_FILE=$1
EDGE_DEV_PATH="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
TEMP_DIR="/tmp/edge_dev_restore_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Starting restore from: $BACKUP_FILE"
echo "Restore started: $(date)"

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

BACKUP_DIR=$(find "$TEMP_DIR" -name "edge_dev_backup_*" -type d | head -1)

if [ -z "$BACKUP_DIR" ]; then
    echo "Invalid backup format"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Stop services
echo "Stopping services..."
# systemctl stop edge-dev || true
pkill -f "npm run dev" || true
pkill -f "uvicorn" || true

# Backup current state
echo "Creating current state backup..."
CURRENT_BACKUP="$EDGE_DEV_PATH/backups/pre_restore_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$CURRENT_BACKUP"     -C "$EDGE_DEV_PATH"     _ORGANIZED/ backend/ config/ ssl/ .env.production 2>/dev/null

# Restore source code
if [ -f "$BACKUP_DIR/source.tar.gz" ]; then
    echo "Restoring source code..."
    rm -rf "$EDGE_DEV_PATH/_ORGANIZED"
    rm -rf "$EDGE_DEV_PATH/backend"
    tar -xzf "$BACKUP_DIR/source.tar.gz" -C "$EDGE_DEV_PATH"
fi

# Restore configuration
if [ -f "$BACKUP_DIR/config.tar.gz" ]; then
    echo "Restoring configuration..."
    tar -xzf "$BACKUP_DIR/config.tar.gz" -C "$EDGE_DEV_PATH"
fi

# Restore database (if applicable)
if [ -f "$BACKUP_DIR/database.sql" ]; then
    echo "Restoring database..."
    # Add database restore commands here
fi

# Set permissions
chmod 600 "$EDGE_DEV_PATH/.env.production"
chmod 600 "$EDGE_DEV_PATH/ssl/private/*"

# Cleanup
rm -rf "$TEMP_DIR"

echo "Restore completed: $(date)"
echo "Current state backed up to: $CURRENT_BACKUP"
echo "Please restart services manually"
