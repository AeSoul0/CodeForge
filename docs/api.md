# CodeForge API Documentation

## 1. Overview

CodeForge exposes a REST API implemented with Fastify and TypeScript.

The API is responsible for:

- authentication;
- projects;
- experience entries;
- AI-generated project documentation;
- health checks and runtime metrics;
- validated persistence operations.

The API follows a layered architecture:

```text
HTTP Request
     ↓
Route
     ↓
Schema Validation
     ↓
Controller
     ↓
Service
     ↓
Repository
     ↓
MongoDB
```

The API is consumed by the Astro frontend and the admin dashboard.

### Endpoint summary

| Method | Path | Auth | Purpose |
|---|---|:---:|---|
| `POST` | `/api/auth/login` | — | Log in, set the session cookie |
| `GET` | `/api/auth/me` | cookie | Current session |
| `POST` | `/api/auth/logout` | — | Revoke the token, clear the session cookie |
| `GET` | `/api/projects` | — | List projects (paginated) |
| `POST` | `/api/projects` | cookie | Create a project |
| `PATCH` | `/api/projects/:id` | cookie | Update a project |
| `DELETE` | `/api/projects/:id` | cookie | Delete a project |
| `POST` | `/api/projects/:id/generate-ai` | cookie | Regenerate AI documentation |
| `GET` | `/api/experiences` | — | List experiences (paginated) |
| `POST` | `/api/experiences` | cookie | Create an experience |
| `PATCH` | `/api/experiences/:id` | cookie | Update an experience |
| `DELETE` | `/api/experiences/:id` | cookie | Delete an experience |
| `PATCH` | `/api/experiences/:id/image` | cookie | Upload or remove the logo |
| `GET` | `/api/experiences/:id/image` | — | Serve the logo |
| `GET` | `/` | — | API name and status |
| `GET` | `/live` | — | Liveness probe |
| `GET` | `/ready` | — | Readiness probe (database) |
| `GET` | `/metrics` | — | Request and error counters |

In the source the path parameter is named `:name`, but it carries the
record's MongoDB id (24 hex characters), as returned in the `id` field.

---

# 2. API Base URL

## Local Development

```text
http://127.0.0.1:3002
```

(`PORT` in `backend/.env`; the Playwright backend also uses 3002.)

## Production

```text
https://codeforge-ukq5.onrender.com
```

The frontend reads the API URL from `PUBLIC_API_URL` at build time and falls
back to the production URL above when it is not set.

---

# 3. HTTP Conventions

The API uses standard HTTP semantics.

| Status | Meaning                                      |
| -----: | -------------------------------------------- |
|    200 | Successful read/update/delete                |
|    201 | Resource successfully created                |
|    202 | Accepted: AI documentation runs in background |
|    400 | Invalid or malformed request                 |
|    401 | Authentication required/invalid              |
|    403 | CSRF check failed or not authorized          |
|    404 | Resource not found                           |
|    413 | Uploaded image too large                     |
|    429 | Rate limit exceeded                          |
|    500 | Internal server error                        |
|    503 | Database not ready (`/ready`)                |

---

# 4. Authentication

Authentication uses a JWT stored in an HttpOnly cookie
([ADR 003](adr/003-jwt-cookie-auth.md)).

## Login

```http
POST /api/auth/login
Content-Type: application/json
```

Example:

```json
{
  "username": "admin",
  "password": "example-password"
}
```

The `admin` account is created at startup; its password is the value of
`ADMIN_API_KEY`.

Successful authentication sets the session cookie (24 h lifetime):

```text
200 OK
```

Authentication failure:

```text
401 Unauthorized
```

Invalid payload (missing field, non-string value, username > 100 or
password > 200 characters):

```text
400 Bad Request
```

Request from an origin outside the CORS allowlist:

```text
403 Forbidden   (CSRF_ORIGIN_REJECTED)
```

Repeated excessive authentication attempts (5 per minute per client):

```text
429 Too Many Requests
```

