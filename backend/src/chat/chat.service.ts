import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { ChatMessage } from './chat.gateway';
import { User, Guild, Channel, UserGuild, Message, UserGuildRole } from '../entities';

export interface SocketUser {
  id: string;
  username: string;
  room: string;
  guildId: string;
  joinedAt: Date;
}

@Injectable()
export class ChatService {
  private socketUsers: Map<string, SocketUser> = new Map();

  constructor(
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
    @InjectRepository(Guild)
    private guildRepository: EntityRepository<Guild>,
    @InjectRepository(Channel)
    private channelRepository: EntityRepository<Channel>,
    @InjectRepository(UserGuild)
    private userGuildRepository: EntityRepository<UserGuild>,
    @InjectRepository(Message)
    private messageRepository: EntityRepository<Message>,
  ) {}

  // Check if user has access to guild
  async checkUserGuildAccess(userId: string, guildId: string): Promise<boolean> {
    const userGuild = await this.userGuildRepository.findOne({
      user: userId,
      guild: guildId,
    });
    return !!userGuild;
  }

  // Check if user has access to channel (must be member of the guild)
  async checkUserChannelAccess(userId: string, channelId: string): Promise<boolean> {
    const channel = await this.channelRepository.findOne(
      { id: channelId },
      { populate: ['guild'] }
    );
    if (!channel) return false;

    return this.checkUserGuildAccess(userId, channel.guild.id);
  }

  addSocketUser(socketId: string, username: string, room: string, guildId?: string): SocketUser {
    const user: SocketUser = {
      id: socketId,
      username,
      room,
      guildId: guildId || '',
      joinedAt: new Date(),
    };

    this.socketUsers.set(socketId, user);
    return user;
  }

  removeSocketUser(socketId: string): SocketUser | null {
    const user = this.socketUsers.get(socketId);
    if (user) {
      this.socketUsers.delete(socketId);
      return user;
    }
    return null;
  }

  getSocketUser(socketId: string): SocketUser | null {
    return this.socketUsers.get(socketId) || null;
  }

  getRoomUsers(room: string): SocketUser[] {
    return Array.from(this.socketUsers.values()).filter(user => user.room === room);
  }

  async saveMessage(content: string, authorId: string, channelId: string): Promise<Message> {
    // Check if user has access to the channel
    const hasAccess = await this.checkUserChannelAccess(authorId, channelId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    const author = await this.userRepository.findOne({ id: authorId });
    const channel = await this.channelRepository.findOne({ id: channelId });

    if (!author || !channel) {
      throw new NotFoundException('Author or channel not found');
    }

    const message = new Message();
    message.content = content;
    message.author = author;
    message.channel = channel;

    await this.messageRepository.persistAndFlush(message);
    return message;
  }

  async getChannelMessages(channelId: string, userId: string): Promise<Message[]> {
    // Check if user has access to the channel
    const hasAccess = await this.checkUserChannelAccess(userId, channelId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    return this.messageRepository.find(
      { channel: channelId },
      { 
        populate: ['author'],
        orderBy: { timestamp: 'ASC' },
        limit: 100
      }
    );
  }

  // Get channel statistics
  async getChannelStats(channelId: string, userId: string): Promise<{
    userCount: number;
    messageCount: number;
    users: string[];
  }> {
    // Check if user has access to the channel
    const hasAccess = await this.checkUserChannelAccess(userId, channelId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    const socketUsers = this.getRoomUsers(channelId);
    const messageCount = await this.messageRepository.count({ channel: channelId });

    return {
      userCount: socketUsers.length,
      messageCount,
      users: socketUsers.map(user => user.username),
    };
  }

  // Get all active socket users count
  getActiveUsersCount(): number {
    return this.socketUsers.size;
  }

  // Guild management methods
  async getUserGuilds(userId: string): Promise<Guild[]> {
    const userGuilds = await this.userGuildRepository.find(
      { user: userId },
      { populate: ['guild', 'guild.channels'] }
    );
    return userGuilds.map(ug => ug.guild);
  }

  async getGuild(guildId: string, userId: string): Promise<Guild> {
    const hasAccess = await this.checkUserGuildAccess(userId, guildId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this guild');
    }

    const guild = await this.guildRepository.findOne(
      { id: guildId },
      { populate: ['channels'] }
    );
    
    if (!guild) {
      throw new NotFoundException('Guild not found');
    }

    return guild;
  }

  async createGuild(name: string, ownerId: string, description?: string): Promise<Guild> {
    const guild = new Guild();
    guild.name = name;
    guild.description = description;

    await this.guildRepository.persistAndFlush(guild);

    // Add the creator as owner
    const userGuild = new UserGuild();
    userGuild.user = await this.userRepository.findOneOrFail({ id: ownerId });
    userGuild.guild = guild;
    userGuild.role = UserGuildRole.OWNER;

    await this.userGuildRepository.persistAndFlush(userGuild);

    return guild;
  }

  async joinGuild(guildId: string, userId: string): Promise<UserGuild> {
    // Check if user is already a member
    const existingMembership = await this.userGuildRepository.findOne({
      user: userId,
      guild: guildId,
    });

    if (existingMembership) {
      throw new ForbiddenException('User is already a member of this guild');
    }

    const user = await this.userRepository.findOneOrFail({ id: userId });
    const guild = await this.guildRepository.findOneOrFail({ id: guildId });

    const userGuild = new UserGuild();
    userGuild.user = user;
    userGuild.guild = guild;
    userGuild.role = UserGuildRole.MEMBER;

    await this.userGuildRepository.persistAndFlush(userGuild);
    return userGuild;
  }

  // Channel management methods
  async getGuildChannels(guildId: string, userId: string): Promise<Channel[]> {
    const hasAccess = await this.checkUserGuildAccess(userId, guildId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this guild');
    }

    return this.channelRepository.find({ guild: guildId });
  }

  async getChannel(channelId: string, userId: string): Promise<Channel> {
    const hasAccess = await this.checkUserChannelAccess(userId, channelId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    const channel = await this.channelRepository.findOne(
      { id: channelId },
      { populate: ['guild'] }
    );

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  async createChannel(guildId: string, name: string, userId: string, description?: string): Promise<Channel> {
    const hasAccess = await this.checkUserGuildAccess(userId, guildId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this guild');
    }

    const guild = await this.guildRepository.findOneOrFail({ id: guildId });

    const channel = new Channel();
    channel.name = name;
    channel.description = description;
    channel.guild = guild;

    await this.channelRepository.persistAndFlush(channel);
    return channel;
  }
}