## `docs/adr/001-astro.md`

````md
# ADR 001 — Use Astro as the Frontend Framework

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** Use Astro as the primary frontend framework.
- **Scope:** Public portfolio pages, administrative UI shell and frontend rendering.

## Context

CodeForge is primarily a content-oriented portfolio and engineering showcase,
but also includes interactive administrative functionality.

The frontend therefore needs to balance:

- strong initial rendering performance;
- SEO;
- accessibility;
- limited client-side JavaScript;
- server-side rendering where dynamic behavior is required;
- interactive components where they provide real value.

A fully client-rendered SPA would introduce unnecessary JavaScript for content
that can be rendered efficiently on the server.

## Decision

Use Astro as the primary frontend framework.

Use React selectively for interactive components rather than making the entire
application client-rendered.

Use Astro server output with the Vercel adapter for dynamic production
functionality.

Use Vercel ISR for cacheable production responses.

Current ISR expiration:

```text
300 seconds
````

## Alternatives Considered

### React SPA

Rejected as the primary architecture because the majority of CodeForge content
does not require client-side rendering.

### Next.js

A viable alternative, but it would introduce a broader framework model than
necessary for the content-oriented public frontend.

### Fully static site

Rejected because the project includes dynamic administrative functionality and
server-side integrations.

## Trade-offs

### Benefits

* low client-side JavaScript;
* strong initial rendering;
* good SEO characteristics;
* straightforward content-oriented page development;
* selective hydration;
* flexible server rendering;
* ISR support through Vercel.

### Costs

* more explicit decisions around server/client boundaries;
* interactive islands require deliberate integration;
* deployment behavior depends on the Vercel adapter.

## Measured Impact

The ISR optimization built on the Astro rendering model produced a measured
Lighthouse improvement:

```text
Performance: 88 → 96
LCP:         3.0s → 2.2s
```

## Consequences

Astro remains the primary frontend architecture.

New client-side JavaScript should be introduced only when the interaction
requires it.

Performance-sensitive public content should remain server-rendered or
cacheable where appropriate.

````

## `docs/adr/002-fastify.md`

```md
# ADR 002 — Use Fastify for the Backend API

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** Use Fastify as the primary backend HTTP framework.

## Context

CodeForge requires a backend API supporting:

- authentication;
- authorization;
- validation;
- projects;
- experiences;
- administrative operations;
- external services;
- MongoDB persistence;
- structured logging;
- security middleware.

The backend should remain explicit, lightweight and easy to test.

## Decision

Use Fastify with TypeScript.

Structure the backend using:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
````

Use Fastify plugins for:

* JWT;
* cookies;
* CORS;
* Helmet;
* rate limiting;
* Swagger/OpenAPI.

## Alternatives Considered

### Express

Rejected because Fastify provides a stronger fit for the desired explicit
plugin-based architecture and performance-oriented HTTP layer.

### NestJS

Rejected because the application does not require the additional abstraction
and framework conventions at its current size.

## Trade-offs

### Benefits

* lightweight HTTP stack;
* strong TypeScript support;
* explicit plugin model;
* easy test integration;
* good separation of HTTP concerns;
* suitable security middleware ecosystem.

### Costs

* more architectural conventions must be deliberately maintained by the team;
* fewer high-level defaults than a heavily opinionated framework.

## Consequences

Business logic remains independent of Fastify where practical.

The HTTP framework should remain concentrated around transport, middleware and
routing concerns.

The service and repository layers remain independently testable.

## Evidence

Latest backend verification:

```text
21 test files passed
161 tests passed
```

Coverage:

```text
Statements: 95.08%
Branches:   85.05%
Functions:  95.29%
Lines:      95.05%
```

````

## `docs/adr/003-jwt-cookie-auth.md`

```md
# ADR 003 — JWT Authentication with Secure Cookies

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** Use JWT authentication stored in secure browser cookies.
- **Scope:** Administrative authentication.

## Context

The browser needs authenticated access to protected administrative endpoints.

The authentication design should:

- avoid exposing tokens to application JavaScript;
- work naturally with browser requests;
- support expiration;
- support issuer/audience validation;
- remain simple for the current application scale.

## Decision

Use JWTs for authentication and store them in cookies configured with:

```text
HttpOnly
Secure in production
SameSite=Strict
````

The JWT validation policy also enforces:

```text
Algorithm: HS256
Issuer
Audience
Expiration
```

## Authentication Flow

```text
Login
  ↓
Credential verification
  ↓
JWT generation
  ↓
Secure HttpOnly cookie
  ↓
Authenticated request
  ↓
JWT verification
  ↓
Authorization
  ↓
Protected operation
```

## Alternatives Considered

### localStorage access token

Rejected because it exposes the token to client-side JavaScript and increases
the impact of an XSS vulnerability.

### Server-side session store

Technically viable, but introduces additional server-side session state and
persistence requirements that are unnecessary for the current application.

### OAuth / external identity provider

Not justified for the current administrative scope.

## Trade-offs

### Benefits

* no token access from ordinary browser JavaScript;
* straightforward browser authentication;
* stateless token verification;
* explicit JWT validation policy.

### Costs

* cookie authentication requires careful SameSite/CORS handling;
* JWT invalidation requires an explicit policy if immediate revocation becomes
  necessary.

## Security Requirements

Authentication must not be considered sufficient for protected operations.

Authorization remains a separate backend responsibility.

## Testing

Security tests verify:

```text
401 Unauthorized
Invalid authentication
Protected operations
429 Too Many Requests
```

