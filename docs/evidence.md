# CodeForge Engineering Evidence

## Purpose

This document records the measurable engineering evidence supporting the
CodeForge professional engineering review.

The project deliberately distinguishes between:

- **Implemented** — a capability exists in the repository.
- **Verified** — an automated test or quality tool confirms expected behavior.
- **Measured** — a numerical result has been captured from a specific build or
  deployed application.
- **Pending** — the capability exists, but current evidence is incomplete.

This distinction prevents implementation details and target values from being
presented as measured outcomes.

---

# 1. Verification Summary

## Frontend

Latest local verification:

```text
npm run lint
PASS

npm run typecheck
PASS

npm run test:cov
PASS

npm run build
PASS
```

## Backend

Latest local verification:

```text
npm run lint
PASS

npm run typecheck
PASS

npm run test:cov
PASS
```

## End-to-End

Latest local Playwright verification:

Current numbers: see [metrics.md](metrics.md).

## Dependency Security

Latest audits: [security.md § 3](security.md#3-dependency-status) (no high or
critical advisories).

---

# 2. Backend Test Evidence

## Test Execution

Latest backend coverage run:

Current numbers: see [metrics.md](metrics.md).

Result:

```text
PASS
```

## Coverage

Latest V8 coverage:

Current numbers: see [metrics.md](metrics.md).

All four configured coverage thresholds are currently satisfied.

## Covered Backend Areas

The automated backend test suite covers:

* authentication;
* authorization;
* projects;
* experiences;
* health checks;
* controllers;
* services;
* repositories;
* database behavior;
* configuration;
* error handling;
* metrics;
* admin operations;
* deployment integrations;
* security behavior.

---

# 3. Security Evidence

## Authentication

The application implements JWT-based authentication with:

* explicit JWT algorithm policy;
* issuer validation;
* audience validation;
* expiration;
* secure cookies;
* HttpOnly cookies;
* SameSite protection;
* Secure cookies in production.

## Authorization

Protected operations require authenticated and authorized access.

Security tests verify unauthorized access and invalid authentication scenarios.

## Rate Limiting

The authentication security suite verifies brute-force protection.

Observed expected behavior includes:

```text
429 Too Many Requests
```

after excessive login attempts.

## Request Validation

Security/API tests cover:

```text
Malformed JSON
Missing fields
Invalid values
Unexpected fields
Invalid identifiers
Schema violations
```

## HTTP Security

Implemented controls include:

```text
Content-Security-Policy
Strict-Transport-Security
Clickjacking protection
Referrer-Policy
CORS restrictions
```

## Dependency Audit

