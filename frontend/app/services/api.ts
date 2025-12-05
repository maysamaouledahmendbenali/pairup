// app/services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANT: Replace with YOUR computer's IP address
// Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
const BASE_URL = 'http://192.168.0.8:8000/api';

// Enable detailed logging for debugging
const DEBUG = __DEV__; // Only log in development mode

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 15000,
    });

    // Request interceptor - adds auth token and logging
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          
          if (DEBUG) {
            console.log('📤 API Request:', {
              method: config.method?.toUpperCase(),
              url: config.url,
              baseURL: config.baseURL,
              fullURL: `${config.baseURL}${config.url}`,
              hasAuth: !!token,
              data: config.data,
            });
          }
        } catch (error) {
          console.error('Error reading auth token:', error);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handles responses and errors
    this.api.interceptors.response.use(
      (response) => {
        if (DEBUG) {
          console.log('📥 API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        // Log detailed error information
        if (error.response) {
          // Server responded with error status
          console.error('❌ API Error Response:', {
            status: error.response.status,
            url: error.config?.url,
            data: error.response.data,
            message: error.message,
          });

          // Handle 401 Unauthorized - clear auth and redirect to login
          if (error.response.status === 401) {
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user');
            // Navigation will be handled by the app's auth state
          }
        } else if (error.request) {
          // Request was made but no response received
          console.error('❌ Network Error:', {
            message: error.message,
            url: error.config?.url,
            baseURL: BASE_URL,
          });
          console.error('💡 Check: Backend running? Correct IP? Same WiFi network?');
        } else {
          // Something else happened
          console.error('❌ Request Setup Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  // Set authorization token manually
  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (DEBUG) {
      console.log('🔐 Auth token set');
    }
  }

  // Clear authorization token
  clearAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
    if (DEBUG) {
      console.log('🔓 Auth token cleared');
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  async register(data: {
    full_name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    try {
      const response = await this.api.post('/register', data);
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await this.api.post('/login', { email, password });
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  }

  async logout() {
    try {
      const response = await this.api.post('/logout');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      this.clearAuthToken();
      return response.data;
    } catch (error: any) {
      console.error('Logout error:', error.response?.data || error.message);
      // Clear local storage even if API call fails
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      this.clearAuthToken();
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.api.get('/me');
      return response.data;
    } catch (error: any) {
      console.error('Get current user error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== PROFILE ENDPOINTS ====================

  async updateProfile(data: any) {
    try {
      if (DEBUG) {
        console.log('Updating profile with data:', data);
      }
      const response = await this.api.post('/profile/update', data);
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error.response?.data || error.message);
      throw error;
    }
  }

  async uploadProfilePhoto(imageUri: string) {
    try {
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: imageUri,
        type: type,
        name: filename,
      } as any);

      const response = await this.api.post('/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Upload photo error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== SWIPE ENDPOINTS ====================

  async discoverUsers(filters?: {
    limit?: number;
    department?: string;
    skills?: string[];
  }) {
    try {
      const response = await this.api.get('/swipes/discover', { params: filters });
      return response.data;
    } catch (error: any) {
      console.error('Discover users error:', error.response?.data || error.message);
      throw error;
    }
  }

  async swipe(swipedId: number, action: 'like' | 'pass' | 'superlike') {
    try {
      const response = await this.api.post('/swipe', {
        swiped_id: swipedId,
        action,
      });
      return response.data;
    } catch (error: any) {
      console.error('Swipe error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSwipeHistory(type: 'given' | 'received', action?: string) {
    try {
      const response = await this.api.get('/swipes/history', {
        params: { type, action },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get swipe history error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== MATCH ENDPOINTS ====================

  async getMatches() {
    try {
      const response = await this.api.get('/matches');
      return response.data;
    } catch (error: any) {
      console.error('Get matches error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMatch(matchId: number) {
    try {
      const response = await this.api.get(`/matches/${matchId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get match error:', error.response?.data || error.message);
      throw error;
    }
  }

  async unmatch(matchId: number) {
    try {
      const response = await this.api.post(`/matches/${matchId}/unmatch`);
      return response.data;
    } catch (error: any) {
      console.error('Unmatch error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== MESSAGE ENDPOINTS ====================

  async sendMessage(matchId: number, message: string) {
    try {
      const response = await this.api.post(`/matches/${matchId}/message`, {
        message,
      });
      return response.data;
    } catch (error: any) {
      console.error('Send message error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMessages(matchId: number) {
    try {
      const response = await this.api.get(`/matches/${matchId}/messages`);
      return response.data;
    } catch (error: any) {
      console.error('Get messages error:', error.response?.data || error.message);
      throw error;
    }
  }

  async markMessageAsRead(messageId: number) {
    try {
      const response = await this.api.post(`/messages/${messageId}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Mark message as read error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== DASHBOARD ====================

  async getDashboard() {
    try {
      const response = await this.api.get('/dashboard');
      return response.data;
    } catch (error: any) {
      console.error('Get dashboard error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/test', { timeout: 5000 });
      console.log('✅ Backend connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ Backend connection failed:', error.message);
      return false;
    }
  }

  // Get current base URL
  getBaseURL(): string {
    return BASE_URL;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types for TypeScript
export type SwipeAction = 'like' | 'pass' | 'superlike';
export type SwipeType = 'given' | 'received';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  department: string;
  bio: string;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  skills: string[];
  interests: string[];
  work_style: {
    preference: string;
  };
  availability: string;
  looking_for: string;
  project_types: string[];
}

export interface Match {
  id: number;
  user: User;
  compatibility_score: number;
  matched_at: string;
  last_message?: Message;
  unread_count: number;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  sender?: User;
}