import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

export interface ChatMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  timestamp: Date;
  room?: string;
}

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(origin => origin.trim()),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(private chatService: ChatService) {}

  afterInit(server: Server) {
    this.logger.log('Chat Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.chatService.removeSocketUser(client.id);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string; room: string; guildId?: string },
  ) {
    const { username, room, guildId } = data;

    // Leave previous room if any
    const rooms = Array.from(client.rooms);
    rooms.forEach(r => {
      if (r !== client.id) {
        client.leave(r);
      }
    });

    // Join new room
    client.join(room);
    
    // Join guild room for guild-wide events if guildId is provided
    if (guildId) {
      client.join(`guild-${guildId}`);
    }
    
    this.chatService.addSocketUser(client.id, username, room, guildId);

    // Notify room about new user
    client.to(room).emit('user-joined', {
      username,
      message: `${username} joined the room`,
      timestamp: new Date(),
    });

    // Send room users list
    const roomUsers = this.chatService.getRoomUsers(room);
    this.server.to(room).emit('room-users', roomUsers);

    this.logger.log(`${username} joined room: ${room}${guildId ? ` in guild: ${guildId}` : ''}`);
  }

  @SubscribeMessage('join-guild')
  handleJoinGuild(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { guildId: string },
  ) {
    const { guildId } = data;
    client.join(`guild-${guildId}`);
    this.logger.log(`Client ${client.id} joined guild: ${guildId}`);
  }

  // Broadcasting methods for REST API to use
  broadcastMessage(roomId: string, message: ChatMessage) {
    this.server.to(roomId).emit('new-message', message);
    this.logger.log(`Broadcasting message from ${message.author.username} in ${roomId}: ${message.content}`);
  }

  notifyNewMessage(roomId: string, notification: { messageId: string; username: string; timestamp: Date }) {
    this.server.to(roomId).emit('message-notification', notification);
    this.logger.log(`Notifying room ${roomId} of new message from ${notification.username}`);
  }

  // Channel management events
  broadcastChannelCreated(guildId: string, channel: any) {
    this.server.to(`guild-${guildId}`).emit('channel-created', {
      guildId,
      channel,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasting channel created in guild ${guildId}: ${channel.name}`);
  }

  broadcastChannelUpdated(guildId: string, channel: any) {
    this.server.to(`guild-${guildId}`).emit('channel-updated', {
      guildId,
      channel,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasting channel updated in guild ${guildId}: ${channel.name}`);
  }

  broadcastChannelDeleted(guildId: string, channelId: string, channelName: string) {
    this.server.to(`guild-${guildId}`).emit('channel-deleted', {
      guildId,
      channelId,
      channelName,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasting channel deleted in guild ${guildId}: ${channelName}`);
  }

  broadcastGuildUpdated(guildId: string, guild: any) {
    this.server.to(`guild-${guildId}`).emit('guild-updated', {
      guild,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasting guild updated: ${guild.name} (${guildId})`);
  }

  broadcastGuildDeleted(guildId: string, guildName: string) {
    this.server.to(`guild-${guildId}`).emit('guild-deleted', {
      guildId,
      guildName,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasting guild deleted: ${guildName} (${guildId})`);
  }


  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string; chatType: string },
  ) {
    const user = this.chatService.getSocketUser(client.id);
    if (!user || !data.content?.trim()) {
      this.logger.warn(`Invalid message attempt from ${client.id}: user=${!!user}, content=${!!data.content?.trim()}`);
      return;
    }

    try {
      // Use the same validation and persistence logic as REST API
      // Note: user.id in socket context is the socket ID, we need the actual user ID
      // For now, we'll use the username to find the user, but this should be improved
      // to store actual user ID in socket user data
      const actualUser = await this.chatService.getUserByUsername(user.username);
      if (!actualUser) {
        this.logger.error(`User not found for username: ${user.username}`);
        client.emit('error', 'User not found');
        return;
      }

      // Save message with proper validation
      const savedMessage = await this.chatService.saveMessage(
        data.content.trim(),
        actualUser.id,
        data.roomId
      );

      const message: ChatMessage = {
        id: savedMessage.id,
        content: savedMessage.content,
        author: {
          id: actualUser.id,
          username: user.username,
        },
        timestamp: savedMessage.timestamp,
        room: data.roomId,
      };

      // Broadcast message to room
      this.server.to(data.roomId).emit('new-message', message);
      
      this.logger.log(`Message from ${user.username} in ${data.roomId}: ${data.content}`);
    } catch (error) {
      this.logger.error(`Failed to send message from ${user.username} to ${data.roomId}:`, error);
      client.emit('error', error.message || 'Failed to send message');
    }
  }

  @SubscribeMessage('get-messages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const user = this.chatService.getSocketUser(client.id);
    if (!user) return;

    try {
      // For now, just emit empty messages - the REST API handles message fetching
      client.emit('room-messages', []);
    } catch (error) {
      this.logger.error(`Failed to get messages for room ${data.roomId}:`, error);
      client.emit('error', 'Failed to get messages');
    }
  }

  @SubscribeMessage('get-room-users')
  handleGetRoomUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; chatType: string },
  ) {
    const user = this.chatService.getSocketUser(client.id);
    if (!user) return;

    try {
      const roomUsers = this.chatService.getRoomUsers(data.roomId);
      client.emit('room-users', roomUsers);
      this.logger.log(`Sent room users for ${data.roomId}: ${roomUsers.length} users`);
    } catch (error) {
      this.logger.error(`Failed to get room users for ${data.roomId}:`, error);
      client.emit('error', 'Failed to get room users');
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const user = this.chatService.getSocketUser(client.id);
    if (!user) return;

    client.to(data.roomId).emit('user-typing', {
      userId: user.id,
      username: user.username,
    });
  }
}
