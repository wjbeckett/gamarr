#!/bin/sh
# Note: Using /bin/sh instead of /bin/bash as it's the default shell in Alpine

# Default values for PUID and PGID
PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "-------------------------------------"
echo "Setting up user with PUID: $PUID and PGID: $PGID"
echo "-------------------------------------"

# Update the gamarr group to match the specified PGID
if [ "$(id -g gamarr)" != "$PGID" ]; then
    groupmod -o -g "$PGID" gamarr
fi

# Update the gamarr user to match the specified PUID
if [ "$(id -u gamarr)" != "$PUID" ]; then
    usermod -o -u "$PUID" gamarr
fi

# Set permissions on app directories
chown -R gamarr:gamarr \
    /app \
    /app/downloads \
    /app/library \
    /app/temp

echo "
-------------------------------------
GID/UID
-------------------------------------
User uid:    $(id -u gamarr)
User gid:    $(id -g gamarr)
-------------------------------------
"

# Switch to the gamarr user and execute the command
exec su-exec gamarr "$@"