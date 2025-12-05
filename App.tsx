
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
import { WorkerDashboard } from './components/dashboards/WorkerDashboard'; 
import { LegalModals, ModalType } from './components/LegalModals';
import { CollaborationBanner } from './components/CollaborationBanner';
import { OpportunityCard } from './components/OpportunityCard'; 
import { LandingView } from './components/LandingView';
import { Opportunity } from './types';
import { opportunities as staticOpportunities } from './data';
import { TrendingUp, MessageCircle, Bell } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Type alias
type ViewType = 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts' | 'blog' | 'brokers' | 'intranet' | 'landing' | 'submission';

// Mapping Hash paths
const PATH_MAP: Record<string, ViewType> = {
  '#/': 'home',
  '#/servicios': 'services',
  '#/habitaciones': 'rooms',
  '#/oportunidades': 'list',
  '#/contacto': 'about', 
  '#/nosotros': 'about',
  '#/descuentos': 'discounts',
  '#/blog': 'blog',
  '#/colaboradores': 'brokers',
  '#/intranet': 'intranet',
  '#/landing': 'landing'
};

const VIEW_TO_HASH: Record<ViewType, string> = {
  'home': '#/',
  'services': '#/servicios',
  'rooms': '#/habitaciones',
  'list': '#/oportunidades',
  'contact': '#/nosotros', 
  'about': '#/nosotros',
  'discounts': '#/descuentos',
  'blog': '#/blog',
  'brokers': '#/colaboradores',
  'intranet': '#/intranet',
  'landing': '#/landing',
  'submission': '#/colaboradores' // Redirige a brokers si se intenta acceder
};

function AppContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('home');
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const { t } = useLanguage();
  const { userRole, currentUser } = useAuth();
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>(staticOpportunities); 

  // Firestore connection for Opportunities with Merge Logic
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "opportunities"), (snapshot) => {
        const firestoreOpps: Opportunity[] = [];
        snapshot.forEach((doc) => {
            firestoreOpps.push({ ...doc.data(), id: doc.id } as Opportunity);
        });
        
        // Fusión: Datos Firestore + Datos Estáticos que no están en Firestore
        const dbIds = new Set(firestoreOpps.map(o => o.id));
        const missingStatics = staticOpportunities.filter(o => !dbIds.has(o.id));
        
        const combinedOpps = [...firestoreOpps, ...missingStatics];
        
        if (combinedOpps.length > 0) {
            setOpportunities(combinedOpps);
        } else {
            setOpportunities(staticOpportunities);
        }
    }, (error) => {
        console.warn("Firestore access denied or error. Using static data.", error);
        setOpportunities(staticOpportunities);
    });
    return () => unsubscribe();
  }, []);

  // Initialize view based on Hash
  useEffect(() => {
    const handleHashChange = () => {
        let hash = window.location.hash || '#/';
        const [baseHash, query] = hash.split('?');

        // Soporte para detalles
        if (baseHash === '#/oportunidades' || baseHash === '#/landing') {
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
  }, [userRole, opportunities]); 

  const handleNavigate = (newView: ViewType) => {
    window.location.hash = VIEW_TO_HASH[newView];
  };

  const openLegalModal = (type: ModalType) => {
    setActiveLegalModal(type);
  };

  const handleBackToOpportunities = () => {
    window.location.hash = '#/oportunidades';
  };

  const handleBackToLanding = () => {
    window.location.hash = '#/landing';
  };

  const handleNext = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex < opportunities.length - 1) {
      const nextId = opportunities[currentIndex + 1].id;
      if (view === 'landing') {
          window.location.hash = `#/landing?opp=${nextId}`;
      } else {
          window.location.hash = `#/oportunidades?opp=${nextId}`;
      }
    }
  };

  const handlePrev = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex > 0) {
      const prevId = opportunities[currentIndex - 1].id;
      if (view === 'landing') {
          window.location.hash = `#/landing?opp=${prevId}`;
      } else {
          window.location.hash = `#/oportunidades?opp=${prevId}`;
      }
    }
  };

  const selectedOpportunity = opportunities.find(o => o.id === selectedId);

  // Lógica de renderizado
  const renderContent = () => {
    if (selectedOpportunity) {
      return (
        <DetailView 
          opportunity={selectedOpportunity} 
          onBack={view === 'landing' ? handleBackToLanding : handleBackToOpportunities}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={opportunities.findIndex(o => o.id === selectedId) < opportunities.length - 1}
          hasPrev={opportunities.findIndex(o => o.id === selectedId) > 0}
          onNavigate={handleNavigate}
        />
      );
    }

    if (view === 'landing') {
        return (
            <LandingView 
                opportunities={opportunities} 
                onClick={(id) => window.location.hash = `#/landing?opp=${id}`} 
            />
        );
    }

    switch (view) {
      case 'home': return <HomeView onNavigate={handleNavigate} />;
      case 'services': return <ServicesView />;
      case 'rooms': return <RoomsView />;
      case 'contact': return <AboutView />;
      case 'about': return <AboutView />;
      case 'discounts': return <DiscountsView />;
      case 'blog': return <BlogView />;
      case 'brokers': return <BrokerView openLegalModal={openLegalModal} />;
      case 'submission': return <BrokerView openLegalModal={openLegalModal} />; // Fallback a Brokers
      
      case 'intranet':
        if (userRole === 'owner') return <OwnerDashboard />;
        if (userRole === 'tenant') return <TenantDashboard />;
        if (userRole === 'broker') return <BrokerDashboardInternal />;
        if (userRole === 'agency') return <AgencyDashboard />;
        if (userRole === 'staff') return <StaffDashboard />;
        if (userRole === 'worker') return <WorkerDashboard />;
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
      {/* Header Global */}
      {view !== 'landing' && <Header onNavigate={handleNavigate} />}

      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        {renderContent()}
      </main>

      {/* WhatsApp Button */}
      {view !== 'landing' && !(view === 'intranet' && (userRole === 'worker' || userRole === 'staff')) && <WhatsAppButton />}

      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />

      {/* Footer Global */}
      {view !== 'landing' && <Footer onNavigate={handleNavigate} openLegalModal={openLegalModal} />}
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
