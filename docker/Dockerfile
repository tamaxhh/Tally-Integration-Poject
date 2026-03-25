# ============================================================
# docker/Dockerfile
#
# MULTI-STAGE BUILD — WHY:
# -------------------------
# Stage 1 (builder): Installs ALL dependencies including devDependencies
# Stage 2 (production): Copies only production deps + built code
#
# Result: Production image is ~50% smaller (no jest, nodemon, etc.)
# Smaller images = faster pulls = faster deployments = less attack surface
#
# BASE IMAGE CHOICE: node:20-alpine
# - alpine is minimal Linux (5MB vs 100MB+ for debian)
# - node:20 is the current LTS — stable, maintained
# - Never use node:latest in production — it can change unexpectedly
# ============================================================

# Stage 1: Install dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — Docker layer caching means this layer only
# rebuilds when package.json or package-lock.json changes (not on every code change)
COPY package*.json ./

# Install ALL deps (including dev) — needed for any build steps
RUN npm ci --include=dev

# Stage 2: Production image
FROM node:20-alpine AS production

# Create non-root user — running as root inside containers is a security risk
RUN addgroup -g 1001 -S nodejs && adduser -S tally -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies — excludes jest, nodemon, etc.
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY --chown=tally:nodejs src/ ./src/
COPY --chown=tally:nodejs start-server.js ./
COPY --chown=tally:nodejs config.js ./
COPY --chown=tally:nodejs .env.example ./

# Create .env file for container
RUN echo "NODE_ENV=production" > .env && \
    echo "PORT=3000" >> .env && \
    echo "HOST=0.0.0.0" >> .env && \
    echo "TALLY_HOST=host.docker.internal" >> .env && \
    echo "TALLY_PORT=9000" >> .env && \
    echo "API_KEYS=dev-key-local-only" >> .env

# Switch to non-root user
USER tally

# Expose the app port
EXPOSE 3000

# Health check — Docker will mark the container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the app
CMD ["node", "start-server.js"]
