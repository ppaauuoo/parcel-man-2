import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { setupDatabaseSchema } from './schema';

// Initialize SQLite database
let db: Database;

const DATA_DIR = process.env.DATA_DIR || process.cwd();

// Initialize database synchronously at startup
const initializeDatabase = async () => {
  db = await open({
    filename: path.join(DATA_DIR, 'icondo.db'),
    driver: sqlite3.Database
  });
  
  // Setup schema
  await setupDatabaseSchema(db);
};

export const getDatabase = () => db;

// Initialize database immediately
initializeDatabase().catch(console.error);
