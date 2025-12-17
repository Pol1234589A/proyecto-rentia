
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
import { InvestorDossier } from './components/InvestorDossier'; 
import { OpportunityPresentation } from './components/OpportunityPresentation'; 
import { PublishRequestView } from './components/PublishRequestView';
import { ManagementSubmissionForm } from './components/owners/ManagementSubmissionForm';
import { Opportunity } from './types';
import { opportunities as staticOpportunities } from './data';
import { TrendingUp, MessageCircle, Bell } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Type alias
type ViewType = 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts' | 'blog' | 'brokers' | 'intranet' | 'landing' | 'submission' | 'dossier' | 'presentation' | 'request-individual' | 'request-agency' | 'management-submission';

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
  '#/landing': 'landing',
  '#/dossier': 'dossier',
  '#/presentation': 'presentation',
  '#/request/individual': 'request-individual',
  '#/request/agency': 'request-agency',
  '#/publicar-propiedad': 'management-submission'
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
  'dossier': '#/dossier',
  'submission': '#/colaboradores',
  'presentation': '#/presentation',
  'request-individual': '#/request/individual',
  'request-agency': '#/request/agency',
  'management-submission': '#/publicar-propiedad'
};

function AppContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('home');
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>(staticOpportunities); 

  // Firestore connection for Opportunities with Merge Logic
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "opportunities"), (snapshot) => {
        const firestoreOpps: Opportunity[] = [];
        const allDbIds = new Set<string>();

        snapshot.forEach((doc) => {
            const data = doc.data();
            allDbIds.add(doc.id);
            if ((data as any).deleted) return;
            firestoreOpps.push({ ...data, id: doc.id } as Opportunity);
        });
        
        const missingStatics = staticOpportunities.filter(o => !allDbIds.has(o.id));
        setOpportunities([...firestoreOpps, ...missingStatics]);
    }, (error) => {
        console.warn("Firestore error, using static data.", error);
        setOpportunities(staticOpportunities);
    });
    return () => unsubscribe();
  }, []);

  // Initialize view based on Hash
  useEffect(() => {
    const handleHashChange = () => {
        const hash = window.location.hash || '#/';
        const [baseHash, query] = hash.split('?');

        // Robust parameter handling
        if (query) {
            const params = new URLSearchParams(query);
            const oppId = params.get('id') || params.get('opp'); 
            setSelectedId(oppId);
        } else {
            setSelectedId(null);
        }

        const matchedView = PATH_MAP[baseHash] || 'home';
        
        if (matchedView === 'intranet' && !userRole) {
            // No redirigir bruscamente si estamos en un subdominio de presentación
            if (baseHash !== '#/intranet') return; 
            window.location.hash = '#/';
            return;
        }

        setView(matchedView);
        window.scrollTo(0, 0);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userRole]); 

  const handleNavigate = (newView: ViewType) => {
    window.location.hash = VIEW_TO_HASH[newView];
  };

  const handleNext = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex < opportunities.length - 1) {
      const nextId = opportunities[currentIndex + 1].id;
      const currentPath = window.location.hash.split('?')[0];
      window.location.hash = `${currentPath}?opp=${nextId}`;
    }
  };

  const handlePrev = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex > 0) {
      const prevId = opportunities[currentIndex - 1].id;
      const currentPath = window.location.hash.split('?')[0];
      window.location.hash = `${currentPath}?opp=${prevId}`;
    }
  };

  const selectedOpportunity = opportunities.find(o => o.id === selectedId);

  const renderContent = () => {
    if (view === 'presentation' && selectedOpportunity) {
        return <OpportunityPresentation opportunity={selectedOpportunity} />;
    }
    
    if (view === 'dossier') {
        return <InvestorDossier opportunities={opportunities} selectedOpportunity={selectedOpportunity || null} />;
    }

    if (view === 'landing') {
        return <LandingView opportunities={opportunities} onClick={(id) => window.location.hash = `#/landing?opp=${id}`} />;
    }

    if (selectedOpportunity && (view === 'list' || view === 'home')) {
      return (
        <DetailView 
          opportunity={selectedOpportunity} 
          onBack={() => window.location.hash = '#/oportunidades'}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={opportunities.findIndex(o => o.id === selectedId) < opportunities.length - 1}
          hasPrev={opportunities.findIndex(o => o.id === selectedId) > 0}
          onNavigate={handleNavigate}
        />
      );
    }

    switch (view) {
      case 'home': return <HomeView onNavigate={handleNavigate} />;
      case 'services': return <ServicesView />;
      case 'rooms': return <RoomsView />;
      case 'about': return <AboutView />;
      case 'discounts': return <DiscountsView />;
      case 'blog': return <BlogView />;
      case 'brokers': return <BrokerView openLegalModal={(t) => setActiveLegalModal(t)} />;
      case 'request-individual': return <PublishRequestView type="individual" onNavigate={handleNavigate} />;
      case 'request-agency': return <PublishRequestView type="agency" onNavigate={handleNavigate} />;
      case 'management-submission': return <ManagementSubmissionForm />;
      case 'intranet':
        if (userRole === 'owner') return <OwnerDashboard />;
        if (userRole === 'worker') return <WorkerDashboard />;
        if (userRole === 'staff') return <StaffDashboard />;
        return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>;
      case 'list':
        return (
          <>
            <section className="relative py-20 bg-rentia-black overflow-hidden">
              <div className="absolute inset-0 z-0">
                  <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80" className="w-full h-full object-cover grayscale opacity-60" alt="Hero"/>
                  <div className="absolute inset-0 bg-rentia-blue/60 mix-blend-multiply"></div>
              </div>
              <div className="relative z-10 container mx-auto px-4 text-center text-white">
                  <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1 rounded-full mb-6 font-bold text-sm uppercase tracking-wider">
                      <TrendingUp className="w-4 h-4" /> {t('opportunities.hero.badge')}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold font-display mb-4">{t('opportunities.hero.title')}</h1>
                  <p className="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto font-light leading-relaxed">{t('opportunities.hero.subtitle')}</p>
              </div>
            </section>
            <div className="max-w-[1200px] mx-auto px-4 py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {opportunities.map(opp => (
                      <OpportunityCard key={opp.id} opportunity={opp} onClick={(id) => window.location.hash = `#/oportunidades?opp=${id}`} />
                  ))}
              </div>
            </div>
            <CollaborationBanner />
          </>
        );
      default: return <HomeView onNavigate={handleNavigate} />;
    }
  };

  const isStandalone = ['landing', 'dossier', 'presentation', 'request-individual', 'request-agency', 'management-submission'].includes(view);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {!isStandalone && <Header onNavigate={handleNavigate} />}
      <main className="flex-grow bg-[#f9f9f9]">{renderContent()}</main>
      {!isStandalone && <WhatsAppButton />}
      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />
      {!isStandalone && <Footer onNavigate={handleNavigate} openLegalModal={(t) => setActiveLegalModal(t)} />}
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
