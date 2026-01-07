
import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Layers, Video, FileVideo, Clipboard } from 'lucide-react';
import { storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageOptimizer';

interface ImageUploaderProps {
  folder: string; 
  onUploadComplete: (url: string) => void;
  label?: string;
  compact?: boolean;
  accept?: string; 
  maxSizeMB?: number;
  onlyFirebase?: boolean; // Flag to skip external AI checks if needed
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
    folder, 
    onUploadComplete, 
    label = "Subir Foto", 
    compact = false,
    accept = "image/*",
    maxSizeMB = 10
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{processed: number, total: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- SINGLE FILE UPLOAD HELPER ---
  const processAndUploadSingleFile = async (file: File): Promise<string> => {
      // 1. Validación de tamaño
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > maxSizeMB) {
          throw new Error(`${file.name} excede ${maxSizeMB}MB`);
      }

      let blobToUpload: Blob = file;

      // 2. Optimización (SOLO IMÁGENES)
      if (file.type.startsWith('image/') && !file.type.includes('gif')) {
          try {
             blobToUpload = await compressImage(file);
          } catch (e) {
             console.warn("Compression failed, using original", e);
          }
      }

      // 3. Extensión correcta
      const isWebP = blobToUpload.type === 'image/webp';
      const ext = isWebP ? 'webp' : (file.type.split('/')[1] || 'bin');
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);

      // 4. Subida
      const uploadTask = uploadBytesResumable(storageRef, blobToUpload);
      
      return new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
              null, // Ignoramos progreso individual detallado para simplificar UX en paralelo
              (error) => reject(error), 
              async () => {
                  const url = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(url);
              }
          );
      });
  };

  // --- UNIFIED UPLOAD LOGIC ---
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setProgress({ processed: 0, total: files.length });

    const errors: string[] = [];
    const uploadPromises = files.map(async (file) => {
        try {
            const url = await processAndUploadSingleFile(file);
            onUploadComplete(url);
            setProgress(prev => prev ? { ...prev, processed: prev.processed + 1 } : null);
        } catch (err: any) {
            console.error(`Error uploading ${file.name}:`, err);
            errors.push(`${file.name}: ${err.message || 'Error'}`);
        }
    });

    // Ejecutar todas las subidas en PARALELO
    await Promise.all(uploadPromises);

    setUploading(false);
    setProgress(null);
    
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (errors.length > 0) {
        setError(errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    uploadFiles(Array.from(fileList));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const filesToUpload: File[] = [];

    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            // Simple check to ensure we only upload relevant types based on prop
            if (file && (accept === '*' || accept.includes(file.type.split('/')[0]))) {
                filesToUpload.push(file);
            }
        }
    }

    if (filesToUpload.length > 0) {
        e.preventDefault(); // Prevent default paste behavior
        uploadFiles(filesToUpload);
    }
  };

  const isVideoMode = accept.includes('video');

  if (compact) {
      return (
        <div className="flex items-center gap-2">
            <div className="relative inline-block">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={accept} multiple className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 bg-blue-50 text-rentia-blue hover:bg-blue-100 rounded-md transition-colors border border-blue-200 disabled:opacity-50 relative overflow-hidden group flex items-center gap-1">
                    {uploading ? (
                         <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <>{isVideoMode ? <Video className="w-3 h-3" /> : <Upload className="w-3 h-3" />}</>
                    )}
                </button>
            </div>
            {uploading && progress && (
                <div className="flex flex-col w-16">
                    <span className="text-[8px] font-mono text-gray-500">{progress.processed}/{progress.total}</span>
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rentia-blue transition-all duration-300" style={{ width: `${(progress.processed / progress.total) * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={accept} multiple className="hidden" />

      <div 
        ref={containerRef}
        tabIndex={0} // Make div focusable to catch paste events
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={() => !uploading && fileInputRef.current?.click()} 
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all overflow-hidden group outline-none
            ${uploading ? 'bg-gray-50 border-gray-300' : isFocused ? 'border-rentia-blue bg-blue-50 ring-2 ring-rentia-blue/20' : 'bg-white border-gray-300 hover:border-rentia-blue hover:bg-blue-50'} 
            ${error ? 'border-red-300 bg-red-50' : ''}`}
      >
        
        <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
                <div className="w-full max-w-[200px] flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-rentia-blue animate-spin mb-2" />
                    <span className="text-xs font-bold text-gray-600 mb-1">{isVideoMode ? 'Subiendo Vídeo...' : 'Optimizando & Subiendo...'}</span>
                    {progress && (
                        <div className="w-full">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                <span>{progress.processed}/{progress.total}</span>
                                <span>{Math.round((progress.processed / progress.total) * 100)}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(progress.processed / progress.total) * 100}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            ) : error ? (
                <>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <span className="text-xs font-bold text-red-500 text-center px-4">{error}</span>
                </>
            ) : (
                <>
                    <div className="p-3 bg-blue-100 rounded-full text-rentia-blue group-hover:bg-rentia-blue group-hover:text-white transition-colors relative shadow-sm">
                        {isVideoMode ? <FileVideo className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        {!isVideoMode && <Layers className="w-3 h-3 absolute -bottom-1 -right-1 text-gray-500 bg-white rounded-full p-0.5 border border-gray-200" />}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700 block">{label}</span>
                        <span className="text-[10px] text-gray-400 block mt-1 flex items-center justify-center gap-1">
                            {!isVideoMode && <span className="flex items-center gap-1"><Clipboard className="w-3 h-3"/> Pega (Ctrl+V) o</span>}
                            {isVideoMode ? `Max ${maxSizeMB}MB` : 'Auto-Optimización WebP'}
                        </span>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
