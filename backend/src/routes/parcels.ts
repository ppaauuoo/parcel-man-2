import { Elysia } from 'elysia';
import QRCode from 'qrcode';
import { authMiddleware } from './auth';

export const parcelRoutes = new Elysia({ prefix: '/parcels' })
  .use(authMiddleware('staff'))
  .post('/', async ({ body, set, db, user }) => {
    try {
      const { tracking_number, resident_id, carrier_name, room_number } = body;

      // Validate required fields
      if (!tracking_number || (!resident_id && !room_number) || !carrier_name) {
        set.status = 400;
        return { 
          error: 'Missing required fields', 
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน (เลขพัสดุ, ผู้รับ, ขนส่ง)' 
        };
      }

      // Check if tracking number already exists
      const existingParcel = await db.get('SELECT id FROM parcels WHERE tracking_number = ?', tracking_number);
      
      if (existingParcel) {
        set.status = 400;
        return { 
          error: 'Tracking number already exists', 
          message: 'เลขพัสดุนี้มีอยู่ในระบบแล้ว' 
        };
      }

      // If room_number is provided instead of resident_id, find the resident
      let finalResidentId = resident_id;
      if (room_number && !resident_id) {
        const resident = await db.get('SELECT id FROM users WHERE role = "resident" AND room_number = ?', room_number);
        
        if (!resident) {
          set.status = 400;
          return { 
            error: 'Resident not found', 
            message: 'ไม่พบผู้อาศัยในห้องนี้' 
          };
        }
        finalResidentId = resident.id;
      }

      // Verify resident exists
      const resident = await db.get('SELECT id FROM users WHERE id = ? AND role = "resident"', finalResidentId);
      
      if (!resident) {
        set.status = 400;
        return { 
          error: 'Resident not found', 
          message: 'ไม่พบผู้รับพัสดุนี้' 
        };
      }

      // Insert new parcel
      const result = await db.run(`
        INSERT INTO parcels (tracking_number, resident_id, carrier_name, status, staff_in_id, created_at)
        VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
      `, tracking_number, finalResidentId, carrier_name, user.id);

      // Get the created parcel
      const parcel = await db.get(`
        SELECT p.*, u.room_number, u.username as resident_name
        FROM parcels p
        JOIN users u ON p.resident_id = u.id
        WHERE p.id = ?
      `, result.lastID);

      // Mock notification (in real app, this would send SMS/Push notification)
      console.log(`🔔 Notification sent to Room ${parcel.room_number}: New parcel ${tracking_number} arrived`);

      return {
        success: true,
        message: 'บันทึกรับพัสดุเรียบร้อย',
        parcel
      };

    } catch (error) {
      console.error('Create parcel error:', error);
      set.status = 500;
      return { error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' };
    }
  })
  .get('/resident/:id', async ({ params, set, db, user }) => {
    try {
      const { id } = params;

      // Allow users to view their own parcels
      if (user.role === 'resident' && user.id !== parseInt(id)) {
        set.status = 403;
        return { error: 'Access denied', message: 'ไม่มีสิทธิ์ในการดูข้อมูลนี้' };
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

      return {
        success: true,
        parcels
      };

    } catch (error) {
      console.error('Get parcels error:', error);
      set.status = 500;
      return { error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' };
    }
  })
  .put('/:id/collect', async ({ params, set, db, user }) => {
    try {
      const { id } = params;

      // Get parcel details
      const parcel = await db.get('SELECT * FROM parcels WHERE id = ? AND status = "pending"', id);

      if (!parcel) {
        set.status = 404;
        return { 
          error: 'Parcel not found or already collected', 
          message: 'ไม่พบพัสดุนี้หรือพัสดุถูกเบิกแล้ว' 
        };
      }

      // Update parcel status
      await db.run(`
        UPDATE parcels 
        SET status = 'collected', collected_at = CURRENT_TIMESTAMP, staff_out_id = ?
        WHERE id = ?
      `, user.id, id);

      return {
        success: true,
        message: 'ยืนยันการรับพัสดุเรียบร้อย'
      };

    } catch (error) {
      console.error('Collect parcel error:', error);
      set.status = 500;
      return { error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' };
    }
  })
  .get('/history', async ({ query, set, db, user }) => {
    try {
      const { room_number, start_date, end_date, limit = 50, offset = 0 } = query;

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

      return {
        success: true,
        parcels,
        total: countResult.total,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      };

    } catch (error) {
      console.error('Get history error:', error);
      set.status = 500;
      return { error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' };
    }
  })
  .get('/:id/qrcode', async ({ params, set }) => {
    try {
      const { id } = params;

      // Generate QR code for parcel ID
      const qrCodeData = JSON.stringify({
        parcel_id: id,
        type: 'parcel_collection',
        timestamp: new Date().toISOString()
      });

      const qrCode = await QRCode.toDataURL(qrCodeData);

      return {
        success: true,
        qrCode,
        parcelId: id
      };

    } catch (error) {
      console.error('Generate QR code error:', error);
      set.status = 500;
      return { error: 'Internal server error', message: 'เกิดข้อผิดพลาดในระบบ' };
    }
  });
