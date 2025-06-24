import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';
import axios from 'axios';

export interface ChatMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
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
  isLoadingChannels: boolean;
  currentGuild: string | null;
  currentRoom: string | null;
  typingUsers: string[];
  serviceStatus: ServiceStatus | null;
  joinRoom: (username: string, room: string, guildId?: string) => void;
  sendMessage: (message: string, guildId?: string, channelId?: string) => Promise<void>;
  fetchMessages: (roomId: string, guildId?: string) => Promise<void>;
  fetchGuilds: () => Promise<void>;
  fetchChannels: (guildId?: string) => Promise<{ success: boolean; channels?: Channel[]; error?: string }>;
  createGuild: (name: string, description?: string) => Promise<Guild | null>;
  createChannel: (guildId: string, name: string, description?: string) => Promise<Channel | null>;
  updateChannel: (guildId: string, channelId: string, name?: string, description?: string) => Promise<Channel | null>;
  deleteChannel: (guildId: string, channelId: string) => Promise<boolean>;
  fetchServiceStatus: () => Promise<void>;
  fetchGuildStatus: (guildId: string) => Promise<GuildStatus | null>;
  fetchUserStatus: (userId: string) => Promise<UserStatus | null>;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
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
  setLoadingChannels: (loading: boolean) => void;
  setCurrentGuild: (guildId: string | null) => void;
  setCurrentRoom: (room: string | null) => void;
  updateTypingUsers: (username: string, isTyping: boolean) => void;
  setServiceStatus: (status: ServiceStatus) => void;
}

export interface ServiceStatus {
  status: string;
  timestamp: string;
  uptime: number;
  services: {
    database: string;
    websocket: string;
    api: string;
  };
}

export interface GuildStatus {
  guildId: string;
  name: string;
  status: string;
  timestamp: string;
  stats: {
    memberCount: number;
    channelCount: number;
    activeUsers: number;
    createdAt: Date;
  };
  health: {
    database: string;
    channels: string;
    members: string;
  };
}

export interface UserStatus {
  userId: string;
  username: string;
  status: string;
  timestamp: string;
  stats: {
    guildCount: number;
    joinedAt: Date;
    lastActivity: Date;
  };
  health: {
    connection: string;
    guilds: string;
    account: string;
  };
}

