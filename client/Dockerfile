# React Client Dockerfile (Multi-stage build)
FROM node:20-alpine AS builder

# Working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files (build context root olduğu için client/ prefix'i gerekli)
COPY client/package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm install

# Copy application files (build context root olduğu için client/ prefix'i gerekli)
COPY client/ .

# Build application (TypeScript compile + Vite build)
RUN npm run build

# Debug: Build çıktısını kontrol et
RUN ls -la /app/dist || echo "Build failed - dist directory not found"

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Debug: Kopyalanan dosyaları kontrol et
RUN ls -la /usr/share/nginx/html || echo "Files not copied"

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

