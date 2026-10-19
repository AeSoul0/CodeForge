# CodeForge Deployment Strategy

## 1. Overview

CodeForge uses a separated production deployment architecture:

```text
                    ┌──────────────────────┐
                    │       Browser        │
                    └──────────┬───────────┘
                               │
                              HTTPS
                               │
                               ▼
                    ┌──────────────────────┐
                    │        Vercel        │
                    │                      │
                    │ Astro SSR / ISR      │
                    │ Frontend             │
                    │ Public UI            │
                    │ Admin UI              │
                    └──────────┬───────────┘
                               │
                              REST
                               │
                               ▼
                    ┌──────────────────────┐
                    │        Render        │
                    │                      │
                    │ Fastify API          │
                    │ Node.js 24.x         │
                    └──────────┬───────────┘
                               │
                            Mongoose
                               │
                               ▼
                    ┌──────────────────────┐
                    │    MongoDB Atlas     │
                    └──────────────────────┘
```

The separation provides clear operational boundaries between:

* frontend rendering;
* backend API processing;
* persistent data storage.

---

# 2. Frontend Deployment

## Platform

The frontend is deployed to:

```text
Vercel
```

The project uses:

```text
Astro
@astrojs/vercel
output: server
```

The frontend therefore supports server-side rendering and production ISR.

---

# 3. Vercel ISR

The current Vercel adapter configuration uses:

```text
ISR expiration: 300 seconds
```

This allows cacheable production responses to be reused instead of requiring
full server-side rendering for every request.

The optimization produced a measurable improvement in Lighthouse:

Current numbers: see [metrics.md](metrics.md).

ISR should therefore be considered part of the production performance
architecture.

---

# 4. Backend Deployment

## Platform

The backend is deployed to:

```text
Render
```

Runtime:

```text
Node.js 24.x
```

Application server:

```text
Fastify
```

The production process is built from TypeScript and executed from the generated
production output.

Render reads the Node version from the root `.nvmrc` and uses the same scripts
as local development, CI and Playwright (since 2026-10-19):

```text
Root directory: ./backend
Build command:  npm ci --include=dev && npm run build   (tsc -p tsconfig.build.json)
Start command:  npm run start                           (node dist/index.js)
```

