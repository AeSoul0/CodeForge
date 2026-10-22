# CodeForge Architecture

## Overview

CodeForge is a full-stack portfolio and administrative platform built around a
clear separation between frontend presentation, backend application logic,
persistence and external services.

The architecture prioritizes:

- separation of concerns;
- explicit security boundaries;
- testability;
- maintainability;
- production deployment;
- measurable performance;
- predictable operational behavior.

---

# 1. High-Level Architecture

```text
                          ┌──────────────────────┐
                          │      Browser         │
                          └──────────┬───────────┘
                                     │
                                  HTTPS
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │       Vercel / Astro           │
                    │                                │
                    │  Public UI                     │
                    │  Admin UI                      │
                    │  SSR                           │
                    │  ISR Cache                     │
                    │  Bundled TS client modules     │
                    └───────────────┬────────────────┘
                                    │
                                  REST
                                    │
                                    ▼
                    ┌────────────────────────────────┐
                    │          Fastify API            │
                    │                                │
                    │  Security Middleware            │
                    │  Routes                         │
                    │  Controllers                    │
                    │  Services                       │
                    │  Repositories                   │
                    └───────────────┬────────────────┘
                                    │
                                    │ Mongoose
                                    ▼
                         ┌─────────────────────┐
                         │     MongoDB Atlas   │
                         └─────────────────────┘

                    ┌────────────────────────────────┐
                    │      External Services         │
                    │                                │
                    │  AI providers                  │
                    │  Deployment integrations       │
                    └────────────────────────────────┘
```

---

# 2. Frontend Architecture

## Framework

The frontend is built with:

* Astro;
* TypeScript client modules (`src/lib`, `src/scripts`) for interactivity;
* Tailwind CSS;
* TypeScript;
* native browser APIs.

Astro is used as the primary application framework because it allows the
project to keep the majority of the interface lightweight while still
supporting dynamic server-rendered functionality.

---

# 3. Rendering Model

The frontend uses Astro server output with the Vercel adapter.

Current strategy:

```text
Static/lightweight content
        ↓
Astro rendering

Dynamic production response
        ↓
SSR

Cacheable production response
        ↓
Vercel ISR
```

Current ISR expiration:

```text
300 seconds
```

The ISR configuration was introduced as a measured performance optimization.

The homepage Lighthouse Performance score improved from:

```text
88/100
```

to:

Current numbers: see [metrics.md](metrics.md).

and the captured LCP improved from:

```text
3.0s
```

to:

Current numbers: see [metrics.md](metrics.md).

---

# 4. Frontend Component Strategy

The frontend is divided into:

* layout components;
* content components;
* navigation components;
* interactive components;
* administrative interfaces;
* visual/decorative components.

Client-side behaviour lives in TypeScript modules imported by bundled
`<script>` tags; no UI framework runtime (React was removed in 2026-10
because it was unused).

Astro remains responsible for the majority of page rendering.

This avoids turning the entire application into a client-rendered SPA when that
would not provide a benefit.

---

# 5. Client-Side JavaScript Strategy

CodeForge follows:

```text
HTML first
CSS second
JavaScript where interaction requires it
```

The project intentionally avoids unnecessary client-side JavaScript.

Client code is organised as:

```text
src/lib/            shared logic: API client, DOM helpers, formatting,
                    safe Markdown, content loaders
src/lib/admin/      admin dashboard (session, pages, dialogs, toasts)
src/scripts/        public-page behaviour (particles, loader, scroll
                    reveal, project filter)
```

Pages import these modules from bundled `<script>` tags; there are no
`is:inline` scripts. This keeps the code unit-testable and allows the
hash-based CSP without `'unsafe-inline'`.

The particle system is treated as decorative functionality rather than as a
dependency for application content.

---

# 6. Visual Rendering and Particle System

The homepage includes a decorative particle/canvas system.

The implementation is designed around controlled rendering work:

* adaptive particle counts;
* visibility detection;
* animation-frame scheduling;
* reduced work when the component is not visible;
* reduced-motion support;
* E2E-specific handling;
* a single canvas per page, rendered by `Layout.astro`
  (`src/scripts/particles.ts`, unit-tested).

The visual layer must never block or determine whether critical content can be
displayed.

---

# 7. Backend Architecture

The backend is built with:

```text
Node.js 24.x
Fastify
TypeScript
Mongoose
MongoDB
```

The backend follows a Controller-Service-Repository architecture.

```text
HTTP Request
     │
     ▼
   Route
     │
     ▼
 Controller
     │
     ▼
  Service
     │
     ▼
Repository
     │
     ▼
 MongoDB
```

