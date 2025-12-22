import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { setupDatabaseSchema } from './schema';
import bcrypt from 'bcrypt';

const seedData = async () => {
  console.log('🌱 Seeding database with initial data...');
  
  try {
    const db = await open({
      filename: './icondo.db',
      driver: sqlite3.Database
    });
    
    // Setup schema first
    await setupDatabaseSchema(db);
    
    // Clear existing data
    await db.exec('DELETE FROM parcels');
    await db.exec('DELETE FROM users');
    
    // Hash passwords
    const staffPassword = await bcrypt.hash('staff123', 10);
    const resident1Password = await bcrypt.hash('resident123', 10);
    const resident2Password = await bcrypt.hash('resident123', 10);
    
    // Insert staff user
    await db.run(`
      INSERT INTO users (username, password, role, phone_number) 
      VALUES (?, ?, ?, ?)
    `, 'staff01', staffPassword, 'staff', '081-234-5678');
    
    // Insert resident users
    await db.run(`
      INSERT INTO users (username, password, role, room_number, phone_number) 
      VALUES (?, ?, ?, ?, ?)
    `, 'resident101', resident1Password, 'resident', '101', '081-111-1111');
    
    await db.run(`
      INSERT INTO users (username, password, role, room_number, phone_number) 
      VALUES (?, ?, ?, ?, ?)
    `, 'resident102', resident2Password, 'resident', '102', '081-222-2222');
    
    // Get user IDs for reference
    const staff = await db.get('SELECT id FROM users WHERE role = "staff" LIMIT 1') as { id: number };
    const resident1 = await db.get('SELECT id FROM users WHERE room_number = "101" LIMIT 1') as { id: number };
    const resident2 = await db.get('SELECT id FROM users WHERE room_number = "102" LIMIT 1') as { id: number };
    
    const now = new Date().toISOString();
    
    // Insert sample parcels
    await db.run(`
      INSERT INTO parcels (tracking_number, resident_id, carrier_name, status, staff_in_id, created_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, 'TH123456789', resident1.id, 'Kerry Express', 'pending', staff.id, now);
    
    await db.run(`
      INSERT INTO parcels (tracking_number, resident_id, carrier_name, status, staff_in_id, created_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, 'TH987654321', resident2.id, 'Flash', 'pending', staff.id, now);
    
    // Collected parcels
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await db.run(`
      INSERT INTO parcels (tracking_number, resident_id, carrier_name, status, staff_in_id, created_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, 'TH555555555', resident1.id, 'ThaiPost', 'collected', staff.id, yesterday);
    
    // Update collected_at for collected parcel
    await db.run('UPDATE parcels SET collected_at = ?, staff_out_id = ? WHERE tracking_number = ?',
      yesterday, staff.id, 'TH555555555');
    
    await db.close();
    
    console.log('✅ Database seeded successfully!');
    console.log('📋 Users created:');
    console.log('   Staff: staff01 / staff123');
    console.log('   Resident 101: resident101 / resident123');
    console.log('   Resident 102: resident102 / resident123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Run seeding if this script is executed directly
if (import.meta.main) {
  seedData();
}
