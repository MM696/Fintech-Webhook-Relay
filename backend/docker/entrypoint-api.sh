#!/bin/sh
set -eu

. /app/docker/wait-for-deps.sh

echo "Running database migrations..."
node ace migration:run --force --compact-output

echo "Starting API server..."
exec node bin/server.js
