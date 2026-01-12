import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, Loader2, X, Minimize2, User, Zap } from 'lucide-react';
import { askAiAssistant } from '../../../services/aiService';

const GLOBAL_CONTEXT = `
CONOCIMIENTO INTEGRAL RENTIAROOM

1. PROTOCOLOS Y OPERACIONES:
- Objetivo: Cualificar inquilinos. Pedir siempre Nombre, Apellidos y Ocupación.
- Credenciales: 
  * Idealista: info@rentiaroom.com | rentiaroom25A!
  * Wallapop (Gmail): rentiaroom@gmail.com | adminrentiaA!
  * Milanuncios: rtrygestion@gmail.com | adminrentia25A!
  * TikTok: rtrygestion@gmail.com | adminrentia25A! (Operamos en MURCIA).
  * Rentger: administracion@rentiaroom.com | administracion1A!murcia

2. COORDINACIÓN:
- Ayoub (Visitas): +34 638 289 883. Avisar siempre que un candidato sea aceptado.

3. SOFTWARE DE GESTIÓN (RENTGER):
Base de conocimientos extraída de help.rentger.com:
- CONFIGURACIÓN: Gestión de perfiles, activación de suscripciones y permisos de usuario. 
  Link ayuda: http://help.rentger.com/es/collections/1994026-configuracion
- INMUEBLES: Creación manual con solo la dirección, importación masiva por CSV y agrupación de activos.
  Link ayuda: http://help.rentger.com/es/collections/1994029-inmuebles
- INQUILINOS: Almacenamiento de documentación, histórico de inquilinos y comunicación de impagos.
  Link ayuda: http://help.rentger.com/es/collections/1994031-inquilinos
- CONTRATOS: Plantillas dinámicas, fianzas y FIRMA ONLINE (fundamental para gestión remota).
  Link ayuda: http://help.rentger.com/es/collections/1994032-contratos
- CONTABILIDAD Y PAGOS: Sincronización bancaria, facturación automática y LIQUIDACIÓN A PROPIETARIOS (informes profesionales para dueños).
  Link ayuda: http://help.rentger.com/es/collections/1994034-contabilidad

4. FORMACIÓN (VÍDEOS INTERNOS):
- Vídeo 1: Crear habitaciones en Rentger.
- Vídeo 2: Contrato de Gestión Integral (Propietarios).
- Vídeo 3: Localizar info de inquilinos y dueños.
- Vídeo 4: Plantillas y automatización.
- Vídeo 5: Crear contrato a inquilino.
`;

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const GlobalAiAssistant: React.FC = () => {
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [totalTokens, setTotalTokens] = useState(0);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isExpanded) {
            scrollToBottom();
        }
    }, [chatHistory, isLoading, isExpanded]);

    const handleConsult = async (overrideQuery?: string) => {
        const messageToSend = overrideQuery || query;
        if (messageToSend.trim().length < 2) return;

        setQuery('');
        setIsLoading(true);
        setIsExpanded(true);

        const newHistory: Message[] = [...chatHistory, { role: 'user', text: messageToSend.trim() }];
        setChatHistory(newHistory);

        try {
            const response = await askAiAssistant(messageToSend.trim(), GLOBAL_CONTEXT, 'global', chatHistory);
            setChatHistory([...newHistory, { role: 'model', text: response.text }]);
            setTotalTokens(prev => prev + (response.tokens || 0));
        } catch (error) {
            setChatHistory([...newHistory, { role: 'model', text: "Lo siento, he tenido un problema técnico. ¿Puedes repetirlo?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setChatHistory([]);
        setTotalTokens(0);
        setIsExpanded(false);
    };

    const estimatedCost = (totalTokens / 1000) * 0.00015;

    return (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
            <div className={`bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl shadow-xl shadow-indigo-200/50 border border-white/20 transition-all duration-500 overflow-hidden ${isExpanded ? 'ring-4 ring-indigo-500/20' : ''}`}>

                {/* Header Section */}
                <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Mentor IA Central</h3>
                            <p className="text-[10px] text-white/60 font-medium">Asistente Interactivo de Rentia</p>
                        </div>
                    </div>

                    {!isExpanded && (
                        <div className="flex-1 w-full relative group">
                            <input
                                type="text"
                                placeholder="Escribe tu duda aquí para empezar..."
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all backdrop-blur-sm"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
                            />
                            <button
                                onClick={() => handleConsult()}
                                disabled={isLoading || query.trim().length < 2}
                                className="absolute right-2 top-1.5 bg-white text-indigo-700 p-1.5 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {isExpanded && (
                        <div className="flex-1 flex justify-end gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                <Zap className="w-3 h-3 text-orange-300" />
                                <span className="text-[9px] font-bold text-white/80 uppercase tracking-tight">
                                    Consumo: {totalTokens.toLocaleString()} tokens ≈ {estimatedCost.toLocaleString('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}€
                                </span>
                            </div>
                            <button onClick={clearChat} title="Limpiar Chat" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Expanded Chat History */}
                {isExpanded && (
                    <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-inner border border-white flex flex-col h-[500px]">

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatHistory.length === 0 && (
                                    <div className="text-center py-10 opacity-50 space-y-2">
                                        <Bot className="w-10 h-10 mx-auto text-indigo-600" />
                                        <p className="text-sm font-medium">¿En qué puedo ayudarte hoy?</p>
                                    </div>
                                )}

                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-indigo-50 text-indigo-900 rounded-tr-none' : 'bg-white border border-indigo-50 text-gray-700 shadow-sm rounded-tl-none'}`}>
                                            <div className="prose prose-sm leading-relaxed font-medium">
                                                {msg.text.split('\n').filter(line => line.trim()).map((line, i) => {
                                                    const parts = line.split(/(\*\*.*?\*\*)/g);
                                                    const isStep = line.match(/^\d\./) || line.includes('->');
                                                    return (
                                                        <div key={i} className={`mb-2 ${isStep ? 'bg-indigo-50/50 p-2 rounded-lg border-l-2 border-indigo-400' : ''}`}>
                                                            <p>
                                                                {parts.map((part, j) => {
                                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                                        return <strong key={j} className="text-indigo-700 font-bold">{part.slice(2, -2)}</strong>;
                                                                    }
                                                                    return part;
                                                                })}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3 animate-pulse">
                                        <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl px-4 py-2 text-sm text-gray-400 italic">
                                            Escribiendo respuesta...
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Bottom Input Area */}
                            <div className="p-4 bg-gray-50/50 border-t border-gray-100 rounded-b-xl">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Escribe tu respuesta aquí..."
                                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
                                    />
                                    <button
                                        onClick={() => handleConsult()}
                                        disabled={isLoading || query.trim().length < 2}
                                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center min-w-[50px]"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="mt-3 flex justify-center">
                                    <button
                                        onClick={() => setIsExpanded(false)}
                                        className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 uppercase flex items-center gap-1 transition-colors"
                                    >
                                        Minimizar conversación <Minimize2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
