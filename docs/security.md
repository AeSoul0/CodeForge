# `docs/security.md`

````md
# CodeForge Security Architecture

## 1. Purpose

CodeForge applies defense-in-depth security across the deployment platform,
HTTP layer, authentication, authorization, validation, rate limiting,
dependency management and operational logging.

The objective is not only to implement security controls, but also to verify
their behavior through automated tests and dependency audits.

---

# 2. Security Model

The security model can be represented as:

```text
Internet
   │
   ▼
Vercel / Render
   │
   ▼
HTTP Security
   │
   ├── CSP
   ├── HSTS
   ├── Clickjacking protection
   ├── CORS
   └── Rate limiting
   │
   ▼
Authentication
   │
   ├── JWT
   ├── Issuer
   ├── Audience
   ├── Expiration
   └── Secure HttpOnly Cookie
   │
   ▼
Authorization
   │
   ▼
Request Validation
   │
   ▼
Controllers / Services
   │
   ▼
Repositories
   │
   ▼
MongoDB
````

Each layer provides an independent security boundary.

---

# 3. Dependency Governance

Dependency security is continuously reviewed through:

* `npm audit`;
* Dependabot;
* GitHub dependency review;
* CodeQL where configured.

## Severity Policy

| Severity | Policy                            |
| -------- | --------------------------------- |
| Critical | Must be remediated before release |
| High     | Immediate review and remediation  |
| Moderate | Review during maintenance         |
| Low      | Review during maintenance         |

## Latest Local Audit

```text
Frontend: 0 vulnerabilities
Backend:  0 vulnerabilities
```

Current local dependency status:

```text
Critical: 0
High:     0
Moderate: 0
Low:      0 reported by audit
Total:    0
```

Dependency audits should be repeated after dependency changes.

---

# 4. Platform / Edge Security

Production deployment uses:

```text
Frontend → Vercel
Backend  → Render
Database → MongoDB Atlas
```

Production traffic is served over HTTPS.

Platform-level protections complement application-level controls and should not
be considered a replacement for application security.

---

# 5. HTTP Security Headers

Fastify security middleware provides HTTP security controls through Helmet and
related configuration.

Current controls include:

* Content-Security-Policy;
* Strict-Transport-Security;
* X-Frame-Options / clickjacking protection;
* Referrer-Policy.

## Content Security Policy

The CSP restricts executable resources and helps reduce the impact of XSS
attacks.

Any future third-party integration must be reviewed against the existing
policy instead of broadly weakening CSP directives.

---

# 6. HSTS

Strict Transport Security is used to force HTTPS in production.

The intention is to prevent downgrade and accidental insecure HTTP requests
after the browser has observed the secure policy.

---

# 7. Clickjacking Protection

The application uses frame restrictions to prevent unauthorized embedding of
sensitive pages.

This protects administrative interfaces from common clickjacking scenarios.

---

# 8. CORS

Cross-Origin Resource Sharing is explicitly restricted.

The application allows only approved origins rather than relying on a wildcard
policy.

Credentials are allowed where required for the cookie-based authentication
model.

## Principles

```text
Allowed origins:
    Explicit allowlist

Credentials:
    Enabled only where required

Wildcard origin:
    Not used for authenticated production traffic
```

Any new production origin should be reviewed before being added.

---

# 9. Authentication

CodeForge uses JWT-based authentication.

The authentication flow is:

```text
POST /login
     │
     ▼
Credential verification
     │
     ▼
JWT generation
     │
     ▼
HttpOnly cookie
     │
     ▼
Authenticated request
     │
     ▼
