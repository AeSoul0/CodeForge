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
```

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

Later measurements: [metrics.md](../metrics.md).

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
