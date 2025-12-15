
import React, { useState, useEffect } from 'react';
import { Opportunity } from '../types';
import { ArrowLeft, Check, MapPin, Users, TrendingUp, Bed, Maximize, Building, Bath, X, Settings, ChevronLeft, ChevronRight, PlayCircle, ExternalLink, Home, PlusCircle, MessageCircle, Phone, Mail, Scale, AlertTriangle, ChevronDown } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';
import { useLanguage } from '../contexts/LanguageContext';
import { ContactLeadModal } from './ContactLeadModal';

interface Props {
  opportunity: Opportunity;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  onNavigate: (view: 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts' | 'blog') => void;
}

type RentalStrategy = 'rooms' | 'traditional';

export const DetailView: React.FC<Props> = ({ opportunity, onBack, onNext, onPrev, hasNext, hasPrev, onNavigate }) => {
  const { financials, specs, images, videos, driveFolder, scenario } = opportunity;
  const { t } = useLanguage();
  
  // State
  const [rentalStrategy, setRentalStrategy] = useState<RentalStrategy>(
    financials.monthlyRentProjected > 0 ? 'rooms' : 'traditional'
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [includeManagementFee, setIncludeManagementFee] = useState(false);
  const [rentLivingRoom, setRentLivingRoom] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  
  // Check if scenario is meant for living (not investment)
  const isLivingScenario = scenario === 'sale_living';

  // --- SEO INJECTION ---
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": opportunity.title,
      "description": opportunity.description,
      "image": opportunity.images,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "price": opportunity.financials.purchasePrice,
        "availability": opportunity.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/SoldOut"
      }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [opportunity]);

  useEffect(() => {
    // Reset states on opportunity change
    if (opportunity.financials.monthlyRentProjected > 0) {
        setRentalStrategy('rooms');
    } else {
        setRentalStrategy('traditional');
    }
    setIncludeManagementFee(false);
    setRentLivingRoom(false);
    setShowLegal(false);
    window.scrollTo(0, 0);

    // --- PRECARGA DE IMÁGENES (Image Preloading) ---
    // Esto fuerza al navegador a descargar TODAS las fotos en cuanto se abre la ficha
    // para que la navegación en el lightbox sea instantánea.
    if (opportunity.images && opportunity.images.length > 0) {
        opportunity.images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }
  }, [opportunity.id, opportunity.images, opportunity.financials]);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const hasRealImages = images.length > 0 && !images[0].includes('placeholder');

  // --- CALCULATIONS ---
  const purchasePrice = financials.purchasePrice;
  
  // ITP Logic: Use specific percent if available, else default to 8% (Murcia)
  const itpPercent = financials.itpPercent || 8;
  const itpAmount = purchasePrice * (itpPercent / 100);

  // Agency Fees
  const agencyFeeBase = financials.agencyFees !== undefined 
      ? financials.agencyFees 
      : (purchasePrice > 100000 ? purchasePrice * 0.03 : 3000);
      
  const agencyFeeTotal = agencyFeeBase * 1.21; 

  // Total Investment
  const finalTotalInvestment = financials.totalInvestment + agencyFeeTotal;

  // Yields
  const isRoomsStrategy = rentalStrategy === 'rooms';
  
  // Logic for Living Room Conversion
  const averageRoomPrice = opportunity.roomConfiguration?.length 
      ? Math.round(opportunity.roomConfiguration.reduce((acc, r) => acc + r.price, 0) / opportunity.roomConfiguration.length)
      : 300;
  
  const incomeFromLivingRoom = (isRoomsStrategy && rentLivingRoom) ? averageRoomPrice : 0;

  const monthlyIncome = isRoomsStrategy 
      ? financials.monthlyRentProjected + incomeFromLivingRoom
      : financials.monthlyRentTraditional;
      
  const effectiveMonthlyIncome = monthlyIncome > 0 ? monthlyIncome : 0;

  const managementFeePercentage = isRoomsStrategy ? 0.15 : 0.10; 
  const calculatedManagementFee = effectiveMonthlyIncome * managementFeePercentage;
  const calculatedIvaOnFee = calculatedManagementFee * 0.21;

  const managementFeeToSubtract = includeManagementFee ? calculatedManagementFee : 0;
  const ivaToSubtract = includeManagementFee ? calculatedIvaOnFee : 0;

