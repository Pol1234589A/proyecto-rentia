
import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Sparkles, Wand2, Eraser, Server, Globe, Database, Info, Layers } from 'lucide-react';
import { storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageOptimizer';

interface ImageUploaderProps {
  folder: string; 
  onUploadComplete: (url: string) => void;
  label?: string;
  compact?: boolean;
  onlyFirebase?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ folder, onUploadComplete, label = "Subir Foto", compact = false, onlyFirebase = false }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{current: number, total: number, percent: number} | null>(null);
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
          throw new Error('Error Archive.org');
      }

      return `https://archive.org/download/${BUCKET_NAME}/${objectName}`;
  };

  // --- FIREBASE UPLOAD LOGIC (RESUMABLE) ---
  const uploadToFirebase = (file: File, blob: Blob, onProgress: (pct: number) => void): Promise<string> => {
      return new Promise((resolve, reject) => {
          const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
          const storageRef = ref(storage, `${folder}/${fileName}`);
          const uploadTask = uploadBytesResumable(storageRef, blob);

          uploadTask.on('state_changed', 
              (snapshot) => {
                  const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  onProgress(p);
              }, 
              (error) => reject(error), 
              async () => {
                  const url = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(url);
              }
          );
      });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);

    for (let i = 0; i < files.length; i++) {
        if (!files[i].type.startsWith('image/')) {
            setError('Solo se permiten imágenes');
            return;
        }
    }

    setUploading(true);
    setError(null);
    setProgress({ current: 0, total: files.length, percent: 0 });

    let errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Reset percent for new file
        setProgress({ current: i + 1, total: files.length, percent: 0 });

        try {
            const fileToCompress = new File([file], file.name, { type: 'image/jpeg' });
            const compressedBlob = await compressImage(fileToCompress);
            
            let downloadURL = '';
            if (uploadTarget === 'archive' && !onlyFirebase) {
                // Archive doesn't support granular progress easily with fetch, mock it jump
                downloadURL = await uploadToArchive(file, compressedBlob);
                setProgress({ current: i + 1, total: files.length, percent: 100 });
            } else {
                downloadURL = await uploadToFirebase(file, compressedBlob, (pct) => {
                    setProgress(prev => prev ? { ...prev, percent: pct } : null);
                });
            }

            onUploadComplete(downloadURL);

        } catch (err: any) {
            console.error(`Upload error:`, err);
            errors.push(file.name);
        }
    }

    setUploading(false);
    setProgress(null);
    
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (errors.length > 0) {
        setError(`Fallaron ${errors.length} imágenes.`);
    }
  };

  const ServerToggle = () => (
      <div className="flex flex-col items-center mb-3 w-fit mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button type="button" onClick={() => setUploadTarget('firebase')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${uploadTarget === 'firebase' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-gray-500 hover:text-gray-700'}`}>
                <Server className="w-3 h-3" /> Rápido
            </button>
            <button type="button" onClick={() => setUploadTarget('archive')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${uploadTarget === 'archive' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-500 hover:text-gray-700'}`}>
                <Globe className="w-3 h-3" /> Lento (Archive)
            </button>
          </div>
      </div>
  );

  if (compact) {
      return (
        <div className="flex items-center gap-2">
            {!onlyFirebase && (
                <select value={uploadTarget} onChange={(e) => setUploadTarget(e.target.value as any)} className="text-[9px] bg-gray-50 border border-gray-200 rounded px-1 py-1 font-bold text-gray-500 outline-none cursor-pointer hover:bg-gray-100">
                    <option value="firebase">Rápido</option>
                    <option value="archive">Lento</option>
                </select>
            )}
            <div className="relative inline-block">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 bg-blue-50 text-rentia-blue hover:bg-blue-100 rounded-md transition-colors border border-blue-200 disabled:opacity-50 relative overflow-hidden group flex items-center gap-1">
                    {uploading ? (
                         <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <><Upload className="w-3 h-3" /><Layers className="w-2 h-2 text-rentia-blue absolute top-0.5 right-0.5 opacity-50" /></>
                    )}
                </button>
            </div>
            {uploading && progress && (
                <div className="flex flex-col w-16">
                    <span className="text-[8px] font-mono text-gray-500">{progress.current}/{progress.total}</span>
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rentia-blue transition-all duration-300" style={{ width: `${progress.percent}%` }}></div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
      {!onlyFirebase && <ServerToggle />}

      <div onClick={() => !uploading && fileInputRef.current?.click()} className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all overflow-hidden group ${uploading ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-300 hover:border-rentia-blue hover:bg-blue-50'} ${error ? 'border-red-300 bg-red-50' : ''}`}>
        
        <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
                <div className="w-full max-w-[200px] flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-rentia-blue animate-spin mb-2" />
                    <span className="text-xs font-bold text-gray-600 mb-1">Subiendo...</span>
                    {progress && (
                        <div className="w-full">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                <span>Img {progress.current} de {progress.total}</span>
                                <span>{Math.round(progress.percent)}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progress.percent}%` }}></div>
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
                        <Upload className="w-5 h-5" />
                        <Layers className="w-3 h-3 absolute -bottom-1 -right-1 text-gray-500 bg-white rounded-full p-0.5 border border-gray-200" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700 block">{label}</span>
                        <span className="text-[10px] text-gray-400 block mt-1">Selección múltiple soportada</span>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
