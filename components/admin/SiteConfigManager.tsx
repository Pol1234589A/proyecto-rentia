
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SiteConfig, useConfig } from '../../contexts/ConfigContext';
import { Settings, Save, Globe, Users, Loader2, Image as ImageIcon } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

export const SiteConfigManager: React.FC = () => {
    const configContext = useConfig();
    const [config, setConfig] = useState<SiteConfig>(configContext);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');

    useEffect(() => {
        // Cargar desde Firestore para edición (para tener la versión más reciente si hubo cambios fuera del contexto)
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

            <div className="flex border-b border-gray-100">
                <button onClick={() => setActiveTab('general')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'general' ? 'text-rentia-blue border-b-2 border-rentia-blue' : 'text-gray-500'}`}>Datos Generales & Redes</button>
                <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'team' ? 'text-rentia-blue border-b-2 border-rentia-blue' : 'text-gray-500'}`}>Equipo y Horarios</button>
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
            </div>
        </div>
    );
};
