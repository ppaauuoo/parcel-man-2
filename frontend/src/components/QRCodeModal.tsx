import React, { useState } from 'react';
import QRCode from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: {
    id: number;
    tracking_number: string;
    carrier_name: string;
    qrCodeData: string;
  };
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, parcel }) => {
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `parcel-${parcel.tracking_number}-qrcode.png`;
      link.href = url;
      link.click();
    }
  };

  const shareQRCode = async () => {
    setIsSharing(true);
    try {
      const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
      if (canvas) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `parcel-${parcel.tracking_number}-qrcode.png`, { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'QR Code รับพัสดุ',
                text: `QR Code สำหรับรับพัสดุเลขที่ ${parcel.tracking_number}`,
                files: [file]
              });
            } else {
              // Fallback: copy to clipboard
              const textToCopy = `QR Code สำหรับรับพัสดุเลขที่ ${parcel.tracking_number} จาก ${parcel.carrier_name}`;
              await navigator.clipboard.writeText(textToCopy);
              alert('คัดลอกข้อมูล QR Code ไปยังคลิปบอร์ดแล้ว');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      alert('ไม่สามารถแชร์ QR Code ได้ กรุณาลองใหม่');
    } finally {
      setIsSharing(false);
    }
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code รับพัสดุ - ${parcel.tracking_number}</title>
            <style>
              body { 
                font-family: 'Sarabun', sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                padding: 20px;
                text-align: center;
              }
              .qr-container { 
                margin: 20px 0; 
                padding: 20px; 
                border: 2px solid #333; 
                border-radius: 10px; 
              }
              h1 { margin-bottom: 10px; }
              .details { 
                margin: 10px 0; 
                font-size: 18px; 
                line-height: 1.6;
              }
              @media print {
                body { padding: 10px; }
                .qr-container { border: 2px solid #000; }
              }
            </style>
          </head>
          <body>
            <h1>QR Code รับพัสดุ</h1>
            <div class="details">
              <strong>เลขพัสดุ:</strong> ${parcel.tracking_number}<br>
              <strong>ขนส่ง:</strong> ${parcel.carrier_name}
            </div>
            <div class="qr-container">
              <div id="print-qr"></div>
            </div>
            <div class="details">
              <small>แสดง QR Code นี้ให้เจ้าหน้าที่เพื่อรับพัสดุ</small>
            </div>
            <script>
              // Create QR code in print window
              const qrContainer = document.getElementById('print-qr');
              const qrData = '${parcel.qrCodeData}';
              
              // Load QRCode library and create QR code
              const script = document.createElement('script');
              script.src = 'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js';
              script.onload = function() {
                QRCode.toCanvas(qrContainer, qrData, {
                  width: 200,
                  margin: 2,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                  }
                });
              };
              document.head.appendChild(script);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
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
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    แสดง QR Code นี้ให้เจ้าหน้าที่เพื่อรับพัสดุ
                  </p>
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <QRCode
                        id="qr-canvas"
                        value={parcel.qrCodeData}
                        size={200}
                        level={"H"}
                        includeMargin={true}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      เลขพัสดุ: {parcel.tracking_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      ขนส่ง: {parcel.carrier_name}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={downloadQRCode}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    ดาวน์โหลด
                  </button>
                  
                  <button
                    type="button"
                    onClick={shareQRCode}
                    disabled={isSharing}
                    className="inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSharing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        กำลังแชร์...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684m0 0a3 3 0 00-5.367-2.684m0 9.316a3 3 0 105.367 2.684" />
                        </svg>
                        แชร์
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={printQRCode}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    พิมพ์ QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
