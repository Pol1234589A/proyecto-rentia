
import React, { useState, useEffect, useMemo } from 'react';
import { Opportunity } from '../types';
import { TrendingUp, MapPin, Bed, Maximize, ArrowRight, X, ChevronLeft, ChevronRight, Phone, Download, Printer, Lock, Globe, Scale, AlertTriangle, Loader2, FileDown, Check, Building, Mail } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';

// Helper Component for Loading State
const ImageWithLoader = ({ src, alt, className, onClick }: { src: string, alt: string, className?: string, onClick?: (e: React.MouseEvent) => void }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className={`relative overflow-hidden ${className}`} onClick={onClick}>
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <Loader2 className="w-8 h-8 text-rentia-blue/50 animate-spin" />
                </div>
            )}
            <img 
                src={src} 
                alt={alt} 
                className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                loading="lazy"
                decoding="async"
            />
        </div>
    );
};

interface InvestorDossierProps {
  opportunities: Opportunity[];
  selectedOpportunity: Opportunity | null;
}

export const InvestorDossier: React.FC<InvestorDossierProps> = ({ opportunities, selectedOpportunity }) => {
  const [activeView, setActiveView] = useState<'cover' | 'grid'>('cover');
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [detailImageLoaded, setDetailImageLoaded] = useState(false);

  // Si se pasa un ID por URL, saltar directamente al detalle
  useEffect(() => {
    if (selectedOpportunity) {
        setActiveView('grid'); // Aunque esté en detalle, el "padre" es grid
    }
  }, [selectedOpportunity]);

  const handleOpenLightbox = (images: string[], index: number) => {
      setLightboxImages(images);
      setLightboxIndex(index);
      setIsLightboxOpen(true);
  };

  const handleCloseDetail = () => {
      window.location.hash = '#/dossier';
  };

  const formatCurrency = (val: number) => val.toLocaleString('es-ES') + ' €';

  const handlePrint = () => {
      window.print();
  }

  // --- VISTA: PORTADA ---
  if (activeView === 'cover' && !selectedOpportunity) {
      return (
          <div className="h-screen w-full bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
              {/* Background with Blur */}
              <div className="absolute inset-0 z-0">
                  <img 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80" 
                    className="w-full h-full object-cover opacity-20"
                    alt="Background"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
              </div>

              <div className="relative z-10 text-center px-6 max-w-4xl animate-in fade-in zoom-in-95 duration-1000">
                  <div className="inline-flex items-center gap-2 border border-rentia-gold/50 text-rentia-gold px-4 py-2 rounded-full mb-8 text-sm font-bold tracking-widest uppercase bg-rentia-gold/10 backdrop-blur-md">
                      <Lock className="w-3 h-3" /> Private Investment Portfolio
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 tracking-tight leading-tight">
                      RentiaRoom<span className="text-rentia-gold">.</span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-slate-300 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
                      Selección exclusiva de activos inmobiliarios de alta rentabilidad en Murcia. 
                      Gestión integral y análisis financiero detallado.
                  </p>

                  <button 
                    onClick={() => setActiveView('grid')}
                    className="group bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-rentia-gold hover:text-rentia-black transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(237,205,32,0.5)] flex items-center gap-3 mx-auto"
                  >
                      Ver Oportunidades
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>

              <div className="absolute bottom-8 text-xs text-slate-500 tracking-widest uppercase">
                  Confidential • {new Date().getFullYear()}
              </div>
          </div>
      );
  }

  // --- VISTA: DETALLE (MODAL FULL SCREEN) ---
  if (selectedOpportunity) {
      const opp = selectedOpportunity;
      
      // Cálculos Financieros
      const purchasePrice = opp.financials.purchasePrice;
      const totalInv = opp.financials.totalInvestment + (opp.financials.agencyFees ? opp.financials.agencyFees * 1.21 : 3630);
      const monthlyIncome = opp.financials.monthlyRentProjected || opp.financials.monthlyRentTraditional;
      const grossYield = ((monthlyIncome * 12) / totalInv) * 100;
      const netYield = (((monthlyIncome * 12) - opp.financials.yearlyExpenses) / totalInv) * 100;
      const publicAddress = opp.address.replace(/\d+/g, '').replace(/,/, '').trim();

      return (
          <>
          {/* ---------------- A4 PRINT TEMPLATE ---------------- */}
          <div className="hidden print:block fixed inset-0 z-[9999] bg-white text-black p-8 font-sans h-screen w-screen overflow-hidden">
              {/* Print Header */}
              <div className="flex justify-between items-start border-b-2 border-rentia-gold pb-4 mb-6">
                  <div>
                      <img src="https://i.ibb.co/bgfbkz88/1729857046896.jpg" className="h-0 w-0 hidden" alt="preload"/> {/* Hack preload */}
                      <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="RentiaRoom" className="h-8 filter invert" />
                  </div>
                  <div className="text-right">
                      <h1 className="text-xl font-bold uppercase text-slate-900 leading-none">{opp.title}</h1>
                      <p className="text-sm text-slate-500 mt-1">{publicAddress}, {opp.city}</p>
                  </div>
              </div>

              {/* Print Hero */}
              <div className="relative h-64 w-full mb-6 rounded-xl overflow-hidden border border-gray-200">
                  <img src={opp.images[0]} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-white/90 px-4 py-2 rounded-lg text-slate-900 font-bold border shadow-sm">
                      Ref: {opp.id}
                  </div>
                  <div className="absolute bottom-0 left-0 bg-rentia-blue text-white px-6 py-2 rounded-tr-xl font-bold">
                      {opp.status === 'available' ? 'DISPONIBLE' : 'RESERVADO'}
                  </div>
              </div>

              {/* Financial Strip */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl mb-8">
                   <div className="text-center w-1/3 border-r border-slate-200">
                       <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Inversión Total Estimada</p>
                       <p className="text-2xl font-bold text-slate-900">{totalInv.toLocaleString('es-ES')} €</p>
                   </div>
                   <div className="text-center w-1/3 border-r border-slate-200">
                       <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Ingresos Anuales Brutos</p>
                       <p className="text-2xl font-bold text-green-600">{(monthlyIncome * 12).toLocaleString('es-ES')} €</p>
                   </div>
                   <div className="text-center w-1/3">
                       <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rentabilidad Neta</p>
                       <p className="text-3xl font-bold text-rentia-gold">{netYield.toFixed(2)}%</p>
                   </div>
              </div>

              {/* Main Layout Columns */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                  {/* Left Col: Specs & Description */}
                  <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-gray-200 pb-1 mb-3">Ficha Técnica</h3>
                      <div className="grid grid-cols-2 gap-y-2 text-xs mb-6">
                          <div className="flex justify-between border-b border-gray-100 pb-1"><span>Habitaciones:</span> <strong>{opp.specs.rooms}</strong></div>
                          <div className="flex justify-between border-b border-gray-100 pb-1 ml-2"><span>Baños:</span> <strong>{opp.specs.bathrooms}</strong></div>
                          <div className="flex justify-between border-b border-gray-100 pb-1"><span>Superficie:</span> <strong>{opp.specs.sqm} m²</strong></div>
                          <div className="flex justify-between border-b border-gray-100 pb-1 ml-2"><span>Planta:</span> <strong>{opp.specs.floor}</strong></div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-gray-200 pb-1 mb-3">Análisis</h3>
                      <div className="text-xs text-slate-600 leading-relaxed text-justify whitespace-pre-line">
                          {opp.description.length > 600 ? opp.description.substring(0, 600) + '...' : opp.description}
                      </div>
                  </div>

                  {/* Right Col: Financial Breakdown & Features */}
                  <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-gray-200 pb-1 mb-3">Desglose Económico</h3>
                      <div className="bg-blue-50/50 p-3 rounded-lg text-xs space-y-2 mb-6 border border-blue-100">
                           <div className="flex justify-between"><span>Precio Compra:</span> <span>{opp.financials.purchasePrice.toLocaleString()} €</span></div>
                           <div className="flex justify-between"><span>Reforma + Mobiliario:</span> <span>{opp.financials.reformCost.toLocaleString()} €</span></div>
                           <div className="flex justify-between"><span>Honorarios (+IVA):</span> <span>{(opp.financials.agencyFees || 3000 * 1.21).toLocaleString()} €</span></div>
                           <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-blue-900 text-sm">
                               <span>Total Inversión:</span>
                               <span>{totalInv.toLocaleString()} €</span>
                           </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-gray-200 pb-1 mb-3">Puntos Clave</h3>
                      <ul className="text-xs space-y-1">
                          {opp.features.slice(0, 6).map((f, i) => (
                              <li key={i} className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-green-600"/> {f}
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>

              {/* Footer */}
              <div className="mt-auto border-t-2 border-slate-900 pt-4 flex justify-between items-center">
                  <div className="text-[10px] text-slate-500">
                      <p><strong>Rentia Investments S.L.</strong> | Gestión Integral de Inversiones Inmobiliarias</p>
                      <p>Documento informativo sin valor contractual. Datos estimados según mercado.</p>
                  </div>
                  <div className="text-right text-xs">
                      <p className="font-bold text-rentia-blue flex items-center justify-end gap-1"><Phone className="w-3 h-3"/> +34 672 88 63 69</p>
                      <p className="flex items-center justify-end gap-1"><Mail className="w-3 h-3"/> info@rentiaroom.com</p>
                      <p className="flex items-center justify-end gap-1"><Globe className="w-3 h-3"/> www.rentiaroom.com</p>
                  </div>
              </div>
          </div>
          {/* ---------------- END PRINT TEMPLATE ---------------- */}

          <div className="min-h-screen bg-slate-50 font-sans relative flex flex-col md:flex-row print:hidden">
              
              {/* Sidebar / Topbar Navigation */}
              <div className="w-full md:w-20 bg-slate-900 flex md:flex-col justify-between items-center p-4 md:py-8 shrink-0 z-20 shadow-xl">
                  <button onClick={handleCloseDetail} className="p-3 bg-slate-800 rounded-full text-white hover:bg-rentia-gold hover:text-slate-900 transition-colors">
                      <ChevronLeft className="w-6 h-6" />
                  </button>
                  <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" className="h-8 w-auto md:hidden" />
                  <div className="hidden md:block text-slate-500 vertical-text text-xs font-bold tracking-widest uppercase transform -rotate-180" style={{ writingMode: 'vertical-rl' }}>
                      Investment Dossier
                  </div>
              </div>

              {/* Main Content Split */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-80px)] md:h-screen">
                  
                  {/* Left: Gallery */}
                  <div className="lg:w-1/2 h-64 lg:h-full bg-black relative">
                      {!detailImageLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                              <Loader2 className="w-12 h-12 animate-spin text-white/20" />
                          </div>
                      )}
                      <img 
                        src={opp.images[0]} 
                        className={`w-full h-full object-cover transition-opacity duration-700 ${detailImageLoaded ? 'opacity-90' : 'opacity-0'}`}
                        alt={opp.title}
                        onLoad={() => setDetailImageLoaded(true)}
                      />
                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                          <div>
                              <div className="inline-block bg-rentia-gold text-rentia-black px-3 py-1 rounded-sm text-xs font-bold uppercase mb-2 shadow-sm">
                                  {opp.status === 'available' ? 'Disponible' : opp.status}
                              </div>
                              <h1 className="text-white text-2xl md:text-4xl font-display font-bold leading-tight drop-shadow-lg">
                                  {opp.title}
                              </h1>
                          </div>
                          <button 
                            onClick={() => handleOpenLightbox(opp.images, 0)}
                            className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-colors border border-white/20"
                          >
                              <Maximize className="w-6 h-6" />
                          </button>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                  </div>

                  {/* Right: Info Scrollable */}
                  <div className="lg:w-1/2 bg-slate-50 h-full overflow-y-auto custom-scrollbar">
                      <div className="p-8 md:p-12 max-w-2xl mx-auto">
                          
                           <div className="mb-6 flex justify-end">
                                <button 
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                >
                                    <FileDown className="w-4 h-4" /> Descargar PDF
                                </button>
                           </div>

                          {/* Financial KPI Cards */}
                          <div className="grid grid-cols-2 gap-4 mb-10">
                              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Rentabilidad Bruta</p>
                                  <p className="text-4xl font-display font-bold text-rentia-blue">{grossYield.toFixed(2)}%</p>
                              </div>
                              <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 text-white">
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Precio Compra</p>
                                  <p className="text-3xl font-display font-bold text-rentia-gold">{formatCurrency(purchasePrice)}</p>
                              </div>
                          </div>

                          {/* Data Tables */}
                          <div className="space-y-8">
                              <div>
                                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 font-display">Análisis Financiero</h3>
                                  <div className="space-y-3 text-sm">
                                      <div className="flex justify-between p-3 bg-white rounded-lg border border-slate-100">
                                          <span className="text-slate-500">Inversión Total Estimada</span>
                                          <span className="font-bold text-slate-900">{formatCurrency(totalInv)}</span>
                                      </div>
                                      <div className="flex justify-between p-3 bg-white rounded-lg border border-slate-100">
                                          <span className="text-slate-500">Ingresos Anuales (Est.)</span>
                                          <span className="font-bold text-green-600">+{formatCurrency(monthlyIncome * 12)}</span>
                                      </div>
                                      <div className="flex justify-between p-3 bg-white rounded-lg border border-slate-100">
                                          <span className="text-slate-500">Cashflow Neto Mensual</span>
                                          <span className="font-bold text-rentia-blue">+{formatCurrency(monthlyIncome - (opp.financials.yearlyExpenses/12))}</span>
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 font-display">Características</h3>
                                  <p className="text-slate-600 leading-relaxed mb-6 text-sm">{opp.description}</p>
                                  
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                      <div className="p-4 bg-white rounded-lg border border-slate-100">
                                          <Bed className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                                          <span className="block font-bold text-slate-800">{opp.specs.rooms} Habs</span>
                                      </div>
                                      <div className="p-4 bg-white rounded-lg border border-slate-100">
                                          <Maximize className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                                          <span className="block font-bold text-slate-800">{opp.specs.sqm} m²</span>
                                      </div>
                                      <div className="p-4 bg-white rounded-lg border border-slate-100">
                                          <MapPin className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                                          <span className="block font-bold text-slate-800 truncate">{opp.city}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* CTA Sticky Footer style inside scroll */}
                          <div className="mt-12 pt-8 border-t border-slate-200">
                              <a 
                                href={`https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20me%20interesa%20la%20oportunidad%20${opp.id}%20(${encodeURIComponent(opp.title)})`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-rentia-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                              >
                                  <Phone className="w-5 h-5" /> Contactar Interés
                              </a>
                              <p className="text-center text-xs text-slate-400 mt-4">
                                  Referencia: {opp.id} • Rentia Investments S.L.
                              </p>
                          </div>

                          {/* LEGAL SECTION */}
                          <div className="mt-8 p-4 bg-white rounded-lg border border-slate-200 text-[10px] text-slate-500 text-justify leading-relaxed">
                              <h5 className="font-bold text-slate-700 mb-2 uppercase flex items-center gap-1">
                                  <Scale className="w-3 h-3" /> Términos Legales
                              </h5>
                              <p className="mb-2">
                                  Rentia Investments S.L. facilita la presente información con carácter meramente estimativo. Los datos financieros son proyecciones y no constituyen garantía contractual. No nos hacemos responsables de variaciones, errores u omisiones.
                              </p>
                              <p className="mb-2">
                                  Al contactar, el interesado reconoce la intermediación de Rentia Investments S.L. y se obliga a <strong>no contactar ni negociar directamente con la propiedad</strong> (Pacto de No Elusión).
                              </p>
                              <div className="flex items-start gap-1 text-red-800 font-bold">
                                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  <p>El incumplimiento conlleva una penalización equivalente a la comisión de intermediación (3% + IVA, mín. 3.000€ + IVA), reclamable judicialmente en Murcia.</p>
                              </div>
                          </div>

                      </div>
                  </div>
              </div>

              {isLightboxOpen && (
                  <ImageLightbox 
                      images={lightboxImages} 
                      selectedIndex={lightboxIndex} 
                      onClose={() => setIsLightboxOpen(false)} 
                  />
              )}
          </div>
          </>
      );
  }

  // --- VISTA: GRID (LISTADO) ---
  return (
      <div className="min-h-screen bg-slate-100 font-sans">
          
          {/* Header Compacto */}
          <header className="bg-slate-900 text-white p-4 md:p-6 sticky top-0 z-30 shadow-md">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rentia-gold rounded flex items-center justify-center">
                          <span className="text-slate-900 font-bold font-display text-lg">R</span>
                      </div>
                      <span className="font-bold tracking-wide uppercase text-sm hidden md:block">Investment Dossier</span>
                  </div>
                  <div className="flex gap-4">
                      <a href="#/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Web Pública
                      </a>
                  </div>
              </div>
          </header>

          <main className="max-w-7xl mx-auto p-4 md:p-8">
              <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-display mb-2">Oportunidades Activas</h2>
                  <p className="text-slate-500">Cartera actualizada en tiempo real. Selecciona un activo para ver el análisis.</p>
              </div>

              {opportunities.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                      <p>No hay oportunidades disponibles en este momento.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {opportunities.map(opp => {
                          // Calcular Yield para la card
                          const purchase = opp.financials.purchasePrice;
                          const income = opp.financials.monthlyRentProjected || opp.financials.monthlyRentTraditional;
                          const totalCost = opp.financials.totalInvestment + (opp.financials.agencyFees || 3000) * 1.21;
                          const yieldVal = ((income * 12) / totalCost) * 100;

                          return (
                              <div 
                                key={opp.id}
                                onClick={() => window.location.hash = `#/dossier?opp=${opp.id}`}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col h-full border border-slate-200"
                              >
                                  <div className="relative h-56 overflow-hidden">
                                      <ImageWithLoader 
                                        src={opp.images[0]} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt={opp.title}
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60 pointer-events-none"></div>
                                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                          {yieldVal.toFixed(1)}% Rentabilidad
                                      </div>
                                      <div className="absolute bottom-4 left-4 text-white">
                                          <p className="text-lg font-bold leading-tight">{opp.title}</p>
                                          <p className="text-xs opacity-80 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {opp.city}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="p-5 flex-grow flex flex-col justify-between">
                                      <div className="grid grid-cols-2 gap-4 mb-4">
                                          <div>
                                              <p className="text-[10px] text-slate-400 uppercase font-bold">Precio</p>
                                              <p className="text-lg font-bold text-slate-800">{formatCurrency(purchase)}</p>
                                          </div>
                                          <div>
                                              <p className="text-[10px] text-slate-400 uppercase font-bold">Inversión Total</p>
                                              <p className="text-lg font-bold text-rentia-blue">{formatCurrency(Math.round(totalCost))}</p>
                                          </div>
                                      </div>
                                      
                                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                          <div className="flex gap-3 text-xs text-slate-500 font-medium">
                                              <span className="flex items-center gap-1"><Bed className="w-3 h-3"/> {opp.specs.rooms}</span>
                                              <span className="flex items-center gap-1"><Maximize className="w-3 h-3"/> {opp.specs.sqm}m²</span>
                                          </div>
                                          <span className="text-xs font-bold text-rentia-gold group-hover:underline flex items-center gap-1">
                                              Ver Análisis <ArrowRight className="w-3 h-3" />
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </main>
      </div>
  );
};
