import React from 'react';
import { Property } from '../../../data/rooms';
import { Download, FileSpreadsheet, LayoutDashboard } from 'lucide-react';
import { ExcelExportModal } from './ExcelExportModal';

interface DataExportToolProps {
    properties: Property[];
}

export const DataExportTool: React.FC<DataExportToolProps> = ({ properties }) => {

    const [showModal, setShowModal] = React.useState(false);

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Download className="w-6 h-6 text-rentia-blue" />
                    Centro de Exportación de Datos
                </h2>
                <p className="text-gray-500 mt-1">Genera y descarga reportes actualizados en <strong>formato Excel (.xlsx)</strong> para la administración.</p>
            </div>

            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="p-5 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-200 mb-6 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Generador Único de Reportes Excel</h3>
                <p className="text-sm text-slate-500 text-center max-w-md mb-8">
                    Haz clic en el botón inferior para configurar y descargar tu informe personalizado. Incluye finanzas, contactos, limpieza e incidencias en un solo archivo profesional (.xlsx).
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                    <LayoutDashboard className="w-5 h-5" /> Abrir Configurador Maestro
                </button>
            </div>

            <ExcelExportModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                properties={properties}
            />

        </div>
    );
};

