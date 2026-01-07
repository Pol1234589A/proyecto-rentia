"use client";

import React, { useState, useEffect } from 'react';
import { Check, UserPlus, FileText, Clock, AlertTriangle, ShieldCheck, Hammer, Search, MessageCircle, X, ArrowRight, Eye, BarChart3, ClipboardCheck, Megaphone, Activity, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CollaborationBanner } from './CollaborationBanner';

interface PainPoint {
    icon: React.ReactNode;
    id: string; // Changed to ID for translation lookup
}

// Helper Component for Loading State
const ImageWithLoader = ({ src, alt, className, onClick }: { src: string, alt: string, className?: string, onClick?: (e: React.MouseEvent) => void }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className={`relative overflow-hidden ${className}`} onClick={onClick}>
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <Loader2 className="w-8 h-8 text-rentia-blue/50 animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                loading="lazy"
                decoding="async"
            />
        </div>
    );
};

export const ServicesView: React.FC = () => {
    const [selectedFeature, setSelectedFeature] = useState<PainPoint | null>(null);
    const { t } = useLanguage();

    // --- SEO INJECTION: Service Schema ---
    useEffect(() => {
        const serviceData = {
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Property Management",
            "provider": {
                "@type": "RealEstateAgent",
                "name": "RentiaRoom"
            },
            "areaServed": {
                "@type": "City",
                "name": "Murcia"
            },
            "description": "Gestión integral de alquileres por habitaciones. Incluye búsqueda de inquilinos, gestión de contratos, cobro de rentas, mantenimiento y limpieza.",
            "offers": {
                "@type": "Offer",
                "priceCurrency": "EUR",
                "description": "Comisión de gestión mensual competitiva con descuentos por volumen."
            },
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Servicios Inmobiliarios",
                "itemListElement": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Gestión Integral de Habitaciones"
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Rent to Rent (Alquiler Garantizado)"
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Reformas y Home Staging"
                        }
                    }
                ]
            }
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(serviceData);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    // Static data moved inside to use 't'
    const services = [
        {
            id: 1,
            title: t('services.list.s1.title'),
            description: t('services.list.s1.desc'),
            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
            points: t('services.list.s1.pts')
        },
        {
            id: 2,
            title: t('services.list.s2.title'),
            description: t('services.list.s2.desc'),
            image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
            points: t('services.list.s2.pts')
        },
        {
            id: 3,
            title: t('services.list.s3.title'),
            description: t('services.list.s3.desc'),
            image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
            points: t('services.list.s3.pts')
        },
        {
            id: 4,
            title: t('services.list.s4.title'),
            description: t('services.list.s4.desc'),
            image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
            points: t('services.list.s4.pts')
        },
        {
            id: 5,
            title: t('services.list.s5.title'),
            description: t('services.list.s5.desc'),
            image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
            points: t('services.list.s5.pts')
        },
        {
            id: 6,
            title: t('services.list.s6.title'),
            badge: t('services.list.s6.badge'),
            description: t('services.list.s6.desc'),
            image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
            points: t('services.list.s6.pts')
        }
    ];

    const onboardingStepsRaw = t('services.onboarding.steps');
    const onboardingIcons = [
        <Eye className="w-5 h-5 md:w-6 md:h-6" />,
        <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />,
        <ClipboardCheck className="w-5 h-5 md:w-6 md:h-6" />,
        <Megaphone className="w-5 h-5 md:w-6 md:h-6" />,
        <Activity className="w-5 h-5 md:w-6 md:h-6" />
    ];

    const onboardingSteps = onboardingStepsRaw.map((step: any, index: number) => ({
        ...step,
        icon: onboardingIcons[index]
    }));

    const painPoints: PainPoint[] = [
        { icon: <UserPlus className="w-8 h-8" />, id: 'p1' },
        { icon: <FileText className="w-8 h-8" />, id: 'p2' },
        { icon: <Clock className="w-8 h-8" />, id: 'p3' },
        { icon: <AlertTriangle className="w-8 h-8" />, id: 'p4' },
        { icon: <ShieldCheck className="w-8 h-8" />, id: 'p5' },
        { icon: <Hammer className="w-8 h-8" />, id: 'p6' },
    ];

    return (
        <div className="font-sans bg-white">

            {/* Header Section */}
            <section className="relative py-24 bg-rentia-black overflow-hidden">
                {/* Background Image with Brand Styling */}
                <div className="absolute inset-0 w-full h-full z-0">
                    <ImageWithLoader
                        src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1600&auto=format&fit=crop"
                        alt="Servicios RentiaRoom"
                        className="w-full h-full object-cover grayscale"
                    />
                    {/* Blue tint overlay for brand consistency */}
                    <div className="absolute inset-0 bg-rentia-blue/60 mix-blend-multiply z-10 pointer-events-none"></div>
                    {/* Dark overlay + blur for text readability */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 pointer-events-none"></div>
                </div>

                <div className="relative z-10 container mx-auto px-4 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 drop-shadow-md">{t('services.hero.title')}</h1>
                    <p className="text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm">
                        {t('services.hero.subtitle')}
                    </p>
                </div>
            </section>

            {/* --- BÚSQUEDA DE OPORTUNIDADES (Rediseñado para armonía visual) --- */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative flex flex-col md:flex-row items-center max-w-6xl mx-auto">

                        {/* Elegant Gold Accent */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-rentia-gold md:w-2 md:h-full"></div>

                        <div className="p-8 md:p-12 flex-1">
                            <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 text-rentia-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                <Search className="w-4 h-4" />
                                {t('services.channel.badge')}
                            </div>
                            <h2 className="text-3xl font-bold text-rentia-black mb-4 font-display">
                                {t('services.channel.title')}
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {t('services.channel.desc')} <span className="font-bold text-rentia-blue">{t('services.channel.free')}</span> {t('services.channel.desc_2')}
                            </p>
                        </div>

                        <div className="p-8 md:p-12 bg-gray-50 w-full md:w-auto flex flex-col justify-center items-center md:border-l border-gray-100">
                            <a
                                href="https://whatsapp.com/channel/0029VbBsvhOIt5rpshbpYN1P"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-rentia-blue hover:bg-blue-700 text-white transition-all px-8 py-4 rounded-lg shadow-lg hover:shadow-blue-200/50 font-bold text-lg group transform hover:-translate-y-1"
                            >
                                <MessageCircle className="w-6 h-6 text-white" />
                                {t('services.channel.cta')}
                            </a>
                            <p className="text-xs text-gray-400 mt-3 font-medium">{t('services.channel.sub')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Intro Text */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-rentia-black mb-4 font-display">{t('services.intro.title')}</h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        {t('services.intro.subtitle')}
                    </p>
                </div>
            </section>

            {/* Services List (Zig Zag) */}
            <section className="py-10 bg-gray-50/50">
                <div className="container mx-auto px-4 max-w-6xl">
                    {services.map((service, index) => (
                        <div key={service.id} className={`flex flex-col md:flex-row gap-8 md:gap-16 items-center mb-20 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                            {/* Image Side */}
                            <div className="w-full md:w-1/2">
                                <div className="relative rounded-xl overflow-hidden shadow-xl aspect-[4/3] group bg-white">
                                    <div className="absolute inset-0 z-0">
                                        <ImageWithLoader
                                            src={service.image}
                                            alt={service.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                                        />
                                    </div>

                                    {/* Brand Tint Overlay on Hover (fades out as image goes color, or stays subtle) */}
                                    <div className="absolute inset-0 bg-rentia-blue/20 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 z-10 pointer-events-none"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-rentia-black/60 to-transparent opacity-60 z-10 pointer-events-none"></div>

                                    {service.badge && (
                                        <div className="absolute top-4 left-4 bg-rentia-gold text-rentia-black text-xs font-bold px-3 py-1 rounded shadow z-20">
                                            {service.badge}
                                        </div>
                                    )}

                                    <div className="absolute bottom-4 left-4 text-white text-6xl font-bold opacity-20 font-display z-10">0{index + 1}</div>
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="w-full md:w-1/2">
                                <h3 className="text-2xl md:text-3xl font-bold text-rentia-black mb-4 font-display">{service.title}</h3>
                                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                                    {service.description}
                                </p>
                                <ul className="space-y-3">
                                    {service.points.map((point: string, i: number) => (
                                        <li key={i} className="flex items-start text-gray-700">
                                            <div className="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-rentia-gold/20 flex items-center justify-center">
                                                <Check className="w-3 h-3 text-rentia-black" />
                                            </div>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- NUEVA SECCIÓN: PROTOCOLO DE ACTIVACIÓN (Compacto en móvil) --- */}
            <section className="py-12 md:py-24 bg-rentia-black text-white relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rentia-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rentia-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">{t('services.onboarding.title')}</h2>
                        <p className="text-gray-300 text-lg">
                            {t('services.onboarding.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6">
                        {onboardingSteps.map((step: any, index: number) => (
                            <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-6 hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 flex flex-row md:flex-col items-start gap-4 md:gap-0">

                                {/* Icon Container - Fixed width for mobile list alignment */}
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-rentia-blue rounded-lg flex items-center justify-center mb-0 md:mb-4 text-white shadow-lg group-hover:scale-110 transition-transform shrink-0 mt-1 md:mt-0">
                                    {step.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base md:text-lg mb-1 md:mb-3 text-rentia-gold leading-tight">{step.title}</h3>
                                    <p className="text-xs md:text-sm text-gray-300 mb-2 md:mb-4 leading-relaxed line-clamp-2 md:line-clamp-none">
                                        {step.desc}
                                    </p>
                                    <div className="mt-auto pt-2 md:pt-4 border-t border-white/10 text-[10px] md:text-xs font-bold uppercase tracking-wider text-rentia-blue flex items-center gap-1.5 md:gap-2">
                                        <Check className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{step.hl}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pain Points Grid ("¿Qué resolvemos?") */}
            <section className="py-24 bg-white relative overflow-hidden">
                {/* Subtle background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-rentia-blue/5 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -left-24 w-64 h-64 bg-rentia-gold/10 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display text-rentia-black">
                            {t('services.pain_points.title')}
                        </h2>
                        <p className="text-gray-500 text-lg">
                            {t('services.pain_points.subtitle')}
                            <span className="block mt-1 font-medium text-rentia-blue text-sm uppercase tracking-wide mt-3">{t('services.pain_points.hint')}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {painPoints.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => setSelectedFeature(item)}
                                className="bg-white p-8 rounded-xl shadow-idealista hover:shadow-idealista-hover border border-gray-100 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden cursor-pointer h-full flex flex-col"
                            >
                                {/* Hover Accent Line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-rentia-gold transition-colors duration-300"></div>

                                <div className="mb-6 flex justify-between items-start">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-rentia-blue group-hover:bg-rentia-blue group-hover:text-white transition-colors duration-300">
                                        {item.icon}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-rentia-gold group-hover:text-rentia-black transition-all">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-3 text-rentia-black group-hover:text-rentia-blue transition-colors">{t(`services.pain_points.items.${item.id}.title`)}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                                    {t(`services.pain_points.items.${item.id}.short`)}
                                </p>
                                <p className="text-rentia-blue text-xs font-bold mt-4 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                    Leer explicación detallada &rarr;
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* MODAL FOR DETAILS */}
            {selectedFeature && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedFeature(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden relative transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <div className="bg-rentia-blue p-6 flex justify-between items-center">
                            <div className="text-white flex items-center gap-3">
                                {selectedFeature.icon}
                                <h3 className="text-xl font-bold font-display">{t(`services.pain_points.items.${selectedFeature.id}.title`)}</h3>
                            </div>
                            <button onClick={() => setSelectedFeature(null)} className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8">
                            <h4 className="text-gray-900 font-bold mb-4 text-lg">{t('services.pain_points.modal_title')}</h4>
                            <p className="text-gray-600 leading-relaxed text-base mb-6">
                                {t(`services.pain_points.items.${selectedFeature.id}.long`)}
                            </p>
                            <div className="bg-yellow-50 border-l-4 border-rentia-gold p-4 rounded">
                                <p className="text-xs text-gray-500 italic">
                                    {t('services.pain_points.modal_disclaimer')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedFeature(null)}
                                className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                {t('common.understood')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Final CTA */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-rentia-black mb-6 font-display">{t('services.cta.title')}</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        {t('services.cta.subtitle')}
                    </p>
                    <a
                        href="https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20tengo%20dudas%20sobre%20los%20servicios%20de%20RentiaRoom"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <MessageCircle className="w-6 h-6 mr-2" />
                        {t('services.cta.btn')}
                    </a>
                </div>
            </section>

            {/* B2B Collaboration Banner */}
            <CollaborationBanner />

        </div>
    );
};
