import React, { useState } from 'react';
import { PlayCircle, BookOpen, Clock, CheckCircle2, ChevronRight, Award, Lightbulb, Rocket, Shield, Lock, Search, ExternalLink, MessageSquare, Sparkles, Send, Loader2, Bot, CreditCard } from 'lucide-react';
import { askTrainingAssistant } from '../../../services/aiService';

interface Video {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    type: 'youtube' | 'drive';
    keywords: string[]; // Palabras clave para el asistente
    completed?: boolean;
}

interface Category {
    id: string;
    title: string;
    icon: React.ReactNode;
    videos: Video[];
}

const TRAINING_DATA: Category[] = [
    {
        id: 'processes',
        title: 'Fundamentos y Procesos (Ciclo de Vida)',
        icon: <Rocket className="w-5 h-5 text-orange-500" />,
        videos: [
            {
                id: 'process-all',
                title: 'Ciclo Completo: Vivienda, Habitaciones y Contratos',
                description: 'Explicación detallada de cómo gestionamos una propiedad desde cero. Aprendemos a crear la vivienda en el sistema, definir sus habitaciones y formalizar legalmente la relación con el propietario mediante el contrato de gestión integral. Enlace externo: https://drive.google.com/file/d/1bFnWdDRSNM-9QZlFVgAPPRZnZlH7qoTM/view',
                videoUrl: 'https://drive.google.com/file/d/1bFnWdDRSNM-9QZlFVgAPPRZnZlH7qoTM/preview',
                type: 'drive',
                keywords: ['proceso', 'crear', 'vivienda', 'propiedad', 'habitaciones', 'contrato', 'propietario', 'gestion', 'integral', 'alta', 'flujo', 'trabajo', 'completo', 'sistema']
            }
        ]
    },
    {
        id: 'external_tools',
        title: 'Software y Herramientas (Rentger)',
        icon: <Shield className="w-5 h-5 text-indigo-500" />,
        videos: [
            {
                id: 'rentger-1',
                title: '1. Cómo crear habitaciones en Rentger',
                description: 'Tutorial paso a paso para dar de alta nuevas habitaciones dentro de una propiedad en la plataforma Rentger. Enlace externo: https://youtu.be/HUbAmgns_iY',
                videoUrl: 'HUbAmgns_iY',
                type: 'youtube',
                keywords: ['habitacion', 'habitaciones', 'crear', 'alta', 'nueva', 'meter', 'subir', 'dormitorio', 'piso', 'propiedad', 'vivienda', 'dormitorios']
            },
            {
                id: 'rentger-2',
                title: '2. Contrato de Gestión Integral en Rentger',
                description: 'Tutorial sobre cómo crear, localizar y enviar el contrato de gestión integral para propietarios a través de la plataforma Rentger. Enlace externo: https://drive.google.com/file/d/1h1640veqjG4-rhnys9h0D3rj7PUTMgBx/view',
                videoUrl: 'https://drive.google.com/file/d/1h1640veqjG4-rhnys9h0D3rj7PUTMgBx/preview',
                type: 'drive',
                keywords: ['contrato', 'propietario', 'dueño', 'mandar', 'enviar', 'gestoria', 'gestión', 'firma', 'digital', 'comision', 'rentger', 'firmar']
            },
            {
                id: 'rentger-3',
                title: '3. Localizar información de inquilinos y propietarios',
                description: 'Cómo obtener y consultar la información detallada de cualquier inquilino o propietario dentro de la plataforma Rentger. Enlace externo: https://drive.google.com/file/d/1RJ5dAstB9yURP1oKNKiLRMlb3s4x0_Zz/view',
                videoUrl: 'https://drive.google.com/file/d/1RJ5dAstB9yURP1oKNKiLRMlb3s4x0_Zz/preview',
                type: 'drive',
                keywords: ['inquilino', 'inquilinos', 'datos', 'nombre', 'telefono', 'dni', 'perfil', 'buscar', 'donde', 'contacto', 'info', 'propietario', 'teléfono', 'dueño']
            },
            {
                id: 'rentger-4',
                title: '4. Plantillas de contratos y automatización',
                description: 'Aprende a crear y modificar plantillas de contratos en Rentger, además de automatizar campos para agilizar la gestión documental. Enlace externo: https://drive.google.com/file/d/1L04KDtHXt8tL0eMplNSabs9WuX-EK4Se/view',
                videoUrl: 'https://drive.google.com/file/d/1L04KDtHXt8tL0eMplNSabs9WuX-EK4Se/preview',
                type: 'drive',
                keywords: ['plantilla', 'automatizado', 'rellenar', 'modificar', 'cambiar', 'palabras', 'texto', 'contrato', 'edicion', 'borrador', 'plantillas', 'automático', 'edición']
            },
            {
                id: 'rentger-5',
                title: '5. Cómo crear un contrato a un inquilino',
                description: 'Tutorial paso a paso sobre el proceso de creación de contratos para nuevos inquilinos en Rentger. Enlace externo: https://drive.google.com/file/d/1N4clalwVuIhbqHnNIvLMl0-h9FyJmpSK/view',
                videoUrl: 'https://drive.google.com/file/d/1N4clalwVuIhbqHnNIvLMl0-h9FyJmpSK/preview',
                type: 'drive',
                keywords: ['inquilino', 'contrato inquilino', 'nuevo contrato', 'arrendamiento', 'alquiler', 'hacer contrato', 'crear contrato', 'habitacion contrato']
            }
        ]
    },
    {
        id: 'finance',
        title: 'Administración y Finanzas',
        icon: <CreditCard className="w-5 h-5 text-emerald-500" />,
        videos: [
            {
                id: 'payouts-process',
                title: 'Transferencias y Contabilidad de Propietarios',
                description: 'Tutorial detallado sobre cómo realizar las transferencias mensuales a los propietarios y cómo contabilizarlas correctamente en la plataforma para mantener un control financiero impecable. Enlace externo: https://drive.google.com/file/d/1o1NxVAx0KuVkDaXj5aTAMe6m-lxI23gc/view',
                videoUrl: 'https://drive.google.com/file/d/1o1NxVAx0KuVkDaXj5aTAMe6m-lxI23gc/preview',
                type: 'drive',
                keywords: ['transferencia', 'propietario', 'liquidación', 'contabilidad', 'pago', 'facturacion', 'banco', 'transferencias', 'liquidaciones', 'contabilizar', 'dueño', 'abono']
            },
            {
                id: 'rosario-71-billing',
                title: 'Caso Especial: Rosario 71 (Flujo Prop. → Rentia)',
                description: 'Explicación del registro contable para Rosario 71. En este modelo, el inquilino paga directamente al propietario y este nos abona la comisión. Veremos los pasos a seguir una vez emitida la factura para cerrar la liquidación correctamente. Enlace externo: https://drive.google.com/file/d/11UASXKL0SBK3V34NJ8r2pYUxF00ToDMG/view',
                videoUrl: 'https://drive.google.com/file/d/11UASXKL0SBK3V34NJ8r2pYUxF00ToDMG/preview',
                type: 'drive',
                keywords: ['rosario', 'rosario 71', 'propietario', 'comisión', 'pago directo', 'especial', 'flujo', 'liquidación', 'factura']
            }
        ]
    }
];

