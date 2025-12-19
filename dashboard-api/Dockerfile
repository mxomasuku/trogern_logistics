# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy the bundled domain package (created by prepare-deploy.sh)
COPY lib ./lib

# Install dependencies (including the bundled domain package)
# Note: Using npm ci without --only=production to ensure all deps are available
RUN npm ci

# Copy compiled dist folder
COPY dist ./dist

# Expose port (Cloud Run sets PORT env var)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/healthz', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "dist/server.js"]
