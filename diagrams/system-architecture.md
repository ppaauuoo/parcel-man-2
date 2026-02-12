# iCondo System Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        F1[App.tsx<br/>Main Router]
        F2[Login Component]
        F3[Staff Components]
        F4[Resident Components]
        F5[Shared Components]
        F6[API Utils]
        F7[Type Definitions]
        
        F3 --> F31[StaffReceiveParcel]
        F3 --> F32[StaffDeliveryOut]
        F3 --> F33[UserList]
        F4 --> F41[ResidentMyParcels]
        F5 --> F51[CameraCapture]
        F5 --> F52[QRCodeModal]
        F5 --> F53[HistoryDashboard]
        F5 --> F54[AddResidentModal]
        F5 --> F55[ImageModal]
    end
    
    subgraph "Backend Layer"
        B1[Express Server<br/>Port 3000]
        B2[JWT Middleware]
        B3[Auth Routes]
        B4[User Routes]
        B5[Parcel Routes]
        B6[Upload Routes]
        B7[SQLite Database]
        
        B3 --> B31[POST /api/auth/login]
        B4 --> B41[GET /api/users/residents]
        B4 --> B42[GET /api/users/profile]
        B4 --> B43[POST /api/users/register]
        B5 --> B51[POST /api/parcels]
        B5 --> B52[GET /api/parcels/resident/:id]
        B5 --> B53[PUT /api/parcels/:id/collect]
        B5 --> B54[GET /api/parcels/history]
        B5 --> B55[GET /api/parcels/:id/qrcode]
        B6 --> B61[POST /api/upload/parcel-photo]
        B6 --> B62[POST /api/upload/evidence-photo]
        B6 --> B63[POST /api/upload/base64-photo]
    end
    
    subgraph "Database Schema"
        D1[(users table)]
        D2[(parcels table)]
        
        D1 --> D1A[id<br/>username<br/>password<br/>role<br/>room_number<br/>phone_number<br/>created_at]
        D2 --> D2A[id<br/>tracking_number<br/>resident_id<br/>carrier_name<br/>photo_in_path<br/>status<br/>created_at<br/>collected_at<br/>photo_out_path<br/>staff_in_id<br/>staff_out_id]
        
        D2 -.->|FK| D1
    end
    
    subgraph "Tech Stack"
        T1[React 18 + TypeScript]
        T2[Vite + Tailwind CSS]
        T3[React Router]
        T4[Axios]
        T5[qrcode.react]
        T6[html5-qrcode]
        T7[Express + TypeScript]
        T8[SQLite]
        T9[JWT + bcrypt]
        T10[Multer]
    end
    
    F1 --> F2
    F1 --> F3
    F1 --> F4
    F1 --> F5
    F3 --> F6
    F4 --> F6
    F5 --> F6
    F3 --> F7
    F4 --> F7
    
    F6 -->|HTTP Requests| B1
    B1 --> B2
    B2 --> B3
    B2 --> B4
    B2 --> B5
    B2 --> B6
    B3 --> B7
    B4 --> B7
    B5 --> B7
    
    B7 --> D1
    B7 --> D2
    
    T1 -.-> F3
    T2 -.-> F3
    T3 -.-> F1
    T4 -.-> F6
    T5 -.-> F52
    T6 -.-> F32
    T7 -.-> B1
    T8 -.-> B7
    T9 -.-> B2
    T10 -.-> B6
    
    style F1 fill:#61dafb
    style F2 fill:#61dafb
    style F3 fill:#61dafb
    style F4 fill:#61dafb
    style F5 fill:#61dafb
    style B1 fill:#68a063
    style B7 fill:#f7b731
    style D1 fill:#ee5253
    style D2 fill:#ee5253
```

## Architecture Overview

The iCondo system follows a classic three-tier architecture:

### Frontend Layer (Port 5173)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Key Libraries**: qrcode.react, html5-qrcode

### Backend Layer (Port 3000)
- **Framework**: Express with TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: SQLite
- **File Upload**: Multer
- **Password Hashing**: bcrypt

### Database Layer
- **SQLite** for data persistence
- **Two main tables**: users and parcels
- **Indexes** for query optimization
