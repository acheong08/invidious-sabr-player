#!/bin/bash
set -e

echo "Starting Kira services..."

# Start Deno proxy server in background
echo "Starting Deno proxy on port 8080..."
deno run --allow-net --allow-read --allow-write ./proxy/deno.ts &
DENO_PID=$!

# Start Vite preview server in background
echo "Starting Vite preview server on port 4173..."
cd /app && bun run preview &
VITE_PID=$!

# Give services a moment to start
sleep 2

# Start nginx in foreground
echo "Starting nginx on port 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down services..."
    kill $NGINX_PID 2>/dev/null || true
    kill $VITE_PID 2>/dev/null || true
    kill $DENO_PID 2>/dev/null || true
    exit 0
}

# Trap termination signals
trap shutdown SIGTERM SIGINT

# Wait for nginx (main process)
wait $NGINX_PID
