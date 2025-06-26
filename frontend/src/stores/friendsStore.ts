import { create } from "zustand";
import axios from "axios";

// Friend request interface
export interface FriendRequest {
  id: string;
  sender: {
    id: string;
    username: string;
  };
  status: string;
  createdAt: string;
}

// Friend interface
export interface Friend {
  id: string;
  username: string;
  email: string;
  status: "online" | "away" | "offline";
}

interface FriendsState {
  // State
  friends: Friend[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: {
    friends: boolean;
    receivedRequests: boolean;
    sentRequests: boolean;
  };
  error: string | null;

  // Actions
  fetchFriends: () => Promise<Friend[]>;
  fetchReceivedRequests: () => Promise<FriendRequest[]>;
  fetchSentRequests: () => Promise<FriendRequest[]>;
  sendFriendRequest: (
    username: string
  ) => Promise<{ message: string; error?: string }>;
  acceptFriendRequest: (
    requestId: string
  ) => Promise<{ message: string; error?: string }>;
  declineFriendRequest: (
    requestId: string
  ) => Promise<{ message: string; error?: string }>;
  cancelFriendRequest: (
    requestId: string
  ) => Promise<{ message: string; error?: string }>;
  removeFriend: (
    friendId: string
  ) => Promise<{ message: string; error?: string }>;

  // Helper functions
  resetErrors: () => void;
}

export const useFriendsStore = create<FriendsState>()((set, get) => {
  // API endpoint
  const API_URL = "/friends";

  return {
    // Initial state
    friends: [],
    receivedRequests: [],
    sentRequests: [],
    isLoading: {
      friends: false,
      receivedRequests: false,
      sentRequests: false,
    },
    error: null,

    // Reset errors
    resetErrors: () => set({ error: null }),

    // Fetch all friends
    fetchFriends: async () => {
      try {
        set((state) => ({
          isLoading: { ...state.isLoading, friends: true },
          error: null,
        }));

        const response = await axios.get(API_URL);
        const friends = response.data;

        set({ friends, isLoading: { ...get().isLoading, friends: false } });
        return friends;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Failed to fetch friends";
        set({
          error: errorMessage,
          isLoading: { ...get().isLoading, friends: false },
        });
        throw new Error(errorMessage);
      }
    },

    // Fetch received friend requests
    fetchReceivedRequests: async () => {
      try {
        set((state) => ({
          isLoading: { ...state.isLoading, receivedRequests: true },
          error: null,
        }));

        const response = await axios.get(`${API_URL}/requests/received`);
        const receivedRequests = response.data;

        set({
          receivedRequests,
          isLoading: { ...get().isLoading, receivedRequests: false },
        });
        return receivedRequests;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Failed to fetch received requests";
        set({
          error: errorMessage,
          isLoading: { ...get().isLoading, receivedRequests: false },
        });
        throw new Error(errorMessage);
      }
    },

    // Fetch sent friend requests
    fetchSentRequests: async () => {
      try {
        set((state) => ({
          isLoading: { ...state.isLoading, sentRequests: true },
          error: null,
        }));

        const response = await axios.get(`${API_URL}/requests/sent`);
        const sentRequests = response.data;

        set({
          sentRequests,
          isLoading: { ...get().isLoading, sentRequests: false },
        });
        return sentRequests;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Failed to fetch sent requests";
        set({
          error: errorMessage,
          isLoading: { ...get().isLoading, sentRequests: false },
        });
        throw new Error(errorMessage);
      }
    },

    // Send a friend request
    sendFriendRequest: async (username: string) => {
      try {
        set({ error: null });
        const response = await axios.post(`${API_URL}/request`, { username });

        // Refresh sent requests after sending a new one
        get().fetchSentRequests();

        return { message: response.data.message };
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Failed to send friend request";
        set({ error: errorMessage });
        return { message: "", error: errorMessage };
      }
    },

    // Accept a friend request
    acceptFriendRequest: async (requestId: string) => {
      try {
        set({ error: null });
        const response = await axios.put(
          `${API_URL}/requests/${requestId}/accept`
        );

        // Refresh both friends list and received requests
        await Promise.all([
          get().fetchFriends(),
          get().fetchReceivedRequests(),
        ]);

        return { message: response.data.message };
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Failed to accept friend request";
        set({ error: errorMessage });
        return { message: "", error: errorMessage };
      }
    },

    // Decline a friend request
    declineFriendRequest: async (requestId: string) => {
      try {
        set({ error: null });
        const response = await axios.put(
          `${API_URL}/requests/${requestId}/decline`
        );

        // Refresh received requests
        await get().fetchReceivedRequests();

        return { message: response.data.message };
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Failed to decline friend request";
        set({ error: errorMessage });
        return { message: "", error: errorMessage };
      }
    },

    // Cancel a sent friend request
    cancelFriendRequest: async (requestId: string) => {
      try {
        set({ error: null });
        const response = await axios.delete(`${API_URL}/requests/${requestId}`);

        // Refresh sent requests
        await get().fetchSentRequests();

        return { message: response.data.message };
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Failed to cancel friend request";
        set({ error: errorMessage });
        return { message: "", error: errorMessage };
      }
    },

    // Remove a friend
    removeFriend: async (friendId: string) => {
      try {
        set({ error: null });
        const response = await axios.delete(`${API_URL}/${friendId}`);

        // Refresh friends list
        await get().fetchFriends();

        return { message: response.data.message };
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "Failed to remove friend";
        set({ error: errorMessage });
        return { message: "", error: errorMessage };
      }
    },
  };
});

// Initialize fetch on store creation for immediate data availability
// This is optional and can be removed if you prefer lazy loading
const initializeStore = async () => {
  try {
    // Don't await these to allow parallel loading
    useFriendsStore.getState().fetchFriends();
    useFriendsStore.getState().fetchReceivedRequests();
  } catch (error) {
    console.error("Failed to initialize friends store:", error);
  }
};

// Comment this out if you prefer lazy loading
initializeStore();
