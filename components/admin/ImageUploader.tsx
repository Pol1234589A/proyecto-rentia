
import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Sparkles, Wand2, Eraser } from 'lucide-react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageOptimizer';
import { cleanImageWithAI } from '../../utils/aiImageCleaner';

interface ImageUploaderProps {
  folder: string; 
  onUploadComplete: (url: string) => void;
  label?: string;
  compact?: boolean; 
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ folder, onUploadComplete, label = "Subir Foto", compact = false }) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Detección y limpieza IA (Usando utilidad compartida)
      setProcessing(true);
      const cleanBlob = await cleanImageWithAI(file, process.env.API_KEY);
      setProcessing(false);

      // 2. Compresión para web
      const cleanFile = new File([cleanBlob], file.name, { type: 'image/jpeg' });
      const compressedBlob = await compressImage(cleanFile);
      
      // 3. Subida
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      const storageRef = ref(storage, `${folder}/${fileName}`);

      const snapshot = await uploadBytes(storageRef, compressedBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      onUploadComplete(downloadURL);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError('Error al subir.');
    } finally {
      setUploading(false);
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (compact) {
      return (
        <div className="relative inline-block">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-1.5 bg-blue-50 text-rentia-blue hover:bg-blue-100 rounded-md transition-colors border border-blue-200 disabled:opacity-50 relative overflow-hidden group"
                title="Subir imagen (IA Anti-Logos activa)"
            >
                {uploading ? (
                    processing ? <Wand2 className="w-3 h-3 animate-pulse text-purple-500" /> : <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <>
                        <Upload className="w-3 h-3" />
                        <Sparkles className="w-2 h-2 text-rentia-gold absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                )}
            </button>
        </div>
      );
  }

  return (
    <div className="w-full">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
            relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all overflow-hidden group
            ${uploading ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-300 hover:border-rentia-blue hover:bg-blue-50'}
            ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        {/* Magic Background Effect when processing */}
        {processing && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 backdrop-blur-[1px]">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="bg-purple-100 p-3 rounded-full mb-2">
                        <Eraser className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-bold text-purple-700">Eliminando Logos con IA...</span>
                </div>
            </div>
        )}

        <div className="flex flex-col items-center justify-center gap-2">
            {uploading && !processing ? (
                <>
                    <Loader2 className="w-8 h-8 text-rentia-blue animate-spin" />
                    <span className="text-xs font-bold text-gray-500">Optimizando y subiendo...</span>
                </>
            ) : error ? (
                <>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <span className="text-xs font-bold text-red-500">{error}</span>
                </>
            ) : (
                <>
                    <div className="p-3 bg-blue-100 rounded-full text-rentia-blue group-hover:bg-rentia-blue group-hover:text-white transition-colors relative shadow-sm">
                        <Upload className="w-5 h-5" />
                        <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-rentia-gold animate-bounce" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700 block">{label}</span>
                        <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mt-1">
                            <Wand2 className="w-3 h-3 text-purple-400" /> Limpieza de marcas de agua automática
                        </span>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
