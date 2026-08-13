# /backend/Dockerfile
# ------------------------------------------------------------------------------
# @description Multi-stage Dockerfile for the Fastify Node.js backend.
# Uses a lightweight Alpine Linux image for security and performance.
# ------------------------------------------------------------------------------

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies for TS compilation)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript (assumes you have a "build" script in package.json)
# e.g., "build": "tsc"
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install ONLY production dependencies for a smaller attack surface
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the API port
EXPOSE 3000

# Start the compiled Fastify server
CMD ["node", "dist/index.js"]