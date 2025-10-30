#!/bin/bash
set -e

# Railway sets PORT environment variable, default to 2024 if not set
export PORT=${PORT:-2024}

echo "Starting LangGraph agent server on port $PORT..."

# Run the LangGraph agent server
pnpm run agent
