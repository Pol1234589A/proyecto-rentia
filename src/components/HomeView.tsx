"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, KeyRound, TrendingUp, ClipboardList, Sparkles, Settings, FileBarChart, ArrowRight, ShieldCheck, UserCheck, Home, MessageCircle, X, Megaphone, Star, Quote, CheckCircle, Users, Smartphone, Clock, FileText, PlusCircle, Loader2, Eye, BarChart3, ClipboardCheck, Activity, UserPlus, AlertTriangle, Hammer, Calculator, Euro } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useContent } from '../contexts/ContentContext';
import { useConfig } from '../contexts/ConfigContext';

interface FAQItemProps {
    question: string;
    answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                className="w-full py-5 flex justify-between items-center text-left focus:outline-none group min-h-[60px]"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-rentia-blue' : 'text-rentia-black group-hover:text-rentia-blue'}`}>
                    {question}
                </span>
                <span className={`ml-6 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rentia-blue' : 'text-gray-400'}`}>
                    <ChevronDown className="w-6 h-6" />
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'
                    }`}
            >
                <p className="text-gray-600 leading-relaxed text-base">{answer}</p>
            </div>
        </div>
    );
};

interface ProcessStep {
    icon: React.ReactNode;
    title: string;
    shortDesc: string;
    longDesc: string;
    details: string[];
}

import Link from 'next/link';

// ... (FAQItem remains same)

// Remove onNavigate prop interface
interface HomeViewProps { }

// ... (ImageWithLoader remains same)

export const HomeView: React.FC<HomeViewProps> = () => {
    const [selectedProcess, setSelectedProcess] = useState<ProcessStep | null>(null);
    const [ctaLoaded, setCtaLoaded] = useState(false);
    const { t } = useLanguage();
    const config = useConfig();
    const { home: content } = useContent();
    const [activeEvent, setActiveEvent] = useState<any>(null);

    // --- CALCULATOR STATE ---
    const [calcRooms, setCalcRooms] = useState(3);
    const avgPrice = 270; // Average price per room (Updated)
    const calcIncome = calcRooms * avgPrice;
    // ------------------------

    // Check for active seasonal events
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        if (config.seasonalEvents && config.seasonalEvents.length > 0) {
            const currentEvent = config.seasonalEvents.find(ev =>
                ev.isActive && today >= ev.startDate && today <= ev.endDate
            );
            setActiveEvent(currentEvent || null);
        }
    }, [config.seasonalEvents]);

    // --- SEO INJECTION: FAQPage Schema ---
    useEffect(() => {
        const faqData = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                { "@type": "Question", "name": t('home.faq.q1'), "acceptedAnswer": { "@type": "Answer", "text": t('home.faq.a1') } },
                { "@type": "Question", "name": t('home.faq.q2'), "acceptedAnswer": { "@type": "Answer", "text": t('home.faq.a2') } },
                { "@type": "Question", "name": t('home.faq.q3'), "acceptedAnswer": { "@type": "Answer", "text": t('home.faq.a3') } },
                { "@type": "Question", "name": t('home.faq.q4'), "acceptedAnswer": { "@type": "Answer", "text": t('home.faq.a4') } },
                { "@type": "Question", "name": t('home.faq.q5'), "acceptedAnswer": { "@type": "Answer", "text": t('home.faq.a5') } },
                { "@type": "Question", "name": t('home.faq.q6'), "acceptedAnswer": { "@type": "Answer", "text": t('home.faq.a6') } }
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(faqData);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [t]);

    const testimonials = [
        {
            name: "Charo Cabello",
            role: "Propietaria",
            date: "Hace 1 mes",
            title: "Profesionalidad y cercanía",
            text: "Acabo de empezar con RentiaRoom para gestionar el alquiler por habitaciones de mi primer piso y la experiencia no podría estar siendo mejor. Desde el primer momento han sido claros, eficientes y profesionales. Me despreocupo totalmente porque ellos se encargan de todo: encontrar a los inquilinos, firmar los contratos, gestionar el día a día y mantener el piso en buen estado. Aunque llevo poco tiempo, ya noto la diferencia en tranquilidad y organización. La comunicación con el equipo es rápida y resolutiva, y se nota que saben lo que hacen. Si estás empezando en el alquiler por habitaciones y quieres hacerlo bien desde el principio, los recomiendo sin dudar.",
            initial: "C",
            color: "bg-[#1c1c1c]"
        },
        {
            name: "Antonio Gil",
            role: "Cliente",
            date: "Hace 2 meses",
            title: "Gran trabajo",
            text: "Gestión de 10/10 y siempre dispuestos a ayudar y resolver cualquiera incidencia. Muy atentos en todo. Lo recomiendo 100%.",
            initial: "A",
            color: "bg-[#0072CE]"
        },
        {
            name: "Paulo Gazzaniga",
            role: "Propietario",
            date: "Hace 3 meses",
            title: "El equipo es muy profesional",
            text: "Son grandes profesionales y buena gente. Están constantemente ayudando y ofreciendo siempre lo mejor, buscando soluciones y ver qué te conviene en cada momento. Estoy muy contento con ellos porque mantienen las habitaciones siempre alquiladas y eligen siempre los mejores inquilinos. Los recomiendo 100% unos cracks.",
            initial: "P",
            color: "bg-[#edcd20]"
        },
        {
            name: "Ángeles Patricia Gómez",
            role: "Cliente",
            date: "Hace 4 meses",
            title: "Recomendable 100%",
            text: "El equipo es un encanto, siempre dispuesto a resolver cualquier situación. Transmite mucha paz y confianza, de 10.",
            initial: "Á",
            color: "bg-[#1c1c1c]"
        },
        {
            name: "Eugenio López",
            role: "Propietario",
            date: "Hace 5 meses",
            title: "Gran profesionalidad",
            text: "He trabajado con ellos desde el inicio de su andadura profesional y todo más que bien, gente muy profesional! La actividad de la gestión de alquileres no es precisamente fácil y ellos lo hacen muy bien! Muy recomendables!",
            initial: "E",
            color: "bg-[#0072CE]"
        }
    ];

    const processSteps: ProcessStep[] = [
        {
            title: t('home.process.steps.s1.title'),
            icon: <ClipboardList className="w-6 h-6" />,
            shortDesc: t('home.process.steps.s1.short'),
            longDesc: t('home.process.steps.s1.long'),
            details: t('home.process.steps.s1.details')
        },
        {
            title: t('home.process.steps.s2.title'),
            icon: <Sparkles className="w-6 h-6" />,
            shortDesc: t('home.process.steps.s2.short'),
            longDesc: t('home.process.steps.s2.long'),
            details: t('home.process.steps.s2.details')
        },
        {
            title: t('home.process.steps.s3.title'),
            icon: <Settings className="w-6 h-6" />,
            shortDesc: t('home.process.steps.s3.short'),
            longDesc: t('home.process.steps.s3.long'),
            details: t('home.process.steps.s3.details')
        },
        {
            title: t('home.process.steps.s4.title'),
            icon: <FileBarChart className="w-6 h-6" />,
            shortDesc: t('home.process.steps.s4.short'),
            longDesc: t('home.process.steps.s4.long'),
            details: t('home.process.steps.s4.details')
        }
    ];

    const heroOverlayStyle = activeEvent
        ? { backgroundColor: activeEvent.overlayColor, opacity: activeEvent.overlayOpacity }
        : { backgroundColor: '#000000', opacity: content.hero.overlayOpacity };

    return (
        <div className="font-sans bg-white">

            {/* --- HERO SECTION (Dynamic) --- */}
            <section className="relative min-h-[75vh] md:min-h-[85vh] w-full overflow-hidden flex items-center text-white py-16 md:py-0">
                <div className="absolute inset-0 w-full h-full z-0">
                    {activeEvent && activeEvent.heroImage ? (
                        <img
                            src={activeEvent.heroImage}
                            alt="Season Hero"
                            className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000"
                        />
                    ) : (
                        <img
                            src={content.hero.backgroundImage}
                            className="absolute inset-0 w-full h-full object-cover"
                            alt="RentiaRoom Hero"
                        />
                    )}

                    {/* Dynamic Overlay */}
                    <div className="absolute inset-0" style={heroOverlayStyle}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl">
                        {activeEvent && (
                            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium text-xs md:text-sm uppercase tracking-wide animate-in slide-in-from-top-4">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                {activeEvent.name}
                            </div>
                        )}
                        {!activeEvent && (
                            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-rentia-gold font-medium text-xs md:text-sm uppercase tracking-wide">
                                <Settings className="w-4 h-4" />
                                {t('home.hero.badge')}
                            </div>
                        )}

                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight font-display drop-shadow-lg">
                            {activeEvent ? (
                                <span className="animate-in fade-in duration-1000">{activeEvent.heroTitle}</span>
                            ) : (
                                <>
                                    {content.hero.titlePrefix} <span className="text-transparent bg-clip-text bg-gradient-to-r from-rentia-gold to-yellow-200">{content.hero.titleHighlight}</span>
                                </>
                            )}
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl mb-10 text-gray-100 leading-relaxed max-w-2xl drop-shadow-md">
                            {activeEvent ? activeEvent.heroSubtitle : content.hero.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 relative z-30">
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center bg-rentia-blue hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1 w-full sm:w-auto">
                                {content.hero.ctaPrimary}
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <Link
                                href="/oportunidades"
                                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold py-4 px-8 rounded-lg transition-all duration-300 pointer-events-auto w-full sm:w-auto"
                            >
                                {content.hero.ctaSecondary}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TRUST BAR (Barra de Confianza) --- */}
            <div className="bg-white border-b border-gray-100 py-10 relative z-20">
                <div className="container mx-auto px-4">
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">
                        {t('home.trust.title')}
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 hover:opacity-100 transition-opacity duration-500">
                        {/* IDEALISTA */}
                        <img
                            src="https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/OTRAS%20IMAGENES%2FIdealista.com_id38bG5AYk_0.png?alt=media&token=3f218081-8901-459b-9568-10f5f7f03090"
                            alt="Idealista"
                            className="h-8 md:h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-500"
                        />
                        {/* RENTGER */}
                        <img
                            src="https://app.rentger.com/img/logo/logo.png"
                            alt="Rentger"
                            className="h-8 md:h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-500"
                        />
                    </div>
                </div>
            </div>

            {/* --- LEAD MAGNET: MICRO-CALCULATOR --- */}
            <section className="py-16 bg-gradient-to-br from-[#002849] to-rentia-blue relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-rentia-gold/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-12">

                        {/* Text Side */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                <Calculator className="w-4 h-4" />
                                {t('home.calculator.title')}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4 leading-tight">
                                {t('home.calculator.subtitle')}
                            </h2>
                            <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-lg">
                                {t('home.calculator.disclaimer')}
                            </p>
                        </div>

                        {/* Interactive Widget Side */}
                        <div className="w-full md:w-[400px] bg-white rounded-2xl p-6 shadow-xl transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                                        {t('home.calculator.label_rooms')}
                                    </label>

                                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 border border-gray-200">
                                        <button
                                            onClick={() => setCalcRooms(Math.max(2, calcRooms - 1))}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-rentia-blue transition-colors font-bold text-lg"
                                        >-</button>
                                        <span className="text-2xl font-bold text-rentia-black font-display">{calcRooms}</span>
                                        <button
                                            onClick={() => setCalcRooms(Math.min(10, calcRooms + 1))}
                                            className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-rentia-blue transition-colors font-bold text-lg"
                                        >+</button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <p className="text-xs text-center text-gray-500 mb-1">{t('home.calculator.label_result')}</p>
                                    <div className="text-center">
                                        <span className="text-4xl font-bold text-rentia-blue font-display tracking-tight">
                                            {calcIncome.toLocaleString()}€
                                        </span>
                                        <span className="text-sm font-medium text-gray-400 ml-1">
                                            {t('home.calculator.per_month')}
                                        </span>
                                    </div>
                                </div>

                                <a
                                    href={`https://api.whatsapp.com/send?phone=${config.directorContact.phone}&text=Hola, he calculado que puedo ganar ${calcIncome}€ con mi piso de ${calcRooms} habitaciones. Me interesa un estudio exacto.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-rentia-black text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {t('home.calculator.cta')}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <section className="py-20 md:py-24 bg-white relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-4xl font-bold mb-4 text-rentia-black font-display">{content.solutions.title}</h2>
                        <p className="text-gray-600">{content.solutions.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-idealista hover:shadow-idealista-hover transition-all duration-300 group border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-50 text-rentia-blue flex items-center justify-center mb-6 group-hover:bg-rentia-blue group-hover:text-white transition-colors duration-300">
                                <KeyRound className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-3 text-rentia-black group-hover:text-rentia-blue transition-colors">{content.solutions.card1Title}</h3>
                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">{content.solutions.card1Desc}</p>
                        </div>

                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-idealista hover:shadow-idealista-hover transition-all duration-300 group border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-yellow-50 text-rentia-gold flex items-center justify-center mb-6 group-hover:bg-rentia-gold group-hover:text-rentia-black transition-colors duration-300">
                                <Megaphone className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-3 text-rentia-black group-hover:text-rentia-blue transition-colors">{content.solutions.card2Title}</h3>
                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">{content.solutions.card2Desc}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ... [Process and other sections] ... */}

            {/* Dynamic CTA */}
            <section className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-idealista overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto">
                        <div className="p-8 md:p-16 flex-1 flex flex-col justify-center">
                            <h2 className="text-2xl md:text-4xl font-bold mb-6 text-rentia-black font-display leading-tight">
                                {content.cta.title}
                            </h2>
                            <p className="text-lg text-gray-600 mb-8">
                                {content.cta.subtitle}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href={`https://api.whatsapp.com/send?phone=${config.directorContact.phone}&text=Hola, quiero más información sobre vuestros servicios`} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center bg-rentia-blue hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-md">
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    {content.cta.buttonText}
                                </a>
                            </div>
                        </div>
                        <div className="md:w-1/2 relative min-h-[250px] md:min-h-[300px]">
                            {!ctaLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                                    <Loader2 className="w-12 h-12 animate-spin text-rentia-blue/30" />
                                </div>
                            )}
                            <img
                                src={content.cta.image}
                                alt="Gestión Propiedad"
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${ctaLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setCtaLoaded(true)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ... [Rest of file] ... */}
            <section className="py-16 md:py-24 bg-gray-50">
                {/* Testimonials section */}
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display">{t('home.testimonials.title')}</h2>
                        <p className="text-gray-600 mt-2">{t('home.testimonials.subtitle')}</p>
                        <div className="flex items-center justify-center mt-4 gap-1 text-rentia-gold">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                            <span className="ml-2 text-sm font-bold text-gray-600">{t('home.testimonials.quality')}</span>
                        </div>
                    </div>

                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 max-w-7xl mx-auto space-y-6">
                        {testimonials.map((testi, index) => (
                            <div key={index} className="break-inside-avoid bg-white p-6 md:p-8 rounded-xl shadow-idealista hover:shadow-idealista-hover border border-gray-100 transition-all duration-300 relative group hover:-translate-y-1 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-transparent group-hover:bg-rentia-gold transition-colors duration-300"></div>

                                <div className="absolute top-4 right-6 text-gray-100 transform rotate-180 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <Quote className="w-12 h-12" />
                                </div>

                                <div className="flex items-center gap-4 mb-5 relative z-10">
                                    <div className={`w-12 h-12 rounded-full ${testi.color} text-white flex items-center justify-center font-display font-bold text-lg shadow-sm ring-2 ring-white`}>
                                        {testi.initial}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-rentia-black leading-tight text-[15px]">{testi.name}</h4>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{testi.role}</span>
                                    </div>
                                </div>

                                <h5 className="font-bold text-rentia-black mb-3 text-lg font-display leading-snug group-hover:text-rentia-blue transition-colors">{testi.title}</h5>

                                <div className="text-gray-600 leading-relaxed text-[15px] relative mb-4 font-sans">
                                    {testi.text}
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                    <div className="flex text-rentia-gold gap-0.5">
                                        {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3.5 h-3.5 fill-current" />)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-green-100">
                                        <CheckCircle className="w-3 h-3" />
                                        {t('home.testimonials.verified')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-10 md:mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display">{t('home.faq.title')}</h2>
                        <p className="text-gray-600">{t('home.faq.subtitle')}</p>
                    </div>

                    <div className="bg-white p-2 md:p-4">
                        <FAQItem question={t('home.faq.q1')} answer={t('home.faq.a1')} />
                        <FAQItem question={t('home.faq.q2')} answer={t('home.faq.a2')} />
                        <FAQItem question={t('home.faq.q3')} answer={t('home.faq.a3')} />
                        <FAQItem question={t('home.faq.q4')} answer={t('home.faq.a4')} />
                        <FAQItem question={t('home.faq.q5')} answer={t('home.faq.a5')} />
                        <FAQItem question={t('home.faq.q6')} answer={t('home.faq.a6')} />
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
                        <h2 className="text-2xl md:text-4xl font-bold font-display text-rentia-black mb-4">{t('home.contact_dual.title')}</h2>
                        <p className="text-gray-600 text-lg">
                            {t('home.contact_dual.subtitle')}
                        </p>
                    </div>

                    <div className="flex justify-center">

                        {/* Card 2: Dirección */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group max-w-md w-full">
                            <div className="bg-rentia-blue p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full mix-blend-overlay filter blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                        <TrendingUp className="w-6 h-6 text-rentia-gold" />
                                    </div>
                                    <h3 className="font-bold text-xl">{config.directorContact.role}</h3>
                                </div>
                                <p className="text-blue-100 text-sm">{t('home.contact_dual.dir_card.desc')}</p>
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-rentia-blue font-bold text-xl overflow-hidden">
                                        {config.directorContact.image ? <img src={config.directorContact.image} alt={config.directorContact.name} className="w-full h-full object-cover" /> : config.directorContact.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-rentia-black text-lg">{config.directorContact.name}</p>
                                        <p className="text-sm text-gray-500">{config.directorContact.role}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                                        <Clock className="w-4 h-4 text-rentia-gold" />
                                        <span>Lunes a Viernes: <span className="font-bold text-rentia-black">{String(config.directorContact.startHour).padStart(2, '0')}:00 - {String(config.directorContact.endHour).padStart(2, '0')}:00</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                                        <Smartphone className="w-4 h-4 text-rentia-gold" />
                                        <span>{t('home.contact_dual.dir_card.label_phone')}</span>
                                    </div>
                                </div>

                                <a
                                    href={`https://api.whatsapp.com/send?phone=${config.directorContact.phone}&text=${encodeURIComponent(config.directorContact.whatsappMessage)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-green-200/50"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    {t('home.contact_dual.dir_card.btn')}
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

        </div>
    );
};
