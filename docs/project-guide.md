# CodeForge Project Guide

Detailed reference moved out of the [README](../README.md): stack, testing,
security, accessibility, performance, CI/CD, admin dashboard, API, setup,
verification commands, deployment, observability, operations and the project
structure.

---

# Technology Stack

## Frontend

```text
Astro
Tailwind CSS
TypeScript
Vercel
```

## Backend

```text
Node.js 24.x
Fastify
TypeScript
Mongoose
```

## Database

```text
MongoDB Atlas
```

## Testing

```text
Vitest
Fastify inject()
happy-dom
Astro Container API
V8 Coverage
Playwright
axe-core
```

## Security

```text
Helmet
Hash-based CSP (no 'unsafe-inline')
CSRF guard (origin + custom header)
HSTS
CORS
JWT
HttpOnly / Secure / SameSite cookies
Rate limiting
bcrypt
Audit logging
```

---

# Testing

CodeForge uses a layered testing strategy:

```text
Static validation
      ↓
Unit tests
      ↓
API / integration tests
      ↓
Security tests
      ↓
Production build
      ↓
Browser E2E
```

## Backend

Vitest unit, API and security tests run against a real MongoDB instance.
Coverage thresholds: statements 85%, branches 80%, functions 85%, lines 85%.

## Frontend

Vitest runs in two modes:

* client modules (admin dashboard, API client, particle animation, page
  effects) against happy-dom;
* `.astro` pages and components rendered with the Astro Container API, so
  server-side templates count toward coverage.

The admin tests mount the real page markup before running the client code,
which keeps element ids and scripts in sync. Coverage thresholds are 90% for
statements, branches, functions and lines.

## E2E

Playwright exercises the real backend and frontend:

* homepage, project pages and API failure handling;
* login, logout and protected-route redirects for every admin page;
* admin CRUD for projects and experiences (including logo upload);
* API playground, system status and mobile navigation;
* axe accessibility scans and keyboard navigation.

Results: [docs/metrics.md](metrics.md).

More details:

[Testing documentation](testing.md)

---

# Security

CodeForge uses defense-in-depth security controls.

## Authentication

JWT authentication is configured with:

* explicit algorithm policy;
* issuer;
* audience;
* expiration;
* HttpOnly cookies;
* Secure cookies in production;
* SameSite protection.

## Authorization

Authentication and authorization are separate concerns.

Protected operations require the appropriate authenticated and authorized
context.

## HTTP Security

Implemented controls include:

* Content-Security-Policy without `'unsafe-inline'`;
* HSTS;
* clickjacking protection;
* Referrer Policy;
* restricted CORS.

## Abuse Protection

Rate limiting is applied to protect sensitive endpoints.

Security tests verify brute-force behavior including:

```text
429 Too Many Requests
```

## CSRF Protection

The session cookie is `SameSite=None` in production (frontend and API are
different sites), so state-changing requests that carry it must also:

* come from an allowed origin (Origin/Referer check);
* send the `X-Requested-With: CodeForge` header, which cross-site pages
  cannot add without passing the CORS allowlist.

Login requests are origin-checked as well.

## Content Security Policy

* Frontend: Astro hashes every emitted script and style
  (`security.csp`), so `script-src` and `style-src` contain no
  `'unsafe-inline'`.
* API: JSON responses use `default-src 'none'`; Swagger UI (development
  only) sends its own hash-based policy.

## Dependency Security

`npm audit --audit-level=high` runs for both packages in CI, alongside
Dependabot and CodeQL.

Full security documentation:

[Security Architecture](security.md)

---

# Accessibility

Accessibility is treated as an engineering requirement rather than a visual
afterthought.

Implemented support includes:

* semantic HTML;
* accessible landmarks;
* skip navigation;
* explicit form labels;
* accessible names;
* visible keyboard focus;
* keyboard navigation;
* reduced-motion handling;
* appropriate ARIA usage.

## Measured Result

Lighthouse and axe results are tracked in [docs/metrics.md](metrics.md).
The Playwright suite fails on any axe violation in the audited pages.

See:

[Accessibility](accessibility.md)

---

# Performance

The production homepage is optimized around:

