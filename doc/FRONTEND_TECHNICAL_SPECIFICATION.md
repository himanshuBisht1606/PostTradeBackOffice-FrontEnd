# FRONTEND TECHNICAL SPECIFICATION
## Post-Trade & Clearing Platform — React + TypeScript SPA
**Version:** 1.0.0 | **Date:** 2026-02-23 | **Status:** AWAITING APPROVAL

---

## PHASE 1 — ANALYSIS SUMMARY

### 1.1 Blueprint Analysis

**Global Layout Structure**
- Fixed 64px top header: breadcrumb (`Tenant > Broker > Client`), global search, approval-bell counter, user profile menu
- Fixed 240px left sidebar with 7 top-level navigation groups
- Fluid main content area

**Functional Modules (7 sidebar modules, 10+ screens)**

| Module | Screens |
|---|---|
| Dashboard | Exception-first KPI strip + 4 charts |
| Account Management | Client List → Slide Drawer (Overview / Financial / Trades tabs) |
| Revenue Ops | *(implied from blueprint — charge config, revenue trending)* |
| Clearing | Trade Book → Trade Drawer; Settlement Batch list + approval |
| Finance | Ledger entry view (append-only read) |
| Reconciliation | Exception table + match stats |
| Governance | Approval queue (Maker-Checker); Audit Log (JSON diff expand) |

**Key UI Patterns**
- Right-side slide drawer (not a separate route) for record detail
- Exception-first dashboard: anomalies surface before summaries
- Sensitive field masking (Margin %, Net Obligation, Charges %, Realized PnL) — conditionally rendered by role
- All grids: paginated, filterable, sortable, multi-select checkboxes
- Approval actions always dual: `Approve` + `Reject` — never a single button
- Audit log rows expand to JSON before/after diff view

**Business Workflows Identified**
1. **Trade → Settlement → Approval**: Trade booked → grouped into batch → batch requires checker approval → settled
2. **Reconciliation flow**: Run recon → exceptions auto-created → resolve exceptions
3. **Maker-Checker approval**: Any user creates → different user with checker role approves
4. **EOD processing**: Trigger EOD → PnL snapshot created → positions closed
5. **Ledger**: Read-only view of append-only double-entry records

**Role & Permission Structure (8 roles from governance doc)**

| Role | Key Capabilities |
|---|---|
| Platform Super Admin | Cross-tenant access, all operations |
| Tenant Owner | All operations within own tenant |
| Operations Controller | Trade booking, settlement creation (Maker) |
| Finance Controller | Settlement approval, charge modification (Checker) |
| Risk Controller | Exposure limit management, risk views |
| Compliance Officer | Audit log access, compliance reporting |
| Partner | Limited read-only (broker/client scoped) |
| Auditor | Read-only audit trail, no financial action |

**Critical governance rule:** No role can be both Maker AND Checker. Hybrid financial + audit authority is prohibited.

---

### 1.2 Architecture Governance Analysis

| Principle | Frontend Impact |
|---|---|
| Revenue is sacred | No destructive UI actions without confirmation + audit trail |
| Deny-all default | UI renders no action buttons unless role explicitly permits them |
| Financial immutability | No edit forms for posted ledger entries; reversals only via new entry |
| Maker-Checker mandatory | Approve/Reject buttons never shown to the record's own creator |
| Tenant isolation | TenantId always sourced from JWT, never from UI input |
| Exception-first | Dashboard KPI anomalies must be the first visible element |
| Audit logging | Every user-initiated mutation triggers a loggable event (backend handles persistence; frontend must send `X-Correlation-ID` header) |
| Field-level masking | Sensitive fields conditionally rendered: `{hasPermission('view:sensitive-fields') ? <value/> : <MaskedField />}` |

**6-Layer Security enforced at backend (frontend respects layers 1 + 5):**
1. JWT Claim Level ← frontend sends correct token
2–4. Backend-only
5. Field-Level Masking ← frontend renders masked placeholder when field not in response
6. Audit Logging ← frontend decorates requests with Correlation ID

---

### 1.3 Backend Repository Analysis

**Stack confirmed:** .NET 8 Minimal API · PostgreSQL · EF Core 8 · MediatR (CQRS) · FluentValidation · JWT HMAC-SHA256 · BCrypt · Swashbuckle/Scalar

**Authentication Mechanism**
```
POST /api/auth/login
Body:    { username, password, tenantCode }
Returns: ApiResponse<{ Token, ExpiresAt, Username, Roles[] }>
```
JWT Claims: `UserId` · `TenantId` · `Username` · `sub` · `jti` · `role` (one per role)
Expiry: **480 minutes (8 hours)**
**No refresh token endpoint exists.** Session ends at expiry; user must re-login.

