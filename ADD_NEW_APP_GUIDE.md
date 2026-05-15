# Panduan Menambah App Baru di Monorepo

Panduan ini menggunakan app `dms` sebagai contoh. Ganti `dms` dengan nama app yang sebenarnya.

---

## Langkah 1 — Generate App

```bash
npx nx g @nx/angular:app dms \
  --directory=apps/dms \
  --tags="scope:dms,type:app" \
  --routing
```

**Fix manual setelah generate (selalu diperlukan):**

**a. `tsconfig.base.json`** — Nx generator menambah alias dengan prefix `@aras-pro-frontend/`, harus diganti ke `@aras-pro/dms/`:
```json
"@aras-pro/dms/...": ["./libs/dms/.../src/index.ts"]
```

**b. `apps/dms/eslint.config.mjs`** — Ganti selector prefix dari `lib` ke `dms`.

**c. `apps/dms/project.json`** — Pastikan tags sudah `["scope:dms", "type:app"]`.

---

## Langkah 2 — Tambah Module Boundary Rule

File: `eslint.config.mjs` (root workspace), tambahkan di array `depConstraints`:

```js
{
  sourceTag: 'scope:dms',
  onlyDependOnLibsWithTags: ['scope:dms', 'scope:shared'],
},
```

---

## Langkah 3 — Generate Lib untuk App Baru

```bash
# Feature lib (non-buildable)
npx nx g @nx/angular:lib feature-orders \
  --directory=libs/dms/feature-orders \
  --tags="scope:dms,type:feature"
```

**Fix manual setelah generate:**
- `tsconfig.base.json`: ganti prefix alias ke `@aras-pro/dms/feature-orders`
- `libs/dms/feature-orders/eslint.config.mjs`: ganti selector prefix dari `lib` ke `dms`

Ulangi untuk lib lain sesuai kebutuhan (`data-access`, `ui`, dll).

---

## Langkah 4 — Wire Up Routing

File: `apps/dms/src/app/app.routes.ts`

```typescript
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'orders', pathMatch: 'full' },
  {
    path: 'orders',
    loadComponent: () =>
      import('@aras-pro/dms/feature-orders').then((m) => m.OrdersPageComponent),
  },
];
```

File: `apps/dms/src/app/app.html`:
```html
<router-outlet />
```

---

## Langkah 5 — Update Docker

### `Dockerfile` — generik dengan build arg

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

### `docker-compose.yml` — tambah service

```yaml
services:
  sfa:
    build:
      context: .
      args:
        APP_NAME: sfa
    ports:
      - "8080:80"
    restart: unless-stopped

  dms:
    build:
      context: .
      args:
        APP_NAME: dms
    ports:
      - "8081:80"
    restart: unless-stopped
```

> Setiap app pakai port berbeda. Lanjutkan dengan 8082, 8083, dst untuk app berikutnya.

### `docker-compose.prod.yml` — tambah service

```yaml
services:
  sfa:
    image: ghcr.io/${GITHUB_REPOSITORY}/sfa:latest
    ports:
      - "8080:80"
    restart: unless-stopped

  dms:
    image: ghcr.io/${GITHUB_REPOSITORY}/dms:latest
    ports:
      - "8081:80"
    restart: unless-stopped
```

---

## Langkah 6 — Test Skenario Nx Affected

Setelah app baru di-commit ke `main`, buat branch untuk test:

```bash
git checkout -b test/nx-affected-multi-app
```

### Skenario A — Ubah lib yang dipakai KEDUA app (`shared/domain`)

```bash
echo "// test" >> libs/shared/domain/src/index.ts
npx nx show projects --affected --base=main
npx nx affected:graph --base=main
```

**Hasil:** `sfa` dan `dms` keduanya affected.

### Skenario B — Ubah lib HANYA milik `sfa`

```bash
git checkout libs/shared/domain/src/index.ts
echo "// test" >> libs/sfa/feature-leads/src/index.ts
npx nx show projects --affected --base=main
```

**Hasil:** Hanya `sfa` affected — `dms` tidak.

### Skenario C — Ubah lib HANYA milik `dms`

```bash
git checkout libs/sfa/feature-leads/src/index.ts
echo "// test" >> libs/dms/feature-orders/src/index.ts
npx nx show projects --affected --base=main
```

**Hasil:** Hanya `dms` affected — `sfa` tidak.

### Cleanup

```bash
git checkout libs/dms/feature-orders/src/index.ts
git checkout main
git branch -d test/nx-affected-multi-app
```

---

## Checklist Setiap Tambah App Baru

- [ ] Generate app dengan `nx g @nx/angular:app`
- [ ] Fix path alias di `tsconfig.base.json` (ganti `@aras-pro-frontend/` → `@aras-pro/<scope>/`)
- [ ] Fix selector prefix di `apps/<app>/eslint.config.mjs`
- [ ] Tambah `scope:<app>` rule di `eslint.config.mjs` root
- [ ] Generate lib yang dibutuhkan
- [ ] Fix path alias dan selector prefix lib
- [ ] Wire up routing di `app.routes.ts`
- [ ] Update `Dockerfile` jadi generik (jika belum)
- [ ] Tambah service baru di `docker-compose.yml` dan `docker-compose.prod.yml`
- [ ] Test `nx affected` untuk verifikasi isolasi dependency
