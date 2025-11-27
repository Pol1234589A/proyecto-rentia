import React from 'react';
import { Opportunity } from '../types';
import { MapPin, Bed, Maximize, TrendingUp, PlayCircle, ArrowRight, Building, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  opportunity: Opportunity;
  onClick: (id: string) => void;
}

export const OpportunityCard: React.FC<Props> = ({ opportunity, onClick }) => {
  const { t } = useLanguage();
  // Smart yield calculation: prioritize projected rooms income, otherwise use traditional
  const monthlyIncome = opportunity.financials.monthlyRentProjected > 0 
      ? opportunity.financials.monthlyRentProjected 
      : opportunity.financials.monthlyRentTraditional;

  // --- AGENCY FEES CALCULATION FOR CARD ---
  // Logic: > 100k => 3% + IVA. <= 100k => 3000€ + IVA
  const purchasePrice = opportunity.financials.purchasePrice;
  const agencyFeeBase = purchasePrice > 100000 ? purchasePrice * 0.03 : 3000;
  const agencyFeeTotal = agencyFeeBase * 1.21; // Add 21% IVA
  
  // Total Investment displayed and used for yield includes the Agency Fee
  const finalTotalInvestment = opportunity.financials.totalInvestment + agencyFeeTotal;
      
  const grossYield = ((monthlyIncome * 12) / finalTotalInvestment) * 100;

  return (
    // Main container - More elegant shadow and structure
    <div 
      className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-200/80 flex flex-col h-full"
      onClick={() => onClick(opportunity.id)}
    >
      {/* --- IMAGE & OVERLAYS --- */}
      <div className="relative h-56 overflow-hidden">
        <img 
          src={opportunity.images[0]} 
          alt={opportunity.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* --- RENTABILIDAD (PROFITABILITY) - THE STAR --- */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-green-500 text-white p-2 sm:p-3 rounded-lg shadow-xl flex flex-col items-center justify-center text-center z-10">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1" />
            <span className="font-bold text-xl sm:text-2xl leading-none">{grossYield.toFixed(1)}%</span>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold">{t('opportunities.card.profitability')}</span>
        </div>

        {/* Tags at the bottom */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 items-center z-10 max-w-[80%]">
            {opportunity.tags.slice(0, 2).map(tag => (
                <span key={tag} className="px-2 py-1 bg-rentia-gold text-rentia-black text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded shadow-sm">
                    {tag}
                </span>
            ))}
             {opportunity.videos && opportunity.videos.length > 0 && (
                <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded shadow-sm flex items-center">
                    <PlayCircle className="w-3 h-3 mr-1.5" /> Video
                </span>
            )}
        </div>

        {/* Status overlay */}
        {opportunity.status !== 'available' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="px-4 py-2 bg-white text-rentia-black font-bold text-xl uppercase tracking-widest transform -rotate-6 shadow-lg">
              {opportunity.status === 'reserved' ? t('opportunities.card.reserved') : t('opportunities.card.sold')}
            </span>
          </div>
        )}
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-grow">
        <div>
            {/* Title and Location */}
            <h3 className="text-lg sm:text-xl font-bold font-display text-rentia-black mb-2 line-clamp-2 group-hover:text-rentia-blue transition-colors min-h-[3.5rem]">
                {opportunity.title}
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{opportunity.address}, {opportunity.city}</span>
                </div>
                
                {/* DRIVE BUTTON ADDED HERE */}
                {opportunity.driveFolder && (
                    <a 
                        href={opportunity.driveFolder}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-1.5 rounded-md hover:bg-green-50 hover:text-green-700 transition-colors border border-gray-200 hover:border-green-200"
                        title="Ver fotos y videos en Drive"
                    >
                         {/* Drive Icon SVG */}
                        <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l32.3-56-4.75-8.3h-8.7c-2.6 0-5 .7-7.1 1.9l-18.8 32.7c-2.2 3.8-2.2 8.4 0 12.2l-.1.15h.1z" fill="#0066da"/>
                            <path d="M43.65 25h-28.7c-2.2 3.8-2.2 8.3 0 12.1l18.8 32.6c.8 1.4 1.9 2.5 3.2 3.2l32.4-56.2h-7.65c-2.4.1-4.7.8-6.75 2l-11.3 6.3z" fill="#00ac47"/>
                            <path d="M73.55 76.8c1.3-.7 2.4-1.8 3.2-3.2l10.55-18.2c2.2-3.8 2.2-8.4 0-12.2l-11.3-19.55-16.15-2.65-3.8-6.6-22.4 38.9 3.55 6.1c2.1 3.7 5.9 6 10.2 6.3h26.15z" fill="#ea4335"/>
                            <path d="M43.65 25 29.35 0h8.7c4.3.3 8.1 2.6 10.2 6.3l11.3 19.55-15.9-.85z" fill="#00832d"/>
                            <path d="M22.05 62.6 44.4 23.7l3.8 6.6-22.35 38.7c-4.3-.3-8.1-2.6-10.2-6.3L5.1 44.5c-.2-.4-.4-.8-.6-1.2l17.55 19.3z" fill="#2684fc"/>
                            <path d="M76.75 73.6l-14.7-25.5 7.4-12.8 17.85 31c-2.1 3.7-5.9 6-10.2 6.3h-22.4l22.05-38.1z" fill="#ffba00"/>
                        </svg>
                        <span>Fotos Drive</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-50" />
                    </a>
                )}
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">{t('opportunities.card.purchase_price')}</p>
                    <p className="font-bold text-rentia-black text-base">{opportunity.financials.purchasePrice.toLocaleString('es-ES')} €</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">{t('opportunities.card.total_investment')}</p>
                    <p className="font-bold text-rentia-black text-base">{finalTotalInvestment.toLocaleString('es-ES')} €</p>
                </div>
            </div>

            {/* Key Specs */}
            <div className="flex justify-around items-center text-center text-gray-600 border-t border-b border-gray-100 py-3 mb-6">
                <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-rentia-blue" />
                    <span className="font-medium text-sm sm:text-base">{opportunity.specs.rooms} <span className="hidden sm:inline">{t('opportunities.card.rooms')}</span></span>
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-rentia-blue" />
                    <span className="font-medium text-sm sm:text-base">{opportunity.specs.sqm} m²</span>
                </div>
                 <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 sm:w-5 sm:h-5 text-rentia-blue" />
                    <span className="font-medium text-sm sm:text-base">{opportunity.specs.floor}</span>
                </div>
            </div>
        </div>

        {/* CTA Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Evita que el evento se propague al div contenedor
            onClick(opportunity.id);
          }}
          className="w-full mt-auto bg-rentia-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 group-hover:bg-rentia-black transition-colors duration-300 transform group-hover:-translate-y-1 text-sm sm:text-base touch-manipulation shadow-md"
        >
            {t('opportunities.card.btn')}
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};