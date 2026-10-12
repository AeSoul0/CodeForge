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
```

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

## Amendment — 2026-10-12: client-side code

The React integration was removed because no React component was ever
used; it can be added back with `astro add react` if an interactive island
needs it. Client behaviour (admin
dashboard, particle animation, page effects, project filter) lives in
TypeScript modules under `frontend/src/lib` and `frontend/src/scripts`,
imported by bundled `<script>` tags. This keeps scripts unit-testable and
lets Astro's hash-based CSP (`security.csp`) work without `'unsafe-inline'`.
