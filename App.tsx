
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OpportunityCard } from './components/OpportunityCard';
import { DetailView } from './components/DetailView';
import { WhatsAppButton } from './components/WhatsAppButton';
import { HomeView } from './components/HomeView';
import { ServicesView } from './components/ServicesView';
import { RoomsView } from './components/RoomsView';
import { ContactView } from './components/ContactView';
import { AboutView } from './components/AboutView';
import { DiscountsView } from './components/DiscountsView';
import { BlogView } from './components/BlogView';
import { LegalModals, ModalType } from './components/LegalModals';
import { opportunities } from './data';
import { TrendingUp, MessageCircle, Bell } from 'lucide-react';
import { LanguageProvider } from './contexts/LanguageContext';

// Type alias for easier usage
type ViewType = 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts' | 'blog';

// Mapping Hash paths to Views for Router
const PATH_MAP: Record<string, ViewType> = {
  '#/': 'home',
  '#/servicios': 'services',
  '#/habitaciones': 'rooms',
  '#/oportunidades': 'list',
  '#/contacto': 'contact',
  '#/nosotros': 'about',
  '#/descuentos': 'discounts',
  '#/blog': 'blog'
};

const VIEW_TO_HASH: Record<ViewType, string> = {
  'home': '#/',
  'services': '#/servicios',
  'rooms': '#/habitaciones',
  'list': '#/oportunidades',
  'contact': '#/contacto',
  'about': '#/nosotros',
  'discounts': '#/descuentos',
  'blog': '#/blog'
};

function AppContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('home');
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);

  // Initialize view based on Hash on first load and listen to changes
  useEffect(() => {
    const handleHashChange = () => {
        let hash = window.location.hash || '#/';
        
        // Separa el hash de los parámetros (ej: #/oportunidades?opp=1)
        const [baseHash, query] = hash.split('?');

        // Manejar query params para oportunidades (ej: #/oportunidades?opp=1)
        if (baseHash === '#/oportunidades' && query) {
            const params = new URLSearchParams(query);
            const oppId = params.get('opp');
            if (oppId) {
                 const exists = opportunities.find(o => o.id === oppId);
                 if (exists) setSelectedId(oppId);
            } else {
                setSelectedId(null);
            }
        } else if (baseHash !== '#/oportunidades') {
            // Si navegamos fuera de oportunidades, reseteamos la selección
            setSelectedId(null);
        }

        // Buscar la vista correspondiente usando solo la base del hash
        const matchedView = PATH_MAP[baseHash] || 'home';
        setView(matchedView);
        
        // Scroll to top
        window.scrollTo(0, 0);
    };

    // Run once on mount
    handleHashChange();

    // Listen for changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // SEO Management System - Optimized for 3 Verticals
  useEffect(() => {
    let title = "RentiaRoom | Gestión, Inversión y Alquiler en Murcia";
    let description = "Expertos en gestión integral de alquiler por habitaciones y oportunidades de inversión inmobiliaria en Murcia. Rentabilidad garantizada y gestión 360.";
    
    switch (view) {
      case 'home':
        // TARGET: Owners & General Branding
        title = "RentiaRoom Murcia | Gestión de Pisos y Alquiler por Habitaciones";
        description = "Transformamos tu propiedad en Murcia en una inversión rentable. Nos encargamos de la gestión integral, alquiler por habitaciones y optimización de ingresos.";
        break;
      case 'services':
        // TARGET: Owners
        title = "Servicios de Gestión Integral para Propietarios | RentiaRoom";
        description = "¿Tienes un piso en Murcia? Descubre nuestros servicios de gestión integral, Rent to Rent, seguro de impagos y reformas para alquiler. Despreocúpate y cobra mes a mes.";
        break;
      case 'rooms':
        // TARGET: Tenants
        title = "Alquiler de Habitaciones en Murcia | Estudiantes y Trabajadores";
        description = "Encuentra tu habitación ideal en Murcia. Pisos compartidos premium para estudiantes UCAM/UMU y trabajadores. Sin comisiones ocultas, totalmente equipadas.";
        break;
      case 'list':
        if (selectedId) {
          const opp = opportunities.find(o => o.id === selectedId);
          if (opp) {
            title = `Inversión: ${opp.title} | Rentabilidad > 8% Murcia`;
            description = `Oportunidad de inversión inmobiliaria en ${opp.city}. ${opp.specs.rooms} habitaciones. Rentabilidad neta estimada alta. Gestión integral incluida por RentiaRoom.`;
          }
        } else {
          // TARGET: Investors
          title = "Invertir en Murcia | Oportunidades Inmobiliarias Rentables";
          description = "Cartera exclusiva de oportunidades de inversión en Murcia. Pisos analizados para alquiler por habitaciones con altas rentabilidades y gestión delegada.";
        }
        break;
      case 'contact':
        title = "Contactar RentiaRoom | Gestión Inmobiliaria en Murcia";
        description = "Habla con nuestro equipo. Atención directa por WhatsApp para propietarios e inversores. Oficinas en Murcia.";
        break;
      case 'about':
        title = "Sobre RentiaRoom | Expertos en Coliving e Inversión";
        description = "Conoce al equipo detrás de RentiaRoom. Unimos experiencia financiera y gestión operativa para revolucionar el alquiler en Murcia.";
        break;
      case 'discounts':
        title = "Calculadora de Tarifas de Gestión | RentiaRoom";
        description = "Calcula tu comisión de gestión personalizada. Descuentos especiales para grandes tenedores e inversores con múltiples propiedades en Murcia.";
        break;
      case 'blog':
        title = "Blog Inmobiliario Murcia | Rentabilidad, Inversión y Consejos";
        description = "Artículos expertos sobre inversión inmobiliaria en Murcia, gestión de alquileres, normativa legal y tendencias del mercado. Aprende con RentiaRoom.";
        break;
      default:
        break;
    }

    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', description);

  }, [selectedId, view]);

  const handleNavigate = (newView: ViewType) => {
    // Updating hash triggers the useEffect defined above
    window.location.hash = VIEW_TO_HASH[newView];
  };

  const openLegalModal = (type: ModalType) => {
    setActiveLegalModal(type);
  };

  const handleCardClick = (id: string) => {
    window.location.hash = `#/oportunidades?opp=${id}`;
  };

  const handleBackToOpportunities = () => {
    window.location.hash = '#/oportunidades';
  };

  const handleNext = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex < opportunities.length - 1) {
      const nextId = opportunities[currentIndex + 1].id;
      window.location.hash = `#/oportunidades?opp=${nextId}`;
    }
  };

  const handlePrev = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex > 0) {
      const prevId = opportunities[currentIndex - 1].id;
      window.location.hash = `#/oportunidades?opp=${prevId}`;
    }
  };

  const selectedOpportunity = opportunities.find(o => o.id === selectedId);

  const renderContent = () => {
    if (view === 'list' && selectedOpportunity) {
      return (
        <DetailView 
          opportunity={selectedOpportunity} 
          onBack={handleBackToOpportunities}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={opportunities.findIndex(o => o.id === selectedId) < opportunities.length - 1}
          hasPrev={opportunities.findIndex(o => o.id === selectedId) > 0}
          onNavigate={handleNavigate}
        />
      );
    }

    switch (view) {
      case 'home':
        return <HomeView onNavigate={handleNavigate} />;
      case 'services':
        return <ServicesView />;
      case 'rooms':
        return <RoomsView />;
      case 'contact':
        return <ContactView />;
      case 'about':
        return <AboutView />;
      case 'discounts':
        return <DiscountsView />;
      case 'blog':
        return <BlogView />;
      case 'list':
        return (
          <>
            {/* Hero Section for Opportunities */}
            <section className="relative py-20 md:py-24 bg-rentia-black overflow-hidden">
              <div className="absolute inset-0 w-full h-full z-0">
                  <img 
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80" 
                      alt="Oportunidades para Inversores RentiaRoom" 
                      className="w-full h-full object-cover grayscale opacity-60"
                  />
                  <div className="absolute inset-0 bg-rentia-blue/60 mix-blend-multiply"></div>
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>
              </div>

              <div className="relative z-10 container mx-auto px-4 text-center text-white">
                  <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1 rounded-full mb-6 font-bold text-sm shadow-lg uppercase tracking-wider">
                      <TrendingUp className="w-4 h-4" />
                      Cartera Exclusiva
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 drop-shadow-md">
                      Oportunidades para Inversores
                  </h1>
                  <p className="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-light leading-relaxed">
                      Propiedades seleccionadas y analizadas para ofrecer la máxima rentabilidad mediante nuestro modelo de gestión integral.
                  </p>
              </div>
            </section>

            {/* Opportunities Grid or Empty State */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                 <div className="bg-blue-50 p-6 rounded-full mb-6">
                    <Bell className="w-12 h-12 text-rentia-blue" />
                 </div>
                 <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display mb-4">Muy pronto tendremos más</h2>
                 <p className="text-gray-600 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
                   Actualmente hemos vendido toda nuestra cartera disponible. Estamos analizando nuevos activos que saldrán al mercado en los próximos días.
                   <br/><br/>
                   <span className="font-semibold text-rentia-black">¿Quieres ser el primero en enterarte?</span> Únete a nuestro canal privado donde publicamos las novedades antes que en la web.
                 </p>
                 
                 <a 
                    href="https://whatsapp.com/channel/0029VbBsvhOIt5rpshbpYN1P" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform w-full md:w-auto justify-center"
                 >
                    <MessageCircle className="w-6 h-6" />
                    Unirme al Canal de Inversores
                 </a>
                 <p className="text-xs text-gray-400 mt-4">Acceso gratuito y exclusivo vía WhatsApp</p>
              </div>
            </div>
          </>
        );
      default:
        return <HomeView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header onNavigate={handleNavigate} />

      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        {renderContent()}
      </main>

      <WhatsAppButton />

      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />

      <Footer onNavigate={handleNavigate} openLegalModal={openLegalModal} />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
