
import React, { useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { Building2, User, MapPin, DollarSign, Camera, FileText, CheckCircle, ChevronRight, ChevronLeft, Calculator, AlertCircle, Info, Upload, Loader2, Save, Bed, Percent, ShieldCheck, Lock } from 'lucide-react';
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
    const [authError, setAuthError] = useState<string | null>(null);

    // Temp ID for storage
    const [tempId] = useState(`MGMT_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    const [userIp, setUserIp] = useState('0.0.0.0');

    // Get User IP for GDPR/DOI Evidence
    React.useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setUserIp(data.ip))
            .catch(err => console.error("Error fetching IP:", err));
    }, []);

    // Form State
    const [contact, setContact] = useState({ name: '', email: '', phone: '', dni: '', password: '' });
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

    // Legal Consent
    const [gdprAccepted, setGdprAccepted] = useState(false);

    // Pricing
    const [traditionalPrice, setTraditionalPrice] = useState<number>(0);
    const [rooms, setRooms] = useState<RoomInput[]>([{ id: 1, name: 'Habitación 1', price: 0, images: [] }]);
    const [commonImages, setCommonImages] = useState<string[]>([]);
    const [documents, setDocuments] = useState({
        dniFront: '',
        dniBack: '',
        escritura: '',
        bankCertificate: ''
    });

    // Calculator State
    const [numProperties, setNumProperties] = useState(1);
    const [referrals, setReferrals] = useState(0);

    // --- CALCULATOR LOGIC ---
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
        if (!gdprAccepted) return alert("Debes aceptar el consentimiento de tratamiento de datos.");
        if (contact.password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");

        setLoading(true);
        setAuthError(null);

        try {
            let user;
            try {
                // Intento 1: Crear nuevo usuario
                const userCredential = await createUserWithEmailAndPassword(auth, contact.email, contact.password);
                user = userCredential.user;
                await updateProfile(user, { displayName: contact.name });
            } catch (authError: any) {
                // Si el email ya existe, intentamos loguearlo con la misma pass (Flujo Resiliente)
                if (authError.code === 'auth/email-already-in-use') {
                    const userCredential = await signInWithEmailAndPassword(auth, contact.email, contact.password);
                    user = userCredential.user;
                    console.log("Usuario ya existía, continuando con sesión activa.");
                } else {
                    throw authError; // Re-lanzar si es otro tipo de error de auth
                }
            }

            if (!user) throw new Error("No se pudo establecer la identidad del usuario.");

            // 2. ENVIAR VERIFICACIÓN DE EMAIL (DOBLE OPT-IN - LSSI/RGPD)
            const actionCodeSettings = {
                // Forzamos el dominio .com para evitar errores con .es o localhost en producción
                url: `https://www.rentiaroom.com/auth/action`,
                handleCodeInApp: true,
            };
            await sendEmailVerification(user, actionCodeSettings);

            // 3. Crear Perfil en Firestore (users collection)
            await setDoc(doc(db, "users", user.uid), {
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                dni: contact.dni,
                role: 'owner',
                active: true,
                emailVerified: false,
                doubleOptIn: {
                    ip: userIp,
                    acceptedAt: serverTimestamp(),
                    verificationSent: true
                },
                createdAt: serverTimestamp()
            }, { merge: true });

            // 4. Crear Lead de Gestión (Vinculado)
            await addDoc(collection(db, "management_leads"), {
                contact: { name: contact.name, email: contact.email, phone: contact.phone, dni: contact.dni },
                property,
                pricing: {
                    strategy: property.rentalStrategy,
                    traditionalPrice: property.rentalStrategy === 'traditional' ? traditionalPrice : null,
                    rooms: property.rentalStrategy === 'rooms' ? rooms : null
                },
                financials: { ibi: property.ibi, communityFee: property.communityFee, derramas: property.derramas },
                documents,
                images: { common: commonImages },
                calculatorData: {
                    declaredProperties: numProperties,
                    declaredReferrals: referrals,
                    estimatedFee: feeResult.final
                },
                consent: {
                    accepted: true,
                    date: serverTimestamp(),
                    ip: userIp,
                    legalText: "Acepto el tratamiento de mis datos personales conforme al RGPD y la LSSI-CE (Doble Opt-In).",
                    version: "v2.1_ES_LEGAL"
                },
                status: 'new',
                createdAt: serverTimestamp(),
                tempId,
                linkedOwnerId: user.uid
            });

            setSuccess(true);
            window.scrollTo(0, 0);

        } catch (error: any) {
            console.error(error);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (error.code === 'auth/email-already-in-use' || error.message?.includes("email-already-in-use")) {
                setAuthError("Este correo electrónico ya está registrado. Por favor, revisa tu contraseña.");
            } else if (error.code === 'auth/wrong-password') {
                setAuthError("El email ya está registrado pero la contraseña es incorrecta. Por favor, usa la misma contraseña de tu cuenta.");
            } else {
                setAuthError("Error: " + (error.message || "Por favor, inténtalo de nuevo."));
            }
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Casi listo! Revisa tu email</h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Hemos enviado un <strong className="font-bold text-gray-900">correo de verificación</strong> a {contact.email}.
                        <br />
                        Para cumplir con la normativa de protección de datos (Doble Opt-In), es necesario que hagas clic en el enlace del correo <strong className="font-bold text-gray-900">antes de poder acceder</strong> a tu panel completo.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-left animate-pulse">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-900 leading-tight">IMPORTANTE: Revisa tu carpeta de Correo no deseado (SPAM)</p>
                            <p className="text-xs text-amber-800 mt-1">Si no recibes el correo en los próximos 2 minutos, busca en tu carpeta de SPAM o Promociones.</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-left">
                        <p className="text-[11px] text-blue-800 font-bold uppercase mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Aviso Legal LSSI-CE:</p>
                        <p className="text-[9px] text-blue-700/70 leading-tight italic">
                            Le informamos que sus datos serán tratados por Rentia Investments S.L. para la gestión de su solicitud.
                            La cuenta no será plenamente operativa hasta que no se valide la propiedad del correo mediante el enlace enviado.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 justify-center">
                        <button
                            onClick={() => window.location.href = '/intranet'}
                            className="bg-rentia-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            Ir al Área de Acceso
                        </button>
                    </div>
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
                            onClick={() => window.location.href = '/'}
                            className="mt-1 p-1 text-gray-400 hover:text-rentia-blue hover:bg-blue-50 rounded-full transition-all"
                            aria-label="Volver"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-rentia-black font-display flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-rentia-blue" />
                                Publicar Propiedad & Registro
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Crea tu cuenta de propietario y sube tu inmueble.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium bg-gray-100 px-3 py-1.5 rounded-lg self-end md:self-auto">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-rentia-black text-white' : 'bg-gray-300'}`}>1</span>
                        <div className="w-4 h-0.5 bg-gray-300"></div>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-rentia-black text-white' : 'bg-gray-300'}`}>2</span>
                        <div className="w-4 h-0.5 bg-gray-300"></div>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-rentia-black text-white' : 'bg-gray-300'}`}>3</span>
                        <div className="w-4 h-0.5 bg-gray-300"></div>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 4 ? 'bg-rentia-black text-white' : 'bg-gray-300'}`}>4</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {authError && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-4 shadow-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold mb-1">Error en el proceso</p>
                                <p className="opacity-90">{authError}</p>
                                {authError.includes("ya está registrado") && (
                                    <button
                                        type="button"
                                        onClick={() => { setStep(1); setAuthError(null); }}
                                        className="mt-2 text-xs font-bold underline hover:no-underline"
                                    >
                                        Ir al paso 1 para corregir el email
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 1: CONTACTO, REGISTRO & CALCULADORA */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><User className="w-5 h-5 text-gray-400" /> Crear Cuenta Propietario</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo *</label>
                                            <input required type="text" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} placeholder="Tu nombre" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Usuario) *</label>
                                            <input required type="email" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} placeholder="tu@email.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña *</label>
                                            <div className="relative">
                                                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                                <input required type="password" className="w-full pl-9 pr-3 py-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.password} onChange={e => setContact({ ...contact, password: e.target.value })} placeholder="Mínimo 6 caracteres" minLength={6} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono *</label>
                                            <input required type="tel" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} placeholder="+34 600..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI / NIE</label>
                                            <input type="text" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition-colors" value={contact.dni} onChange={e => setContact({ ...contact, dni: e.target.value })} placeholder="Para el contrato" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mini Calculator */}
                            <div className="lg:col-span-1">
                                <div className="bg-rentia-blue text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10"><Calculator className="w-5 h-5 text-rentia-gold" /> Tu Tarifa</h3>

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
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><MapPin className="w-5 h-5 text-gray-400" /> Datos del Inmueble</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Exacta *</label>
                                        <input required type="text" className="w-full p-3 border rounded-xl" value={property.address} onChange={e => setProperty({ ...property, address: e.target.value })} placeholder="Calle, Número, Planta, Puerta" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia Catastral</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={property.catastralRef} onChange={e => setProperty({ ...property, catastralRef: e.target.value })} placeholder="20 dígitos (del recibo IBI)" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estrategia Alquiler *</label>
                                        <select className="w-full p-3 border rounded-xl bg-white" value={property.rentalStrategy} onChange={e => setProperty({ ...property, rentalStrategy: e.target.value as any })}>
                                            <option value="rooms">Por Habitaciones (Más Rentable)</option>
                                            <option value="traditional">Tradicional (Piso Completo)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* PRECIOS & HABITACIONES */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Configuración de Precios</h4>

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
                                                        <h5 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Bed className="w-4 h-4 text-rentia-blue" /> Habitación {idx + 1}</h5>
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
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2"><FileText className="w-5 h-5 text-gray-400" /> Datos Económicos y Estado</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IBI Anual (€)</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={property.ibi} onChange={e => setProperty({ ...property, ibi: e.target.value })} placeholder="Aprox" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Comunidad (€/mes)</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={property.communityFee} onChange={e => setProperty({ ...property, communityFee: e.target.value })} placeholder="Cuota mensual" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Derramas Pendientes</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={property.derramas} onChange={e => setProperty({ ...property, derramas: e.target.value })} placeholder="Si/No (Importe)" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observaciones Extra</label>
                                        <textarea className="w-full p-3 border rounded-xl h-24 resize-none" value={property.observations} onChange={e => setProperty({ ...property, observations: e.target.value })} placeholder="Estado de la vivienda, si tiene ascensor, si necesita reforma..." />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                                    <h4 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2"><Camera className="w-4 h-4" /> Fotos Generales (Salón, Cocina, Baños...)</h4>
                                    <ImageUploader folder={`mgmt/${tempId}/common`} label="Subir Fotos Zonas Comunes" onUploadComplete={(url) => setCommonImages(prev => [...prev, url])} onlyFirebase={true} />
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {commonImages.map((img, i) => (
                                            <img key={i} src={img} className="w-20 h-20 rounded-lg object-cover border border-gray-200 shadow-sm" />
                                        ))}
                                    </div>
                                </div>

                                {/* GDPR CHECKBOX */}
                                <div className="mt-6 border-t border-gray-100 pt-6">
                                    <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={gdprAccepted}
                                                onChange={e => setGdprAccepted(e.target.checked)}
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:bg-rentia-blue checked:border-rentia-blue transition-all"
                                            />
                                            <ShieldCheck className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-[11px] text-gray-600 leading-relaxed">
                                            <span className="font-bold block text-gray-800 mb-1 leading-tight">CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS Y REGISTRO (RGPD/LSSI-CE)</span>
                                            Al marcar esta casilla, autorizo expresamente a **Rentia Investments S.L.**, representada por **Dirección RentiaRoom**, a tratar mis datos para gestionar mi solicitud y crear mi cuenta de propietario.
                                            <br /><br />
                                            Entiendo que el sistema utiliza un protocolo de **Doble Opt-In**: recibiré un email para verificar mi identidad y activar mi panel. Mis datos no serán cedidos a terceros salvo obligación legal o necesidad del servicio. Puedo ejercer mis derechos en info@rentiaroom.com.
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: DOCUMENTACIÓN & ENVÍO */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2 border-b pb-2"><ShieldCheck className="w-5 h-5 text-rentia-blue" /> Documentación Legal</h3>
                                <p className="text-xs text-gray-500 mb-6">Para formalizar la gestión y verificar la titularidad, necesitamos que adjuntes los siguientes documentos. Puedes subir fotos nítidas realizadas con el móvil.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* DNI FRONT */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> DNI / NIE (Anverso)</label>
                                        <ImageUploader folder={`mgmt/${tempId}/docs`} label="Subir Cara Frontal" compact={true} onUploadComplete={(url) => setDocuments({ ...documents, dniFront: url })} onlyFirebase={true} />
                                        {documents.dniFront && <div className="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Archivo cargado correctamente</div>}
                                    </div>

                                    {/* DNI BACK */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> DNI / NIE (Reverso)</label>
                                        <ImageUploader folder={`mgmt/${tempId}/docs`} label="Subir Cara Trasera" compact={true} onUploadComplete={(url) => setDocuments({ ...documents, dniBack: url })} onlyFirebase={true} />
                                        {documents.dniBack && <div className="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Archivo cargado correctamente</div>}
                                    </div>

                                    {/* ESCRITURA */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> Escritura o Nota Simple</label>
                                        <p className="text-[10px] text-gray-400 mb-2">Para verificar la propiedad del inmueble.</p>
                                        <ImageUploader folder={`mgmt/${tempId}/docs`} label="Subir Escritura / Nota Simple" compact={true} accept="image/*,.pdf" onUploadComplete={(url) => setDocuments({ ...documents, escritura: url })} onlyFirebase={true} />
                                        {documents.escritura && <div className="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Archivo cargado correctamente</div>}
                                    </div>

                                    {/* IBAN */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Certificado Bancario / IBAN</label>
                                        <p className="text-[10px] text-gray-400 mb-2">Para el envío de las rentas netas mensuales.</p>
                                        <ImageUploader folder={`mgmt/${tempId}/docs`} label="Subir Certificado / Captura IBAN" compact={true} accept="image/*,.pdf" onUploadComplete={(url) => setDocuments({ ...documents, bankCertificate: url })} onlyFirebase={true} />
                                        {documents.bankCertificate && <div className="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Archivo cargado correctamente</div>}
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

                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                disabled={step === 1 && (!contact.name || !contact.phone || !contact.email || !contact.password)}
                                className="bg-rentia-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                Siguiente <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading || !gdprAccepted}
                                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Registrar y Enviar
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