**API Response Contract**
```json
// Success
{ "success": true,  "data": { ... },  "message": "...", "errors": [] }

// Failure
{ "success": false, "data": null, "message": "...", "errors": ["field error 1"] }
```

**Enums:** Serialized as strings throughout (`"Pending"` not `1`)

**CORS:** `AllowAll` policy — any origin, any method, any header (dev convenience; frontend must not rely on this for security)

**API Route Map (11 module groups)**

| Group | Base Route |
|---|---|
| Auth | `/api/auth` |
| Tenants | `/api/tenants` |
| Brokers | `/api/brokers` |
| Clients | `/api/clients` |
| Users | `/api/users` |
| Roles | `/api/roles` |
| Reference Data | `/api/exchanges`, `/api/segments`, `/api/instruments` |
| Trading | `/api/trades`, `/api/positions`, `/api/pnl` |
| Settlement | `/api/settlement/batches`, `/api/settlement/obligations` |
| Ledger | `/api/ledger/entries`, `/api/ledger/charges` |
| Recon/Corp/EOD | `/api/reconciliation`, `/api/corporate-actions`, `/api/eod` |

**Health Check:** `GET /health` → `"Healthy"`
**API Documentation (Dev only):** Scalar UI at `/scalar/v1`

**Deployment Architecture (confirmed)**

| Environment | Trigger | VM | Image Tag |
|---|---|---|---|
| Dev | Any branch ≠ `main` | OCI VM (80.225.204.132) | `posttrade-api:dev-latest` |
| QA/Prod | Push/merge to `main` | OCI VM (separate, pending) | `posttrade-api:qa-latest` |

**Runtime:** Docker Compose on Oracle Cloud Infrastructure VMs (no Kubernetes)
**Registry:** `ghcr.io/himanshubisht1606/posttrade-api`
**CI/CD:** GitHub Actions — 3 workflows: `deploy-dev.yml`, `deploy-qa.yml`, `auto-pr.yml`
**Auto-PR:** Any push to non-main branch automatically opens a PR to `main`

> **⚠️ Environment Naming Note:** The backend names its second environment "QA". Per the user's specification, the frontend will name it "prod". Mapping: frontend `dev` = backend Dev VM; frontend `prod` = backend QA VM (which serves as production in the current infrastructure).

---

## PHASE 2 — FRONTEND TECHNICAL SPECIFICATION

---

### SECTION 1 — TECHNOLOGY STACK

| Concern | Decision | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript 5.x (strict) | Specified in Phase 3 requirements |
| Build Tool | Vite 5 | Fast dev server, native ESM, optimal bundle splitting |
| State — Auth & Global | Zustand | Lightweight, minimal boilerplate, works without Provider wrapping |
| State — Server Data | TanStack Query v5 | Automatic caching, refetch, stale-while-revalidate for data grids |
| HTTP Client | Axios | Interceptor support for token injection, error normalization, correlation IDs |
| Routing | React Router v6 | Nested routes, data loaders, protected route composition |
| UI Component Library | Ant Design v5 | Data-dense fintech UI, built-in Table, Drawer, Form, DatePicker, Badge |
| Charts | Recharts | Lightweight, composable — Revenue Trend, Settlement Aging, Exposure Utilization |
| Code Style | ESLint (strict) + Prettier | Enforced uniformly; no exceptions |
| Containerization | Docker multi-stage build | Matches backend philosophy exactly |
| CI/CD | GitHub Actions | Matches backend pipeline structure |

---

### SECTION 2 — ARCHITECTURE DESIGN

#### 2.1 Clean Architecture Layering

```
┌──────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (pages/, modules/*/components/)              │
│  React components, page layout, UI rendering                     │
│  Rule: No business logic. No direct API calls. No token access.  │
└─────────────────────────────┬────────────────────────────────────┘
                              │ uses
┌─────────────────────────────▼────────────────────────────────────┐
│  APPLICATION LAYER (modules/*/hooks/, modules/*/services/)        │
│  Custom hooks (useClients, useSettlementBatch, etc.)              │
│  TanStack Query queries/mutations                                 │
│  Rule: Calls service layer only. Owns loading/error states.       │
└─────────────────────────────┬────────────────────────────────────┘
                              │ calls
┌─────────────────────────────▼────────────────────────────────────┐
│  SERVICE LAYER (core/api/, modules/*/services/)                   │
│  Axios instance + interceptors + per-module API functions         │
│  Rule: Only layer that calls HTTP. Returns typed DTOs.            │
│  Rule: No UI state, no routing, no store access.                  │
└─────────────────────────────┬────────────────────────────────────┘
                              │ uses
┌─────────────────────────────▼────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (core/)                                     │
│  Token management, environment config, error normalization        │
│  Correlation ID generation, role resolution utilities             │
└──────────────────────────────────────────────────────────────────┘
```

