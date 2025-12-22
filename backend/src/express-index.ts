import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { setupDatabaseSchema } from './db/schema';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'icondo-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database
let db: Database;

// Initialize database
const initializeDatabase = async () => {
  try {
    db = await open({
      filename: './icondo.db',
      driver: sqlite3.Database
    });
    
    await setupDatabaseSchema(db);
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Auth middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided', message: 'ไม่พบโทเคนการยืนยันตัวตน' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token', message: 'โทเคนไม่ถูกต้อง' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (role: 'staff' | 'resident') => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions', message: 'ไม่มีสิทธิ์ในการเข้าถึง' });
    }
    next();
  };
};

// Routes
// Login
app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }

    const user = await db.get(
      'SELECT id, username, password, role, room_number, phone_number FROM users WHERE username = ? AND role = ?',
      [username, role]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        room_number: user.room_number,
        phone_number: user.phone_number
      },
      JWT_SECRET
    );

    return res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        room_number: user.room_number,
        phone_number: user.phone_number
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Get residents
app.get('/api/users/residents', authenticateToken, requireRole('staff'), async (req: express.Request, res: express.Response) => {
  try {
    const residents = await db.all(
      'SELECT id, username, room_number, phone_number FROM users WHERE role = "resident" ORDER BY room_number'
    );

    return res.json({
      success: true,
      residents
    });

  } catch (error) {
    console.error('Get residents error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Get profile
app.get('/api/users/profile', authenticateToken, async (req: express.Request, res: express.Response) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// Create parcel
app.post('/api/parcels', authenticateToken, requireRole('staff'), async (req: express.Request, res: express.Response) => {
  try {
    const { tracking_number, resident_id, carrier_name, room_number } = req.body;

    if (!tracking_number || (!resident_id && !room_number) || !carrier_name) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (เลขพัสดุ, ผู้รับ, ขนส่ง)' 
      });
    }

    // Check if tracking number already exists
    const existingParcel = await db.get(
      'SELECT id FROM parcels WHERE tracking_number = ?',
      [tracking_number]
    );
    
    if (existingParcel) {
      return res.status(400).json({ 
        error: 'Tracking number already exists', 
        message: 'เลขพัสดุนี้มีอยู่ในระบบแล้ว' 
      });
    }

    // Find resident
    let finalResidentId = resident_id;
    if (room_number && !resident_id) {
      const resident = await db.get(
        'SELECT id FROM users WHERE role = "resident" AND room_number = ?',
        [room_number]
      );
      
      if (!resident) {
        return res.status(400).json({ 
          error: 'Resident not found', 
          message: 'ไม่พบผู้อาศัยในห้องนี้' 
        });
      }
      finalResidentId = resident.id;
    }

    // Insert new parcel
    const result = await db.run(
      'INSERT INTO parcels (tracking_number, resident_id, carrier_name, status, staff_in_id, created_at) VALUES (?, ?, ?, "pending", ?, CURRENT_TIMESTAMP)',
      [tracking_number, finalResidentId, carrier_name, req.user.id]
    );

    // Get the created parcel
    const parcel = await db.get(`
      SELECT p.*, u.room_number, u.username as resident_name
      FROM parcels p
      JOIN users u ON p.resident_id = u.id
      WHERE p.id = ?
    `, result.lastID);

    console.log(`🔔 Notification sent to Room ${parcel.room_number}: New parcel ${tracking_number} arrived`);

    return res.json({
      success: true,
      message: 'บันทึกรับพัสดุเรียบร้อย',
      parcel
    });

  } catch (error) {
    console.error('Create parcel error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Get resident parcels
app.get('/api/parcels/resident/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Allow users to view their own parcels
    if (req.user.role === 'resident' && req.user.id !== parseInt(id as string)) {
      return res.status(403).json({ error: 'Access denied', message: 'ไม่มีสิทธิ์ในการดูข้อมูลนี้' });
    }

    const parcels = await db.all(`
      SELECT p.*, u.room_number, u.username as resident_name, 
             u_in.username as staff_in_name, u_out.username as staff_out_name
      FROM parcels p
      JOIN users u ON p.resident_id = u.id
      LEFT JOIN users u_in ON p.staff_in_id = u_in.id
      LEFT JOIN users u_out ON p.staff_out_id = u_out.id
      WHERE p.resident_id = ?
      ORDER BY p.created_at DESC
    `, id);

    return res.json({
      success: true,
      parcels
    });

  } catch (error) {
    console.error('Get parcels error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Collect parcel
app.put('/api/parcels/:id/collect', authenticateToken, requireRole('staff'), async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Get parcel details
    const parcel = await db.get(
      'SELECT * FROM parcels WHERE id = ? AND status = "pending"',
      [id]
    );

    if (!parcel) {
      return res.status(404).json({ 
        error: 'Parcel not found or already collected', 
        message: 'ไม่พบพัสดุนี้หรือพัสดุถูกเบิกแล้ว' 
      });
    }

    // Update parcel status
    await db.run(
      'UPDATE parcels SET status = "collected", collected_at = CURRENT_TIMESTAMP, staff_out_id = ? WHERE id = ?',
      [req.user.id, id]
    );

    return res.json({
      success: true,
      message: 'ยืนยันการรับพัสดุเรียบร้อย'
    });

  } catch (error) {
    console.error('Collect parcel error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Get history
app.get('/api/parcels/history', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { room_number, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let whereClause = '1=1';
    const params: any[] = [];

    // Add filters
    if (room_number) {
      whereClause += ' AND u.room_number = ?';
      params.push(room_number);
    }

    if (start_date) {
      whereClause += ' AND p.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND p.created_at <= ?';
      params.push(end_date);
    }

    params.push(parseInt(limit as string), parseInt(offset as string));

    const parcels = await db.all(`
      SELECT p.*, 
             u.room_number, u.username as resident_name, u.phone_number,
             u_in.username as staff_in_name, u_out.username as staff_out_name
      FROM parcels p
      JOIN users u ON p.resident_id = u.id
      LEFT JOIN users u_in ON p.staff_in_id = u_in.id
      LEFT JOIN users u_out ON p.staff_out_id = u_out.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, ...params);

    // Get total count
    const countParams = params.slice(0, -2);
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM parcels p
      JOIN users u ON p.resident_id = u.id
      WHERE ${whereClause}
    `, ...countParams);

    return res.json({
      success: true,
      parcels,
      total: countResult.total,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Generate QR code
app.get('/api/parcels/:id/qrcode', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Generate QR code for parcel ID
    const qrCodeData = JSON.stringify({
      parcel_id: id,
      type: 'parcel_collection',
      timestamp: new Date().toISOString()
    });

    const qrCode = await QRCode.toDataURL(qrCodeData);

    return res.json({
      success: true,
      qrCode,
      parcelId: id
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    return res.status(500).json({ error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Start server
const startServer = async () => {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log('🚀 Express server is running at http://localhost:' + PORT);
    console.log('📦 iCondo Backend API is ready!');
  });
};

startServer().catch(console.error);
