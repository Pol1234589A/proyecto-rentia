"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Clock, MessageCircle, User, Briefcase, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfig } from '../contexts/ConfigContext';

export const ContactView: React.FC = () => {
    const config = useConfig();
    const [now, setNow] = useState(new Date());
    const [heroLoaded, setHeroLoaded] = useState(false);
    const { t } = useLanguage();

    // Update time every minute to keep status accurate
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Helper to determine if a specific schedule is currently active based on USER'S local time
    const getStatus = (startHour: number, endHour: number) => {
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = now.getHours();

        // Check if weekend
        if (day === 0 || day === 6) {
            return { isOpen: false, label: t('common.closed_weekend') };
        }

        // Check hours
        if (hour >= startHour && hour < endHour) {
            return { isOpen: true, label: t('common.available_now') };
        }

        return { isOpen: false, label: t('common.closed_now') };
    };

    const adminStatus = getStatus(9, 14);
    const dirStatus = getStatus(9, 14);

    return (
        <div className="bg-white min-h-screen font-sans animate-in fade-in duration-500 flex flex-col">
            {/* Hero */}
            <section className="bg-rentia-black text-white py-24 relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 w-full h-full z-0">
                    {!heroLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                            <Loader2 className="w-12 h-12 animate-spin text-white/20" />
                        </div>
                    )}
                    <img
                        src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80"
                        alt="Contacta con RentiaRoom"
                        className={`w-full h-full object-cover grayscale transition-opacity duration-700 ${heroLoaded ? 'opacity-40' : 'opacity-0'}`}
                        onLoad={() => setHeroLoaded(true)}
                    />
                    {/* Brand Tint Overlay */}
                    <div className="absolute inset-0 bg-rentia-blue/20 mix-blend-multiply pointer-events-none"></div>
                    {/* Gradient that fades to white at the bottom to blend with the page */}
                    <div className="absolute inset-0 bg-gradient-to-b from-rentia-black/80 via-rentia-black/40 to-white pointer-events-none"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center mt-8">
                    <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 drop-shadow-xl text-white">{t('contact.hero.title')}</h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
                        {t('contact.hero.subtitle')}
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 pb-16 -mt-10 relative z-20 max-w-5xl flex-grow">

                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display mb-2">{t('contact.choose.title')}</h2>
                        <p className="text-gray-500">{t('contact.choose.subtitle')}</p>
                    </div>

                    <div className="flex justify-center">

                        {/* Dirección Card */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-idealista border border-gray-100 hover:border-rentia-blue transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden max-w-md w-full">
                            {/* Status Indicator */}
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${dirStatus.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {dirStatus.isOpen ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {dirStatus.label}
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-rentia-blue font-bold text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                                    {config.directorContact.image ? <img src={config.directorContact.image} alt={config.directorContact.name} className="w-full h-full object-cover" /> : config.directorContact.name.charAt(0)}
                                </div>
                                <h3 className="font-bold text-2xl text-rentia-black mb-1">{config.directorContact.name}</h3>
                                <p className="text-rentia-blue font-medium mb-4">{t('contact.director.role')}</p>

                                <div className="w-full border-t border-gray-100 my-4"></div>

                                <div className="space-y-3 text-sm text-gray-600 mb-8 w-full">
                                    <div className="flex items-center justify-center gap-2">
                                        <Clock className="w-4 h-4 text-rentia-gold" />
                                        <span><strong>{t('contact.director.hours')}</strong></span>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg text-center mx-auto w-full">
                                        <p className="font-bold text-blue-800 mb-1 text-xs uppercase tracking-wide">{t('contact.director.for_title')}</p>
                                        <p className="text-blue-900">{t('contact.director.for_desc')}</p>
                                    </div>
                                </div>

                                <a
                                    href={`https://api.whatsapp.com/send?phone=${config.directorContact.phone}&text=${encodeURIComponent(config.directorContact.whatsappMessage)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center justify-center w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md ${dirStatus.isOpen
                                        ? 'bg-[#25D366] hover:bg-[#20ba5c] text-white hover:shadow-green-200/50'
                                        : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                        }`}
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    {dirStatus.isOpen ? t('contact.director.btn') : t('contact.director.btn_msg')}
                                </a>
                                {!dirStatus.isOpen && (
                                    <p className="text-xs text-gray-400 mt-2">{t('contact.director.offline')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Email Section */}
                <div className="mt-12 bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                    <div className="inline-flex p-3 bg-white rounded-full text-rentia-blue shadow-sm mb-4">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-rentia-black mb-2">{t('contact.email.title')}</h3>
                    <p className="text-gray-500 mb-6">{t('contact.email.desc')}</p>
                    <a
                        href={`mailto:${config.general.email}`}
                        className="text-rentia-blue font-bold hover:underline text-lg"
                    >
                        {config.general.email}
                    </a>
                </div>

            </div>
        </div>
    );
};
