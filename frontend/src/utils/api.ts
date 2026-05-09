import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginRequest, LoginResponse, User, Parcel, CreateParcelRequest, RegisterResidentRequest, RegisterResidentResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CACHE_TTL = 30000; // 30s cache for GET requests

// Simple in-memory cache
type CacheEntry = { data: unknown; timestamp: number };
const cache = new Map<string, CacheEntry>();

const getCacheKey = (config: { method?: string; url?: string; params?: unknown }): string => {
  return `${config.method || 'GET'}:${config.url || ''}`;
};

const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_TTL;
};

const clearCache = (): void => cache.clear();

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: cache GET + handle 401
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Cache GET responses for snappy back-navigation
    if (response.config.method === 'get') {
      const key = getCacheKey(response.config);
      cache.set(key, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Wrapper: check cache before GET requests
const cachedGet = async <T>(url: string, config?: Record<string, unknown>): Promise<T> => {
  const key = getCacheKey({ method: 'get', url, ...config });
  const cached = cache.get(key);
  if (cached && isCacheValid(cached)) {
    return cached.data as T;
  }
  const response = await api.get<T>(url, config);
  return response.data;
};

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  registerResident: async (data: RegisterResidentRequest): Promise<RegisterResidentResponse> => {
    const response = await api.post('/auth/register-resident', data);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getResidents: async (): Promise<{ success: boolean; residents: User[] }> => {
    return cachedGet('/users/residents');
  },
  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    return cachedGet('/users/profile');
  },
  registerResident: async (data: RegisterResidentRequest): Promise<RegisterResidentResponse> => {
    clearCache(); // Invalidate cache after mutation
    const response = await api.post('/users/register', data);
    return response.data;
  },
};

// Parcels API — GET uses cache, mutating ops clear cache
export const parcelsAPI = {
  createParcel: async (data: CreateParcelRequest): Promise<{ success: boolean; message: string; parcel: Parcel }> => {
    clearCache();
    const response = await api.post('/parcels', data);
    return response.data;
  },
  getResidentParcels: async (residentId: number, limit?: number, offset?: number): Promise<{ success: boolean; parcels: Parcel[]; total?: number; pagination?: { limit: number; offset: number } }> => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', limit.toString());
    if (offset !== undefined) params.append('offset', offset.toString());
    const query = params.toString() ? `?${params}` : '';
    return cachedGet(`/parcels/resident/${residentId}${query}`);
  },
  collectParcel: async (parcelId: number, staffId: number, evidencePhotoPath?: string): Promise<{ success: boolean; message: string }> => {
    clearCache();
    const response = await api.put(`/parcels/${parcelId}/collect`, { 
      staff_id: staffId,
      photo_out_path: evidencePhotoPath
    });
    return response.data;
  },
  getHistory: async (filters?: {
    room_number?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    parcels: Parcel[];
    total: number;
    pagination: { limit: number; offset: number };
  }> => {
    const params = new URLSearchParams();
    if (filters?.room_number) params.append('room_number', filters.room_number);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return cachedGet(`/parcels/history?${params}`);
  },
  getQRCode: async (parcelId: number): Promise<{ success: boolean; qrCode: string; parcelId: number }> => {
    return cachedGet(`/parcels/${parcelId}/qrcode`);
  },
  getParcelById: async (parcelId: number): Promise<{ success: boolean; parcel: Parcel; message?: string }> => {
    return cachedGet(`/parcels/${parcelId}`);
  },
  updateParcelSendout: async (parcelId: number, sendoutAt: string): Promise<{ success: boolean; message: string }> => {
    clearCache();
    const response = await api.put('/parcels/update-parcel', {
      parcel_id: parcelId,
      sendout_at: sendoutAt
    });
    return response.data;
  },
  returnParcel: async (parcelId: number): Promise<{ success: boolean; message: string }> => {
    clearCache();
    const response = await api.put(`/parcels/${parcelId}/return`);
    return response.data;
  },
};

export default api;
