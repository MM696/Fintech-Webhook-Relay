#!/bin/sh
set -eu

wait_for_tcp() {
  host="$1"
  port="$2"
  name="$3"

  until node -e "
    const net = require('net');
    const socket = net.createConnection({ host: '${host}', port: ${port} });
    socket.on('connect', () => { socket.end(); process.exit(0); });
    socket.on('error', () => process.exit(1));
  " >/dev/null 2>&1; do
    echo "Waiting for ${name} at ${host}:${port}..."
    sleep 2
  done

  echo "${name} is ready."
}

wait_for_tcp "${DB_HOST}" "${DB_PORT}" "PostgreSQL"
wait_for_tcp "${REDIS_HOST}" "${REDIS_PORT}" "Redis"
