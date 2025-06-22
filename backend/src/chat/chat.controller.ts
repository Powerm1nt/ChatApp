import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { ChatGateway, ChatMessage } from './chat.gateway';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  description?: string;
}

@Controller('api/chats')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllRooms() {
    const rooms = this.chatService.getAllRooms();
    return {
      rooms: rooms.map(room => ({
        id: room,
        name: room,
        stats: this.chatService.getRoomStats(room),
      })),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRoom(@Body(ValidationPipe) createRoomDto: CreateRoomDto) {
    // For now, we'll just add the room to the service
    // In a real app, you might want to store room metadata
    const roomName = createRoomDto.name.toLowerCase().replace(/\s+/g, '-');
    
    return {
      id: roomName,
      name: createRoomDto.name,
      description: createRoomDto.description,
      createdAt: new Date(),
    };
  }

  @Get(':roomId/messages')
  @HttpCode(HttpStatus.OK)
  async getRoomMessages(@Param('roomId') roomId: string) {
    if (!roomId || roomId.trim() === '') {
      throw new BadRequestException('Room ID is required');
    }

    const messages = this.chatService.getRoomMessages(roomId);
    const roomUsers = this.chatService.getRoomUsers(roomId);

    return {
      roomId,
      messages,
      users: roomUsers,
      stats: this.chatService.getRoomStats(roomId),
    };
  }

  @Post(':roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body(ValidationPipe) sendMessageDto: SendMessageDto,
    @Request() req: any,
  ) {
    if (!roomId || roomId.trim() === '') {
      throw new BadRequestException('Room ID is required');
    }

    // Create the message
    const chatMessage: ChatMessage = {
      id: this.chatService.generateMessageId(),
      username: sendMessageDto.username,
      message: sendMessageDto.message.trim(),
      timestamp: new Date(),
      room: roomId,
    };

    // Save the message
    this.chatService.saveMessage(chatMessage);

    // Broadcast the message to all users in the room via WebSocket
    this.chatGateway.broadcastMessage(roomId, chatMessage);

    // Notify the room that there's a new message (for clients to refresh)
    this.chatGateway.notifyNewMessage(roomId, {
      messageId: chatMessage.id,
      username: chatMessage.username,
      timestamp: chatMessage.timestamp,
    });

    return {
      success: true,
      message: chatMessage,
    };
  }

  @Get(':roomId/users')
  @HttpCode(HttpStatus.OK)
  async getRoomUsers(@Param('roomId') roomId: string) {
    if (!roomId || roomId.trim() === '') {
      throw new BadRequestException('Room ID is required');
    }

    const users = this.chatService.getRoomUsers(roomId);
    return {
      roomId,
      users,
      count: users.length,
    };
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getGlobalStats() {
    const rooms = this.chatService.getAllRooms();
    const totalUsers = this.chatService.getActiveUsersCount();

    return {
      totalRooms: rooms.length,
      totalActiveUsers: totalUsers,
      rooms: rooms.map(room => ({
        id: room,
        name: room,
        ...this.chatService.getRoomStats(room),
      })),
    };
  }
}