
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, ArrowRight, User, Phone, Mail, FileText, ChevronDown, ChevronUp, Home, Building, PlusCircle, Trash2, Loader2, CheckCircle, Image as ImageIcon, EyeOff, Upload, FileCheck, Briefcase } from 'lucide-react';
import { PartnerTransferSubmission, TransferRoomData, TransferPropertyData, TransferAsset } from '../../types';
import { ImageUploader } from '../admin/ImageUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const initialRoomState: TransferRoomData = {
    id: 0, // ID placeholder, will be overwritten
    name: 'H1',
    rentPrice: 0,
    includedExpenses: '',
    depositHeld: 0,
    tenantNationality: '',
    tenantAge: '',
    tenantProfile: 'Estudiante',
    paymentDay: 1,
    paymentStatus: 'Al día',
    paymentHistory: '',
    hasFridge: false,
    hasAC: false,
    hasFan: false,
    images: [],
    observations: '',
    currentContractUrl: ''
};

const initialPropertyState: TransferPropertyData = {
    address: '', floor: '', city: 'Murcia',
    communityPresident: '', communityAdmin: '',
    cleaningFreq: '', cleaningCost: '',
    suppliesType: 'Dividir Factura',
    rules: '', organization: 'Numerado',
    fridgeCount: 1, structuralIssues: '',
    observations: ''
};

