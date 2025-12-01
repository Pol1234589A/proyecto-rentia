
import React from 'react';
import { Building2, Search, Download, Briefcase, FileText, CheckCircle } from 'lucide-react';

export const AgencyDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* B2B Header */}
        <header className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Building2 className="w-4 h-4" />
              Inmobiliaria Partner
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">Portal B2B Agencias</h1>
            <p className="text-gray-500 mt-1">Colaboración exclusiva y gestión de operaciones compartidas.</p>
          </div>
          <div className="flex gap-3">
             <button className="bg-rentia-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Search className="w-4 h-4" /> Buscar Propiedad
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Shared Listings */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Featured Shared Opportunities */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-rentia-blue" /> Cartera Compartida
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">MLS Interna</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="p-5 hover:bg-slate-50 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200 uppercase tracking-wide">Disponible</span>
                                        <h4 className="font-bold text-gray-800 group-hover:text-rentia-blue transition-colors">Piso Inversión Centro {item}</h4>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-gray-900">145.000 €</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">Producto exclusivo RentiaRoom. Ideal para coliving. 4 Habitaciones. Rentabilidad estimada 9%. Honorarios compartidos al 50%.</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> Murcia Centro</span>
                                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Dossier Ciego Disponible</span>
                                    </div>
                                    <button className="text-rentia-blue font-bold hover:underline flex items-center gap-1">
                                        Descargar Ficha <Download className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Operations Tracker */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" /> Mis Operaciones
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm mb-2">No tienes operaciones cruzadas activas en este momento.</p>
                        <button className="text-rentia-blue text-sm font-bold hover:underline">Registrar nuevo cliente</button>
                    </div>
                </div>
            </div>

            {/* Right Column: Agency Resources */}
            <div className="space-y-6">
                
                {/* Agency Stats */}
                <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                    <h3 className="font-bold text-lg mb-1 relative z-10">Nivel de Partner</h3>
                    <div className="flex items-baseline gap-2 mb-4 relative z-10">
                        <span className="text-3xl font-display font-bold">Silver</span>
                        <span className="text-indigo-200 text-sm">50% Comisión</span>
                    </div>
                    <div className="w-full bg-indigo-900/50 rounded-full h-1.5 mb-2 relative z-10">
                        <div className="bg-indigo-300 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <p className="text-xs text-indigo-200 relative z-10">2 ventas más para alcanzar Gold (60%)</p>
                </div>

                {/* Quick Downloads */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Recursos Marca Blanca</h3>
                    <ul className="space-y-3">
                        <li>
                            <a href="#" className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded shadow-sm text-rentia-blue"><FileText className="w-4 h-4" /></div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-rentia-blue">Nota de Encargo B2B</span>
                                </div>
                                <Download className="w-4 h-4 text-gray-400 group-hover:text-rentia-blue" />
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded shadow-sm text-rentia-blue"><FileText className="w-4 h-4" /></div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-rentia-blue">Dossier Inversores (Neutro)</span>
                                </div>
                                <Download className="w-4 h-4 text-gray-400 group-hover:text-rentia-blue" />
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Direct Contact */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">Soporte Agencias</h4>
                    <p className="text-xs text-gray-500 mb-4">Línea directa para profesionales</p>
                    <a href="tel:+34672886369" className="text-rentia-blue font-bold text-sm hover:underline block">
                        +34 672 88 63 69
                    </a>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
