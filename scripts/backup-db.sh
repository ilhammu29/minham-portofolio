#!/bin/sh
set -eu

DB_DIR="${DB_DIR:-/data}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_BASENAME="${DB_BASENAME:-portfolio.db}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/$STAMP"
mkdir -p "$TARGET"

FOUND=0
for file in "$DB_DIR/$DB_BASENAME" "$DB_DIR/$DB_BASENAME-wal" "$DB_DIR/$DB_BASENAME-shm"; do
  if [ -f "$file" ]; then
    cp "$file" "$TARGET/"
    FOUND=1
  fi
done

if [ "$FOUND" -eq 0 ]; then
  rmdir "$TARGET"
  echo "No database files found in $DB_DIR"
  exit 0
fi

find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_DAYS" -exec rm -rf {} +
echo "Backup created at $TARGET"
