# Status and Heartbeat Endpoints Test

This document describes the new status and heartbeat endpoints added to the ChatApp.

## Service Health Endpoints

### 1. Basic Health Check
```bash
curl http://localhost:3001/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-24T01:39:39.403Z",
  "uptime": 12.330038056
}
```

### 2. Heartbeat Endpoint
```bash
curl http://localhost:3001/heartbeat
```
**Response:**
```json
{
  "alive": true,
  "timestamp": "2025-06-24T01:39:44.659Z",
  "services": {
    "database": "connected",
    "websocket": "active",
    "api": "running"
  }
}
```

## Guild Status Endpoint

### Get Guild Status (requires authentication)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/guilds/{guildId}/status
```
**Response:**
```json
{
  "guildId": "guild-uuid",
  "name": "Guild Name",
  "status": "active",
  "timestamp": "2025-06-24T01:39:44.659Z",
  "stats": {
    "memberCount": 5,
    "channelCount": 3,
    "activeUsers": 2,
    "createdAt": "2025-06-20T10:30:00.000Z"
  },
  "health": {
    "database": "connected",
    "channels": "available",
    "members": "active"
  }
}
```

## User Status Endpoint

### Get User Status (requires authentication)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/users/{userId}/status
```
**Response:**
```json
{
  "userId": "user-uuid",
  "username": "username",
  "status": "online",
  "timestamp": "2025-06-24T01:39:44.659Z",
  "stats": {
    "guildCount": 3,
    "joinedAt": "2025-06-15T08:00:00.000Z",
    "lastActivity": "2025-06-24T01:35:00.000Z"
  },
  "health": {
    "connection": "connected",
    "guilds": "member",
    "account": "registered"
  }
}
```

## Frontend Integration

The frontend now includes:

1. **Service Status Indicator**: Shows in the guild sidebar with real-time status
2. **Heartbeat Monitoring**: Automatically checks service status every 30 seconds
3. **Guild Status Dialog**: Click the activity icon next to guild names to view detailed status
4. **User Status**: Available through the new API endpoints

## Features Added

- ✅ Enhanced health check with uptime information
- ✅ Heartbeat endpoint with service status details
- ✅ Guild status monitoring with member/channel statistics
- ✅ User status tracking with online/offline detection
- ✅ Real-time status indicators in the UI
- ✅ Automatic heartbeat monitoring every 30 seconds
- ✅ Fixed channel list fetching issues
- ✅ Status dialogs for detailed guild information