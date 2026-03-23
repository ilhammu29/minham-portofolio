<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minham Portofolio Documentation</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0d1117;
            --text-color: #c9d1d9;
            --header-color: #f0f6fc;
            --border-color: #30363d;
            --accent-color: #58a6ff;
            --code-bg: #161b22;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            margin: 0;
            padding: 2rem;
            display: flex;
            justify-content: center;
        }

        .container {
            max-width: 850px;
            width: 100%;
            background: #0d1117;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 2rem;
        }

        h1, h2, h3 {
            color: var(--header-color);
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.3em;
            margin-top: 1.5rem;
        }

        h1 { border-bottom: none; text-align: center; }

        a { color: var(--accent-color); text-decoration: none; }
        a:hover { text-decoration: underline; }

        code {
            font-family: 'Fira Code', monospace;
            background-color: rgba(110, 118, 129, 0.4);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-size: 85%;
        }

        pre {
            background-color: var(--code-bg);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid var(--border-color);
        }

        pre code {
            background-color: transparent;
            padding: 0;
            font-size: 90%;
            color: #e6edf3;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }

        table th, table td {
            border: 1px solid var(--border-color);
            padding: 12px;
            text-align: left;
        }

        table th { background-color: #161b22; }

        .banner {
            width: 100%;
            border-radius: 8px;
            margin-bottom: 1rem;
        }

        .center { text-align: center; }

        hr {
            height: 0.25em;
            padding: 0;
            margin: 24px 0;
            background-color: var(--border-color);
            border: 0;
        }

        ul { padding-left: 2rem; }
        li { margin-bottom: 0.5rem; }

        .badge-container img { margin: 0 4px; }
    </style>
</head>
<body>

<div class="container">
    <div class="center">
        <a href="URL_GAMBAR_BANNER_PROJECT_DISINI">
            <img src="URL_GAMBAR_BANNER_PROJECT_DISINI" alt="Minham Portofolio Banner" class="banner" />
        </a>
        <h1>🚀 Minham Portofolio</h1>
        <p><b>Modern Full-Stack Web Portfolio dengan Arsitektur Aman & Production-Ready.</b></p>
        
        <div class="badge-container">
            <img src="https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
            <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
            <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
            <img src="https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express" />
            <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
            <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
            <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
            <img src="https://img.shields.io/badge/Caddy-08A045?style=for-the-badge&logo=caddy&logoColor=white" alt="Caddy" />
        </div>
    </div>

    <hr>

    <h2>✨ Fitur Utama</h2>
    <table>
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

    <hr>

    <h2>📂 Struktur Arsitektur</h2>
<pre><code>minham-portofolio/
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
└── docker-compose.prod.yml    # Stack untuk Production (HTTPS + Caddy)</code></pre>

    <h2>🛠️ Persiapan & Cara Instalasi (Development)</h2>
    <p>Bagian ini memandu Anda untuk menjalankan source code di lingkungan pengembangan (local machine) secara manual tanpa Docker.</p>

    <h3>1. Kebutuhan Sistem</h3>
    <ul>
        <li><b>Node.js</b> (Direkomendasikan v18 atau lebih baru)</li>
        <li><b>Git</b></li>
    </ul>

    <h3>2. Clone Repositori</h3>
<pre><code>git clone https://github.com/ilhammu29/minham-portofolio.git
cd minham-portofolio</code></pre>

    <h3>3. Setup & Instalasi Manual</h3>
    <p><b>Terminal 1 - Backend:</b></p>
<pre><code>cd backend
npm install
cp .env.example .env
npx prisma db push
npm run dev</code></pre>

    <p><b>Terminal 2 - Frontend:</b></p>
<pre><code>cd frontend
npm install
cp .env.example .env
npm run dev</code></pre>
    <p>📍 <b>Akses:</b> Frontend biasanya berjalan di <code>http://localhost:5173</code>.</p>

    <hr>

    <h2>💻 Menjalankan Cepat via Docker (Local)</h2>
    <p>Gunakan Docker Compose jika ingin melihat hasil akhir tanpa instalasi package manual.</p>
<pre><code>cd /srv/http/minham-portofolio

# Set environment variables
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="password-kuat-lokal"
export ADMIN_JWT_SECRET="jwt-secret-kuat"

# Jalankan container
docker compose up -d --build</code></pre>
    <ul>
        <li>📍 <b>Akses Publik:</b> <code>http://localhost:8080</code></li>
        <li>📍 <b>Akses Admin:</b> <code>http://localhost:8080/admin</code></li>
    </ul>

    <hr>

    <h2>🚀 Panduan Deploy Production</h2>
    <h3>A. Cara Cepat (Sangat Direkomendasikan)</h3>
<pre><code>cd /srv/http/minham-portofolio
./scripts/setup-prod-env.sh \
  --domain portfolio.domainkamu.com \
  --email emailkamu@domain.com \
  --admin-user admin \
  --admin-pass 'PasswordAdminAplikasiYangKuat' \
  --basic-user opsadmin \
  --basic-pass 'PasswordBasicAuthYangKuat' \
  --allowed-ips 'IP_KAMU/32 127.0.0.1/32'

docker compose --env-file .env -f docker-compose.prod.yml up -d --build</code></pre>

    <hr>

    <h2>📡 Referensi API Endpoints</h2>
    <table>
        <tr>
            <th>Akses</th>
            <th>Method</th>
            <th>Endpoint Route</th>
        </tr>
        <tr>
            <td rowspan="5" align="center" style="background: #1a271a;">🟢 <b>Public</b></td>
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
            <td rowspan="2" align="center" style="background: #2b2b1a;">🟡 <b>Admin Auth</b></td>
            <td><code>POST</code></td>
            <td><code>/api/admin/login</code></td>
        </tr>
        <tr>
            <td><code>GET</code></td>
            <td><code>/api/admin/session</code></td>
        </tr>
        <tr>
            <td rowspan="4" align="center" style="background: #2b1a1a;">🔴 <b>Protected</b></td>
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

    <hr>

    <h2>🛡️ Catatan Keamanan & Backup</h2>
    <ul>
        <li><b>Backup:</b> Otomatis setiap 6 jam, retensi 14 hari.</li>
        <li><b>IP Whitelist:</b> Pastikan <code>ADMIN_ALLOWED_IPS</code> diisi dengan IP kamu.</li>
        <li><b>Permissions:</b> Gunakan <code>chmod 600 .env</code> di server production.</li>
    </ul>

</div>

</body>
</html>
