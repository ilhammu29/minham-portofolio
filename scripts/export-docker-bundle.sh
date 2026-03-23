#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RELEASE_DIR="$ROOT_DIR/releases"
BUNDLE_NAME=""
SKIP_BUILD="false"
INCLUDE_BASE_IMAGES="true"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/export-docker-bundle.sh [options]

Options:
  --name <bundle-name>       Custom bundle filename (without .tar.gz)
  --skip-build               Do not rebuild backend/frontend before export
  --no-base-images           Do not include caddy/alpine base images
  -h, --help                 Show help
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --name) BUNDLE_NAME="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD="true"; shift 1 ;;
    --no-base-images) INCLUDE_BASE_IMAGES="false"; shift 1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found" >&2
  exit 1
fi

mkdir -p "$RELEASE_DIR"
TS="$(date +%Y%m%d-%H%M%S)"
if [ -z "$BUNDLE_NAME" ]; then
  BUNDLE_NAME="minham-portofolio-bundle-$TS"
fi

TMP_DIR="$RELEASE_DIR/.tmp-$BUNDLE_NAME"
OUT_FILE="$RELEASE_DIR/$BUNDLE_NAME.tar.gz"
SUM_FILE="$RELEASE_DIR/$BUNDLE_NAME.sha256"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR/infra/caddy" "$TMP_DIR/scripts"

cd "$ROOT_DIR"

if [ "$SKIP_BUILD" = "false" ]; then
  echo "[1/4] Building backend/frontend images..."
  docker compose -f docker-compose.prod.yml build backend frontend
fi

IMAGES="minham-portofolio-backend:latest minham-portofolio-frontend:latest"

if [ "$INCLUDE_BASE_IMAGES" = "true" ]; then
  BASE_IMAGES="caddy:2.8-alpine alpine:3.20"
  for img in $BASE_IMAGES; do
    if ! docker image inspect "$img" >/dev/null 2>&1; then
      echo "Base image not found locally: $img (trying pull...)"
      if ! docker pull "$img" >/dev/null 2>&1; then
        echo "Warning: cannot pull $img, continue without this base image"
        continue
      fi
    fi
    IMAGES="$IMAGES $img"
  done
fi

echo "[2/4] Saving images to tar..."
docker save $IMAGES -o "$TMP_DIR/images.tar"

echo "[3/4] Copying deployment files..."
cp "$ROOT_DIR/docker-compose.prod.yml" "$TMP_DIR/"
cp "$ROOT_DIR/.env.production.example" "$TMP_DIR/"
cp "$ROOT_DIR/README.md" "$TMP_DIR/"
cp "$ROOT_DIR/infra/caddy/Caddyfile" "$TMP_DIR/infra/caddy/Caddyfile"
cp "$ROOT_DIR/scripts/setup-prod-env.sh" "$TMP_DIR/scripts/setup-prod-env.sh"
cp "$ROOT_DIR/scripts/backup-db.sh" "$TMP_DIR/scripts/backup-db.sh"
cp "$ROOT_DIR/scripts/import-docker-bundle.sh" "$TMP_DIR/scripts/import-docker-bundle.sh"
chmod +x "$TMP_DIR/scripts/setup-prod-env.sh" "$TMP_DIR/scripts/backup-db.sh" "$TMP_DIR/scripts/import-docker-bundle.sh"

( cd "$RELEASE_DIR" && tar -czf "$OUT_FILE" "$(basename "$TMP_DIR")" )
sha256sum "$OUT_FILE" > "$SUM_FILE"

rm -rf "$TMP_DIR"

echo "[4/4] Done"
echo "Bundle : $OUT_FILE"
echo "SHA256 : $SUM_FILE"
