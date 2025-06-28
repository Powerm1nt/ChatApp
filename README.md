# Chat App - React.js + NestJS with Docker

A real-time chat application built with React.js (Vite) frontend and NestJS backend, featuring JWT authentication and Socket.IO for real-time communication.

## Features

- Real-time messaging with Socket.IO
- JWT-based authentication
- Anonymous guest access
- Multiple chat rooms
- Typing indicators
- User presence indicators
- Responsive design with Tailwind CSS
- **Theme Support**: Light, Dark, and System themes with automatic switching

## Tech Stack

### Frontend
- React.js 18
- TypeScript
- Vite
- Tailwind CSS
- Socket.IO Client
- React Router
- Axios

### Backend
- NestJS
- TypeScript
- Socket.IO
- JWT Authentication
- Passport.js
- bcryptjs

## Docker Setup

### Prerequisites
- Docker
- Docker Compose

### Docker Compose Files

This project includes two Docker Compose configurations:

#### `docker-compose.dev.yml` - Development Environment
- **Purpose**: Local development with hot reloading
- **Features**:
  - Volume mounts for live code changes
  - Development build targets
  - Debug mode enabled for backend
  - Development-specific environment variables
  - Frontend on port 5173 (Vite dev server)
  - Backend on port 3001 with debugging

#### `docker-compose.yml` - Production Environment
- **Purpose**: Production deployment
- **Features**:
  - Optimized production builds
  - No volume mounts (immutable containers)
  - Health checks for service monitoring
  - Environment variable substitution
  - Frontend served by nginx on port 80
  - Backend on port 3001 (production mode)

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChatApp
   ```

2. **Start the development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

   This will start both services in development mode:
   - Backend: http://localhost:3001 (with hot reloading and debugging)
   - Frontend: http://localhost:5173 (with hot reloading)

3. **Stop the development services**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Production Environment

1. **Set environment variables**
   ```bash
   export JWT_SECRET=your-production-secret-key
   ```

2. **Start the production environment**
   ```bash
   docker-compose up --build -d
   ```

   This will start both services in production mode:
   - Backend: http://localhost:3001 (optimized production build)
   - Frontend: http://localhost:80 (served by nginx)

3. **Stop the production services**
   ```bash
   docker-compose down
   ```

### Manual Production Build (Alternative)

1. **Build production images**
   ```bash
   # Backend production build
   docker build -t chat-app-backend:prod --target production ./backend

   # Frontend production build
   docker build -t chat-app-frontend:prod --target production ./frontend
   ```

2. **Run production containers**
   ```bash
   # Backend
   docker run -p 3001:3001 -e NODE_ENV=production -e JWT_SECRET=your-secret chat-app-backend:prod

   # Frontend
   docker run -p 80:80 chat-app-frontend:prod
   ```

## Local Development (without Docker)

### Backend Setup
```bash
cd backend
yarn install
yarn start:dev
```

### Frontend Setup
```bash
cd frontend
yarn install
yarn dev
```

## Environment Variables

The project uses environment variables for configuration. Copy `.env.example` to `.env` and update the values as needed.

```bash
cp .env.example .env
```

### Available Environment Variables

#### Backend Configuration
- `JWT_SECRET`: Secret key for JWT tokens (REQUIRED - change in production!)
- `NODE_ENV`: Environment mode (development/production)
- `BACKEND_PORT`: Backend server port (default: 3001)
- `CORS_ORIGIN`: CORS allowed origins, comma-separated (default: http://localhost:5173)

#### Frontend Configuration
- `FRONTEND_PORT`: Frontend development server port (default: 5173)
- `VITE_API_URL`: API base URL for frontend (default: http://localhost:3001)
- `VITE_SOCKET_URL`: Socket.IO server URL (default: http://localhost:3001)

#### Docker Configuration
- `COMPOSE_PROJECT_NAME`: Docker Compose project name prefix (default: chat-app)

### Environment Files

- `.env.example`: Template file with all available environment variables
- `.env`: Your local environment configuration (not tracked in git)
- Both Docker Compose files automatically load variables from `.env`

### Usage Examples

#### Development Setup
```bash
# Copy the example file
cp .env.example .env

# Start development environment
docker-compose -f docker-compose.dev.yml up --build
```

#### Production Setup
```bash
# Copy and modify for production
cp .env.example .env

# Edit .env for production values
# NODE_ENV=production
# JWT_SECRET=your-super-secure-production-secret-min-32-chars
# CORS_ORIGIN=https://yourdomain.com
# VITE_API_URL=https://api.yourdomain.com
# VITE_SOCKET_URL=https://api.yourdomain.com

# Start production environment
docker-compose up --build -d
```

#### Custom Port Configuration
```bash
# In your .env file:
BACKEND_PORT=8080
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/anonymous` - Anonymous sign in
- `GET /api/auth/me` - Get current user profile

### Health Check
- `GET /health` - Health check endpoint

## Socket.IO Events

### Client to Server
- `join-room` - Join a chat room
- `send-message` - Send a message
- `typing` - Typing indicator
- `get-messages` - Get room messages

### Server to Client
- `new-message` - New message received
- `room-messages` - Room message history
- `room-users` - Users in room
- `user-joined` - User joined notification
- `user-typing` - Typing indicator

## Docker Architecture

### Multi-stage Builds
Both frontend and backend use multi-stage Docker builds:

- **Base stage**: Install dependencies
- **Development stage**: Hot reloading for development
- **Build stage**: Build the application
- **Production stage**: Optimized production image

### Volumes
Development containers use volumes for hot reloading:
- Source code is mounted as volumes
- `node_modules` are preserved in anonymous volumes

### Networking
Services communicate through a custom Docker network (`chat-app-network`).

## Security Features

- JWT token-based authentication
- CORS configuration
- Input validation
- Non-root user in production containers
- Security headers in nginx

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request
6. Thanks Ai!

## License

This project is licensed under the MIT License.
