import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { User, Parcel } from '../types';
import { parcelsAPI } from '../utils/api';
import { preload } from '../utils/preload';
import CameraCapture from './CameraCapture';

interface StaffDeliveryOutProps {
  user: User;
  onLogout: () => void;
}

const StaffDeliveryOut: React.FC<StaffDeliveryOutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedParcel, setScannedParcel] = useState<Parcel | null>(null);
  const [isLoadingParcel, setIsLoadingParcel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);

  // Refs to avoid closure issues and track scanner state
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
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
      stopScanner();
    }

    console.log('▶️ Starting new QR scanner');
    const scanner = new Html5Qrcode('qr-reader-video');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
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
      (errorMessage) => {
        // Filter out common scanning errors
        if (!errorMessage?.includes('NotFoundException')) {
          console.error('QR Scanner error:', errorMessage);
          if (errorMessage?.includes('NotAllowedError') || errorMessage?.includes('NotFoundError')) {
            setMessage({ 
              type: 'error', 
              text: 'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง' 
            });
          }
        }
      }
    ).catch((err) => {
      console.error('Failed to start scanner:', err);
      setMessage({ type: 'error', text: 'ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่' });
    });
  };

  const stopScanner = async () => {
    console.log('⏹️ Stopping scanner');
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      const container = document.getElementById('qr-reader-video');
      if (container) container.innerHTML = '';
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
              onMouseEnter={preload.staffReceiveParcel}
              onClick={() => navigate('/receive-parcel')}
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
              onMouseEnter={preload.historyDashboard}
              onClick={() => navigate('/history')}
            >
              ประวัติ
            </button>
            <button
              className="text-blue-100 py-3 px-2 sm:px-3 lg:px-4 rounded-t-md font-medium text-xs sm:text-sm hover:text-white whitespace-nowrap flex-shrink-0"
              onMouseEnter={preload.userList}
              onClick={() => navigate('/users')}
            >
              จัดการผู้ใช้
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
                  onClick={() => {
                    if (!isScanning) {
                      // Request camera permission immediately, before scanner init
                      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                        .then((stream) => {
                          // Stop the temporary stream — scanner will get its own
                          stream.getTracks().forEach(track => track.stop());
                          setIsScanning(true);
                        })
                        .catch((err) => {
                          console.error('Camera permission denied:', err);
                          setMessage({
                            type: 'error',
                            text: 'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง'
                          });
                        });
                    } else {
                      setIsScanning(false);
                    }
                  }}
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
              {isScanning && (
                <div className="relative w-full max-w-md mx-auto">
                  {/* Scanner frame */}
                  <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <div id="qr-reader-video" ref={scannerContainerRef} className="w-full h-full"></div>

                    {/* Dimmed overlay with clear scan area */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Scan window */}
                      <div className="absolute inset-x-[12%] inset-y-[18%] border-2 border-blue-400/70 rounded-lg">
                        {/* Corner brackets */}
                        <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl"></div>
                        <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr"></div>
                        <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl"></div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-[3px] border-r-[3px] border-blue-400 rounded-br"></div>

                        {/* Scanning line animation */}
                        <div className="absolute left-0 right-0 h-[2px] bg-blue-400 shadow-lg shadow-blue-400/50"
                             style={{
                               animation: 'scan-line 2s ease-in-out infinite',
                               top: '0%'
                             }}>
                        </div>
                      </div>

                      {/* Dim surrounding area */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <mask id="scanMask">
                            <rect width="100" height="100" fill="white" />
                            <rect x="12" y="18" width="76" height="64" rx="2" fill="black" />
                          </mask>
                        </defs>
                        <rect width="100" height="100" fill="rgba(0,0,0,0.45)" mask="url(#scanMask)" />
                      </svg>
                    </div>
                  </div>

                  <p className="text-center text-xs text-gray-500 mt-3">
                    วาง QR Code ในกรอบสี่เหลี่ยมเพื่อสแกน
                  </p>

                  <style>{`
                    @keyframes scan-line {
                      0%, 100% { top: 0%; }
                      50% { top: calc(100% - 2px); }
                    }
                    #qr-reader-video video {
                      width: 100% !important;
                      height: 100% !important;
                      object-fit: cover !important;
                    }
                  `}</style>
                </div>
              )}
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
                  <div>
                    <p className="text-sm font-medium text-gray-500">วันที่ต้องการรับ</p>
                    <p className={`text-sm ${scannedParcel.sendout_at ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      {scannedParcel.sendout_at 
                        ? new Date(scannedParcel.sendout_at).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'ไม่ระบุ'}
                    </p>
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
