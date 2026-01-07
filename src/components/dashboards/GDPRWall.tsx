"use client";

import React, { useState } from 'react';
import { ShieldCheck, FileText, Check, Loader2, LogOut, Lock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface GDPRWallProps {
    onAccept: () => Promise<void>;
    onLogout: () => void;
}

export const GDPRWall: React.FC<GDPRWallProps> = ({ onAccept, onLogout }) => {
    const { t } = useLanguage();
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        if (!accepted) return;
        setLoading(true);
        await onAccept();
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header Decoration */}
                <div className="h-2 w-full bg-gradient-to-r from-rentia-blue via-indigo-500 to-rentia-gold"></div>

                <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar flex-grow">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-rentia-blue mb-6 shadow-sm border border-blue-100">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-display mb-3">Protección de Datos</h1>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-md">
                            Para poder acceder a tu panel y gestionar tu actividad en RentiaRoom, es necesario que aceptes nuestra política de protección de datos conforme a la normativa vigente (**RGPD/LOPDGDD**).
                        </p>
                    </div>

                    <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-white rounded-lg shadow-sm">
                                <FileText className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-2">Resumen de Información</h3>
                                <div className="space-y-3 text-xs md:text-sm text-gray-600 leading-relaxed">
                                    <p><strong>Responsable:</strong> Rentia Investments S.L.</p>
                                    <p><strong>Finalidad:</strong> Gestión de servicios inmobiliarios, acceso a herramientas digitales, comunicación de incidencias y cumplimiento de obligaciones legales derivadas de nuestra relación.</p>
                                    <p><strong>Legitimación:</strong> Ejecución de contrato / relación comercial y consentimiento del interesado.</p>
                                    <p><strong>Derechos:</strong> Puedes acceder, rectificar y suprimir tus datos, así como otros derechos enviando un email a <span className="text-rentia-blue font-bold">info@rentiaroom.com</span>.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-[11px] text-gray-400 italic">
                                Al marcar la casilla inferior, confirmas que has leído y aceptas íntegramente la Política de Privacidad y el Aviso Legal de RentiaRoom.
                            </p>
                        </div>
                    </div>

                    <label className="flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group hover:bg-blue-50/30 select-none mb-4"
                        style={{ borderColor: accepted ? '#0072CE' : '#f3f4f6' }}>
                        <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${accepted ? 'bg-rentia-blue border-rentia-blue' : 'bg-white border-gray-300'}`}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                            />
                            {accepted && <Check className="w-4 h-4 text-white font-bold" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 mb-1">Doy mi consentimiento y acepto los términos</p>
                            <p className="text-xs text-gray-500 leading-relaxed">He leído y acepto la Política de Privacidad y el tratamiento de mis datos personales para la gestión de mi cuenta.</p>
                        </div>
                    </label>
                </div>

                {/* Footer Actions */}
                <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onLogout}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-6 py-4 rounded-xl text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={!accepted || loading}
                        className="flex-1 bg-rentia-black text-white px-8 py-4 rounded-xl font-bold text-sm md:text-base hover:bg-gray-800 transition-all shadow-xl hover:shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                        {loading ? 'Procesando...' : 'Firmar y Continuar'}
                    </button>
                </div>
            </div>

            <div className="fixed bottom-8 text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold pointer-events-none">
                Cumplimiento Seguro RGPD - RentiaRoom 2025
            </div>
        </div>
    );
};
