
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { Building, User, FileText, CheckCircle, X, Trash2, Eye, Bed, Euro, Calculator, AlertTriangle, PlusCircle, EyeOff, Loader2 } from 'lucide-react';
import { ManagementLead } from '../../types';

export const ManagementLeadsManager: React.FC = () => {
    const [leads, setLeads] = useState<ManagementLead[]>([]);
    const [selectedLead, setSelectedLead] = useState<ManagementLead | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "management_leads"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const list: ManagementLead[] = [];
            snapshot.forEach(doc => {
                list.push({ ...doc.data(), id: doc.id } as ManagementLead);
            });
            setLeads(list);
        });
        return () => unsub();
    }, []);

    const handleApprove = async () => {
        if (!selectedLead) return;
        if (!confirm("¿Seguro que quieres aprobar este lead?\n\nSe verificará el Propietario (o creará si no existe) y se creará la Propiedad vinculada.")) return;

        setIsProcessing(true);
        try {
            const lead = selectedLead;
            let ownerId = '';

            // 1. Check if we already have the ID (Public Registration) OR Find by Email (Legacy/Manual)
            if (lead.linkedOwnerId) {
                ownerId = lead.linkedOwnerId;
                console.log("Usuario vinculado detectado:", ownerId);
            } else {
                const qUsers = query(collection(db, "users"), where("email", "==", lead.contact.email));
                const userSnap = await getDocs(qUsers);

                if (!userSnap.empty) {
                    ownerId = userSnap.docs[0].id;
                    console.log("Usuario existente encontrado por email:", ownerId);
                } else {
                    // Create new User Profile ONLY (No Auth - Admin must set password manually later or send invite)
                    // NOTA: Si el usuario no se creó en el paso público, aquí creamos solo el registro en Firestore.
                    // Para que pueda acceder, necesitaría un proceso de alta de Auth separado.
                    const newUserRef = await addDoc(collection(db, "users"), {
                        name: lead.contact.name,
                        email: lead.contact.email,
                        phone: lead.contact.phone,
                        dni: lead.contact.dni,
                        role: 'owner',
                        createdAt: serverTimestamp(),
                        active: true,
                        gdpr: lead.consent ? {
                            signed: true,
                            signedAt: lead.consent.date,
                            documentVersion: lead.consent.version
                        } : { signed: false }
                    });
                    ownerId = newUserRef.id;
                    console.log("Nuevo perfil de usuario creado (Sin Auth):", ownerId);
                }
            }

            // 2. Convert to Property Structure
            const roomsData = lead.pricing.rooms 
                ? lead.pricing.rooms.map((r, idx) => ({
                    id: `${lead.property.address.replace(/[^a-zA-Z0-9]/g,'').slice(0,5)}_H${idx+1}`,
                    name: r.name,
                    price: r.price,
                    status: 'available',
                    images: r.images,
                    availableFrom: 'Inmediata',
                    targetProfile: 'both',
                    expenses: 'Gastos fijos aparte'
                }))
                : []; 

            const newProperty: any = {
                ownerId: ownerId, // LINK TO OWNER
                address: lead.property.address,
                city: lead.property.city,
                image: lead.images.common.length > 0 ? lead.images.common[0] : '',
                googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.property.address)}`,
                rooms: roomsData,
                internalNotes: `IBI: ${lead.property.ibi}, Com: ${lead.property.communityFee}. RefCat: ${lead.property.catastralRef}. Observaciones: ${lead.property.observations}`,
                managementCommission: lead.calculatorData.estimatedFee,
                cleaningConfig: { enabled: false, days: [], hours: '', costPerHour: 10, included: false }
            };

            // 3. Add to properties
            await addDoc(collection(db, "properties"), newProperty);
            
            // 4. Update lead status
            await updateDoc(doc(db, "management_leads", lead.id), { status: 'approved', linkedOwnerId: ownerId });
            
            alert("Propietario verificado y Activo creado correctamente. Lead archivado.");
            setSelectedLead(null);

        } catch (e) {
            console.error(e);
            alert("Error crítico al procesar. Revisa la consola.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar solicitud permanentemente?")) return;
        await deleteDoc(doc(db, "management_leads", id));
        if (selectedLead?.id === id) setSelectedLead(null);
    };

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div className="p-4 border-b bg-white font-bold text-gray-800">Solicitudes Gestión ({leads.filter(l => l.status === 'new').length})</div>
                <div className="overflow-y-auto p-2 space-y-2 flex-grow">
                    {leads.map(lead => (
                        <div key={lead.id} onClick={() => setSelectedLead(lead)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedLead?.id === lead.id ? 'bg-white border-rentia-blue shadow-md' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{lead.status}</span>
                                <span className="text-[10px] text-gray-400">{lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : ''}</span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 truncate">{lead.property.address}</h4>
                            <p className="text-xs text-gray-500">{lead.contact.name}</p>
                            {lead.linkedOwnerId && <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded border border-purple-200 mt-1 inline-block">Usuario Registrado</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="w-2/3 bg-white flex flex-col overflow-hidden">
                {selectedLead ? (
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2"><Building className="w-5 h-5 text-rentia-blue"/> {selectedLead.property.address}</h2>
                                <p className="text-xs text-gray-500">{selectedLead.property.city} • {selectedLead.property.type}</p>
                            </div>
                            <button onClick={() => handleDelete(selectedLead.id)} className="p-2 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-6 space-y-6">
                            
                            {/* Contact Info */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2"><User className="w-4 h-4"/> Propietario</h3>
                                    {selectedLead.linkedOwnerId && <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">Cuenta Activa</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <p><strong>Nombre:</strong> {selectedLead.contact.name}</p>
                                    <p><strong>DNI:</strong> {selectedLead.contact.dni}</p>
                                    <p><strong>Tel:</strong> {selectedLead.contact.phone}</p>
                                    <p><strong>Email:</strong> {selectedLead.contact.email}</p>
                                </div>
                                {selectedLead.consent && (
                                    <div className="mt-3 text-xs text-green-600 bg-green-50 p-2 rounded flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3"/> RGPD Aceptado: {selectedLead.consent.date?.toDate().toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {/* Financials & Strategy */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h3 className="text-xs font-bold uppercase text-blue-800 mb-2 flex items-center gap-2"><Calculator className="w-4 h-4"/> Estrategia</h3>
                                    <p className="text-lg font-bold text-blue-900 capitalize">{selectedLead.pricing.strategy === 'rooms' ? 'Por Habitaciones' : 'Tradicional'}</p>
                                    {selectedLead.pricing.strategy === 'traditional' && <p className="text-sm">Precio: {selectedLead.pricing.traditionalPrice}€</p>}
                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                        <p className="text-xs">Tarifa pactada: <strong>{selectedLead.calculatorData.estimatedFee}%</strong></p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2"><FileText className="w-4 h-4"/> Datos Finca</h3>
                                    <p className="text-xs"><strong>RefCat:</strong> {selectedLead.property.catastralRef}</p>
                                    <p className="text-xs"><strong>IBI:</strong> {selectedLead.property.ibi}</p>
                                    <p className="text-xs"><strong>Comunidad:</strong> {selectedLead.property.communityFee}</p>
                                    <p className="text-xs"><strong>Derramas:</strong> {selectedLead.property.derramas}</p>
                                </div>
                            </div>

                            {/* Rooms / Photos */}
                            <div>
                                <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Habitaciones & Fotos</h3>
                                {selectedLead.pricing.rooms ? (
                                    <div className="space-y-2">
                                        {selectedLead.pricing.rooms.map((r, i) => (
                                            <div key={i} className="bg-white border rounded-lg p-3 flex gap-4 items-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                    {r.images[0] ? <img src={r.images[0]} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><EyeOff className="w-6 h-6"/></div>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{r.name}</p>
                                                    <p className="text-xs text-gray-500">{r.price}€ / mes</p>
                                                    <p className="text-[10px] text-gray-400">{r.images.length} fotos</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm italic text-gray-400">Sin desglose de habitaciones (Alquiler tradicional)</p>
                                )}

                                <div className="mt-4">
                                    <p className="text-xs font-bold mb-2">Fotos Comunes:</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {selectedLead.images.common.map((img, i) => (
                                            <img key={i} src={img} className="w-20 h-20 rounded border object-cover"/>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Observations */}
                            {selectedLead.property.observations && (
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-900 italic">
                                    "{selectedLead.property.observations}"
                                </div>
                            )}

                        </div>

                        {/* Footer Actions */}
                        {selectedLead.status === 'new' && (
                            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                                <button 
                                    onClick={handleApprove} 
                                    disabled={isProcessing}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                                    {isProcessing ? 'Procesando...' : selectedLead.linkedOwnerId ? 'Aprobar y Vincular' : 'Aprobar y Crear Todo'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">Selecciona una solicitud</div>
                )}
            </div>
        </div>
    );
};
