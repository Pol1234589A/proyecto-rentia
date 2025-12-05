
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { Candidate, CandidateStatus, StaffMember } from '../../../types';
import { Property, Room } from '../../../data/rooms';
import { UserCheck, Search, Phone, X, CheckCircle, AlertCircle, Loader2, Mail, Calendar, Filter, Archive, Key, Eye, HelpCircle, FileText, UserPlus } from 'lucide-react';
import { SensitiveDataDisplay } from '../../common/SecurityComponents';

const STAFF_MEMBERS: StaffMember[] = ['Pol', 'Sandra', 'Víctor', 'Ayoub', 'Hugo', 'Colaboradores'];

export const CandidateManager: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modales de Acción
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [modalMode, setModalMode] = useState<'details' | 'archive' | 'rent' | 'assign' | null>(null);
    
    // Estados para formularios de modales
    const [archiveReason, setArchiveReason] = useState('');
    const [assignee, setAssignee] = useState<StaffMember | ''>('');
    const [rentSelection, setRentSelection] = useState({ propertyId: '', roomId: '' });

    useEffect(() => {
        // Cargar Candidatos
        const q = query(collection(db, "candidate_pipeline"), orderBy("submittedAt", "desc"));
        const unsubCandidates = onSnapshot(q, (snapshot) => {
            const newCandidates: Candidate[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return { ...data, id: doc.id } as Candidate;
            });
            setCandidates(newCandidates);
            setLoading(false);
        });

        // Cargar Propiedades (para el selector de asignación)
        const fetchProperties = async () => {
            const snap = await getDocs(collection(db, "properties"));
            const props: Property[] = [];
            snap.forEach(doc => props.push({ ...doc.data(), id: doc.id } as Property));
            setProperties(props);
        };
        fetchProperties();

        return () => unsubCandidates();
    }, []);

    const showNotification = (type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 3000);
    };

    // Rechazar
    const handleReject = async (id: string) => {
        setProcessingId(id);
        try {
            await updateDoc(doc(db, "candidate_pipeline", id), { status: 'rejected' });
            showNotification('success', "Candidato rechazado.");
        } catch (error) {
            showNotification('error', "Error al rechazar.");
        } finally {
            setProcessingId(null);
        }
    };

    // APROBAR Y ASIGNAR VISITA
    const handleApproveAndAssign = async () => {
        if (!selectedCandidate || !assignee) return alert("Debes asignar la visita a alguien.");
        setProcessingId(selectedCandidate.id);
        try {
            await updateDoc(doc(db, "candidate_pipeline", selectedCandidate.id), { 
                status: 'approved',
                assignedTo: assignee // Nuevo campo para WorkerDashboard
            });
            showNotification('success', `Aprobado y asignado a ${assignee}.`);
            setModalMode(null);
            setAssignee('');
        } catch (error) {
            console.error(error);
            showNotification('error', "Error al aprobar.");
        } finally {
            setProcessingId(null);
        }
    };

    // ARCHIVAR
    const handleArchiveCandidate = async () => {
        if (!selectedCandidate || !archiveReason) return alert("Debes indicar un motivo.");
        setProcessingId(selectedCandidate.id);
        try {
            await updateDoc(doc(db, "candidate_pipeline", selectedCandidate.id), {
                status: 'archived',
                closureReason: archiveReason,
                assignedDate: serverTimestamp()
            });
            showNotification('success', "Candidato archivado correctamente.");
            setModalMode(null);
            setArchiveReason('');
        } catch (e) {
            showNotification('error', "Error al archivar.");
        } finally {
            setProcessingId(null);
        }
    };

    // ALQUILAR
    const handleRentCandidate = async () => {
        if (!selectedCandidate || !rentSelection.propertyId || !rentSelection.roomId) return alert("Selecciona propiedad y habitación.");
        setProcessingId(selectedCandidate.id);
        try {
            // 1. Actualizar Candidato
            await updateDoc(doc(db, "candidate_pipeline", selectedCandidate.id), {
                status: 'rented',
                assignedRoomId: rentSelection.roomId,
                assignedDate: serverTimestamp(),
                propertyId: rentSelection.propertyId 
            });

            // 2. Actualizar Habitación a 'occupied'
            const propRef = doc(db, "properties", rentSelection.propertyId);
            const prop = properties.find(p => p.id === rentSelection.propertyId);
            if (prop) {
                const updatedRooms = prop.rooms.map(r => 
                    r.id === rentSelection.roomId ? { ...r, status: 'occupied' as const } : r
                );
                await updateDoc(propRef, { rooms: updatedRooms });
            }

            showNotification('success', "¡Éxito! Candidato asignado y habitación ocupada.");
            setModalMode(null);
            setRentSelection({ propertyId: '', roomId: '' });
        } catch (e) {
            console.error(e);
            showNotification('error', "Error al procesar el alquiler.");
        } finally {
            setProcessingId(null);
        }
    };
    
    // Filtrado
    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => {
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const matches = (
                    (c.candidateName && c.candidateName.toLowerCase().includes(term)) ||
                    (c.candidatePhone && c.candidatePhone.includes(term))
                );
                if (!matches) return false;
            }
            
            if (activeTab === 'pending') return c.status === 'pending_review';
            if (activeTab === 'approved') return c.status === 'approved'; 
            if (activeTab === 'rejected') return c.status === 'rejected' || c.status === 'archived' || c.status === 'rented';
            return false;
        });
    }, [candidates, activeTab, searchTerm]);

    const counts = useMemo(() => ({
        pending: candidates.filter(c => c.status === 'pending_review').length,
        approved: candidates.filter(c => c.status === 'approved').length,
        history: candidates.filter(c => ['rejected', 'archived', 'rented'].includes(c.status)).length,
    }), [candidates]);

    // RENDERIZADO DE LA LISTA
    const renderList = () => {
        if (loading) return <div className="text-center py-12 flex flex-col items-center gap-2 text-gray-500"><Loader2 className="animate-spin w-8 h-8 text-rentia-blue"/>Cargando...</div>;
        
        if (filteredCandidates.length === 0) {
            return (
                <div className="text-center py-16 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <Filter className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No hay candidatos en esta sección.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredCandidates.map(c => (
                    <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow">
                        <div className="flex-1 w-full min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-lg text-gray-900 truncate flex items-center gap-2">
                                    {c.candidateName}
                                    {c.status === 'rented' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded border border-green-200 uppercase">Alquilado</span>}
                                    {c.status === 'archived' && <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded border border-gray-200 uppercase">Archivado</span>}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                                {c.candidatePhone && (
                                    <div className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                        <Phone className="w-3 h-3"/> 
                                        <SensitiveDataDisplay value={c.candidatePhone} type="phone" />
                                    </div>
                                )}
                                <button onClick={() => { setSelectedCandidate(c); setModalMode('details'); }} className="text-xs font-bold text-rentia-blue bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                                    <Eye className="w-3 h-3"/> Ver Historial
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-3 bg-gray-50 w-full md:w-fit px-3 py-2 rounded-lg border border-gray-100">
                                <span className="font-bold text-gray-800">{c.propertyName}</span>
                                <span className="text-gray-300">|</span>
                                <span>{c.roomName}</span>
                            </div>

                            {/* Mostrar quién tiene asignada la visita si está aprobado */}
                            {c.status === 'approved' && c.assignedTo && (
                                <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit mb-3 border border-blue-100">
                                    <strong>Visita Asignada a:</strong> {c.assignedTo}
                                </div>
                            )}
                            
                            {/* Mostrar motivo si está archivado/rechazado */}
                            {(c.status === 'archived' || c.status === 'rejected') && c.closureReason && (
                                <div className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-100 mb-3">
                                    <strong>Motivo:</strong> {c.closureReason}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                            {/* ACCIONES PENDIENTES */}
                            {c.status === 'pending_review' && (
                                <>
                                    <button 
                                        onClick={() => { setSelectedCandidate(c); setModalMode('assign'); }} 
                                        disabled={!!processingId} 
                                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm flex justify-center items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Aprobar
                                    </button>
                                    <button onClick={() => handleReject(c.id)} disabled={!!processingId} className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-2">
                                        <X className="w-4 h-4" /> Rechazar
                                    </button>
                                </>
                            )}
                            
                            {/* ACCIONES APROBADOS */}
                            {c.status === 'approved' && (
                                <>
                                    <button 
                                        onClick={() => { setSelectedCandidate(c); setModalMode('rent'); setRentSelection({ propertyId: c.propertyId, roomId: c.roomId }); }} 
                                        className="flex-1 md:flex-none bg-rentia-blue hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm flex justify-center items-center gap-2"
                                    >
                                        <Key className="w-4 h-4" /> Formalizar Alquiler
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedCandidate(c); setModalMode('archive'); }} 
                                        className="flex-1 md:flex-none bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 px-4 py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-2"
                                    >
                                        <Archive className="w-4 h-4" /> No entró (Archivar)
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
        <div id="candidate-manager" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col w-full relative mb-12">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold text-rentia-black flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-rentia-blue" /> Pipeline Candidatos
                    </h3>
                    <div className="relative w-full sm:w-64">
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-rentia-blue outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-xl gap-1 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('pending')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'pending' ? 'bg-white shadow text-yellow-700' : 'text-gray-500'}`}>
                        Pendientes ({counts.pending})
                    </button>
                    <button onClick={() => setActiveTab('approved')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'approved' ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}>
                        Aprobados ({counts.approved})
                    </button>
                    <button onClick={() => setActiveTab('rejected')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'rejected' ? 'bg-white shadow text-gray-700' : 'text-gray-500'}`}>
                        Historial ({counts.history})
                    </button>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`px-4 py-2 text-xs font-bold text-center ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notification.text}
                </div>
            )}

            {/* List */}
            <div className="p-4 bg-gray-50 min-h-[400px]">
                {renderList()}
            </div>
        </div>

        {/* --- MODALES --- */}

        {/* 1. Modal Historial / Detalles */}
        {modalMode === 'details' && selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">Ficha del Candidato</h3>
                        <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-gray-400"/></button>
                    </div>
                    <div className="p-6 space-y-4 text-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                                {selectedCandidate.candidateName.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{selectedCandidate.candidateName}</h4>
                                <div className="text-gray-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3"/> <SensitiveDataDisplay value={selectedCandidate.candidateEmail || 'Sin email'} type="email" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Teléfono</span>
                                <div className="font-mono text-xs"><SensitiveDataDisplay value={selectedCandidate.candidatePhone || '-'} type="phone" /></div>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Estado Actual</span>
                                <span className="font-bold uppercase text-rentia-blue">{selectedCandidate.status}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Interés</span>
                                <span>{selectedCandidate.propertyName} - {selectedCandidate.roomName}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Captado por</span>
                                <span>{selectedCandidate.submittedBy}</span>
                            </div>
                            {selectedCandidate.sourcePlatform && (
                                <div className="col-span-2">
                                    <span className="block text-xs font-bold text-gray-400 uppercase">Plataforma Origen</span>
                                    <span>{selectedCandidate.sourcePlatform}</span>
                                </div>
                            )}
                        </div>

                        {selectedCandidate.additionalInfo && (
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Notas del Comercial</span>
                                <p className="bg-yellow-50 p-3 rounded border border-yellow-100 text-gray-700 italic">
                                    "{selectedCandidate.additionalInfo}"
                                </p>
                            </div>
                        )}

                        {selectedCandidate.closureReason && (
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Motivo Cierre/Rechazo</span>
                                <p className="bg-red-50 p-3 rounded border border-red-100 text-red-700">
                                    {selectedCandidate.closureReason}
                                </p>
                            </div>
                        )}
                        
                        <div className="text-xs text-gray-400 text-center pt-4 border-t">
                            Registrado el: {selectedCandidate.submittedAt?.toDate().toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 2. Modal Asignar Visita (APROBACIÓN) */}
        {modalMode === 'assign' && selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-green-600"/> Asignar Visita
                        </h3>
                        <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-gray-400"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600">
                            Vas a aprobar a <strong>{selectedCandidate.candidateName}</strong>. ¿Quién realizará la visita comercial?
                        </p>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Asignar a:</label>
                            <select 
                                className="w-full p-2 border rounded-lg text-sm bg-white focus:border-green-500 outline-none"
                                value={assignee}
                                onChange={(e) => setAssignee(e.target.value as any)}
                            >
                                <option value="">Seleccionar...</option>
                                {STAFF_MEMBERS.map(staff => (
                                    <option key={staff} value={staff}>{staff}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={handleApproveAndAssign} disabled={!assignee} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm shadow-md disabled:opacity-50 hover:bg-green-700">Confirmar & Aprobar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 3. Modal Archivar (Motivo) */}
        {modalMode === 'archive' && selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-800">Archivar Candidato</h3></div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600">El candidato fue aprobado pero no entrará. ¿Por qué?</p>
                        <textarea 
                            className="w-full p-3 border rounded-lg text-sm h-24 focus:border-rentia-blue outline-none"
                            placeholder="Ej: Encontró otro piso más barato, dejó de contestar, no pasó el filtro final..."
                            value={archiveReason}
                            onChange={(e) => setArchiveReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancelar</button>
                            <button onClick={handleArchiveCandidate} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm">Archivar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 4. Modal Alquilar (Selección Habitación) */}
        {modalMode === 'rent' && selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 border-b bg-green-50 flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-5 h-5"/>
                        <h3 className="font-bold">Formalizar Alquiler</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600">Confirma la asignación. Esto marcará la habitación como "Ocupada" en el sistema.</p>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Propiedad</label>
                            <select 
                                className="w-full p-2 border rounded-lg text-sm bg-white"
                                value={rentSelection.propertyId}
                                onChange={(e) => setRentSelection({ ...rentSelection, propertyId: e.target.value, roomId: '' })}
                            >
                                <option value="">Seleccionar...</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Habitación</label>
                            <select 
                                className="w-full p-2 border rounded-lg text-sm bg-white disabled:bg-gray-100"
                                value={rentSelection.roomId}
                                onChange={(e) => setRentSelection({ ...rentSelection, roomId: e.target.value })}
                                disabled={!rentSelection.propertyId}
                            >
                                <option value="">Seleccionar...</option>
                                {properties.find(p => p.id === rentSelection.propertyId)?.rooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancelar</button>
                            <button onClick={handleRentCandidate} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md">Confirmar Alquiler</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
