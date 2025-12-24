
import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, KeyRound, TrendingUp, ClipboardList, Sparkles, Settings, FileBarChart, ArrowRight, ShieldCheck, UserCheck, Home, MessageCircle, X, Megaphone, Star, Quote, CheckCircle, Users, Smartphone, Clock, FileText, PlusCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { NewsTicker } from './NewsTicker';
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
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'
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

interface HomeViewProps {
  onNavigate?: (view: 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [selectedProcess, setSelectedProcess] = useState<ProcessStep | null>(null);
  const [ctaLoaded, setCtaLoaded] = useState(false);
  const { t } = useLanguage();
  const config = useConfig();

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
      title: "Pol es un gran profesional",
      text: "Pol es un gran profesional y buena gente. Está constantemente ayudando y ofreciendo siempre lo mejor, buscando soluciones y ver que te conviene en cada momento. Estoy muy contento con ellos porque mantienen las habitaciones siempre ocupadas y eligen siempre los mejores inquilinos. Los recomiendo 100% unos cracks.",
      initial: "P",
      color: "bg-[#edcd20]"
    },
    {
      name: "Ángeles Patricia Gómez",
      role: "Cliente",
      date: "Hace 4 meses",
      title: "Recomendable 100%",
      text: "Pol es un encanto, siempre dispuesto a resolver cualquier situación. Transmite mucha paz y confianza, de 10.",
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

  return (
    <div className="font-sans bg-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[75vh] md:min-h-[85vh] w-full overflow-hidden flex items-center text-white py-16 md:py-0">
        <div className="absolute inset-0 w-full h-full z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            poster="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://cdn.coverr.co/videos/coverr-living-room-interior-2624/1080p.mp4" type="video/mp4" />
            Tu navegador no soporta videos HTML5.
          </video>
          {/* Dark Overlay with Blur */}
          <div className="absolute inset-0 bg-rentia-black/60 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-rentia-blue/20 mix-blend-overlay"></div>
        </div>

        <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-rentia-gold font-medium text-xs md:text-sm uppercase tracking-wide">
                    <Settings className="w-4 h-4" />
                    {t('home.hero.badge')}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight font-display drop-shadow-lg">
                    {t('home.hero.title_prefix')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-rentia-gold to-yellow-200">{t('home.hero.title_highlight')}</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl mb-10 text-gray-100 leading-relaxed max-w-2xl drop-shadow-md">
                    {t('home.hero.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 relative z-30">
                    <button 
                        type="button"
                        onClick={() => onNavigate && onNavigate('contact')}
                        className="inline-flex items-center justify-center bg-rentia-blue hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1 w-full sm:w-auto">
                        {t('home.hero.cta_primary')}
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                    <button 
                        type="button"
                        onClick={() => onNavigate && onNavigate('list')}
                        className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold py-4 px-8 rounded-lg transition-all duration-300 pointer-events-auto w-full sm:w-auto"
                    >
                        {t('home.hero.cta_secondary')}
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* --- NEWS TICKER --- */}
      <NewsTicker />
      
      {/* --- NEW: PROPIETARIOS DIRECT ACTION (ANIMATED) --- */}
      <section className="bg-gray-50 py-10 border-b border-gray-200 overflow-hidden">
          <div className="container mx-auto px-4">
              <div 
                className="bg-white rounded-2xl border-l-4 border-rentia-gold p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto relative z-30 mt-4 animate-in slide-in-from-bottom-8 duration-700 fade-in group hover:-translate-y-1 transition-all animate-pulse-glow"
              >
                  <div className="flex items-start gap-5">
                      <div className="bg-rentia-black text-white p-4 rounded-2xl hidden sm:flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Home className="w-8 h-8 text-rentia-gold" />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                              ¿Tienes una propiedad vacía?
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rentia-gold opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rentia-gold"></span>
                              </span>
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                              Gestionamos tu alquiler y garantizamos tu tranquilidad. <br className="hidden sm:block"/>
                              <span className="font-bold text-rentia-blue">Calcula tu rentabilidad ahora.</span>
                          </p>
                      </div>
                  </div>
                  <button 
                    onClick={() => window.location.hash = '#/publicar-propiedad'}
                    className="w-full md:w-auto bg-rentia-black hover:bg-gray-900 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-rentia-blue/20 flex items-center justify-center gap-2 group/btn active:scale-95"
                  >
                      <PlusCircle className="w-5 h-5 text-rentia-gold group-hover/btn:rotate-90 transition-transform duration-300" />
                      Publicar mi Propiedad
                  </button>
              </div>
          </div>
      </section>

      {/* --- REST OF THE HOME CONTENT --- */}
      {/* ... (Solutions, Process, Steps, CTA, Testimonials, FAQ, Contact) */}
      <section className="py-20 md:py-24 bg-white relative">
          <div className="container mx-auto px-4 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                  <h2 className="text-2xl md:text-4xl font-bold mb-4 text-rentia-black font-display">{t('home.solutions.title')}</h2>
                  <p className="text-gray-600">{t('home.solutions.subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Card 1 */}
                  <div className="bg-white p-8 md:p-10 rounded-2xl shadow-idealista hover:shadow-idealista-hover transition-all duration-300 group border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-50 text-rentia-blue flex items-center justify-center mb-6 group-hover:bg-rentia-blue group-hover:text-white transition-colors duration-300">
                          <KeyRound className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3 text-rentia-black group-hover:text-rentia-blue transition-colors">{t('home.solutions.card1_title')}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm md:text-base">{t('home.solutions.card1_desc')}</p>
                  </div>
                  
                   {/* Card 2 */}
                   <div className="bg-white p-8 md:p-10 rounded-2xl shadow-idealista hover:shadow-idealista-hover transition-all duration-300 group border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-yellow-50 text-rentia-gold flex items-center justify-center mb-6 group-hover:bg-rentia-gold group-hover:text-rentia-black transition-colors duration-300">
                          <Megaphone className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-3 text-rentia-black group-hover:text-rentia-blue transition-colors">{t('home.solutions.card2_title')}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm md:text-base">{t('home.solutions.card2_desc')}</p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- PROCESS ICONS (INTERACTIVE) --- */}
       <section className="py-16 md:py-20 bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-4">
             <div className="text-center mb-10 md:mb-12">
                 <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display">{t('home.process.title')}</h2>
                 <p className="text-gray-500 mt-2">{t('home.process.subtitle')}</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-center">
                 {processSteps.map((step, index) => (
                    <div 
                        key={index}
                        onClick={() => setSelectedProcess(step)}
                        className="p-6 md:p-8 bg-white border border-gray-100 rounded-xl shadow-idealista hover:shadow-idealista-hover transition-all duration-300 group hover:-translate-y-1 cursor-pointer relative"
                    >
                        <div className="absolute top-4 right-4 text-gray-300 group-hover:text-rentia-gold transition-colors">
                            <ArrowRight className="w-5 h-5 transform -rotate-45 group-hover:rotate-0 transition-transform" />
                        </div>
                        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4 group-hover:bg-rentia-blue group-hover:text-white transition-colors">
                            {step.icon}
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-rentia-black group-hover:text-rentia-blue transition-colors">{step.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{step.shortDesc}</p>
                        <p className="text-xs font-bold text-rentia-blue mt-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wide">Ver más detalles</p>
                    </div>
                 ))}
             </div>
          </div>
       </section>

        {/* PROCESS MODAL */}
        {selectedProcess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSelectedProcess(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden relative transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                    <div className="bg-rentia-blue p-6 flex justify-between items-center">
                        <div className="text-white flex items-center gap-3">
                            {selectedProcess.icon}
                            <h3 className="text-xl font-bold font-display">{selectedProcess.title}</h3>
                        </div>
                        <button onClick={() => setSelectedProcess(null)} className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto">
                        <h4 className="text-gray-900 font-bold mb-3 text-lg">¿En qué consiste?</h4>
                        <p className="text-gray-600 leading-relaxed text-base mb-6">
                            {selectedProcess.longDesc}
                        </p>
                        
                        <h5 className="text-sm font-bold text-rentia-black uppercase tracking-wide mb-3">Incluye:</h5>
                        <ul className="space-y-2 mb-6">
                            {selectedProcess.details.map((detail, i) => (
                                <li key={i} className="flex items-start text-sm text-gray-700">
                                    <div className="mt-0.5 mr-2 w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {detail}
                                </li>
                            ))}
                        </ul>

                        <div className="bg-gray-50 p-4 rounded text-xs text-gray-500 border border-gray-100 italic">
                            * En RentiaRoom trabajamos para ofrecer el mejor servicio, adaptándonos a las circunstancias del mercado y de cada propietario.
                        </div>
                        
                        <button 
                            onClick={() => setSelectedProcess(null)}
                            className="w-full mt-6 bg-rentia-black text-white hover:bg-gray-800 font-bold py-3 px-4 rounded-lg transition-colors min-h-[44px]"
                        >
                            {t('home.process.modal_close')}
                        </button>
                    </div>
                </div>
            </div>
        )}

      {/* --- STEPS SECTION --- */}
      <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
                  <h2 className="text-2xl md:text-4xl font-bold text-rentia-black font-display mb-4">{t('home.steps.title')}</h2>
                  <p className="text-gray-600 text-lg">{t('home.steps.subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
                  {/* Step 1 */}
                  <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex gap-6 hover:shadow-md transition-all duration-300">
                      <div className="text-4xl md:text-5xl font-bold text-gray-100 font-display">01</div>
                      <div>
                          <h3 className="text-lg md:text-xl font-bold mb-3 text-rentia-black flex items-center gap-2">
                              <UserCheck className="w-5 h-5 text-rentia-blue" />
                              {t('home.steps.s1_title')}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 leading-relaxed">{t('home.steps.s1_desc')}</p>
                      </div>
                  </div>
                  {/* Step 2 */}
                   <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex gap-6 hover:shadow-md transition-all duration-300">
                      <div className="text-4xl md:text-5xl font-bold text-gray-100 font-display">02</div>
                      <div>
                          <h3 className="text-lg md:text-xl font-bold mb-3 text-rentia-black flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-rentia-blue" />
                                {t('home.steps.s2_title')}
                          </h3>
                           <p className="text-gray-600 text-sm mb-3 leading-relaxed">{t('home.steps.s2_desc')}</p>
                      </div>
                  </div>
                   {/* Step 3 */}
                   <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex gap-6 hover:shadow-md transition-all duration-300">
                      <div className="text-4xl md:text-5xl font-bold text-gray-100 font-display">03</div>
                      <div>
                          <h3 className="text-lg md:text-xl font-bold mb-3 text-rentia-black flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-rentia-blue" />
                                {t('home.steps.s3_title')}
                          </h3>
                           <p className="text-gray-600 text-sm mb-3 leading-relaxed">{t('home.steps.s3_desc')}</p>
                      </div>
                  </div>
                   {/* Step 4 */}
                   <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex gap-6 hover:shadow-md transition-all duration-300">
                      <div className="text-4xl md:text-5xl font-bold text-gray-100 font-display">04</div>
                      <div>
                          <h3 className="text-lg md:text-xl font-bold mb-3 text-rentia-black flex items-center gap-2">
                                <Home className="w-5 h-5 text-rentia-blue" />
                                {t('home.steps.s4_title')}
                          </h3>
                           <p className="text-gray-600 text-sm mb-3 leading-relaxed">{t('home.steps.s4_desc')}</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

       {/* --- CTA SECTION --- */}
       <section className="py-16 md:py-24 bg-gray-50">
           <div className="container mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-idealista overflow-hidden flex flex-col md:flex-row max-w-6xl mx-auto">
                    <div className="p-8 md:p-16 flex-1 flex flex-col justify-center">
                        <h2 className="text-2xl md:text-4xl font-bold mb-6 text-rentia-black font-display leading-tight">
                            {t('home.cta.title')}
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            {t('home.cta.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20vuestros%20servicios" target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center bg-rentia-blue hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-md">
                                <MessageCircle className="w-5 h-5 mr-2" />
                                {t('home.cta.whatsapp')}
                            </a>
                            <a href="tel:+34672886369" className="inline-flex justify-center items-center bg-white hover:bg-gray-50 text-rentia-black border border-gray-200 font-bold py-3 px-8 rounded-lg transition-all duration-300">
                                {t('home.cta.call')}
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
                            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80" 
                            alt="Gestión Propiedad" 
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${ctaLoaded ? 'opacity-100' : 'opacity-0'}`} 
                            onLoad={() => setCtaLoaded(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10"></div>
                    </div>
                </div>
           </div>
       </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12 md:mb-16">
                  <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display">{t('home.testimonials.title')}</h2>
                  <p className="text-gray-600 mt-2">{t('home.testimonials.subtitle')}</p>
                  <div className="flex items-center justify-center mt-4 gap-1 text-rentia-gold">
                     {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                     <span className="ml-2 text-sm font-bold text-gray-600">{t('home.testimonials.quality')}</span>
                  </div>
              </div>
              
              {/* Masonry Layout */}
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 max-w-7xl mx-auto space-y-6">
                  {testimonials.map((testi, index) => (
                      <div key={index} className="break-inside-avoid bg-white p-6 md:p-8 rounded-xl shadow-idealista hover:shadow-idealista-hover border border-gray-100 transition-all duration-300 relative group hover:-translate-y-1 overflow-hidden">
                          {/* Top Hover Accent */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-transparent group-hover:bg-rentia-gold transition-colors duration-300"></div>
                          
                          {/* Background Quote Icon */}
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
                                   {[1,2,3,4,5].map(star => <Star key={star} className="w-3.5 h-3.5 fill-current" />)}
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

      {/* --- FAQ SECTION --- */}
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

      {/* --- DUAL CONTACT SECTION --- */}
      <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
                  <h2 className="text-2xl md:text-4xl font-bold font-display text-rentia-black mb-4">{t('home.contact_dual.title')}</h2>
                  <p className="text-gray-600 text-lg">
                      {t('home.contact_dual.subtitle')}
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  
                  {/* Card 1: SANDRA */}
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                      <div className="bg-rentia-black p-6 text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-700 rounded-full mix-blend-overlay filter blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                          <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                  <FileText className="w-6 h-6 text-rentia-gold" />
                              </div>
                              <h3 className="font-bold text-xl">{config.adminContact.role}</h3>
                          </div>
                          <p className="text-gray-400 text-sm">{t('home.contact_dual.admin_card.desc')}</p>
                      </div>
                      <div className="p-6 md:p-8">
                           <div className="flex items-start gap-4 mb-6">
                               <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-rentia-black font-bold text-xl overflow-hidden">
                                {config.adminContact.image ? <img src={config.adminContact.image} alt={config.adminContact.name} className="w-full h-full object-cover" /> : config.adminContact.name.charAt(0)}
                               </div>
                               <div>
                                   <p className="font-bold text-rentia-black text-lg">{config.adminContact.name}</p>
                                   <p className="text-sm text-gray-500">{config.adminContact.role}</p>
                               </div>
                           </div>
                           
                           <div className="space-y-3 mb-8">
                               <div className="flex items-center gap-3 text-gray-600 text-sm">
                                   <Clock className="w-4 h-4 text-rentia-blue" />
                                   <span>Lunes a Viernes: <span className="font-bold text-rentia-black">{String(config.adminContact.startHour).padStart(2, '0')}:00 - {String(config.adminContact.endHour).padStart(2, '0')}:00</span></span>
                               </div>
                               <div className="flex items-center gap-3 text-gray-600 text-sm">
                                   <Smartphone className="w-4 h-4 text-rentia-blue" />
                                   <span>{t('home.contact_dual.admin_card.label_phone')}</span>
                               </div>
                           </div>

                           <a 
                            href={`https://api.whatsapp.com/send?phone=${config.adminContact.phone}&text=${encodeURIComponent(config.adminContact.whatsappMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-[#25D366] text-gray-800 hover:text-white font-bold py-4 px-6 rounded-xl transition-all border border-gray-200 hover:border-[#25D366]"
                           >
                               <MessageCircle className="w-5 h-5" />
                               {t('home.contact_dual.admin_card.btn')}
                           </a>
                      </div>
                  </div>

                  {/* Card 2: POL */}
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
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
