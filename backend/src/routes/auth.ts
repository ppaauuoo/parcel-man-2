import { Elysia } from 'elysia';
import { comparePassword, validateLogin } from '../utils/auth';
import type { User } from '../utils/auth';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/login', async ({ body, jwt, set, db }) => {
    try {
      if (!validateLogin(body)) {
        set.status = 400;
        return { error: 'Invalid login data', message: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' };
      }

      const { username, password, role } = body;

      // Find user in database
      const user = await db.get(`
        SELECT id, username, password, role, room_number, phone_number 
        FROM users 
        WHERE username = ? AND role = ?
      `, username, role) as { id: number; username: string; password: string; role: string; room_number?: string; phone_number: string } | undefined;

      if (!user) {
        set.status = 401;
        return { error: 'Invalid credentials', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        set.status = 401;
        return { error: 'Invalid credentials', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
      }

      // Create JWT token
      const token = await jwt.sign({
        id: user.id,
        username: user.username,
        role: user.role,
        room_number: user.room_number,
        phone_number: user.phone_number
      });

      const userResponse: User = {
        id: user.id,
        username: user.username,
        role: user.role as 'staff' | 'resident',
        room_number: user.room_number,
        phone_number: user.phone_number
      };

      return {
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        token,
        user: userResponse
      };

    } catch (error) {
      console.error('Login error:', error);
      set.status = 500;
      return { error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' };
    }
  });

// Auth middleware to protect routes
export const authMiddleware = (requiredRole?: 'staff' | 'resident') => {
  return new Elysia()
    .derive(async ({ jwt, set, headers }) => {
      const authHeader = headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        set.status = 401;
        return { error: 'No token provided', message: 'ไม่พบโทเคนการยืนยันตัวตน' };
      }

      try {
        const payload = await jwt.verify(token);
        
        if (!payload) {
          set.status = 401;
          return { error: 'Invalid token', message: 'โทเคนไม่ถูกต้อง' };
        }

        const user = payload as User;
        
        // Check role if required
        if (requiredRole && user.role !== requiredRole) {
          set.status = 403;
          return { error: 'Insufficient permissions', message: 'ไม่มีสิทธิ์ในการเข้าถึง' };
        }

        return { user };
        
      } catch (error) {
        console.error('Auth middleware error:', error);
        set.status = 401;
        return { error: 'Token verification failed', message: 'การตรวจสอบโทเคนล้มเหลว' };
      }
    });
};
