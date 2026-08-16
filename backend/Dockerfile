FROM node:22.12.0-alpine3.20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.12.0-alpine3.20
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# Non-root user
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Ensure the port matches the exposed port
ENV PORT=3000

# Healthcheck targeting the new P2 endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/live || exit 1

CMD ["node", "dist/index.js"]
