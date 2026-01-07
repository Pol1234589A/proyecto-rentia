
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  selectedIndex: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, selectedIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  // Carga de imagen con XHR para asegurar carga completa antes de mostrar (evita barrido vertical)
  useEffect(() => {
    const src = images[currentIndex];
    
    // Si es la misma URL que ya tenemos cargada
    if (src === currentUrlRef.current && imgSrc) {
        return;
    }

    // Limpiar blob anterior si existe
    if (imgSrc && imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc);
    }
    
    // Abortar petición anterior si existe
    if (xhrRef.current) {
        xhrRef.current.abort();
    }

    setLoading(true);
    setImgSrc(null);
    currentUrlRef.current = src;

    // Si es base64, carga inmediata
    if (src.startsWith('data:')) {
        setImgSrc(src);
        setLoading(false);
        return;
    }

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open('GET', src, true);
    xhr.responseType = 'blob';

    xhr.onload = () => {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const url = URL.createObjectURL(blob);
            setImgSrc(url);
            setLoading(false);
        } else {
            // Fallback
            setImgSrc(src);
            setLoading(false);
        }
    };

    xhr.onerror = () => {
        // Fallback
        setImgSrc(src);
        setLoading(false);
    };

    xhr.send();

    // Precarga de adyacentes
    if (images.length > 1) {
        const nextIndex = (currentIndex + 1) % images.length;
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        const imgNext = new Image(); imgNext.src = images[nextIndex];
        const imgPrev = new Image(); imgPrev.src = images[prevIndex];
    }

    return () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
        }
    };
  }, [currentIndex, images]);

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
      if (imgSrc && imgSrc.startsWith('blob:')) {
          URL.revokeObjectURL(imgSrc);
      }
    };
  }, [onClose, images.length, imgSrc]);

  if (images.length === 0 || images[0].includes('placeholder')) {
      return null;
  }

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
        
        {/* Loading Indicator Suave (Sin porcentajes) */}
        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
                <Loader2 className="w-12 h-12 text-[#edcd20] animate-spin mb-4" />
                <span className="text-white/70 font-bold uppercase tracking-widest text-xs animate-pulse">
                    Cargando
                </span>
            </div>
        )}

        {imgSrc && (
            <img
              src={imgSrc}
              alt={`Imagen ampliada ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain shadow-2xl select-none transition-opacity duration-500 ease-in-out ${loading ? 'opacity-0' : 'opacity-100'}`}
              onClick={(e) => e.stopPropagation()}
            />
        )}
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[11010] p-3 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all backdrop-blur-sm border border-white/10 hover:scale-110"
            onClick={goToPrevious}
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

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
