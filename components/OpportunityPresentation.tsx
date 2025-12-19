
import React, { useState, useEffect } from 'react';
import { Opportunity } from '../types';
import { MapPin, TrendingUp, Maximize, Building, ArrowRight, Phone, Download, ExternalLink, Bed, PlayCircle, Home, CheckCircle, Scale, AlertTriangle, ChevronDown } from 'lucide-react';
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
                        {opportunity.title}
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
                        <div>
                            <h3 className="text-2xl font-bold font-display text-slate-900 mb-6 flex items-center gap-3">
                                <Home className="w-6 h-6 text-rentia-blue" />
                                Sobre el Activo
                            </h3>
                            <div 
                                className="prose prose-slate text-gray-600 leading-relaxed text-justify whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: opportunity.description }} 
                            />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold font-display text-slate-900 mb-6">Puntos Clave</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {opportunity.features.map((feat, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {opportunity.videos && opportunity.videos.length > 0 && (
                            <div className="bg-slate-900 rounded-2xl p-8 text-center relative overflow-hidden group cursor-pointer" onClick={() => window.open(opportunity.videos![0], '_blank')}>
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

                {/* LEGAL & DISCLAIMER SECTION (Collapsible) */}
                <div className="mt-16 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden text-xs text-slate-500 text-justify leading-relaxed">
                    <button 
                        onClick={() => setShowLegal(!showLegal)}
                        className="w-full flex items-center justify-between p-6 md:p-8 text-left hover:bg-slate-200/50 transition-colors group"
                    >
                        <h5 className="font-bold text-slate-700 uppercase flex items-center gap-2 text-sm group-hover:text-rentia-blue">
                            <Scale className="w-4 h-4" /> Términos Legales, Condiciones de Contratación y Pacto de No Elusión
                        </h5>
                        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${showLegal ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showLegal && (
                        <div className="px-6 md:px-8 pb-8 text-xs text-slate-500 text-justify leading-relaxed animate-in slide-in-from-top-1 border-t border-slate-200 pt-4">
                            <div className="space-y-4">
                                <p>
                                    <strong className="text-slate-700">1. EXENCIÓN DE RESPONSABILIDAD:</strong> Rentia Investments S.L. facilita la presente información con carácter meramente estimativo y orientativo. Los datos financieros (rentabilidades, gastos, ingresos) son proyecciones basadas en análisis de mercado y no constituyen garantía contractual de resultados futuros. Rentia Investments S.L. no se hace responsable de variaciones en los datos, errores u omisiones, ni de las decisiones de inversión tomadas en base a este documento.
                                </p>
                                <p>
                                    <strong className="text-slate-700">2. RECONOCIMIENTO DE INTERMEDIACIÓN:</strong> Al solicitar información, realizar una visita, contactar o recibir documentación sobre este activo, el interesado reconoce expresa e irrevocablemente la labor de intermediación de Rentia Investments S.L. y acepta las condiciones aquí expuestas.
                                </p>
                                
                                <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                                    <p className="mb-2 text-red-700 font-bold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4"/> 3. PACTO DE NO ELUSIÓN Y PENALIZACIÓN (NCA)
                                    </p>
                                    <p className="text-slate-600">
                                        En caso de que el activo sea propiedad de un colaborador o tercero representado por Rentia Investments S.L., el interesado se obliga estrictamente a <strong>no contactar, negociar, ni cerrar operaciones directa o indirectamente con la propiedad</strong> eludiendo a esta agencia.
                                    </p>
                                    <p className="mt-2 text-slate-600">
                                        Cualquier intento de elusión, engaño o colusión para evitar el pago de honorarios, devengará automáticamente a favor de Rentia Investments S.L. una <strong>penalización equivalente al importe de la comisión de intermediación habitual</strong> (3% del valor de venta + IVA, con un mínimo de 3.000€ + IVA), sin perjuicio de la reclamación de mayores daños y perjuicios que correspondan en derecho.
                                    </p>
                                </div>

                                <p>
                                    <strong className="text-slate-700">4. JURISDICCIÓN:</strong> Para la resolución de cualquier conflicto derivado de la interpretación o cumplimiento de estas condiciones, las partes se someten expresamente a los <strong>Juzgados y Tribunales de la ciudad de Murcia</strong>, con renuncia a cualquier otro fuero que pudiera corresponderles.
                                </p>
                            </div>
                        </div>
                    )}
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