export const TrainingView: React.FC = () => {
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const filteredData = TRAINING_DATA.map(cat => ({
        ...cat,
        videos: cat.videos.filter(v =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.videos.length > 0);

    const getRecommendation = (query: string) => {
        if (!query || query.length < 3) return null;

        const q = query.toLowerCase();
        const allVideos = TRAINING_DATA.flatMap(c => c.videos);

        // Buscamos coincidencias en las palabras clave personalizadas
        const bestMatch = allVideos.find(video =>
            video.keywords.some(keyword => q.includes(keyword.toLowerCase())) ||
            video.title.toLowerCase().includes(q)
        );

        return bestMatch || null;
    };

    const recommendation = getRecommendation(searchQuery);

    const renderDescription = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rentia-blue hover:underline font-bold break-all inline-flex items-center gap-1"
                    >
                        {part}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            }
            return part;
        });
    };

    const handleAiConsult = async () => {
        if (searchQuery.length < 5) return;

        setIsAiLoading(true);
        setAiResponse(null);

        const context = TRAINING_DATA.flatMap(c =>
            c.videos.map(v => `- [Vídeo ${v.id}] ${v.title}: ${v.description}`)
        ).join('\n');

        const answer = await askTrainingAssistant(searchQuery, context);
        setAiResponse(answer);
        setIsAiLoading(false);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sidebar de Navegación */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 italic text-sm text-gray-500 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    Acceso exclusivo para Administración
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-grow flex flex-col">
                    <div className="p-4 border-b border-gray-50 bg-gradient-to-br from-indigo-50/50 to-white">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">
                            <Sparkles className="w-3 h-3" />
                            Asistente de Formación
                        </div>
                        <div className="relative flex gap-2">
                            <div className="relative flex-grow">
                                <MessageSquare className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                                <input
                                    type="text"
                                    placeholder="Tengo una duda sobre..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-gray-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiConsult()}
                                />
                            </div>
                            <button
                                onClick={handleAiConsult}
                                disabled={isAiLoading || searchQuery.length < 5}
                                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 active:scale-95"
                                title="Consultar con IA"
                            >
                                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>

                        {aiResponse && (
                            <div className="mt-4 p-5 bg-white border border-indigo-100 rounded-2xl shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Bot className="w-16 h-16 text-indigo-600" />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">IA Mentor Rentia</span>
                                    <button
                                        onClick={() => setAiResponse(null)}
                                        className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 font-bold bg-gray-50 px-2 py-1 rounded-lg transition-colors border border-gray-100"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed space-y-3 font-medium">
                                    {aiResponse.split('\n').filter(line => line.trim()).map((line, i) => {
                                        // Procesar negritas simples con **
                                        const parts = line.split(/(\*\*.*?\*\*)/g);
                                        return (
                                            <p key={i}>
                                                {parts.map((part, j) => {
                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                        return <strong key={j} className="text-indigo-700 font-black">{part.slice(2, -2)}</strong>;
                                                    }
                                                    return part;
                                                })}
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {recommendation && (
                            <div className="mt-4 p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 border border-indigo-500 animate-in slide-in-from-top-2 duration-300">
                                <p className="text-[10px] font-bold text-indigo-100 mb-2 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Sugerencia para tu duda:
                                </p>
                                <button
                                    onClick={() => setSelectedVideo(recommendation)}
                                    className="w-full text-left flex items-center gap-3 group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                                        <PlayCircle className="w-5 h-5" />
                                    </div>
                                    <p className="text-white text-xs font-bold leading-tight group-hover:underline">
                                        {recommendation.title}
                                    </p>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-4">
                        {filteredData.map(category => (
                            <div key={category.id} className="space-y-1">
                                <h3 className="flex items-center gap-2 px-3 py-2 text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                                    {category.icon}
                                    {category.title}
                                </h3>
                                <div className="space-y-1">
                                    {category.videos.map(video => (
                                        <button
                                            key={video.id}
                                            onClick={() => setSelectedVideo(video)}
                                            className={`w-full text-left p-3 rounded-xl transition-all group border ${selectedVideo?.id === video.id
                                                ? 'bg-rentia-blue border-rentia-blue shadow-lg shadow-rentia-blue/20'
                                                : 'bg-white border-transparent hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 rounded-full flex-shrink-0 ${selectedVideo?.id === video.id ? 'text-white' : 'text-gray-400 group-hover:text-rentia-blue'
                                                    }`}>
                                                    <PlayCircle className="w-5 h-5" />
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className={`text-sm font-bold leading-tight truncate ${selectedVideo?.id === video.id ? 'text-white' : 'text-gray-800'
                                                        }`}>
                                                        {video.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {video.completed && (
                                                            <span className="text-green-500 animate-in zoom-in">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Visualizador Principal */}
            <div className="flex-grow flex flex-col gap-6">
                {selectedVideo ? (
                    <div className="space-y-6">
                        {/* Video Player Container */}
                        <div className="bg-black rounded-3xl shadow-2xl overflow-hidden aspect-video relative group ring-8 ring-white">
                            <iframe
                                className="absolute inset-0 w-full h-full"
                                src={selectedVideo.type === 'youtube'
                                    ? `https://www.youtube.com/embed/${selectedVideo.videoUrl}?rel=0&modestbranding=1&showinfo=0`
                                    : selectedVideo.videoUrl
                                }
                                title={selectedVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>

                        {/* Video Info */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-rentia-blue font-bold text-xs uppercase tracking-widest">
                                        <Lightbulb className="w-4 h-4" />
                                        Módulo de Aprendizaje
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 font-display">
                                        {selectedVideo.title}
                                    </h2>
                                </div>
                                <button className="bg-rentia-black text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 shadow-xl hover:shadow-black/10 active:scale-95">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    Marcar como Completado
                                </button>
                            </div>

                            <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
                                {renderDescription(selectedVideo.description)}
                            </p>

                            <div className="pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nivel</p>
                                    <p className="text-sm font-bold text-gray-700">Avanzado / Gestión</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Acceso</p>
                                    <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> Privado
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center flex-grow shadow-inner bg-gradient-to-b from-white to-gray-50/50">
                        <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-rentia-blue mb-6 shadow-sm border border-blue-100 animate-bounce">
                            <PlayCircle className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3">Tu Centro de Formación Rentia</h2>
                        <p className="text-gray-500 max-w-md leading-relaxed">
                            Selecciona un módulo en el menú lateral para comenzar a aprender sobre los procesos e infraestructura de la empresa.
                        </p>
                        <div className="mt-8 flex items-center gap-4 text-xs font-bold text-gray-400 uppercase bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                            <span>{TRAINING_DATA.length} Módulos</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{TRAINING_DATA.reduce((acc, cat) => acc + cat.videos.length, 0)} Lecciones</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
