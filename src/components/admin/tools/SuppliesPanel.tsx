
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { Zap, Plus, X, Trash2, Inbox, FileText, Download, CheckCircle, ExternalLink, Clock, AlertCircle, History, Filter } from 'lucide-react';
import { SupplyInvoice } from '../../../types';
import { compressImage } from '../../../utils/imageOptimizer'; // Importar optimizador
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Asegurar imports de storage
import { storage } from '../../../firebase';

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
    // State for Calculated Records
    const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([]);
    
    // State for Raw Invoices (Uploaded by Owners)
    const [uploadedInvoices, setUploadedInvoices] = useState<SupplyInvoice[]>([]);

    const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);
    const [supplyFilterProperty, setSupplyFilterProperty] = useState<string>('');
    const [supplyMonth, setSupplyMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedPropId, setSelectedPropId] = useState<string>('');
    
    // Nuevo filtro para ver historial o pendientes
    const [invoiceListFilter, setInvoiceListFilter] = useState<'pending' | 'approved'>('pending');
    
    // State for Manual Distribution Form
    const [supplyForm, setSupplyForm] = useState({ electricity: '', water: '', gas: '', internet: '', cleaning: '', notes: '' });

    // State for Raw Invoice Upload (Fixing errors)
    const [invoiceUploadForm, setInvoiceUploadForm] = useState({ propertyId: '', type: 'luz', amount: '', date: new Date().toISOString().split('T')[0] });
    const [supplyFile, setSupplyFile] = useState<File | null>(null);

    // State for UI Feedback
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        // 1. Load Calculated Records
        const qSupply = query(collection(db, "supply_records"), orderBy("month", "desc"));
        const unsubscribeRecords = onSnapshot(qSupply, (snapshot) => {
            const recs: SupplyRecord[] = [];
            snapshot.forEach((doc) => {
                recs.push({ ...doc.data(), id: doc.id } as SupplyRecord);
            });
            setSupplyRecords(recs);
        });

        // 2. Load Raw Invoices from Owners
        const qInvoices = query(collection(db, "supply_invoices"), orderBy("uploadedAt", "desc"));
        const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
            const invs: SupplyInvoice[] = [];
            snapshot.forEach((doc) => {
                invs.push({ ...doc.data(), id: doc.id } as SupplyInvoice);
            });
            setUploadedInvoices(invs);
        });

        return () => { unsubscribeRecords(); unsubscribeInvoices(); };
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

    // --- ACTIONS FOR RAW INVOICES ---
    const handleProcessInvoice = async (invoiceId: string) => {
        if (!confirm("¿Marcar esta factura como procesada? Pasará al historial.")) return;
        try {
            await updateDoc(doc(db, "supply_invoices", invoiceId), { status: 'approved' });
        } catch (e) {
            console.error("Error processing invoice:", e);
            alert("Error al actualizar estado.");
        }
    };

    const handleRevertInvoice = async (invoiceId: string) => {
        if (!confirm("¿Devolver esta factura a pendientes?")) return;
        try {
            await updateDoc(doc(db, "supply_invoices", invoiceId), { status: 'pending' });
        } catch (e) {
            console.error("Error reverting invoice:", e);
        }
    };

    const handleDeleteRawInvoice = async (invoiceId: string) => {
        if (!confirm("¿Eliminar este archivo de factura definitivamente?")) return;
        try {
            await deleteDoc(doc(db, "supply_invoices", invoiceId));
        } catch (e) {
            console.error("Error deleting invoice:", e);
        }
    };

    // --- ACTIONS FOR CALCULATED RECORDS ---
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
        if(confirm("¿Seguro que quieres eliminar este cálculo mensual?")) {
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

    const handleUploadInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplyFile || !invoiceUploadForm.propertyId || !invoiceUploadForm.amount) return alert("Rellena todos los campos");
        
        setUploading(true);
        try {
            let blobToUpload: Blob = supplyFile;
            let finalName = supplyFile.name;

            // OPTIMIZACIÓN DE IMAGEN
            if (supplyFile.type.startsWith('image/') && !supplyFile.type.includes('gif')) {
                try {
                    blobToUpload = await compressImage(supplyFile);
                    // Cambiamos la extensión a .webp para ser consistentes
                    finalName = supplyFile.name.substring(0, supplyFile.name.lastIndexOf('.')) + '.webp';
                } catch (err) {
                    console.warn("Falló la optimización, subiendo original", err);
                }
            }

            const storageRef = ref(storage, `invoices/${invoiceUploadForm.propertyId}/${Date.now()}_${finalName}`);
            await uploadBytes(storageRef, blobToUpload);
            const url = await getDownloadURL(storageRef);

            await addDoc(collection(db, "supply_invoices"), {
                propertyId: invoiceUploadForm.propertyId,
                type: invoiceUploadForm.type,
                amount: parseFloat(invoiceUploadForm.amount),
                periodStart: invoiceUploadForm.date,
                periodEnd: invoiceUploadForm.date,
                fileUrl: url,
                status: 'pending',
                uploadedAt: serverTimestamp()
            });
            
            setSupplyFile(null);
            setInvoiceUploadForm({ ...invoiceUploadForm, amount: '' });
            alert("Factura subida correctamente");
        } catch (error) {
            console.error(error);
            alert("Error al subir");
        } finally {
            setUploading(false);
        }
    };

    // Filter raw invoices based on selected tab
    const filteredRawInvoices = uploadedInvoices.filter(inv => {
        const matchesProp = !supplyFilterProperty || inv.propertyId === supplyFilterProperty;
        const matchesStatus = inv.status === invoiceListFilter;
        return matchesProp && matchesStatus;
    });

    const getPropName = (id: string) => properties.find(p => p.id === id)?.address || 'Propiedad desconocida';

    return (
        <div className="flex flex-col gap-8">
            
            {/* --- SECCIÓN 1: BANDEJA DE ENTRADA (FACTURAS PROPIETARIOS) --- */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Inbox className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Facturas de Propietarios</h3>
                            <p className="text-xs text-gray-500">Documentos subidos directamente por propietarios.</p>
                        </div>
                    </div>
                    
                    {/* Toggle Pendientes / Histórico */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setInvoiceListFilter('pending')}
                            className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${invoiceListFilter === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <AlertCircle className="w-3 h-3" /> Pendientes
                        </button>
                        <button 
                            onClick={() => setInvoiceListFilter('approved')}
                            className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${invoiceListFilter === 'approved' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <History className="w-3 h-3" /> Histórico
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-blue-50 text-blue-800 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Fecha Subida</th>
                                    <th className="p-4">Propiedad</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Periodo</th>
                                    <th className="p-4 text-right">Importe</th>
                                    <th className="p-4 text-center">Archivo</th>
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRawInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                {invoiceListFilter === 'pending' ? <CheckCircle className="w-8 h-8 text-green-100" /> : <History className="w-8 h-8 text-gray-200" />}
                                                <span>{invoiceListFilter === 'pending' ? '¡Todo al día! No hay facturas pendientes.' : 'No hay facturas en el histórico.'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRawInvoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 text-gray-500 text-xs">
                                                {inv.uploadedAt?.toDate ? inv.uploadedAt.toDate().toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="p-4 font-bold text-gray-800">{getPropName(inv.propertyId)}</td>
                                            <td className="p-4 capitalize">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium border border-gray-200">
                                                    {inv.type === 'luz' && <Zap className="w-3 h-3 text-yellow-500"/>}
                                                    {inv.type === 'agua' && <div className="w-3 h-3 rounded-full bg-blue-400"/>}
                                                    {inv.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-gray-500">
                                                {inv.periodStart} <span className="text-gray-300">al</span> {inv.periodEnd}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-gray-700">
                                                {inv.amount}€
                                            </td>
                                            <td className="p-4 text-center">
                                                <a 
                                                    href={inv.fileUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver Factura"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {inv.status === 'pending' ? (
                                                        <button 
                                                            onClick={() => handleProcessInvoice(inv.id)}
                                                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs font-bold flex items-center gap-1"
                                                            title="Marcar como procesada"
                                                        >
                                                            <CheckCircle className="w-3 h-3" /> OK
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleRevertInvoice(inv.id)}
                                                            className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors text-xs font-bold flex items-center gap-1"
                                                            title="Devolver a pendientes"
                                                        >
                                                            <History className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    
                                                    <button 
                                                        onClick={() => handleDeleteRawInvoice(inv.id)}
                                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        title="Eliminar archivo"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: HISTÓRICO CALCULADO (EXISTENTE) --- */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Zap className="w-5 h-5 text-rentia-blue"/> Histórico de Repartos (Calculados)</h3>
                        <select value={supplyFilterProperty} onChange={(e) => setSupplyFilterProperty(e.target.value)} className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none min-w-[200px]"><option value="">Todas las propiedades</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select>
                    </div>
                    <button onClick={() => setIsSupplyFormOpen(true)} className="bg-rentia-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-800 w-full sm:w-auto justify-center"><Plus className="w-4 h-4"/> Añadir Reparto Manual</button>
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
                            {supplyRecords.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay repartos registrados.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Modal de Reparto Manual */}
            {isSupplyFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-bold">Nueva Factura de Suministros</h3>
                            <button onClick={() => setIsSupplyFormOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <select className="w-full p-2 border rounded" value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)}>
                                <option value="">Propiedad...</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="month" className="w-full p-2 border rounded" value={supplyMonth} onChange={e => setSupplyMonth(e.target.value)} />
                                <input type="number" placeholder="Luz" className="w-full p-2 border rounded" value={supplyForm.electricity} onChange={e => setSupplyForm({...supplyForm, electricity: e.target.value})} />
                                <input type="number" placeholder="Agua" className="w-full p-2 border rounded" value={supplyForm.water} onChange={e => setSupplyForm({...supplyForm, water: e.target.value})} />
                                <input type="number" placeholder="Internet" className="w-full p-2 border rounded" value={supplyForm.internet} onChange={e => setSupplyForm({...supplyForm, internet: e.target.value})} />
                            </div>
                            <button onClick={saveSupplyRecord} className="w-full bg-rentia-black text-white font-bold py-3 rounded-lg">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Subida de Factura (Raw Invoice Upload) */}
            {/* Este modal ya estaba integrado en supplies tab en OwnerDashboard, aquí es una vista de admin, si el admin quiere subir una factura raw, usa el formulario de la sección 'supplies' del OwnerDashboard replicada. 
                Si quisieras subir facturas raw desde este panel de admin, necesitarías un formulario similar al de OwnerDashboard. 
                Actualmente SuppliesPanel muestra tablas pero no tiene botón de subir factura raw (solo reparto manual). 
                Asumimos que la subida raw la hacen los owners o admins desde la vista de propiedades. 
                
                NOTA: El código proporcionado ya incluye `handleUploadInvoice` que SÍ comprime. 
                Si añades un botón para usar esa función en el JSX, funcionará.
            */}
        </div>
    );
};
