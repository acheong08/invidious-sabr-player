# Multi-stage Dockerfile for Kira
# Serves both frontend (via Vite preview) and proxy (via Deno) through nginx

# Stage 1: Build frontend with Bun
FROM oven/bun:1 AS frontend-builder

WORKDIR /app

# Copy package files and scripts (needed for postinstall)
COPY package.json bun.lock* package-lock.json* ./
COPY scripts ./scripts

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy rest of source code
COPY . .

# Build frontend with Docker-specific proxy settings
ENV VITE_PROXY_PROTOCOL=http
ENV VITE_PROXY_HOST=localhost
ENV VITE_PROXY_PORT=80
ENV VITE_PROXY_BASE_PATH=/api

RUN bun run build

# Stage 2: Runtime with Deno, Bun, and nginx
FROM denoland/deno:debian

# Install nginx and bun
RUN apt-get update && \
    apt-get install -y nginx curl unzip && \
    curl -fsSL https://bun.sh/install | bash && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add bun to PATH
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

WORKDIR /app

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder /app/vite.config.ts ./vite.config.ts
COPY --from=frontend-builder /app/tsconfig.json ./tsconfig.json
COPY --from=frontend-builder /app/node_modules ./node_modules

# Copy proxy server
COPY proxy/deno.ts ./proxy/deno.ts

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start services
CMD ["./docker-entrypoint.sh"]