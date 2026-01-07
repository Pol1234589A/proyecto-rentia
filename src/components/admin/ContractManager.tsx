
import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Contract } from '../../types';
import { Property } from '../../data/rooms';
import { RentgerService } from '../../services/rentgerService';
import { Check, User, Calendar, DollarSign, FileText, Save, Loader2, AlertCircle, Upload, Plus, X, Link, ExternalLink, Paperclip, RefreshCw, Send } from 'lucide-react';

export const ContractManager: React.FC<any> = ({ initialMode = 'list', preSelectedRoom, onClose }) => {
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'rentger'>(initialMode);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        propertyId: preSelectedRoom?.propertyId || '',
        roomId: preSelectedRoom?.roomId || '',
        tenantName: '',
        rentAmount: preSelectedRoom?.price || 0,
        depositAmount: preSelectedRoom?.price || 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'active'
    });
    const [contractFile, setContractFile] = useState<File | null>(null);

    const reloadContracts = async () => {
        setLoading(true);
        try {
            const cSnap = await getDocs(collection(db, "contracts"));
            const cList: Contract[] = [];
            cSnap.forEach(d => cList.push({ ...d.data(), id: d.id } as Contract));
            setContracts(cList);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await reloadContracts(); // Use reusable function
            const pSnap = await getDocs(collection(db, "properties"));
            const pList: Property[] = [];
            pSnap.forEach(d => pList.push({ ...d.data(), id: d.id } as Property));
            setProperties(pList);
        };
        fetchData();
    }, []);

    const handleSyncRentger = async () => {
        setSyncing(true);
        try {
            const result = await RentgerService.syncContractEndDates();
            if (result.success) {
                alert(`Sincronización completada. ${result.updated} contratos actualizados desde Rentger.`);
                await reloadContracts(); // Recargar para ver cambios
            }
        } catch (error) {
            console.error(error);
            alert("Error al sincronizar con Rentger. Verifica la conexión.");
        } finally {
            setSyncing(false);
        }
    };

    // ... (rest of handleSubmit logic remains similar, handled by existing code above/below or implicit merge if I don't touch it. Wait, I need to keep handleRegisterContract available)

    const handleRegisterContract = async (e: React.FormEvent) => {
        e.preventDefault();
        // ... (Logic from original file to maintain functionality)
        if (!formData.propertyId || !formData.roomId || !formData.tenantName || !contractFile) {
            return alert("Por favor completa los datos obligatorios y sube el PDF.");
        }

        setUploading(true);
        try {
            const storageRef = ref(storage, `contracts/${formData.propertyId}/${formData.roomId}_${Date.now()}.pdf`);
            await uploadBytes(storageRef, contractFile);
            const downloadUrl = await getDownloadURL(storageRef);

            const prop = properties.find(p => p.id === formData.propertyId);
            const room = prop?.rooms.find(r => r.id === formData.roomId);

            await addDoc(collection(db, "contracts"), {
                ...formData,
                propertyName: prop?.address || 'Desconocido',
                ownerId: prop?.ownerId || null,
                roomName: room?.name || 'Habitación',
                fileUrl: downloadUrl,
                fileName: contractFile.name,
                createdAt: serverTimestamp(),
                rentgerSynced: false // New flag
            });

            alert("Contrato registrado LOCALMENTE correcto. Para firma legal, usa Rentger.");
            setViewMode('list');
            setFormData({ propertyId: '', roomId: '', tenantName: '', rentAmount: 0, depositAmount: 0, startDate: '', endDate: '', status: 'active' });
            setContractFile(null);
            await reloadContracts();

        } catch (error) {
            console.error("Error saving contract:", error);
            alert("Error al guardar el contrato.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 animate-in fade-in">
            {/* Header Wizard */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-rentia-blue" />
                        Archivo de Contratos
                    </h2>
                    <p className="text-xs text-gray-500">Repositorio digital sincronizado con Rentger.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSyncRentger}
                        disabled={syncing}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${syncing ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Sincronizando...' : 'Sync Rentger'}
                    </button>

                    <div className="h-6 w-px bg-gray-300 mx-2"></div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500'}`}>Listado</button>
                        <button onClick={() => setViewMode('create')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}>
                            <Upload className="w-3 h-3" /> Subir PDF
                        </button>
                        {onClose && <button onClick={onClose} className="ml-2 px-3 py-2 text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-hidden relative">

                {/* LISTA DE CONTRATOS */}
                {viewMode === 'list' && (
                    <div className="p-6 h-full overflow-y-auto">
                        <div className="flex justify-between mb-6">
                            <h3 className="font-bold text-lg text-gray-700">Contratos Vigentes</h3>
                            <a
                                href="https://rentger.com"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-rentia-blue bg-white border border-gray-200 px-3 py-1.5 rounded-lg"
                            >
                                <ExternalLink className="w-3 h-3" /> Ir a Rentger (Redacción)
                            </a>
                        </div>

                        {loading ? <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-rentia-blue" /></div> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {contracts.map(contract => (
                                    <div key={contract.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {contract.tenantName.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm text-gray-900 truncate">{contract.tenantName}</h4>
                                                    <p className="text-[10px] text-gray-500 truncate">{(contract as any).roomName || 'Habitación'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${contract.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {contract.status === 'active' ? 'ACTIVO' : 'FINALIZADO'}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-xs text-gray-600 bg-gray-50 p-2 rounded mb-3">
                                            <div className="flex justify-between"><span>Renta:</span> <strong>{contract.rentAmount}€</strong></div>
                                            <div className="flex justify-between"><span>Fianza:</span> <strong>{contract.depositAmount}€</strong></div>
                                            <div className="flex justify-between"><span>Inicio:</span> <span>{contract.startDate}</span></div>
                                            <div className="flex justify-between"><span>Fin:</span> <span>{contract.endDate || 'Indefinido'}</span></div>
                                        </div>

                                        {(contract as any).fileUrl ? (
                                            <a
                                                href={(contract as any).fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2 rounded-lg transition-colors border border-indigo-100"
                                            >
                                                Ver PDF Firmado
                                            </a>
                                        ) : (
                                            <div className="text-center text-xs text-gray-400 italic py-2">Sin documento adjunto</div>
                                        )}
                                    </div>
                                ))}
                                {contracts.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                                        No hay contratos registrados.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* FORMULARIO DE SUBIDA (REGISTRO) */}
                {viewMode === 'create' && (
                    <div className="p-4 md:p-8 h-full overflow-y-auto">
                        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">

                            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <strong>Redacción Externa:</strong> Recuerda que la redacción y firma legal se realiza en <strong>Rentger</strong>.
                                        Utiliza este formulario únicamente para subir el PDF final firmado y vincularlo a la habitación.
                                    </div>
                                </div>
                                <a
                                    href="https://rentger.com/contracts/create"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap shadow-sm transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Redactar Nuevo
                                </a>
                            </div>

                            <form onSubmit={handleRegisterContract} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inquilino *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none"
                                                placeholder="Nombre Completo"
                                                value={formData.tenantName}
                                                onChange={e => setFormData({ ...formData, tenantName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad *</label>
                                        <select
                                            required
                                            className="w-full p-2 border rounded-lg text-sm bg-white"
                                            value={formData.propertyId}
                                            onChange={e => setFormData({ ...formData, propertyId: e.target.value, roomId: '' })}
                                        >
                                            <option value="">Seleccionar Propiedad...</option>
                                            {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Habitación *</label>
                                        <select
                                            required
                                            className="w-full p-2 border rounded-lg text-sm bg-white disabled:bg-gray-100"
                                            value={formData.roomId}
                                            onChange={e => {
                                                const room = properties.find(p => p.id === formData.propertyId)?.rooms.find(r => r.id === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    roomId: e.target.value,
                                                    rentAmount: room?.price || 0,
                                                    depositAmount: room?.price || 0 // Default deposit = 1 month
                                                });
                                            }}
                                            disabled={!formData.propertyId}
                                        >
                                            <option value="">Seleccionar Habitación...</option>
                                            {properties.find(p => p.id === formData.propertyId)?.rooms.map(r => (
                                                <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Renta Mensual (€)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input type="number" required className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" value={formData.rentAmount} onChange={e => setFormData({ ...formData, rentAmount: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fianza (€)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input type="number" required className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" value={formData.depositAmount} onChange={e => setFormData({ ...formData, depositAmount: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Inicio</label>
                                        <input type="date" required className="w-full p-2 border rounded-lg text-sm" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Fin (Opcional)</label>
                                        <input type="date" className="w-full p-2 border rounded-lg text-sm" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-xl p-6 text-center">
                                    <input
                                        type="file"
                                        id="contract-pdf"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                                    />
                                    <label htmlFor="contract-pdf" className="cursor-pointer flex flex-col items-center gap-2">
                                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                                            {contractFile ? <Check className="w-6 h-6" /> : <Paperclip className="w-6 h-6" />}
                                        </div>
                                        <span className="text-sm font-bold text-indigo-900">
                                            {contractFile ? contractFile.name : "Adjuntar PDF Firmado"}
                                        </span>
                                        <span className="text-xs text-indigo-500">
                                            {contractFile ? "Click para cambiar archivo" : "Haz click para seleccionar"}
                                        </span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setViewMode('list')} className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-bold text-sm">Cancelar</button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="bg-rentia-black text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-70"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {uploading ? 'Subiendo...' : 'Guardar Registro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
