
import React, { useState, useEffect } from 'react';
import { Opportunity } from '../types';
import { MapPin, TrendingUp, Maximize, Building, ArrowRight, Phone, Download, ExternalLink, Bed, PlayCircle, Home, CheckCircle, Scale, AlertTriangle, ChevronDown, FileText, Info } from 'lucide-react';
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
        // Ej: " VENDE EN EXCLUSIVA" -> "Se vende en exclusiva"
        cleaned = cleaned.replace(/^\s*VENDE EN EXCLUSIVA/gim, "Se vende en exclusiva");
        cleaned = cleaned.replace(/VENDE EN EXCLUSIVA/gi, "Venta en exclusiva");
        
        // Limpiar dobles espacios generados
        cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
        
        // Capitalizar primera letra si se borró la palabra inicial
        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        
        return cleaned;
    };

    // --- TEXT PARSER FOR PROFESSIONAL DESCRIPTION ---
    const parseText = (text: string) => {
        return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const renderDescription = (text: string) => {
        // 1. Sanitize text first
        const cleanText = sanitizeTextContent(text);
        
        const lines = cleanText.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-3" />;
            
            // List Item
            if (trimmed.startsWith('- ')) {
                const content = trimmed.substring(2);
                return (
                    <div key={idx} className="flex items-start gap-3 ml-1 mb-2 group">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rentia-blue flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {parseText(content)}
                        </p>
                    </div>
                );
            }

            // Header Detection (Heuristic: Starts with emoji OR is mostly Uppercase OR ends with :)
            // We verify if line length > 4 to avoid false positives on short words
            const isHeader = (trimmed.length > 4 && /^[A-ZÁÉÍÓÚÑ0-9\s:().,]+$/.test(trimmed)) || trimmed.includes('ESCENARIO') || trimmed.endsWith(':') || /^\p{Emoji}/u.test(trimmed);
            
            if (isHeader) {
                return (
                    <div key={idx} className="mt-6 mb-3">
                        <h4 className="font-display font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-2 border-l-4 border-rentia-gold pl-3 py-1 bg-slate-50 rounded-r-lg">
                            {trimmed}
                        </h4>
                    </div>
                );
            }

            // Normal paragraph
            return (
                <p key={idx} className="text-slate-600 leading-7 text-sm mb-3 text-justify">
                    {parseText(trimmed)}
                </p>
            );
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Header / Nav */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
                    <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="Rentia" className="h-8 filter invert opacity-80" />
                    <div className="flex gap-4">
                        {onClose && (
                            <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-800">
                                Cerrar
                            </button>
                        )}
                        <a href={whatsappLink} target="_blank" className="bg-rentia-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-md">
                            Me Interesa
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-24 pb-12 lg:pt-32 lg:pb-20 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0">
                    <img src={opportunity.images[0]} className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50"></div>
                </div>
                <div className="container mx-auto px-4 relative z-10 max-w-5xl text-center">
                    <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-3 py-1 rounded-full text-xs font-bold uppercase mb-6 shadow-lg">
                        <TrendingUp className="w-3 h-3" /> Rentabilidad {grossYield.toFixed(1)}%
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight drop-shadow-xl">
                        {sanitizeTextContent(opportunity.title)}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
                        {publicAddress}, {opportunity.city}
                    </p>
                </div>
            </header>

            {/* Key Numbers Grid */}
            <section className="container mx-auto px-4 -mt-8 relative z-20 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-rentia-gold text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Precio Compra</p>
                        <p className="text-3xl font-display font-bold text-slate-900">{purchasePrice.toLocaleString()} €</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-rentia-blue text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Inversión Total</p>
                        <p className="text-3xl font-display font-bold text-rentia-blue">{totalInvestment.toLocaleString('es-ES', {maximumFractionDigits: 0})} €</p>
                        <p className="text-[10px] text-gray-400 mt-1">(Incluye ITP, Reforma, Honorarios)</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Cashflow Neto</p>
                        <p className="text-3xl font-display font-bold text-green-600">+{Math.round((monthlyIncome * 12) - opportunity.financials.yearlyExpenses)} €/año</p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-16 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Description */}
                    <div className="lg:col-span-7 space-y-12">
                        
                        {/* Enhanced Description Card */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                            
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold font-display text-slate-900 mb-8 flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="p-2.5 bg-blue-50 text-rentia-blue rounded-xl shadow-sm">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    Análisis del Activo
                                </h3>
                                
                                {/* Rendered Content (Sanitized internally) */}
                                <div className="space-y-1">
                                    {renderDescription(opportunity.description)}
                                </div>

                                <div className="mt-8 bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex items-start gap-3">
                                    <Info className="w-5 h-5 text-rentia-blue mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-600 italic">
                                        Este análisis ha sido elaborado por el equipo de inversiones de RentiaRoom basándose en datos actuales de mercado. Los escenarios planteados son proyecciones realistas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold font-display text-slate-900 mb-6 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" /> Puntos Clave
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {opportunity.features.map((feat, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-rentia-blue/30 transition-colors">
                                        <div className="mt-0.5 w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-2.5 h-2.5" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{sanitizeTextContent(feat)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {opportunity.videos && opportunity.videos.length > 0 && (
                            <div className="bg-slate-900 rounded-2xl p-8 text-center relative overflow-hidden group cursor-pointer shadow-xl" onClick={() => window.open(opportunity.videos![0], '_blank')}>
                                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <PlayCircle className="w-16 h-16 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="text-white text-xl font-bold relative z-10">Ver Video Tour</h4>
                                <p className="text-slate-400 text-sm relative z-10">Recorrido virtual disponible</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Specs & Gallery */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-6">Ficha Técnica</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-600 flex items-center gap-2"><Maximize className="w-4 h-4"/> Superficie</span>
                                    <span className="font-bold text-slate-900">{opportunity.specs.sqm} m²</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-600 flex items-center gap-2"><Bed className="w-4 h-4"/> Habitaciones</span>
                                    <span className="font-bold text-slate-900">{opportunity.specs.rooms}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-600 flex items-center gap-2"><Building className="w-4 h-4"/> Planta</span>
                                    <span className="font-bold text-slate-900">{opportunity.specs.floor}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4"/> Zona</span>
                                    <span className="font-bold text-slate-900 truncate max-w-[150px]">{opportunity.city}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Galería ({opportunity.images.length})</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {opportunity.images.slice(0, 6).map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => { setActiveImageIndex(idx); setIsLightboxOpen(true); }}
                                        className={`relative overflow-hidden rounded-lg cursor-pointer group ${idx === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                        {idx === 5 && opportunity.images.length > 6 && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                                                +{opportunity.images.length - 6}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {opportunity.driveFolder && (
                            <a href={opportunity.driveFolder} target="_blank" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-200 rounded-xl text-slate-600 font-bold hover:border-slate-800 hover:text-slate-800 transition-colors">
                                <ExternalLink className="w-4 h-4" /> Carpeta Drive
                            </a>
                        )}
                    </div>
                </div>

            </main>

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
