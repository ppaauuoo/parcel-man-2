import { Database } from 'sqlite';

export interface User {
  id: number;
  username: string;
  password: string;
  role: 'staff' | 'resident';
  room_number?: string;
  phone_number: string;
  created_at: string;
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
  staff_out_id?: number;
}

export interface CreateParcelRequest {
  tracking_number: string;
  resident_id: number;
  carrier_name: string;
  room_number?: string;
}

export interface CollectParcelRequest {
  parcel_id: number;
  staff_id: number;
}

export const setupDatabaseSchema = async (db: Database) => {
  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('staff', 'resident')),
      room_number TEXT,
      phone_number TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create parcels table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      resident_id INTEGER NOT NULL,
      carrier_name TEXT NOT NULL,
      photo_in_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      collected_at TEXT,
      photo_out_path TEXT,
      staff_in_id INTEGER,
      staff_out_id INTEGER,
      FOREIGN KEY (resident_id) REFERENCES users(id),
      FOREIGN KEY (staff_in_id) REFERENCES users(id),
      FOREIGN KEY (staff_out_id) REFERENCES users(id)
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_room_number ON users(room_number);
    CREATE INDEX IF NOT EXISTS idx_parcels_resident_id ON parcels(resident_id);
    CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
    CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON parcels(tracking_number);
  `);
};
