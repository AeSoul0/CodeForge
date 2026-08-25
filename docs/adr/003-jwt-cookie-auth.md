# ADR 003: JWT & HttpOnly Cookies for Authentication

## Context
CodeForge requires an authentication mechanism for the admin dashboard. We need a stateless, secure, and easily verifiable authentication system.

## Decision
We decided to use JSON Web Tokens (JWT) stored in `HttpOnly`, `Secure`, and `SameSite=Strict` cookies.

## Alternatives Considered
- **Session-based authentication (Redis/MongoDB)**: Provides better revocation capabilities but introduces state and additional infrastructure (Redis).
- **JWT in LocalStorage**: Susceptible to XSS attacks.

## Trade-offs
- **Pros**: Stateless, very secure against XSS (due to HttpOnly), protects against CSRF (due to SameSite=Strict).
- **Cons**: Difficult to instantly revoke without building a blacklist or keeping state.

## Consequences
- The frontend must ensure `credentials: 'include'` is set on all API calls to the protected routes.
- CORS must explicitly whitelist origins and allow credentials.
