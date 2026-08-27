# CodeForge

[![GitHub](https://img.shields.io/badge/GitHub-AeSoul0%2FCodeForge-181717?logo=github)](https://github.com/AeSoul0/CodeForge)
[![Backend](https://img.shields.io/badge/backend-Fastify-000000?logo=fastify)](https://fastify.dev/)
[![Frontend](https://img.shields.io/badge/frontend-Astro-FF5D01?logo=astro)](https://astro.build/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)](https://www.docker.com/)

A production-oriented full-stack portfolio and administrative platform built
to demonstrate modern software engineering practices across architecture,
security, testing, accessibility and performance.

**Live:** https://www.aesoul0.com

---

## Engineering Snapshot

CodeForge is evaluated using measurable engineering evidence rather than feature
count alone.

| Area | Verified Result |
|---|---:|
| Frontend lint | ✅ PASS |
| Frontend typecheck | ✅ PASS |
| Frontend production build | ✅ PASS |
| Backend lint | ✅ PASS |
| Backend typecheck | ✅ PASS |
| Backend tests | ✅ 161/161 |
| Backend statements coverage | ✅ 95.08% |
| Backend branches coverage | ✅ 85.05% |
| Backend functions coverage | ✅ 95.29% |
| Backend lines coverage | ✅ 95.05% |
| Playwright E2E | ✅ 12/12 |
| Playwright workers | ✅ 6 |
| Frontend dependency audit | ✅ 0 vulnerabilities |
| Backend dependency audit | ✅ 0 vulnerabilities |
| Lighthouse Performance | ✅ 93/100 |
| Lighthouse Accessibility | ✅ 100/100 |
| Lighthouse Best Practices | ✅ 100/100 |
| Lighthouse SEO | ✅ 100/100 |
| Lighthouse LCP | ✅ 1.8s |
| Lighthouse CLS | ✅ 0 |

> The metrics above represent the latest verified local and production
> measurements available during the engineering review. Remote CI validation is fully automated
> and passing on GitHub Actions.

---

# Architecture

```mermaid
graph TD
    Browser[Browser] -->|HTTPS| Vercel[Vercel / Astro]
    Vercel -->|SSR / ISR| Frontend[Astro + React]
    Frontend -->|REST| API[Fastify API]

    subgraph Backend
        API --> Security[Security Middleware]
        Security --> Routes[Routes]
        Routes --> Controllers[Controllers]
        Controllers --> Services[Services]
        Services --> Repositories[Repositories]
    end

    Repositories --> MongoDB[(MongoDB Atlas)]
    Services --> External[External Services / AI]
````

## Frontend

* Astro
* React
* Tailwind CSS
* TypeScript
* Vercel SSR
* Vercel ISR

The application uses Astro as the primary rendering layer and React only where
interactive behavior benefits from it.

The current ISR configuration uses a:

```text
300 second expiration
```

## Backend

* Node.js 24.x
* Fastify
* TypeScript
* Mongoose
* MongoDB Atlas

The backend follows:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
MongoDB
```

This keeps transport, business and persistence responsibilities separated.

---

# Key Engineering Decisions

Important architectural decisions are documented as ADRs:

* [ADR 001 — Astro](docs/adr/001-astro.md)
* [ADR 002 — Fastify](docs/adr/002-fastify.md)
* [ADR 003 — JWT Cookie Authentication](docs/adr/003-jwt-cookie-auth.md)
* [ADR 004 — AI Service Boundary](docs/adr/004-ai-enrichment.md)
* [ADR 005 — MongoDB](docs/adr/005-mongodb.md)
* [ADR 006 — Vercel ISR Performance](docs/adr/006-vercel-isr-performance.md)

Additional architecture documentation:

* [Architecture](docs/architecture.md)
* [Deployment](docs/deployment.md)

---

# Technology Stack

## Frontend

```text
Astro
React
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
Supertest
V8 Coverage
Playwright
axe-core
```

## Security

```text
Helmet
CSP
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

Latest verified local execution:

```text
Test Files  21 passed (21)
Tests       161 passed (161)
```

Coverage:

```text
Statements: 95.08%
Branches:   85.05%
Functions:  95.29%
Lines:      95.05%
```

Required thresholds:

```text
Statements >= 85%
Branches   >= 80%
Functions  >= 85%
Lines      >= 85%
```

All four current thresholds are satisfied.

## Frontend E2E

Latest Playwright result:

```text
Running 12 tests using 6 workers
12 passed (35.2s)
```

The suite covers:

* homepage;
* admin login;
* valid authentication;
* invalid authentication;
* protected routes;
* authenticated dashboard access;
* logout;
* API failure handling;
* accessibility;
* keyboard navigation.

More details:

[Testing documentation](docs/testing.md)

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

* Content-Security-Policy;
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

## Dependency Security

Latest local dependency audits:

```text
Frontend: 0 vulnerabilities
Backend:  0 vulnerabilities
```

Full security documentation:

[Security Architecture](docs/security.md)

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

Latest production Lighthouse result:

```text
Accessibility: 100/100
```

Automated Playwright accessibility scenarios also pass.

See:

[Testing](docs/testing.md)
[Engineering Evidence](docs/evidence.md)

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

```text
Performance: 99/100 (Desktop) / 90/100 (Mobile)
Accessibility: 100/100
Best Practices: 100/100
SEO:            100/100

LCP: 0.4s (Desktop) / 1.6s (Mobile)
CLS: 0
TTFB: 770ms
```

The previous baseline was:

```text
Performance: 88/100
LCP:         3.0s
```

After enabling Vercel ISR with a 300-second expiration:

```text
Performance: 99/100 (Desktop) / 90/100 (Mobile)
LCP: 0.4s (Desktop) / 1.6s (Mobile)
```

Measured improvement:

```text
Performance: +8 points
LCP:         -0.8 seconds
```

Full performance documentation:

[Performance Baseline](docs/performance.md)

---

# SEO

Latest production homepage Lighthouse result:

```text
SEO: 100/100
```

The application includes the metadata and document structure required for the
current measured SEO result.

---

# Best Practices

Latest production homepage Lighthouse result:

```text
Best Practices: 100/100
```

The project intentionally does not claim a perfect score where the measurement
does not support it.

---

# CI/CD

CodeForge is designed around automated quality gates.

The intended pipeline is:

```text
Validate
   ↓
Backend Tests
   ↓
Coverage
   ↓
Build
   ↓
E2E
   ↓
Security
   ↓
Quality Gate
```

Local validation currently passes:

```text
Frontend lint        PASS
Frontend typecheck   PASS
Frontend build       PASS

Backend lint         PASS
Backend typecheck    PASS
Backend tests        PASS
Coverage             PASS

Playwright E2E       PASS
Dependency audits    PASS
```

## Remote CI Status

The GitHub Actions workflow successfully executes the complete quality pipeline, including validation, build, testing, and dependency audits.

```text
Local quality gates: PASS
Remote CI gate:      PASS
```

This ensures the repository maintains automated quality enforcement for every integration.

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
documentation.

See:

[API Documentation](docs/api.md)

---

# Environment Setup

## Requirements

The repository uses Node.js 24.x for the backend runtime.

Install dependencies:

```bash
cd backend
npm ci

cd ../frontend
npm ci
```

Configure the required environment variables for the selected environment.

Important configuration categories include:

```text
MONGODB_URI
JWT_SECRET
ADMIN_API_KEY
FRONTEND_URL
PUBLIC_API_URL
```

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

The frontend and backend use separate development servers and communicate
through the configured API URL.

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
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## Lighthouse

```bash
npx lighthouse https://www.aesoul0.com \
  --output json \
  --output-path ./lighthouse-home.json \
  --chrome-flags="--headless"
```

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

[Deployment Strategy](docs/deployment.md)

---

# Observability

The backend uses structured request logging and audit logging.

Request-level diagnostics include identifiers and response timing.

Critical application operations are recorded through the audit logger.

Examples include:

```text
LOGIN_ATTEMPT
CREATE_PROJECT
```

The observability layer is intentionally lightweight and designed to provide
useful diagnostics without introducing unnecessary infrastructure complexity.

---

# Project Structure

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
│   ├── deployment.md
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
```

---

# Engineering Evidence

The repository maintains dedicated evidence documentation:

* [Engineering Scorecard](docs/engineering-scorecard.md)
* [Engineering Evidence](docs/evidence.md)
* [Architecture](docs/architecture.md)
* [Security](docs/security.md)
* [Testing](docs/testing.md)
* [Performance](docs/performance.md)
* [Deployment](docs/deployment.md)
* [API](docs/api.md)
* [Professional Roadmap](docs/roadmap.md)

The evidence model separates:

```text
Implemented
Verified
Measured
Pending
```

This ensures the README does not present assumptions or targets as actual
measurements.

---

# Current Engineering Position

CodeForge currently demonstrates strong evidence across:

```text
Architecture
Backend Engineering
Frontend Engineering
Security
Testing
Coverage
Accessibility
Performance
SEO
Dependency Health
Documentation
```

The strongest current measured results are:

```text
161/161 backend tests
95.08% statements
85.05% branches
95.29% functions
95.05% lines

12/12 Playwright E2E
6 workers

0 dependency vulnerabilities

Lighthouse Performance 99
Lighthouse Accessibility 100
Lighthouse Best Practices 100
Lighthouse SEO 100

LCP 0.4s
CLS 0
```

---

# Remaining Engineering Work

The core application engineering work for the 90/100 roadmap is substantially
complete.

The remaining items are primarily evidence and infrastructure verification:

1. Record a production INP measurement (requires sufficient real-user field data).
2. Keep engineering evidence synchronized with future releases.

No broad feature expansion is required to address these items.

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

---

# License

© 2026 ÆSoul. All rights reserved.

This project and its source code are proprietary and belong exclusively to
ÆSoul.

Unauthorized copying, modification, distribution or commercial use is
prohibited.

```
```
