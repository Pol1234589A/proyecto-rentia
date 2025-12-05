
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ShieldAlert, Search, UserX, AlertTriangle, Trash2, X, FileWarning, Info, Lock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { SensitiveDataDisplay, GDPRCheckbox, SecureLabel } from '../../common/SecurityComponents';

interface BlacklistEntry {
    id: string;
    name: string;
    dni: string;
    phone: string;
    reason: string;
    addedBy: string;
    createdAt: any;
}

export const BlacklistManager: React.FC = () => {
    const { currentUser } = useAuth();
    const [list, setList] = useState<BlacklistEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [protocolAccepted, setProtocolAccepted] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        dni: '',
        phone: '',
        reason: ''
    });

    useEffect(() => {
        const q = query(collection(db, "tenant_blacklist"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: BlacklistEntry[] = [];
            snapshot.forEach((doc) => {
                data.push({ ...doc.data(), id: doc.id } as BlacklistEntry);
            });
            setList(data);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.reason) return alert("Nombre y Motivo son obligatorios.");
        if (!protocolAccepted) return alert("Debes confirmar que este registro cumple con el protocolo RGPD de Interés Legítimo.");
        
        setLoading(true);
        try {
            await addDoc(collection(db, "tenant_blacklist"), {
                ...formData,
                addedBy: currentUser?.displayName || 'Staff',
                createdAt: serverTimestamp()
            });
            setIsModalOpen(false);
            setFormData({ name: '', dni: '', phone: '', reason: '' });
            setProtocolAccepted(false);
        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("ATENCIÓN: ¿Borrar incidencia? Esta acción quedará registrada en el log de auditoría.")) return;
        try {
            await deleteDoc(doc(db, "tenant_blacklist", id));
        } catch (error) {
            alert("Error al eliminar.");
        }
    };

    const filteredList = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return list.filter(item => 
            item.name.toLowerCase().includes(term) || 
            item.dni.toLowerCase().includes(term) ||
            item.phone.includes(term)
        );
    }, [list, searchTerm]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden flex flex-col h-full relative">
            {/* Header Seguro */}
            <div className="p-6 border-b border-red-100 bg-red-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-red-900 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-600" />
                        Registro de Incidencias y Riesgos
                    </h3>
                    <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Acceso restringido. Uso exclusivo para prevención de fraude.
                    </p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <FileWarning className="w-4 h-4" /> Registrar Incidencia
                </button>
            </div>

            {/* Compliance Banner */}
            <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-100 flex items-center gap-2 text-[10px] text-yellow-800">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>
                    <strong>Aviso Legal (RGPD):</strong> Este fichero contiene datos confidenciales. Su consulta queda registrada en el log de auditoría del sistema. 
                    Los registros se eliminarán automáticamente a los 24 meses de inactividad según normativa de conservación.
                </span>
            </div>

            {/* Search */}
            <div className="p-4 bg-white border-b border-gray-100">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, DNI o teléfono..." 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                {filteredList.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center opacity-50">
                        <UserX className="w-16 h-16 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No hay incidencias registradas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredList.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm flex flex-col sm:flex-row gap-4 items-start relative group">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                                        <SecureLabel text="Confidencial" />
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded border border-gray-100">
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold">DNI:</span> 
                                            <SensitiveDataDisplay value={item.dni} type="dni" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold">Tel:</span> 
                                            <SensitiveDataDisplay value={item.phone} type="phone" />
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 mb-2">
                                        Registrado por: {item.addedBy} • {item.createdAt?.toDate().toLocaleDateString()}
                                    </p>

                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                        <p className="text-sm text-red-800 italic">
                                            <span className="font-bold uppercase text-[10px] block text-red-400 mb-1">Motivo (Documentado):</span>
                                            {item.reason}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors self-start sm:self-center"
                                    title="Eliminar registro (Se guarda log)"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Seguro (Z-Index Elevado) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border-t-4 border-red-600">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" /> Nueva Incidencia
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="bg-red-50 p-3 rounded text-xs text-red-800 border border-red-100">
                                <strong>Protocolo de Calidad de Datos:</strong> Solo se permite el registro si existe deuda cierta, vencida y exigible, o incumplimiento contractual grave demostrable.
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo *</label>
                                <input required type="text" className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-red-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Juan Pérez" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI / NIE</label>
                                    <input type="text" className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white outline-none" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} placeholder="12345678X" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                                    <input type="text" className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="600..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-red-600 uppercase mb-1">Motivo Documentado *</label>
                                <textarea required className="w-full p-3 border rounded-lg text-sm h-24 resize-none bg-red-50 focus:bg-white focus:border-red-500 outline-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Describe el incidente (impagos, daños graves...)" />
                            </div>
                            
                            <GDPRCheckbox 
                                checked={protocolAccepted}
                                onChange={setProtocolAccepted}
                                label="Confirmo veracidad y Legitimidad"
                                context="incident"
                            />

                            <button type="submit" disabled={loading} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg mt-2">
                                {loading ? 'Registrando...' : 'Registrar Incidencia'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
