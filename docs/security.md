# Security Architecture

CodeForge implements multiple layers of security to protect both the application and its data.

## Dependency Governance Policy
- **Critical Vulnerabilities**: Fail the CI/CD pipeline immediately. Must be patched or mitigated before any deployment.
- **High Vulnerabilities**: Require immediate review. Build may fail based on Dependabot config.
- **Moderate/Low**: Reviewed during regular maintenance cycles.

## Layers

### 1. Edge / Reverse Proxy (Render)
- TLS Termination
- DDoS Protection (Render native)

### 2. Application Security (Helmet)
- **Content Security Policy (CSP)**: Restricts executable scripts and styles to self.
- **HSTS**: Forces HTTPS for all connections.
- **X-Frame-Options**: Prevents clickjacking (set to DENY).
- **Referrer-Policy**: Strict origin when cross origin.

### 3. Authentication (JWT)
- Algorithm restricted to `HS256`.
- Explicit `issuer` and `audience` verification.
- Tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- No tokens are ever accessible via client-side JavaScript.

### 4. Rate Limiting
- Global limit: 100 requests per minute per IP.
- Helps mitigate brute-force and scraping attempts.

### 5. CORS
- Strictly whitelisted origins (localhost + production domains).
- Credentials allowed to support secure cookies.

### 6. Audit Logging
- Critical operations (login, data modification) are logged via the `auditLogger` for traceability.
