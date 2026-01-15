import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, onClose, title }) => {
  if (!isOpen || !imageUrl) return null;

  const fullImageUrl = imageUrl;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        {title && (
          <div className="absolute -top-10 left-0 text-white text-sm font-medium">
            {title}
          </div>
        )}

        {/* Image */}
        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
          <img
            src={fullImageUrl}
            alt={title || "Image"}
            className="w-full h-auto max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Download button */}
        <div className="mt-4 flex justify-center">
          <a
            href={fullImageUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ดาวน์โหลดรูปภาพ
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
