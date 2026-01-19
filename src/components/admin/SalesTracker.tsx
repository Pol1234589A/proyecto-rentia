
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Activity, DollarSign, Share2, Calendar, Search, Filter, Plus, Trash2, CheckCircle, XCircle, Clock, Megaphone, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';
import { Opportunity } from '../../types';

// Tipos específicos para este tracker
type ActivityType = 'offer_made' | 'offer_received' | 'publication' | 'visit';
type ActivityStatus = 'pending' | 'accepted' | 'rejected' | 'published' | 'archived';

interface SalesActivity {
    id: string;
    type: ActivityType;
    assetId: string; // ID de la oportunidad/propiedad
    assetName: string; // Nombre caché para no hacer mil lecturas
    details: string; // "Oferta de 120.000€" o "Publicado en Grupo Inversores Murcia"
    amount?: number; // Si es oferta
    platform?: string; // Si es publicación (Facebook, Idealista, WhatsApp)
    status: ActivityStatus;
    notes?: string;
    date: string; // YYYY-MM-DD
    createdAt: any;
    createdBy: string;
}

export const SalesTracker: React.FC = () => {
    const [activities, setActivities] = useState<SalesActivity[]>([]);
    const [assets, setAssets] = useState<Opportunity[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filtros
    const [filterType, setFilterType] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Formulario
    const [formData, setFormData] = useState<{
        type: ActivityType;
        assetId: string;
        amount: string;
        platform: string;
        details: string;
        date: string;
        notes: string;
    }>({
        type: 'offer_made',
        assetId: '',
        amount: '',
        platform: '',
        details: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Cargar Datos
    useEffect(() => {
        // 1. Cargar Actividades
        const qActivities = query(collection(db, "sales_tracker"), orderBy("date", "desc"));
        const unsubActivities = onSnapshot(qActivities, (snapshot) => {
            const list: SalesActivity[] = [];
            snapshot.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as SalesActivity);
            });
            setActivities(list);
        });

        // 2. Cargar Activos (Oportunidades) para el selector
        const qAssets = query(collection(db, "opportunities"));
        const unsubAssets = onSnapshot(qAssets, (snapshot) => {
            const list: Opportunity[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Data integrity check to prevent crashes
                if ((data as any).deleted) return;
                if (!data.financials) return;

                list.push({ ...data, id: doc.id } as Opportunity);
            });
            setAssets(list);
        });

        return () => { unsubActivities(); unsubAssets(); };
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.assetId) return alert("Selecciona un activo");

        setLoading(true);
        try {
            const selectedAsset = assets.find(a => a.id === formData.assetId);

            // Construir detalles automáticos si están vacíos
            let autoDetails = formData.details;
            let status: ActivityStatus = 'pending';

            if (formData.type === 'offer_made') {
                autoDetails = `Oferta realizada: ${Number(formData.amount).toLocaleString()}€`;
            } else if (formData.type === 'publication') {
                autoDetails = `Publicado en: ${formData.platform}`;
                status = 'published';
            }

            await addDoc(collection(db, "sales_tracker"), {
                ...formData,
                details: autoDetails,
                assetName: selectedAsset?.title || 'Activo Desconocido',
                amount: formData.amount ? Number(formData.amount) : 0,
                status: status,
                createdAt: serverTimestamp(),
                createdBy: 'Staff' // Idealmente coger del AuthContext
            });

            setIsModalOpen(false);
            setFormData({ type: 'offer_made', assetId: '', amount: '', platform: '', details: '', date: new Date().toISOString().split('T')[0], notes: '' });
        } catch (error) {
            console.error(error);
            alert("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Borrar este registro?")) {
            await deleteDoc(doc(db, "sales_tracker", id));
        }
    };

    const handleStatusChange = async (id: string, newStatus: ActivityStatus) => {
        await updateDoc(doc(db, "sales_tracker", id), { status: newStatus });
    };

    // Filtros
    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            const matchesSearch = (act.assetName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (act.details || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || act.type === filterType;

            return matchesSearch && matchesType;
        });
    }, [activities, searchTerm, filterType]);

    // Stats rápidas
    const stats = useMemo(() => {
        return {
            totalOffers: activities.filter(a => a.type === 'offer_made').length,
            acceptedOffers: activities.filter(a => a.type === 'offer_made' && a.status === 'accepted').length,
            publications: activities.filter(a => a.type === 'publication').length,
            lastWeekActivity: activities.length // Simplificado
        };
    }, [activities]);

    const getTypeBadge = (type: ActivityType) => {
        switch (type) {
            case 'offer_made': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100"><ArrowUpRight className="w-3 h-3" /> Oferta Enviada</span>;
            case 'offer_received': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold border border-green-100"><ArrowDownRight className="w-3 h-3" /> Oferta Recibida</span>;
            case 'publication': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100"><Share2 className="w-3 h-3" /> Difusión</span>;
            case 'visit': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100"><Calendar className="w-3 h-3" /> Visita</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-in fade-in">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-rentia-black flex items-center gap-2">
                            <Activity className="w-6 h-6 text-rentia-blue" />
                            Seguimiento de Compraventas
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Registro de ofertas, publicaciones y actividad comercial.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-rentia-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" /> Nueva Entrada
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600"><DollarSign className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Ofertas Lanzadas</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalOffers}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-full text-green-600"><CheckCircle className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Ofertas Aceptadas</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.acceptedOffers}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-full text-purple-600"><Megaphone className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Publicaciones</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.publications}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-full text-orange-600"><Activity className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Actividad Total</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.lastWeekActivity}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-white text-rentia-black shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Todo
                            </button>
                            <button
                                onClick={() => setFilterType('offer_made')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'offer_made' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Ofertas
                            </button>
                            <button
                                onClick={() => setFilterType('publication')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'publication' ? 'bg-white text-purple-600 shadow-sm border border-purple-100' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Publicaciones
                            </button>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar activo, grupo, nota..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 bg-white"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                                <tr>
                                    <th className="p-4 w-32">Fecha</th>
                                    <th className="p-4 w-64">Activo / Propiedad</th>
                                    <th className="p-4 w-40">Tipo</th>
                                    <th className="p-4">Detalles / Notas</th>
                                    <th className="p-4 w-40 text-center">Estado</th>
                                    <th className="p-4 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400">
                                            <Filter className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            No hay registros con estos filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredActivities.map(act => (
                                        <tr key={act.id} className="hover:bg-blue-50/20 transition-colors group">
                                            <td className="p-4 text-gray-500 whitespace-nowrap font-mono text-xs">{act.date}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-gray-400" />
                                                    {act.assetName}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getTypeBadge(act.type)}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">{act.details}</div>
                                                {act.notes && <div className="text-xs text-gray-500 mt-1 italic">{act.notes}</div>}
                                            </td>
                                            <td className="p-4 text-center">
                                                <select
                                                    value={act.status}
                                                    onChange={(e) => handleStatusChange(act.id, e.target.value as ActivityStatus)}
                                                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border outline-none cursor-pointer ${act.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            act.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                act.status === 'published' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                        }`}
                                                >
                                                    <option value="pending">Pendiente</option>
                                                    <option value="accepted">Aceptada</option>
                                                    <option value="rejected">Rechazada</option>
                                                    <option value="published">Publicado</option>
                                                </select>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(act.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Registro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Registrar Actividad</h3>
                            <button onClick={() => setIsModalOpen(false)}><XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">

                            {/* Tipo de Acción */}
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.type === 'offer_made' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input type="radio" name="type" className="hidden" checked={formData.type === 'offer_made'} onChange={() => setFormData({ ...formData, type: 'offer_made' })} />
                                    <DollarSign className="w-6 h-6" />
                                    <span className="font-bold text-sm">Registrar Oferta</span>
                                </label>
                                <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.type === 'publication' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input type="radio" name="type" className="hidden" checked={formData.type === 'publication'} onChange={() => setFormData({ ...formData, type: 'publication' })} />
                                    <Share2 className="w-6 h-6" />
                                    <span className="font-bold text-sm">Registrar Publicación</span>
                                </label>
                            </div>

                            {/* Activo */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Activo / Propiedad</label>
                                <select
                                    required
                                    className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rentia-blue outline-none"
                                    value={formData.assetId}
                                    onChange={e => setFormData({ ...formData, assetId: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    {assets.map(a => (
                                        <option key={a.id} value={a.id}>{a.title} ({a.financials?.purchasePrice || 0}€)</option>
                                    ))}
                                </select>
                            </div>

                            {/* Campos Dinámicos */}
                            {formData.type === 'offer_made' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Importe Ofertado (€)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-3 border border-gray-200 rounded-lg text-lg font-bold"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            )}

                            {formData.type === 'publication' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Grupo / Portal</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Ej: Inversores Murcia Facebook, Idealista..."
                                        value={formData.platform}
                                        onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border border-gray-200 rounded-lg text-sm"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas Adicionales</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Opcional: Detalles extra..."
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-rentia-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg mt-4 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Guardando...' : 'Guardar Registro'}
                            </button>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
