
import { GoogleGenAI } from "@google/genai";

// Función auxiliar para convertir File/Blob a Base64
export const toBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const cleanImageWithAI = async (file: Blob | File, apiKey: string | undefined): Promise<Blob> => {
    // MODIFICADO: Si no hay API Key, devolvemos el archivo original silenciosamente.
    // Esto evita romper flujos de subida si la key no está configurada.
    if (!apiKey) {
        console.warn("AI Cleaner: No API Key provided, returning original image.");
        return file;
    }

    // 1. Convertir a Base64 para Gemini
    const base64Full = await toBase64(file);
    const base64Data = base64Full.split(',')[1];
    const mimeType = file.type || 'image/jpeg';

    // 2. Consultar a Gemini (Detección)
    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models;
    
    const prompt = `
        Analyze this image. Detect bounding boxes for:
        1. Real Estate Agency logos (watermarks, text overlays like "Redpiso", "Idealista").
        2. Phone numbers or reference codes overlayed on the image.
        
        Return ONLY a JSON object:
        {
            "hasWatermark": boolean,
            "boxes": [ [ymin, xmin, ymax, xmax], ... ] 
        }
        Coordinates must be normalized (0-1).
    `;

    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        let analysis;
        const text = response.text || "{}";
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        analysis = JSON.parse(cleanJson);

        // 3. Si hay marcas, aplicar parche
        if (analysis.hasWatermark && analysis.boxes && analysis.boxes.length > 0) {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = base64Full;
                img.crossOrigin = "Anonymous"; 
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) { resolve(file); return; }

                    // Dibujar original
                    ctx.drawImage(img, 0, 0);

                    // Parchear cada caja detectada
                    analysis.boxes.forEach((box: number[]) => {
                        const [ymin, xmin, ymax, xmax] = box;
                        const y = Math.floor(ymin * img.height);
                        const x = Math.floor(xmin * img.width);
                        const h = Math.ceil((ymax - ymin) * img.height);
                        const w = Math.ceil((xmax - xmin) * img.width);

                        // Margen de seguridad
                        const margin = 5; 
                        const patchY = Math.max(0, y - margin);
                        const patchX = Math.max(0, x - margin);
                        const patchH = h + (margin * 2);
                        const patchW = w + (margin * 2);

                        const sourceH = Math.min(50, img.height * 0.1); 

                        try {
                            const isTop = ymin < 0.2;
                            if (isTop) {
                                ctx.drawImage(canvas, patchX, patchY + patchH + 2, patchW, sourceH, patchX, patchY, patchW, patchH);
                            } else {
                                ctx.drawImage(canvas, patchX, patchY - sourceH - 2, patchW, sourceH, patchX, patchY, patchW, patchH);
                            }
                        } catch (e) {
                            console.warn("Error parcheando caja", e);
                        }
                    });

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else resolve(file);
                    }, 'image/jpeg', 0.9);
                };
                img.onerror = () => {
                    resolve(file);
                };
            });
        }
    } catch (e) {
        console.error("AI Cleaning Error:", e);
        // En caso de error de la API (quota, network, etc), devolvemos original
        return file;
    }

    return file; // Si no hay marcas, devolver original
};
