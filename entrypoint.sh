#!/bin/bash
set -e

# Railway sets PORT environment variable, default to 2024 if not set
export PORT=${PORT:-2024}

# Force HTTPS protocol for UI asset URLs
export PROTOCOL=https
export HOST=${RAILWAY_PUBLIC_DOMAIN:-agent.combinedmemory.com}

echo "Starting LangGraph agent server on port $PORT..."
echo "Host: $HOST, Protocol: $PROTOCOL"

# Run the LangGraph agent server
pnpm run agent
