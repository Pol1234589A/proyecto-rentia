"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { brokerRequests as staticRequests, BrokerRequest, RequestTag } from '../data/brokerRequests';
import { Briefcase, Search, MapPin, FileText, ArrowRight, Building2, Filter, X, Handshake, Crown, Star, Network, PlusCircle, SearchCheck, Lock, Grid, List, Home, Layers, MousePointerClick, TrendingUp, Eye, Euro, Info, ArrowUpDown, BellRing } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ModalType } from './LegalModals';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { PropertySubmissionForm } from './collaborators/PropertySubmissionForm';
import { useRouter } from 'next/navigation';

// interface BrokerViewProps removed as it is empty
export const BrokerView: React.FC = () => {
    const { t } = useLanguage();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'requests' | 'submission'>('requests');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterTag, setFilterTag] = useState<RequestTag | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest'); // Nuevo estado de ordenación
    const [brokerRequests, setBrokerRequests] = useState<BrokerRequest[]>(staticRequests);

    // Estados para Modal de Selección (COMPRA)
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

    // Estado para Modal de Detalle (Marketplace)
    const [selectedRequest, setSelectedRequest] = useState<BrokerRequest | null>(null);

    // Helper para verificar si es reciente (< 72 horas)
    const isRecent = (date: any) => {
        if (!date) return false;
        const now = new Date();
        // Soporte para Timestamp de Firestore o Date de JS
        const itemDate = date.toDate ? date.toDate() : new Date(date);

        const diffTime = Math.abs(now.getTime() - itemDate.getTime());
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

        return diffHours <= 72;
    };

    // Load Broker Requests from Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "buyer_requests"), (snapshot) => {
            const firestoreRequests: BrokerRequest[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                firestoreRequests.push({
                    id: doc.id,
                    reference: data.reference,
                    type: data.type,
                    specs: data.specs,
                    location: data.location,
                    condition: data.condition || 'Estándar',
                    budget: data.budget,
                    notes: data.notes,
                    tag: data.tag || 'own',
                    name: data.name,
                    contact: data.contact,
                    email: data.email,
                    createdAt: data.createdAt // Capturamos la fecha
                });
            });
            setBrokerRequests([...staticRequests, ...firestoreRequests]);
        }, (error) => {
            console.warn("Firestore access error:", error);
        });

        return () => unsubscribe();
    }, []);

    const scrollToContent = () => {
        // Si estamos en el formulario, volver a la lista primero
        if (activeTab === 'submission') {
            setActiveTab('requests');
        }
        // Pequeño timeout para permitir renderizado
        setTimeout(() => {
            const element = document.getElementById('broker-content');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const uniqueLocations = useMemo(() => {
        const locs = new Set(brokerRequests.map(req => req.location));
        return Array.from(locs).sort();
    }, [brokerRequests]);

    const filteredRequests = useMemo(() => {
        let filtered = brokerRequests.filter(req => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                req.reference.toLowerCase().includes(term) ||
                req.type.toLowerCase().includes(term) ||
                req.location.toLowerCase().includes(term) ||
                req.specs.toLowerCase().includes(term);

            const matchesLocation = filterLocation ? req.location === filterLocation : true;

            let matchesTag = true;
            if (filterTag !== 'all') {
                if (filterTag === 'collaboration') {
                    matchesTag = req.tag === 'collaboration';
                } else if (filterTag === 'own') {
                    matchesTag = req.tag === 'own' || req.tag === 'exclusive';
                }
            }

            return matchesSearch && matchesLocation && matchesTag;
        });

        // Lógica de Ordenación
        return filtered.sort((a, b) => {
            // Convertir fechas a timestamps para comparar. Si no tiene fecha (estáticos), se asume 0 (muy antiguo)
            const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
            const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;

            if (sortOrder === 'newest') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

    }, [brokerRequests, searchTerm, filterLocation, filterTag, sortOrder]);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterLocation('');
        setFilterTag('all');
        setSortOrder('newest');
    };

    const getTagStyle = (tag: RequestTag) => {
        switch (tag) {
            case 'collaboration':
                return {
                    style: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                    icon: <Handshake className="w-3 h-3" />,
                    textKey: 'brokers.tags.collaboration',
                    label: 'Colaboración'
                };
            case 'exclusive':
                return {
                    style: 'bg-amber-50 text-amber-700 border-amber-100',
                    icon: <Crown className="w-3 h-3" />,
                    textKey: 'brokers.tags.exclusive',
                    label: 'Exclusiva'
                };
            case 'own':
                return {
                    style: 'bg-green-50 text-green-700 border-green-100',
                    icon: <Star className="w-3 h-3" />,
                    textKey: 'brokers.tags.own',
                    label: 'Particular'
                };
            default:
                return {
                    style: 'bg-gray-50 text-gray-700 border-gray-100',
                    icon: <Briefcase className="w-3 h-3" />,
                    textKey: 'brokers.tags.collaboration',
                    label: 'Colaboración'
                };
        }
    };

    const handleNavigateToForm = (path: string) => {
        setIsPublishModalOpen(false);
        // Extract path from hash if needed, or expect straight path
        const targetPath = path.replace('#', '');
        router.push(targetPath);
    };

    return (
        <div className="bg-white min-h-screen font-sans animate-in fade-in duration-500">

            {/* --- HERO SECTION --- */}
            <section className="relative bg-slate-900 text-white pt-24 pb-32 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-rentia-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-rentia-gold/10 rounded-full blur-[100px] pointer-events-none"></div>
                </div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full mb-6 text-sm font-bold tracking-wide text-gray-200">
                        <Network className="w-4 h-4 text-rentia-gold" />
                        <span>Rentia Connect</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-6 tracking-tight leading-tight">
                        ¿Vendes o Buscas? <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rentia-gold to-white">Conectamos Oportunidades</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed mb-10">
                        Una plataforma unificada para propietarios, compradores y agentes. Gestiona activos o encuentra tu próxima inversión.
                    </p>
                </div>
            </section>

            {/* --- ACTION SELECTOR SECTION (4 ACTIONS) --- */}
            <section className="container mx-auto px-4 -mt-20 relative z-20 mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">

                    {/* CARD 1: ZONA PROPIETARIOS (VENDER) */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row group hover:shadow-2xl transition-all">
                        {/* Left Icon Area */}
                        <div className="bg-slate-900 p-6 flex flex-col justify-center items-center text-white md:w-1/3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm border border-white/10">
                                <Building2 className="w-6 h-6 text-rentia-gold" />
                            </div>
                            <h3 className="font-bold text-lg text-center leading-tight">Tienes un<br />Inmueble</h3>
                            <p className="text-xs text-slate-400 mt-2 text-center px-2">Vender</p>
                        </div>

                        {/* Right Actions Area */}
                        <div className="p-6 flex-1 flex flex-col justify-center gap-3 bg-white">
                            {/* ACTION 1: PUBLICAR ACTIVO (CORREGIDO: Apunta a nueva ruta propietarios) */}
                            <button
                                onClick={() => router.push('/publicar-propiedad')}
                                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 transition-all group/btn shadow-md active:scale-[0.98]"
                            >
                                <span className="flex items-center gap-3 font-bold text-sm">
                                    <PlusCircle className="w-5 h-5" /> Publicar mi Propiedad
                                </span>
                                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                            </button>

                            {/* ACTION 2: VER DEMANDAS */}
                            <button
                                onClick={scrollToContent}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 text-gray-600 hover:border-slate-300 hover:bg-gray-50 transition-all group/btn"
                            >
                                <span className="flex items-center gap-3 font-medium text-sm">
                                    <Layers className="w-5 h-5 text-gray-400 group-hover/btn:text-slate-600" /> Ver quién busca casa
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover/btn:text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* CARD 2: ZONA INVERSORES (COMPRAR) */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row group hover:shadow-2xl transition-all">
                        {/* Left Icon Area */}
                        <div className="bg-rentia-blue p-6 flex flex-col justify-center items-center text-white md:w-1/3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm border border-white/10">
                                <TrendingUp className="w-6 h-6 text-rentia-gold" />
                            </div>
                            <h3 className="font-bold text-lg text-center leading-tight">Buscas<br />Inversión</h3>
                            <p className="text-xs text-blue-200 mt-2 text-center px-2">Comprar o Invertir</p>
                        </div>

                        {/* Right Actions Area */}
                        <div className="p-6 flex-1 flex flex-col justify-center gap-3 bg-white">
                            {/* ACTION 3: PUBLICAR BÚSQUEDA */}
                            <button
                                onClick={() => setIsPublishModalOpen(true)}
                                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-rentia-blue bg-rentia-blue text-white hover:bg-blue-700 hover:border-blue-700 transition-all group/btn shadow-md active:scale-[0.98]"
                            >
                                <span className="flex items-center gap-3 font-bold text-sm">
                                    <SearchCheck className="w-5 h-5" /> Publicar mi Búsqueda
                                </span>
                                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                            </button>

                            {/* ACTION 4: VER OPORTUNIDADES */}
                            <button
                                onClick={() => router.push('/oportunidades')}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all group/btn"
                            >
                                <span className="flex items-center gap-3 font-medium text-sm">
                                    <Eye className="w-5 h-5 text-gray-400 group-hover/btn:text-rentia-blue" /> Ver Oportunidades
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover/btn:text-rentia-blue" />
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* --- MAIN CONTENT AREA --- */}
            <section id="broker-content" className="container mx-auto px-4 pb-24 max-w-7xl">

                {activeTab === 'submission' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <PropertySubmissionForm onBack={() => setActiveTab('requests')} />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Toolbar & Filters */}
                        <div id="marketplace-header" className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 scroll-mt-32">
                            <div className="max-w-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <h2 className="text-2xl font-bold text-rentia-black font-display">Marketplace de Demandas</h2>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">En Tiempo Real</span>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    Estos compradores e inversores buscan activamente. Si tienes un inmueble que encaje, contáctanos indicando la referencia.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-end">
                                <button
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                                    className="bg-white text-gray-700 border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    title={viewMode === 'grid' ? "Cambiar a Vista Tabla" : "Cambiar a Vista Galería"}
                                >
                                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                                    {viewMode === 'grid' ? 'Vista Lista' : 'Vista Tarjetas'}
                                </button>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-grow w-full md:w-auto">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    placeholder="Buscar por referencia, zona o tipo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                <div className="relative">
                                    <select
                                        value={filterLocation}
                                        onChange={(e) => setFilterLocation(e.target.value)}
                                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 cursor-pointer min-w-[150px] appearance-none"
                                    >
                                        <option value="">Todas las Zonas</option>
                                        {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                    </select>
                                </div>

                                <div className="relative">
                                    <select
                                        value={filterTag}
                                        onChange={(e) => setFilterTag(e.target.value as any)}
                                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 cursor-pointer min-w-[150px] appearance-none"
                                    >
                                        <option value="all">Todos los Orígenes</option>
                                        <option value="own">Rentia / Particulares</option>
                                        <option value="collaboration">Agencias / Profesionales</option>
                                    </select>
                                </div>

                                {/* Sort Selector */}
                                <div className="relative">
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as any)}
                                        className="px-4 py-2.5 pl-9 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 cursor-pointer min-w-[140px] appearance-none"
                                    >
                                        <option value="newest">Más recientes</option>
                                        <option value="oldest">Más antiguas</option>
                                    </select>
                                    <ArrowUpDown className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                                </div>
                            </div>

                            {(searchTerm || filterLocation || filterTag !== 'all' || sortOrder !== 'newest') && (
                                <button onClick={clearFilters} className="text-red-500 text-xs font-bold hover:underline whitespace-nowrap px-2">
                                    Borrar filtros
                                </button>
                            )}
                        </div>

                        {/* CONTENT: GRID VIEW (DEFAULT) */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRequests.map((req) => {
                                    const tagInfo = getTagStyle(req.tag);
                                    const isNew = isRecent(req.createdAt);

                                    return (
                                        <div
                                            key={req.id}
                                            onClick={() => setSelectedRequest(req)}
                                            className={`
                                    bg-white rounded-2xl p-6 shadow-sm border 
                                    hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative overflow-hidden hover:-translate-y-1 cursor-pointer
                                    ${isNew ? 'border-rentia-blue/40 ring-1 ring-rentia-blue/20 animate-in fade-in zoom-in-95 duration-500' : 'border-gray-100 hover:border-rentia-blue/30'}
                                `}
                                        >
                                            <div className={`absolute top-0 left-0 w-full h-1 ${req.tag === 'own' ? 'bg-green-500' : 'bg-indigo-500'}`}></div>

                                            {isNew && (
                                                <div className="absolute top-3 right-3 animate-bounce">
                                                    <span className="bg-gradient-to-r from-rentia-blue to-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-white/20">
                                                        <BellRing className="w-3 h-3 fill-current" /> NUEVA
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-4 pr-16">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${tagInfo.style}`}>
                                                    {tagInfo.icon} {t(tagInfo.textKey)}
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded mb-1 inline-block">{req.reference}</span>
                                                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-rentia-blue transition-colors">
                                                    {req.type}
                                                </h3>
                                            </div>

                                            <div className="flex items-start gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                                                <MapPin className="w-4 h-4 text-rentia-blue mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{req.location}</span>
                                            </div>

                                            <div className="space-y-3 mb-6 flex-grow">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span className="truncate">{req.specs}</span>
                                                </div>
                                                {req.notes && (
                                                    <p className="text-xs text-gray-500 italic line-clamp-2 pl-2 border-l-2 border-gray-200">
                                                        "{req.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Presupuesto</p>
                                                    <p className="text-xl font-bold text-slate-800">
                                                        {req.budget > 0 ? `${req.budget.toLocaleString('es-ES')}€` : <span className="text-green-600 text-lg">Flexible</span>}
                                                    </p>
                                                </div>
                                                <button
                                                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-rentia-blue transition-colors shadow-lg group-hover:scale-110 transform duration-200"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* CONTENT: TABLE VIEW */}
                        {viewMode === 'table' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-gray-200">
                                                <th className="p-4 font-bold">{t('brokers.table.ref')}</th>
                                                <th className="p-4 font-bold">{t('brokers.table.type')}</th>
                                                <th className="p-4 font-bold">{t('brokers.table.location')}</th>
                                                <th className="p-4 font-bold text-right">{t('brokers.table.budget')}</th>
                                                <th className="p-4 font-bold text-center">{t('brokers.table.action')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                            {filteredRequests.map((req) => {
                                                const isNew = isRecent(req.createdAt);
                                                return (
                                                    <tr
                                                        key={req.id}
                                                        className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${isNew ? 'bg-blue-50/10' : ''}`}
                                                        onClick={() => setSelectedRequest(req)}
                                                    >
                                                        <td className="p-4 font-mono text-rentia-blue font-bold flex items-center gap-2">
                                                            {req.reference}
                                                            {isNew && <span className="w-2 h-2 rounded-full bg-rentia-blue animate-pulse" title="Nueva"></span>}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-bold">{req.type}</div>
                                                            <div className="text-xs text-gray-500">{req.specs}</div>
                                                        </td>
                                                        <td className="p-4">{req.location}</td>
                                                        <td className="p-4 text-right font-bold">
                                                            {req.budget > 0 ? `${req.budget.toLocaleString()}€` : 'Flexible'}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <button
                                                                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold hover:bg-green-200 transition-colors"
                                                            >
                                                                Ver Ficha
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {filteredRequests.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-600">No se encontraron resultados</h3>
                                <button onClick={clearFilters} className="text-rentia-blue font-bold text-sm hover:underline mt-2">Limpiar filtros</button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* --- MODAL DETALLE DEMANDA --- */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedRequest(null)}>
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                        {/* Header Modal */}
                        <div className="p-6 bg-slate-900 text-white relative">
                            <button onClick={() => setSelectedRequest(null)} className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2 mb-2 opacity-80">
                                <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded">{selectedRequest.reference}</span>
                                {(() => {
                                    const tag = getTagStyle(selectedRequest.tag);
                                    return (
                                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            {tag.icon} {tag.label}
                                        </span>
                                    )
                                })()}
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold font-display leading-tight">{selectedRequest.type}</h3>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-6">

                                {/* Location & Budget */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Zona</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedRequest.location}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center gap-1"><Euro className="w-3 h-3" /> Presupuesto</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedRequest.budget > 0 ? `${selectedRequest.budget.toLocaleString()}€` : 'Flexible'}</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-rentia-blue" /> Detalles del Requerimiento</h4>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-gray-700 leading-relaxed space-y-2">
                                        <p><strong>Características:</strong> {selectedRequest.specs}</p>
                                        <p><strong>Estado deseado:</strong> {selectedRequest.condition}</p>
                                        {selectedRequest.notes && (
                                            <p className="pt-2 border-t border-blue-200 mt-2 italic">
                                                "{selectedRequest.notes}"
                                            </p>
                                        )}
                                        {isRecent(selectedRequest.createdAt) && (
                                            <div className="mt-2 text-xs font-bold text-blue-800 flex items-center gap-1">
                                                <BellRing className="w-3 h-3" /> Publicado recientemente
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                            <a
                                href={`https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20tengo%20un%20inmueble%20que%20encaja%20con%20la%20referencia%20${selectedRequest.reference}.`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-rentia-black text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Briefcase className="w-4 h-4 text-rentia-gold" /> Tengo este inmueble
                            </a>
                            <p className="text-[10px] text-gray-400 text-center">
                                Contacta con nosotros para presentar tu propiedad a este cliente.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL SELECCIÓN DE PERFIL DE BÚSQUEDA --- */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden relative">
                        <button onClick={() => setIsPublishModalOpen(false)} className="absolute top-4 right-4 z-50 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"><X className="w-4 h-4" /></button>

                        <div className="p-8 text-center bg-slate-900 text-white">
                            <Search className="w-12 h-12 text-rentia-gold mx-auto mb-4" />
                            <h3 className="text-2xl font-bold font-display mb-2">Publicar Demanda</h3>
                            <p className="text-slate-300 text-sm">Elige tu perfil para continuar</p>
                        </div>

                        <div className="p-6 md:p-8 space-y-4">

                            {/* Opción Particular */}
                            <button
                                onClick={() => router.push('/request/individual')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group text-left shadow-sm hover:shadow-md"
                            >
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Home className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg group-hover:text-green-800">Soy Particular</h4>
                                    <p className="text-sm text-gray-500">Busco una propiedad para mí o mi familia.</p>
                                </div>
                                <div className="ml-auto text-gray-300 group-hover:text-green-500">
                                    <MousePointerClick className="w-5 h-5" />
                                </div>
                            </button>

                            {/* Opción Agencia */}
                            <button
                                onClick={() => router.push('/request/agency')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group text-left shadow-sm hover:shadow-md"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg group-hover:text-indigo-800">Soy Agencia / Broker</h4>
                                    <p className="text-sm text-gray-500">Busco para un cliente o inversor.</p>
                                </div>
                                <div className="ml-auto text-gray-300 group-hover:text-indigo-500">
                                    <MousePointerClick className="w-5 h-5" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Contact */}
            <section className="bg-white border-t border-gray-200 py-12">
                <div className="container mx-auto px-4 text-center">
                    <h3 className="text-xl font-bold text-rentia-black mb-4">{t('brokers.footer.title')}</h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        {t('brokers.footer.text')}
                    </p>
                    <a href="mailto:info@rentiaroom.com" className="text-rentia-blue font-bold hover:underline inline-flex items-center gap-2">
                        info@rentiaroom.com <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </section>

        </div>
    );
};
