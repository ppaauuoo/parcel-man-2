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
  status: 'pending' | 'collected' | 'returned';
  created_at: string;
  collected_at?: string;
  photo_out_path?: string;
  staff_in_id?: number;
  staff_out_id?: number;
  sendout_at?: string;
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
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'returned')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      collected_at TEXT,
      photo_out_path TEXT,
      staff_in_id INTEGER,
      staff_out_id INTEGER,
      sendout_at TEXT,
      FOREIGN KEY (resident_id) REFERENCES users(id),
      FOREIGN KEY (staff_in_id) REFERENCES users(id),
      FOREIGN KEY (staff_out_id) REFERENCES users(id)
    )
  `);

  // Add sendout_at column if it doesn't exist (for existing databases)
  try {
    await db.exec(`ALTER TABLE parcels ADD COLUMN sendout_at TEXT`);
    console.log('✅ Added sendout_at column to parcels table');
  } catch (error: any) {
    // Column already exists, which is fine
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding sendout_at column:', error);
    }
  }

  // Update status column CHECK constraint to include 'returned' (for existing databases)
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS parcels_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_number TEXT UNIQUE NOT NULL,
        resident_id INTEGER NOT NULL,
        carrier_name TEXT NOT NULL,
        photo_in_path TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'returned')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        collected_at TEXT,
        photo_out_path TEXT,
        staff_in_id INTEGER,
        staff_out_id INTEGER,
        sendout_at TEXT,
        FOREIGN KEY (resident_id) REFERENCES users(id),
        FOREIGN KEY (staff_in_id) REFERENCES users(id),
        FOREIGN KEY (staff_out_id) REFERENCES users(id)
      )
    `);
    
    const existingTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='parcels_new'");
    if (existingTable) {
      await db.exec(`
        INSERT INTO parcels_new (id, tracking_number, resident_id, carrier_name, photo_in_path, status, created_at, collected_at, photo_out_path, staff_in_id, staff_out_id, sendout_at)
        SELECT id, tracking_number, resident_id, carrier_name, photo_in_path, status, created_at, collected_at, photo_out_path, staff_in_id, staff_out_id, sendout_at FROM parcels
      `);
      
      await db.exec(`DROP TABLE parcels`);
      await db.exec(`ALTER TABLE parcels_new RENAME TO parcels`);
      
      console.log('✅ Updated parcels table status CHECK constraint');
    }
  } catch (error: any) {
    console.log('ℹ️ Database schema already up to date or migration not needed');
  }

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_room_number ON users(room_number);
    CREATE INDEX IF NOT EXISTS idx_parcels_resident_id ON parcels(resident_id);
    CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
    CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON parcels(tracking_number);
  `);
};