**Hard rules:**
- Components never import from `core/api` directly
- Services never import Zustand stores
- Stores never import services directly (they receive callbacks from hooks)
- No `any` type allowed — TypeScript strict mode enforced at compiler level

#### 2.2 Folder Structure

```
PostTradeBackOffice-FrontEnd/
├── .github/
│   └── workflows/
│       ├── deploy-dev.yml        # Trigger: push to any branch != main
│       └── deploy-prod.yml       # Trigger: merge/push to main
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── core/                     # Infrastructure layer — no React, no UI
│   │   ├── api/
│   │   │   ├── axiosInstance.ts  # Configured Axios instance (base URL, timeout)
│   │   │   ├── interceptors.ts   # Request (token inject) + Response (error normalize)
│   │   │   └── correlationId.ts  # UUID generator for X-Correlation-ID header
│   │   ├── auth/
│   │   │   ├── tokenStorage.ts   # Read/write/clear token in sessionStorage
│   │   │   └── jwtDecoder.ts     # Parse JWT claims without library (atob)
│   │   ├── config/
│   │   │   └── env.ts            # Type-safe import.meta.env wrapper
│   │   └── types/
│   │       ├── api.types.ts      # ApiResponse<T>, PaginatedResult<T>
│   │       └── common.types.ts   # Pagination, SortOrder, DateRange
│   │
│   ├── shared/                   # Shared UI — domain-agnostic, purely presentational
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx      # Root layout: header + sidebar + content
│   │   │   │   ├── AppSidebar.tsx    # 240px nav sidebar
│   │   │   │   ├── AppHeader.tsx     # 64px top header
│   │   │   │   └── Breadcrumb.tsx    # Tenant > Broker > Client trail
│   │   │   ├── data-display/
│   │   │   │   ├── DataTable.tsx     # Wrapper over Ant Design Table
│   │   │   │   ├── SlideDrawer.tsx   # Right-side drawer container
│   │   │   │   ├── StatusBadge.tsx   # Color-coded status chip
│   │   │   │   ├── MaskedField.tsx   # "●●●●" placeholder for restricted fields
│   │   │   │   └── JsonDiffViewer.tsx# Before/after JSON for audit log expand
│   │   │   ├── feedback/
│   │   │   │   ├── PageLoader.tsx
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   └── charts/
│   │   │       ├── RevenueChart.tsx
│   │   │       ├── SettlementAgingChart.tsx
│   │   │       ├── ExposureChart.tsx
│   │   │       └── LedgerImbalanceIndicator.tsx
│   │   └── hooks/
│   │       ├── useDebounce.ts
│   │       └── usePagination.ts
│   │
│   ├── modules/                  # Feature modules — one per domain
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── services/
│   │   │   │   └── authService.ts    # POST /api/auth/login
│   │   │   ├── store/
│   │   │   │   └── authStore.ts      # Zustand: token, user, roles, tenantId
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── ExceptionKpiStrip.tsx   # 4 anomaly KPI cards
│   │   │   │   └── DashboardChartGrid.tsx
│   │   │   └── services/
│   │   │       └── dashboardService.ts
│   │   │
│   │   ├── account-management/
│   │   │   ├── clients/
│   │   │   │   ├── components/
│   │   │   │   │   ├── ClientListPage.tsx
│   │   │   │   │   ├── ClientFilters.tsx
│   │   │   │   │   ├── ClientTable.tsx
│   │   │   │   │   └── ClientDrawer/
│   │   │   │   │       ├── ClientDrawer.tsx
│   │   │   │   │       ├── ClientOverviewTab.tsx
│   │   │   │   │       ├── ClientFinancialTab.tsx   # Masked fields
│   │   │   │   │       └── ClientTradesTab.tsx
│   │   │   │   ├── services/
│   │   │   │   │   └── clientService.ts
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useClients.ts
│   │   │   │   └── types/
│   │   │   │       └── client.types.ts
│   │   │   └── brokers/
│   │   │       └── ... (same structure)
│   │   │
│   │   ├── clearing/
│   │   │   ├── trade-book/
│   │   │   │   └── ... (TradeListPage, TradeDrawer, tradeService)
│   │   │   └── settlement/
│   │   │       ├── components/
│   │   │       │   ├── BatchListPage.tsx
│   │   │       │   ├── BatchTable.tsx
│   │   │       │   └── ObligationTable.tsx
│   │   │       └── services/
│   │   │           └── settlementService.ts
│   │   │
│   │   ├── finance/
│   │   │   ├── ledger/
│   │   │   │   └── ... (LedgerPage, LedgerTable, ledgerService)
│   │   │   └── charges/
│   │   │       └── ... (ChargesConfigPage, chargesService)
│   │   │
│   │   ├── reconciliation/
│   │   │   ├── components/
│   │   │   │   ├── ReconDashboardPage.tsx
│   │   │   │   ├── ReconStatsBar.tsx       # Matched %, Unmatched %
│   │   │   │   └── ExceptionTable.tsx
│   │   │   └── services/
│   │   │       └── reconciliationService.ts
│   │   │
│   │   └── governance/
│   │       ├── approvals/
│   │       │   ├── components/
│   │       │   │   ├── ApprovalQueuePage.tsx
│   │       │   │   ├── ApprovalFilters.tsx
│   │       │   │   ├── ApprovalTable.tsx
│   │       │   │   └── ApprovalDrawer.tsx   # Maker-Checker SoD enforced here
│   │       │   └── services/
│   │       │       └── approvalService.ts
│   │       └── audit/
│   │           ├── components/
│   │           │   ├── AuditLogPage.tsx
│   │           │   ├── AuditTable.tsx
│   │           │   └── AuditLogExpander.tsx  # JSON diff view
│   │           └── services/
│   │               └── auditService.ts
│   │
│   ├── router/
│   │   ├── index.tsx             # RouterProvider setup
│   │   ├── routes.config.ts      # All route definitions + role guards
│   │   └── ProtectedRoute.tsx    # Auth check + role check HOC
│   │
│   ├── store/
│   │   └── uiStore.ts            # Sidebar collapsed, breadcrumb state
│   │
│   ├── types/                    # Cross-module shared domain types
│   │   ├── roles.types.ts        # Role enum, Permission enum
│   │   └── enums.ts              # All domain enums mirroring backend
│   │
│   ├── utils/
│   │   ├── formatters.ts         # Currency (decimal 18,4), date, percentage
│   │   ├── permissions.ts        # hasRole(), hasPermission() pure functions
│   │   └── errorHandler.ts       # ApiResponse error unwrapper
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── .env.dev                      # VITE_API_BASE_URL, VITE_ENV, VITE_APP_NAME (dev)
├── .env.prod                     # VITE_API_BASE_URL, VITE_ENV, VITE_APP_NAME (prod)
├── .env.example                  # Committed template, no real values
├── .gitignore                    # .env.dev, .env.prod always gitignored
├── Dockerfile                    # Multi-stage build
├── nginx.conf                    # Serve SPA, forward /api/* to backend
├── vite.config.ts
├── tsconfig.json                 # strict: true
├── tsconfig.node.json
├── eslint.config.js
├── .prettierrc
└── package.json
```

