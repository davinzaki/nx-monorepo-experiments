# Nx Monorepo — Best Practice Guide (Aras Pro)

## Mental Model

```
workspace/
├── apps/        ← entry points saja (tipis, hampir tidak ada logic)
└── libs/        ← semua logic, komponen, service ada di sini
```

**Aturan utama:** App hanya mengatur routing dan bootstrap. Semua logic yang bisa di-reuse harus jadi library.

---

## Struktur Library: 4 Layer

```
libs/
├── shared/              ← lintas semua product
│   ├── domain/          models, interfaces, enums
│   ├── util/            pipes, helpers, pure functions
│   ├── ui/              komponen presentasi generic (button, input, card)
│   └── auth/            JWT, tenant context, guards, interceptor
│
├── sfa/                 ← scope khusus SFA
│   ├── domain/          models khusus SFA
│   ├── data-access/     services, HTTP calls, state management
│   ├── ui/              komponen presentasi khusus SFA
│   ├── feature-leads/   smart component: leads list, form, detail
│   ├── feature-visits/
│   └── feature-reports/
│
└── dms/                 ← nanti saat DMS dimulai
    ├── domain/
    ├── data-access/
    ├── ui/
    └── feature-orders/
```

---

## Aturan Dependency Antar Layer

Dependency hanya boleh **ke bawah**, tidak pernah ke atas atau menyamping.

| Dari          | Boleh depend ke                       |
| ------------- | ------------------------------------- |
| `feature`     | `data-access`, `ui`, `domain`, `util` |
| `data-access` | `domain`, `util`                      |
| `ui`          | `domain`, `util`                      |
| `domain`      | _(tidak boleh depend ke apapun)_      |
| `util`        | `domain`                              |

> **Feature tidak boleh import feature lain.** Kalau ada logic yang dibutuhkan dua feature, pindah ke `data-access` atau `ui`.

---

## Tagging Convention

Setiap library wajib punya **dua tag**: `scope:X` dan `type:Y`.

```json
// Contoh: libs/sfa/feature-leads/project.json
{
  "tags": ["scope:sfa", "type:feature"]
}
```

### Scope Tags

| Tag            | Artinya                    |
| -------------- | -------------------------- |
| `scope:shared` | Bisa dipakai semua product |
| `scope:sfa`    | Hanya untuk app SFA        |
| `scope:dms`    | Hanya untuk app DMS        |

### Type Tags

| Tag                | Artinya                           |
| ------------------ | --------------------------------- |
| `type:feature`     | Smart component, punya route      |
| `type:data-access` | Service, HTTP, state management   |
| `type:ui`          | Dumb/presentational component     |
| `type:domain`      | Model, interface, enum            |
| `type:util`        | Pipe, helper, pure function       |
| `type:auth`        | Guard, interceptor, token service |

---

## Cara Membuat Library Baru

```sh
# Feature library
npx nx g @nx/angular:lib feature-leads \
  --directory=libs/sfa/feature-leads \
  --tags="scope:sfa,type:feature"

# Data access
npx nx g @nx/angular:lib data-access \
  --directory=libs/sfa/data-access \
  --tags="scope:sfa,type:data-access"

# UI components
npx nx g @nx/angular:lib ui \
  --directory=libs/sfa/ui \
  --tags="scope:sfa,type:ui"

# Shared auth
npx nx g @nx/angular:lib auth \
  --directory=libs/shared/auth \
  --tags="scope:shared,type:auth"
```

---

## Path Alias

Jangan pernah import antar library dengan path relatif.

```typescript
// ❌ Jangan
import { Lead } from '../../../libs/shared/domain/src/lib/user.model';

// ✅ Benar
import { Lead } from '@aras-pro/shared/domain';
import { RelativeDatePipe } from '@aras-pro/shared/util';
```

Alias otomatis ditambahkan ke `tsconfig.base.json` saat generate library.

---

## Update Boundary Rules

File: `eslint.config.mjs` di root workspace.

Setiap kali tambah scope baru, tambahkan rule-nya:

```js
// Tambahkan saat DMS siap
{
  sourceTag: 'scope:dms',
  onlyDependOnLibsWithTags: ['scope:dms', 'scope:shared'],
},
```

---

## Perintah Penting

```sh
# Dev server
npx nx serve sfa

# Build production
npx nx build sfa

# Unit test
npx nx test sfa
npx nx test shared-domain

# Test satu file
npx nx test sfa --testFile=apps/sfa/src/app/app.spec.ts

# Lint (cek boundary violations)
npx nx lint sfa

# E2E
npx nx e2e sfa-e2e

# Visualisasi dependency graph
npx nx graph
```

---

## Urutan Setup SFA MVP

- [ ] `libs/shared/auth` — interceptor HTTP + tenant context service
- [ ] `libs/sfa/domain` — model khusus SFA (jika tidak di-share)
- [ ] `libs/sfa/data-access` — `LeadsService` (HTTP calls)
- [ ] `libs/sfa/ui` — `LeadCardComponent`, `LeadFormComponent`
- [ ] `libs/sfa/feature-leads` — `LeadsPageComponent` (smart, punya route)
- [ ] `apps/sfa` — tambah lazy-load route ke `feature-leads`
