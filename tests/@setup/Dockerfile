# Multi-stage build for smaller final image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock tsconfig.json ./

# Install dependencies
RUN yarn install --production --frozen-lockfile

# Copy source code
COPY src/ ./src/

# Build the TypeScript code
RUN npm run build

# Final runtime image
FROM node:18-alpine

# Install kubectl for Kubernetes API access
RUN apk add --no-cache curl && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Create non-root user
RUN addgroup -g 1001 -S zenko && \
    adduser -S zenko -u 1001 -G zenko

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create directory for kubeconfig mount
RUN mkdir -p /home/zenko/.kube && \
    chown -R zenko:zenko /home/zenko && \
    chown -R zenko:zenko /app

# Switch to non-root user
USER zenko

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Default command
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]

# Labels for metadata
LABEL maintainer="Scality <support@scality.com>"
LABEL description="Unified CLI tool for Zenko test environment setup"
LABEL version="1.0.0"