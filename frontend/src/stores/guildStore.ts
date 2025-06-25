import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from './authStore';

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

interface GuildState {
  guilds: Guild[];
  channels: Channel[];
  isLoadingGuilds: boolean;
  isLoadingChannels: boolean;
  currentGuild: string | null;
  isInitialized: boolean;
  
  // Guild management
  fetchGuilds: () => Promise<{ success: boolean; guilds?: Guild[]; error?: string }>;
  createGuild: (name: string, description?: string) => Promise<Guild | null>;
  updateGuild: (guildId: string, name?: string, description?: string) => Promise<Guild | null>;
  deleteGuild: (guildId: string) => Promise<boolean>;
  
  // Channel management
  fetchChannels: (guildId: string) => Promise<{ success: boolean; channels?: Channel[]; error?: string }>;
  createChannel: (guildId: string, name: string, description?: string) => Promise<Channel | null>;
  updateChannel: (guildId: string, channelId: string, name?: string, description?: string) => Promise<Channel | null>;
  deleteChannel: (guildId: string, channelId: string) => Promise<boolean>;
  
  // Status
  fetchGuildStatus: (guildId: string) => Promise<GuildStatus | null>;
  
  // State setters
  setGuilds: (guilds: Guild[]) => void;
  setChannels: (channels: Channel[]) => void;
  setCurrentGuild: (guildId: string | null) => void;
  setLoadingGuilds: (loading: boolean) => void;
  setLoadingChannels: (loading: boolean) => void;
  
  // Utility methods
  getGuildById: (guildId: string) => Guild | undefined;
  getChannelsByGuildId: (guildId: string) => Channel[];
  getChannelById: (channelId: string) => Channel | undefined;
  updateChannelInStore: (updatedChannel: Channel) => void;
}

export const useGuildStore = create<GuildState>()(
  subscribeWithSelector((set, get) => ({
    guilds: [],
    channels: [],
    isLoadingGuilds: false,
    isLoadingChannels: false,
    currentGuild: null,
    isInitialized: false,

  // State setters
  setGuilds: (guilds: Guild[]) => set({ guilds }),
  setChannels: (channels: Channel[]) => set({ channels }),
  setCurrentGuild: (guildId: string | null) => set({ currentGuild: guildId }),
  setLoadingGuilds: (loading: boolean) => set({ isLoadingGuilds: loading }),
  setLoadingChannels: (loading: boolean) => set({ isLoadingChannels: loading }),

  // Utility methods
  getGuildById: (guildId: string) => {
    const { guilds } = get();
    return guilds.find(guild => guild.id === guildId);
  },

  getChannelsByGuildId: (guildId: string) => {
    const { channels } = get();
    return channels.filter(channel => channel.guildId === guildId);
  },

  getChannelById: (channelId: string) => {
    const { channels } = get();
    return channels.find(channel => channel.id === channelId);
  },

  updateChannelInStore: (updatedChannel: Channel) => {
    const { channels } = get();
    const updatedChannels = channels.map(channel => 
      channel.id === updatedChannel.id ? updatedChannel : channel
    );
    set({ channels: updatedChannels });
  },

  // Guild management
  fetchGuilds: async () => {
    set({ isLoadingGuilds: true });
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      const response = await axios.get(`${API_BASE_URL}/api/guilds`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data && response.data.guilds) {
        const guilds = response.data.guilds;
        
        // Extract all channels from all guilds and update the channels array
        const allChannels: Channel[] = [];
        guilds.forEach((guild: Guild) => {
          if (guild.channels && Array.isArray(guild.channels)) {
            allChannels.push(...guild.channels);
          }
        });
        
        set({ guilds, channels: allChannels, isInitialized: true });
        return { success: true, guilds };
      }
      
      set({ isInitialized: true });
      return { success: false, error: 'No guilds data received' };
    } catch (error: any) {
      console.error('Failed to fetch guilds:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        console.warn('Authentication failed while fetching guilds. Token may be expired.');
        useAuthStore.getState().signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        set({ isInitialized: true });
        return { success: false, error: 'Authentication failed' };
      }
      
      set({ isInitialized: true });
      return { success: false, error: error.message || 'Failed to fetch guilds' };
    } finally {
      set({ isLoadingGuilds: false });
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

  updateGuild: async (guildId: string, name?: string, description?: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || undefined;
      
      const response = await axios.put(`${API_BASE_URL}/api/guilds/${guildId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data) {
        // Refresh guilds list after updating
        await get().fetchGuilds();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to update guild:', error);
      return null;
    }
  },

  deleteGuild: async (guildId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      await axios.delete(`${API_BASE_URL}/api/guilds/${guildId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh guilds list after deleting
      await get().fetchGuilds();
      return true;
    } catch (error) {
      console.error('Failed to delete guild:', error);
      return false;
    }
  },

  // Channel management
  fetchChannels: async (guildId: string) => {
    set({ isLoadingChannels: true });
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { token } = useAuthStore.getState();
      
      const response = await axios.get(`${API_BASE_URL}/api/guilds/${guildId}/channels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Fetch channels response: received', response.data?.channels?.length || response.data?.length || 0, 'channels');
      
      let channels: Channel[] = [];
      if (response.data && response.data.channels) {
        channels = response.data.channels;
      } else if (response.data && Array.isArray(response.data)) {
        channels = response.data;
      }
      
      // Update channels in store, filtering to only include channels for this guild
      const { channels: existingChannels, guilds } = get();
      const otherGuildChannels = existingChannels.filter(channel => channel.guildId !== guildId);
      const updatedChannels = [...otherGuildChannels, ...channels];
      
      // Also update the channels property within the specific guild object
      const updatedGuilds = guilds.map(guild => 
        guild.id === guildId 
          ? { ...guild, channels: channels }
          : guild
      );
      
      set({ channels: updatedChannels, guilds: updatedGuilds });
      
      return { success: true, channels };
    } catch (error: any) {
      console.error('Failed to fetch channels:', error);
      
      if (error.response?.status === 403) {
        console.warn('Access denied to guild. User may not be a member of this guild.');
        return { success: false, error: 'Access denied to guild' };
      } else if (error.response?.status === 401) {
        console.warn('Authentication failed. Token may be expired.');
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
})));

// Custom hook that automatically fetches guilds when used
export const useGuildStoreWithAutoFetch = () => {
  const store = useGuildStore();
  const { token } = useAuthStore();

  useEffect(() => {
    // Auto-fetch guilds if not initialized and user is authenticated
    if (!store.isInitialized && !store.isLoadingGuilds && token) {
      console.log('Auto-fetching guilds because store is not initialized and user is authenticated');
      store.fetchGuilds().catch(console.error);
    }
  }, [store.isInitialized, store.isLoadingGuilds, store.fetchGuilds, token]);

  return store;
};