export const PartnerTransferModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploadingContract, setUploadingContract] = useState<number | null>(null);

    // Temp ID for storage folder (Group photos by request)
    const [tempRequestId] = useState(`TRANSFER_${Date.now()}_${Math.floor(Math.random()*1000)}`);

    // Step 1 State
    const [collaborator, setCollaborator] = useState({ 
        name: '', 
        dni: '', 
        phone: '', 
        email: '', 
        relation: 'propietario' // Default value to fix type error
    });
    const [gdprAccepted, setGdprAccepted] = useState(false);
    const [showFullLegal, setShowFullLegal] = useState(false);

    // Step 2 State (Multiple Assets)
    const [assets, setAssets] = useState<TransferAsset[]>([
        { id: Date.now(), property: { ...initialPropertyState }, rooms: [{ ...initialRoomState, id: Date.now() + 1 }], images: [] }
    ]);
    const [activeAssetIndex, setActiveAssetIndex] = useState(0);

    // Reset Form Logic
    const resetForm = () => {
        setSuccess(false);
        setStep(1);
        setLoading(false);
        setAssets([{ 
            id: Date.now(), 
            property: { ...initialPropertyState }, 
            rooms: [{ ...initialRoomState, id: Date.now() + 1 }], 
            images: [] 
        }]);
        setCollaborator({ name: '', dni: '', phone: '', email: '', relation: 'propietario' });
        setGdprAccepted(false);
        setShowFullLegal(false);
        setActiveAssetIndex(0);
    };

    // Auto-reset if opened while in success state
    useEffect(() => {
        if (isOpen && success) {
            resetForm();
        }
    }, [isOpen]);

    const dynamicLegalText = useMemo(() => {
        const name = collaborator.name || '___________';
        const dni = collaborator.dni || '___________';
        return `Yo, ${name}, con DNI ${dni}, declaro bajo mi responsabilidad que los datos proporcionados en este formulario son veraces y que ostento la legitimidad necesaria (como propietario o representante autorizado) para ceder la gestión del activo descrito. 
        
        Asimismo, declaro contar con la legitimación legal necesaria para comunicar los datos y documentos de los arrendatarios actuales (contratos vigentes) con la única finalidad de gestionar el traspaso de la administración del inmueble. Autorizo a Rentia Investments S.L. al tratamiento de estos datos.`;
    }, [collaborator.name, collaborator.dni]);
    
    const isStep1Valid = collaborator.name && collaborator.dni && collaborator.phone && gdprAccepted;

    // -- ASSET MANAGEMENT --
    const addAsset = () => {
        setAssets(prev => [...prev, { 
            id: Date.now(), 
            property: { ...initialPropertyState }, 
            rooms: [{ ...initialRoomState, id: Date.now() + 1 }],
            images: []
        }]);
        setActiveAssetIndex(assets.length);
    };

    const removeAsset = (index: number) => {
        if (assets.length === 1) return;
        const newAssets = assets.filter((_, i) => i !== index);
        setAssets(newAssets);
        setActiveAssetIndex(prev => (prev >= newAssets.length ? newAssets.length - 1 : prev));
    };

    // -- GENERAL IMAGE MANAGEMENT --
    const addImageToActiveAsset = (url: string) => {
        setAssets(prev => prev.map((asset, i) => 
            i === activeAssetIndex 
            ? { ...asset, images: [...(asset.images || []), url] } 
            : asset
        ));
    };

    const removeImageFromActiveAsset = (imgIndex: number) => {
        setAssets(prev => prev.map((asset, i) => 
            i === activeAssetIndex 
            ? { ...asset, images: (asset.images || []).filter((_, idx) => idx !== imgIndex) } 
            : asset
        ));
    };

    // -- ROOM IMAGE MANAGEMENT --
    const addImageToRoom = (roomId: number, url: string) => {
        setAssets(prev => prev.map((asset, i) => 
            i === activeAssetIndex 
            ? { 
                ...asset, 
                rooms: asset.rooms.map(r => r.id === roomId ? { ...r, images: [...(r.images || []), url] } : r)
              } 
            : asset
        ));
    };

    const removeImageFromRoom = (roomId: number, imgIndex: number) => {
        setAssets(prev => prev.map((asset, i) => 
            i === activeAssetIndex 
            ? { 
                ...asset, 
                rooms: asset.rooms.map(r => r.id === roomId ? { ...r, images: (r.images || []).filter((_, idx) => idx !== imgIndex) } : r)
              } 
            : asset
        ));
    };

    // -- CONTRACT UPLOAD MANAGEMENT --
    const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>, roomId: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadingContract(roomId);
            try {
                // Upload PDF directly (no compression)
                const storageRef = ref(storage, `requests/${tempRequestId}/contracts/${roomId}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                
                // Update State
                setAssets(prev => prev.map((asset, i) => 
                    i === activeAssetIndex 
                    ? { 
                        ...asset, 
                        rooms: asset.rooms.map(r => r.id === roomId ? { ...r, currentContractUrl: url } : r)
                      } 
                    : asset
                ));
            } catch (error) {
                console.error("Error uploading contract:", error);
                alert("Error al subir el contrato.");
            } finally {
                setUploadingContract(null);
            }
        }
    };

    // -- PROPERTY DATA HELPERS --
    const updateActiveProperty = (field: keyof TransferPropertyData, value: any) => {
        setAssets(prev => prev.map((asset, i) => 
            i === activeAssetIndex ? { ...asset, property: { ...asset.property, [field]: value } } : asset
        ));
    };

    // -- ROOM DATA HELPERS --
    const addRoomToActiveAsset = () => {
        setAssets(prev => prev.map((asset, i) => 
            i === activeAssetIndex 
            ? { ...asset, rooms: [...asset.rooms, { ...initialRoomState, id: Date.now(), name: `H${asset.rooms.length + 1}`, images: [] }] } 
            : asset
        ));
    };

    const removeRoomFromActiveAsset = (roomId: number) => {
        setAssets(prev => prev.map((asset, i) => 
            i === activeAssetIndex 
            ? { ...asset, rooms: asset.rooms.filter(r => r.id !== roomId) } 
            : asset
        ));
    };

    const updateRoomInActiveAsset = (roomId: number, field: keyof TransferRoomData, value: any) => {
        setAssets(prev => prev.map((asset, i) => 
            i === activeAssetIndex 
            ? { 
                ...asset, 
                rooms: asset.rooms.map(r => r.id === roomId ? { ...r, [field]: value } : r)
              } 
            : asset
        ));
    };

    const submitTransfer = async () => {
        setLoading(true);
        try {
            const submissionData: PartnerTransferSubmission = {
                collaborator,
                assets,
                createdAt: serverTimestamp(),
                status: 'pending_review',
                tempRequestId: tempRequestId // GUARDAR REFERENCIA A CARPETA STORAGE
            };

            await addDoc(collection(db, "pending_transfers"), submissionData);
            setSuccess(true);
        } catch (error) {
            console.error(error);
            alert("Error al enviar el formulario. Por favor, inténtelo de nuevo.");
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;
    
    if (success) {
        return createPortal(
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl p-8 text-center max-w-md w-full animate-in zoom-in-95">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800">Traspaso Enviado</h2>
                    <p className="text-gray-600 mt-2">Gracias, {collaborator.name}. Hemos recibido los datos de tus {assets.length} vivienda(s) y la documentación adjunta. Nos pondremos en contacto contigo en breve.</p>
                    <button 
                        onClick={() => { resetForm(); onClose(); }} 
                        className="mt-6 w-full bg-rentia-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full sm:rounded-xl shadow-2xl sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center shrink-0 rounded-t-xl">
                    <div>
                        <h2 className="font-bold text-gray-800 text-sm sm:text-base">Traspaso de Gestión</h2>
                        <p className="text-xs text-gray-500 hidden sm:block">Completa los datos para formalizar el encargo</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                </div>

                {/* Body Scrollable */}
                <div className="flex-grow overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-rentia-black border-b pb-2"><User className="w-5 h-5 text-rentia-blue"/> Identificación del Cedente</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Briefcase className="w-3 h-3"/> Relación / Rol *</label>
                                    <select 
                                        value={collaborator.relation} 
                                        onChange={e => setCollaborator({...collaborator, relation: e.target.value})} 
                                        className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                                    >
                                        <option value="propietario">Soy el Propietario</option>
                                        <option value="agencia">Agencia Inmobiliaria / Broker</option>
                                        <option value="representante">Representante Legal / Apoderado</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre Completo *</label><input type="text" value={collaborator.name} onChange={e => setCollaborator({...collaborator, name: e.target.value})} className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Tu nombre" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">DNI/NIF *</label><input type="text" value={collaborator.dni} onChange={e => setCollaborator({...collaborator, dni: e.target.value})} className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Documento identidad" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Teléfono *</label><input type="tel" value={collaborator.phone} onChange={e => setCollaborator({...collaborator, phone: e.target.value})} className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Móvil contacto" /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email *</label><input type="email" value={collaborator.email} onChange={e => setCollaborator({...collaborator, email: e.target.value})} className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Correo electrónico" /></div>
                            </div>

                            {/* LEGAL DOCUMENT SECTION */}
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="w-4 h-4"/> Documento de Declaración
                                </h4>
                                
                                <div className="text-sm text-gray-600 italic bg-white p-4 rounded border border-gray-200 mb-4 font-serif leading-relaxed whitespace-pre-line">
                                    "{dynamicLegalText}"
                                </div>

                                <button 
                                    type="button" 
                                    onClick={() => setShowFullLegal(!showFullLegal)} 
                                    className="text-rentia-blue text-xs font-bold hover:underline flex items-center gap-1 mb-2"
                                >
                                    {showFullLegal ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                                    {showFullLegal ? 'Ocultar información legal' : 'Ver Información Básica Protección de Datos (RGPD)'}
                                </button>

                                {showFullLegal && (
                                    <div className="bg-blue-50/50 p-3 rounded border border-blue-100 text-[11px] text-gray-500 space-y-1.5 animate-in slide-in-from-top-1">
                                        <p><strong className="text-gray-700">Responsable:</strong> Rentia Investments S.L.</p>
                                        <p><strong className="text-gray-700">Finalidad:</strong> Gestión administrativa y comercial de la propuesta de traspaso de activos.</p>
                                        <p><strong className="text-gray-700">Legitimación:</strong> Consentimiento del interesado (Art 6.1.a RGPD) y medidas precontractuales.</p>
                                        <p><strong className="text-gray-700">Derechos:</strong> Acceder, rectificar y suprimir los datos, así como otros derechos, enviando email a info@rentiaroom.com.</p>
                                    </div>
                                )}
                            </div>
                            
                            <label className="flex items-start gap-3 cursor-pointer p-4 bg-white border-2 border-transparent hover:border-rentia-blue rounded-xl shadow-sm transition-all group">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={gdprAccepted} 
                                        onChange={e => setGdprAccepted(e.target.checked)} 
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:bg-rentia-blue checked:border-rentia-blue transition-all" 
                                    />
                                    <CheckCircle className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-900 select-none">
                                    He leído y acepto íntegramente la <strong>Declaración Responsable</strong> y la <strong>Política de Privacidad</strong> expuestas arriba. Firmo electrónicamente esta solicitud.
                                </span>
                            </label>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in">
                           <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-rentia-black"><Home className="w-5 h-5 text-rentia-blue"/> Viviendas a Traspasar</h3>
                                <div className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">Total: {assets.length}</div>
                           </div>

                           {/* ASSET TABS */}
                           <div className="flex flex-wrap gap-2 mb-4">
                                {assets.map((asset, idx) => (
                                    <button 
                                        key={asset.id} 
                                        onClick={() => setActiveAssetIndex(idx)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${activeAssetIndex === idx ? 'bg-rentia-black text-white border-rentia-black shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200'}`}
                                    >
                                        <Building className="w-3 h-3" />
                                        {asset.property.address ? asset.property.address.substring(0, 15) + '...' : `Vivienda ${idx + 1}`}
                                        {assets.length > 1 && (
                                            <span onClick={(e) => { e.stopPropagation(); removeAsset(idx); }} className="ml-1 p-0.5 hover:bg-white/20 rounded-full cursor-pointer"><X className="w-3 h-3"/></span>
                                        )}
                                    </button>
                                ))}
                                <button onClick={addAsset} className="px-3 py-2 rounded-lg text-sm font-bold border border-dashed border-gray-300 text-gray-500 hover:border-rentia-blue hover:text-rentia-blue transition-colors flex items-center gap-1">
                                    <PlusCircle className="w-4 h-4"/> Añadir Vivienda
                                </button>
                           </div>

                           {/* ACTIVE ASSET FORM */}
                           <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 animate-in slide-in-from-right-2">
                                
                                {/* A. Datos Vivienda */}
                                <section className="mb-8">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200">Datos Generales</h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Dirección Completa</label><input type="text" value={assets[activeAssetIndex].property.address} onChange={e => updateActiveProperty('address', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white" placeholder="Calle, número..."/></div>
                                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Planta / Puerta</label><input type="text" value={assets[activeAssetIndex].property.floor} onChange={e => updateActiveProperty('floor', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white" placeholder="Ej: 2º B"/></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Presidente/Admin Fincas</label><input type="text" value={assets[activeAssetIndex].property.communityPresident} onChange={e => updateActiveProperty('communityPresident', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white" placeholder="Nombre contacto comunidad"/></div>
                                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Teléfono Comunidad</label><input type="tel" value={assets[activeAssetIndex].property.communityAdmin} onChange={e => updateActiveProperty('communityAdmin', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white" placeholder="Teléfono contacto"/></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Suministros</label><select value={assets[activeAssetIndex].property.suppliesType} onChange={e => updateActiveProperty('suppliesType', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white"><option>Dividir Factura</option><option>Cuota Fija</option></select></div>
                                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Org. Nevera/Alacena</label><select value={assets[activeAssetIndex].property.organization} onChange={e => updateActiveProperty('organization', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-white"><option>Numerado por habitación</option><option>"Barra Libre" / Compartido</option></select></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Normas Convivencia</label><textarea value={assets[activeAssetIndex].property.rules} onChange={e => updateActiveProperty('rules', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm h-16 bg-white resize-none" placeholder="¿Estrictas? ¿Laxas? ¿Fumadores?"/></div>
                                            <div><label className="text-xs font-bold text-red-400 uppercase mb-1 block">Averías Conocidas</label><textarea value={assets[activeAssetIndex].property.structuralIssues} onChange={e => updateActiveProperty('structuralIssues', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm h-16 bg-white resize-none" placeholder="Persianas, humedades..."/></div>
                                        </div>
                                        
                                        {/* OBSERVACIONES INTERNAS PROPIEDAD */}
                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                            <label className="text-xs font-bold text-yellow-800 uppercase mb-1 block flex items-center gap-1">
                                                <EyeOff className="w-3 h-3"/> Observaciones Internas (Privado)
                                            </label>
                                            <textarea 
                                                value={assets[activeAssetIndex].property.observations} 
                                                onChange={e => updateActiveProperty('observations', e.target.value)} 
                                                className="w-full p-2.5 border border-yellow-200 rounded-lg text-sm h-16 bg-white resize-none focus:ring-yellow-500" 
                                                placeholder="Detalles ocultos, llaves, códigos alarma..."
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* B. FOTOS GENERALES (Salón, Cocina, Baños...) */}
                                <section className="mb-8">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200">Fotografías Zonas Comunes</h4>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <ImageUploader 
                                            folder={`requests/${tempRequestId}/asset_${assets[activeAssetIndex].id}`}
                                            label="Subir Fotos (Salón, Cocina, Baños, Fachada...)"
                                            onUploadComplete={addImageToActiveAsset}
                                            onlyFirebase={true}
                                        />
                                        
                                        {/* Gallery Grid */}
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                                            {assets[activeAssetIndex].images?.map((url, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                                    <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                                                    <button 
                                                        onClick={() => removeImageFromActiveAsset(idx)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* C. Habitaciones */}
                                <section>
                                    <div className="flex justify-between items-end mb-3 pb-1 border-b border-gray-200">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Habitaciones ({assets[activeAssetIndex].rooms.length})</h4>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {assets[activeAssetIndex].rooms.map((room, index) => (
                                            <div key={room.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group">
                                                {assets[activeAssetIndex].rooms.length > 1 && <button type="button" onClick={() => removeRoomFromActiveAsset(room.id)} className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4"/></button>}
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nombre / ID</label><input type="text" value={room.name} onChange={e => updateRoomInActiveAsset(room.id, 'name', e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold bg-gray-50 focus:bg-white" placeholder="Ej: H1"/></div>
                                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Alquiler Actual (€)</label><input type="number" value={room.rentPrice} onChange={e => updateRoomInActiveAsset(room.id, 'rentPrice', Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono"/></div>
                                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Fianza (€)</label><input type="number" value={room.depositHeld} onChange={e => updateRoomInActiveAsset(room.id, 'depositHeld', Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm font-mono"/></div>
                                                    
                                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nacionalidad</label><input type="text" value={room.tenantNationality} onChange={e => updateRoomInActiveAsset(room.id, 'tenantNationality', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="Española..."/></div>
                                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Perfil</label><select value={room.tenantProfile} onChange={e => updateRoomInActiveAsset(room.id, 'tenantProfile', e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white"><option>Estudiante</option><option>Trabajador</option><option>Pareja</option><option>Otro</option></select></div>
                                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Día Pago</label><input type="number" min="1" max="31" value={room.paymentDay} onChange={e => updateRoomInActiveAsset(room.id, 'paymentDay', Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm"/></div>
                                                    
                                                    <div className="md:col-span-3">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Estado de Pagos</label>
                                                        <select value={room.paymentStatus} onChange={e => updateRoomInActiveAsset(room.id, 'paymentStatus', e.target.value)} className={`w-full p-2 border rounded-lg text-sm font-bold ${room.paymentStatus === 'Impago' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                            <option value="Al día">Al día (Corriente)</option>
                                                            <option value="Retraso">Con Retrasos Frecuentes</option>
                                                            <option value="Impago">Impago Activo</option>
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="md:col-span-3">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Historial / Incidencias</label>
                                                        <textarea value={room.paymentHistory} onChange={e => updateRoomInActiveAsset(room.id, 'paymentHistory', e.target.value)} className="w-full p-2 border rounded-lg text-sm h-14 bg-gray-50 resize-none" placeholder="Problemas de convivencia, retrasos..."/>
                                                    </div>

                                                    {/* OBSERVACIONES INTERNAS HABITACIÓN */}
                                                    <div className="md:col-span-3">
                                                        <label className="text-[10px] font-bold text-yellow-600 uppercase block mb-1 flex items-center gap-1">
                                                            <EyeOff className="w-3 h-3"/> Observaciones (Interno)
                                                        </label>
                                                        <textarea 
                                                            value={room.observations} 
                                                            onChange={e => updateRoomInActiveAsset(room.id, 'observations', e.target.value)} 
                                                            className="w-full p-2 border border-yellow-200 rounded-lg text-sm h-14 bg-yellow-50 resize-none focus:ring-yellow-500" 
                                                            placeholder="Inventario extra, daños ocultos, etc..."
                                                        />
                                                    </div>
                                                    
                                                    <div className="md:col-span-3 flex flex-wrap gap-4 pt-2 border-t mt-2">
                                                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border hover:bg-gray-100"><input type="checkbox" checked={room.hasFridge} onChange={e => updateRoomInActiveAsset(room.id, 'hasFridge', e.target.checked)} className="w-4 h-4 rounded text-rentia-blue"/> <span className="text-xs font-bold text-gray-700">Nevera Propia</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border hover:bg-gray-100"><input type="checkbox" checked={room.hasAC} onChange={e => updateRoomInActiveAsset(room.id, 'hasAC', e.target.checked)} className="w-4 h-4 rounded text-rentia-blue"/> <span className="text-xs font-bold text-gray-700">Aire Acondicionado</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border hover:bg-gray-100"><input type="checkbox" checked={room.hasFan} onChange={e => updateRoomInActiveAsset(room.id, 'hasFan', e.target.checked)} className="w-4 h-4 rounded text-rentia-blue"/> <span className="text-xs font-bold text-gray-700">Ventilador</span></label>
                                                    </div>
                                                </div>

                                                {/* CONTRATO ACTUAL (PDF) */}
                                                <div className="mt-4 pt-3 border-t border-gray-100 bg-blue-50/50 p-3 rounded-lg">
                                                    <label className="text-[10px] font-bold text-blue-800 uppercase block mb-2 flex items-center gap-1">
                                                        <FileText className="w-3 h-3"/> Contrato Arrendamiento Actual (Si existe)
                                                    </label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative overflow-hidden inline-block">
                                                            <button 
                                                                type="button"
                                                                disabled={uploadingContract === room.id}
                                                                className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50"
                                                                onClick={() => document.getElementById(`contract-upload-${room.id}`)?.click()}
                                                            >
                                                                {uploadingContract === room.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>}
                                                                {room.currentContractUrl ? 'Cambiar Contrato' : 'Subir PDF'}
                                                            </button>
                                                            <input 
                                                                type="file" 
                                                                id={`contract-upload-${room.id}`} 
                                                                className="hidden" 
                                                                accept="application/pdf"
                                                                onChange={(e) => handleContractUpload(e, room.id)}
                                                            />
                                                        </div>
                                                        {room.currentContractUrl && (
                                                            <div className="flex items-center gap-2 text-green-600 bg-white px-2 py-1 rounded border border-green-200">
                                                                <FileCheck className="w-3 h-3"/>
                                                                <span className="text-[10px] font-bold">Documento subido</span>
                                                                <a href={room.currentContractUrl} target="_blank" rel="noreferrer" className="text-[9px] underline text-gray-500 hover:text-gray-800 ml-1">Ver</a>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-gray-400 mt-1 italic">Solo visible para la administración. Necesario para subrogar o gestionar el cambio.</p>
                                                </div>

                                                {/* FOTOS DE LA HABITACIÓN */}
                                                <div className="mt-4 pt-3 border-t border-gray-100">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Fotos de la Habitación ({room.name})</label>
                                                    <ImageUploader 
                                                        folder={`requests/${tempRequestId}/asset_${assets[activeAssetIndex].id}/room_${room.id}`}
                                                        label={`Subir Fotos ${room.name}`}
                                                        onUploadComplete={(url) => addImageToRoom(room.id, url)}
                                                        compact={true}
                                                        onlyFirebase={true}
                                                    />
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {room.images?.map((url, idx) => (
                                                            <div key={idx} className="w-16 h-16 relative rounded overflow-hidden border border-gray-200 group">
                                                                <img src={url} alt={`Foto ${room.name}`} className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => removeImageFromRoom(room.id, idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addRoomToActiveAsset} className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 font-bold text-sm rounded-xl hover:bg-gray-50 hover:border-rentia-blue hover:text-rentia-blue transition-all flex items-center justify-center gap-2"><PlusCircle className="w-5 h-5"/> Añadir Otra Habitación</button>
                                    </div>
                                </section>
                           </div>
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button type="button" onClick={() => setStep(step > 1 ? step - 1 : step)} className={`text-sm font-bold text-gray-500 hover:text-gray-800 px-4 py-2 ${step === 1 ? 'invisible' : ''}`}>Volver</button>
                    {step === 1 ? (
                        <button type="button" onClick={() => setStep(2)} disabled={!isStep1Valid} className="bg-rentia-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg hover:bg-gray-800 transition-all">
                            Siguiente Paso <ArrowRight className="w-4 h-4"/>
                        </button>
                    ) : (
                        <button type="button" onClick={submitTransfer} disabled={loading} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-green-700 transition-all disabled:opacity-70">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                            Confirmar y Enviar
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
