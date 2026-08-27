## `docs/developer-experience.md`

````md
# CodeForge Developer Experience

## 1. Purpose

CodeForge is designed to be understandable, reproducible and maintainable by
developers who did not originally create the project.

Developer experience is evaluated through:

- repository structure;
- explicit tooling;
- reproducible commands;
- environment documentation;
- type safety;
- test automation;
- predictable development workflow;
- documentation quality.

---

# 2. Repository Structure

The repository is organized around clear application boundaries:

```text
CodeForge/
├── backend/
│   ├── src/
│   └── tests/
│
├── frontend/
│   ├── src/
│   └── e2e/
│
├── docs/
│   ├── adr/
│   ├── api.md
│   ├── architecture.md
│   ├── accessibility.md
│   ├── deployment.md
│   ├── developer-experience.md
│   ├── engineering-scorecard.md
│   ├── evidence.md
│   ├── performance.md
│   ├── roadmap.md
│   ├── security.md
│   └── testing.md
│
├── scripts/
│
└── .github/
    └── workflows/
````

The structure separates:

```text
Application code
Tests
Documentation
Automation
CI/CD
```

---

# 3. Required Tooling

The backend uses:

```text
Node.js 24.x
TypeScript
ESLint
Vitest
Supertest
V8 Coverage
```

The frontend uses:

```text
Node.js
Astro
TypeScript
ESLint
Playwright
Tailwind CSS
```

The exact dependency versions are controlled through the committed package
manifests and lockfiles.

---

# 4. Installation

## Backend

```bash id="f64gcx"
cd backend
npm ci
```

## Frontend

```bash id="sn4cgt"
cd frontend
npm ci
```

`npm ci` is preferred for reproducible dependency installation.

---

# 5. Environment Configuration

The application uses environment-specific configuration.

Important variable categories include:

```text
MONGODB_URI
JWT_SECRET
ADMIN_API_KEY
FRONTEND_URL
PUBLIC_API_URL
```

External provider credentials are also environment-dependent where required.

Production secrets must never be committed to the repository.

---

# 6. Development Workflow

## Backend

```bash id="f6wlkk"
cd backend
npm run dev
```

## Frontend

```bash id="u49pga"
cd frontend
npm run dev
```

The frontend and backend are intentionally separated during local development.

This mirrors the production deployment architecture.

---

# 7. Verification Workflow

Before opening or merging a change, the recommended local quality sequence is:

```text
Lint
  ↓
Typecheck
  ↓
Unit / Integration Tests
  ↓
Coverage
  ↓
Build
  ↓
E2E
  ↓
Dependency Audit
```

---

# 8. Backend Quality Commands

```bash id="e0n2k2"
npm run lint
npm run typecheck
npm run test
npm run test:cov
npm audit --audit-level=high
```

## Current Verified Result

```text
21 test files passed
161 tests passed

Statements: 95.08%
Branches:   85.05%
Functions:  95.29%
Lines:      95.05%
```

---

# 9. Frontend Quality Commands

```bash id="yq9u1t"
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## Current Verified Result

```text
Lint: PASS
Typecheck: PASS
Build: PASS

Playwright:
12 tests
6 workers
12 passed
```

---

# 10. E2E Development Workflow

Playwright uses an isolated local frontend/backend environment.

The current configuration intentionally runs:

```text
6 workers
```

This validates real concurrent browser execution.

Playwright reports and test artifacts are stored outside the Astro/Vite watched
directory to prevent test artifacts from triggering development-server reloads.

---

# 11. Type Safety

TypeScript is used across the primary frontend and backend codebases.

Static validation is expected to pass before changes are merged.

Current status:

```text
Frontend typecheck: PASS
Backend typecheck:  PASS
```

Types should be preferred over:

```text
any
unsafe casts
implicit contracts
duplicated DTO definitions
```

when a meaningful type can be introduced.

---

# 12. Code Organization

Backend responsibilities follow:

```text
Routes
Controllers
Services
Repositories
```

Frontend responsibilities are separated between:

```text
Pages
Layouts
Components
Styles
Client-side behavior
E2E tests
```

New functionality should preserve these boundaries rather than introducing
cross-layer shortcuts.

---

# 13. Error Handling

Errors should be handled at the appropriate layer.

Preferred flow:

```text
Repository / external failure
          ↓
Service
          ↓
Application error
          ↓
Central error handler
          ↓
HTTP response
```

This keeps transport-specific error formatting out of business logic.

---

# 14. Testing New Features

New backend functionality should include tests covering:

```text
Success
Validation failure
Authentication
Authorization
Not found
Conflict where applicable
External failure where applicable
```

New frontend functionality should include E2E coverage where the behavior is a
critical user journey.

Accessibility should be included when introducing or modifying interactive UI.

---

# 15. Documentation Workflow

Architectural decisions should be recorded in:

```text
docs/adr/
```

Engineering evidence should be recorded in:

```text
docs/evidence.md
docs/engineering-scorecard.md
```

Measured performance should be recorded in:

```text
docs/performance.md
```

Security controls belong in:

