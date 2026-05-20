import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UpdateResidentRequest } from '../types';
import { usersAPI } from '../utils/api';
import { preload } from '../utils/preload';
import AddResidentModal from './AddResidentModal';

interface UserListProps {
  user: User;
  onLogout: () => void;
}

const UserList: React.FC<UserListProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [editingResident, setEditingResident] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateResidentRequest>({
    username: '',
    room_number: '',
    phone_number: '',
    password: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
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

  const handleEdit = (resident: User) => {
    setEditingResident(resident);
    setEditForm({
      username: resident.username,
      room_number: resident.room_number || '',
      phone_number: resident.phone_number,
      password: '',
    });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident) return;
    setEditLoading(true);
    try {
      const payload: UpdateResidentRequest = {
        username: editForm.username,
        room_number: editForm.room_number,
        phone_number: editForm.phone_number,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      const response = await usersAPI.updateResident(editingResident.id, payload);
      if (response.success) {
        loadResidents();
        setEditingResident(null);
        setMessage({ type: 'success', text: 'อัปเดตข้อมูลเรียบร้อย' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (resident: User) => {
    if (!window.confirm(`ยืนยันการลบผู้อาศัย "${resident.username}" (ห้อง ${resident.room_number || '-'})?`)) {
      return;
    }
    setDeleteLoadingId(resident.id);
    try {
      const response = await usersAPI.deleteResident(resident.id);
      if (response.success) {
        loadResidents();
        setMessage({ type: 'success', text: 'ลบผู้ใช้งานเรียบร้อย' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ' });
    } finally {
      setDeleteLoadingId(null);
    }
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
              onMouseEnter={preload.staffReceiveParcel}
              onClick={() => navigate('/receive-parcel')}
            >
              รับพัสดุ
            </button>
            <button
              className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
              onMouseEnter={preload.staffDeliveryOut}
              onClick={() => navigate('/delivery-out')}
            >
              ส่งมอบพัสดุ
            </button>
            <button
              className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
              onMouseEnter={preload.historyDashboard}
              onClick={() => navigate('/history')}
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
                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ดำเนินการ
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
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(resident)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="แก้ไข"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(resident)}
                            disabled={deleteLoadingId === resident.id}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                              deleteLoadingId === resident.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="ลบ"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {deleteLoadingId === resident.id ? 'กำลังลบ...' : 'ลบ'}
                          </button>
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

      {/* Edit Modal */}
      {editingResident && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                แก้ไขข้อมูลผู้อาศัย
              </h3>
              <button
                onClick={() => setEditingResident(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700">
                  ชื่อผู้ใช้
                </label>
                <input
                  id="edit-username"
                  name="username"
                  type="text"
                  required
                  value={editForm.username}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="edit-room" className="block text-sm font-medium text-gray-700">
                  เลขห้อง
                </label>
                <input
                  id="edit-room"
                  name="room_number"
                  type="text"
                  required
                  value={editForm.room_number}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">
                  เบอร์โทรศัพท์
                </label>
                <input
                  id="edit-phone"
                  name="phone_number"
                  type="tel"
                  required
                  value={editForm.phone_number}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700">
                  รหัสผ่าน <span className="text-gray-400 font-normal">(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>
                </label>
                <input
                  id="edit-password"
                  name="password"
                  type="password"
                  minLength={6}
                  value={editForm.password}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร (ไม่บังคับ)"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingResident(null)}
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    editLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {editLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AddResidentModal
        isOpen={showAddResidentModal}
        onClose={() => setShowAddResidentModal(false)}
        onSuccess={handleResidentAdded}
      />
    </div>
  );
};

export default UserList;
