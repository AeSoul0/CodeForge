# `docs/evidence.md`

````md
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

npm run build
PASS
````

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

```text
Running 12 tests using 6 workers
12 passed (35.2s)
```

## Dependency Security

Latest local audits:

```text
Frontend: 0 vulnerabilities
Backend:  0 vulnerabilities
```

---

# 2. Backend Test Evidence

## Test Execution

Latest backend coverage run:

```text
Test Files  21 passed (21)
Tests       161 passed (161)

Duration    53.72s
```

Result:

```text
PASS
```

## Coverage

Latest V8 coverage:

| Metric     | Result | Required Minimum | Status |
| ---------- | -----: | ---------------: | ------ |
| Statements | 95.08% |              85% | ✅ PASS |
| Branches   | 85.05% |              80% | ✅ PASS |
| Functions  | 95.29% |              85% | ✅ PASS |
| Lines      | 95.05% |              85% | ✅ PASS |

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

Latest local results:

```text
Frontend: 0 vulnerabilities
Backend:  0 vulnerabilities
```

No current High or Critical dependency vulnerability is reported by the
local audit commands used during the final review.

---

# 4. Frontend E2E Evidence

## Playwright

Latest result:

```text
Running 12 tests using 6 workers
12 passed (35.2s)
```

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
* logout;
* API failure handling;
* accessibility checks;
* keyboard navigation.

## Accessibility E2E

Automated accessibility tests use axe-core through Playwright.

The accessibility scenarios are included in the current 12/12 passing suite.

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

| Metric         |                       Result |
| -------------- | ---------------------------: |
| Performance    |                       96/100 |
| Accessibility  |                      100/100 |
| Best Practices |                       96/100 |
| SEO            |                      100/100 |
| LCP            |                        2.2 s |
| CLS            |                            0 |
| TTFB           |                       770 ms |
| INP            | Not reported by captured run |

## Previous Baseline

Before the Vercel ISR optimization:

```text
Performance: 88/100
LCP:         3.0 s
CLS:         0
TTFB:        680 ms
```

## Current Measurement

After enabling Vercel ISR:

```text
Performance: 96/100
LCP:         2.2 s
CLS:         0
TTFB:        770 ms
```

## Measured Improvement

The captured measurements show:

```text
Performance: +8 points
LCP:         -0.8 seconds
```

The TTFB value varies between captures and should therefore be monitored over
multiple runs rather than optimized based on a single sample.

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
Best Practices: 96/100
```

The application passes the relevant Lighthouse best-practice audits except
for the checks reflected in the remaining four-point gap.

No unsupported claim of 100/100 is made.

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

The workflow successfully runs the validation, build, testing, and E2E stages using the correct MongoDB service container.

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
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## Lighthouse

```powershell
npx lighthouse https://www.aesoul0.com `
  --output json `
  --output-path .\lighthouse-home.json `
  --chrome-flags="--headless"
```

The JSON output can then be inspected for:

```text
Performance
Accessibility
Best Practices
SEO
LCP
INP
CLS
TTFB
```

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
Commit: <commit SHA>
Date: 2026-08-26
Environment: Local Windows / Node 24
Route: https://www.aesoul0.com/
Command: npx lighthouse ...
Tool: Lighthouse
Result: Performance 96 / Accessibility 100 / Best Practices 96 / SEO 100
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

```text
161/161 backend tests
95.08% statements
85.05% branches
95.29% functions
95.05% lines

12/12 Playwright E2E
6 workers

0 dependency vulnerabilities

Lighthouse Performance 96
Lighthouse Accessibility 100
Lighthouse Best Practices 96
Lighthouse SEO 100

LCP 2.2s
CLS 0
```

The remaining evidence gaps are:

```text
1. Fully green GitHub Actions workflow
2. Mobile Lighthouse result
3. INP measurement
```

Until those are completed, the repository should describe itself as having
strong verified local engineering evidence rather than claiming that every
remote quality gate is fully green.

```
