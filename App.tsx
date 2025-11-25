
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
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
import { TrendingUp } from 'lucide-react';

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

  // Scroll to top when navigating
  useEffect(() => {
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

            {/* Opportunities Grid */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {opportunities.map(opp => (
                  <OpportunityCard 
                    key={opp.id} 
                    opportunity={opp} 
                    onClick={handleCardClick} 
                  />
                ))}
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

      <main className="flex-grow bg-[#f9f9f9]">
        {renderContent()}
      </main>

      {/* Persistent WhatsApp Button */}
      <WhatsAppButton />

      {/* Legal Modals */}
      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />

      <footer className="bg-[#0072CE] text-white pt-16 font-sans no-print">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Column 1: Logo & Slogan */}
            <div className="space-y-6">
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('home'); }}>
                <img 
                  src="https://rentiaroom.com/wp-content/uploads/2024/12/Logo-Negativo-1.png" 
                  alt="RentiaRoom" 
                  className="h-auto w-48 brightness-0 invert"
                />
              </a>
              <p className="text-white text-[15px] leading-relaxed">
                Gestionamos tus habitaciones, tú disfrutas de la rentabilidad.
              </p>
            </div>

            {/* Column 2: Links */}
            <div>
              <h6 className="text-xl font-bold mb-6 text-white">Enlaces</h6>
              <ul className="space-y-3 text-[15px] text-white">
                <li>
                    <button onClick={() => openLegalModal('legal')} className="hover:text-[#edcd20] transition-colors text-left">
                        Aviso legal
                    </button>
                </li>
                <li>
                    <button onClick={() => openLegalModal('privacy')} className="hover:text-[#edcd20] transition-colors text-left">
                        Políticas de privacidad
                    </button>
                </li>
                <li>
                    <button onClick={() => openLegalModal('social')} className="hover:text-[#edcd20] transition-colors text-left">
                        Política de privacidad de redes sociales
                    </button>
                </li>
                <li>
                    <button onClick={() => openLegalModal('cookies')} className="hover:text-[#edcd20] transition-colors text-left">
                        Política de cookies
                    </button>
                </li>
                <li>
                    <button onClick={() => openLegalModal('cookiesPanel')} className="hover:text-[#edcd20] transition-colors text-left flex items-center gap-2">
                        ⚙️ Panel Cookies
                    </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h6 className="text-xl font-bold mb-6 text-white">Ponte en contacto</h6>
              <div className="space-y-4 text-[14px] text-white">
                <p className="font-bold border-b border-white/20 pb-2 mb-3">Murcia (España)</p>
                
                {/* Sandra */}
                <div className="mb-4">
                    <p className="font-bold text-[#edcd20]">Secretaría y Administración (Sandra)</p>
                    <p className="text-white/80 text-xs mb-1">Lunes a Viernes: 09:00h - 14:00h</p>
                    <a href="tel:+34611948589" className="hover:text-[#edcd20] transition-colors flex items-center gap-2">
                        📞 +34 611 94 85 89
                    </a>
                </div>

                {/* Pol */}
                <div>
                    <p className="font-bold text-[#edcd20]">Dirección y Oportunidades (Pol)</p>
                    <p className="text-white/80 text-xs mb-1">Lunes a Viernes: 09:00h - 20:00h</p>
                    <a href="tel:+34672886369" className="hover:text-[#edcd20] transition-colors flex items-center gap-2">
                        📞 +34 672 88 63 69
                    </a>
                </div>

                <p className="pt-4 mt-2 border-t border-white/20">
                  <a href="mailto:info@rentiaroom.com" className="hover:text-[#edcd20] transition-colors">
                    ✉️ info@rentiaroom.com
                  </a>
                </p>
              </div>

              {/* Social Icons */}
              <div className="flex space-x-3 mt-6">
                <a href="https://www.facebook.com/share/1Cpvx6fmh2/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white hover:text-[#0072CE] transition-colors">
                   <svg className="w-5 h-5 fill-current" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>
                </a>
                <a href="https://www.instagram.com/rentiaroom_/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white hover:text-[#0072CE] transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>
                </a>
                <a href="https://www.linkedin.com/company/rentia-room/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white hover:text-[#0072CE] transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>
                </a>
                 <a href="https://www.tiktok.com/@rentiaroom" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white hover:text-[#0072CE] transition-colors">
                  <svg viewBox="0 0 448 512" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#002849] py-6 text-center">
             <p className="text-white text-[15px] font-light">© 2025 Todos los derechos resevados</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
