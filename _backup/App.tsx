
import React, { useState, useEffect, useMemo } from 'react';
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
import { InvestorDossier } from './components/InvestorDossier'; 
import { OpportunityPresentation } from './components/OpportunityPresentation'; 
import { PublishRequestView } from './components/PublishRequestView';
import { ManagementSubmissionForm } from './components/owners/ManagementSubmissionForm'; 
import { Opportunity } from './types';
import { opportunities as staticOpportunities } from './data';
import { TrendingUp, MessageCircle, Bell, ArrowUpDown, Filter } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ContentProvider } from './contexts/ContentContext'; // NEW
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Type alias
type ViewType = 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts' | 'blog' | 'brokers' | 'intranet' | 'landing' | 'submission' | 'dossier' | 'presentation' | 'request-individual' | 'request-agency' | 'management-submission';
type SortOption = 'newest' | 'yield_desc' | 'city_asc';

// Mapping Hash paths
const PATH_MAP: Record<string, ViewType> = {
  '#/': 'landing', // Default to Landing (Opportunities Portfolio)
  '#/home': 'home', 
  '#/servicios': 'services',
  '#/habitaciones': 'rooms',
  '#/oportunidades': 'list',
  '#/contacto': 'about', 
  '#/nosotros': 'about',
  '#/descuentos': 'discounts',
  '#/blog': 'blog',
  '#/colaboradores': 'brokers',
  '#/intranet': 'intranet',
  '#/landing': 'landing',
  '#/dossier': 'dossier',
  '#/presentation': 'presentation',
  '#/request/individual': 'request-individual',
  '#/request/agency': 'request-agency',
  '#/publicar-propiedad': 'management-submission' 
};

const VIEW_TO_HASH: Record<ViewType, string> = {
  'home': '#/home',
  'services': '#/servicios',
  'rooms': '#/habitaciones',
  'list': '#/oportunidades',
  'contact': '#/nosotros', 
  'about': '#/nosotros',
  'discounts': '#/descuentos',
  'blog': '#/blog',
  'brokers': '#/colaboradores',
  'intranet': '#/intranet',
  'landing': '#/',
  'dossier': '#/dossier',
  'submission': '#/colaboradores',
  'presentation': '#/presentation',
  'request-individual': '#/request/individual',
  'request-agency': '#/request/agency',
  'management-submission': '#/publicar-propiedad'
};

function AppContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('landing'); // Default landing
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const { t } = useLanguage();
  const { userRole, currentUser } = useAuth();
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>(staticOpportunities); 
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Firestore connection for Opportunities with Merge Logic
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "opportunities"), (snapshot) => {
        const firestoreOpps: Opportunity[] = [];
        const allDbIds = new Set<string>();

        snapshot.forEach((doc) => {
            const data = doc.data();
            allDbIds.add(doc.id);

            // Filter out soft-deleted items AND invalid items (Safety Check)
            if ((data as any).deleted) return;
            if (!data.financials || !data.title) return; // Prevent crash if data is corrupt

            firestoreOpps.push({ ...data, id: doc.id } as Opportunity);
        });
        
        // Fusión: Datos Firestore (activos) + Datos Estáticos que no están en Firestore (ni como activos ni como borrados)
        const missingStatics = staticOpportunities.filter(o => !allDbIds.has(o.id));
        const combinedOpps = [...firestoreOpps, ...missingStatics];
        
        setOpportunities(combinedOpps);

    }, (error) => {
        console.warn("Firestore access denied or error. Using static data.", error);
        setOpportunities(staticOpportunities);
    });
    return () => unsubscribe();
  }, []);

  // Sorting Logic
  const sortedOpportunities = useMemo(() => {
      const sorted = [...opportunities];
      return sorted.sort((a, b) => {
          // Safety checks inside sort
          if (!a || !b) return 0;

          if (sortOption === 'newest') {
              // Manejo seguro de fechas (pueden ser strings ISO, timestamps de Firestore o undefined)
              const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
              const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
              return dateB - dateA; // Descending (Newest first)
          } 
          else if (sortOption === 'yield_desc') {
              const getYield = (opp: Opportunity) => {
                  if (!opp.financials) return 0;
                  const monthlyIncome = opp.financials.monthlyRentProjected > 0 
                      ? opp.financials.monthlyRentProjected 
                      : opp.financials.monthlyRentTraditional;
                  const purchasePrice = opp.financials.purchasePrice;
                  const agencyFeeBase = opp.financials.agencyFees !== undefined 
                      ? opp.financials.agencyFees 
                      : (purchasePrice > 100000 ? purchasePrice * 0.03 : 3000);
                  const agencyFeeTotal = agencyFeeBase * 1.21; 
                  const totalInvest = opp.financials.totalInvestment + agencyFeeTotal;
                  if (totalInvest === 0) return 0;
                  return ((monthlyIncome * 12) / totalInvest) * 100;
              };
              return getYield(b) - getYield(a); // Descending
          }
          else if (sortOption === 'city_asc') {
              return (a.city || '').localeCompare(b.city || '');
          }
          return 0;
      });
  }, [opportunities, sortOption]);

  // Initialize view based on Hash
  useEffect(() => {
    const handleHashChange = () => {
        let hash = window.location.hash || '#/';
        const [baseHash, query] = hash.split('?');

        // Soporte para detalles y presentación
        if (baseHash === '#/oportunidades' || baseHash === '#/landing' || baseHash === '#/dossier' || baseHash === '#/presentation' || baseHash === '#/') {
            if (query) {
                const params = new URLSearchParams(query);
                const oppId = params.get('id') || params.get('opp'); 
                setSelectedId(oppId);
            } else {
                setSelectedId(null);
            }
        } else {
            setSelectedId(null);
        }

        const matchedView = PATH_MAP[baseHash] || 'landing'; // Default to landing
        
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
    window.location.hash = '#/';
  };
  
  const handleBackToDossier = () => {
    window.location.hash = '#/dossier';
  };

  const handleNext = () => {
    const currentIndex = sortedOpportunities.findIndex(o => o.id === selectedId); // Use sorted list
    if (currentIndex < sortedOpportunities.length - 1) {
      const nextId = sortedOpportunities[currentIndex + 1].id;
      if (view === 'landing') {
          window.location.hash = `#/landing?opp=${nextId}`;
      } else if (view === 'dossier') {
          window.location.hash = `#/dossier?opp=${nextId}`;
      } else {
          window.location.hash = `#/oportunidades?opp=${nextId}`;
      }
    }
  };

  const handlePrev = () => {
    const currentIndex = sortedOpportunities.findIndex(o => o.id === selectedId); // Use sorted list
    if (currentIndex > 0) {
      const prevId = sortedOpportunities[currentIndex - 1].id;
      if (view === 'landing') {
          window.location.hash = `#/landing?opp=${prevId}`;
      } else if (view === 'dossier') {
          window.location.hash = `#/dossier?opp=${prevId}`;
      } else {
          window.location.hash = `#/oportunidades?opp=${prevId}`;
      }
    }
  };

  const selectedOpportunity = sortedOpportunities.find(o => o.id === selectedId);

  // Lógica de renderizado
  const renderContent = () => {
    // Modo Presentación (Standalone)
    if (view === 'presentation' && selectedOpportunity) {
        return <OpportunityPresentation opportunity={selectedOpportunity} />;
    } else if (view === 'presentation' && !selectedOpportunity) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Oportunidad no encontrada o enlace roto.</div>;
    }
    
    // Nuevas Vistas Standalone de Formulario
    if (view === 'request-individual') {
        return <PublishRequestView type="individual" onNavigate={handleNavigate} />;
    }
    if (view === 'request-agency') {
        return <PublishRequestView type="agency" onNavigate={handleNavigate} />;
    }

    // Nuevo Formulario Propietarios
    if (view === 'management-submission') {
        return <ManagementSubmissionForm />;
    }

    if (view === 'dossier') {
        return (
            <InvestorDossier 
                opportunities={sortedOpportunities} 
                selectedOpportunity={selectedOpportunity || null}
            />
        );
    }

    // DETALLE DENTRO DE LANDING
    if (selectedOpportunity && view === 'landing') {
       return (
        <DetailView 
          opportunity={selectedOpportunity} 
          onBack={handleBackToLanding}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={sortedOpportunities.findIndex(o => o.id === selectedId) < sortedOpportunities.length - 1}
          hasPrev={sortedOpportunities.findIndex(o => o.id === selectedId) > 0}
          onNavigate={handleNavigate}
        />
      );
    }

    // LISTADO DENTRO DE LANDING (Standalone)
    if (view === 'landing') {
        return (
            <LandingView 
                opportunities={sortedOpportunities} 
                onClick={(id) => window.location.hash = `#/landing?opp=${id}`} 
            />
        );
    }
    
    // Legacy Views (if accessed via header)
    if (selectedOpportunity) {
      return (
        <DetailView 
          opportunity={selectedOpportunity} 
          onBack={handleBackToOpportunities}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={sortedOpportunities.findIndex(o => o.id === selectedId) < sortedOpportunities.length - 1}
          hasPrev={sortedOpportunities.findIndex(o => o.id === selectedId) > 0}
          onNavigate={handleNavigate}
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
      case 'submission': return <BrokerView openLegalModal={openLegalModal} />;
      
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
              
              {/* SORTING CONTROLS */}
              {sortedOpportunities.length > 0 && (
                <div className="flex justify-end mb-8">
                    <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase px-2 flex items-center gap-1">
                            <ArrowUpDown className="w-3 h-3" /> Ordenar:
                        </span>
                        <select 
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer py-1 px-2 hover:bg-gray-50 rounded"
                        >
                            <option value="newest">Más Recientes (Nuevas)</option>
                            <option value="yield_desc">Mayor Rentabilidad</option>
                            <option value="city_asc">Ciudad (A-Z)</option>
                        </select>
                    </div>
                </div>
              )}

              {sortedOpportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="opp-grid">
                      {sortedOpportunities.map(opportunity => (
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

  // Determine if full layout (Header/Footer) should be shown
  const isStandaloneView = view === 'landing' || view === 'dossier' || view === 'presentation' || view === 'request-individual' || view === 'request-agency' || view === 'management-submission';

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header Global (Hidden for standalone views) */}
      {!isStandaloneView && <Header onNavigate={handleNavigate} />}

      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        {renderContent()}
      </main>

      {/* WhatsApp Button (Hidden for standalone views and internal dashboards) */}
      {!isStandaloneView && !(view === 'intranet' && (userRole === 'worker' || userRole === 'staff')) && <WhatsAppButton />}

      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />

      {/* Footer Global (Hidden for standalone views) */}
      {!isStandaloneView && <Footer onNavigate={handleNavigate} openLegalModal={openLegalModal} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
        <ConfigProvider>
          <ContentProvider>
            <LanguageProvider>
                <AppContent />
            </LanguageProvider>
          </ContentProvider>
        </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
