import React, { useState } from 'react';
import { Property } from '../../data/rooms';
import { db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Check, User, FileText, X, Eye, Image as ImageIcon, ExternalLink, Paperclip, Search, Filter, Save, Link, Camera, RefreshCw, ChevronDown, ListFilter, SortAsc } from 'lucide-react';

interface ContractManagerProps {
    properties: Property[];
    onClose?: () => void;
}

export const ContractManager: React.FC<ContractManagerProps> = ({ properties, onClose }) => {
    const [editLinks, setEditLinks] = useState<Record<string, { driveUrl: string, photosDriveUrl: string }>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [docPreview, setDocPreview] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false,
        url: '',
        title: ''
    });

    // Filtros y Ordenación
    const [selectedProperty, setSelectedProperty] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'property' | 'tenant' | 'rent' | 'date'>('property');
    const [showFilters, setShowFilters] = useState(false);

    const handleLocalChange = (id: string, field: 'driveUrl' | 'photosDriveUrl', value: string, currentContract: any) => {
        setEditLinks(prev => ({
            ...prev,
            [id]: {
                driveUrl: prev[id]?.driveUrl ?? (currentContract.driveUrl || ''),
                photosDriveUrl: prev[id]?.photosDriveUrl ?? (currentContract.photosDriveUrl || ''),
                [field]: value
            }
        }));
    };

    const handleSave = async (propertyId: string, roomId: string, contractId: string) => {
        setSavingId(contractId);
        try {
            const propRef = doc(db, "properties", propertyId);
            const propSnap = await getDoc(propRef);
            if (propSnap.exists()) {
                const data = propSnap.data();
                const rooms = (data.rooms || []) as any[];
                const updatedRooms = rooms.map(r => {
                    if (r.id === roomId) {
                        return {
                            ...r,
                            driveUrl: editLinks[contractId]?.driveUrl ?? r.driveUrl,
                            photosDriveUrl: editLinks[contractId]?.photosDriveUrl ?? r.photosDriveUrl
                        };
                    }
                    return r;
                });
                await updateDoc(propRef, { rooms: updatedRooms });
                // feedback visual o alerta suave
            }
        } catch (e) {
            console.error(e);
            alert("Error al sincronizar con Drive.");
        } finally {
            setSavingId(null);
        }
    };

    // Obtener lista de propiedades únicas para el filtro
    const uniqueProperties = Array.from(new Set(properties.map(p => p.address))).sort();

    // Derivar contratos vigentes desde las habitaciones ocupadas
    let activeContracts = properties.flatMap(prop =>
        (prop.rooms || [])
            .filter(room => room.status === 'occupied' || room.tenant)
            .map(room => ({
                id: `${prop.id}-${room.id}`,
                propertyId: prop.id,
                propertyName: prop.address,
                roomId: room.id,
                roomName: room.name,
                tenantName: room.tenant?.name || 'Inquilino sin nombre',
                rentAmount: room.price || 0,
                depositAmount: room.tenant?.deposit || room.price || 0,
                startDate: room.tenant?.startDate || 'No definida',
                endDate: room.tenant?.endDate || 'Indefinido',
                driveUrl: room.driveUrl,
                photosDriveUrl: room.photosDriveUrl,
                status: 'active'
            }))
    );

    // Aplicar Filtro de Búsqueda
    activeContracts = activeContracts.filter(c =>
        c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.roomName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aplicar Filtro de Propiedad
    if (selectedProperty !== 'all') {
        activeContracts = activeContracts.filter(c => c.propertyName === selectedProperty);
    }

    // Aplicar Ordenación
    activeContracts.sort((a, b) => {
        if (sortBy === 'property') return a.propertyName.localeCompare(b.propertyName);
        if (sortBy === 'tenant') return a.tenantName.localeCompare(b.tenantName);
        if (sortBy === 'rent') return b.rentAmount - a.rentAmount;
        if (sortBy === 'date') return (b.startDate || '').localeCompare(a.startDate || '');
        return 0;
    });

    return (
        <div className="flex flex-col h-full bg-gray-50/50 animate-in fade-in relative">
            {/* Modal de Previsualización */}
            {docPreview.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                {docPreview.title}
                            </h3>
                            <button onClick={() => setDocPreview({ ...docPreview, isOpen: false })} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100">
                            <iframe src={docPreview.url} className="w-full h-full border-none" title={`Vista previa de documento: ${docPreview.title}`} />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        Archivo de Contratos
                    </h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión Centralizada de Documentación Drive</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar inquilino o propiedad..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all" title="Cerrar Gestor de Contratos">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">Contratos Vigentes</h3>
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{activeContracts.length} ACTIVOS</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm border ${showFilters ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                title="Mostrar filtros avanzados"
                            >
                                <Filter className="w-3.5 h-3.5" /> {showFilters ? 'Cerrar Filtros' : 'Filtrar'}
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mb-8 p-6 bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/20 animate-in slide-in-from-top-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                        <ListFilter className="w-3.5 h-3.5" /> Filtrar por Vivienda
                                    </label>
                                    <select
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        value={selectedProperty}
                                        onChange={e => setSelectedProperty(e.target.value)}
                                        title="Seleccionar vivienda para filtrar"
                                    >
                                        <option value="all">Todas las Viviendas</option>
                                        {uniqueProperties.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                        <SortAsc className="w-3.5 h-3.5" /> Organizar por
                                    </label>
                                    <select
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value as any)}
                                        title="Seleccionar criterio de ordenación"
                                    >
                                        <option value="property">Propiedad (A-Z)</option>
                                        <option value="tenant">Inquilino (A-Z)</option>
                                        <option value="rent">Precio (Mayor a Menor)</option>
                                        <option value="date">Fecha (Más reciente)</option>
                                    </select>
                                </div>

                                <div className="lg:col-span-2 flex items-end justify-end">
                                    <button
                                        onClick={() => {
                                            setSelectedProperty('all');
                                            setSortBy('property');
                                            setSearchTerm('');
                                        }}
                                        className="text-[10px] font-black text-indigo-600 uppercase hover:text-indigo-800 transition-colors flex items-center gap-2"
                                    >
                                        Limpiar todos los filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeContracts.map(contract => (
                            <div key={contract.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-100">
                                            {contract.tenantName.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-base leading-tight truncate max-w-[150px]">{contract.tenantName}</h4>
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{contract.roomName}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100">
                                        ACTIVO
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Propiedad</span>
                                        <span className="font-black text-slate-700 truncate max-w-[160px]">{contract.propertyName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Alquiler</span>
                                        <span className="font-black text-indigo-600">{contract.rentAmount}€/mes</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Vigencia</span>
                                        <span className="font-bold text-slate-600">{contract.startDate} / {contract.endDate}</span>
                                    </div>
                                </div>

                                {contract.driveUrl && (
                                    <button
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-lg shadow-slate-200 mb-4"
                                        onClick={() => window.open(contract.driveUrl, '_blank')}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" /> Abrir Carpeta Drive
                                    </button>
                                )}

                                {/* Editor de Links Sincronizado */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 ml-1">
                                            <Link className="w-3 h-3 text-blue-500" /> Enlace Contrato
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                                placeholder="https://drive.google.com/..."
                                                value={editLinks[contract.id]?.driveUrl ?? (contract.driveUrl || '')}
                                                onChange={e => handleLocalChange(contract.id, 'driveUrl', e.target.value, contract)}
                                            />
                                            <button
                                                onClick={() => {
                                                    let embedUrl = editLinks[contract.id]?.driveUrl ?? contract.driveUrl;
                                                    if (!embedUrl) return;
                                                    let urlToPreview = embedUrl;
                                                    if (urlToPreview.includes('drive.google.com')) {
                                                        urlToPreview = urlToPreview.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview').replace(/\/share.*$/, '/preview');
                                                    }
                                                    setDocPreview({ isOpen: true, url: urlToPreview, title: `Contrato: ${contract.tenantName}` });
                                                }}
                                                className={`absolute right-2 top-2 p-1 transition-colors ${(editLinks[contract.id]?.driveUrl || contract.driveUrl) ? 'text-slate-300 hover:text-indigo-600' : 'text-slate-100 cursor-not-allowed'}`}
                                                disabled={!(editLinks[contract.id]?.driveUrl || contract.driveUrl)}
                                                title="Previsualizar contrato"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 ml-1">
                                            <Camera className="w-3 h-3 text-purple-500" /> Enlace Fotos
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                                placeholder="https://drive.google.com/..."
                                                value={editLinks[contract.id]?.photosDriveUrl ?? (contract.photosDriveUrl || '')}
                                                onChange={e => handleLocalChange(contract.id, 'photosDriveUrl', e.target.value, contract)}
                                            />
                                            <button
                                                onClick={() => {
                                                    let embedUrl = editLinks[contract.id]?.photosDriveUrl ?? contract.photosDriveUrl;
                                                    if (!embedUrl) return;
                                                    let urlToPreview = embedUrl;
                                                    if (urlToPreview.includes('drive.google.com')) {
                                                        urlToPreview = urlToPreview.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview').replace(/\/share.*$/, '/preview');
                                                    }
                                                    setDocPreview({ isOpen: true, url: urlToPreview, title: `Fotos: ${contract.tenantName}` });
                                                }}
                                                className={`absolute right-2 top-2 p-1 transition-colors ${(editLinks[contract.id]?.photosDriveUrl || contract.photosDriveUrl) ? 'text-slate-300 hover:text-purple-600' : 'text-slate-100 cursor-not-allowed'}`}
                                                disabled={!(editLinks[contract.id]?.photosDriveUrl || contract.photosDriveUrl)}
                                                title="Previsualizar fotos"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {(editLinks[contract.id] && (
                                        editLinks[contract.id].driveUrl !== (contract.driveUrl || '') ||
                                        editLinks[contract.id].photosDriveUrl !== (contract.photosDriveUrl || '')
                                    )) && (
                                            <button
                                                onClick={() => handleSave(contract.propertyId, contract.roomId, contract.id)}
                                                disabled={savingId === contract.id}
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 animate-in slide-in-from-top-2"
                                            >
                                                {savingId === contract.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                {savingId === contract.id ? 'Sincronizando...' : 'Sincronizar con Drive'}
                                            </button>
                                        )}
                                </div>
                            </div>
                        ))}

                        {activeContracts.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="bg-slate-50 p-6 rounded-full mb-4">
                                    <FileText className="w-12 h-12 text-slate-200" />
                                </div>
                                <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm">No se han encontrado contratos vigentes</h4>
                                <p className="text-slate-300 text-xs mt-2">Asegúrate de que las habitaciones tengan inquilinos asignados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
