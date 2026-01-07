
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SiteConfig, useConfig, SeasonalEvent, RoomsAlertConfig } from '../../contexts/ConfigContext';
import { Settings, Save, Globe, Users, Loader2, Image as ImageIcon, Calendar, Plus, Trash2, Edit, Eye, Smartphone, Monitor, Info, Megaphone, AlertTriangle, CheckCircle, CreditCard, ToggleLeft, ToggleRight, Layout, AlertOctagon, Hammer } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

// Componente Preview para el "Canvas" Hero
const HeroCanvas: React.FC<{ event: SeasonalEvent, mode: 'desktop' | 'mobile' }> = ({ event, mode }) => {
    return (
        <div className={`relative overflow-hidden rounded-lg border-4 border-gray-800 bg-black shadow-2xl transition-all duration-300 mx-auto ${mode === 'mobile' ? 'w-[320px] h-[500px]' : 'w-full h-[400px]'}`}>
             {/* Header Mockup */}
             <div className="absolute top-0 left-0 right-0 h-16 bg-transparent z-20 border-b border-white/10 flex justify-between items-center px-4">
                 <div className="h-6 w-20 bg-white/20 rounded"></div>
                 <div className="flex gap-2">
                     <div className="h-6 w-6 bg-white/20 rounded-full"></div>
                     <div className="h-6 w-6 bg-white/20 rounded-full"></div>
                 </div>
             </div>

             {/* Background Image */}
             <div className="absolute inset-0 z-0">
                 {event.heroImage ? (
                     <img src={event.heroImage} className="w-full h-full object-cover" alt="Hero Preview" />
                 ) : (
                     <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600 font-bold">Sin Imagen</div>
                 )}
                 {/* Overlay personalizado */}
                 <div 
                    className="absolute inset-0" 
                    style={{ backgroundColor: event.overlayColor, opacity: event.overlayOpacity }}
                 ></div>
                 <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
             </div>

             {/* Content */}
             <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pt-16">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-bold uppercase tracking-wider text-[10px] mb-4">
                     Evento Especial
                  </span>
                  <h1 className="text-white font-bold font-display leading-tight drop-shadow-lg mb-4 transition-all"
                      style={{ fontSize: mode === 'mobile' ? '24px' : '40px' }}
                  >
                      {event.heroTitle || "Título del Evento"}
                  </h1>
                  <p className="text-gray-100 font-light max-w-lg mx-auto drop-shadow-md"
                     style={{ fontSize: mode === 'mobile' ? '14px' : '18px' }}
                  >
                      {event.heroSubtitle || "Subtítulo descriptivo de la temporada..."}
                  </p>
                  
                  <div className="mt-8 flex gap-2">
                      <div className="h-10 w-32 bg-rentia-blue rounded-lg shadow-lg"></div>
                      <div className="h-10 w-32 bg-white/10 border border-white/30 rounded-lg"></div>
                  </div>
             </div>
             
             {/* Device Label */}
             <div className="absolute bottom-2 left-0 right-0 text-center">
                 <span className="text-[10px] text-white/50 uppercase tracking-widest">{mode === 'mobile' ? 'Vista Móvil' : 'Vista Escritorio'}</span>
             </div>
        </div>
    );
};

