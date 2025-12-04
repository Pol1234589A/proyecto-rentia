
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Megaphone, Trash2, Plus, AlertCircle, Info, CheckCircle, Save, Loader2 } from 'lucide-react';
import { InternalNews } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const NewsManager: React.FC = () => {
    const { currentUser } = useAuth();
    const [news, setNews] = useState<InternalNews[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<'Alta' | 'Normal' | 'Info'>('Normal');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "internal_news"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: InternalNews[] = [];
            snapshot.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as InternalNews);
            });
            setNews(list);
        });
        return () => unsubscribe();
    }, []);

    const handleAddNews = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "internal_news"), {
                title,
                content,
                priority,
                author: currentUser?.displayName || 'Admin',
                active: true,
                createdAt: serverTimestamp()
            });
            setTitle('');
            setContent('');
            setPriority('Normal');
        } catch (error) {
            console.error(error);
            alert("Error al publicar la noticia");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de borrar esta noticia? Desaparecerá para todos los empleados.")) {
            await deleteDoc(doc(db, "internal_news", id));
        }
    };

    const getPriorityStyle = (p: string) => {
        switch(p) {
            case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
            case 'Normal': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-rentia-blue" />
                    Tablón de Anuncios Interno
                </h3>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <Info className="w-3 h-3 inline mr-1"/>
                            Las noticias publicadas aquí aparecerán destacadas en el panel principal de todos los trabajadores.
                        </p>
                    </div>

                    <form onSubmit={handleAddNews} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none"
                                placeholder="Ej: Reunión general viernes"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                            <select 
                                value={priority} 
                                onChange={e => setPriority(e.target.value as any)} 
                                className="w-full p-2 border rounded-lg text-sm bg-white"
                            >
                                <option value="Alta">Alta (Rojo - Urgente)</option>
                                <option value="Normal">Normal (Azul)</option>
                                <option value="Info">Informativo (Gris)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contenido</label>
                            <textarea 
                                value={content} 
                                onChange={e => setContent(e.target.value)} 
                                className="w-full p-2 border rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-rentia-blue outline-none"
                                placeholder="Detalles del anuncio..."
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-rentia-black text-white py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                            Publicar Noticia
                        </button>
                    </form>
                </div>

                {/* Lista de Noticias */}
                <div className="lg:col-span-2 overflow-y-auto max-h-[600px] space-y-3">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Noticias Activas</h4>
                    
                    {news.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                            No hay noticias publicadas.
                        </div>
                    ) : (
                        news.map(item => (
                            <div key={item.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityStyle(item.priority)}`}>
                                        {item.priority}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {item.createdAt?.toDate().toLocaleDateString()}
                                    </span>
                                </div>
                                <h5 className="font-bold text-gray-800 mb-1">{item.title}</h5>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.content}</p>
                                <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-xs text-gray-400 italic">Por: {item.author}</span>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                        title="Eliminar noticia"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
