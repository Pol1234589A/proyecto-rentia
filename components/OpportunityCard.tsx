
import React, { useState, useMemo } from 'react';
import { Opportunity } from '../types';
import { MapPin, Bed, Maximize, TrendingUp, PlayCircle, ArrowRight, Building, ExternalLink, Home, Loader2, Bell, Info, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ContactLeadModal } from './ContactLeadModal';
import { calculateOpportunityFinancials } from '../utils/financials';

interface Props {
  opportunity: Opportunity;
  onClick: (id: string) => void;
}

export const OpportunityCard: React.FC<Props> = ({ opportunity, onClick }) => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Scenarios Logic
  const isLiving = opportunity.scenario === 'sale_living';
  
  // --- USO DE LA LÓGICA CENTRALIZADA ---
  const financials = useMemo(() => calculateOpportunityFinancials(opportunity), [opportunity]);

  // Visibility Logic
  let displayAddress = opportunity.address.replace(/\d+/g, '').replace(/,/, '').trim();
  if (opportunity.visibility === 'hidden') {
      displayAddress = 'Ubicación Privada';
  }

  // Calculate "New" status (within 72 hours)
  const isNew = useMemo(() => {
      if (!opportunity.createdAt) return false;
      const now = new Date();
      const created = (opportunity.createdAt as any).toDate ? (opportunity.createdAt as any).toDate() : new Date(opportunity.createdAt);
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return diffHours <= 72;
  }, [opportunity.createdAt]);

  return (
    <>
    <div 
      className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-200/80 flex flex-col h-full hover:-translate-y-1 relative"
      onClick={() => onClick(opportunity.id)}
    >
      
      {/* NEW BADGE */}
      {isNew && (
          <div className="absolute top-4 left-4 z-30 animate-in fade-in zoom-in-90 duration-500">
              <span className="bg-gradient-to-r from-rentia-blue to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20 uppercase tracking-wider">
                  <Bell className="w-3 h-3 fill-current animate-bounce"/> NUEVA
              </span>
          </div>
      )}

      {/* --- IMAGE & OVERLAYS --- */}
      <div className="relative h-64 overflow-hidden bg-gray-100">
        {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50 z-10">
                <Loader2 className="w-10 h-10 animate-spin text-rentia-blue/50" />
            </div>
        )}
        
        <img 
          src={opportunity.images[0]} 
          alt={opportunity.title} 
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transform group-hover:scale-105 transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

        {/* --- BADGE (Profitability OR Living) --- */}
        {!isLiving ? (
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-xl shadow-lg flex flex-col items-center justify-center text-center z-10 min-w-[4.5rem]">
                <div className="flex items-center gap-1 text-rentia-gold mb-0.5">
                    <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-bold text-2xl font-display leading-none">{financials.grossYield.toFixed(1)}%</span>
                <span className="text-[9px] uppercase tracking-wider font-medium opacity-80">{t('opportunities.card.profitability')}</span>
            </div>
        ) : (
            <div className="absolute top-4 right-4 bg-purple-600 text-white p-3 rounded-xl shadow-lg flex flex-col items-center justify-center text-center z-10">
                <Home className="w-5 h-5 mb-1" />
                <span className="font-bold text-[10px] uppercase tracking-wider">Vivienda</span>
            </div>
        )}

        {/* Tags */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col justify-end z-10">
            <div className="flex flex-wrap gap-2 mb-2">
                {opportunity.tags.slice(0, 3).map(tag => {
                    if (tag.toLowerCase().includes('cashflow')) return null;
                    return (
                        <span key={tag} className="px-2 py-1 bg-white/20 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-wide rounded">
                            {tag}
                        </span>
                    );
                })}
                 {opportunity.videos && opportunity.videos.length > 0 && (
                    <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide rounded flex items-center shadow-sm">
                        <PlayCircle className="w-3 h-3 mr-1" /> Video
                    </span>
                )}
            </div>
            <h3 className="text-xl font-bold font-display text-white leading-tight line-clamp-2 drop-shadow-md group-hover:text-rentia-gold transition-colors">
                {opportunity.title}
            </h3>
        </div>

        {/* Status overlay */}
        {opportunity.status !== 'available' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
            <span className="px-6 py-2 border-2 border-white text-white font-bold text-2xl uppercase tracking-[0.2em] transform -rotate-12">
              {opportunity.status === 'reserved' ? t('opportunities.card.reserved') : t('opportunities.card.sold')}
            </span>
          </div>
        )}
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="p-5 flex flex-col justify-between flex-grow bg-white">
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 border-b border-gray-100 pb-4">
                <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0 text-rentia-blue" />
                    <span className="truncate max-w-[200px] font-medium">{displayAddress}, {opportunity.city}</span>
                </div>
                
                {opportunity.driveFolder && (
                    <a 
                        href={opportunity.driveFolder}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-rentia-blue transition-colors uppercase tracking-wide"
                        title="Ver en Drive"
                    >
                        <span>Drive</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>

            {/* Financial Highlights (Usando calculos centralizados) */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-1">{t('opportunities.card.purchase_price')}</p>
                    <p className="font-bold text-gray-900 text-lg">{financials.purchasePrice.toLocaleString('es-ES')} €</p>
                </div>
                {!isLiving ? (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-[10px] text-blue-400 uppercase tracking-wide font-bold mb-1">{t('opportunities.card.total_investment')}</p>
                        <p className="font-bold text-rentia-blue text-lg">{financials.totalInvestment.toLocaleString('es-ES')} €</p>
                    </div>
                ) : (
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <p className="text-[10px] text-purple-400 uppercase tracking-wide font-bold mb-1">Precio / m²</p>
                        <p className="font-bold text-purple-700 text-lg">{(financials.purchasePrice / opportunity.specs.sqm).toFixed(0)} €</p>
                    </div>
                )}
            </div>

            {/* Key Specs */}
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium mb-4 px-1">
                <div className="flex items-center gap-1.5">
                    <Bed className="w-4 h-4 text-gray-300" />
                    <span>{opportunity.specs.rooms} <span className="hidden sm:inline">{t('opportunities.card.rooms')}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Maximize className="w-4 h-4 text-gray-300" />
                    <span>{opportunity.specs.sqm} m²</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-gray-300" />
                    <span>{opportunity.specs.floor}</span>
                </div>
            </div>
        </div>

        {/* Buttons */}
        <div className="mt-auto grid grid-cols-2 gap-3">
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContactModal(true);
                }}
                className="bg-gray-100 text-gray-700 font-bold py-3 px-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-xs"
            >
                <MessageSquare className="w-4 h-4" /> Contactar
            </button>
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(opportunity.id);
                }}
                className="bg-rentia-black text-white font-bold py-3 px-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-md group-hover:scale-[1.02] text-xs"
            >
                {t('opportunities.card.btn')}
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
    
    <ContactLeadModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)}
        opportunityId={opportunity.id}
        opportunityTitle={opportunity.title}
    />
    </>
  );
};
