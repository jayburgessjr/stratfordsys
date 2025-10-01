# Stratford AI - Production Docker Image
# Multi-stage build for optimized production deployment

# =============================================================================
# Stage 1: Dependencies Installation
# =============================================================================
FROM node:20-alpine AS dependencies

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --production=false

# =============================================================================
# Stage 2: Application Build
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV STRATFORD_RANDOM_SEED=42
ENV STRATFORD_VERSION=1.0.0

# Build application
RUN pnpm build

# =============================================================================
# Stage 3: Production Runtime
# =============================================================================
FROM node:20-alpine AS runner

# Security: Create non-root user
RUN addgroup --system --gid 1001 stratford
RUN adduser --system --uid 1001 stratford

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder --chown=stratford:stratford /app/.next/standalone ./
COPY --from=builder --chown=stratford:stratford /app/.next/static ./.next/static
COPY --from=builder --chown=stratford:stratford /app/public ./public

# Create data directory for application files
RUN mkdir -p /app/data && chown stratford:stratford /app/data

# Switch to non-root user
USER stratford

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node server.js || exit 1

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start application
CMD ["node", "server.js"]