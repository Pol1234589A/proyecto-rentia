
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { Candidate, CandidateStatus } from '../../../types';
import { UserCheck, Search, Phone, X, CheckCircle, AlertCircle, Loader2, Mail, Calendar, Filter } from 'lucide-react';

export const CandidateManager: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        // SEGURIDAD DE DATOS: Traemos TODOS los candidatos ordenados por fecha.
        // Filtramos en cliente para evitar que problemas de índices oculten datos.
        const q = query(
            collection(db, "candidate_pipeline"), 
            orderBy("submittedAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newCandidates: Candidate[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    ...data, 
                    id: doc.id,
                    // Si no tiene status, asumimos pending_review para que no se pierda
                    status: data.status || 'pending_review' 
                } as Candidate;
            });
            setCandidates(newCandidates);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching candidates:", error);
            setNotification({ type: 'error', text: "Error de conexión. Revisa tu internet." });
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = async (id: string, status: CandidateStatus) => {
        setProcessingId(id);
        try {
            const docRef = doc(db, "candidate_pipeline", id);
            await updateDoc(docRef, { status: status });
            
            const actionText = status === 'approved' ? 'aceptado' : status === 'rejected' ? 'rechazado' : 'movido a pendientes';
            setNotification({ type: 'success', text: `Candidato ${actionText} correctamente.` });
            
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error("Error updating status:", error);
            setNotification({ type: 'error', text: "No se pudo guardar en la base de datos." });
        } finally {
            setProcessingId(null);
        }
    };
    
    // Filtrado local robusto
    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => {
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const matches = (
                    (c.candidateName && c.candidateName.toLowerCase().includes(term)) ||
                    (c.candidatePhone && c.candidatePhone.includes(term)) ||
                    (c.candidateEmail && c.candidateEmail.toLowerCase().includes(term)) ||
                    (c.propertyName && c.propertyName.toLowerCase().includes(term))
                );
                if (!matches) return false;
            }
            
            // Mapeo estricto de estados a pestañas
            if (activeTab === 'pending') return c.status === 'pending_review';
            if (activeTab === 'approved') return c.status === 'approved';
            if (activeTab === 'rejected') return c.status === 'rejected';
            return false;
        });
    }, [candidates, activeTab, searchTerm]);

    // Contadores para las pestañas
    const counts = useMemo(() => ({
        pending: candidates.filter(c => c.status === 'pending_review').length,
        approved: candidates.filter(c => c.status === 'approved').length,
        rejected: candidates.filter(c => c.status === 'rejected').length,
    }), [candidates]);

    const renderList = () => {
        if (loading) return <div className="text-center py-12 flex flex-col items-center gap-2 text-gray-500"><Loader2 className="animate-spin w-8 h-8 text-rentia-blue"/>Cargando base de datos...</div>;
        
        if (filteredCandidates.length === 0) {
            return (
                <div className="text-center py-16 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                        <Filter className="w-8 h-8 text-gray-300" />
                    </div>
                    <h4 className="text-gray-900 font-bold text-lg mb-1">No hay candidatos en "{activeTab === 'pending' ? 'Pendientes' : activeTab === 'approved' ? 'Aprobados' : 'Rechazados'}"</h4>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        {searchTerm ? 'Prueba a cambiar el término de búsqueda.' : 'Los candidatos aparecerán aquí cuando cambien de estado.'}
                    </p>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="mt-4 text-rentia-blue font-bold text-sm hover:underline">
                            Borrar búsqueda
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredCandidates.map(c => (
                    <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex-1 w-full min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-lg text-gray-900 truncate">{c.candidateName}</span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                    c.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                    c.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                    {c.status === 'pending_review' ? 'Pendiente' : c.status === 'approved' ? 'Aceptado' : 'Rechazado'}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                                {c.candidatePhone && (
                                    <a href={`tel:${c.candidatePhone}`} className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1">
                                        <Phone className="w-3 h-3"/> {c.candidatePhone}
                                    </a>
                                )}
                                {c.candidateEmail && (
                                    <a href={`mailto:${c.candidateEmail}`} className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1">
                                        <Mail className="w-3 h-3"/> Email
                                    </a>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-3 bg-blue-50/50 w-full md:w-fit px-3 py-2 rounded-lg border border-blue-100">
                                <span className="font-bold text-gray-800">{c.propertyName}</span>
                                <span className="text-gray-300">|</span>
                                <span>{c.roomName}</span>
                            </div>
                            
                            {c.additionalInfo && (
                                <div className="text-sm text-gray-600 bg-yellow-50 p-3 border border-yellow-100 rounded-lg whitespace-pre-line leading-relaxed mb-3 relative">
                                    <span className="absolute top-2 right-2 text-yellow-400"><AlertCircle className="w-4 h-4"/></span>
                                    {c.additionalInfo}
                                </div>
                            )}
                            
                            <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-50 flex justify-between items-center">
                                <span>Enviado por: {c.submittedBy}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {c.submittedAt?.toDate ? c.submittedAt.toDate().toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                            {activeTab === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => handleUpdateStatus(c.id, 'approved')} 
                                        disabled={processingId === c.id}
                                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 flex justify-center items-center gap-2"
                                    >
                                        {processingId === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4" />}
                                        <span className="md:hidden">Aceptar</span>
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(c.id, 'rejected')} 
                                        disabled={processingId === c.id}
                                        className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2"
                                    >
                                        {processingId === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <X className="w-4 h-4" />}
                                        <span className="md:hidden">Rechazar</span>
                                    </button>
                                </>
                            )}
                            
                            {activeTab !== 'pending' && (
                                <button 
                                    onClick={() => handleUpdateStatus(c.id, 'pending_review')} 
                                    disabled={processingId === c.id}
                                    className="flex-1 md:flex-none text-rentia-blue bg-blue-50 border border-blue-100 hover:bg-blue-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors w-full"
                                >
                                    Mover a Pendientes
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div id="candidate-manager" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col w-full relative mb-12">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold text-rentia-black flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-rentia-blue" /> Gestor de Candidatos
                    </h3>
                    <div className="relative w-full sm:w-64">
                        <input 
                            type="text" 
                            placeholder="Buscar nombre, tlf..." 
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rentia-blue/50 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                </div>

                {/* Tabs - DISEÑO MÁS VISIBLE Y ROBUSTO */}
                <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                    <button 
                        onClick={() => setActiveTab('pending')} 
                        className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'pending' 
                            ? 'bg-white text-yellow-700 shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        Pendientes 
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'pending' ? 'bg-yellow-100' : 'bg-gray-200'}`}>
                            {counts.pending}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('approved')} 
                        className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'approved' 
                            ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        Aceptados
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'approved' ? 'bg-green-100' : 'bg-gray-200'}`}>
                            {counts.approved}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('rejected')} 
                        className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'rejected' 
                            ? 'bg-white text-red-700 shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        Rechazados
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'rejected' ? 'bg-red-100' : 'bg-gray-200'}`}>
                            {counts.rejected}
                        </span>
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {notification && (
                <div className={`px-4 py-3 text-sm font-bold text-center animate-in slide-in-from-top-2 ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {notification.text}
                </div>
            )}

            {/* List Content */}
            <div className="p-4 bg-gray-50 min-h-[400px]">
                {renderList()}
            </div>
        </div>
    );
};
