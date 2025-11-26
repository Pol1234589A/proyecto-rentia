
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, User, Briefcase, Clock } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(new Date());

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
      return { isOpen: false, label: 'Cerrado' };
    }

    // Check hours
    if (hour >= startHour && hour < endHour) {
      return { isOpen: true, label: 'En línea' };
    }

    return { isOpen: false, label: 'Cerrado' };
  };

  const sandraStatus = getStatus(9, 14);
  const polStatus = getStatus(9, 20);

  return (
    // CRITICAL FIX: pointer-events-none on parent ensures the invisible wrapper 
    // doesn't block underlying clicks (footer links, etc) on mobile/desktop.
    <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col items-end pointer-events-none">
      
      {/* Menu Popup */}
      <div 
        className={`mb-4 flex flex-col gap-3 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Sandra Button */}
        <a 
          href="https://api.whatsapp.com/send?phone=34611948589&text=Hola%20Sandra,%20tengo%20una%20consulta%20administrativa/general..." 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-3 p-4 rounded-xl shadow-xl border-2 transition-all w-72 group relative overflow-hidden touch-manipulation cursor-pointer ${
              sandraStatus.isOpen 
              ? 'bg-white border-green-500 hover:bg-green-50' 
              : 'bg-white border-gray-200 hover:bg-gray-50 grayscale-[0.5] hover:grayscale-0'
          }`}
        >
           <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
               sandraStatus.isOpen ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
           }`}>
              <User className="w-6 h-6" />
              {sandraStatus.isOpen && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
           </div>
           <div className="flex flex-col flex-grow">
              <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-rentia-black">Secretaría (Sandra)</span>
              </div>
              <span className="text-xs text-gray-500 mb-1">Admin y Propietarios</span>
              
              <div className={`flex items-center text-[10px] font-bold uppercase tracking-wide ${sandraStatus.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                 {sandraStatus.isOpen ? (
                    <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        En línea (09:00 - 14:00)
                    </>
                 ) : (
                    <>
                        <Clock className="w-3 h-3 mr-1" />
                        Cerrado (Abre 09:00)
                    </>
                 )}
              </div>
           </div>
        </a>

        {/* Pol Button */}
        <a 
          href="https://api.whatsapp.com/send?phone=34672886369&text=Hola%20Pol,%20estoy%20interesado%20en%20vuestras%20oportunidades%20de%20inversi%C3%B3n..." 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-3 p-4 rounded-xl shadow-xl border-2 transition-all w-72 group relative overflow-hidden touch-manipulation cursor-pointer ${
            polStatus.isOpen 
            ? 'bg-white border-green-500 hover:bg-green-50' 
            : 'bg-white border-gray-200 hover:bg-gray-50 grayscale-[0.5] hover:grayscale-0'
        }`}
        >
           <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
               polStatus.isOpen ? 'bg-blue-100 text-rentia-blue' : 'bg-gray-100 text-gray-500'
           }`}>
              <Briefcase className="w-6 h-6" />
               {polStatus.isOpen && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
           </div>
           <div className="flex flex-col flex-grow">
              <span className="font-bold text-sm text-rentia-black">Dirección (Pol)</span>
              <span className="text-xs text-gray-500 mb-1">Estrategia e Inversión</span>
               <div className={`flex items-center text-[10px] font-bold uppercase tracking-wide ${polStatus.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                 {polStatus.isOpen ? (
                    <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        En línea (09:00 - 20:00)
                    </>
                 ) : (
                    <>
                         <Clock className="w-3 h-3 mr-1" />
                        Cerrado (Abre 09:00)
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