# Deployment Guide

## Docker Compose
CodeForge uses `docker-compose` to orchestrate the MongoDB database, Backend API, and Frontend web server.

### Steps
1. Configure `.env` files.
2. Build and start:
   ```bash
   docker-compose up --build -d
   ```

## Production Considerations
- Ensure `.env` contains strong production `JWT_SECRET` and secure `MONGODB_URI`.
- The frontend `Dockerfile` builds Astro as static and serves via `nginx`.
- The backend `Dockerfile` runs Node natively.
- Set up a reverse proxy with SSL termination (e.g., Cloudflare or Traefik) in front of the services.
