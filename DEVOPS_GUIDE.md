# Ultimate Guide: DevOps untuk Developer

## Daftar Isi
1. [Filosofi DevOps](#1-filosofi-devops)
2. [Linux & Command Line](#2-linux--command-line)
3. [Networking Dasar](#3-networking-dasar)
4. [Version Control — Git](#4-version-control--git)
5. [CI/CD](#5-cicd--inti-dari-devops)
6. [Containerization — Docker](#6-containerization--docker)
7. [Container Orchestration](#7-container-orchestration)
8. [Infrastructure as Code (IaC)](#8-infrastructure-as-code-iac)
9. [Cloud Provider](#9-cloud-provider)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Security (DevSecOps)](#11-security-devsecops)
12. [Roadmap Belajar](#12-roadmap-belajar)

---

## 1. Filosofi DevOps

DevOps bukan tools — ini **budaya dan cara kerja**. Intinya: hapus tembok antara tim Development (bikin fitur) dan Operations (jaga server). Tujuannya: deliver software lebih cepat, lebih stabil, lebih otomatis.

```
Tanpa DevOps:               Dengan DevOps:
Dev  → "sudah jadi"         Dev + Ops bekerja sama
Ops  → "salah kamu"         dari awal sampai production
      ↕ konflik                    ↕ kolaborasi
```

**Prinsip utama:** Automate everything — kalau dilakukan manual lebih dari sekali, otomasi.

---

## 2. Linux & Command Line

Hampir semua server jalan di Linux. Ini fondasi yang wajib dikuasai.

### Navigasi & File
```bash
ls -la           # list semua file termasuk hidden
cd, pwd          # pindah direktori, cek posisi sekarang
cp, mv, rm       # copy, pindah, hapus file
mkdir -p         # buat folder beserta parent-nya
cat, less        # baca isi file
grep -r "text"   # cari teks di dalam file secara rekursif
find . -name     # cari file berdasarkan nama
```

### Proses & Service
```bash
ps aux           # lihat semua proses yang berjalan
top / htop       # monitor resource secara real-time
kill -9 <pid>    # force stop proses
systemctl start/stop/status/enable <service>  # kelola service
journalctl -u <service> -f  # live log sebuah service
```

### Jaringan
```bash
curl -I <url>    # cek HTTP response header
ping <host>      # cek koneksi ke host
ss -tlnp         # lihat port yang sedang dipakai
nslookup / dig   # cek DNS resolution
```

### Permissions
```bash
chmod 755 file   # set permission (owner: rwx, group: rx, other: rx)
chown user:group # ganti kepemilikan file
sudo             # jalankan perintah sebagai root
```

### File Penting di Linux
| Path | Isi |
|------|-----|
| `/etc/nginx/` | Konfigurasi nginx |
| `/etc/hosts` | DNS lokal manual |
| `/var/log/` | Log semua service |
| `~/.ssh/` | SSH keys |
| `/etc/crontab` | Scheduled tasks |

---

## 3. Networking Dasar

| Konsep | Artinya |
|--------|---------|
| **IP Address** | Alamat unik setiap device di jaringan |
| **Port** | "Pintu" di sebuah IP. HTTP=80, HTTPS=443, SSH=22, PostgreSQL=5432 |
| **DNS** | Mengubah nama domain (`google.com`) ke IP address |
| **HTTP/HTTPS** | Protokol komunikasi web. HTTPS = HTTP + enkripsi TLS/SSL |
| **SSL/TLS** | Enkripsi data antara browser dan server. Dibuktikan dengan sertifikat |
| **Load Balancer** | Membagi traffic ke beberapa server agar tidak overload |
| **Reverse Proxy** | Server perantara (nginx, Traefik) yang terima request lalu teruskan ke app |
| **Firewall** | Filter traffic masuk/keluar berdasarkan rules. Tool: `ufw`, `iptables` |
| **CDN** | Jaringan server tersebar di dunia untuk deliver static file lebih cepat |
| **VPN** | Koneksi terenkripsi ke jaringan privat |

### Alur Request HTTP
```
Browser
  ↓ DNS lookup: domain.com → 123.45.67.89
  ↓ TCP connect ke port 443
  ↓ TLS handshake (SSL certificate)
  ↓ HTTP request
Reverse Proxy (nginx/Traefik)
  ↓ routing berdasarkan domain/path
App Container
  ↓ response
Browser menampilkan halaman
```

---

## 4. Version Control — Git

### Branching Strategy

| Strategy | Cara Kerja | Cocok Untuk |
|----------|-----------|-------------|
| **GitHub Flow** | `main` + `feature/*` → Pull Request → merge | Tim kecil-menengah |
| **Git Flow** | `main`, `develop`, `feature/*`, `release/*`, `hotfix/*` | Release terjadwal |
| **Trunk-based** | Semua push ke `main`, pakai feature flags | Tim besar, CI/CD mature |

### Conventional Commits
Standar penulisan commit message yang umum di industri:
```
feat: tambah halaman login
fix: perbaiki bug di form validasi
chore: update dependencies
docs: update README
refactor: ekstrak komponen button
ci: tambah GitHub Actions workflow
```

---

## 5. CI/CD — Inti dari DevOps

**CI (Continuous Integration):** Setiap push kode → otomatis lint, test, build.
**CD (Continuous Delivery):** Setelah CI sukses → otomatis deploy ke server.

### Apa itu Workflow?

Workflow adalah **urutan langkah otomatis yang berjalan ketika ada event tertentu terjadi**. Di GitHub Actions, workflow didefinisikan sebagai file `.yml` di folder `.github/workflows/`.

#### Anatomi Workflow

```yaml
# 1. NAMA workflow
name: Build and Deploy

# 2. TRIGGER — event apa yang memicu workflow berjalan
on:
  push:
    branches:
      - main        # jalankan kalau ada push ke branch main

# 3. JOBS — pekerjaan apa yang dilakukan
jobs:
  build-and-deploy:         # nama job
    runs-on: ubuntu-latest  # jalankan di mesin Linux

    # 4. STEPS — langkah-langkah di dalam job
    steps:
      - name: Checkout kode
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp .
```

#### Komponen Penting

| Komponen | Artinya |
|----------|---------|
| **Trigger (`on`)** | Event yang memulai workflow. Bisa: `push`, `pull_request`, `schedule` (cron), `manual` |
| **Job** | Kumpulan steps yang berjalan di satu mesin. Bisa paralel dengan job lain |
| **Step** | Satu langkah di dalam job. Bisa `run` (perintah shell) atau `uses` (pakai action orang lain) |
| **Runner** | Mesin virtual tempat job berjalan (`ubuntu-latest`, `windows-latest`, `macos-latest`) |
| **Action (`uses`)** | Potongan kode siap pakai dari GitHub Marketplace. Contoh: `actions/checkout`, `docker/login-action` |
| **Secrets** | Variabel terenkripsi untuk data sensitif (password, SSH key, token) |

#### `run` vs `uses`

```yaml
# run → perintah shell biasa
- name: Build app
  run: npx nx build sfa

# uses → pakai "action" buatan orang lain dari GitHub Marketplace
# seperti npm install tapi untuk langkah CI/CD
- name: Login ke Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}
```

#### Analogi

Workflow itu seperti SOP kerja:
```
TRIGGER: setiap ada push ke main
  Langkah 1: Download kode terbaru
  Langkah 2: Install dependencies
  Langkah 3: Jalankan tests
  Langkah 4: Build Docker image
  Langkah 5: Deploy ke VPS
```

```
Push kode ke GitHub
        ↓
   CI Pipeline
   ├── Install dependencies
   ├── Run linter
   ├── Run unit tests
   ├── Build app
   └── Build Docker image
        ↓ (kalau semua pass)
   CD Pipeline
   ├── Push image ke registry (Docker Hub / GHCR)
   ├── Deploy ke staging
   ├── Run e2e tests
   └── Deploy ke production
```

### Tools CI/CD

| Tool | Keterangan |
|------|-----------|
| **GitHub Actions** | Paling populer, terintegrasi langsung di GitHub, gratis untuk repo public |
| **GitLab CI** | Built-in di GitLab, powerful untuk self-hosted |
| **Jenkins** | Self-hosted, sangat fleksibel, tapi perlu maintenance |
| **CircleCI** | Cloud-based, cepat setup |

### Nx Affected — Hanya Build yang Berubah

Di Nx monorepo, gunakan `nx affected` agar CI/CD tidak memproses semua project setiap kali ada perubahan kecil.

```bash
# Hanya build project yang terpengaruh perubahan di branch ini
npx nx affected -t build --base=main --head=HEAD

# Hanya lint dan test yang terpengaruh
npx nx affected -t lint,test --base=main --head=HEAD

# Lihat daftar project yang affected tanpa build (preview)
npx nx show projects --affected --base=main

# Visualisasi dampak perubahan di browser
npx nx affected:graph --base=main
```

**Catatan:** `--dry-run` hanya valid untuk generator (membuat file baru), bukan untuk task runner. Untuk preview tanpa eksekusi, gunakan `nx show projects --affected`.

**Cara kerja `nx affected`:**

Nx membaca git diff antara `--base` dan `--head`, lalu hitung graph dependency untuk tahu project mana yang ikut terpengaruh:

```
Ubah libs/sfa/feature-leads
        ↓
    apps/sfa         ← affected (depend pada feature-leads)

shared/domain        ← tidak affected, skip
shared/auth          ← tidak affected, skip
shared/ui            ← tidak affected, skip
```

| Perintah | Kapan Dipakai |
|----------|---------------|
| `nx affected -t build` | CI/CD — hanya build yang berubah |
| `nx run-many -t build --all` | Build semua project tanpa filter |
| `nx affected:graph` | Visualisasi dampak sebelum build |

### Contoh GitHub Actions (`.github/workflows/deploy.yml`)
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp .

      - name: Push to Docker Hub
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push myusername/myapp:latest

      - name: Deploy ke VPS via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /app
            docker compose pull
            docker compose up -d
```

---

## 6. Containerization — Docker

Sudah dipelajari di project ini. Ringkasan konsep penting:

| Konsep | Artinya |
|--------|---------|
| **Image** | Paket aplikasi + environment. Hasil build Dockerfile |
| **Container** | Image yang sedang berjalan |
| **Registry** | Tempat simpan & distribusi image. Contoh: Docker Hub, GHCR, ECR |
| **Volume** | Penyimpanan persisten di luar container (untuk database, upload file) |
| **Network** | Jaringan virtual antar container. Container satu bisa panggil container lain by name |
| **Multi-stage build** | Pisah stage build (Node.js) dan stage run (nginx) agar image lebih kecil |

### Docker Compose vs Swarm vs Kubernetes

| | Docker Compose | Docker Swarm | Kubernetes |
|-|----------------|-------------|------------|
| **Untuk** | 1 server | Beberapa server | Ratusan server |
| **Kompleksitas** | Rendah | Menengah | Tinggi |
| **Scaling** | Manual | Semi-otomatis | Otomatis |
| **Cocok** | Dev, staging, produksi kecil | Produksi menengah | Enterprise |

---

## 7. Container Orchestration

Dipakai ketika 1 server tidak cukup dan butuh mengelola banyak container di banyak server.

### Kubernetes (K8s)
Platform orchestration paling populer di industri enterprise.

**Konsep dasar:**
| Term | Artinya |
|------|---------|
| **Pod** | Unit terkecil. Satu atau lebih container yang berjalan bersama |
| **Node** | Server fisik/virtual yang menjalankan pods |
| **Cluster** | Kumpulan nodes yang dikelola Kubernetes |
| **Deployment** | Definisi berapa replica pod yang harus berjalan |
| **Service** | Endpoint stabil untuk mengakses pods (pods bisa mati/berganti IP) |
| **Ingress** | Reverse proxy di dalam Kubernetes, routing HTTP ke service yang tepat |
| **ConfigMap** | Simpan konfigurasi (non-secret) |
| **Secret** | Simpan data sensitif (password, API key) |

**Managed Kubernetes** (tidak perlu setup sendiri):
- AWS EKS, Google GKE, Azure AKS, DigitalOcean DOKS

---

## 8. Infrastructure as Code (IaC)

Filosofi: **infrastruktur didefinisikan sebagai kode**, bukan diklik manual di dashboard.

### Tools

| Tool | Fungsi |
|------|--------|
| **Terraform** | Provision infrastruktur cloud (buat VPS, database, DNS, dll) via kode. Provider-agnostic |
| **Ansible** | Konfigurasi server yang sudah ada (install software, setup user, deploy app) |
| **Pulumi** | Seperti Terraform tapi pakai bahasa programming (TypeScript, Python) |

### Contoh Terraform (buat VPS di DigitalOcean)
```hcl
resource "digitalocean_droplet" "app" {
  name   = "aras-pro-server"
  region = "sgp1"
  size   = "s-1vcpu-1gb"
  image  = "ubuntu-22-04-x64"
}
```

Jalankan `terraform apply` → VPS otomatis dibuat.

---

## 9. Cloud Provider

### Tiga Besar
| Provider | Kelebihan |
|----------|-----------|
| **AWS** | Paling lengkap, market share terbesar, banyak sertifikasi |
| **Google Cloud (GCP)** | Kuat di data/ML, Kubernetes (Google yang bikin K8s) |
| **Azure** | Dominan di perusahaan yang pakai ekosistem Microsoft |

### Layanan yang Wajib Dikenal

| Kategori | AWS | GCP | Azure |
|----------|-----|-----|-------|
| **Virtual Machine** | EC2 | Compute Engine | Virtual Machines |
| **Container (managed)** | ECS / EKS | GKE | AKS |
| **Serverless** | Lambda | Cloud Functions | Azure Functions |
| **Object Storage** | S3 | Cloud Storage | Blob Storage |
| **Database** | RDS | Cloud SQL | Azure SQL |
| **DNS** | Route 53 | Cloud DNS | Azure DNS |
| **CDN** | CloudFront | Cloud CDN | Azure CDN |

### Alternatif Lebih Terjangkau
- **DigitalOcean** — simpel, harga jelas, cocok untuk startup
- **Hetzner** — Eropa, sangat murah, performa bagus
- **Vultr / Linode** — mirip DigitalOcean

---

## 10. Monitoring & Observability

Setelah deploy, harus tahu kondisi app di production.

### Tiga Pilar Observability

| Pilar | Apa yang dipantau | Tools |
|-------|------------------|-------|
| **Logs** | Event dan error yang terjadi di app | Loki, ELK Stack, Papertrail |
| **Metrics** | Angka: CPU, memory, request/sec, error rate | Prometheus + Grafana |
| **Traces** | Alur satu request melewati banyak service | Jaeger, Zipkin |

### Stack Monitoring Populer

**Gratis & self-hosted:**
```
App → Prometheus (kumpul metrics) → Grafana (visualisasi dashboard)
App → Loki (kumpul logs)         → Grafana (query logs)
```

**Cloud-based (berbayar):**
- Datadog, New Relic, Sentry (khusus error tracking)

### Alert
Kirim notifikasi (Slack, email, PagerDuty) ketika:
- CPU > 90% selama 5 menit
- Error rate > 1%
- App tidak merespons (downtime)

---

## 11. Security (DevSecOps)

Security bukan fitur terakhir — harus ada dari awal.

### Praktik Wajib

| Praktik | Penjelasan |
|---------|-----------|
| **Secret management** | Jangan hardcode API key/password di kode. Pakai environment variable atau secret manager (Vault, AWS Secrets Manager) |
| **Principle of least privilege** | Setiap service hanya punya akses ke yang dia butuhkan saja |
| **Image scanning** | Scan Docker image dari vulnerability sebelum deploy. Tools: Trivy, Snyk |
| **HTTPS everywhere** | Semua traffic harus terenkripsi, tidak ada HTTP di production |
| **SSH key only** | Nonaktifkan login VPS dengan password, pakai SSH key |
| **Firewall** | Hanya buka port yang diperlukan (80, 443, 22) |
| **Dependency audit** | `npm audit` secara rutin untuk cek vulnerability di package |

---

## 12. Roadmap Belajar

Urutan yang disarankan dari yang paling mendasar:

```
Bulan 1-2: Fondasi
├── Linux command line (wajib lancar)
├── Networking dasar (HTTP, DNS, port)
└── Git branching strategy

Bulan 3-4: Containerization
├── Docker (image, container, volume, network)
├── Docker Compose
└── Menulis Dockerfile yang efisien

Bulan 5-6: CI/CD
├── GitHub Actions
├── Automatisasi build & test
└── Automatisasi deploy ke VPS

Bulan 7-8: Cloud & IaC
├── Pilih satu cloud (mulai dari DigitalOcean/AWS)
├── Terraform dasar
└── Ansible dasar

Bulan 9-10: Orchestration & Monitoring
├── Kubernetes dasar (minikube untuk lokal)
├── Prometheus + Grafana
└── Logging dengan Loki

Bulan 11-12: Security & Advanced
├── DevSecOps practices
├── Service mesh (Istio)
└── GitOps (ArgoCD, Flux)
```

### Sertifikasi yang Diakui Industri

| Sertifikasi | Level | Fokus |
|-------------|-------|-------|
| **CKA** (Certified Kubernetes Administrator) | Menengah | Kubernetes |
| **CKAD** (Certified Kubernetes Application Developer) | Menengah | Kubernetes untuk dev |
| **AWS Solutions Architect** | Menengah | AWS cloud |
| **HashiCorp Terraform Associate** | Pemula | IaC dengan Terraform |
| **Docker DCA** | Menengah | Docker enterprise |

### Prinsip Belajar DevOps yang Efektif

1. **Hands-on dulu** — baca teori lalu langsung praktik di lab/VPS murah
2. **Break things** — sengaja rusak sesuatu lalu perbaiki, belajar lebih cepat
3. **Bangun home lab** — VPS Hetzner €4/bulan sudah cukup untuk eksperimen
4. **Ikuti insiden nyata** — baca postmortem dari Cloudflare, GitHub, Netflix yang dipublikasikan
