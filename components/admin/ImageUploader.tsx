
import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Sparkles, Wand2, Eraser, Server, Globe, Database, Info, Layers } from 'lucide-react';
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
  const [progress, setProgress] = useState<{current: number, total: number} | null>(null);
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validación básica de tipos
    for (let i = 0; i < files.length; i++) {
        if (!files[i].type.startsWith('image/')) {
            setError('Solo se permiten imágenes');
            return;
        }
    }

    setUploading(true);
    setError(null);
    setProgress({ current: 0, total: files.length });

    let errors: string[] = [];

    // Procesamiento en serie para no saturar memoria/navegador
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Actualizar progreso UI
        setProgress({ current: i + 1, total: files.length });

        try {
            let blobToProcess: Blob = file;

            // 1. Intentar limpieza IA (Solo si hay API Key y NO son demasiadas imágenes para no saturar API)
            // Limitamos IA a lotes pequeños o individuales para evitar cuellos de botella
            if (process.env.API_KEY && process.env.API_KEY.length > 5 && files.length <= 5) {
                setProcessing(true);
                try {
                    const cleaned = await cleanImageWithAI(file, process.env.API_KEY);
                    if (cleaned) blobToProcess = cleaned;
                } catch (aiError) {
                    console.warn(`AI Cleaning skipped for ${file.name}:`, aiError);
                }
                setProcessing(false);
            }

            // 2. Compresión
            const fileToCompress = new File([blobToProcess], file.name, { type: 'image/jpeg' });
            const compressedBlob = await compressImage(fileToCompress);
            
            // 3. Subida
            let downloadURL = '';
            if (uploadTarget === 'archive') {
                downloadURL = await uploadToArchive(file, compressedBlob);
            } else {
                downloadURL = await uploadToFirebase(file, compressedBlob);
            }

            // Notificar al padre (uno a uno para que vayan apareciendo)
            onUploadComplete(downloadURL);

        } catch (err: any) {
            console.error(`Error uploading ${file.name}:`, err);
            errors.push(file.name);
        }
    }

    setUploading(false);
    setProcessing(false);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Reporte final si hubo errores parciales
    if (errors.length > 0) {
        setError(`Se subieron ${files.length - errors.length} imágenes. Fallaron: ${errors.join(', ')}`);
        if (uploadTarget === 'archive') {
            alert("Aviso: Las imágenes subidas a Archive.org pueden tardar unos minutos en ser visibles (Error 404 temporal).");
        }
    } else if (uploadTarget === 'archive') {
        alert(`Se han subido ${files.length} imágenes a Archive.org. Pueden tardar unos minutos en ser visibles públicamente.`);
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
                  <span>Aviso: Archive.org tarda ~15 min en procesar.</span>
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
                    multiple // Habilitar selección múltiple
                    className="hidden"
                />
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-1.5 bg-blue-50 text-rentia-blue hover:bg-blue-100 rounded-md transition-colors border border-blue-200 disabled:opacity-50 relative overflow-hidden group flex items-center gap-1"
                    title={uploadTarget === 'archive' ? 'Subir a Archive.org' : 'Subir a Firebase'}
                >
                    {uploading ? (
                        processing ? <Wand2 className="w-3 h-3 animate-pulse text-purple-500" /> : <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <>
                            <Upload className="w-3 h-3" />
                            {/* Indicador visual de múltiple */}
                            <Layers className="w-2 h-2 text-rentia-blue absolute top-0.5 right-0.5 opacity-50" />
                        </>
                    )}
                </button>
            </div>
            {/* Indicador de progreso en modo compacto */}
            {uploading && progress && (
                <span className="text-[9px] font-mono text-rentia-blue animate-pulse whitespace-nowrap">
                    {progress.current}/{progress.total}
                </span>
            )}
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
        multiple // Habilitar selección múltiple
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
                    <span className="text-xs font-bold text-purple-700">Limpiando imagen con IA...</span>
                </div>
            </div>
        )}

        <div className="flex flex-col items-center justify-center gap-2">
            {uploading && !processing ? (
                <>
                    <Loader2 className="w-8 h-8 text-rentia-blue animate-spin" />
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-500 mb-1">
                            {uploadTarget === 'archive' ? 'Subiendo a Archive.org...' : 'Subiendo a Firebase...'}
                        </span>
                        {progress && (
                            <span className="text-[10px] font-mono bg-blue-100 text-rentia-blue px-2 py-0.5 rounded-full">
                                Imagen {progress.current} de {progress.total}
                            </span>
                        )}
                    </div>
                </>
            ) : error ? (
                <>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <span className="text-xs font-bold text-red-500 text-center px-4">{error}</span>
                </>
            ) : (
                <>
                    <div className="p-3 bg-blue-100 rounded-full text-rentia-blue group-hover:bg-rentia-blue group-hover:text-white transition-colors relative shadow-sm">
                        {uploadTarget === 'archive' ? <Database className="w-5 h-5"/> : <Upload className="w-5 h-5" />}
                        {/* Icono de capas indicando múltiple */}
                        <Layers className="w-3 h-3 absolute -bottom-1 -right-1 text-gray-500 bg-white rounded-full p-0.5 border border-gray-200" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700 block">{label}</span>
                        <div className="flex flex-col items-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-400">Soporta selección múltiple (Lote)</span>
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
