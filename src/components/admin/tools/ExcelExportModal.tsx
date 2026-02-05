import React, { useState } from 'react';
import { X, FileSpreadsheet, Settings, MapPin } from 'lucide-react';
import { Property } from '../../../data/rooms';
import { generateExcelReport, ExcelOptions } from '../../../utils/excelGenerator';

interface ExcelExportModalProps {
    properties: Property[];
    isOpen: boolean;
    onClose: () => void;
    ownersMap?: Record<string, any>;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({ properties, isOpen, onClose, ownersMap }) => {
    const [config, setConfig] = useState<ExcelOptions>({
        includeTenantInfo: true,
        includeFinancials: true,
        includeOwnerInfo: false,
        includeCleaningInfo: false,
        includeTimelines: false,
        includeIncidents: true,
        includeCommercial: true,
        groupBy: 'none'
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            Exportar Reporte Maestro
                        </h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 font-bold">Personaliza el contenido del informe Excel</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="Cerrar"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Sección: Contenido */}
                    <div>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-bold"><Settings className="w-4 h-4" /> Datos a Incluir</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${config.includeTenantInfo ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}>
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={config.includeTenantInfo} onChange={e => setConfig({ ...config, includeTenantInfo: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-700">Agenda Contactos</span>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${config.includeFinancials ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}>
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={config.includeFinancials} onChange={e => setConfig({ ...config, includeFinancials: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-700">Datos Económicos</span>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${config.includeOwnerInfo ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}>
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={config.includeOwnerInfo} onChange={e => setConfig({ ...config, includeOwnerInfo: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-700">Datos Propietario</span>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${config.includeCleaningInfo ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}>
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={config.includeCleaningInfo} onChange={e => setConfig({ ...config, includeCleaningInfo: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-700">Datos Limpieza</span>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${config.includeIncidents ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}>
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={config.includeIncidents} onChange={e => setConfig({ ...config, includeIncidents: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-700">Incidencias / Audit</span>
                            </label>
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${config.includeCommercial ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}>
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={config.includeCommercial} onChange={e => setConfig({ ...config, includeCommercial: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-700">Comercial / Libres</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 cursor-pointer hover:border-indigo-200 transition-colors col-span-2">
                                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" checked={config.includeTimelines} onChange={e => setConfig({ ...config, includeTimelines: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-700 font-bold">Pestañas Audit por Propiedad (Full Data)</span>
                            </label>
                        </div>
                    </div>

                    {/* Sección: Agrupación */}
                    <div>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-bold"><MapPin className="w-4 h-4" /> Organización de Pestañas</h4>
                        <div className="space-y-3">
                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${config.groupBy === 'none' ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10' : 'border-slate-100 hover:border-slate-200'}`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${config.groupBy === 'none' ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {config.groupBy === 'none' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                </div>
                                <input type="radio" name="groupBy" value="none" className="hidden" checked={config.groupBy === 'none'} onChange={() => setConfig({ ...config, groupBy: 'none' })} />
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Hoja Única</p>
                                    <p className="text-[10px] uppercase font-black text-slate-400 font-bold">Todo el listado en una sola pestaña</p>
                                </div>
                            </label>

                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${config.groupBy === 'topic' ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/10' : 'border-slate-100 hover:border-slate-200'}`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${config.groupBy === 'topic' ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {config.groupBy === 'topic' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                </div>
                                <input type="radio" name="groupBy" value="topic" className="hidden" checked={config.groupBy === 'topic'} onChange={() => setConfig({ ...config, groupBy: 'topic' })} />
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Organización Temática</p>
                                    <p className="text-[10px] uppercase font-black text-slate-400 font-bold">Estado, Financiero, Contactos...</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors text-xs uppercase tracking-wider">Cancelar</button>
                    <button
                        onClick={async () => {
                            await generateExcelReport(properties, config, ownersMap);
                            onClose();
                        }}
                        className="px-8 py-3 rounded-xl font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center gap-2"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Generar Excel Pro
                    </button>
                </div>
            </div>
        </div>
    );
};