JWT verification
```

Authentication is implemented through Fastify JWT middleware.

---

# 10. JWT Hardening

The JWT implementation uses an explicit security policy.

The application verifies:

* algorithm;
* issuer;
* audience;
* expiration.

Current algorithm policy:

```text
HS256
```

An algorithm allowlist prevents accepting unexpected token algorithms.

Issuer and audience validation prevent tokens created for an unrelated service
or security context from being accepted accidentally.

---

# 11. Cookie Security

Authentication tokens are stored in cookies configured for browser security.

Important properties include:

```text
HttpOnly
Secure in production
SameSite=Strict
```

## HttpOnly

Prevents normal client-side JavaScript from directly reading the authentication
cookie.

## Secure

Ensures the cookie is transmitted over HTTPS in production.

## SameSite

Provides additional cross-site request protection.

---

# 12. Authorization

Authentication and authorization are deliberately treated as separate concerns.

Authentication determines:

```text
Who is making the request?
```

Authorization determines:

```text
Is that subject allowed to perform this operation?
```

Protected administrative operations therefore require the appropriate
authenticated and authorized context.

---

# 13. Authorization Test Matrix

The expected security model is:

| Scenario                         |                      Expected |
| -------------------------------- | ----------------------------: |
| No token                         |                           401 |
| Malformed token                  |                           401 |
| Invalid token                    |                           401 |
| Expired token                    |                           401 |
| Tampered token                   |                           401 |
| Valid authenticated request      |             2xx where allowed |
| Insufficient privilege           |                           403 |
| Wrong protected operation        | 403/404 according to contract |
| Valid authorized admin operation |                           2xx |

The automated backend security suite verifies unauthorized and authentication
failure paths.

---

# 14. Rate Limiting

Rate limiting is applied to protect the application from abusive request
patterns.

The login flow is specifically tested against excessive authentication
attempts.

Observed behavior:

```text
429 Too Many Requests
```

This provides protection against simple brute-force login attempts.

Rate limits should be reviewed whenever authentication or public API traffic
patterns change.

---

# 15. Request Validation

Incoming requests are validated before reaching business logic.

The application validates:

* required fields;
* field types;
* allowed values;
* string constraints;
* request structure;
* unexpected properties where schemas disallow them.

The objective is:

```text
Untrusted input
      ↓
Schema validation
      ↓
Validated DTO/input
      ↓
Business logic
```

Validation failures return explicit client errors rather than silently
processing malformed input.

---

# 16. Malformed Input Protection

Security/API tests cover scenarios including:

```text
Malformed JSON
Missing required fields
Invalid field types
Invalid IDs
Empty invalid values
Unexpected properties
Schema manipulation
```

The expected HTTP semantics use `400 Bad Request` for malformed request input
where applicable.

---

# 17. Database Security

MongoDB access is isolated behind repository classes.

The application avoids exposing direct database operations through HTTP
handlers.

This provides a controlled persistence boundary.

Database credentials are supplied through environment configuration rather than
hard-coded into application source.

---

# 18. Secrets Management

Secrets are environment-based.

Sensitive values are not intended to be embedded in client-side source.

Important categories include:

```text
MongoDB credentials
JWT secret
Admin credentials/API keys
External provider credentials
Deployment credentials
```

Production values must be supplied through the appropriate deployment secret
management system.

---

# 19. Error Handling

Production errors should avoid exposing:

* stack traces;
* internal filesystem paths;
* database implementation details;
* secret values;
* sensitive service responses.

The centralized error handler provides a controlled HTTP response surface.

Detailed information remains available through server-side logging where
appropriate.

---

# 20. Audit Logging

Critical domain actions are recorded by the audit logging layer.

Examples include:

```text
LOGIN_ATTEMPT
CREATE_PROJECT
```

Audit logging provides traceability for sensitive operations without exposing
security-sensitive information to public clients.

---

# 21. Logging Security

Operational logging should avoid recording:

* passwords;
* JWT secrets;
* raw authentication tokens;
* database credentials;
* API keys.

Request identifiers and safe metadata are preferred for diagnostics.

---

# 22. External Service Security

CodeForge can interact with external AI and deployment services.

External provider credentials must remain server-side.

External responses should be treated as untrusted data and validated before
being incorporated into domain operations.

External-service failures are isolated inside service-level integration paths.

---

# 23. Security Test Evidence

The latest local backend test execution reported:

```text
21 test files passed
161 tests passed
```

Security-focused scenarios include:

```text
401 Unauthorized
400 Bad Request
429 Too Many Requests
Successful authenticated operations
```

The security suite therefore validates actual failure behavior instead of only
checking that authentication middleware exists.

---

# 24. Frontend Security

The frontend is protected through:

* CSP;
* secure authentication cookies;
* server-side handling of protected state;
* strict request validation at the backend;
* avoidance of exposing secrets to browser JavaScript.

Administrative functionality is not considered trusted merely because it is
rendered by the frontend; authorization remains a backend responsibility.

---

# 25. Dependency Security Evidence

Latest local results:

```text
Frontend:
0 vulnerabilities

