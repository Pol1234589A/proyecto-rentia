
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Footprints, CheckCircle, X, Clock, DoorOpen, DollarSign } from 'lucide-react';
import { VisitOutcome } from '../../../types';

export interface VisitRecord {
    id: string;
    propertyId: string;
    propertyName: string;
    roomId: string;
    roomName: string;
    workerName: string;
    visitDate: any;
    outcome: VisitOutcome;
    comments: string;
    commission?: number;
}

export const VisitsLog: React.FC = () => {
    const [visits, setVisits] = useState<VisitRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterWorker, setFilterWorker] = useState<string>('all');
    const [filterOutcome, setFilterOutcome] = useState<string>('all');

    useEffect(() => {
        const q = query(collection(db, "room_visits"), orderBy("visitDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: VisitRecord[] = [];
            snapshot.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as VisitRecord);
            });
            setVisits(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredVisits = useMemo(() => {
        return visits.filter(v => {
            const matchWorker = filterWorker === 'all' || v.workerName === filterWorker;
            const matchOutcome = filterOutcome === 'all' || v.outcome === filterOutcome;
            return matchWorker && matchOutcome;
        });
    }, [visits, filterWorker, filterOutcome]);

    const uniqueWorkers = useMemo(() => Array.from(new Set(visits.map(v => v.workerName))), [visits]);

    const getOutcomeBadge = (outcome: string) => {
        switch(outcome) {
            case 'successful': return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-green-200"><CheckCircle className="w-3 h-3"/> Exitosa</span>;
            case 'unsuccessful': return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-red-200"><X className="w-3 h-3"/> No Exitosa</span>;
            default: return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-yellow-200"><Clock className="w-3 h-3"/> Pendiente</span>;
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-400">Cargando registro de visitas...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Footprints className="w-5 h-5 text-rentia-blue" />
                        Registro de Visitas
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Historial de actividad comercial de los trabajadores.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <select 
                        value={filterWorker} 
                        onChange={(e) => setFilterWorker(e.target.value)}
                        className="bg-white border border-gray-200 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rentia-blue min-w-[120px]"
                    >
                        <option value="all">Todos los Comerciales</option>
                        {uniqueWorkers.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <select 
                        value={filterOutcome} 
                        onChange={(e) => setFilterOutcome(e.target.value)}
                        className="bg-white border border-gray-200 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rentia-blue min-w-[120px]"
                    >
                        <option value="all">Todos los Resultados</option>
                        <option value="successful">Exitosas</option>
                        <option value="unsuccessful">No exitosas</option>
                        <option value="pending">Pendientes</option>
                    </select>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto bg-gray-50 p-4">
                {filteredVisits.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                        <Footprints className="w-12 h-12 mb-3 opacity-20" />
                        <p>No se encontraron visitas registradas.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Fecha</th>
                                        <th className="p-4">Comercial</th>
                                        <th className="p-4">Inmueble / Habitación</th>
                                        <th className="p-4">Resultado</th>
                                        <th className="p-4">Comentarios</th>
                                        <th className="p-4 text-right">Comisión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredVisits.map(visit => (
                                        <tr key={visit.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 text-gray-500 whitespace-nowrap text-xs">
                                                {visit.visitDate?.toDate ? visit.visitDate.toDate().toLocaleString() : 'N/A'}
                                            </td>
                                            <td className="p-4 font-bold text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                        {visit.workerName.charAt(0)}
                                                    </div>
                                                    {visit.workerName}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">{visit.propertyName}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <DoorOpen className="w-3 h-3" /> {visit.roomName}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getOutcomeBadge(visit.outcome)}
                                            </td>
                                            <td className="p-4 text-gray-600 text-xs max-w-xs truncate" title={visit.comments}>
                                                {visit.comments || '-'}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-gray-700">
                                                {visit.commission && visit.commission > 0 ? `${visit.commission}€` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {filteredVisits.map(visit => (
                                <div key={visit.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                {visit.workerName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{visit.workerName}</p>
                                                <p className="text-[10px] text-gray-400">
                                                    {visit.visitDate?.toDate ? visit.visitDate.toDate().toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        {getOutcomeBadge(visit.outcome)}
                                    </div>
                                    
                                    <div className="bg-gray-50 p-2 rounded-lg mb-2">
                                        <p className="font-bold text-xs text-gray-800 truncate">{visit.propertyName}</p>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                                            <DoorOpen className="w-3 h-3" /> Habitación: {visit.roomName}
                                        </p>
                                    </div>

                                    {visit.comments && (
                                        <p className="text-xs text-gray-600 italic bg-white border border-dashed border-gray-200 p-2 rounded mb-2">
                                            "{visit.comments}"
                                        </p>
                                    )}

                                    {visit.commission && visit.commission > 0 && (
                                        <div className="flex justify-end border-t border-gray-100 pt-2 mt-2">
                                            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" /> Comisión: {visit.commission}€
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
