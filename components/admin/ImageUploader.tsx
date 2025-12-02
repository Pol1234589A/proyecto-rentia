
import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Sparkles, Wand2, Eraser, Server, Globe, Database, Info } from 'lucide-react';
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
  const [uploadTarget, setUploadTarget] = useState<'firebase' | 'archive'>('firebase');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ARCHIVE.ORG UPLOAD LOGIC ---
  const uploadToArchive = async (file: File, blob: Blob): Promise<string> => {
      const ACCESS_KEY = "CCp7ETAVXWQNXWMA"; 
      const SECRET_KEY = "zk1rqJz0IBZEXWZe";
      const BUCKET_NAME = "rentiaroom-assets-production-v1"; 
      
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const objectName = `${folder}/${Date.now()}_${cleanName}`;
      const url = `https://s3.us.archive.org/${BUCKET_NAME}/${objectName}`;

      const response = await fetch(url, {
          method: 'PUT',
          headers: {
              'Authorization': `LOW ${ACCESS_KEY}:${SECRET_KEY}`,
              'x-archive-auto-make-bucket': '1',
              'x-archive-interactive-priority': '1',
              'Content-Type': 'image/jpeg'
          },
          body: blob
      });

      if (!response.ok) {
          console.error("Archive.org Error:", response.statusText);
          throw new Error('Error de conexión con Archive.org. Intenta con Firebase.');
      }

      return `https://archive.org/download/${BUCKET_NAME}/${objectName}`;
  };

  // --- FIREBASE UPLOAD LOGIC ---
  const uploadToFirebase = async (file: File, blob: Blob): Promise<string> => {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, blob);
      return await getDownloadURL(snapshot.ref);
  };

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
      let blobToProcess: Blob = file;

      // 1. Intentar limpieza IA si hay API Key disponible
      // Usamos un control de flujo robusto para que JAMÁS bloquee la subida
      if (process.env.API_KEY && process.env.API_KEY.length > 5) {
          setProcessing(true);
          try {
             const cleaned = await cleanImageWithAI(file, process.env.API_KEY);
             if (cleaned) blobToProcess = cleaned;
          } catch (aiError) {
             console.warn("AI Cleaning failed gracefully:", aiError);
             // Continuamos con el blob original sin lanzar error
          }
          setProcessing(false);
      }

      // 2. Compresión para web (Siempre se ejecuta)
      const fileToCompress = new File([blobToProcess], file.name, { type: 'image/jpeg' });
      const compressedBlob = await compressImage(fileToCompress);
      
      // 3. Subida según destino
      let downloadURL = '';
      if (uploadTarget === 'archive') {
          downloadURL = await uploadToArchive(file, compressedBlob);
          alert("Aviso: Has subido a Archive.org. La imagen puede tardar unos minutos en ser visible públicamente (Error 404 temporal).");
      } else {
          downloadURL = await uploadToFirebase(file, compressedBlob);
      }

      onUploadComplete(downloadURL);
      
    } catch (err: any) {
      console.error("Critical Upload error:", err);
      setError(err.message || 'Error crítico al subir imagen.');
    } finally {
      setUploading(false);
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const ServerToggle = () => (
      <div className="flex flex-col items-center mb-3 w-fit mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
                type="button"
                onClick={() => setUploadTarget('firebase')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
                    uploadTarget === 'firebase' 
                    ? 'bg-white text-orange-600 shadow-sm border border-orange-100' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <Server className="w-3 h-3" /> Firebase
            </button>
            <button
                type="button"
                onClick={() => setUploadTarget('archive')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
                    uploadTarget === 'archive' 
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-100' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <Globe className="w-3 h-3" /> Archive.org
            </button>
          </div>
          
          {uploadTarget === 'archive' && (
              <div className="mt-2 text-[9px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1 max-w-[200px] text-center leading-tight">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span>Aviso: Archive.org tarda ~15 min en procesar. Usar solo para backups.</span>
              </div>
          )}
      </div>
  );

  if (compact) {
      return (
        <div className="flex items-center gap-2">
            <select 
                value={uploadTarget}
                onChange={(e) => setUploadTarget(e.target.value as any)}
                className="text-[9px] bg-gray-50 border border-gray-200 rounded px-1 py-1 font-bold text-gray-500 outline-none cursor-pointer hover:bg-gray-100"
                title="Seleccionar servidor de destino"
            >
                <option value="firebase">Firebase (Rápido)</option>
                <option value="archive">Archive (Lento)</option>
            </select>

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
                    title={uploadTarget === 'archive' ? 'Subir a Archive.org' : 'Subir a Firebase'}
                >
                    {uploading ? (
                        processing ? <Wand2 className="w-3 h-3 animate-pulse text-purple-500" /> : <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <>
                            <Upload className="w-3 h-3" />
                            {process.env.API_KEY && (
                                <Sparkles className="w-2 h-2 text-rentia-gold absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </>
                    )}
                </button>
            </div>
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
      
      <ServerToggle />

      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
            relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all overflow-hidden group
            ${uploading ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-300 hover:border-rentia-blue hover:bg-blue-50'}
            ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        {processing && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 backdrop-blur-[1px]">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="bg-purple-100 p-3 rounded-full mb-2">
                        <Eraser className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-bold text-purple-700">Limpiando imagen...</span>
                </div>
            </div>
        )}

        <div className="flex flex-col items-center justify-center gap-2">
            {uploading && !processing ? (
                <>
                    <Loader2 className="w-8 h-8 text-rentia-blue animate-spin" />
                    <span className="text-xs font-bold text-gray-500">
                        {uploadTarget === 'archive' ? 'Subiendo a Archive.org...' : 'Subiendo a Firebase...'}
                    </span>
                </>
            ) : error ? (
                <>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <span className="text-xs font-bold text-red-500">{error}</span>
                </>
            ) : (
                <>
                    <div className="p-3 bg-blue-100 rounded-full text-rentia-blue group-hover:bg-rentia-blue group-hover:text-white transition-colors relative shadow-sm">
                        {uploadTarget === 'archive' ? <Database className="w-5 h-5"/> : <Upload className="w-5 h-5" />}
                        {process.env.API_KEY && (
                            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-rentia-gold animate-bounce" />
                        )}
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700 block">{label}</span>
                        <div className="flex flex-col items-center gap-1 mt-1">
                            {process.env.API_KEY ? (
                                <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                    <Wand2 className="w-3 h-3 text-purple-400" /> IA Activada
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-400">Modo Estándar (Sin IA)</span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${uploadTarget === 'archive' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                {uploadTarget === 'archive' ? 'Archive.org' : 'Firebase'}
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
