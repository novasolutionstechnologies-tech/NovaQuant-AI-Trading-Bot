# ==============================================================================
# NovaQuant AI Trading Engine - Production Dockerfile for Google Cloud Run
# With Outbound Static IP & Low-Latency Crypto Exchange Execution
# ==============================================================================

FROM node:22-slim AS builder

WORKDIR /app

# Install build essentials if needed
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package.json bun.lock* package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy application source code
COPY . .

# Build the client SPA bundle and server bundle
RUN npm run build

# ==============================================================================
# Production Runtime Stage
# ==============================================================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install curl for healthcheck & diagnostic IP discovery
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package manifests and production dependencies
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy built assets and server code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/database ./database
COPY --from=builder /app/data ./data
COPY --from=builder /app/src/types.ts ./src/types.ts
COPY --from=builder /app/server.ts ./server.ts

# Create non-root user for security compliance
RUN groupadd -r novaquant && useradd -r -g novaquant -d /app novaquant && \
    chown -R novaquant:novaquant /app

USER novaquant

# Cloud Run injects PORT environment variable (typically 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/health || exit 1

# Start the compiled high-performance Node production server
CMD ["node", "dist/server.cjs"]
