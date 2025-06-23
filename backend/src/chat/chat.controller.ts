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

class CreateGuildDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  description?: string;
}

class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsString()
  description?: string;
}

@Controller('api')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  // Test endpoint without auth
  @Get('test')
  @HttpCode(HttpStatus.OK)
  async test() {
    return { message: 'Test endpoint working' };
  }

  // Guild endpoints
  @Get('guilds')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getAllGuilds() {
    const guilds = this.chatService.getAllGuilds();
    return {
      guilds: guilds.map(guild => ({
        ...guild,
        channels: guild.channels.map(channel => ({
          ...channel,
          stats: this.chatService.getChannelStats(channel.id),
        })),
      })),
    };
  }

  @Post('guilds')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createGuild(@Body(ValidationPipe) createGuildDto: CreateGuildDto) {
    const guild = this.chatService.createGuild(createGuildDto.name, createGuildDto.description);
    return guild;
  }

  @Get('guilds/:guildId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getGuild(@Param('guildId') guildId: string) {
    const guild = this.chatService.getGuild(guildId);
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    return {
      ...guild,
      channels: guild.channels.map(channel => ({
        ...channel,
        stats: this.chatService.getChannelStats(channel.id),
      })),
    };
  }

  @Get('guilds/:guildId/channels')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getGuildChannels(@Param('guildId') guildId: string) {
    const guild = this.chatService.getGuild(guildId);
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const channels = this.chatService.getGuildChannels(guildId);
    return {
      guildId,
      channels: channels.map(channel => ({
        ...channel,
        stats: this.chatService.getChannelStats(channel.id),
      })),
    };
  }

  @Post('guilds/:guildId/channels')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createChannel(
    @Param('guildId') guildId: string,
    @Body(ValidationPipe) createChannelDto: CreateChannelDto
  ) {
    const channel = this.chatService.createChannel(guildId, createChannelDto.name, createChannelDto.description);
    if (!channel) {
      throw new NotFoundException('Guild not found');
    }
    return channel;
  }

  // Legacy endpoint for backward compatibility
  @Get('chats')
  @UseGuards(AuthGuard('jwt'))
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

  @Get('guilds/:guildId/channels/:channelId/messages')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getChannelMessages(
    @Param('guildId') guildId: string,
    @Param('channelId') channelId: string
  ) {
    if (!guildId || guildId.trim() === '') {
      throw new BadRequestException('Guild ID is required');
    }
    if (!channelId || channelId.trim() === '') {
      throw new BadRequestException('Channel ID is required');
    }

    const guild = this.chatService.getGuild(guildId);
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const channel = this.chatService.getChannel(channelId);
    if (!channel || channel.guildId !== guildId) {
      throw new NotFoundException('Channel not found in this guild');
    }

    const messages = this.chatService.getRoomMessages(channelId);
    const channelUsers = this.chatService.getRoomUsers(channelId);

    return {
      guildId,
      channelId,
      messages,
      users: channelUsers,
      stats: this.chatService.getChannelStats(channelId),
    };
  }

  // Legacy endpoint for backward compatibility
  @Get('chats/:roomId/messages')
  @UseGuards(AuthGuard('jwt'))
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

  @Post('guilds/:guildId/channels/:channelId/messages')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async sendChannelMessage(
    @Param('guildId') guildId: string,
    @Param('channelId') channelId: string,
    @Body(ValidationPipe) sendMessageDto: SendMessageDto,
    @Request() req: any,
  ) {
    if (!guildId || guildId.trim() === '') {
      throw new BadRequestException('Guild ID is required');
    }
    if (!channelId || channelId.trim() === '') {
      throw new BadRequestException('Channel ID is required');
    }

    const guild = this.chatService.getGuild(guildId);
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const channel = this.chatService.getChannel(channelId);
    if (!channel || channel.guildId !== guildId) {
      throw new NotFoundException('Channel not found in this guild');
    }

    // Create the message
    const chatMessage: ChatMessage = {
      id: this.chatService.generateMessageId(),
      username: sendMessageDto.username,
      message: sendMessageDto.message.trim(),
      timestamp: new Date(),
      room: channelId,
    };

    // Save the message
    this.chatService.saveMessage(chatMessage);

    // Broadcast the message to all users in the channel via WebSocket
    this.chatGateway.broadcastMessage(channelId, chatMessage);

    // Notify the channel that there's a new message (for clients to refresh)
    this.chatGateway.notifyNewMessage(channelId, {
      messageId: chatMessage.id,
      username: chatMessage.username,
      timestamp: chatMessage.timestamp,
    });

    return {
      success: true,
      message: chatMessage,
    };
  }

  // Legacy endpoint for backward compatibility
  @Post('chats/:roomId/messages')
  @UseGuards(AuthGuard('jwt'))
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

  @Get('guilds/:guildId/channels/:channelId/users')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getChannelUsers(
    @Param('guildId') guildId: string,
    @Param('channelId') channelId: string
  ) {
    if (!guildId || guildId.trim() === '') {
      throw new BadRequestException('Guild ID is required');
    }
    if (!channelId || channelId.trim() === '') {
      throw new BadRequestException('Channel ID is required');
    }

    const guild = this.chatService.getGuild(guildId);
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    const channel = this.chatService.getChannel(channelId);
    if (!channel || channel.guildId !== guildId) {
      throw new NotFoundException('Channel not found in this guild');
    }

    const users = this.chatService.getRoomUsers(channelId);
    return {
      guildId,
      channelId,
      users,
      count: users.length,
    };
  }

  // Legacy endpoint for backward compatibility
  @Get('chats/:roomId/users')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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