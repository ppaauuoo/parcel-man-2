import React, { useState, useRef, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onRemove?: () => void;
  existingPhoto?: string;
  title?: string;
  className?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onRemove,
  existingPhoto,
  title = "ถ่ายรูปภาพ",
  className = ""
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(existingPhoto || null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isUsingFile, setIsUsingFile] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingPhoto) {
      setPhoto(existingPhoto);
    }
  }, [existingPhoto]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        console.log('🧹 Cleaning up camera stream on unmount');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Set up video element when stream changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (stream && videoRef.current) {
      console.log('📷 Setting video srcObject...');
      videoRef.current.srcObject = stream;
      
      // Set a timeout to detect if video doesn't play within 5 seconds
      timeoutId = setTimeout(() => {
        console.warn('⚠️ Video did not start playing within 5 seconds');
        setError('กล้องไม่สามารถแสดงได้ กรุณาลองอีกครั้งหรือใช้การอัพโหลดรูปภาพ');
        setIsLoadingCamera(false);
      }, 5000);
      
      videoRef.current.onloadedmetadata = () => {
        console.log('📷 Video metadata loaded, playing...');
        if (videoRef.current) {
          clearTimeout(timeoutId); // Clear the timeout since video loaded
          videoRef.current.play()
            .then(() => {
              console.log('✅ Video is playing');
              setIsLoadingCamera(false);
            })
            .catch((playErr) => {
              console.error('❌ Video play error:', playErr);
              setError('ไม่สามารถเล่นวิดีโอจากกล้องได้');
              setIsLoadingCamera(false);
            });
        }
      };
    } else if (!stream && videoRef.current) {
      // Clean up video element when stream is null
      console.log('🧹 Cleaning up video element');
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setIsLoadingCamera(true);
    try {
      console.log('📷 Requesting camera access...');
      setError(null);
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('📷 Getting user media with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera access granted, stream tracks:', mediaStream.getTracks().length);
      
      // Set stream state - useEffect will handle video setup
      setStream(mediaStream);
      
      setIsCapturing(true);
      setIsUsingFile(false);
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('การเข้าถึงกล้องถูกปฏิเสธ กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์');
        } else if (err.name === 'NotFoundError') {
          setError('ไม่พบกล้องในเครื่อง');
        } else {
          setError(`ไม่สามารถเข้าถึงกล้องได้: ${err.message}`);
        }
      } else {
        setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้กล้อง');
      }
      setIsCapturing(false);
      setIsLoadingCamera(false);
      setIsUsingFile(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setIsLoadingCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.6);
        
        // Log image size for debugging
        const sizeInBytes = imageData.length * 0.75; // Approximate decoded size
        const sizeInMB = sizeInBytes / (1024 * 1024);
        console.log(`📸 Captured image size: ${sizeInMB.toFixed(2)} MB`);
        
        setPhoto(imageData);
        onCapture(imageData);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to compress image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.6);
            
            // Log image size for debugging
            const sizeInBytes = imageData.length * 0.75;
            const sizeInMB = sizeInBytes / (1024 * 1024);
            console.log(`📁 File upload image size: ${sizeInMB.toFixed(2)} MB`);
            
            setPhoto(imageData);
            onCapture(imageData);
            setIsUsingFile(true);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setError(null);
    setIsUsingFile(false);
    if (onRemove) {
      onRemove();
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  const hasMultipleCameras = () => {
    // Check if device likely has multiple cameras (most mobile devices)
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {title}
      </label>

      {!photo && !isCapturing && !isUsingFile && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <svg
              className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
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
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <button
                type="button"
                onClick={startCamera}
                disabled={isLoadingCamera}
                className={`inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white ${
                  isLoadingCamera 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoadingCamera ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังเปิดกล้อง...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden sm:inline">เปิดกล้อง</span>
                    <span className="sm:hidden">กล้อง</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="hidden sm:inline">อัพโหลดรูป</span>
                <span className="sm:hidden">อัพโหลด</span>
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
      {error && (
              <div className="text-red-600 text-xs sm:text-sm mt-2 px-2 py-2 bg-red-50 rounded border border-red-200">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isCapturing && (
        <div className="space-y-3 sm:space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
              style={{ maxHeight: '50vh', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ถ่ายรูป
            </button>
            
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ยกเลิก
            </button>
            
            {hasMultipleCameras() && (
              <button
                type="button"
                onClick={switchCamera}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">สลับกล้อง</span>
                <span className="sm:hidden">สลับ</span>
              </button>
            )}
          </div>
        </div>
      )}

      {photo && (
        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <img
              src={photo}
              alt="Captured"
              className="w-full h-auto rounded-lg border border-gray-300"
              style={{ maxHeight: '50vh', objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 sm:p-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex justify-center">
            <span className="text-xs sm:text-sm text-green-600">
              ✓ รูปภาพถูกบันทึกแล้ว
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
