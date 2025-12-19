
import React, { useState, useMemo, useEffect } from 'react';
import { Home, MapPin, CheckCircle, User, MessageCircle, Filter, AlertCircle, Receipt, Sparkles, Hammer, HelpCircle, Building, Gift, Users as UsersIcon, Wallet, PlayCircle, Camera, Timer, Bath, Wind, ExternalLink, GraduationCap, Briefcase, Users, ZoomIn, DoorClosed, DoorOpen, ChevronDown, Info, Layout, X, Euro, BedDouble, Bed, Tv, Lock, Sun, Monitor, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { properties as staticProperties, Property, Room } from '../data/rooms'; 
import { useLanguage } from '../contexts/LanguageContext';
import { ImageLightbox } from './ImageLightbox';

// Helper Component for Loading State
const ImageWithLoader = ({ src, alt, className, onClick }: { src: string, alt: string, className?: string, onClick?: (e: React.MouseEvent) => void }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <>
            {!loaded && (
                <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 z-10`}>
                    <Loader2 className="w-8 h-8 text-rentia-blue/50 animate-spin" />
                </div>
            )}
            <img 
                src={src} 
                alt={alt} 
                className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                onClick={onClick}
                loading="lazy"
                decoding="async"
            />
        </>
    );
};

const CountdownTimer = ({ targetDateStr }: { targetDateStr: string }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const [day, month, year] = targetDateStr.split('/').map(Number);
      const targetDate = new Date(year, month - 1, day); 
      targetDate.setHours(23, 59, 59); 

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

    setTimeLeft(calculateTimeLeft());
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

const InteractiveDoor = ({ isOpen, onClick, className = "" }: { isOpen: boolean, onClick: (e: React.MouseEvent) => void, className?: string }) => {
    return (
        <div 
            className={`relative cursor-pointer [perspective:1000px] group ${className}`} 
            onClick={onClick}
            title={isOpen ? "Cerrar tarjeta" : "Ver habitaciones"}
        >
            <div className={`absolute inset-0 bg-rentia-gold rounded border border-rentia-gold shadow-inner transition-colors duration-500 flex items-center justify-center`}>
                <div className="w-1 h-full bg-white/20 absolute left-0 top-0 bottom-0 blur-sm"></div>
            </div>
            <div 
                className={`
                    absolute inset-0 bg-rentia-blue rounded border border-blue-700 
                    origin-left transition-all duration-700 ease-in-out 
                    shadow-lg flex items-center
                    ${isOpen ? '[transform:rotateY(-115deg)] shadow-xl' : '[transform:rotateY(0deg)]'}
                `}
            >
                <div className="absolute right-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-sm border border-gray-300/50"></div>
                <div className="absolute top-2 left-2 right-2 h-[40%] border border-black/10 rounded-sm opacity-20 pointer-events-none"></div>
                <div className="absolute bottom-2 left-2 right-2 h-[40%] border border-black/10 rounded-sm opacity-20 pointer-events-none"></div>
            </div>
        </div>
    );
};

export const RoomsView: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>(staticProperties); 
  const [loadingProperties, setLoadingProperties] = useState(true);

  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [filterAirCon, setFilterAirCon] = useState('all');
  const [filterExpenses, setFilterExpenses] = useState('all');
  const [filterComingSoon, setFilterComingSoon] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0); 
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const { t } = useLanguage();

  useEffect(() => {
    // Initial Load - Already set via useState(staticProperties) but let's confirm load status
    setLoadingProperties(false);

    const unsubscribe = onSnapshot(collection(db, "properties"), (snapshot) => {
        const firestoreProps: Property[] = [];
        snapshot.forEach((doc) => {
            firestoreProps.push({ ...doc.data(), id: doc.id } as Property);
        });
        
        // Fusión: Usar datos de Firestore + datos estáticos que NO estén ya en Firestore (por ID)
        const dbIds = new Set(firestoreProps.map(p => p.id));
        const missingStatics = staticProperties.filter(p => !dbIds.has(p.id));
        
        const combinedProps = [...firestoreProps, ...missingStatics];
        
        // Ordenar alfabéticamente
        combinedProps.sort((a, b) => a.address.localeCompare(b.address));
        
        setProperties(combinedProps);
        setLoadingProperties(false);
    }, (error) => {
        console.warn("Error obteniendo propiedades de Firestore, usando datos estáticos:", error);
        // Fallback to static is already handled by initial state, but explicit set here ensures it.
        setProperties(staticProperties);
        setLoadingProperties(false);
    });

    return () => unsubscribe();
  }, []);

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

  const totalRoomsManaged = useMemo(() => {
    return properties.reduce((acc, property) => acc + property.rooms.length, 0);
  }, [properties]);

  const uniqueZones = useMemo(() => {
      const zones = new Set(properties.map(p => p.city));
      return Array.from(zones).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
        if (showOnlyAvailable && !p.rooms.some(r => r.status === 'available')) {
            return false;
        }
        if (selectedZone && p.city !== selectedZone) {
            return false;
        }
        if (selectedProfile) {
            const matchesProfile = p.rooms.some(r => {
                const profile = r.targetProfile || 'both';
                if (selectedProfile === 'students') return profile === 'students' || profile === 'both';
                if (selectedProfile === 'workers') return profile === 'workers' || profile === 'both';
                return false;
            });
            if (!matchesProfile) return false;
        }
        if (filterAirCon !== 'all') {
            const matchesAir = p.rooms.some(r => {
                if (filterAirCon === 'yes') return r.hasAirConditioning === true;
                if (filterAirCon === 'no') return !r.hasAirConditioning;
                return true;
            });
            if (!matchesAir) return false;
        }
        if (filterExpenses !== 'all') {
            const matchesExpenses = p.rooms.some(r => {
                const exp = r.expenses.toLowerCase();
                if (filterExpenses === 'fixed') return exp.includes('fijos');
                if (filterExpenses === 'shared') return exp.includes('reparten');
                return true;
            });
            if (!matchesExpenses) return false;
        }
        if (minPrice !== '' || maxPrice !== '') {
            const matchesPrice = p.rooms.some(r => {
                if (showOnlyAvailable && r.status !== 'available') return false;
                const p = r.price;
                if (minPrice !== '' && p < minPrice) return false;
                if (maxPrice !== '' && p > maxPrice) return false;
                return true;
            });
            if (!matchesPrice) return false;
        }
        if (filterComingSoon) {
            const matchesComingSoon = p.rooms.some(room => {
                if (room.specialStatus === 'renovation') return false; 
                if (!room.availableFrom || room.availableFrom === 'Consultar' || room.availableFrom === 'Inmediata') return false;
                try {
                    const [day, month, year] = room.availableFrom.split('/').map(Number);
                    const exitDate = new Date(year, month - 1, day);
                    const today = new Date();
                    exitDate.setHours(23, 59, 59); 
                    today.setHours(0, 0, 0);
                    const diffTime = exitDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays > 0;
                } catch (e) { return false; }
            });
            if (!matchesComingSoon) return false;
        }
        return true;
    });
  }, [properties, showOnlyAvailable, selectedZone, selectedProfile, filterAirCon, filterExpenses, filterComingSoon, minPrice, maxPrice]);

  const activeFiltersCount = useMemo(() => {
      let count = 0;
      if (selectedZone) count++;
      if (selectedProfile) count++;
      if (filterAirCon !== 'all') count++;
      if (filterExpenses !== 'all') count++;
      if (showOnlyAvailable) count++;
      if (filterComingSoon) count++;
      if (minPrice !== '') count++;
      if (maxPrice !== '') count++;
      return count;
  }, [selectedZone, selectedProfile, filterAirCon, filterExpenses, showOnlyAvailable, filterComingSoon, minPrice, maxPrice]);

  const clearFilters = () => {
      setSelectedZone('');
      setSelectedProfile('');
      setFilterAirCon('all');
      setFilterExpenses('all');
      setShowOnlyAvailable(false);
      setFilterComingSoon(false);
      setMinPrice('');
      setMaxPrice('');
  };

  const getRoomStatusContainerStyle = (room: Room) => {
    if (room.specialStatus === 'renovation') {
        return 'bg-yellow-50 border-yellow-200 border-dashed';
    }
    if (room.status === 'available') return 'bg-white border-green-200 shadow-sm';
    
    // Check for specific date override
    if (room.availableFrom && room.availableFrom !== 'Consultar' && room.availableFrom !== 'Inmediata') {
        const [day, month, year] = room.availableFrom.split('/').map(Number);
        const exitDate = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = exitDate.getTime() - today.getTime();
        
        // Si la fecha es futura, mostramos estilo de "próximamente"
        if (diffTime > 0) {
            return 'bg-orange-50 border-orange-200';
        }
    }
    return 'bg-gray-50 border-gray-100 opacity-80';
  };

  const getStatusLabel = (room: Room) => {
    if (room.specialStatus === 'renovation') {
        return { icon: <Hammer className="w-3.5 h-3.5"/>, text: t('rooms.status.renovation'), color: 'text-yellow-700' };
    }
    if (room.status === 'available') return { icon: <CheckCircle className="w-3.5 h-3.5"/>, text: t('rooms.status.free'), color: 'text-green-700' };
    
    // Check for specific date override
    if (room.availableFrom && room.availableFrom !== 'Consultar') {
        const [day, month, year] = room.availableFrom.split('/').map(Number);
        const exitDate = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = exitDate.getTime() - today.getTime();
        
        // Si hay fecha futura, SIEMPRE mostrar "Liberación en..." independientemente del estado 'occupied'
        if (diffTime > 0) {
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
      const exp = expense.toLowerCase();
      if (exp.includes('fijos')) return t('rooms.status.fixed_expenses');
      if (exp.includes('reparten')) return t('rooms.status.shared_expenses');
      return expense;
  }

  // --- HELPER PARA ICONOS DE CAMA ---
  const getBedIcon = (type: string | undefined) => {
      if(!type) return null;
      if(type === 'single') return <Bed className="w-3 h-3"/>;
      if(type === 'double' || type === 'king') return <BedDouble className="w-3 h-3"/>;
      return <Bed className="w-3 h-3"/>;
  };

  const getBedLabel = (type: string | undefined) => {
      if(!type) return '';
      if(type === 'single') return '90cm';
      if(type === 'double') return '135cm';
      if(type === 'king') return 'King';
      if(type === 'sofa') return 'Sofá Cama';
      return '';
  };

  return (
    <div className="font-sans bg-gray-50 min-h-screen flex flex-col animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 bg-rentia-black text-white overflow-hidden">
        <div className="absolute inset-0">
           <img
             src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80"
             alt="Alquiler de Habitaciones en Murcia"
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
      <section className="container mx-auto px-4 -mt-6 relative z-30 mb-8 max-w-[1600px]">
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
      <section className="container mx-auto px-4 pb-12 relative z-20 max-w-[1600px]">
         
         {/* UPDATE NOTICE */}
         <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm">
             <div className="p-2 bg-white rounded-full text-rentia-blue shrink-0 shadow-sm">
                 <Info className="w-5 h-5" />
             </div>
             <div>
                 <h4 className="font-bold text-rentia-blue text-sm">{t('rooms.update_alert.title')}</h4>
                 <p className="text-gray-600 text-sm mt-1 leading-relaxed">{t('rooms.update_alert.text')}</p>
             </div>
         </div>

         {/* Filters */}
         <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-8 flex flex-col items-start gap-4">
             {/* ... (Filtros existentes sin cambios) ... */}
             <div 
                className="flex items-center justify-between w-full border-b border-gray-50 pb-2 cursor-pointer md:cursor-default"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
             >
                 <div className="flex items-center gap-2 text-rentia-black font-bold mb-2 md:mb-0">
                     <Filter className="w-5 h-5 text-rentia-blue" />
                     <span>{t('rooms.filter.label')}</span>
                     {activeFiltersCount > 0 && (
                         <span className="bg-rentia-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full md:hidden">
                             {activeFiltersCount}
                         </span>
                     )}
                 </div>
                 <div className="md:hidden">
                     <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
                 </div>
             </div>
             
             <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} md:flex flex-wrap items-center gap-4 w-full transition-all duration-300 ease-in-out`}>
                
                <div className="relative w-full sm:w-auto flex-grow min-w-[180px]">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 appearance-none cursor-pointer text-gray-700 font-medium"
                    >
                        <option value="">{t('rooms.filter.all_zones')}</option>
                        {uniqueZones.map(z => (
                            <option key={z} value={z}>{z}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative w-full sm:w-auto flex-grow min-w-[180px]">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={selectedProfile}
                        onChange={(e) => setSelectedProfile(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 appearance-none cursor-pointer text-gray-700 font-medium"
                    >
                        <option value="">{t('rooms.filter.all_profiles')}</option>
                        <option value="students">{t('rooms.filter.profile_students')}</option>
                        <option value="workers">{t('rooms.filter.profile_workers')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative w-full sm:w-auto flex-grow min-w-[180px]">
                    <Wind className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={filterAirCon}
                        onChange={(e) => setFilterAirCon(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 appearance-none cursor-pointer text-gray-700 font-medium"
                    >
                        <option value="all">{t('rooms.filter.air_con_all')}</option>
                        <option value="yes">{t('rooms.filter.air_con_yes')}</option>
                        <option value="no">{t('rooms.filter.air_con_no')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative w-full sm:w-auto flex-grow min-w-[180px]">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={filterExpenses}
                        onChange={(e) => setFilterExpenses(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 appearance-none cursor-pointer text-gray-700 font-medium"
                    >
                        <option value="all">{t('rooms.filter.expenses_all')}</option>
                        <option value="fixed">{t('rooms.filter.expenses_fixed')}</option>
                        <option value="shared">{t('rooms.filter.expenses_shared')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="flex gap-2 w-full sm:w-auto flex-grow">
                    <div className="relative w-1/2 sm:w-28">
                        <Euro className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                            type="number"
                            placeholder="Min €"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                            className="w-full pl-7 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50"
                        />
                    </div>
                    <div className="relative w-1/2 sm:w-28">
                        <Euro className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                            type="number"
                            placeholder="Max €"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                            className="w-full pl-7 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50"
                        />
                    </div>
                </div>

                <label className="flex items-center cursor-pointer relative select-none bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 w-full sm:w-auto justify-start flex-grow sm:flex-grow-0">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={showOnlyAvailable}
                        onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
                    />
                    <div className="relative w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rentia-blue shadow-sm"></div>
                    <span className="ml-2 text-xs font-bold text-gray-600">{t('rooms.filter.check')}</span>
                </label>

                <label className="flex items-center cursor-pointer relative select-none bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 w-full sm:w-auto justify-start flex-grow sm:flex-grow-0">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={filterComingSoon}
                        onChange={() => setFilterComingSoon(!filterComingSoon)}
                    />
                    <div className="relative w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 shadow-sm"></div>
                    <span className="ml-2 text-xs font-bold text-orange-700 flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {t('rooms.filter.check_soon')}
                    </span>
                </label>

                {activeFiltersCount > 0 && (
                    <button 
                        onClick={clearFilters}
                        className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors w-full sm:w-auto justify-center"
                    >
                        <X className="w-3 h-3" /> Limpiar Filtros
                    </button>
                )}
             </div>
         </div>

         {/* Property Grid (Compact Mode) */}
         <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
             {loadingProperties ? (
                 <div className="text-center py-20 text-gray-500">
                     <p className="text-sm animate-pulse">{t('common.loading')}</p>
                 </div>
             ) : filteredProperties.length === 0 ? (
                 <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed">
                     <p className="text-sm">No hay viviendas que coincidan con los filtros.</p>
                     <button onClick={clearFilters} className="mt-4 text-rentia-blue hover:underline text-sm font-bold">Ver todas</button>
                 </div>
             ) : (
             filteredProperties.map(property => {
                 const availableCount = property.rooms.filter(r => r.status === 'available').length;
                 const totalRooms = property.rooms.length;
                 const isExpanded = expandedProperties[property.id] || false;
                 const hasNew = property.rooms.some(r => r.specialStatus === 'new');
                 const hasRenovation = property.rooms.some(r => r.specialStatus === 'renovation');
                 const propertyProfile = getPropertyProfile(property.rooms);
                 const profileBadge = getProfileBadge(propertyProfile);
                 
                 const hasUpcoming = property.rooms.some(room => {
                    if (room.specialStatus === 'renovation') return false; 
                    if (!room.availableFrom || room.availableFrom === 'Consultar' || room.availableFrom === 'Inmediata') return false;
                    try {
                        const [day, month, year] = room.availableFrom.split('/').map(Number);
                        const exitDate = new Date(year, month - 1, day);
                        const today = new Date();
                        exitDate.setHours(23, 59, 59); 
                        today.setHours(0, 0, 0);
                        const diffTime = exitDate.getTime() - today.getTime();
                        return diffTime > 0;
                    } catch (e) { return false; }
                 });
                 
                 return (
                     <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg border border-gray-200 transition-all duration-300 group relative">
                         {/* Header Compacto - Nuevo Diseño Responsive */}
                         <div 
                            className="flex flex-col md:flex-row cursor-pointer transition-colors"
                            onClick={() => toggleProperty(property.id)}
                         >
                             {/* Imagen de Portada (Responsive) */}
                             <div 
                                className="w-full h-48 md:w-96 md:h-auto md:min-h-[14rem] relative flex-shrink-0 bg-gray-100 flex items-center justify-center group/main-img overflow-hidden"
                                onClick={(e) => {
                                    if (property.image) {
                                        e.stopPropagation();
                                        openRoomImages([property.image]);
                                    }
                                }}
                             >
                                {property.image ? (
                                    <>
                                        <ImageWithLoader 
                                            src={property.image} 
                                            alt={`Habitación en alquiler ${property.address}`} 
                                            className="absolute inset-0 w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover/main-img:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover/main-img:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                                            <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover/main-img:opacity-100 transition-all duration-300 transform scale-75 group-hover/main-img:scale-100 drop-shadow-md" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-gray-50">
                                        <Camera className="w-10 h-10 text-gray-300 mb-2" />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide leading-tight">
                                            {t('rooms.status.photos_pending')}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-black/30 md:to-transparent pointer-events-none opacity-60"></div>
                                
                                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none z-10">
                                    {availableCount > 0 && (
                                        <div className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 backdrop-blur-sm bg-opacity-90">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            {availableCount} {t('rooms.status.free')}
                                        </div>
                                    )}
                                    {hasRenovation && (
                                        <div className="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 animate-pulse backdrop-blur-sm bg-opacity-90">
                                            <Hammer className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">{t('rooms.status.renovation_soon')}</span>
                                            <span className="sm:hidden">{t('rooms.status.renovation')}</span>
                                        </div>
                                    )}
                                    {!hasRenovation && hasUpcoming && (
                                        <div className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 animate-pulse backdrop-blur-sm bg-opacity-90">
                                            <Timer className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">{t('rooms.status.free_in')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-3 left-3 right-3 text-white md:hidden z-10">
                                    <h3 className="font-bold text-lg leading-tight drop-shadow-md truncate">{property.address}</h3>
                                    <p className="text-xs opacity-90 drop-shadow-md flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3" /> {property.city}
                                    </p>
                                </div>
                             </div>

                             {/* Contenido (Derecha) */}
                             <div className="flex-1 p-5 md:p-6 flex flex-col justify-between bg-white relative">
                                 <div className="absolute top-4 right-4 z-20">
                                     <InteractiveDoor 
                                        isOpen={isExpanded} 
                                        onClick={(e) => { e.stopPropagation(); toggleProperty(property.id); }} 
                                        className="w-10 h-14 md:w-12 md:h-16"
                                     />
                                 </div>

                                 <div className="min-w-0 flex-1 pr-12 md:pr-16">
                                     <div className="flex flex-col gap-2">
                                        <div className="hidden md:block">
                                            <h3 className="font-bold text-xl md:text-2xl text-rentia-black leading-tight mb-1 group-hover:text-rentia-blue transition-colors">{property.address}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" /> {property.city}
                                                {property.floor && <span className="text-gray-300 mx-1">•</span>}
                                                {property.floor && <span>{property.floor}</span>}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-2">
                                            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border border-gray-200">
                                                <Layout className="w-3 h-3" /> {totalRooms} habs
                                            </span>
                                            
                                            {property.bathrooms && (
                                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-rentia-blue px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide border border-blue-100">
                                                    <Bath className="w-3 h-3" /> {property.bathrooms} baños
                                                </span>
                                            )}

                                            {hasNew && (
                                                <span className="inline-flex text-[10px] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded font-bold uppercase tracking-wide items-center gap-1 shadow-sm">
                                                    <Sparkles className="w-3 h-3" /> {t('rooms.status.new')}
                                                </span>
                                            )}
                                            
                                            {profileBadge && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border font-bold uppercase tracking-wide ${profileBadge.style}`}>
                                                    {profileBadge.icon} {profileBadge.text}
                                                </span>
                                            )}
                                        </div>
                                     </div>
                                 </div>

                                 <div className="flex flex-col md:flex-row md:items-end md:justify-between mt-6 pt-4 border-t border-gray-50 gap-4">
                                     <div className="text-sm text-gray-500">
                                         {availableCount > 0 ? (() => {
                                             // CÁLCULO SEGURO DEL PRECIO MÍNIMO DE LAS HABITACIONES DISPONIBLES
                                             if (!property.rooms || !Array.isArray(property.rooms)) return (
                                                 <span className="text-gray-400 flex items-center gap-1 text-sm"><Info className="w-4 h-4" /> Consultar Precio</span>
                                             );

                                             // Filtramos habitaciones disponibles Y que tengan un precio válido > 0
                                             const availablePrices = property.rooms
                                                 .filter(r => r.status === 'available' && typeof r.price === 'number' && r.price > 0)
                                                 .map(r => r.price);
                                             
                                             // Calculamos el mínimo si hay precios, si no 0
                                             const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : 0;

                                             return minPrice > 0 ? (
                                                 <span className="text-green-600 font-medium flex items-center gap-1 text-base">
                                                     <CheckCircle className="w-4 h-4" /> Desde <span className="font-bold text-xl">{minPrice}€</span> <span className="text-xs text-gray-400">/mes</span>
                                                 </span>
                                             ) : (
                                                 <span className="text-gray-400 flex items-center gap-1 text-sm">
                                                     <Info className="w-4 h-4" /> Consultar Precio
                                                 </span>
                                             );
                                         })() : (
                                             <span className="text-gray-400 flex items-center gap-1 text-sm">
                                                 <Info className="w-4 h-4" /> Sin disponibilidad actual
                                             </span>
                                         )}
                                     </div>
                                     
                                     <div className="flex items-center gap-2 w-full md:w-auto">
                                         {property.driveLink && (
                                            <a 
                                                href={property.driveLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 transition-all shadow-sm hover:shadow active:scale-95 group-link"
                                            >
                                                <div className="w-4 h-4 relative">
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
                                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-rentia-blue bg-blue-50 hover:bg-blue-100 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors border border-blue-100 hover:border-blue-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>Mapa</span>
                                         </a>
                                         
                                         <button
                                            onClick={(e) => { e.stopPropagation(); toggleProperty(property.id); }}
                                            className="flex-1 md:flex-none bg-rentia-black text-white text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                         >
                                             {isExpanded ? t('common.close') : t('rooms.card.rooms')} <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                         </button>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         {/* Room List (Accordion) */}
                         <div className={`transition-all duration-500 ease-in-out overflow-hidden bg-gray-50 ${isExpanded ? 'max-h-[5000px] opacity-100 border-t border-gray-200' : 'max-h-0 opacity-0'}`}>
                             <div className="p-4 md:p-6 grid grid-cols-1 gap-3">
                                 {property.bathrooms && (
                                      <div className="mb-2 flex justify-center">
                                         <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-800 text-xs font-bold px-4 py-1.5 rounded-full border border-yellow-200 shadow-sm">
                                             <Bath className="w-3.5 h-3.5" />
                                             {property.bathrooms} baños completos en la vivienda (compartidos)
                                         </span>
                                      </div>
                                 )}

                                 {property.rooms.map(room => {
                                     const containerStyle = getRoomStatusContainerStyle(room);
                                     // @ts-ignore
                                     const statusInfo = getStatusLabel(room);
                                     const isConsult = statusInfo.text === t('rooms.status.consult') || statusInfo.text === t('rooms.status.free_in');
                                     const isRenovation = room.specialStatus === 'renovation';
                                     // @ts-ignore
                                     const showTimer = statusInfo.showTimer;
                                     const isFixedExpenses = room.expenses.toLowerCase().includes('fijos');
                                     const displayName = room.name.replace(/^H(\d+)$/i, 'Habitación $1');
                                     
                                     return (
                                         <div key={room.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all relative overflow-hidden gap-4 shadow-sm hover:shadow-md ${containerStyle}`}>
                                             
                                             {room.specialStatus === 'new' && (
                                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rentia-gold to-yellow-300"></div>
                                             )}

                                             {/* Left Side: Info & Media */}
                                             <div className="flex-1 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                 
                                                 {room.images && room.images.length > 0 && (
                                                      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                          <div 
                                                            className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 cursor-zoom-in group rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                                                            onClick={() => openRoomImages(room.images!, 0)}
                                                          >
                                                              <ImageWithLoader 
                                                                src={room.images[0]} 
                                                                alt={`${displayName}`}
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                                              />
                                                              {room.images.length > 1 && (
                                                                  <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg backdrop-blur-[1px]">
                                                                      +{room.images.length - 1}
                                                                  </div>
                                                              )}
                                                          </div>
                                                      </div>
                                                 )}

                                                 <div className="flex flex-col gap-1 w-full">
                                                     <div className="flex flex-wrap items-center gap-2 justify-between w-full">
                                                         <div className="flex items-center gap-2">
                                                            <span className="font-bold text-lg text-gray-800">{displayName}</span>
                                                            {room.specialStatus === 'new' && (
                                                                <span className="text-[10px] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-0.5 shadow-sm">
                                                                    <Sparkles className="w-2 h-2" /> {t('rooms.status.new')}
                                                                </span>
                                                            )}
                                                         </div>
                                                         
                                                         <div className="text-right">
                                                            <span className="text-lg font-bold text-rentia-blue block leading-none">
                                                                {room.price > 0 ? `${room.price}€` : t('common.consult')}
                                                            </span>
                                                            {room.price > 0 && <span className="text-[10px] text-gray-400 font-medium">/ mes</span>}
                                                         </div>
                                                     </div>

                                                     {/* --- ICONOS DE OPTIMIZACIÓN (SI EXISTEN) --- */}
                                                     <div className="flex flex-wrap gap-2 mt-1">
                                                         <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border ${isFixedExpenses ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                             <Receipt className="w-3 h-3" />
                                                             <span>{translateExpenses(room.expenses)}</span>
                                                         </div>
                                                         
                                                         {room.hasAirConditioning && (
                                                             <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-cyan-50 text-cyan-700 border-cyan-100">
                                                                 <Wind className="w-3 h-3" /> Aire Acond.
                                                             </div>
                                                         )}

                                                         {/* Nuevos Campos de Optimización */}
                                                         {room.bedType && (
                                                             <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-indigo-50 text-indigo-700 border-indigo-100">
                                                                 {getBedIcon(room.bedType)}
                                                                 {getBedLabel(room.bedType)}
                                                             </div>
                                                         )}
                                                         
                                                         {room.sqm && (
                                                             <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-gray-50 text-gray-700 border-gray-200">
                                                                 <Layout className="w-3 h-3" /> {room.sqm}m²
                                                             </div>
                                                         )}

                                                         {/* Features */}
                                                         {room.features && room.features.map(f => {
                                                             if(f === 'balcony') return <div key={f} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-orange-50 text-orange-700 border-orange-100"><Sun className="w-3 h-3"/> Balcón</div>;
                                                             if(f === 'smart_tv') return <div key={f} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-slate-50 text-slate-700 border-slate-200"><Tv className="w-3 h-3"/> TV</div>;
                                                             if(f === 'lock') return <div key={f} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-green-50 text-green-700 border-green-100"><Lock className="w-3 h-3"/> Llave</div>;
                                                             if(f === 'desk') return <div key={f} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-100"><Monitor className="w-3 h-3"/> Escritorio</div>;
                                                             return null;
                                                         })}
                                                         
                                                         {room.video && (
                                                             <a 
                                                                href={room.video} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border bg-red-50 text-red-600 border-red-100 hover:bg-red-100 transition-colors"
                                                                onClick={(e) => e.stopPropagation()}
                                                             >
                                                                 <PlayCircle className="w-3 h-3" /> Video
                                                             </a>
                                                         )}
                                                     </div>
                                                     
                                                     {/* Descripción detallada opcional */}
                                                     {room.description && (
                                                         <div className="mt-2 text-xs text-gray-500 bg-white/50 p-2 rounded border border-gray-100 italic leading-relaxed">
                                                             {room.description}
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>

                                             {/* Right Side: Action & Status */}
                                             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 mt-2 md:mt-0 md:min-w-[280px] justify-end border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                                                 <div className="flex flex-col items-start sm:items-end flex-grow">
                                                     <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${statusInfo.color}`}>
                                                         {statusInfo.icon}
                                                         {statusInfo.text}
                                                     </div>

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

                                                 {(room.status === 'available' || isConsult) && !isRenovation && (
                                                     <a 
                                                        href={isConsult 
                                                            ? `https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20quería%20saber%20si%20la%20habitaci%C3%B3n%20${encodeURIComponent(displayName)}%20en%20${property.address}%20se%20va%20a%20quedar%20libre%20pronto.`
                                                            : `https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20me%20interesa%20la%20habitaci%C3%B3n%20${encodeURIComponent(displayName)}%20en%20${property.address}`
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={`w-full sm:w-auto px-6 py-3 md:py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap ${
                                                            room.status === 'available' 
                                                            ? 'bg-[#25D366] hover:bg-[#20ba5c] text-white' 
                                                            : 'bg-orange-100 hover:bg-orange-200 text-orange-800'
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
             }))}
         </div>
      </section>

      {/* Footer Info */}
      <section className="pb-16 container mx-auto px-4 max-w-[1600px]">
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