---

# 8. Routes

Routes define the public HTTP interface of the application.

Their responsibilities are intentionally limited to:

* endpoint definition;
* request/response wiring;
* schema registration;
* controller delegation;
* route-specific middleware.

Business logic should not be duplicated directly inside route declarations.

---

# 9. Controllers

Controllers translate HTTP requests into application operations.

Their responsibilities include:

* reading request data;
* invoking services;
* mapping application results to HTTP responses;
* selecting appropriate HTTP status codes;
* handling request-specific concerns.

Controllers should remain thin and avoid containing persistence logic.

---

# 10. Services

Services contain application/business logic and orchestration.

Examples include:

* project management;
* experience management;
* authentication;
* administration;
* external service coordination.

Services provide the primary boundary between transport-specific HTTP behavior
and domain operations.

---

# 11. Repositories

Repositories isolate MongoDB/Mongoose access.

This provides:

* testability;
* persistence abstraction;
* clearer service boundaries;
* easier database query changes;
* reduced coupling between business logic and Mongoose APIs.

The repository pattern is used for major domain entities.

---

# 12. Database

MongoDB is the persistence layer.

Mongoose is used to provide:

* schemas;
* validation;
* models;
* query abstraction;
* connection management.

The database layer is isolated behind repositories so that application services
do not depend directly on persistence implementation details.

Collections: `projects`, `experiences`, `admins` and `revokedtokens` (hashes
of JWTs revoked at logout; a TTL index deletes each entry when its token
expires).

---

# 13. Authentication Architecture

Authentication is based on JWT.

The security flow is:

```text
Login request
     ↓
Credential verification
     ↓
JWT creation
     ↓
Secure HttpOnly cookie
     ↓
Authenticated request
     ↓
JWT verification middleware
     ↓
Revocation check (denylist)
     ↓
Authorization
     ↓
Protected operation
```

Current JWT controls include:

* explicit algorithm policy;
* issuer;
* audience;
* expiration;
* server-side revocation at logout (hashed, TTL-expiring denylist);
* secure cookie configuration;
* HttpOnly;
* SameSite protection.

---

# 14. Authorization Architecture

Authentication and authorization are treated separately.

Authentication answers:

```text
Who is this request associated with?
```

Authorization answers:

```text
Is this subject allowed to perform this operation?
```

Protected administration operations therefore require both authentication and
authorization.

The security test suite verifies unauthorized and invalid-authentication
scenarios.

---

# 15. Security Middleware

The Fastify application uses security middleware for:

* Helmet;
* Content Security Policy;
* HSTS;
* clickjacking protection;
* CORS;
* CSRF guard (origin check + `X-Requested-With` header on mutations);
* rate limiting;
* authentication.

Security middleware is applied at the application boundary so protected
operations inherit consistent controls.

---

# 16. Validation Architecture

Incoming API requests are validated before business processing.

The intended flow is:

```text
Request
   ↓
Schema validation
   ↓
Validated input
   ↓
Controller
   ↓
Service
```

Security and API tests verify malformed input and schema manipulation behavior.

---

# 17. Error Handling

Application errors are handled centrally.

The error-handling layer is responsible for:

* consistent HTTP semantics;
* safe production responses;
* logging;
* internal error classification;
* preventing sensitive implementation details from leaking to clients.

The production application should not expose internal stack traces to users.

On the frontend, unknown URLs and page errors render custom 404 and 500 pages
(`src/pages/404.astro`, `500.astro`) inside the normal layout, with the same
background and particles, a link home and `noindex`. The 500 page makes no API
call, so it still renders when the backend is down.

---

# 18. Observability

CodeForge includes structured request logging and audit logging.

Important domain events are recorded through the audit logger.

Examples include:

```text
CREATE_PROJECT
UPDATE_EXPERIENCE_IMAGE
DELETE_PROJECT
```

Request-level logs include request identifiers and response timing.

The metrics middleware counts requests, errors, status-code buckets and
average latency; `GET /metrics`, `/live` and `/ready` expose them and the
admin "System" page displays them.

---

# 19. External Services

The service layer isolates integrations with external systems.

Current integrations (`backend/src/utils/`):

* `ai.ts`: reads a project's GitHub repository and generates its Markdown
  documentation with OpenAI or Gemini, in the background;
* `vercel.ts`: calls the optional Vercel deploy hook after content changes.

External dependencies are intentionally isolated from the core persistence and
HTTP layers.

This allows external-service failures to be handled without coupling the
entire application architecture to a specific provider.

---

# 20. Deployment Architecture

