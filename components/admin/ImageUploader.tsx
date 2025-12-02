
import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Sparkles, Wand2, Eraser, Server, Globe, Database } from 'lucide-react';
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
      // Claves proporcionadas
      const ACCESS_KEY = "CCp7ETAVXWQNXWMA"; 
      const SECRET_KEY = "zk1rqJz0IBZEXWZe";
      
      // Nombre del "Bucket" (Item en Archive.org). Debe ser único globalmente.
      const BUCKET_NAME = "rentiaroom-assets-production-v1"; 
      
      // Nombre del archivo (Path)
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const objectName = `${folder}/${Date.now()}_${cleanName}`;

      // Endpoint S3 de Archive.org
      const url = `https://s3.us.archive.org/${BUCKET_NAME}/${objectName}`;

      // Upload usando autorización "LOW" (S3-Like simple) soportada por Archive.org
      const response = await fetch(url, {
          method: 'PUT',
          headers: {
              'Authorization': `LOW ${ACCESS_KEY}:${SECRET_KEY}`,
              'x-archive-auto-make-bucket': '1', // Crea el item si no existe
              'x-archive-interactive-priority': '1', // Prioridad alta para derivar imágenes rápido
              'Content-Type': 'image/jpeg'
          },
          body: blob
      });

      if (!response.ok) {
          console.error("Archive.org Error:", response.statusText);
          throw new Error('Error al subir a Archive.org. Verifica la conexión.');
      }

      // Construir URL pública directa
      // Estructura: https://archive.org/download/<ITEM_NAME>/<OBJECT_PATH>
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

      // 1. Detección y limpieza IA (Solo si existe la KEY configurada)
      // Si process.env.API_KEY no está disponible, saltamos la limpieza silenciosamente.
      if (process.env.API_KEY) {
          setProcessing(true);
          try {
             blobToProcess = await cleanImageWithAI(file, process.env.API_KEY);
          } catch (aiError) {
             console.warn("IA Cleaning skipped/failed, using original image:", aiError);
             // No lanzamos error, continuamos con la imagen original
          }
          setProcessing(false);
      }

      // 2. Compresión para web
      const fileToCompress = new File([blobToProcess], file.name, { type: 'image/jpeg' });
      const compressedBlob = await compressImage(fileToCompress);
      
      // 3. Subida según destino seleccionado
      let downloadURL = '';
      if (uploadTarget === 'archive') {
          downloadURL = await uploadToArchive(file, compressedBlob);
      } else {
          downloadURL = await uploadToFirebase(file, compressedBlob);
      }

      onUploadComplete(downloadURL);
      
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || 'Error al subir.');
    } finally {
      setUploading(false);
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- SELECTOR DE SERVIDOR ---
  const ServerToggle = () => (
      <div className="flex bg-gray-100 p-1 rounded-lg mb-3 w-fit mx-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
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
  );

  if (compact) {
      return (
        <div className="flex items-center gap-2">
            {/* Pequeño selector para modo compacto */}
            <select 
                value={uploadTarget}
                onChange={(e) => setUploadTarget(e.target.value as any)}
                className="text-[9px] bg-gray-50 border border-gray-200 rounded px-1 py-1 font-bold text-gray-500 outline-none cursor-pointer hover:bg-gray-100"
                title="Seleccionar servidor de destino"
            >
                <option value="firebase">Firebase (Fast)</option>
                <option value="archive">Archive.org (Public)</option>
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
                    title={`Subir a ${uploadTarget === 'firebase' ? 'Firebase' : 'Archive.org'}`}
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
      
      {/* Selector de Servidor */}
      <ServerToggle />

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
                    <span className="text-xs font-bold text-gray-500">
                        {uploadTarget === 'archive' ? 'Enviando a Archive.org...' : 'Subiendo a Firebase...'}
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
                                    <Wand2 className="w-3 h-3 text-purple-400" /> Limpieza IA Activa
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-400">Subida directa (Sin IA)</span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${uploadTarget === 'archive' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                Destino: {uploadTarget === 'archive' ? 'Archive.org (Público)' : 'Firebase (Rápido)'}
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
