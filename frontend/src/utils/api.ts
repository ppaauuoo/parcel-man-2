import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginRequest, LoginResponse, User, Parcel, CreateParcelRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getResidents: async (): Promise<{ success: boolean; residents: User[] }> => {
    const response = await api.get('/users/residents');
    return response.data;
  },
  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
};

// Parcels API
export const parcelsAPI = {
  createParcel: async (data: CreateParcelRequest): Promise<{ success: boolean; message: string; parcel: Parcel }> => {
    const response = await api.post('/parcels', data);
    return response.data;
  },
  getResidentParcels: async (residentId: number): Promise<{ success: boolean; parcels: Parcel[] }> => {
    const response = await api.get(`/parcels/resident/${residentId}`);
    return response.data;
  },
  collectParcel: async (parcelId: number, staffId: number, evidencePhotoPath?: string): Promise<{ success: boolean; message: string }> => {
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

    const response = await api.get(`/parcels/history?${params}`);
    return response.data;
  },
  getQRCode: async (parcelId: number): Promise<{ success: boolean; qrCode: string; parcelId: number }> => {
    const response = await api.get(`/parcels/${parcelId}/qrcode`);
    return response.data;
  },
};

export default api;