* Astro rendering;
* Vercel ISR;
* limited client-side JavaScript;
* efficient decorative rendering;
* reduced-motion support;
* visibility-aware animation.

## Latest Lighthouse Measurement

The latest recorded Lighthouse scores are in
[docs/metrics.md](metrics.md) (source: `docs/metrics-lighthouse.json`).
Lighthouse is run manually against production; re-run it after
frontend changes that affect loading.

Full performance documentation:

[Performance Baseline](performance.md)

---

# CI/CD

CodeForge is designed around automated quality gates.

The pipeline (`.github/workflows/ci.yml`) runs on pushes to `main` and on
pull requests targeting `main`:

```text
Validate (lint, tsc, astro check)
   ↓
Backend Tests + Coverage
   ↓
Frontend Tests + Coverage
   ↓
Build
   ↓
E2E
   ↓
Security
   ↓
Quality Gate
```

Each run regenerates [docs/metrics.md](metrics.md) from the test
output and publishes it in the GitHub Actions job summary.

---

# Admin Dashboard

`/admin` is a session-protected area (HttpOnly JWT cookie, verified against
`GET /api/auth/me` on every page):

| Page | Purpose |
|---|---|
| Overview | Project/experience counts, projects awaiting AI documentation, backend status, recently updated projects |
| Projects | Search, create, edit and delete projects; categories, linked experience, image and GitHub link; trigger AI documentation regeneration |
| Experiences | Create, edit and delete experiences with month pickers, "current role" handling and logo upload |
| API Playground | Send authenticated requests from presets, inspect status/timing/body, local request history |
| System | Liveness/readiness probes, request and error-rate metrics, optional 30 s auto-refresh |

All API data is written to the DOM with `textContent`/attributes (never
`innerHTML`), dialogs use the native `<dialog>` element, and destructive
actions go through a confirmation dialog. The client logic lives in
`frontend/src/lib/admin/` and is unit-tested against the real page markup.

---

# API

CodeForge exposes a Fastify REST API for:

* authentication;
* projects;
* experiences;
* administration;
* health checks.

The API follows:

```text
Request
  ↓
Validation
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MongoDB
```

Swagger/OpenAPI support is included for API exploration and contract
documentation; the Swagger UI is served at `/api-docs` in development only.

See:

[API Documentation](api.md)

---

# Environment Setup

## Requirements

* Node.js 24.x (see `.nvmrc`) for backend, frontend and CI;
* MongoDB: a local `mongod` on `localhost:27017` for development and tests,
  MongoDB Atlas in production.

Install dependencies:

```bash
cd backend
npm ci

cd ../frontend
npm ci
```

Copy `backend/.env.example` to `backend/.env` (and
`backend/.env.test.example` to `backend/.env.test` for tests), then fill in
the values.

The most important variables:

```text
MONGODB_URI
JWT_SECRET
ADMIN_API_KEY          # password of the seeded "admin" account
FRONTEND_URL           # extra CORS + CSRF allowed origin
OPENAI_API_KEY / GEMINI_API_KEY   # AI documentation (at least one)
PUBLIC_API_URL         # frontend, build time: API URL and CSP connect-src
RATE_LIMIT_MAX         # optional, default 100 req/min per client
LOGIN_RATE_LIMIT_MAX   # optional, default 5 logins/min per client
```

