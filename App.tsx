
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DetailView } from './components/DetailView';
import { WhatsAppButton } from './components/WhatsAppButton';
import { HomeView } from './components/HomeView';
import { ServicesView } from './components/ServicesView';
import { RoomsView } from './components/RoomsView';
import { AboutView } from './components/AboutView';
import { DiscountsView } from './components/DiscountsView';
import { BlogView } from './components/BlogView';
import { BrokerView } from './components/BrokerView';
import { OwnerDashboard } from './components/dashboards/OwnerDashboard';
import { TenantDashboard } from './components/dashboards/TenantDashboard';
import { BrokerDashboardInternal } from './components/dashboards/BrokerDashboard';
import { StaffDashboard } from './components/dashboards/StaffDashboard';
import { AgencyDashboard } from './components/dashboards/AgencyDashboard';
import { LegalModals, ModalType } from './components/LegalModals';
import { CollaborationBanner } from './components/CollaborationBanner';
import { OpportunityCard } from './components/OpportunityCard'; 
import { Opportunity } from './types';
import { TrendingUp, MessageCircle, Bell } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Type alias
type ViewType = 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts' | 'blog' | 'brokers' | 'intranet';

// Mapping Hash paths
const PATH_MAP: Record<string, ViewType> = {
  '#/': 'home',
  '#/servicios': 'services',
  '#/habitaciones': 'rooms',
  '#/oportunidades': 'list',
  '#/contacto': 'about', // Redirigir contacto a about (nosotros)
  '#/nosotros': 'about',
  '#/descuentos': 'discounts',
  '#/blog': 'blog',
  '#/colaboradores': 'brokers',
  '#/intranet': 'intranet'
};

const VIEW_TO_HASH: Record<ViewType, string> = {
  'home': '#/',
  'services': '#/servicios',
  'rooms': '#/habitaciones',
  'list': '#/oportunidades',
  'contact': '#/nosotros', // Contacto ahora va a nosotros
  'about': '#/nosotros',
  'discounts': '#/descuentos',
  'blog': '#/blog',
  'brokers': '#/colaboradores',
  'intranet': '#/intranet'
};

function AppContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('home');
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]); // Dynamic state

  // Firestore connection for Opportunities
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "opportunities"), (snapshot) => {
        const opps: Opportunity[] = [];
        snapshot.forEach((doc) => {
            opps.push({ ...doc.data(), id: doc.id } as Opportunity);
        });
        setOpportunities(opps);
    }, (error) => {
        console.warn("Firestore access denied or error.", error);
        setOpportunities([]);
    });
    return () => unsubscribe();
  }, []);

  // Initialize view based on Hash on first load and listen to changes
  useEffect(() => {
    const handleHashChange = () => {
        let hash = window.location.hash || '#/';
        const [baseHash, query] = hash.split('?');

        if (baseHash === '#/oportunidades') {
            if (query) {
                const params = new URLSearchParams(query);
                const oppId = params.get('opp');
                setSelectedId(oppId);
            } else {
                setSelectedId(null);
            }
        } else {
            setSelectedId(null);
        }

        const matchedView = PATH_MAP[baseHash] || 'home';
        
        if (matchedView === 'intranet' && !userRole) {
            window.location.hash = '#/';
            return;
        }

        setView(matchedView);
        window.scrollTo(0, 0);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userRole, opportunities]); // Re-run if opportunities load late

  // SEO Management System
  useEffect(() => {
    let title = "RentiaRoom | Gestión, Inversión y Alquiler en Murcia";
    let description = "Expertos en gestión integral de alquiler por habitaciones y oportunidades de inversión inmobiliaria en Murcia. Rentabilidad garantizada y gestión 360.";
    
    switch (view) {
      case 'home':
        title = "RentiaRoom Murcia | Gestión de Pisos y Alquiler por Habitaciones";
        description = "Transformamos tu propiedad en una inversión rentable. Nos encargamos de la gestión integral, alquiler por habitaciones y optimización de ingresos.";
        break;
      case 'services':
        title = "Servicios de Gestión Integral para Propietarios | RentiaRoom";
        description = "¿Tienes un piso en Murcia? Descubre nuestros servicios de gestión integral, Rent to Rent, seguro de impagos y reformas para alquiler. Despreocúpate y cobra mes a mes.";
        break;
      case 'rooms':
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
          title = "Invertir en Murcia | Oportunidades Inmobiliarias Rentables";
          description = "Cartera exclusiva de oportunidades de inversión en Murcia. Pisos analizados para alquiler por habitaciones con altas rentabilidades y gestión delegada.";
        }
        break;
      case 'about': // About ahora incluye Contacto
        title = "Sobre RentiaRoom | Equipo y Contacto";
        description = "Conoce al equipo detrás de RentiaRoom y contacta con nosotros. Unimos experiencia financiera y gestión operativa para revolucionar el alquiler en Murcia.";
        break;
      case 'discounts':
        title = "Calculadora de Tarifas de Gestión | RentiaRoom";
        description = "Calcula tu comisión de gestión personalizada. Descuentos especiales para grandes tenedores e inversores con múltiples propiedades en Murcia.";
        break;
      case 'blog':
        title = "Blog Inmobiliario Murcia | Rentabilidad, Inversión y Consejos";
        description = "Artículos expertos sobre inversión inmobiliaria en Murcia, gestión de alquileres, normativa legal y tendencias del mercado. Aprende con RentiaRoom.";
        break;
      case 'brokers':
        title = "Zona Colaboradores Inmobiliarios | RentiaRoom Murcia";
        description = "Acceso para agentes inmobiliarios y corredores. Consulta los encargos de compra de nuestros inversores cualificados y colabora con nosotros.";
        break;
      case 'intranet':
        title = "Área Privada | RentiaRoom";
        description = "Acceso restringido para propietarios, inquilinos y colaboradores.";
        break;
      default:
        break;
    }

    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', description);

  }, [selectedId, view, opportunities]);

  const handleNavigate = (newView: ViewType) => {
    window.location.hash = VIEW_TO_HASH[newView];
  };

  const openLegalModal = (type: ModalType) => {
    setActiveLegalModal(type);
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
        return <AboutView />; // Renderiza AboutView para contacto también
      case 'about':
        return <AboutView />;
      case 'discounts':
        return <DiscountsView />;
      case 'blog':
        return <BlogView />;
      case 'brokers':
        return <BrokerView openLegalModal={openLegalModal} />;
      
      case 'intranet':
        if (userRole === 'owner') return <OwnerDashboard />;
        if (userRole === 'tenant') return <TenantDashboard />;
        if (userRole === 'broker') return <BrokerDashboardInternal />;
        if (userRole === 'agency') return <AgencyDashboard />;
        if (userRole === 'staff' || userRole === 'worker') return <StaffDashboard />;
        return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>;

      case 'list':
        return (
          <>
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
                      {t('opportunities.hero.badge')}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 drop-shadow-md">
                      {t('opportunities.hero.title')}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-light leading-relaxed">
                      {t('opportunities.hero.subtitle')}
                  </p>
              </div>
            </section>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
              
              {opportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {opportunities.map(opportunity => (
                          <OpportunityCard 
                              key={opportunity.id} 
                              opportunity={opportunity} 
                              onClick={(id) => window.location.hash = `#/oportunidades?opp=${id}`} 
                          />
                      ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                     <div className="bg-blue-50 p-6 rounded-full mb-6">
                        <Bell className="w-12 h-12 text-rentia-blue" />
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display mb-4">{t('opportunities.empty.title')}</h2>
                     <p className="text-gray-600 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
                       {t('opportunities.empty.text')}
                       <br/><br/>
                       <span className="font-semibold text-rentia-black">{t('opportunities.empty.cta')}</span>
                     </p>
                     
                     <a 
                        href="https://whatsapp.com/channel/0029VbBsvhOIt5rpshbpYN1P" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform w-full md:w-auto justify-center"
                     >
                        <MessageCircle className="w-6 h-6" />
                        {t('opportunities.empty.btn')}
                     </a>
                     <p className="text-xs text-gray-400 mt-4">{t('opportunities.empty.note')}</p>
                  </div>
              )}
            </div>

            <CollaborationBanner />
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
    <AuthProvider>
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
