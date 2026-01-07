"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, ShieldCheck, Settings } from 'lucide-react';

export const CookieBanner: React.FC = () => {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Show with a small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const consent = {
            technical: true,
            analytics: true,
            marketing: true,
            date: new Date().toISOString()
        };
        localStorage.setItem('cookie-consent', JSON.stringify(consent));
        setIsVisible(false);
    };

    const handleRejectAll = () => {
        const consent = {
            technical: true,
            analytics: false,
            marketing: false,
            date: new Date().toISOString()
        };
        localStorage.setItem('cookie-consent', JSON.stringify(consent));
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-8 duration-500">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-5 md:p-6 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rentia-blue via-indigo-500 to-rentia-gold"></div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-rentia-blue">
                        <ShieldCheck className="w-6 h-6" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">Tu privacidad nos importa</h3>
                        <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                            Utilizamos cookies propias y de terceros para analizar nuestros servicios y mostrarle publicidad relacionada con sus preferencias mediante el análisis de sus hábitos de navegación. Puede obtener más información en nuestra <span className="font-bold text-rentia-blue">Política de Cookies</span>.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 shrink-0">
                        <button
                            onClick={handleRejectAll}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-100 transition-all"
                        >
                            Solo Necesarias
                        </button>
                        <button
                            onClick={handleAcceptAll}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rentia-black text-white hover:bg-gray-800 transition-all shadow-md active:scale-95"
                        >
                            Aceptar Todas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
