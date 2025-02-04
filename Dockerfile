# Use the official Node.js image as the base image
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

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

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gosu \
    p7zip-full \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://www.rarlab.com/rar/rarlinux-x64-710b3.tar.gz && \
    tar -xzf rarlinux-x64-710b3.tar.gz && \
    cp rar/unrar /usr/bin/unrar && \
    chmod +x /usr/bin/unrar && \
    rm -rf rarlinux-x64-710b3.tar.gz rar

# Copy only package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY ./src ./src/

# Add script to handle user permissions
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/app.js"]