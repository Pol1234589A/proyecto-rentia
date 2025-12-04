
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Zap, Plus, X, Trash2 } from 'lucide-react';

interface SupplyRecord {
    id: string;
    propertyId: string;
    propertyName?: string;
    month: string;
    electricity: number;
    water: number;
    gas: number;
    internet: number;
    cleaning: number;
    total: number;
    tenantsCount: number;
    costPerTenant: number;
    notes?: string;
    status: string; 
    updatedAt?: any;
}

interface SuppliesPanelProps {
    properties: any[];
}

export const SuppliesPanel: React.FC<SuppliesPanelProps> = ({ properties }) => {
    const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([]);
    const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);
    const [supplyFilterProperty, setSupplyFilterProperty] = useState<string>('');
    const [supplyMonth, setSupplyMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedPropId, setSelectedPropId] = useState<string>('');
    
    const [supplyForm, setSupplyForm] = useState({ electricity: '', water: '', gas: '', internet: '', cleaning: '', notes: '' });

    useEffect(() => {
        const qSupply = query(collection(db, "supply_records"), orderBy("month", "desc"));
        const unsubscribe = onSnapshot(qSupply, (snapshot) => {
            const recs: SupplyRecord[] = [];
            snapshot.forEach((doc) => {
                recs.push({ ...doc.data(), id: doc.id } as SupplyRecord);
            });
            setSupplyRecords(recs);
        });
        return () => unsubscribe();
    }, []);

    const currentMonthRecord = useMemo(() => {
        return supplyRecords.find(r => r.propertyId === selectedPropId && r.month === supplyMonth);
    }, [supplyRecords, selectedPropId, supplyMonth]);

    useEffect(() => {
        if (currentMonthRecord) {
            setSupplyForm({
                electricity: currentMonthRecord.electricity.toString(),
                water: currentMonthRecord.water.toString(),
                gas: currentMonthRecord.gas.toString(),
                internet: currentMonthRecord.internet.toString(),
                cleaning: currentMonthRecord.cleaning.toString(),
                notes: currentMonthRecord.notes || ''
            });
        } else {
            setSupplyForm({ electricity: '', water: '', gas: '', internet: '', cleaning: '', notes: '' });
        }
    }, [currentMonthRecord, selectedPropId, supplyMonth]);

    const saveSupplyRecord = async () => {
        const activeProperty = properties.find(p => p.id === selectedPropId);
        if (!activeProperty) return;
        
        const elec = parseFloat(supplyForm.electricity) || 0;
        const water = parseFloat(supplyForm.water) || 0;
        const gas = parseFloat(supplyForm.gas) || 0;
        const net = parseFloat(supplyForm.internet) || 0;
        const clean = parseFloat(supplyForm.cleaning) || 0;
        const total = elec + water + gas + net + clean;
        const occupiedRooms = activeProperty.rooms?.filter((r:any) => r.status === 'occupied').length || 1;
        const costPerTenantAvg = occupiedRooms > 0 ? total / occupiedRooms : 0;
        
        const recordData = {
            propertyId: activeProperty.id,
            propertyName: activeProperty.address, 
            month: supplyMonth,
            electricity: elec,
            water: water,
            gas: gas,
            internet: net,
            cleaning: clean,
            total: total,
            tenantsCount: occupiedRooms,
            costPerTenant: costPerTenantAvg,
            notes: supplyForm.notes,
            updatedAt: serverTimestamp(),
            status: 'pending' 
        };
        try {
            if (currentMonthRecord) {
                await updateDoc(doc(db, "supply_records", currentMonthRecord.id), recordData);
            } else {
                await addDoc(collection(db, "supply_records"), recordData);
            }
            alert("Facturas registradas correctamente.");
            setIsSupplyFormOpen(false);
        } catch (e) {
            console.error(e);
            alert("Error al guardar facturas.");
        }
    };

    const deleteSupplyRecord = async (id: string) => {
        if(confirm("¿Seguro que quieres eliminar esta factura?")) {
            try {
                await deleteDoc(doc(db, "supply_records", id));
            } catch(e) {
                alert("Error al eliminar");
            }
        }
    };

    const handleSupplyStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "supply_records", id), { status: newStatus });
        } catch (e) {
            console.error("Error updating status", e);
            alert("Error al actualizar estado");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Zap className="w-5 h-5 text-rentia-blue"/> Histórico de Facturas</h3>
                    <select value={supplyFilterProperty} onChange={(e) => setSupplyFilterProperty(e.target.value)} className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none min-w-[200px]"><option value="">Todas las propiedades</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select>
                </div>
                <button onClick={() => setIsSupplyFormOpen(true)} className="bg-rentia-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-800 w-full sm:w-auto justify-center"><Plus className="w-4 h-4"/> Añadir Factura</button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs"><tr><th className="p-4 whitespace-nowrap">Propiedad</th><th className="p-4 whitespace-nowrap">Mes</th><th className="p-4 whitespace-nowrap">Total</th><th className="p-4 whitespace-nowrap text-center">Estado</th><th className="p-4 text-center">Acción</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {supplyRecords
                            .filter(rec => !supplyFilterProperty || rec.propertyId === supplyFilterProperty)
                            .map(rec => (
                            <tr key={rec.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-800 whitespace-nowrap">{properties.find(p=>p.id===rec.propertyId)?.address || rec.propertyName}</td>
                                <td className="p-4 whitespace-nowrap">{rec.month}</td>
                                <td className="p-4 font-bold whitespace-nowrap">{rec.total.toFixed(2)}€</td>
                                <td className="p-4 whitespace-nowrap text-center">
                                    <select 
                                        value={rec.status} 
                                        onChange={(e) => handleSupplyStatusChange(rec.id, e.target.value)}
                                        className={`px-2 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${rec.status==='settled'?'bg-green-100 text-green-700 border-green-200':'bg-yellow-100 text-yellow-700 border-yellow-200'}`}
                                    >
                                        <option value="pending">Pendiente</option>
                                        <option value="settled">Pagado</option>
                                    </select>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => deleteSupplyRecord(rec.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                        {supplyRecords.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay facturas registradas.</td></tr>}
                    </tbody>
                </table>
            </div>
            
            {isSupplyFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"><div className="p-4 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10"><h3 className="font-bold">Nueva Factura de Suministros</h3><button onClick={() => setIsSupplyFormOpen(false)}><X className="w-5 h-5 text-gray-400"/></button></div><div className="p-4 space-y-3"><select className="w-full p-2 border rounded" value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)}><option value="">Propiedad...</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select><div className="grid grid-cols-2 gap-3"><input type="month" className="w-full p-2 border rounded" value={supplyMonth} onChange={e => setSupplyMonth(e.target.value)} /><input type="number" placeholder="Luz" className="w-full p-2 border rounded" value={supplyForm.electricity} onChange={e => setSupplyForm({...supplyForm, electricity: e.target.value})} /><input type="number" placeholder="Agua" className="w-full p-2 border rounded" value={supplyForm.water} onChange={e => setSupplyForm({...supplyForm, water: e.target.value})} /><input type="number" placeholder="Internet" className="w-full p-2 border rounded" value={supplyForm.internet} onChange={e => setSupplyForm({...supplyForm, internet: e.target.value})} /></div><button onClick={saveSupplyRecord} className="w-full bg-rentia-black text-white font-bold py-3 rounded-lg">Guardar</button></div></div></div>
            )}
        </div>
    );
};
