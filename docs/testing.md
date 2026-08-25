# Testing

## Strategy
CodeForge ensures code quality via automated unit and integration tests, as well as frontend End-to-End (E2E) testing. The CI/CD pipeline enforces strict testing thresholds.

## Tools
- **Vitest:** Fast Vite-native test runner for backend unit and API integration tests.
- **Supertest:** For HTTP route integration testing.
- **V8 Coverage:** Code coverage metrics.
- **Playwright:** E2E testing for the Astro frontend.

## Running Tests
Run tests locally using:
```bash
npm run test
```
For coverage:
```bash
npm run test:cov
```
For E2E (Frontend):
```bash
npx playwright test
```

## Coverage Thresholds (Enforced via CI)
- **Statements**: >= 85%
- **Branches**: >= 80%
- **Functions**: >= 85%
- **Lines**: >= 85%

## Implemented Suites

### Unit Tests
- `AdminService`
- `ExperienceService`
- `ProjectService`

### API Integration Tests
- **Projects**: `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:name`, `DELETE /api/projects/:name`
- **Experiences**: `GET /api/experiences`, `POST /api/experiences`
- **Auth**: `POST /api/auth/login`, `POST /api/auth/logout`

### Security Validation Tests
- `401 Unauthorized` without JWT
- `401 Unauthorized` with invalid/expired JWT
- `403 Forbidden` if JWT lacks admin role
- `429 Too Many Requests` for brute force login attempts
- `400 Bad Request` for malformed JSON bodies
- `400 Bad Request` for strict schema manipulation (e.g., extra properties)

### Frontend E2E (Playwright)
- Homepage load validation
- Admin Login UI presence
