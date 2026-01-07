
import React from 'react';
import { Briefcase, Search, Download, Star } from 'lucide-react';

export const BrokerDashboardInternal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-in fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 bg-rentia-black text-rentia-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Partner Verificado
          </div>
          <h1 className="text-3xl font-bold text-rentia-black font-display">Centro de Colaboración</h1>
          <p className="text-gray-500">Acceso a mandatos exclusivos y material de marketing sin marca.</p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active Mandates */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Search className="w-5 h-5 text-rentia-blue" /> Mandatos de Compra Activos
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">5 Nuevos</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-gray-800">Inversor Ref. INVEST-0{item}</span>
                                <span className="text-xs font-mono text-gray-400">Hace 2h</span>
                            </div>
                            <p className="text-sm text-gray-600">Busca lote de 2-3 viviendas en zona El Carmen o Espinardo. Presupuesto hasta 400k. Pago contado.</p>
                            <div className="mt-2 flex gap-2">
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Rentabilidad &gt;8%</span>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Reforma OK</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-gray-50 text-center">
                    <button className="text-sm font-bold text-rentia-blue hover:underline">Ver todos los mandatos</button>
                </div>
            </div>

            {/* Resources Sidebar */}
            <div className="space-y-6">
                <div className="bg-rentia-blue text-white rounded-xl p-6 shadow-lg">
                    <Star className="w-8 h-8 text-rentia-gold mb-4" />
                    <h3 className="font-bold text-xl mb-2">Comisiones Premium</h3>
                    <p className="text-blue-100 text-sm mb-4">Sube de nivel cerrando 3 operaciones este trimestre y accede al tier Gold (50% comisión).</p>
                    <div className="w-full bg-blue-900/50 rounded-full h-2 mb-1">
                        <div className="bg-rentia-gold h-2 rounded-full" style={{ width: '33%' }}></div>
                    </div>
                    <span className="text-xs text-rentia-gold font-bold">1/3 Operaciones</span>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-gray-500" /> Descargas
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li><a href="#" className="text-gray-600 hover:text-rentia-blue flex items-center gap-2">Dossier Corporativo (Marca Blanca)</a></li>
                        <li><a href="#" className="text-gray-600 hover:text-rentia-blue flex items-center gap-2">Hoja de Encargo Tipo</a></li>
                        <li><a href="#" className="text-gray-600 hover:text-rentia-blue flex items-center gap-2">Calculadora Rentabilidad Excel</a></li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