The complete list is in
[Deployment](deployment.md#7-environment-variables).

Never commit real production credentials.

---

# Local Development

## Backend

```bash
cd backend
npm run dev
```

## Frontend

```bash
cd frontend
npm run dev
```

The frontend (http://localhost:2003) and backend (port from `PORT`) use
separate development servers and communicate through `PUBLIC_API_URL`; set it
to your local backend, otherwise the frontend reads the production API.

---

# Verification Commands

## Backend

```bash
cd backend

npm run lint
npm run typecheck
npm run test:cov
npm audit --audit-level=high
```

## Frontend

```bash
cd frontend

npm run lint
npm run typecheck
npm run test:cov
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## Metrics

```bash
# after backend/frontend `npm run test:ci` and `npm run test:e2e`
npm run metrics   # rewrites docs/metrics.md
```

## Lighthouse

```bash
# desktop (omit --preset for mobile); run 2-3 times and record the median
npx lighthouse https://aesoul0.com/ \
  --preset=desktop \
  --output=json \
  --output-path=./lighthouse-desktop.json \
  --chrome-flags="--headless"
```

Record the result in `docs/metrics-lighthouse.json`; report files matching
`lighthouse*.json` are git-ignored.

---

# Deployment

Production architecture:

```text
Vercel
  ↓
Astro SSR / ISR
  ↓
Render
  ↓
Fastify
  ↓
MongoDB Atlas
```

The frontend uses Vercel.

The backend uses Render.

The database uses MongoDB Atlas.

See:

[Deployment Strategy](deployment.md)

---

# Observability

The backend uses structured request logging and audit logging.

Request-level diagnostics include identifiers and response timing.

Critical application operations are recorded through the audit logger.

Examples include:

```text
CREATE_PROJECT
UPDATE_EXPERIENCE
DELETE_PROJECT
```

Rejected CSRF and authentication attempts are logged as warnings.

The observability layer is intentionally lightweight and designed to provide
useful diagnostics without introducing unnecessary infrastructure complexity.

---

# Operations

[docs/operations.md](operations.md) covers what happens when things
fail and how to recover:

* **Failure behaviour:** what visitors and the admin see when the API,
  MongoDB or the AI providers are down, each row linked to the test that
  proves it.
* **Backup and restore:** `npm run db:backup -- dump|restore <dir>` in
  `backend/`, round-trip tested against a real database.
* **Deploy rollback:** Vercel instant rollback, Render rollback, or
  `git revert` on `main`.
* **Session revocation:** logout revokes its token server-side (TTL denylist,
  cleared after the 24 h expiry); rotate `JWT_SECRET` to end every session;
  change `ADMIN_API_KEY` to change the admin password.

---

# Project Structure

```text
CodeForge/
├── backend/
│   ├── src/
│   │   ├── controllers/  routes/  services/  repositories/  models/
│   │   ├── dtos/  errors/  config/   payload types, AppError, MongoDB connection
│   │   ├── middlewares/        auth, CSRF guard, metrics
│   │   └── utils/              AI, audit log, admin seed, Vercel deploy hook, backup
│   ├── scripts/db-backup.ts    npm run db:backup (dump / restore)
│   └── tests/                  unit/ and api/ (Vitest)
│
├── frontend/
│   ├── src/
│   │   ├── pages/              public pages, /admin, /api/health, /sitemap.xml
│   │   ├── components/  layouts/
│   │   ├── lib/                API client, DOM/format/Markdown helpers
│   │   │   └── admin/          admin dashboard modules
│   │   └── scripts/            public-page client modules
│   ├── tests/                  unit/, admin/, render/ (Vitest)
│   ├── e2e/                    Playwright
│   └── scripts/serve-build.mjs serve the production build locally
│
├── docs/
│   ├── adr/                    ADR 001–006
│   ├── metrics.md              generated: tests, coverage, Lighthouse
│   ├── metrics-lighthouse.json manual Lighthouse record
│   ├── accessibility.md  api.md  architecture.md  deployment.md
│   ├── developer-experience.md  engineering-scorecard.md  evidence.md
│   ├── operations.md  performance.md  project-guide.md  roadmap.md
│   ├── security.md  testing.md
│   ├── screenshots/            images and the scroll-tour GIF used in this README
│   └── case-studies/
│
├── scripts/
│   └── collect-metrics.mjs     builds docs/metrics.md
│
├── SECURITY.md                 how to report a vulnerability
│
└── .github/
    ├── workflows/              ci.yml, security.yml
    └── dependabot.yml
```

---


---


# Engineering Philosophy

CodeForge prioritizes:

> **measured engineering over speculative complexity.**

The project favors:

* clear boundaries;
* explicit contracts;
* security by default;
* testable business logic;
* measured performance;
* accessible interfaces;
* reproducible validation;
* documented architectural decisions.

The goal is not to maximize the number of technologies or features.

The goal is to demonstrate that the system can be understood, tested,
measured, secured and maintained like a professional engineering project.

