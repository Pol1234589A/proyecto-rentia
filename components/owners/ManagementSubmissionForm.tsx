
import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Building2, User, MapPin, DollarSign, Camera, FileText, CheckCircle, ChevronRight, ChevronLeft, Calculator, AlertCircle, Info, Upload, Loader2, Save, Bed, Percent } from 'lucide-react';
import { ImageUploader } from '../admin/ImageUploader';
import { useLanguage } from '../../contexts/LanguageContext';

interface RoomInput {
    id: number;
    name: string;
    price: number;
    images: string[];
}

export const ManagementSubmissionForm: React.FC = () => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Temp ID for storage
    const [tempId] = useState(`MGMT_${Date.now()}_${Math.floor(Math.random()*1000)}`);

    // Form State
    const [contact, setContact] = useState({ name: '', email: '', phone: '', dni: '' });
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
    
    // Pricing
    const [traditionalPrice, setTraditionalPrice] = useState<number>(0);
    const [rooms, setRooms] = useState<RoomInput[]>([{ id: 1, name: 'Habitación 1', price: 0, images: [] }]);
    const [commonImages, setCommonImages] = useState<string[]>([]);

    // Calculator State
    const [numProperties, setNumProperties] = useState(1);
    const [referrals, setReferrals] = useState(0);

    // --- CALCULATOR LOGIC (Mirrored from DiscountsView) ---
    const calculateFee = () => {
        let base = 15;
        if (numProperties === 2) base = 14;
        else if (numProperties >= 3 && numProperties <= 5) base = 13;
        else if (numProperties >= 6 && numProperties <= 10) base = 12;
        else if (numProperties > 10) base = 10;
        
        const final = Math.max(10, base - (referrals * 0.5));
        return { final, standard: 15 };
    };
    const feeResult = calculateFee();

    // --- HANDLERS ---
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
        setLoading(true);
        try {
            await addDoc(collection(db, "management_leads"), {
                contact,
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
                images: {
                    common: commonImages,
                    // If rooms strategy, images are inside rooms array
                },
                calculatorData: {
                    declaredProperties: numProperties,
                    declaredReferrals: referrals,
                    estimatedFee: feeResult.final
                },
                status: 'new', // new -> contacted -> contract_signed -> approved
                createdAt: serverTimestamp(),
                tempId
            });
            setSuccess(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error(error);
            alert("Error al enviar la solicitud.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg w-full border border-green-100 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Gracias {contact.name}. Hemos recibido los datos de tu propiedad en <strong>{property.address}</strong>.
                        <br/><br/>
                        Nuestro equipo revisará la información. El siguiente paso será coordinar una visita técnica y la firma del contrato de colaboración.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                        <p className="text-sm text-blue-800 font-bold">Tarifa estimada para ti:</p>
                        <p className="text-3xl font-bold text-blue-600">{feeResult.final}% <span className="text-sm font-normal text-blue-400">+ IVA</span></p>
                    </div>
                    <button 
                        onClick={() => window.location.hash = '#/'} 
                        className="bg-rentia-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg w-full sm:w-auto"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans py-8 px-4">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-3">
                        <button 
                            onClick={() => window.location.hash = '#/'}
                            className="mt-1 p-1 text-gray-400 hover:text-rentia-blue hover:bg-blue-50 rounded-full transition-all"
                            aria-label="Volver"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-rentia-black font-display flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-rentia-blue" />
                                Publicar Propiedad para Gestión
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Déjanos los detalles y nos encargamos de todo.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium bg-gray-100 px-3 py-1.5 rounded-lg self-end md:self-auto">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-rentia-black text-white' : 'bg-gray-300'}`}>1</span>
                        <div className="w-4 h-0.5 bg-gray-300"></div>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-rentia-black text-white' : 'bg-gray-300'}`}>2</span>
                        <div className="w-4 h-0.5 bg-gray-300"></div>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-rentia-black text-white' : 'bg-gray-300'}`}>3</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    
                    {/* STEP 1: CONTACTO & CALCULADORA */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><User className="w-5 h-5 text-gray-400"/> Datos del Propietario</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo *</label>
                                            <input required type="text" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.name} onChange={e => setContact({...contact, name: e.target.value})} placeholder="Tu nombre" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono *</label>
                                            <input required type="tel" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} placeholder="+34 600..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                                            <input required type="email" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} placeholder="tu@email.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI / NIE</label>
                                            <input type="text" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.dni} onChange={e => setContact({...contact, dni: e.target.value})} placeholder="Para el contrato" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mini Calculator */}
                            <div className="lg:col-span-1">
                                <div className="bg-rentia-blue text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10"><Calculator className="w-5 h-5 text-rentia-gold"/> Tu Tarifa</h3>
                                    
                                    <div className="space-y-4 relative z-10">
                                        <div>
                                            <label className="text-xs font-bold text-blue-200 block mb-1">Propiedades a gestionar</label>
                                            <input type="range" min="1" max="15" value={numProperties} onChange={e => setNumProperties(Number(e.target.value))} className="w-full h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-rentia-gold" />
                                            <div className="flex justify-between text-xs font-bold mt-1"><span>1</span><span className="text-rentia-gold text-lg">{numProperties}</span><span>15+</span></div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-blue-200 block mb-1">Referidos traídos</label>
                                            <div className="flex items-center gap-3">
                                                <button type="button" onClick={() => setReferrals(Math.max(0, referrals - 1))} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold">-</button>
                                                <span className="text-xl font-bold">{referrals}</span>
                                                <button type="button" onClick={() => setReferrals(referrals + 1)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold">+</button>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-white/20">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm opacity-80">Tarifa Estándar</span>
                                                <span className="text-sm font-bold line-through opacity-60">15%</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-bold text-rentia-gold">Tu Tarifa</span>
                                                <span className="text-3xl font-bold text-white">{feeResult.final}%</span>
                                            </div>
                                            <p className="text-[10px] text-center mt-2 opacity-70">* Comisión sobre el alquiler mensual (+IVA)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: INMUEBLE & PRECIOS */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><MapPin className="w-5 h-5 text-gray-400"/> Datos del Inmueble</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Exacta *</label>
                                        <input required type="text" className="w-full p-3 border rounded-xl" value={property.address} onChange={e => setProperty({...property, address: e.target.value})} placeholder="Calle, Número, Planta, Puerta" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia Catastral</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={property.catastralRef} onChange={e => setProperty({...property, catastralRef: e.target.value})} placeholder="20 dígitos (del recibo IBI)" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estrategia Alquiler *</label>
                                        <select className="w-full p-3 border rounded-xl bg-white" value={property.rentalStrategy} onChange={e => setProperty({...property, rentalStrategy: e.target.value as any})}>
                                            <option value="rooms">Por Habitaciones (Más Rentable)</option>
                                            <option value="traditional">Tradicional (Piso Completo)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* PRECIOS & HABITACIONES */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Configuración de Precios</h4>
                                    
                                    {property.rentalStrategy === 'traditional' ? (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Mensual Deseado (€)</label>
                                            <input type="number" className="w-full p-3 border rounded-xl text-lg font-bold" value={traditionalPrice} onChange={e => setTraditionalPrice(Number(e.target.value))} placeholder="Ej: 800" />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {rooms.map((room, idx) => (
                                                <div key={room.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h5 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Bed className="w-4 h-4 text-rentia-blue"/> Habitación {idx + 1}</h5>
                                                        {rooms.length > 1 && <button type="button" onClick={() => removeRoom(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold">Eliminar</button>}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre / Tipo</label>
                                                            <input type="text" className="w-full p-2 border rounded-lg text-sm" value={room.name} onChange={e => updateRoom(idx, 'name', e.target.value)} placeholder="Ej: Grande con Balcón" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Precio (€)</label>
                                                            <input type="number" className="w-full p-2 border rounded-lg text-sm font-bold" value={room.price} onChange={e => updateRoom(idx, 'price', Number(e.target.value))} placeholder="300" />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fotos de la habitación</label>
                                                            <ImageUploader folder={`mgmt/${tempId}/room_${room.id}`} label="Subir Fotos Habitación" compact={true} onUploadComplete={(url) => handleRoomImageUpload(url, idx)} onlyFirebase={true} />
                                                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                                                {room.images.map((img, i) => (
                                                                    <img key={i} src={img} className="w-12 h-12 rounded object-cover border" />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={addRoom} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-rentia-blue hover:text-rentia-blue transition-colors">+ Añadir Habitación</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: FINANCIALS & DOCS & SEND */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                            
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><FileText className="w-5 h-5 text-gray-400"/> Datos Económicos y Estado</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IBI Anual (€)</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={property.ibi} onChange={e => setProperty({...property, ibi: e.target.value})} placeholder="Aprox" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Comunidad (€/mes)</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={property.communityFee} onChange={e => setProperty({...property, communityFee: e.target.value})} placeholder="Cuota mensual" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Derramas Pendientes</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={property.derramas} onChange={e => setProperty({...property, derramas: e.target.value})} placeholder="Si/No (Importe)" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observaciones Extra</label>
                                        <textarea className="w-full p-3 border rounded-xl h-24 resize-none" value={property.observations} onChange={e => setProperty({...property, observations: e.target.value})} placeholder="Estado de la vivienda, si tiene ascensor, si necesita reforma..." />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                                    <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2"><Camera className="w-4 h-4"/> Fotos Generales (Salón, Cocina, Baños...)</h4>
                                    <ImageUploader folder={`mgmt/${tempId}/common`} label="Subir Fotos Zonas Comunes" onUploadComplete={(url) => setCommonImages(prev => [...prev, url])} onlyFirebase={true} />
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {commonImages.map((img, i) => (
                                            <img key={i} src={img} className="w-20 h-20 rounded-lg object-cover border border-gray-200 shadow-sm" />
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-sm text-yellow-800 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold mb-1">Aviso Importante</p>
                                        <p>Para publicar tu propiedad en nuestra plataforma, es necesario firmar un contrato de colaboración y seguir nuestro protocolo de calidad (visita técnica). Al enviar este formulario, solicitas la valoración de tu inmueble por nuestro equipo.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NAVIGATION BUTTONS */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg flex justify-between items-center max-w-4xl mx-auto md:static md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-8">
                        <button 
                            type="button" 
                            onClick={() => setStep(step > 1 ? step - 1 : 1)}
                            className={`px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors ${step === 1 ? 'invisible' : ''}`}
                        >
                            <span className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Atrás</span>
                        </button>
                        
                        {step < 3 ? (
                            <button 
                                type="button" 
                                onClick={() => setStep(step + 1)}
                                disabled={step === 1 && (!contact.name || !contact.phone)}
                                className="bg-rentia-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                Siguiente <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Enviar Solicitud
                            </button>
                        )}
                    </div>

                </form>
            </div>
            {/* Spacer for fixed bottom nav on mobile */}
            <div className="h-20 md:hidden"></div>
        </div>
    );
};
