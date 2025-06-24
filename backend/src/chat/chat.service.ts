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
  status: 'online' | 'away' | 'offline';
  role?: 'owner' | 'admin' | 'member';
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
    console.log(`Checking guild access for user ${userId} in guild ${guildId}`);
    const userGuild = await this.userGuildRepository.findOne({
      user: userId,
      guild: guildId,
    });
    console.log(`Guild access result:`, userGuild ? 'GRANTED' : 'DENIED');
    return !!userGuild;
  }

  // Check if user has access to channel (must be member of the guild)
  async checkUserChannelAccess(userId: string, channelId: string): Promise<boolean> {
    console.log(`Checking channel access for user ${userId} to channel ${channelId}`);
    
    // Find the channel with its guild information
    const channel = await this.channelRepository.findOne(
      { id: channelId },
      { populate: ['guild'] }
    );
    
    if (!channel) {
      console.log(`Channel ${channelId} not found`);
      return false;
    }
    
    console.log(`Channel found: ${channel.name} in guild ${channel.guild.id}`);
    
    // Check if user has access to the guild that owns this channel
    const hasGuildAccess = await this.checkUserGuildAccess(userId, channel.guild.id);
    console.log(`Guild access result for user ${userId} in guild ${channel.guild.id}: ${hasGuildAccess}`);
    
    return hasGuildAccess;
  }

  addSocketUser(socketId: string, username: string, room: string, guildId?: string): SocketUser {
    const user: SocketUser = {
      id: socketId,
      username,
      room,
      guildId: guildId || '',
      joinedAt: new Date(),
      status: 'online',
      role: 'member', // Default role, can be updated based on guild membership
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
    console.log(`Attempting to save message from user ${authorId} to channel ${channelId}`);
    
    // First, check if the channel exists
    let channel = await this.channelRepository.findOne(
      { id: channelId },
      { populate: ['guild'] }
    );
    
    // If channel doesn't exist, try to find a guild the user has access to and create/use a default channel
    if (!channel) {
      console.log(`Channel ${channelId} not found, attempting to find or create a default channel for user ${authorId}`);
      
      let userGuilds = await this.getUserGuilds(authorId);
      
      // If user has no guilds, they need to create or join a guild first
      if (userGuilds.length === 0) {
        console.log(`User ${authorId} has no guild access`);
        throw new ForbiddenException('You do not have access to any guilds. Please create or join a guild first.');
      }
      
      // Use the first guild the user has access to
      const guild = userGuilds[0];
      console.log(`User has access to guild ${guild.id}, checking for existing channels`);
      
      const existingChannels = await this.channelRepository.find({ guild: guild.id });
      if (existingChannels.length === 0) {
        console.log(`Guild ${guild.id} has no channels, creating default channel`);
        const defaultChannel = new Channel();
        defaultChannel.name = 'general';
        defaultChannel.description = 'General discussion channel';
        defaultChannel.guild = guild;

        await this.channelRepository.persistAndFlush(defaultChannel);
        console.log(`Created default channel '${defaultChannel.name}' with ID: ${defaultChannel.id} for guild ${guild.id}`);
        channel = defaultChannel;
      } else {
        // Use the first existing channel
        channel = existingChannels[0];
        console.log(`Using existing channel ${channel.id} (${channel.name}) from guild ${guild.id}`);
      }
    }
    
    // Now check if user has access to the channel (or the fallback channel)
    const hasAccess = await this.checkUserChannelAccess(authorId, channel.id);
    console.log(`Channel access check result for channel ${channel.id}: ${hasAccess}`);
    if (!hasAccess) {
      console.error(`Access denied for user ${authorId} to channel ${channel.id}`);
      throw new ForbiddenException('You do not have access to this channel');
    }

    const author = await this.userRepository.findOne({ id: authorId });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const message = new Message();
    message.content = content;
    message.author = author;
    message.channel = channel;

    await this.messageRepository.persistAndFlush(message);
    return message;
  }

  async getChannelMessages(channelId: string, userId: string): Promise<Message[]> {
    console.log(`Getting messages for channel ${channelId} for user ${userId}`);
    
    // First, check if the channel exists
    const channel = await this.channelRepository.findOne(
      { id: channelId },
      { populate: ['guild'] }
    );
    
    // If channel doesn't exist, return empty array - don't leak data from other channels
    if (!channel) {
      console.log(`Channel ${channelId} not found`);
      throw new NotFoundException('Channel not found');
    }
    
    // Check if user has access to the channel
    const hasAccess = await this.checkUserChannelAccess(userId, channel.id);
    console.log(`Channel access check result for channel ${channel.id}: ${hasAccess}`);
    if (!hasAccess) {
      console.error(`Access denied for user ${userId} to channel ${channel.id}`);
      throw new ForbiddenException('You do not have access to this channel');
    }

    return this.messageRepository.find(
      { channel: channel.id },
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
    console.log(`Getting stats for channel ${channelId} for user ${userId}`);
    
    // First, check if the channel exists
    const channel = await this.channelRepository.findOne(
      { id: channelId },
      { populate: ['guild'] }
    );
    
    // If channel doesn't exist, return empty stats - don't leak data from other channels
    if (!channel) {
      console.log(`Channel ${channelId} not found`);
      throw new NotFoundException('Channel not found');
    }
    
    // Check if user has access to the channel
    const hasAccess = await this.checkUserChannelAccess(userId, channel.id);
    console.log(`Channel access check result for channel ${channel.id}: ${hasAccess}`);
    if (!hasAccess) {
      console.error(`Access denied for user ${userId} to channel ${channel.id}`);
      throw new ForbiddenException('You do not have access to this channel');
    }

    const socketUsers = this.getRoomUsers(channel.id);
    const messageCount = await this.messageRepository.count({ channel: channel.id });

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

  // Get active users in a specific guild
  getGuildActiveUsers(guildId: string): SocketUser[] {
    return Array.from(this.socketUsers.values()).filter(user => user.guildId === guildId);
  }

  // Get guild member count
  async getGuildMemberCount(guildId: string): Promise<number> {
    const memberCount = await this.userGuildRepository.count({ guild: guildId });
    return memberCount;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return Array.from(this.socketUsers.values()).some(user => user.id === userId);
  }

  // Get user's last activity (simplified - using current time if online)
  getUserLastActivity(userId: string): Date | null {
    const socketUser = Array.from(this.socketUsers.values()).find(user => user.id === userId);
    return socketUser ? socketUser.joinedAt : null;
  }

  // Check if requesting user can view target user's status
  async canUserViewUserStatus(requestingUserId: string, targetUserId: string): Promise<boolean> {
    // Users can view status of other users if they share at least one guild
    const requestingUserGuilds = await this.getUserGuilds(requestingUserId);
    const targetUserGuilds = await this.getUserGuilds(targetUserId);
    
    const sharedGuilds = requestingUserGuilds.filter(rGuild => 
      targetUserGuilds.some(tGuild => tGuild.id === rGuild.id)
    );
    
    return sharedGuilds.length > 0;
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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

    // Check if guild has no channels and create a default one
    if (guild.channels.length === 0) {
      console.log(`[DEBUG] Guild ${guildId} has no channels, creating default channel`);
      const defaultChannel = new Channel();
      defaultChannel.name = 'general';
      defaultChannel.description = 'General discussion channel';
      defaultChannel.guild = guild;

      await this.channelRepository.persistAndFlush(defaultChannel);
      console.log(`[DEBUG] Created default channel '${defaultChannel.name}' with ID: ${defaultChannel.id} for existing guild ${guild.id}`);
      
      // Reload guild with channels
      await guild.channels.init();
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

    // Create a default "general" channel for the new guild
    const defaultChannel = new Channel();
    defaultChannel.name = 'general';
    defaultChannel.description = 'General discussion channel';
    defaultChannel.guild = guild;

    await this.channelRepository.persistAndFlush(defaultChannel);
    console.log(`[DEBUG] Created default channel '${defaultChannel.name}' with ID: ${defaultChannel.id} for guild ${guild.id}`);

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

    let channels = await this.channelRepository.find({ guild: guildId });
    
    // If no channels exist, create a default one
    if (channels.length === 0) {
      console.log(`[DEBUG] Guild ${guildId} has no channels, creating default channel`);
      const guild = await this.guildRepository.findOneOrFail({ id: guildId });
      
      const defaultChannel = new Channel();
      defaultChannel.name = 'general';
      defaultChannel.description = 'General discussion channel';
      defaultChannel.guild = guild;

      await this.channelRepository.persistAndFlush(defaultChannel);
      console.log(`[DEBUG] Created default channel '${defaultChannel.name}' with ID: ${defaultChannel.id} for existing guild ${guild.id}`);
      
      channels = [defaultChannel];
    }

    return channels;
  }

  async getChannel(channelId: string, userId: string): Promise<Channel> {
    console.log(`Getting channel ${channelId} for user ${userId}`);
    
    // First, check if the channel exists
    let channel = await this.channelRepository.findOne(
      { id: channelId },
      { populate: ['guild'] }
    );
    
    // If channel doesn't exist, try to find a guild the user has access to and use a default channel
    if (!channel) {
      console.log(`Channel ${channelId} not found, attempting to find a default channel for user ${userId}`);
      
      const userGuilds = await this.getUserGuilds(userId);
      if (userGuilds.length === 0) {
        console.error(`User ${userId} has no guild access`);
        throw new ForbiddenException('You do not have access to any guilds');
      }
      
      // Use the first guild the user has access to
      const guild = userGuilds[0];
      console.log(`User has access to guild ${guild.id}, checking for existing channels`);
      
      const existingChannels = await this.channelRepository.find({ guild: guild.id });
      if (existingChannels.length === 0) {
        console.log(`Guild ${guild.id} has no channels, creating default channel`);
        const defaultChannel = new Channel();
        defaultChannel.name = 'general';
        defaultChannel.description = 'General discussion channel';
        defaultChannel.guild = guild;

        await this.channelRepository.persistAndFlush(defaultChannel);
        console.log(`Created default channel '${defaultChannel.name}' with ID: ${defaultChannel.id} for guild ${guild.id}`);
        channel = defaultChannel;
      } else {
        // Use the first existing channel
        channel = existingChannels[0];
        console.log(`Using existing channel ${channel.id} (${channel.name}) from guild ${guild.id}`);
      }
    }
    
    // Now check if user has access to the channel (or the fallback channel)
    const hasAccess = await this.checkUserChannelAccess(userId, channel.id);
    console.log(`Channel access check result for channel ${channel.id}: ${hasAccess}`);
    if (!hasAccess) {
      console.error(`Access denied for user ${userId} to channel ${channel.id}`);
      throw new ForbiddenException('You do not have access to this channel');
    }

    return channel;
  }

  async createChannel(guildId: string, name: string, userId: string, description?: string): Promise<Channel> {
    console.log(`[DEBUG] createChannel called - guildId: ${guildId}, name: ${name}, userId: ${userId}`);
    
    const hasAccess = await this.checkUserGuildAccess(userId, guildId);
    if (!hasAccess) {
      console.log(`[DEBUG] createChannel - User ${userId} does not have access to guild ${guildId}`);
      throw new ForbiddenException('You do not have access to this guild');
    }

    console.log(`[DEBUG] createChannel - User has access, finding guild ${guildId}`);
    const guild = await this.guildRepository.findOneOrFail({ id: guildId });
    console.log(`[DEBUG] createChannel - Guild found: ${guild.id}, name: ${guild.name}`);

    const channel = new Channel();
    channel.name = name;
    channel.description = description;
    channel.guild = guild;

    console.log(`[DEBUG] createChannel - About to persist channel: ${channel.name}`);
    await this.channelRepository.persistAndFlush(channel);
    console.log(`[DEBUG] createChannel - Channel persisted with ID: ${channel.id}`);
    
    return channel;
  }

  async updateChannel(guildId: string, channelId: string, userId: string, updateData: { name?: string; description?: string }): Promise<Channel> {
    const hasAccess = await this.checkUserGuildAccess(userId, guildId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this guild');
    }

    const channel = await this.channelRepository.findOne({ 
      id: channelId, 
      guild: { id: guildId } 
    }, { populate: ['guild'] });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (updateData.name !== undefined) {
      channel.name = updateData.name;
    }
    if (updateData.description !== undefined) {
      channel.description = updateData.description;
    }

    await this.channelRepository.persistAndFlush(channel);
    return channel;
  }

  async deleteChannel(guildId: string, channelId: string, userId: string): Promise<void> {
    const hasAccess = await this.checkUserGuildAccess(userId, guildId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this guild');
    }

    const channel = await this.channelRepository.findOne({ 
      id: channelId, 
      guild: { id: guildId } 
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.channelRepository.removeAndFlush(channel);
  }
}