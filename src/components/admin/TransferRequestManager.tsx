
import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, where, serverTimestamp } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { PartnerTransferSubmission, UserProfile, TransferAsset } from '../../types';
import { Property, Room } from '../../data/rooms';
import { Inbox, User, Home, Bed, Phone, Mail, Fingerprint, CheckCircle, XCircle, Trash2, Loader2, Share2, MessageCircle, Check, PlusCircle, AlertCircle, Building, UserPlus, ChevronDown, Layers, Image as ImageIcon, Download, EyeOff, FileText } from 'lucide-react';

export const TransferRequestManager: React.FC = () => {
    const [requests, setRequests] = useState<PartnerTransferSubmission[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<PartnerTransferSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingStep, setProcessingStep] = useState<string>('');
    
    // State para gestión de propietarios
    const [owners, setOwners] = useState<UserProfile[]>([]);
    const [ownerSelectionMode, setOwnerSelectionMode] = useState<'select' | 'create'>('select');
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
    const [newOwnerForm, setNewOwnerForm] = useState({ name: '', email: '', phone: '', dni: '' });
    
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Estado para expansión en detalle
    const [expandedAssetId, setExpandedAssetId] = useState<number | null>(null);

    useEffect(() => {
        // Cargar traspasos
        const qTransfers = query(collection(db, "pending_transfers"), orderBy("createdAt", "desc"));
        const unsubTransfers = onSnapshot(qTransfers, (snapshot) => {
            const list: PartnerTransferSubmission[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // BACKWARD COMPATIBILITY: Map old single property structure to new array structure
                let normalizedAssets: TransferAsset[] = [];
                if (data.assets && Array.isArray(data.assets)) {
                    normalizedAssets = data.assets;
                } else if (data.property && data.rooms) {
                    normalizedAssets = [{ id: 1, property: data.property, rooms: data.rooms, images: [] }];
                }

                list.push({ ...data, assets: normalizedAssets, id: doc.id } as PartnerTransferSubmission);
            });
            setRequests(list);
            setLoading(false);
        });
        
        // Cargar propietarios existentes para el selector
        const qOwners = query(collection(db, "users"), where("role", "==", "owner"));
        const unsubOwners = onSnapshot(qOwners, (snapshot) => {
            const list: UserProfile[] = [];
            snapshot.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as UserProfile);
            });
            setOwners(list);
        });

        return () => {
            unsubTransfers();
            unsubOwners();
        };
    }, []);

    // Función auxiliar para borrado recursivo en Storage
    const deleteFolderRecursive = async (path: string) => {
        const listRef = ref(storage, path);
        try {
            const res = await listAll(listRef);
            // 1. Borrar archivos en este nivel
            const filePromises = res.items.map((itemRef) => deleteObject(itemRef));
            // 2. Borrar subcarpetas recursivamente
            const folderPromises = res.prefixes.map((folderRef) => deleteFolderRecursive(folderRef.fullPath));
            
            await Promise.all([...filePromises, ...folderPromises]);
            console.log(`Carpeta ${path} eliminada correctamente.`);
        } catch (error) {
            console.warn(`Error limpiando carpeta ${path} (puede que no exista o esté vacía):`, error);
            // No lanzamos error para no bloquear el borrado del documento en Firestore
        }
    };

    const handleApproveAndCreate = async (request: PartnerTransferSubmission) => {
        setNotification(null);
        setProcessingStep('start');

        let ownerId = '';
        let ownerName = '';

        // 1. Validar y obtener ID del propietario
        if (ownerSelectionMode === 'select') {
            if (!selectedOwnerId) {
                setNotification({ type: 'error', message: 'Por favor, selecciona un propietario existente.' });
                setProcessingStep('');
                return;
            }
            ownerId = selectedOwnerId;
            ownerName = owners.find(o => o.id === ownerId)?.name || 'Propietario';
        } else { // 'create' mode
            if (!newOwnerForm.name || !newOwnerForm.email) {
                setNotification({ type: 'error', message: 'Nombre y email son obligatorios para el nuevo propietario.' });
                setProcessingStep('');
                return;
            }
            setProcessingStep('creating_owner');
            try {
                // Crear el perfil del usuario en Firestore (no la autenticación, eso es un paso posterior)
                const userDocRef = await addDoc(collection(db, "users"), {
                    ...newOwnerForm,
                    role: 'owner',
                    createdAt: serverTimestamp(),
                    active: true,
                });
                ownerId = userDocRef.id;
                ownerName = newOwnerForm.name;
                setNotification({ type: 'success', message: `Propietario "${ownerName}" creado con éxito.` });
            } catch (e) {
                setNotification({ type: 'error', message: 'Fallo al crear el propietario.' });
                setProcessingStep('');
                return;
            }
        }

        // 2. Crear las Propiedades (Assets) iterando
        setProcessingStep('creating_properties');
        try {
            // Usamos un bucle para procesar cada activo secuencialmente
            for (const asset of request.assets) {
                // Mapeo extendido para incluir campos internos como 'notes' (proveniente de observations)
                const newProperty: any = {
                    ownerId: ownerId, // Vincular al mismo propietario
                    address: asset.property.address,
                    city: asset.property.city || 'Murcia',
                    floor: asset.property.floor,
                    bathrooms: 1, // Default, not in form yet
                    // Usar la primera imagen general como portada
                    image: asset.images && asset.images.length > 0 ? asset.images[0] : '', 
                    googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(asset.property.address)}`,
                    // MAPEO DE OBSERVACIONES INTERNAS
                    internalNotes: asset.property.observations || '', 
                    rooms: asset.rooms.map((roomData, index) => ({
                        id: `${asset.property.address.replace(/[^a-zA-Z0-9]/g, '')}_H${index + 1}`,
                        name: roomData.name || `H${index + 1}`,
                        price: roomData.rentPrice,
                        status: 'available',
                        availableFrom: 'Inmediata',
                        expenses: roomData.includedExpenses || 'Gastos fijos aparte',
                        targetProfile: roomData.tenantProfile === 'Estudiante' ? 'students' : 'workers',
                        hasAirConditioning: roomData.hasAC,
                        hasFan: roomData.hasFan,
                        bedType: 'double',
                        features: ['lock', 'desk'],
                        commissionType: 'percentage',
                        commissionValue: 10,
                        // Asignar las imágenes ESPECÍFICAS de la habitación
                        images: roomData.images || [],
                        // MAPEO DE OBSERVACIONES HABITACIÓN
                        notes: roomData.observations || '',
                        // Guardar referencia al contrato antiguo en notas o un campo específico si existe en el modelo Room
                        driveUrl: roomData.currentContractUrl || '' 
                    })),
                    communityInfo: {
                        presidentPhone: asset.property.communityPresident,
                        adminCompany: asset.property.communityAdmin,
                    },
                    suppliesConfig: {
                        type: asset.property.suppliesType === 'Cuota Fija' ? 'fixed' : 'shared',
                        fixedAmount: 45,
                    },
                };

                await addDoc(collection(db, "properties"), newProperty);
            }
            
            setNotification({ type: 'success', message: `¡${request.assets.length} activos creados y asignados a ${ownerName}!` });
        } catch (e) {
            setNotification({ type: 'error', message: 'Fallo crítico al crear propiedades. Revisa la consola.' });
            console.error("Error creating properties loop:", e);
            setProcessingStep('');
            return;
        }

        // 3. Actualizar estado del traspaso a 'integrated'
        setProcessingStep('finishing');
        try {
            await updateDoc(doc(db, "pending_transfers", request.id!), { status: 'integrated' });
        } catch (e) {
            console.error("Fallo al archivar traspaso, pero el activo fue creado.", e);
        }

        // 4. Limpieza final
        setTimeout(() => {
            setProcessingStep('');
            setSelectedRequest(null);
            setNotification(null);
        }, 2000);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este traspaso permanentemente? \n\nAVISO: Si rechazas este traspaso, se borrarán también todas las imágenes y documentos adjuntos del servidor para liberar espacio.")) return;
        
        setProcessingStep('deleting');
        try {
            // 1. Obtener la solicitud para buscar el ID de carpeta Storage
            const requestToDelete = requests.find(r => r.id === id);
            
            // 2. Si tiene ID temporal, borrar carpeta recursivamente
            if (requestToDelete?.tempRequestId) {
                console.log(`Borrando imágenes de ${requestToDelete.tempRequestId}...`);
                await deleteFolderRecursive(`requests/${requestToDelete.tempRequestId}`);
            }

            // 3. Borrar documento Firestore
            await deleteDoc(doc(db, "pending_transfers", id));
            
            if (selectedRequest?.id === id) setSelectedRequest(null);
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Error al eliminar. Revisa la consola.");
        } finally {
            setProcessingStep('');
        }
    };
    
    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'pending_review': return <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-200">Pendiente</span>;
            case 'contacted': return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">Contactado</span>;
            case 'integrated': return <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">Integrado</span>;
            default: return <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200">{status}</span>;
        }
    };
    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-rentia-blue"/></div>;


    return (
        <div className="flex h-[calc(100vh-180px)] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-rentia-blue" /> Bandeja de Traspasos ({requests.filter(r => r.status === 'pending_review').length})
                    </h3>
                </div>
                <div className="overflow-y-auto flex-grow p-2 space-y-2">
                    {requests.map(req => {
                        const totalRooms = req.assets.reduce((acc, curr) => acc + curr.rooms.length, 0);
                        return (
                        <div key={req.id} onClick={() => setSelectedRequest(req)} className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedRequest?.id === req.id ? 'bg-white border-rentia-blue shadow-md' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                            <div className="flex justify-between items-start mb-1">{getStatusBadge(req.status)}<span className="text-[10px] text-gray-400">{req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : ''}</span></div>
                            <h4 className="font-bold text-sm text-gray-800 truncate">{req.collaborator.name}</h4>
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                <Layers className="w-3 h-3"/> {req.assets.length} Viviendas ({totalRooms} habs)
                            </p>
                        </div>
                    )})}
                </div>
            </div>

            {/* Detail View */}
            <div className="w-2/3 bg-white flex flex-col overflow-hidden">
                {selectedRequest ? (
                    <div className="flex flex-col h-full">
                        {/* Header Detail */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                             <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Share2 className="w-5 h-5 text-gray-400" /> Detalle del Traspaso</h2>
                                <p className="text-xs text-gray-500 mt-1">Recibido: {selectedRequest.createdAt?.toDate ? selectedRequest.createdAt.toDate().toLocaleString() : '-'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDelete(selectedRequest.id!)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                            </div>
                        </div>

                        {/* NOTIFICATION AREA */}
                        {notification && (
                            <div className={`p-3 text-xs font-bold flex items-center gap-2 border-b ${notification.type === 'success' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
                                {notification.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                                {notification.message}
                            </div>
                        )}

                        {/* Content Scrollable */}
                        <div className="flex-grow overflow-y-auto p-6 bg-gray-50/50 space-y-6 custom-scrollbar">
                            
                            {/* OWNER ASSIGNMENT SECTION */}
                            <section className="bg-purple-50 p-4 rounded-xl border-2 border-dashed border-purple-200">
                                <h4 className="font-bold text-xs text-purple-900 uppercase mb-3 flex items-center gap-2"><Building className="w-4 h-4"/> Asignar Propietario (Obligatorio)</h4>
                                <div className="flex bg-purple-100 p-1 rounded-lg mb-3">
                                    <button onClick={() => setOwnerSelectionMode('select')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${ownerSelectionMode === 'select' ? 'bg-white shadow text-purple-800' : 'text-purple-600'}`}>Seleccionar Existente</button>
                                    <button onClick={() => setOwnerSelectionMode('create')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${ownerSelectionMode === 'create' ? 'bg-white shadow text-purple-800' : 'text-purple-600'}`}>Crear Nuevo</button>
                                </div>
                                
                                {ownerSelectionMode === 'select' ? (
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                                        <select value={selectedOwnerId} onChange={e => setSelectedOwnerId(e.target.value)} className="w-full pl-9 pr-8 py-2 border rounded-lg bg-white appearance-none">
                                            <option value="">Selecciona un propietario...</option>
                                            {owners.map(o => <option key={o.id} value={o.id!}>{o.name} ({o.email})</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="Nombre *" value={newOwnerForm.name} onChange={e => setNewOwnerForm({...newOwnerForm, name: e.target.value})} className="w-full p-2 border rounded text-sm" />
                                            <input type="email" placeholder="Email *" value={newOwnerForm.email} onChange={e => setNewOwnerForm({...newOwnerForm, email: e.target.value})} className="w-full p-2 border rounded text-sm" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="tel" placeholder="Teléfono" value={newOwnerForm.phone} onChange={e => setNewOwnerForm({...newOwnerForm, phone: e.target.value})} className="w-full p-2 border rounded text-sm" />
                                            <input type="text" placeholder="DNI" value={newOwnerForm.dni} onChange={e => setNewOwnerForm({...newOwnerForm, dni: e.target.value})} className="w-full p-2 border rounded text-sm" />
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Collaborator Info */}
                            <section className="bg-white p-4 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-xs text-gray-500 uppercase mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4"/> Colaborador Cedente</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400"/> {selectedRequest.collaborator.email}</div>
                                    <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400"/> {selectedRequest.collaborator.phone}</div>
                                    <div className="font-bold flex items-center gap-2"><User className="w-3 h-3 text-gray-400"/> {selectedRequest.collaborator.name}</div>
                                    <div className="flex items-center gap-2"><Fingerprint className="w-3 h-3 text-gray-400"/> {selectedRequest.collaborator.dni}</div>
                                </div>
                            </section>

                            {/* Assets List Loop */}
                            <h4 className="font-bold text-sm text-gray-700 uppercase pt-2 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-rentia-blue" />
                                Activos Incluidos ({selectedRequest.assets.length})
                            </h4>
                            
                            {selectedRequest.assets.map((asset, index) => {
                                const isExpanded = expandedAssetId === asset.id || selectedRequest.assets.length === 1;
                                return (
                                <div key={asset.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <div 
                                        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-lg border border-gray-200 font-bold text-xs text-gray-500">#{index + 1}</div>
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-800">{asset.property.address}</h5>
                                                <p className="text-xs text-gray-500">{asset.property.city} • {asset.rooms.length} Habitaciones</p>
                                            </div>
                                        </div>
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400 transform -rotate-90"/>}
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 space-y-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                                            
                                            {/* Photo Gallery (GENERAL) */}
                                            {asset.images && asset.images.length > 0 && (
                                                <div className="mb-4">
                                                    <h6 className="font-bold text-xs text-gray-500 uppercase mb-2 flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Zonas Comunes / Generales</h6>
                                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                        {asset.images.map((url, idx) => (
                                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                                                <img src={url} alt={`General ${idx+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                                <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Download className="w-5 h-5 text-white" />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <span className="block font-bold text-gray-400 uppercase">Comunidad</span>
                                                    <span className="block mt-1">{asset.property.communityPresident} ({asset.property.communityAdmin})</span>
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-gray-400 uppercase">Suministros</span>
                                                    <span className="block mt-1">{asset.property.suppliesType}</span>
                                                </div>
                                            </div>

                                            {/* OBSERVACIONES INTERNAS PROPIEDAD */}
                                            {asset.property.observations && (
                                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs">
                                                    <span className="font-bold text-yellow-800 uppercase flex items-center gap-1 mb-1"><EyeOff className="w-3 h-3"/> Observaciones Internas</span>
                                                    <p className="text-gray-700 whitespace-pre-line">{asset.property.observations}</p>
                                                </div>
                                            )}
                                            
                                            <div>
                                                <h6 className="font-bold text-xs text-gray-500 uppercase mb-2 flex items-center gap-2"><Bed className="w-3 h-3"/> Habitaciones</h6>
                                                <div className="space-y-2">
                                                    {asset.rooms.map(room => (
                                                        <div key={room.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div>
                                                                    <span className="font-bold text-sm text-gray-800 mr-2">{room.name}</span>
                                                                    <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border">{room.tenantProfile}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block font-bold text-rentia-blue">{room.rentPrice}€</span>
                                                                    <span className={`text-[10px] ${room.paymentStatus === 'Impago' ? 'text-red-600 font-bold' : 'text-gray-400'}`}>{room.paymentStatus}</span>
                                                                </div>
                                                            </div>
                                                            {/* OBSERVACIONES HABITACIÓN */}
                                                            {room.observations && (
                                                                <div className="mb-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 italic">
                                                                    <span className="font-bold text-gray-400 block text-[9px] uppercase">Nota Interna:</span>
                                                                    {room.observations}
                                                                </div>
                                                            )}

                                                            {/* CONTRATO PDF */}
                                                            {room.currentContractUrl && (
                                                                <div className="mb-2">
                                                                    <a 
                                                                        href={room.currentContractUrl} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        <FileText className="w-3 h-3"/>
                                                                        Ver Contrato Vigente
                                                                    </a>
                                                                </div>
                                                            )}

                                                            {/* FOTOS DE LA HABITACIÓN ESPECÍFICA */}
                                                            {room.images && room.images.length > 0 && (
                                                                <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
                                                                    {room.images.map((url, idx) => (
                                                                        <div key={idx} className="w-12 h-12 relative rounded overflow-hidden border border-gray-200 group flex-shrink-0">
                                                                            <img src={url} alt={`Room ${idx+1}`} className="w-full h-full object-cover" />
                                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                                <Download className="w-3 h-3 text-white" />
                                                                            </a>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                             {selectedRequest.status === 'pending_review' && (
                                <button onClick={() => handleApproveAndCreate(selectedRequest)} disabled={!!processingStep} className="px-4 py-2 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {processingStep ? <Loader2 className="w-4 h-4 animate-spin"/> : <PlusCircle className="w-4 h-4"/>}
                                    {processingStep === 'creating_owner' ? 'Creando Propietario...' : processingStep === 'creating_properties' ? 'Creando Activos...' : processingStep === 'finishing' ? 'Finalizando...' : 'Aprobar Todo'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400"><p>Selecciona un traspaso para ver sus detalles.</p></div>
                )}
            </div>
        </div>
    );
};
