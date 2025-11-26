
import React, { useState, useMemo, useEffect } from 'react';
import { Home, MapPin, CheckCircle, Clock, User, MessageCircle, Filter, AlertCircle, Receipt, Sparkles, Hammer, HelpCircle, Building, Gift, Users as UsersIcon, Wallet, PlayCircle, Image as ImageIcon, Camera, Timer, Bath, Wind, ExternalLink, GraduationCap, Briefcase, Users, DoorClosed, DoorOpen } from 'lucide-react';
import { properties, Property, Room } from '../data/rooms';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageLightbox } from './ImageLightbox';

// --- Subcomponente Cronómetro ---
const CountdownTimer = ({ targetDateStr }: { targetDateStr: string }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const [day, month, year] = targetDateStr.split('/').map(Number);
      // Asumimos fin del día o inicio del día siguiente para el vencimiento
      const targetDate = new Date(year, month - 1, day); 
      targetDate.setHours(23, 59, 59); // Final del día contrato

      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    // Calcular inmediatamente
    setTimeLeft(calculateTimeLeft());

    // Actualizar cada segundo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDateStr]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200 mt-1 animate-pulse w-fit">
      <Timer className="w-3 h-3" />
      <span>
        {timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
};

// --- Subcomponente Puerta Interactiva 3D ---
const InteractiveDoor = ({ isOpen, onClick, className = "" }: { isOpen: boolean, onClick: (e: React.MouseEvent) => void, className?: string }) => {
    return (
        <div 
            className={`relative cursor-pointer [perspective:1000px] group ${className}`} 
            onClick={onClick}
            title={isOpen ? "Cerrar tarjeta" : "Ver habitaciones"}
        >
            {/* Interior (Fondo Dorado que se ve al abrir) */}
            <div className={`absolute inset-0 bg-rentia-gold rounded border border-rentia-gold shadow-inner transition-colors duration-500 flex items-center justify-center`}>
                {/* Pequeño detalle de luz/brillo dentro */}
                <div className="w-1 h-full bg-white/20 absolute left-0 top-0 bottom-0 blur-sm"></div>
            </div>

            {/* Hoja de la Puerta (Azul que gira) */}
            <div 
                className={`
                    absolute inset-0 bg-rentia-blue rounded border border-blue-700 
                    origin-left transition-all duration-700 ease-in-out 
                    shadow-lg flex items-center
                    ${isOpen ? '[transform:rotateY(-115deg)] shadow-xl' : '[transform:rotateY(0deg)]'}
                `}
            >
                {/* Pomo de la puerta */}
                <div className="absolute right-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-sm border border-gray-300/50"></div>
                
                {/* Paneles decorativos sutiles en la puerta */}
                <div className="absolute top-2 left-2 right-2 h-[40%] border border-black/10 rounded-sm opacity-20 pointer-events-none"></div>
                <div className="absolute bottom-2 left-2 right-2 h-[40%] border border-black/10 rounded-sm opacity-20 pointer-events-none"></div>
            </div>
        </div>
    );
};

export const RoomsView: React.FC = () => {
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0); // Nuevo estado para el índice
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const { t } = useLanguage();

  const toggleProperty = (id: string) => {
    setExpandedProperties(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const openRoomImages = (images: string[], index = 0) => {
      setLightboxImages(images);
      setLightboxIndex(index);
      setIsLightboxOpen(true);
  };

  // Calculate total rooms under management
  const totalRoomsManaged = useMemo(() => {
    return properties.reduce((acc, property) => acc + property.rooms.length, 0);
  }, []);

  // Filtrado de propiedades: Mostrar solo si tienen habitaciones libres si el filtro está activo
  const filteredProperties = useMemo(() => {
    if (!showOnlyAvailable) return properties;
    return properties.filter(p => p.rooms.some(r => r.status === 'available'));
  }, [showOnlyAvailable]);

  // Función para determinar el color/estado inteligente del CONTENEDOR
  const getRoomStatusContainerStyle = (room: Room) => {
    // Special Status: Renovation
    if (room.specialStatus === 'renovation') {
        return 'bg-yellow-50 border-yellow-200 border-dashed';
    }

    if (room.status === 'available') return 'bg-white border-green-200 shadow-sm';
    
    // Lógica para "Próximamente" (Naranja)
    if (room.availableFrom && room.availableFrom !== 'Consultar' && room.availableFrom !== 'Inmediata') {
        const [day, month, year] = room.availableFrom.split('/').map(Number);
        const exitDate = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = exitDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays < 45) {
            return 'bg-orange-50 border-orange-200';
        }
    }
    
    // Por defecto Azul (Alquilada)
    return 'bg-gray-50 border-gray-100 opacity-80';
  };

  const getStatusLabel = (room: Room) => {
    // Special Status overrides
    if (room.specialStatus === 'renovation') {
        return { icon: <Hammer className="w-3.5 h-3.5"/>, text: t('rooms.status.renovation'), color: 'text-yellow-700' };
    }

    if (room.status === 'available') return { icon: <CheckCircle className="w-3.5 h-3.5"/>, text: t('rooms.status.free'), color: 'text-green-700' };
    
    if (room.availableFrom && room.availableFrom !== 'Consultar') {
        const [day, month, year] = room.availableFrom.split('/').map(Number);
        const exitDate = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = exitDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays < 45) {
             return { icon: <HelpCircle className="w-3.5 h-3.5"/>, text: t('rooms.status.free_in'), color: 'text-orange-700', showTimer: true };
        }
    }
    
    return { icon: <User className="w-3.5 h-3.5"/>, text: t('rooms.status.occupied'), color: 'text-gray-500' };
  };

  const getProfileBadge = (profile?: string) => {
    if (!profile) return null;
    if (profile === 'students') return { icon: <GraduationCap className="w-3 h-3" />, text: t('rooms.profile.students'), style: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
    if (profile === 'workers') return { icon: <Briefcase className="w-3 h-3" />, text: t('rooms.profile.workers'), style: 'bg-slate-50 text-slate-700 border-slate-200' };
    if (profile === 'both') return { icon: <Users className="w-3 h-3" />, text: t('rooms.profile.both'), style: 'bg-teal-50 text-teal-700 border-teal-100' };
    return null;
  }

  const getPropertyProfile = (rooms: Room[]) => {
    const profiles = new Set(rooms.map(r => r.targetProfile).filter(Boolean));
    if (profiles.has('both') || (profiles.has('students') && profiles.has('workers'))) return 'both';
    if (profiles.has('students')) return 'students';
    if (profiles.has('workers')) return 'workers';
    return undefined;
  };

  const translateExpenses = (expense: string) => {
      // Normalizamos la cadena para búsqueda
      const exp = expense.toLowerCase();
      if (exp.includes('fijos')) return t('rooms.status.fixed_expenses');
      if (exp.includes('reparten')) return t('rooms.status.shared_expenses');
      return expense;
  }

  return (
    <div className="font-sans bg-gray-50 min-h-screen flex flex-col animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 bg-rentia-black text-white overflow-hidden">
        <div className="absolute inset-0">
           <img
             src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80"
             alt="Habitaciones Disponibles"
             className="w-full h-full object-cover opacity-40"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-rentia-black/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1 rounded-full mb-6 font-bold text-xs md:text-sm shadow-lg uppercase tracking-wider">
                <Home className="w-4 h-4" />
                {t('rooms.hero.badge')}
            </div>
          <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 tracking-tight drop-shadow-lg text-white">
            {t('rooms.hero.title')}
          </h1>
          <p className="text-lg text-gray-200 font-light max-w-2xl mx-auto mb-6">
            {t('rooms.hero.subtitle')}
          </p>
          
          {/* Total Rooms Counter */}
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl">
              <Building className="w-6 h-6 text-rentia-blue" />
              <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold leading-none">{totalRoomsManaged}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80">{t('rooms.hero.count_label')}</span>
              </div>
          </div>
        </div>
      </section>

      {/* PLAN AMIGO BANNER */}
      <section className="container mx-auto px-4 -mt-6 relative z-30 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-rentia-blue rounded-2xl shadow-xl p-6 text-white relative overflow-hidden border-2 border-white/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-rentia-gold/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="flex-shrink-0 relative mx-auto md:mx-0">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                  <Gift className="w-8 h-8 md:w-10 md:h-10 text-rentia-blue" />
              </div>
              <div className="absolute -top-2 -right-2 bg-rentia-gold text-rentia-black text-xs font-bold px-2 py-1 rounded-full shadow-md animate-bounce">
                  {t('rooms.friend_plan.badge')}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold font-display text-white mb-2">
                {t('rooms.friend_plan.title')} <span className="text-rentia-gold">{t('rooms.friend_plan.highlight')}</span>
              </h3>
              <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-3 md:mb-1">
                {t('rooms.friend_plan.desc')} <span className="font-bold text-white bg-white/20 px-1 rounded">{t('rooms.friend_plan.desc_amount')}</span> {t('rooms.friend_plan.desc_end')}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-green-500/20 text-green-100 border border-green-500/30 px-2 py-1 rounded flex items-center gap-1">
                    <UsersIcon className="w-3 h-3" /> {t('rooms.friend_plan.tag_1')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500/20 text-blue-100 border border-blue-500/30 px-2 py-1 rounded flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> {t('rooms.friend_plan.tag_2')}
                  </span>
              </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              <a
                href="https://api.whatsapp.com/send?phone=34611948589&text=Hola%20Sandra,%20soy%20inquilino%20y%20quiero%20recomendar%20a%20un%20amigo%20para%20el%20Plan%20Amigo."
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-rentia-gold hover:bg-yellow-400 text-rentia-black font-bold py-3 px-6 rounded-xl transition-all shadow-lg transform hover:-translate-y-1 w-full md:w-auto min-h-[44px]"
              >
                  <MessageCircle className="w-5 h-5" />
                  {t('rooms.friend_plan.btn')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-12 relative z-20">
         
         {/* Filters */}
         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-2 text-rentia-black font-bold">
                 <Filter className="w-5 h-5 text-rentia-blue" />
                 <span>{t('rooms.filter.label')}</span>
             </div>
             
             <label className="flex items-center cursor-pointer relative select-none p-2 w-full sm:w-auto">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={showOnlyAvailable}
                    onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[10px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rentia-blue"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">{t('rooms.filter.check')}</span>
             </label>
         </div>

         {/* Property Grid (Compact Mode) */}
         <div className="flex flex-col gap-4 max-w-4xl mx-auto">
             {filteredProperties.map(property => {
                 const availableCount = property.rooms.filter(r => r.status === 'available').length;
                 const totalRooms = property.rooms.length;
                 const isExpanded = expandedProperties[property.id] || false;
                 const hasNew = property.rooms.some(r => r.specialStatus === 'new');
                 const hasRenovation = property.rooms.some(r => r.specialStatus === 'renovation');
                 const propertyProfile = getPropertyProfile(property.rooms);
                 const profileBadge = getProfileBadge(propertyProfile);
                 
                 // Check if any room is 'upcoming' (active countdown < 45 days)
                 // IMPORTANT: We skip renovation rooms from this calculation to show the specific Renovation badge instead
                 const hasUpcoming = property.rooms.some(room => {
                    if (room.specialStatus === 'renovation') return false; // Don't show "free in..." if it's in renovation
                    if (!room.availableFrom || room.availableFrom === 'Consultar' || room.availableFrom === 'Inmediata') return false;
                    try {
                        const [day, month, year] = room.availableFrom.split('/').map(Number);
                        const exitDate = new Date(year, month - 1, day);
                        const today = new Date();
                        exitDate.setHours(23, 59, 59); 
                        today.setHours(0, 0, 0);
                        const diffTime = exitDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays > 0 && diffDays < 45;
                    } catch (e) { return false; }
                 });
                 
                 return (
                     <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 transition-all duration-300 group relative">
                         {/* Header Compacto - Nuevo Diseño Horizontal */}
                         <div 
                            className="flex cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleProperty(property.id)}
                         >
                             {/* Imagen de Portada (Izquierda) */}
                             <div className="w-28 sm:w-48 relative flex-shrink-0 bg-gray-100 flex items-center justify-center min-h-[9rem]">
                                {property.image ? (
                                    <img 
                                        src={property.image} 
                                        alt={property.address} 
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-gray-50">
                                        <Camera className="w-8 h-8 text-gray-300 mb-2" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">
                                            {t('rooms.status.photos_pending')}
                                        </span>
                                    </div>
                                )}
                                {/* Overlay Gradiente para texto encima si fuera necesario, o simple protección */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                                
                                {/* Badges Container */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                                    {availableCount > 0 && (
                                        <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            {availableCount} Libres
                                        </div>
                                    )}
                                    {/* Prioritize Renovation Badge over Upcoming Badge */}
                                    {hasRenovation && (
                                        <div className="bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
                                            <Hammer className="w-3 h-3" />
                                            <span className="hidden sm:inline">{t('rooms.status.renovation_soon')}</span>
                                            <span className="sm:hidden">Reformas</span>
                                        </div>
                                    )}
                                    {!hasRenovation && hasUpcoming && (
                                        <div className="bg-orange-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
                                            <Timer className="w-3 h-3" />
                                            <span className="hidden sm:inline">{t('rooms.status.free_in')}</span>
                                        </div>
                                    )}
                                </div>
                             </div>

                             {/* Contenido (Derecha) */}
                             <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                                 <div className="min-w-0 flex-1">
                                     <div className="flex flex-col gap-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-base sm:text-lg text-rentia-black leading-tight">{property.address}</h3>
                                            
                                            {/* Custom Door - MOBILE */}
                                            <div className="sm:hidden ml-2 flex-shrink-0">
                                                <InteractiveDoor 
                                                    isOpen={isExpanded} 
                                                    onClick={(e) => { e.stopPropagation(); toggleProperty(property.id); }} 
                                                    className="w-9 h-12"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            {hasNew && (
                                                <span className="inline-flex text-[9px] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wide items-center gap-0.5 flex-shrink-0">
                                                    <Sparkles className="w-2.5 h-2.5" /> {t('rooms.status.new')}
                                                </span>
                                            )}
                                            
                                            {profileBadge && (
                                                <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-wide flex-shrink-0 ${profileBadge.style}`}>
                                                    {profileBadge.icon} {profileBadge.text}
                                                </span>
                                            )}
                                        </div>
                                     </div>
                                     
                                     <p className="text-xs sm:text-sm text-gray-500 mt-1.5 truncate">{property.city}</p>
                                 </div>
                                 
                                 {/* Custom Door - DESKTOP */}
                                 <div className="hidden sm:block absolute top-5 right-5 z-10">
                                     <InteractiveDoor 
                                        isOpen={isExpanded} 
                                        onClick={(e) => { e.stopPropagation(); toggleProperty(property.id); }} 
                                        className="w-12 h-16"
                                     />
                                 </div>

                                 {/* FOOTER DE LA TARJETA (Mejorado para móvil) */}
                                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-50 gap-3">
                                     <div className="flex items-center gap-2 text-xs font-medium text-gray-500 flex-wrap">
                                         <span className="bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-md font-bold uppercase tracking-wide whitespace-nowrap shadow-sm border border-gray-200">
                                            {totalRooms} habs.
                                         </span>
                                         {property.bathrooms && (
                                             <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-md text-rentia-blue border border-blue-100 whitespace-nowrap shadow-sm" title="Baños compartidos en la vivienda">
                                                 <Bath className="w-3.5 h-3.5" />
                                                 <span className="font-bold">{property.bathrooms} baños</span>
                                             </div>
                                         )}
                                     </div>
                                     
                                     <div className="flex items-center gap-3 w-full sm:w-auto">
                                         {/* DRIVE LINK BUTTON */}
                                         {property.driveLink && (
                                            <a 
                                                href={property.driveLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md border border-gray-200 transition-all shadow-sm hover:shadow active:scale-95 group-link"
                                            >
                                                <div className="w-4 h-4 relative">
                                                     {/* SVG preserved */}
                                                     <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l32.3-56-4.75-8.3h-8.7c-2.6 0-5 .7-7.1 1.9l-18.8 32.7c-2.2 3.8-2.2 8.4 0 12.2l-.1.15h.1z" fill="#0066da"/>
                                                        <path d="M43.65 25h-28.7c-2.2 3.8-2.2 8.3 0 12.1l18.8 32.6c.8 1.4 1.9 2.5 3.2 3.2l32.4-56.2h-7.65c-2.4.1-4.7.8-6.75 2l-11.3 6.3z" fill="#00ac47"/>
                                                        <path d="M73.55 76.8c1.3-.7 2.4-1.8 3.2-3.2l10.55-18.2c2.2-3.8 2.2-8.4 0-12.2l-11.3-19.55-16.15-2.65-3.8-6.6-22.4 38.9 3.55 6.1c2.1 3.7 5.9 6 10.2 6.3h26.15z" fill="#ea4335"/>
                                                        <path d="M43.65 25 29.35 0h8.7c4.3.3 8.1 2.6 10.2 6.3l11.3 19.55-15.9-.85z" fill="#00832d"/>
                                                        <path d="M22.05 62.6 44.4 23.7l3.8 6.6-22.35 38.7c-4.3-.3-8.1-2.6-10.2-6.3L5.1 44.5c-.2-.4-.4-.8-.6-1.2l17.55 19.3z" fill="#2684fc"/>
                                                        <path d="M76.75 73.6l-14.7-25.5 7.4-12.8 17.85 31c-2.1 3.7-5.9 6-10.2 6.3h-22.4l22.05-38.1z" fill="#ffba00"/>
                                                    </svg>
                                                </div>
                                                <span>Drive</span>
                                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                                            </a>
                                         )}
                                         
                                         <a 
                                            href={property.googleMapsLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-rentia-blue bg-blue-50/50 hover:bg-blue-50 text-xs font-bold px-3 py-2 rounded-md transition-colors border border-transparent hover:border-blue-100"
                                            onClick={(e) => e.stopPropagation()}
                                         >
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>Mapa</span>
                                         </a>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         {/* Room List (Accordion) */}
                         <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50/50 ${isExpanded ? 'max-h-[5000px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}`}>
                             <div className="p-4 space-y-3">
                                 {property.bathrooms && (
                                      <div className="mb-2 text-center">
                                         <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-800 text-[10px] font-bold px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                                             <Bath className="w-3 h-3" />
                                             {property.bathrooms} baños completos en la vivienda (compartidos)
                                         </span>
                                      </div>
                                 )}

                                 {property.rooms.map(room => {
                                     const containerStyle = getRoomStatusContainerStyle(room);
                                     // @ts-ignore - Adding custom property for logic
                                     const statusInfo = getStatusLabel(room);
                                     // We now consider both the traditional 'Consultar' status and the new 'Se libera en' as consultation-worthy
                                     const isConsult = statusInfo.text === t('rooms.status.consult') || statusInfo.text === t('rooms.status.free_in');
                                     const isRenovation = room.specialStatus === 'renovation';
                                     // @ts-ignore
                                     const showTimer = statusInfo.showTimer;
                                     const isFixedExpenses = room.expenses.toLowerCase().includes('fijos');
                                     
                                     // Transformación nombre Habitación (H1 -> Habitación 1)
                                     const displayName = room.name.replace(/^H(\d+)$/i, 'Habitación $1');
                                     
                                     return (
                                         <div key={room.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors relative overflow-hidden gap-3 ${containerStyle}`}>
                                             
                                             {/* "NEW" Badge Effect */}
                                             {room.specialStatus === 'new' && (
                                                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rentia-gold to-yellow-300"></div>
                                             )}

                                             {/* Room Info */}
                                             <div className="flex flex-col pl-2">
                                                 <div className="flex items-center gap-2 flex-wrap">
                                                     <span className="font-bold text-base text-gray-800">{displayName}</span>
                                                     {room.specialStatus === 'new' && (
                                                         <span className="text-[9px] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-0.5">
                                                             <Sparkles className="w-2 h-2" /> {t('rooms.status.new')}
                                                         </span>
                                                     )}
                                                     {room.hasAirConditioning && (
                                                         <span className="text-[9px] bg-cyan-100 text-cyan-800 border border-cyan-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-0.5" title="Aire Acondicionado">
                                                             <Wind className="w-2 h-2" /> Aire Acond.
                                                         </span>
                                                     )}
                                                 </div>
                                                 <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-sm font-semibold text-rentia-blue">
                                                        {room.price > 0 ? `${room.price}€` : t('common.consult')}
                                                    </span>
                                                 </div>
                                                 {/* Expenses Info */}
                                                 <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded w-fit ${isFixedExpenses ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                     <Receipt className="w-3 h-3" />
                                                     <span>{translateExpenses(room.expenses)}</span>
                                                 </div>
                                                 
                                                 {/* NEW THUMBNAIL GALLERY */}
                                                 <div className="flex flex-wrap gap-2 mt-3 items-center">
                                                      {room.images && room.images.length > 0 && (
                                                          <div className="flex gap-2 overflow-x-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                                                              {room.images.slice(0, 3).map((img, idx) => (
                                                                  <div 
                                                                    key={idx} 
                                                                    className="relative w-12 h-12 flex-shrink-0 cursor-zoom-in group"
                                                                    onClick={() => openRoomImages(room.images!, idx)}
                                                                  >
                                                                      <img 
                                                                        src={img} 
                                                                        alt={`${displayName} view ${idx+1}`} 
                                                                        className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm hover:border-rentia-blue transition-all" 
                                                                      />
                                                                      {/* Overlay for +X items on the last visible one if there are more */}
                                                                      {idx === 2 && room.images!.length > 3 && (
                                                                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-white text-xs font-bold backdrop-blur-[1px]">
                                                                              +{room.images!.length - 3}
                                                                          </div>
                                                                      )}
                                                                  </div>
                                                              ))}
                                                          </div>
                                                      )}
                                                      
                                                      {/* Video Button - kept as a pill but next to gallery */}
                                                      {room.video && (
                                                         <a 
                                                            href={room.video} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all shadow-sm group"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title="Ver Video"
                                                         >
                                                             <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                                                         </a>
                                                      )}
                                                 </div>
                                             </div>

                                             {/* Status & Date & Action */}
                                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                                                 <div className="flex flex-col items-start sm:items-end">
                                                     <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${statusInfo.color}`}>
                                                         {statusInfo.icon}
                                                         {statusInfo.text}
                                                     </div>

                                                     {/* TIMER (CRONÓMETRO) - SI CORRESPONDE */}
                                                     {showTimer && room.availableFrom && (
                                                         <CountdownTimer targetDateStr={room.availableFrom} />
                                                     )}
                                                     
                                                     {room.status !== 'available' && !isConsult && !isRenovation && (
                                                         <span className="text-[10px] font-medium text-gray-400 mt-1">
                                                             {t('rooms.status.until')}: {room.availableFrom}
                                                         </span>
                                                     )}
                                                     {isRenovation && (
                                                         <span className="text-[10px] font-medium text-yellow-600 mt-1">
                                                             {t('rooms.status.forecast')}: {room.availableFrom}
                                                         </span>
                                                     )}
                                                 </div>

                                                 {/* Action Button */}
                                                 {(room.status === 'available' || isConsult) && !isRenovation && (
                                                     <a 
                                                        href={isConsult 
                                                            ? `https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20quería%20saber%20si%20la%20habitaci%C3%B3n%20${encodeURIComponent(displayName)}%20en%20${property.address}%20se%20va%20a%20quedar%20libre%20pronto.`
                                                            : `https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20me%20interesa%20la%20habitaci%C3%B3n%20${encodeURIComponent(displayName)}%20en%20${property.address}`
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={`w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-95 min-h-[44px] ${
                                                            room.status === 'available' 
                                                            ? 'bg-[#25D366] hover:bg-[#20ba5c] text-white' 
                                                            : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                                                        }`}
                                                     >
                                                         <MessageCircle className="w-4 h-4" />
                                                         {room.status === 'available' ? t('rooms.status.contact') : t('rooms.status.consult')}
                                                     </a>
                                                 )}
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     </div>
                 );
             })}
         </div>
      </section>

      {/* Footer Info */}
      <section className="pb-16 container mx-auto px-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 max-w-2xl mx-auto text-center shadow-sm">
             <h4 className="font-bold text-rentia-black mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                 <AlertCircle className="w-4 h-4 text-rentia-blue" />
                 {t('rooms.status.guide')}
             </h4>
             <div className="flex justify-center gap-4 text-xs text-gray-600 flex-wrap">
                 <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                     <span className="w-2 h-2 rounded-full bg-green-500"></span> 
                     <span className="font-medium text-green-700">{t('rooms.status.free')}</span>
                 </div>
                 <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-1 rounded-full border border-blue-100">
                     <Sparkles className="w-3 h-3 text-purple-600" />
                     <span className="font-medium text-purple-700">{t('rooms.status.new')}</span>
                 </div>
                 <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                     <HelpCircle className="w-3 h-3 text-orange-600" /> 
                     <span className="font-medium text-orange-700">{t('rooms.status.consult')}</span>
                 </div>
                 <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                     <Hammer className="w-3 h-3 text-yellow-600" /> 
                     <span className="font-medium text-yellow-700">{t('rooms.status.renovation')}</span>
                 </div>
             </div>
        </div>
      </section>

      {/* Image Lightbox */}
      {isLightboxOpen && (
        <ImageLightbox 
            images={lightboxImages} 
            selectedIndex={lightboxIndex} 
            onClose={() => setIsLightboxOpen(false)} 
        />
      )}

    </div>
  );
};
