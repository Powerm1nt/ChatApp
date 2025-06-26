import { create } from 'zustand';
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export interface User {
  id: string;
  email: string;
  username?: string;
  createdAt: string;
  isAnonymous?: boolean;
  avatar?: string;
  status?: "online" | "do not disturb" | "inactive" | "offline";
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInAnonymous: () => Promise<{ error?: string }>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  updateUserStatus: (status: "online" | "do not disturb" | "inactive" | "offline") => Promise<{ error?: string }>;
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // Add request interceptor to include token
  axios.interceptors.request.use((config) => {
    const token = get().token || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return {
    user: null,
    token: null,
    isLoading: true,

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    checkAuth: async () => {
      try {
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
          set({ token: storedToken });
          // Verify token by getting user profile
          const response: AxiosResponse<User> = await axios.get('/auth/me');
          set({ user: response.data });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // Clear invalid token
        localStorage.removeItem('access_token');
        set({ token: null, user: null });
      } finally {
        set({ isLoading: false });
      }
    },

    signIn: async (email: string, password: string) => {
      try {
        set({ isLoading: true });
        const response: AxiosResponse<AuthResponse> = await axios.post('/auth/signin', {
          email,
          password,
        });

        const { user, access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        set({ user, token: access_token });
        return {};
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Sign in failed";
        return { error: errorMessage };
      } finally {
        set({ isLoading: false });
      }
    },

    signUp: async (email: string, password: string, username?: string) => {
      try {
        set({ isLoading: true });
        const response: AxiosResponse<AuthResponse> = await axios.post('/auth/signup', {
          email,
          password,
          username,
        });

        const { user, access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        set({ user, token: access_token });
        return {};
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Sign up failed";
        return { error: errorMessage };
      } finally {
        set({ isLoading: false });
      }
    },

    signInAnonymous: async () => {
      try {
        set({ isLoading: true });
        const response: AxiosResponse<AuthResponse> = await axios.post('/auth/anonymous');

        const { user, access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        set({ user, token: access_token });
        return {};
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Anonymous sign in failed";
        return { error: errorMessage };
      } finally {
        set({ isLoading: false });
      }
    },

    signOut: async () => {
      try {
        localStorage.removeItem('access_token');
        set({ user: null, token: null });
      } catch (error) {
        console.error("Sign out failed:", error);
      }
    },

    updateUserStatus: async (status: "online" | "do not disturb" | "inactive" | "offline") => {
      try {
        const currentUser = get().user;
        if (!currentUser) {
          return { error: "User not authenticated" };
        }

        // Update local state immediately for better UX
        set({ user: { ...currentUser, status } });

        // Update status on backend
        const response = await axios.patch('/auth/status', { status });
        
        return {};
      } catch (error: any) {
        // Revert local state on error
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, status: currentUser.status || "online" } });
        }
        const errorMessage = error.response?.data?.message || "Failed to update status";
        return { error: errorMessage };
      }
    },
  };
});

// Initialize auth check on store creation
useAuthStore.getState().checkAuth();
