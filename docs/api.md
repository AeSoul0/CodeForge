# `docs/api.md`

````md
# CodeForge API Documentation

## 1. Overview

CodeForge exposes a REST API implemented with Fastify and TypeScript.

The API is responsible for:

- authentication;
- projects;
- experience entries;
- administration;
- health checks;
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
````

The API is consumed by the Astro frontend and administrative interface.

---

# 2. API Base URL

## Local Development

```text
http://127.0.0.1:3002
```

## Production

The production API URL is configured through environment variables rather than
hard-coded into frontend application logic.

Recommended configuration:

```text
PUBLIC_API_URL=<production-api-url>
```

---

# 3. HTTP Conventions

The API uses standard HTTP semantics.

| Status | Meaning                          |
| -----: | -------------------------------- |
|    200 | Successful read/update operation |
|    201 | Resource successfully created    |
|    400 | Invalid or malformed request     |
|    401 | Authentication required/invalid  |
|    403 | Authenticated but not authorized |
|    404 | Resource not found               |
|    409 | Resource conflict                |
|    429 | Rate limit exceeded              |
|    500 | Internal server error            |

The exact status code remains endpoint-specific and must follow the documented
contract.

---

# 4. Authentication

Authentication uses JWT-based browser cookies.

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

Successful authentication establishes the secure authentication cookie.

Expected successful response:

```text
200 OK
```

Authentication failure:

```text
401 Unauthorized
```

Repeated excessive authentication attempts:

```text
429 Too Many Requests
```

---

# 5. Logout

```http
POST /api/auth/logout
```

The endpoint terminates the authenticated browser session.

Expected successful response:

```text
200 OK
```

The authentication cookie is invalidated/cleared according to the current
application session policy.

---

# 6. Projects API

## List Projects

```http
GET /api/projects
```

Optional pagination parameters:

```text
page
limit
```

Example:

```http
GET /api/projects?page=1&limit=10
```

Expected response:

```text
200 OK
```

The endpoint returns the available published project records according to the
current application rules.

---

## Get Project

```http
GET /api/projects/:name
```

Example:

```http
GET /api/projects/codeforge
```

Expected responses:

```text
200 OK
404 Not Found
```

---

## Create Project

```http
POST /api/projects
Content-Type: application/json
```

Authentication and authorization are required.

Example:

```json
{
  "name": "example-project",
  "title": "Example Project",
  "description": "Project description"
}
```

Successful creation:

```text
201 Created
```

Invalid request:

```text
400 Bad Request
```

Unauthorized:

```text
401 Unauthorized
```

Forbidden:

```text
403 Forbidden
```

---

## Update Project

```http
PATCH /api/projects/:name
Content-Type: application/json
```

Authentication and authorization are required.

Example:

```json
{
  "title": "Updated project title"
}
```

Expected responses:

```text
200 OK
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
```

---

## Delete Project

```http
DELETE /api/projects/:name
```

Authentication and authorization are required.

Expected responses:

```text
200 OK
401 Unauthorized
403 Forbidden
404 Not Found
```

---

# 7. Experiences API

## List Experiences

```http
GET /api/experiences
```

Optional pagination:

```text
page
limit
```

Example:

```http
GET /api/experiences?page=1&limit=10
```

Expected response:

```text
200 OK
```

---

## Create Experience

```http
POST /api/experiences
Content-Type: application/json
```

Authentication and authorization are required.

Example:

```json
{
  "company": "Example Company",
  "role": "Software Engineer",
  "description": "Experience description"
}
```

Successful response:

```text
201 Created
```

Validation failure:

```text
400 Bad Request
```

Unauthorized:

```text
401 Unauthorized
```

Forbidden:

```text
403 Forbidden
```

---

# 8. Health Endpoints

The backend exposes health-oriented endpoints used to monitor application
availability.

Typical semantics:

```text
200 OK
```

when the application is healthy.

Health endpoints should remain lightweight and must not require administrative
authentication when they are intended for infrastructure monitoring.

---

# 9. Request Validation

All API input should be validated before reaching the service layer.

Validation includes:

* required fields;
* field types;
* allowed values;
* string constraints;
* identifiers;
* object structure;
* unexpected properties where prohibited.

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

The API should expose errors consistently without leaking internal
implementation details.

Recommended structure:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found"
  }
}
```

For successful operations:

```json
{
  "success": true,
  "data": {}
}
```

The exact response shape should follow the endpoint's current implementation
and Swagger/OpenAPI definition.

---

# 11. Security Requirements

Protected endpoints require authentication.

The request flow is:

```text
Request
   ↓
Authentication middleware
   ↓
Authorization
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
Insufficient rights  → 403
Excessive login      → 429
Invalid payload      → 400
```

---

# 12. Rate Limiting

Rate limiting is applied to protect public and sensitive API operations.

Authentication is specifically tested for brute-force protection.

Expected response when a rate limit is exceeded:

```text
429 Too Many Requests
```

---

# 13. CORS

The API uses an explicit CORS policy.

Production origins must be explicitly approved.

Authenticated requests using cookies require credential-aware CORS behavior.

A wildcard production origin must not be introduced for authenticated traffic.

---

# 14. Pagination

List endpoints support pagination where applicable.

Example:

```http
GET /api/projects?page=1&limit=10
```

Recommended interpretation:

```text
page  = page number starting at 1
limit = maximum number of records returned
```

Pagination protects endpoints from unnecessarily large response payloads.

---

# 15. API Testing Evidence

The backend test suite validates API behavior through unit and integration
tests.

Latest result:

```text
21 test files passed
161 tests passed
```

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
| Insufficient authorization    |      403 |
| Invalid payload               |      400 |
| Malformed JSON                |      400 |
| Unexpected properties         |      400 |
| Excessive login requests      |      429 |
| Missing resource              |      404 |

---

# 17. Swagger / OpenAPI

The backend includes Swagger/OpenAPI support.

Swagger is intended to provide:

* endpoint discovery;
* request schemas;
* response schemas;
* authentication information;
* HTTP status semantics;
* interactive API testing during development.

The Swagger UI is exposed through the development API documentation route.

For the exact current route, use the backend development server's configured
Swagger endpoint.

---

# 18. Frontend Integration

The Astro frontend consumes the API through the configured API base URL.

Environment configuration:

```text
PUBLIC_API_URL=<backend-api-url>
```

The frontend should never depend on hard-coded production API addresses when a
configuration value can be used instead.

---

# 19. External Service Boundaries

External service integrations are handled through backend service-layer
logic.

The API should not expose provider credentials to frontend clients.

External failures should be translated into safe application-level responses
rather than exposing provider implementation details.

---

# 20. Observability

Backend requests are logged with request identifiers and response information.

Important operations also generate audit events.

Example:

```text
LOGIN_ATTEMPT
CREATE_PROJECT
```

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

The Swagger/OpenAPI definition should remain the authoritative machine-readable
API contract.

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
8. update Swagger/OpenAPI documentation.

---

# 23. Final API Position

The CodeForge API currently demonstrates:

* layered architecture;
* schema validation;
* authentication;
* authorization;
* rate limiting;
* structured error handling;
* database abstraction;
* API integration testing;
* Swagger/OpenAPI support;
* audit logging.

The latest local backend verification reports:

```text
161/161 tests passed
95.08% statements coverage
85.05% branch coverage
95.29% function coverage
95.05% line coverage
```

The API therefore satisfies the current roadmap's core backend quality
requirements.

The remaining API-related work is primarily documentation maintenance and
keeping the OpenAPI contract synchronized with future endpoint changes.

```
```
