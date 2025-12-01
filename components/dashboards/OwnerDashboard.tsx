
import React from 'react';
import { Home, FileText, TrendingUp, DollarSign, Wrench } from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-rentia-black font-display">Portal del Propietario</h1>
          <p className="text-gray-500">Bienvenido a tu área de gestión de activos.</p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-bold uppercase">Ingresos Mes</h3>
              <div className="p-2 bg-green-50 rounded-full text-green-600"><DollarSign className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">2.450 €</p>
            <span className="text-xs text-green-600 font-bold">+5% vs mes anterior</span>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-bold uppercase">Ocupación</h3>
              <div className="p-2 bg-blue-50 rounded-full text-rentia-blue"><Home className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">92%</p>
            <span className="text-xs text-gray-400">1 habitación disponible</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-bold uppercase">Incidencias</h3>
              <div className="p-2 bg-yellow-50 rounded-full text-yellow-600"><Wrench className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">1</p>
            <span className="text-xs text-yellow-600 font-bold">En curso (Fontanería)</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-bold uppercase">Rentabilidad</h3>
              <div className="p-2 bg-purple-50 rounded-full text-purple-600"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">8.4%</p>
            <span className="text-xs text-gray-400">YTD (Anual)</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Documents */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-rentia-black mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rentia-blue" /> Documentación Reciente
            </h3>
            <ul className="space-y-3">
              {['Liquidación Octubre 2025.pdf', 'Contrato Habitación 3 - Firmado.pdf', 'Factura Reparación Caldera.pdf'].map((doc, i) => (
                <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                  <span className="text-sm font-medium text-gray-700">{doc}</span>
                  <span className="text-xs text-rentia-blue font-bold">Descargar</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Properties Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-rentia-black mb-4">Estado de Propiedades</h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-gray-800">Calle Pintor Velázquez, 12</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Activo</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-rentia-blue h-2.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">6/7 Habitaciones alquiladas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
