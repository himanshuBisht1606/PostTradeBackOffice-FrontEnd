# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time env vars (injected by CI via --build-arg)
ARG VITE_API_BASE_URL
ARG VITE_ENV
ARG VITE_APP_NAME

# Expose as env vars so Vite can read them during build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENV=$VITE_ENV
ENV VITE_APP_NAME=$VITE_APP_NAME

# Install dependencies first (cache layer — only invalidated if package files change)
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# Copy source
COPY . .

# Build using the correct mode (dev or prod — determined by VITE_ENV)
RUN npm run build:${VITE_ENV}

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SPA from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
