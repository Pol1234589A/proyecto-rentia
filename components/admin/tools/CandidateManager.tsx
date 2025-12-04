
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, onSnapshot, updateDoc, doc, query, where } from 'firebase/firestore';
import { Candidate, CandidateStatus } from '../../../types';
import { UserCheck, Search, Phone, X, CheckCircle, Archive, AlertCircle } from 'lucide-react';

export const CandidateManager: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Escuchamos todos los estados relevantes
        const q = query(
            collection(db, "candidate_pipeline"), 
            where("status", "in", ["pending_review", "approved", "rejected"])
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newCandidates: Candidate[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    ...data, 
                    id: doc.id,
                    // Aseguramos que siempre haya un status válido para evitar inconsistencias
                    status: data.status || 'pending_review' 
                } as Candidate;
            });
            
            // Ordenar por fecha (más reciente primero)
            newCandidates.sort((a, b) => {
                const timeA = a.submittedAt?.seconds || 0;
                const timeB = b.submittedAt?.seconds || 0;
                return timeB - timeA;
            });

            setCandidates(newCandidates);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = async (id: string, status: CandidateStatus) => {
        try {
            await updateDoc(doc(db, "candidate_pipeline", id), { status });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar el estado");
        }
    };
    
    // Filtrado en tiempo real (sin useMemo para evitar stale state en contadores visuales)
    const filteredCandidates = candidates.filter(c => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            c.candidateName?.toLowerCase().includes(term) ||
            (c.candidatePhone && c.candidatePhone.includes(term)) ||
            (c.candidateEmail && c.candidateEmail.toLowerCase().includes(term)) ||
            c.propertyName?.toLowerCase().includes(term) ||
            c.roomName?.toLowerCase().includes(term)
        );
    });

    // Derivación directa de listas por estado para garantizar consistencia absoluta entre contador y lista
    const pendingList = filteredCandidates.filter(c => c.status === 'pending_review');
    const approvedList = filteredCandidates.filter(c => c.status === 'approved');
    const rejectedList = filteredCandidates.filter(c => c.status === 'rejected');

    const renderList = (items: Candidate[]) => {
        if (loading) return <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rentia-blue"></div>Cargando...</div>;
        
        if (items.length === 0) {
            return (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">No hay candidatos en esta sección.</p>
                    {searchTerm && <p className="text-sm text-gray-400 mt-1">Prueba a limpiar el buscador.</p>}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {items.map(c => (
                    <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start gap-4 animate-in fade-in slide-in-from-left-2">
                        <div className="flex-1 w-full min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="font-bold text-lg text-gray-900 truncate">{c.candidateName}</span>
                                {c.candidatePhone && (
                                    <a href={`tel:${c.candidatePhone}`} className="text-xs font-bold text-rentia-blue bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1 hover:bg-blue-100 transition-colors">
                                        <Phone className="w-3 h-3"/> {c.candidatePhone}
                                    </a>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-3 bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                                <span className="font-bold text-gray-800">{c.propertyName}</span>
                                <span className="text-gray-300">|</span>
                                <span>Habitación: {c.roomName}</span>
                            </div>
                            
                            {c.additionalInfo && (
                                <div className="text-sm text-gray-600 bg-yellow-50/50 p-3 border border-yellow-100 rounded-lg whitespace-pre-line leading-relaxed mb-3 relative">
                                    <AlertCircle className="w-4 h-4 text-yellow-400 absolute top-3 right-3 opacity-50" />
                                    {c.additionalInfo}
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 border-t border-gray-50 pt-2">
                                <span>Enviado por: <span className="font-medium text-gray-600">{c.submittedBy}</span></span>
                                <span>{c.submittedAt?.toDate ? c.submittedAt.toDate().toLocaleDateString() + ' ' + c.submittedAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Fecha desconocida'}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                            {activeTab === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => handleUpdateStatus(c.id, 'approved')} 
                                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 flex justify-center items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Aprobar
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(c.id, 'rejected')} 
                                        className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 px-4 py-2 text-sm font-bold rounded-lg border border-red-200 transition-colors shadow-sm flex justify-center items-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> Rechazar
                                    </button>
                                </>
                            )}
                            {activeTab !== 'pending' && (
                                <button onClick={() => handleUpdateStatus(c.id, 'archived')} className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 flex items-center gap-2 justify-center transition-colors">
                                    <Archive className="w-3 h-3"/> Archivar
                                </button>
                            )}
                            {/* Move back to pending option if mistake */}
                            {activeTab !== 'pending' && (
                                <button onClick={() => handleUpdateStatus(c.id, 'pending_review')} className="flex-1 md:flex-none text-rentia-blue hover:underline text-[10px] text-center mt-1">
                                    Volver a Pendiente
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div id="candidate-manager" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-rentia-black flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-rentia-blue" /> Gestor de Candidatos
                </h3>
                
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar nombre, tlf, piso..." 
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 bg-gray-50 focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 w-full overflow-x-auto no-scrollbar bg-gray-50/50 px-4">
                <button 
                    onClick={() => setActiveTab('pending')} 
                    className={`px-4 py-3 text-sm font-bold flex items-center gap-2 flex-shrink-0 border-b-2 transition-all ${activeTab === 'pending' ? 'border-yellow-500 text-yellow-700 bg-yellow-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Pendientes <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">{pendingList.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('approved')} 
                    className={`px-4 py-3 text-sm font-bold flex items-center gap-2 flex-shrink-0 border-b-2 transition-all ${activeTab === 'approved' ? 'border-green-500 text-green-700 bg-green-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Aprobados <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{approvedList.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('rejected')} 
                    className={`px-4 py-3 text-sm font-bold flex items-center gap-2 flex-shrink-0 border-b-2 transition-all ${activeTab === 'rejected' ? 'border-red-500 text-red-700 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Rechazados <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">{rejectedList.length}</span>
                </button>
            </div>

            {/* List Content */}
            <div className="flex-grow bg-gray-50 p-4 sm:p-6 overflow-y-auto min-h-[400px]">
                {activeTab === 'pending' && renderList(pendingList)}
                {activeTab === 'approved' && renderList(approvedList)}
                {activeTab === 'rejected' && renderList(rejectedList)}
            </div>
        </div>
    );
};
