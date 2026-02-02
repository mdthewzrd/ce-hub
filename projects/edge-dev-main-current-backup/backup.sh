#!/bin/bash
# Edge.dev Backup Script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/edge-dev"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
if [ "$1" = "database" ]; then
    echo "Backing up database..."
    pg_dump edgedev > $BACKUP_DIR/database_$DATE.sql
    gzip $BACKUP_DIR/database_$DATE.sql
fi

# Files backup
if [ "$1" = "files" ]; then
    echo "Backing up files..."
    tar -czf $BACKUP_DIR/files_$DATE.tar.gz /app/uploads /app/logs
fi

echo "Backup completed: $BACKUP_DIR"
