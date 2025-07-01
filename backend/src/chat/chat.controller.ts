import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ChatService } from "./chat.service";
import { ChatGateway, ChatMessage } from "./chat.gateway";
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from "class-validator";
import { InvitationService } from '../invitation/invitation.service';

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

  @IsOptional()
  @IsString()
  description?: string;
}

class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateGuildDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class CreateGuildInvitationDto {
  @IsOptional()
  @IsString()
  inviteeId?: string;
}

@Controller("api")
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly invitationService: InvitationService
  ) {}

  // Test endpoint without auth
  @Get("test")
  @HttpCode(HttpStatus.OK)
  async test() {
    return { message: "Test endpoint working" };
  }

  // Guild endpoints
  @Get("guilds")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getUserGuilds(@Request() req: any) {
    const userId = req.user.id;
    const guilds = await this.chatService.getUserGuilds(userId);

    const guildsWithStats = await Promise.all(
      guilds.map(async (guild) => ({
        ...guild,
        channels: await Promise.all(
          guild.channels.getItems().map(async (channel) => ({
            ...channel,
            stats: await this.chatService.getChannelStats(channel.id, userId),
          }))
        ),
      }))
    );

    return { guilds: guildsWithStats };
  }

  @Post("guilds")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.CREATED)
  async createGuild(
    @Body(ValidationPipe) createGuildDto: CreateGuildDto,
    @Request() req: any
  ) {
    const userId = req.user.id;
    const guild = await this.chatService.createGuild(
      createGuildDto.name,
      userId,
      createGuildDto.description
    );
    return guild;
  }

  @Get("guilds/:guildId")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getGuild(@Param("guildId") guildId: string, @Request() req: any) {
    const userId = req.user.id;
    const guild = await this.chatService.getGuild(guildId, userId);

    const channelsWithStats = await Promise.all(
      guild.channels.getItems().map(async (channel) => ({
        ...channel,
        stats: await this.chatService.getChannelStats(channel.id, userId),
      }))
    );

    return {
      ...guild,
      channels: channelsWithStats,
    };
  }

  @Put("guilds/:guildId")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async updateGuild(
    @Param("guildId") guildId: string,
    @Body(ValidationPipe) updateGuildDto: UpdateGuildDto,
    @Request() req: any
  ) {
    const userId = req.user.id;
    const updatedGuild = await this.chatService.updateGuild(
      guildId,
      userId,
      updateGuildDto
    );

    // Broadcast guild update to all guild members
    this.chatGateway.broadcastGuildUpdated(guildId, updatedGuild);

    return updatedGuild;
  }

  @Delete("guilds/:guildId")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGuild(@Param("guildId") guildId: string, @Request() req: any) {
    const userId = req.user.id;

    // Get guild info before deletion for broadcasting
    const guild = await this.chatService.getGuild(guildId, userId);

    await this.chatService.deleteGuild(guildId, userId);

    // Broadcast guild deletion to all guild members
    this.chatGateway.broadcastGuildDeleted(guildId, guild.name);

    return { success: true };
  }

  @Get("guilds/:guildId/channels")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getGuildChannels(
    @Param("guildId") guildId: string,
    @Request() req: any
  ) {
    const userId = req.user.id;
    const channels = await this.chatService.getGuildChannels(guildId, userId);

    const channelsWithStats = await Promise.all(
      channels.map(async (channel) => ({
        ...channel,
        stats: await this.chatService.getChannelStats(channel.id, userId),
      }))
    );

    return {
      guildId,
      channels: channelsWithStats,
    };
  }

  @Post("guilds/:guildId/channels")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.CREATED)
  async createChannel(
    @Param("guildId") guildId: string,
    @Body(ValidationPipe) createChannelDto: CreateChannelDto,
    @Request() req: any
  ) {
    const userId = req.user.id;
    const channel = await this.chatService.createChannel(
      guildId,
      createChannelDto.name,
      userId,
      createChannelDto.description
    );

    // Broadcast channel creation to all guild members
    this.chatGateway.broadcastChannelCreated(guildId, channel);

    return channel;
  }

  @Put("guilds/:guildId/channels/:channelId")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async updateChannel(
    @Param("guildId") guildId: string,
    @Param("channelId") channelId: string,
    @Body(ValidationPipe) updateChannelDto: UpdateChannelDto,
    @Request() req: any
  ) {
    const userId = req.user.id;
    const updatedChannel = await this.chatService.updateChannel(
      guildId,
      channelId,
      userId,
      updateChannelDto
    );

    // Broadcast channel update to all guild members
    this.chatGateway.broadcastChannelUpdated(guildId, updatedChannel);

    return updatedChannel;
  }

  @Delete("guilds/:guildId/channels/:channelId")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChannel(
    @Param("guildId") guildId: string,
    @Param("channelId") channelId: string,
    @Request() req: any
  ) {
    const userId = req.user.id;

    // Get channel info before deletion for broadcasting
    const channel = await this.chatService.getChannel(channelId, userId);

    await this.chatService.deleteChannel(guildId, channelId, userId);

    // Broadcast channel deletion to all guild members
    this.chatGateway.broadcastChannelDeleted(guildId, channelId, channel.name);

    return { success: true };
  }

  // Legacy endpoint - removed for security

  // Legacy endpoint - removed for security

  @Get("guilds/:guildId/channels/:channelId/messages")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getChannelMessages(
    @Param("guildId") guildId: string,
    @Param("channelId") channelId: string,
    @Request() req: any
  ) {
    const userId = req.user.id;
    const messages = await this.chatService.getChannelMessages(
      channelId,
      userId
    );
    const channelUsers = this.chatService.getRoomUsers(channelId);
    const stats = await this.chatService.getChannelStats(channelId, userId);

    return {
      guildId,
      channelId,
      messages,
      users: channelUsers,
      stats,
    };
  }

  // Legacy endpoint - removed for security

  @Post("guilds/:guildId/channels/:channelId/messages")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.CREATED)
  async sendChannelMessage(
    @Param("guildId") guildId: string,
    @Param("channelId") channelId: string,
    @Body(ValidationPipe) sendMessageDto: SendMessageDto,
    @Request() req: any
  ) {
    const userId = req.user.id;

    // Save the message to database
    const message = await this.chatService.saveMessage(
      sendMessageDto.message.trim(),
      userId,
      channelId
    ); // Create chat message for WebSocket broadcast
    const chatMessage: ChatMessage = {
      id: message.id,
      content: message.content,
      author: {
        id: userId,
        username: sendMessageDto.username,
      },
      timestamp: message.timestamp,
      room: channelId,
    };

    // Broadcast the message to all users in the channel via WebSocket
    this.chatGateway.broadcastMessage(channelId, chatMessage);

    // Notify the channel that there's a new message (for clients to refresh)
    this.chatGateway.notifyNewMessage(channelId, {
      messageId: message.id,
      username: sendMessageDto.username,
      timestamp: message.timestamp,
    });

    return {
      success: true,
      message: message,
    };
  }

  // Legacy endpoint - removed for security

  @Get("guilds/:guildId/channels/:channelId/users")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getChannelUsers(
    @Param("guildId") guildId: string,
    @Param("channelId") channelId: string,
    @Request() req: any
  ) {
    const userId = req.user.id;

    // Check access to channel
    await this.chatService.getChannel(channelId, userId);

    const users = this.chatService.getRoomUsers(channelId);
    return {
      guildId,
      channelId,
      users,
      count: users.length,
    };
  }

  // Legacy endpoint - removed for security

  @Get("stats")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getGlobalStats(@Request() req: any) {
    const userId = req.user.id;
    const guilds = await this.chatService.getUserGuilds(userId);
    const activeUsers = this.chatService.getActiveUsersCount();

    return {
      totalGuilds: guilds.length,
      activeUsers,
      guilds: guilds.map((guild) => ({
        id: guild.id,
        name: guild.name,
        channelCount: guild.channels.length,
      })),
    };
  }

  // Guild status endpoint
  @Get("guilds/:guildId/status")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getGuildStatus(@Param("guildId") guildId: string, @Request() req: any) {
    const userId = req.user.id;
    const guild = await this.chatService.getGuild(guildId, userId);
    const activeUsers = this.chatService.getGuildActiveUsers(guildId);
    const channelCount = guild.channels.length;
    const memberCount = await this.chatService.getGuildMemberCount(guildId);

    return {
      guildId,
      name: guild.name,
      status: "active",
      timestamp: new Date().toISOString(),
      stats: {
        memberCount,
        channelCount,
        activeUsers: activeUsers.length,
        createdAt: guild.createdAt,
      },
      health: {
        database: "connected",
        channels: channelCount > 0 ? "available" : "empty",
        members: memberCount > 0 ? "active" : "inactive",
      },
    };
  }

  // User status endpoint
  @Get("users/:userId/status")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getUserStatus(
    @Param("userId") targetUserId: string,
    @Request() req: any
  ) {
    const requestingUserId = req.user.id;

    // Users can only view their own status or status of users in their guilds
    const canViewStatus =
      requestingUserId === targetUserId ||
      (await this.chatService.canUserViewUserStatus(
        requestingUserId,
        targetUserId
      ));

    if (!canViewStatus) {
      throw new BadRequestException("You cannot view this user's status");
    }

    const user = await this.chatService.getUserById(targetUserId);
    const userGuilds = await this.chatService.getUserGuilds(targetUserId);
    const isOnline = this.chatService.isUserOnline(targetUserId);
    const lastActivity = this.chatService.getUserLastActivity(targetUserId);

    return {
      userId: targetUserId,
      username: user.username || user.email,
      status: isOnline ? "online" : "offline",
      timestamp: new Date().toISOString(),
      stats: {
        guildCount: userGuilds.length,
        joinedAt: user.createdAt,
        lastActivity: lastActivity || user.createdAt,
      },
      health: {
        connection: isOnline ? "connected" : "disconnected",
        guilds: userGuilds.length > 0 ? "member" : "no-guilds",
        account: user.isAnonymous ? "anonymous" : "registered",
      },
    };
  }

  @Post("guilds/:guildId/invitations")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.CREATED)
  async createGuildInvitation(
    @Param("guildId") guildId: string,
    @Body(ValidationPipe) body: CreateGuildInvitationDto,
    @Request() req: any
  ) {
    const inviterId = req.user.id;
    const code = await this.invitationService.createGuildInvitation(guildId, inviterId, body.inviteeId);
    return { code };
  }

  @Post("chats/:userId/messages")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.CREATED)
  async sendDirectMessage(
    @Param("userId") userId: string,
    @Body(ValidationPipe) sendMessageDto: SendMessageDto,
    @Request() req: any
  ) {
    const senderId = req.user.id;
    const message = await this.chatService.saveDirectMessage(
      sendMessageDto.message.trim(),
      senderId,
      userId
    );
    return { success: true, message };
  }

  @Get("chats/:userId/messages")
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async getDirectMessages(
    @Param("userId") userId: string,
    @Request() req: any
  ) {
    const currentUserId = req.user.id;
    const messages = await this.chatService.getDirectMessages(currentUserId, userId);
    // Map messages to include 'author' field for frontend compatibility
    const mappedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      author: {
        id: msg.sender.id,
        username: msg.sender.username,
      },
      timestamp: msg.timestamp,
    }));
    return { messages: mappedMessages };
  }
}