// Componente Preview para el "Canvas" de Alerta
const AlertCanvas: React.FC<{ alertConfig: RoomsAlertConfig }> = ({ alertConfig }) => {
    const getStyles = () => {
        switch (alertConfig.variant) {
            case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            default: return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    const getIcon = () => {
        switch (alertConfig.variant) {
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            case 'error': return <Info className="w-5 h-5" />;
            case 'success': return <CheckCircle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getIconBg = () => {
         switch (alertConfig.variant) {
            case 'warning': return 'bg-yellow-100 text-yellow-600';
            case 'error': return 'bg-red-100 text-red-600';
            case 'success': return 'bg-green-100 text-green-600';
            default: return 'bg-white text-rentia-blue';
        }
    }

    if (!alertConfig.isActive) {
        return (
            <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 bg-gray-50 h-32">
                <p className="text-sm">El aviso está desactivado. No se mostrará nada.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 text-center">Vista Previa en Vivo (Página Habitaciones)</p>
            <div className={`border rounded-xl p-4 flex items-start gap-3 shadow-sm ${getStyles()}`}>
                <div className={`p-2 rounded-full shrink-0 shadow-sm ${getIconBg()}`}>
                    {getIcon()}
                </div>
                <div>
                    <h4 className="font-bold text-sm">{alertConfig.title || 'Título del Aviso'}</h4>
                    <p className="text-sm mt-1 leading-relaxed opacity-90">{alertConfig.message || 'Contenido del mensaje...'}</p>
                </div>
            </div>
        </div>
    );
};


export const SiteConfigManager: React.FC = () => {
    const configContext = useConfig();
    const [config, setConfig] = useState<SiteConfig>(configContext);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'team' | 'events' | 'rooms_alert' | 'system'>('general');

    // Estado local para edición de eventos
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [eventForm, setEventForm] = useState<SeasonalEvent | null>(null);
    const [canvasMode, setCanvasMode] = useState<'desktop' | 'mobile'>('desktop');
    const [newHoliday, setNewHoliday] = useState('');

    useEffect(() => {
        const load = async () => {
            const docRef = doc(db, "app_config", "general");
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setConfig(snap.data() as SiteConfig);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, "app_config", "general"), config);
            alert("Configuración guardada y actualizada en toda la web.");
        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
        } finally {
            setLoading(false);
        }
    };

    const handleTeamImage = (id: 'admin' | 'director', url: string) => {
        if (id === 'admin') {
            setConfig(prev => ({ ...prev, adminContact: { ...prev.adminContact, image: url } }));
        } else {
            setConfig(prev => ({ ...prev, directorContact: { ...prev.directorContact, image: url } }));
        }
    };

    // --- EVENTS LOGIC ---
    const startEditEvent = (event?: SeasonalEvent) => {
        if (event) {
            setEventForm({ ...event });
            setEditingEventId(event.id);
        } else {
            setEventForm({
                id: Date.now().toString(),
                name: 'Nuevo Evento',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                heroTitle: '¡Felices Fiestas!',
                heroSubtitle: 'RentiaRoom os desea una feliz navidad y próspero año nuevo.',
                heroImage: '',
                overlayColor: '#000000',
                overlayOpacity: 0.4,
                isActive: true
            });
            setEditingEventId('new');
        }
    };

    const saveEventForm = () => {
        if (!eventForm) return;
        let newEvents = [...(config.seasonalEvents || [])];
        if (editingEventId === 'new') {
            newEvents.push(eventForm);
        } else {
            newEvents = newEvents.map(ev => ev.id === editingEventId ? eventForm : ev);
        }
        setConfig({ ...config, seasonalEvents: newEvents });
        setEditingEventId(null);
        setEventForm(null);
    };

    const deleteEvent = (id: string) => {
        if (confirm("¿Borrar este evento?")) {
            setConfig({ ...config, seasonalEvents: config.seasonalEvents.filter(e => e.id !== id) });
        }
    };

    // --- HOLIDAYS LOGIC ---
    const addHoliday = () => {
        if (!newHoliday) return;
        if (config.holidays?.includes(newHoliday)) return alert("Fecha ya existe");
        const updated = [...(config.holidays || []), newHoliday].sort();
        setConfig({ ...config, holidays: updated });
        setNewHoliday('');
    };

    const removeHoliday = (date: string) => {
        setConfig({ ...config, holidays: config.holidays.filter(h => h !== date) });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-rentia-blue" />
                    Configuración Global Web
                </h3>
                <button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    Guardar Cambios
                </button>
            </div>

            <div className="flex border-b border-gray-100 overflow-x-auto">
                <button onClick={() => setActiveTab('general')} className={`flex-1 py-3 px-4 text-sm font-bold whitespace-nowrap ${activeTab === 'general' ? 'text-rentia-blue border-b-2 border-rentia-blue' : 'text-gray-500'}`}>Datos Generales</button>
                <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 px-4 text-sm font-bold whitespace-nowrap ${activeTab === 'team' ? 'text-rentia-blue border-b-2 border-rentia-blue' : 'text-gray-500'}`}>Equipo</button>
                <button onClick={() => setActiveTab('system')} className={`flex-1 py-3 px-4 text-sm font-bold whitespace-nowrap ${activeTab === 'system' ? 'text-rentia-blue border-b-2 border-rentia-blue' : 'text-gray-500'}`}>Sistema y SEO</button>
                <button onClick={() => setActiveTab('events')} className={`flex-1 py-3 px-4 text-sm font-bold whitespace-nowrap ${activeTab === 'events' ? 'text-rentia-blue border-b-2 border-rentia-blue' : 'text-gray-500'}`}>Festivos & Eventos</button>
                <button onClick={() => setActiveTab('rooms_alert')} className={`flex-1 py-3 px-4 text-sm font-bold whitespace-nowrap ${activeTab === 'rooms_alert' ? 'text-rentia-blue border-b-2 border-rentia-blue' : 'text-gray-500'}`}>Avisos Habitaciones</button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto">
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email General</label>
                                <input type="text" className="w-full p-2 border rounded" value={config.general.email} onChange={e => setConfig({...config, general: {...config.general, email: e.target.value}})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Física</label>
                                <input type="text" className="w-full p-2 border rounded" value={config.general.address} onChange={e => setConfig({...config, general: {...config.general, address: e.target.value}})} />
                            </div>
                        </div>

                        <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2 mt-4 border-b pb-2"><Globe className="w-4 h-4"/> Redes Sociales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Instagram URL</label><input type="text" className="w-full p-2 border rounded text-xs" value={config.general.instagram} onChange={e => setConfig({...config, general: {...config.general, instagram: e.target.value}})} /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Facebook URL</label><input type="text" className="w-full p-2 border rounded text-xs" value={config.general.facebook} onChange={e => setConfig({...config, general: {...config.general, facebook: e.target.value}})} /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">LinkedIn URL</label><input type="text" className="w-full p-2 border rounded text-xs" value={config.general.linkedin} onChange={e => setConfig({...config, general: {...config.general, linkedin: e.target.value}})} /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">TikTok URL</label><input type="text" className="w-full p-2 border rounded text-xs" value={config.general.tiktok} onChange={e => setConfig({...config, general: {...config.general, tiktok: e.target.value}})} /></div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="space-y-8 animate-in fade-in">
                        
                        {/* SEO */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600"/> SEO y Metadatos</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Web Principal</label>
                                    <input type="text" className="w-full p-2 border rounded text-sm" value={config.seo?.siteTitle} onChange={e => setConfig({...config, seo: {...config.seo, siteTitle: e.target.value}})} placeholder="RentiaRoom..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción Meta Global</label>
                                    <textarea className="w-full p-2 border rounded text-sm h-20 resize-none" value={config.seo?.metaDescription} onChange={e => setConfig({...config, seo: {...config.seo, metaDescription: e.target.value}})} placeholder="Descripción para Google..." />
                                </div>
                            </div>
                        </div>

                        {/* MÓDULOS Y MANTENIMIENTO */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Layout className="w-5 h-5 text-purple-600"/> Control de Módulos (Visibilidad y Mantenimiento)</h4>
                            
                            <div className="space-y-4">
                                {/* Blog Controls */}
                                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-700">Módulo Blog</span>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                                            <span>Visible</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-rentia-blue" checked={config.modules?.showBlog} onChange={e => setConfig({...config, modules: {...config.modules, showBlog: e.target.checked}})} />
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-orange-600">
                                            <span>Mantenimiento</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-orange-500" checked={config.modules?.maintenanceBlog} onChange={e => setConfig({...config, modules: {...config.modules, maintenanceBlog: e.target.checked}})} />
                                        </label>
                                    </div>
                                </div>

                                {/* Discounts Controls */}
                                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-700">Módulo Descuentos</span>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                                            <span>Visible</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-rentia-blue" checked={config.modules?.showDiscounts} onChange={e => setConfig({...config, modules: {...config.modules, showDiscounts: e.target.checked}})} />
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-orange-600">
                                            <span>Mantenimiento</span>
                                            <input type="checkbox" className="w-4 h-4 rounded text-orange-500" checked={config.modules?.maintenanceDiscounts} onChange={e => setConfig({...config, modules: {...config.modules, maintenanceDiscounts: e.target.checked}})} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MANTENIMIENTO GLOBAL */}
                        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                            <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2"><AlertOctagon className="w-5 h-5"/> Zona de Peligro</h4>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-sm font-bold text-red-800">Modo Mantenimiento GLOBAL</span>
                                    <p className="text-xs text-red-600 mt-1">Si activas esto, TODA la web pública mostrará una pantalla de "En construcción". Solo los administradores podrán acceder.</p>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={config.modules?.maintenanceMode} onChange={e => setConfig({...config, modules: {...config.modules, maintenanceMode: e.target.checked}})} />
                                    <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </div>
                            </label>
                        </div>

                    </div>
                )}
                
                {/* ... (Other tabs remain the same as previous code) ... */}
                {activeTab === 'team' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* ADMIN CARD */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4"/> Perfil Administración (Sandra)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Nombre Visible</label><input type="text" className="w-full p-2 border rounded" value={config.adminContact.name} onChange={e => setConfig({...config, adminContact: {...config.adminContact, name: e.target.value}})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Cargo / Rol</label><input type="text" className="w-full p-2 border rounded" value={config.adminContact.role} onChange={e => setConfig({...config, adminContact: {...config.adminContact, role: e.target.value}})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Teléfono (WhatsApp)</label><input type="text" className="w-full p-2 border rounded" value={config.adminContact.phone} onChange={e => setConfig({...config, adminContact: {...config.adminContact, phone: e.target.value}})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Mensaje Default WhatsApp</label><input type="text" className="w-full p-2 border rounded text-xs" value={config.adminContact.whatsappMessage} onChange={e => setConfig({...config, adminContact: {...config.adminContact, whatsappMessage: e.target.value}})} /></div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Hora Inicio</label><input type="number" className="w-full p-2 border rounded" value={config.adminContact.startHour} onChange={e => setConfig({...config, adminContact: {...config.adminContact, startHour: Number(e.target.value)}})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Hora Fin</label><input type="number" className="w-full p-2 border rounded" value={config.adminContact.endHour} onChange={e => setConfig({...config, adminContact: {...config.adminContact, endHour: Number(e.target.value)}})} /></div>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Foto Perfil (Opcional)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border">
                                            {config.adminContact.image ? <img src={config.adminContact.image} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-gray-400 text-xs">Sin foto</span>}
                                        </div>
                                        <div className="flex-1">
                                            <ImageUploader folder="config/team" label="Cambiar Foto" compact={true} onUploadComplete={(url) => handleTeamImage('admin', url)} onlyFirebase={true} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DIRECTOR CARD */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4"/> Perfil Dirección (Pol)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Nombre Visible</label><input type="text" className="w-full p-2 border rounded" value={config.directorContact.name} onChange={e => setConfig({...config, directorContact: {...config.directorContact, name: e.target.value}})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Cargo / Rol</label><input type="text" className="w-full p-2 border rounded" value={config.directorContact.role} onChange={e => setConfig({...config, directorContact: {...config.directorContact, role: e.target.value}})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Teléfono (WhatsApp)</label><input type="text" className="w-full p-2 border rounded" value={config.directorContact.phone} onChange={e => setConfig({...config, directorContact: {...config.directorContact, phone: e.target.value}})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Mensaje Default WhatsApp</label><input type="text" className="w-full p-2 border rounded text-xs" value={config.directorContact.whatsappMessage} onChange={e => setConfig({...config, directorContact: {...config.directorContact, whatsappMessage: e.target.value}})} /></div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Hora Inicio</label><input type="number" className="w-full p-2 border rounded" value={config.directorContact.startHour} onChange={e => setConfig({...config, directorContact: {...config.directorContact, startHour: Number(e.target.value)}})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Hora Fin</label><input type="number" className="w-full p-2 border rounded" value={config.directorContact.endHour} onChange={e => setConfig({...config, directorContact: {...config.directorContact, endHour: Number(e.target.value)}})} /></div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Foto Perfil (Opcional)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border">
                                            {config.directorContact.image ? <img src={config.directorContact.image} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-gray-400 text-xs">Sin foto</span>}
                                        </div>
                                        <div className="flex-1">
                                            <ImageUploader folder="config/team" label="Cambiar Foto" compact={true} onUploadComplete={(url) => handleTeamImage('director', url)} onlyFirebase={true} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'events' && (
                    <div className="animate-in fade-in space-y-8">
                        {/* 1. DÍAS FESTIVOS (CIERRE) */}
                        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                            <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5"/> Días de Cierre (Festivos)
                            </h4>
                            <p className="text-sm text-red-600 mb-4">Añade los días que la empresa estará cerrada. Se mostrará un aviso en la web.</p>
                            
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="date" 
                                    className="p-2 border rounded-lg text-sm" 
                                    value={newHoliday} 
                                    onChange={(e) => setNewHoliday(e.target.value)} 
                                />
                                <button onClick={addHoliday} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">Añadir Festivo</button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(config.holidays || []).map(date => (
                                    <div key={date} className="bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                                        {new Date(date).toLocaleDateString()}
                                        <button onClick={() => removeHoliday(date)} className="hover:text-red-900"><Trash2 className="w-3 h-3"/></button>
                                    </div>
                                ))}
                                {(!config.holidays || config.holidays.length === 0) && <span className="text-gray-400 text-xs italic">No hay festivos configurados.</span>}
                            </div>
                        </div>

                        {/* 2. PROGRAMADOR DE TEMPORADA (Navidad, etc) */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2"><ImageIcon className="w-5 h-5 text-rentia-blue"/> Campañas & Eventos Temporales</h4>
                                {!eventForm && (
                                    <button onClick={() => startEditEvent()} className="bg-rentia-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                                        <Plus className="w-4 h-4"/> Nueva Campaña
                                    </button>
                                )}
                            </div>

                            {/* EDITOR / PREVIEWER SPLIT SCREEN */}
                            {eventForm ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    
                                    {/* Left: Controls */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                                            <h5 className="font-bold text-gray-700">Editar Campaña: {eventForm.name}</h5>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEventForm(null)} className="text-xs text-gray-500 font-bold px-3 py-1.5 rounded bg-white border border-gray-200 hover:bg-gray-100">Cancelar</button>
                                                <button onClick={saveEventForm} className="text-xs text-white font-bold px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 flex items-center gap-1"><Save className="w-3 h-3"/> Aplicar</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Interno</label>
                                            <input type="text" className="w-full p-2 border rounded text-sm" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} placeholder="Navidad 2025" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Inicio</label>
                                                <input type="date" className="w-full p-2 border rounded text-sm" value={eventForm.startDate} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Fin</label>
                                                <input type="date" className="w-full p-2 border rounded text-sm" value={eventForm.endDate} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                                            <h6 className="text-xs font-bold text-rentia-blue uppercase">Diseño Portada (Hero)</h6>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Título Grande</label>
                                                <input type="text" className="w-full p-2 border rounded text-sm font-bold" value={eventForm.heroTitle} onChange={e => setEventForm({...eventForm, heroTitle: e.target.value})} />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Subtítulo</label>
                                                <textarea className="w-full p-2 border rounded text-sm h-16 resize-none" value={eventForm.heroSubtitle} onChange={e => setEventForm({...eventForm, heroSubtitle: e.target.value})} />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-2">Imagen de Fondo</label>
                                                <ImageUploader 
                                                    folder="config/events" 
                                                    label="Subir Fondo" 
                                                    onUploadComplete={(url) => setEventForm({...eventForm, heroImage: url})} 
                                                    compact={false}
                                                    onlyFirebase={true}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Color Overlay</label>
                                                    <div className="flex gap-2 items-center">
                                                        <input type="color" className="h-8 w-12 rounded border" value={eventForm.overlayColor} onChange={e => setEventForm({...eventForm, overlayColor: e.target.value})} />
                                                        <span className="text-xs text-gray-400">{eventForm.overlayColor}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Opacidad ({eventForm.overlayOpacity})</label>
                                                    <input type="range" min="0" max="1" step="0.1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={eventForm.overlayOpacity} onChange={e => setEventForm({...eventForm, overlayOpacity: Number(e.target.value)})} />
                                                </div>
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-gray-200">
                                            <input type="checkbox" checked={eventForm.isActive} onChange={e => setEventForm({...eventForm, isActive: e.target.checked})} className="w-4 h-4 rounded text-rentia-blue" />
                                            <span className="text-sm font-bold text-gray-700">Activar Evento</span>
                                        </label>
                                    </div>

                                    {/* Right: Canvas Preview */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-full flex justify-between items-center mb-2 px-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase">Vista Previa en Vivo (Canvas)</span>
                                            <div className="flex bg-gray-200 rounded p-0.5">
                                                <button onClick={() => setCanvasMode('desktop')} className={`p-1.5 rounded ${canvasMode === 'desktop' ? 'bg-white shadow' : 'text-gray-500'}`}><Monitor className="w-4 h-4"/></button>
                                                <button onClick={() => setCanvasMode('mobile')} className={`p-1.5 rounded ${canvasMode === 'mobile' ? 'bg-white shadow' : 'text-gray-500'}`}><Smartphone className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full flex justify-center bg-gray-200 rounded-xl p-8 min-h-[500px] border border-gray-300">
                                            <HeroCanvas event={eventForm} mode={canvasMode} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* List of Events */
                                <div className="space-y-4">
                                    {(config.seasonalEvents || []).map(event => (
                                        <div key={event.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-10 rounded bg-gray-100 overflow-hidden border border-gray-200 relative">
                                                    {event.heroImage ? <img src={event.heroImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800"></div>}
                                                    <div className="absolute inset-0" style={{ backgroundColor: event.overlayColor, opacity: event.overlayOpacity }}></div>
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-gray-800">{event.name}</h5>
                                                    <p className="text-xs text-gray-500">{event.startDate} - {event.endDate}</p>
                                                </div>
                                                {event.isActive && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACTIVO</span>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => startEditEvent(event)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4"/></button>
                                                <button onClick={() => deleteEvent(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!config.seasonalEvents || config.seasonalEvents.length === 0) && (
                                        <div className="text-center py-10 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            No hay campañas creadas.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'rooms_alert' && (
                     <div className="animate-in fade-in grid grid-cols-1 xl:grid-cols-2 gap-8">
                         {/* Controls */}
                         <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-rentia-blue"/> Configuración del Aviso</h4>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={config.roomsAlert.isActive} 
                                                onChange={e => setConfig({...config, roomsAlert: {...config.roomsAlert, isActive: e.target.checked}})} 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rentia-blue"></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Mostrar Aviso en Catálogo</span>
                                    </label>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título del Aviso</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" 
                                            value={config.roomsAlert.title} 
                                            onChange={e => setConfig({...config, roomsAlert: {...config.roomsAlert, title: e.target.value}})}
                                            placeholder="Ej: Aviso de Actualización"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje</label>
                                        <textarea 
                                            className="w-full p-2.5 border rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-rentia-blue outline-none" 
                                            value={config.roomsAlert.message} 
                                            onChange={e => setConfig({...config, roomsAlert: {...config.roomsAlert, message: e.target.value}})}
                                            placeholder="Ej: Estamos añadiendo nuevas habitaciones..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Estilo / Variante</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            <button onClick={() => setConfig({...config, roomsAlert: {...config.roomsAlert, variant: 'info'}})} className={`p-2 rounded border text-center text-xs font-bold ${config.roomsAlert.variant === 'info' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Azul (Info)</button>
                                            <button onClick={() => setConfig({...config, roomsAlert: {...config.roomsAlert, variant: 'warning'}})} className={`p-2 rounded border text-center text-xs font-bold ${config.roomsAlert.variant === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-2 ring-yellow-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Amarillo (Aviso)</button>
                                            <button onClick={() => setConfig({...config, roomsAlert: {...config.roomsAlert, variant: 'error'}})} className={`p-2 rounded border text-center text-xs font-bold ${config.roomsAlert.variant === 'error' ? 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Rojo (Urgente)</button>
                                            <button onClick={() => setConfig({...config, roomsAlert: {...config.roomsAlert, variant: 'success'}})} className={`p-2 rounded border text-center text-xs font-bold ${config.roomsAlert.variant === 'success' ? 'bg-green-50 border-green-500 text-green-700 ring-2 ring-green-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Verde (Éxito)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* Canvas Preview */}
                         <div className="flex flex-col items-center justify-start pt-6">
                             <AlertCanvas alertConfig={config.roomsAlert} />
                             <p className="mt-4 text-xs text-gray-400 text-center max-w-xs">
                                 Así se verá el aviso en la parte superior de la página de "Habitaciones" si está activado.
                             </p>
                         </div>
                     </div>
                )}
            </div>
        </div>
    );
};
