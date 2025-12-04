
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { Search, Send, Paperclip, MoreVertical, Check, CheckCheck, MessageCircle, RefreshCw, Filter, Phone, Video, AlertCircle, ShoppingBag, Layers, Settings, X, Power, Globe, Lock } from 'lucide-react';

// Tipos de datos
type Platform = 'facebook' | 'instagram' | 'tiktok' | 'milanuncios' | 'wallapop';
type MsgType = 'dm' | 'comment';

interface SocialMessage {
    id: string;
    platform: Platform;
    type: MsgType;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: any;
    isRead: boolean;
    isReplied: boolean;
    direction: 'incoming' | 'outgoing';
    conversationId: string;
    attachmentUrl?: string;
}

interface Conversation {
    id: string;
    platform: Platform;
    senderName: string;
    senderAvatar: string;
    lastMessage: string;
    lastTimestamp: any;
    unreadCount: number;
    messages: SocialMessage[];
}

export const SocialInbox: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');
    const [replyText, setReplyText] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    // Configuración de integraciones (Persistente)
    // CAMBIO: Activadas todas por defecto para evitar que se vean "borradas"
    const [integrations, setIntegrations] = useState<Record<Platform, boolean>>({
        facebook: true,
        instagram: true,
        tiktok: true,
        wallapop: true, 
        milanuncios: true 
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    // Cargar config local
    useEffect(() => {
        const saved = localStorage.getItem('social_integrations');
        if (saved) {
            setIntegrations(JSON.parse(saved));
        }
    }, []);

    const toggleIntegration = (platform: Platform) => {
        const newState = { ...integrations, [platform]: !integrations[platform] };
        setIntegrations(newState);
        localStorage.setItem('social_integrations', JSON.stringify(newState));
        
        // Si desactivamos la plataforma actual, volver a 'all'
        if (!newState[platform] && filterPlatform === platform) {
            setFilterPlatform('all');
        }
    };

    // 1. Escuchar mensajes de Firebase
    useEffect(() => {
        const q = query(collection(db, "social_inbox"), orderBy("timestamp", "asc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rawMessages: SocialMessage[] = [];
            snapshot.forEach((doc) => {
                rawMessages.push({ ...doc.data(), id: doc.id } as SocialMessage);
            });

            const convMap = new Map<string, Conversation>();

            rawMessages.forEach(msg => {
                // Solo procesar si la integración está activa
                if (!integrations[msg.platform]) return;

                const convId = msg.conversationId;
                
                if (!convMap.has(convId)) {
                    convMap.set(convId, {
                        id: convId,
                        platform: msg.platform,
                        senderName: msg.senderName,
                        senderAvatar: msg.senderAvatar || '',
                        lastMessage: '',
                        lastTimestamp: 0,
                        unreadCount: 0,
                        messages: []
                    });
                }

                const conv = convMap.get(convId)!;
                conv.messages.push(msg);
                
                conv.lastMessage = msg.direction === 'outgoing' ? `Tú: ${msg.content}` : msg.content;
                conv.lastTimestamp = msg.timestamp;
                if (msg.direction === 'incoming' && !msg.isRead) {
                    conv.unreadCount += 1;
                }
            });

            const convArray = Array.from(convMap.values()).sort((a, b) => {
                const timeA = a.lastTimestamp?.seconds || 0;
                const timeB = b.lastTimestamp?.seconds || 0;
                return timeB - timeA;
            });

            setConversations(convArray);
        });

        return () => unsubscribe();
    }, [integrations]); // Recargar si cambian las integraciones

    // Scroll automático
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedConvId, conversations]);

    const handleSelectConversation = async (conv: Conversation) => {
        setSelectedConvId(conv.id);
        const unreadMsgs = conv.messages.filter(m => m.direction === 'incoming' && !m.isRead);
        unreadMsgs.forEach(async (msg) => {
            const msgRef = doc(db, "social_inbox", msg.id);
            await updateDoc(msgRef, { isRead: true });
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedConvId) return;

        const currentConv = conversations.find(c => c.id === selectedConvId);
        if (!currentConv) return;

        try {
            await addDoc(collection(db, "social_inbox"), {
                platform: currentConv.platform,
                type: 'dm',
                senderId: 'rentiaroom_admin',
                senderName: 'RentiaRoom',
                senderAvatar: 'https://i.ibb.co/QvzK6db3/Logo-Negativo.png',
                content: replyText,
                timestamp: serverTimestamp(),
                isRead: true,
                isReplied: true,
                direction: 'outgoing',
                conversationId: selectedConvId
            });
            setReplyText('');
        } catch (error) {
            console.error("Error enviando mensaje", error);
        }
    };

    // --- SIMULADOR INTELIGENTE (SOLO CANALES ACTIVOS) ---
    const simulateIncomingMessage = async () => {
        const activePlatforms = Object.keys(integrations).filter(k => integrations[k as Platform]) as Platform[];
        
        if (activePlatforms.length === 0) {
            alert("No hay canales activos. Activa alguna integración en Configuración.");
            setShowSettings(true);
            return;
        }

        setIsSimulating(true);
        const randomPlatform = activePlatforms[Math.floor(Math.random() * activePlatforms.length)];
        
        const names = ["Carlos Ruiz", "Ana López", "Mike Smith", "Laura G.", "Vendedor Pro", "Usuario Wallapop", "María P."];
        const randomName = names[Math.floor(Math.random() * names.length)];
        
        let msgs = ["Hola, ¿sigue disponible?", "¿Aceptáis mascotas?", "Me interesa el piso.", "Hi, do you speak English?"];
        if (randomPlatform === 'wallapop') msgs = ["¿Haces envíos?", "¿Es el último precio?", "Te ofrezco 300€", "¿Sigue disponible la habitación?", "¿Me lo reservas?"];
        if (randomPlatform === 'milanuncios') msgs = ["Vi tu anuncio ref: 29384", "Llamame por favor", "¿Está amueblado?", "Me interesa ver el piso"];

        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        const newConvId = `conv_${Date.now()}_${randomPlatform}`;

        // Buscar si ya existe convo para agrupar (simple lógica demo)
        const existing = conversations.find(c => c.senderName === randomName && c.platform === randomPlatform);
        const finalConvId = existing ? existing.id : newConvId;

        await addDoc(collection(db, "social_inbox"), {
            platform: randomPlatform,
            type: Math.random() > 0.8 ? 'comment' : 'dm',
            senderId: `user_${Date.now()}`,
            senderName: randomName,
            senderAvatar: `https://ui-avatars.com/api/?name=${randomName}&background=random`,
            content: randomMsg,
            timestamp: serverTimestamp(),
            isRead: false,
            isReplied: false,
            direction: 'incoming',
            conversationId: finalConvId
        });
        
        setTimeout(() => setIsSimulating(false), 500);
    };

    // --- ICONOS ---
    const getPlatformIcon = (platform: Platform) => {
        switch (platform) {
            case 'facebook': return (
                <div className="bg-blue-600 text-white p-1 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
            );
            case 'instagram': return (
                <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white p-1 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </div>
            );
            case 'tiktok': return (
                <div className="bg-black text-white p-1 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.49-3.35-3.98-5.6-.54-2.44.4-5.03 2.39-6.73.16-.14.33-.27.5-.4.03-.02.06-.04.09-.06v4.03c-.2.15-.38.34-.52.55-.71 1.05-.72 2.45-.04 3.52.54.85 1.45 1.4 2.46 1.54 1.01.14 2.05-.12 2.87-.72.82-.6 1.33-1.52 1.39-2.53.04-1.53.01-3.07.01-4.61V.02z"/></svg>
                </div>
            );
            case 'wallapop': return (
                <div className="bg-[#13C1AC] text-white p-1 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    <ShoppingBag className="w-3 h-3" />
                </div>
            );
            case 'milanuncios': return (
                <div className="bg-[#86B817] text-white p-1 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    <Layers className="w-3 h-3" />
                </div>
            );
            default: return <div className="bg-gray-400 w-5 h-5 rounded-full"></div>;
        }
    };

    const activeConversation = conversations.find(c => c.id === selectedConvId);
    
    // Filtrado de conversaciones
    const filteredConversations = conversations.filter(c => 
        filterPlatform === 'all' ? true : c.platform === filterPlatform
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[800px] flex relative">
            
            {/* --- SIDEBAR --- */}
            <div className={`w-full md:w-80 flex flex-col border-r border-gray-200 ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                
                {/* Header Sidebar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-rentia-blue" /> Inbox
                        </h3>
                        <div className="flex gap-1">
                            <button 
                                onClick={simulateIncomingMessage} 
                                className="p-2 hover:bg-white rounded-full text-gray-500 hover:text-rentia-blue transition-colors" 
                                title="Simular Entrada"
                            >
                                {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                            </button>
                            <button 
                                onClick={() => setShowSettings(true)} 
                                className="p-2 hover:bg-white rounded-full text-gray-500 hover:text-rentia-black transition-colors" 
                                title="Configurar Canales"
                            >
                                <Settings className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                    
                    {/* Filtros */}
                    <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => setFilterPlatform('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterPlatform === 'all' ? 'bg-rentia-black text-white' : 'bg-white border text-gray-600'}`}>Todos</button>
                        <button onClick={() => setFilterPlatform('facebook')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterPlatform === 'facebook' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white border text-gray-600'}`}>Meta</button>
                        
                        {integrations.wallapop && (
                            <button onClick={() => setFilterPlatform('wallapop')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterPlatform === 'wallapop' ? 'bg-[#E0F8F6] text-[#0D9E8C] border-[#B2EBE6]' : 'bg-white border text-gray-600'}`}>Wallapop</button>
                        )}
                        {integrations.milanuncios && (
                            <button onClick={() => setFilterPlatform('milanuncios')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterPlatform === 'milanuncios' ? 'bg-[#EEF6DC] text-[#6A9312] border-[#DCEAB7]' : 'bg-white border text-gray-600'}`}>Milanuncios</button>
                        )}
                    </div>

                    <div className="relative mt-3">
                        <input type="text" placeholder="Buscar..." className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-rentia-blue" />
                        <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
                    </div>
                </div>

                {/* Lista Conversaciones */}
                <div className="flex-grow overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center py-10 px-6 text-gray-400 text-xs">
                            <p className="mb-2">No hay mensajes recientes.</p>
                            {(!integrations.wallapop || !integrations.milanuncios) && (
                                <button onClick={() => setShowSettings(true)} className="text-rentia-blue hover:underline">
                                    Conectar más canales
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 relative ${selectedConvId === conv.id ? 'bg-blue-50/50' : ''}`}
                            >
                                <div className="relative">
                                    <img src={conv.senderAvatar || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    <div className="absolute -bottom-1 -right-1 border border-white rounded-full shadow-sm">
                                        {getPlatformIcon(conv.platform)}
                                    </div>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{conv.senderName}</h4>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                            {conv.lastTimestamp?.toDate ? new Date(conv.lastTimestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora'}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                        {conv.lastMessage}
                                    </p>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div className="absolute right-4 top-1/2 mt-2 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- AREA DE CHAT --- */}
            <div className={`w-full flex flex-col bg-[#efe7dd] relative ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                {activeConversation ? (
                    <>
                        <div className="bg-white border-b border-gray-200 p-3 px-4 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedConvId(null)} className="md:hidden text-gray-500 mr-1">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <img src={activeConversation.senderAvatar} className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                        {activeConversation.senderName}
                                        <span className="scale-75">{getPlatformIcon(activeConversation.platform)}</span>
                                    </h4>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3 text-gray-500">
                                <Phone className="w-5 h-5 cursor-pointer hover:text-rentia-blue" />
                                <Video className="w-5 h-5 cursor-pointer hover:text-rentia-blue" />
                                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-rentia-blue" />
                            </div>
                        </div>

                        <div 
                            className="flex-grow overflow-y-auto p-4 md:p-8 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-95" 
                            ref={scrollRef}
                        >
                            {activeConversation.messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] md:max-w-[60%] rounded-lg p-3 shadow-sm text-sm relative ${
                                        msg.direction === 'outgoing' 
                                        ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' 
                                        : 'bg-white text-gray-800 rounded-tl-none'
                                    }`}>
                                        {msg.type === 'comment' && (
                                            <div className="text-[10px] text-gray-500 italic mb-1 flex items-center gap-1">
                                                <MessageCircle className="w-3 h-3"/> Comentario en publicación
                                            </div>
                                        )}
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <span className="text-[10px] text-gray-400">
                                                {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                                            </span>
                                            {msg.direction === 'outgoing' && (
                                                msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendMessage} className="bg-white p-3 md:p-4 border-t border-gray-200 flex items-center gap-2">
                            <button type="button" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Paperclip className="w-5 h-5"/></button>
                            <input 
                                type="text" 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Escribe un mensaje..." 
                                className="flex-grow bg-gray-100 border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rentia-blue/50 outline-none"
                            />
                            <button 
                                type="submit" 
                                disabled={!replyText.trim()}
                                className="p-2.5 bg-rentia-blue text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center bg-gray-50 border-l border-gray-200">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                            <MessageCircle className="w-12 h-12 text-rentia-blue opacity-50" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-600 mb-2">Social Inbox</h3>
                        <p className="max-w-md text-sm">Centraliza tus mensajes de todas las plataformas.</p>
                        <div className="mt-8 flex gap-4 opacity-60">
                            {getPlatformIcon('facebook')}
                            {getPlatformIcon('instagram')}
                            {integrations.wallapop && getPlatformIcon('wallapop')}
                            {integrations.milanuncios && getPlatformIcon('milanuncios')}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL AJUSTES DE CANALES */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-rentia-blue" />
                                Canales Conectados
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-gray-500 mb-4">Activa las plataformas para recibir y responder mensajes desde este panel.</p>
                            
                            {/* Facebook & Instagram (Standard) */}
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 text-white p-1.5 rounded-full"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
                                    <span className="font-bold text-sm text-blue-900">Meta (FB/IG)</span>
                                </div>
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Activo</span>
                            </div>

                            {/* TikTok (Standard) */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-black text-white p-1.5 rounded-full"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.49-3.35-3.98-5.6-.54-2.44.4-5.03 2.39-6.73.16-.14.33-.27.5-.4.03-.02.06-.04.09-.06v4.03c-.2.15-.38.34-.52.55-.71 1.05-.72 2.45-.04 3.52.54.85 1.45 1.4 2.46 1.54 1.01.14 2.05-.12 2.87-.72.82-.6 1.33-1.52 1.39-2.53.04-1.53.01-3.07.01-4.61V.02z"/></svg></div>
                                    <span className="font-bold text-sm text-gray-900">TikTok</span>
                                </div>
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Activo</span>
                            </div>

                            {/* Wallapop Toggle */}
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#13C1AC] text-white p-1.5 rounded-full shadow-sm"><ShoppingBag className="w-4 h-4"/></div>
                                    <span className="font-bold text-sm text-gray-700">Wallapop</span>
                                </div>
                                <button 
                                    onClick={() => toggleIntegration('wallapop')}
                                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${integrations.wallapop ? 'bg-[#13C1AC]' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full shadow-sm ${integrations.wallapop ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Milanuncios Toggle */}
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#86B817] text-white p-1.5 rounded-full shadow-sm"><Layers className="w-4 h-4"/></div>
                                    <span className="font-bold text-sm text-gray-700">Milanuncios</span>
                                </div>
                                <button 
                                    onClick={() => toggleIntegration('milanuncios')}
                                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${integrations.milanuncios ? 'bg-[#86B817]' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full shadow-sm ${integrations.milanuncios ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end">
                            <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-rentia-black text-white rounded text-sm font-bold hover:bg-gray-800">Listo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
