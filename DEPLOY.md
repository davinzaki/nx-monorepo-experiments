# Panduan Deploy Aras Pro Frontend

## Daftar Isi
1. [Struktur File Docker](#struktur-file-docker)
2. [Deploy Satu App (sfa)](#deploy-satu-app-sfa)
3. [Menambah App Baru](#menambah-app-baru)
4. [Deploy ke VPS](#deploy-ke-vps)
5. [Update Kode di VPS](#update-kode-di-vps)
6. [Troubleshooting](#troubleshooting)

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
