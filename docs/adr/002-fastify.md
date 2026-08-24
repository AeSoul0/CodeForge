# Architecture Decision Record: Fastify + MongoDB API

## Context
CodeForge required a robust backend for managing portfolio content and securely handling administrative workflows.

## Decision
We chose **Fastify** as the web framework and **MongoDB** for the database.

## Rationale
- **Fastify**: Offers high performance, extremely low overhead, and a great developer experience with built-in schema validation (JSON Schema) which improves both security and performance.
- **MongoDB**: Provides flexible document storage well-suited for project data and experiences, which naturally have variable fields (e.g. arrays of technologies).
- **Authentication**: JWT stored in a secure, `HttpOnly` cookie to protect against XSS and simplify client requests.

## Consequences
- Fast response times and easy-to-read route schemas.
- Need to strictly enforce data validation at the Fastify level.
- Highly scalable foundation for future expansions like generative AI.
