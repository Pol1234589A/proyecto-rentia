"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Home, MapPin, CheckCircle, User, MessageCircle, Filter, AlertCircle, Receipt, Sparkles, Hammer, HelpCircle, Building, Gift, Users as UsersIcon, Wallet, PlayCircle, Camera, Timer, Bath, Wind, ExternalLink, GraduationCap, Briefcase, Users, ZoomIn, DoorClosed, DoorOpen, ChevronLeft, ChevronRight, ChevronDown, Info, Layout, X, Euro, BedDouble, Bed, Tv, Lock, Sun, Monitor, Loader2, Megaphone, AlertTriangle, Ban as DoNotDisturb, Edit, Save, Plus, Trash2, Film, Calendar, Maximize, ShieldCheck } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { properties as staticProperties, Property, Room } from '../data/rooms';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageLightbox } from './ImageLightbox';
import { PropertyEditModal } from './PropertyEditModal';
import { ContactLeadModal } from './modals/ContactLeadModal';
import { useConfig } from '../contexts/ConfigContext';
import Head from 'next/head';

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
    const isAdmin = userRole === 'agency' || userRole === 'staff' || userRole === 'manager' || userRole === 'worker';
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [editingRoomId, setEditingRoomId] = useState<string | undefined>(undefined);

    const handleSaveProperty = async (updatedProperty: Property) => {
        try {
            await setDoc(doc(db, "properties", updatedProperty.id), updatedProperty, { merge: true });
            // Optimistic update
            setProperties(prev => {
                const exists = prev.some(p => p.id === updatedProperty.id);
                if (exists) {
                    return prev.map(p => p.id === updatedProperty.id ? updatedProperty : p);
                }
                return [updatedProperty, ...prev];
            });
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
    const [sortBy, setSortBy] = useState('relevance');

    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});
    const [propImageIndices, setPropImageIndices] = useState<Record<string, number>>({});
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Contact Modal State
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [contactRoomData, setContactRoomData] = useState<{ roomName: string, propertyName: string, propertyId?: string, roomId?: string } | null>(null);

    const openContactModal = (roomName: string, propertyName: string, propertyId?: string, roomId?: string) => {
        setContactRoomData({ roomName, propertyName, propertyId, roomId });
        setContactModalOpen(true);
    };

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
        const result = properties.map(p => {
            const matchingRooms = p.rooms.filter(r => {
                // 1. Availability
                if (showOnlyAvailable && r.status !== 'available') return false;

                // 2. Profile
                if (selectedProfile) {
                    const profile = r.targetProfile || 'both';
                    const matches = selectedProfile === 'students' ? (profile === 'students' || profile === 'both') : (profile === 'workers' || profile === 'both');
                    if (!matches) return false;
                }

                // 3. Price
                if (minPrice !== '' || maxPrice !== '') {
                    const isAvailable = r.status === 'available';
                    const isComingSoon = r.availableFrom && r.availableFrom !== 'Consultar' && r.availableFrom !== 'Inmediata';
                    if (!isAvailable && !isComingSoon) return false;
                    if (minPrice !== '' && r.price < minPrice) return false;
                    if (maxPrice !== '' && r.price > maxPrice) return false;
                }

                // 4. Coming Soon (Manual Filter)
                if (filterComingSoon) {
                    if (r.specialStatus === 'renovation') return false;
                    if (!r.availableFrom || r.availableFrom === 'Consultar' || r.availableFrom === 'Inmediata') return false;
                    try {
                        const [day, month, year] = r.availableFrom.split('/').map(Number);
                        const exitDate = new Date(year, month - 1, day);
                        const today = new Date();
                        exitDate.setHours(23, 59, 59);
                        today.setHours(0, 0, 0);
                        const diffTime = exitDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays <= 0) return false;
                    } catch (e) { return false; }
                }

                // 5. Gender
                if (selectedGender !== 'all') {
                    const g = r.gender || 'both';
                    if (g !== 'both' && g !== selectedGender) return false;
                }

                // 6. Bed Type
                if (selectedBedType !== 'all' && r.bedType !== selectedBedType) return false;

                // 7. Air Conditioning
                if (filterAirCon === 'yes' && !r.hasAirConditioning) return false;
                if (filterAirCon === 'no' && r.hasAirConditioning) return false;

                // 8. Expenses
                if (filterExpenses !== 'all') {
                    const exp = r.expenses.toLowerCase();
                    if (filterExpenses === 'fixed' && !exp.includes('fijos')) return false;
                    if (filterExpenses === 'shared' && !exp.includes('reparten')) return false;
                }

                // 9. Room Features
                if (filterFeatures.length > 0) {
                    const roomPropFeatures = [...(p.features || []), ...(r.features || [])];
                    if (!filterFeatures.every(f => roomPropFeatures.includes(f))) return false;
                }

                return true;
            });

            return { property: p, matchingRooms };
        }).filter(item => {
            // Property level filters
            if (selectedZone && item.property.city !== selectedZone) return false;
            if (selectedFloorType !== 'all' && item.property.floorType !== selectedFloorType) return false;

            // Must have at least one matching room
            return item.matchingRooms.length > 0;
        });

        // --- SORTING LOGIC ---
        if (sortBy === 'price-asc' || sortBy === 'price-desc') {
            result.sort((a, b) => {
                const getCheapestPrice = (rooms: Room[]) => {
                    const prices = rooms.map(r => r.price);
                    return prices.length > 0 ? Math.min(...prices) : Infinity;
                };
                const priceA = getCheapestPrice(a.matchingRooms);
                const priceB = getCheapestPrice(b.matchingRooms);
                return sortBy === 'price-asc' ? priceA - priceB : priceB - priceA;
            });
        }
        return result;
    }, [properties, showOnlyAvailable, selectedZone, selectedProfile, filterAirCon, filterExpenses, filterComingSoon, minPrice, maxPrice, selectedGender, selectedFloorType, selectedBedType, filterFeatures, sortBy]);

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
        count += filterFeatures.length;
        return count;
    }, [selectedZone, selectedProfile, filterAirCon, filterExpenses, showOnlyAvailable, filterComingSoon, minPrice, maxPrice, selectedGender, selectedFloorType, selectedBedType, filterFeatures]);

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
    };

    const toggleFeature = (feature: string) => {
        setFilterFeatures(prev =>
            prev.includes(feature)
                ? prev.filter(f => f !== feature)
                : [...prev, feature]
        );
    };

    const selectedPropertyMatch = useMemo(() => {
        if (!selectedProperty) return null;
        return filteredProperties.find(item => item.property.id === selectedProperty.id);
    }, [selectedProperty, filteredProperties]);

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
                    initialRoomId={editingRoomId}
                    onClose={() => {
                        setEditingProperty(null);
                        setEditingRoomId(undefined);
                    }}
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
                            Alquiler de <span className="text-rentia-gold text-white/90">Habitaciones</span> en Murcia
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

                                {/* 5. Profile */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Perfil</label>
                                    <select
                                        value={selectedProfile}
                                        onChange={(e) => setSelectedProfile(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/20 focus:border-rentia-blue outline-none transition-all"
                                    >
                                        <option value="">Todos</option>
                                        <option value="students">Estudiantes</option>
                                        <option value="workers">Trabajadores</option>
                                    </select>
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
                                            { id: 'smart_tv', label: 'TV en habitación' },
                                            { id: 'lock', label: 'Llave en habitación' },
                                            { id: 'balcony', label: 'Con Balcón' },
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
                                            { id: 'owner_lives', label: 'Propietario Vive' },
                                            { id: 'balcony', label: 'Balcón' },
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
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-4">
                                    {filteredProperties.reduce((acc, item) => acc + item.matchingRooms.length, 0)} Habitaciones en alquiler
                                    {isAdmin && (
                                        <button
                                            onClick={() => setEditingProperty({
                                                id: `prop_${Date.now()}`,
                                                address: '',
                                                city: '',
                                                image: '',
                                                googleMapsLink: '',
                                                rooms: [],
                                                commonZonesImages: [],
                                                features: [],
                                                floorType: 'intermediate',
                                                adType: 'professional',
                                                description: ''
                                            })}
                                            className="bg-rentia-blue text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Nueva Propiedad
                                        </button>
                                    )}
                                </h2>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>Ordenar:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-transparent font-bold text-gray-800 cursor-pointer outline-none"
                                    >
                                        <option value="relevance">Relevancia</option>
                                        <option value="price-asc">Precio: menor a mayor</option>
                                        <option value="price-desc">Precio: mayor a menor</option>
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

                                        <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={filterFeatures.includes('balcony')}
                                                onChange={() => toggleFeature('balcony')}
                                                className="rounded text-rentia-blue"
                                            />
                                            <span className="text-sm text-gray-700">Con Balcón</span>
                                        </label>

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
                                    filteredProperties.map(({ property, matchingRooms }) => {
                                        const availableCount = property.rooms.filter((r: Room) => r.status === 'available').length;
                                        const totalRooms = property.rooms.length;
                                        const isExpanded = expandedProperties[property.id] || false;
                                        const hasNew = property.rooms.some((r: Room) => r.specialStatus === 'new');
                                        const hasRenovation = property.rooms.some((r: Room) => r.specialStatus === 'renovation');
                                        const propertyProfile = getPropertyProfile(property.rooms);
                                        const profileBadge = getProfileBadge(propertyProfile);

                                        // Calculate min price based on MATCHING rooms
                                        const matchingPrices = matchingRooms
                                            .filter((r: Room) => typeof r.price === 'number' && r.price > 0)
                                            .map((r: Room) => r.price);
                                        const minPrice = matchingPrices.length > 0 ? Math.min(...matchingPrices) : 0;

                                        // Collect all images for carousel
                                        const allImages = [
                                            ...(property.image ? [property.image] : []),
                                            ...(property.commonZonesImages || []),
                                            ...property.rooms.flatMap(r => r.images || [])
                                        ].filter((img, index, self) => self.indexOf(img) === index);

                                        const currentImageIndex = propImageIndices[property.id] || 0;
                                        const currentImage = allImages.length > 0 ? allImages[currentImageIndex] : property.image;

                                        const nextImage = (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            setPropImageIndices(prev => ({
                                                ...prev,
                                                [property.id]: (currentImageIndex + 1) % allImages.length
                                            }));
                                        };

                                        const prevImage = (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            setPropImageIndices(prev => ({
                                                ...prev,
                                                [property.id]: (currentImageIndex - 1 + allImages.length) % allImages.length
                                            }));
                                        };

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
                                                        {currentImage ? (
                                                            <ImageWithLoader
                                                                src={currentImage}
                                                                alt={`Habitación en ${property.address}`}
                                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 p-4 bg-gray-50">
                                                                <Camera className="w-8 h-8 opacity-50" />
                                                            </div>
                                                        )}

                                                        {/* Carousel Arrows */}
                                                        {allImages.length > 1 && (
                                                            <>
                                                                <button
                                                                    onClick={prevImage}
                                                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <ChevronLeft className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={nextImage}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <ChevronRight className="w-5 h-5" />
                                                                </button>
                                                                {/* Image Counter */}
                                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/40 backdrop-blur-md text-[10px] text-white px-2 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {currentImageIndex + 1} / {allImages.length}
                                                                </div>
                                                            </>
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
                                                                        {(matchingRooms.some(r => r.expenses.toLowerCase().includes('reparten')) ||
                                                                            matchingRooms.some(r => r.expenses.toLowerCase().includes('fijos'))) && (
                                                                                <span className="text-[10px] font-black text-rentia-blue uppercase tracking-tighter mt-1">+ Gastos aparte</span>
                                                                            )}
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
                                                <div className={`transition-all duration-500 ease-in-out border-t border-gray-100 bg-gray-50/30 ${isExpanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                    <div className="p-4 md:p-8 space-y-8">

                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                {property.bathrooms && (
                                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                                        <div className="bg-blue-50 p-2 rounded-lg"><Bath className="w-4 h-4 text-blue-600" /></div>
                                                                        <div>
                                                                            <p className="text-[10px] uppercase font-bold text-gray-400">Baños</p>
                                                                            <p className="text-xs font-bold text-gray-700">{property.bathrooms} Compartidos</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {property.cleaningConfig?.enabled && (
                                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                                        <div className="bg-emerald-50 p-2 rounded-lg"><Sparkles className="w-4 h-4 text-emerald-600" /></div>
                                                                        <div>
                                                                            <p className="text-[10px] uppercase font-bold text-gray-400">Limpieza</p>
                                                                            <p className="text-xs font-bold text-gray-700">Semanal Inc.</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {property.wifiConfig?.ssid && (
                                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                                        <div className="bg-indigo-50 p-2 rounded-lg"><Monitor className="w-4 h-4 text-indigo-600" /></div>
                                                                        <div>
                                                                            <p className="text-[10px] uppercase font-bold text-gray-400">Conexión</p>
                                                                            <p className="text-xs font-bold text-gray-700">Fibra Alta Vel.</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                                                    <div className="bg-amber-50 p-2 rounded-lg"><MapPin className="w-4 h-4 text-amber-600" /></div>
                                                                    <div>
                                                                        <p className="text-[10px] uppercase font-bold text-gray-400">Zona</p>
                                                                        <p className="text-xs font-bold text-gray-700">{property.city}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-gradient-to-br from-rentia-blue to-blue-800 p-4 rounded-xl text-white shadow-lg flex flex-col justify-center">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <CheckCircle className="w-4 h-4 text-blue-200" />
                                                                    <span className="text-xs font-black uppercase tracking-wider">Acompañamiento Rentia</span>
                                                                </div>
                                                                <p className="text-[10px] text-blue-100 leading-tight italic">Resolución de dudas y soporte durante toda tu estancia.</p>
                                                            </div>
                                                        </div>

                                                        {/* Map Section */}
                                                        <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                                            <div className="flex items-center gap-3 mb-2 px-3 py-1">
                                                                <div className="bg-red-50 p-1.5 rounded-lg"><MapPin className="w-4 h-4 text-red-500" /></div>
                                                                <div>
                                                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-700">Ubicación Aproximada</h4>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{property.address.split(',')[0].replace(/\d+$/, '').trim()}, {property.city}</p>
                                                                </div>
                                                            </div>
                                                            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden bg-gray-100 grayscale-[0.3] hover:grayscale-0 transition-all duration-700">
                                                                <iframe
                                                                    width="100%"
                                                                    height="100%"
                                                                    style={{ border: 0 }}
                                                                    loading="lazy"
                                                                    allowFullScreen
                                                                    src={`https://www.google.com/maps?q=${encodeURIComponent(property.address.split(',')[0].replace(/\d+$/, '').trim() + ', ' + property.city)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                                                ></iframe>
                                                                {/* Overlay to prevent accidental scrolling while scrolling page */}
                                                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-4">

                                                            {matchingRooms.map((room, idx) => {
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
                                                                                    {/* Full detailed features */}
                                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
                                                                                        {room.availableFrom && (
                                                                                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100" title="Disponibilidad">
                                                                                                <Calendar className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase whitespace-nowrap">
                                                                                                    {room.availableFrom === 'Inmediata' ? 'Inmediata' : `Desde ${room.availableFrom}`}
                                                                                                </span>
                                                                                            </div>
                                                                                        )}

                                                                                        {room.sqm && (
                                                                                            <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100" title="Superficie">
                                                                                                <Maximize className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">{room.sqm} m²</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {room.bedType && (
                                                                                            <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100" title="Cama">
                                                                                                {getBedIcon(room.bedType)}
                                                                                                <span className="font-bold text-[10px] uppercase">{getBedLabel(room.bedType)}</span>
                                                                                            </div>
                                                                                        )}

                                                                                        <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100" title="Gastos">
                                                                                            <Receipt className="w-3 h-3" />
                                                                                            <span className="font-bold text-[10px] uppercase">{translateExpenses(room.expenses)}</span>
                                                                                        </div>

                                                                                        {room.targetProfile && room.targetProfile !== 'both' && (
                                                                                            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100">
                                                                                                {room.targetProfile === 'students' ? <GraduationCap className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                                                                                                <span className="font-bold text-[10px] uppercase">{room.targetProfile === 'students' ? 'Estudiantes' : 'Trabajadores'}</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {room.gender && room.gender !== 'both' && (
                                                                                            <div className="flex items-center gap-1.5 bg-pink-50 text-pink-700 px-2 py-1 rounded-md border border-pink-100">
                                                                                                <Users className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">{room.gender === 'male' ? 'Chicos' : 'Chicas'}</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {room.hasFan && (
                                                                                            <div className="flex items-center gap-1.5 bg-sky-50 text-sky-700 px-2 py-1 rounded-md border border-sky-100" title="Ventilador">
                                                                                                <Sparkles className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">Ventilador</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {/* Icons from features array */}
                                                                                        {room.features?.includes('private_bath') && (
                                                                                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100">
                                                                                                <Bath className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">Baño Privado</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {room.hasAirConditioning && (
                                                                                            <div className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-2 py-1 rounded-md border border-cyan-100">
                                                                                                <Wind className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">A/C</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {room.features?.includes('desk') && (
                                                                                            <div className="flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">
                                                                                                <Monitor className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">Mesa</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {room.features?.includes('lock') && (
                                                                                            <div className="flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">
                                                                                                <Lock className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">Llave</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {room.features?.includes('smart_tv') || room.features?.includes('tv') ? (
                                                                                            <div className="flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">
                                                                                                <Tv className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">TV</span>
                                                                                            </div>
                                                                                        ) : null}
                                                                                        {room.features?.includes('window_street') && (
                                                                                            <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md border border-yellow-100">
                                                                                                <Sun className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">Exterior</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {room.features?.includes('balcony') && (
                                                                                            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2 py-1 rounded-md border border-orange-100">
                                                                                                <Layout className="w-3 h-3" />
                                                                                                <span className="font-bold text-[10px] uppercase">Balcón</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {room.description && (
                                                                                        <p className="mt-3 text-xs text-gray-500 leading-relaxed italic border-l-2 border-gray-100 pl-3">
                                                                                            "{room.description}"
                                                                                        </p>
                                                                                    )}

                                                                                    {room.notes && (
                                                                                        <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 italic">
                                                                                            <Info className="w-3 h-3" />
                                                                                            <span className="uppercase">{room.notes}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Desktop Status & Price Block */}
                                                                                <div className="hidden md:flex flex-col items-end gap-1 text-right">
                                                                                    {isAdmin && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setEditingRoomId(room.id);
                                                                                                setEditingProperty(property);
                                                                                            }}
                                                                                            className="mb-2 p-1.5 bg-gray-50 text-gray-400 hover:text-rentia-blue hover:bg-blue-50 rounded-lg border border-gray-100 transition-all flex items-center gap-1 text-[10px] font-bold uppercase"
                                                                                        >
                                                                                            <Edit className="w-3 h-3" /> Editar Hab
                                                                                        </button>
                                                                                    )}
                                                                                    <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide px-3 py-1 rounded-full border shadow-sm ${isAvailable
                                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                                        : 'bg-gray-50 text-gray-500 border-gray-100 opacity-80'
                                                                                        }`}>
                                                                                        {statusInfo.icon} {statusInfo.text}
                                                                                    </div>
                                                                                    <div className="mt-2 text-right">
                                                                                        {room.price > 0 ? (
                                                                                            <div className="flex flex-col items-end">
                                                                                                <div className="flex items-baseline gap-1">
                                                                                                    <span className="text-2xl font-bold text-gray-900 leading-none">{room.price}€</span>
                                                                                                    <span className="text-[10px] font-black text-gray-400 uppercase">/ Mes</span>
                                                                                                </div>
                                                                                                {(room.expenses.toLowerCase().includes('reparten') || room.expenses.toLowerCase().includes('fijos')) && (
                                                                                                    <span className="text-[9px] font-black text-rentia-blue uppercase tracking-tighter mt-0.5">+ Gastos aparte</span>
                                                                                                )}
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
                                                                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Alquiler</p>
                                                                                <div className="flex items-baseline gap-1">
                                                                                    <p className="text-xl font-black text-rentia-black">{room.price > 0 ? `${room.price}€` : 'Consultar'}</p>
                                                                                    <span className="text-[10px] font-bold text-gray-400">/mes</span>
                                                                                </div>
                                                                                {room.price > 0 && (room.expenses.toLowerCase().includes('reparten') || room.expenses.toLowerCase().includes('fijos')) && (
                                                                                    <p className="text-[9px] font-black text-rentia-blue uppercase">+ Gastos aparte</p>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-1 md:flex-none">
                                                                                {isAvailable ? (

                                                                                    <div className="flex flex-col gap-2 w-full md:w-auto items-center md:items-end" >
                                                                                        {(() => {
                                                                                            const now = new Date();
                                                                                            const hour = now.getHours();
                                                                                            const minute = now.getMinutes();
                                                                                            const isOpen = hour >= 9 && (hour < 14 || (hour === 14 && minute === 0));

                                                                                            return isOpen ? (
                                                                                                <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 animate-pulse">
                                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                                                    Abierto · 9:00 - 14:00
                                                                                                </span>
                                                                                            ) : (
                                                                                                <div className="flex flex-col items-center md:items-end">
                                                                                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100 mb-1">
                                                                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                                                        Cerrado · Abrimos a las 9:00
                                                                                                    </span>
                                                                                                    <span className="text-[9px] text-gray-400 font-medium italic">Deja tu mensaje</span>
                                                                                                </div>
                                                                                            );
                                                                                        })()}

                                                                                        <div className="w-full">
                                                                                            <button
                                                                                                onClick={() => openContactModal(room.name, selectedProperty?.address || property.address, property.id, room.id)}
                                                                                                className="w-full bg-rentia-black hover:bg-rentia-blue text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                                                                                            >
                                                                                                <MessageCircle className="w-3.5 h-3.5" /> Solicitar información
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
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

                                                        {/* Disclaimer & Experience Footer (Desktop) */}
                                                        <div className="mt-8 pt-8 border-t border-gray-100 hidden md:block">

                                                            {/* Reservation Steps */}
                                                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                                                                <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 text-center">Pasos para alquilar con Rentia</h5>
                                                                <div className="grid grid-cols-4 gap-4 align-top">
                                                                    <div className="text-center group">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center font-black mb-2 mx-auto group-hover:bg-rentia-blue group-hover:text-white transition-colors text-xs shadow-sm">1</div>
                                                                        <p className="text-[10px] font-bold text-gray-800 uppercase mb-1">Solicita</p>
                                                                        <p className="text-[10px] text-gray-400 leading-tight px-2">Rellena tus datos y perfil en el formulario.</p>
                                                                    </div>
                                                                    <div className="text-center group">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center font-black mb-2 mx-auto group-hover:bg-rentia-blue group-hover:text-white transition-colors text-xs shadow-sm">2</div>
                                                                        <p className="text-[10px] font-bold text-gray-800 uppercase mb-1">Valoración</p>
                                                                        <p className="text-[10px] text-gray-400 leading-tight px-2">En 24-48h te contactamos si eres aceptado.</p>
                                                                    </div>
                                                                    <div className="text-center group">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center font-black mb-2 mx-auto group-hover:bg-rentia-blue group-hover:text-white transition-colors text-xs shadow-sm">3</div>
                                                                        <p className="text-[10px] font-bold text-gray-800 uppercase mb-1">Visita</p>
                                                                        <p className="text-[10px] text-gray-400 leading-tight px-2">Coordinamos cita para ver el piso.</p>
                                                                    </div>
                                                                    <div className="text-center group">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center font-black mb-2 mx-auto group-hover:bg-rentia-blue group-hover:text-white transition-colors text-xs shadow-sm">4</div>
                                                                        <p className="text-[10px] font-bold text-gray-800 uppercase mb-1">¡Dentro!</p>
                                                                        <p className="text-[10px] text-gray-400 leading-tight px-2">Contrato digital y entrega de llaves.</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Legal Disclaimer */}
                                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                                                                <p className="text-[10px] text-gray-400 leading-relaxed max-w-3xl mx-auto">
                                                                    <span className="font-bold text-gray-500 uppercase">Información antes de contactar:</span> Rentia Investments S.L. actúa como plataforma de intermediación tecnológica.
                                                                    El usuario reconoce y acepta nuestra <strong>cláusula de no elusión</strong>, comprometiéndose a realizar toda comunicación y pago inicial a través de Rentia.
                                                                    Cualquier intento de negociación directa con la propiedad podrá suponer la cancelación del servicio. Los términos finales del alquiler (precio, duración, fianza) son definidos por el contrato de arrendamiento.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div >
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

                                    {/* Property Context */}
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1 h-4 bg-rentia-blue rounded-full"></div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Sobre la vivienda</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                <UsersIcon className="w-3.5 h-3.5 text-gray-400" /> {selectedProperty.rooms.length} Vecinos
                                            </div>
                                            {selectedProperty.bathrooms && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                    <Bath className="w-3.5 h-3.5 text-gray-400" /> {selectedProperty.bathrooms} Baños
                                                </div>
                                            )}
                                            {selectedProperty.cleaningConfig?.enabled && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                                    <Sparkles className="w-3.5 h-3.5" /> Limpieza Inc.
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                                                <Monitor className="w-3.5 h-3.5" /> Wifi Alta Vel.
                                            </div>
                                        </div>
                                    </div>

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
                                        {(selectedPropertyMatch?.matchingRooms || selectedProperty.rooms).map((room) => {
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
                                                                <div className="mt-3 space-y-3">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {room.availableFrom && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase">
                                                                                <Calendar className="w-3 h-3" /> {room.availableFrom === 'Inmediata' ? 'Inmediata' : `Desde ${room.availableFrom}`}
                                                                            </span>
                                                                        )}
                                                                        {room.sqm && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100 uppercase">
                                                                                <Maximize className="w-3 h-3" /> {room.sqm} m²
                                                                            </span>
                                                                        )}
                                                                        {room.bedType && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded uppercase">
                                                                                {getBedIcon(room.bedType)} {getBedLabel(room.bedType)}
                                                                            </span>
                                                                        )}
                                                                        {room.hasAirConditioning && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-1 rounded uppercase">
                                                                                <Wind className="w-3 h-3" /> A/C
                                                                            </span>
                                                                        )}
                                                                        {room.features?.includes('private_bath') && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase">
                                                                                <Bath className="w-3 h-3" /> Baño Privado
                                                                            </span>
                                                                        )}
                                                                        {room.targetProfile && room.targetProfile !== 'both' && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase">
                                                                                {room.targetProfile === 'students' ? <GraduationCap className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                                                                                {room.targetProfile === 'students' ? 'Estudiantes' : 'Trabajadores'}
                                                                            </span>
                                                                        )}
                                                                        {room.hasFan && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-md border border-sky-100 uppercase">
                                                                                <Sparkles className="w-3 h-3" /> Ventilador
                                                                            </span>
                                                                        )}
                                                                        {room.notes && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase">
                                                                                <Info className="w-3 h-3" /> {room.notes}
                                                                            </span>
                                                                        )}
                                                                        {room.features?.includes('window_street') && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100 uppercase">
                                                                                <Sun className="w-3 h-3" /> Exterior
                                                                            </span>
                                                                        )}
                                                                        {room.features?.includes('balcony') && (
                                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 uppercase">
                                                                                <Layout className="w-3 h-3" /> Balcón
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {room.description && (
                                                                        <p className="text-[11px] text-gray-500 italic leading-snug border-l-2 border-gray-100 pl-2">
                                                                            "{room.description}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {isAvailable ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded mb-1">Libre</span>
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="font-black text-xl text-rentia-blue leading-none">{room.price}€</span>
                                                                            <span className="text-[10px] font-bold text-gray-400">/mes</span>
                                                                        </div>
                                                                        {(room.expenses.toLowerCase().includes('reparten') || room.expenses.toLowerCase().includes('fijos')) && (
                                                                            <span className="text-[9px] font-black text-rentia-blue uppercase tracking-tighter">+ Gastos aparte</span>
                                                                        )}
                                                                    </div>
                                                                ) : (<span className="bg-gray-100 text-gray-500 text-[10px] font-bold uppercase px-2 py-1 rounded">Alquilada</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Button */}
                                                        {isAvailable ? (
                                                            <div className="flex flex-col gap-2 mt-3 w-full">
                                                                {(() => {
                                                                    const now = new Date();
                                                                    const hour = now.getHours();
                                                                    const minute = now.getMinutes();
                                                                    const isOpen = hour >= 9 && (hour < 14 || (hour === 14 && minute === 0));

                                                                    return isOpen ? (
                                                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center mb-0.5 flex items-center justify-center gap-1.5 animate-pulse bg-emerald-50 py-1 rounded">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                            Abierto · 9:00 - 14:00
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center mb-1">
                                                                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center flex items-center justify-center gap-1.5 bg-rose-50 py-1 rounded w-full">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                                Cerrado · Abrimos a las 9:00
                                                                            </div>
                                                                            <span className="text-[9px] text-gray-400 font-medium italic mt-0.5">Deja tu mensaje y te responderemos</span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    <button
                                                                        onClick={() => openContactModal(room.name, selectedProperty.address, selectedProperty.id, room.id)}
                                                                        className="flex items-center justify-center gap-2 bg-rentia-black text-white py-3 rounded-xl font-bold text-xs hover:bg-rentia-blue transition-colors shadow-sm active:scale-95 w-full"
                                                                    >
                                                                        <MessageCircle className="w-4 h-4" /> Solicitar información
                                                                    </button>
                                                                </div>
                                                            </div>
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

                                    {/* Mobile Disclaimer */}
                                    <div className="bg-gray-50 -mx-4 px-4 py-8 border-t border-gray-100 text-center mt-6">
                                        <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs mx-auto">
                                            <span className="font-bold text-gray-500 uppercase block mb-2">Información importante</span>
                                            Rentia Investments S.L. actúa como intermediario.
                                            Al contactar aceptas nuestra <strong>cláusula de no elusión</strong>.
                                            Toda gestión y pago debe realizarse a través de la plataforma Rentia.
                                        </p>
                                    </div>

                                    {/* SEO Content Block (Authority content for AI & Search) */}
                                    <div className="mt-20 border-t border-gray-100 pt-16 pb-12 text-gray-600 space-y-8 max-w-4xl mx-auto">

                                        {/* Popular Searches / internal linking for SEO */}
                                        <div className="text-center mb-12">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Búsquedas Populares en Murcia</h3>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {['Vistabella', 'San Andrés', 'Centro', 'Espinardo', 'La Merced', 'San Antón'].map(zone => (
                                                    <button
                                                        key={zone}
                                                        onClick={() => {
                                                            setSelectedZone(zone);
                                                            window.scrollTo({ top: 600, behavior: 'smooth' });
                                                        }}
                                                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:border-rentia-blue hover:text-rentia-blue transition-all shadow-sm"
                                                    >
                                                        Habitaciones en {zone}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Por qué alquilar habitaciones en Murcia con RentiaRoom?</h2>
                                                <p className="text-sm leading-relaxed mb-4">
                                                    Murcia se ha convertido en uno de los principales destinos para estudiantes y jóvenes profesionales en España. En <strong>RentiaRoom</strong> entendemos que buscar un piso compartido puede ser una tarea estresante, por eso ofrecemos una gestión integral que garantiza transparencia y seguridad.
                                                </p>
                                                <p className="text-sm leading-relaxed">
                                                    Nuestras viviendas están estratégicamente situadas cerca de los puntos clave de la ciudad: la Universidad de Murcia (UMU), la UCAM en Guadalupe y las principales zonas de ocio y servicios del centro. Alquilar una habitación en Murcia nunca ha sido tan sencillo y profesional.
                                                </p>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Mejores zonas para alquilar en Murcia</h2>
                                                <ul className="space-y-2 text-sm">
                                                    <li><strong className="text-rentia-blue">Vistabella:</strong> Barrio tranquilo, carismático y muy cerca del hospital Reina Sofía y el centro.</li>
                                                    <li><strong className="text-rentia-blue">San Andrés:</strong> Excelente conexión con la estación de autobuses y el centro histórico de la capital murciana.</li>
                                                    <li><strong className="text-rentia-blue">Espinardo:</strong> Ideal para estudiantes que buscan proximidad con el Campus de Espinardo de la UMU.</li>
                                                    <li><strong className="text-rentia-blue">Centro de Murcia:</strong> Para quienes quieren vivir el pulso de la ciudad, cerca de la Catedral y La Merced.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-left">
                                            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Preguntas Frecuentes sobre Alquiler de Habitaciones (FAQ)</h2>
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 border-l-4 border-rentia-gold pl-3 mb-2">¿Cómo reservar una habitación en Murcia?</h3>
                                                    <p className="text-sm">En RentiaRoom puedes reservar de forma digital. Tras elegir tu habitación y pasar el filtro de solvencia, podrás firmar tu contrato de alquiler de forma legal y segura.</p>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 border-l-4 border-rentia-gold pl-3 mb-2">¿Están incluidos los gastos en el precio?</h3>
                                                    <p className="text-sm">Contamos con dos modalidades: gastos fijos (una cuota fija al mes que incluye luz, agua e internet) o gastos a repartir entre los inquilinos. Puedes filtrarlos en el buscador lateral.</p>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 border-l-4 border-rentia-gold pl-3 mb-2">¿Es seguro alquilar con RentiaRoom?</h3>
                                                    <p className="text-sm">Sí, somos una empresa de gestión profesional con sede en Murcia. Ofrecemos contratos legales bajo la LAU y atención directa vía WhatsApp para cualquier incidencia.</p>
                                                </div>
                                            </div>
                                        </div>
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

                <ContactLeadModal
                    isOpen={contactModalOpen}
                    onClose={() => setContactModalOpen(false)}
                    roomName={contactRoomData?.roomName || ''}
                    propertyName={contactRoomData?.propertyName || ''}
                    propertyId={contactRoomData?.propertyId}
                    roomId={contactRoomData?.roomId}
                />

                {/* JSON-LD Structured Data for AEO / SEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "ItemList",
                            "name": "Alquiler de habitaciones en Murcia | RentiaRoom",
                            "description": "Explora nuestra selección de habitaciones premium en alquiler en las mejores zonas de Murcia para estudiantes y trabajadores.",
                            "url": "https://rentiaroom.com/habitaciones",
                            "numberOfItems": filteredProperties.reduce((acc, item) => acc + item.matchingRooms.length, 0),
                            "itemListElement": filteredProperties.slice(0, 10).map(({ property: prop }, index) => ({
                                "@type": "ListItem",
                                "position": index + 1,
                                "item": {
                                    "@type": "Accommodation",
                                    "name": `Habitación en ${prop.address}, Murcia`,
                                    "description": prop.description || `Habitación en alquiler en la zona de ${prop.city}`,
                                    "image": prop.image,
                                    "address": {
                                        "@type": "PostalAddress",
                                        "addressLocality": "Murcia",
                                        "addressRegion": "Murcia",
                                        "addressCountry": "ES"
                                    },
                                    "amenityFeature": (prop.features || []).map((f: string) => ({
                                        "@type": "LocationFeatureSpecification",
                                        "name": f,
                                        "value": true
                                    }))
                                }
                            }))
                        })
                    }}
                />

                {/* FAQ Schema for rich results and AI models */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            "mainEntity": [
                                {
                                    "@type": "Question",
                                    "name": "¿Dónde encontrar habitaciones de alquiler para estudiantes en Murcia?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Las mejores zonas para estudiantes en Murcia son Espinardo (cerca del Campus), La Merced (centro histórico) y Vistabella. RentiaRoom gestiona habitaciones premium en estas ubicaciones con todos los servicios."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "¿Qué precio tiene una habitación en Murcia?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Los precios de las habitaciones en Murcia oscilan entre los 250€ y 400€ mensuales, dependiendo de la ubicación y servicios incluidos. En RentiaRoom ofrecemos opciones competitivas con gestión profesional."
                                    }
                                }
                            ]
                        })
                    }}
                />

            </div >
        </>
    );
};
