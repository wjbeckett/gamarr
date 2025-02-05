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

# Create PM2 ecosystem file
COPY ecosystem.config.js /app/

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

# Install PM2 globally
RUN npm install -g pm2
    
# Create gamarr user and group, handling existing GID/UID conflicts
RUN if ! getent group gamarr >/dev/null; then \
    groupadd -g 1000 gamarr || groupadd gamarr; \
    fi && \
    if ! id -u gamarr >/dev/null 2>&1; then \
    useradd -u 1000 -g gamarr -m gamarr || useradd -g gamarr -m gamarr; \
    fi

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
COPY --from=builder /app/ecosystem.config.js /app/ecosystem.config.js

# Add entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set permissions
RUN chown -R gamarr:gamarr /app

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pm2-runtime", "ecosystem.config.js"]