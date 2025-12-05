
import React, { useState } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Trash2, Home, Building2, Briefcase, Camera, FileText, CheckCircle, ShieldCheck, AlertCircle, Info, ChevronRight, ChevronLeft, Upload, Loader2, DollarSign } from 'lucide-react';
import { AssetSubmission, ITP_RATES, AssetType, AssetState, RentalStatus } from '../../types';
import { ImageUploader } from '../admin/ImageUploader';

interface Props {
    onBack?: () => void;
}

// Initial State Template
const initialAsset: AssetSubmission = {
    id: '1',
    type: 'Vivienda',
    title: '',
    province: 'Murcia',
    region: 'Murcia',
    municipality: '',
    address: '',
    zone: '',
    yearBuilt: 2000,
    state: 'Buen estado',
    ibi: 0,
    otherTaxes: 0,
    communityFees: 0,
    itpPercent: 8,
    price: 0,
    builtMeters: 0,
    usefulMeters: 0,
    rooms: 3,
    baths: 1,
    hasTerrace: false,
    hasElevator: true,
    hasParking: false,
    hasStorage: false,
    energyCertificate: 'En trámite',
    rentalStatus: 'Sin alquilar',
    images: [],
    documents: []
};

export const PropertySubmissionForm: React.FC<Props> = ({ onBack }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [assets, setAssets] = useState<AssetSubmission[]>([{ ...initialAsset }]);
    const [activeAssetIndex, setActiveAssetIndex] = useState(0);
    
    // Collaborator Info
    const [collaborator, setCollaborator] = useState({
        name: '', phone: '', email: '', relation: 'propietario' as const
    });
    
    // Pack / Building Logic
    const [isPack, setIsPack] = useState(false);
    const [packPrice, setPackPrice] = useState(0);
    
    // Legal
    const [gdprAccepted, setGdprAccepted] = useState(false);
    const [dataPolicyAccepted, setDataPolicyAccepted] = useState(false);

    // Temp ID for storage folder (to keep files organized before submission ID exists)
    const [tempRequestId] = useState(`REQ_${Date.now()}_${Math.floor(Math.random()*1000)}`);

    const updateAsset = (index: number, field: keyof AssetSubmission, value: any) => {
        const newAssets = [...assets];
        newAssets[index] = { ...newAssets[index], [field]: value };
        
        // Auto-update ITP if region changes
        if (field === 'region') {
            const newRate = ITP_RATES[value as string] || 8;
            newAssets[index].itpPercent = newRate;
        }
        
        setAssets(newAssets);
    };

    const addAsset = () => {
        setAssets([...assets, { ...initialAsset, id: Date.now().toString() }]);
        setActiveAssetIndex(assets.length);
    };

    const removeAsset = (index: number) => {
        if (assets.length === 1) return;
        const newAssets = assets.filter((_, i) => i !== index);
        setAssets(newAssets);
        setActiveAssetIndex(Math.max(0, index - 1));
    };

    const calculateProfitability = (asset: AssetSubmission) => {
        if (asset.price === 0) return 0;
        let annualRent = 0;
        if (asset.rentalStatus === 'Alquilada completa') annualRent = (asset.currentRent || 0) * 12;
        // Logic for room rental calculation could be added here if fields were more detailed
        return ((annualRent / asset.price) * 100).toFixed(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gdprAccepted || !dataPolicyAccepted) return alert("Debes aceptar las políticas de privacidad.");
        
        setLoading(true);
        try {
            await addDoc(collection(db, "opportunity_requests"), {
                collaborator,
                assets,
                isPack,
                packPrice: isPack ? packPrice : null,
                status: 'new',
                createdAt: serverTimestamp(),
                gdprAccepted,
                dataPolicyAccepted,
                tempRequestId // Reference to storage folder
            });
            setSuccess(true);
            window.scrollTo(0,0);
        } catch (error) {
            console.error("Error submitting:", error);
            alert("Hubo un error al enviar. Por favor inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center animate-in zoom-in-95 my-8">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Información Recibida!</h2>
                <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                    Gracias {collaborator.name}. Hemos recibido los datos de tus activos correctamente. Nuestro equipo de análisis revisará la información y te contactará en breve.
                </p>
                <div className="flex justify-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="inline-block bg-white text-slate-600 border border-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                            Volver a Demandas
                        </button>
                    )}
                    <a href="#/" className="inline-block bg-rentia-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                        Ir al Inicio
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="py-8 animate-in fade-in">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    
                    {/* Header Interno Formulario */}
                    <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-rentia-blue" />
                                Envío de Oportunidad
                            </h2>
                            <p className="text-sm text-slate-500">Paso {step} de 3</p>
                        </div>
                        {onBack && (
                            <button type="button" onClick={onBack} className="text-sm text-slate-500 hover:text-rentia-black font-bold flex items-center gap-1">
                                <ChevronLeft className="w-4 h-4" /> Cancelar
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-slate-100 h-1.5 w-full">
                        <div className="bg-rentia-blue h-full transition-all duration-500" style={{ width: `${(step/3)*100}%` }}></div>
                    </div>

                    {/* STEP 1: COLLABORATOR INFO */}
                    {step === 1 && (
                        <div className="p-8 animate-in slide-in-from-right-4">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm">1</span>
                                Datos del Colaborador
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre Completo *</label>
                                    <input required type="text" className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all" value={collaborator.name} onChange={e => setCollaborator({...collaborator, name: e.target.value})} placeholder="Tu nombre" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Relación con la propiedad *</label>
                                    <select className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white" value={collaborator.relation} onChange={e => setCollaborator({...collaborator, relation: e.target.value as any})}>
                                        <option value="propietario">Soy el Propietario</option>
                                        <option value="agencia">Soy Agente Inmobiliario</option>
                                        <option value="mediador">Soy Mediador / Personal Shopper</option>
                                        <option value="amigo">Soy amigo/familiar del propietario</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Teléfono *</label>
                                    <input required type="tel" className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all" value={collaborator.phone} onChange={e => setCollaborator({...collaborator, phone: e.target.value})} placeholder="+34 600..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email *</label>
                                    <input required type="email" className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all" value={collaborator.email} onChange={e => setCollaborator({...collaborator, email: e.target.value})} placeholder="contacto@email.com" />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button type="button" onClick={() => setStep(2)} disabled={!collaborator.name || !collaborator.phone} className="bg-rentia-black text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                                    Siguiente Paso <ChevronRight className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ASSETS DATA */}
                    {step === 2 && (
                        <div className="p-8 animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm">2</span>
                                    Información de Activos
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsPack(!isPack)} className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${isPack ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                                        {isPack ? 'Modo Pack Activado' : 'Activar Modo Pack'}
                                    </button>
                                </div>
                            </div>

                            {/* Asset Tabs */}
                            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
                                {assets.map((asset, idx) => (
                                    <button 
                                        key={asset.id}
                                        onClick={() => setActiveAssetIndex(idx)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${activeAssetIndex === idx ? 'bg-rentia-blue text-white border-rentia-blue shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Home className="w-4 h-4" /> {asset.title || `Activo ${idx+1}`}
                                        {assets.length > 1 && (
                                            <span onClick={(e) => { e.stopPropagation(); removeAsset(idx); }} className="ml-1 hover:text-red-300"><Trash2 className="w-3 h-3"/></span>
                                        )}
                                    </button>
                                ))}
                                <button onClick={addAsset} className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Añadir Otro
                                </button>
                            </div>

                            {/* Active Asset Form */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Título del Activo (Interno)</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={assets[activeAssetIndex].title} onChange={e => updateAsset(activeAssetIndex, 'title', e.target.value)} placeholder="Ej: 3º Izq Calle Mayor" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Activo</label>
                                        <select className="w-full p-3 border rounded-xl bg-white" value={assets[activeAssetIndex].type} onChange={e => updateAsset(activeAssetIndex, 'type', e.target.value)}>
                                            <option>Vivienda</option>
                                            <option>Piso</option>
                                            <option>Casa independiente</option>
                                            <option>Edificio completo</option>
                                            <option>Habitación</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estado</label>
                                        <select className="w-full p-3 border rounded-xl bg-white" value={assets[activeAssetIndex].state} onChange={e => updateAsset(activeAssetIndex, 'state', e.target.value)}>
                                            <option>Buen estado</option>
                                            <option>Reformado</option>
                                            <option>A reformar</option>
                                            <option>Obra nueva</option>
                                            <option>Ruina</option>
                                        </select>
                                    </div>
                                </div>

                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-200 pb-2">Ubicación & Legal</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dirección Completa</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={assets[activeAssetIndex].address} onChange={e => updateAsset(activeAssetIndex, 'address', e.target.value)} placeholder="Calle, Número, Planta, Puerta" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comunidad Autónoma (ITP)</label>
                                        <select className="w-full p-3 border rounded-xl bg-white" value={assets[activeAssetIndex].region} onChange={e => updateAsset(activeAssetIndex, 'region', e.target.value)}>
                                            {Object.keys(ITP_RATES).sort().map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <p className="text-[10px] text-slate-500 mt-1">ITP Aplicable: {assets[activeAssetIndex].itpPercent}%</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Municipio</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={assets[activeAssetIndex].municipality} onChange={e => updateAsset(activeAssetIndex, 'municipality', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Barrio / Zona</label>
                                        <input type="text" className="w-full p-3 border rounded-xl" value={assets[activeAssetIndex].zone} onChange={e => updateAsset(activeAssetIndex, 'zone', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Año Construcción</label>
                                        <input type="number" className="w-full p-3 border rounded-xl" value={assets[activeAssetIndex].yearBuilt} onChange={e => updateAsset(activeAssetIndex, 'yearBuilt', Number(e.target.value))} />
                                    </div>
                                </div>

                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-200 pb-2">Económico</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Precio Venta (€)</label>
                                        <input type="number" className="w-full p-3 border rounded-xl font-bold" value={assets[activeAssetIndex].price} onChange={e => updateAsset(activeAssetIndex, 'price', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">IBI Anual (€)</label>
                                        <input type="number" className="w-full p-3 border rounded-xl" value={assets[activeAssetIndex].ibi} onChange={e => updateAsset(activeAssetIndex, 'ibi', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comunidad (€/mes)</label>
                                        <input type="number" className="w-full p-3 border rounded-xl" value={assets[activeAssetIndex].communityFees} onChange={e => updateAsset(activeAssetIndex, 'communityFees', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Situación Alquiler</label>
                                        <select className="w-full p-3 border rounded-xl bg-white text-xs" value={assets[activeAssetIndex].rentalStatus} onChange={e => updateAsset(activeAssetIndex, 'rentalStatus', e.target.value)}>
                                            <option>Sin alquilar</option>
                                            <option>Alquilada completa</option>
                                            <option>Alquilada por habitaciones</option>
                                        </select>
                                    </div>
                                </div>

                                {assets[activeAssetIndex].rentalStatus !== 'Sin alquilar' && (
                                    <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100 animate-in fade-in">
                                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Detalles del Alquiler</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-blue-600 mb-1">Renta Mensual Total (€)</label>
                                                <input type="number" className="w-full p-2 border rounded-lg" value={assets[activeAssetIndex].currentRent} onChange={e => updateAsset(activeAssetIndex, 'currentRent', Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-blue-600 mb-1">Fin de Contrato</label>
                                                <input type="date" className="w-full p-2 border rounded-lg" value={assets[activeAssetIndex].contractDate} onChange={e => updateAsset(activeAssetIndex, 'contractDate', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-blue-800 font-bold">
                                            Rentabilidad Bruta Actual: {calculateProfitability(assets[activeAssetIndex])}%
                                        </div>
                                    </div>
                                )}

                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-200 pb-2">Características</h3>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">M² Const.</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assets[activeAssetIndex].builtMeters} onChange={e => updateAsset(activeAssetIndex, 'builtMeters', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Habit.</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assets[activeAssetIndex].rooms} onChange={e => updateAsset(activeAssetIndex, 'rooms', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Baños</label>
                                        <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assets[activeAssetIndex].baths} onChange={e => updateAsset(activeAssetIndex, 'baths', Number(e.target.value))} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <input type="checkbox" checked={assets[activeAssetIndex].hasElevator} onChange={e => updateAsset(activeAssetIndex, 'hasElevator', e.target.checked)} className="w-4 h-4 text-rentia-blue" />
                                        <span className="text-xs">Ascensor</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <input type="checkbox" checked={assets[activeAssetIndex].hasTerrace} onChange={e => updateAsset(activeAssetIndex, 'hasTerrace', e.target.checked)} className="w-4 h-4 text-rentia-blue" />
                                        <span className="text-xs">Terraza</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <input type="checkbox" checked={assets[activeAssetIndex].hasParking} onChange={e => updateAsset(activeAssetIndex, 'hasParking', e.target.checked)} className="w-4 h-4 text-rentia-blue" />
                                        <span className="text-xs">Parking</span>
                                    </div>
                                </div>

                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 border-b border-slate-200 pb-2">Fotografías y Documentos</h3>
                                <div className="mb-4">
                                    <ImageUploader 
                                        folder={`requests/${tempRequestId}/${assets[activeAssetIndex].id}`} 
                                        label="Subir Fotos (Múltiple)"
                                        onUploadComplete={(url) => {
                                            const currentImages = assets[activeAssetIndex].images || [];
                                            updateAsset(activeAssetIndex, 'images', [...currentImages, url]);
                                        }}
                                        onlyFirebase={true} // FORZADO A FIREBASE
                                    />
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {assets[activeAssetIndex].images.map((img, idx) => (
                                            <div key={idx} className="w-20 h-20 relative rounded-lg overflow-hidden border group">
                                                <img src={img} className="w-full h-full object-cover" alt="Preview"/>
                                                <button type="button" onClick={() => {
                                                    const newImages = assets[activeAssetIndex].images.filter((_, i) => i !== idx);
                                                    updateAsset(activeAssetIndex, 'images', newImages);
                                                }} className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Controls */}
                            <div className="flex justify-between mt-8 border-t pt-6">
                                <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2">
                                    <ChevronLeft className="w-4 h-4"/> Volver
                                </button>
                                <button type="button" onClick={() => setStep(3)} className="bg-rentia-black text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
                                    Revisar y Enviar <ChevronRight className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REVIEW & SUBMIT */}
                    {step === 3 && (
                        <div className="p-8 animate-in slide-in-from-right-4">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Revisión Final</h2>
                            
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6">
                                <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Colaborador</p>
                                        <p className="font-bold text-lg text-slate-800">{collaborator.name}</p>
                                        <p className="text-sm text-slate-600">{collaborator.email} • {collaborator.phone}</p>
                                        <p className="text-xs text-rentia-blue bg-blue-50 inline-block px-2 py-0.5 rounded mt-1 capitalize">{collaborator.relation}</p>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-xs text-rentia-blue underline">Editar</button>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Activos a enviar ({assets.length})</p>
                                        <button onClick={() => setStep(2)} className="text-xs text-rentia-blue underline">Editar</button>
                                    </div>
                                    <div className="space-y-3">
                                        {assets.map((asset, i) => (
                                            <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 flex gap-4 items-center">
                                                <div className="w-16 h-16 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                                                    {asset.images[0] ? <img src={asset.images[0]} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Home className="w-6 h-6"/></div>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">{asset.title || 'Sin título'}</p>
                                                    <p className="text-xs text-slate-500">{asset.address}, {asset.municipality}</p>
                                                    <p className="text-xs font-bold text-green-600 mt-1">{asset.price.toLocaleString()} €</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {isPack && (
                                        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <label className="block text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-2"><DollarSign className="w-3 h-3"/> Precio del Pack Completo</label>
                                            <input type="number" className="w-full p-2 border border-indigo-200 rounded-lg text-lg font-bold text-indigo-900" value={packPrice} onChange={e => setPackPrice(Number(e.target.value))} placeholder="Precio Total Pack" />
                                            <p className="text-xs text-indigo-600 mt-1">Si se vende por separado, deja esto en 0.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                    <input type="checkbox" className="mt-1 w-4 h-4 text-rentia-blue rounded border-slate-300 focus:ring-rentia-blue" checked={gdprAccepted} onChange={e => setGdprAccepted(e.target.checked)} />
                                    <div className="text-xs text-slate-600 leading-relaxed">
                                        <strong>Política de Privacidad (RGPD):</strong> Acepto que mis datos sean tratados por Rentia Investments S.L. para la gestión de esta oportunidad de colaboración. Entiendo que puedo ejercer mis derechos de acceso, rectificación y supresión en cualquier momento.
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                    <input type="checkbox" className="mt-1 w-4 h-4 text-rentia-blue rounded border-slate-300 focus:ring-rentia-blue" checked={dataPolicyAccepted} onChange={e => setDataPolicyAccepted(e.target.checked)} />
                                    <div className="text-xs text-slate-600 leading-relaxed">
                                        Declaras bajo responsabilidad que la información proporcionada sobre los inmuebles es veraz y que cuentas con autorización para su comercialización o comunicación.
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-between">
                                <button type="button" onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2">
                                    <ChevronLeft className="w-4 h-4"/> Volver
                                </button>
                                <button type="submit" disabled={loading || !gdprAccepted || !dataPolicyAccepted} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Upload className="w-5 h-5"/>}
                                    {loading ? 'Enviando...' : 'Confirmar Envío'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};