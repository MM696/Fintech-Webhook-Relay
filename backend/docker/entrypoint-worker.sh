#!/bin/sh
set -eu

. /app/docker/wait-for-deps.sh

echo "Starting webhook delivery worker..."
exec node bin/worker.js
