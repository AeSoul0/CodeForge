# CodeForge

**CodeForge** is the official portfolio of Samuele Arabia (ÆSoul) — an aspiring Full-Stack Developer & Software Architect. Built for performance, security, and scalability, CodeForge is designed to showcase engineering rigor and a strong foundation in modern web development.

## 🚀 Engineering Highlights

This repository is built with production-grade engineering principles:

- **⚡ Astro Performance:** Pre-rendered UI with minimal JS payload.
- **🔐 Security:** Full helmet configurations, strict CSP, rate limiting, and robust authentication with JWT and bcrypt. No hardcoded secrets.
- **🧪 Test Coverage:** Unit and integration testing setup with Vitest and Supertest.
- **🐳 Docker:** Hardened, non-root `node:22-alpine` and `nginx` minimal containers with healthchecks.
- **🚀 CI/CD:** Ready for deployment with structured `docker-compose`.
- **♿ Accessibility:** Fully compliant with WCAG 2.2 AA (semantic HTML, ARIA, focus traps, `prefers-reduced-motion`).
- **📊 Observability:** Fastify structured logging (Pino) and a custom metrics dashboard for telemetry.
- **🛡️ API Hardening:** Decoupled `Controller -> Service -> Repository -> MongoDB` architecture.

---

## 🏗️ Architecture

The project employs a modern separated frontend and backend stack.

### Stack

- **Frontend:** Astro, TailwindCSS, Vanilla JS (minimal framework footprint).
- **Backend:** Node.js 22, Fastify, TypeScript, Mongoose.
- **Database:** MongoDB.
- **Tooling:** Docker, Vitest, ESLint.

See the [Architecture Documentation](docs/architecture.md) for more details.

---

## 🛠️ Setup & Installation

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AeSoul0/CodeForge.git
   cd CodeForge
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` in both `frontend` and `backend` directories and configure your local MongoDB credentials and JWT secret.

3. **Run using Docker Compose (Recommended):**
   ```bash
   docker-compose up --build
   ```

4. **Run Locally:**
   - **Backend:** `cd backend && npm install && npm run dev`
   - **Frontend:** `cd frontend && npm install && npm run dev`

---

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- [Architecture Design](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Security Posture](docs/security.md)
- [Testing Strategy](docs/testing.md)
- [Deployment Guide](docs/deployment.md)

---

## 🌐 API

The backend exposes a secure REST API. 
Swagger documentation is available at `/api-docs` when running the backend in development mode.

---

## 🤝 Contribution

This is a personal portfolio and MVP project, developed internally following strict CI/CD and roadmap guidelines.

## 📄 License

All rights reserved by Samuele Arabia (ÆSoul).
