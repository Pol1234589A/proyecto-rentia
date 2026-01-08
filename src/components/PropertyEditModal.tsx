import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Property, Room } from '../data/rooms';
import { ImageUploader } from './admin/ImageUploader';
import {
    Edit, Save, X, Loader2, MapPin, Building, Bath, Layout,
    Wind, Tv, Lock, Monitor, Users, BedDouble,
    Droplets, History, Info, Sparkles, Calendar, Percent,
    Camera, Video, Trash2, Film, Plus, Clipboard, Fan, ShieldCheck
} from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../utils/imageOptimizer';

interface PropertyEditModalProps {
    property: Property;
    initialRoomId?: string;
    onClose: () => void;
    onSave: (updatedProperty: Property) => Promise<void>;
}

export const PropertyEditModal: React.FC<PropertyEditModalProps> = ({ property, initialRoomId, onClose, onSave }) => {
    const [editedProperty, setEditedProperty] = useState<Property>(property);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'rooms' | 'media' | 'filters'>(initialRoomId ? 'rooms' : 'info');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';

        if (initialRoomId) {
            setTimeout(() => {
                const element = document.getElementById(`room-edit-${initialRoomId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-4', 'ring-rentia-blue/30', 'border-rentia-blue');
                    setTimeout(() => {
                        element.classList.remove('ring-4', 'ring-rentia-blue/30');
                    }, 3000);
                }
            }, 600);
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalProperty = {
                ...editedProperty,
                adType: 'professional' as const
            };
            await onSave(finalProperty);
            onClose();
        } catch (error) {
            console.error("Error saving property:", error);
            alert("Error al guardar cambios.");
        } finally {
            setSaving(false);
        }
    };

    const updateRoom = (roomId: string, field: keyof Room, value: any) => {
        setEditedProperty(prev => ({
            ...prev,
            rooms: prev.rooms.map((r: Room) => r.id === roomId ? { ...r, [field]: value } : r)
        }));
    };

    const toggleRoomFeature = (roomId: string, feature: string) => {
        setEditedProperty(prev => ({
            ...prev,
            rooms: prev.rooms.map((r: Room) => {
                if (r.id !== roomId) return r;
                const features = r.features || [];
                const newFeatures = features.includes(feature)
                    ? features.filter(f => f !== feature)
                    : [...features, feature];
                return { ...r, features: newFeatures };
            })
        }));
    };

    const togglePropertyFeature = (feature: string) => {
        setEditedProperty(prev => {
            const features = prev.features || [];
            const newFeatures = features.includes(feature)
                ? features.filter(f => f !== feature)
                : [...features, feature];
            return { ...prev, features: newFeatures };
        });
    };

    const removeRoomImage = (roomId: string, imageUrl: string) => {
        setEditedProperty(prev => ({
            ...prev,
            rooms: prev.rooms.map((r: Room) => {
                if (r.id !== roomId) return r;
                return { ...r, images: (r.images || []).filter(img => img !== imageUrl) };
            })
        }));
    };

    const addRoomImage = (roomId: string, imageUrl: string) => {
        setEditedProperty(prev => ({
            ...prev,
            rooms: prev.rooms.map((r: Room) => {
                if (r.id !== roomId) return r;
                return { ...r, images: [...(r.images || []), imageUrl] };
            })
        }));
    };



    const removeCommonZoneImage = (imageUrl: string) => {
        setEditedProperty(prev => ({
            ...prev,
            commonZonesImages: (prev.commonZonesImages || []).filter(img => img !== imageUrl)
        }));
    };

    const addCommonZoneImage = (imageUrl: string) => {
        setEditedProperty(prev => ({
            ...prev,
            commonZonesImages: [...(prev.commonZonesImages || []), imageUrl]
        }));
    };

    const addNewRoom = () => {
        const newRoom: Room = {
            id: `ROOM_${Date.now()}`,
            name: `Habitación ${editedProperty.rooms.length + 1}`,
            price: 0,
            status: 'available',
            expenses: 'A repartir',
            features: [],
            images: [],
            description: '',
            availableFrom: new Date().toISOString().split('T')[0]
        };
        setEditedProperty(prev => ({
            ...prev,
            rooms: [...prev.rooms, newRoom]
        }));
    };

    const deleteRoom = (roomId: string) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar esta habitación? Esta acción no se puede deshacer de forma sencilla.")) return;
        setEditedProperty(prev => ({
            ...prev,
            rooms: prev.rooms.filter(r => r.id !== roomId)
        }));
    };

    const handlePasteToRoom = async (e: React.ClipboardEvent, roomId: string) => {
        const items = e.clipboardData.items;
        const filesToUpload: File[] = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file && file.type.startsWith('image/')) {
                    filesToUpload.push(file);
                }
            }
        }

        if (filesToUpload.length > 0) {
            e.preventDefault();
            // Notificamos visualmente que algo está pasando (opcional, pero mejora UX)
            console.log("Subiendo imágenes pegadas...");

            for (const file of filesToUpload) {
                try {
                    let blobToUpload: Blob = file;
                    // Solo comprimimos si no es GIF
                    if (!file.type.includes('gif')) {
                        blobToUpload = await compressImage(file);
                    }

                    const ext = blobToUpload.type === 'image/webp' ? 'webp' : (file.type.split('/')[1] || 'bin');
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
                    const storageRef = ref(storage, `rooms/${roomId}/images/${fileName}`);

                    const uploadTask = uploadBytesResumable(storageRef, blobToUpload);

                    uploadTask.on('state_changed', null,
                        (error) => {
                            console.error("Error subiendo imagen pegada:", error);
                            alert("Error al subir imagen pegada.");
                        },
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            addRoomImage(roomId, url);
                        }
                    );
                } catch (err) {
                    console.error("Fallo al procesar imagen pegada:", err);
                }
            }
        }
    };

    const propertyFeatures = [
        { id: 'lift', label: 'Ascensor' },
        { id: 'terrace', label: 'Terraza' },
        { id: 'exterior', label: 'Exterior' },
        { id: 'accessible', label: 'Accesible' },
        { id: 'garden', label: 'Jardín' },
        { id: 'pool', label: 'Piscina' },
        { id: 'owner_lives', label: 'Propietario Vive' },
        { id: 'balcony', label: 'Balcón' },
    ];

    if (!mounted) return null;

    const modalLayout = (
        <div className="fixed inset-0 z-[99999] flex items-start md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in text-gray-900 overflow-y-auto custom-scrollbar">
            <div className="bg-white rounded-none md:rounded-xl shadow-2xl w-full max-w-5xl min-h-screen md:min-h-0 md:max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/80 sticky top-0 z-20 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-rentia-blue p-2 rounded-lg text-white">
                            <Building className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg text-gray-900 leading-tight">Panel de Edición Rápida</h3>
                            <p className="text-xs text-gray-500 font-medium">{editedProperty.address}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-white border-b overflow-x-auto no-scrollbar sticky top-[73px] z-20">
                    {[
                        { id: 'info', label: 'General & Admin', icon: <Info className="w-4 h-4" /> },
                        { id: 'rooms', label: 'Habitaciones', icon: <Layout className="w-4 h-4" /> },
                        { id: 'media', label: 'Fotos y Vídeos', icon: <Camera className="w-4 h-4" /> },
                        { id: 'filters', label: 'Filtros Propietario', icon: <Sparkles className="w-4 h-4" /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-rentia-blue text-rentia-blue bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar">
                    {activeTab === 'info' ? (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Información Principal</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dirección Visible</label>
                                        <input
                                            type="text"
                                            value={editedProperty.address}
                                            onChange={e => setEditedProperty({ ...editedProperty, address: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/20 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 leading-relaxed">Descripción Pública (Idealista Style)</label>
                                        <textarea
                                            value={editedProperty.description || ''}
                                            onChange={e => setEditedProperty({ ...editedProperty, description: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg h-28 resize-none text-sm leading-relaxed"
                                            placeholder="Introduce el texto que verán los clientes..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 font-sans">Ciudad</label>
                                        <input
                                            type="text"
                                            value={editedProperty.city}
                                            onChange={e => setEditedProperty({ ...editedProperty, city: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Configuración Administrativa</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Bath className="w-3 h-3" /> Baños Totales</label>
                                        <input
                                            type="number"
                                            value={editedProperty.bathrooms || 1}
                                            onChange={e => setEditedProperty({ ...editedProperty, bathrooms: Number(e.target.value) })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Día Entrega</label>
                                        <input
                                            type="number"
                                            min="1" max="31"
                                            value={editedProperty.transferDay || ''}
                                            onChange={e => setEditedProperty({ ...editedProperty, transferDay: Number(e.target.value) })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold"
                                            placeholder="5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1 text-rentia-blue"><Percent className="w-3 h-3" /> % Comisión</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={editedProperty.managementCommission || ''}
                                            onChange={e => setEditedProperty({ ...editedProperty, managementCommission: Number(e.target.value) })}
                                            className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-bold text-rentia-blue"
                                            placeholder="10"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Comunidad & Notas Internas</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-501 uppercase mb-1">Contacto Administración</label>
                                        <input
                                            type="text"
                                            value={editedProperty.communityInfo?.adminContact || ''}
                                            onChange={e => setEditedProperty({
                                                ...editedProperty,
                                                communityInfo: { ...(editedProperty.communityInfo || {}), adminContact: e.target.value }
                                            })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Nombre Admin"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-501 uppercase mb-1">Teléfono Admin / Comunidad</label>
                                        <input
                                            type="text"
                                            value={editedProperty.communityInfo?.presidentPhone || ''}
                                            onChange={e => setEditedProperty({
                                                ...editedProperty,
                                                communityInfo: { ...(editedProperty.communityInfo || {}), presidentPhone: e.target.value }
                                            })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                                            placeholder="Teléfono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-501 uppercase mb-1">Nombre del Seguro</label>
                                        <input
                                            type="text"
                                            value={editedProperty.communityInfo?.insuranceName || ''}
                                            onChange={e => setEditedProperty({
                                                ...editedProperty,
                                                communityInfo: { ...(editedProperty.communityInfo || {}), insuranceName: e.target.value }
                                            })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Ej: Mapfre"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-501 uppercase mb-1">Teléfono del Seguro</label>
                                        <input
                                            type="text"
                                            value={editedProperty.communityInfo?.insurancePhone || ''}
                                            onChange={e => setEditedProperty({
                                                ...editedProperty,
                                                communityInfo: { ...(editedProperty.communityInfo || {}), insurancePhone: e.target.value }
                                            })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                                            placeholder="Teléfono Seguro"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-501 uppercase mb-1 font-sans">Notas Internas (Admin Only)</label>
                                        <textarea
                                            value={editedProperty.internalNotes || ''}
                                            onChange={e => setEditedProperty({ ...editedProperty, internalNotes: e.target.value })}
                                            className="w-full p-2.5 bg-yellow-50/20 border border-yellow-100 rounded-lg h-20 resize-none text-sm leading-relaxed"
                                            placeholder="Datos privados sobre la gestión..."
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : activeTab === 'media' ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">
                            {/* Property Main Image */}
                            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                            <Camera className="w-5 h-5 text-rentia-blue" />
                                            Portada Principal del Inmueble
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">Esta imagen aparecerá en los listados y como miniatura principal.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                                        {editedProperty.image ? (
                                            <>
                                                <img src={editedProperty.image} alt="Portada" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setEditedProperty({ ...editedProperty, image: '' })}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                                <Camera className="w-10 h-10 opacity-20" />
                                                <span className="text-[10px] font-bold uppercase tracking-tighter">Sin Foto de Portada</span>
                                            </div>
                                        )}
                                    </div>
                                    <ImageUploader
                                        folder={`properties/${editedProperty.id}`}
                                        onUploadComplete={(url) => setEditedProperty({ ...editedProperty, image: url })}
                                        label="Cambiar Foto de Portada"
                                    />
                                </div>
                            </section>

                            {/* ZONAS COMUNES */}
                            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                            <Users className="w-5 h-5 text-rentia-blue" />
                                            Zonas Comunes (Salón, Cocina, Baños...)
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">Sube aquí fotos generales de la casa que no sean de habitaciones específicas.</p>
                                    </div>
                                    <ImageUploader
                                        folder={`properties/${editedProperty.id}/common`}
                                        onUploadComplete={addCommonZoneImage}
                                        label="Añadir Fotos Zonas Comunes"
                                        compact
                                    />
                                </div>

                                <div
                                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 outline-none"
                                    tabIndex={0}
                                    onPaste={async (e) => {
                                        const items = e.clipboardData.items;
                                        const filesToUpload: File[] = [];
                                        for (let i = 0; i < items.length; i++) {
                                            if (items[i].kind === 'file') {
                                                const file = items[i].getAsFile();
                                                if (file && file.type.startsWith('image/')) filesToUpload.push(file);
                                            }
                                        }
                                        if (filesToUpload.length > 0) {
                                            e.preventDefault();
                                            // Feedback visual básico (cursor)
                                            document.body.style.cursor = 'wait';

                                            for (const file of filesToUpload) {
                                                try {
                                                    let blobToUpload: Blob = file;
                                                    if (file.type.startsWith('image/') && !file.type.includes('gif')) {
                                                        try {
                                                            blobToUpload = await compressImage(file);
                                                        } catch (e) {
                                                            console.warn("Fallo compresión, usando original", e);
                                                        }
                                                    }

                                                    const isWebP = blobToUpload.type === 'image/webp';
                                                    const ext = isWebP ? 'webp' : (file.type.split('/')[1] || 'bin');
                                                    const finalFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

                                                    const formData = new FormData();
                                                    formData.append('file', blobToUpload, finalFileName);

                                                    const response = await fetch('/api/upload-hostinger', {
                                                        method: 'POST',
                                                        body: formData
                                                    });

                                                    if (!response.ok) throw new Error('Error subiendo imagen');
                                                    const data = await response.json();

                                                    addCommonZoneImage(data.url);
                                                } catch (err) {
                                                    console.error("Error upload paste:", err);
                                                    alert("Error al subir imagen pegada. Revisa la consola.");
                                                }
                                            }
                                            document.body.style.cursor = 'default';
                                        }
                                    }}
                                >
                                    {(editedProperty.commonZonesImages || []).map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group border border-gray-100 ring-offset-2 hover:ring-2 hover:ring-rentia-blue/50 transition-all">
                                            <img src={img} alt={`Common Zone ${i}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeCommonZoneImage(img)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!editedProperty.commonZonesImages || editedProperty.commonZonesImages.length === 0) && (
                                        <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
                                            <Users className="w-8 h-8 text-gray-300" />
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No hay fotos de zonas comunes</p>
                                            <p className="text-[10px] text-rentia-blue font-bold mt-2">Usa el botón de arriba a la derecha para subir o pegar fotos</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Rooms Media Management */}

                            {/* Rooms Media Management */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Galerías Individuales (Habitaciones)</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {editedProperty.rooms.map((room: Room) => (
                                        <div
                                            key={room.id}
                                            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 focus-within:ring-2 focus-within:ring-rentia-blue/20 transition-all outline-none"
                                            onPaste={(e) => handlePasteToRoom(e, room.id)}
                                            tabIndex={0}
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gray-900 text-white w-6 h-6 rounded flex items-center justify-center text-[10px] font-black">{room.name}</span>
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 uppercase text-xs tracking-tight">Multimedia - {room.name}</h5>
                                                        <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1 mt-0.5"><Clipboard className="w-2.5 h-2.5" /> Haz clic aquí y pulsa Ctrl+V para pegar fotos</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <ImageUploader
                                                        folder={`rooms/${room.id}/images`}
                                                        onUploadComplete={(url) => addRoomImage(room.id, url)}
                                                        label="Añadir Fotos"
                                                        compact
                                                    />
                                                    <ImageUploader
                                                        folder={`rooms/${room.id}/video`}
                                                        onUploadComplete={(url) => updateRoom(room.id, 'video', url)}
                                                        label="Subir Vídeo"
                                                        accept="video/*"
                                                        compact
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {/* Video Thumbnail if exists */}
                                                {room.video && (
                                                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 group ring-2 ring-rentia-blue ring-offset-2">
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                            <Film className="w-6 h-6 text-white animate-pulse" />
                                                        </div>
                                                        <button
                                                            onClick={() => updateRoom(room.id, 'video', '')}
                                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                        <div className="absolute bottom-1 left-1 bg-rentia-blue text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase">VÍDEO</div>
                                                    </div>
                                                )}

                                                {/* Images List */}
                                                {(room.images || []).map((img: string, i: number) => (
                                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border border-gray-100 hover:border-rentia-blue/40 transition-colors">
                                                        <img src={img} alt={`Room ${room.name} ${i}`} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => removeRoomImage(room.id, img)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                        {i === 0 && <div className="absolute top-1 left-1 bg-gray-900/60 backdrop-blur-sm text-[7px] text-white px-1 py-0.5 rounded font-bold uppercase">Fav</div>}
                                                    </div>
                                                ))}

                                                {(!room.images || room.images.length === 0) && !room.video && (
                                                    <div className="col-span-full py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Habitación sin contenido multimedia</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'filters' ? (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Parámetros del Inmueble</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Tipo de Planta</label>
                                        <select
                                            value={editedProperty.floorType || 'intermediate'}
                                            onChange={e => setEditedProperty({ ...editedProperty, floorType: e.target.value as any })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-white transition-colors"
                                        >
                                            <option value="intermediate">Planta Intermedia</option>
                                            <option value="top">Última Planta / Ático</option>
                                            <option value="ground">Bajo / Entreplanta</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Tipo de Anuncio</label>
                                        <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-black text-rentia-blue flex items-center justify-between">
                                            <span>PROFESIONAL (RENTIA)</span>
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {editedProperty.floorType === 'intermediate' && (
                                    <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Piso / Altura</label>
                                            <input
                                                type="text"
                                                value={editedProperty.floor || ''}
                                                onChange={e => setEditedProperty({ ...editedProperty, floor: e.target.value })}
                                                placeholder="Ej: 3º"
                                                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-rentia-blue/20 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Letra / Puerta</label>
                                            <input
                                                type="text"
                                                value={editedProperty.door || ''}
                                                onChange={e => setEditedProperty({ ...editedProperty, door: e.target.value })}
                                                placeholder="Ej: B"
                                                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-rentia-blue/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3">Características Generales</label>
                                    <div className="flex flex-wrap gap-2">
                                        {propertyFeatures.map(feat => (
                                            <button
                                                key={feat.id}
                                                onClick={() => togglePropertyFeature(feat.id)}
                                                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${editedProperty.features?.includes(feat.id) ? 'bg-rentia-black text-white border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                                            >
                                                {feat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <Layout className="w-5 h-5 text-rentia-blue" />
                                        Gestión de Habitaciones
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">Configura el precio, estado y disponibilidad de cada unidad.</p>
                                </div>
                                <button
                                    onClick={addNewRoom}
                                    className="flex items-center gap-2 bg-rentia-black text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-rentia-blue transition-all shadow-lg active:scale-95 group"
                                >
                                    <Plus className="w-4 h-4 text-rentia-gold group-hover:rotate-90 transition-transform" />
                                    Añadir Habitación
                                </button>
                            </div>

                            {editedProperty.rooms.length === 0 && (
                                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">No hay habitaciones añadidas</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1 mb-6">Esta propiedad aún no tiene habitaciones registradas. Pulsa el botón de arriba para añadir la primera.</p>
                                    <button
                                        onClick={addNewRoom}
                                        className="bg-rentia-blue text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-rentia-blue/20 hover:scale-105 transition-transform"
                                    >
                                        Crear Primera Habitación
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {editedProperty.rooms.map((room: Room, idx: number) => (
                                    <div key={room.id} id={`room-edit-${room.id}`} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-rentia-blue/30 transition-all group overflow-hidden relative text-gray-900">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -translate-y-12 translate-x-12 group-hover:bg-blue-50 transition-colors"></div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-black text-sm">{idx + 1}</span>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{room.name}</h4>
                                                    <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Habitación</span>
                                                </div>
                                            </div>
                                            <select
                                                value={room.status}
                                                onChange={e => updateRoom(room.id, 'status', e.target.value)}
                                                className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full border transition-colors cursor-pointer outline-none ${room.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                                            >
                                                <option value="available">Disponible</option>
                                                <option value="occupied">Alquilada</option>
                                                <option value="reserved">Reservada</option>
                                            </select>
                                            <button
                                                onClick={() => deleteRoom(room.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Eliminar Habitación"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase font-black mb-1">Fianza / Precio (€)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={room.price}
                                                        onChange={e => updateRoom(room.id, 'price', Number(e.target.value))}
                                                        className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm font-black text-rentia-blue pl-6"
                                                    />
                                                    <span className="absolute left-2 top-2 text-rentia-blue/40 font-bold text-xs">€</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                                                    {room.status === 'occupied' ? 'Se libera el (dd/mm/aaaa)' : 'Disponibilidad'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={room.availableFrom || ''}
                                                    onChange={e => updateRoom(room.id, 'availableFrom', e.target.value)}
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                                                    placeholder="Ej: 01/05/2025"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Perfil Buscado</label>
                                                <select
                                                    value={room.targetProfile || 'both'}
                                                    onChange={e => updateRoom(room.id, 'targetProfile', e.target.value)}
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                                                >
                                                    <option value="both">Estudiantes y trabajadores</option>
                                                    <option value="students">Estudiantes</option>
                                                    <option value="workers">Trabajadores</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Sexo (Convivencia)</label>
                                                <select
                                                    value={room.gender || 'both'}
                                                    onChange={e => updateRoom(room.id, 'gender', e.target.value)}
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                                                >
                                                    <option value="both">Indiferente / Mixto</option>
                                                    <option value="male">Solo Chicos</option>
                                                    <option value="female">Solo Chicas</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Tipo de Cama</label>
                                                <select
                                                    value={room.bedType || 'single'}
                                                    onChange={e => updateRoom(room.id, 'bedType', e.target.value)}
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                                                >
                                                    <option value="single">Individual</option>
                                                    <option value="double">Doble</option>
                                                    <option value="king">Premium / 2 Camas</option>
                                                    <option value="sofa">Sofá Cama</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Gestión Gastos</label>
                                                <select
                                                    value={room.expenses || 'Gastos fijos aparte'}
                                                    onChange={e => updateRoom(room.id, 'expenses', e.target.value)}
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                                                >
                                                    <option value="Gastos fijos aparte">Fijos Aparte</option>
                                                    <option value="Se reparten los gastos">A Repartir</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-1.5 relative z-10">
                                            {[
                                                { id: 'lock', icon: <Lock className="w-3 h-3" />, label: 'Llave' },
                                                { id: 'smart_tv', icon: <Tv className="w-3 h-3" />, label: 'TV' },
                                                { id: 'desk', icon: <Monitor className="w-3 h-3" />, label: 'Mesa' },
                                                { id: 'private_bath', icon: <Droplets className="w-3 h-3" />, label: 'Baño' },
                                                { id: 'couples_allowed', icon: <Users className="w-3 h-3" />, label: 'Parejas' },
                                                { id: 'pets_allowed', icon: <Sparkles className="w-3 h-3" />, label: 'Mascotas' },
                                                { id: 'smoking_allowed', icon: <Info className="w-3 h-3" />, label: 'Fumar' },
                                                { id: 'window_street', icon: <Layout className="w-3 h-3" />, label: 'Ventana' },
                                                { id: 'balcony', icon: <Layout className="w-3 h-3" />, label: 'Balcón' },
                                            ].map(feat => (
                                                <button
                                                    key={feat.id}
                                                    onClick={() => toggleRoomFeature(room.id, feat.id)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight border transition-all ${room.features?.includes(feat.id) ? 'bg-rentia-blue text-white border-transparent' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-400'}`}
                                                >
                                                    {feat.icon}
                                                    {feat.label}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => updateRoom(room.id, 'hasAirConditioning', !room.hasAirConditioning)}
                                                className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight border transition-all ${room.hasAirConditioning ? 'bg-blue-500 text-white border-transparent' : 'bg-white text-gray-400 border-gray-100'}`}
                                            >
                                                <Wind className="w-3 h-3" />
                                                A/C
                                            </button>
                                            <button
                                                onClick={() => updateRoom(room.id, 'hasFan', !room.hasFan)}
                                                className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight border transition-all ${room.hasFan ? 'bg-orange-500 text-white border-transparent' : 'bg-white text-gray-400 border-gray-100'}`}
                                            >
                                                <Fan className="w-3 h-3" />
                                                Ventilador
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] sticky bottom-0 z-20">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <History className="w-4 h-4" />
                        ID Propiedad: <span className="text-gray-600 font-mono uppercase">{editedProperty.id}</span>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 md:flex-none px-6 py-2.5 text-gray-600 hover:text-gray-900 font-black text-sm transition-colors border-2 border-transparent hover:border-gray-200 rounded-xl"
                        >
                            Ignorar Cambios
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 md:flex-none px-10 py-3 bg-rentia-black hover:bg-black text-white rounded-xl font-black text-sm shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'PROCESANDO...' : 'SINCRONIZAR CAMBIOS'}
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );

    return createPortal(modalLayout, document.body);
};