## Consequences

Authentication logic remains centralized in the backend middleware.

Frontend code does not need to manage bearer tokens directly.

````

## `docs/adr/004-ai-enrichment.md`

```md
# ADR 004 — Isolate AI Enrichment Behind a Service Boundary

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** External AI functionality is isolated behind backend service
  logic.
- **Scope:** AI-assisted content enrichment and external provider integration.

## Context

CodeForge may use external generative AI providers for content enrichment.

External providers introduce:

- network latency;
- credentials;
- provider-specific SDKs/APIs;
- external failures;
- malformed or unexpected responses;
- provider availability dependencies.

The core application should not depend directly on provider-specific behavior.

## Decision

Keep AI integration inside the backend service layer.

The architecture is:

```text
Controller
   ↓
Service
   ↓
AI provider integration
   ↓
Validated application result
````

Provider credentials remain server-side.

## Alternatives Considered

### Calling the AI provider directly from the browser

Rejected because credentials must not be exposed to the client.

### Embedding provider logic directly in controllers

Rejected because this couples HTTP transport logic to an external provider.

### Building a full provider abstraction platform

Rejected as unnecessary complexity for the current project scale.

## Trade-offs

### Benefits

* credentials remain server-side;
* provider failures can be isolated;
* business logic remains cleaner;
* provider changes are easier to contain;
* external responses can be validated before entering the domain layer.

### Costs

* an additional service boundary;
* external provider behavior still affects request latency and availability.

## Failure Handling

External provider failures must not expose provider credentials or internal
implementation details.

The application should surface safe application-level errors.

## Testing

The backend test suite includes service and integration coverage around
external-service behavior.

## Consequences

Future AI provider changes should remain localized to the integration/service
boundary rather than propagating into routes, controllers or persistence.

````

## `docs/adr/005-mongodb.md`

```md
# ADR 005 — Use MongoDB with Mongoose for Persistence

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** Use MongoDB Atlas with Mongoose.
- **Scope:** Application persistence.

## Context

CodeForge stores portfolio-oriented entities such as:

- projects;
- experiences;
- administrative data.

The application benefits from a flexible document-oriented data model while
remaining small enough that a relational schema would add more structure than
the current domain requires.

## Decision

Use MongoDB Atlas as the production database and Mongoose as the application
data layer.

Persistence access is isolated behind repositories.

```text
Service
  ↓
Repository
  ↓
Mongoose
  ↓
MongoDB Atlas
````

## Alternatives Considered

### PostgreSQL

A strong alternative, especially for highly relational domains, but not
required by the current data model.

### SQLite

Not suitable as the production persistence layer for the deployed architecture.

### Direct MongoDB driver without Mongoose

Possible, but Mongoose provides useful schema/model abstractions for the
project's current structure.

## Trade-offs

### Benefits

* flexible document model;
* straightforward content storage;
* MongoDB Atlas operational tooling;
* Mongoose schema/model support;
* repository abstraction.

### Costs

* query/index discipline remains important;
* relational constraints are not provided in the same way as a relational
  database.

## Data Access Policy

Business services must not contain uncontrolled direct database access.

Repositories own persistence operations.

## Testing

Database behavior is included in the backend test suite.

The latest backend suite reports:

```text
161/161 tests passed
```

## Consequences

Future schema/query changes should be reviewed for:

* indexes;
* pagination;
* sorting;
* query cost;
* projection;
* data growth.

````

## `docs/adr/006-vercel-isr-performance.md`

```md
# ADR 006 — Use Vercel ISR for Cacheable Production Responses

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** Use Vercel ISR for cacheable production responses.
- **Scope:** Astro/Vercel production rendering.

## Context

The production homepage initially used server-side rendering for each request.

The first Lighthouse baseline reported:

```text
Performance: 88/100
LCP:         3.0s
````

The architecture needed a performance improvement without converting the entire
application into a static site.

## Decision

Use Vercel ISR through the Astro Vercel adapter.

Current expiration:

```text
300 seconds
```

The approach allows cacheable responses to be reused while retaining a
dynamic server-rendered application.

## Alternatives Considered

### Full prerendering

Rejected because the application contains dynamic administrative functionality
and backend-driven content.

### No caching

Rejected because repeated server-side rendering adds unnecessary work for
cacheable public responses.

### Client-side data fetching

Rejected as the primary homepage strategy because it would move important
content out of the initial HTML rendering path.

## Measured Impact

Before ISR:

```text
Performance: 88
LCP: 3.0s
```

After ISR:

```text
Performance: 96
LCP: 2.2s
```

Measured improvement:

```text
Performance: +8 points
LCP:         -0.8 seconds
```

## Trade-offs

### Benefits

* lower repeated rendering cost;
* improved initial rendering performance;
* preserves dynamic application architecture;
* simple deployment model.

### Costs

* cache freshness is time-based;
* content changes may not become visible immediately until regeneration;
* caching rules must remain carefully separated from authenticated/admin
  responses.

## Consequences

Public cacheable content can use ISR.

Sensitive authenticated or administrative state must remain appropriately
dynamic.

Future cache changes should be validated using production Lighthouse
measurements.

````

Copia questi nella directory:

```text
docs/adr/
├── 001-astro.md
├── 002-fastify.md
├── 003-jwt-cookie-auth.md
├── 004-ai-enrichment.md
├── 005-mongodb.md
└── 006-vercel-isr-performance.md
````

Quando scrivi **“continua”**, ti mando l’ultimo documento principale: **`README.md` completo e definitivo**.