## Frontend

```text
Vercel
  ↓
Astro SSR / ISR
```

## Backend

```text
Render
  ↓
Node.js / Fastify
```

## Database

```text
MongoDB Atlas
```

The deployment model keeps frontend hosting, API hosting and persistence
logically separated.

---

# 21. CI/CD Architecture

The repository is intended to validate changes through:

```text
Lint
   ↓
Typecheck
   ↓
Backend tests
   ↓
Coverage
   ↓
Build
   ↓
Playwright E2E
   ↓
Security / dependency checks
```

The GitHub Actions workflow (Node.js 24.x, MongoDB service container) runs
these stages on every push to `main` and every pull request.

---

# 22. Testing Architecture

Testing is layered:

```text
Unit
  ↓
Integration
  ↓
Security
  ↓
Build
  ↓
E2E
```

Latest verified backend result:

Current numbers: see [metrics.md](metrics.md).

Latest verified Playwright result:

Current numbers: see [metrics.md](metrics.md).

Coverage:

Current numbers: see [metrics.md](metrics.md).

---

# 23. Performance Architecture

Performance is treated as an architectural concern rather than a final polish
step.

Current mechanisms include:

* Astro rendering;
* Vercel ISR;
* low-client-JavaScript strategy;
* optimized particle rendering;
* reduced-motion support;
* visibility-aware animation.

Latest production homepage measurement:

Current numbers: see [metrics.md](metrics.md).

---

# 24. Architectural Principles

## Separation of Concerns

Each layer has a defined responsibility.

## Explicit Boundaries

Authentication, persistence and external services are isolated behind clear
interfaces.

## Testability

Business logic is kept outside transport-specific code wherever practical.

## Security by Boundary

Authentication and security controls are applied before protected operations.

## Performance by Measurement

Performance changes should follow actual measurements rather than speculative
optimizations.

## Minimal Client Runtime

JavaScript is used intentionally instead of turning the whole application into
a client-rendered application.

## Operational Transparency

Important operations and requests produce structured diagnostic information.

---

# 25. Architectural Trade-offs

## Astro Instead of a Full SPA

### Benefits

* low client-side JavaScript;
* strong server rendering;
* simple content-oriented pages;
* good SEO;
* interactivity from small bundled TypeScript modules, no UI framework
  runtime.

### Trade-off

Client modules find their elements in server-rendered markup by id, so
markup and scripts must stay in sync; the admin tests mount the real page
markup to catch drift.

---

## Fastify Instead of a Larger Framework

### Benefits

* lightweight;
* fast;
* explicit;
* strong plugin ecosystem;
* simple HTTP boundaries.

### Trade-off

More application architecture must be deliberately designed by the project
rather than supplied by a large opinionated framework.

---

## MongoDB

### Benefits

* flexible document model;
* simple integration with Mongoose;
* suitable for portfolio/content data;
* Atlas operational support.

### Trade-off

Query and index discipline remain important as data complexity increases.

---

## JWT Cookies

### Benefits

* stateless signature verification (plus one indexed revocation lookup);
* HttpOnly cookie protection;
* straightforward browser integration;
* no access token exposure to application JavaScript.

### Trade-off

Cookie-based authentication requires careful CORS, SameSite and CSRF-aware
design.

---

## Vercel ISR

### Benefits

* reduces repeated SSR work;
* improves production response behavior;
* preserves a dynamic deployment model;
* measurable performance improvement.

### Trade-off

Cached content can remain stale until regeneration or expiration.

Current expiration:

```text
300 seconds
```

---

# 26. Architecture Documentation

Additional architectural decisions are maintained through ADRs:

```text
docs/adr/
```

The ADR approach records:

* context;
* decision;
* alternatives;
* trade-offs;
* consequences.

This allows future maintainers to understand not only what was implemented, but
why the architecture evolved in that direction.

---

# 27. Current Architecture Position

CodeForge currently has:

* clear frontend/backend separation;
* layered Fastify backend architecture;
* explicit authentication/authorization boundaries;
* repository abstraction;
* server rendering;
* ISR;
* automated testing;
* security middleware;
* structured logging;
* documented deployment architecture.

The architecture is therefore considered strong and suitable for the
professional engineering review.

---

# 28. Remaining Architectural Work

No major architectural rewrite is currently justified.

Remaining work should focus on:

1. maintaining architecture documentation;
2. completing ADR coverage for important future decisions;
3. monitoring database query/index behavior as data grows;
4. preserving the current performance architecture.

The project should avoid introducing additional architectural complexity
without a measurable engineering requirement.
