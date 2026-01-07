
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, User, Briefcase, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfig } from '../contexts/ConfigContext';

export const WhatsAppButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const { t } = useLanguage();
  const config = useConfig();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getStatus = (startHour: number, endHour: number) => {
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();

    // Check if weekend
    if (day === 0 || day === 6) {
      return { isOpen: false, label: t('common.closed_weekend') };
    }

    // Check hours
    if (hour >= startHour && hour < endHour) {
      return { isOpen: true, label: t('common.online') };
    }

    return { isOpen: false, label: `${t('whatsapp.opens_at')} ${String(startHour).padStart(2, '0')}:00` };
  };

  const adminStatus = getStatus(config.adminContact.startHour, config.adminContact.endHour);
  const directorStatus = getStatus(config.directorContact.startHour, config.directorContact.endHour);

  return (
    // CRITICAL FIX: pointer-events-none on parent ensures the invisible wrapper 
    // doesn't block underlying clicks (footer links, etc) on mobile/desktop.
    // ADDED: hidden md:flex to hide on mobile devices
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 print:hidden flex-col items-end pointer-events-none">
      
      {/* Menu Popup */}
      <div 
        className={`mb-4 flex flex-col gap-3 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Admin Button */}
        <a 
          href={`https://api.whatsapp.com/send?phone=${config.adminContact.phone}&text=${encodeURIComponent(config.adminContact.whatsappMessage)}`}
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-3 p-4 rounded-xl shadow-xl border-2 transition-all w-72 group relative overflow-hidden touch-manipulation cursor-pointer ${
              adminStatus.isOpen 
              ? 'bg-white border-green-500 hover:bg-green-50' 
              : 'bg-white border-gray-200 hover:bg-gray-50 grayscale-[0.5] hover:grayscale-0'
          }`}
        >
           <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors overflow-hidden ${
               adminStatus.isOpen ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
           }`}>
              {config.adminContact.image ? <img src={config.adminContact.image} alt={config.adminContact.name} className="w-full h-full object-cover" /> : <User className="w-6 h-6" />}
              {adminStatus.isOpen && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
           </div>
           <div className="flex flex-col flex-grow">
              <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-rentia-black">{config.adminContact.name} ({config.adminContact.role.split(' ')[0]})</span>
              </div>
              <span className="text-xs text-gray-500 mb-1">{t('whatsapp.admin_desc')}</span>
              
              <div className={`flex items-center text-[10px] font-bold uppercase tracking-wide ${adminStatus.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                 {adminStatus.isOpen ? (
                    <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        {t('whatsapp.online')} ({String(config.adminContact.startHour).padStart(2, '0')}:00 - {String(config.adminContact.endHour).padStart(2, '0')}:00)
                    </>
                 ) : (
                    <>
                        <Clock className="w-3 h-3 mr-1" />
                        {adminStatus.label}
                    </>
                 )}
              </div>
           </div>
        </a>

        {/* Director Button */}
        <a 
          href={`https://api.whatsapp.com/send?phone=${config.directorContact.phone}&text=${encodeURIComponent(config.directorContact.whatsappMessage)}`}
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-3 p-4 rounded-xl shadow-xl border-2 transition-all w-72 group relative overflow-hidden touch-manipulation cursor-pointer ${
            directorStatus.isOpen 
            ? 'bg-white border-green-500 hover:bg-green-50' 
            : 'bg-white border-gray-200 hover:bg-gray-50 grayscale-[0.5] hover:grayscale-0'
        }`}
        >
           <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors overflow-hidden ${
               directorStatus.isOpen ? 'bg-blue-100 text-rentia-blue' : 'bg-gray-100 text-gray-500'
           }`}>
              {config.directorContact.image ? <img src={config.directorContact.image} alt={config.directorContact.name} className="w-full h-full object-cover" /> : <Briefcase className="w-6 h-6" />}
               {directorStatus.isOpen && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
           </div>
           <div className="flex flex-col flex-grow">
              <span className="font-bold text-sm text-rentia-black">{config.directorContact.name} ({config.directorContact.role.split(' ')[0]})</span>
              <span className="text-xs text-gray-500 mb-1">{t('whatsapp.dir_desc')}</span>
               <div className={`flex items-center text-[10px] font-bold uppercase tracking-wide ${directorStatus.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                 {directorStatus.isOpen ? (
                    <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        {t('whatsapp.online')} ({String(config.directorContact.startHour).padStart(2, '0')}:00 - {String(config.directorContact.endHour).padStart(2, '0')}:00)
                    </>
                 ) : (
                    <>
                         <Clock className="w-3 h-3 mr-1" />
                        {directorStatus.label}
                    </>
                 )}
              </div>
           </div>
        </a>
      </div>

      {/* Main Toggle Button - Re-enable pointer events for the button specifically */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-200 pointer-events-auto touch-manipulation cursor-pointer ${
            isOpen ? 'bg-gray-800 rotate-90' : 'bg-[#25D366] hover:bg-[#20BA5C] hover:scale-105'
        }`}
        aria-label="Chat on WhatsApp"
      >
        {isOpen ? (
            <X className="w-8 h-8 text-white" />
        ) : (
            <MessageCircle className="w-8 h-8 text-white fill-current" />
        )}
      </button>
    </div>
  );
};
