
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  selectedIndex: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, selectedIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, images.length]);

  if (images.length === 0 || images[0].includes('placeholder')) {
      return null;
  }

  // Use Portal to ensure it sits on top of EVERYTHING (including other modals)
  return createPortal(
    <div
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 z-[11010] p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar vista ampliada"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 z-[11010] px-4 py-2 text-white bg-black/50 backdrop-blur-sm rounded-full text-sm font-bold border border-white/10">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Main Image Display */}
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
        <img
          src={images[currentIndex]}
          alt={`Imagen ampliada ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300 select-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[11010] p-3 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all backdrop-blur-sm border border-white/10 hover:scale-110"
            onClick={goToPrevious}
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Next Button */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[11010] p-3 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all backdrop-blur-sm border border-white/10 hover:scale-110"
            onClick={goToNext}
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}
    </div>,
    document.body
  );
};
