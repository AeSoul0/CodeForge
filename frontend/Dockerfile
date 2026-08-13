# /frontend/Dockerfile
# ------------------------------------------------------------------------------
# @description Multi-stage Dockerfile for the Astro frontend.
# Builds the static site and serves it via a highly optimized Nginx web server.
# ------------------------------------------------------------------------------

# Stage 1: Build Environment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend source code
COPY . .

# Build the Astro project (outputs to the /dist folder by default)
RUN npm run build

# Stage 2: Production Server (Nginx)
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the compiled static files from the builder stage to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (standard HTTP port inside the container)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]