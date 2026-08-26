# `docs/deployment.md`

````md
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
````

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

```text
Previous Performance: 88/100
Current Performance:  96/100

Previous LCP: 3.0s
Current LCP:  2.2s
```

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

Typical categories:

```text
MONGODB_URI
JWT_SECRET
ADMIN_API_KEY
FRONTEND_URL
PUBLIC_API_URL
AI provider credentials
deployment credentials
```

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

## Backend

Typical development command:

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

Backend tests use a dedicated test environment.

Typical commands:

```bash
npm run test
npm run test:cov
```

The test environment should never use production database credentials.

Playwright runs against a dedicated local frontend/backend setup.

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

```text
Performance:    96/100
Accessibility: 100/100
Best Practices: 96/100
SEO:            100/100
LCP:             2.2s
CLS:             0
```

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

The local quality gate is currently passing.

The latest recorded remote workflow, however, failed before reaching the project
validation stages.

Observed infrastructure error:

```text
invalid reference format
```

The failure occurred while creating the MongoDB service container.

Therefore:

```text
Local validation: PASS
Remote CI validation: PENDING
```

This must be resolved before the deployment pipeline can be considered fully
verified.

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

```text
Performance: 96
LCP: 2.2s
```

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
* [ ] Fully green remote GitHub Actions workflow

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

```text
Performance: 96/100
LCP: 2.2s
CLS: 0
```

The remaining deployment-level gap is remote CI verification.

No production architecture change is currently required solely for the
90/100 roadmap target.

```
```
