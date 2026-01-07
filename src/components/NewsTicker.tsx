
import React, { useState, useEffect } from 'react';
import { newsDatabase, NewsItem } from '../data/newsData';
import { TrendingUp, Info, AlertCircle, LineChart, X, Calendar, Share2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const NewsTicker: React.FC = () => {
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [activeModalItem, setActiveModalItem] = useState<NewsItem | null>(null);
  const { language, t } = useLanguage();

  // Lógica de Selección de Noticias basada en el Tiempo
  useEffect(() => {
    const selectNews = () => {
      const now = new Date();
      
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      const dailyPool = [...newsDatabase].sort((a, b) => {
        const idA = a.id.charCodeAt(1);
        const idB = b.id.charCodeAt(1);
        return ((idA * dayOfYear) % 100) - ((idB * dayOfYear) % 100);
      });

      const todaysBatch = dailyPool.slice(0, 5);
      const hourBlock = Math.floor(now.getHours() / 2);
      const newsIndex = hourBlock % todaysBatch.length;

      setCurrentNews(todaysBatch[newsIndex]);
    };

    selectNews();
    const interval = setInterval(selectNews, 60000); 
    return () => clearInterval(interval);
  }, []);

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (activeModalItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeModalItem]);

  if (!currentNews || !isVisible) return null;

  const getIcon = (category: string) => {
    switch(category) {
      case 'Mercado': return <TrendingUp className="w-4 h-4" />;
      case 'Regulación': return <AlertCircle className="w-4 h-4" />;
      case 'Inversión': return <LineChart className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Mercado': return 'bg-blue-100 text-rentia-blue border-blue-200';
      case 'Regulación': return 'bg-red-100 text-red-700 border-red-200';
      case 'Inversión': return 'bg-green-100 text-green-700 border-green-200';
      case 'Tendencia': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Helper para traducir categorías
  const translateCategory = (cat: string) => {
    if (language === 'es') return cat;
    switch(cat) {
        case 'Mercado': return 'Market';
        case 'Regulación': return 'Regulation';
        case 'Inversión': return 'Investment';
        case 'Tendencia': return 'Trend';
        case 'Consejo': return 'Advice';
        default: return cat;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(language === 'es' ? 'Enlace copiado al portapapeles' : 'Link copied to clipboard');
  };

  return (
    <>
      {/* BARRA TICKER */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-stretch">
            
            {/* Label "LIVE" pulsante */}
            <div className="flex items-center px-4 py-3 bg-rentia-black text-white text-xs font-bold uppercase tracking-wider flex-shrink-0">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="hidden sm:inline">{language === 'es' ? 'Mercado' : 'Market'}</span>
              <span className="sm:hidden">Info</span>
            </div>

            {/* Contenido Noticia (Clickable) */}
            <div 
              className="flex-1 flex items-center px-4 py-2 overflow-hidden bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors group"
              onClick={() => setActiveModalItem(currentNews)}
              title={language === 'es' ? "Leer noticia completa" : "Read full story"}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 w-full animate-in fade-in slide-in-from-right-2 duration-500" key={currentNews.id + language}>
                
                {/* Categoría Badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide w-fit flex-shrink-0 border ${getCategoryColor(currentNews.category)}`}>
                  {getIcon(currentNews.category)}
                  {translateCategory(currentNews.category)}
                </span>

                {/* Titular Traducido */}
                <p className="text-xs sm:text-sm font-medium text-rentia-black leading-snug line-clamp-2 sm:line-clamp-1 flex-grow group-hover:text-rentia-blue transition-colors">
                  {currentNews.headline[language]}
                </p>

                {/* Fuente & Hint */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-400 whitespace-nowrap hidden sm:block">
                        {language === 'es' ? 'Fuente:' : 'Source:'} {currentNews.source}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-rentia-blue transform group-hover:translate-x-1 transition-all hidden sm:block" />
                </div>
              </div>
            </div>

            {/* Botón cerrar ticker */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
              className="px-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border-l border-gray-100"
              aria-label="Ocultar noticias"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE NOTICIA */}
      {activeModalItem && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-rentia-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={() => setActiveModalItem(null)}></div>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-gray-200">
                
                {/* Header Modal */}
                <div className="p-6 pb-0 flex justify-between items-start">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getCategoryColor(activeModalItem.category)}`}>
                        {getIcon(activeModalItem.category)}
                        {translateCategory(activeModalItem.category)}
                    </div>
                    <button 
                        onClick={() => setActiveModalItem(null)}
                        className="text-gray-400 hover:text-rentia-black hover:bg-gray-100 rounded-full p-2 transition-colors -mr-2 -mt-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido Modal */}
                <div className="p-6 overflow-y-auto">
                    <h2 className="text-xl md:text-2xl font-bold font-display text-rentia-black leading-tight mb-4">
                        {activeModalItem.headline[language]}
                    </h2>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-6 pb-6 border-b border-gray-100">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {activeModalItem.date || (language === 'es' ? 'Hoy' : 'Today')}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="font-medium text-rentia-blue uppercase tracking-wide">
                            {activeModalItem.source}
                        </span>
                    </div>

                    <div className="text-gray-700 leading-relaxed text-sm md:text-base space-y-4">
                        {activeModalItem.body[language] ? (
                            <p>{activeModalItem.body[language]}</p>
                        ) : (
                            <p className="italic text-gray-400">
                                {language === 'es' 
                                    ? 'Contenido detallado no disponible en este momento.' 
                                    : 'Detailed content not available at this moment.'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <button 
                        onClick={handleCopyLink}
                        className="text-gray-500 hover:text-rentia-blue text-xs font-bold flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        {language === 'es' ? 'Compartir' : 'Share'}
                    </button>
                    <button 
                        onClick={() => setActiveModalItem(null)}
                        className="bg-rentia-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-md"
                    >
                        {language === 'es' ? 'Cerrar noticia' : 'Close story'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
