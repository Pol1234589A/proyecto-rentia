"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Opportunity } from '../types';
import { ArrowLeft, Check, MapPin, TrendingUp, Bed, Maximize, Building, Bath, ChevronLeft, ChevronRight, ExternalLink, Home, PlusCircle, MessageCircle, Phone, Scale, AlertTriangle, ChevronDown, Loader2, Wallet, PiggyBank } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';
import { useLanguage } from '../contexts/LanguageContext';
import { ContactLeadModal } from './ContactLeadModal';
import { calculateOpportunityFinancials, CONSTANTS } from '../utils/financials';

interface Props {
    opportunity: Opportunity;
    onBack: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasNext: boolean;
    hasPrev: boolean;
    onNavigate?: (view: string) => void;
}

type RentalStrategy = 'rooms' | 'traditional';

const GalleryThumbnail: React.FC<{ src: string, index: number, onClick: () => void, totalImages: number }> = ({ src, index, onClick, totalImages }) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div
            className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group bg-gray-100 border border-gray-200"
            onClick={onClick}
        >
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt={`Preview ${index}`}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
            />
            {loaded && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>}
            {index === 5 && totalImages > 6 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm backdrop-blur-[1px]">
                    +{totalImages - 6}
                </div>
            )}
        </div>
    );
};

