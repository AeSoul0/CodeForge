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
SameSite=None in production, Lax in development/test (see amendment)
```

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

## Amendment — 2026-10-12: CSRF protection

The frontend (Vercel) and the API (Render) are different sites, so the
production cookie must be `SameSite=None`; `SameSite=Strict` would stop the
browser from sending it at all. SameSite therefore no longer protects
against CSRF, and an explicit guard was added
(`backend/src/middlewares/csrf.ts`):

```text
State-changing request with the session cookie
  ↓
Origin (or Referer origin) in the CORS allowlist?   no → 403 CSRF_ORIGIN_REJECTED
  ↓
X-Requested-With: CodeForge present?                no → 403 CSRF_HEADER_MISSING
  ↓
JWT verification and authorization
```

`POST /api/auth/login` is origin-checked even without a cookie (login CSRF).
The frontend API client (`frontend/src/lib/api.ts`) sends the header on every
unsafe request. The security tests cover both rejection paths.
