
import React, { useState } from 'react';
import { Upload, FileText, Send, Loader2, AlertCircle, CheckCircle, BrainCircuit, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const FileAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleProcess = async () => {
    if (!file || !prompt) {
      setError("Por favor, selecciona un archivo y escribe una instrucción.");
      return;
    }

    if (!process.env.API_KEY) {
        setError("API Key no configurada. No se puede analizar el archivo.");
        return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Inicializar cliente Gemini (API Key verified above)
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      // 2. Preparar el archivo
      const base64Full = await toBase64(file);
      const base64Clean = base64Full.split(',')[1]; // Eliminar cabecera data:image/...

      // 3. Llamar al modelo (Multimodal)
      // Usamos gemini-2.5-flash porque es rápido y eficiente para análisis de documentos/imágenes
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64Clean
              }
            },
            {
              text: `Actúa como un experto en gestión inmobiliaria y organización de datos.
              
              Instrucción del usuario: ${prompt}
              
              Si la respuesta requiere estructura, usa un formato claro (Markdown, listas o JSON si se pide).`
            }
          ]
        }
      });

      // 4. Mostrar resultado
      if (response.text) {
        setResult(response.text);
      } else {
        throw new Error("La IA no devolvió texto.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al procesar el archivo con Gemini.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-rentia-blue" />
          Analizar Documentos con IA
        </h3>
        <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Powered by Gemini
        </span>
      </div>
      
      <div className="p-6 flex-grow flex flex-col gap-4">
        
        {/* Input File */}
        <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-center cursor-pointer group">
            <input 
                type="file" 
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center gap-2 text-gray-500 group-hover:text-rentia-blue">
                {file ? (
                    <>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <span className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{file.name}</span>
                        <span className="text-[10px] text-gray-400">Click para cambiar</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-8 h-8" />
                        <span className="text-sm font-medium">Subir Contrato, Factura o Foto (PDF/IMG)</span>
                    </>
                )}
            </div>
        </div>

        {/* Text Area */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Instrucción para Gemini</label>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Extrae los datos de esta factura en formato JSON: fecha, total, emisor..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 text-sm h-24 resize-none"
            />
        </div>

        {/* Action Button */}
        <button
            onClick={handleProcess}
            disabled={loading || !file || !prompt}
            className="w-full bg-rentia-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analizando...
                </>
            ) : (
                <>
                    <Send className="w-4 h-4" /> Procesar Datos
                </>
            )}
        </button>

        {/* Error Message */}
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
            </div>
        )}

        {/* Result Area */}
        {result && (
            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-rentia-blue uppercase flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Resultado del Análisis
                    </h4>
                    <button 
                        onClick={() => navigator.clipboard.writeText(result)}
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer font-bold"
                    >
                        Copiar Texto
                    </button>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar font-mono bg-white/50 p-2 rounded border border-blue-100">
                    {result}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
