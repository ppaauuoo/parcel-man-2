# Data Flow Diagrams

## User Authentication & Parcel Management Flow

```mermaid
sequenceDiagram
    actor Staff
    actor Resident
    participant Frontend
    participant Backend
    participant Database
    
    Note over Staff,Resident: Authentication Flow
    Staff->>Frontend: Login (username, password, role)
    Frontend->>Backend: POST /api/auth/login
    Backend->>Database: Query user
    Database-->>Backend: User data
    Backend->>Backend: Verify password with bcrypt
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: JWT token + user data
    Frontend->>Frontend: Store token in localStorage
    Frontend->>Frontend: Redirect to dashboard
    
    Note over Staff,Resident: Parcel Reception Flow
    Staff->>Frontend: Receive Parcel Form
    Frontend->>Frontend: Capture Photo (CameraCapture)
    Staff->>Frontend: Enter tracking number, carrier, select resident
    Frontend->>Backend: POST /api/upload/base64-photo
    Backend->>Backend: Save image to uploads/parcels/
    Backend-->>Frontend: Photo path
    Frontend->>Backend: POST /api/parcels
    Backend->>Database: Insert parcel (status: pending)
    Backend-->>Frontend: Success + parcel data
    Backend-->>Resident: Notification sent to room
    
    Note over Staff,Resident: Parcel Collection Flow
    Resident->>Frontend: View My Parcels
    Frontend->>Backend: GET /api/parcels/resident/:id
    Backend->>Database: Query parcels by resident_id
    Database-->>Backend: Parcel list
    Backend-->>Frontend: Parcel list with status
    Resident->>Frontend: Generate QR Code for parcel
    Frontend->>Backend: GET /api/parcels/:id/qrcode
    Backend->>Backend: Generate QR code with parcel_id
    Backend-->>Frontend: QR Code data URL
    Staff->>Frontend: Scan QR Code
    Staff->>Frontend: Capture Evidence Photo
    Frontend->>Backend: POST /api/upload/base64-photo
    Backend-->>Frontend: Evidence photo path
    Frontend->>Backend: PUT /api/parcels/:id/collect
    Backend->>Database: Update parcel status (collected)
    Backend->>Database: Set collected_at timestamp
    Backend->>Database: Link staff_out_id
    Backend-->>Frontend: Success
```

## Key Data Flows

### 1. Authentication Flow
- User submits credentials → Backend validates → JWT token issued → Token stored → All subsequent requests include token

### 2. Parcel Reception Flow (Staff Only)
- Select/enter resident → Capture parcel photo → Enter details → Create parcel record → Notification sent

### 3. Parcel Collection Flow (Staff + Resident)
- Resident views parcels → Generates QR code → Staff scans QR → Captures evidence photo → Marks as collected

### 4. Photo Upload Flow
- Camera capture → Base64 encoding → Upload endpoint → Server saves to disk → Returns file path

### 5. History Query Flow
- Apply filters (room, date range) → Query with params → Join users and parcels → Return paginated results

## State Management

### Client-Side State (React)
- **User State**: Stored in localStorage and React state
- **Auth Token**: Stored in localStorage, added to request headers
- **Component State**: Local useState for forms, loading states
- **Navigation**: React Router for page transitions

### Server-Side State (SQLite)
- **Users Table**: Authentication and profile data
- **Parcels Table**: Transaction records with status tracking
- **File Storage**: Photos saved to filesystem with reference paths

## Error Handling Flow

```mermaid
graph TD
    A[Client Request] --> B{Valid Token?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Valid Request?}
    D -->|No| E[400 Bad Request]
    D -->|Yes| F{Database Success?}
    F -->|No| G[500 Internal Error]
    F -->|Yes| H[200 OK + Data]
    
    C --> I[Redirect to Login]
    E --> J[Show Error Message]
    G --> J
    H --> K[Update UI]
```