---

### SECTION 3 — API INTEGRATION STRATEGY

#### 3.1 Base URL Handling
```
VITE_API_BASE_URL injected at build time via Vite env files.
- Dev build:  VITE_API_BASE_URL = http://80.225.204.132
- Prod build: VITE_API_BASE_URL = http://<QA_VM_PUBLIC_IP>

axiosInstance.ts creates one Axios instance with:
  baseURL: import.meta.env.VITE_API_BASE_URL
  timeout: 30_000ms
  headers: { 'Content-Type': 'application/json' }
```
**Hard rule:** No URL string appears anywhere in module service files. All routes are constants assembled from the `baseURL`.

#### 3.2 Axios Interceptor Strategy

**Request Interceptor (runs on every outgoing request)**
1. Read token from `tokenStorage.ts` (sessionStorage)
2. Inject `Authorization: Bearer <token>` header if token exists
3. Generate `X-Correlation-ID` (UUID v4) and inject as header
4. Inject `X-Request-Time` timestamp for latency tracking

**Response Interceptor (runs on every incoming response)**
1. On success (2xx): Return `response.data` directly (unwrap Axios envelope)
2. On `401 Unauthorized`: Clear auth store → redirect to `/login` → throw error
3. On `403 Forbidden`: Show "Access Denied" notification → throw error
4. On `400 Bad Request`: Extract `ApiResponse.errors[]` array → normalize into `AppError` → throw
5. On `5xx`: Show generic "Service unavailable" notification → throw error
6. Never silently swallow errors

#### 3.3 Response Type Contract

The frontend mirrors the backend's `ApiResponse<T>` exactly:
```typescript
// core/types/api.types.ts
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[];
}
```
All service functions return the inner `data` typed specifically — the `ApiResponse` wrapper is consumed by the interceptor, never exposed to components.

---

### SECTION 4 — AUTHENTICATION FLOW DESIGN

#### 4.1 Login Flow

```
User enters: username + password + tenantCode
                    │
                    ▼
         POST /api/auth/login
                    │
         ┌──────────▼──────────┐
         │  ApiResponse<{      │
         │    Token,           │
         │    ExpiresAt,       │
         │    Username,        │
         │    Roles[]          │
         │  }>                 │
         └──────────┬──────────┘
                    │ on success
                    ▼
    1. Store token in sessionStorage
    2. Decode JWT claims (atob — no library)
       → Extract UserId, TenantId, roles[]
    3. Hydrate Zustand authStore:
       { token, userId, tenantId, username, roles, expiresAt }
    4. Navigate to /dashboard
```

