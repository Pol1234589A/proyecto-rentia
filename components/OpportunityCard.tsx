
import React from 'react';
import { Opportunity } from '../types';
import { MapPin, Bed, Maximize, TrendingUp, PlayCircle, ArrowRight, Building } from 'lucide-react';

interface Props {
  opportunity: Opportunity;
  onClick: (id: string) => void;
}

export const OpportunityCard: React.FC<Props> = ({ opportunity, onClick }) => {
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
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold">Rentabilidad</span>
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
              {opportunity.status === 'reserved' ? 'Reservado' : 'Vendido'}
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
            <div className="flex items-center text-gray-500 text-sm mb-4">
                <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">{opportunity.address}, {opportunity.city}</span>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Precio Compra</p>
                    <p className="font-bold text-rentia-black text-base">{opportunity.financials.purchasePrice.toLocaleString('es-ES')} €</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Inversión Total</p>
                    <p className="font-bold text-rentia-black text-base">{finalTotalInvestment.toLocaleString('es-ES')} €</p>
                </div>
            </div>

            {/* Key Specs */}
            <div className="flex justify-around items-center text-center text-gray-600 border-t border-b border-gray-100 py-3 mb-6">
                <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-rentia-blue" />
                    <span className="font-medium text-sm sm:text-base">{opportunity.specs.rooms} <span className="hidden sm:inline">habs.</span></span>
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
            Ver Análisis Completo
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
