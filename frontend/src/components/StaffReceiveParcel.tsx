import React, { useState, useEffect } from 'react';
import { User, CreateParcelRequest } from '../types';
import { parcelsAPI, usersAPI } from '../utils/api';

interface StaffReceiveParcelProps {
  user: User;
  onLogout: () => void;
}

const StaffReceiveParcel: React.FC<StaffReceiveParcelProps> = ({ user, onLogout }) => {
  const [formData, setFormData] = useState<CreateParcelRequest>({
    tracking_number: '',
    room_number: '',
    carrier_name: '',
  });
  const [residents, setResidents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const carriers = [
    'Kerry Express',
    'Flash',
    'Thai Post',
    'J&T Express',
    'Shopee Express',
    'Lazada Logistics',
    'DHL',
    'FedEx',
    'อื่นๆ'
  ];

  useEffect(() => {
    loadResidents();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setMessage(null);
  };

  const handleResidentSelect = (residentId: number) => {
    const resident = residents.find(r => r.id === residentId);
    if (resident) {
      setFormData(prev => ({
        ...prev,
        resident_id: residentId,
        room_number: resident.room_number || '',
      }));
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await parcelsAPI.createParcel(formData);
      if (response.success) {
        setMessage({ type: 'success', text: 'บันทึกรับพัสดุเรียบร้อย' });
        setFormData({
          tracking_number: '',
          room_number: '',
          carrier_name: '',
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'เกิดข้อผิดพลาด' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">iCondo</h1>
              <p className="text-sm text-gray-500">บันทึกรับพัสดุ</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.username} ({user.role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้อาศัย'})
              </span>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
          <div className="flex space-x-8">
            <button
              className="text-white py-3 px-3 rounded-t-md font-medium text-sm bg-blue-700"
            >
              รับพัสดุ
            </button>
            <button
              className="text-blue-100 py-3 px-3 rounded-t-md font-medium text-sm hover:text-white"
              onClick={() => window.location.href = '/delivery-out'}
            >
              ส่งมอบพัสดุ
            </button>
            <button
              className="text-blue-100 py-3 px-3 rounded-t-md font-medium text-sm hover:text-white"
              onClick={() => window.location.href = '/history'}
            >
              ประวัติ
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">บันทึกรับพัสดุใหม่</h2>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tracking Number */}
            <div>
              <label htmlFor="tracking_number" className="block text-sm font-medium text-gray-700">
                เลขพัสดุ *
              </label>
              <div className="mt-1">
                <input
                  id="tracking_number"
                  name="tracking_number"
                  type="text"
                  required
                  value={formData.tracking_number}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="กรอกเลขพัสดุ"
                />
              </div>
            </div>

            {/* Room Number / Resident Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ห้องผู้รับ *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    id="room_number"
                    name="room_number"
                    type="text"
                    value={formData.room_number}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="หมายเลขห้อง"
                  />
                </div>
                <div>
                  <select
                    id="resident_select"
                    onChange={(e) => handleResidentSelect(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">เลือกจากรายชื่อ</option>
                    {residents.map((resident) => (
                      <option key={resident.id} value={resident.id}>
                        {resident.room_number} - {resident.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Carrier */}
            <div>
              <label htmlFor="carrier_name" className="block text-sm font-medium text-gray-700">
                ขนส่ง *
              </label>
              <div className="mt-1">
                <select
                  id="carrier_name"
                  name="carrier_name"
                  required
                  value={formData.carrier_name}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">เลือกขนส่ง</option>
                  {carriers.map((carrier) => (
                    <option key={carrier} value={carrier}>
                      {carrier}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photo Capture Placeholder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ถ่ายรูปพัสดุ
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <div className="flex flex-col items-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">
                    คลิกเพื่อถ่ายรูปพัสดุ
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG ขนาดสูงสุด 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  'ยืนยันและแจ้งเตือน'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffReceiveParcel;
