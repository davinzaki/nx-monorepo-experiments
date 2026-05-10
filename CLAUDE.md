# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Dev server
npx nx serve sfa

# Production build
npx nx build sfa

# Unit tests (all or per project)
npx nx test sfa
npx nx test shared-domain
npx nx test shared-util

# Run a single test file
npx nx test sfa --testFile=apps/sfa/src/app/app.spec.ts

# Lint
npx nx lint sfa

# E2E tests
npx nx e2e sfa-e2e

# Visualize project graph
npx nx graph

# Generate a new Angular component
npx nx g @nx/angular:component my-component --project=sfa

# Generate a new shared library (buildable)
npx nx g @nx/angular:lib my-lib --directory=libs/shared/my-lib --buildable --tags="scope:shared,type:X"

# Generate a new SFA feature/data-access lib (non-buildable)
npx nx g @nx/angular:lib my-lib --directory=libs/sfa/my-lib --tags="scope:sfa,type:X"
```

## Architecture

Nx Angular monorepo for **Aras Pro**, a Sales Force Automation (SFA) product. UI locale is Indonesian (`id-ID`).

### Apps

- `apps/sfa` — Angular 21 application (tags: `scope:sfa, type:app`)
- `apps/sfa-e2e` — Playwright e2e tests for `sfa`

### Libraries (`libs/`)

| Path | Tags | Buildable | Purpose |
|------|------|-----------|---------|
| `libs/shared/domain` | `scope:shared, type:domain` | yes | Pure TS models and enums (`Lead`, `LeadStatus`) |
| `libs/shared/util` | `scope:shared, type:util` | yes | `RelativeDatePipe`, `API_URL` token, `apiInterceptor` |
| `libs/shared/auth` | `scope:shared, type:auth` | yes | JWT auth: `AuthService`, `TokenService`, `authInterceptor`, `authGuard` |
| `libs/shared/ui` | `scope:shared, type:ui` | yes | Generic PrimeNG components: `ui-page-header`, `ui-empty-state`, `ui-status-badge`, `ui-data-table` |
| `libs/sfa/data-access` | `scope:sfa, type:data-access` | **no** | Signal stores: `LeadsStore` |
| `libs/sfa/feature-leads` | `scope:sfa, type:feature` | **no** | `LeadsPageComponent` |

**Buildable rule:** `shared/*` libs are buildable (potentially reused across products). `sfa/*` libs are non-buildable — the app compiles them from source via tsconfig paths. Do NOT add `--buildable` to new sfa libs; it causes ng-packagr to fail when importing between buildable sfa libs.

Import via path aliases from `tsconfig.base.json`:
- `@aras-pro/shared/domain`
- `@aras-pro/shared/util`
- `@aras-pro/shared/auth`
- `@aras-pro/shared/ui`
- `@aras-pro/sfa/data-access`
- `@aras-pro/sfa/feature-leads`

**Path alias fix:** Nx generator sets alias prefix to `@aras-pro-frontend/`. Always manually fix it to `@aras-pro/shared/` or `@aras-pro/sfa/` in `tsconfig.base.json` after generating a lib.

**Selector prefix fix:** Nx generator sets selector prefix to `lib`. Always manually fix to `ui` (shared/ui), `sfa` (sfa/*) in the lib's `eslint.config.mjs` and `project.json`.

### Module boundary rules (ESLint-enforced)

- `scope:sfa` → may depend on `scope:sfa` or `scope:shared`
- `scope:shared` → may only depend on `scope:shared`
- `type:feature` → may not import other features; allowed: `data-access`, `ui`, `util`, `domain`, `auth`
- `type:ui` → may not import `data-access`; allowed: `util`, `domain`
- `type:domain` → no dependencies allowed

### HTTP & Auth flow

- `apiInterceptor` (shared/util) — prepends `API_URL` to all relative URLs
- `authInterceptor` (shared/auth) — attaches `Bearer` token; handles 401 → logout
- Interceptor order in `app.config.ts`: `[apiInterceptor, authInterceptor]`
- `API_URL` is provided in `app.config.ts`: `{ provide: API_URL, useValue: '...' }`

### State management

Signal-based service stores in `data-access` libs. Each store exposes readonly signals (`leads`, `loading`, `error`) and methods (`loadAll`, `create`, `update`, `remove`).

### Generator defaults (pre-configured in `nx.json`)

All generated code uses: `standalone: true`, `changeDetection: OnPush`, SCSS styles, vitest unit tests, Playwright e2e. Nx Cloud is disabled (`neverConnectToCloud: true`).
