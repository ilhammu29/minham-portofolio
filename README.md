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

<table border="0" cellpadding="0" cellspacing="0" width="100%">
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

---

## 🛠️ Persiapan & Cara Instalasi (Development)

> [!NOTE]  
> Bagian ini memandu Anda untuk menjalankan *source code* di lingkungan pengembangan (*local machine*) secara manual tanpa Docker. Sangat cocok jika Anda ingin melakukan modifikasi UI/API dengan fitur *hot-reload*.

### 1. Kebutuhan Sistem

Pastikan perangkat Anda memenuhi spesifikasi berikut:

| Komponen | Versi / Keterangan |
| :--- | :--- |
| **Node.js** | `v18.x` atau lebih baru (Sangat direkomendasikan versi LTS) |
| **Git** | Versi terbaru untuk proses *cloning* repositori |
| **Database** | **SQLite** (Sudah terintegrasi, tidak perlu instalasi mandiri) |
| **Package Manager** | `npm` (Bawaan Node.js) atau `yarn` |

---
