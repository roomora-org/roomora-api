# ==========================================
# Stage 1: Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the NestJS application
RUN npm run build

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:22-alpine AS production

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Copy TypeORM data source and migrations (needed for running migrations)
COPY --from=builder /app/src/database ./src/database

# Copy tsconfig if needed for typeorm-ts-node-esm (optional)
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose the port (Render will set PORT env var)
EXPOSE 3000

# Run migrations then start the app
CMD ["sh", "-c", "npm run typeorm migration:run -- -d dist/database/data-source.js && node dist/main.js"]