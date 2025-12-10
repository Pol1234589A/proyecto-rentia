
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { OpportunityRequest, AssetSubmission, Opportunity } from '../../types';
import { CheckCircle, XCircle, Eye, User, Calendar, MapPin, Building, Briefcase, ChevronDown, ChevronRight, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export const OpportunityRequestManager: React.FC = () => {
    const [requests, setRequests] = useState<OpportunityRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<OpportunityRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "opportunity_requests"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: OpportunityRequest[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                list.push({ ...data, id: doc.id } as OpportunityRequest);
            });
            setRequests(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, status: OpportunityRequest['status']) => {
        try {
            await updateDoc(doc(db, "opportunity_requests", id), { status });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta solicitud permanentemente?")) return;
        try {
            await deleteDoc(doc(db, "opportunity_requests", id));
            if (selectedRequest?.id === id) setSelectedRequest(null);
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const convertToOpportunity = async (req: OpportunityRequest, asset: AssetSubmission) => {
        if (!confirm(`¿Aprobar y publicar "${asset.title}" como Oportunidad Real?`)) return;
        setProcessing(true);
        try {
            // Mapeo inteligente de AssetSubmission -> Opportunity
            const purchasePrice = req.packPrice && req.assets.length > 1 ? (req.packPrice / req.assets.length) : asset.price;
            
            const newOpp: Omit<Opportunity, 'id'> = {
                title: asset.title,
                address: asset.address,
                city: asset.municipality,
                description: `Oportunidad procedente de colaborador (${req.collaborator.name}). Estado: ${asset.state}. ${asset.rentalStatus}.`,
                features: [
                    `${asset.builtMeters} m² construidos`,
                    `${asset.rooms} Habitaciones`,
                    `${asset.baths} Baños`,
                    asset.hasElevator ? 'Con Ascensor' : 'Sin Ascensor',
                    asset.hasTerrace ? 'Terraza' : '',
                    asset.hasParking ? 'Parking' : ''
                ].filter(Boolean),
                areaBenefits: [asset.zone],
                images: asset.images.length > 0 ? asset.images : ['https://placehold.co/600x400?text=No+Image'],
                videos: [],
                scenario: asset.rentalStatus === 'Alquilada por habitaciones' ? 'rent_rooms' : 'rent_traditional', // Heuristic
                visibility: 'exact',
                specs: {
                    rooms: asset.rooms,
                    bathrooms: asset.baths,
                    sqm: asset.builtMeters,
                    floor: '', // Not in form explicitly, maybe parse address
                    hasElevator: asset.hasElevator
                },
                financials: {
                    purchasePrice: purchasePrice,
                    itpPercent: asset.itpPercent,
                    reformCost: asset.state === 'A reformar' ? 15000 : 0, // Estimación base
                    furnitureCost: 0,
                    notaryAndTaxes: 1500 + (purchasePrice * (asset.itpPercent/100)),
                    totalInvestment: purchasePrice * 1.15, // Estimación rápida
                    monthlyRentProjected: asset.currentRent || 0,
                    monthlyRentTraditional: asset.currentRent || 0,
                    yearlyExpenses: asset.ibi + (asset.communityFees * 12),
                    marketValue: purchasePrice * 1.1,
                    appreciationRate: 3,
                    agencyFees: 3000
                },
                status: 'available',
                tags: ['Colaboración', asset.type],
                roomConfiguration: []
            };

            await addDoc(collection(db, "opportunities"), newOpp);
            await updateDoc(doc(db, "opportunity_requests", req.id), { status: 'approved' });
            alert("Activo publicado en Oportunidades exitosamente.");
        } catch (error) {
            console.error(error);
            alert("Error al convertir.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-rentia-blue"/></div>;

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-rentia-blue" /> Solicitudes ({requests.length})
                    </h3>
                </div>
                <div className="overflow-y-auto flex-grow p-2 space-y-2">
                    {requests.map(req => (
                        <div 
                            key={req.id} 
                            onClick={() => setSelectedRequest(req)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedRequest?.id === req.id ? 'bg-white border-rentia-blue shadow-md' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${req.status === 'new' ? 'bg-blue-100 text-blue-700' : req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {req.status}
                                </span>
                                <span className="text-[10px] text-gray-400">{req.createdAt?.toDate().toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-800 truncate">{req.collaborator.name}</h4>
                            <p className="text-xs text-gray-500 truncate">{req.assets.length} activos • {req.isPack ? 'Pack' : 'Individual'}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className="w-2/3 bg-white flex flex-col overflow-hidden">
                {selectedRequest ? (
                    <div className="flex flex-col h-full">
                        {/* Header Detail */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <User className="w-5 h-5 text-gray-400" /> {selectedRequest.collaborator.name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                    <span>{selectedRequest.collaborator.email}</span>
                                    <span>•</span>
                                    <span>{selectedRequest.collaborator.phone}</span>
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase font-bold">{selectedRequest.collaborator.relation}</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDelete(selectedRequest.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><XCircle className="w-5 h-5"/></button>
                            </div>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
                            
                            {/* Assets List */}
                            <div className="space-y-6">
                                {selectedRequest.assets.map((asset, idx) => (
                                    <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                            <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                <Building className="w-4 h-4 text-rentia-blue" />
                                                {asset.title}
                                            </h4>
                                            <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                                {asset.price.toLocaleString()} €
                                            </span>
                                        </div>
                                        
                                        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Ubicación</p>
                                                <p>{asset.address}</p>
                                                <p className="text-gray-500">{asset.municipality}, {asset.region}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Características</p>
                                                <p>{asset.builtMeters} m² • {asset.rooms} Hab • {asset.baths} Baños</p>
                                                <p className="text-gray-500">{asset.state} • {asset.yearBuilt}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Fiscalidad</p>
                                                <p>IBI: {asset.ibi}€ • Com: {asset.communityFees}€</p>
                                                <p>ITP: {asset.itpPercent}%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Alquiler</p>
                                                <p>{asset.rentalStatus}</p>
                                                {asset.currentRent ? <p className="font-bold text-blue-600">{asset.currentRent}€ / mes</p> : null}
                                            </div>
                                        </div>

                                        {asset.images.length > 0 && (
                                            <div className="px-4 pb-4 overflow-x-auto flex gap-2">
                                                {asset.images.map((img, i) => (
                                                    <img key={i} src={img} className="w-20 h-20 object-cover rounded border border-gray-200" />
                                                ))}
                                            </div>
                                        )}

                                        <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-end">
                                            <button 
                                                onClick={() => convertToOpportunity(selectedRequest, asset)}
                                                disabled={processing || selectedRequest.status === 'approved'}
                                                className="flex items-center gap-2 bg-rentia-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-50"
                                            >
                                                {processing ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3"/>}
                                                Aprobar y Publicar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedRequest.isPack && (
                                <div className="mt-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                    <h4 className="font-bold text-indigo-900 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Pack Indivisible</h4>
                                    <p className="text-sm text-indigo-700 mt-1">
                                        Precio total del pack: <strong>{selectedRequest.packPrice?.toLocaleString()} €</strong>
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Selecciona una solicitud para ver detalles.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
