import React, { useState, useEffect } from 'react';
import { Opportunity } from '../types';
import { ArrowLeft, Check, MapPin, Users, Printer, TrendingUp, Bed, Maximize, Building, Bath, X, Settings, ChevronLeft, ChevronRight, PlayCircle, ExternalLink } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  opportunity: Opportunity;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  onNavigate: (view: 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts') => void;
}

type RentalStrategy = 'rooms' | 'traditional';

export const DetailView: React.FC<Props> = ({ opportunity, onBack, onNext, onPrev, hasNext, hasPrev, onNavigate }) => {
  const { financials, specs, images, videos, driveFolder } = opportunity;
  const { t } = useLanguage();
  
  // State
  const [rentalStrategy, setRentalStrategy] = useState<RentalStrategy>(
    financials.monthlyRentProjected > 0 ? 'rooms' : 'traditional'
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [includeManagementFee, setIncludeManagementFee] = useState(true);
  
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
  // We add agencyFeeTotal to the base investment defined in data
  const finalTotalInvestment = financials.totalInvestment + agencyFeeTotal;

  // --- 2. INCOME & YIELD CALCULATIONS ---
  const isRoomsStrategy = rentalStrategy === 'rooms';
  const monthlyIncome = isRoomsStrategy ? financials.monthlyRentProjected : financials.monthlyRentTraditional;
  
  // Ensure non-zero income for calculations unless really 0
  const effectiveMonthlyIncome = monthlyIncome > 0 ? monthlyIncome : 0;

  // Management Fee Logic (Comisión Gestión)
  // 15% for rooms, 10% for traditional (standard assumption if not provided, adjustable)
  const managementFeePercentage = isRoomsStrategy ? 0.15 : 0.10; 
  const calculatedManagementFee = effectiveMonthlyIncome * managementFeePercentage;
  const calculatedIvaOnFee = calculatedManagementFee * 0.21;

  // Apply toggle logic: if toggle is OFF, fee is 0 for the user's view
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
              {/* Improved title wrapping for mobile/notebooks */}
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
                                <div className="px-3 h-12 bg-gray-100 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium flex items-center gap-2">
                                   {isRoomsStrategy ? t('opportunities.detail.rooms_strategy') : t('opportunities.detail.traditional_strategy')}
                                </div>
                            </div>
                        )}

                         {/* Management Fee Toggle */}
                         <div className="flex flex-col">
                             <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block flex justify-between items-center">
                                <span>{t('opportunities.detail.management')}</span>
                                <span className="text-rentia-blue text-[10px]">
                                    {includeManagementFee ? `${t('opportunities.detail.active')} (${managementFeePercentage * 100}%)` : t('opportunities.detail.disabled')}
                                </span>
                             </label>
                             <button 
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none h-12 hover:shadow-sm touch-manipulation ${includeManagementFee ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-white border-gray-200'}`}
                                onClick={() => setIncludeManagementFee(!includeManagementFee)}
                                type="button"
                             >
                                <span className={`text-sm font-medium flex items-center gap-2 transition-colors ${includeManagementFee ? 'text-rentia-blue' : 'text-gray-500'}`}>
                                    <Settings className="w-4 h-4" />
                                    {includeManagementFee ? t('opportunities.detail.with_management') : t('opportunities.detail.self_management')}
                                </span>
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${includeManagementFee ? 'bg-rentia-blue' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${includeManagementFee ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                             </button>
                         </div>
                    </div>
                    
                    {/* Metrics Display */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                            {t('opportunities.detail.monthly_estimation')} ({isRoomsStrategy ? t('opportunities.detail.rooms_strategy') : t('opportunities.detail.traditional_strategy')})
                        </h4>
                        
                        <div className="p-3 bg-white rounded-lg border border-gray-200 print:border-gray-300">
                          <div className="flex justify-between items-baseline text-sm">
                            <span className="text-gray-600">{t('opportunities.detail.gross_income')}</span>
                            <span className="font-bold">{effectiveMonthlyIncome.toLocaleString('es-ES')} €</span>
                          </div>
                        </div>

                        {/* Expenses & Fees */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center px-3 text-gray-500">
                                <span>{t('opportunities.detail.expenses_ibi')}</span>
                                <span>-{Math.round(monthlyExpenses)} €</span>
                            </div>
                            
                            {/* Dynamic Management Fee Display */}
                            <div className={`flex justify-between items-center px-3 transition-all duration-300 ${includeManagementFee ? 'text-gray-600 opacity-100' : 'text-gray-300 line-through opacity-50'}`}>
                                <span>{t('opportunities.detail.management_fee')} ({managementFeePercentage * 100}%)</span>
                                <span>-{managementFeeToSubtract.toLocaleString('es-ES', {minimumFractionDigits: 0, maximumFractionDigits: 0})} €</span>
                            </div>
                            
                             <div className={`flex justify-between items-center px-3 transition-all duration-300 ${includeManagementFee ? 'text-gray-600 opacity-100' : 'text-gray-300 line-through opacity-50'}`}>
                                <span>{t('opportunities.detail.management_vat')}</span>
                                <span>-{ivaToSubtract.toLocaleString('es-ES', {minimumFractionDigits: 0, maximumFractionDigits: 0})} €</span>
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2 border border-green-200 print:bg-white print:border-gray-300 mt-4 transition-all">
                           <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                <span className="font-bold text-green-800">{t('opportunities.detail.net_monthly')}</span>
                                {!includeManagementFee && <span className="text-[10px] text-gray-500 font-normal">{t('opportunities.detail.without_management_note')}</span>}
                           </div>
                           <span className="font-bold text-2xl text-green-700">{netMonthlyIncome.toLocaleString('es-ES', {maximumFractionDigits: 0})} €</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="break-inside-avoid">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">{t('opportunities.detail.description')}</h3>
                  <p className="text-gray-700 leading-relaxed text-justify text-sm">{opportunity.description}</p>
                </div>

                {/* Features & Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 break-inside-avoid">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">{t('opportunities.detail.key_points')}</h3>
                        <ul className="space-y-3">
                        {opportunity.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                            </li>
                        ))}
                        </ul>
                    </div>
                     <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">{t('opportunities.detail.area_benefits')}</h3>
                        <ul className="space-y-3">
                        {opportunity.areaBenefits.map((benefit, index) => (
                            <li key={index} className="flex items-start">
                            <MapPin className="w-4 h-4 text-rentia-blue mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{benefit}</span>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
              </div>

              {/* Right Column: Property Summary & Media */}
              <div className="lg:col-span-1 space-y-6 print:w-full print:mt-8 print:grid print:grid-cols-2 print:gap-8 print:space-y-0">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm break-inside-avoid print:border-gray-300 print:shadow-none">
                        <h3 className="text-lg font-bold text-rentia-black font-display mb-4">{t('opportunities.detail.property_summary')}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2"><Bed className="w-5 h-5 text-rentia-blue"/><div><strong>{specs.rooms}</strong> {t('opportunities.card.rooms')}</div></div>
                            <div className="flex items-center gap-2"><Bath className="w-5 h-5 text-rentia-blue"/><div><strong>{specs.bathrooms}</strong> {t('opportunities.detail.bathrooms')}</div></div>
                            <div className="flex items-center gap-2"><Maximize className="w-5 h-5 text-rentia-blue"/><div><strong>{specs.sqm}</strong> m²</div></div>
                            <div className="flex items-center gap-2"><Building className="w-5 h-5 text-rentia-blue"/><div>{t('opportunities.card.floor')} <strong>{specs.floor}</strong></div></div>
                        </div>
                         <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm font-medium">
                            {specs.hasElevator ? 
                                <><Check className="w-4 h-4 text-green-600"/><span>{t('opportunities.detail.elevator')}</span></> : 
                                <><X className="w-4 h-4 text-red-600"/><span>{t('opportunities.detail.no_elevator')}</span></>
                            }
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                           <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{t('common.video_tour')}</h4>
                           {videos && videos.length > 0 ? (
                               <div className="text-sm text-green-600 flex items-center gap-2">
                                   <PlayCircle className="w-4 h-4" />
                                   {t('opportunities.detail.video_available')}
                               </div>
                           ) : (
                               <div className="text-sm text-gray-400">No disponible</div>
                           )}
                        </div>
                    </div>
                  
                    {/* Sidebar Gallery - Hidden in print (replaced by appendix) */}
                    <div className="no-print">
                        {driveFolder && (
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6">
                                <a 
                                    href={driveFolder}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-3 w-full bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700 font-bold py-3 rounded-xl transition-all border border-gray-200 hover:border-green-200"
                                >
                                     {/* Drive Icon SVG */}
                                    <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l32.3-56-4.75-8.3h-8.7c-2.6 0-5 .7-7.1 1.9l-18.8 32.7c-2.2 3.8-2.2 8.4 0 12.2l-.1.15h.1z" fill="#0066da"/>
                                        <path d="M43.65 25h-28.7c-2.2 3.8-2.2 8.3 0 12.1l18.8 32.6c.8 1.4 1.9 2.5 3.2 3.2l32.4-56.2h-7.65c-2.4.1-4.7.8-6.75 2l-11.3 6.3z" fill="#00ac47"/>
                                        <path d="M73.55 76.8c1.3-.7 2.4-1.8 3.2-3.2l10.55-18.2c2.2-3.8 2.2-8.4 0-12.2l-11.3-19.55-16.15-2.65-3.8-6.6-22.4 38.9 3.55 6.1c2.1 3.7 5.9 6 10.2 6.3h26.15z" fill="#ea4335"/>
                                        <path d="M43.65 25 29.35 0h8.7c4.3.3 8.1 2.6 10.2 6.3l11.3 19.55-15.9-.85z" fill="#00832d"/>
                                        <path d="M22.05 62.6 44.4 23.7l3.8 6.6-22.35 38.7c-4.3-.3-8.1-2.6-10.2-6.3L5.1 44.5c-.2-.4-.4-.8-.6-1.2l17.55 19.3z" fill="#2684fc"/>
                                        <path d="M76.75 73.6l-14.7-25.5 7.4-12.8 17.85 31c-2.1 3.7-5.9 6-10.2 6.3h-22.4l22.05-38.1z" fill="#ffba00"/>
                                    </svg>
                                    Ver Carpeta Drive Completa
                                    <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
                                </a>
                                <p className="text-[10px] text-gray-400 text-center mt-2">Acceso a todas las fotos y videos originales</p>
                            </div>
                        )}

                        {(hasRealImages || (videos && videos.length > 0)) && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm sidebar-gallery">
                            <h3 className="text-lg font-bold text-rentia-black font-display mb-4">{t('opportunities.detail.multimedia')}</h3>
                            
                            {/* VIDEO SECTION PRESERVED */}
                            {videos && videos.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><PlayCircle className="w-3 h-3"/> {t('common.video_tour')}</h4>
                                    <div className="rounded-lg overflow-hidden bg-black aspect-video shadow-md relative">
                                        <video controls className="w-full h-full object-cover" poster={images[0]}>
                                            <source src={videos[0]} type="video/mp4" />
                                            Tu navegador no soporta video.
                                        </video>
                                    </div>
                                </div>
                            )}

                            {/* PHOTO PREVIEW */}
                            {hasRealImages && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">{t('common.photos')}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                    {images.slice(0, 4).map((img, index) => (
                                        <div key={index} className="relative aspect-square group rounded-lg overflow-hidden cursor-zoom-in border border-gray-100" onClick={() => openLightbox(index)}>
                                            <img src={img} alt={`Vista ${index + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                                        </div>
                                    ))}
                                    </div>
                                    <button onClick={() => openLightbox(0)} className="w-full mt-3 text-xs text-rentia-blue font-bold hover:underline p-3 border border-transparent hover:border-gray-100 rounded touch-manipulation">
                                        {t('opportunities.detail.see_all')} ({images.length})
                                    </button>
                                </div>
                            )}
                        </div>
                        )}
                    </div>
              </div>
            </div>

            {/* PRINT ONLY: GALLERY APPENDIX */}
            <div className="hidden print:block mt-8 pt-8 border-t border-gray-200 break-before-page">
                <h2 className="text-lg font-bold mb-4 font-display uppercase text-rentia-black border-b border-gray-200 pb-2">{t('opportunities.detail.appendix')}</h2>
                <div className="grid grid-cols-2 gap-4">
                    {opportunity.images.map((img, index) => (
                        !img.includes('placeholder') && (
                            <div key={index} className="break-inside-avoid page-break-inside-avoid border border-gray-100 rounded p-1">
                                <img src={img} className="w-full h-64 object-cover rounded-sm" alt={`Foto ${index + 1}`} />
                            </div>
                        )
                    ))}
                </div>
                <div className="mt-8 border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
                    <p>{t('opportunities.detail.confidential')}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
      {isLightboxOpen && <ImageLightbox images={images} selectedIndex={selectedImageIndex} onClose={() => setIsLightboxOpen(false)} />}
    </>
  );
};