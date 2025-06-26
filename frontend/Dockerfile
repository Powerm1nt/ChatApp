# Frontend Dockerfile for React.js with Vite
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Development stage
FROM base AS dev
RUN yarn install
EXPOSE 5173
CMD ["yarn", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_SOCKET_URL

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN yarn install
RUN yarn build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
