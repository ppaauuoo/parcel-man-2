# iCondo - Parcel Management System

Modern parcel management for condominiums. Staff receive parcels, residents collect via QR codes. Self-registration, pickup scheduling, photo evidence, Docker + K3s deployment.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Staff Dashboard**
  - Receive & log incoming parcels with photo (camera or file upload)
  - Scan QR codes to verify & hand over parcels to residents
  - Mark parcels as **returned** to sender
  - View complete parcel history with filtering (room, date range)
  - Manage resident accounts (add/register)
  - Photo evidence for both inbound & delivery

- **Resident Portal**
  - View all parcels assigned to their room
  - Generate QR codes for easy collection
  - **Set preferred pickup date/time** (sendout scheduling)
  - **Self-registration** — sign up without staff
  - Track parcel history with photos
  - Share QR code to let others collect

- **Technical Features**
  - Real-time QR code generation & scanning
  - **Base64 photo capture** (compatible with mobile webcams)
  - **Image compression** via sharp (auto-rotate, resize to 1200px, JPEG quality 80)
  - **Code splitting** with React.lazy for fast initial load
  - **Error boundaries** for graceful failure handling
  - **SQLite WAL mode** + indexes for perf
  - Thai language interface
  - Role-based access control (JWT)
  - Mobile-responsive design
  - **Docker deployment** with nginx SPA proxy
  - **K3s/Kubernetes** orchestration

## Tech Stack

### Frontend
- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool & dev server
- **Tailwind CSS** — Styling
- **React Router v6** — Client-side routing
- **Axios** — HTTP client
- **qrcode.react** — QR code generation
- **html5-qrcode** — QR code scanning

### Backend
- **Express** — Web framework
- **TypeScript** — Type safety
- **tsx** — TypeScript execution (dev + prod)
- **SQLite** — Database (WAL mode)
- **JWT** — Authentication
- **Multer** — File uploads
- **bcrypt** — Password hashing
- **sharp** — Image processing (resize, compress, EXIF rotate)
- **qrcode** — QR code generation
- **CORS** — Cross-origin resource sharing

### Infrastructure
- **Docker** — Containerized backend + frontend
- **nginx** — SPA serve + API proxy
- **K3s / Kubernetes** — Deployment, services, ingress, PVC
- **Docker Hub** — Image registry (`ppaaul/icondo-*`)
- **kubectl** — Rollout management

## Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Camera access (for photo capture & QR scanning)
- Docker (optional — for container deployment)

## Installation

### Clone
```bash
git clone https://github.com/yourusername/icondo.git
cd icondo
```

### Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Seed the database
```bash
cd backend
npm run db:seed
```
Creates SQLite database (`icondo.db`) with sample data: staff account, 2 residents, 3 sample parcels.

## Usage

### Quick Start
```bash
# Windows
run-dev-windows.bat

# Unix/Bash
./run-dev.bat
```

### Manual Start
```bash
# Backend (port 3000)
cd backend
npm run dev

# Frontend (port 5173)
cd frontend
npm run dev
```

### Access
Open `http://localhost:5173`

## Demo Credentials

### Staff
| Username | Password | Role |
|----------|----------|------|
| `staff01` | `staff123` | staff |

### Residents
| Username | Password | Room |
|----------|----------|------|
| `resident101` | `resident123` | 101 |
| `resident102` | `resident123` | 102 |

## Project Structure

```
icondo/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts      # DB tables, indexes, migration
│   │   │   ├── seed.ts        # Sample data seeder
│   │   │   └── sqlite.ts      # SQLite connection
│   │   ├── utils/
│   │   │   └── auth.ts        # Password hashing helper
│   │   ├── index.ts           # Express server (all routes inline)
│   │   └── ...
│   ├── icondo.db              # SQLite database (after seed)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddResidentModal.tsx   # Staff add resident form
│   │   │   ├── CameraCapture.tsx      # Camera/webcam capture
│   │   │   ├── ErrorBoundary.tsx      # Error fallback UI
│   │   │   ├── HistoryDashboard.tsx   # Parcel history with filters
│   │   │   ├── ImageModal.tsx         # Full-screen photo viewer
│   │   │   ├── Login.tsx              # Auth login form
│   │   │   ├── QRCodeModal.tsx        # QR code generator + share
│   │   │   ├── Register.tsx           # Resident self-registration
│   │   │   ├── ResidentMyParcels.tsx  # Resident parcel list + pickup scheduling
│   │   │   ├── StaffDeliveryOut.tsx   # QR scan + handover + return
│   │   │   ├── StaffReceiveParcel.tsx # Receive new parcel form
│   │   │   └── UserList.tsx           # Resident list (staff only)
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── api.ts         # Axios client with interceptors
│   │   │   └── preload.ts     # Lazy loading helpers
│   │   ├── App.tsx            # Router + auth state + code splitting
│   │   ├── main.tsx           # React entry point
│   │   └── index.css          # Tailwind base styles
│   └── package.json
├── diagrams/                   # Mermaid architecture diagrams
├── k8s/                        # Kubernetes manifests
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── ingress.yaml
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── pvc.yaml
│   └── secret.yaml
├── Dockerfile.backend          # Express + SQLite (node:20-alpine)
├── Dockerfile.frontend         # React build → nginx serve
├── nginx.conf                  # SPA routing + API proxy to backend
├── build-deploy.bat            # Docker build + push + kubectl apply
├── rollout-restart.bat         # kubectl rollout restart helper
├── run-dev-windows.bat         # Windows dev launcher
├── run-dev.bat                 # Unix dev launcher
├── run-advanced.bat            # Advanced startup options
├── stop.bat                    # Stop all servers
└── README.md
```