Latest results: [security.md § 3](security.md#3-dependency-status).

No High or Critical dependency vulnerability is reported; CI fails if one
appears (`npm audit --audit-level=high`).

---

# 4. Frontend E2E Evidence

## Playwright

Latest result:

Current numbers: see [metrics.md](metrics.md).

## Concurrency

The suite intentionally runs with:

```text
6 Playwright workers
```

This validates the application under concurrent browser execution rather than
hiding infrastructure issues by reducing the worker count.

## Covered User Journeys

The E2E suite currently verifies:

* homepage rendering;
* login page rendering;
* valid authentication;
* invalid authentication;
* protected route redirects;
* authenticated dashboard access;
* project and experience CRUD, including logo upload;
* API playground and system status pages;
* logout;
* API failure handling;
* accessibility checks on public and admin pages;
* keyboard navigation.

## Accessibility E2E

Automated accessibility tests use axe-core through Playwright.

The accessibility scenarios run as part of the Playwright suite (results in [metrics.md](metrics.md)).

---

# 5. Accessibility Evidence

## Lighthouse

Latest production homepage result:

```text
Accessibility: 100/100
```

## Automated Browser Checks

The application also passes the automated accessibility scenarios in the
Playwright suite.

## Implemented Accessibility Controls

The application includes:

* semantic HTML;
* main landmarks;
* navigation landmarks;
* skip navigation;
* accessible labels;
* visible focus indicators;
* keyboard-accessible controls;
* reduced-motion handling;
* accessible form controls;
* appropriate ARIA usage.

## Evidence Limitation

The available evidence supports strong automated accessibility results.

It does not constitute a blanket declaration of full WCAG 2.2 AA compliance.

A manual review remains valuable for:

* screen-reader navigation;
* complex interaction patterns;
* mobile touch behavior;
* real keyboard-only workflows.

---

# 6. Performance Evidence

## Production Homepage

Latest Lighthouse measurement:

Current numbers: see [metrics.md](metrics.md).

## Previous Baseline

Before the Vercel ISR optimization:

```text
Performance: 88/100
LCP:         3.0 s
CLS:         0
TTFB:        680 ms
```

## After ISR

```text
Performance: 96/100
LCP:         2.2 s
```

## Measured Improvement

The captured measurements show:

```text
Performance: +8 points
LCP:         -0.8 seconds
```

## Current Measurement (2026-10-12)

Desktop and mobile, median of 3 runs each: [metrics.md](metrics.md).
TTFB stayed between 58 and 213 ms across six runs
([performance.md](performance.md)).

## Performance Implementation Evidence

The frontend uses:

* Astro SSR;
* Vercel ISR;
* lightweight rendering;
* optimized decorative Canvas rendering;
* adaptive particle counts;
* visibility-aware animation;
* reduced-motion support.

---

# 7. SEO Evidence

Latest production homepage result:

```text
SEO: 100/100
```

The measured audit validates the primary Lighthouse SEO checks for the tested
production route.

---

# 8. Best Practices Evidence

Latest production homepage result:

```text
Best Practices: 100/100
```

Desktop and mobile both score 100/100 (2026-10-12), with the hash-based CSP
active.

---

# 9. Build Evidence

## Frontend Build

```text
npm run build
PASS
```

Astro successfully generated the production server output using the Vercel
adapter.

## Backend Build

The backend project provides a production TypeScript build through:

```text
npm run build
```

The build architecture remains separated from application development and test
commands.

---

# 10. Static Quality Evidence

## Frontend

```text
Lint:      PASS
Typecheck: PASS
Tests:     PASS
Coverage:  PASS
Build:     PASS
```

## Backend

```text
Lint:      PASS
Typecheck: PASS
Tests:     PASS
Coverage:  PASS
```

The frontend Playwright configuration is also type-safe after removing the
unsupported `reducedMotion` Playwright configuration option.

Reduced-motion behavior is handled by the application's browser-level logic
and the E2E environment flag.

---

# 11. Performance Optimization Evidence

## Vercel ISR

The frontend uses Vercel ISR with:

```text
Expiration: 300 seconds
```

This was introduced specifically to reduce repeated server-side rendering
work for cacheable production responses.

The performance measurement changed from:

```text
88/100 Performance
3.0s LCP
```

to:

```text
96/100 Performance
2.2s LCP
```

The optimization therefore has direct measurable evidence.

## Rendering Strategy

The application does not depend on decorative animations for content visibility.

The hero content is available for the initial paint, while animation acts only
as progressive visual enhancement.

---

# 12. CI/CD Evidence

## Local Quality Gate

Current local quality evidence:

```text
Frontend lint          PASS
Frontend typecheck     PASS
Frontend tests         PASS
Frontend coverage      PASS
Frontend build         PASS

Backend lint           PASS
Backend typecheck      PASS
Backend tests          PASS
Backend coverage       PASS

Playwright E2E         PASS
Dependency audits      PASS
Lighthouse             PASS
```

## GitHub Actions

The repository has an automated GitHub Actions quality pipeline.

The workflow (Node.js 24.x, MongoDB service container) runs the validation,
test, coverage, build, E2E and audit stages on every push to `main` and
every pull request, and publishes `docs/metrics.md` in the job summary.

Therefore:

```text
Local quality gate: PASS
Remote CI gate:     PASS
```

---

# 13. Evidence That Is Still Pending

The following items should not be presented as completed until measured or
verified:

| Evidence                             | Status     |
| ------------------------------------ | ---------- |
| INP (requires field data)            | ⚠️ Pending |
| Manual screen-reader review          | ⚠️ Pending |
| Manual keyboard-only and mobile review | ⚠️ Pending |

These are evidence gaps, not evidence of application failure.

---

# 14. Evidence Reproduction

## Backend

```powershell
cd backend

npm run lint
npm run typecheck
npm run test:cov
npm audit --audit-level=high
```

## Frontend

```powershell
cd frontend

npm run lint
npm run typecheck
npm run test:cov
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## Lighthouse

See [performance.md § 18](performance.md#18-recommended-measurement-process)
for the desktop and mobile commands and the fields to extract.

---

# 15. Evidence Recording Policy

Whenever a numerical result is added to project documentation, record:

```text
Commit:
Date:
Environment:
Route:
Command:
Tool:
Result:
```

Example:

```text
Commit: 3bc9ca3 (deployed main)
Date: 2026-10-12
Environment: Local Windows / Node 24, headless Chrome
Route: https://www.aesoul0.com/
Command: npx lighthouse ... (--preset=desktop and mobile, 3 runs each)
Tool: Lighthouse 13.4.1 CLI
Result: Desktop 99/100/100/100, Mobile 95/100/100/100
```

The same policy applies to:

* coverage;
* test counts;
* performance;
* Lighthouse;
* dependency audits;
* CI results.

---

# 16. Final Evidence Position

CodeForge has strong current evidence across:

```text
Architecture
Backend Engineering
Frontend Engineering
Security
Testing
Coverage
Accessibility
SEO
Performance
Dependency Health
```

The strongest verified results are:

Current numbers: see [metrics.md](metrics.md).

The GitHub Actions workflow is green and the mobile Lighthouse result is
recorded. The remaining evidence gaps (section 13) need real users or a
human reviewer:

```text
1. Field INP measurement
2. Manual screen-reader, keyboard-only and mobile review
```
