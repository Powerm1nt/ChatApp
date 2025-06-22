# Backend Dockerfile for NestJS application
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Development stage
FROM base AS development
EXPOSE 3001
CMD ["yarn", "start:dev"]

# Build stage
FROM base AS build
RUN yarn build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy package files and install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"]
