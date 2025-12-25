import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { User, Parcel } from '../types';
import { parcelsAPI } from '../utils/api';
import CameraCapture from './CameraCapture';

interface StaffDeliveryOutProps {
  user: User;
  onLogout: () => void;
}

const StaffDeliveryOut: React.FC<StaffDeliveryOutProps> = ({ user, onLogout }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedParcel, setScannedParcel] = useState<Parcel | null>(null);
  const [isLoadingParcel, setIsLoadingParcel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);

  // Refs to avoid closure issues and track scanner state
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isSubmittingRef = useRef(false);
  const lastScannedIdRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Sync isSubmittingRef with state to avoid closure issues
  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

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
    // Stop existing scanner first
    if (scannerRef.current) {
      console.log('🛑 Stopping existing scanner before starting new one');
      try {
        scannerRef.current.clear().catch((err) => {
          console.log('Scanner clear error (expected if already cleared):', err);
        });
      } catch (e) {
        console.log('Scanner already cleared');
      }
    }

    console.log('▶️ Starting new QR scanner');
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );
    
    // Store scanner reference
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Use ref instead of state to avoid closure issues
        if (isSubmittingRef.current) {
          console.log('⏸️ Submission in progress, ignoring scan');
          return;
        }

        // Prevent duplicate scans within 2 seconds (debouncing)
        const now = Date.now();
        const timeSinceLastScan = now - lastScanTimeRef.current;

        try {
          // Try parsing as JSON first (new format)
          const data = JSON.parse(decodedText);
          if (data.parcel_id && data.type === 'parcel_collection') {
            // Check if same parcel scanned recently
            if (data.parcel_id === lastScannedIdRef.current && timeSinceLastScan < 2000) {
              console.log('🔄 Ignoring duplicate scan (within 2s cooldown)');
              return;
            }
            
            console.log(`📱 QR scanned: Parcel ID ${data.parcel_id}`);
            lastScannedIdRef.current = data.parcel_id;
            lastScanTimeRef.current = now;
            loadParcelDetails(data.parcel_id);
            setIsScanning(false);
          } else {
            setMessage({ type: 'error', text: 'QR Code ไม่ถูกต้อง: ข้อมูลไม่ตรงกับรูปแบบที่กำหนด' });
          }
        } catch (error) {
          // Backward compatibility: Try old format (PC:id or I:id)
          if (decodedText.startsWith('PC:') || decodedText.startsWith('I')) {
            const parcelId = parseInt(decodedText.replace(/^(PC:|I)/, ''));
            if (!isNaN(parcelId)) {
              // Check duplicate for old format too
              if (parcelId === lastScannedIdRef.current && timeSinceLastScan < 2000) {
                console.log('🔄 Ignoring duplicate scan (within 2s cooldown)');
                return;
              }
              
              console.log(`📱 QR scanned (old format): Parcel ID ${parcelId}`);
              lastScannedIdRef.current = parcelId;
              lastScanTimeRef.current = now;
              loadParcelDetails(parcelId);
              setIsScanning(false);
              return;
            }
          }
          
          setMessage({ type: 'error', text: 'QR Code ไม่ถูกต้อง: กรุณาสแกน QR Code สำหรับรับพัสดุ' });
        }
      },
      (error) => {
        // Filter out common scanning errors that are just the scanner looking for QR codes
        // Only show errors that are actual problems
        const errorMessage = error?.toString() || '';
        
        // NotFoundException is normal when scanner doesn't see a QR code yet
        if (!errorMessage.includes('NotFoundException')) {
          console.error('QR Scanner error:', error);
          
          // Only set message for critical errors
          if (errorMessage.includes('NotAllowedError') || errorMessage.includes('NotFoundError')) {
            setMessage({ 
              type: 'error', 
              text: 'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง' 
            });
          }
        }
      }
    );
  };

  const stopScanner = () => {
    console.log('⏹️ Stopping scanner');
    try {
      if (scannerRef.current) {
        scannerRef.current.clear()
          .then(() => {
            console.log('✅ Scanner stopped and cleared');
            scannerRef.current = null;
          })
          .catch((error) => {
            console.log('Scanner cleanup error (may be already cleared):', error);
            scannerRef.current = null;
          });
      }
      
      // Also clear the DOM container as backup
      const scannerContainer = document.getElementById('qr-reader');
      if (scannerContainer) {
        scannerContainer.innerHTML = '';
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
      scannerRef.current = null;
    }
  };

  const loadParcelDetails = async (parcelId: number) => {
    setIsLoadingParcel(true);
    setMessage(null);
    try {
      const response = await parcelsAPI.getParcelById(parcelId);
      
      if (response.success && response.parcel) {
        // Check if parcel is already collected
        if (response.parcel.status === 'collected') {
          setMessage({ 
            type: 'error', 
            text: `พัสดุนี้ถูกเบิกไปแล้ว (เบิกเมื่อ ${new Date(response.parcel.collected_at || '').toLocaleDateString('th-TH')})` 
          });
          setScannedParcel(null);
        } else {
          setScannedParcel(response.parcel);
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: response.message || 'ไม่พบข้อมูลพัสดุ กรุณาติดต่อผู้ดูแลระบบ' 
        });
      }
    } catch (error: any) {
      console.error('Load parcel error:', error);
      
      // Handle different error types
      if (error.response?.status === 404) {
        setMessage({ 
          type: 'error', 
          text: 'ไม่พบพัสดุนี้ กรุณาติดต่อผู้ดูแลระบบ' 
        });
      } else if (error.response?.status === 403) {
        setMessage({ 
          type: 'error', 
          text: 'ไม่มีสิทธิ์ในการดูข้อมูลพัสดุนี้' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลพัสดุ กรุณาติดต่อผู้ดูแลระบบ' 
        });
      }
    } finally {
      setIsLoadingParcel(false);
    }
  };

  

  const handleConfirmPickup = async () => {
    if (!scannedParcel) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      let evidencePhotoPath = null;
      
      // Upload evidence photo if exists
      if (evidencePhoto) {
        try {
          console.log('📤 Uploading evidence photo for parcel:', scannedParcel.id);
          console.log('📏 Image data length:', evidencePhoto.length);
          
          const response = await fetch('/api/upload/base64-photo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              image_data: evidencePhoto,
              parcel_id: scannedParcel.id,
              photo_type: 'evidence'
            })
          });
          
          console.log('📥 Upload response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload failed:', response.status, errorText);
            
            // Try to parse as JSON, fallback to text
            let errorMessage = 'Failed to upload evidence photo';
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorMessage;
            } catch (e) {
              errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
          }
          
          const result = await response.json();
          
          if (result.success) {
            evidencePhotoPath = result.photo_path;
            console.log('✅ Evidence photo uploaded:', evidencePhotoPath);
          } else {
            throw new Error(result.message || 'Failed to upload evidence photo');
          }
        } catch (photoError: any) {
          console.error('Evidence photo upload error:', photoError);
          
          // Show more specific error message based on error type
          let errorMessage = 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพหลักฐาน';
          
          if (photoError.message?.includes('413') || photoError.message?.includes('too large')) {
            errorMessage = 'รูปภาพใหญ่เกินไป กรุณาถ่ายใหม่';
          } else if (photoError.message?.includes('400') || photoError.message?.includes('Invalid')) {
            errorMessage = 'รูปภาพไม่ถูกต้อง กรุณาถ่ายใหม่';
          } else if (photoError.message?.includes('timeout') || photoError.message?.includes('network')) {
            errorMessage = 'การเชื่อมต่อขัดข้อง กรุณาลองใหม่';
          } else if (photoError.message) {
            // Use backend's Thai error message if available
            errorMessage = photoError.message;
          }
          
          setMessage({ 
            type: 'error', 
            text: errorMessage
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Collect parcel with evidence photo path
      const response = await parcelsAPI.collectParcel(scannedParcel.id, user.id, evidencePhotoPath || undefined);
      if (response.success) {
        console.log('✅ Parcel collected successfully, resetting state');
        setMessage({ type: 'success', text: 'ยืนยันการรับพัสดุเรียบร้อย' });
        setScannedParcel(null);
        setEvidencePhoto(null);
        setIsScanning(false); // Stop scanner to prevent re-scanning same QR code
        
        // Reset scan tracking to allow scanning new parcels
        lastScannedIdRef.current = null;
        lastScanTimeRef.current = 0;
      } else {
        setMessage({ type: 'error', text: response.message || 'เกิดข้อผิดพลาด' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' 
      });
    } finally {
      setIsSubmitting(false);
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">iCondo</h1>
              <p className="text-xs sm:text-sm text-gray-500">ส่งมอบพัสดุ</p>
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
              className="text-white py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm bg-blue-700 whitespace-nowrap flex-shrink-0"
            >
              ส่งมอบพัสดุ
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
      <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6">สแกน QR Code เพื่อส่งมอบพัสดุ</h2>

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
              <CameraCapture
                title="ถ่ายรูปหลักฐานการรับพัสดุ *"
                onCapture={(imageData) => setEvidencePhoto(imageData)}
                onRemove={() => setEvidencePhoto(null)}
                existingPhoto={evidencePhoto || undefined}
              />

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
                  disabled={isLoadingParcel || isSubmitting || !evidencePhoto}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isLoadingParcel || isSubmitting || !evidencePhoto
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  }`}
                >
                  {isSubmitting ? (
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
