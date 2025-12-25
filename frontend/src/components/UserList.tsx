import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { usersAPI } from '../utils/api';
import AddResidentModal from './AddResidentModal';

interface UserListProps {
  user: User;
  onLogout: () => void;
}

const UserList: React.FC<UserListProps> = ({ user, onLogout }) => {
  const [residents, setResidents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getResidents();
      if (response.success) {
        setResidents(response.residents);
      }
    } catch (error) {
      console.error('Error loading residents:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการโหลดรายชื่อผู้อาศัย' });
    } finally {
      setLoading(false);
    }
  };

  const handleResidentAdded = () => {
    loadResidents();
    setMessage({ type: 'success', text: 'เพิ่มผู้อาศัยเรียบร้อย' });
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredResidents = residents.filter(resident =>
    resident.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">iCondo</h1>
              <p className="text-xs sm:text-sm text-gray-500">จัดการผู้ใช้งาน</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
                {user.username} ({user.role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้อาศัย'})
              </span>
              <button
                onClick={onLogout}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-6 lg:space-x-8 overflow-x-auto">
            <button
              className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
              onClick={() => window.location.href = '/receive-parcel'}
            >
              รับพัสดุ
            </button>
            <button
              className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
              onClick={() => window.location.href = '/delivery-out'}
            >
              ส่งมอบพัสดุ
            </button>
            <button
              className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
              onClick={() => window.location.href = '/history'}
            >
              ประวัติ
            </button>
            <button
              className="text-white py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm bg-blue-700 whitespace-nowrap flex-shrink-0"
            >
              จัดการผู้ใช้
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {message && (
          <div className={`rounded-md p-4 mb-6 ${
            message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className={`text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">รายชื่อผู้อาศัย</h2>
                <p className="mt-1 text-sm text-gray-500">
                  ทั้งหมด {filteredResidents.length} คน
                </p>
              </div>
              <button
                onClick={() => setShowAddResidentModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มผู้อาศัยใหม่
              </button>
            </div>

            {/* Search */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="ค้นหาตามเลขห้อง, ชื่อผู้ใช้, หรือเบอร์โทรศัพท์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">กำลังโหลด...</p>
              </div>
            ) : filteredResidents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อมูลผู้อาศัย'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เลขห้อง
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อผู้ใช้
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เบอร์โทรศัพท์
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      วันที่สร้าง
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResidents.map((resident) => (
                    <tr key={resident.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{resident.room_number || '-'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.username}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.phone_number}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-500">
                          {new Date().toLocaleDateString('th-TH')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <AddResidentModal
        isOpen={showAddResidentModal}
        onClose={() => setShowAddResidentModal(false)}
        onSuccess={handleResidentAdded}
      />
    </div>
  );
};

export default UserList;
