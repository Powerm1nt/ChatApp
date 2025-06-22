import { Injectable } from '@nestjs/common';
import { ChatMessage } from './chat.gateway';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  room: string;
  joinedAt: Date;
}

@Injectable()
export class ChatService {
  private users: Map<string, User> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map(); // room -> messages
  private rooms: Set<string> = new Set();

  addUser(socketId: string, username: string, room: string): User {
    const user: User = {
      id: socketId,
      username,
      room,
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
}