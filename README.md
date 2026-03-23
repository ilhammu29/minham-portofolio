# Minham Portofolio

Web portofolio full-stack modern:
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express + Prisma + SQLite
- Deploy: Docker Compose
- Production edge: Caddy (HTTPS otomatis)

## Fitur

- Landing page portfolio modern.
- Form kontak tersimpan ke database.
- Admin panel `/admin`:
  - login username/password (JWT)
  - kelola profile (CRUD update)
  - kelola projects (CRUD)
  - kelola experience (CRUD)
  - inbox pesan (list + delete)
- Hardening production:
  - `/admin` dan `/api/admin*` dilindungi IP whitelist di Caddy
  - `/admin` dan `/api/admin*` dilindungi Basic Auth di Caddy
  - backup database otomatis ke folder `backups/`

## Struktur

- `frontend/` React SPA (landing + admin panel)
- `backend/` REST API
- `data/` database SQLite
- `backups/` hasil backup otomatis
- `scripts/backup-db.sh` script backup
- `scripts/setup-prod-env.sh` generator `.env` production
- `docker-compose.yml` stack lokal/server biasa
- `docker-compose.prod.yml` stack production HTTPS
- `infra/caddy/Caddyfile` reverse proxy + admin hardening

## Jalankan lokal

```bash
cd /srv/http/minham-portofolio
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="password-kuat-lokal"
export ADMIN_JWT_SECRET="jwt-secret-kuat"

docker compose up -d --build
```

Akses:
- Website: `http://localhost:8080`
- Admin: `http://localhost:8080/admin`

## Deploy production (cara cepat, direkomendasikan)

1. Arahkan DNS domain ke IP server.
2. Generate `.env` otomatis:

```bash
cd /srv/http/minham-portofolio
./scripts/setup-prod-env.sh \
  --domain portfolio.domainkamu.com \
  --email emailkamu@domain.com \
  --admin-user admin \
  --admin-pass 'PasswordAdminAplikasiYangKuat' \
  --basic-user opsadmin \
  --basic-pass 'PasswordBasicAuthYangKuat' \
  --allowed-ips 'IP_KAMU/32 127.0.0.1/32'
```

3. Deploy production:

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
```

Akses production:
- `https://DOMAIN`
- `https://DOMAIN/admin`

## Deploy production (manual)

Jika perlu isi manual, salin template:

```bash
cp .env.production.example .env
```

Lalu isi semua variabel wajib di `.env`:
- `DOMAIN`, `ACME_EMAIL`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET`
- `ADMIN_ALLOWED_IPS`
- `ADMIN_BASIC_USER`, `ADMIN_BASIC_PASSWORD_HASH`

## Endpoint API

Public:
- `GET /api/health`
- `GET /api/profile`
- `GET /api/projects`
- `GET /api/experiences`
- `POST /api/contact`

Admin auth:
- `POST /api/admin/login`
- `GET /api/admin/session`

Admin content (Bearer JWT):
- `GET /api/admin/messages`
- `DELETE /api/admin/messages/:id`
- `PUT /api/admin/profile`
- `POST /api/admin/projects`
- `PUT /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`
- `POST /api/admin/experiences`
- `PUT /api/admin/experiences/:id`
- `DELETE /api/admin/experiences/:id`

## Backup otomatis

- Service: `db-backup`
- Interval default: setiap `360` menit
- Retensi default: `14` hari
- Override via env:
  - `BACKUP_INTERVAL_MIN`
  - `BACKUP_KEEP_DAYS`

## Catatan keamanan

- Gunakan `ADMIN_PASSWORD_HASH` di production (jangan plaintext password).
- Gunakan `ADMIN_JWT_SECRET` panjang dan acak.
- Isi `ADMIN_ALLOWED_IPS` dengan IP kantor/VPN kamu, bukan publik luas.
- Simpan file `.env` production dengan permission terbatas.

## Export Docker Bundle (siap pindah server)

Build + export image dan file deploy:

```bash
cd /srv/http/minham-portofolio
./scripts/export-docker-bundle.sh
```

Output ada di folder `releases/`:
- `minham-portofolio-bundle-YYYYMMDD-HHMMSS.tar.gz`
- `minham-portofolio-bundle-YYYYMMDD-HHMMSS.sha256`

Import di server tujuan:

```bash
./scripts/import-docker-bundle.sh minham-portofolio-bundle-YYYYMMDD-HHMMSS.tar.gz /opt/minham-portofolio
cd /opt/minham-portofolio
./scripts/setup-prod-env.sh --domain <domain> --email <email> --admin-user admin --admin-pass '<app-pass>' --basic-user opsadmin --basic-pass '<basic-pass>' --allowed-ips '<ip/32 127.0.0.1/32>'
docker compose --env-file .env -f docker-compose.prod.yml up -d
```
