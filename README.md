# iCondo - Parcel Management System

A modern parcel management system for condominiums, enabling staff to receive parcels and residents to collect them using QR codes.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Staff Dashboard**
  - Receive and log incoming parcels with photos
  - Scan QR codes to verify and hand over parcels to residents
  - View complete parcel history with filtering options
  - Manage resident accounts

- **Resident Portal**
  - View all parcels assigned to their room
  - Generate QR codes for easy parcel collection
  - Track parcel history
  - Receive notifications for new arrivals

- **Technical Features**
  - Real-time QR code generation and scanning
  - Photo capture for parcel verification
  - Mobile-responsive design
  - Thai language interface
  - Role-based access control

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **qrcode.react** - QR code generation
- **html5-qrcode** - QR code scanning

### Backend
- **Elysia** - Fast web framework
- **TypeScript** - Type safety
- **SQLite** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **bcrypt** - Password hashing
- **qrcode** - QR code generation

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Camera access (for photo capture and QR scanning)

## Installation

### Clone the repository
```bash
git clone https://github.com/yourusername/icondo.git
cd icondo
```

### Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Seed the database
```bash
cd backend
npm run db:seed
```

This will create the SQLite database and populate it with sample data including test users and sample parcels.

## Usage

### Quick Start (Windows)

Run the provided batch file to start both servers:
```bash
run-dev-windows.bat
```

### Manual Start

**Backend Server:**
```bash
cd backend
npm run dev
```
The backend will start on `http://localhost:3000`

**Frontend Server:**
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

### Access the Application

Open your browser and navigate to: `http://localhost:5173`

## Demo Credentials

### Staff Account
- **Username:** `staff01`
- **Password:** `staff123`

### Resident Accounts
- **Username:** `resident101` | **Password:** `resident123` | **Room:** 011
- **Username:** `resident102` | **Password:** `resident123` | **Room:** 012

## Project Structure

```
icondo/
├── backend/
│   ├── src/
│   │   ├── db/              # Database schema and connection
│   │   │   ├── schema.ts    # Database tables and types
│   │   │   ├── seed.ts      # Sample data seeder
│   │   │   └── sqlite.ts    # SQLite connection
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.ts      # Authentication routes
│   │   │   ├── parcels.ts   # Parcel management routes
│   │   │   └── users.ts     # User management routes
│   │   ├── utils/           # Utility functions
│   │   │   └── auth.ts      # Auth helpers (hashing, JWT)
│   │   ├── express-index.ts # Express server entry
│   │   └── index.ts         # Main application entry
│   ├── icondo.db            # SQLite database (created after seeding)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── AddResidentModal.tsx
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── HistoryDashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── QRCodeModal.tsx
│   │   │   ├── ResidentMyParcels.tsx
│   │   │   ├── StaffDeliveryOut.tsx
│   │   │   ├── StaffReceiveParcel.tsx
│   │   │   └── UserList.tsx
│   │   ├── types/           # TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── utils/           # Utility functions
│   │   │   └── api.ts       # API client with axios
│   │   ├── App.tsx          # Main app with routing
│   │   └── main.tsx         # React entry point
│   └── package.json
├── run-dev-windows.bat      # Windows development script
├── run-dev.bat              # Unix/Bash development script
├── stop.bat                 # Stop all servers
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/residents` - Get all residents (staff only)
- `POST /api/users/register` - Register new resident (staff only)

### Parcels
- `POST /api/parcels` - Create new parcel (staff only)
- `GET /api/parcels/resident/:id` - Get parcels for resident
- `PUT /api/parcels/:id/collect` - Mark parcel as collected (staff only)
- `GET /api/parcels/history` - Get parcel history (with filters)
- `GET /api/parcels/:id/qrcode` - Generate QR code for parcel

## Development Workflow

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```
This creates an optimized production build in `frontend/dist/`

**Backend:**
```bash
cd backend
npm start
```

### Code Quality

**Lint the frontend:**
```bash
cd frontend
npm run lint
```

### Hot Reload

Both frontend and backend support hot reload during development:
- Frontend changes automatically refresh in the browser
- Backend changes automatically restart the server

## Configuration

### Environment Variables

Backend environment variables (create `.env` in `backend/`):
```
JWT_SECRET=your-secret-key-here
PORT=3000
```

Frontend environment variables (create `.env` in `frontend/`):
```
VITE_API_URL=http://localhost:3000/api
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Note:** Camera features require HTTPS or localhost for security reasons.

## Troubleshooting

### Camera not working
- Ensure camera permissions are allowed in your browser
- Check if another application is using the camera
- Try refreshing the page
- On mobile devices, ensure the app is served over HTTPS

### Database errors
- Stop all servers
- Delete `backend/icondo.db`
- Run `npm run db:seed` to recreate the database

### CORS issues
- Ensure both frontend and backend are running
- Check that the backend is on port 3000 and frontend on port 5173
- Verify proxy configuration in `frontend/vite.config.ts`

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes linting:
```bash
cd frontend && npm run lint
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Built with ❤️ for condominium communities
