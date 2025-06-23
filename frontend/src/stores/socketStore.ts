import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';
import axios from 'axios';

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  room?: string;
}

export interface User {
  id: string;
  username: string;
  room: string;
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
  stats: {
    userCount: number;
    messageCount: number;
  };
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  roomUsers: User[];
  guilds: Guild[];
  channels: Channel[];
  currentGuild: string | null;
  currentRoom: string | null;
  typingUsers: string[];
  joinRoom: (username: string, room: string, guildId?: string) => void;
  sendMessage: (message: string, guildId?: string, channelId?: string) => Promise<void>;
  fetchMessages: (roomId: string, guildId?: string) => Promise<void>;
  fetchGuilds: () => Promise<void>;
  fetchChannels: (guildId?: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  initializeSocket: () => void;
  disconnectSocket: () => void;
  setSocket: (socket: Socket | null) => void;
  setConnected: (connected: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setRoomUsers: (users: User[]) => void;
  setGuilds: (guilds: Guild[]) => void;
  setChannels: (channels: Channel[]) => void;
  setCurrentGuild: (guildId: string | null) => void;
  setCurrentRoom: (room: string | null) => void;
  updateTypingUsers: (username: string, isTyping: boolean) => void;
}

export const useSocketStore = create<SocketState>()((set, get) => ({
  socket: null,
  isConnected: false,
  messages: [],
  roomUsers: [],
  guilds: [],
  channels: [],
  currentGuild: null,
  currentRoom: null,
  typingUsers: [],

  setSocket: (socket: Socket | null) => set({ socket }),
  setConnected: (connected: boolean) => set({ isConnected: connected }),
  addMessage: (message: ChatMessage) => set(state => ({ messages: [...state.messages, message] })),
  setMessages: (messages: ChatMessage[]) => set({ messages }),
  setRoomUsers: (users: User[]) => set({ roomUsers: users }),
  setGuilds: (guilds: Guild[]) => set({ guilds }),
  setChannels: (channels: Channel[]) => set({ channels }),
  setCurrentGuild: (guildId: string | null) => set({ currentGuild: guildId }),
  setCurrentRoom: (room: string | null) => set({ currentRoom: room }),

  updateTypingUsers: (username: string, isTyping: boolean) => {
    set(state => ({
      typingUsers: isTyping
        ? state.typingUsers.includes(username) ? state.typingUsers : [...state.typingUsers, username]
        : state.typingUsers.filter(user => user !== username)
    }));
  },

  initializeSocket: () => {
    const { user } = useAuthStore.getState();
    const { socket, disconnectSocket } = get();

    if (user && !socket) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
      const newSocket = io(socketUrl, {
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        set({ isConnected: true });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        set({ isConnected: false });
      });

      newSocket.on('new-message', (message: ChatMessage) => {
        get().addMessage(message);
      });

      newSocket.on('room-users', (users: User[]) => {
        get().setRoomUsers(users);
      });

      newSocket.on('user-joined', (data: { username: string; message: string; timestamp: Date }) => {
        get().addMessage({
          id: Date.now().toString(),
          username: 'System',
          message: data.message,
          timestamp: data.timestamp,
        });
      });

      newSocket.on('user-typing', (data: { username: string; isTyping: boolean }) => {
        get().updateTypingUsers(data.username, data.isTyping);
      });

      newSocket.on('error', (error: string) => {
        console.error('Socket error:', error);
      });

      set({ socket: newSocket });
    } else if (!user && socket) {
      // Disconnect socket if user is not authenticated
      disconnectSocket();
    }
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.close();        set({
          socket: null,
          isConnected: false,
          messages: [],
          roomUsers: [],
          guilds: [],
          channels: [],
          currentGuild: null,
          currentRoom: null,
          typingUsers: []
        });
    }
  },  joinRoom: (username: string, room: string, guildId?: string) => {
    const { fetchMessages } = get();
    // Don't emit join-room to socket, just set current room and fetch messages via API
    set({ 
      currentRoom: room, 
      currentGuild: guildId || null,
      messages: [] 
    }); // Clear messages when switching rooms
    // Fetch room messages via API
    fetchMessages(room, guildId);
  },  fetchMessages: async (roomId: string, guildId?: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      let url: string;
      if (guildId) {
        url = `${API_BASE_URL}/api/guilds/${guildId}/channels/${roomId}/messages`;
      } else {
        // Fallback to legacy endpoint
        url = `${API_BASE_URL}/api/chats/${roomId}/messages`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.messages) {
        set({ messages: response.data.messages });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  },  fetchGuilds: async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${API_BASE_URL}/api/guilds`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.guilds) {
        set({ guilds: response.data.guilds });
      }
    } catch (error) {
      console.error('Failed to fetch guilds:', error);
    }
  },

  fetchChannels: async (guildId?: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      let url: string;
      if (guildId) {
        url = `${API_BASE_URL}/api/guilds/${guildId}/channels`;
      } else {
        // Fallback to legacy endpoint
        url = `${API_BASE_URL}/api/chats`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (guildId && response.data && response.data.channels) {
        set({ channels: response.data.channels });
      } else if (response.data && response.data.rooms) {
        // Legacy format
        set({ channels: response.data.rooms });
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  },  sendMessage: async (message: string, guildId?: string, channelId?: string) => {
    try {
      const { currentRoom, currentGuild } = get();
      const { user, token } = useAuthStore.getState();
      
      const targetGuildId = guildId || currentGuild;
      const targetChannelId = channelId || currentRoom;
      
      if (!targetChannelId || !user || !message.trim()) {
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      let url: string;
      if (targetGuildId) {
        url = `${API_BASE_URL}/api/guilds/${targetGuildId}/channels/${targetChannelId}/messages`;
      } else {
        // Fallback to legacy endpoint
        url = `${API_BASE_URL}/api/chats/${targetChannelId}/messages`;
      }
      
      await axios.post(url, {
        message: message.trim(),
        username: user.username || user.email || 'Anonymous',
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Message will be received via WebSocket broadcast, no need to add it manually
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  startTyping: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('typing', { isTyping: true });
    }
  },

  stopTyping: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('typing', { isTyping: false });
    }
  },
}));

// Subscribe to auth store changes to manage socket connection
useAuthStore.subscribe(
  (state) => {
    const { initializeSocket, disconnectSocket } = useSocketStore.getState();
    if (state.user) {
      initializeSocket();
    } else {
      disconnectSocket();
    }
  }
);
