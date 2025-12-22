import bcrypt from 'bcrypt';

export interface LoginRequest {
  username: string;
  password: string;
  role: 'staff' | 'resident';
}

export interface User {
  id: number;
  username: string;
  role: 'staff' | 'resident';
  room_number?: string;
  phone_number: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const validateLogin = (data: any): data is LoginRequest => {
  return (
    data &&
    typeof data.username === 'string' &&
    typeof data.password === 'string' &&
    (data.role === 'staff' || data.role === 'resident')
  );
};
