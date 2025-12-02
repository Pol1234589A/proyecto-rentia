
import React from 'react';
import { Opportunity } from '../types';
import { OpportunityCard } from './OpportunityCard';
import { useLanguage } from '../contexts/LanguageContext';
import { TrendingUp, Phone, Mail, Globe, Lock, ChevronDown, Check } from 'lucide-react';

interface LandingViewProps {
  opportunities: Opportunity[];
  onClick: (id: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ opportunities, onClick }) => {
  const { t } = useLanguage();

  const handleScrollToGrid = () => {
      document.getElementById('opp-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Minimal Sticky Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img 
               src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" 
               alt="RentiaRoom" 
               className="h-8 w-auto object-contain filter invert" 
             />
             <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2"></div>
             <span className="hidden sm:block text-gray-500 text-xs font-bold tracking-widest uppercase">Private Investment Portfolio</span>
          </div>
          <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 hidden sm:flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Live Updates
              </span>
              <a 
                href="https://www.rentiaroom.com" 
                className="text-xs font-bold text-slate-600 hover:text-rentia-blue transition-colors flex items-center gap-1"
              >
                <Globe className="w-3 h-3" /> RentiaRoom.com
              </a>
          </div>
        </div>
      </header>

      {/* Hero Section - Dossier Style */}
      <section className="bg-slate-900 text-white pt-20 pb-24 md:pt-32 md:pb-40 relative overflow-hidden">
         {/* Abstract Geometric Background */}
         <div className="absolute inset-0 opacity-20">
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rentia-blue/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rentia-gold/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
         </div>
         
         <div className="container mx-auto px-4 relative z-10 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 rounded-full mb-8">
                <Lock className="w-3 h-3 text-rentia-gold" />
                <span className="text-xs font-bold tracking-widest uppercase text-gray-200">Acceso Exclusivo Inversores</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight leading-tight">
                Cartera de Activos <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rentia-gold to-white">High Yield Murcia</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed mb-10">
                Selección curada de oportunidades inmobiliarias con rentabilidades proyectadas superiores al <strong>8%</strong>. 
                Gestión integral 360º incluida.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                    onClick={handleScrollToGrid}
                    className="bg-white text-slate-900 px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group"
                >
                    Ver Oportunidades
                    <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </button>
            </div>
         </div>
      </section>

      {/* Trust Indicators Bar */}
      <div className="bg-white border-b border-gray-200 py-4 relative z-20 -mt-8 mx-4 sm:mx-auto max-w-5xl rounded-xl shadow-lg flex justify-around items-center text-center">
          <div className="px-4">
              <p className="text-2xl font-bold text-slate-800 font-display">8.5%</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Rentabilidad Media</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="px-4">
              <p className="text-2xl font-bold text-slate-800 font-display">100%</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Gestión Integral</p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="px-4">
              <p className="text-2xl font-bold text-slate-800 font-display">Murcia</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Ubicación Prime</p>
          </div>
      </div>

      {/* Grid */}
      <main id="opp-grid" className="flex-grow container mx-auto px-4 py-20 max-w-7xl">
        <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 font-display">Oportunidades Disponibles</h2>
                <p className="text-sm text-gray-500 mt-1">Actualizado en tiempo real</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {opportunities.length} Activos
            </span>
        </div>

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
            <div className="bg-white p-16 rounded-2xl shadow-sm text-center border border-gray-200 max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Cartera Completa Vendida</h3>
                <p className="text-gray-500 leading-relaxed mb-8">
                    Actualmente hemos vendido toda nuestra cartera disponible. Estamos analizando nuevos activos que saldrán al mercado en los próximos días.
                </p>
                <a 
                    href="https://whatsapp.com/channel/0029VbBsvhOIt5rpshbpYN1P"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-rentia-blue text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                    Unirme a Lista de Espera
                </a>
            </div>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-gray-200 pt-12 pb-8">
          <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div>
                      <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="RentiaRoom" className="h-8 filter invert mb-4 opacity-80" />
                      <p className="text-sm text-gray-500 leading-relaxed">
                          Especialistas en inversión inmobiliaria de alta rentabilidad y gestión de activos residenciales en Murcia.
                      </p>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Contacto Directo</h4>
                      <ul className="space-y-3 text-sm text-gray-600">
                          <li>
                              <a href="mailto:info@rentiaroom.com" className="flex items-center gap-2 hover:text-rentia-blue transition-colors">
                                  <Mail className="w-4 h-4" /> info@rentiaroom.com
                              </a>
                          </li>
                          <li>
                              <a href="tel:+34672886369" className="flex items-center gap-2 hover:text-rentia-blue transition-colors">
                                  <Phone className="w-4 h-4" /> +34 672 88 63 69
                              </a>
                          </li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Garantías</h4>
                      <ul className="space-y-3 text-sm text-gray-600">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/> Análisis de mercado verificado</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/> Gestión integral opcional</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/> Rentabilidad neta real</li>
                      </ul>
                  </div>
              </div>
              
              <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
                  <p>© 2025 Rentia Investments S.L.</p>
                  <p className="mt-2 md:mt-0">Documento confidencial para uso exclusivo del destinatario.</p>
              </div>
          </div>
      </footer>
    </div>
  );
};
