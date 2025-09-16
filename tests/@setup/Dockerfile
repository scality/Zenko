FROM node:22-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    bash \
    jq \
    openssl \
    ca-certificates

# Install TypeScript globally
RUN yarn global add typescript@5.9.2

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Install helm
RUN curl -fsSL https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz | tar -xzC /tmp && \
    mv /tmp/linux-amd64/helm /usr/local/bin/helm && \
    chmod +x /usr/local/bin/helm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --prod --network-concurrency=1

# Copy source code
COPY . .

# Copy mock-metadata.tar.gz for AWS mock setup
COPY mocks/mock-metadata.tar.gz /setup/mock-metadata.tar.gz

# Build TypeScript
RUN yarn build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set proper permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Default command
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]