```text
docs/security.md
```

Testing behavior belongs in:

```text
docs/testing.md
```

This prevents the README from becoming the only source of technical evidence.

---

# 16. ADR Policy

Use an ADR when a decision:

* changes architecture;
* introduces a significant dependency;
* changes authentication/security strategy;
* changes persistence strategy;
* introduces a meaningful performance architecture;
* creates a long-term maintenance trade-off.

Current ADRs include decisions for:

```text
Astro
Fastify
JWT cookie authentication
AI service boundary
MongoDB
Vercel ISR
```

---

# 17. Dependency Management

Dependencies should be:

* intentionally selected;
* kept up to date;
* audited;
* removed when no longer required.

The standard check is:

```bash id="9xycwt"
npm audit --audit-level=high
```

Current local result:

```text
0 vulnerabilities
```

Dependency changes should be accompanied by appropriate test and build
verification.

---

# 18. Reproducibility

The repository should allow a developer to:

```text
Clone
  ↓
Install
  ↓
Configure environment
  ↓
Start
  ↓
Test
  ↓
Build
```

without requiring undocumented manual changes.

Commands and environment expectations should remain documented as the project
evolves.

---

# 19. Local Ports

The current architecture separates frontend and backend development services.

Typical local endpoints:

```text
Frontend:
http://127.0.0.1:4321

Backend:
http://127.0.0.1:3002
```

These values are used by the automated E2E environment and should remain
consistent with the Playwright configuration.

---

# 20. CI Consistency

Local commands should correspond as closely as practical to CI commands.

This reduces:

* "works locally" failures;
* dependency mismatch;
* environment-specific behavior;
* missing quality checks.

The project deliberately keeps core validation commands simple and scriptable.

---

# 21. Developer-Friendly Error Diagnosis

When a check fails, the preferred troubleshooting order is:

```text
1. Read the first actual failure
2. Identify whether it is application or infrastructure related
3. Reproduce locally
4. Inspect logs/traces
5. Fix root cause
6. Re-run the complete affected gate
```

The project should avoid lowering test concurrency or disabling checks merely to
make the pipeline pass.

A previous E2E issue illustrates this principle: the final configuration
preserves six workers and fixes the underlying Playwright/Astro artifact
interaction instead of reducing concurrency.

---

# 22. Generated Artifacts

Playwright artifacts should not interfere with frontend development-server
watching.

The project excludes E2E report directories from the relevant development
watcher paths.

This keeps:

```text
Test output
```

separate from:

```text
Source changes
```

and makes local E2E execution more deterministic.

---

# 23. Performance-Aware DX

Developer tooling should not make the application harder to diagnose.

Performance changes should be validated with:

```text
Build
E2E
Lighthouse
```

rather than introducing optimization complexity without measurement.

The current production performance evidence is:

```text
Performance: 99/100 (Desktop) / 90/100 (Mobile)
LCP: 0.4s (Desktop) / 1.6s (Mobile)
CLS:         0
```

---

# 24. Security-Aware DX

Convenience must not weaken security.

Developers should never:

* commit credentials;
* expose JWT secrets;
* bypass authentication in production;
* loosen CORS globally;
* disable CSP without justification;
* ignore dependency vulnerabilities without review.

Test credentials belong exclusively in test configuration.

---

# 25. Definition of a Healthy Change

A healthy change should be:

```text
Small enough to review
   +
Typed
   +
Tested
   +
Accessible when UI-related
   +
Documented when architectural
   +
Verified by quality gates
```

---

# 26. Developer Experience Checklist

## Setup

* [x] Backend install documented
* [x] Frontend install documented
* [x] Environment requirements documented
* [x] Development commands documented
* [x] Test commands documented

## Quality

* [x] ESLint
* [x] TypeScript
* [x] Unit tests
* [x] Integration tests
* [x] Coverage
* [x] E2E
* [x] Dependency audit

## Architecture

* [x] Layered backend
* [x] Frontend structure
* [x] ADR system
* [x] Architecture documentation

## Operations

* [x] Production deployment documentation
* [x] Environment separation
* [x] Structured logging
* [x] Audit logging

## Remaining

* [x] Fully green remote GitHub Actions validation
* [x] Final mobile Lighthouse evidence
* [ ] Final INP evidence (Pending CrUX data)

---

# 27. Current Developer Experience Position

CodeForge currently provides a strong developer workflow:

```text
Clear structure
   ↓
Documented environment
   ↓
Typed code
   ↓
Automated tests
   ↓
Coverage
   ↓
E2E
   ↓
Security audit
   ↓
Architecture documentation
```

The current local engineering gates are passing.

The main remaining DX-related concern is not local development functionality,
but ensuring that the remote CI environment behaves consistently with the
local workflow.

---

# 28. Engineering Principle

Developer experience is considered part of system quality.

A project is not maintainable merely because the source code works.

It should also be:

* understandable;
* reproducible;
* testable;
* diagnosable;
* documented;
* safe to modify.

CodeForge's current repository structure and validation workflow are designed
around those principles.

```
```
