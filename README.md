# PostTrade Clearing Platform — Frontend

React + TypeScript SPA for the Post-Trade & Clearing Operations platform.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 (strict) |
| Build | Vite 5 |
| UI | Ant Design v5 |
| State (global) | Zustand |
| State (server) | TanStack Query v5 |
| HTTP | Axios |
| Routing | React Router v6 |
| Charts | Recharts |
| Container | Docker (node:20-alpine → nginx:alpine) |
| CI/CD | GitHub Actions |

---

## Local Development

### Prerequisites
- Node 20+
- Backend API running (see `../PostTradeBackoffice`)

### Setup

```bash
# 1. Install dependencies
npm ci

# 2. Create your dev env file (never committed)
cp .env.example .env.dev

# 3. Fill in .env.dev
#    VITE_API_BASE_URL=http://localhost:8080
#    VITE_ENV=dev
#    VITE_APP_NAME=PostTrade Clearing Platform

# 4. Start the dev server
npm run dev
# → http://localhost:5173
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (loads `.env.dev`) |
| `npm run build:dev` | Build targeting Dev environment |
| `npm run build:prod` | Build targeting Prod environment |
| `npm run type-check` | TypeScript check without emitting |
| `npm run lint` | ESLint (zero warnings allowed) |
| `npm run format` | Prettier format all files |
| `npm run format:check` | Prettier check (used in CI) |

---

## Environment Configuration

Two environments only — no staging:

| File | Purpose | Committed? |
|---|---|---|
| `.env.example` | Template with empty values | YES |
| `.env.dev` | Dev environment | NO — gitignored |
| `.env.prod` | Prod environment | NO — gitignored |

**Required variables:**
```bash
VITE_API_BASE_URL=    # Backend base URL (no trailing slash)
VITE_ENV=             # "dev" or "prod"
VITE_APP_NAME=        # Display name
```

All `import.meta.env` access is centralized in `src/core/config/env.ts`. Direct access elsewhere is a lint error.

---

## Architecture

```
src/
├── core/          # Infrastructure — no React, no UI (api, auth, types, config)
├── shared/        # Reusable UI components and hooks (domain-agnostic)
├── modules/       # Feature modules (one per domain)
│   ├── auth/
│   ├── dashboard/
│   ├── account-management/
│   ├── clearing/
│   ├── finance/
│   ├── reconciliation/
│   └── governance/
├── router/        # React Router configuration + ProtectedRoute
├── store/         # Zustand global stores
├── types/         # Shared domain types and enums
└── utils/         # Pure utility functions
```

**Layer rules (strictly enforced):**
- Components → hooks only (no direct API calls)
- Hooks → services (TanStack Query wrappers)
- Services → `axiosInstance` only (no stores, no React)
- No `any` types. No hardcoded URLs. No business logic in components.

---

## Docker

```bash
# Build dev image locally
docker build \
  --build-arg VITE_API_BASE_URL=http://80.225.204.132 \
  --build-arg VITE_ENV=dev \
  --build-arg VITE_APP_NAME="PostTrade Clearing Platform" \
  -t posttrade-frontend:dev-local .

docker run -p 3000:80 posttrade-frontend:dev-local
# → http://localhost:3000
# → http://localhost:3000/health → "healthy"
```

---

## CI/CD

| Workflow | File | Trigger |
|---|---|---|
| Deploy Dev | `.github/workflows/deploy-dev.yml` | Push to any branch ≠ `main` |
| Deploy Prod | `.github/workflows/deploy-prod.yml` | Push/merge to `main` |
| Auto PR | `.github/workflows/auto-pr.yml` | Push to any branch ≠ `main` |

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `DEV_VM_HOST` | Dev VM public IP |
| `PROD_VM_HOST` | Prod VM public IP |
| `VM_SSH_KEY` | SSH private key for `opc` user |
| `DEV_API_BASE_URL` | Backend URL for dev builds |
| `PROD_API_BASE_URL` | Backend URL for prod builds |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions |

---

## Authentication

- Login: `POST /api/auth/login` with `{ username, password, tenantCode }`
- Token stored in `sessionStorage` (tab-scoped, cleared on close)
- JWT decoded client-side for role extraction (pure `atob` — no library)
- **No refresh token** — 8-hour session with 30-minute in-app expiry warning
- On `401` response → auto-logout → `/login?reason=session_expired`

---

## Role-Based Access

8 roles per Architecture Governance Document. **Maker-Checker rule:** a user cannot approve their own financial action — enforced in `canApprove()` and at the backend.

**Sensitive fields** (Margin %, Net Obligation, Charges %, Realized PnL) render as `●●●●` for roles without `view:sensitive-fields` permission.

---

## Adding a New Module

1. Create `src/modules/<module>/types/`, `services/`, `hooks/`, `components/`
2. Service imports only `axiosInstance` — no stores, no React
3. Hook wraps service with TanStack Query
4. Component uses hook — no direct API calls
5. Add route to `src/router/routes.config.ts` with `requiredRoles`
6. Add lazy route to `src/router/index.tsx`
7. Add nav item to `src/shared/components/layout/AppSidebar.tsx`