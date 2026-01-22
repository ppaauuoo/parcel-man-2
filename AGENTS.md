# AGENTS.md

This file contains guidelines for agentic coding agents working on this codebase.

## Project Overview
iCondo - Parcel management system for condominiums. Staff receives parcels, residents collect them with QR codes.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + React Router + Axios
- Backend: Express + TypeScript + SQLite
- Auth: JWT
- QR: qrcode.react + html5-qrcode

## Build / Lint / Test Commands

### Frontend (in `frontend/` directory)
```bash
npm run dev          # Start development server (Vite, hot reload)
npm run build        # Build for production (tsc + vite build)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (in `backend/` directory)
```bash
npm run dev          # Start development server with tsx watch
npm start            # Start production server
npm run db:seed      # Seed database with test data
```

### Development Workflow
```bash
# Start both frontend and backend (Windows)
run-dev-windows.bat

# Start both frontend and backend (Unix/Bash)
cd backend && npm run dev &
cd frontend && npm run dev &
```

**Note:** No testing framework is currently set up. Single test execution not available.

## Code Style Guidelines

### Imports
**Frontend:**
1. React imports first
2. Project imports (types, utils, components)
3. Named exports from utility files

```typescript
import React, { useState, useEffect } from 'react';
import { User, CreateParcelRequest } from '../types';
import { parcelsAPI, usersAPI } from '../utils/api';
import CameraCapture from './CameraCapture';
```

**Backend:**
1. Framework/library imports (Express, etc.)
2. Local imports (utils, database, etc.)
3. Type imports use `type` keyword when possible

```typescript
import express from 'express';
import { hashPassword } from './utils/auth';
import { setupDatabaseSchema } from './db/schema';
```

### Component Structure
- Use functional components with hooks
- Define props interface before component
- Use `React.FC<PropsInterface>` type annotation
- Destructure props in component parameters

```typescript
interface StaffReceiveParcelProps {
  user: User;
  onLogout: () => void;
}

const StaffReceiveParcel: React.FC<StaffReceiveParcelProps> = ({ user, onLogout }) => {
  // Component logic
};
```

### Naming Conventions
- **Components:** PascalCase (e.g., `StaffReceiveParcel`, `CameraCapture`)
- **Variables/Functions:** camelCase (e.g., `loadResidents`, `handleInputChange`)
- **Constants:** UPPER_CASE or PascalCase (e.g., `API_BASE_URL`)
- **Interfaces:** PascalCase (e.g., `User`, `Parcel`, `LoginRequest`)
- **API objects:** camelCase + 'API' suffix (e.g., `authAPI`, `usersAPI`, `parcelsAPI`)
- **Event handlers:** Prefix with 'handle' (e.g., `handleSubmit`, `handleRoleChange`)
- **State setters:** Prefix with 'set' (e.g., `setLoading`, `setError`)

### TypeScript Patterns
- **Strict mode:** Enabled in both frontend and backend
- **All types:** Use `interface` for object shapes
- **Union types:** Use string literal unions for enums (e.g., `'staff' | 'resident'`)
- **Optional fields:** Mark with `?` (e.g., `photo_in_path?: string`)
- **React refs:** Type with element (e.g., `useRef<HTMLVideoElement>(null)`)

```typescript
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
const videoRef = useRef<HTMLVideoElement>(null);
```

### State Management
- Use `useState` for local component state
- Initialize state with proper TypeScript types
- Use `useEffect` for side effects (data fetching, subscriptions)
- Use `useRef` for DOM elements and persistent values

```typescript
const loadResidents = async () => {
  try {
    const response = await usersAPI.getResidents();
    if (response.success) {
      setResidents(response.residents);
    }
  } catch (error) {
    console.error('Error loading residents:', error);
  }
};

