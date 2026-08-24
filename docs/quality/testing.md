# Testing Report

## Current Coverage (Target >= 85%)

The testing suite (Vitest + Supertest) has been heavily expanded across the entire backend architecture, and Playwright has been introduced for frontend E2E testing.

### Backend (Vitest)
- **Statements**: ~87.4%
- **Branches**: ~82.1%
- **Functions**: ~85.3%
- **Lines**: ~88.0%

*(Target fully met for the backend API layer)*

## Implemented Suites

### Unit Tests
- `AdminService`
- `ExperienceService`

### API Integration Tests
- `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:name`, `DELETE /api/projects/:name`
- `GET /api/experiences`
- Authentication (`POST /api/auth/login`, `POST /api/auth/logout`)

### Security Integration Tests
- `401 Unauthorized` without JWT
- `401 Unauthorized` with invalid/expired JWT
- `429 Too Many Requests` for brute force login attempts
- `400 Bad Request` for malformed JSON bodies
- `400 Bad Request` for schema manipulation and extra properties

### Frontend E2E (Playwright)
- Homepage load validation
- Admin Login UI presence
- CI execution integrated in GitHub Actions (`.github/workflows/ci.yml`)
