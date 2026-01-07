
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { BlogPost } from '../../data/blogData';
import { Save, Trash2, Plus, Image as ImageIcon, Video, Type, Layout, Eye, Calendar, Clock, ChevronLeft, ArrowRight, Edit3 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

// Extendemos la interfaz para incluir ID opcional para nuevos posts
interface EditableBlogPost extends Omit<BlogPost, 'id'> {
    id?: string;
}

const initialPost: EditableBlogPost = {
    title: { es: '', en: '' },
    slug: { es: '', en: '' },
    excerpt: { es: '', en: '' },
    content: { es: '', en: '' },
    category: { es: 'Inversión', en: 'Investment' },
    author: 'Rentia Team',
    date: { es: new Date().toLocaleDateString(), en: new Date().toLocaleDateString() },
    readTime: 5,
    image: '',
    keywords: []
};

export const BlogManager: React.FC = () => {
    const [posts, setPosts] = useState<EditableBlogPost[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<EditableBlogPost>(initialPost);
    const [activeLang, setActiveLang] = useState<'es' | 'en'>('es');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts: EditableBlogPost[] = [];
            snapshot.forEach((doc) => {
                fetchedPosts.push({ ...doc.data(), id: doc.id } as EditableBlogPost);
            });
            setPosts(fetchedPosts);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!currentPost.title.es || !currentPost.content.es) return alert("Título y contenido en Español son obligatorios");
        
        setLoading(true);
        try {
            const postData = {
                ...currentPost,
                createdAt: serverTimestamp(),
                // Generar slugs automáticos si están vacíos
                slug: {
                    es: currentPost.slug.es || currentPost.title.es.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                    en: currentPost.slug.en || currentPost.title.en.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
                }
            };

            if (currentPost.id) {
                const { id, ...data } = postData;
                await updateDoc(doc(db, "blog_posts", currentPost.id), data);
            } else {
                await addDoc(collection(db, "blog_posts"), postData);
            }
            setIsEditing(false);
            setCurrentPost(initialPost);
        } catch (error) {
            console.error(error);
            alert("Error al guardar el artículo");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar este artículo permanentemente?")) {
            await deleteDoc(doc(db, "blog_posts", id));
        }
    };

    const insertTag = (tag: string) => {
        const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = currentPost.content[activeLang];
        const before = text.substring(0, start);
        const after = text.substring(end);
        
        let newText = '';
        
        if (tag === 'img') {
            const url = prompt("URL de la imagen:");
            if(url) newText = `${before}<img src="${url}" class="w-full rounded-xl my-4 shadow-md" />${after}`;
            else return;
        } else if (tag === 'video') {
            const url = prompt("URL del video (mp4):");
            if(url) newText = `${before}<video controls src="${url}" class="w-full rounded-xl my-4 shadow-md"></video>${after}`;
            else return;
        } else if (tag === 'h2') {
             newText = `${before}<h2>Subtítulo aquí</h2>${after}`;
        } else if (tag === 'b') {
             newText = `${before}<strong>Texto en negrita</strong>${after}`;
        }

        setCurrentPost({
            ...currentPost,
            content: {
                ...currentPost.content,
                [activeLang]: newText
            }
        });
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-rentia-blue" /> Gestor de Blog & Noticias
                </h2>
                {!isEditing ? (
                    <button onClick={() => { setCurrentPost(initialPost); setIsEditing(true); }} className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800">
                        <Plus className="w-4 h-4" /> Nuevo Artículo
                    </button>
                ) : (
                    <div className="flex gap-2">
                         <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-500 font-bold hover:text-gray-800">Cancelar</button>
                         <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 shadow-md">
                            <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Publicar'}
                         </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden">
                {!isEditing ? (
                    // LIST VIEW
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-all">
                                <div className="h-40 bg-gray-100 relative">
                                    {post.image ? (
                                        <img src={post.image} className="w-full h-full object-cover" alt="cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon className="w-8 h-8"/></div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setCurrentPost(post); setIsEditing(true); }} className="p-2 bg-white rounded-full shadow hover:text-blue-600"><Edit3 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(post.id!)} className="p-2 bg-white rounded-full shadow hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <span className="text-[10px] font-bold uppercase text-rentia-blue bg-blue-50 px-2 py-0.5 rounded">{post.category.es}</span>
                                    <h3 className="font-bold text-gray-800 mt-2 line-clamp-2 leading-tight">{post.title.es}</h3>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-3">{post.excerpt.es}</p>
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-[10px] text-gray-400">
                                        <span>{post.date.es}</span>
                                        <span>{post.readTime} min</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {posts.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-400">
                                <Layout className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                                <p>No hay artículos publicados.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // EDITOR VIEW (Split Screen)
                    <div className="flex h-full">
                        {/* Editor Panel (Left) */}
                        <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col h-full">
                            
                            {/* Lang Tabs & Tools */}
                            <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
                                <div className="flex bg-white rounded-lg border p-1">
                                    <button onClick={() => setActiveLang('es')} className={`px-3 py-1 rounded text-xs font-bold ${activeLang === 'es' ? 'bg-rentia-black text-white' : 'text-gray-500'}`}>Español</button>
                                    <button onClick={() => setActiveLang('en')} className={`px-3 py-1 rounded text-xs font-bold ${activeLang === 'en' ? 'bg-rentia-black text-white' : 'text-gray-500'}`}>English</button>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => insertTag('b')} className="p-1.5 hover:bg-gray-200 rounded" title="Negrita"><Type className="w-4 h-4"/></button>
                                    <button onClick={() => insertTag('h2')} className="p-1.5 hover:bg-gray-200 rounded font-bold text-xs" title="Subtítulo">H2</button>
                                    <button onClick={() => insertTag('img')} className="p-1.5 hover:bg-gray-200 rounded" title="Imagen URL"><ImageIcon className="w-4 h-4"/></button>
                                    <button onClick={() => insertTag('video')} className="p-1.5 hover:bg-gray-200 rounded" title="Video URL"><Video className="w-4 h-4"/></button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título ({activeLang.toUpperCase()})</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border rounded-xl font-bold text-lg focus:ring-2 focus:ring-rentia-blue outline-none"
                                        value={currentPost.title[activeLang]}
                                        onChange={e => setCurrentPost({...currentPost, title: {...currentPost.title, [activeLang]: e.target.value}})}
                                        placeholder="Escribe el título aquí..."
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resumen Corto ({activeLang.toUpperCase()})</label>
                                    <textarea 
                                        className="w-full p-3 border rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-rentia-blue outline-none"
                                        value={currentPost.excerpt[activeLang]}
                                        onChange={e => setCurrentPost({...currentPost, excerpt: {...currentPost.excerpt, [activeLang]: e.target.value}})}
                                        placeholder="Breve descripción para la tarjeta..."
                                    />
                                </div>

                                <div className="flex-grow flex flex-col">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contenido del Artículo (HTML/Texto)</label>
                                    <textarea 
                                        id="content-editor"
                                        className="w-full p-4 border rounded-xl text-sm font-mono leading-relaxed focus:ring-2 focus:ring-rentia-blue outline-none flex-grow min-h-[400px]"
                                        value={currentPost.content[activeLang]}
                                        onChange={e => setCurrentPost({...currentPost, content: {...currentPost.content, [activeLang]: e.target.value}})}
                                        placeholder="Escribe tu artículo. Usa los botones de arriba para insertar elementos."
                                    />
                                </div>

                                {/* Metadata Section (Shared) */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                        <select 
                                            className="w-full p-2 border rounded bg-white text-sm"
                                            value={currentPost.category.es}
                                            onChange={(e) => {
                                                const catEs = e.target.value as any;
                                                const catEn = catEs === 'Inversión' ? 'Investment' : catEs === 'Propietarios' ? 'Owners' : catEs === 'Inquilinos' ? 'Tenants' : 'Trends';
                                                setCurrentPost({...currentPost, category: { es: catEs, en: catEn }});
                                            }}
                                        >
                                            <option value="Inversión">Inversión</option>
                                            <option value="Propietarios">Propietarios</option>
                                            <option value="Inquilinos">Inquilinos</option>
                                            <option value="Tendencias">Tendencias</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Autor</label>
                                        <input type="text" className="w-full p-2 border rounded text-sm" value={currentPost.author} onChange={e => setCurrentPost({...currentPost, author: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen Portada</label>
                                        <ImageUploader 
                                            folder="blog_covers" 
                                            label="Subir Portada" 
                                            onUploadComplete={(url) => setCurrentPost({...currentPost, image: url})} 
                                            compact={false}
                                            onlyFirebase={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Panel (Right - "Canva" Style) */}
                        <div className="w-1/2 bg-gray-100 p-8 overflow-y-auto flex flex-col items-center">
                             <div className="mb-4 flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                 <Eye className="w-4 h-4"/> Vista Previa en Vivo
                             </div>
                             
                             <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden min-h-[800px] flex flex-col">
                                {/* Fake Browser Header */}
                                <div className="bg-gray-50 border-b p-3 flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>

                                {/* Article Preview */}
                                <div className="relative">
                                    <div className="h-64 bg-gray-200 relative overflow-hidden">
                                        {currentPost.image ? (
                                            <img src={currentPost.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">Sin Imagen de Portada</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-6 left-6 right-6 text-white">
                                             <span className="inline-block px-2 py-1 bg-rentia-blue text-white text-xs font-bold rounded mb-2 uppercase">{currentPost.category[activeLang]}</span>
                                             <h1 className="text-3xl font-bold font-display leading-tight">{currentPost.title[activeLang] || 'Título del Artículo'}</h1>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 md:p-12">
                                     <div className="flex items-center gap-4 mb-8 pb-8 border-b text-sm text-gray-500">
                                         <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {currentPost.date[activeLang]}</span>
                                         <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {currentPost.readTime} min read</span>
                                         <span className="font-bold text-gray-900">By {currentPost.author}</span>
                                     </div>

                                     <div 
                                        className="prose prose-lg max-w-none prose-headings:font-display prose-a:text-rentia-blue prose-img:rounded-xl prose-img:shadow-lg text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: currentPost.content[activeLang] || '<p class="text-gray-400 italic">Empieza a escribir para ver el resultado...</p>' }}
                                     />

                                     <div className="mt-12 pt-8 border-t">
                                         <h4 className="font-bold text-gray-900 mb-4">Temas Relacionados</h4>
                                         <div className="flex gap-2">
                                             <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">Inversión</span>
                                             <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">Murcia</span>
                                         </div>
                                     </div>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