export const DetailView: React.FC<Props> = ({ opportunity, onBack, onNext, onPrev, hasNext, hasPrev }) => {
    const { specs, images, scenario, tags } = opportunity;
    const { t } = useLanguage();

    // --- FINANCIAL CALCULATION (CENTRALIZED) ---
    const financials = useMemo(() => calculateOpportunityFinancials(opportunity), [opportunity]);

    const [rentalStrategy, setRentalStrategy] = useState<RentalStrategy>(
        financials.monthlyIncome > 0 ? 'rooms' : 'traditional'
    );
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [includeManagementFee, setIncludeManagementFee] = useState(false);
    const [rentLivingRoom, setRentLivingRoom] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showLegal, setShowLegal] = useState(false);

    const isLivingScenario = scenario === 'sale_living';
    const isCashflowFocused = tags.some(tag => tag.toLowerCase().includes('cashflow'));

    // Logic to lock strategy if explicitly traditional and no room income data
    const isLockedToTraditional = opportunity.scenario === 'rent_traditional' && (!opportunity.financials.monthlyRentProjected || opportunity.financials.monthlyRentProjected === 0);

    // SEO
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
                "price": financials.purchasePrice,
                "availability": opportunity.status === 'available' ? "https://schema.org/InStock" : "https://schema.org/SoldOut"
            }
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(jsonLd);
        document.head.appendChild(script);
        return () => { document.head.removeChild(script); };
    }, [opportunity, financials]);

    useEffect(() => {
        // Force traditional if locked
        if (opportunity.scenario === 'rent_traditional' && (!opportunity.financials.monthlyRentProjected || opportunity.financials.monthlyRentProjected === 0)) {
            setRentalStrategy('traditional');
        } else if (financials.monthlyIncome > 0) {
            setRentalStrategy('rooms');
        } else {
            setRentalStrategy('traditional');
        }
        setIncludeManagementFee(false);
        setRentLivingRoom(false);
        setShowLegal(false);
        window.scrollTo(0, 0);

        if (opportunity.images && opportunity.images.length > 0) {
            opportunity.images.forEach((src) => {
                const img = new Image();
                img.src = src;
            });
        }
    }, [opportunity.id, opportunity.images, financials, opportunity.scenario]);

    const openLightbox = (index: number) => {
        setSelectedImageIndex(index);
        setIsLightboxOpen(true);
    };

    const hasRealImages = images.length > 0 && !images[0].includes('placeholder');

    // --- RENDER LOGIC FOR DYNAMIC VALUES ---
    const isRoomsStrategy = rentalStrategy === 'rooms';

    // Extra calculation for Living Room toggle within component
    const averageRoomPrice = opportunity.roomConfiguration?.length
        ? Math.round(opportunity.roomConfiguration.reduce((acc, r) => acc + r.price, 0) / opportunity.roomConfiguration.length)
        : 300;

    const incomeFromLivingRoom = (isRoomsStrategy && rentLivingRoom) ? averageRoomPrice : 0;

    // Recalculate Monthly Income based on Strategy Selection & Toggle
    const baseMonthlyIncome = rentalStrategy === 'rooms'
        ? (opportunity.financials.monthlyRentProjected || 0)
        : (opportunity.financials.monthlyRentTraditional || 0);

    const displayMonthlyIncome = baseMonthlyIncome + incomeFromLivingRoom;

    const managementFeePercentage = isRoomsStrategy ? CONSTANTS.MANAGEMENT_FEE_ROOMS : CONSTANTS.MANAGEMENT_FEE_TRADITIONAL;
    const calculatedManagementFee = displayMonthlyIncome * managementFeePercentage;
    const calculatedIvaOnFee = calculatedManagementFee * CONSTANTS.VAT_RATE;

    const managementFeeToSubtract = includeManagementFee ? calculatedManagementFee : 0;
    const ivaToSubtract = includeManagementFee ? calculatedIvaOnFee : 0;

    const monthlyExpenses = financials.yearlyExpenses / 12;
    const netMonthlyIncome = displayMonthlyIncome - monthlyExpenses - managementFeeToSubtract - ivaToSubtract;
    const netYearlyIncome = netMonthlyIncome * 12;

    // Dynamic Yield Calculations (Live Update)
    const dynamicGrossYield = financials.totalInvestment > 0
        ? ((displayMonthlyIncome * 12) / financials.totalInvestment) * 100
        : 0;

    const dynamicNetYield = financials.totalInvestment > 0
        ? (netYearlyIncome / financials.totalInvestment) * 100
        : 0;

    const fiveYearCashflow = netYearlyIncome * 5;

    const publicAddress = opportunity.address.replace(/\d+/g, '').replace(/,/, '').trim();

    return (
        <>
            <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 animate-in fade-in duration-500 print:p-0 print:max-w-none print:bg-white">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 print:shadow-none print:border-none print:rounded-none relative">

                    {/* ... HEADER CODE UNCHANGED ... */}
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

                    <div className="p-4 sm:p-6 md:p-8 print:p-8 print:pt-2 pb-24 md:pb-8">

                        {/* Title for Print */}
                        <div className="hidden print:block mb-6">
                            <h1 className="text-2xl font-bold font-display text-rentia-black leading-tight mb-2">{opportunity.title}</h1>
                            <div className="flex items-center text-gray-500 text-sm border-b border-gray-100 pb-4">
                                <MapPin className="w-4 h-4 mr-1.5" />
                                {opportunity.city} - {publicAddress}
                            </div>
                        </div>

                        {/* --- KPI DASHBOARD (UPDATED) --- */}
                        {!isLivingScenario ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 print:gap-4 break-inside-avoid">
                                {/* 1. Rentabilidad Neta */}
                                <div className="bg-green-50 p-3 sm:p-4 rounded-xl border-2 border-green-200 text-center flex flex-col justify-center print:border-green-300">
                                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-800 mb-1">{t('opportunities.detail.net_yield')}</h4>
                                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700 font-display break-words">{dynamicNetYield.toFixed(2)}%</p>
                                </div>

                                {/* 2. Ingreso Mensual Neto */}
                                <div className={`p-3 sm:p-4 rounded-xl border-2 text-center flex flex-col justify-center transition-all ${isCashflowFocused ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-300 shadow-md transform scale-[1.02]' : 'bg-blue-50 border-blue-200'} print:border-blue-300`}>
                                    <h4 className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1 ${isCashflowFocused ? 'text-indigo-800' : 'text-blue-800'}`}>
                                        {isCashflowFocused && <Wallet className="w-3 h-3" />}
                                        {t('opportunities.detail.net_monthly')}
                                    </h4>
                                    <p className={`text-xl sm:text-2xl lg:text-3xl font-bold font-display break-words ${isCashflowFocused ? 'text-indigo-700' : 'text-rentia-blue'}`}>
                                        {netMonthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                                    </p>
                                </div>

                                {/* 3. Inversión Total */}
                                <div className="bg-yellow-50 p-3 sm:p-4 rounded-xl border border-yellow-200 text-center flex flex-col justify-center print:border-yellow-300">
                                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-yellow-800 mb-1">{t('opportunities.card.total_investment')}</h4>
                                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-rentia-black font-display break-words">{financials.totalInvestment.toLocaleString('es-ES')} €</p>
                                </div>

                                {/* 4. Gross Yield / Projection */}
                                {isCashflowFocused ? (
                                    <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-3 sm:p-4 rounded-xl border border-slate-700 text-center flex flex-col justify-center text-white relative overflow-hidden shadow-lg">
                                        <div className="absolute top-0 right-0 w-12 h-12 bg-rentia-gold/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                                        <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rentia-gold mb-1 flex items-center justify-center gap-1 relative z-10">
                                            <PiggyBank className="w-3 h-3" /> Proyección 5 Años
                                        </h4>
                                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-display break-words relative z-10">
                                            +{fiveYearCashflow.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €
                                        </p>
                                        <p className="text-[9px] text-gray-400 relative z-10 mt-1">Cashflow Neto Acum.</p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 p-3 sm:p-4 rounded-xl border border-gray-200 text-center flex flex-col justify-center">
                                        <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t('opportunities.detail.gross_yield')}</h4>
                                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-700 font-display break-words">{dynamicGrossYield.toFixed(2)}%</p>
                                    </div>
                                )}
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
                                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">Impuestos ITP</span><span className="font-bold">{financials.itpAmount.toLocaleString('es-ES')} €</span></div>
                                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">Reforma y Mobiliario</span><span className="font-bold">{financials.reformTotal.toLocaleString('es-ES')} €</span></div>
                                        <div className="flex justify-between items-baseline"><span className="text-sm text-gray-600">Notaría y Registro (Est.)</span><span className="font-bold">{(financials.notaryAndTaxes - financials.itpAmount).toLocaleString('es-ES')} €</span></div>

                                        {/* Agency Fee Line */}
                                        <div className="flex justify-between items-baseline text-rentia-blue">
                                            <span className="text-sm font-medium">{t('opportunities.detail.agency_fees')}</span>
                                            <span className="font-bold">{financials.agencyFeesTotal.toLocaleString('es-ES')} €</span>
                                        </div>

                                        <div className="bg-rentia-gold/30 p-3 rounded-lg flex justify-between items-center mt-3 print:bg-gray-100 print:border print:border-gray-300">
                                            <span className="font-bold text-rentia-black">{t('opportunities.card.total_investment')}</span>
                                            <span className="font-bold text-lg sm:text-xl text-rentia-black">{financials.totalInvestment.toLocaleString('es-ES')} €</span>
                                        </div>
                                    </div>

                                    {/* RENTAL ANALYSIS */}
                                    {!isLivingScenario && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 no-print">
                                                {/* Strategy Selector (HIDDEN IF LOCKED) */}
                                                {!isLockedToTraditional && (
                                                    <div>
                                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block">{t('opportunities.detail.strategy')}</label>
                                                        <div className="grid grid-cols-2 gap-2 bg-gray-200 p-1 rounded-lg h-12">
                                                            <button onClick={() => setRentalStrategy('rooms')} className={`flex items-center justify-center px-2 text-sm font-semibold rounded-md transition-all touch-manipulation ${rentalStrategy === 'rooms' ? 'bg-white shadow text-rentia-blue' : 'text-gray-600 hover:bg-white/50'}`}>{t('opportunities.detail.rooms_strategy')}</button>
                                                            <button onClick={() => setRentalStrategy('traditional')} className={`flex items-center justify-center px-2 text-sm font-semibold rounded-md transition-all touch-manipulation ${rentalStrategy === 'traditional' ? 'bg-white shadow text-rentia-blue' : 'text-gray-600 hover:bg-white/50'}`}>{t('opportunities.detail.traditional_strategy')}</button>
                                                        </div>
                                                        {isRoomsStrategy && !opportunity.disableLivingRoomExpansion && (
                                                            <div className="mt-3 flex items-center justify-between bg-white p-2 rounded border border-purple-100 shadow-sm animate-in slide-in-from-top-1">
                                                                <span className="text-[10px] font-bold text-purple-700 flex items-center gap-1">
                                                                    <PlusCircle className="w-3 h-3" /> +1 Hab (Salón)
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
                                                    <span className="font-bold text-green-600">+{displayMonthlyIncome} €</span>
                                                </div>

                                                {/* Room Breakdown */}
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

                                {/* DESCRIPTION & FEATURES (Unchanged) */}
                                <div className="break-inside-avoid">
                                    <h3 className="text-xl font-bold font-display text-rentia-black mb-4 border-b border-gray-100 pb-2">{t('opportunities.detail.description')}</h3>
                                    <div
                                        className="text-gray-600 leading-relaxed text-justify mb-8 text-sm whitespace-pre-line"
                                        dangerouslySetInnerHTML={{ __html: opportunity.description }}
                                    />

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

                                {/* Legal Section */}
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
                                            <p className="mb-2">Rentia Investments S.L. facilita la presente información con carácter meramente estimativo...</p>
                                            <div className="flex items-start gap-2 bg-white p-3 rounded border border-red-100 text-red-800 font-medium">
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                <p>Cualquier intento de elusión devengará penalización...</p>
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
                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Bed className="w-4 h-4" /> {t('opportunities.card.rooms')}</span>
                                            <span className="font-bold text-rentia-black">{specs.rooms}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Bath className="w-4 h-4" /> {t('opportunities.detail.bathrooms')}</span>
                                            <span className="font-bold text-rentia-black">{specs.bathrooms}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Maximize className="w-4 h-4" /> m²</span>
                                            <span className="font-bold text-rentia-black">{specs.sqm}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Building className="w-4 h-4" /> {t('opportunities.card.floor')}</span>
                                            <span className="font-bold text-rentia-black">{specs.floor}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Media Gallery */}
                                <div className="bg-white p-6 rounded-2xl shadow-idealista border border-gray-100 print:hidden">
                                    <h3 className="text-lg font-bold font-display text-rentia-black mb-4 flex items-center gap-2">
                                        <Building className="w-5 h-5 text-rentia-gold" />
                                        {t('opportunities.detail.multimedia')}
                                    </h3>
                                    {hasRealImages ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {images.slice(0, 6).map((img, idx) => (
                                                <GalleryThumbnail
                                                    key={idx}
                                                    src={img}
                                                    index={idx}
                                                    onClick={() => openLightbox(idx)}
                                                    totalImages={images.length}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                            <p className="text-gray-500 text-sm">Fotos disponibles bajo petición</p>
                                        </div>
                                    )}
                                </div>

                                {/* Lead Magnet */}
                                <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl shadow-xl text-white text-center relative overflow-hidden no-print">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-rentia-gold/20 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                                    <h3 className="text-lg font-bold font-display mb-2 relative z-10">¿Te interesa este activo?</h3>
                                    <p className="text-gray-400 text-xs mb-6 relative z-10">Solicita el dossier completo.</p>
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

            {isLightboxOpen && (
                <ImageLightbox
                    images={images}
                    selectedIndex={selectedImageIndex}
                    onClose={() => setIsLightboxOpen(false)}
                />
            )}

            <ContactLeadModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                opportunityId={opportunity.id}
                opportunityTitle={opportunity.title}
            />
        </>
    );
};
