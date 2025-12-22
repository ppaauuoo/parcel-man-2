import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import { LoginRequest, User } from '../types';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
    role: 'staff',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleRoleChange = (role: 'staff' | 'resident') => {
    setFormData(prev => ({
      ...prev,
      role,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      if (response.success) {
        onLogin(response.user, response.token);
      } else {
        setError(response.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">iCondo</h1>
          <p className="mt-2 text-gray-600">ระบบจัดการพัสดุคอนโด</p>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
          เข้าสู่ระบบ
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 mobile-form">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                บทบาทผู้ใช้งาน
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleChange('staff')}
                  className={`relative inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md border ${
                    formData.role === 'staff'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  เจ้าหน้าที่ (Juristic)
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('resident')}
                  className={`relative inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md border ${
                    formData.role === 'resident'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  ผู้อาศัย (Resident)
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ชื่อผู้ใช้ / เบอร์โทรศัพท์
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="กรอกชื่อผู้ใช้หรือเบอร์โทรศัพท์"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="กรอกรหัสผ่าน"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </div>
          </form>

          {/* Demo Information */}
          <div className="mt-6 bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">ข้อมูลสำหรับทดสอบ</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>เจ้าหน้าที่:</strong> staff01 / staff123</p>
              <p><strong>ผู้อาศัย ห้อง 101:</strong> resident101 / resident123</p>
              <p><strong>ผู้อาศัย ห้อง 102:</strong> resident102 / resident123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