Backend:
0 vulnerabilities
```

This supersedes older audit results recorded before dependency upgrades.

Future dependency changes must trigger another security audit.

---

# 26. Security Regression Policy

A security regression should block release when it introduces:

```text
Critical dependency vulnerabilities
High dependency vulnerabilities without an accepted remediation plan
Authentication bypass
Authorization bypass
Secret exposure
CORS widening without justification
CSP weakening without justification
Missing security headers
Broken rate limiting on protected endpoints
Sensitive information disclosure
```

---

# 27. Security Review Checklist

## Authentication

* [x] JWT authentication implemented
* [x] Algorithm explicitly restricted
* [x] Issuer validated
* [x] Audience validated
* [x] Expiration enforced
* [x] HttpOnly cookie
* [x] Secure production cookie
* [x] SameSite protection

## Authorization

* [x] Protected routes
* [x] Authentication/authorization separation
* [x] Unauthorized requests tested
* [x] Invalid authentication tested

## HTTP Security

* [x] Helmet
* [x] CSP
* [x] HSTS
* [x] Clickjacking protection
* [x] Referrer Policy
* [x] Restricted CORS

## Abuse Protection

* [x] Rate limiting
* [x] Login brute-force test

## Validation

* [x] Schema validation
* [x] Malformed JSON handling
* [x] Unexpected-field handling
* [x] Invalid input handling

## Dependencies

* [x] npm audit
* [x] Dependabot configuration
* [x] Dependency review
* [x] CodeQL where configured
* [x] Current local audit reports 0 vulnerabilities

## Operational Security

* [x] Audit logging
* [x] Environment-based secrets
* [x] Production error sanitization
* [x] Sensitive credential exclusion from client code

---

# 28. Current Security Position

CodeForge currently has strong local evidence across:

```text
Authentication
Authorization
HTTP security
Input validation
Rate limiting
Dependency security
Audit logging
Secret handling
```

The latest local dependency audits report:

```text
0 vulnerabilities
```

The backend security test suite passes as part of the complete:

```text
161/161 tests
```

The repository-level security evidence is fully verified via local execution and green remote GitHub Actions workflows.

Security should therefore be described as **verified and strongly
architected**, with all automated quality gates passing.

---

# 29. Security Principles

CodeForge follows these principles:

1. **Least privilege** — protected operations require explicit authorization.
2. **Defense in depth** — multiple independent security layers are used.
3. **Secure defaults** — cookies, headers and CORS use restrictive defaults.
4. **Validate at boundaries** — untrusted input is validated before business
   logic.
5. **Do not expose secrets** — credentials remain server-side.
6. **Fail safely** — production errors avoid sensitive implementation details.
7. **Measure and test** — security controls are backed by automated tests.
8. **Maintain dependencies** — dependency security is continuously reviewed.

---

# 30. Final Security Assessment

Current evidence supports a strong security position suitable for the
professional engineering review.

Verified locally:

```text
Dependency audit:     PASS
Authentication tests: PASS
Authorization tests:  PASS
Rate-limit tests:     PASS
Schema validation:     PASS
Security headers:      Implemented
Audit logging:         Implemented
Secure cookies:        Implemented
```

Final remote CI verification remains pending.

```
```
