
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
import { LegalModals, ModalType } from './components/LegalModals';
import { opportunities } from './data';
import { TrendingUp, MessageCircle, Bell } from 'lucide-react';

// Type alias for easier usage
type ViewType = 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts';

// Mapping URL paths to Views for SEO
const PATH_MAP: Record<string, ViewType> = {
  '/': 'home',
  '/servicios': 'services',
  '/habitaciones': 'rooms',
  '/oportunidades': 'list',
  '/contacto': 'contact',
  '/nosotros': 'about',
  '/descuentos': 'discounts'
};

const VIEW_TO_PATH: Record<ViewType, string> = {
  'home': '/',
  'services': '/servicios',
  'rooms': '/habitaciones',
  'list': '/oportunidades',
  'contact': '/contacto',
  'about': '/nosotros',
  'discounts': '/descuentos'
};

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('home');
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);

  // Initialize view based on URL on first load
  useEffect(() => {
    const path = window.location.pathname;
    
    // Check for deep link params first (legacy or sharing support)
    const params = new URLSearchParams(window.location.search);
    const sharedOppId = params.get('opp');

    if (sharedOppId) {
       const exists = opportunities.find(o => o.id === sharedOppId);
       if (exists) {
         setSelectedId(sharedOppId);
         setView('list');
         // Normalize URL
         window.history.replaceState({}, '', '/oportunidades');
         return;
       }
    }

    // Route matching
    const matchedView = PATH_MAP[path] || 'home';
    setView(matchedView);

    // Handle browser back/forward buttons
    const handlePopState = () => {
       const newPath = window.location.pathname;
       const newView = PATH_MAP[newPath] || 'home';
       
       // Handle back to list logic
       if (newView === 'list' && selectedId) {
          setSelectedId(null);
       }
       setView(newView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  // SEO Management System
  useEffect(() => {
    let title = "RentiaRoom | Expertos en Alquiler por Habitaciones e Inversión en Murcia";
    let description = "Expertos en gestión integral de alquiler por habitaciones y oportunidades de inversión inmobiliaria en Murcia. Rentabilidad garantizada y gestión 360.";
    let path = VIEW_TO_PATH[view];

    // Logic to update meta tags based on view
    switch (view) {
      case 'home':
        title = "RentiaRoom | Líderes en Gestión de Habitaciones en Murcia";
        description = "Empresa referente en gestión de habitaciones en Murcia. Transformamos tu propiedad en una inversión rentable. Expertos en alquiler por habitaciones.";
        break;
      case 'services':
        title = "Servicios de Gestión Integral de Habitaciones | RentiaRoom Murcia";
        description = "Descubre nuestros servicios: Gestión integral de alquileres, Rent to Rent, optimización de ingresos y mantenimiento en Murcia. Tu tranquilidad es nuestro objetivo.";
        break;
      case 'rooms':
        title = "Habitaciones en Alquiler Murcia | Catálogo RentiaRoom";
        description = "Consulta nuestro catálogo en tiempo real de habitaciones disponibles en Murcia. Alquiler para estudiantes y trabajadores con gestión profesional.";
        break;
      case 'list':
        if (selectedId) {
          const opp = opportunities.find(o => o.id === selectedId);
          if (opp) {
            title = `${opp.title} | Oportunidad Inversión RentiaRoom`;
            description = `${opp.description.substring(0, 150)}... Inversión inmobiliaria en ${opp.city} con rentabilidad estimada.`;
          }
        } else {
          title = "Oportunidades para Inversores Inmobiliarios en Murcia | RentiaRoom";
          description = "Accede a las mejores oportunidades para inversores en Murcia. Pisos rentables, análisis financiero y gestión integral para inversores.";
        }
        break;
      case 'contact':
        title = "Contactar con RentiaRoom | Gestión Inmobiliaria Murcia";
        description = "Contacta con el equipo de RentiaRoom. Atención directa por WhatsApp para propietarios e inversores. Estamos en Murcia.";
        break;
      case 'about':
        title = "Sobre Nosotros | El Equipo RentiaRoom Murcia";
        description = "Conoce a Pol y Víctor, fundadores de RentiaRoom. Unimos experiencia en Personal Shopper Inmobiliario y gestión de alquileres para maximizar tu rentabilidad.";
        break;
      case 'discounts':
        title = "Calculadora de Tarifas y Descuentos | RentiaRoom";
        description = "Calcula tu comisión de gestión personalizada. Ofrecemos descuentos por volumen de propiedades y referidos en Murcia.";
        break;
      default:
        // Default values
        break;
    }

    // Apply Title
    document.title = title;

    // Apply Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Apply Canonical Link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const fullUrl = `https://www.rentiaroom.com${path === '/' ? '' : path}`;
    
    if (canonicalLink) {
        canonicalLink.setAttribute('href', fullUrl);
    } else {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = fullUrl;
        document.head.appendChild(link);
    }

    // Scroll to top when navigating
    window.scrollTo(0, 0);

  }, [selectedId, view]);

  const handleNavigate = (newView: ViewType) => {
    setSelectedId(null);
    setView(newView);
    // Update URL history
    const path = VIEW_TO_PATH[newView];
    window.history.pushState({}, '', path);
  };

  const openLegalModal = (type: ModalType) => {
    setActiveLegalModal(type);
  };

  const handleCardClick = (id: string) => {
    setSelectedId(id);
    setView('list'); 
    window.history.pushState({}, '', `/oportunidades?opp=${id}`);
  };

  const handleBackToOpportunities = () => {
    setSelectedId(null);
    window.history.pushState({}, '', '/oportunidades');
  };

  const handleNext = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex < opportunities.length - 1) {
      const nextId = opportunities[currentIndex + 1].id;
      setSelectedId(nextId);
      window.history.replaceState({}, '', `/oportunidades?opp=${nextId}`);
    }
  };

  const handlePrev = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex > 0) {
      const prevId = opportunities[currentIndex - 1].id;
      setSelectedId(prevId);
      window.history.replaceState({}, '', `/oportunidades?opp=${prevId}`);
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
      case 'list':
        return (
          <>
            {/* Hero Section for Opportunities */}
            <section className="relative py-20 md:py-24 bg-rentia-black overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full z-0">
                  <img 
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80" 
                      alt="Oportunidades para Inversores RentiaRoom" 
                      className="w-full h-full object-cover grayscale opacity-60"
                  />
                  {/* Blue tint overlay for brand consistency */}
                  <div className="absolute inset-0 bg-rentia-blue/60 mix-blend-multiply"></div>
                  {/* Dark overlay + blur for text readability */}
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
              {opportunities.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {opportunities.map(opp => (
                    <OpportunityCard 
                      key={opp.id} 
                      opportunity={opp} 
                      onClick={handleCardClick} 
                    />
                  ))}
                </div>
              ) : (
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
              )}
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

      {/* Added relative z-0 to establish new stacking context below header */}
      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        {renderContent()}
      </main>

      {/* Persistent WhatsApp Button */}
      <WhatsAppButton />

      {/* Legal Modals */}
      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />

      <Footer onNavigate={handleNavigate} openLegalModal={openLegalModal} />
    </div>
  );
}

export default App;
