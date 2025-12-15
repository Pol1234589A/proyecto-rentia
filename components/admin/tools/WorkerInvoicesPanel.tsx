
import React, { useState, useEffect } from 'react';
import { db, storage } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Receipt, Trash2, CheckCircle, Download, User, Calendar, Filter, X, Upload, Loader2, FileCheck, Plus } from 'lucide-react';
import { WorkerInvoice, UserProfile } from '../../../types';
import { compressImage } from '../../../utils/imageOptimizer';

export const WorkerInvoicesPanel: React.FC = () => {
    const [invoices, setInvoices] = useState<WorkerInvoice[]>([]);
    const [workers, setWorkers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
    const [filterWorker, setFilterWorker] = useState('');
    
    // Estado para el modal de pago
    const [paymentModalInvoice, setPaymentModalInvoice] = useState<WorkerInvoice | null>(null);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Estado para modal de SUBIDA (Admin sube factura de trabajador)
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({ 
        workerId: '', 
        amount: '', 
        concept: '', 
        date: new Date().toISOString().split('T')[0] 
    });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        // Cargar Facturas
        const q = query(collection(db, "worker_invoices"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: WorkerInvoice[] = [];
            snapshot.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as WorkerInvoice);
            });
            setInvoices(list);
            setLoading(false);
        });

        // Cargar Lista de Trabajadores para el selector
        const fetchWorkers = async () => {
            try {
                const qWorkers = query(collection(db, "users"), where("role", "==", "worker"));
                const snap = await getDocs(qWorkers);
                const workerList: UserProfile[] = [];
                snap.forEach(doc => workerList.push({ ...doc.data(), id: doc.id } as UserProfile));
                setWorkers(workerList);
            } catch (error) {
                console.error("Error loading workers", error);
            }
        };
        fetchWorkers();

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta factura?")) {
            try {
                await deleteDoc(doc(db, "worker_invoices", id));
            } catch (error) {
                alert("Error al eliminar.");
            }
        }
    };

    const handleOpenPaymentModal = (invoice: WorkerInvoice) => {
        setPaymentModalInvoice(invoice);
        setPaymentProofFile(null);
    };

    const handleConfirmPayment = async () => {
        if (!paymentModalInvoice) return;
        
        setIsProcessingPayment(true);
        try {
            let proofUrl = '';
            
            // Si hay fichero de justificante, subirlo (CON COMPRESIÓN)
            if (paymentProofFile) {
                let blobToUpload: Blob = paymentProofFile;
                let fileName = paymentProofFile.name;

                if (paymentProofFile.type.startsWith('image/') && !paymentProofFile.type.includes('gif')) {
                    try {
                        blobToUpload = await compressImage(paymentProofFile);
                        fileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.webp';
                    } catch(e) {
                        console.warn("Error comprimiendo justificante", e);
                    }
                }

                const finalName = `proof_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                // Subir a la carpeta del trabajador para mantener orden
                const storageRef = ref(storage, `worker_invoices/${paymentModalInvoice.workerId}/proofs/${finalName}`);
                await uploadBytes(storageRef, blobToUpload);
                proofUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(doc(db, "worker_invoices", paymentModalInvoice.id), { 
                status: 'paid',
                paymentProofUrl: proofUrl || null
            });

            setPaymentModalInvoice(null);
            setPaymentProofFile(null);
        } catch (error) {
            console.error(error);
            alert("Error al procesar el pago y subir justificante.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    // Nueva función: Admin sube factura pendiente para un trabajador
    const handleAdminUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadForm.workerId || !uploadForm.amount || !uploadForm.concept || !uploadFile) {
            return alert("Por favor completa todos los campos y adjunta el archivo.");
        }

        setIsUploading(true);
        try {
            const selectedWorker = workers.find(w => w.id === uploadForm.workerId);
            const workerName = selectedWorker?.name || 'Desconocido';

            let blobToUpload: Blob = uploadFile;
            let fileName = uploadFile.name;

            // COMPRESIÓN FACTURA
            if (uploadFile.type.startsWith('image/') && !uploadFile.type.includes('gif')) {
                try {
                    blobToUpload = await compressImage(uploadFile);
                    fileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.webp';
                } catch(e) {
                    console.warn("Error comprimiendo factura", e);
                }
            }

            const finalName = `invoice_admin_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            // Guardar en la carpeta del trabajador para que él tenga acceso por reglas de storage
            const storageRef = ref(storage, `worker_invoices/${uploadForm.workerId}/${finalName}`);
            await uploadBytes(storageRef, blobToUpload);
            const url = await getDownloadURL(storageRef);

            await addDoc(collection(db, "worker_invoices"), {
                workerId: uploadForm.workerId,
                workerName: workerName,
                amount: parseFloat(uploadForm.amount),
                concept: uploadForm.concept,
                date: uploadForm.date,
                status: 'pending', // Se crea como pendiente de pago
                fileUrl: url,
                fileName: fileName,
                createdAt: serverTimestamp()
            });

            setShowUploadModal(false);
            setUploadForm({ workerId: '', amount: '', concept: '', date: new Date().toISOString().split('T')[0] });
            setUploadFile(null);
            alert("Factura registrada correctamente.");

        } catch (error) {
            console.error(error);
            alert("Error al subir la factura.");
        } finally {
            setIsUploading(false);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        const matchesWorker = inv.workerName.toLowerCase().includes(filterWorker.toLowerCase());
        return matchesStatus && matchesWorker;
    });

    const totalPending = filteredInvoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full relative w-full">
            
            {/* Modal Subida Admin - Responsive */}
            {showUploadModal && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-rentia-blue"/> Registrar Factura
                            </h3>
                            <button onClick={() => setShowUploadModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        
                        <form onSubmit={handleAdminUpload} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trabajador *</label>
                                <select 
                                    required 
                                    className="w-full p-2 border rounded-lg text-sm bg-white"
                                    value={uploadForm.workerId}
                                    onChange={e => setUploadForm({...uploadForm, workerId: e.target.value})}
                                >
                                    <option value="">Seleccionar...</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Importe (€) *</label>
                                    <input required type="number" step="0.01" className="w-full p-2 border rounded-lg text-sm" value={uploadForm.amount} onChange={e => setUploadForm({...uploadForm, amount: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha *</label>
                                    <input required type="date" className="w-full p-2 border rounded-lg text-sm" value={uploadForm.date} onChange={e => setUploadForm({...uploadForm, date: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Concepto *</label>
                                <input required type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="Ej: Comisión Alquiler H3" value={uploadForm.concept} onChange={e => setUploadForm({...uploadForm, concept: e.target.value})} />
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                                <input type="file" required onChange={e => setUploadFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                                <div className="flex flex-col items-center gap-1 text-gray-500">
                                    {uploadFile ? (
                                        <span className="text-rentia-blue font-bold text-xs truncate max-w-full px-2">{uploadFile.name}</span>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            <span className="text-xs">Adjuntar Factura (PDF/IMG)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isUploading} className="w-full bg-rentia-black text-white py-3 rounded-lg font-bold text-sm hover:bg-gray-800 flex items-center justify-center gap-2">
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                                Guardar Factura
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal Overlay - Responsive */}
            {paymentModalInvoice && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600"/> Confirmar Pago
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Vas a marcar como pagada la factura de <strong>{paymentModalInvoice.workerName}</strong> por valor de <strong>{paymentModalInvoice.amount.toFixed(2)}€</strong>.
                        </p>
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adjuntar Justificante (Opcional)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 relative cursor-pointer transition-colors">
                                <input 
                                    type="file" 
                                    onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)} 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*,application/pdf"
                                />
                                {paymentProofFile ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-xs truncate">
                                        <FileCheck className="w-4 h-4" /> <span className="truncate">{paymentProofFile.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-gray-400">
                                        <Upload className="w-5 h-5" />
                                        <span className="text-xs">Subir PDF o Imagen</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPaymentModalInvoice(null)}
                                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                                disabled={isProcessingPayment}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmPayment}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                disabled={isProcessingPayment}
                            >
                                {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4" />}
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-rentia-blue" />
                        Facturas de Trabajadores
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Gestión de pagos pendientes a colaboradores.</p>
                </div>
                
                <button 
                    onClick={() => setShowUploadModal(true)}
                    className="w-full md:w-auto bg-rentia-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Registrar Factura
                </button>
            </div>
            
            {/* Filters Bar - Responsive Wrap */}
            <div className="px-4 md:px-6 py-3 bg-white border-b border-gray-100 flex flex-wrap gap-2 items-center">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="text-xs p-2 outline-none font-bold text-gray-600 bg-gray-50 rounded border border-gray-200 flex-grow md:flex-grow-0"
                >
                    <option value="all">Todas</option>
                    <option value="pending">Pendientes</option>
                    <option value="paid">Pagadas</option>
                </select>
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre..." 
                    value={filterWorker}
                    onChange={e => setFilterWorker(e.target.value)}
                    className="text-xs p-2 border border-gray-200 rounded flex-grow min-w-[140px] outline-none"
                />
            </div>

            {/* Total Pending Banner */}
            <div className="bg-blue-50 px-4 md:px-6 py-3 border-b border-blue-100 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-800 uppercase">Total Pendiente</span>
                <span className="text-lg font-bold text-blue-700">{totalPending.toFixed(2)} €</span>
            </div>

            <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                {filteredInvoices.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        No hay facturas que coincidan con los filtros.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredInvoices.map(inv => (
                            <div key={inv.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="font-bold text-gray-800 truncate max-w-full">{inv.concept}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border flex-shrink-0 ${inv.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                            {inv.status === 'paid' ? 'Pagada' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><User className="w-3 h-3"/> {inv.workerName}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {inv.date}</span>
                                    </div>
                                    {inv.paymentProofUrl && (
                                        <div className="mt-2">
                                            <a href={inv.paymentProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1">
                                                <FileCheck className="w-3 h-3"/> Ver Justificante Pago
                                            </a>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 mt-2 md:mt-0">
                                    <span className="text-xl font-bold text-gray-800">{inv.amount.toFixed(2)}€</span>
                                    
                                    <div className="flex items-center gap-2">
                                        <a href={inv.fileUrl} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors" title="Descargar Factura">
                                            <Download className="w-4 h-4"/>
                                        </a>
                                        
                                        {inv.status === 'pending' && (
                                            <button 
                                                onClick={() => handleOpenPaymentModal(inv)}
                                                className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                title="Pagar y Adjuntar Justificante"
                                            >
                                                <CheckCircle className="w-4 h-4"/>
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={() => handleDelete(inv.id)}
                                            className="p-2 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
