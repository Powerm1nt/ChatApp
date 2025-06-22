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

  @SubscribeMessage('send-message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string },
  ) {
    const user = this.chatService.getUser(client.id);
    if (!user) {
      client.emit('error', 'User not found. Please join a room first.');
      return;
    }

    const chatMessage: ChatMessage = {
      id: this.chatService.generateMessageId(),
      username: user.username,
      message: data.message,
      timestamp: new Date(),
      room: user.room,
    };

    // Save message
    this.chatService.saveMessage(chatMessage);

    // Broadcast to room
    this.server.to(user.room).emit('new-message', chatMessage);

    this.logger.log(`Message from ${user.username} in ${user.room}: ${data.message}`);
  }

  @SubscribeMessage('get-messages')
  handleGetMessages(@ConnectedSocket() client: Socket) {
    const user = this.chatService.getUser(client.id);
    if (!user) {
      client.emit('error', 'User not found. Please join a room first.');
      return;
    }

    const messages = this.chatService.getRoomMessages(user.room);
    client.emit('room-messages', messages);
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