  const monthlyExpenses = financials.yearlyExpenses / 12;
  const netMonthlyIncome = effectiveMonthlyIncome - monthlyExpenses - managementFeeToSubtract - ivaToSubtract;
  const netYearlyIncome = netMonthlyIncome * 12;

  const grossYield = (effectiveMonthlyIncome * 12 / finalTotalInvestment) * 100;
  const netYield = (netYearlyIncome / finalTotalInvestment) * 100;

  return (
    <>
      <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 animate-in fade-in duration-500 print:p-0 print:max-w-none print:bg-white">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 print:shadow-none print:border-none print:rounded-none relative">
          
          {/* WEB HEADER (Sticky) */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-4 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print rounded-t-2xl shadow-sm">
            <div className="w-full md:w-auto">
              <button onClick={onBack} className="flex items-center text-rentia-blue hover:underline text-sm font-semibold mb-3 p-2 -ml-2 rounded-lg hover:bg-gray-50 touch-manipulation">
                <ArrowLeft className="w-5 h-5 mr-1" />
                {t('opportunities.detail.back')}
              </button>
              <h1 className="text-xl md:text-2xl font-bold font-display text-rentia-black leading-tight w-full md:max-w-lg break-words">
                {opportunity.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-end mt-2 md:mt-0">
              <div className="flex gap-2">
                <button onClick={onPrev} disabled={!hasPrev} className="nav-controls p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button onClick={onNext} disabled={!hasNext} className="nav-controls p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-200"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="p-4 sm:p-6 md:p-8 print:p-8 print:pt-2 pb-24 md:pb-8">
            
            {/* Title for Print */}
            <div className="hidden print:block mb-6">
                 <h1 className="text-2xl font-bold font-display text-rentia-black leading-tight mb-2">{opportunity.title}</h1>
                 <div className="flex items-center text-gray-500 text-sm border-b border-gray-100 pb-4">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {opportunity.city} - {opportunity.address}
                 </div>
            </div>

            {/* --- KPI DASHBOARD (Conditional for Living) --- */}
            {!isLivingScenario ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 print:gap-4 break-inside-avoid">
                    <div className="bg-green-50 p-3 sm:p-4 rounded-xl border-2 border-green-200 text-center flex flex-col justify-center print:border-green-300">
                        <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-800 mb-1">{t('opportunities.detail.net_yield')}</h4>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700 font-display break-words">{netYield.toFixed(2)}%</p>
                    </div>
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200 text-center flex flex-col justify-center print:border-blue-300">
                        <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-800 mb-1">{t('opportunities.detail.net_monthly')}</h4>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-rentia-blue font-display break-words">{netMonthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €</p>
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
            ) : (
                <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center flex flex-col justify-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Precio de Venta</h4>
                        <p className="text-4xl font-bold text-rentia-black font-display">{financials.purchasePrice.toLocaleString('es-ES')} €</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 text-center flex flex-col justify-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">Precio / m²</h4>
                        <p className="text-4xl font-bold text-rentia-blue font-display">{(financials.purchasePrice / specs.sqm).toFixed(0)} €/m²</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 print:block">
              
              {/* Left Column: Financials & Details */}
              <div className="lg:col-span-2 space-y-8 print:w-full print:mb-8">
                
                {/* FINANCIAL ANALYSIS CARD */}
                <div className="bg-gray-50/80 p-4 sm:p-6 rounded-2xl border border-gray-200/80 print:bg-white print:border-gray-300 break-inside-avoid">
                    <h2 className="text-lg sm:text-xl font-bold text-rentia-black font-display mb-6 flex flex-wrap items-center justify-between gap-2">
                        {isLivingScenario ? 'Desglose de Costes' : t('opportunities.detail.financial_study')}
                        <span className="text-[10px] font-normal bg-white px-2 py-1 rounded border border-gray-200 text-gray-500 inline-block print:hidden whitespace-nowrap">
                            {t('opportunities.detail.includes_fees')}
                        </span>
                    </h2>

                    {/* Investment Breakdown */}
                    <div className="space-y-3 mb-6 border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">{t('opportunities.detail.investment_breakdown')}</h3>
                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">{t('opportunities.card.purchase_price')}</span><span className="font-bold">{financials.purchasePrice.toLocaleString('es-ES')} €</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">Impuestos ITP ({itpPercent}%)</span><span className="font-bold">{itpAmount.toLocaleString('es-ES')} €</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">Reforma y Mobiliario</span><span className="font-bold">{(financials.reformCost + financials.furnitureCost).toLocaleString('es-ES')} €</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">Notaría y Registro (Est.)</span><span className="font-bold">{financials.notaryAndTaxes - itpAmount > 0 ? (financials.notaryAndTaxes - itpAmount).toLocaleString('es-ES') : '1.500'} €</span></div>
                        
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

                    {/* RENTAL ANALYSIS (Hidden if Living Scenario) */}
                    {!isLivingScenario && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 no-print">
                            {/* Strategy Selector */}
                            {financials.monthlyRentProjected > 0 && financials.monthlyRentTraditional > 0 ? (
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block">{t('opportunities.detail.strategy')}</label>
                                    <div className="grid grid-cols-2 gap-2 bg-gray-200 p-1 rounded-lg h-12">
                                        <button onClick={() => setRentalStrategy('rooms')} className={`flex items-center justify-center px-2 text-sm font-semibold rounded-md transition-all touch-manipulation ${rentalStrategy === 'rooms' ? 'bg-white shadow text-rentia-blue' : 'text-gray-600 hover:bg-white/50'}`}>{t('opportunities.detail.rooms_strategy')}</button>
                                        <button onClick={() => setRentalStrategy('traditional')} className={`flex items-center justify-center px-2 text-sm font-semibold rounded-md transition-all touch-manipulation ${rentalStrategy === 'traditional' ? 'bg-white shadow text-rentia-blue' : 'text-gray-600 hover:bg-white/50'}`}>{t('opportunities.detail.traditional_strategy')}</button>
                                    </div>
                                    
                                    {isRoomsStrategy && (
                                        <div className="mt-3 flex items-center justify-between bg-white p-2 rounded border border-purple-100 shadow-sm animate-in slide-in-from-top-1">
                                            <span className="text-[10px] font-bold text-purple-700 flex items-center gap-1">
                                                <PlusCircle className="w-3 h-3"/> +1 Hab (Salón)
                                            </span>
                                            <button 
                                                onClick={() => setRentLivingRoom(!rentLivingRoom)}
                                                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${rentLivingRoom ? 'bg-purple-600' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${rentLivingRoom ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block">{t('opportunities.detail.strategy')}</label>
                                    <div className="flex items-center justify-center bg-gray-100 rounded-lg h-12 text-sm font-bold text-gray-500 border border-gray-200">
                                        {financials.monthlyRentProjected > 0 ? t('opportunities.detail.rooms_strategy') : t('opportunities.detail.traditional_strategy')}
                                    </div>
                                    {isRoomsStrategy && (
                                        <div className="mt-3 flex items-center justify-between bg-white p-2 rounded border border-purple-100 shadow-sm animate-in slide-in-from-top-1">
                                            <span className="text-[10px] font-bold text-purple-700 flex items-center gap-1">
                                                <PlusCircle className="w-3 h-3"/> +1 Hab (Salón)
                                            </span>
                                            <button 
                                                onClick={() => setRentLivingRoom(!rentLivingRoom)}
                                                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${rentLivingRoom ? 'bg-purple-600' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${rentLivingRoom ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>
                                    )}
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
                            
                            {/* Room Price Breakdown (Only if rooms strategy and data exists) */}
                            {isRoomsStrategy && opportunity.roomConfiguration && (
                                <div className="pl-4 border-l-2 border-gray-200 my-2 space-y-1">
                                    {opportunity.roomConfiguration.map((r, i) => (
                                        <div key={i} className="flex justify-between text-xs text-gray-500">
                                            <span>{r.name}</span>
                                            <span>{r.price} €</span>
                                        </div>
                                    ))}
                                    {rentLivingRoom && (
                                        <div className="flex justify-between text-xs text-purple-600 font-bold bg-purple-50 p-1 rounded">
                                            <span>Salón (Hab Extra)</span>
                                            <span>{averageRoomPrice} €</span>
                                        </div>
                                    )}
                                </div>
                            )}

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
                    </>
                    )}
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
                </div>

                {/* LEGAL SECTION (Collapsible) */}
                <div className="mt-8 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden break-inside-avoid transition-all duration-300">
                    <button 
                        onClick={() => setShowLegal(!showLegal)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-200/50 transition-colors group"
                    >
                        <h5 className="font-bold text-slate-700 uppercase flex items-center gap-2 text-sm group-hover:text-rentia-blue">
                            <Scale className="w-4 h-4" /> AVISO LEGAL Y CONDICIONES
                        </h5>
                        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${showLegal ? 'rotate-180' : ''}`} />
                    </button>

                    {showLegal && (
                        <div className="px-6 pb-6 text-xs text-slate-500 text-justify leading-relaxed animate-in slide-in-from-top-1 border-t border-slate-200 pt-4">
                            <p className="mb-2">
                                Rentia Investments S.L. facilita la presente información con carácter meramente estimativo y orientativo. Los datos financieros son proyecciones y no constituyen garantía contractual. No nos hacemos responsables de variaciones, errores u omisiones.
                            </p>
                            <p className="mb-2">
                                Al contactar sobre este activo, el interesado reconoce la intermediación de Rentia Investments S.L. En caso de que el activo pertenezca a un colaborador, el interesado se obliga a <strong>no contactar ni negociar directamente con la propiedad</strong> eludiendo a esta agencia.
                            </p>
                            <div className="flex items-start gap-2 bg-white p-3 rounded border border-red-100 text-red-800 font-medium">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>Cualquier intento de elusión o engaño devengará automáticamente a favor de Rentia Investments S.L. una penalización equivalente a la comisión de intermediación (3% + IVA, mín. 3.000€ + IVA), reclamable ante los Juzgados de Murcia.</p>
                            </div>
                        </div>
                    )}
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
                         {isLivingScenario && (
                             <div className="flex items-center justify-center p-3 bg-purple-50 rounded-lg text-purple-700 font-bold text-sm mb-2">
                                 <Home className="w-4 h-4 mr-2" /> Ideal Vivienda Habitual
                             </div>
                         )}
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
                         <Building className="w-5 h-5 text-rentia-gold" />
                         {t('opportunities.detail.multimedia')}
                     </h3>
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

                 {/* Lead Magnet Card (New) */}
                 <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl shadow-xl text-white text-center relative overflow-hidden no-print">
                     <div className="absolute top-0 right-0 w-20 h-20 bg-rentia-gold/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                     
                     <h3 className="text-lg font-bold font-display mb-2 relative z-10">¿Te interesa este activo?</h3>
                     <p className="text-gray-400 text-xs mb-6 relative z-10">Solicita el dossier completo y resuelve tus dudas con nuestro equipo de inversión.</p>
                     
                     <button 
                         onClick={() => setShowContactModal(true)}
                         className="w-full bg-rentia-gold text-rentia-black font-bold py-3.5 px-6 rounded-xl hover:bg-yellow-400 transition-all shadow-lg flex items-center justify-center gap-2 relative z-10"
                     >
                         <MessageCircle className="w-5 h-5" />
                         Solicitar Información
                     </button>
                 </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY CTA BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-[60] md:hidden flex gap-3 print:hidden safe-area-bottom animate-in slide-in-from-bottom-2">
          <button 
              onClick={() => setShowContactModal(true)}
              className="flex-1 bg-rentia-black text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-gray-800"
          >
              <MessageCircle className="w-5 h-5 text-rentia-gold fill-current" />
              Solicitar Información
          </button>
          <a 
            href={`https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20me%20interesa%20la%20oportunidad%20${opportunity.id}%20(${encodeURIComponent(opportunity.title)})`}
            target="_blank"
            rel="noreferrer"
            className="w-14 bg-[#25D366] text-white rounded-xl shadow-lg flex items-center justify-center active:scale-[0.98] transition-transform hover:bg-[#20ba5c]"
            aria-label="WhatsApp"
          >
              <Phone className="w-6 h-6" />
          </a>
      </div>

      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <ImageLightbox 
            images={images} 
            selectedIndex={selectedImageIndex} 
            onClose={() => setIsLightboxOpen(false)} 
        />
      )}
      
      {/* Contact Modal Overlay */}
      <ContactLeadModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)}
        opportunityId={opportunity.id}
        opportunityTitle={opportunity.title}
    />
    </>
  );
};