#### 4.2 Token Storage Strategy

| Option | Decision | Reason |
|---|---|---|
| `localStorage` | Rejected | Persists across tabs/sessions; XSS risk |
| `httpOnly Cookie` | Not available | Backend returns Bearer token, not Set-Cookie |
| `sessionStorage` | **Selected** | Tab-scoped, cleared on tab close; mitigates persistent XSS |
| Zustand in-memory | **Also used** | Primary runtime source; sessionStorage for page refresh recovery |

**Hydration on page refresh:**
- On app mount (`main.tsx`), check sessionStorage for token
- If token exists AND `ExpiresAt > now`, hydrate authStore
- If token is expired or missing, redirect to `/login`

#### 4.3 Refresh Token Handling

The backend **does not implement a refresh token endpoint**. Strategy:
- JWT lifetime is 480 minutes (8 hours) — covers a full working day
- 30 minutes before expiry, show a persistent in-app banner: "Your session expires in 30 minutes. Please save your work."
- On expiry / 401 response: clear store, redirect to `/login` with `?reason=session_expired`
- Login page displays appropriate message when reason param is present
- **No silent refresh is implemented** — explicit user action required

#### 4.4 Protected Route Logic

```
Route requested
      │
      ▼
ProtectedRoute.tsx
  ├── No token in store → redirect /login
  ├── Token expired → redirect /login?reason=session_expired
  ├── Route has requiredRoles[] defined
  │     ├── User has at least one matching role → render <Outlet />
  │     └── User lacks required role → render <AccessDenied /> (403 page)
  └── No role restriction on route → render <Outlet />
```

#### 4.5 Role-Based Access Design

Two levels of access control:

**Level 1 — Route Guard (coarse)**
```typescript
// routes.config.ts
{ path: '/governance/audit', requiredRoles: ['Auditor', 'ComplianceOfficer', 'PlatformSuperAdmin'] }
{ path: '/governance/approvals', requiredRoles: ['FinanceController', 'RiskController'] }
```

**Level 2 — Render Guard (fine-grained)**
```tsx
// Within any component:
const { hasRole, hasPermission } = useAuth();

// Approve button: only shown to non-maker roles
{ hasRole('FinanceController') && record.createdBy !== currentUserId && <ApproveButton /> }

// Sensitive fields: masked unless permitted
{ hasPermission('view:sensitive-fields') ? <Amount value={margin} /> : <MaskedField /> }
```

**Sensitive field masking rule (from governance doc):**
Fields `Margin %`, `Net Obligation`, `Charges %`, `Realized PnL` render as `●●●●` for:
- Partners, Auditors, and any role without explicit `view:sensitive-fields` permission
- Field value is not even fetched from the DOM — the backend may omit it; frontend renders placeholder regardless

---

### SECTION 5 — ENVIRONMENT STRATEGY

#### 5.1 Strict Two-Environment Rule

| Environment | Purpose | Backend Target |
|---|---|---|
| `dev` | Development & feature testing | Dev VM (`http://80.225.204.132`) |
| `prod` | Production (maps to backend QA VM) | QA VM (`http://<QA_VM_IP>`) |

**No staging. No manual deployment. No hardcoded URLs.**

#### 5.2 Environment Variable Files

```bash
# .env.dev  (gitignored — never committed)
VITE_API_BASE_URL=http://80.225.204.132
VITE_ENV=dev
VITE_APP_NAME=PostTrade Clearing Platform

# .env.prod  (gitignored — never committed)
VITE_API_BASE_URL=http://<QA_VM_PUBLIC_IP>
VITE_ENV=prod
VITE_APP_NAME=PostTrade Clearing Platform

# .env.example  (committed — no real values)
VITE_API_BASE_URL=
VITE_ENV=
VITE_APP_NAME=
```

#### 5.3 Type-Safe Environment Access

All environment variables are accessed exclusively through `core/config/env.ts`. Direct `import.meta.env.VITE_*` usage in any other file is a lint error.

```typescript
// core/config/env.ts — the ONLY place import.meta.env is accessed
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  env: import.meta.env.VITE_ENV as 'dev' | 'prod',
  appName: import.meta.env.VITE_APP_NAME,
} as const;
```

**Build-time validation:** `vite.config.ts` includes a plugin that throws a build error if any required env var is empty string or undefined.

#### 5.4 Deployment Mapping

```
Branch logic:

  any branch ≠ main
    → Vite builds with --mode dev   (.env.dev is loaded)
    → Docker image tagged: frontend:dev-<sha>, frontend:dev-latest
    → Deployed to DEV VM

  merge to main
    → Vite builds with --mode prod  (.env.prod is loaded)
    → Docker image tagged: frontend:prod-<sha>, frontend:prod-latest
    → Deployed to PROD VM (backend's QA VM)
```

