import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { setupDatabaseSchema } from './schema';

// Initialize SQLite database
let db: Database;

// Initialize database synchronously at startup
const initializeDatabase = async () => {
  db = await open({
    filename: './icondo.db',
    driver: sqlite3.Database
  });
  
  // Setup schema
  await setupDatabaseSchema(db);
};

export const getDatabase = () => db;

// Initialize database immediately
initializeDatabase().catch(console.error);
