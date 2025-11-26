
import React, { useState, useEffect } from 'react';
import { blogPosts, BlogPost } from '../data/blogData';
import { Clock, User, Tag, ArrowLeft, Calendar, ChevronRight, Search, Share2, BookOpen, List, ChevronUp } from 'lucide-react';

export const BlogView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [toc, setToc] = useState<{id: string, text: string, level: number}[]>([]);

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

  // Scroll to top & Generate TOC when entering a post
  useEffect(() => {
    window.scrollTo(0, 0);
    if (selectedPostId) {
      const post = blogPosts.find(p => p.id === selectedPostId);
      if (post) {
        // Simple regex to find h2 and h3 tags for TOC
        const regex = /<(h[23])>(.*?)<\/\1>/g;
        const matches = [];
        let match;
        while ((match = regex.exec(post.content)) !== null) {
            const level = parseInt(match[1].charAt(1));
            const text = match[2].replace(/<[^>]*>/g, ''); // Strip inner HTML if any
            const id = text.toLowerCase().replace(/[^\w]+/g, '-');
            matches.push({ id, text, level });
        }
        setToc(matches);
      }
    }
  }, [selectedPostId]);

  const categories = ['Todos', 'Inversión', 'Propietarios', 'Inquilinos', 'Tendencias'];

  const filteredPosts = blogPosts.filter(post => {
      const matchesCategory = selectedCategory === 'Todos' || post.category === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  const selectedPost = blogPosts.find(p => p.id === selectedPostId);

  const handlePostClick = (id: string) => {
    setSelectedPostId(id);
    window.location.hash = `#/blog?post=${id}`;
  };

  // Check hash for direct post linking
  useEffect(() => {
      const hash = window.location.hash;
      if (hash.includes('?post=')) {
          const id = hash.split('?post=')[1];
          if (id) setSelectedPostId(id);
      } else {
          setSelectedPostId(null);
      }
  }, []);

  // VIEW: SINGLE POST
  if (selectedPost) {
      return (
        <div className="bg-white min-h-screen font-sans animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-gray-100">
                <div 
                    className="h-full bg-rentia-blue transition-all duration-100 ease-out"
                    style={{ width: `${readingProgress}%` }}
                ></div>
            </div>

            {/* Header / Nav */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-4 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button 
                        onClick={() => {
                            setSelectedPostId(null);
                            window.location.hash = '#/blog';
                        }}
                        className="flex items-center text-gray-600 hover:text-rentia-blue transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Volver al Blog
                    </button>
                    <div className="text-sm text-gray-500 font-medium hidden sm:block">
                        {selectedPost.category}
                    </div>
                </div>
            </div>

            <article className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Title Section */}
                        <div className="mb-8">
                            <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
                                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5"/> {selectedPost.date}</span>
                                <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5"/> {selectedPost.readTime} min lectura</span>
                                <span className="flex items-center text-rentia-blue font-bold bg-blue-50 px-2 py-0.5 rounded"><Tag className="w-3 h-3 mr-1.5"/> {selectedPost.category}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-rentia-black font-display leading-tight mb-6">
                                {selectedPost.title}
                            </h1>
                            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-rentia-black text-white flex items-center justify-center font-bold text-lg mr-3">
                                    {selectedPost.author.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Escrito por {selectedPost.author}</p>
                                    <p className="text-xs text-gray-500">Equipo RentiaRoom</p>
                                </div>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="rounded-2xl overflow-hidden shadow-lg mb-10 aspect-video">
                            <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
                        </div>

                        {/* HTML Content */}
                        <div 
                            className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-rentia-blue prose-img:rounded-xl text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                        />

                        {/* Footer of Post */}
                        <div className="mt-12 pt-8 border-t border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">Etiquetas relacionadas:</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedPost.keywords.map(kw => (
                                    <span key={kw} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-default">
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Table of Contents */}
                        {toc.length > 0 && (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 sticky top-24">
                                <h3 className="font-bold text-rentia-black mb-4 flex items-center">
                                    <List className="w-5 h-5 mr-2 text-rentia-blue" />
                                    Contenido
                                </h3>
                                <ul className="space-y-3 text-sm">
                                    {toc.map((item, index) => (
                                        <li key={index} className={`${item.level === 3 ? 'pl-4' : ''}`}>
                                            <span className="text-gray-600 hover:text-rentia-blue cursor-pointer transition-colors block leading-snug">
                                                {item.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </article>
        </div>
      );
  }

  // VIEW: LIST OF POSTS
  return (
    <div className="bg-gray-50 min-h-screen font-sans animate-in fade-in duration-500">
        
        {/* Header Blog */}
        <section className="bg-rentia-black text-white py-20 relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full z-0">
                <img src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&q=80" alt="Blog RentiaRoom" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10 text-center">
                 <span className="inline-block px-3 py-1 rounded-full bg-rentia-blue text-white font-bold uppercase tracking-wider text-xs mb-4">
                    Actualidad & Consejos
                 </span>
                 <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">RentiaRoom Blog</h1>
                 <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light">
                     Guías de inversión, consejos para propietarios y tendencias del mercado inmobiliario en Murcia.
                 </p>
            </div>
        </section>

        {/* Filters */}
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Categories */}
                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                selectedCategory === cat 
                                ? 'bg-rentia-black text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <input 
                        type="text" 
                        placeholder="Buscar artículos..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue focus:border-transparent"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
            </div>
        </div>

        {/* Blog Grid */}
        <div className="container mx-auto px-4 pb-20">
            {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map(post => (
                        <div 
                            key={post.id}
                            onClick={() => handlePostClick(post.id)}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 flex flex-col h-full hover:-translate-y-1"
                        >
                            <div className="relative h-52 overflow-hidden">
                                <img 
                                    src={post.image} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-rentia-black">
                                    {post.category}
                                </div>
                            </div>
                            
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex items-center text-xs text-gray-400 mb-3 space-x-3">
                                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {post.date}</span>
                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {post.readTime} min</span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-rentia-black font-display mb-3 group-hover:text-rentia-blue transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                
                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow">
                                    {post.excerpt}
                                </p>
                                
                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-sm font-bold text-rentia-blue">
                                    <span>Leer artículo</span>
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-rentia-blue group-hover:text-white transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-600">No se encontraron artículos</h3>
                    <p className="text-gray-500">Prueba con otra categoría o término de búsqueda.</p>
                </div>
            )}
        </div>
    </div>
  );
};
