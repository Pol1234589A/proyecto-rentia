import React, { useState, useMemo } from 'react';
import { Opportunity } from '../types';
import { OpportunityCard } from './OpportunityCard';
import { useLanguage } from '../contexts/LanguageContext';
import { TrendingUp, Phone, Mail, Globe, Lock, ChevronDown, Check, Filter, Search, X, Calendar, ArrowRight, ShieldCheck, BarChart3, Building } from 'lucide-react';

interface LandingViewProps {
  opportunities: Opportunity[];
  onClick: (id: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ opportunities, onClick }) => {
  const { t } = useLanguage();
  const [filterYield, setFilterYield] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  // FIX: Define clearFilters function to reset filtering states
  const clearFilters = () => {
      setFilterYield(0);
      setMaxPrice(0);
  };

  const handleScrollToGrid = () => {
      document.getElementById('opp-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredOpps = useMemo(() => {
      return opportunities.filter(opp => {
          const monthlyIncome = opp.financials.monthlyRentProjected > 0 
            ? opp.financials.monthlyRentProjected 
            : opp.financials.monthlyRentTraditional;
          
          const purchasePrice = opp.financials.purchasePrice;
          const agencyFeeBase = opp.financials.agencyFees !== undefined 
              ? opp.financials.agencyFees 
              : (purchasePrice > 100000 ? purchasePrice * 0.03 : 3000);
              
          const agencyFeeTotal = agencyFeeBase * 1.21; 
          const finalTotalInvestment = opp.financials.totalInvestment + agencyFeeTotal;
          const grossYield = ((monthlyIncome * 12) / finalTotalInvestment) * 100;

          if (filterYield > 0 && grossYield < filterYield) return false;
          if (maxPrice > 0 && opp.financials.purchasePrice > maxPrice) return false;
          
          return true;
      });
  }, [opportunities, filterYield, maxPrice]);

  const activeFilters = (filterYield > 0 ? 1 : 0) + (maxPrice > 0 ? 1 : 0);
  const calendarUrl = "https://calendar.google.com/calendar/embed?src=rentiaroom%40gmail.com&ctz=UTC";

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col font-sans selection:bg-rentia-gold selection:text-rentia-black">
      
      {/* Header Minimalista y Elegante */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 h-16 sm:h-20 flex items-center transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-rentia-black p-1.5 rounded-lg shadow-lg">
                <img 
                  src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" 
                  alt="RentiaRoom" 
                  className="h-6 sm:h-8 w-auto object-contain" 
                />
             </div>
             <div className="hidden md:block w-px h-6 bg-gray-200"></div>
             <span className="hidden md:block text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Private Equity Portfolio</span>
          </div>
          <div className="flex items-center gap-3">
              <a 
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 text-xs font-bold bg-rentia-blue text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-200 active:scale-95"
              >
                  <Calendar className="w-3.5 h-3.5" /> Agendar Reunión
              </a>
              <button 
                onClick={() => window.location.hash = '#/'}
                className="text-xs font-bold text-slate-600 hover:text-rentia-black transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <Globe className="w-3.5 h-3.5" /> Web Pública
              </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Estilo Dossier Institucional */}
      <section className="bg-[#0f172a] text-white pt-16 pb-24 md:pt-28 md:pb-44 relative overflow-hidden">
         {/* Capas de fondo abstractas */}
         <div className="absolute inset-0 z-0">
             <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rentia-blue/10 rounded-full blur-[120px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-rentia-gold/5 rounded-full blur-[100px]"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
         </div>
         
         <div className="container mx-auto px-4 relative z-10 max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full mb-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ShieldCheck className="w-4 h-4 text-rentia-gold" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-300">Investor Access Restricted</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-bold font-display mb-8 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
                Oportunidades de <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rentia-gold via-yellow-200 to-white">Inversión Inmobiliaria</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                Cartera exclusiva de activos residenciales en Murcia optimizados para el alquiler por habitaciones. 
                Rentabilidades netas auditadas superiores al <strong className="text-white">8.5% anual</strong>.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <button 
                    onClick={handleScrollToGrid}
                    className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold text-base hover:bg-rentia-gold hover:text-rentia-black transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-white/5 hover:shadow-rentia-gold/20 transform hover:-translate-y-1"
                >
                    Explorar Cartera
                    <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                </button>
                <button 
                    onClick={() => window.location.hash = '#/nosotros'}
                    className="px-10 py-4 rounded-2xl font-bold text-base bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all"
                >
                    Sobre RentiaRoom
                </button>
            </div>
         </div>
      </section>

      {/* Barra de Indicadores Clave */}
      <div className="container mx-auto px-4 relative z-20 -mt-10 md:-mt-14 max-w-6xl">
          <div className="bg-white border border-gray-100 p-6 md:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <div className="px-6 py-4 sm:py-0">
                  <div className="flex items-center justify-center gap-2 text-rentia-blue mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Yield Medio</span>
                  </div>
                  <p className="text-4xl font-bold text-slate-900 font-display">8.7<span className="text-rentia-gold text-2xl">%</span></p>
              </div>
              <div className="px-6 py-4 sm:py-0">
                  <div className="flex items-center justify-center gap-2 text-rentia-blue mb-2">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gestión Integral</span>
                  </div>
                  <p className="text-4xl font-bold text-slate-900 font-display">100<span className="text-rentia-gold text-2xl">%</span></p>
              </div>
              <div className="px-6 py-4 sm:py-0">
                  <div className="flex items-center justify-center gap-2 text-rentia-blue mb-2">
                      <Building className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mercado Foco</span>
                  </div>
                  <p className="text-4xl font-bold text-slate-900 font-display">Murcia</p>
              </div>
          </div>
      </div>

      {/* Grid de Oportunidades */}
      <main id="opp-grid" className="flex-grow container mx-auto px-4 py-24 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-display mb-3">Portfolio de Activos</h2>
                <p className="text-slate-500 text-sm leading-relaxed">Seleccionamos únicamente inmuebles con potencial de optimización mediante el modelo de coliving.</p>
            </div>
            
            <div className="flex items-center gap-3 self-end">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${showFilters ? 'bg-rentia-black text-white border-rentia-black' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'}`}
                >
                    <Filter className="w-4 h-4" />
                    Filtrar
                    {activeFilters > 0 && <span className="bg-rentia-gold text-rentia-black text-[10px] px-2 py-0.5 rounded-full ml-1">{activeFilters}</span>}
                </button>
                <div className="hidden sm:flex items-center px-4 py-3 bg-slate-100 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-wider">
                    {filteredOpps.length} Activos Disponibles
                </div>
            </div>
        </div>

        {/* Panel de Filtros Expandible */}
        {showFilters && (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mb-12 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Rentabilidad Mínima</label>
                        <div className="flex flex-wrap gap-2">
                            {[0, 8, 9, 10].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setFilterYield(val)}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${filterYield === val ? 'bg-rentia-blue text-white border-rentia-blue shadow-lg shadow-blue-200' : 'bg-white text-slate-500 border-gray-200 hover:border-blue-300'}`}
                                >
                                    {val === 0 ? 'Todas' : `+${val}%`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Inversión Máxima</label>
                        <select 
                            value={maxPrice} 
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rentia-blue/20 outline-none appearance-none cursor-pointer"
                        >
                            <option value="0">Sin límite de precio</option>
                            <option value="120000">Hasta 120.000 €</option>
                            <option value="180000">Hasta 180.000 €</option>
                            <option value="250000">Hasta 250.000 €</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={clearFilters}
                            className="w-full py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                        >
                            Limpiar todos los filtros
                        </button>
                    </div>
                </div>
            </div>
        )}

        {filteredOpps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {filteredOpps.map(opportunity => (
                    <OpportunityCard 
                        key={opportunity.id} 
                        opportunity={opportunity} 
                        onClick={onClick} 
                    />
                ))}
            </div>
        ) : (
            <div className="bg-white p-20 rounded-[3rem] shadow-sm text-center border border-dashed border-gray-200 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <BarChart3 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No hay activos coincidentes</h3>
                <p className="text-slate-500 leading-relaxed mb-10">Intenta ajustar los criterios de búsqueda o revisa nuestra cartera completa.</p>
                <button 
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-3 bg-rentia-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                    Ver todo el portfolio
                </button>
            </div>
        )}
      </main>

      {/* Footer del Portal de Inversión */}
      <footer className="bg-white border-t border-gray-100 pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-7xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                  <div className="md:col-span-5">
                      <div className="bg-rentia-black p-2 rounded-xl inline-block mb-6">
                        <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="Rentia" className="h-8" />
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                          Rentia Investments S.L. es una firma boutique especializada en la creación de activos inmobiliarios de alta rentabilidad. Transformamos viviendas convencionales en productos financieros eficientes.
                      </p>
                  </div>
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                      <div>
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-6">Legal</h4>
                          <ul className="space-y-4 text-sm text-slate-500">
                              <li><button onClick={() => window.location.hash = '#/nosotros'} className="hover:text-rentia-blue transition-colors">Sobre Nosotros</button></li>
                              <li><button className="hover:text-rentia-blue transition-colors">Aviso Legal</button></li>
                              <li><button className="hover:text-rentia-blue transition-colors">Privacidad</button></li>
                          </ul>
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-6">Contacto</h4>
                          <ul className="space-y-4 text-sm text-slate-500">
                              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 672 88 63 69</li>
                              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@rentiaroom.com</li>
                          </ul>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-6">Social</h4>
                          <div className="flex gap-4">
                              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-rentia-blue hover:text-white transition-all"><TrendingUp className="w-5 h-5" /></a>
                              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-rentia-blue hover:text-white transition-all"><Globe className="w-5 h-5" /></a>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="border-t border-gray-100 pt-8 text-center">
                  <p className="text-slate-400 text-xs">© 2025 Rentia Investments S.L. • Institutional Real Estate Portfolio</p>
              </div>
          </div>
      </footer>
    </div>
  );
};