## Current session

```http
GET /api/auth/me
```

Returns `200` with the authenticated user, `401` without a valid session.
Every admin page calls it before rendering data.

## CSRF requirements for authenticated mutations

Every POST/PUT/PATCH/DELETE that sends the session cookie must include:

```http
X-Requested-With: CodeForge
```

and, when sent by a browser, come from an allowed origin. Otherwise the API
answers `403` with `CSRF_HEADER_MISSING` or `CSRF_ORIGIN_REJECTED`.

## Pagination

`GET /api/projects` and `GET /api/experiences` accept `page` (1–10000,
default 1) and `limit` (1–100, default 10). Out-of-range values return `400`.

---

# 5. Logout

```http
POST /api/auth/logout
```

Revokes the session token server-side and clears the cookie.

```text
200 OK
```

After logout the same token is rejected with `401`, even before its 24 h
expiry. The revocation entry is deleted automatically when the token would
have expired.

---

# 6. Projects API

Project fields use the original Italian names of the data model:

| Field | Type | Rules |
|---|---|---|
| `titolo` | string | required on create, ≤ 100 |
| `role` | string | ≤ 100 |
| `descrizione` | string | required on create, ≤ 5000 (short description) |
| `descrizioneLunga` | string | ≤ 50000, Markdown (case study / AI documentation) |
| `tecnologie` | string[] | required on create, ≤ 30 items of ≤ 50 |
| `categoria` | string | ≤ 50, legacy single category |
| `categorie` | string[] | ≤ 10 items of ≤ 50 |
| `linkGithub` | string \| null | `http(s)://…`, ≤ 500 |
| `image` | string \| null | ≤ 500 |
| `experienceId` | string \| null | MongoDB id of the linked experience |

Unknown properties are rejected with `400`.

## List Projects

```http
GET /api/projects?page=1&limit=10
```

```json
{
  "success": true,
  "data": [
    {
      "id": "6a874c775d0d5455ebced9d2",
      "titolo": "Telemetry Core",
      "descrizione": "Embedded telemetry platform…",
      "tecnologie": ["C", "FreeRTOS"],
      "categorie": ["Embedded"],
      "experienceImage": "/api/experiences/…/image",
      "createdAt": "…",
      "updatedAt": "…"
    }
  ]
}
```

`experienceImage` is the logo URL of the linked experience, when present.

---

## Create Project

```http
POST /api/projects
Content-Type: application/json
X-Requested-With: CodeForge
```

Authentication is required.

```json
{
  "titolo": "Example Project",
  "descrizione": "Short project description",
  "tecnologie": ["TypeScript", "Fastify"],
  "linkGithub": "https://github.com/AeSoul0/example"
}
```

Expected responses:

```text
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
```

When the project has no `descrizioneLunga`, AI documentation is generated in
the background, using the GitHub repository when `linkGithub` is set
(see [ADR 004](adr/004-ai-enrichment.md)).

---

## Update Project

```http
PATCH /api/projects/:id
Content-Type: application/json
X-Requested-With: CodeForge
```

Authentication is required. All fields are optional; `null` clears
`linkGithub`, `image` and `experienceId`.

```json
{
  "titolo": "Updated project title"
}
```

Adding `"regenerateAI": true` saves the changes and regenerates the
documentation in the background; the response is then `202 Accepted`.

Expected responses:

```text
200 OK
202 Accepted
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

---

## Regenerate AI Documentation

```http
POST /api/projects/:id/generate-ai
X-Requested-With: CodeForge
```

Starts a background regeneration of `descrizioneLunga` from the project's
GitHub repository.

```text
202 Accepted
401 Unauthorized
403 Forbidden
404 Not Found
```

---

## Delete Project

```http
DELETE /api/projects/:id
X-Requested-With: CodeForge
```

Authentication is required.

```text
200 OK
401 Unauthorized
403 Forbidden
404 Not Found
```

---

# 7. Experiences API

| Field | Type | Rules |
|---|---|---|
| `role` | string | required on create, 2–100 |
| `company` | string | required on create, 2–100 |
| `description` | string | required on create, 10–5000 |
| `technologies` | string[] | ≤ 30 items of ≤ 50 |
| `startDate` | string | required on create, ≤ 50 (the dashboard sends `YYYY-MM`) |
| `endDate` | string \| null | ≤ 50, `null` for the current role |
| `current` | boolean | current role |
| `image` | string \| null | logo URL (set by the image endpoint) |

Unknown properties are rejected with `400`.

## List Experiences

```http
GET /api/experiences?page=1&limit=10
```

Returns `200` with `{ "success": true, "data": [...] }`.

## Create Experience

```http
POST /api/experiences
Content-Type: application/json
X-Requested-With: CodeForge
```

```json
{
  "company": "Example Company",
  "role": "Software Engineer",
  "description": "Experience description",
  "startDate": "2025-01",
  "current": true
}
```

```text
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
```

## Update Experience

```http
PATCH /api/experiences/:id
```

All fields optional. Responses: `200`, `400`, `401`, `403`, `404`.

## Delete Experience

```http
DELETE /api/experiences/:id
```

Responses: `200`, `401`, `403`, `404`.

## Experience Logo

Upload (or remove with `"image": null`):

```http
PATCH /api/experiences/:id/image
Content-Type: application/json
X-Requested-With: CodeForge
```

```json
{
  "image": "data:image/webp;base64,UklGR..."
}
```

* Accepted types: `image/jpeg`, `image/png`, `image/webp`.
* Maximum decoded size: 8 MB (`413 Payload Too Large` above it).
* The binary is stored in MongoDB with the experience.

Serve:

```http
GET /api/experiences/:id/image
```

Public. Returns the image with its stored content type, or `404` when the
experience has no logo. Projects linked to an experience expose this URL as
`experienceImage`.

---

# 8. Health Endpoints

All public and lightweight, intended for infrastructure monitoring.

| Endpoint | Response |
|---|---|
| `GET /` | `{ "name": "CodeForge API", "status": "online", "docs": "/api-docs" }` |
| `GET /live` | `200 { "status": "ok", "timestamp": … }` while the process runs |
| `GET /ready` | `200 { "status": "ready", "database": "connected" }`, or `503` when MongoDB is disconnected |
| `GET /metrics` | Request count, error count, status-code buckets, average latency, database state |

The admin "System" page reads `/live`, `/ready` and `/metrics`.

---

# 9. Request Validation

All API input is validated by Fastify JSON schemas before reaching the
service layer.

Validation includes:

* required fields;
* field types;
* allowed values;
* string length and array size limits;
* URL and MongoDB id patterns;
* object structure;
* unexpected properties (`additionalProperties: false`).

Example invalid request:

```json
{
  "unexpectedField": true
}
```

Expected behavior:

```text
400 Bad Request
```

Validation ensures malformed input cannot bypass normal application contracts.

---

# 10. Error Contract

Application errors use one shape and never expose stack traces or internal
details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "querystring/page must be >= 1",
    "details": []
  }
}
```

`details` is present only for validation errors. Successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

Unknown routes return Fastify's default `404` body.

---

# 11. Security Requirements

Protected endpoints require authentication.

The request flow is:

```text
Request
   ↓
CSRF guard (mutations)
   ↓
Authentication middleware
   ↓
Validation
   ↓
Controller
   ↓
Service
```

The backend security suite verifies common failure cases.

Expected security semantics include:

```text
No token             → 401
Invalid token        → 401
Expired token        → 401
Missing CSRF header  → 403
Foreign origin       → 403
Excessive login      → 429
Invalid payload      → 400
```

---

# 12. Rate Limiting

Rate limiting applies to every route (100 requests per minute per client by
default, `RATE_LIMIT_MAX`) and more strictly to login (5 per minute,
`LOGIN_RATE_LIMIT_MAX`).

Expected response when a rate limit is exceeded:

