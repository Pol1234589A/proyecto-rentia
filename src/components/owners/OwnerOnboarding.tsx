
import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, MapPin, DollarSign, Camera, FileText, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, ShieldCheck, Bed, Save, Loader2 } from 'lucide-react';
import { ImageUploader } from '../admin/ImageUploader';

interface RoomInput {
    id: number;
    name: string;
    price: number;
    images: string[];
}

export const OwnerOnboarding: React.FC = () => {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [tempId] = useState(`ONB_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

    // User Contact Info (to update profile if needed)
    const [contact, setContact] = useState({
        phone: '',
        dni: ''
    });

    // Property Data
    const [property, setProperty] = useState({
        address: '',
        city: 'Murcia',
        type: 'Piso',
        rentalStrategy: 'rooms' as 'rooms' | 'traditional',
        catastralRef: '',
        ibi: '',
        communityFee: '',
        derramas: '',
        observations: ''
    });

    // Pricing & Rooms
    const [traditionalPrice, setTraditionalPrice] = useState<number>(0);
    const [rooms, setRooms] = useState<RoomInput[]>([{ id: 1, name: 'Habitación 1', price: 0, images: [] }]);
    const [commonImages, setCommonImages] = useState<string[]>([]);

    // Documents
    const [documents, setDocuments] = useState({
        dniFront: '',
        dniBack: '',
        escritura: '',
        bankCertificate: '',
        insurancePolicy: '', // Nueva: Seguro
        energyCertificate: '', // Nueva: CEE
        habitabilityCert: '' // Nueva: Cédula
    });

    // Handlers
    const addRoom = () => {
        setRooms([...rooms, { id: Date.now(), name: `Habitación ${rooms.length + 1}`, price: 0, images: [] }]);
    };

    const removeRoom = (index: number) => {
        if (rooms.length === 1) return;
        setRooms(rooms.filter((_, i) => i !== index));
    };

    const updateRoom = (index: number, field: keyof RoomInput, value: any) => {
        const newRooms = [...rooms];
        // @ts-ignore
        newRooms[index][field] = value;
        setRooms(newRooms);
    };

    const handleRoomImageUpload = (url: string, index: number) => {
        const newRooms = [...rooms];
        newRooms[index].images.push(url);
        setRooms(newRooms);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);

        try {
            // 1. Actualizar perfil del usuario con teléfono/DNI si los puso
            await updateDoc(doc(db, "users", currentUser.uid), {
                phone: contact.phone,
                dni: contact.dni,
                onboardingCompleted: true
            }).catch(console.warn);

            // 2. Crear Lead de Gestión
            await addDoc(collection(db, "management_leads"), {
                contact: {
                    name: currentUser.displayName,
                    email: currentUser.email,
                    phone: contact.phone,
                    dni: contact.dni
                },
                property,
                pricing: {
                    strategy: property.rentalStrategy,
                    traditionalPrice: property.rentalStrategy === 'traditional' ? traditionalPrice : null,
                    rooms: property.rentalStrategy === 'rooms' ? rooms : null
                },
                financials: {
                    ibi: property.ibi,
                    communityFee: property.communityFee,
                    derramas: property.derramas
                },
                documents,
                images: { common: commonImages },
                status: 'new', // Esto hará que salga en pendientes
                createdAt: serverTimestamp(),
                tempId,
                linkedOwnerId: currentUser.uid,
                source: 'owner_onboarding_wizard'
            });

            // El Dashboard principal detectará el nuevo lead y mostrará la pantalla de "En Revisión"
            alert("Propiedad registrada y documentación enviada. El equipo validará tus datos.");
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Error al guardar. Verifica tu conexión e inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-blue-50 text-rentia-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Alta de Nueva Propiedad</h2>
                <p className="text-gray-500 text-sm mt-1">Completa los datos de tu vivienda para comenzar la gestión.</p>
            </div>

            {/* Stepper */}
            <div className="flex justify-center mb-8">
                <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-rentia-black text-white' : 'bg-gray-100 text-gray-400'}`}>1</span>
                    <div className={`w-12 h-1 ${step >= 2 ? 'bg-rentia-black' : 'bg-gray-100'}`}></div>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-rentia-black text-white' : 'bg-gray-100 text-gray-400'}`}>2</span>
                    <div className={`w-12 h-1 ${step >= 3 ? 'bg-rentia-black' : 'bg-gray-100'}`}></div>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-rentia-black text-white' : 'bg-gray-100 text-gray-400'}`}>3</span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* STEP 1: DATOS PROPIEDAD Y CONTACTO */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Información Básica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Exacta de la Vivienda *</label>
                                <input required type="text" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={property.address} onChange={e => setProperty({ ...property, address: e.target.value })} placeholder="Calle, Número, Piso, Puerta..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono de Contacto (Propietario) *</label>
                                <input required type="tel" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} placeholder="+34 600..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI / NIE (Titular) *</label>
                                <input required type="text" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.dni} onChange={e => setContact({ ...contact, dni: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia Catastral (20 Caracteres) *</label>
                                <input required type="text" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors uppercase font-mono tracking-wider" minLength={20} maxLength={20} value={property.catastralRef} onChange={e => setProperty({ ...property, catastralRef: e.target.value.toUpperCase() })} placeholder="0000000000XX000000XX" />
                                <p className="text-[10px] text-gray-400 mt-1">Necesario para contrato y suministros.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estrategia Alquiler</label>
                                <select className="w-full p-3 border rounded-xl bg-white" value={property.rentalStrategy} onChange={e => setProperty({ ...property, rentalStrategy: e.target.value as any })}>
                                    <option value="rooms">Por Habitaciones (Recomendado)</option>
                                    <option value="traditional">Tradicional (Piso Completo)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: FINANCIEROS Y FOTOS */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Precios y Fotos</h3>

                        {/* Configuración Habitaciones */}
                        {property.rentalStrategy === 'rooms' ? (
                            <div className="space-y-4">
                                {rooms.map((room, idx) => (
                                    <div key={room.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-sm text-gray-700">Habitación {idx + 1}</h4>
                                            {rooms.length > 1 && <button type="button" onClick={() => removeRoom(idx)} className="text-red-500 text-xs font-bold">Eliminar</button>}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input type="text" className="p-2 border rounded-lg text-sm" value={room.name} onChange={e => updateRoom(idx, 'name', e.target.value)} placeholder="Nombre (Ej: Doble con Balcón)" />
                                            <input type="number" className="p-2 border rounded-lg text-sm" value={room.price} onChange={e => updateRoom(idx, 'price', Number(e.target.value))} placeholder="Precio (€)" />
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Fotos Habitación</label>
                                                <ImageUploader folder={`onb/${tempId}/room_${room.id}`} label="Subir Fotos" compact={true} onUploadComplete={(url) => handleRoomImageUpload(url, idx)} onlyFirebase={true} />
                                                <div className="flex gap-2 mt-2 overflow-x-auto">
                                                    {room.images.map((img, i) => <img key={i} src={img} className="w-10 h-10 rounded object-cover border" />)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addRoom} className="w-full py-3 border-2 border-dashed rounded-xl text-gray-500 font-bold hover:text-rentia-blue hover:border-rentia-blue">+ Añadir Habitación</button>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Mensual Deseado (€)</label>
                                <input type="number" className="w-full p-3 border rounded-xl font-bold" value={traditionalPrice} onChange={e => setTraditionalPrice(Number(e.target.value))} />
                            </div>
                        )}

                        <div className="pt-4 border-t">
                            <h4 className="font-bold text-gray-800 mb-2">Fotos Zonas Comunes</h4>
                            <ImageUploader folder={`onb/${tempId}/common`} label="Subir Salón, Cocina, Baños..." onUploadComplete={(url) => setCommonImages(prev => [...prev, url])} onlyFirebase={true} />
                            <div className="flex gap-2 mt-2">
                                {commonImages.map((img, i) => <img key={i} src={img} className="w-16 h-16 rounded object-cover border" />)}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">IBI (Anual)</label>
                                <input type="text" className="w-full p-2 border rounded-lg text-sm" value={property.ibi} onChange={e => setProperty({ ...property, ibi: e.target.value })} placeholder="Ej: 300€" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comunidad (Mes)</label>
                                <input type="text" className="w-full p-2 border rounded-lg text-sm" value={property.communityFee} onChange={e => setProperty({ ...property, communityFee: e.target.value })} placeholder="Ej: 50€" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Derramas</label>
                                <input type="text" className="w-full p-2 border rounded-lg text-sm" value={property.derramas} onChange={e => setProperty({ ...property, derramas: e.target.value })} placeholder="Importe" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: DOCUMENTACIÓN */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Documentación Legal</h3>
                        <p className="text-xs text-gray-500">Sube fotos o PDFs. Necesario para formalizar el contrato de gestión.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <label className="text-xs font-bold block mb-2">DNI / NIE (Frontal)</label>
                                <ImageUploader folder={`onb/${tempId}/docs`} label="Subir Archivo" compact={true} onUploadComplete={(url) => setDocuments({ ...documents, dniFront: url })} onlyFirebase={true} />
                                {documents.dniFront && <span className="text-green-600 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Subido</span>}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <label className="text-xs font-bold block mb-2">DNI / NIE (Trasera)</label>
                                <ImageUploader folder={`onb/${tempId}/docs`} label="Subir Archivo" compact={true} onUploadComplete={(url) => setDocuments({ ...documents, dniBack: url })} onlyFirebase={true} />
                                {documents.dniBack && <span className="text-green-600 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Subido</span>}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <label className="text-xs font-bold block mb-2">Escritura / Nota Simple</label>
                                <ImageUploader folder={`onb/${tempId}/docs`} label="Subir Archivo" compact={true} accept="image/*,.pdf" onUploadComplete={(url) => setDocuments({ ...documents, escritura: url })} onlyFirebase={true} />
                                {documents.escritura && <span className="text-green-600 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Subido</span>}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <label className="text-xs font-bold block mb-2">Certificado Bancario (IBAN)</label>
                                <ImageUploader folder={`onb/${tempId}/docs`} label="Subir Archivo" compact={true} accept="image/*,.pdf" onUploadComplete={(url) => setDocuments({ ...documents, bankCertificate: url })} onlyFirebase={true} />
                                {documents.bankCertificate && <span className="text-green-600 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Subido</span>}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <label className="text-xs font-bold block mb-2">Seguro de Hogar (Vigente)</label>
                                <ImageUploader folder={`onb/${tempId}/docs`} label="Subir Póliza" compact={true} accept="image/*,.pdf" onUploadComplete={(url) => setDocuments({ ...documents, insurancePolicy: url })} onlyFirebase={true} />
                                {documents.insurancePolicy && <span className="text-green-600 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Subido</span>}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <label className="text-xs font-bold block mb-2">Certificado Energético (CEE)</label>
                                <ImageUploader folder={`onb/${tempId}/docs`} label="Subir Certificado" compact={true} accept="image/*,.pdf" onUploadComplete={(url) => setDocuments({ ...documents, energyCertificate: url })} onlyFirebase={true} />
                                {documents.energyCertificate && <span className="text-green-600 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Subido</span>}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border">
                                <label className="text-xs font-bold block mb-2">Cédula de Habitabilidad</label>
                                <ImageUploader folder={`onb/${tempId}/docs`} label="Subir Cédula" compact={true} accept="image/*,.pdf" onUploadComplete={(url) => setDocuments({ ...documents, habitabilityCert: url })} onlyFirebase={true} />
                                {documents.habitabilityCert && <span className="text-green-600 text-xs font-bold flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Subido</span>}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-between pt-4 border-t border-gray-100">
                    {step > 1 ? (
                        <button type="button" onClick={() => setStep(step - 1)} className="text-gray-500 font-bold px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"> Atrás</button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button type="button" onClick={() => setStep(step + 1)} disabled={step === 1 && (!property.address || !contact.phone)} className="bg-rentia-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-2">
                            Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="submit" disabled={loading} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-70">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Enviar a Revisión
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
