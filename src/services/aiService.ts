import { GoogleGenAI } from "@google/genai";

export const askAiAssistant = async (question: string, context: string, mode: 'training' | 'protocols' | 'global' = 'training', history: { role: 'user' | 'model', text: string }[] = []) => {
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        '';

    try {
        if (!API_KEY || API_KEY.trim() === '') {
            throw new Error("API Key no detectada. Por favor, reinicia el servidor (Ctrl+C y npm run dev).");
        }

        const ai = new GoogleGenAI({ apiKey: API_KEY });

        let personaDescription = 'Asistente de Formación de RentiaRoom';
        let contextHeuristic = 'basándote exclusivamente en el material de formación (vídeos) disponible.';

        if (mode === 'protocols') {
            personaDescription = 'Asistente de Protocolos y Operaciones de RentiaRoom';
            contextHeuristic = 'basándote en los protocolos de actuación, flujos de trabajo y credenciales de la empresa.';
        } else if (mode === 'global') {
            personaDescription = 'Mentor Inteligente Integral de RentiaRoom';
            contextHeuristic = 'utilizando todo el conocimiento de formación, protocolos, claves y procedimientos de la empresa.';
        }

        const historyContext = history.length > 0
            ? `HISTORIAL DE LA CONVERSACIÓN:\n${history.map(h => `${h.role === 'user' ? 'Trabajadora' : 'Asistente'}: ${h.text}`).join('\n')}\n`
            : '';

        const prompt = `
            Actúa como el ${personaDescription}.
            Tu objetivo es ayudar a una trabajadora de la empresa a resolver sus dudas ${contextHeuristic}
            
            INFORMACIÓN DE CONTEXTO DE LA EMPRESA (Usa esto para responder):
            ${context}
            
            ${historyContext}
            
            NUEVA PREGUNTA DE LA TRABAJADORA:
            "${question}"
            
            INSTRUCCIONES CRÍTICAS:
            1. Responde de forma muy amable, clara y profesional.
            2. Mantén la continuidad de la conversación si la trabajadora hace preguntas de seguimiento.
            3. Si la duda se resuelve con el material proporcionado, dale la respuesta directa y clara.
            4. Si la explicación es compleja, utiliza ESTRUCTURAS VISUALES (listas, diagramas de texto, tablas).
            5. No inventes procesos. Si no hay información suficiente, dile amablemente que consulte con Pol o Sandra.
            6. Sé breve pero resolutivo.
            7. Usa negritas (**texto**) para resaltar partes importantes.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: {
                parts: [
                    { text: prompt }
                ]
            }
        });

        if (response.text) {
            return {
                text: response.text,
                tokens: response.usageMetadata?.totalTokenCount || 0
            };
        } else {
            throw new Error("La IA no devolvió texto.");
        }
    } catch (error: any) {
        console.error("Error en AI Assistant:", error);
        return {
            text: `Error: ${error.message || "Problema técnico"}. Por favor, asegúrate de que la configuración de la IA es correcta.`,
            tokens: 0
        };
    }
};

// Mantenemos este export por compatibilidad devolviendo solo el texto si es lo que esperan
export const askTrainingAssistant = async (question: string, context: string) => {
    const res = await askAiAssistant(question, context, 'training');
    return res.text;
};