useEffect(() => {
  loadResidents();
}, []);
```

### Error Handling
**Frontend:**
- Wrap async operations in try-catch
- Check `error.response?.data?.message` for API errors
- Display user-friendly error messages (Thai)
- Set error state for UI feedback

```typescript
try {
  const response = await usersAPI.getResidents();
  if (response.success) {
    setResidents(response.residents);
  }
} catch (error: any) {
  setMessage({
    type: 'error',
    text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
  });
}
```

**Backend:**
- Wrap route handlers in try-catch
- Return error objects with both English `error` and Thai `message` fields
- Set appropriate HTTP status codes (400, 401, etc.)
- Log errors to console for debugging

```typescript
try {
  // Route logic
} catch (error) {
  console.error('Route error:', error);
  set.status = 500;
  return {
    error: 'Internal server error',
    message: 'เกิดข้อผิดพลาดในระบบ'
  };
}
```

### Logging
- **Backend notifications:** Use emoji prefix and context (e.g., `🔔 Notification sent...`)
- **Errors:** Always include context (e.g., `console.error('Error loading residents:', error)`)
- **Debug info:** Include relevant details without exposing sensitive data

```typescript
console.log('🔔 Notification sent to Room ${room}: New parcel arrived');
console.error('Login error:', error);
```

### Styling (Tailwind CSS)
- Use utility classes for all styling
- Mobile-first responsive design
- Breakpoints: `xs` (475px), `sm` (640px), `md` (768px), `lg` (1024px)
- Thai font support: `font-thai`
- Consistent spacing: use `p-4 sm:p-6` pattern for padding
- State-dependent styles: use conditional rendering

```typescript
<div className="min-h-screen bg-gray-50">
  <button className={`px-4 py-2 rounded-md ${
    loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
  }`}>
    {loading ? 'กำลังโหลด...' : 'ยืนยัน'}
  </button>
</div>
```

### Backend API Structure
- Use Express framework
- All routes defined in `src/index.ts` with `/api` prefix
- Apply middleware for authentication: `authenticateToken` and `requireRole('staff')`
- Database connection initialized on startup
- Return structured responses: `{ success: boolean, message: string, data?: any }`

```typescript
app.post('/api/parcels', authenticateToken, requireRole('staff'), async (req: express.Request, res: express.Response) => {
  try {
    const { tracking_number, resident_id, carrier_name, room_number, photo_in_path } = req.body;
    // Route logic
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
```

### File Organization
**Frontend:**
- `src/components/` - React components
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions (API client, etc.)
- `src/App.tsx` - Main app with routing

**Backend:**
- `src/db/` - Database schema and connection
- `src/utils/` - Utility functions (auth helpers, etc.)
- `src/index.ts` - Server entry point with all routes

### Security Best Practices
- Never commit secrets (use environment variables)
- Use JWT for authentication
- Validate all inputs before processing
- Sanitize user inputs
- Apply CORS headers for cross-origin requests
- Use parameterized queries to prevent SQL injection

### React Hooks Usage
- Always include dependencies array in `useEffect`
- Use `useRef` for persistent values across renders (avoiding closure issues)
- Cleanup side effects in `useEffect` return function
- Prefer `useCallback` for functions passed to child components

```typescript
useEffect(() => {
  loadResidents();
}, []); // Empty array for mount-only

useEffect(() => {
  return () => {
    // Cleanup function
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };
}, [stream]);
```

### Code Quality
- Run `npm run lint` before committing
- Fix all ESLint warnings
- Use meaningful variable names
- Keep functions focused and single-purpose
- Extract complex logic into helper functions
- Add comments only for non-obvious logic

### Internationalization
- User interface uses Thai language
- Error messages in Thai for users
- API error messages include both English (dev) and Thai (user)
- English for code comments and technical terms

### Development Notes
- Frontend runs on port 5173, backend on port 3000
- API proxy configured in Vite: `/api` → `http://localhost:3000/api`
- SQLite database file: `backend/icondo.db`
- Test credentials in `run-dev-windows.bat`
- Hot reload enabled for both frontend and backend

### Adding New Features
1. Create type definitions in `frontend/src/types/index.ts` or `backend/src/db/schema.ts`
2. Add API routes in `backend/src/routes/`
3. Create API functions in `frontend/src/utils/api.ts`
4. Build React component in `frontend/src/components/`
5. Add route in `frontend/src/App.tsx`
6. Test functionality manually
7. Run lint to ensure code quality
