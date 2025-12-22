import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { User, Parcel } from '../types';
import { parcelsAPI } from '../utils/api';

interface StaffDeliveryOutProps {
  user: User;
  onLogout: () => void;
}

const StaffDeliveryOut: React.FC<StaffDeliveryOutProps> = ({ user, onLogout }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedParcel, setScannedParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isScanning]);

  const startScanner = () => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      }
    );

    scanner.render(
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.parcel_id && data.type === 'parcel_collection') {
            loadParcelDetails(data.parcel_id);
            setIsScanning(false);
          } else {
            setMessage({ type: 'error', text: 'QR Code ไม่ถูกต้อง' });
          }
        } catch (error) {
          setMessage({ type: 'error', text: 'QR Code ไม่ถูกต้อง' });
        }
      },
      (error) => {
        console.error(error);
      }
    );
  };

  const stopScanner = () => {
    try {
      const scannerContainer = document.getElementById('qr-reader');
      if (scannerContainer) {
        scannerContainer.innerHTML = '';
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const loadParcelDetails = async (parcelId: number) => {
    setLoading(true);
    try {
      // For now, we'll simulate loading parcel details
      // In a real implementation, we'd have an API to get parcel by ID
      const mockParcel: Parcel = {
        id: parcelId,
        tracking_number: 'TH123456789',
        resident_id: 1,
        carrier_name: 'Kerry Express',
        status: 'pending',
        created_at: new Date().toISOString(),
        resident_name: 'John Doe',
        room_number: '101',
      };
      setScannedParcel(mockParcel);
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการโหลดข้อมูลพัสดุ' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPickup = async () => {
    if (!scannedParcel) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await parcelsAPI.collectParcel(scannedParcel.id, user.id);
      if (response.success) {
        setMessage({ type: 'success', text: 'ยืนยันการรับพัสดุเรียบร้อย' });
        setScannedParcel(null);
        setEvidencePhoto(null);
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

  const resetForm = () => {
    setScannedParcel(null);
    setEvidencePhoto(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">iCondo</h1>
              <p className="text-sm text-gray-500">ส่งมอบพัสดุ</p>
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
              className="text-blue-100 py-3 px-3 rounded-t-md font-medium text-sm hover:text-white"
              onClick={() => window.location.href = '/receive-parcel'}
            >
              รับพัสดุ
            </button>
            <button
              className="text-white py-3 px-3 rounded-t-md font-medium text-sm bg-blue-700"
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
          <h2 className="text-lg font-medium text-gray-900 mb-6">สแกน QR Code เพื่อส่งมอบพัสดุ</h2>

          {/* Message */}
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

          {!scannedParcel ? (
            // Scanner Section
            <div>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  ให้ผู้อาศัยแสดง QR Code จากแอปพลิเคชันเพื่อสแกน
                </p>
                <button
                  onClick={() => setIsScanning(!isScanning)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isScanning 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isScanning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      หยุดสแกน
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      เริ่มสแกน QR Code
                    </>
                  )}
                </button>
              </div>

              {/* QR Scanner */}
              <div id="qr-reader" className="w-full"></div>
            </div>
          ) : (
            // Parcel Details Section
            <div>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">รายละเอียดพัสดุ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">เลขพัสดุ</p>
                    <p className="text-sm text-gray-900">{scannedParcel.tracking_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">ขนส่ง</p>
                    <p className="text-sm text-gray-900">{scannedParcel.carrier_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">ห้อง</p>
                    <p className="text-sm text-gray-900">{scannedParcel.room_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">ผู้รับ</p>
                    <p className="text-sm text-gray-900">{scannedParcel.resident_name}</p>
                  </div>
                </div>
              </div>

              {/* Evidence Photo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ถ่ายรูปหลักฐานการรับพัสดุ
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {evidencePhoto ? (
                      <div className="relative">
                        <img
                          src={evidencePhoto}
                          alt="Evidence photo"
                          className="mx-auto h-32 w-auto object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setEvidencePhoto(null)}
                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
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
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="evidence-photo"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>อัพโหลดรูปภาพ</span>
                            <input
                              id="evidence-photo"
                              name="evidence-photo"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              capture="environment"
                              onChange={handlePhotoCapture}
                            />
                          </label>
                          <p className="pl-1">หรือถ่ายรูป</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG ขนาดสูงสุด 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPickup}
                  disabled={loading || !evidencePhoto}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    loading || !evidencePhoto
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    'ยืนยันการรับพัสดุ'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDeliveryOut;
