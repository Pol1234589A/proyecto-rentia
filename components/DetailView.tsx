
import React, { useState, useEffect } from 'react';
import { Opportunity } from '../types';
import { ArrowLeft, Check, MapPin, Users, Printer, TrendingUp, Bed, Maximize, Building, Bath, X, Settings, ChevronLeft, ChevronRight, PlayCircle, ExternalLink } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'next/navigation';

interface Props {
  opportunity: Opportunity;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  // onNavigate removido
}

type RentalStrategy = 'rooms' | 'traditional';

export const DetailView: React.FC<Props> = ({ opportunity, onBack, onNext, onPrev, hasNext, hasPrev }) => {
  const { financials, specs, images, videos, driveFolder } = opportunity;
  const { t } = useLanguage();
  const router = useRouter();
  
  // State
  const [rentalStrategy, setRentalStrategy] = useState<RentalStrategy>(
    financials.monthlyRentProjected > 0 ? 'rooms' : 'traditional'
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [includeManagementFee, setIncludeManagementFee] = useState(true);
  
  // --- SEO INJECTION: RealEstateListing Schema ---
  // This helps AI understand this is an investment product for sale
  useEffect(() => {
    const listingData = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": opportunity.title,
      "image": images,
      "description": opportunity.description,
      "datePosted": new Date().toISOString().split('T')[0],
      "offers": {
        "@type": "Offer",
        "price": opportunity.financials.purchasePrice,
        "priceCurrency": "EUR",
        "availability": opportunity.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        "description": "Oportunidad de inversión inmobiliaria en Murcia con alta rentabilidad."
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": opportunity.address,
        "addressLocality": opportunity.city.split('(')[0].trim(),
        "addressRegion": "Murcia",
        "addressCountry": "ES"
      },
      "numberOfRooms": opportunity.specs.rooms,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": opportunity.specs.sqm,
        "unitCode": "MTK"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(listingData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [opportunity]);

  // Reset state when opportunity changes
  useEffect(() => {
    if (opportunity.financials.monthlyRentProjected > 0) {
        setRentalStrategy('rooms');
    } else {
        setRentalStrategy('traditional');
    }
    setIncludeManagementFee(true);
    // Scroll to top when changing opportunity
    window.scrollTo(0, 0);
  }, [opportunity.id]);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const hasRealImages = images.length > 0 && !images[0].includes('placeholder');

  // --- 1. AGENCY FEES CALCULATION (Comisión Inmobiliaria) ---
  // Rule: > 100k => 3% + IVA. <= 100k => 3000€ + IVA
  const purchasePrice = financials.purchasePrice;
  const agencyFeeBase = purchasePrice > 100000 ? purchasePrice * 0.03 : 3000;
  const agencyFeeTotal = agencyFeeBase * 1.21; // Add 21% IVA

  // Recalculate Total Investment including Agency Fees
  const finalTotalInvestment = financials.totalInvestment + agencyFeeTotal;

  // --- 2. INCOME & YIELD CALCULATIONS ---
  const isRoomsStrategy = rentalStrategy === 'rooms';
  const monthlyIncome = isRoomsStrategy ? financials.monthlyRentProjected : financials.monthlyRentTraditional;
  
  // Ensure non-zero income for calculations unless really 0
  const effectiveMonthlyIncome = monthlyIncome > 0 ? monthlyIncome : 0;

  // Management Fee Logic (Comisión Gestión)
  // 15% for rooms, 10% for traditional
  const managementFeePercentage = isRoomsStrategy ? 0.15 : 0.10; 
  const calculatedManagementFee = effectiveMonthlyIncome * managementFeePercentage;
  const calculatedIvaOnFee = calculatedManagementFee * 0.21;

  // Apply toggle logic
  const managementFeeToSubtract = includeManagementFee ? calculatedManagementFee : 0;
  const ivaToSubtract = includeManagementFee ? calculatedIvaOnFee : 0;

  // Net Calculations
  const monthlyExpenses = financials.yearlyExpenses / 12;
  const netMonthlyIncome = effectiveMonthlyIncome - monthlyExpenses - managementFeeToSubtract - ivaToSubtract;
  const netYearlyIncome = netMonthlyIncome * 12;

  const grossYield = (effectiveMonthlyIncome * 12 / finalTotalInvestment) * 100;
  const netYield = (netYearlyIncome / finalTotalInvestment) * 100;

  // --- 3. PRINT HANDLER ---
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 animate-in fade-in duration-500 print:p-0 print:max-w-none print:bg-white">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none">
          
          {/* PRINT HEADER (Visible only when printing) */}
          <div className="hidden print:block px-8 pt-8 pb-4 mb-4 border-b-2 border-[#edcd20]">
              <div className="flex justify-between items-center">
                  <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" className="h-12 object-contain filter invert" alt="RentiaRoom" />
                  <div className="text-right text-[10px] text-gray-600 leading-relaxed">
                      <strong>RENTIA INVESTMENTS S.L.</strong><br/>
                      Gestión Integral de Inversiones<br/>
                      www.rentiaroom.com
                  </div>
              </div>
          </div>

          {/* WEB HEADER (Hidden when printing) */}
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
            <div className="w-full md:w-auto">
              <button onClick={onBack} className="flex items-center text-rentia-blue hover:underline text-sm font-semibold mb-3 p-2 -ml-2 rounded-lg hover:bg-gray-50 touch-manipulation">
                <ArrowLeft className="w-5 h-5 mr-1" />
                {t('opportunities.detail.back')}
              </button>
              <h1 className="text-xl md:text-2xl font-bold font-display text-rentia-black leading-tight w-full md:max-w-lg break-words">
                {opportunity.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
              {/* Print Button */}
              <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-rentia-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm shadow-md flex-shrink-0 touch-manipulation min-h-[40px]"
              >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('opportunities.detail.print')}</span>
                  <span className="sm:hidden">{t('common.print')}</span>
              </button>

              <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>

              <div className="flex gap-2">
                <button onClick={onPrev} disabled={!hasPrev} className="nav-controls p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Anterior"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button onClick={onNext} disabled={!hasNext} className="nav-controls p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Siguiente"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="p-4 sm:p-6 md:p-8 print:p-8 print:pt-2">
            
            {/* Title for Print */}
            <div className="hidden print:block mb-6">
                 <h1 className="text-2xl font-bold font-display text-rentia-black leading-tight mb-2">{opportunity.title}</h1>
                 <div className="flex items-center text-gray-500 text-sm border-b border-gray-100 pb-4">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {opportunity.city} - {opportunity.address}
                 </div>
            </div>

            {/* --- KPI DASHBOARD --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 print:gap-4 break-inside-avoid">
                <div className="bg-green-50 p-3 sm:p-4 rounded-xl border-2 border-green-200 text-center flex flex-col justify-center print:border-green-300">
                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-800 mb-1">{t('opportunities.detail.net_yield')}</h4>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700 font-display break-words">{netYield.toFixed(2)}%</p>
                </div>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200 text-center flex flex-col justify-center print:border-blue-300">
                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-800 mb-1">{t('opportunities.detail.net_monthly')}</h4>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-rentia-blue font-display break-words">{netMonthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                </div>
                <div className="bg-yellow-50 p-3 sm:p-4 rounded-xl border border-yellow-200 text-center flex flex-col justify-center print:border-yellow-300">
                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-yellow-800 mb-1">{t('opportunities.card.total_investment')}</h4>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-rentia-black font-display break-words">{finalTotalInvestment.toLocaleString('es-ES')} €</p>
                </div>
                <div className="bg-gray-100 p-3 sm:p-4 rounded-xl border border-gray-200 text-center flex flex-col justify-center">
                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t('opportunities.detail.gross_yield')}</h4>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-700 font-display break-words">{grossYield.toFixed(2)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 print:block">
              
              {/* Left Column: Financials & Details */}
              <div className="lg:col-span-2 space-y-8 print:w-full print:mb-8">
                
                {/* FINANCIAL ANALYSIS CARD */}
                <div className="bg-gray-50/80 p-4 sm:p-6 rounded-2xl border border-gray-200/80 print:bg-white print:border-gray-300 break-inside-avoid">
                    <h2 className="text-lg sm:text-xl font-bold text-rentia-black font-display mb-6 flex flex-wrap items-center justify-between gap-2">
                        {t('opportunities.detail.financial_study')}
                        {/* Info Tag for Agency Fee */}
                        <span className="text-[10px] font-normal bg-white px-2 py-1 rounded border border-gray-200 text-gray-500 inline-block print:hidden whitespace-nowrap">
                            {t('opportunities.detail.includes_fees')}
                        </span>
                    </h2>

                    {/* Investment Breakdown */}
                    <div className="space-y-3 mb-6 border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">{t('opportunities.detail.investment_breakdown')}</h3>
                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">{t('opportunities.card.purchase_price')}</span><span className="font-bold">{financials.purchasePrice.toLocaleString('es-ES')} €</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">{t('opportunities.detail.reform_furniture')}</span><span className="font-bold">{(financials.reformCost + financials.furnitureCost).toLocaleString('es-ES')} €</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">{t('opportunities.detail.notary_taxes')}</span><span className="font-bold">{financials.notaryAndTaxes.toLocaleString('es-ES')} €</span></div>
                        
                        {/* Agency Fee Line */}
                        <div className="flex justify-between items-baseline text-rentia-blue">
                            <span className="text-sm font-medium">{t('opportunities.detail.agency_fees')}</span>
                            <span className="font-bold">{agencyFeeTotal.toLocaleString('es-ES')} €</span>
                        </div>
                        
                        <div className="bg-rentia-gold/30 p-3 rounded-lg flex justify-between items-center mt-3 print:bg-gray-100 print:border print:border-gray-300">
                            <span className="font-bold text-rentia-black">{t('opportunities.card.total_investment')}</span>
                            <span className="font-bold text-lg sm:text-xl text-rentia-black">{finalTotalInvestment.toLocaleString('es-ES')} €</span>
                        </div>
                    </div>

                    {/* INTERACTIVE CONTROLS (Hidden in Print) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 no-print">
                         {/* Strategy Selector */}
                        {financials.monthlyRentProjected > 0 && financials.monthlyRentTraditional > 0 ? (
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block">{t('opportunities.detail.strategy')}</label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-200 p-1 rounded-lg h-12">
                                    <button onClick={() => setRentalStrategy('rooms')} className={`flex items-center justify-center px-2 text-sm font-semibold rounded-md transition-all touch-manipulation ${rentalStrategy === 'rooms' ? 'bg-white shadow text-rentia-blue' : 'text-gray-600 hover:bg-white/50'}`}>{t('opportunities.detail.rooms_strategy')}</button>
                                    <button onClick={() => setRentalStrategy('traditional')} className={`flex items-center justify-center px-2 text-sm font-semibold rounded-md transition-all touch-manipulation ${rentalStrategy === 'traditional' ? 'bg-white shadow text-rentia-blue' : 'text-gray-600 hover:bg-white/50'}`}>{t('opportunities.detail.traditional_strategy')}</button>
                                </div>
                            </div>
                        ) : (
                             <div>
                                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block">{t('opportunities.detail.strategy')}</label>
                                <div className="flex items-center justify-center bg-gray-100 rounded-lg h-12 text-sm font-bold text-gray-500 border border-gray-200">
                                    {financials.monthlyRentProjected > 0 ? t('opportunities.detail.rooms_strategy') : t('opportunities.detail.traditional_strategy')}
                                </div>
                            </div>
                        )}

                        {/* Management Toggle */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block">{t('opportunities.detail.management')}</label>
                            <button 
                                onClick={() => setIncludeManagementFee(!includeManagementFee)}
                                className={`w-full h-12 rounded-lg flex items-center justify-between px-4 transition-all border touch-manipulation ${includeManagementFee ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                            >
                                <span className="text-sm font-bold">{includeManagementFee ? t('opportunities.detail.active') : t('opportunities.detail.disabled')}</span>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${includeManagementFee ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform shadow-sm ${includeManagementFee ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">{t('opportunities.detail.monthly_estimation')}</h3>
                        
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                                {t('opportunities.detail.gross_income')} 
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isRoomsStrategy ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {isRoomsStrategy ? t('opportunities.detail.rooms_strategy') : t('opportunities.detail.traditional_strategy')}
                                </span>
                            </span>
                            <span className="font-bold text-green-600">+{effectiveMonthlyIncome} €</span>
                        </div>
                        
                        <div className="flex justify-between items-baseline text-red-500">
                            <span className="text-sm">{t('opportunities.detail.expenses_ibi')}</span>
                            <span>-{monthlyExpenses.toFixed(0)} €</span>
                        </div>

                        {includeManagementFee ? (
                            <>
                                <div className="flex justify-between items-baseline text-red-500">
                                    <span className="text-sm">{t('opportunities.detail.management_fee')} ({managementFeePercentage * 100}%)</span>
                                    <span>-{managementFeeToSubtract.toFixed(0)} €</span>
                                </div>
                                <div className="flex justify-between items-baseline text-red-500">
                                    <span className="text-sm">{t('opportunities.detail.management_vat')} (21%)</span>
                                    <span>-{ivaToSubtract.toFixed(0)} €</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-right text-[10px] text-gray-400 italic mt-1">
                                {t('opportunities.detail.without_management_note')}
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
                            <span className="font-bold text-rentia-black text-lg">{t('opportunities.detail.net_monthly')}</span>
                            <span className="font-bold text-2xl text-rentia-blue">{netMonthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €</span>
                        </div>
                    </div>
                </div>

                {/* DESCRIPTION & FEATURES */}
                <div className="break-inside-avoid">
                    <h3 className="text-xl font-bold font-display text-rentia-black mb-4 border-b border-gray-100 pb-2">{t('opportunities.detail.description')}</h3>
                    <p className="text-gray-600 leading-relaxed text-justify mb-8 whitespace-pre-line">
                        {opportunity.description}
                    </p>

                    <h3 className="text-xl font-bold font-display text-rentia-black mb-4 border-b border-gray-100 pb-2">{t('opportunities.detail.key_points')}</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {opportunity.features.map((feature, index) => (
                            <li key={index} className="flex items-start bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <div className="mt-0.5 mr-3 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3" />
                                </div>
                                <span className="text-sm text-gray-700 font-medium">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <h3 className="text-xl font-bold font-display text-rentia-black mb-4 border-b border-gray-100 pb-2">{t('opportunities.detail.area_benefits')}</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {opportunity.areaBenefits.map((benefit, index) => (
                            <li key={index} className="flex items-start bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <div className="mt-0.5 mr-3 w-5 h-5 rounded-full bg-blue-100 text-rentia-blue flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-3 h-3" />
                                </div>
                                <span className="text-sm text-gray-700 font-medium">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
              </div>

              {/* Right Column: Specs & Media */}
              <div className="space-y-8 break-inside-avoid">
                 
                 {/* Property Summary Card */}
                 <div className="bg-white p-6 rounded-2xl shadow-idealista border border-gray-100 print:border print:border-gray-300">
                     <h3 className="text-lg font-bold font-display text-rentia-black mb-6 flex items-center gap-2">
                         <Building className="w-5 h-5 text-rentia-gold" />
                         {t('opportunities.detail.property_summary')}
                     </h3>
                     <div className="space-y-4">
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                             <span className="text-gray-500 text-sm flex items-center gap-2"><Bed className="w-4 h-4"/> {t('opportunities.card.rooms')}</span>
                             <span className="font-bold text-rentia-black">{specs.rooms}</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                             <span className="text-gray-500 text-sm flex items-center gap-2"><Bath className="w-4 h-4"/> {t('opportunities.detail.bathrooms')}</span>
                             <span className="font-bold text-rentia-black">{specs.bathrooms}</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                             <span className="text-gray-500 text-sm flex items-center gap-2"><Maximize className="w-4 h-4"/> m²</span>
                             <span className="font-bold text-rentia-black">{specs.sqm}</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                             <span className="text-gray-500 text-sm flex items-center gap-2"><Building className="w-4 h-4"/> {t('opportunities.card.floor')}</span>
                             <span className="font-bold text-rentia-black">{specs.floor}</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                             <span className="text-gray-500 text-sm flex items-center gap-2"><Settings className="w-4 h-4"/> Ascensor</span>
                             <span className="font-bold text-rentia-black">{specs.hasElevator ? t('opportunities.detail.elevator') : t('opportunities.detail.no_elevator')}</span>
                         </div>
                     </div>
                 </div>

                 {/* Media Gallery (Preview) */}
                 <div className="bg-white p-6 rounded-2xl shadow-idealista border border-gray-100 print:hidden">
                     <h3 className="text-lg font-bold font-display text-rentia-black mb-4 flex items-center gap-2">
                         <Printer className="w-5 h-5 text-rentia-gold" />
                         {t('opportunities.detail.multimedia')}
                     </h3>
                     
                     {/* Videos Section */}
                     {videos && videos.length > 0 && (
                         <div className="mb-6">
                             <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Video Tour</h4>
                             <div className="grid grid-cols-1 gap-3">
                                 {videos.map((video, index) => (
                                     <a 
                                        key={index}
                                        href={video}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all group"
                                     >
                                         <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                                             <PlayCircle className="w-6 h-6" />
                                         </div>
                                         <div>
                                             <p className="font-bold text-gray-800 text-sm group-hover:text-red-700">Ver Video Visita {index + 1}</p>
                                             <p className="text-xs text-gray-500">YouTube / Drive</p>
                                         </div>
                                         <ExternalLink className="w-4 h-4 text-gray-400 ml-auto group-hover:text-red-400" />
                                     </a>
                                 ))}
                             </div>
                         </div>
                     )}

                     {/* Photos Grid */}
                     {hasRealImages ? (
                         <div>
                             <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('opportunities.detail.photos')} ({images.length})</h4>
                                <button onClick={() => openLightbox(0)} className="text-xs text-rentia-blue font-bold hover:underline">{t('opportunities.detail.see_all')}</button>
                             </div>
                             <div className="grid grid-cols-3 gap-2">
                                 {images.slice(0, 6).map((img, idx) => (
                                     <div 
                                        key={idx} 
                                        className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
                                        onClick={() => openLightbox(idx)}
                                     >
                                         <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                         {idx === 5 && images.length > 6 && (
                                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm backdrop-blur-[1px]">
                                                 +{images.length - 6}
                                             </div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ) : (
                         <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                             <p className="text-gray-500 text-sm">Fotos disponibles bajo petición</p>
                         </div>
                     )}
                 </div>

                 {/* Contact Card */}
                 <div className="bg-rentia-blue text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all no-print" onClick={() => router.push('/contacto')}>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
                     <h3 className="text-xl font-bold font-display mb-2 relative z-10">{t('home.cta.title')}</h3>
                     <p className="text-blue-100 text-sm mb-6 relative z-10 leading-relaxed">
                         {t('home.cta.subtitle')}
                     </p>
                     <div className="w-full bg-white text-rentia-blue font-bold py-3 px-4 rounded-lg text-center shadow-lg relative z-10 group-hover:scale-105 transition-transform">
                         {t('opportunities.card.btn')}
                     </div>
                 </div>

              </div>
            </div>

            {/* --- PRINT ONLY GALLERY --- */}
            <div className="hidden print:block mt-8 break-before-page">
                <h2 className="text-xl font-bold font-display mb-6 border-b border-black pb-2">{t('opportunities.detail.appendix')}</h2>
                <div className="grid grid-cols-2 gap-4">
                    {images.slice(0, 6).map((img, idx) => (
                        <div key={idx} className="aspect-[4/3] overflow-hidden rounded border border-gray-200 break-inside-avoid">
                            <img src={img} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
                    <p>{t('opportunities.detail.confidential')}</p>
                </div>
            </div>

          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <ImageLightbox 
            images={images} 
            selectedIndex={selectedImageIndex} 
            onClose={() => setIsLightboxOpen(false)} 
        />
      )}
    </>
  );
};
