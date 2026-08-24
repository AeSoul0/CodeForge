# Security Baseline

## Audits
- **Backend**: `npm audit` found 0 vulnerabilities.
- **Frontend**: `npm audit` found 0 vulnerabilities.

## Headers and Protection (Current State)
The backend currently uses:
- `helmet` for basic HTTP security headers.
- `cors` with specific configurations.
- `rate-limit` for global rate limiting.
- JWT for authentication.

*To be improved in Phase 1 (Security Hardening).*
