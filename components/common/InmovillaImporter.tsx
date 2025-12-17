
import React, { useState, useRef } from 'react';
import { FileText, Loader2, Search } from 'lucide-react';

// Cargamos PDF.js desde CDN para evitar dependencias pesadas en el bundle
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

export interface InmovillaData {
  title: string;
  address: string;
  city: string;
  price: number;
  rooms: number;
  baths: number;
  surface: number;
  description: string;
  floor: string;
  features: string[];
}

interface Props {
  onDataExtracted: (data: InmovillaData) => void;
  className?: string;
  label?: string;
}

export const InmovillaImporter: React.FC<Props> = ({ onDataExtracted, className, label = "Importar Ficha (Sin IA - Solo PDF)" }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseTextWithRegex = (text: string): InmovillaData => {
    // Limpiamos espacios extra y normalizamos
    const cleanText = text.replace(/\s+/g, ' ');

    // 1. Extraer Precio (Busca números seguidos de € o precedidos por PVP)
    const priceMatch = cleanText.match(/(?:PVP|Precio|Venta)[:\s]*([\d.]+)/i);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, '')) : 0;

    // 2. Extraer Habitaciones (Busca números seguidos de hab, dorm o dormitorios)
    const roomsMatch = cleanText.match(/(\d+)\s*(?:hab|dorm|dormitorios)/i);
    const rooms = roomsMatch ? parseInt(roomsMatch[1]) : 0;

    // 3. Extraer Baños
    const bathsMatch = cleanText.match(/(\d+)\s*(?:baño|baths|aseo)/i);
    const baths = bathsMatch ? parseInt(bathsMatch[1]) : 1;

    // 4. Extraer Superficie
    const surfaceMatch = cleanText.match(/(\d+)\s*(?:m2|metros|const)/i);
    const surface = surfaceMatch ? parseInt(surfaceMatch[1]) : 0;

    // 5. Intentar extraer dirección (Heurística: suele estar al principio o tras "Ubicación")
    // Este es el punto más difícil sin IA porque varía mucho.
    const addressMatch = cleanText.match(/(?:Dirección|Ubicación)[:\s]*([^,.-]+)/i);
    const address = addressMatch ? addressMatch[1].trim() : "Dirección extraída";

    return {
      title: "Propiedad Importada",
      address: address,
      city: "Murcia", // Valor por defecto
      price: price,
      rooms: rooms,
      baths: baths,
      surface: surface,
      description: text.substring(0, 500) + "...", // Cogemos el inicio del texto
      floor: "",
      features: ["Extraído mediante algoritmo local"]
    };
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
        alert("Esta versión sin IA solo soporta archivos PDF digitales.");
        return;
    }

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Cargamos la librería dinámicamente si no está
      if (!(window as any).pdfjsLib) {
          await new Promise((resolve) => {
              const script = document.createElement('script');
              script.src = PDFJS_CDN;
              script.onload = resolve;
              document.head.appendChild(script);
          });
      }

      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      // Extraer texto de todas las páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + " ";
      }

      const data = parseTextWithRegex(fullText);
      onDataExtracted(data);
      
    } catch (error) {
      console.error("Error local parsing:", error);
      alert("No se pudo leer el texto del PDF. Asegúrate de que no es una imagen escaneada.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input 
        type="file" 
        ref={fileInputRef}
        accept="application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
      <button 
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-all w-full justify-center"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
        {loading ? 'Leyendo PDF...' : label}
      </button>
      <p className="text-[9px] text-slate-400 text-center mt-1 italic">Procesamiento local (sin nubes ni IA)</p>
    </div>
  );
};
