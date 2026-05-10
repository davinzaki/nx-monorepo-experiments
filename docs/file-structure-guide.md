# File Structure Guide — Aras Pro SFA

Dokumen ini menjelaskan korelasi dan fungsi setiap file dalam monorepo ini.

---

## Gambaran Besar: Alur Data

```
Browser
  └── apps/sfa                        ← entry point, routing
        └── libs/sfa/feature-leads    ← halaman (smart component)
              ├── libs/sfa/data-access ← ambil & simpan data (HTTP + signal state)
              └── libs/shared/ui      ← tampilkan data (dumb components)
                    └── libs/shared/domain ← tipe data (interface/enum)

Semua HTTP request melewati:
  apiInterceptor (prepend base URL) → authInterceptor (tambah Bearer token)
```

---

## `apps/sfa/` — Entry Point Aplikasi

Tipis, hampir tidak ada logic. Hanya bootstrap dan routing.

| File | Fungsi |
|------|--------|
| `src/main.ts` | Bootstrap Angular app dengan `appConfig` |
| `src/app/app.ts` | Root component, hanya berisi `<router-outlet />` |
| `src/app/app.config.ts` | Konfigurasi global: provider HTTP, interceptors, PrimeNG theme, `API_URL` |
| `src/app/app.routes.ts` | Daftar route app — lazy-load ke feature libs |
| `src/styles.scss` | Global styles, import PrimeIcons |

### `app.config.ts` — Pusat Konfigurasi

```typescript
provideHttpClient(withInterceptors([apiInterceptor, authInterceptor]))
// urutan penting: api dulu (prepend URL), auth kemudian (tambah token)

providePrimeNG({ theme: { preset: Aura } })
// tema PrimeNG, bisa diganti ke Lara/Nora

{ provide: API_URL, useValue: 'https://api.aras-pro.com' }
// base URL API, dipakai apiInterceptor
```

### `app.routes.ts` — Routing

```typescript
{ path: '', redirectTo: 'leads', pathMatch: 'full' }
// root → redirect ke leads

{ path: 'leads', canActivate: [authGuard], loadComponent: () => import(...) }
// lazy-load LeadsPageComponent, hanya untuk user yang sudah login
```

---

## `libs/shared/` — Library Lintas Product

Bisa dipakai oleh SFA, DMS, Canvassing, dll.

### `libs/shared/domain` — Model Data

File TypeScript murni, tidak ada Angular, tidak ada dependency.

| File | Isi |
|------|-----|
| `src/lib/user.model.ts` | `Lead`, `LeadStatus`, `CreateLeadDto`, `UpdateLeadDto` |
| `src/index.ts` | Public API — yang di-export ke luar library |

> Aturan: file di sini **tidak boleh** import dari library manapun.

---

### `libs/shared/auth` — Autentikasi JWT

| File | Fungsi |
|------|--------|
| `auth.models.ts` | Interface: `JwtPayload`, `LoginDto`, `AuthResponse` |
| `token.service.ts` | Simpan/ambil/decode JWT dari `localStorage`. Cek expired. |
| `auth.service.ts` | Signal store untuk user session. Method `login()` dan `logout()`. |
| `auth.interceptor.ts` | Attach `Authorization: Bearer <token>` ke semua HTTP request. Handle 401 → auto logout. |
| `auth.guard.ts` | Cek `isAuthenticated()`. Redirect ke `/login` kalau belum login. |
| `src/index.ts` | Export semua yang boleh dipakai di luar library |

**Alur login:**
```
LoginPage → AuthService.login(dto)
         → POST /api/auth/login
         → TokenService.set(accessToken)
         → _user signal di-update dari JWT payload
         → redirect ke /leads
```

**Alur setiap HTTP request:**
```
HttpClient.get('/leads')
  → apiInterceptor: url jadi 'https://api.aras-pro.com/leads'
  → authInterceptor: tambah header Authorization: Bearer <token>
  → kalau response 401 → AuthService.logout() → redirect /login
```

---

### `libs/shared/util` — Utilities

| File | Fungsi |
|------|--------|
| `api-url.token.ts` | `InjectionToken<string>` untuk base URL API |
| `api.interceptor.ts` | Prepend `API_URL` ke semua URL yang tidak diawali `http` |
| `pipes/relative-data.pipe.ts` | Pipe `relativeDate` — format tanggal ke "Hari ini", "Kemarin", "3 hari lalu" |

