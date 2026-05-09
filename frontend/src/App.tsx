import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ErrorBoundary from './components/ErrorBoundary';
import { User } from './types';
import { preload } from './utils/preload';

const StaffReceiveParcel = lazy(preload.staffReceiveParcel);
const ResidentMyParcels = lazy(preload.residentMyParcels);
const StaffDeliveryOut = lazy(preload.staffDeliveryOut);
const HistoryDashboard = lazy(preload.historyDashboard);
const UserList = lazy(preload.userList);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Use ref to access navigate inside handleLogin without re-render issues
  const navigate = useNavigate();

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    // Navigate immediately — avoids relying on <Navigate> mount in swapped Routes
    const defaultPath = userData.role === 'staff' ? '/receive-parcel' : '/my-parcels';
    navigate(defaultPath, { replace: true });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    );
  }

  const SuspenseFallback = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 sm:mt-4 text-sm text-gray-600">กำลังโหลด...</p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
        
        {/* Staff Routes */}
        {user.role === 'staff' && (
          <>
            <Route
              path="/receive-parcel"
              element={<StaffReceiveParcel user={user} onLogout={handleLogout} />}
            />
            <Route
              path="/delivery-out"
              element={<StaffDeliveryOut user={user} onLogout={handleLogout} />}
            />
            <Route
              path="/history"
              element={<HistoryDashboard user={user} onLogout={handleLogout} />}
            />
            <Route
              path="/users"
              element={<UserList user={user} onLogout={handleLogout} />}
            />
          </>
        )}

        {/* Resident Routes */}
        {user.role === 'resident' && (
          <>
            <Route
              path="/my-parcels"
              element={<ResidentMyParcels user={user} onLogout={handleLogout} />}
            />
            <Route
              path="/history"
              element={<HistoryDashboard user={user} onLogout={handleLogout} />}
            />
          </>
        )}

        {/* Default redirect based on role */}
        <Route
          path="/"
          element={
            <Navigate
              to={user.role === 'staff' ? '/receive-parcel' : '/my-parcels'}
              replace
            />
          }
        />
        
        {/* Catch all route */}
        <Route
          path="*"
          element={
            <Navigate
              to={user.role === 'staff' ? '/receive-parcel' : '/my-parcels'}
              replace
            />
          }
        />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
