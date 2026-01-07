"use client";

import React, { useState, useEffect } from 'react';
import { Opportunity } from '../types';
import { MapPin, TrendingUp, Maximize, Building, ArrowRight, Phone, Download, ExternalLink, Bed, PlayCircle, Home, CheckCircle, Scale, AlertTriangle, ChevronDown, FileText, Info, Lock } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';

interface Props {
    opportunity: Opportunity;
    onClose?: () => void;
}

export const OpportunityPresentation: React.FC<Props> = ({ opportunity, onClose }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [showLegal, setShowLegal] = useState(false);

    // Image Preloading Effect
    useEffect(() => {
        if (opportunity.images && opportunity.images.length > 0) {
            opportunity.images.forEach((src) => {
                const img = new Image();
                img.src = src;
            });
        }
    }, [opportunity.images, opportunity.id]);

    // Cálculos
    const purchasePrice = opportunity.financials.purchasePrice;
    const agencyFees = opportunity.financials.agencyFees || (purchasePrice > 100000 ? purchasePrice * 0.03 : 3000);
    const totalInvestment = opportunity.financials.totalInvestment + (agencyFees * 1.21);

    const monthlyIncome = opportunity.financials.monthlyRentProjected > 0
        ? opportunity.financials.monthlyRentProjected
        : opportunity.financials.monthlyRentTraditional;

    const grossYield = ((monthlyIncome * 12) / totalInvestment) * 100;
    const netYield = (((monthlyIncome * 12) - opportunity.financials.yearlyExpenses) / totalInvestment) * 100;

    const whatsappLink = `https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20estoy%20interesado%20en%20la%20oportunidad%20${opportunity.id}%20(${encodeURIComponent(opportunity.title)})`;

    // --- PUBLIC ADDRESS LOGIC (HIDE NUMBER) ---
    const publicAddress = opportunity.address.replace(/\d+/g, '').replace(/,/, '').trim();

    // --- SANITIZE TEXT FUNCTION (REMOVE COMPETITORS) ---
    const sanitizeTextContent = (text: string) => {
        if (!text) return "";
        let cleaned = text;

        // Lista de competencia a eliminar (Case Insensitive)
        const competitors = [
            /REDPISO/gi,
            /TECNOCASA/gi,
            /ENGEL & VÖLKERS/gi,
            /ENGEL & VOLKERS/gi,
            /CENTURY 21/gi,
            /DON PISO/gi,
            /KELLER WILLIAMS/gi,
            /RE\/MAX/gi,
            /EXP REALTY/gi,
            /IAD ESPAÑA/gi,
            /IAD/gi,
            /SAFTI/gi,
            /HOGARES/gi,
            /GILMAR/gi,
            /FOTOCASA/gi,
            /IDEALISTA/gi
        ];

        competitors.forEach(regex => {
            cleaned = cleaned.replace(regex, "");
        });

        // Correcciones gramaticales post-borrado
        cleaned = cleaned.replace(/^\s*VENDE EN EXCLUSIVA/gim, "Se vende en exclusiva");
        cleaned = cleaned.replace(/VENDE EN EXCLUSIVA/gi, "Venta en exclusiva");
        cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        return cleaned;
    };

    // --- TEXT PARSER FOR PROFESSIONAL DESCRIPTION ---
    // Handle both Markdown-style bold (**text**) and simple HTML tags if present from AI
    const parseText = (text: string) => {
        // First check for HTML tags from AI
        if (text.includes('<p>') || text.includes('<ul>')) {
            return <div dangerouslySetInnerHTML={{ __html: text }} className="prose prose-sm max-w-none text-slate-600" />;
        }

        return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // Rendering Helper
    const renderDescriptionSection = (text: string) => {
        const cleanText = sanitizeTextContent(text);

        // If HTML (from AI), render directly
        if (cleanText.includes('<p>') || cleanText.includes('<ul>')) {
            return <div dangerouslySetInnerHTML={{ __html: cleanText }} className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600" />;
        }

        // Fallback for manual text
        const lines = cleanText.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-3" />;

            if (trimmed.startsWith('- ')) {
                const content = trimmed.substring(2);
                return (
                    <div key={idx} className="flex items-start gap-3 ml-1 mb-2 group">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rentia-blue flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                        <p className="text-slate-600 text-sm leading-relaxed">{parseText(content)}</p>
                    </div>
                );
            }

            const isHeader = (trimmed.length > 4 && /^[A-ZÁÉÍÓÚÑ0-9\s:().,]+$/.test(trimmed)) || trimmed.includes('ESCENARIO') || trimmed.endsWith(':');

            if (isHeader) {
                return (
                    <div key={idx} className="mt-6 mb-3">
                        <h4 className="font-display font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2 border-l-4 border-rentia-gold pl-3 py-1 bg-slate-50 rounded-r-lg">
                            {trimmed}
                        </h4>
                    </div>
                );
            }

            return <p key={idx} className="text-slate-600 leading-7 text-sm mb-3 text-justify">{parseText(trimmed)}</p>;
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-800">
            {/* Minimal Sticky Header */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm transition-all duration-300">
                <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="Rentia" className="h-6 filter invert opacity-90" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 hidden sm:inline-block border-l border-gray-300 pl-3 ml-3">Investment Opportunity</span>
                    </div>
                    <div className="flex gap-3">
                        {onClose && (
                            <button onClick={onClose} className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-2">
                                Cerrar Vista
                            </button>
                        )}
                        <a href={whatsappLink} target="_blank" className="bg-rentia-black text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2">
                            <Phone className="w-3 h-3" /> Me Interesa
                        </a>
                    </div>
                </div>
            </nav>

            {/* Immersive Hero */}
            <header className="relative h-[60vh] min-h-[500px] overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0">
                    <img src={opportunity.images[0]} className="w-full h-full object-cover opacity-60 animate-in fade-in zoom-in-105 duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-full z-10 pb-16 pt-32 bg-gradient-to-t from-slate-900 to-transparent">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-4 shadow-lg tracking-wider">
                                    <TrendingUp className="w-3 h-3" /> Rentabilidad {grossYield.toFixed(1)}%
                                </div>
                                <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-2 leading-tight drop-shadow-xl text-white">
                                    {sanitizeTextContent(opportunity.title)}
                                </h1>
                                <p className="text-lg text-slate-300 font-light flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-rentia-gold" /> {publicAddress}, {opportunity.city}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Precio de Venta</p>
                                <p className="text-4xl md:text-5xl font-display font-bold text-white">{purchasePrice.toLocaleString()}€</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* KPI Section */}
            <section className="bg-slate-50 border-b border-gray-200">
                <div className="container mx-auto px-6 py-8 max-w-5xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Inversión Total</p>
                            <p className="text-2xl font-bold text-rentia-blue">{totalInvestment.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</p>
                        </div>
                        <div className="text-center border-l border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Cashflow Neto</p>
                            <p className="text-2xl font-bold text-green-600">+{Math.round((monthlyIncome * 12) - opportunity.financials.yearlyExpenses)} €/año</p>
                        </div>
                        <div className="text-center border-l border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Rentabilidad Neta</p>
                            <p className="text-2xl font-bold text-slate-800">{netYield.toFixed(2)}%</p>
                        </div>
                        <div className="text-center border-l border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Valor m²</p>
                            <p className="text-2xl font-bold text-slate-800">{Math.round(purchasePrice / opportunity.specs.sqm)} €/m²</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-16 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Description */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* Description Card */}
                        <div className="prose-container">
                            <h3 className="text-xl font-bold font-display text-slate-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                                Análisis del Activo
                            </h3>
                            <div className="space-y-1">
                                {renderDescriptionSection(opportunity.description)}
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Puntos Clave</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {opportunity.features.map((feat, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm font-medium text-gray-700">{sanitizeTextContent(feat)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Specs & Contact */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Technical Specs */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Ficha Técnica</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-600 text-sm flex items-center gap-2"><Maximize className="w-4 h-4" /> Superficie</span>
                                    <span className="font-bold text-slate-900">{opportunity.specs.sqm} m²</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-600 text-sm flex items-center gap-2"><Bed className="w-4 h-4" /> Habitaciones</span>
                                    <span className="font-bold text-slate-900">{opportunity.specs.rooms}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-600 text-sm flex items-center gap-2"><Building className="w-4 h-4" /> Planta</span>
                                    <span className="font-bold text-slate-900">{opportunity.specs.floor}</span>
                                </div>
                            </div>

                            <a
                                href={whatsappLink}
                                target="_blank"
                                className="w-full mt-8 bg-rentia-black text-white py-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg group"
                            >
                                Contactar Interés <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <p className="text-center text-[10px] text-gray-400 mt-4">
                                Ref: {opportunity.id} • Rentia Investments S.L.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Gallery Section */}
            <section className="bg-gray-50 py-16 border-t border-gray-200">
                <div className="container mx-auto px-6 max-w-6xl">
                    <h3 className="text-xl font-bold font-display text-slate-900 mb-8 text-center">Galería Fotográfica</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {opportunity.images.map((img, idx) => (
                            <div
                                key={idx}
                                onClick={() => { setActiveImageIndex(idx); setIsLightboxOpen(true); }}
                                className={`relative overflow-hidden rounded-xl cursor-pointer group shadow-sm hover:shadow-xl transition-all ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                            >
                                <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Legal Footer */}
            <footer className="bg-white py-8 border-t border-gray-200">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        Rentia Investments S.L. facilita la presente información con carácter meramente estimativo. Los datos financieros son proyecciones y no constituyen garantía contractual. Al contactar, el interesado reconoce la intermediación de Rentia Investments S.L. y se obliga a no contactar ni negociar directamente con la propiedad.
                    </p>
                    <div className="flex justify-center gap-4 mt-4">
                        <Lock className="w-3 h-3 text-gray-300" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Documento Confidencial</p>
                    </div>
                </div>
            </footer>

            {isLightboxOpen && (
                <ImageLightbox
                    images={opportunity.images}
                    selectedIndex={activeImageIndex}
                    onClose={() => setIsLightboxOpen(false)}
                />
            )}
        </div>
    );
};
