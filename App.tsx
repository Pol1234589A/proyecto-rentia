
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

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts'>('home');
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);

  // Handle URL Query Params for Deep Linking (Share functionality)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedOppId = params.get('opp');

    if (sharedOppId) {
      const exists = opportunities.find(o => o.id === sharedOppId);
      if (exists) {
        setSelectedId(sharedOppId);
        setView('list');
        // Clean URL without reload to look nicer, but keep history
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // SEO Management System
  useEffect(() => {
    let title = "RentiaRoom | Gestión de Alquiler por Habitaciones e Inversión en Murcia";
    let description = "Expertos en gestión integral de alquiler por habitaciones y oportunidades de inversión inmobiliaria en Murcia. Rentabilidad garantizada y gestión 360.";

    // Logic to update meta tags based on view
    switch (view) {
      case 'home':
        title = "RentiaRoom | Gestión de Alquiler por Habitaciones e Inversión en Murcia";
        description = "Transformamos tu propiedad en una inversión rentable. Expertos en gestión integral de habitaciones en Murcia, gestión de inquilinos y oportunidades de inversión.";
        break;
      case 'services':
        title = "Servicios de Gestión Integral y Rent to Rent | RentiaRoom Murcia";
        description = "Descubre nuestros servicios: Gestión integral de alquileres, Rent to Rent, optimización de ingresos y mantenimiento en Murcia. Tu tranquilidad es nuestro objetivo.";
        break;
      case 'rooms':
        title = "Habitaciones Disponibles en Murcia | Catálogo RentiaRoom";
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
          title = "Oportunidades de Inversión Inmobiliaria en Murcia | RentiaRoom";
          description = "Accede a las mejores oportunidades de inversión inmobiliaria en Murcia. Pisos rentables, análisis financiero y gestión integral para inversores.";
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

    // Scroll to top when navigating
    window.scrollTo(0, 0);

  }, [selectedId, view]);

  const handleCardClick = (id: string) => {
    setView('list'); // Ensure view is 'list' when clicking a card
    setSelectedId(id);
  };

  const handleNavigate = (newView: 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts') => {
    setSelectedId(null);
    setView(newView);
  };

  const handleNext = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex < opportunities.length - 1) {
      setSelectedId(opportunities[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex > 0) {
      setSelectedId(opportunities[currentIndex - 1].id);
    }
  };

  const openLegalModal = (type: ModalType) => {
    setActiveLegalModal(type);
  };

  const selectedOpportunity = opportunities.find(o => o.id === selectedId);

  const renderContent = () => {
    if (view === 'list' && selectedOpportunity) {
      return (
        <DetailView 
          opportunity={selectedOpportunity} 
          onBack={() => setSelectedId(null)}
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
            <section className="relative py-24 bg-rentia-black overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full z-0">
                  <img 
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80" 
                      alt="Inversión Inmobiliaria RentiaRoom" 
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
                  <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 drop-shadow-md">
                      Oportunidades de Inversión
                  </h1>
                  <p className="text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-light leading-relaxed">
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
                   <h2 className="text-3xl font-bold text-rentia-black font-display mb-4">Muy pronto tendremos más</h2>
                   <p className="text-gray-600 text-lg max-w-2xl mb-8 leading-relaxed">
                     Actualmente hemos vendido toda nuestra cartera disponible. Estamos analizando nuevos activos que saldrán al mercado en los próximos días.
                     <br/><br/>
                     <span className="font-semibold text-rentia-black">¿Quieres ser el primero en enterarte?</span> Únete a nuestro canal privado donde publicamos las novedades antes que en la web.
                   </p>
                   
                   <a 
                      href="https://whatsapp.com/channel/0029VbBsvhOIt5rpshbpYN1P" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
                   >
                      <MessageCircle className="w-6 h-6" />
                      Unirme al Canal de Oportunidades
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

      <main className="flex-grow bg-[#f9f9f9]">
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
