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
```

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

The backend tests, coverage and thresholds (85/80/85/85) are tracked in
[metrics.md](../metrics.md).
