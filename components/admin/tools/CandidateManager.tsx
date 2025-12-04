
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, onSnapshot, updateDoc, doc, query, where } from 'firebase/firestore';
import { Candidate, CandidateStatus } from '../../../types';
import { UserCheck, Search, Phone, X, CheckCircle, Archive } from 'lucide-react';

export const CandidateManager: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(
            collection(db, "candidate_pipeline"), 
            where("status", "in", ["pending_review", "approved", "rejected"])
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newCandidates: Candidate[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Candidate));
            
            // Sort client-side
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
        await updateDoc(doc(db, "candidate_pipeline", id), { status });
    };
    
    const filteredCandidates = useMemo(() => {
        if (!searchTerm.trim()) return candidates;
        const term = searchTerm.toLowerCase();
        return candidates.filter(c => 
            c.candidateName.toLowerCase().includes(term) ||
            (c.candidatePhone && c.candidatePhone.includes(term)) ||
            (c.candidateEmail && c.candidateEmail.toLowerCase().includes(term)) ||
            c.propertyName.toLowerCase().includes(term)
        );
    }, [candidates, searchTerm]);

    const candidatesByStatus = useMemo(() => ({
        pending: filteredCandidates.filter(c => c.status === 'pending_review'),
        approved: filteredCandidates.filter(c => c.status === 'approved'),
        rejected: filteredCandidates.filter(c => c.status === 'rejected'),
    }), [filteredCandidates]);

    const renderList = (items: Candidate[]) => {
        if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;
        if (items.length === 0) return <div className="text-center py-8 text-gray-400">No hay candidatos en esta lista.</div>;

        return (
            <div className="space-y-4">
                {items.map(c => (
                    <div key={c.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start gap-4 animate-in fade-in slide-in-from-left-2">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-bold text-lg text-gray-800">{c.candidateName}</span>
                                {c.candidatePhone && (
                                    <a href={`tel:${c.candidatePhone}`} className="text-xs font-medium text-rentia-blue bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1 hover:bg-blue-100 ml-auto md:ml-0">
                                        <Phone className="w-3 h-3"/> <span className="hidden sm:inline">{c.candidatePhone}</span>
                                    </a>
                                )}
                            </div>
                            <div className="text-xs font-medium text-gray-500 mb-2">
                                <p className="font-bold text-gray-700">{c.propertyName}</p>
                                <p>Habitación: {c.roomName}</p>
                            </div>
                            
                            <p className="text-xs text-gray-600 bg-white p-3 border rounded-lg whitespace-pre-line leading-relaxed shadow-sm mb-3">
                                {c.additionalInfo || 'Sin información adicional.'}
                            </p>
                            <p className="text-[10px] text-gray-400">Enviado por: {c.submittedBy} - {c.submittedAt?.toDate ? c.submittedAt.toDate().toLocaleDateString() : 'N/A'}</p>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            {activeTab === 'pending' && <>
                                <button 
                                    onClick={() => handleUpdateStatus(c.id, 'rejected')} 
                                    className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 px-4 py-3 md:py-2 text-sm font-bold rounded-lg border border-red-200 transition-colors shadow-sm flex justify-center items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Rechazar
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(c.id, 'approved')} 
                                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-3 md:py-2 text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Aprobar
                                </button>
                            </>}
                            {activeTab !== 'pending' &&
                                <button onClick={() => handleUpdateStatus(c.id, 'archived')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 flex items-center gap-2 justify-center">
                                    <Archive className="w-3 h-3"/> Archivar
                                </button>
                            }
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div id="candidate-manager" className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                <h3 className="text-lg sm:text-xl font-bold text-rentia-black flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-rentia-blue" /> Gestor de Candidatos
                </h3>
                
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar nombre, teléfono..." 
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue bg-gray-50 focus:bg-white transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
            </div>
            
            <div className="flex border-b border-gray-200 mb-6 w-full overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('pending')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0 transition-colors ${activeTab === 'pending' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Pendientes <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">{candidatesByStatus.pending.length}</span></button>
                <button onClick={() => setActiveTab('approved')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0 transition-colors ${activeTab === 'approved' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Aprobados <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{candidatesByStatus.approved.length}</span></button>
                <button onClick={() => setActiveTab('rejected')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0 transition-colors ${activeTab === 'rejected' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Rechazados <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">{candidatesByStatus.rejected.length}</span></button>
            </div>

            {activeTab === 'pending' && renderList(candidatesByStatus.pending)}
            {activeTab === 'approved' && renderList(candidatesByStatus.approved)}
            {activeTab === 'rejected' && renderList(candidatesByStatus.rejected)}
        </div>
    );
};
