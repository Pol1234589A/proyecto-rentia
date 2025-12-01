
import React from 'react';
import { FileText, Wifi, AlertTriangle, MessageCircle, Calendar } from 'lucide-react';

export const TenantDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-in fade-in">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-rentia-black font-display">Mi Espacio</h1>
            <p className="text-gray-500">Bienvenido a casa.</p>
          </div>
          <button className="mt-4 md:mt-0 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-colors">
            <AlertTriangle className="w-4 h-4" /> Reportar Incidencia
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Contrato y Pagos */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-rentia-blue mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Contrato y Recibos</h3>
            <p className="text-sm text-gray-500 mb-4">Accede a tu contrato de alquiler y descarga tus últimos recibos de pago.</p>
            <button className="text-rentia-blue text-sm font-bold hover:underline">Ver documentos</button>
          </div>

          {/* Suministros y Wifi */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Claves WiFi</h3>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm font-mono mb-2">
                <p>Red: <span className="font-bold">Rentia_Velazquez_5G</span></p>
                <p>Pass: <span className="font-bold text-gray-800">Murcia2025!</span></p>
            </div>
          </div>

          {/* Comunidad */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Grupo de la Casa</h3>
            <p className="text-sm text-gray-500 mb-4">Normas de convivencia, turnos de limpieza y avisos generales.</p>
            <a href="#" className="text-rentia-blue text-sm font-bold hover:underline">Ir a WhatsApp Grupo</a>
          </div>
        </div>

        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-start gap-4">
            <Calendar className="w-6 h-6 text-indigo-600 mt-1" />
            <div>
                <h4 className="font-bold text-indigo-900">Próxima Limpieza Programada</h4>
                <p className="text-indigo-700 text-sm mt-1">El equipo de limpieza pasará el <strong>Jueves 15 de Noviembre</strong> a las 10:00h. Recuerda dejar las zonas comunes despejadas.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
