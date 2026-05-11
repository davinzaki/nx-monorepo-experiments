# Panduan Deploy Aras Pro Frontend

## Daftar Isi
1. [Konsep Docker](#konsep-docker)
2. [Struktur File Docker](#struktur-file-docker)
3. [Deploy Satu App (sfa)](#deploy-satu-app-sfa)
4. [Menambah App Baru](#menambah-app-baru)
5. [Deploy ke VPS](#deploy-ke-vps)
6. [Update Kode di VPS](#update-kode-di-vps)
7. [Troubleshooting](#troubleshooting)

---

## Konsep Docker

### Masalah Sebelum Docker

Develop di Mac dengan Node 18, tapi VPS-nya Linux dengan Node 16 — kode yang jalan di lokal bisa gagal di server karena beda versi, beda OS, beda konfigurasi. Ini dulu disebut **"works on my machine"** problem.

### Docker Solusinya: Bungkus Semua Jadi Satu Paket

Docker membungkus aplikasi **beserta seluruh environment-nya** — OS, Node version, dependency, konfigurasi — menjadi satu paket yang disebut **image**. Image ini bisa dijalankan di mana saja yang ada Docker dan hasilnya selalu sama persis.

```
┌─────────────────────────────────┐
│         Docker Image            │
│                                 │
│  ┌─────────────────────────┐   │
│  │ nginx:alpine (mini OS)  │   │
│  ├─────────────────────────┤   │
│  │ index.html              │   │
│  │ main-P7422T5D.js        │   │
│  │ styles-Q27L7E7A.css     │   │
│  │ nginx.conf              │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Analogi Sederhana

| Dunia Nyata | Docker |
|-------------|--------|
| Resep masakan | `Dockerfile` |
| Makanan jadi (hasil masak) | Image |
| Makanan yang sedang disajikan | Container |
| Restoran tempat makan | VPS / server |

Masak sekali (build image), hasilnya bisa disajikan di restoran manapun (server manapun) dan rasanya selalu sama.

### Kenapa Deploy Jadi Semudah Ini

Tanpa Docker, deploy ke VPS prosesnya panjang:
```
Install Node → Install npm → Clone repo → npm install
→ npm run build → Install nginx → Konfigurasi nginx
→ Setup systemd agar auto-restart → ...
```

Dengan Docker, di VPS cukup:
```bash
docker compose up -d --build
```

Karena semua langkah di atas sudah ada di dalam `Dockerfile`. VPS hanya perlu tahu cara menjalankan Docker — sisanya Docker yang urus.

### Cara Kerja Dockerfile Ini

```dockerfile
# 1. Ambil OS mini yang sudah ada Node 22
FROM node:22-alpine AS builder

# 2. Masuk ke folder kerja di dalam container
WORKDIR /app

# 3. Copy package.json ke dalam container
COPY package*.json ./

# 4. Install semua dependency DI DALAM container
RUN npm install

# 5. Copy seluruh kode ke dalam container
COPY . .

# 6. Build Angular — hasilnya di dist/apps/sfa/browser/
RUN npx nx build sfa --configuration=production

# ↑ Semua di atas hanya untuk build, tidak ikut ke production
# ─────────────────────────────────────────────────────────

# 7. Ambil OS mini yang sudah ada nginx (sangat ringan, ~5MB)
FROM nginx:alpine

# 8. Ambil HANYA hasil build dari stage sebelumnya
COPY --from=builder /app/dist/apps/sfa/browser /usr/share/nginx/html

# 9. Pakai konfigurasi nginx kita
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

> Node.js (yang berat, ~180MB) tidak ikut ke image final — hanya dipakai untuk build. Image final hanya berisi nginx + file statis. Hasilnya image kecil dan cepat.

### Container vs VM

Sebelum Docker, orang pakai **Virtual Machine (VM)** untuk isolasi — tapi VM berat karena harus emulasi seluruh hardware dan OS.

```
VM                          Docker Container
┌──────────────┐            ┌──────────────┐
│  Guest OS    │            │     App      │
│  (Linux)     │            │  (nginx)     │
├──────────────┤            ├──────────────┤
│  Hypervisor  │            │  Docker      │
├──────────────┤            │  Engine      │
│  Host OS     │            ├──────────────┤
└──────────────┘            │  Host OS     │
                            └──────────────┘
Berat, boot menit           Ringan, start detik
```

Container berbagi OS dengan host langsung — jauh lebih ringan dan start dalam hitungan detik.

### Istilah-Istilah

| Term | Artinya |
|------|---------|
| **Image** | Paket hasil build dari Dockerfile. Ibarat "installer" aplikasi |
| **Container** | Image yang sedang dijalankan. Ibarat aplikasi yang sudah berjalan |
| **nginx** | Web server ringan yang bertugas melayani file statis ke browser |
| **Multi-stage build** | Teknik Docker: pakai beberapa base image. Stage build pakai Node.js (berat), stage run pakai nginx (ringan). Image final hanya berisi hasil stage terakhir |
| **SPA (Single Page Application)** | App web yang hanya punya satu `index.html`. Navigasi antar halaman dihandle JavaScript, bukan server |
| **Port** | "Pintu" komunikasi jaringan. `"8080:80"` artinya port 8080 server diteruskan ke port 80 nginx di dalam container |
| **`docker compose up -d --build`** | `up` = jalankan, `-d` = background, `--build` = rebuild image dulu sebelum jalan |
| **`restart: unless-stopped`** | Container otomatis restart kalau crash atau server reboot, kecuali di-stop manual |

---

## Struktur File Docker

```
aras-pro-frontend/
├── Dockerfile          # Resep build Docker (generik, bisa untuk semua apps)
├── nginx.conf          # Konfigurasi web server
├── docker-compose.yml  # Definisi semua services/apps yang di-deploy
└── .dockerignore       # File yang tidak perlu masuk Docker
```

### Fungsi Masing-masing File

| File | Fungsi |
|------|--------|
| `Dockerfile` | Instruksi build image: install deps → build Angular → serve dengan nginx |
| `nginx.conf` | Konfigurasi nginx: routing SPA, gzip, cache |
| `docker-compose.yml` | Shortcut untuk menjalankan satu atau banyak app sekaligus |
| `.dockerignore` | Exclude `node_modules/`, `dist/`, `.git/` agar build lebih cepat |

---

## Deploy Satu App (sfa)

### Prerequisite
- Docker Desktop (local) atau Docker Engine (VPS) sudah terinstall
- Repository sudah di-clone

### Build dan Jalankan
```bash
# Build image
docker buildx build -t aras-pro-sfa .

# Jalankan (test local)
docker run -p 8080:80 aras-pro-sfa
# buka http://localhost:8080

# Atau pakai docker compose
docker compose up -d --build
```

---

## Menambah App Baru

Contoh: menambah app bernama `admin`.

### Langkah 1 — Generate App di Nx
```bash
npx nx g @nx/angular:app admin --tags="scope:admin,type:app"
```

### Langkah 2 — Update `Dockerfile`

Jadikan Dockerfile generik dengan build argument `APP_NAME`:

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
ARG APP_NAME=sfa
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx nx build ${APP_NAME} --configuration=production

# Stage 2: Serve
FROM nginx:alpine
ARG APP_NAME=sfa
COPY --from=builder /app/dist/apps/${APP_NAME}/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

> `ARG APP_NAME=sfa` artinya default-nya `sfa`. Kalau tidak di-specify, otomatis build app `sfa`.

### Langkah 3 — Update `docker-compose.yml`

Tambah service baru untuk setiap app. Setiap app pakai port berbeda:

```yaml
services:
  sfa:
    build:
      context: .
      args:
        APP_NAME: sfa
    ports:
      - "80:80"
    restart: unless-stopped

  admin:
    build:
      context: .
      args:
        APP_NAME: admin
    ports:
      - "81:80"
    restart: unless-stopped
```

> Port `"81:80"` artinya port 81 di server diteruskan ke port 80 di dalam container nginx.

### Langkah 4 — Build dan Jalankan

```bash
# Jalankan semua apps sekaligus
docker compose up -d --build

# Atau jalankan satu app saja
docker compose up -d --build admin
```

### Referensi Port per App

| App | Port di Server | URL |
|-----|---------------|-----|
| sfa | 80 | `http://<ip-server>` |
| admin | 81 | `http://<ip-server>:81` |
| app-baru | 82 | `http://<ip-server>:82` |

---

## Deploy ke VPS

> **Catatan:** Panduan ini untuk **bare VPS** (Linux server tanpa control panel seperti EasyPanel, Plesk, cPanel, dsb). Kalau VPS sudah ada EasyPanel, deploy lewat dashboard EasyPanel — dia yang handle reverse proxy dan SSL otomatis. Untuk VPS perusahaan yang bersih, ikuti panduan di bawah.

### Prerequisite di VPS
```bash
# Install Docker Engine (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh

# Tambah user ke group docker (agar tidak perlu sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi
docker --version
docker compose version
```

### Clone dan Deploy
```bash
# Clone repository
git clone <repo-url>
cd aras-pro-frontend

# Build dan jalankan semua apps
docker compose up -d --build

# Cek status container
docker compose ps
```

### Cek App Berjalan
```bash
# Lihat log
docker compose logs -f

# Lihat log app tertentu
docker compose logs -f sfa
```

Buka di browser: `http://<ip-vps>` untuk app `sfa`, `http://<ip-vps>:81` untuk `admin`.

---

## Multiple Apps di Bare VPS (Tanpa EasyPanel)

Kalau VPS tidak punya control panel, perlu tambah **reverse proxy** sendiri sebagai "pintu depan" yang routing traffic berdasarkan domain/subdomain.

```
Internet ──port 80/443──► Traefik (reverse proxy)
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       sfa.domain.com   admin.domain.com   app.domain.com
       ┌───────────┐   ┌───────────┐   ┌───────────┐
       │    sfa    │   │   admin   │   │  app-lain │
       └───────────┘   └───────────┘   └───────────┘
```

### `docker-compose.yml` dengan Traefik

```yaml
services:
  traefik:
    image: traefik:v3
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.le.acme.tlschallenge=true"
      - "--certificatesresolvers.le.acme.email=<email-kamu>"
      - "--certificatesresolvers.le.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt:/letsencrypt
    restart: unless-stopped

  sfa:
    build:
      context: .
      args:
        APP_NAME: sfa
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.sfa.rule=Host(`sfa.domain.com`)"
      - "traefik.http.routers.sfa.entrypoints=websecure"
      - "traefik.http.routers.sfa.tls.certresolver=le"
    restart: unless-stopped

  admin:
    build:
      context: .
      args:
        APP_NAME: admin
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin.rule=Host(`admin.domain.com`)"
      - "traefik.http.routers.admin.entrypoints=websecure"
      - "traefik.http.routers.admin.tls.certresolver=le"
    restart: unless-stopped

volumes:
  letsencrypt:
```

Traefik otomatis:
- Routing subdomain ke container yang tepat
- SSL/HTTPS gratis via Let's Encrypt
- Tidak perlu konfigurasi nginx manual per app

### Deploy
```bash
docker compose up -d --build
```

Setiap app langsung bisa diakses via `https://sfa.domain.com` dan `https://admin.domain.com`.

---

## CI/CD dengan GitHub Actions

Dengan CI/CD, setiap push ke branch `main` otomatis build image baru dan deploy ke VPS — tidak perlu manual `git pull` lagi.

### Alur CI/CD

```
Push ke main
      ↓
GitHub Actions (.github/workflows/deploy.yml)
├── Build Docker image
├── Push image ke GHCR (ghcr.io/<username>/<repo>:latest)
└── SSH ke VPS → pull image baru → docker compose up -d
      ↓
VPS otomatis berjalan dengan versi terbaru
```

### File yang Terlibat

| File | Fungsi |
|------|--------|
| `.github/workflows/deploy.yml` | Definisi pipeline CI/CD |
| `docker-compose.prod.yml` | Compose file untuk VPS — pakai image dari GHCR, bukan build lokal |
| `docker-compose.yml` | Tetap dipakai untuk development lokal (build dari source) |

### Setup Pertama Kali

#### Langkah 1 — Buat SSH Key khusus untuk GitHub Actions

Di local (bukan VPS):
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key
```

Ini menghasilkan 2 file:
- `~/.ssh/github_actions_key` → **private key** (masuk ke GitHub Secrets)
- `~/.ssh/github_actions_key.pub` → **public key** (masuk ke VPS)

#### Langkah 2 — Daftarkan public key ke VPS

```bash
# Copy isi public key
cat ~/.ssh/github_actions_key.pub

# Lalu di VPS, tambahkan ke authorized_keys
echo "isi-public-key-di-sini" >> ~/.ssh/authorized_keys
```

#### Langkah 3 — Buat folder app di VPS

```bash
# Di VPS
mkdir -p /app/aras-pro-frontend

# Copy docker-compose.prod.yml ke VPS
scp docker-compose.prod.yml user@<ip-vps>:/app/aras-pro-frontend/

# Buat file .env di VPS
echo "GITHUB_REPOSITORY=<github-username>/<repo-name>" > /app/aras-pro-frontend/.env
```

Ganti `<github-username>/<repo-name>` sesuai repository kamu. Contoh: `davinzaki/aras-pro-frontend`.

#### Langkah 4 — Tambah Secrets di GitHub

Buka repository di GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Tambahkan 3 secrets:

| Secret Name | Isi |
|-------------|-----|
| `VPS_HOST` | IP address VPS kamu |
| `VPS_USER` | Username SSH di VPS (biasanya `root` atau `ubuntu`) |
| `VPS_SSH_KEY` | Isi dari `~/.ssh/github_actions_key` (private key) |

Untuk isi `VPS_SSH_KEY`:
```bash
cat ~/.ssh/github_actions_key
# Copy semua output termasuk baris -----BEGIN dan -----END
```

#### Langkah 5 — Allow GHCR pull di VPS

Image di GHCR defaultnya private. VPS perlu login ke GHCR untuk bisa pull:

```bash
# Di VPS — login ke GHCR dengan GitHub Personal Access Token
echo "<github-pat>" | docker login ghcr.io -u <github-username> --password-stdin
```

Buat GitHub PAT di: GitHub → Settings → Developer settings → Personal access tokens → **read:packages** permission.

### Cara Kerja Setelah Setup

```bash
# Di local — cukup push seperti biasa
git add .
git commit -m "feat: update halaman leads"
git push origin main

# GitHub Actions otomatis berjalan
# Dalam ~3-5 menit, VPS sudah running versi terbaru
```

Pantau progress di: repository GitHub → tab **Actions**.

### Cek Image di GHCR

Setelah push pertama, image tersedia di:
```
https://github.com/<username>/<repo>/pkgs/container/<repo>
```

---

## Update Kode di VPS

Setiap kali ada perubahan kode:

```bash
# Masuk ke folder project di VPS
cd aras-pro-frontend

# Pull kode terbaru
git pull

# Rebuild dan restart
docker compose up -d --build
```

> Docker hanya rebuild image yang berubah. Container yang tidak berubah tidak di-restart.

---

## Troubleshooting

### Error: `package.json` dan `package-lock.json` tidak sinkron
```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync
```
**Fix:** Ganti `npm ci` dengan `npm install` di `Dockerfile`.

### Error: Tidak bisa koneksi ke Docker Hub
```
dial tcp: lookup registry-1.docker.io: no such host
```
**Fix:**
1. Restart Docker Desktop
2. Buka Docker Desktop → Settings → Docker Engine, tambahkan:
```json
{
  "dns": ["8.8.8.8", "1.1.1.1"]
}
```
Klik "Apply & Restart".

### Error: Port sudah dipakai
```
Bind for 0.0.0.0:80 failed: port is already allocated
```
**Fix:** Ganti port di `docker-compose.yml`, misal `"8080:80"`, atau stop service yang memakai port tersebut:
```bash
docker compose down
```

### Cek container yang sedang berjalan
```bash
docker ps
docker compose ps
```

### Stop semua container
```bash
docker compose down
```

### Hapus semua image untuk rebuild bersih
```bash
docker compose down --rmi all
docker compose up -d --build
```
