import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StaffReceiveParcel from './components/StaffReceiveParcel';
import ResidentMyParcels from './components/ResidentMyParcels';
import StaffDeliveryOut from './components/StaffDeliveryOut';
import HistoryDashboard from './components/HistoryDashboard';
import { User } from './types';

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

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<Navigate to={user.role === 'staff' ? '/receive-parcel' : '/my-parcels'} replace />}
      />
      
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
  );
};

export default App;
