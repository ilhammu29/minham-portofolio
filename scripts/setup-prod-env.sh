#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/setup-prod-env.sh \
    --domain portfolio.example.com \
    --email you@example.com \
    --admin-user admin \
    --admin-pass 'YourStrongAppPassword' \
    --basic-user opsadmin \
    --basic-pass 'YourStrongProxyPassword' \
    --allowed-ips '103.10.10.10/32 127.0.0.1/32'

Optional:
  --jwt-secret <value>           (default: random 48-byte hex)
  --jwt-expires <value>          (default: 12h)
  --backup-interval-min <value>  (default: 360)
  --backup-keep-days <value>     (default: 14)
USAGE
}

DOMAIN=""
ACME_EMAIL=""
ADMIN_USERNAME=""
ADMIN_PASSWORD=""
ADMIN_BASIC_USER=""
ADMIN_BASIC_PASSWORD=""
ADMIN_ALLOWED_IPS=""
ADMIN_JWT_SECRET=""
ADMIN_JWT_EXPIRES="12h"
BACKUP_INTERVAL_MIN="360"
BACKUP_KEEP_DAYS="14"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) ACME_EMAIL="$2"; shift 2 ;;
    --admin-user) ADMIN_USERNAME="$2"; shift 2 ;;
    --admin-pass) ADMIN_PASSWORD="$2"; shift 2 ;;
    --basic-user) ADMIN_BASIC_USER="$2"; shift 2 ;;
    --basic-pass) ADMIN_BASIC_PASSWORD="$2"; shift 2 ;;
    --allowed-ips) ADMIN_ALLOWED_IPS="$2"; shift 2 ;;
    --jwt-secret) ADMIN_JWT_SECRET="$2"; shift 2 ;;
    --jwt-expires) ADMIN_JWT_EXPIRES="$2"; shift 2 ;;
    --backup-interval-min) BACKUP_INTERVAL_MIN="$2"; shift 2 ;;
    --backup-keep-days) BACKUP_KEEP_DAYS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [ -z "$DOMAIN" ] || [ -z "$ACME_EMAIL" ] || [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ] || [ -z "$ADMIN_BASIC_USER" ] || [ -z "$ADMIN_BASIC_PASSWORD" ] || [ -z "$ADMIN_ALLOWED_IPS" ]; then
  echo "Missing required args." >&2
  usage
  exit 1
fi

if [ -z "$ADMIN_JWT_SECRET" ]; then
  ADMIN_JWT_SECRET="$(openssl rand -hex 48)"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found. Install Docker first." >&2
  exit 1
fi

APP_HASH_RAW="$(docker run --rm caddy:2.8-alpine caddy hash-password --plaintext "$ADMIN_PASSWORD")"
BASIC_HASH_RAW="$(docker run --rm caddy:2.8-alpine caddy hash-password --plaintext "$ADMIN_BASIC_PASSWORD")"

escape_for_compose() {
  # Compose treats $ as interpolation; escape it with $$ in env file values.
  printf '%s' "$1" | sed 's/\$/\$\$/g'
}

APP_HASH="$(escape_for_compose "$APP_HASH_RAW")"
BASIC_HASH="$(escape_for_compose "$BASIC_HASH_RAW")"

cat > "$ENV_FILE" <<EOF_ENV
DOMAIN=$DOMAIN
ACME_EMAIL=$ACME_EMAIL

ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD_HASH=$APP_HASH
ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET
ADMIN_JWT_EXPIRES=$ADMIN_JWT_EXPIRES

ADMIN_ALLOWED_IPS=$ADMIN_ALLOWED_IPS
ADMIN_BASIC_USER=$ADMIN_BASIC_USER
ADMIN_BASIC_PASSWORD_HASH=$BASIC_HASH

BACKUP_INTERVAL_MIN=$BACKUP_INTERVAL_MIN
BACKUP_KEEP_DAYS=$BACKUP_KEEP_DAYS
EOF_ENV

echo "Generated: $ENV_FILE"
echo "Next: docker compose --env-file .env -f docker-compose.prod.yml up -d --build"
