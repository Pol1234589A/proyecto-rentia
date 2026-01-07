"use client";

import React, { useState, useMemo } from 'react';
import { Opportunity } from '../types';
import { OpportunityCard } from './OpportunityCard';
import { useLanguage } from '../contexts/LanguageContext';
import { TrendingUp, Phone, Mail, Globe, Lock, ChevronDown, Check, Filter, Search, X, Calendar, ArrowRight } from 'lucide-react';

interface LandingViewProps {
    opportunities: Opportunity[];
    onClick: (id: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ opportunities, onClick }) => {
    const { t } = useLanguage();
    const [filterYield, setFilterYield] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0);
    const [showFilters, setShowFilters] = useState(false);

    const handleScrollToGrid = () => {
        document.getElementById('opp-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Filter Logic
    const filteredOpps = useMemo(() => {
        return opportunities.filter(opp => {
            // Calculate Yield
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

            // Apply filters
            if (filterYield > 0 && grossYield < filterYield) return false;
            if (maxPrice > 0 && opp.financials.purchasePrice > maxPrice) return false;

            return true;
        });
    }, [opportunities, filterYield, maxPrice]);

    const activeFilters = (filterYield > 0 ? 1 : 0) + (maxPrice > 0 ? 1 : 0);

    // URL del calendario público de RentiaRoom
    const calendarUrl = "https://calendar.google.com/calendar/embed?src=rentiaroom%40gmail.com&ctz=UTC";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

            {/* Minimal Sticky Header for Subdomain */}
            <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a href="#/" className="block">
                            <img
                                src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png"
                                alt="RentiaRoom"
                                className="h-8 w-auto object-contain filter invert"
                            />
                        </a>
                        <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                        <span className="hidden sm:block text-slate-500 text-xs font-bold tracking-widest uppercase">Investment Portfolio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href={calendarUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden md:flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Calendar className="w-3 h-3" /> Agendar Reunión
                        </a>
                        <a
                            href="https://www.rentiaroom.com"
                            className="text-xs font-bold text-slate-600 hover:text-rentia-blue transition-colors flex items-center gap-1 border border-slate-200 px-3 py-2 rounded-lg"
                        >
                            <Globe className="w-3 h-3" /> <span className="hidden sm:inline">Web Corporativa</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero Section - Dossier Style */}
            <section className="bg-slate-900 text-white pt-20 pb-24 md:pt-32 md:pb-40 relative overflow-hidden">
                {/* Abstract Geometric Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rentia-blue/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rentia-gold/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 max-w-4xl text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 rounded-full mb-8 shadow-lg shadow-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Lock className="w-3 h-3 text-rentia-gold" />
                        <span className="text-xs font-bold tracking-widest uppercase text-gray-200">Acceso Exclusivo Inversores</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
                        Cartera de Activos <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rentia-gold to-white">High Yield Murcia</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                        Selección curada de oportunidades inmobiliarias con rentabilidades proyectadas superiores al <strong>8%</strong>.
                        Gestión integral 360º incluida.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                        <button
                            onClick={handleScrollToGrid}
                            className="bg-white text-slate-900 px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-white/10"
                        >
                            Ver Oportunidades
                            <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Trust Indicators Bar */}
            <div className="bg-white border-b border-gray-200 py-4 relative z-20 -mt-8 mx-4 sm:mx-auto max-w-5xl rounded-xl shadow-lg flex justify-around items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
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
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 font-display">Oportunidades Disponibles</h2>
                        <p className="text-sm text-gray-500 mt-1">Actualizado en tiempo real</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 ${showFilters ? 'ring-2 ring-rentia-blue/20 border-rentia-blue' : ''}`}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 hover:text-rentia-black transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                Filtros
                                {activeFilters > 0 && <span className="bg-rentia-black text-white text-[10px] px-1.5 rounded-full">{activeFilters}</span>}
                            </button>
                        </div>
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-2 rounded-lg">
                            {filteredOpps.length} Activos
                        </span>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Filtrar Inversiones</h3>
                            <button onClick={() => { setFilterYield(0); setMaxPrice(0); }} className="text-xs text-rentia-blue font-bold hover:underline">Limpiar todo</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Rentabilidad Bruta Mínima</label>
                                <div className="flex gap-2">
                                    {[0, 7, 8, 9, 10].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setFilterYield(val)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${filterYield === val ? 'bg-rentia-black text-white border-rentia-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {val === 0 ? 'Todas' : `+${val}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Precio Máximo Compra</label>
                                <select
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-rentia-blue outline-none"
                                >
                                    <option value="0">Cualquier precio</option>
                                    <option value="100000">Hasta 100.000 €</option>
                                    <option value="150000">Hasta 150.000 €</option>
                                    <option value="200000">Hasta 200.000 €</option>
                                    <option value="300000">Hasta 300.000 €</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {filteredOpps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredOpps.map(opportunity => (
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
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No se encontraron activos</h3>
                        <p className="text-gray-500 leading-relaxed mb-8">
                            Prueba a ajustar los filtros para ver más resultados.
                        </p>
                        <button
                            onClick={() => { setFilterYield(0); setMaxPrice(0); }}
                            className="inline-flex items-center justify-center gap-2 bg-rentia-blue text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
                        >
                            Ver todas las oportunidades
                        </button>
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
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Análisis de mercado verificado</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Gestión integral opcional</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Rentabilidad neta real</li>
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
