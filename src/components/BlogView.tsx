"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { blogPosts as staticPosts, BlogPost } from '../data/blogData';
import { Clock, Calendar, ChevronRight, Search, List, ArrowLeft, Tag, TrendingUp, KeyRound, Users, Zap, FileText, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfig } from '../contexts/ConfigContext'; // NEW
import { MaintenanceOverlay } from './common/MaintenanceOverlay'; // NEW

import { useRouter, useSearchParams } from 'next/navigation';

export const BlogView: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>(staticPosts);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [readingProgress, setReadingProgress] = useState(0);
    const [toc, setToc] = useState<{ id: string, text: string, level: number }[]>([]);
    const [heroLoaded, setHeroLoaded] = useState(false);
    const { language, t } = useLanguage();
    const config = useConfig(); // NEW
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPostId = searchParams.get('post');

    // Initialize selectedPostId from URL if present
    useEffect(() => {
        if (initialPostId) {
            setSelectedPostId(initialPostId);
        } else {
            setSelectedPostId(null);
        }
    }, [initialPostId]);

    // Load Firestore posts and merge
    useEffect(() => {
        const q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const firestorePosts: BlogPost[] = [];
            snapshot.forEach((doc) => {
                firestorePosts.push({ ...doc.data(), id: doc.id } as BlogPost);
            });

            // Merge: Priority to Firestore, then remaining static
            // Assuming unique IDs. If duplicate ID, Firestore wins.
            const dbIds = new Set(firestorePosts.map(p => p.id));
            const combined = [...firestorePosts, ...staticPosts.filter(p => !dbIds.has(p.id))];

            setPosts(combined);
        });
        return () => unsubscribe();
    }, []);

    // Scroll handler for progress bar
    const handleScroll = () => {
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
    };

    useEffect(() => {
        if (selectedPostId) {
            window.addEventListener('scroll', handleScroll);
        }
        return () => window.removeEventListener('scroll', handleScroll);
    }, [selectedPostId]);

    const selectedPost = posts.find(p => p.id === selectedPostId);

    // --- SEO INJECTION: BlogPosting Schema ---
    useEffect(() => {
        if (selectedPost) {
            const blogSchema = {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": selectedPost.title[language],
                // Image removed from schema visually, but kept in data if needed for SEO metadata
                "image": [selectedPost.image],
                "author": {
                    "@type": "Organization",
                    "name": "RentiaRoom",
                    "url": "https://www.rentiaroom.com"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "RentiaRoom",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://i.ibb.co/QvzK6db3/Logo-Negativo.png"
                    }
                },
                "datePublished": "2025-05-22",
                "description": selectedPost.excerpt[language],
                "articleBody": selectedPost.content[language].replace(/<[^>]*>?/gm, ''), // Strip HTML for schema
                "keywords": selectedPost.keywords.join(", ")
            };

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify(blogSchema);
            document.head.appendChild(script);

            return () => {
                document.head.removeChild(script);
            };
        }
    }, [selectedPost, language]);

    // Scroll to top & Generate TOC when entering a post
    useEffect(() => {
        window.scrollTo(0, 0);
        if (selectedPostId) {
            const post = posts.find(p => p.id === selectedPostId);
            if (post) {
                // Simple regex to find h2 and h3 tags for TOC
                const content = post.content[language];
                const regex = /<(h[23])>(.*?)<\/\1>/g;
                const matches = [];
                let match;
                while ((match = regex.exec(content)) !== null) {
                    const level = parseInt(match[1].charAt(1));
                    const text = match[2].replace(/<[^>]*>/g, ''); // Strip inner HTML if any
                    const id = text.toLowerCase().replace(/[^\w]+/g, '-');
                    matches.push({ id, text, level });
                }
                setToc(matches);
            }
        }
    }, [selectedPostId, language, posts]);

    const categories = language === 'es'
        ? ['Todos', 'Inversión', 'Propietarios', 'Inquilinos', 'Tendencias']
        : ['All', 'Investment', 'Owners', 'Tenants', 'Trends'];

    const filteredPosts = posts.filter(post => {
        // Logic: Compare the localized category with the selected one
        // If 'Todos' or 'All' is selected, show everything
        const isAll = selectedCategory === 'Todos' || selectedCategory === 'All';
        const matchesCategory = isAll || post.category[language] === selectedCategory;

        const title = (post.title[language] || '').toLowerCase();
        const excerpt = (post.excerpt[language] || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        const matchesSearch = title.includes(search) || excerpt.includes(search);
        return matchesCategory && matchesSearch;
    });

    // Reset category on language change to avoid filtering issues
    useEffect(() => {
        setSelectedCategory(language === 'es' ? 'Todos' : 'All');
    }, [language]);

    const handlePostClick = (id: string) => {
        setSelectedPostId(id);
        router.push(`/blog?post=${id}`);
        window.scrollTo(0, 0);
    };

    // Check hash for direct post linking
    // Check hash for direct post linking - REMOVED/REPLACED by searchParams effect
    // useEffect removed as handled above by searchParams dependency


    // Helper to get icon by category (checking both languages)
    const getCategoryIcon = (category: string): React.ReactElement<{ className?: string }> => {
        if (category === 'Inversión' || category === 'Investment') return <TrendingUp className="w-5 h-5" />;
        if (category === 'Propietarios' || category === 'Owners') return <KeyRound className="w-5 h-5" />;
        if (category === 'Inquilinos' || category === 'Tenants') return <Users className="w-5 h-5" />;
        if (category === 'Tendencias' || category === 'Trends') return <Zap className="w-5 h-5" />;
        return <FileText className="w-5 h-5" />;
    };

    const getCategoryColor = (category: string) => {
        if (category === 'Inversión' || category === 'Investment') return 'text-green-600 bg-green-50 border-green-100';
        if (category === 'Propietarios' || category === 'Owners') return 'text-blue-600 bg-blue-50 border-blue-100';
        if (category === 'Inquilinos' || category === 'Tenants') return 'text-purple-600 bg-purple-50 border-purple-100';
        if (category === 'Tendencias' || category === 'Trends') return 'text-orange-600 bg-orange-50 border-orange-100';
        return 'text-gray-600 bg-gray-50 border-gray-100';
    };

    // WRAP WHOLE COMPONENT OR MAIN CONTENT WITH OVERLAY
    return (
        <MaintenanceOverlay isActive={config.modules.maintenanceBlog} title={language === 'es' ? "Blog en Mantenimiento" : "Blog Under Maintenance"}>
            <div className="bg-white min-h-screen font-sans animate-in fade-in duration-500 relative">
                {selectedPost ? (
                    // SINGLE POST VIEW
                    <>
                        <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-gray-100">
                            <div
                                className="h-full bg-rentia-blue transition-all duration-100 ease-out"
                                style={{ width: `${readingProgress}%` }}
                            ></div>
                        </div>
                        {/* Header / Nav */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 px-4 py-4">
                            <div className="max-w-7xl mx-auto flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        setSelectedPostId(null);
                                        router.push('/blog');
                                    }}
                                    className="flex items-center text-gray-600 hover:text-rentia-blue transition-colors font-medium text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {language === 'es' ? 'Volver al Blog' : 'Back to Blog'}
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${getCategoryColor(selectedPost.category[language])}`}>
                                        {selectedPost.category[language]}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <article className="max-w-7xl mx-auto px-4 py-8 lg:py-16">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-8">
                                    <div className="mb-8 border-b border-gray-100 pb-8">
                                        <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500">
                                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {selectedPost.date[language]}</span>
                                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {selectedPost.readTime} min {language === 'es' ? 'lectura' : 'read'}</span>
                                        </div>
                                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-rentia-black font-display leading-tight mb-8">
                                            {selectedPost.title[language]}
                                        </h1>
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-rentia-black text-white flex items-center justify-center font-bold text-xl mr-4 shadow-sm">
                                                {(selectedPost.author || 'R').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{selectedPost.author || 'Rentia Team'}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">RentiaRoom Team</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-rentia-blue prose-blockquote:border-rentia-blue prose-blockquote:bg-gray-50 prose-blockquote:p-4 prose-blockquote:rounded-r-lg text-gray-700 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: selectedPost.content[language] }}
                                    />

                                    <div className="mt-12 pt-8 border-t border-gray-200">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Tag className="w-4 h-4" /> {language === 'es' ? 'Temas relacionados:' : 'Related topics:'}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPost.keywords.map(kw => (
                                                <span key={kw} className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-default">
                                                    #{kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 space-y-8">
                                    {toc.length > 0 && (
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 sticky top-24">
                                            <h3 className="font-bold text-rentia-black mb-6 flex items-center border-b border-gray-200 pb-3">
                                                <List className="w-5 h-5 mr-2 text-rentia-blue" />
                                                {language === 'es' ? 'Tabla de Contenidos' : 'Table of Contents'}
                                            </h3>
                                            <ul className="space-y-4 text-sm relative border-l border-gray-200 ml-2">
                                                {toc.map((item, index) => (
                                                    <li key={index} className={`relative pl-4 ${item.level === 3 ? 'ml-4' : ''}`}>
                                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300"></div>
                                                        <a
                                                            href={`#${item.id}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const element = document.getElementById(item.id);
                                                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                                                            }}
                                                            className="text-gray-600 hover:text-rentia-blue cursor-pointer transition-colors block leading-snug hover:font-medium"
                                                        >
                                                            {item.text}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="bg-rentia-blue p-6 rounded-2xl text-white shadow-lg">
                                        <h4 className="font-bold text-lg mb-2">{language === 'es' ? '¿Te gusta lo que lees?' : 'Enjoying the read?'}</h4>
                                        <p className="text-blue-100 text-sm mb-4">{language === 'es' ? 'Únete a nuestro canal de WhatsApp para no perderte ningún análisis.' : 'Join our WhatsApp channel to never miss an analysis.'}</p>
                                        <a
                                            href="https://whatsapp.com/channel/0029VbBsvhOIt5rpshbpYN1P"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block w-full text-center bg-white text-rentia-blue font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            {language === 'es' ? 'Unirme al Canal' : 'Join Channel'}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </>
                ) : (
                    // LIST VIEW
                    <>
                        <section className="relative py-24 bg-rentia-black overflow-hidden">
                            <div className="absolute inset-0 w-full h-full z-0">
                                {!heroLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                                        <Loader2 className="w-12 h-12 animate-spin text-white/20" />
                                    </div>
                                )}
                                <img
                                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80"
                                    alt="RentiaRoom Blog"
                                    className={`w-full h-full object-cover transition-opacity duration-700 ${heroLoaded ? 'opacity-40' : 'opacity-0'}`}
                                    onLoad={() => setHeroLoaded(true)}
                                />
                                <div className="absolute inset-0 bg-rentia-blue/80 mix-blend-multiply pointer-events-none"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-rentia-black/90 via-transparent to-transparent pointer-events-none"></div>
                            </div>

                            <div className="relative z-10 container mx-auto px-4 text-center text-white">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-rentia-gold font-bold uppercase tracking-wider text-xs mb-6">
                                    {language === 'es' ? 'Actualidad & Consejos' : 'News & Advice'}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight drop-shadow-md">RentiaRoom Blog</h1>
                                <p className="text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-sm">
                                    {language === 'es'
                                        ? 'Guías de inversión, consejos para propietarios y tendencias del mercado inmobiliario en Murcia.'
                                        : 'Investment guides, advice for owners, and real estate market trends in Murcia.'}
                                </p>
                            </div>
                        </section>

                        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 py-4">
                            <div className="container mx-auto px-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto no-scrollbar mask-linear-fade">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${selectedCategory === cat
                                                    ? 'bg-rentia-black text-white border-rentia-black'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative w-full md:w-72">
                                        <input
                                            type="text"
                                            placeholder={language === 'es' ? "Buscar artículos..." : "Search articles..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                                        />
                                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="container mx-auto px-4 py-12 pb-20 bg-gray-50 min-h-[60vh]">
                            {filteredPosts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredPosts.map(post => {
                                        const currentTitle = post.title[language] || post.title.es;
                                        const currentExcerpt = post.excerpt[language] || post.excerpt.es;
                                        const currentCategory = post.category[language] || post.category.es;
                                        const currentDate = post.date[language] || post.date.es;

                                        return (
                                            <div
                                                key={post.id}
                                                onClick={() => handlePostClick(post.id)}
                                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 flex flex-col h-full hover:-translate-y-1"
                                            >
                                                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white relative overflow-hidden">
                                                    <div className="absolute -right-4 -bottom-6 text-gray-50 transform rotate-12 group-hover:text-gray-100 transition-colors duration-500">
                                                        {getCategoryIcon(currentCategory) && React.cloneElement(getCategoryIcon(currentCategory), { className: "w-24 h-24 opacity-50" })}
                                                    </div>

                                                    <div className={`z-10 px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 ${getCategoryColor(currentCategory)}`}>
                                                        {getCategoryIcon(currentCategory)}
                                                        {currentCategory}
                                                    </div>
                                                    <div className="z-10 text-xs text-gray-400 font-mono">
                                                        {post.readTime} min
                                                    </div>
                                                </div>

                                                <div className="p-6 flex flex-col flex-grow relative z-10">
                                                    <h3 className="text-xl font-bold text-rentia-black font-display mb-3 group-hover:text-rentia-blue transition-colors line-clamp-3 leading-tight">
                                                        {currentTitle}
                                                    </h3>

                                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 mb-6 flex-grow">
                                                        {currentExcerpt}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                        <div className="flex items-center text-xs text-gray-400">
                                                            <Calendar className="w-3 h-3 mr-1.5" /> {currentDate}
                                                        </div>
                                                        <span className="text-sm font-bold text-rentia-blue flex items-center group-hover:translate-x-1 transition-transform">
                                                            {language === 'es' ? 'Leer más' : 'Read more'} <ChevronRight className="w-4 h-4 ml-1" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <Search className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-600 mb-2">{language === 'es' ? 'No se encontraron artículos' : 'No articles found'}</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">{language === 'es' ? 'Prueba a buscar con otros términos o cambia la categoría.' : 'Try searching with different terms or change the category.'}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </MaintenanceOverlay>
    );
};