## API Endpoints

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Server health + uptime |

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login with username, password, role |
| POST | `/api/auth/register-resident` | No | Self-registration |
| POST | `/api/users/register` | Staff | Staff registers a resident |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/profile` | Any | Get current user profile |
| GET | `/api/users/residents` | Staff | List all residents |

### Parcels
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/parcels` | Staff | Create new parcel |
| GET | `/api/parcels/:id` | Any | Get single parcel details |
| GET | `/api/parcels/resident/:id` | Any | Get parcels for a resident (paginated) |
| GET | `/api/parcels/history` | Any | Parcel history with filters (room, date) |
| PUT | `/api/parcels/:id/collect` | Staff | Mark parcel as collected |
| PUT | `/api/parcels/:id/return` | Staff | Mark parcel as returned to sender |
| PUT | `/api/parcels/update-parcel` | Resident | Set preferred pickup date (`sendout_at`) |
| GET | `/api/parcels/:id/qrcode` | Any | Generate QR code data URL |

### Uploads
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/upload/parcel-photo` | Staff | Upload inbound photo (multipart) |
| POST | `/api/upload/evidence-photo` | Staff | Upload delivery evidence (multipart) |
| POST | `/api/upload/base64-photo` | Staff | Upload base64 photo (mobile/webcam) — auto-compressed via sharp |

## Deployment

### Docker (manual)
```bash
build-deploy.bat           # Build + push + deploy to K3s
build-deploy.bat skipdeploy  # Build + push only
```

### Kubernetes
```bash
kubectl apply -k k8s/
```

### Rollout restart
```bash
rollout-restart.bat              # Restart both deployments
rollout-restart.bat backend      # Restart backend only
rollout-restart.bat frontend     # Restart frontend only
rollout-restart.bat status       # Check rollout status
```

### Images
- `ppaaul/icondo-backend:latest`
- `ppaaul/icondo-frontend:latest`

## Configuration

### Backend `.env`
```
JWT_SECRET=your-secret-key-here
PORT=3000
DATA_DIR=/path/to/data     # Default: backend/
```

### Frontend `.env`
```
VITE_API_URL=/api          # Default: /api (nginx proxy)
```

### nginx (Docker)
Serves frontend SPA, proxies `/api/` and `/uploads/` to backend. Gzip enabled, asset caching 1 year.

## Performance

- **SQLite WAL mode** — concurrent reads + writes
- **Database indexes** — 7 indexes on users + parcels
- **Image compression** — sharp resizes to 1200px, JPEG quality 80, EXIF auto-rotate
- **Code splitting** — React.lazy loads components on demand
- **Static caching** — nginx serves `/assets/` with `public, immutable` (1 year)
- **Upload caching** — Express serves `/uploads/` with `max-age=86400`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Note:** Camera features require HTTPS or localhost.

## Troubleshooting

### Camera not working
- Allow camera permissions in browser
- Check no other app using camera
- Refresh page
- Mobile: serve over HTTPS

### Database errors
- Stop all servers
- Delete `backend/icondo.db`
- Re-run `npm run db:seed`

### CORS issues
- Ensure both servers running (backend:3000, frontend:5173)
- Check Vite proxy config in `frontend/vite.config.ts`

## Development Guidelines

See **[AGENTS.md](./AGENTS.md)** for coding conventions, TypeScript patterns, naming, error handling, security, and commands.

## License

MIT

---

Built with ❤️ for condominium communities
