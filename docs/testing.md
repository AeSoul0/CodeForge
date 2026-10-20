# Testing

Current results and coverage: [metrics.md](metrics.md).

## Strategy

```text
Static checks   eslint · tsc (backend) · astro check (frontend)
      ↓
Unit / API      Vitest (backend, real MongoDB) · Vitest (frontend)
      ↓
Build           tsc · astro build
      ↓
E2E             Playwright against the real backend + Astro dev server
      ↓
Audit           npm audit · CodeQL
```

## Backend (`backend/tests`)

- **Unit**: services, repositories, controllers, routes, middleware (auth,
  CSRF, metrics), `AppError`, database connection and admin seeding.
- **API**: Fastify `inject()` against a real MongoDB database
  (`codeforge_test`), covering authentication, validation, security headers,
  CSRF rejection and rate limiting, plus a backup dump/restore round trip
  (`backup.test.ts`).
- Thresholds (V8): statements 85%, branches 80%, functions 85%, lines 85%.

```bash
cd backend
npm test          # uses .env.test
npm run test:cov  # with coverage thresholds
```

## Frontend (`frontend/tests`)

| Folder | Environment | What it covers |
|---|---|---|
| `unit/` | Node / happy-dom | API client, DOM helpers, formatting, safe Markdown, content loaders, particle animation, page effects, project filter |
| `admin/` | `happy-dom-ssr` | Every admin page: the real page is rendered with the Astro Container API, mounted into happy-dom, then its client module runs against mocked `fetch` |
| `render/` | Node | Public pages and components rendered with the Container API (home, project detail incl. 404/503, case study, layout, `/api/health`) |

`happy-dom-ssr` (`tests/environments/happy-dom-ssr.ts`) provides DOM globals
while keeping Vite's SSR transform, which `.astro` rendering needs.

Thresholds (V8, over `src/**/*.{ts,astro}`): 90% statements, branches,
functions and lines.

```bash
cd frontend
npm test
npm run test:cov
```

## E2E (`frontend/e2e`)

| Spec | Scope |
|---|---|
| `home.spec.ts`, `api-errors.spec.ts` | Public pages, backend failure handling |
| `auth.spec.ts` | Login, invalid login, protected routes, logout |
| `admin.spec.ts` | Project and experience CRUD (with logo upload), search, validation, API playground, system status, mobile navigation, axe scans of every admin page and dialog |
| `accessibility.spec.ts`, `keyboard.spec.ts` | axe scans and keyboard focus on public pages |

Playwright starts a fresh backend (`E2E=true`) and the Astro dev server.
`LOGIN_RATE_LIMIT_MAX` and `RATE_LIMIT_MAX` are raised for the E2E backend
only, because six parallel workers share one IP.

```bash
cd frontend
npm run test:e2e
# with a preinstalled Chromium:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome npm run test:e2e
```

## Production build with CSP

`astro dev` does not emit the CSP. To check it in a browser:

```bash
cd frontend
npm run build && npm run serve:build   # http://127.0.0.1:4322
```

## Regenerating metrics

```bash
(cd backend && npm run test:ci)    # needs the .env.test variables
(cd frontend && npm run test:ci && npm run test:e2e)
npm run metrics                     # writes docs/metrics.md
```
