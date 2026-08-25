# CodeForge Architecture

## Overview
CodeForge leverages a split frontend-backend architecture for maximum separation of concerns, scalability, and security.

## Frontend
- **Framework:** Astro (Server-Side Rendering using Vercel adapter for dynamic API endpoints and admin dashboard)
- **Styling:** Tailwind CSS
- **Interactivity:** Vanilla JS and HTML5 Canvas (Particle System)

## Backend
- **Framework:** Node.js 22 with Fastify
- **Architecture Pattern:** Controller-Service-Repository
  - **Routes:** Map HTTP requests to controllers.
  - **Controllers:** Handle HTTP logic (req/res) and pass data to services.
  - **Services:** Isolate business logic and orchestration.
  - **Repositories:** Abstract MongoDB/Mongoose operations.
- **Database:** MongoDB
- **Security:** Helmet, Rate Limiting, CORS, JWT Auth.