---

### SECTION 6 — CI/CD STRATEGY DESIGN

#### 6.1 Pipeline Architecture (Text Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEV PIPELINE                                        │
│  Trigger: push to any branch ≠ main                                         │
│                                                                             │
│  [Checkout] → [Node 20 setup] → [npm ci] → [Lint + Type-check]             │
│             → [Vite build --mode dev] → [Build artifact]                   │
│             → [Docker build (multi-stage)] → [Push to ghcr.io :dev-latest] │
│             → [SCP nginx.conf + docker-compose.frontend.dev.yml to Dev VM] │
│             → [SSH: docker compose up --force-recreate]                     │
│             → [Health verify: curl http://<DEV_VM>/]                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROD PIPELINE                                        │
│  Trigger: push or PR merged into main                                       │
│                                                                             │
│  [Checkout] → [Node 20 setup] → [npm ci] → [Lint + Type-check]             │
│             → [Vite build --mode prod] → [Build artifact]                  │
│             → [Docker build (multi-stage)] → [Push to ghcr.io :prod-latest]│
│             → [SCP nginx.conf + docker-compose.frontend.prod.yml to Prod VM]│
│             → [SSH: docker compose up --force-recreate]                     │
│             → [Health verify: curl http://<PROD_VM>/]                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTO-PR PIPELINE (inherited pattern)                   │
│  Trigger: push to any branch ≠ main                                         │
│  Action: opens PR from branch → main if none exists                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.2 Docker Multi-Stage Build Strategy

```
Stage 1 — Builder (node:20-alpine):
  - COPY package.json package-lock.json
  - RUN npm ci  (locked installs, no phantom deps)
  - COPY src/ vite.config.ts tsconfig.json
  - Build args: VITE_API_BASE_URL, VITE_ENV, VITE_APP_NAME
  - RUN vite build --mode $BUILD_MODE → /app/dist

Stage 2 — Runtime (nginx:alpine):
  - COPY --from=builder /app/dist /usr/share/nginx/html
  - COPY nginx.conf /etc/nginx/conf.d/default.conf
  - EXPOSE 80
  - Non-root user
  - CMD ["nginx", "-g", "daemon off;"]
```

**No Node.js runtime in final image.** Final image: ~25MB.

#### 6.3 Nginx Configuration (SPA)

```nginx
# nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # SPA fallback — all unmatched routes serve index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Security headers
  add_header X-Frame-Options "DENY";
  add_header X-Content-Type-Options "nosniff";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

**Note:** The frontend container does NOT proxy `/api` — the Axios `VITE_API_BASE_URL` points directly to the backend VM. This is consistent with the backend's `AllowAll` CORS policy.

#### 6.4 GitHub Actions Secrets Required

| Secret | Used By | Description |
|---|---|---|
| `DEV_VM_HOST` | Dev pipeline | Dev VM IP (same as backend: `80.225.204.132`) |
| `PROD_VM_HOST` | Prod pipeline | Prod/QA VM IP |
| `VM_SSH_KEY` | Both | Same SSH key as backend pipelines |
| `DEV_API_BASE_URL` | Dev pipeline | `http://80.225.204.132` |
| `PROD_API_BASE_URL` | Prod pipeline | `http://<QA_VM_IP>` |
| `GITHUB_TOKEN` | Both | Auto-provided |

#### 6.5 Version Tagging

```
dev builds:  ghcr.io/himanshubisht1606/posttrade-frontend:dev-<8-char-sha>
             ghcr.io/himanshubisht1606/posttrade-frontend:dev-latest

prod builds: ghcr.io/himanshubisht1606/posttrade-frontend:prod-<8-char-sha>
             ghcr.io/himanshubisht1606/posttrade-frontend:prod-latest
```

Identical tagging convention to the backend pipelines.

---

### SECTION 7 — SECURITY & GOVERNANCE COMPLIANCE

| Requirement | Implementation |
|---|---|
| No secrets in code | All env vars via `.env.*` files, gitignored; CI passes via GitHub Secrets as Docker build args |
| Strict TypeScript | `"strict": true` in `tsconfig.json`; `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` all enabled |
| ESLint strict | `@typescript-eslint/recommended-strict`, `react-hooks/rules-of-hooks`, `react/no-danger` |
| Prettier | Single config; enforced in CI pre-build step; build fails on format errors |
| No business logic in components | Components call hooks only; hooks call services; services call HTTP |
| Service layer isolation | Module services import only `axiosInstance` — no Zustand, no React |
| Sensitive field masking | `MaskedField` component + `hasPermission()` guard in every financial display |
| No hard-coded URLs | `eslint-plugin-no-hardcoded-url` custom rule bans any string starting with `http://` or `https://` in source files |
| Maker-Checker enforcement | `createdBy !== currentUserId` check in `ApprovalTable.tsx`; approve/reject buttons hidden otherwise |
| XSS prevention | Ant Design does not use `dangerouslySetInnerHTML`; JSON diff viewer uses pre-rendered text, not innerHTML |
| Correlation ID | Every API request carries `X-Correlation-ID: <uuid-v4>` injected by Axios request interceptor |
| Session management | Token stored in sessionStorage; expires in 8h; 401 response triggers immediate logout |
| No refresh token complexity | No token refresh logic — clean 8-hour session aligned with backend design |

---

### SECTION 8 — ROUTING STRATEGY

```
/login                           → LoginPage (public)
/                                → redirect → /dashboard

/dashboard                       → DashboardPage          [all authenticated roles]
/account-management
  /clients                       → ClientListPage          [all roles]
  /clients/:id                   → (opens drawer, not a separate route)
  /brokers                       → BrokerListPage          [TenantOwner, OpsController]

/clearing
  /trades                        → TradeListPage           [all roles]
  /settlement/batches            → BatchListPage           [OpsController, FinanceController]
  /settlement/obligations        → ObligationListPage      [OpsController, FinanceController]

/finance
  /ledger                        → LedgerPage              [FinanceController, Auditor]
  /charges                       → ChargesConfigPage       [FinanceController]

/reconciliation                  → ReconDashboardPage      [OpsController, RiskController]

/governance
  /approvals                     → ApprovalQueuePage       [FinanceController, RiskController]
  /audit                         → AuditLogPage            [Auditor, ComplianceOfficer, PlatformSuperAdmin]

/403                             → AccessDeniedPage
/404                             → NotFoundPage
```

**Drawer pattern:** Record detail never changes the URL route. The `SlideDrawer` receives a `selectedId` prop and fetches the detail internally. Back navigation is clean.

---

### SECTION 9 — STATE MANAGEMENT DESIGN

#### Zustand Store: `authStore`
```
{
  token: string | null
  userId: string | null
  tenantId: string | null
  username: string | null
  roles: string[]
  expiresAt: Date | null
  isAuthenticated: boolean

  actions:
    login(response: LoginResponse): void
    logout(): void
    hasRole(role: string): boolean
}
```

#### TanStack Query — Server State
- Each module has its own query keys namespaced: `['clients', filters]`, `['settlement-batches', filters]`
- `staleTime: 30_000ms` for list queries (data refreshes every 30s)
- `staleTime: 0` for approval queue (always fresh)
- Mutations invalidate their parent list query on success
- Error boundaries at module level — one module failing does not crash siblings

#### Zustand Store: `uiStore`
```
{
  sidebarCollapsed: boolean
  breadcrumb: BreadcrumbItem[]

  actions:
    toggleSidebar(): void
    setBreadcrumb(items: BreadcrumbItem[]): void
}
```

---

### SECTION 10 — DEPLOYMENT ALIGNMENT

Frontend deployment exactly mirrors backend deployment:

| Aspect | Backend | Frontend |
|---|---|---|
| Containerization | Docker (multi-stage) | Docker (multi-stage) |
| Orchestration | Docker Compose on OCI VM | Docker Compose on OCI VM |
| Registry | `ghcr.io` | `ghcr.io` (same org) |
| CI/CD | GitHub Actions | GitHub Actions (same repo structure) |
| Dev trigger | any branch ≠ main | any branch ≠ main |
| Prod trigger | push/merge to main | push/merge to main |
| Health check | `GET /health` | `GET /` (nginx serves 200) |
| VM OS | Oracle Linux 8 | Same VM (co-hosted) or dedicated |
| Image naming | `posttrade-api:dev-latest` | `posttrade-frontend:dev-latest` |
| Secrets management | GitHub Secrets → `.env` file on VM | GitHub Secrets → Docker build args |

> **Co-hosting option:** The frontend container can run on the same OCI VM as the backend, on port 3000 (nginx), with the backend on port 80. Or on a dedicated VM. This decision is deferred to implementation — the Docker Compose and pipeline are written to support either.

---

### SECTION 11 — CI/CD DEPLOYMENT ARCHITECTURE (Full Diagram)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     FULL CI/CD ARCHITECTURE                                  │
│                                                                              │
│   Developer                                                                  │
│      │                                                                       │
│      │ git push origin feature/XYZ                                           │
│      ▼                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │  GitHub Actions: deploy-dev.yml                                       │   │
│  │                                                                       │   │
│  │  1. Checkout code                                                     │   │
│  │  2. Setup Node 20                                                     │   │
│  │  3. npm ci                                                            │   │
│  │  4. ESLint + tsc --noEmit  (fail fast on errors)                      │   │
│  │  5. vite build --mode dev                                             │   │
│  │     └── Loads .env.dev via build args from GitHub Secrets             │   │
│  │  6. docker build (multi-stage)                                        │   │
│  │     └── Stage 1: node:20-alpine builds dist/                          │   │
│  │     └── Stage 2: nginx:alpine serves dist/                            │   │
│  │  7. docker push ghcr.io/.../posttrade-frontend:dev-<sha>              │   │
│  │  8. docker push ghcr.io/.../posttrade-frontend:dev-latest             │   │
│  │  9. SCP docker-compose.frontend.dev.yml → Dev VM                      │   │
│  │  10. SSH → docker compose up -d --force-recreate --pull always        │   │
│  │  11. curl http://<DEV_VM>/ → verify 200                               │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│      │                                                                       │
│      │ PR auto-created (auto-pr.yml)                                         │
│      │                                                                       │
│      │ PR reviewed + merged into main                                        │
│      ▼                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │  GitHub Actions: deploy-prod.yml                                      │   │
│  │                                                                       │   │
│  │  (Same steps 1-11 above, but with:)                                   │   │
│  │  - vite build --mode prod                                             │   │
│  │  - PROD_API_BASE_URL from GitHub Secrets                              │   │
│  │  - Image tagged: posttrade-frontend:prod-<sha> / prod-latest          │   │
│  │  - Deployed to PROD VM (backend QA VM)                                │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Container Registry: ghcr.io/himanshubisht1606/posttrade-frontend            │
│                                                                              │
│  OCI Dev VM:  [posttrade-api:dev-latest]  [posttrade-frontend:dev-latest]   │
│  OCI Prod VM: [posttrade-api:qa-latest]   [posttrade-frontend:prod-latest]  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### SECTION 12 — APPROVAL CHECKLIST

```
ARCHITECTURE
  [ ] React 18 + TypeScript strict mode confirmed as stack
  [ ] Vite 5 as build tool confirmed
  [ ] Ant Design v5 as UI library confirmed
  [ ] Zustand + TanStack Query v5 as state management confirmed
  [ ] Clean architecture layering (core → shared → modules) approved
  [ ] No business logic in components rule accepted

API INTEGRATION
  [ ] Single Axios instance via axiosInstance.ts confirmed
  [ ] Request interceptor: token injection + X-Correlation-ID approved
  [ ] Response interceptor: 401→logout, 400→normalize, 5xx→notify confirmed
  [ ] ApiResponse<T> contract aligned with backend confirmed
  [ ] No hardcoded URLs anywhere in codebase confirmed

AUTHENTICATION
  [ ] sessionStorage token strategy approved (vs. localStorage)
  [ ] No refresh token implementation (8h session, explicit re-login) approved
  [ ] Session expiry banner (30-min warning) confirmed
  [ ] ProtectedRoute with role guard approved
  [ ] Maker-Checker enforcement in UI (createdBy ≠ currentUserId) approved
  [ ] Sensitive field masking (MaskedField component) approved

ENVIRONMENT STRATEGY
  [ ] Two environments only: dev + prod (no staging) confirmed
  [ ] Frontend "prod" maps to backend "QA VM" — naming clarification accepted
  [ ] VITE_API_BASE_URL, VITE_ENV, VITE_APP_NAME as required env vars confirmed
  [ ] .env.dev and .env.prod gitignored (only .env.example committed) confirmed
  [ ] Build fails if required env vars are empty confirmed

CI/CD
  [ ] GitHub Actions (3 workflows: deploy-dev, deploy-prod, auto-pr) approved
  [ ] Docker multi-stage build (node:20-alpine → nginx:alpine) approved
  [ ] GHCR as container registry approved
  [ ] Same pipeline structure as backend (matches philosophy) confirmed
  [ ] Deploy to Dev: any branch ≠ main confirmed
  [ ] Deploy to Prod: push/merge to main confirmed
  [ ] No manual deployment allowed confirmed

SECURITY & GOVERNANCE
  [ ] TypeScript strict: true (noImplicitAny, strictNullChecks, etc.) confirmed
  [ ] ESLint strict config approved
  [ ] Prettier enforced in CI confirmed
  [ ] No secrets in source code confirmed
  [ ] Service layer isolation (modules cannot call axiosInstance directly) confirmed
  [ ] Role-based render guards at route and component level approved
  [ ] Sensitive field masking for Margin%, NetObligation, Charges%, RealizedPnL confirmed

DEPLOYMENT ALIGNMENT
  [ ] Docker + Docker Compose on OCI VMs (matching backend) confirmed
  [ ] ghcr.io as container registry (same org as backend) confirmed
  [ ] Frontend image naming convention: posttrade-frontend:<env>-<sha> confirmed
  [ ] Co-hosting decision (same VM vs separate VM) — to be decided at implementation
```

---

> **Waiting for approval to proceed with implementation.**
