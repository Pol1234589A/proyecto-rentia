"use client";

import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Heart, Quote, TrendingUp, Home, Clock, MessageCircle, CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CollaborationBanner } from './CollaborationBanner';
import { useConfig } from '../contexts/ConfigContext';

export const AboutView: React.FC = () => {
    const { t } = useLanguage();
    const config = useConfig();
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [storyLoaded, setStoryLoaded] = useState(false);

    const [now, setNow] = useState(new Date());

    // Actualizar hora cada minuto
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Helper para determinar horarios
    const getStatus = (startHour: number, endHour: number) => {
        const day = now.getDay(); // 0 = Domingo, 6 = Sábado
        const hour = now.getHours();

        if (day === 0 || day === 6) {
            return { isOpen: false, label: t('common.closed_weekend') };
        }
        if (hour >= startHour && hour < endHour) {
            return { isOpen: true, label: t('common.available_now') };
        }
        return { isOpen: false, label: t('common.closed_now') };
    };

    const adminStatus = getStatus(config.adminContact.startHour, config.adminContact.endHour);
    const directorStatus = getStatus(config.directorContact.startHour, config.directorContact.endHour);

    return (
        <div className="bg-white min-h-screen font-sans animate-in fade-in duration-500">

            {/* --- HERO SECTION --- */}
            <section className="bg-rentia-black text-white py-24 relative overflow-hidden">
                <div className="absolute inset-0 w-full h-full z-0">
                    {!heroLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                            <Loader2 className="w-12 h-12 animate-spin text-white/20" />
                        </div>
                    )}
                    <img
                        src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
                        alt="Equipo RentiaRoom"
                        className={`w-full h-full object-cover grayscale transition-opacity duration-700 ${heroLoaded ? 'opacity-30' : 'opacity-0'}`}
                        onLoad={() => setHeroLoaded(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-rentia-black/90 via-rentia-black/70 to-white"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center mt-8">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-rentia-gold font-bold uppercase tracking-wider text-xs mb-4">
                        {t('about.hero.badge')}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 drop-shadow-xl text-white">
                        {t('about.hero.title')}
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
                        {t('about.hero.subtitle')}
                    </p>
                </div>
            </section>

            {/* --- OUR STORY --- */}
            <section className="py-20 container mx-auto px-4 -mt-12 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-3xl font-bold text-rentia-black font-display mb-6">{t('about.story.title')}</h2>
                            <div className="space-y-5 text-gray-600 leading-relaxed text-lg text-justify">
                                <p>
                                    {t('about.story.p1')}
                                </p>
                                <p>
                                    {t('about.story.p2')}
                                </p>
                                <p className="bg-gray-50 p-4 rounded-lg border-l-4 border-rentia-gold italic text-gray-700">
                                    {t('about.story.highlight')}
                                </p>
                            </div>
                        </div>

                        <div className="relative order-1 lg:order-2">
                            {/* IMAGEN DE DIRECCIÓN / CORPORATIVA */}
                            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-gray-100 relative group rotate-1 hover:rotate-0 transition-transform duration-500">
                                {!storyLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                                        <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
                                    </div>
                                )}
                                <img
                                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
                                    alt="Oficinas RentiaRoom"
                                    className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ${storyLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setStoryLoaded(true)}
                                />
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-xs hidden md:block z-10">
                                <Quote className="w-8 h-8 text-rentia-gold mb-2" />
                                <p className="text-rentia-black font-bold text-sm italic">
                                    {t('about.story.quote')}
                                </p>
                            </div>
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-rentia-blue/10 rounded-full blur-xl -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- THE TEAM --- */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-rentia-black font-display mb-4">{t('about.team.title')}</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            {t('about.team.subtitle')}
                        </p>
                    </div>

                    <div className="flex justify-center max-w-6xl mx-auto">

                        <div className="bg-white rounded-xl overflow-hidden shadow-idealista hover:shadow-idealista-hover transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100 max-w-md">
                            <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                <div className="w-24 h-24 bg-rentia-black rounded-full flex items-center justify-center shadow-md z-10 text-white">
                                    <Home className="w-10 h-10" />
                                </div>
                                <div className="absolute bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 z-10 text-center">
                                    <h3 className="text-rentia-black font-bold text-xl font-display">Dirección</h3>
                                    <p className="text-rentia-gold text-xs font-bold uppercase tracking-wide mt-1">{t('about.team.director.role')}</p>
                                </div>
                            </div>
                            <div className="p-8 bg-white flex-grow">
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {t('about.team.director.desc')}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- VALUES / GRATITUDE --- */}
            <section className="py-24 bg-rentia-blue text-white relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-rentia-gold/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

                <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
                    <div className="inline-flex p-4 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/10">
                        <Heart className="w-8 h-8 text-rentia-gold fill-current" />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold font-display mb-8 leading-tight">
                        {t('about.values.title')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
                            <h3 className="text-xl font-bold text-rentia-gold mb-4">{t('about.values.collab_title')}</h3>
                            <p className="text-blue-50 leading-relaxed">
                                {t('about.values.collab_desc')}
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
                            <h3 className="text-xl font-bold text-rentia-gold mb-4">{t('about.values.owners_title')}</h3>
                            <p className="text-blue-50 leading-relaxed">
                                {t('about.values.owners_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CONTACT SECTION (INTEGRADO) --- */}
            <section id="contact" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display mb-2">{t('contact.choose.title')}</h2>
                        <p className="text-gray-500">{t('contact.choose.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-idealista border border-gray-100 hover:border-rentia-gold transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${adminStatus.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {adminStatus.isOpen ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {adminStatus.label}
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-rentia-black font-bold text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                                    {config.adminContact.image ? <img src={config.adminContact.image} alt={config.adminContact.name} className="w-full h-full object-cover" /> : config.adminContact.name.charAt(0)}
                                </div>
                                <h3 className="font-bold text-2xl text-rentia-black mb-1">{config.adminContact.name}</h3>
                                <p className="text-rentia-blue font-medium mb-4">{t('contact.admin.role')}</p>

                                <div className="w-full border-t border-gray-100 my-4"></div>

                                <div className="space-y-3 text-sm text-gray-600 mb-8 w-full">
                                    <div className="flex items-center justify-center gap-2">
                                        <Clock className="w-4 h-4 text-rentia-gold" />
                                        <span><strong>{String(config.adminContact.startHour).padStart(2, '0')}:00 - {String(config.adminContact.endHour).padStart(2, '0')}:00</strong></span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-center mx-auto w-full">
                                        <p className="font-bold text-gray-800 mb-1 text-xs uppercase tracking-wide">{t('contact.admin.for_title')}</p>
                                        <p>{t('contact.admin.for_desc')}</p>
                                    </div>
                                </div>

                                <a
                                    href={`https://api.whatsapp.com/send?phone=${config.adminContact.phone}&text=${encodeURIComponent(config.adminContact.whatsappMessage)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center justify-center w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md ${adminStatus.isOpen
                                        ? 'bg-[#25D366] hover:bg-[#20ba5c] text-white hover:shadow-green-200/50'
                                        : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                        }`}
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    {adminStatus.isOpen ? t('contact.admin.btn') : t('contact.admin.btn_msg')}
                                </a>
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-idealista border border-gray-100 hover:border-rentia-blue transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${directorStatus.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {directorStatus.isOpen ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {directorStatus.label}
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
                                        <span><strong>{String(config.directorContact.startHour).padStart(2, '0')}:00 - {String(config.directorContact.endHour).padStart(2, '0')}:00</strong></span>
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
                                    className={`flex items-center justify-center w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md ${directorStatus.isOpen
                                        ? 'bg-[#25D366] hover:bg-[#20ba5c] text-white hover:shadow-green-200/50'
                                        : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                        }`}
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    {directorStatus.isOpen ? t('contact.director.btn') : t('contact.director.btn_msg')}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Email Section */}
                    <div className="mt-12 bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm">
                        <div className="inline-flex p-3 bg-gray-50 rounded-full text-rentia-blue shadow-sm mb-4">
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
            </section>

            {/* B2B Collaboration Banner */}
            <CollaborationBanner />

        </div>
    );
};
