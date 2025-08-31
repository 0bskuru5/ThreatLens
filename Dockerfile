# Multi-stage Docker build for ThreatLens

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY client/ ./

# Build frontend
RUN npm run build

# Stage 2: Setup backend
FROM node:18-alpine AS backend-setup

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Copy built frontend
COPY --from=frontend-build /app/client/dist ./client/dist

# Build backend (if needed)
RUN npm run build 2>/dev/null || echo "No build step needed"

# Remove dev dependencies
RUN npm prune --production

# Stage 3: Production runtime
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S threatlens -u 1001

WORKDIR /app

# Copy built application
COPY --from=backend-setup --chown=threatlens:nodejs /app ./

# Switch to non-root user
USER threatlens

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
