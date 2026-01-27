import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { properties as staticProperties, Property, Room, CleaningConfig, OwnerRecommendation, RoomTimelineEvent, HistoricalTenant, BillingRecord } from '../../data/rooms';
import { generatePropertySummaryPDF } from '../../utils/pdfGenerator';
import { Save, RefreshCw, Home, ChevronDown, ChevronRight, Building, Plus, Trash2, X, MapPin, ExternalLink, Wind, Image as ImageIcon, FileText, Settings, Hammer, DollarSign, Percent, Sun, Tv, Lock, Monitor, AlertCircle, User, CheckCircle, Sparkles, Clock, Euro, Calendar, ShieldCheck, ShieldAlert, FileCheck, Download, CreditCard, Phone, Mail, Megaphone, Zap, Info, Send, Wifi, DoorOpen, TrendingUp, Wrench, Eye, EyeOff, Globe, CloudUpload, Receipt, Bed, Bath, Thermometer, Waves, Camera } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { UserProfile, PropertyDocument, SupplyInvoice } from '../../types';
import { SensitiveDataDisplay } from '../common/SecurityComponents';

// Helpers de fechas
const dateToInput = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr === 'Inmediata') return new Date().toISOString().split('T')[0];
    if (dateStr === 'Consultar') return '';
    try {
        const parts = dateStr.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return '';
    } catch (e) { return ''; }
};

