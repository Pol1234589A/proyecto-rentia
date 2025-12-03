import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskStatus, Candidate } from '../../types';
import { Property, Room } from '../../data/rooms';
import { ClipboardList, Home, CheckCircle, Clock, AlertCircle, MapPin, Search, Calendar, Wrench, Plus, X, AlertTriangle, Save, ChevronRight, Filter, Loader2, WifiOff, Monitor, Tv, Lock, Sun, Bed, Layout, Image as ImageIcon, UserPlus, Send, Users, UserX, UserCheck } from 'lucide-react';
import { ImageLightbox } from '../ImageLightbox';

// Priority Badge Helper
const getPriorityBadge = (p: string) => {
    switch(p) {
        case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
        case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Baja': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100';
    }
};

// TaskCard Component Extracted
interface TaskCardProps {
    task: Task;
    showStatusBtn?: boolean;
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showStatusBtn = true, onStatusChange }) => (
    <div className={`bg-white p-4 rounded-xl border shadow-sm active:scale-[0.98] transition-transform duration-100 relative ${task.category === 'Mantenimiento' ? 'border-l-4 border-l-red-400 border-y-gray-200 border-r-gray-200' : 'border-gray-200'}`}>
        <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                {task.priority}
            </span>
            <div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded flex items-center gap-1 border border-gray-100">
                {task.category === 'Mantenimiento' && <Wrench className="w-3 h-3"/>}
                {task.category}
            </div>
        </div>
        
        <h4 className="font-bold text-gray-800 text-sm mb-2 leading-snug break-words">{task.title}</h4>
        <p className="text-xs text-gray-500 line-clamp-3 mb-3 whitespace-pre-line bg-gray-50 p-2 rounded border border-gray-100">{task.description}</p>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            {task.dueDate && (
                <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'Completada' ? 'text-red-500' : 'text-gray-400'}`}>
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto">
                {showStatusBtn && task.status !== 'En Curso' && task.status !== 'Completada' && (
                    <button 
                        onClick={() => onStatusChange(task.id, 'En Curso')} 
                        className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 active:bg-blue-100"
                    >
                        <Clock className="w-3 h-3" /> Empezar
                    </button>
                )}
                {showStatusBtn && task.status !== 'Completada' && (
                    <button 
                        onClick={() => onStatusChange(task.id, 'Completada')} 
                        className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 active:bg-green-100"
                    >
                        <CheckCircle className="w-3 h-3" /> Hecho
                    </button>
                )}
                {showStatusBtn && task.status === 'En Curso' && (
                     <button 
                        onClick={() => onStatusChange(task.id, 'Pendiente')} 
                        className="p-1.5 text-gray-400 bg-gray-100 rounded-lg"
                     >
                         <X className="w-4 h-4" />
                     </button>
                )}
            </div>
        </div>
    </div>
);

export const WorkerDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'tasks' | 'candidates' | 'rooms'>('tasks');
    
    // Identity State
    const [workerName, setWorkerName] = useState<string>('');
    
    // Data State
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [myCandidates, setMyCandidates] = useState<Candidate[]>([]); // NEW: Candidates state
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // UI State
    const [roomSearch, setRoomSearch] = useState('');
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Form States
    const [newIncident, setNewIncident] = useState({
        propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' as 'Alta' | 'Media' | 'Baja'
    });
    const [newCandidate, setNewCandidate] = useState({
        propertyId: '', roomId: '', candidateName: '', additionalInfo: '',
        candidatePhone: '', candidateEmail: ''
    });

    useEffect(() => {
        const resolveWorkerIdentity = async () => {
            if (!currentUser) return;
            let resolvedName = currentUser.displayName || 'Ayoub'; // Fallback a 'Ayoub'
            setWorkerName(resolvedName);
        };
        resolveWorkerIdentity();
    }, [currentUser]);

    useEffect(() => {
        if (!workerName) return;
        setLoading(true);
        setError(null);
        
        // --- 1. Fetch Tasks ---
        const qTasks = query(collection(db, "tasks"), where("assignee", "==", workerName));
        const unsubTasks = onSnapshot(qTasks, snapshot => {
            const tasksList: Task[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
            tasksList.sort((a, b) => (a.dueDate && b.dueDate) ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : 1);
            setMyTasks(tasksList);
            setLoading(false);
        }, err => { setError("No se pudieron cargar las tareas."); setLoading(false); });

        // --- 2. Fetch Properties ---
        const unsubProps = onSnapshot(collection(db, "properties"), snapshot => {
            const propsList: Property[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property));
            propsList.sort((a,b) => a.address.localeCompare(b.address));
            setProperties(propsList);
        });
        
        // --- 3. Fetch My Candidates ---
        const qCandidates = query(collection(db, "candidate_pipeline"), where("submittedBy", "==", workerName));
        const unsubCandidates = onSnapshot(qCandidates, snapshot => {
            const candidatesList: Candidate[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Candidate));
            candidatesList.sort((a, b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis());
            setMyCandidates(candidatesList);
        });

        return () => { unsubTasks(); unsubProps(); unsubCandidates(); };
    }, [workerName]);
    
    // --- LOGIC: TASKS ---
    const tasksByStatus = useMemo(() => {
        return myTasks.reduce((acc, task) => {
            const status = task.status || 'Pendiente';
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [myTasks]);
    
    // --- LOGIC: CANDIDATES ---
    const candidatesByStatus = useMemo(() => ({
        pending: myCandidates.filter(c => c.status === 'pending_review'),
        approved: myCandidates.filter(c => c.status === 'approved'),
        rejected: myCandidates.filter(c => c.status === 'rejected'),
    }), [myCandidates]);

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
    };

    const handleSaveIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIncident.propertyId || !newIncident.title) return alert("Selecciona una propiedad y escribe un título.");

        const selectedProp = properties.find(p => p.id === newIncident.propertyId);
        const locationText = selectedProp?.address || 'Propiedad';
        const taskTitle = `INCIDENCIA: ${newIncident.title} (${locationText})`;

        await addDoc(collection(db, "tasks"), {
            title: taskTitle, description: newIncident.description, assignee: workerName, 
            priority: newIncident.priority, status: 'Pendiente', category: 'Mantenimiento', 
            boardId: 'incidents', createdAt: serverTimestamp(), dueDate: new Date().toISOString() 
        });

        setShowIncidentModal(false);
        setNewIncident({ propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' });
        alert("Incidencia reportada correctamente.");
    };
    
    const handleSendCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCandidate.propertyId || !newCandidate.roomId || !newCandidate.candidateName) {
            return alert("Completa todos los campos: propiedad, habitación y nombre.");
        }
        
        const prop = properties.find(p => p.id === newCandidate.propertyId);
        const room = prop?.rooms.find(r => r.id === newCandidate.roomId);

        try {
            await addDoc(collection(db, "candidate_pipeline"), {
                ...newCandidate,
                propertyName: prop?.address || 'N/A',
                roomName: room?.name || 'N/A',
                submittedBy: workerName,
                submittedAt: serverTimestamp(),
                status: 'pending_review'
            });
            setShowCandidateModal(false);
            setNewCandidate({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '' });
            alert('Candidato enviado a filtrado correctamente.');
        } catch (error) {
            console.error(error);
            alert('Error al enviar candidato.');
        }
    };

    const filteredProperties = useMemo(() => {
        return properties.filter(p => 
            p.address.toLowerCase().includes(roomSearch.toLowerCase()) || 
            p.city.toLowerCase().includes(roomSearch.toLowerCase())
        );
    }, [properties, roomSearch]);

    const openImages = (images: string[], index = 0) => {
        setLightboxImages(images); setLightboxIndex(index); setIsLightboxOpen(true);
    };
    const getFeatureIcon = (id: string) => {
        switch(id) {
            case 'balcony': return <Sun className="w-3 h-3"/>;
            case 'smart_tv': return <Tv className="w-3 h-3"/>;
            case 'lock': return <Lock className="w-3 h-3"/>;
            case 'desk': return <Monitor className="w-3 h-3"/>;
            default: return <CheckCircle className="w-3 h-3"/>;
        }
    };

    if (!workerName) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-6 animate-in fade-in">
            <div className="max-w-6xl mx-auto p-4 md:p-6">
                
                <header className="mb-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-rentia-black font-display flex items-center gap-2">
                                Hola, {workerName} <span className="text-xl">🛠️</span>
                            </h1>
                            <p className="text-gray-500 text-xs mt-0.5">Técnico y Comercial</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowCandidateModal(true)} className="hidden md:flex bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors items-center gap-2 border border-green-200"><UserPlus className="w-4 h-4" /> Enviar Candidato</button>
                            <button onClick={() => setShowIncidentModal(true)} className="hidden md:flex bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors items-center gap-2 border border-red-200"><AlertTriangle className="w-4 h-4" /> Reportar Incidencia</button>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2"><WifiOff className="w-4 h-4" />{error}</div>}

                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                        <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'tasks' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <ClipboardList className="w-4 h-4" /> Mis Tareas
                        </button>
                        <button onClick={() => setActiveTab('candidates')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'candidates' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Users className="w-4 h-4" /> Mis Candidatos
                        </button>
                        <button onClick={() => setActiveTab('rooms')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'rooms' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Home className="w-4 h-4" /> Catálogo
                        </button>
                    </div>
                </header>

                {activeTab === 'tasks' && (
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {['Pendiente', 'En Curso', 'Bloqueada', 'Completada'].map((status) => (
                            <div key={status} className="flex flex-col h-full min-w-[280px]">
                                <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${status === 'Pendiente' ? 'border-orange-200' : status === 'En Curso' ? 'border-blue-200' : status === 'Completada' ? 'border-green-200' : 'border-red-200'}`}>
                                    <h3 className="font-bold text-gray-700 text-sm uppercase">{status}</h3>
                                    <span className="text-xs font-bold text-gray-400">{tasksByStatus[status]?.length || 0}</span>
                                </div>
                                <div className="space-y-3 flex-grow">
                                    {tasksByStatus[status]?.map(task => <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />)}
                                    {(!tasksByStatus[status] || tasksByStatus[status]?.length === 0) && <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-xs">Sin tareas</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {activeTab === 'candidates' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                        {/* PENDIENTES */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-yellow-800 bg-yellow-100 px-3 py-1 rounded-lg w-fit mb-4 text-sm flex items-center gap-2"><Clock className="w-4 h-4"/> Pendientes</h3>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {candidatesByStatus.pending.map(c => <div key={c.id} className="bg-gray-50 border p-3 rounded-lg text-xs"><p className="font-bold">{c.candidateName}</p><p className="text-gray-500">{c.propertyName} - {c.roomName}</p></div>)}
                                {candidatesByStatus.pending.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Ningún perfil pendiente.</p>}
                            </div>
                        </div>
                        {/* APROBADOS */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-green-800 bg-green-100 px-3 py-1 rounded-lg w-fit mb-4 text-sm flex items-center gap-2"><UserCheck className="w-4 h-4"/> Aprobados</h3>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {candidatesByStatus.approved.map(c => <div key={c.id} className="bg-gray-50 border p-3 rounded-lg text-xs"><p className="font-bold">{c.candidateName}</p><p className="text-gray-500">{c.propertyName} - {c.roomName}</p></div>)}
                                {candidatesByStatus.approved.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Ningún perfil aprobado.</p>}
                            </div>
                        </div>
                        {/* RECHAZADOS */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-red-800 bg-red-100 px-3 py-1 rounded-lg w-fit mb-4 text-sm flex items-center gap-2"><UserX className="w-4 h-4"/> Rechazados</h3>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {candidatesByStatus.rejected.map(c => <div key={c.id} className="bg-gray-50 border p-3 rounded-lg text-xs"><p className="font-bold">{c.candidateName}</p><p className="text-gray-500">{c.propertyName} - {c.roomName}</p></div>)}
                                {candidatesByStatus.rejected.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Ningún perfil rechazado.</p>}
                            </div>
                        </div>
                    </div>
                )}


                {activeTab === 'rooms' && (
                   <div className="animate-in slide-in-from-right-4 duration-300 pb-20">
                        <div className="mb-6 relative">
                            <input type="text" placeholder="Buscar propiedad (calle o ciudad)..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue shadow-sm text-sm" value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProperties.map((prop) => {
                                const availCount = prop.rooms.filter(r => r.status === 'available').length;
                                return (
                                    <div key={prop.id} onClick={() => setSelectedProperty(prop)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
                                        <div className="h-48 bg-gray-200 relative">
                                            {prop.image ? <img src={prop.image} alt={prop.address} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Home className="w-12 h-12 opacity-30" /></div>}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 text-white"><h3 className="font-bold text-lg leading-tight">{prop.address}</h3><p className="text-xs opacity-90">{prop.city}</p></div>
                                            {availCount > 0 && <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {availCount} Libres</div>}
                                        </div>
                                        <div className="p-4 flex justify-between items-center"><div className="text-xs text-gray-500 font-medium">{prop.rooms.length} Habitaciones Total</div><button className="text-xs font-bold text-rentia-blue bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-rentia-blue group-hover:text-white transition-colors">Ver Ficha</button></div>
                                    </div>
                                );
                            })}
                        </div>
                        {filteredProperties.length === 0 && <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl"><Home className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No se encontraron propiedades.</p></div>}
                    </div>
                )}
                
                {selectedProperty && (
                    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
                        {/* ... (Contenido del modal de ficha técnica se mantiene igual) ... */}
                    </div>
                )}

                <div className="md:hidden fixed bottom-6 right-6 flex flex-col gap-3 z-40">
                    <button onClick={() => setShowCandidateModal(true)} className="w-14 h-14 bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"><UserPlus className="w-6 h-6" /></button>
                    <button onClick={() => setShowIncidentModal(true)} className="w-14 h-14 bg-red-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"><AlertTriangle className="w-6 h-6" /></button>
                </div>

                {showIncidentModal && (
                   <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                        {/* ... (Contenido del modal de incidencia se mantiene igual) ... */}
                   </div>
                )}
                
                {showCandidateModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <form onSubmit={handleSendCandidate} className="bg-white w-full sm:w-full sm:max-w-md h-auto sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" /> Enviar Candidato</h3>
                                <button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X className="w-5 h-5 text-gray-600"/></button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad *</label><select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({...newCandidate, propertyId: e.target.value, roomId: ''})}><option value="">Seleccionar...</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Habitación *</label><select required disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({...newCandidate, roomId: e.target.value})}><option value="">Seleccionar...</option>{properties.find(p => p.id === newCandidate.propertyId)?.rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}</select></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Candidato *</label><input required type="text" className="w-full p-2 border rounded text-sm font-bold" value={newCandidate.candidateName} onChange={e => setNewCandidate({...newCandidate, candidateName: e.target.value})} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label><input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({...newCandidate, candidatePhone: e.target.value})} /></div>
                                     <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label><input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({...newCandidate, candidateEmail: e.target.value})} /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Info Adicional</label><textarea className="w-full p-2 border rounded text-sm h-20 resize-none" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({...newCandidate, additionalInfo: e.target.value})} /></div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t shrink-0"><button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg"><Send className="w-4 h-4"/> Enviar a Oficina</button></div>
                        </form>
                    </div>
                )}

                {isLightboxOpen && <ImageLightbox images={lightboxImages} selectedIndex={lightboxIndex} onClose={() => setIsLightboxOpen(false)} />}
            </div>
        </div>
    );
};