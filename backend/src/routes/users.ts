import { Elysia } from 'elysia';
import { authMiddleware } from './auth';
import { hashPassword } from '../utils/auth';

export const userRoutes = new Elysia({ prefix: '/users' })
  .post('/register', async ({ body, set, db, user }) => {
    try {
      // Only staff can register new residents
      if (user.role !== 'staff') {
        set.status = 403;
        return { error: 'Access denied', message: 'เฉพาะเจ้าหน้าที่เท่านั้นที่สามารถลงทะเบียนผู้อาศัยได้' };
      }

      const { username, password, room_number, phone_number } = body;

      // Validate required fields
      if (!username || !password || !room_number || !phone_number) {
        set.status = 400;
        return { error: 'Missing required fields', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
      }

      // Check if username already exists
      const existingUser = await db.get(
        'SELECT id FROM users WHERE username = ?',
        username
      );

      if (existingUser) {
        set.status = 400;
        return { error: 'Username already exists', message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' };
      }

      // Check if room number already exists for a resident
      const existingRoom = await db.get(
        'SELECT id FROM users WHERE role = "resident" AND room_number = ?',
        room_number
      );

      if (existingRoom) {
        set.status = 400;
        return { error: 'Room already occupied', message: 'ห้องนี้มีผู้อาศัยอยู่แล้ว' };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Insert new resident
      const result = await db.run(
        'INSERT INTO users (username, password, role, room_number, phone_number) VALUES (?, ?, ?, ?, ?)',
        username, hashedPassword, 'resident', room_number, phone_number
      );

      const newUser = await db.get(
        'SELECT id, username, room_number, phone_number FROM users WHERE id = ?',
        result.lastID
      );

      return {
        success: true,
        message: 'ลงทะเบียนผู้อาศัยเรียบร้อย',
        user: newUser
      };

    } catch (error) {
      console.error('Register resident error:', error);
      set.status = 500;
      return { error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' };
    }
  })
  .use(authMiddleware())
  .get('/residents', async ({ set, db, user }) => {
    try {
      // Only staff can view all residents
      if (user.role !== 'staff') {
        set.status = 403;
        return { error: 'Access denied', message: 'ไม่มีสิทธิ์ในการเข้าถึง' };
      }

      const residents = await db.all(`
        SELECT id, username, room_number, phone_number
        FROM users
        WHERE role = 'resident'
        ORDER BY room_number
      `);

      return {
        success: true,
        residents
      };

    } catch (error) {
      console.error('Get residents error:', error);
      set.status = 500;
      return { error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' };
    }
  })
  .get('/profile', async ({ user }) => {
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        room_number: user.room_number,
        phone_number: user.phone_number
      }
    };
  });
