# Use Node 20 as base image
FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm@10.6.3

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port (Railway sets PORT env variable)
EXPOSE 2024

# Run entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
