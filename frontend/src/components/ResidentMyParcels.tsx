import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { User, Parcel } from '../types';
import { parcelsAPI } from '../utils/api';

interface ResidentMyParcelsProps {
  user: User;
  onLogout: () => void;
}

const ResidentMyParcels: React.FC<ResidentMyParcelsProps> = ({ user, onLogout }) => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');

  useEffect(() => {
    loadParcels();
  }, [user.id]);

  const loadParcels = async () => {
    try {
      const response = await parcelsAPI.getResidentParcels(user.id);
      if (response.success) {
        setParcels(response.parcels);
      }
    } catch (error) {
      console.error('Error loading parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowQRCode = async (parcel: Parcel) => {
    setSelectedParcel(parcel);
    try {
      const response = await parcelsAPI.getQRCode(parcel.id);
      if (response.success) {
        setQrCodeData(response.qrCode);
        setShowQRCode(true);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง QR Code');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'pending' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800';
  };

  const getStatusText = (status: string) => {
    return status === 'pending' ? 'รอรับ' : 'รับแล้ว';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลพัสดุ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">iCondo</h1>
              <p className="text-sm text-gray-500">พัสดุของฉัน - ห้อง {user.room_number}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.username}
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
              พัสดุของฉัน
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">รอรับ</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {parcels.filter(p => p.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">รับแล้ว</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {parcels.filter(p => p.status === 'collected').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Parcels List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              รายการพัสดุทั้งหมด
            </h3>

            {parcels.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีพัสดุ</h3>
                <p className="mt-1 text-sm text-gray-500">ยังไม่มีพัสดุในระบบ</p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่รับ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เลขพัสดุ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ขนส่ง
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parcels.map((parcel) => (
                      <tr key={parcel.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(parcel.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {parcel.tracking_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parcel.carrier_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                            {getStatusText(parcel.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {parcel.status === 'pending' && (
                            <button
                              onClick={() => handleShowQRCode(parcel)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              แสดง QR Code
                            </button>
                          )}
                          {parcel.status === 'collected' && (
                            <span className="text-gray-400">รับแล้ว</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && selectedParcel && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      QR Code สำหรับรับพัสดุ
                    </h3>
                    <div className="mt-2">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-4">
                          แสดง QR Code นี้ให้เจ้าหน้าที่เพื่อรับพัสดุ
                        </p>
                        <div className="flex justify-center mb-4">
                          {qrCodeData && (
                            <div className="bg-white p-4 rounded-lg">
                              <QRCode
                                value={qrCodeData}
                                size={200}
                                level={"H"}
                                includeMargin={true}
                              />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">
                            เลขพัสดุ: {selectedParcel.tracking_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            ขนส่ง: {selectedParcel.carrier_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowQRCode(false)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentMyParcels;
