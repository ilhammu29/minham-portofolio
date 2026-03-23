#!/bin/sh
set -eu

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/import-docker-bundle.sh <bundle.tar.gz> [target-dir]

Example:
  ./scripts/import-docker-bundle.sh minham-portofolio-bundle-20260311-220000.tar.gz /opt/minham-portofolio
USAGE
}

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  usage
  exit 1
fi

BUNDLE="$1"
TARGET_DIR="${2:-$PWD/minham-portofolio-prod}"

if [ ! -f "$BUNDLE" ]; then
  echo "Bundle not found: $BUNDLE" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "[1/3] Extracting bundle..."
tar -xzf "$BUNDLE" -C "$TMP_DIR"
INNER_DIR="$(find "$TMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"

if [ -z "$INNER_DIR" ] || [ ! -f "$INNER_DIR/images.tar" ]; then
  echo "Invalid bundle structure" >&2
  exit 1
fi

echo "[2/3] Loading docker images..."
docker load -i "$INNER_DIR/images.tar"

echo "[3/3] Preparing deployment dir: $TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -f "$INNER_DIR/docker-compose.prod.yml" "$TARGET_DIR/"
cp -f "$INNER_DIR/.env.production.example" "$TARGET_DIR/"
cp -f "$INNER_DIR/README.md" "$TARGET_DIR/"
mkdir -p "$TARGET_DIR/infra/caddy" "$TARGET_DIR/scripts" "$TARGET_DIR/data" "$TARGET_DIR/backups"
cp -f "$INNER_DIR/infra/caddy/Caddyfile" "$TARGET_DIR/infra/caddy/Caddyfile"
cp -f "$INNER_DIR/scripts/setup-prod-env.sh" "$TARGET_DIR/scripts/setup-prod-env.sh"
cp -f "$INNER_DIR/scripts/backup-db.sh" "$TARGET_DIR/scripts/backup-db.sh"
chmod +x "$TARGET_DIR/scripts/setup-prod-env.sh" "$TARGET_DIR/scripts/backup-db.sh"

echo "Import selesai. Next step:"
echo "  cd $TARGET_DIR"
echo "  ./scripts/setup-prod-env.sh --domain <domain> --email <email> --admin-user admin --admin-pass '<app-pass>' --basic-user opsadmin --basic-pass '<basic-pass>' --allowed-ips '<ip/32 127.0.0.1/32>'"
echo "  docker compose --env-file .env -f docker-compose.prod.yml up -d"
