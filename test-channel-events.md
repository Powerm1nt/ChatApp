# Channel Events Testing Guide

## Overview
This document outlines how to test the newly implemented channel events system that broadcasts real-time updates when channels are created, edited, or deleted.

## What Was Implemented

### Backend Changes
1. **Chat Gateway (`chat.gateway.ts`)**:
   - Added `broadcastChannelCreated()` method
   - Added `broadcastChannelUpdated()` method  
   - Added `broadcastChannelDeleted()` method
   - Modified `handleJoinRoom()` to support guild rooms
   - Added `handleJoinGuild()` for guild-wide events

2. **Chat Service (`chat.service.ts`)**:
   - Added `updateChannel()` method for editing channels

3. **Chat Controller (`chat.controller.ts`)**:
   - Added PUT endpoint for updating channels
   - Modified create/delete endpoints to broadcast events
   - Added `UpdateChannelDto` validation class

### Frontend Changes
1. **Socket Store (`socketStore.ts`)**:
   - Added socket event listeners for `channel-created`, `channel-updated`, `channel-deleted`
   - Added `updateChannel()` method
   - Modified `joinRoom()` to emit guild join events
   - Auto-refresh channel lists when events are received
   - Clear current room if deleted channel is active

2. **UI Components**:
   - Created `EditChannelDialog.tsx` for editing channels
   - Updated `ChannelList.tsx` to include edit option in dropdown menu

## Testing Steps

### Prerequisites
1. Start the application: `docker-compose -f docker-compose.dev.yml up --build`
2. Open multiple browser tabs/windows to test real-time updates
3. Create a user account and join/create a guild

### Test 1: Channel Creation Events
1. **Setup**: Open 2 browser tabs, both logged in and viewing the same guild
2. **Action**: In Tab 1, create a new channel using the "+" button
3. **Expected Result**: 
   - Tab 1: Channel appears immediately after creation
   - Tab 2: Channel appears automatically without refresh
   - Console logs show "Channel created" event

### Test 2: Channel Update Events  
1. **Setup**: Open 2 browser tabs, both viewing the same guild with existing channels
2. **Action**: In Tab 1, right-click a channel → "Edit Channel" → Change name/description → Save
3. **Expected Result**:
   - Tab 1: Channel updates immediately
   - Tab 2: Channel name/description updates automatically
   - Console logs show "Channel updated" event

### Test 3: Channel Deletion Events
1. **Setup**: Open 2 browser tabs, both viewing the same guild
2. **Action**: In Tab 1, right-click a channel → "Delete Channel" → Confirm
3. **Expected Result**:
   - Tab 1: Channel disappears immediately
   - Tab 2: Channel disappears automatically
   - If Tab 2 was viewing the deleted channel, it should clear the chat area
   - Console logs show "Channel deleted" event

### Test 4: Guild Room Joining
1. **Setup**: Open browser dev tools → Network tab
2. **Action**: Navigate to a guild channel
3. **Expected Result**:
   - Socket emits `join-room` event with guildId
   - Socket emits `join-guild` event
   - Backend logs show guild room joining

## API Endpoints

### New/Modified Endpoints
- `PUT /api/guilds/:guildId/channels/:channelId` - Update channel
- `POST /api/guilds/:guildId/channels` - Create channel (now broadcasts events)
- `DELETE /api/guilds/:guildId/channels/:channelId` - Delete channel (now broadcasts events)

### Socket Events

#### Client → Server
- `join-room` - Now includes optional `guildId` parameter
- `join-guild` - New event for joining guild-wide event room

#### Server → Client
- `channel-created` - Broadcasted when channel is created
- `channel-updated` - Broadcasted when channel is updated  
- `channel-deleted` - Broadcasted when channel is deleted

## Event Payloads

### channel-created
```json
{
  "guildId": "uuid",
  "channel": {
    "id": "uuid",
    "name": "channel-name",
    "description": "optional description",
    "guildId": "uuid",
    "createdAt": "timestamp"
  },
  "timestamp": "timestamp"
}
```

### channel-updated
```json
{
  "guildId": "uuid", 
  "channel": {
    "id": "uuid",
    "name": "updated-name",
    "description": "updated description",
    "guildId": "uuid",
    "createdAt": "timestamp"
  },
  "timestamp": "timestamp"
}
```

### channel-deleted
```json
{
  "guildId": "uuid",
  "channelId": "uuid", 
  "channelName": "deleted-channel-name",
  "timestamp": "timestamp"
}
```

## Troubleshooting

### Common Issues
1. **Events not received**: Check if client joined guild room via `join-guild` event
2. **Stale data**: Verify that `fetchChannels()` is called after events
3. **Permission errors**: Ensure user has access to the guild
4. **Socket disconnection**: Check network tab for WebSocket connection status

### Debug Commands
```bash
# Check backend logs
docker-compose -f docker-compose.dev.yml logs backend --tail=50

# Check frontend logs  
docker-compose -f docker-compose.dev.yml logs frontend --tail=20

# Test API directly
curl -X POST http://localhost:3001/api/guilds/{guildId}/channels \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-channel"}'
```

## Architecture Notes

### Event Flow
1. Client makes API request (create/update/delete channel)
2. Controller processes request and calls service method
3. Service performs database operation
4. Controller calls gateway broadcast method
5. Gateway emits event to all clients in guild room (`guild-{guildId}`)
6. Clients receive event and update local state
7. UI automatically reflects changes

### Guild Room Strategy
- Clients join both channel-specific rooms and guild-wide rooms
- Channel events are broadcasted to guild rooms to reach all guild members
- This ensures all guild members see channel changes regardless of which channel they're currently viewing

This implementation provides real-time synchronization of channel state across all connected clients within a guild, improving the user experience by eliminating the need for manual refreshes.