export const useSocketStore = create<SocketState>()((set, get) => ({
  socket: null,
  isConnected: false,
  messages: [],
  roomUsers: [],
  guilds: [],
  channels: [],
  isLoadingChannels: false,
  currentGuild: null,
  currentRoom: null,
  typingUsers: [],
  serviceStatus: null,

  setSocket: (socket: Socket | null) => set({ socket }),
  setConnected: (connected: boolean) => set({ isConnected: connected }),
  addMessage: (message: ChatMessage) => set(state => ({ messages: [...state.messages, message] })),
  setMessages: (messages: ChatMessage[]) => set({ messages }),
  setRoomUsers: (users: User[]) => set({ roomUsers: users }),
  setGuilds: (guilds: Guild[]) => set({ guilds }),
  setChannels: (channels: Channel[]) => set({ channels }),
  setLoadingChannels: (loading: boolean) => set({ isLoadingChannels: loading }),
  setCurrentGuild: (guildId: string | null) => set({ currentGuild: guildId }),
  setCurrentRoom: (room: string | null) => set({ currentRoom: room }),
  setServiceStatus: (status: ServiceStatus) => set({ serviceStatus: status }),

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
          content: data.message,
          author: {
            id: 'system',
            username: 'System',
          },
          timestamp: data.timestamp,
        });
      });

      newSocket.on('user-typing', (data: { username: string; isTyping: boolean }) => {
        get().updateTypingUsers(data.username, data.isTyping);
      });

      // Channel management events
      newSocket.on('channel-created', (data: { guildId: string; channel: Channel; timestamp: Date }) => {
        console.log('Channel created:', data);
        
        // Import guild store to refresh channels
        import('./guildStore').then(({ useGuildStore }) => {
          const guildStore = useGuildStore.getState();
          guildStore.fetchChannels(data.guildId);
        });
      });

      newSocket.on('channel-updated', (data: { guildId: string; channel: Channel; timestamp: Date }) => {
        console.log('Channel updated:', data);
        
        // Import guild store to refresh channels
        import('./guildStore').then(({ useGuildStore }) => {
          const guildStore = useGuildStore.getState();
          guildStore.fetchChannels(data.guildId);
        });
      });

      newSocket.on('channel-deleted', (data: { guildId: string; channelId: string; channelName: string; timestamp: Date }) => {
        const { currentGuild, currentRoom, setCurrentRoom, setMessages } = get();
        console.log('Channel deleted:', data);
        
        // If we're currently in the deleted channel, clear the current room
        if (currentRoom === data.channelId) {
          setCurrentRoom(null);
          setMessages([]);
        }
        
        // Import guild store to refresh channels
        import('./guildStore').then(({ useGuildStore }) => {
          const guildStore = useGuildStore.getState();
          guildStore.fetchChannels(data.guildId);
        });
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
    const { socket, fetchMessages } = get();
    
    // Set current room and guild
    set({ 
      currentRoom: room, 
      currentGuild: guildId || null,
      messages: [] 
    }); // Clear messages when switching rooms
    
    // Emit join-room to socket for real-time features
    if (socket) {
      socket.emit('join-room', { username, room, guildId });
      
      // Also join guild room for guild-wide events
      if (guildId) {
        socket.emit('join-guild', { guildId });
      }
    }
    
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
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      
      // Handle 404 errors for new channels by setting empty messages
      if (error.response?.status === 404) {
        console.log('Channel not found, setting empty messages for new channel');
        set({ messages: [] });
      }
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
    } catch (error: any) {
      console.error('Failed to fetch guilds:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        console.warn('Authentication failed while fetching guilds. Token may be expired.');
        // Clear auth state and redirect to login
        useAuthStore.getState().signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
  },

  fetchChannels: async (guildId?: string) => {
    set({ isLoadingChannels: true });
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
      
      console.log('Fetch channels response:', response.data); // Debug log
      
      let channels: Channel[] = [];
      if (guildId && response.data && response.data.channels) {
        channels = response.data.channels;
      } else if (response.data && response.data.rooms) {
        // Legacy format
        channels = response.data.rooms;
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array response
        channels = response.data;
      }
      
      // Set channels in store
      set({ channels });
      
      return { success: true, channels };
    } catch (error: any) {
      console.error('Failed to fetch channels:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        console.warn('Access denied to guild. User may not be a member of this guild.');
        // Clear channels for this guild since user doesn't have access
        set({ channels: [] });
        
        // Optionally redirect to home or show a user-friendly message
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath.includes('/guild/')) {
            console.warn('Redirecting to home due to guild access denied');
            window.location.href = '/me';
          }
        }
        return { success: false, error: 'Access denied to guild' };
      } else if (error.response?.status === 401) {
        console.warn('Authentication failed. Token may be expired.');
        // Clear auth state and redirect to login
        useAuthStore.getState().signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return { success: false, error: 'Authentication failed' };
      }
      
      return { success: false, error: error.message || 'Failed to fetch channels' };
    } finally {
      set({ isLoadingChannels: false });
    }
  },

  createGuild: async (name: string, description?: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      const response = await axios.post(`${API_BASE_URL}/api/guilds`, {
        name: name.trim(),
        description: description?.trim() || undefined,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data) {
        // Refresh guilds list after creating a new one
        await get().fetchGuilds();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to create guild:', error);
      return null;
    }
  },

  createChannel: async (guildId: string, name: string, description?: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      const response = await axios.post(`${API_BASE_URL}/api/guilds/${guildId}/channels`, {
        name: name.trim(),
        description: description?.trim() || undefined,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data) {
        // Refresh channels list after creating a new one
        await get().fetchChannels(guildId);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to create channel:', error);
      return null;
    }
  },

  updateChannel: async (guildId: string, channelId: string, name?: string, description?: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || undefined;
      
      const response = await axios.put(`${API_BASE_URL}/api/guilds/${guildId}/channels/${channelId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data) {
        // Refresh channels list after updating
        await get().fetchChannels(guildId);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to update channel:', error);
      return null;
    }
  },

  deleteChannel: async (guildId: string, channelId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      await axios.delete(`${API_BASE_URL}/api/guilds/${guildId}/channels/${channelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh channels list after deleting
      await get().fetchChannels(guildId);
      return true;
    } catch (error) {
      console.error('Failed to delete channel:', error);
      return false;
    }
  },

  sendMessage: async (message: string, guildId?: string, channelId?: string) => {
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

  // Service status and heartbeat methods
  fetchServiceStatus: async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_BASE_URL}/health`);
      
      if (response.data) {
        set({ serviceStatus: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error);
      set({ 
        serviceStatus: {
          status: 'error',
          timestamp: new Date().toISOString(),
          uptime: 0,
          services: {
            database: 'disconnected',
            websocket: 'error',
            api: 'error'
          }
        }
      });
    }
  },

  fetchGuildStatus: async (guildId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      const response = await axios.get(`${API_BASE_URL}/api/guilds/${guildId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch guild status:', error);
      return null;
    }
  },

  fetchUserStatus: async (userId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user status:', error);
      return null;
    }
  },

  startHeartbeat: () => {
    const { fetchServiceStatus } = get();
    
    // Initial fetch
    fetchServiceStatus();
    
    // Set up interval for heartbeat (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
      fetchServiceStatus();
    }, 30000);
    
    // Store interval ID for cleanup
    (window as any).heartbeatInterval = heartbeatInterval;
  },

  stopHeartbeat: () => {
    if ((window as any).heartbeatInterval) {
      clearInterval((window as any).heartbeatInterval);
      (window as any).heartbeatInterval = null;
    }
  },
}));

// Subscribe to auth store changes to manage socket connection
useAuthStore.subscribe(
  (state) => {
    const { initializeSocket, disconnectSocket, startHeartbeat, stopHeartbeat } = useSocketStore.getState();
    if (state.user) {
      initializeSocket();
      startHeartbeat();
    } else {
      disconnectSocket();
      stopHeartbeat();
    }
  }
);