---

### `libs/shared/ui` — Komponen Presentasi Generic

Komponen **dumb** — hanya terima `input()`, emit `output()`. Tidak fetch data.
Semua komponen pakai selector prefix `ui-`.

| File | Selector | Input | Output | Kegunaan |
|------|----------|-------|--------|---------|
| `page-header/page-header.ts` | `ui-page-header` | `title`, `subtitle` | — | Judul halaman |
| `empty-state/empty-state.ts` | `ui-empty-state` | `icon`, `title`, `message` | — | Tampilan data kosong |
| `status-badge/status-badge.ts` | `ui-status-badge` | `label`, `severity` | — | Badge warna untuk status |
| `data-table/data-table.ts` | `ui-data-table` | `columns`, `data`, `loading`, `totalRecords`, `rows`, `rowActions` | `rowClick`, `pageChange`, `sortChange` | Tabel reusable dengan sort, paginator, skeleton |

**Cara pakai `ui-data-table`:**
```typescript
// Di feature component
columns: TableColumn[] = [
  { field: 'name',   header: 'Nama',   sortable: true },
  { field: 'status', header: 'Status', width: '120px' },
];
```
```html
<ui-data-table
  [columns]="columns"
  [data]="store.leads()"
  [loading]="store.loading()"
  [totalRecords]="store.total()"
  (pageChange)="onPageChange($event)"
  (sortChange)="onSortChange($event)"
/>
```

---

## `libs/sfa/` — Library Khusus SFA

Tidak perlu buildable — dikompilasi langsung oleh angular build via tsconfig paths.

### `libs/sfa/data-access` — State & HTTP

| File | Fungsi |
|------|--------|
| `leads.store.ts` | Signal store untuk leads. State: `leads`, `loading`, `error`, `total`, `isEmpty`. Method: `loadAll(params)`, `create()`, `update()`, `remove()`, `select()`. |

**Pola signal store:**
```typescript
// State (private, write-only dari dalam)
private _leads = signal<Lead[]>([]);

// Selector (public, readonly)
leads = this._leads.asReadonly();
isEmpty = computed(() => !this._loading() && this._leads().length === 0);

// Method (trigger HTTP, update state)
loadAll(params) {
  this._loading.set(true);
  this.http.get('/leads', { params }).subscribe({
    next: (data) => this._leads.set(data.content),
    error: (err) => this._error.set(err.message),
  });
}
```

---

### `libs/sfa/feature-leads` — Halaman Leads

| File | Fungsi |
|------|--------|
| `leads-page.ts` | Smart component. Inject `LeadsStore`, definisi kolom tabel, handler pagination & sort. |
| `leads-page.html` | Template — pakai `ui-page-header`, `ui-data-table`, `ui-empty-state` |
| `leads-page.scss` | Style khusus halaman (kosong = pakai PrimeNG default) |

**"Smart" artinya:** komponen ini yang memutuskan *data apa* yang ditampilkan dan *kapan* diambil. Komponen presentasi (`ui-data-table`) hanya tahu *cara menampilkan* data yang diberikan.

---

## Korelasi Antar Library (Dependency Flow)

```
apps/sfa
  ├── @aras-pro/shared/auth      (authGuard, authInterceptor)
  ├── @aras-pro/shared/util      (apiInterceptor, API_URL)
  └── @aras-pro/sfa/feature-leads
        ├── @aras-pro/sfa/data-access
        │     └── @aras-pro/shared/domain  (Lead, LeadStatus)
        ├── @aras-pro/shared/ui
        │     └── (primeng, primeicons)
        └── @aras-pro/shared/domain        (LeadStatus untuk label/severity)
```

> Dependency hanya boleh ke bawah. `feature` tidak boleh import `feature` lain.
> `ui` tidak boleh import `data-access`. `domain` tidak boleh import apapun.

---

## Menambah Fitur Baru (Contoh: Customers)

```
1. Model     → libs/shared/domain/src/lib/customer.model.ts
2. Store     → libs/sfa/data-access/src/lib/customers.store.ts
3. UI        → libs/sfa/ui/src/lib/customer-card/ (jika perlu komponen khusus)
4. Feature   → libs/sfa/feature-customers/src/lib/customers-page/
                 customers-page.ts / .html / .scss
5. Route     → apps/sfa/src/app/app.routes.ts
                 { path: 'customers', canActivate: [authGuard], loadComponent: ... }
```