`--include=dev` keeps TypeScript installed even if `NODE_ENV=production` is
set for the build. A start-command change alone redeploys the previous build
artifact, so a change to the output layout needs a full build ("Clear build
cache & deploy").

Swagger UI is not exposed in production (see [API § 17](api.md#17-swagger--openapi)).

---

# 5. Database Deployment

The production persistence layer is:

```text
MongoDB Atlas
```

The application connects through Mongoose.

Database credentials must be supplied through environment variables.

No production credentials should be committed to the repository.

---

# 6. Environment Separation

CodeForge distinguishes between:

```text
Development
Test
Production
```

Each environment should use its own configuration.

Typical environment-sensitive values include:

* MongoDB URI;
* JWT secret;
* admin credentials;
* frontend URL;
* API URL;
* external service credentials;
* deployment configuration.

---

# 7. Environment Variables

Sensitive environment variables must never be committed with real values.

Complete list (templates: `backend/.env.example`, `backend/.env.test.example`):

| Variable | Where | Required | Effect |
|---|---|---|---|
| `MONGODB_URI` | backend | yes | MongoDB connection string (Atlas in production). |
| `JWT_SECRET` | backend | yes | Signs the session JWT. |
| `ADMIN_API_KEY` | backend | yes | Password of the `admin` account; it is hashed and seeded (or re-synchronized) at every startup. |
| `FRONTEND_URL` | backend | no | Extra origin added to the CORS allowlist **and** to the origins accepted by the CSRF guard. `https://www.aesoul0.com`, `https://aesoul0.com` and the local dev origins (ports 2003 and 4321) are always allowed. |
| `PORT`, `HOST` | backend | no | Listen address (defaults `3000`, `0.0.0.0`). |
| `LOG_LEVEL` | backend | no | Audit logger level (default `info`). |
| `RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_MAX` | backend | no | Per-client limits per minute (defaults 100 and 5). Only the Playwright backend raises them. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | backend | one AI key | OpenAI provider for AI documentation, tried first (default model `gpt-4o-mini`). |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | backend | one AI key | Gemini provider, used when OpenAI is not configured or fails. |
| `GITHUB_TOKEN` | backend | no | Higher GitHub API rate limit when the AI service reads a repository. |
| `VERCEL_DEPLOY_HOOK_URL` | backend | no | Deploy hook triggered after project/experience changes; skipped when unset. |
| `DEV_BYPASS_AUTH` | backend | no | `true` skips JWT checks, but only when `NODE_ENV=development`. Never set it in production. |
| `PUBLIC_API_URL` | frontend, **build time** | no | API base URL for SSR and the browser, and the only API origin allowed by the CSP `connect-src`. Defaults to the production backend; changing the API host requires a rebuild. |

Development and test environments use dedicated configuration files.

Production values must be stored through platform secret management.

---

# 8. Production Build

## Frontend

Production build:

```bash
npm run build
```

Verified locally:

```text
PASS
```

The resulting Astro application is bundled for the Vercel deployment target.

## Backend

Production build:

```bash
npm run build
```

The backend is compiled from TypeScript into its production output.

---

# 9. Local Development

Requirements: Node.js 24.x (`.nvmrc`) and a MongoDB instance, either a local
`mongod` on `localhost:27017` or an Atlas connection string.

## Backend

Copy `backend/.env.example` to `backend/.env`, then:

```bash
npm run dev
```

## Frontend

Typical development command:

```bash
npm run dev
```

The local frontend and backend use separate development servers and communicate
through the configured API URL.

---

# 10. Testing Environment

Backend tests use a dedicated test environment: copy
`backend/.env.test.example` to `backend/.env.test` and start MongoDB on
`localhost:27017`.

Typical commands:

```bash
npm run test
npm run test:cov
```

The test environment should never use production database credentials.

Playwright starts its own servers: the compiled backend (`npm run start` in
`backend/`, so run `npm run build` there first) on port 3002 with
`NODE_ENV=test` and the test database, and the Astro dev server on port 4321.
It only needs the local MongoDB instance.

---

# 11. Deployment Validation

Before deployment, the local quality gate should include:

```text
Lint
Typecheck
Backend tests
Coverage
Frontend build
Playwright E2E
Dependency audit
```

Recommended complete sequence:

```bash
cd backend

npm run lint
npm run typecheck
npm run test:cov
npm audit --audit-level=high

cd ../frontend

npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm audit --audit-level=high
```

---

# 12. Production Verification

After deployment, verify:

```text
Homepage
Admin login
Protected routes
API connectivity
Authentication
Project data
Experience data
Static assets
Security headers
```

Performance verification should use Lighthouse against the deployed production
domain.

Current homepage result:

Current numbers: see [metrics.md](metrics.md).

---

# 13. Security Validation

Production deployment should verify:

* HTTPS;
* HSTS;
* CSP;
* secure cookies;
* CORS;
* authentication;
* authorization;
* rate limiting;
* sanitized errors.

The deployment must never expose:

* JWT secrets;
* database credentials;
* API keys;
* administrative passwords.

---

# 14. Deployment Architecture and Caching

The production frontend uses ISR for cacheable responses.

Current policy:

```text
Cache expiration: 300 seconds
```

Dynamic administrative functionality remains application-driven.

The cache strategy should not be expanded to sensitive authenticated state.

Authentication and administrative responses must remain appropriately dynamic
and protected.

---

# 15. Deployment Failure Handling

Deployment failures should be treated separately from application failures.

The deployment process should distinguish:

```text
Build failure
Configuration failure
Infrastructure failure
Application failure
Database connectivity failure
External service failure
```

Logs should be inspected before changing application code in response to a
deployment-specific failure.

---

# 16. CI/CD Architecture

The repository uses GitHub Actions for automated validation.

The intended pipeline is:

```text
Checkout
   ↓
Install dependencies
   ↓
Lint
   ↓
Typecheck
   ↓
Backend tests
   ↓
Coverage
   ↓
Frontend unit + rendering tests (coverage ≥ 90%)
   ↓
Backend build
   ↓
Frontend build
   ↓
Playwright
   ↓
Dependency security
   ↓
Quality summary
```

Artifacts such as:

* coverage reports;
* Playwright reports;
* test results;

should be retained for failed or important workflow runs.

---

# 17. Current CI Status

The MongoDB service-container failure (`invalid reference format`) recorded
in earlier runs has been resolved; the `CodeForge CI Pipeline` workflow has
run green on `main` and on pull requests since then.

The workflow runs on pushes to `main` and on pull requests targeting `main`.
Each run publishes `docs/metrics.md` in its job summary; the authoritative
status is the latest run in the repository's Actions tab.

---

# 18. Release Discipline

Recommended release flow:

```text
Feature branch
      ↓
Pull Request
      ↓
Required checks
      ↓
Review
      ↓
Merge
      ↓
Production deployment
```

`main` should remain the protected production branch.

Releases should be traceable to a specific commit.

---

# 19. Rollback Strategy

A deployment rollback should be based on the last known-good version.

The preferred rollback flow is:

```text
Detect regression
      ↓
Identify last known-good deployment
      ↓
Rollback deployment
      ↓
Verify homepage
      ↓
Verify API
      ↓
Verify authentication
      ↓
Re-run critical checks
```

Database changes must be reviewed separately because application rollback does
not automatically revert database migrations or persisted data.

---

# 20. Observability

Production troubleshooting should use:

* application logs;
* request identifiers;
* audit logs;
* API response status;
* deployment logs;
* database connectivity information;
* external service error logs.

The objective is to identify whether a production issue belongs to:

```text
Frontend
Backend
Database
External service
Infrastructure
```

before applying a fix.

---

# 21. Performance Deployment Evidence

The introduction of ISR is a deployment-level optimization with measurable
impact.

Before:

```text
Performance: 88
LCP: 3.0s
```

After:

Current numbers: see [metrics.md](metrics.md).

The current production frontend therefore meets the roadmap Performance target.

---

# 22. Deployment Checklist

## Frontend

* [x] Vercel deployment architecture
* [x] Astro SSR
* [x] ISR configured
* [x] Production build passes
* [x] Production homepage measured
* [x] Lighthouse Performance >= 90
* [x] Lighthouse Accessibility >= 90
* [x] Lighthouse SEO >= 90

## Backend

* [x] Render deployment architecture
* [x] Node.js 24.x
* [x] Fastify
* [x] Production TypeScript build
* [x] Authentication
* [x] Authorization
* [x] Rate limiting
* [x] Security middleware

## Database

* [x] MongoDB Atlas
* [x] Environment-based credentials
* [x] Repository abstraction
* [x] Dedicated test configuration

## Release

* [x] Local lint
* [x] Local typecheck
* [x] Backend tests
* [x] Coverage
* [x] Frontend build
* [x] Playwright
* [x] Dependency audits
* [x] Fully green remote GitHub Actions workflow

---

# 23. Final Deployment Position

CodeForge has a clear production deployment architecture:

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

The frontend production deployment has demonstrated a measurable performance
improvement through ISR and currently reports:

Current numbers: see [metrics.md](metrics.md).

The remote GitHub Actions workflow is green on `main`, so no deployment-level
gap remains for the 90/100 roadmap target.
