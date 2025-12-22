export interface User {
  id: number;
  username: string;
  role: 'staff' | 'resident';
  room_number?: string;
  phone_number: string;
}

export interface Parcel {
  id: number;
  tracking_number: string;
  resident_id: number;
  carrier_name: string;
  photo_in_path?: string;
  status: 'pending' | 'collected';
  created_at: string;
  collected_at?: string;
  photo_out_path?: string;
  staff_in_id?: number;
  staff_in_name?: string;
  staff_out_id?: number;
  staff_out_name?: string;
  resident_name?: string;
  room_number?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: 'staff' | 'resident';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface CreateParcelRequest {
  tracking_number: string;
  resident_id?: number;
  room_number?: string;
  carrier_name: string;
  photo_in_path?: string;
}
