#!/usr/bin/env bash
set -euo pipefail

DB_PATH="/var/lib/vocab-app/vocab.db"
BACKUP_DIR="/var/lib/vocab-app/backups"
TS=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/vocab-$TS.db'"

# Keep two weeks of daily backups.
find "$BACKUP_DIR" -name '*.db' -mtime +14 -delete
