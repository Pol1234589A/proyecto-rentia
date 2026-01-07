"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Home, MapPin, CheckCircle, User, MessageCircle, Filter, AlertCircle, Receipt, Sparkles, Hammer, HelpCircle, Building, Gift, Users as UsersIcon, Wallet, PlayCircle, Camera, Timer, Bath, Wind, ExternalLink, GraduationCap, Briefcase, Users, ZoomIn, DoorClosed, DoorOpen, ChevronDown, Info, Layout, X, Euro, BedDouble, Bed, Tv, Lock, Sun, Monitor, Loader2, Megaphone, AlertTriangle, Ban as DoNotDisturb, Edit, Save, Plus, Trash2, Film } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { properties as staticProperties, Property, Room } from '../data/rooms';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageLightbox } from './ImageLightbox';
import { PropertyEditModal } from './PropertyEditModal';
import { useConfig } from '../contexts/ConfigContext';

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
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

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

    const { userRole } = useAuth();
    const isAdmin = userRole === 'agency' || userRole === 'staff';
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);

    const handleSaveProperty = async (updatedProperty: Property) => {
        try {
            await setDoc(doc(db, "properties", updatedProperty.id), updatedProperty, { merge: true });
            // Optimistic update
            setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
        } catch (error) {
            console.error("Error updating property:", error);
            throw error;
        }
    };

    const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedProfile, setSelectedProfile] = useState('');
    const [filterAirCon, setFilterAirCon] = useState('all');
    const [filterExpenses, setFilterExpenses] = useState('all');
    const [filterComingSoon, setFilterComingSoon] = useState(false);
    const [minPrice, setMinPrice] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');

    // Advanced Filters
    const [selectedGender, setSelectedGender] = useState('all');
    const [selectedFloorType, setSelectedFloorType] = useState('all');
    const [selectedBedType, setSelectedBedType] = useState('all');
    const [filterFeatures, setFilterFeatures] = useState<string[]>([]);
    const [selectedAdType, setSelectedAdType] = useState('all');

    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const { t } = useLanguage();
    const config = useConfig();

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

    // Toggle property expansion (Desktop) or Open Sheet (Mobile)
    const toggleProperty = (id: string) => {
        // Simple check for mobile width
        if (window.innerWidth < 768) {
            const property = properties.find(p => p.id === id);
            if (property) setSelectedProperty(property);
        } else {
            setExpandedProperties(prev => ({
                ...prev,
                [id]: !prev[id]
            }));
        }
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

            // --- ADVANCED FILTERS LOGIC ---

            // 1. Property Level Filters
            if (selectedFloorType !== 'all') {
                if (p.floorType !== selectedFloorType) return false;
            }
            if (selectedAdType !== 'all') {
                if (p.adType !== selectedAdType) return false;
            }

            // 2. Room Level Filters (Gender, Bed)
            if (selectedGender !== 'all') {
                // If filtering by gender, at least one available room must match (or be 'both')
                const matches = p.rooms.some(r => {
                    const g = r.gender || 'both';
                    return g === 'both' || g === selectedGender;
                });
                if (!matches) return false;
            }

            if (selectedBedType !== 'all') {
                const matches = p.rooms.some(r => r.bedType === selectedBedType);
                if (!matches) return false;
            }

            // 3. Feature Filters (Mixed Property/Room)
            if (filterFeatures.length > 0) {
                // Must match ALL selected features
                const matchesAllFeatures = filterFeatures.every(feature => {
                    // Check Property Features
                    const matchesProp = p.features?.includes(feature);
                    if (matchesProp) return true;

                    // Check if ANY room has the feature
                    const matchesRoom = p.rooms.some(r => r.features?.includes(feature));
                    if (matchesRoom) return true;

                    return false;
                });
                if (!matchesAllFeatures) return false;
            }

            return true;
        });
    }, [properties, showOnlyAvailable, selectedZone, selectedProfile, filterAirCon, filterExpenses, filterComingSoon, minPrice, maxPrice, selectedGender, selectedFloorType, selectedBedType, filterFeatures, selectedAdType]);

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
        if (selectedGender !== 'all') count++;
        if (selectedFloorType !== 'all') count++;
        if (selectedBedType !== 'all') count++;
        if (selectedAdType !== 'all') count++;
        count += filterFeatures.length;
        return count;
    }, [selectedZone, selectedProfile, filterAirCon, filterExpenses, showOnlyAvailable, filterComingSoon, minPrice, maxPrice, selectedGender, selectedFloorType, selectedBedType, filterFeatures, selectedAdType]);

    const clearFilters = () => {
        setSelectedZone('');
        setSelectedProfile('');
        setFilterAirCon('all');
        setFilterExpenses('all');
        setShowOnlyAvailable(false);
        setFilterComingSoon(false);
        setMinPrice('');
        setMaxPrice('');
        setSelectedGender('all');
        setSelectedFloorType('all');
        setSelectedBedType('all');
        setFilterFeatures([]);
        setSelectedAdType('all');
    };

    const toggleFeature = (feature: string) => {
        setFilterFeatures(prev => prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]);
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
            return { icon: <Hammer className="w-3.5 h-3.5" />, text: t('rooms.status.renovation'), color: 'text-yellow-700' };
        }
        if (room.status === 'available') return { icon: <CheckCircle className="w-3.5 h-3.5" />, text: t('rooms.status.free'), color: 'text-green-700' };

        // Check for specific date override
        if (room.availableFrom && room.availableFrom !== 'Consultar') {
            const [day, month, year] = room.availableFrom.split('/').map(Number);
            const exitDate = new Date(year, month - 1, day);
            const today = new Date();
            const diffTime = exitDate.getTime() - today.getTime();

            // Si hay fecha futura, SIEMPRE mostrar "Liberación en..." independientemente del estado 'occupied'
            if (diffTime > 0) {
                return { icon: <HelpCircle className="w-3.5 h-3.5" />, text: t('rooms.status.free_in'), color: 'text-orange-700', showTimer: true };
            }
        }

        return { icon: <User className="w-3.5 h-3.5" />, text: t('rooms.status.occupied'), color: 'text-gray-500' };
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
        if (!type) return null;
        if (type === 'single') return <Bed className="w-3 h-3" />;
        if (type === 'double' || type === 'king') return <BedDouble className="w-3 h-3" />;
        return <Bed className="w-3 h-3" />;
    };

    const getBedLabel = (type: string | undefined) => {
        if (!type) return '';
        if (type === 'single') return '90cm';
        if (type === 'double') return '135cm';
        if (type === 'king') return 'King';
        if (type === 'sofa') return 'Sofá Cama';
        return '';
    };

    // Helper para obtener estilos de la alerta dinámica
    const getAlertStyles = () => {
        const { variant } = config.roomsAlert;
        switch (variant) {
            case 'warning': return { bg: 'bg-yellow-50', border: 'border-yellow-200', textTitle: 'text-yellow-800', textBody: 'text-yellow-700', icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />, iconBg: 'bg-yellow-100' };
            case 'error': return { bg: 'bg-red-50', border: 'border-red-200', textTitle: 'text-red-900', textBody: 'text-red-700', icon: <Megaphone className="w-5 h-5 text-red-600" />, iconBg: 'bg-red-100' };
            case 'success': return { bg: 'bg-green-50', border: 'border-green-200', textTitle: 'text-green-800', textBody: 'text-green-700', icon: <CheckCircle className="w-5 h-5 text-green-600" />, iconBg: 'bg-green-100' };
            default: return { bg: 'bg-blue-50', border: 'border-blue-200', textTitle: 'text-blue-800', textBody: 'text-blue-700', icon: <Info className="w-5 h-5 text-blue-600" />, iconBg: 'bg-blue-100' };
        }
    };

    const alertStyle = getAlertStyles();

    return (
        <>
            {/* --- ADMIN EDIT MODAL --- */}
            {editingProperty && (
                <PropertyEditModal
                    property={editingProperty}
                    onClose={() => setEditingProperty(null)}
                    onSave={handleSaveProperty}
                />
            )}

            <div className="font-sans bg-gray-50 min-h-screen flex flex-col animate-in fade-in duration-500">

                {/* Hero Section */}
                <section className="relative py-12 md:py-20 bg-rentia-black text-white overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80"
                            alt="Alquiler de Habitaciones en Murcia"
                            className="w-full h-full object-cover opacity-30 scale-105 motion-safe:animate-ken-burns"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-rentia-black/80 via-rentia-black/60 to-rentia-black/90"></div>
                    </div>

                    <div className="relative z-10 container mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full mb-6 font-bold text-xs md:text-sm shadow-xl uppercase tracking-widest ring-1 ring-white/10">
                            <Home className="w-3.5 h-3.5 text-rentia-gold" />
                            <span>{t('rooms.hero.badge')}</span>
                        </div>
                        <h1 className="text-3xl md:text-6xl font-bold font-display mb-6 tracking-tight drop-shadow-2xl text-white leading-tight">
                            {t('rooms.hero.title')}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mx-auto mb-8 leading-relaxed">
                            {t('rooms.hero.subtitle')}
                        </p>

                        <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 px-8 py-4 rounded-2xl shadow-2xl hover:bg-white/10 transition-colors cursor-default">
                            <Building className="w-8 h-8 text-rentia-blue drop-shadow-md" />
                            <div className="flex flex-col items-start text-left">
                                <span className="text-3xl font-bold leading-none text-white tracking-tight">{totalRoomsManaged}</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{t('rooms.hero.count_label')}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PLAN AMIGO BANNER */}
                <section className="container mx-auto px-4 -mt-8 relative z-30 mb-8 max-w-[1200px]">
                    <div className="bg-gradient-to-r from-indigo-900 to-rentia-blue rounded-2xl shadow-2xl p-6 md:p-8 text-white relative overflow-hidden border border-white/10 group hover:shadow-indigo-500/20 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-rentia-gold/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left">
                            <div className="flex-shrink-0 relative">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <Gift className="w-8 h-8 md:w-10 md:h-10 text-rentia-blue" />
                                </div>
                                <div className="absolute -top-3 -right-3 bg-rentia-gold text-rentia-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-md animate-bounce uppercase tracking-wide">
                                    {t('rooms.friend_plan.badge')}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-xl md:text-3xl font-bold font-display text-white mb-2 leading-tight">
                                    {t('rooms.friend_plan.title')} <span className="text-rentia-gold inline-block decoration-wavy decoration-rentia-gold/30">{t('rooms.friend_plan.highlight')}</span>
                                </h3>
                                <p className="text-indigo-100/90 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                                    {t('rooms.friend_plan.desc')} <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10">{t('rooms.friend_plan.desc_amount')}</span> {t('rooms.friend_plan.desc_end')}
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <span className="text-[10px] font-bold uppercase tracking-wide bg-indigo-500/30 text-indigo-100 border border-indigo-400/30 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                                        <UsersIcon className="w-3 h-3" /> {t('rooms.friend_plan.tag_1')}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500/30 text-blue-100 border border-blue-400/30 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                                        <Wallet className="w-3 h-3" /> {t('rooms.friend_plan.tag_2')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-shrink-0 w-full md:w-auto">
                                <a
                                    href="https://api.whatsapp.com/send?phone=34611948589&text=Hola%20Sandra,%20soy%20inquilino%20y%20quiero%20recomendar%20a%20un%20amigo%20para%20el%20Plan%20Amigo."
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-rentia-gold hover:bg-[#F5C518] text-rentia-black font-bold py-3.5 px-8 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:shadow-rentia-gold/20 transform hover:-translate-y-0.5 w-full md:w-auto"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>{t('rooms.friend_plan.btn')}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <section className="container mx-auto px-4 pb-20 relative z-20 max-w-[1400px]">

                    {/* DYNAMIC ALERT NOTICE */}
                    {config.roomsAlert.isActive && (
                        <div className={`border rounded-xl p-4 mb-8 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 ${alertStyle.bg} ${alertStyle.border}`}>
                            <div className={`p-2.5 rounded-full shrink-0 shadow-sm ${alertStyle.iconBg}`}>
                                {alertStyle.icon}
                            </div>
                            <div>
                                <h4 className={`font-bold text-sm mb-1 ${alertStyle.textTitle}`}>{config.roomsAlert.title}</h4>
                                <p className={`text-sm leading-relaxed ${alertStyle.textBody}`}>{config.roomsAlert.message}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-8 items-start">

                        {/* --- LEFT SIDEBAR (Desktop Filters) --- */}
                        <aside className="hidden md:block w-72 flex-shrink-0 sticky top-24 self-start bg-white rounded-xl shadow-sm border border-gray-200 p-6 z-30">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-rentia-blue" />
                                    Filtros
                                </h3>
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline"
                                    >
                                        Borrar todos
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 custom-scrollbar pb-10">

                                {/* 1. Availability & Type */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                        <span className="text-sm text-gray-700">Solo disponibles</span>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${showOnlyAvailable ? 'bg-rentia-blue border-rentia-blue' : 'bg-white border-gray-300'}`}>
                                            {showOnlyAvailable && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={showOnlyAvailable} onChange={() => setShowOnlyAvailable(!showOnlyAvailable)} />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                        <span className="text-sm text-gray-700">Ver "Próximamente"</span>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filterComingSoon ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}>
                                            {filterComingSoon && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={filterComingSoon} onChange={() => setFilterComingSoon(!filterComingSoon)} />
                                    </label>
                                </div>

                                <div className="h-px bg-gray-100"></div>

                                {/* 2. Location */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ubicación</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <select
                                            value={selectedZone}
                                            onChange={(e) => setSelectedZone(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/20 focus:border-rentia-blue outline-none transition-all cursor-pointer hover:bg-white"
                                        >
                                            <option value="">Todas las zonas</option>
                                            {uniqueZones.map(z => (
                                                <option key={z} value={z}>{z}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* 3. Price */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Precio</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full pl-3 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/20 focus:border-rentia-blue outline-none transition-all"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full pl-3 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/20 focus:border-rentia-blue outline-none transition-all"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Gender (Tú eres) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Género (Busco sitio para...)</label>
                                    <select
                                        value={selectedGender}
                                        onChange={(e) => setSelectedGender(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/20 focus:border-rentia-blue outline-none transition-all"
                                    >
                                        <option value="all">Indiferente</option>
                                        <option value="male">Chico</option>
                                        <option value="female">Chica</option>
                                    </select>
                                </div>

                                {/* 5. Profile & Ad Type */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Perfil</label>
                                        <select
                                            value={selectedProfile}
                                            onChange={(e) => setSelectedProfile(e.target.value)}
                                            className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                                        >
                                            <option value="">Todos</option>
                                            <option value="students">Estudiantes</option>
                                            <option value="workers">Trabajadores</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Anuncio</label>
                                        <select
                                            value={selectedAdType}
                                            onChange={(e) => setSelectedAdType(e.target.value)}
                                            className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                                        >
                                            <option value="all">Todos</option>
                                            <option value="professional">Profesional</option>
                                            <option value="particular">Particular</option>
                                        </select>
                                    </div>
                                </div>

                                {/* 6. Bed Type */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cama</label>
                                    <div className="flex flex-wrap gap-1">
                                        {[
                                            { id: 'all', label: 'Indiferente' },
                                            { id: 'single', label: 'Individual' },
                                            { id: 'double', label: 'Doble' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedBedType(opt.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${selectedBedType === opt.id ? 'bg-rentia-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100"></div>

                                {/* 7. Room Features */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Características Habitación</label>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'couples_allowed', label: 'Admite Parejas' },
                                            { id: 'pets_allowed', label: 'Admite Mascotas' },
                                            { id: 'smoking_allowed', label: 'Se puede fumar' },
                                            { id: 'private_bath', label: 'Baño Privado' },
                                            { id: 'hasAirConditioning', label: 'Aire Acondicionado' }, // Mapping 'hasAirConditioning' room field logic effectively
                                            { id: 'window_street', label: 'Ventana a la calle' },
                                            { id: 'online_booking', label: 'Reserva Online' },
                                            { id: 'smart_tv', label: 'TV en habitación' },
                                            { id: 'lock', label: 'Llave en habitación' },
                                        ].map(feat => {
                                            // Special handling for old AirCon filter if needed, or just map it to new general filterFeatures
                                            // In 'filteredProperties', we check p.rooms.some(r => r.features.includes(feature)).
                                            // 'hasAirConditioning' is a boolean field, not in 'features' array usually.
                                            // Wait, 'hasAirConditioning' is a boolean property on Room.
                                            // My new logic checks p.features or p.rooms.some(r.features...).
                                            // I should probably ensure that 'hasAirConditioning' boolean is treated as a feature query 
                                            // OR update the logic.
                                            // For now, I'll rely on the existing 'filterAirCon' state? 
                                            // Actually, I removed the 'filterAirCon' input from sidebar but kept the state.
                                            // The new logic uses 'filterFeatures'.
                                            // I'll update the 'filteredProperties' logic to checking boolean fields if the feature key matches specific names?
                                            // OR: I'll just stick to using `filterFeatures` and ensure my data/filtering handles "virtual" features.

                                            // Let's stick to simple "features" array for new things.
                                            // For AirCon, I'll map the click here to `setFilterAirCon`?
                                            // No, to keep it uniform, I should ideally migrate AirCon to features array. 
                                            // But to avoid complex migrations now, I will handle the click:

                                            if (feat.id === 'hasAirConditioning') {
                                                // Use old state for this one for now, displayed uniformly
                                                const isActive = filterAirCon === 'yes';
                                                return (
                                                    <label key={feat.id} className="flex items-center gap-2 cursor-pointer group">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-rentia-blue border-rentia-blue' : 'bg-white border-gray-300 group-hover:border-rentia-blue'}`}>
                                                            {isActive && <CheckCircle className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <input type="checkbox" className="hidden" checked={isActive} onChange={() => setFilterAirCon(isActive ? 'all' : 'yes')} />
                                                        <span className="text-sm text-gray-600 group-hover:text-gray-800">{feat.label}</span>
                                                    </label>
                                                );
                                            }

                                            const isActive = filterFeatures.includes(feat.id);
                                            return (
                                                <label key={feat.id} className="flex items-center gap-2 cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-rentia-blue border-rentia-blue' : 'bg-white border-gray-300 group-hover:border-rentia-blue'}`}>
                                                        {isActive && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={isActive} onChange={() => toggleFeature(feat.id)} />
                                                    <span className="text-sm text-gray-600 group-hover:text-gray-800">{feat.label}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* 8. Floor Features */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Características Piso</label>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'lift', label: 'Ascensor' },
                                            { id: 'terrace', label: 'Terraza' },
                                            { id: 'exterior', label: 'Exterior' },
                                            { id: 'accessible', label: 'Acesible' },
                                            { id: 'garden', label: 'Jardín' },
                                            { id: 'pool', label: 'Piscina' },
                                            { id: 'owner_lives', label: 'Propietario en casa' },
                                        ].map(feat => {
                                            const isActive = filterFeatures.includes(feat.id);
                                            return (
                                                <label key={feat.id} className="flex items-center gap-2 cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-rentia-blue border-rentia-blue' : 'bg-white border-gray-300 group-hover:border-rentia-blue'}`}>
                                                        {isActive && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={isActive} onChange={() => toggleFeature(feat.id)} />
                                                    <span className="text-sm text-gray-600 group-hover:text-gray-800">{feat.label}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* 9. Floor Type */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Planta</label>
                                    <select
                                        value={selectedFloorType}
                                        onChange={(e) => setSelectedFloorType(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="all">Indiferente</option>
                                        <option value="top">Última planta</option>
                                        <option value="intermediate">Intermedia</option>
                                        <option value="ground">Bajo</option>
                                    </select>
                                </div>

                                {/* 10. Expenses */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gastos</label>
                                    <select
                                        value={filterExpenses}
                                        onChange={(e) => setFilterExpenses(e.target.value)}
                                        className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/20 focus:border-rentia-blue outline-none transition-all cursor-pointer hover:bg-white"
                                    >
                                        <option value="all">Indiferente</option>
                                        <option value="fixed">Gastos Fijos</option>
                                        <option value="shared">Se reparten</option>
                                    </select>
                                </div>

                            </div>
                        </aside>


                        {/* --- RIGHT COLUMN (Content) --- */}
                        <div className="flex-1 min-w-0">

                            {/* Top Header & Sort (Desktop) */}
                            <div className="hidden md:flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {filteredProperties.length} Habitaciones en alquiler
                                </h2>
                                {/* Sorting Mockup */}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Ordenar:</span>
                                    <select className="bg-transparent font-bold text-gray-800 cursor-pointer outline-none">
                                        <option>Relevancia</option>
                                        <option>Precio: menor a mayor</option>
                                        <option>Precio: mayor a menor</option>
                                    </select>
                                </div>
                            </div >

                            {/* Mobile Filters Toggle (Only Show on Mobile) */}
                            < div className="md:hidden sticky top-0 z-40 -mx-4 px-4 py-2 bg-gray-50/95 backdrop-blur-sm mb-6 transition-all" >
                                <div className="bg-white p-4 rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-start gap-4 ring-1 ring-black/5">
                                    <div
                                        className="flex items-center justify-between w-full border-b border-gray-50 pb-2 cursor-pointer"
                                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                                    >
                                        <div className="flex items-center gap-2 text-rentia-black font-bold mb-1">
                                            <div className="bg-rentia-blue/10 p-2 rounded-lg">
                                                <Filter className="w-5 h-5 text-rentia-blue" />
                                            </div>
                                            <span className="text-sm">{t('rooms.filter.label')}</span>
                                            {activeFiltersCount > 0 && (
                                                <span className="bg-rentia-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                                                    {activeFiltersCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                                            <span>{mobileFiltersOpen ? 'Ocultar' : 'Mostrar'}</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} flex flex-col gap-3 w-full pt-1`}>
                                        {/* Mobile Filter Inputs (Simplified copy of original logic) */}
                                        <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg text-sm">
                                            <option value="">Zona: Todas</option>
                                            {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
                                        </select>

                                        <div className="flex gap-2">
                                            <input type="number" placeholder="Min €" value={minPrice} onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')} className="w-1/2 p-2 bg-gray-50 border rounded-lg text-sm" />
                                            <input type="number" placeholder="Max €" value={maxPrice} onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')} className="w-1/2 p-2 bg-gray-50 border rounded-lg text-sm" />
                                        </div>

                                        <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                            <input type="checkbox" checked={showOnlyAvailable} onChange={() => setShowOnlyAvailable(!showOnlyAvailable)} className="rounded text-rentia-blue" />
                                            <span className="text-sm text-gray-700">Solo disponibles</span>
                                        </label>

                                        {/* New Mobile Filters */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className="p-2 bg-gray-50 border rounded-lg text-sm">
                                                <option value="all">Sexo: Todos</option>
                                                <option value="male">Solo Chicos</option>
                                                <option value="female">Solo Chicas</option>
                                            </select>
                                            <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className="p-2 bg-gray-50 border rounded-lg text-sm">
                                                <option value="">Perfil: Todos</option>
                                                <option value="students">Estudiantes</option>
                                                <option value="workers">Trabajadores</option>
                                            </select>
                                        </div>

                                        {activeFiltersCount > 0 && (
                                            <button onClick={clearFilters} className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold">Limpiar Filtros</button>
                                        )}
                                    </div>
                                </div>
                            </div >

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-6 pb-20">
                                {loadingProperties ? (
                                    <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center py-32 text-gray-400">
                                        <Loader2 className="w-10 h-10 animate-spin text-rentia-blue mb-4 opacity-80" />
                                        <p className="text-sm font-medium tracking-wide uppercase animate-pulse">{t('common.loading')}</p>
                                    </div>
                                ) : filteredProperties.length === 0 ? (
                                    <div className="col-span-2 md:col-span-1 text-center py-24 text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300 p-8 shadow-sm">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Filter className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hemos encontrado viviendas</h3>
                                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Parece que no hay ninguna propiedad que coincida con tus filtros actuales. Prueba a cambiar los criterios.</p>
                                        <button
                                            onClick={clearFilters}
                                            className="inline-flex items-center gap-2 text-white bg-rentia-blue hover:bg-black px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            Limpiar todos los filtros
                                        </button>
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

                                        // Calculate min price
                                        const availablePrices = property.rooms
                                            .filter(r => r.status === 'available' && typeof r.price === 'number' && r.price > 0)
                                            .map(r => r.price);
                                        const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : 0;

                                        return (
                                            <div key={property.id} className={`bg-white rounded-sm overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-xl border border-gray-200 transition-all duration-300 group ${isExpanded ? 'col-span-2 ring-1 ring-rentia-blue/20 z-10' : 'col-span-1'}`}>

                                                {/* --- CARD HEADER (Clickable) --- */}
                                                <div
                                                    className="flex flex-col md:flex-row cursor-pointer transition-colors relative"
                                                    onClick={() => toggleProperty(property.id)}
                                                >
                                                    {/* ADMIN EDIT BUTTON */}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingProperty(property);
                                                            }}
                                                            className="absolute top-2 right-2 z-30 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg border border-gray-200 transition-all hover:scale-110 group-hover:opacity-100"
                                                            title="Editar Propiedad (Admin)"
                                                        >
                                                            <Edit className="w-5 h-5 text-rentia-blue" />
                                                        </button>
                                                    )}
                                                    {/* Cover Image Area */}
                                                    <div
                                                        className={`w-full md:w-80 relative flex-shrink-0 bg-gray-100 overflow-hidden ${isExpanded ? 'h-48 md:h-auto' : 'aspect-[4/3] md:h-auto md:aspect-auto md:min-h-[16rem]'}`}
                                                    >
                                                        {property.image ? (
                                                            <ImageWithLoader
                                                                src={property.image}
                                                                alt={`Habitación en ${property.address}`}
                                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 p-4 bg-gray-50">
                                                                <Camera className="w-8 h-8 opacity-50" />
                                                            </div>
                                                        )}

                                                        {/* Gradients & Overlays */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/50 md:to-transparent opacity-80 md:opacity-100"></div>

                                                        {/* Top Status Tags (Absolute) */}
                                                        <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-2 z-10">
                                                            <div className="flex flex-col gap-1 w-full">
                                                                <div className="flex justify-between w-full">
                                                                    {availableCount > 0 ? (
                                                                        <div className="bg-emerald-500 text-white text-[9px] md:text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm backdrop-blur-md bg-opacity-95 self-start">
                                                                            {availableCount} {t('rooms.status.free')}
                                                                        </div>
                                                                    ) : !hasRenovation && (
                                                                        <div className="bg-gray-400/80 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm backdrop-blur-md">
                                                                            Alquilada
                                                                        </div>
                                                                    )}

                                                                    {/* Mobile Profile Badge on Image */}
                                                                    {profileBadge && (
                                                                        <div className="md:hidden w-6 h-6 flex items-center justify-center rounded-full backdrop-blur-md bg-white/90 text-gray-700 shadow-sm ml-auto">
                                                                            <div className="transform scale-75">{profileBadge.icon}</div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {hasRenovation && (
                                                                    <div className="bg-amber-500 text-white text-[9px] md:text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm backdrop-blur-md bg-opacity-95 self-start">
                                                                        {t('rooms.status.renovation')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Bottom Address Info (Mobile Overlay) */}
                                                        <div className="absolute bottom-3 left-3 right-8 text-white md:hidden z-10 leading-none">
                                                            <h3 className="font-bold text-sm leading-tight drop-shadow-md truncate pr-1 mb-1">{property.address}</h3>
                                                            <div className="flex items-center gap-1 text-[10px] text-white/90 font-medium">
                                                                <MapPin className="w-2.5 h-2.5" /> {property.city}
                                                            </div>
                                                        </div>

                                                        {/* Expand Icon Indicator */}
                                                        <div className="absolute bottom-3 right-3 text-white md:hidden z-10">
                                                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                                <ChevronDown className="w-5 h-5 drop-shadow-md" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content Side */}
                                                    <div className="flex-1 p-3 md:p-6 flex flex-col relative md:justify-between gap-3 md:gap-0">

                                                        {/* Top Info (Desktop mainly) */}
                                                        <div>
                                                            <div className="hidden md:flex justify-between items-start mb-2">
                                                                <div className="pr-10">
                                                                    <h3 className="font-bold text-2xl text-gray-900 leading-tight group-hover:text-rentia-blue transition-colors mb-1">
                                                                        {property.address}
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
                                                                        <MapPin className="w-4 h-4 text-rentia-blue" />
                                                                        {property.city}
                                                                        <span className="text-gray-300 px-1">•</span>
                                                                        {property.floor}
                                                                    </p>
                                                                </div>

                                                                {/* Desktop Expand Arrow */}
                                                                <div className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-blue-50 text-rentia-blue rotate-180' : 'text-gray-300 hover:text-rentia-blue'}`}>
                                                                    <ChevronDown className="w-5 h-5" />
                                                                </div>
                                                            </div>

                                                            {/* Tags Row */}
                                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                                                {/* Feature Pills */}
                                                                <div className="flex items-center gap-3 md:gap-4 text-gray-600">
                                                                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                                        <Layout className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                                        <span>{totalRooms} <span className="hidden md:inline">Habs</span></span>
                                                                    </div>
                                                                    {property.bathrooms && (
                                                                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                                            <Bath className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                                            <span>{property.bathrooms} <span className="hidden md:inline">Baños</span></span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Desktop Profile Badge */}
                                                                {profileBadge && (
                                                                    <span className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ml-auto ${profileBadge.style}`}>
                                                                        {profileBadge.icon} {profileBadge.text}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {property.description && (
                                                                <div className="mt-3 md:mt-4">
                                                                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                                                        {property.description}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Bottom Actions Row */}
                                                        <div className="mt-2 md:mt-6 pt-0 md:pt-5 border-t-0 border-gray-100/50 md:border-t md:border-gray-100/80 flex items-center justify-between gap-2 md:gap-4">

                                                            {/* Price Display */}
                                                            <div className="flex-1 min-w-0">
                                                                {minPrice > 0 ? (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider hidden md:block">Desde</span>
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="font-black text-xl md:text-3xl text-rentia-blue tracking-tight">{minPrice}€</span>
                                                                            <span className="text-[10px] md:text-sm text-gray-400 font-medium">/mes</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5 text-gray-400">
                                                                        <Info className="w-3.5 h-3.5" />
                                                                        <span className="text-[10px] md:text-xs font-bold uppercase">Consultar</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Desktop Button / Mobile Indicator */}
                                                            <div className="md:w-auto">
                                                                {isExpanded ? (
                                                                    <button className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">
                                                                        <X className="w-4 h-4" /> Cerrar
                                                                    </button>
                                                                ) : (
                                                                    <button className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rentia-black text-white font-bold text-sm hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl">
                                                                        Ver Habitaciones <ChevronDown className="w-4 h-4" />
                                                                    </button>
                                                                )}

                                                                {/* Mobile "Text" Action (Optional, or just Clean) */}
                                                                {isExpanded && <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">Cerrar <X className="w-3 h-3" /></span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* --- ROOM LIST (Accordion) --- */}
                                                <div className={`transition-all duration-500 ease-in-out border-t border-gray-100 bg-gray-50/30 ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                    <div className="p-4 md:p-8 grid grid-cols-1 gap-4">
                                                        {property.bathrooms && (
                                                            <div className="mb-2 flex justify-center">
                                                                <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 text-xs font-bold px-4 py-2 rounded-full border border-amber-200 shadow-sm animate-in fade-in zoom-in duration-300">
                                                                    <div className="bg-amber-200 p-1 rounded-full"><Bath className="w-3 h-3 text-amber-700" /></div>
                                                                    {property.bathrooms} baños completos en la vivienda
                                                                </span>
                                                            </div>
                                                        )}

                                                        {property.rooms.map((room, idx) => {
                                                            const statusInfo = getStatusLabel(room);
                                                            const isAvailable = room.status === 'available';
                                                            const displayName = room.name.replace(/^H(\d+)$/i, 'Habitación $1');

                                                            return (
                                                                <div key={room.id} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col md:flex-row gap-5 items-start md:items-center group/room">

                                                                    {/* Room Image */}
                                                                    {room.images && room.images.length > 0 && (
                                                                        <div
                                                                            className="w-full md:w-32 h-40 md:h-28 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer relative group/room-img shadow-inner bg-gray-100 border border-gray-100"
                                                                            onClick={(e) => { e.stopPropagation(); openRoomImages(room.images!, 0); }}
                                                                        >
                                                                            <ImageWithLoader
                                                                                src={room.images[0]}
                                                                                alt={displayName}
                                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/room-img:scale-110"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/0 group-hover/room-img:bg-black/10 transition-colors flex items-center justify-center">
                                                                                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/room-img:opacity-100 transition-opacity drop-shadow-md transform scale-75 group-hover/room-img:scale-100 duration-300" />
                                                                            </div>
                                                                            {room.video && (
                                                                                <div className="absolute top-2 right-2 bg-rentia-blue bg-opacity-90 text-white p-1 rounded-md shadow-lg z-10 border border-white/20">
                                                                                    <Film className="w-3.5 h-3.5" />
                                                                                </div>
                                                                            )}
                                                                            {room.images.length > 1 && (
                                                                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                                                                    +{room.images.length - 1}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Room Info */}
                                                                    <div className="flex-1 w-full min-w-0">
                                                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-0">
                                                                            <div>
                                                                                <div className="flex items-center gap-3 mb-1">
                                                                                    <h4 className="font-bold text-gray-900 text-lg group-hover/room:text-rentia-blue transition-colors">
                                                                                        {displayName}
                                                                                    </h4>
                                                                                    {isAvailable && (
                                                                                        <span className="md:hidden text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wide border border-green-200">Libre</span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Simplified Features for better mobile reading */}
                                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-600">
                                                                                    {room.bedType && (
                                                                                        <div className="flex items-center gap-1.5" title="Tipo de cama">
                                                                                            {getBedIcon(room.bedType)}
                                                                                            <span className="font-medium text-xs">{getBedLabel(room.bedType)}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex items-center gap-1.5" title="Gastos">
                                                                                        <Receipt className="w-3.5 h-3.5 text-gray-400" />
                                                                                        <span className="font-medium text-xs">{translateExpenses(room.expenses)}</span>
                                                                                    </div>
                                                                                    {room.hasAirConditioning && (
                                                                                        <div className="flex items-center gap-1.5 text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                                                                                            <Wind className="w-3 h-3" />
                                                                                            <span className="font-bold text-[10px] uppercase">Aire Acond.</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {room.features?.includes('balcony') && (
                                                                                        <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                                                                            <Sun className="w-3 h-3" />
                                                                                            <span className="font-bold text-[10px] uppercase">Balcón</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Desktop Status & Price Block */}
                                                                            <div className="hidden md:flex flex-col items-end gap-1 text-right">
                                                                                <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide px-3 py-1 rounded-full border shadow-sm ${isAvailable
                                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                                    : 'bg-gray-50 text-gray-500 border-gray-100 opacity-80'
                                                                                    }`}>
                                                                                    {statusInfo.icon} {statusInfo.text}
                                                                                </div>
                                                                                <div className="mt-2">
                                                                                    {room.price > 0 ? (
                                                                                        <div className="flex items-baseline gap-1 justify-end">
                                                                                            <span className="text-2xl font-bold text-gray-900">{room.price}€</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-sm font-bold text-gray-400">Consultar</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Mobile Price & Action Bar */}
                                                                    <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 md:block">
                                                                        <div className="md:hidden flex-1">
                                                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Precio</p>
                                                                            <p className="text-xl font-black text-rentia-black">{room.price > 0 ? `${room.price}€` : 'Consultar'}</p>
                                                                        </div>

                                                                        <div className="flex-1 md:flex-none">
                                                                            {isAvailable ? (
                                                                                <a
                                                                                    href={`https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20me%20interesa%20la%20${encodeURIComponent(displayName)}%20en%20${property.address}`}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="w-full md:w-auto bg-[#25D366] hover:bg-[#20ba5c] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                                                                                >
                                                                                    <MessageCircle className="w-4 h-4" /> <span className="hidden md:inline">Contactar</span> <span className="md:hidden">WhatsApp</span>
                                                                                </a>
                                                                            ) : (
                                                                                <button disabled className="w-full md:w-auto bg-gray-100 text-gray-400 text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200">
                                                                                    <Lock className="w-3.5 h-3.5" /> <span className="md:hidden">Ocupada</span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div >
                    </div >

                    {/* Footer Legend */}
                </section >

                <section className="mt-16 border-t border-gray-200 pt-8 pb-12 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Guía de estados</p>
                            <div className="flex flex-wrap justify-center gap-3 md:gap-6">
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-xs font-bold text-gray-600">Disponible</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                    <span className="text-xs font-bold text-gray-600">Reformas</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                    <span className="text-xs font-bold text-gray-600">Ocupada</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mobile Detail Modal / Sheet */}
                {
                    selectedProperty && (
                        <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                                onClick={() => setSelectedProperty(null)}
                            ></div>

                            {/* Sheet Content */}
                            <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">

                                {/* Drag Handle / Header */}
                                <div className="flex-none p-4 pb-2 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 truncate pr-2">{selectedProperty.address}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {selectedProperty.city}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedProperty(null)}
                                        className="p-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all shadow-lg active:scale-95 z-50"
                                        aria-label="Cerrar"
                                    >
                                        <X className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                </div>

                                {/* Scrollable Body */}
                                <div className="overflow-y-auto p-4 pb-24 space-y-6">

                                    {/* Property Highlights */}
                                    <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                                        <span className="flex-none inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-100">
                                            <Layout className="w-3.5 h-3.5" /> {selectedProperty.rooms.length} Habitaciones
                                        </span>
                                        {selectedProperty.bathrooms && (
                                            <span className="flex-none inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-100">
                                                <Bath className="w-3.5 h-3.5" /> {selectedProperty.bathrooms} Baños
                                            </span>
                                        )}
                                    </div>

                                    {/* Room List */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Habitaciones Disponibles</h4>
                                        {selectedProperty.rooms.map((room) => {
                                            const isAvailable = room.status === 'available';
                                            const displayName = room.name.replace(/^H(\d+)$/i, 'Habitación $1');

                                            return (
                                                <div key={room.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                                    {/* Room Image */}
                                                    {room.images && room.images.length > 0 && (
                                                        <div
                                                            className="h-40 w-full relative bg-gray-200"
                                                            onClick={() => openRoomImages(room.images!, 0)}
                                                        >
                                                            <ImageWithLoader
                                                                src={room.images[0]}
                                                                alt={displayName}
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                            />
                                                            {room.video && (
                                                                <div className="absolute top-2 right-2 bg-rentia-blue bg-opacity-90 text-white p-1 rounded-md shadow-lg z-10 border border-white/20">
                                                                    <Film className="w-3.5 h-3.5" />
                                                                </div>
                                                            )}
                                                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                                                                <ZoomIn className="w-3 h-3" /> Ver fotos
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h5 className="font-bold text-lg text-gray-900">{displayName}</h5>
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {room.bedType && (
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                                            {getBedIcon(room.bedType)} {getBedLabel(room.bedType)}
                                                                        </span>
                                                                    )}
                                                                    {room.hasAirConditioning && (
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                                                                            <Wind className="w-3 h-3" /> A/C
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {isAvailable ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded mb-1">Libre</span>
                                                                        <span className="font-black text-xl text-rentia-blue">{room.price}€</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold uppercase px-2 py-1 rounded">Alquilada</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Button */}
                                                        {isAvailable ? (
                                                            <a
                                                                href={`https://wa.me/34649666782?text=${encodeURIComponent(`Hola, estoy interesado en la habitación ${room.name} de ${selectedProperty.address}`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-3 w-full flex items-center justify-center gap-2 bg-rentia-black text-white py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
                                                            >
                                                                <MessageCircle className="w-4 h-4" /> Contactar Visita
                                                            </a>
                                                        ) : (
                                                            <button disabled className="mt-3 w-full bg-gray-50 text-gray-300 py-2.5 rounded-lg font-bold text-sm cursor-not-allowed border border-gray-100">
                                                                No disponible
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    isLightboxOpen && (
                        <ImageLightbox
                            images={lightboxImages}
                            selectedIndex={lightboxIndex}
                            onClose={() => setIsLightboxOpen(false)}
                        />
                    )
                }

            </div>
        </>
    );
};
