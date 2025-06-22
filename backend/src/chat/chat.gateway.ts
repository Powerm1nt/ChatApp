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
  username: string;
  message: string;
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
    this.chatService.removeUser(client.id);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string; room: string },
  ) {
    const { username, room } = data;

    // Leave previous room if any
    const rooms = Array.from(client.rooms);
    rooms.forEach(r => {
      if (r !== client.id) {
        client.leave(r);
      }
    });

    // Join new room
    client.join(room);
    this.chatService.addUser(client.id, username, room);

    // Notify room about new user
    client.to(room).emit('user-joined', {
      username,
      message: `${username} joined the room`,
      timestamp: new Date(),
    });

    // Send room users list
    const roomUsers = this.chatService.getRoomUsers(room);
    this.server.to(room).emit('room-users', roomUsers);

    this.logger.log(`${username} joined room: ${room}`);
  }

  // Broadcasting methods for REST API to use
  broadcastMessage(roomId: string, message: ChatMessage) {
    this.server.to(roomId).emit('new-message', message);
    this.logger.log(`Broadcasting message from ${message.username} in ${roomId}: ${message.message}`);
  }

  notifyNewMessage(roomId: string, notification: { messageId: string; username: string; timestamp: Date }) {
    this.server.to(roomId).emit('message-notification', notification);
    this.logger.log(`Notifying room ${roomId} of new message from ${notification.username}`);
  }


  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isTyping: boolean },
  ) {
    const user = this.chatService.getUser(client.id);
    if (!user) return;

    client.to(user.room).emit('user-typing', {
      username: user.username,
      isTyping: data.isTyping,
    });
  }
}
