<p align="center">
  <a href="URL_GAMBAR_BANNER_PROJECT_DISINI">
    <img src="URL_GAMBAR_BANNER_PROJECT_DISINI" alt="Minham Portofolio Banner" width="100%" style="border-radius: 8px;" />
  </a>
</p>

<h1 align="center">🚀 Minham Portofolio</h1>

<p align="center">
  <b>Modern Full-Stack Web Portfolio dengan Arsitektur Aman & Production-Ready.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Caddy-08A045?style=for-the-badge&logo=caddy&logoColor=white" alt="Caddy" />
</p>

---

## ✨ Fitur Utama

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%;">
  <tr>
    <td width="50%" valign="top">
      <b>🌐 Public Interface</b>
      <ul>
        <li><i>Landing page</i> portofolio berdesain modern dan responsif.</li>
        <li>Sistem form kontak yang langsung tersimpan ke <i>database</i>.</li>
      </ul>
      <b>🔐 Hardening & Security</b>
      <ul>
        <li>Rute <code>/admin</code> & <code>/api/admin*</code> dilindungi <b>IP Whitelist</b> di level Caddy.</li>
        <li>Rute admin diproteksi ganda dengan <b>Basic Auth</b>.</li>
        <li>HTTPS terkonfigurasi otomatis via Caddy Edge.</li>
        <li>Backup <i>database</i> otomatis ke folder <code>backups/</code>.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <b>⚙️ Admin Dashboard</b>
      <ul>
        <li>Otentikasi aman menggunakan JWT (Username/Password).</li>
        <li><b>Manajemen Profile:</b> CRUD detail profil utama.</li>
        <li><b>Manajemen Project:</b> CRUD daftar portofolio.</li>
        <li><b>Manajemen Experience:</b> CRUD riwayat kerja/pendidikan.</li>
        <li><b>Inbox Controller:</b> Baca & hapus pesan dari form kontak pengunjung.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📂 Struktur Arsitektur

```text
minham-portofolio/
├── frontend/                  # React SPA (Public Landing & Admin Panel)
├── backend/                   # Node.js REST API
├── data/                      # Persistensi Database SQLite
├── backups/                   # Direktori hasil backup DB otomatis
├── infra/
│   └── caddy/Caddyfile        # Konfigurasi Reverse Proxy & Admin Hardening
├── scripts/
│   ├── backup-db.sh           # Eksekutor backup database
│   ├── setup-prod-env.sh      # Generator .env untuk production
│   ├── export-docker-bundle.sh # Script packaging app siap migrasi
│   └── import-docker-bundle.sh # Script import app di server tujuan
├── docker-compose.yml         # Stack untuk Local/Development
└── docker-compose.prod.yml    # Stack untuk Production (HTTPS + Caddy)

🛠️ Persiapan & Cara Instalasi (Development)
Bagian ini memandu Anda untuk menjalankan source code di lingkungan pengembangan (local machine) secara manual tanpa Docker.

1. Kebutuhan Sistem
Pastikan sistem Anda sudah terinstal:

Node.js (Direkomendasikan v18 atau lebih baru)

Git

2. Clone Repositori
Bash

git clone [https://github.com/ilhammu29/minham-portofolio.git](https://github.com/ilhammu29/minham-portofolio.git)
cd minham-portofolio
3. Setup & Instalasi Manual
Buka dua terminal terpisah:

Terminal 1 - Backend:

Bash

cd backend
npm install
cp .env.example .env
npx prisma db push
npm run dev
Terminal 2 - Frontend:

Bash

cd frontend
npm install
cp .env.example .env
npm run dev
📍 Akses: Frontend biasanya berjalan di http://localhost:5173.

💻 Menjalankan Cepat via Docker (Local)
Gunakan Docker Compose jika ingin melihat hasil akhir tanpa instalasi package manual.

Bash

cd /srv/http/minham-portofolio

# Set environment variables
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="password-kuat-lokal"
export ADMIN_JWT_SECRET="jwt-secret-kuat"

# Jalankan container
docker compose up -d --build
📍 Akses Publik: http://localhost:8080

📍 Akses Admin: http://localhost:8080/admin

🚀 Panduan Deploy Production
A. Cara Cepat (Sangat Direkomendasikan)
Gunakan skrip otomatis agar environment terbentuk dengan aman:

Bash

cd /srv/http/minham-portofolio
./scripts/setup-prod-env.sh \
  --domain portfolio.domainkamu.com \
  --email emailkamu@domain.com \
  --admin-user admin \
  --admin-pass 'PasswordAdminAplikasiYangKuat' \
  --basic-user opsadmin \
  --basic-pass 'PasswordBasicAuthYangKuat' \
  --allowed-ips 'IP_KAMU/32 127.0.0.1/32'

docker compose --env-file .env -f docker-compose.prod.yml up -d --build
B. Cara Manual
Salin file env: cp .env.production.example .env

Lengkapi variabel wajib: DOMAIN, ACME_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_ALLOWED_IPS, dll.

💾 Export & Migrasi (Docker Bundle)
Aplikasi ini mendukung bundling penuh untuk migrasi antar server tanpa build ulang.

1. Export dari Server Asal:

Bash

cd /srv/http/minham-portofolio
./scripts/export-docker-bundle.sh
2. Import di Server Tujuan:

Bash

./scripts/import-docker-bundle.sh bundle-file.tar.gz /opt/minham-portofolio
cd /opt/minham-portofolio
# Jalankan setup-prod-env.sh kembali untuk server baru
docker compose --env-file .env -f docker-compose.prod.yml up -d
📡 Referensi API Endpoints
<table width="100%" style="width: 100%;">
<tr>
<th width="20%">Akses</th>
<th width="15%">Method</th>
<th width="65%">Endpoint Route</th>
</tr>
<tr>
<td rowspan="5" align="center">🟢 <b>Public</b></td>
<td><code>GET</code></td>
<td><code>/api/health</code></td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/api/profile</code></td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/api/projects</code></td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/api/experiences</code></td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/api/contact</code></td>
</tr>
<tr>
<td rowspan="2" align="center">🟡 <b>Admin Auth</b></td>
<td><code>POST</code></td>
<td><code>/api/admin/login</code></td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/api/admin/session</code></td>
</tr>
<tr>
<td rowspan="7" align="center">🔴 <b>Protected


(Bearer JWT)</b></td>
<td><code>GET / DELETE</code></td>
<td><code>/api/admin/messages</code></td>
</tr>
<tr>
<td><code>PUT</code></td>
<td><code>/api/admin/profile</code></td>
</tr>
<tr>
<td><code>POST / PUT / DELETE</code></td>
<td><code>/api/admin/projects</code></td>
</tr>
<tr>
<td><code>POST / PUT / DELETE</code></td>
<td><code>/api/admin/experiences</code></td>
</tr>
</table>

⚙️ Sistem Auto-Backup & Keamanan
Backup Otomatis
Interval: Setiap 360 menit (6 jam).

Retensi: Disimpan selama 14 hari.

Override: Gunakan BACKUP_INTERVAL_MIN & BACKUP_KEEP_DAYS di file .env.

🛡️ Catatan Keamanan Krusial
Gunakan Hash: Gunakan ADMIN_PASSWORD_HASH di production (jangan plaintext).

Restriksi IP: Isi ADMIN_ALLOWED_IPS dengan IP statis/VPN Anda untuk melindungi rute admin.

Izin Berkas: Set izin file .env ke chmod 600.
