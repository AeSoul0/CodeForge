# Security Posture

## Overview
CodeForge is hardened to protect against common web vulnerabilities and ensure administrative safety.

## Measures Implemented
- **No Hardcoded Secrets:** All environment variables are strictly validated on startup.
- **Helmet:** Global HTTP header security (CSP, HSTS, Frameguard).
- **CORS:** Strictly limited to `FRONTEND_URL` and `localhost` origins.
- **Rate Limiting:** Global rate limit of 100 requests per minute per IP.
- **Authentication:** Admin routes are protected using fastify-jwt via httpOnly, Secure, sameSite=Strict cookies. Passwords are hashed with bcrypt.
- **Database Safety:** Mongoose Strict schemas, and mapped errors to prevent data leaks.
- **Containers:** Docker runs as a non-root user (`node` and `nginx`) on minimal Alpine bases.
