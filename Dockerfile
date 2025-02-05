# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    wget \
    p7zip \
    sqlite \
    python3 \
    make \
    g++ \
    bash

# Copy and install backend dependencies
COPY package*.json ./
RUN npm ci

# Copy backend source code
COPY ./src ./src/

# Build frontend
COPY ./frontend ./frontend/
WORKDIR /app/frontend
RUN npm ci
RUN npm run build

# Copy the standalone Next.js build
RUN cp -r .next/standalone /app/frontend-standalone
RUN cp -r .next/static /app/frontend-standalone/.next/static

# Runtime Stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    wget \
    p7zip \
    sqlite \
    bash \
    shadow \
    su-exec

# Create gamarr user and group with specific IDs
RUN addgroup -g 1000 gamarr && \
    adduser -u 1000 -G gamarr -s /bin/sh -D gamarr

# Create necessary directories
RUN mkdir -p /app/downloads /app/library /app/data /app/temp && \
    chown -R gamarr:gamarr /app

# Install unrar in runtime stage
RUN wget https://www.rarlab.com/rar/rarlinux-x64-710b3.tar.gz && \
    tar -xzf rarlinux-x64-710b3.tar.gz && \
    cp rar/unrar /usr/bin/unrar && \
    chmod +x /usr/bin/unrar && \
    rm -rf rarlinux-x64-710b3.tar.gz rar

# Copy only necessary files from builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/src /app/src
COPY --from=builder /app/frontend-standalone /app/frontend-standalone

# Add entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set permissions
RUN chown -R gamarr:gamarr /app

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "frontend-standalone/server.js"]