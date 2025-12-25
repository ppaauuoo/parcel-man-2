import React, { useState, useEffect } from 'react';
import { User, Parcel } from '../types';
import { parcelsAPI } from '../utils/api';
import QRCodeModal from './QRCodeModal';
import ImageModal from './ImageModal';

interface ResidentMyParcelsProps {
  user: User;
  onLogout: () => void;
}

const ResidentMyParcels: React.FC<ResidentMyParcelsProps> = ({ user, onLogout }) => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeModal, setQRCodeModal] = useState<{
    isOpen: boolean;
    parcel: {
      id: number;
      tracking_number: string;
      carrier_name: string;
      qrCodeData: string;
    } | null;
  }>({ isOpen: false, parcel: null });
  const [selectedImage, setSelectedImage] = useState<{url: string; title: string} | null>(null);

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
    try {
      const response = await parcelsAPI.getQRCode(parcel.id);
      if (response.success) {
        setQRCodeModal({
          isOpen: true,
          parcel: {
            id: parcel.id,
            tracking_number: parcel.tracking_number,
            carrier_name: parcel.carrier_name,
            qrCodeData: response.qrCode
          }
        });
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">iCondo</h1>
              <p className="text-xs sm:text-sm text-gray-500">พัสดุของฉัน - ห้อง {user.room_number}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
                {user.username}
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
              className="text-white py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm bg-blue-700 whitespace-nowrap flex-shrink-0"
            >
              พัสดุของฉัน
            </button>
            <button
              className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
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
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2 sm:p-3">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">รอรับ</dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
                    {parcels.filter(p => p.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-2 sm:p-3">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">รับแล้ว</dt>
                  <dd className="text-lg sm:text-xl font-medium text-gray-900">
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
              <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่รับ
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เลขพัสดุ
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ขนส่ง
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รูปภาพ
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parcels.map((parcel) => (
                      <tr key={parcel.id}>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1">วันที่:</span>
                          {formatDate(parcel.created_at)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1">เลขพัสดุ:</span>
                          <span className="block truncate max-w-[100px] sm:max-w-none">{parcel.tracking_number}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1">ขนส่ง:</span>
                          {parcel.carrier_name}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1">สถานะ:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(parcel.status)}`}>
                            {getStatusText(parcel.status)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1">รูปภาพ:</span>
                          {parcel.photo_out_path ? (
                            <button
                              onClick={() => setSelectedImage({
                                url: parcel.photo_out_path!,
                                title: `หลักฐานการรับพัสดุ - ${parcel.tracking_number}`
                              })}
                              className="relative group"
                              title="รูปถ่ายหลักฐานการรับพัสดุ"
                            >
                              <img
                                src={`http://localhost:3000${parcel.photo_out_path}`}
                                alt="Delivery evidence"
                                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border-2 border-green-200 cursor-pointer hover:border-green-400 transition-colors"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded flex items-center justify-center">
                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              {parcel.status === 'pending' ? 'รอรับพัสดุ' : 'ไม่มีรูปภาพ'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1">การจัดการ:</span>
                          {parcel.status === 'pending' && (
                            <button
                              onClick={() => handleShowQRCode(parcel)}
                              className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                            >
                              แสดง QR Code
                            </button>
                          )}
                          {parcel.status === 'collected' && (
                            <span className="text-gray-400 text-xs sm:text-sm">รับแล้ว</span>
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
      <QRCodeModal
        isOpen={qrCodeModal.isOpen}
        onClose={() => setQRCodeModal({ isOpen: false, parcel: null })}
        parcel={qrCodeModal.parcel!}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage?.url || null}
        title={selectedImage?.title}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

export default ResidentMyParcels;
