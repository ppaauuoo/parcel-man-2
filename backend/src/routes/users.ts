import { Elysia } from 'elysia';
import { authMiddleware } from './auth';

export const userRoutes = new Elysia({ prefix: '/users' })
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
