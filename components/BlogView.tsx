
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
                        onClick={() => setSelectedPostId(null)}
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
                            <h3 className="font-bold text-gray-900 mb-4">Temas relacionados:</h3>
                            <div className="flex flex