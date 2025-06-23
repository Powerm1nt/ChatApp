import { Injectable } from '@nestjs/common';
import { ChatMessage } from './chat.gateway';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  room: string;
  guildId: string;
  joinedAt: Date;
}

export interface Guild {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  guildId: string;
  createdAt: Date;
}

@Injectable()
export class ChatService {
  private users: Map<string, User> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map(); // room -> messages
  private rooms: Set<string> = new Set();
  private guilds: Map<string, Guild> = new Map();
  private channels: Map<string, Channel> = new Map(); // channelId -> channel

  constructor() {
    // Initialize with a default guild and some channels
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultGuildId = this.generateLittleUuid();
    const defaultGuild: Guild = {
      id: defaultGuildId,
      name: 'Default Workspace',
      description: 'Default workspace for chat',
      createdAt: new Date(),
      channels: []
    };

    const defaultChannels: Channel[] = [
      {
        id: this.generateLittleUuid(),
        name: 'general',
        description: 'General discussion',
        guildId: defaultGuildId,
        createdAt: new Date()
      },
      {
        id: this.generateLittleUuid(),
        name: 'random',
        description: 'Random chat',
        guildId: defaultGuildId,
        createdAt: new Date()
      },
      {
        id: this.generateLittleUuid(),
        name: 'tech',
        description: 'Tech discussions',
        guildId: defaultGuildId,
        createdAt: new Date()
      }
    ];

    defaultGuild.channels = defaultChannels;
    this.guilds.set(defaultGuild.id, defaultGuild);
    
    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
      this.rooms.add(channel.id); // Keep backward compatibility
    });
  }

  addUser(socketId: string, username: string, room: string, guildId?: string): User {
    // If no guildId provided, try to find the channel's guild
    let userGuildId = guildId;
    if (!userGuildId) {
      const channel = this.channels.get(room);
      userGuildId = channel?.guildId || Array.from(this.guilds.keys())[0];
    }

    const user: User = {
      id: socketId,
      username,
      room,
      guildId: userGuildId,
      joinedAt: new Date(),
    };

    this.users.set(socketId, user);
    this.rooms.add(room);

    // Initialize room messages if not exists
    if (!this.messages.has(room)) {
      this.messages.set(room, []);
    }

    return user;
  }

  removeUser(socketId: string): User | null {
    const user = this.users.get(socketId);
    if (user) {
      this.users.delete(socketId);
      return user;
    }
    return null;
  }

  getUser(socketId: string): User | null {
    return this.users.get(socketId) || null;
  }

  getRoomUsers(room: string): User[] {
    return Array.from(this.users.values()).filter(user => user.room === room);
  }

  getAllRooms(): string[] {
    return Array.from(this.rooms);
  }

  saveMessage(message: ChatMessage): void {
    const roomMessages = this.messages.get(message.room) || [];
    roomMessages.push(message);
    this.messages.set(message.room, roomMessages);

    // Keep only last 100 messages per room to prevent memory issues
    if (roomMessages.length > 100) {
      roomMessages.splice(0, roomMessages.length - 100);
    }
  }

  getRoomMessages(room: string): ChatMessage[] {
    return this.messages.get(room) || [];
  }

  generateMessageId(): string {
    return uuidv4();
  }

  // Generate little UUID level 1 (first part of UUID)
  private generateLittleUuid(): string {
    return uuidv4().split('-')[0];
  }

  // Get room statistics
  getRoomStats(room: string): {
    userCount: number;
    messageCount: number;
    users: string[];
  } {
    const users = this.getRoomUsers(room);
    const messages = this.getRoomMessages(room);

    return {
      userCount: users.length,
      messageCount: messages.length,
      users: users.map(user => user.username),
    };
  }

  // Get all active users count
  getActiveUsersCount(): number {
    return this.users.size;
  }

  // Clean up old messages (can be called periodically)
  cleanupOldMessages(hoursOld: number = 24): void {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    this.messages.forEach((messages, room) => {
      const filteredMessages = messages.filter(
        message => new Date(message.timestamp) > cutoffTime
      );
      this.messages.set(room, filteredMessages);
    });
  }

  // Guild management methods
  getAllGuilds(): Guild[] {
    return Array.from(this.guilds.values());
  }

  getGuild(guildId: string): Guild | null {
    return this.guilds.get(guildId) || null;
  }

  createGuild(name: string, description?: string): Guild {
    const guild: Guild = {
      id: this.generateLittleUuid(),
      name,
      description,
      createdAt: new Date(),
      channels: []
    };

    this.guilds.set(guild.id, guild);
    return guild;
  }

  // Channel management methods
  getGuildChannels(guildId: string): Channel[] {
    const guild = this.guilds.get(guildId);
    return guild ? guild.channels : [];
  }

  getChannel(channelId: string): Channel | null {
    return this.channels.get(channelId) || null;
  }

  createChannel(guildId: string, name: string, description?: string): Channel | null {
    const guild = this.guilds.get(guildId);
    if (!guild) return null;

    const channel: Channel = {
      id: this.generateLittleUuid(),
      name,
      description,
      guildId,
      createdAt: new Date()
    };

    this.channels.set(channel.id, channel);
    guild.channels.push(channel);
    this.rooms.add(channel.id); // Keep backward compatibility

    return channel;
  }

  // Get channel statistics
  getChannelStats(channelId: string): {
    userCount: number;
    messageCount: number;
    users: string[];
  } {
    return this.getRoomStats(channelId); // Reuse existing room stats logic
  }
}