const inputToDate = (isoDate: string) => {
    if (!isoDate) return 'Consultar';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[2] ? parts[0] : parts[0]}`;
    const d = new Date(isoDate);
    return isNaN(d.getTime()) ? 'Consultar' : d.toLocaleDateString('es-ES');
};

const RoomCountdown = ({ targetDateStr }: { targetDateStr: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ years: number, months: number, days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        const calculate = () => {
            if (!targetDateStr || targetDateStr === 'Consultar' || targetDateStr === 'Inmediata') return null;
            try {
                const parts = targetDateStr.split('/');
                if (parts.length !== 3) return null;
                const [day, month, year] = parts.map(Number);
                const target = new Date(year, month - 1, day, 23, 59, 59);
                const now = new Date();
                let diff = target.getTime() - now.getTime();
                if (diff <= 0) return null;

                const seconds = Math.floor((diff / 1000) % 60);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

                let totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                const years = Math.floor(totalDays / 365);
                totalDays %= 365;
                const months = Math.floor(totalDays / 30);
                const days = totalDays % 30;

                return { years, months, days, hours, minutes, seconds };
            } catch (e) { return null; }
        };

        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        setTimeLeft(calculate());
        return () => clearInterval(timer);
    }, [targetDateStr]);

    if (!timeLeft) return null;

    return (
        <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl w-full">
            <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
                <Clock className="w-3 h-3 text-blue-400 animate-pulse" />
                <span className="text-[7px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Libera en:</span>
            </div>
            <div className="flex flex-1 justify-around px-2">
                {[
                    { label: 'DÍAS', val: timeLeft.days + (timeLeft.months * 30) + (timeLeft.years * 365) },
                    { label: 'HORAS', val: timeLeft.hours },
                    { label: 'MIN', val: timeLeft.minutes },
                    { label: 'SEG', val: timeLeft.seconds, pulse: true }
                ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <span className={`text-[11px] font-black font-mono leading-none ${unit.pulse ? 'text-blue-400' : 'text-white'}`}>
                            {String(unit.val).padStart(2, '0')}
                        </span>
                        <span className="text-[6px] font-black text-slate-600 mt-0.5">{unit.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const RoomManager: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [ownersMap, setOwnersMap] = useState<Record<string, UserProfile>>({});
    const [documentsMap, setDocumentsMap] = useState<Record<string, PropertyDocument[]>>({});
    const [invoicesMap, setInvoicesMap] = useState<Record<string, SupplyInvoice[]>>({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedProp, setExpandedProp] = useState<string | null>(null);
    const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});


    const [isCreating, setIsCreating] = useState(false);
    const [newPropData, setNewPropData] = useState({
        address: '', city: 'Murcia', floor: '', bathrooms: 1, image: '', initialRooms: 3
    });

    const [newRec, setNewRec] = useState<{ text: string, type: 'price' | 'improvement' | 'info' }>({ text: '', type: 'info' });
    const [roomRecInputs, setRoomRecInputs] = useState<Record<string, string>>({});
    const [docPreview, setDocPreview] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' });
    const [showPdfMenu, setShowPdfMenu] = useState(false);

    useEffect(() => {
        const unsubProps = onSnapshot(collection(db, "properties"), (snapshot) => {
            const fireMap: Record<string, Property> = {};
            snapshot.forEach(doc => {
                fireMap[doc.id] = { ...doc.data(), id: doc.id } as Property;
            });
            const merged = staticProperties.map(p => fireMap[p.id] || p);
            Object.keys(fireMap).forEach(id => {
                if (!staticProperties.find(sp => sp.id === id)) merged.push(fireMap[id]);
            });
            setProperties(merged.sort((a, b) => (a.address || '').localeCompare(b.address || '')));
            setLoading(false);
        });

        const unsubUsers = onSnapshot(query(collection(db, "users"), where("role", "==", "owner")), (snap) => {
            const m: Record<string, UserProfile> = {};
            snap.forEach(d => m[d.id] = { ...d.data(), id: d.id } as UserProfile);
            setOwnersMap(m);
        });

        // Eliminadas suscripciones a property_documents y otros para evitar errores de permisos
        const unsubDocs = () => { };
        const unsubInv = () => { };

        return () => { unsubProps(); unsubUsers(); unsubDocs(); unsubInv(); };
    }, []);

    const handleSaveAll = async (propId: string) => {
        setSaving(true);
        const p = properties.find(x => x.id === propId);
        if (p) {
            try {
                await setDoc(doc(db, "properties", propId), p, { merge: true });
                alert("✓ Cambios sincronizados con éxito.");
            } catch (e) { alert("Error al guardar."); }
        }
        setSaving(false);
    };

    const handlePropertyFieldChange = (id: string, field: keyof Property, val: any) => {
        setProperties(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };

    const handleRoomFieldChange = (propId: string, roomId: string, field: keyof Room, val: any) => {
        setProperties(prev => prev.map(p => {
            if (p.id !== propId) return p;
            return { ...p, rooms: (p.rooms || []).map(r => r.id === roomId ? { ...r, [field]: val } : r) };
        }));
    };

    const handleTenantFieldChange = (propId: string, roomId: string, field: string, val: any) => {
        setProperties(prev => prev.map(p => {
            if (p.id !== propId) return p;
            return {
                ...p,
                rooms: (p.rooms || []).map(r => {
                    if (r.id !== roomId) return r;
                    const currentTenant = r.tenant || { name: '', email: '', phone: '', idNumber: '', startDate: '', endDate: '', deposit: 0 };
                    return { ...r, tenant: { ...currentTenant, [field]: val } };
                })
            };
        }));
    };

    const handleRoomFeatureToggle = (propId: string, roomId: string, feature: string) => {
        setProperties(prev => prev.map(p => {
            if (p.id !== propId) return p;
            return {
                ...p,
                rooms: (p.rooms || []).map(r => {
                    if (r.id !== roomId) return r;
                    const features = r.features || [];
                    return {
                        ...r,
                        features: features.includes(feature)
                            ? features.filter(f => f !== feature)
                            : [...features, feature]
                    };
                })
            };
        }));
    };

    const handleAddRoomImage = (propId: string, roomId: string, imageUrl: string) => {
        setProperties(prev => prev.map(p => {
            if (p.id !== propId) return p;
            return {
                ...p,
                rooms: (p.rooms || []).map(r => {
                    if (r.id !== roomId) return r;
                    return { ...r, images: [...(r.images || []), imageUrl] };
                })
            };
        }));
    };

    const handleRemoveRoomImage = (propId: string, roomId: string, imageUrl: string) => {
        setProperties(prev => prev.map(p => {
            if (p.id !== propId) return p;
            return {
                ...p,
                rooms: (p.rooms || []).map(r => {
                    if (r.id !== roomId) return r;
                    return { ...r, images: (r.images || []).filter(img => img !== imageUrl) };
                })
            };
        }));
    };

    const handleAddPropertyImage = (propId: string, imageUrl: string) => {
        setProperties(prev => prev.map(p => {
            if (p.id !== propId) return p;
            return { ...p, commonZonesImages: [...(p.commonZonesImages || []), imageUrl] };
        }));
    };

    const handleRemovePropertyImage = (propId: string, imageUrl: string) => {
        setProperties(prev => prev.map(p => {
            if (p.id !== propId) return p;
            return { ...p, commonZonesImages: (p.commonZonesImages || []).filter(img => img !== imageUrl) };
        }));
    };

    const hasContract = (room: Room) => !!room.driveUrl;

    if (loading) return <div className="text-center py-20"><RefreshCw className="animate-spin w-10 h-10 text-rentia-blue mx-auto" /></div>;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Building className="w-8 h-8 text-rentia-blue" />
                        Gestión de Activos
                    </h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Control total de propiedades e inquilinos</p>
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className="relative">
                        <button
                            onClick={() => setShowPdfMenu(!showPdfMenu)}
                            className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-slate-50 transition-all shadow-lg border border-slate-200 active:scale-95"
                        >
                            <Download className="w-5 h-5 text-blue-600" />
                            DESCARGAR REPORTE
                            <ChevronDown className={`w-4 h-4 transition-transform ${showPdfMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showPdfMenu && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-[100] animate-in slide-in-from-top-2">
                                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Configurar PDF</p>

                                <button
                                    onClick={async () => { await generatePropertySummaryPDF(properties, { mode: 'internal' }); setShowPdfMenu(false); }}
                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors group"
                                >
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800">Reporte de Gestión</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Económico + Impagos</p>
                                    </div>
                                </button>

                                <button
                                    onClick={async () => { await generatePropertySummaryPDF(properties, { mode: 'commercial', showOnlyAvailable: true }); setShowPdfMenu(false); }}
                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors group"
                                >
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Megaphone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800">Dossier Comercial</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Libres + Dir. Pública</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsCreating(!isCreating)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        {isCreating ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {isCreating ? 'CANCELAR' : 'ALTA VIVIENDA'}
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-rentia-blue/20 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="font-black text-slate-800 mb-6 uppercase tracking-tight">Alta de Nueva Propiedad</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Dirección</label><input type="text" className="w-full p-3 bg-slate-50 border rounded-xl" value={newPropData.address || ''} onChange={e => setNewPropData({ ...newPropData, address: e.target.value })} title="Dirección de la propiedad" placeholder="Calle Ejemplo, 1" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Ciudad</label><input type="text" className="w-full p-3 bg-slate-50 border rounded-xl" value={newPropData.city || ''} onChange={e => setNewPropData({ ...newPropData, city: e.target.value })} title="Ciudad" placeholder="Murcia" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Planta</label><input type="text" className="w-full p-3 bg-slate-50 border rounded-xl" value={newPropData.floor || ''} onChange={e => setNewPropData({ ...newPropData, floor: e.target.value })} title="Planta" placeholder="3º Izda" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Habs Iniciales</label><input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={newPropData.initialRooms || 3} onChange={e => setNewPropData({ ...newPropData, initialRooms: Number(e.target.value) })} title="Número de habitaciones iniciales" /></div>
                    </div>
                    <button onClick={async () => {
                        setSaving(true);
                        const id = newPropData.address.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10) + Date.now().toString().slice(-4);
                        const rooms: Room[] = [];
                        for (let i = 1; i <= newPropData.initialRooms; i++) rooms.push({ id: `${id}_H${i}`, name: `H${i}`, price: 300, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both', features: ['lock', 'desk'], commissionType: 'percentage', commissionValue: 10 });
                        await setDoc(doc(db, "properties", id), { ...newPropData, id, rooms, isPublished: false, bathrooms: Number(newPropData.bathrooms) });
                        setIsCreating(false);
                        setSaving(false);
                    }} className="w-full md:w-auto bg-rentia-blue text-white px-10 py-4 rounded-xl font-black shadow-lg shadow-blue-500/30">CREAR PROYECTO</button>
                </div>
            )}

            <div className="space-y-6">
                {properties.map(p => {
                    const isExpanded = expandedProp === p.id;
                    const owner = p.ownerId ? ownersMap[p.ownerId] : null;
                    const tab = activeTabs[p.id] || 'rooms';

                    return (
                        <div key={p.id} className={`rounded-3xl transition-all duration-300 border-2 overflow-hidden ${isExpanded ? 'border-rentia-blue bg-blue-50/20 shadow-2xl ring-4 ring-blue-500/5' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                            <div className={`p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-colors ${isExpanded ? 'bg-white/80' : 'bg-white hover:bg-slate-50'}`} onClick={() => setExpandedProp(isExpanded ? null : p.id)}>
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className={`w-20 h-20 rounded-2xl overflow-hidden transition-all border-2 ${owner ? 'bg-green-100 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
                                            {p.image ? (
                                                <img src={p.image} alt={p.address} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Home className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-white rounded-xl shadow-xl p-0.5 border border-slate-100">
                                            <ImageUploader folder={`properties/${p.id}`} onUploadComplete={u => handlePropertyFieldChange(p.id, 'image', u)} label="" compact />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 flex flex-wrap items-center gap-3">
                                            {p.address || 'Sin Dirección'}
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${p.isPublished !== false ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                {p.isPublished !== false ? 'PUBLICADO' : 'BORRADOR'}
                                            </span>
                                            {(p.rooms || []).some(r => r.status === 'occupied' && !r.driveUrl) && (
                                                <span className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-lg shadow-red-500/30">
                                                    <ShieldAlert className="w-3.5 h-3.5" /> CONTRATOS PENDIENTES DRIVE
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-tight">{p.city || 'Murcia'} • {p.rooms?.length || 0} HABITACIONES</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                    <button onClick={(e) => { e.stopPropagation(); handleSaveAll(p.id) }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all shadow-sm"><Save className="w-5 h-5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, "properties", p.id)) }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                                    <div className={`p-2 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-rentia-blue' : 'text-slate-300'}`}><ChevronDown className="w-6 h-6" /></div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex bg-slate-100/50 p-2 gap-2 border-t border-b border-slate-100">
                                        {['rooms', 'management', 'maintenance'].map(t => (
                                            <button key={t} onClick={() => setActiveTabs({ ...activeTabs, [p.id]: t })} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${tab === t ? 'bg-white text-rentia-blue shadow-xl shadow-blue-500/10 scale-100' : 'text-slate-400 hover:text-slate-600'}`}>
                                                {t === 'rooms' ? 'Habs & Precios' : t === 'management' ? 'Gestión & Suministros' : 'Incidencias & Historial'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-8">
                                        {tab === 'rooms' && (
                                            <div className="space-y-8 animate-in fade-in">

                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                    {(p.rooms || []).map(room => {
                                                        const hasContract = !!room.driveUrl;
                                                        const baseComm = room.commissionValue ?? p.managementCommission ?? 10;
                                                        const isPercentage = room.commissionType !== 'fixed';
                                                        let profitAmount = isPercentage ? ((room.price || 0) * (baseComm / 100)) : baseComm;
                                                        if (!p.commissionIncludesIVA) profitAmount *= 1.21;
                                                        const profit = (room.isNonPayment || room.status !== 'occupied') ? 0 : Math.round(profitAmount);
                                                        return (
                                                            <div key={room.id} className={`p-6 rounded-3xl border-2 transition-all bg-white hover:shadow-xl ${room.isNonPayment ? 'border-red-500 shadow-2xl shadow-red-500/10' : 'border-slate-100'}`}>
                                                                <div className="flex justify-between items-start mb-6">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${room.status === 'occupied' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{room.name}</div>
                                                                        <div>
                                                                            <p className={`text-[10px] font-black uppercase tracking-widest ${room.status === 'occupied' ? 'text-green-600' : 'text-slate-400'}`}>{room.status}</p>
                                                                            {room.status === 'occupied' && !hasContract && (
                                                                                <p className="text-[9px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse mt-1 shadow-lg">
                                                                                    <ShieldAlert className="w-3 h-3" /> SIN CONTRATO ASIGNADO
                                                                                </p>
                                                                            )}
                                                                            {room.isNonPayment && <p className="text-[10px] font-black text-red-600 bg-red-50 px-2 rounded mt-1">INCIDENCIA DE PAGO</p>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="relative group flex flex-col items-end">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg shadow-emerald-500/20">
                                                                                    + {profit}€ <span className="text-[7px] opacity-80">(IVA INC.)</span>
                                                                                </div>
                                                                                <input type="number" className="text-2xl font-black text-rentia-blue w-28 text-right bg-blue-50/50 p-2 rounded-xl border border-transparent focus:border-blue-300 transition-all font-mono" value={room.price || 0} onChange={e => handleRoomFieldChange(p.id, room.id, 'price', Number(e.target.value))} />
                                                                            </div>
                                                                            <span className="text-[10px] font-black text-slate-300 uppercase mt-1">PVP (€) <span className="text-[7px] opacity-80">(IVA INC.)</span></span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Estado</label><select className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold" value={room.status || 'available'} onChange={e => handleRoomFieldChange(p.id, room.id, 'status', e.target.value)} title="Estado de la habitación"><option value="available">LIBRE</option><option value="occupied">ALQUILADA</option><option value="reserved">RESERVADA</option></select></div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase">Disponible</label>
                                                                        <input type="date" className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold" value={dateToInput(room.availableFrom)} onChange={e => handleRoomFieldChange(p.id, room.id, 'availableFrom', inputToDate(e.target.value))} title="Fecha de disponibilidad" />
                                                                    </div>
                                                                </div>

                                                                {room.status === 'occupied' && room.availableFrom && (
                                                                    <div className="mb-6">
                                                                        <RoomCountdown targetDateStr={room.availableFrom} />
                                                                    </div>
                                                                )}

                                                                <div className="bg-blue-50/30 p-4 rounded-2xl border-2 border-dashed border-blue-100 mb-6">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <h5 className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Liquidación Rentia</h5>
                                                                        <button onClick={() => handleRoomFieldChange(p.id, room.id, 'isNonPayment', !room.isNonPayment)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${room.isNonPayment ? 'bg-red-600 text-white border-red-700' : 'text-slate-400 bg-white border-slate-200'}`}>Reportar Impago</button>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-blue-100">
                                                                            <div className="relative flex-1">
                                                                                <input type="number" className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-black pr-6" value={room.commissionValue ?? p.managementCommission ?? 10} onChange={e => handleRoomFieldChange(p.id, room.id, 'commissionValue', Number(e.target.value))} />
                                                                                <span className="absolute right-3 top-2 text-xs text-slate-300 font-bold">
                                                                                    {room.commissionType === 'fixed' ? '€' : (p.commissionIncludesIVA ? '%' : '% + IVA')}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-right shrink-0">
                                                                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Tu Beneficio</p>
                                                                                <p className="text-xs font-black text-emerald-700">{profit}€ <span className="text-[8px] font-bold">(IVA INC.)</span></p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-blue-100">
                                                                            <div className="bg-blue-600 text-white p-2 rounded-lg"><DollarSign className="w-4 h-4" /></div>
                                                                            <div>
                                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Al Propietario</p>
                                                                                <p className="text-xs font-black text-slate-800">{room.isNonPayment ? 0 : (room.price || 0) - profit}€</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Características / Extras de la Habitación */}
                                                                <div className="mb-6">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">Características & Equipamiento</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'lock')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.features?.includes('lock') ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="Cerradura en puerta">
                                                                            <Lock className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Llave</span>
                                                                        </button>
                                                                        <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'desk')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.features?.includes('desk') ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="Escritorio">
                                                                            <Monitor className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Escritorio</span>
                                                                        </button>
                                                                        <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'smart_tv')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.features?.includes('smart_tv') ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="Smart TV">
                                                                            <Tv className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Smart TV</span>
                                                                        </button>
                                                                        <button onClick={() => handleRoomFieldChange(p.id, room.id, 'hasAirConditioning', !room.hasAirConditioning)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.hasAirConditioning ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="Aire Acondicionado">
                                                                            <Wind className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">A/C</span>
                                                                        </button>
                                                                        <button onClick={() => handleRoomFieldChange(p.id, room.id, 'bedType', room.bedType === 'double' ? 'single' : 'double')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.bedType === 'double' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="Cama Matrimonio">
                                                                            <Bed className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Doble</span>
                                                                        </button>
                                                                        <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'private_bath')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.features?.includes('private_bath') ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="Baño Privado">
                                                                            <Bath className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Baño</span>
                                                                        </button>
                                                                        <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'wifi')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.features?.includes('wifi') ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="WiFi">
                                                                            <Wifi className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">WiFi</span>
                                                                        </button>
                                                                        <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'exterior')} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.features?.includes('exterior') ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="Ventana Exterior">
                                                                            <Sun className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Exterior</span>
                                                                        </button>
                                                                        <button onClick={() => handleRoomFieldChange(p.id, room.id, 'hasHeating', !room.hasHeating)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${room.hasHeating ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`} title="Calefacción">
                                                                            <Thermometer className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Calor</span>
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Perfil y Gastos */}
                                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Perfil Objetivo</label>
                                                                        <select className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold" value={room.targetProfile || 'both'} onChange={e => handleRoomFieldChange(p.id, room.id, 'targetProfile', e.target.value)}>
                                                                            <option value="both">MIXTO (TODOS)</option>
                                                                            <option value="students">ESTUDIANTES</option>
                                                                            <option value="workers">TRABAJADORES</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gastos Mensuales</label>
                                                                        <input type="text" className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-black" placeholder="Ej: 40€ fijos" value={room.expenses || ''} onChange={e => handleRoomFieldChange(p.id, room.id, 'expenses', e.target.value)} title="Descripción de gastos" />
                                                                    </div>
                                                                </div>

                                                                {/* Galería de Habitación */}
                                                                <div className="mb-6 p-4 bg-blue-50/20 rounded-2xl border border-blue-100">
                                                                    <div className="flex justify-between items-center mb-4">
                                                                        <h6 className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Galería de la Habitación</h6>
                                                                        <ImageUploader folder={`properties/${p.id}/rooms/${room.id}`} onUploadComplete={url => handleAddRoomImage(p.id, room.id, url)} label="Subir Fotos" compact />
                                                                    </div>
                                                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                                                        {(room.images || []).map((img, idx) => (
                                                                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm hover:ring-2 ring-blue-400 transition-all cursor-pointer">
                                                                                <img src={img} className="w-full h-full object-cover" alt={`Habitación ${room.name}`} onClick={() => window.open(img, '_blank')} />
                                                                                <button onClick={() => handleRemoveRoomImage(p.id, room.id, img)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" title="Eliminar"><Trash2 className="w-3 h-3" /></button>
                                                                            </div>
                                                                        ))}
                                                                        {(room.images || []).length === 0 && (
                                                                            <div className="col-span-full py-4 text-center border-2 border-dashed border-blue-100 rounded-xl">
                                                                                <p className="text-[9px] font-bold text-blue-400 uppercase">Sin imágenes HD publicadas</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Documento Contrato (Drive)</label>
                                                                        <div className="flex gap-2">
                                                                            <div className="relative flex-1">
                                                                                <input type="text" className="w-full p-2 bg-white border rounded-xl text-xs font-medium pl-8" placeholder="https://drive.google.com/..." value={room.driveUrl || ''} onChange={e => handleRoomFieldChange(p.id, room.id, 'driveUrl', e.target.value)} title="Enlace al contrato" />
                                                                                <FileText className="w-4 h-4 text-slate-300 absolute left-2.5 top-2.5" />
                                                                            </div>
                                                                            {room.driveUrl && (
                                                                                <div className="flex gap-1">
                                                                                    <button onClick={() => {
                                                                                        let embedUrl = room.driveUrl || '';
                                                                                        if (embedUrl.includes('drive.google.com')) embedUrl = embedUrl.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
                                                                                        setDocPreview({ isOpen: true, url: embedUrl, title: `Contrato ${room.name}` });
                                                                                    }} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all" title="Previsualizar Contrato">
                                                                                        <Eye className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button onClick={() => window.open(room.driveUrl, '_blank')} className="p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all" title="Abrir contrato en Drive">
                                                                                        <ExternalLink className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Fotos Habitación (Drive)</label>
                                                                        <div className="flex gap-2">
                                                                            <div className="relative flex-1">
                                                                                <input type="text" className="w-full p-2 bg-white border rounded-xl text-xs font-medium pl-8" placeholder="https://drive.google.com/..." value={room.photosDriveUrl || ''} onChange={e => handleRoomFieldChange(p.id, room.id, 'photosDriveUrl', e.target.value)} title="Enlace a las fotos" />
                                                                                <ImageIcon className="w-4 h-4 text-slate-300 absolute left-2.5 top-1.5" />
                                                                            </div>
                                                                            {room.photosDriveUrl && (
                                                                                <div className="flex gap-1">
                                                                                    <button onClick={() => {
                                                                                        let embedUrl = room.photosDriveUrl || '';
                                                                                        if (embedUrl.includes('drive.google.com')) embedUrl = embedUrl.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
                                                                                        setDocPreview({ isOpen: true, url: embedUrl, title: `Fotos ${room.name}` });
                                                                                    }} className="p-2 bg-blue-600/20 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-200" title="Ver Fotos">
                                                                                        <Eye className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button onClick={() => window.open(room.photosDriveUrl, '_blank')} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all" title="Ver fotos en Drive">
                                                                                        <Camera className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {room.status === 'occupied' && (
                                                                    <div className="mb-6 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 animate-in zoom-in-95">
                                                                        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                                                            <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                                                                <User className="w-4 h-4 text-blue-500" /> Datos del Inquilino
                                                                            </h6>
                                                                            {room.driveUrl ? (
                                                                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase bg-emerald-200 text-emerald-800 flex items-center gap-1">
                                                                                    <FileCheck className="w-3 h-3" /> DRIVE CONFIGURADO
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase bg-amber-200 text-amber-800 flex items-center gap-1">
                                                                                    <AlertCircle className="w-3 h-3" /> SIN LINK DRIVE
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                                                            <div className="space-y-1">
                                                                                <label className="text-[8px] font-black text-slate-400 uppercase">Nombre</label>
                                                                                <input type="text" className="w-full p-2 bg-white border rounded-xl text-xs font-bold" value={room.tenant?.name || ''} onChange={e => handleTenantFieldChange(p.id, room.id, 'name', e.target.value)} placeholder="Nombre completo" title="Nombre del inquilino" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[8px] font-black text-slate-400 uppercase">Teléfono</label>
                                                                                <input type="text" className="w-full p-2 bg-white border rounded-xl text-xs font-bold" value={room.tenant?.phone || ''} onChange={e => handleTenantFieldChange(p.id, room.id, 'phone', e.target.value)} placeholder="600 000 000" title="Teléfono del inquilino" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[8px] font-black text-slate-400 uppercase">DNI / ID</label>
                                                                                <input type="text" className="w-full p-2 bg-white border rounded-xl text-xs font-bold font-mono" value={room.tenant?.idNumber || ''} onChange={e => handleTenantFieldChange(p.id, room.id, 'idNumber', e.target.value)} placeholder="00000000X" title="Identificación del inquilino" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[8px] font-black text-slate-400 uppercase">Fianza (€)</label>
                                                                                <input type="number" className="w-full p-2 bg-white border rounded-xl text-xs font-bold" value={room.tenant?.deposit || 0} onChange={e => handleTenantFieldChange(p.id, room.id, 'deposit', Number(e.target.value))} title="Fianza entregada" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[8px] font-black text-slate-400 uppercase">F. Inicio</label>
                                                                                <input type="text" className="w-full p-2 bg-white border rounded-xl text-xs font-bold" value={room.tenant?.startDate || ''} onChange={e => handleTenantFieldChange(p.id, room.id, 'startDate', e.target.value)} placeholder="01/01/2024" title="Fecha de inicio" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[8px] font-black text-slate-400 uppercase">F. Fin</label>
                                                                                <input type="text" className="w-full p-2 bg-white border rounded-xl text-xs font-bold" value={room.tenant?.endDate || ''} onChange={e => handleTenantFieldChange(p.id, room.id, 'endDate', e.target.value)} placeholder="31/12/2024" title="Fecha de fin" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="mb-6 space-y-2">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Historial de Auditoría</p>
                                                                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3 max-h-32 overflow-y-auto custom-scrollbar border border-slate-100">
                                                                        {(room.timeline || []).map(evt => (
                                                                            <div key={evt.id} className="flex gap-3 text-[10px] border-l-2 border-slate-200 pl-3">
                                                                                <span className="text-slate-400 font-mono tracking-tighter shrink-0">{evt.date}</span>
                                                                                <p className="text-slate-600"><span className={`font-black uppercase mr-1 ${evt.type === 'incident' ? 'text-red-500' : 'text-blue-500'}`}>{evt.type}:</span> {evt.text}</p>
                                                                            </div>
                                                                        ))}
                                                                        {(!room.timeline || room.timeline.length === 0) && <p className="text-[10px] italic text-slate-300 text-center py-2">Sin actividad reciente.</p>}
                                                                    </div>
                                                                </div>

                                                                <button onClick={() => window.open(room.driveUrl, '_blank')} disabled={!room.driveUrl} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${room.driveUrl ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                                                                    {room.driveUrl ? 'Ver Contrato en Drive' : 'Sin Link de Contrato'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {tab === 'management' && (
                                            <div className="space-y-8 animate-in fade-in">
                                                <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-200/20">
                                                    <div className="flex justify-between items-center mb-8">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User className="w-4 h-4 text-rentia-blue" /> Datos del Propietario</h4>
                                                        {owner?.gdpr?.signed ? <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-[10px] font-black border border-green-200 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> RGPD FIRMADO OK</span> : <span className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-[10px] font-black border border-red-200 flex items-center gap-2 animate-pulse"><AlertCircle className="w-4 h-4" /> PENDIENTE FIRMA RGPD</span>}
                                                    </div>
                                                    {owner ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                                            <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">Nombre</p><p className="font-bold text-slate-800">{owner.name || 'N/D'}</p></div>
                                                            <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">DNI</p><p className="font-bold text-slate-800 tracking-wider"><SensitiveDataDisplay value={owner.dni || ''} type="dni" /></p></div>
                                                            <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">IBAN</p><p className="font-mono text-xs font-bold text-slate-600"><SensitiveDataDisplay value={owner.bankAccount || ''} type="iban" /></p></div>
                                                            <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">Email</p><p className="font-bold text-slate-800"><SensitiveDataDisplay value={owner.email || ''} type="email" /></p></div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-center py-6 text-slate-400 italic bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">Sin propietario vinculado.</p>
                                                    )}
                                                    <div className="mt-8 bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-200/20">
                                                        <div className="flex justify-between items-center mb-6">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4 text-purple-600" /> Galería Zonas Comunes (Vivienda Completa)</h4>
                                                            <ImageUploader folder={`properties/${p.id}/common`} onUploadComplete={url => handleAddPropertyImage(p.id, url)} label="Subir Fotos Comunes" />
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
                                                            {(p.commonZonesImages || []).map((img, idx) => (
                                                                <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                                                    <img src={img} className="w-full h-full object-cover" alt="Común" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                        <button onClick={() => window.open(img, '_blank')} className="p-2 bg-white text-slate-900 rounded-xl shadow-lg hover:scale-110 transition-transform"><Plus className="w-3 h-3" /></button>
                                                                        <button onClick={() => handleRemovePropertyImage(p.id, img)} className="p-2 bg-red-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Trash2 className="w-3 h-3" /></button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(p.commonZonesImages || []).length === 0 && <p className="col-span-full py-10 text-center text-slate-400 italic text-xs border-2 border-dashed border-slate-100 rounded-3xl">Pulsa el botón para añadir fotos del salón, cocina y otras zonas comunes.</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    <div className="bg-white p-8 rounded-3xl border-2 border-slate-100">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Receipt className="w-4 h-4 text-amber-500" /> Facturas</h4>
                                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-3 custom-scrollbar">
                                                            {invoicesMap[p.id]?.map(inv => (
                                                                <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="p-3 bg-white rounded-xl shadow-sm"><span className="text-xs font-black uppercase text-amber-600">{inv.type}</span></div>
                                                                        <div><p className="text-base font-black text-slate-800">{inv.amount}€</p><p className="text-[10px] text-slate-400 font-bold">{inv.periodStart}</p></div>
                                                                    </div>
                                                                    <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-sm border border-slate-200"><ExternalLink className="w-5 h-5" /></a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-8 rounded-3xl border-2 border-slate-100">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Documentos</h4>
                                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-3 custom-scrollbar">
                                                            {documentsMap[p.id]?.map(doc => (
                                                                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="p-3 bg-white rounded-xl shadow-sm"><FileText className="w-5 h-5 text-slate-400" /></div>
                                                                        <div><p className="text-sm font-black text-slate-800">{doc.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{doc.type}</p></div>
                                                                    </div>
                                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-slate-400 hover:text-green-600 rounded-xl shadow-sm border border-slate-200"><Download className="w-5 h-5" /></a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-900 text-white p-8 rounded-3xl">
                                                    <h4 className="text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-8 flex items-center gap-2"><Settings className="w-5 h-5" /> Parámetros</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                        <div className="space-y-2"><label className="text-[10px] font-black text-indigo-400 uppercase">Dirección Publicable</label><input type="text" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm" value={p.address || ''} onChange={e => handlePropertyFieldChange(p.id, 'address', e.target.value)} /></div>
                                                        <div className="space-y-2"><label className="text-[10px] font-black text-indigo-400 uppercase">Comisión Rentia (%)</label><input type="number" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm" value={p.managementCommission || 10} onChange={e => handlePropertyFieldChange(p.id, 'managementCommission', Number(e.target.value))} /></div>
                                                        <div className="md:col-span-2 lg:col-span-3"><label className="text-[10px] font-black text-indigo-400 uppercase">Descripción SEO</label><textarea className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-sm h-32" value={p.description || ''} onChange={e => handlePropertyFieldChange(p.id, 'description', e.target.value)} /></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {tab === 'maintenance' && (
                                            <div className="space-y-8 animate-in fade-in">
                                                <div className="bg-white p-8 rounded-3xl border-2 border-slate-100">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><Hammer className="w-4 h-4" /> Mantenimiento</h4>
                                                    <div className="relative border-l-4 border-slate-100 ml-4 space-y-10 pl-8 pb-4">
                                                        {(p.maintenanceTimeline || []).map(evt => (
                                                            <div key={evt.id} className="relative">
                                                                <div className={`absolute -left-[42px] top-0 w-4 h-4 rounded-full border-4 border-white ${evt.type === 'incident' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                                    <span className="text-[10px] font-black block mb-3 uppercase opacity-50">{evt.date}</span>
                                                                    <p className="text-sm font-bold leading-relaxed">{evt.text}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 bg-slate-100 border-t flex justify-between items-center px-10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info className="w-4 h-4 text-rentia-blue" /> Cambios pendientes de sincronización</p>
                                        <button onClick={() => handleSaveAll(p.id)} disabled={saving} className="bg-rentia-blue text-white px-10 py-4 rounded-xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
                                            {saving ? <RefreshCw className="animate-spin" /> : <Save />}
                                            {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>


            {docPreview.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setDocPreview({ ...docPreview, isOpen: false })}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> {docPreview.title}</h3>
                            <button onClick={() => setDocPreview({ ...docPreview, isOpen: false })} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
                        </div>
                        <div className="flex-1 bg-slate-800 relative">
                            {docPreview.url ? <iframe src={docPreview.url} className="w-full h-full border-none" title="Vista previa" allow="autoplay" /> : <div className="absolute inset-0 flex items-center justify-center text-white italic">Error al cargar documento</div>}
                        </div>
                        <div className="p-4 bg-white border-t flex justify-end">
                            <button onClick={() => window.open(docPreview.url, '_blank')} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 text-sm"><ExternalLink className="w-4 h-4" /> ABRIR EN DRIVE</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};