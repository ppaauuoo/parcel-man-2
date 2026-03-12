import 'express';

declare module 'express' {
  export interface Request {
    user: {
      id: number;
      username: string;
      role: 'staff' | 'resident';
      room_number?: string;
      phone_number: string;
    };
  }
}
