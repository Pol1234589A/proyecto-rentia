
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { Candidate, CandidateStatus, StaffMember } from '../../../types';
import { Property } from '../../../data/rooms';
import { UserCheck, Search, Phone, X, CheckCircle, AlertCircle, Loader2, Mail, Calendar, Filter, Archive, Key, Eye, HelpCircle, FileText, UserPlus, Building, ChevronDown, ChevronRight } from 'lucide-react';
import { SensitiveDataDisplay } from '../../common/SecurityComponents';

const STAFF_MEMBERS: StaffMember[] = ['Pol', 'Vanesa', 'Sandra', 'Víctor', 'Ayoub', 'Hugo', 'Colaboradores'];

export const CandidateManager: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [viewMode, setViewMode] = useState<'list' | 'property'>('property'); // Nuevo modo por defecto
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Estado para expansión en vista de propiedades
    const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});

    // Modales de Acción
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [modalMode, setModalMode] = useState<'details' | 'archive' | 'rent' | 'assign' | null>(null);

    // Estados para formularios de modales
    const [archiveReason, setArchiveReason] = useState('');
    const [assignee, setAssignee] = useState<StaffMember | ''>('');
    const [rentSelection, setRentSelection] = useState({ propertyId: '', roomId: '' });
    const [contractParams, setContractParams] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0], // Default 6 months
        price: 0,
        deposit: 0
    });

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

        // Cargar Propiedades
        const fetchProperties = async () => {
            const snap = await getDocs(collection(db, "properties"));
            const props: Property[] = [];
            snap.forEach(doc => props.push({ ...doc.data(), id: doc.id } as Property));
            props.sort((a, b) => a.address.localeCompare(b.address));
            setProperties(props);

            // Expandir todas por defecto al cargar si hay pocas
            if (props.length < 5) {
                const initialExpand: Record<string, boolean> = {};
                props.forEach(p => initialExpand[p.address] = true);
                setExpandedProperties(initialExpand);
            }
        };
        fetchProperties();

        return () => unsubCandidates();
    }, []);

    const showNotification = (type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 3000);
    };

    const togglePropertyExpand = (propName: string) => {
        setExpandedProperties(prev => ({ ...prev, [propName]: !prev[propName] }));
    };

    // --- ACCIONES (Mantener igual) ---
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
                assignedTo: assignee
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
    // ALQUILAR
    const handleRentCandidate = async () => {
        if (!selectedCandidate || !rentSelection.propertyId || !rentSelection.roomId) return alert("Selecciona propiedad y habitación.");

        setProcessingId(selectedCandidate.id);
        try {
            // 1. Crear Contrato en Rentger (si se desea)
            const prop = properties.find(p => p.id === rentSelection.propertyId);
            const room = prop?.rooms.find(r => r.id === rentSelection.roomId);

            if (!prop || !room) throw new Error("Propiedad o habitación no encontrada");

            // Llamada a la API de integración
            try {
                showNotification('success', "Conectando con Rentger...");
                const response = await fetch('/api/rentger/create-contract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidateName: selectedCandidate.candidateName,
                        candidateEmail: selectedCandidate.candidateEmail || `${selectedCandidate.candidateName.replace(/\s+/g, '.').toLowerCase()}@placeholder.com`, // Fallback si no hay email
                        candidatePhone: selectedCandidate.candidatePhone,
                        propertyAddress: prop.address,
                        roomName: room.name,
                        price: contractParams.price,
                        deposit: contractParams.deposit,
                        startDate: contractParams.startDate,
                        endDate: contractParams.endDate
                    })
                });

                const data = await response.json();
                if (!data.success) {
                    console.error("Rentger Error:", data.error);
                    if (!confirm(`Error al crear contrato en Rentger: ${data.error}\n\n¿Quieres continuar y marcarlo como alquilado en RentiA de todas formas?`)) {
                        setProcessingId(null);
                        return;
                    }
                } else {
                    showNotification('success', "¡Contrato Rentger creado y enviado!");
                }
            } catch (err) {
                console.error("Error de conexión con Rentger", err);
                if (!confirm("Falló la conexión con Rentger. ¿Continuar solo en local?")) {
                    setProcessingId(null);
                    return;
                }
            }

            // 2. Actualizar en Firestore (Local)
            await updateDoc(doc(db, "candidate_pipeline", selectedCandidate.id), {
                status: 'rented',
                assignedRoomId: rentSelection.roomId,
                assignedDate: serverTimestamp(),
                propertyId: rentSelection.propertyId
            });

            const propRef = doc(db, "properties", rentSelection.propertyId);
            const updatedRooms = prop.rooms.map(r =>
                r.id === rentSelection.roomId ? { ...r, status: 'occupied' as const } : r
            );
            await updateDoc(propRef, { rooms: updatedRooms });


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
                    (c.candidatePhone && c.candidatePhone.includes(term)) ||
                    (c.propertyName && c.propertyName.toLowerCase().includes(term))
                );
                if (!matches) return false;
            }

            if (activeTab === 'pending') return c.status === 'pending_review';
            if (activeTab === 'approved') return c.status === 'approved';
            if (activeTab === 'rejected') return c.status === 'rejected' || c.status === 'archived' || c.status === 'rented';
            return false;
        });
    }, [candidates, activeTab, searchTerm]);

    // Agrupación por Propiedad
    const groupedByProperty = useMemo(() => {
        const groups: Record<string, Candidate[]> = {};

        // Inicializar grupos con todas las propiedades conocidas (para que aparezcan aunque estén vacías si se desea, o solo las activas)
        // En este caso, mostraremos solo las que tienen candidatos filtrados para no saturar
        filteredCandidates.forEach(c => {
            const propName = c.propertyName || 'Sin Asignar';
            if (!groups[propName]) groups[propName] = [];
            groups[propName].push(c);
        });

        return groups;
    }, [filteredCandidates]);

    const counts = useMemo(() => ({
        pending: candidates.filter(c => c.status === 'pending_review').length,
        approved: candidates.filter(c => c.status === 'approved').length,
        history: candidates.filter(c => ['rejected', 'archived', 'rented'].includes(c.status)).length,
    }), [candidates]);

    // COMPONENTE DE TARJETA DE CANDIDATO (Reutilizable)
    const CandidateCard: React.FC<{ c: Candidate }> = ({ c }) => (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow relative overflow-hidden">

            {/* Visual Indicator of Priority */}
            {c.priority && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.priority === 'Alta' ? 'bg-red-500' : c.priority === 'Media' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
            )}

            <div className="flex-1 w-full min-w-0 pl-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base md:text-lg text-gray-900 truncate flex items-center gap-2">
                        {c.candidateName}
                        {c.priority === 'Alta' && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded border border-red-200 uppercase font-bold animate-pulse">Urgente</span>}
                        {c.status === 'rented' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded border border-green-200 uppercase">Alquilado</span>}
                        {c.status === 'archived' && <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded border border-gray-200 uppercase">Archivado</span>}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                    {c.candidatePhone && (
                        <div className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <SensitiveDataDisplay value={c.candidatePhone} type="phone" />
                        </div>
                    )}
                    <button onClick={() => { setSelectedCandidate(c); setModalMode('details'); }} className="text-xs font-bold text-rentia-blue bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Ver Historial
                    </button>
                </div>

                {c.additionalInfo && (
                    <div className="bg-yellow-50 text-gray-700 text-xs px-3 py-2 rounded-lg border border-yellow-200 mb-3 italic flex items-start gap-2">
                        <FileText className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span>{c.additionalInfo}</span>
                    </div>
                )}

                {/* Solo mostrar propiedad si estamos en modo lista plana, en modo propiedad es redundante */}
                {viewMode === 'list' && (
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-3 bg-gray-50 w-full md:w-fit px-3 py-2 rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-800">{c.propertyName}</span>
                        <span className="text-gray-300">|</span>
                        <span>{c.roomName}</span>
                    </div>
                )}

                {viewMode === 'property' && (
                    <div className="text-xs font-medium text-gray-500 mb-2">
                        Interés: {c.roomName}
                    </div>
                )}

                {c.status === 'approved' && c.assignedTo && (
                    <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit mb-3 border border-blue-100">
                        <strong>Visita asignada a:</strong> {c.assignedTo}
                    </div>
                )}

                {(c.status === 'archived' || c.status === 'rejected') && c.closureReason && (
                    <div className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-100 mb-3">
                        <strong>Motivo:</strong> {c.closureReason}
                    </div>
                )}
            </div>

            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                {c.status === 'pending_review' && (
                    <>
                        <button onClick={() => { setSelectedCandidate(c); setModalMode('assign'); }} disabled={!!processingId} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm flex justify-center items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Aprobar
                        </button>
                        <button onClick={() => handleReject(c.id)} disabled={!!processingId} className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-2">
                            <X className="w-4 h-4" /> Rechazar
                        </button>
                    </>
                )}
                {c.status === 'approved' && (
                    <>
                        <button onClick={() => { setSelectedCandidate(c); setModalMode('rent'); setRentSelection({ propertyId: c.propertyId || '', roomId: c.roomId || '' }); }} className="flex-1 md:flex-none bg-rentia-blue hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm flex justify-center items-center gap-2">
                            <Key className="w-4 h-4" /> Alquilar
                        </button>
                        <button onClick={() => { setSelectedCandidate(c); setModalMode('archive'); }} className="flex-1 md:flex-none bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 px-4 py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-2">
                            <Archive className="w-4 h-4" /> Archivar
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    // RENDERIZADO DE LA LISTA
    const renderList = () => {
        if (loading) return <div className="text-center py-12 flex flex-col items-center gap-2 text-gray-500"><Loader2 className="animate-spin w-8 h-8 text-rentia-blue" />Cargando...</div>;

        if (filteredCandidates.length === 0) {
            return (
                <div className="text-center py-16 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <Filter className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No hay candidatos en esta sección.</p>
                </div>
            );
        }

        if (viewMode === 'list') {
            return (
                <div className="space-y-4">
                    {filteredCandidates.map(c => <CandidateCard key={c.id} c={c} />)}
                </div>
            );
        }

        // VISTA POR PROPIEDAD (ACORDEÓN)
        return (
            <div className="space-y-4">
                {Object.entries(groupedByProperty).map(([propName, cands]: [string, Candidate[]]) => {
                    const isExpanded = expandedProperties[propName] || false;
                    return (
                        <div key={propName} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => togglePropertyExpand(propName)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                                    <div className="text-left">
                                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                            <Building className="w-4 h-4 text-rentia-blue" /> {propName}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{cands.length} candidatos en esta vista</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {cands.some(c => c.status === 'approved') && <span className="w-2 h-2 rounded-full bg-green-500" title="Hay aprobados"></span>}
                                    {cands.some(c => c.status === 'pending_review') && <span className="w-2 h-2 rounded-full bg-yellow-500" title="Hay pendientes"></span>}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="p-4 bg-white border-t border-gray-100 space-y-3 animate-in slide-in-from-top-2">
                                    {cands.map(c => <CandidateCard key={c.id} c={c} />)}
                                </div>
                            )}
                        </div>
                    );
                })}
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
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setViewMode('property')} className={`p-1.5 rounded-md ${viewMode === 'property' ? 'bg-white shadow text-rentia-blue' : 'text-gray-400'}`} title="Agrupar por Propiedad">
                                    <Building className="w-4 h-4" />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow text-rentia-blue' : 'text-gray-400'}`} title="Vista Lista">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="relative flex-grow sm:w-64">
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
            {/* (Mantener modales existentes sin cambios) */}

            {/* 1. Modal Historial / Detalles */}
            {modalMode === 'details' && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Ficha del Candidato</h3>
                            <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-4 text-sm">
                            {/* Contenido modal detalles */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                                    {selectedCandidate.candidateName.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{selectedCandidate.candidateName}</h4>
                                    <div className="text-gray-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> <SensitiveDataDisplay value={selectedCandidate.candidateEmail || 'Sin email'} type="email" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">Teléfono</span><div className="font-mono text-xs"><SensitiveDataDisplay value={selectedCandidate.candidatePhone || '-'} type="phone" /></div></div>
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">Estado Actual</span><span className="font-bold uppercase text-rentia-blue">{selectedCandidate.status}</span></div>
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">Interés</span><span>{selectedCandidate.propertyName} - {selectedCandidate.roomName}</span></div>
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">Captado por</span><span>{selectedCandidate.submittedBy}</span></div>
                                <div><span className="block text-xs font-bold text-gray-400 uppercase">Prioridad</span><span className={`font-bold ${selectedCandidate.priority === 'Alta' ? 'text-red-600' : 'text-gray-700'}`}>{selectedCandidate.priority || 'Media'}</span></div>
                            </div>
                            {selectedCandidate.additionalInfo && (<div><span className="block text-xs font-bold text-gray-400 uppercase mb-1">Notas del Comercial</span><p className="bg-yellow-50 p-3 rounded border border-yellow-100 text-gray-700 italic">"{selectedCandidate.additionalInfo}"</p></div>)}
                            <div className="text-xs text-gray-400 text-center pt-4 border-t">Registrado el: {selectedCandidate.submittedAt?.toDate().toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Modal Asignar */}
            {modalMode === 'assign' && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" /> Asignar Visita</h3><button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-gray-400" /></button></div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">Vas a aprobar a <strong>{selectedCandidate.candidateName}</strong> (Prioridad: {selectedCandidate.priority}). ¿Quién realizará la visita comercial?</p>
                            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Asignar a:</label><select className="w-full p-2 border rounded-lg text-sm bg-white focus:border-green-500 outline-none" value={assignee} onChange={(e) => setAssignee(e.target.value as any)}><option value="">Seleccionar...</option>{STAFF_MEMBERS.map((staff: string) => (<option key={staff} value={staff}>{staff}</option>))}</select></div>
                            <div className="flex justify-end gap-2 pt-2"><button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={handleApproveAndAssign} disabled={!assignee} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm shadow-md disabled:opacity-50 hover:bg-green-700">Confirmar & Aprobar</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Modal Archivar */}
            {modalMode === 'archive' && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-800">Archivar Candidato</h3></div>
                        <div className="p-6 space-y-4"><p className="text-sm text-gray-600">El candidato fue aprobado pero no entrará. ¿Por qué?</p><textarea className="w-full p-3 border rounded-lg text-sm h-24 focus:border-rentia-blue outline-none" placeholder="Ej: Encontró otro piso más barato..." value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} /><div className="flex justify-end gap-2"><button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancelar</button><button onClick={handleArchiveCandidate} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm">Archivar</button></div></div>
                    </div>
                </div>
            )}

            {/* 4. Modal Alquilar */}
            {modalMode === 'rent' && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b bg-green-50 flex items-center gap-2 text-green-800"><CheckCircle className="w-5 h-5" /><h3 className="font-bold">Formalizar Alquiler</h3></div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">Confirma la asignación. Esto creará el contrato en Rentger y ocupará la habitación.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Propiedad</label>
                                    <select className="w-full p-2 border rounded-lg text-sm bg-white" value={rentSelection.propertyId} onChange={(e) => setRentSelection({ ...rentSelection, propertyId: e.target.value, roomId: '' })}>
                                        <option value="">Seleccionar...</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Habitación</label>
                                    <select
                                        className="w-full p-2 border rounded-lg text-sm bg-white disabled:bg-gray-100"
                                        value={rentSelection.roomId}
                                        onChange={(e) => {
                                            const rid = e.target.value;
                                            const prop = properties.find(p => p.id === rentSelection.propertyId);
                                            const room = prop?.rooms.find(r => r.id === rid);
                                            setRentSelection({ ...rentSelection, roomId: rid });
                                            if (room) {
                                                setContractParams(prev => ({ ...prev, price: room.price, deposit: room.price }));
                                            }
                                        }}
                                        disabled={!rentSelection.propertyId}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {properties.find(p => p.id === rentSelection.propertyId)?.rooms.map(r => (<option key={r.id} value={r.id}>{r.name} ({r.status}) - {r.price}€</option>))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fecha Inicio</label>
                                    <input type="date" className="w-full p-2 border rounded-lg text-sm" value={contractParams.startDate} onChange={(e) => setContractParams({ ...contractParams, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fecha Fin</label>
                                    <input type="date" className="w-full p-2 border rounded-lg text-sm" value={contractParams.endDate} onChange={(e) => setContractParams({ ...contractParams, endDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Precio (€)</label>
                                    <input type="number" className="w-full p-2 border rounded-lg text-sm" value={contractParams.price} onChange={(e) => setContractParams({ ...contractParams, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fianza (€)</label>
                                    <input type="number" className="w-full p-2 border rounded-lg text-sm" value={contractParams.deposit} onChange={(e) => setContractParams({ ...contractParams, deposit: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancelar</button>
                                <button onClick={handleRentCandidate} disabled={!!processingId} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
                                    {processingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                    Crear Contrato y Alquilar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
