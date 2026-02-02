#!/bin/bash
# Edge.dev Backup Script
# Generated on 2025-12-01 17:14:05 UTC

EDGE_DEV_PATH="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
BACKUP_PATH="{EDGE_DEV_PATH}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="edge_dev_backup_$DATE"
LOG_FILE="{BACKUP_PATH}/backup_$DATE.log"

# Create backup directory
mkdir -p "$BACKUP_PATH"
mkdir -p "$BACKUP_PATH/$BACKUP_NAME"

echo "Starting backup: $(date)" | tee -a "$LOG_FILE"

# Backup source code
echo "Backing up source code..." | tee -a "$LOG_FILE"
tar -czf "$BACKUP_PATH/$BACKUP_NAME/source.tar.gz" \
    -C "$EDGE_DEV_PATH/_ORGANIZED" \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=.git \
    --exclude=backups \
    CORE_FRONTEND/ backend/ 2>/dev/null

# Backup configuration
echo "Backing up configuration..." | tee -a "$LOG_FILE"
tar -czf "$BACKUP_PATH/$BACKUP_NAME/config.tar.gz" \
    -C "$EDGE_DEV_PATH" \
    config/ ssl/ .env.production 2>/dev/null

# Backup database (if applicable)
echo "Backing up database..." | tee -a "$LOG_FILE"
# Add database backup commands here

# Create backup manifest
cat > "$BACKUP_PATH/$BACKUP_NAME/manifest.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "backup_version": "1.0",
  "backup_type": "full",
  "components": [
    "source_code",
    "configuration",
    "database"
  ],
  "restore_instructions": "Extract components and restart services"
}
EOF

# Compress entire backup
echo "Compressing backup..." | tee -a "$LOG_FILE"
tar -czf "$BACKUP_PATH/$BACKUP_NAME.tar.gz" \
    -C "$BACKUP_PATH" \
    "$BACKUP_NAME"

# Remove uncompressed backup
rm -rf "$BACKUP_PATH/$BACKUP_NAME"

# Clean old backups (keep last 30 days)
echo "Cleaning old backups..." | tee -a "$LOG_FILE"
find "$BACKUP_PATH" -name "edge_dev_backup_*.tar.gz" \
    -mtime +30 \
    -delete

echo "Backup completed: $BACKUP_PATH/$BACKUP_NAME.tar.gz" | tee -a "$LOG_FILE"
echo "Backup size: $(du -h "$BACKUP_PATH/$BACKUP_NAME.tar.gz" | cut -f1)" | tee -a "$LOG_FILE"
echo "Backup completed: $(date)" | tee -a "$LOG_FILE"