```text
429 Too Many Requests
```

---

# 13. CORS

The API uses an explicit CORS allowlist with credentials: the production
domains (`https://www.aesoul0.com`, `https://aesoul0.com`), the local dev
origins and `FRONTEND_URL`. The same list feeds the CSRF guard.

A wildcard origin is never used for authenticated traffic.

---

# 14. Pagination

List endpoints support pagination.

Example:

```http
GET /api/projects?page=1&limit=10
```

Interpretation:

```text
page  = page number starting at 1 (max 10000)
limit = maximum number of records returned (1–100, default 10)
```

Pagination protects endpoints from unnecessarily large response payloads.

---

# 15. API Testing Evidence

The backend test suite validates API behavior through unit and integration
tests against a real MongoDB instance.

Latest result:

Current numbers: see [metrics.md](metrics.md).

API domains currently covered include:

```text
Authentication
Projects
Experiences
Health
Administration
Security
Validation
```

---

# 16. API Security Test Matrix

| Scenario                      | Expected |
| ----------------------------- | -------: |
| Missing authentication        |      401 |
| Invalid JWT                   |      401 |
| Expired/tampered JWT          |      401 |
| Valid authenticated operation |      2xx |
| Missing CSRF header / origin  |      403 |
| Invalid payload               |      400 |
| Malformed JSON                |      400 |
| Unexpected properties         |      400 |
| Excessive login requests      |      429 |
| Missing resource              |      404 |

---

# 17. Swagger / OpenAPI

The backend generates an OpenAPI definition from the route schemas
(`@fastify/swagger`).

The Swagger UI is served at `/api-docs` **only in development**
(`NODE_ENV=development`); production does not expose it. It provides:

* endpoint discovery;
* request and response schemas;
* interactive API testing.

---

# 18. Frontend Integration

The Astro frontend consumes the API through `frontend/src/lib/api.ts`.

Environment configuration (build time):

```text
PUBLIC_API_URL=<backend-api-url>
```

When unset, the client falls back to the production backend. The same value
is the only API origin allowed by the CSP `connect-src`, so changing the API
host requires a new frontend build.

---

# 19. External Service Boundaries

External integrations (GitHub, OpenAI, Gemini, the Vercel deploy hook) are
called only from backend utilities (`backend/src/utils/ai.ts`,
`backend/src/utils/vercel.ts`).

The API never exposes provider credentials to frontend clients.

External failures are logged and translated into safe application-level
responses; AI generation runs in the background, so a provider failure never
blocks a project save.

---

# 20. Observability

Backend requests are logged with request identifiers and response
information.

Important operations also generate audit events.

Example:

```text
CREATE_PROJECT
UPDATE_PROJECT_REGENERATE_AI
UPDATE_EXPERIENCE_IMAGE
DELETE_PROJECT
```

Rejected CSRF and authentication attempts are logged as warnings.

This supports troubleshooting and operational traceability.

---

# 21. API Documentation Principles

Every production API endpoint should document:

```text
Method
Path
Authentication
Request parameters
Request body
Response body
Success codes
Error codes
Validation rules
```

The route schemas (and the OpenAPI definition generated from them) are the
authoritative machine-readable API contract; this document is the
human-readable summary.

---

# 22. API Quality Rules

New endpoints should:

1. validate input;
2. use appropriate HTTP semantics;
3. remain behind the correct authentication boundary;
4. delegate business logic to services;
5. use repositories for persistence;
6. avoid leaking internal exceptions;
7. include tests;
8. be added to this document and to the route schemas.

---

# 23. Final API Position

The CodeForge API currently demonstrates:

* layered architecture;
* schema validation;
* authentication;
* CSRF protection;
* rate limiting;
* structured error handling;
* database abstraction;
* API integration testing;
* Swagger/OpenAPI support;
* audit logging.

The latest backend verification reports:

Current numbers: see [metrics.md](metrics.md).

The API satisfies the roadmap's backend quality requirements.
