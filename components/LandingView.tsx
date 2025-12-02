
import React from 'react';
import { Opportunity } from '../types';
import { OpportunityCard } from './OpportunityCard';
import { useLanguage } from '../contexts/LanguageContext';
import { TrendingUp, Phone, Mail, Globe } from 'lucide-react';

interface LandingViewProps {
  opportunities: Opportunity[];
  onClick: (id: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ opportunities, onClick }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Minimal Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img 
               src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" 
               alt="RentiaRoom" 
               className="h-8 md:h-10 w-auto object-contain filter invert" 
             />
             <div className="hidden md:block w-px h-8 bg-gray-300 mx-2"></div>
             <span className="hidden md:block text-gray-500 text-sm font-medium tracking-wide">Opportunities Portfolio</span>
          </div>
          <a 
            href="https://www.rentiaroom.com" 
            className="text-xs font-bold text-rentia-blue border border-rentia-blue px-4 py-2 rounded-full hover:bg-rentia-blue hover:text-white transition-colors"
          >
            Web Corporativa
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-rentia-black text-white py-16 md:py-24 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-40 grayscale"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-rentia-black/90 to-rentia-blue/30"></div>
         
         <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1.5 rounded-full mb-6 font-bold text-xs uppercase tracking-wider shadow-lg">
                <TrendingUp className="w-3 h-3" />
                Oportunidades de Inversión
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 tracking-tight">
                Cartera de Activos RentiaRoom
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
                Selección exclusiva de propiedades de alta rentabilidad en Murcia, gestionadas integralmente por nuestro equipo.
            </p>
         </div>
      </section>

      {/* Grid */}
      <main className="flex-grow container mx-auto px-4 py-12 -mt-10 relative z-20">
        {opportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {opportunities.map(opportunity => (
                    <OpportunityCard 
                        key={opportunity.id} 
                        opportunity={opportunity} 
                        onClick={onClick} 
                    />
                ))}
            </div>
        ) : (
            <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-gray-200">
                <p className="text-gray-500">No hay oportunidades públicas disponibles en este momento.</p>
            </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-500">
          <div className="container mx-auto px-4">
              <div className="flex justify-center gap-6 mb-4">
                  <a href="mailto:info@rentiaroom.com" className="flex items-center gap-2 hover:text-rentia-blue transition-colors">
                      <Mail className="w-4 h-4" /> info@rentiaroom.com
                  </a>
                  <a href="tel:+34672886369" className="flex items-center gap-2 hover:text-rentia-blue transition-colors">
                      <Phone className="w-4 h-4" /> +34 672 88 63 69
                  </a>
                  <a href="https://www.rentiaroom.com" className="flex items-center gap-2 hover:text-rentia-blue transition-colors">
                      <Globe className="w-4 h-4" /> www.rentiaroom.com
                  </a>
              </div>
              <p>© 2025 Rentia Investments S.L. - Documento Informativo</p>
          </div>
      </footer>
    </div>
  );
};
