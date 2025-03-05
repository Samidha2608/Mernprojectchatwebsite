import React, { useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

const ImageViewModal = ({ isOpen, onClose, imageSrc, altText }) => {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const zoomIn = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      {/* Main container */}
      <div className="relative max-w-5xl w-11/12 h-4/5 mx-auto" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute -top-12 right-0 p-2 rounded-full bg-base-100/20 hover:bg-base-100/40 text-white transition-colors z-10"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        {/* Zoom controls */}
        <div className="absolute -top-12 left-0 flex space-x-2">
          <button 
            onClick={zoomOut} 
            className="p-2 rounded-full bg-base-100/20 hover:bg-base-100/40 text-white transition-colors"
            disabled={zoom <= 0.5}
            aria-label="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <button 
            onClick={zoomIn} 
            className="p-2 rounded-full bg-base-100/20 hover:bg-base-100/40 text-white transition-colors"
            disabled={zoom >= 3}
            aria-label="Zoom in"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={resetZoom} 
            className="px-3 py-2 rounded-full bg-base-100/20 hover:bg-base-100/40 text-white text-xs font-medium transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>
        
        {/* Image container */}
        <div className="bg-base-100 rounded-xl overflow-hidden shadow-xl h-full flex flex-col">
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-base-100">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          )}
          
          {/* Image wrapper - takes most of the space */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={resetZoom}>
            <div 
              className="transition-transform duration-200 ease-out"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                maxHeight: '100%',
                maxWidth: '100%'
              }}
            >
              <img 
                src={imageSrc || "/avatar.png"} 
                alt={altText || "Profile image"} 
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm" 
                onLoad={handleImageLoad}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            </div>
          </div>
          
          {/* Caption - fixed at bottom */}
          <div className="p-4 bg-base-100 border-t border-base-200 text-center">
            <p className="text-base-content font-medium truncate">{altText || "Profile image"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewModal;