# CodeForge

**CodeForge** is the official portfolio of Samuele Arabia (ÆSoul) — an aspiring Full-Stack Developer & Software Architect. Built to showcase practical engineering, product thinking, security fundamentals, and modern web development through a real personal portfolio/MVP.

## 🚀 Engineering Highlights

This repository is built with a strong focus on practical engineering principles:

- **⚡ Astro Performance:** Pre-rendered UI with minimal JS payload.
- **🔐 Security:** Helmet configurations, CSP, rate limiting, JWT authentication, bcrypt, restricted CORS, and environment-based secrets. Administrator bootstrap requires an explicit `ADMIN_API_KEY` and does not use a default credential.
- **🧪 Testing:** Unit and integration testing setup with Vitest and Supertest, with V8 coverage reporting available through the test configuration.
- **🐳 Docker:** Containerized frontend/backend stack with Docker Compose, using non-root application containers.
- **🚀 CI/CD:** GitHub Actions for linting, typechecking, builds, and backend test execution.
- **♿ Accessibility:** Semantic HTML, ARIA where appropriate, focus handling, and `prefers-reduced-motion` support. Formal WCAG compliance should be verified with automated and manual audits.
- **📊 Observability:** Fastify structured logging and application metrics.
- **🛡️ API Architecture:** Decoupled `Controller -> Service -> Repository -> MongoDB` architecture.

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
- [Engineering Evidence](docs/evidence.md)

---

## 🌐 API

The backend exposes a secure REST API. 
Swagger documentation is available at `/api-docs` when running the backend in development mode.
It includes endpoints for managing projects and experiences, including Base64 image upload/retrieval for experiences.

---

## 🤖 AI-assisted Project Documentation

CodeForge can enrich portfolio projects with technical documentation generated from selected public GitHub repository context, including repository metadata, README content, and `package.json` when available.

Generated Markdown is sanitized before being rendered publicly. The AI workflow is designed to stay grounded in the supplied repository context and avoid inventing unsupported implementation details.

---

## 📸 Screenshots & Demo

The live application is available at:

**https://www.aesoul0.com**

<img width="1900" height="938" alt="image" src="https://github.com/user-attachments/assets/321a799f-1a97-4553-9d9f-f436c995f1ff" />


---

## ✅ Engineering Evidence

CodeForge keeps **implemented engineering controls** separate from **measured results**.

The current backend verification state includes:

* **Typecheck:** passed
* **Production build:** passed
* **Automated tests:** **7/7 tests passed** across 2 test files
* **Test framework:** Vitest with Supertest integration testing
* **Coverage tooling:** V8 coverage is configured
* **Dependency audit:** **0 vulnerabilities**
* **CI:** GitHub Actions is configured for backend linting, typechecking, build and tests, plus frontend linting, typechecking and Astro build

The current test execution produces only non-blocking warnings related to future Vite configuration changes, a deprecated Mongoose option, and the absence of an AI provider in the test environment. These warnings do not cause the test suite to fail.

Coverage percentages, accessibility scores, performance metrics, and formal WCAG compliance are **not claimed until they are freshly measured against the current build**.

See [`docs/evidence.md`](docs/evidence.md) for the detailed verification status, testing evidence, dependency health, and reproducibility information.

---

## 🤝 Contribution

This is a personal portfolio and MVP project, developed internally following a focused roadmap and iterative engineering workflow.

## 📄 License

All rights reserved by Samuele Arabia (ÆSoul).
