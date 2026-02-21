# API Endpoints Documentation

## API Overview

Base URL: `http://localhost:3000/api`

All endpoints (except login) require JWT authentication via `Authorization: Bearer <token>` header.

## Authentication Endpoints

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "staff" | "resident"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "เข้าสู่ระบบสำเร็จ",
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "staff01",
    "role": "staff",
    "room_number": null,
    "phone_number": "081-234-5678"
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `401`: Invalid credentials

---

## User Endpoints

### GET /users/profile
Get current user profile.

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "staff01",
    "role": "staff",
    "phone_number": "081-234-5678"
  }
}
```

---

### GET /users/residents
Get all residents (staff only).

**Authentication:** Required (staff role)

**Query Parameters:** None

**Response (200):**
```json
{
  "success": true,
  "residents": [
    {
      "id": 2,
      "username": "resident101",
      "room_number": "011",
      "phone_number": "081-987-6543"
    }
  ]
}
```

---

### POST /users/register
Register new resident (staff only).

**Authentication:** Required (staff role)

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "room_number": "string",
  "phone_number": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "ลงทะเบียนผู้อาศัยเรียบร้อย",
  "user": {
    "id": 3,
    "username": "resident102",
    "room_number": "012",
    "phone_number": "081-555-5555"
  }
}
```

**Error Responses:**
- `400`: Username already exists, room already occupied

---

## Parcel Endpoints

### POST /parcels
Create new parcel (staff only).

**Authentication:** Required (staff role)

**Request Body:**
```json
{
  "tracking_number": "TH123456789",
  "resident_id": 2,
  "carrier_name": "Kerry Express",
  "room_number": "011",
  "photo_in_path": "/uploads/parcels/1/photo_in-123456789.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "บันทึกรับพัสดุเรียบร้อย",
  "parcel": {
    "id": 1,
    "tracking_number": "TH123456789",
    "resident_id": 2,
    "carrier_name": "Kerry Express",
    "status": "pending",
    "created_at": "2025-01-15 14:30:00"
  }
}
```

**Error Responses:**
- `400`: Tracking number already exists, missing required fields, resident not found

---

### GET /parcels/resident/:id
Get parcels for specific resident.

**Authentication:** Required

**Path Parameters:**
- `id`: Resident user ID

**Response (200):**
```json
{
  "success": true,
  "parcels": [
    {
      "id": 1,
      "tracking_number": "TH123456789",
      "carrier_name": "Kerry Express",
      "status": "pending",
      "created_at": "2025-01-15 14:30:00",
      "photo_in_path": "/uploads/parcels/1/photo_in-123456789.jpg",
      "room_number": "011",
      "resident_name": "resident101"
    }
  ]
}
```

---

### PUT /parcels/:id/collect
Mark parcel as collected (staff only).

**Authentication:** Required (staff role)

**Path Parameters:**
- `id`: Parcel ID

**Request Body:**
```json
{
  "staff_id": 1,
  "photo_out_path": "/uploads/parcels/1/photo_out-987654321.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "ยืนยันการรับพัสดุเรียบร้อย"
}
```

**Error Responses:**
- `404`: Parcel not found or already collected

---

### GET /parcels/history
Get parcel history with filters.

**Authentication:** Required

**Query Parameters:**
- `room_number` (optional): Filter by room number
- `start_date` (optional): Filter by start date
- `end_date` (optional): Filter by end date
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:** `/parcels/history?room_number=011&start_date=2025-01-01&limit=20`

**Response (200):**
```json
{
  "success": true,
  "parcels": [
    {
      "id": 1,
      "tracking_number": "TH123456789",
      "carrier_name": "Kerry Express",
      "status": "collected",
      "created_at": "2025-01-15 14:30:00",
      "collected_at": "2025-01-15 16:45:00",
      "room_number": "011",
      "resident_name": "resident101",
      "staff_in_name": "staff01",
      "staff_out_name": "staff01"
    }
  ],
  "total": 45,
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

---

### GET /parcels/:id
Get single parcel by ID.

**Authentication:** Required

**Path Parameters:**
- `id`: Parcel ID

**Response (200):**
```json
{
  "success": true,
  "parcel": {
    "id": 1,
    "tracking_number": "TH123456789",
    "resident_id": 2,
    "carrier_name": "Kerry Express",
    "status": "pending",
    "created_at": "2025-01-15 14:30:00",
    "room_number": "011",
    "resident_name": "resident101"
  }
}
```

---

### GET /parcels/:id/qrcode
Generate QR code for parcel.

**Authentication:** Required

**Path Parameters:**
- `id`: Parcel ID

**Response (200):**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "parcelId": "1"
}
```

The QR code contains JSON data:
```json
{
  "parcel_id": 1,
  "type": "parcel_collection"
}
```

---

## Upload Endpoints

### POST /upload/parcel-photo
Upload parcel incoming photo (multer).

**Authentication:** Required (staff role)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `photo`: Image file (max 10MB)
- `parcel_id`: Parcel ID for directory organization

**Response (200):**
```json
{
  "success": true,
  "message": "อัพโหลดรูปภาพเรียบร้อย",
  "photo_path": "/uploads/parcels/1/photo-1736940800000-123456789.jpg"
}
```

---

### POST /upload/evidence-photo
Upload collection evidence photo (multer).

**Authentication:** Required (staff role)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `photo`: Image file (max 10MB)
- `parcel_id`: Parcel ID for directory organization

**Response (200):**
```json
{
  "success": true,
  "message": "อัพโหลดรูปภาพหลักฐานเรียบร้อย",
  "photo_path": "/uploads/parcels/1/evidence-1736940800000-987654321.jpg"
}
```

---

### POST /upload/base64-photo
Upload base64 encoded photo (mobile compatible).

**Authentication:** Required (staff role)

**Request Body:**
```json
{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "parcel_id": "1",
  "photo_type": "photo_in" | "photo_out"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "อัพโหลดรูปภาพเรียบร้อย",
  "photo_path": "/uploads/parcels/1/photo_in-1736940800000-123456789.jpg"
}
```

**Error Responses:**
- `400`: Invalid image format, missing required fields

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "Error message in English",
  "message": "ข้อความแสดงข้อผิดพลาดภาษาไทย"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors, duplicates)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Authentication Flow

1. User calls `/auth/login` with credentials
2. Server validates credentials
3. Server returns JWT token
4. Client stores token in `localStorage`
5. Client includes token in `Authorization` header for all subsequent requests
6. Server validates token using `authenticateToken` middleware
7. Server checks role using `requireRole` middleware if needed

---

## Rate Limiting & Validation

- **File Size Limit**: 10MB per photo
- **Accepted Image Formats**: JPEG, PNG, GIF
- **Password Validation**: Hashed with bcrypt (not plaintext)
- **Username**: Must be unique
- **Room Number**: One resident per room
- **Tracking Number**: Must be unique
