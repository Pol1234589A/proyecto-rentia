import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
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

// Type alias
type ViewType = 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts' | 'blog';

// --- CAMBIO CLAVE: RUTAS AMIGABLES EN ESPAÑOL ---
const ROUTE_PATHS: Record<ViewType, string> = {
  'home': '/',
  'services': '/servicios',      // Antes /services
  'rooms': '/habitaciones',      // Antes /rooms
  'list': '/oportunidades',      // Antes /list
  'contact': '/contacto',        // Antes /contact
  'about': '/nosotros',          // Antes /about
  'discounts': '/descuentos',    // Antes /discounts
  'blog': '/blog'
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);

  const selectedId = searchParams.get('opp');

  // --- 1. SISTEMA SEO ACTUALIZADO (Con rutas en español) ---
  useEffect(() => {
    let title = "RentiaRoom | Gestión, Inversión y Alquiler en Murcia";
    let description = "Expertos en gestión integral de alquiler por habitaciones y oportunidades de inversión inmobiliaria en Murcia. Rentabilidad garantizada y gestión 360.";
    
    const path = location.pathname;

    if (path === '/') {
        title = "RentiaRoom Murcia | Gestión de Pisos y Alquiler por Habitaciones";
        description = "Transformamos tu propiedad en Murcia en una inversión rentable. Nos encargamos de la gestión integral, alquiler por habitaciones y optimización de ingresos.";
    } else if (path === '/servicios') { // 👈 Detectamos la ruta en español
        title = "Servicios de Gestión Integral para Propietarios | RentiaRoom";
        description = "¿Tienes un piso en Murcia? Descubre nuestros servicios de gestión integral, Rent to Rent, seguro de impagos y reformas para alquiler. Despreocúpate y cobra mes a mes.";
    } else if (path === '/habitaciones') {
        title = "Alquiler de Habitaciones en Murcia | Estudiantes y Trabajadores";
        description = "Encuentra tu habitación ideal en Murcia. Pisos compartidos premium para estudiantes UCAM/UMU y trabajadores. Sin comisiones ocultas, totalmente equipadas.";
    } else if (path.startsWith('/oportunidades')) {
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
    } else if (path === '/contacto') {
        title = "Contactar RentiaRoom | Gestión Inmobiliaria en Murcia";
        description = "Habla con nuestro equipo. Atención directa por WhatsApp para propietarios e inversores. Oficinas en Murcia.";
    } else if (path === '/nosotros') {
        title = "Sobre RentiaRoom | Expertos en Coliving e Inversión";
        description = "Conoce al equipo detrás de RentiaRoom. Unimos experiencia financiera y gestión operativa para revolucionar el alquiler en Murcia.";
    } else if (path === '/descuentos') {
        title = "Calculadora de Tarifas de Gestión | RentiaRoom";
        description = "Calcula tu comisión de gestión personalizada. Descuentos especiales para grandes tenedores e inversores con múltiples propiedades en Murcia.";
    } else if (path === '/blog') {
        title = "Blog Inmobiliario Murcia | Rentabilidad, Inversión y Consejos";
        description = "Artículos expertos sobre inversión inmobiliaria en Murcia, gestión de alquileres, normativa legal y tendencias del mercado. Aprende con RentiaRoom.";
    }

    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', description);

    window.scrollTo(0, 0);

  }, [location.pathname, selectedId]);

  // --- 2. ADAPTADORES DE NAVEGACIÓN ---
  const handleNavigate = (view: ViewType) => {
    // Esto ahora busca en el mapa nuevo y redirige a "/servicios" en lugar de "/services"
    navigate(ROUTE_PATHS[view]);
  };

  const handleCardClick = (id: string) => {
    setSearchParams({ opp: id });
  };

  const handleBackToOpportunities = () => {
    setSearchParams({});
  };

  const handleNext = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex < opportunities.length - 1) {
      const nextId = opportunities[currentIndex + 1].id;
      setSearchParams({ opp: nextId });
    }
  };

  const handlePrev = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedId);
    if (currentIndex > 0) {
      const prevId = opportunities[currentIndex - 1].id;
      setSearchParams({ opp: prevId });
    }
  };

  const openLegalModal = (type: ModalType) => {
    setActiveLegalModal(type);
  };

  // --- 3. COMPONENTE INTERNO PARA OPORTUNIDADES ---
  const OpportunitiesPage = () => {
    const selectedOpportunity = opportunities.find(o => o.id === selectedId);

    if (selectedId && selectedOpportunity) {
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

    return (
      <>
        {/* Hero Section */}
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

        {/* Empty State / Grid */}
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
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header onNavigate={handleNavigate} />

      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        <Routes>
          <Route path="/" element={<HomeView onNavigate={handleNavigate} />} />
          {/* AQUÍ DEFINIMOS LAS RUTAS EN ESPAÑOL */}
          <Route path="/servicios" element={<ServicesView />} />
          <Route path="/habitaciones" element={<RoomsView />} />
          <Route path="/contacto" element={<ContactView />} />
          <Route path="/nosotros" element={<AboutView />} />
          <Route path="/descuentos" element={<DiscountsView />} />
          <Route path="/blog" element={<BlogView />} />
          
          <Route path="/oportunidades" element={<OpportunitiesPage />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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