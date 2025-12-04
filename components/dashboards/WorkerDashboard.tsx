import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
// Fix: Import 'orderBy' to sort Firestore queries.
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskStatus, Candidate, CandidateStatus, VisitOutcome, RoomVisit } from '../../types';
import { Property, Room } from '../../data/rooms';
import { ClipboardList, Home, CheckCircle, Clock, AlertCircle, MapPin, Search, Calendar, Wrench, Plus, X, AlertTriangle, ChevronLeft, Loader2, WifiOff, Monitor, Tv, Lock, Sun, Bed, Layout, Image as ImageIcon, UserPlus, Send, Users, UserX, UserCheck, ChevronRight, Eye } from 'lucide-react';
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

interface TaskCardProps {
    task: Task;
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => (
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
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-gray-50 gap-2">
            {task.dueDate && (
                <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'Completada' ? 'text-red-500' : 'text-gray-400'}`}>
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                </div>
            )}
            
            <div className="flex gap-2 ml-auto w-full sm:w-auto">
                {task.status !== 'En Curso' && task.status !== 'Completada' && (
                    <button onClick={() => onStatusChange(task.id, 'En Curso')} className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 active:bg-blue-100">
                        <Clock className="w-3 h-3" /> Empezar
                    </button>
                )}
                {task.status !== 'Completada' && (
                    <button onClick={() => onStatusChange(task.id, 'Completada')} className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 active:bg-green-100">
                        <CheckCircle className="w-3 h-3" /> Hecho
                    </button>
                )}
                 {task.status === 'En Curso' && (
                     <button onClick={() => onStatusChange(task.id, 'Pendiente')} className="p-1.5 text-gray-400 bg-gray-100 rounded-lg">
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
    
    const [workerName, setWorkerName] = useState<string>('');
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [myCandidates, setMyCandidates] = useState<Candidate[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [roomSearch, setRoomSearch] = useState('');
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const [taskFilter, setTaskFilter] = useState<TaskStatus>('Pendiente');
    const [candidateFilter, setCandidateFilter] = useState<CandidateStatus>('pending_review');

    const [newIncident, setNewIncident] = useState({
        propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' as 'Alta' | 'Media' | 'Baja'
    });
    const [newCandidate, setNewCandidate] = useState({
        propertyId: '', roomId: '', candidateName: '', additionalInfo: '',
        candidatePhone: '', candidateEmail: ''
    });

    // NEW: Visit Log State
    const [showVisitLogModal, setShowVisitLogModal] = useState<Room | null>(null);
    const [newVisitData, setNewVisitData] = useState({
        outcome: 'pending' as VisitOutcome,
        comments: '',
        commission: 0
    });

    useEffect(() => {
        if (currentUser) {
            setWorkerName(currentUser.displayName || 'Ayoub');
        }
    }, [currentUser]);

    useEffect(() => {
        if (!workerName) return;
        setLoading(true);
        setError(null);
        
        const qTasks = query(collection(db, "tasks"), where("assignee", "==", workerName));
        const unsubTasks = onSnapshot(qTasks, snapshot => {
            const tasksList: Task[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
            // Sort client-side to avoid composite index requirement
            tasksList.sort((a, b) => {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return dateA - dateB;
            });
            setMyTasks(tasksList);
            setLoading(false);
        }, err => { setError("No se pudieron cargar las tareas."); setLoading(false); });

        const unsubProps = onSnapshot(collection(db, "properties"), snapshot => {
            const propsList: Property[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property));
            propsList.sort((a,b) => a.address.localeCompare(b.address));
            setProperties(propsList);
        });
        
        const qCandidates = query(collection(db, "candidate_pipeline"), where("submittedBy", "==", workerName), orderBy("submittedAt", "desc"));
        const unsubCandidates = onSnapshot(qCandidates, snapshot => {
            const candidatesList: Candidate[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Candidate));
            setMyCandidates(candidatesList);
        });

        return () => { unsubTasks(); unsubProps(); unsubCandidates(); };
    }, [workerName]);
    
    const tasksByStatus = useMemo(() => {
        return myTasks.reduce((acc, task) => {
            const status = task.status || 'Pendiente';
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [myTasks]);
    
    const candidatesByStatus = useMemo(() => ({
        pending_review: myCandidates.filter(c => c.status === 'pending_review'),
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

    // NEW: Handle Save Visit
    const handleSaveVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showVisitLogModal || !selectedProperty) return;

        try {
            await addDoc(collection(db, "room_visits"), {
                propertyId: selectedProperty.id,
                propertyName: selectedProperty.address,
                roomId: showVisitLogModal.id,
                roomName: showVisitLogModal.name,
                workerName: workerName,
                visitDate: serverTimestamp(),
                outcome: newVisitData.outcome,
                comments: newVisitData.comments,
                commission: Number(newVisitData.commission) || 0
            });
            setShowVisitLogModal(null);
            setNewVisitData({ outcome: 'pending', comments: '', commission: 0 });
            alert('Visita registrada correctamente.');
        } catch (err) {
            console.error(err);
            alert('Error al registrar la visita.');
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

    const renderContent = () => {
        switch (activeTab) {
            case 'tasks': return (
                <div className="space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['Pendiente', 'En Curso', 'Completada', 'Bloqueada'] as TaskStatus[]).map(status => (
                            <button key={status} onClick={() => setTaskFilter(status)} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${taskFilter === status ? 'bg-white shadow' : 'text-gray-500'}`}>
                                {status} ({tasksByStatus[status]?.length || 0})
                            </button>
                        ))}
                    </div>
                    {loading ? <Loader2 className="w-6 h-6 animate-spin text-rentia-blue mx-auto mt-8"/> :
                     (tasksByStatus[taskFilter] && tasksByStatus[taskFilter].length > 0) ? tasksByStatus[taskFilter].map(task => <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />)
                     : <div className="text-center py-10 text-gray-400 text-sm">No hay tareas {taskFilter.toLowerCase()}s.</div>
                    }
                </div>
            );
            case 'candidates': return (
                <div className="space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['pending_review', 'approved', 'rejected'] as CandidateStatus[]).map(status => (
                            <button key={status} onClick={() => setCandidateFilter(status)} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all capitalize ${candidateFilter === status ? 'bg-white shadow' : 'text-gray-500'}`}>
                                {status === 'pending_review' ? 'Pendientes' : status === 'approved' ? 'Aprobados' : 'Rechazados'} ({candidatesByStatus[status]?.length || 0})
                            </button>
                        ))}
                    </div>
                    {(candidatesByStatus[candidateFilter] && candidatesByStatus[candidateFilter].length > 0) ? candidatesByStatus[candidateFilter].map(c => (
                        <div key={c.id} className="bg-white border p-3 rounded-lg text-xs shadow-sm">
                            <p className="font-bold text-sm text-gray-800">{c.candidateName}</p>
                            <p className="text-gray-500 text-xs">{c.propertyName} - {c.roomName}</p>
                        </div>
                    )) : <div className="text-center py-10 text-gray-400 text-sm">No hay perfiles.</div>}
                </div>
            );
            case 'rooms': return (
                <div className="space-y-4">
                     <div className="relative">
                        <input type="text" placeholder="Buscar propiedad..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue shadow-sm text-sm" value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                    {filteredProperties.length === 0 ? <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl"><Home className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No se encontraron propiedades.</p></div> : 
                    filteredProperties.map((prop) => {
                        const availCount = prop.rooms.filter(r => r.status === 'available').length;
                        return (
                            <div key={prop.id} onClick={() => setSelectedProperty(prop)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all group flex items-center">
                                <div className="w-24 h-24 bg-gray-200 relative flex-shrink-0">
                                    {prop.image ? <img src={prop.image} alt={prop.address} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Home className="w-8 h-8 opacity-30" /></div>}
                                </div>
                                <div className="p-3 flex-grow min-w-0">
                                    <h3 className="font-bold text-sm leading-tight truncate">{prop.address}</h3>
                                    <p className="text-xs text-gray-500 truncate">{prop.city}</p>
                                    <div className="mt-2 text-[10px] font-bold">
                                        {availCount > 0 
                                         ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{availCount} Libres</span>
                                         : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Completo</span>
                                        }
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 mr-4 group-hover:text-rentia-blue"/>
                            </div>
                        );
                    })}
                </div>
            );
        }
    }

    if (!workerName) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-6xl mx-auto p-4 md:p-6 pb-28">
                <header className="mb-6">
                    <h1 className="text-xl md:text-2xl font-bold text-rentia-black font-display">
                        Hola, {workerName} <span className="text-xl">🛠️</span>
                    </h1>
                    {error && <div className="mt-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2"><WifiOff className="w-4 h-4" />{error}</div>}
                </header>

                <main>
                    {renderContent()}
                </main>

                {/* FAB Contextual */}
                <div className="fixed bottom-24 right-6 z-40">
                    {activeTab === 'tasks' && <button onClick={() => setShowIncidentModal(true)} className="w-14 h-14 bg-red-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"><AlertTriangle className="w-6 h-6" /></button>}
                    {activeTab === 'candidates' && <button onClick={() => setShowCandidateModal(true)} className="w-14 h-14 bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"><UserPlus className="w-6 h-6" /></button>}
                </div>

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] grid grid-cols-3 z-50">
                    <button onClick={() => setActiveTab('tasks')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'tasks' ? 'text-rentia-blue' : 'text-gray-400'}`}>
                        <ClipboardList className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Tareas</span>
                    </button>
                    <button onClick={() => setActiveTab('candidates')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'candidates' ? 'text-rentia-blue' : 'text-gray-400'}`}>
                        <Users className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Candidatos</span>
                    </button>
                    <button onClick={() => setActiveTab('rooms')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'rooms' ? 'text-rentia-blue' : 'text-gray-400'}`}>
                        <Home className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Catálogo</span>
                    </button>
                </div>
            </div>

            {/* --- Modals --- */}
            {selectedProperty && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-10">
                    <div className="flex-shrink-0 bg-white shadow-sm p-4 flex justify-between items-center sticky top-0">
                        <button onClick={() => setSelectedProperty(null)} className="flex items-center gap-1 text-rentia-blue text-sm font-bold"><ChevronLeft className="w-5 h-5"/> Volver</button>
                        <h2 className="font-bold text-sm truncate">{selectedProperty.address}</h2>
                        <a href={selectedProperty.googleMapsLink} target="_blank" rel="noreferrer" className="p-2 text-gray-500"><MapPin className="w-5 h-5"/></a>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {selectedProperty.rooms.map(room => (
                            <div key={room.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-gray-800">{room.name}</h4>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${room.status==='available'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{room.status}</span>
                                </div>
                                <p className="text-lg font-bold text-rentia-blue">{room.price}€/mes</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {room.images && room.images.length > 0 && <button onClick={() => openImages(room.images!)} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><ImageIcon className="w-3 h-3"/> {room.images.length} fotos</button>}
                                    {room.features?.map(f => <div key={f} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded flex items-center gap-1">{getFeatureIcon(f)} {f}</div>)}
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <button onClick={() => setShowVisitLogModal(room)} className="w-full bg-indigo-50 text-indigo-700 text-xs font-bold py-2 rounded-lg border border-indigo-100 flex items-center justify-center gap-2">
                                        <Eye className="w-4 h-4" /> Registrar Visita
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* NEW: Visit Log Modal */}
            {showVisitLogModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowVisitLogModal(null)}>
                    <form onSubmit={handleSaveVisit} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-500"/> Registrar Visita a {showVisitLogModal.name}</h3><button type="button" onClick={() => setShowVisitLogModal(null)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button></div>
                        <div className="p-4 space-y-4 overflow-y-auto">
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Resultado de la Visita</label><select required className="w-full p-2 border rounded text-sm" value={newVisitData.outcome} onChange={e => setNewVisitData({...newVisitData, outcome: e.target.value as any})}><option value="successful">Exitosa</option><option value="unsuccessful">No exitosa</option><option value="pending">Pendiente de respuesta</option></select></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Comentarios / Pegas</label><textarea placeholder="Ej: Le ha gustado pero le parece pequeña..." className="w-full p-2 border rounded text-sm h-24" value={newVisitData.comments} onChange={e => setNewVisitData({...newVisitData, comments: e.target.value})}></textarea></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Comisión Propuesta al Inquilino (€)</label><input type="number" placeholder="Ej: 150" className="w-full p-2 border rounded text-sm" value={newVisitData.commission} onChange={e => setNewVisitData({...newVisitData, commission: Number(e.target.value)})} /></div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex gap-2">
                            <button type="button" onClick={() => setShowVisitLogModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button>
                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"><Send className="w-4 h-4"/> Guardar Visita</button>
                        </div>
                    </form>
                </div>
            )}
            
            {showIncidentModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowIncidentModal(false)}>
                    <form onSubmit={handleSaveIncident} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/> Reportar Incidencia</h3><button type="button" onClick={() => setShowIncidentModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button></div>
                        <div className="p-4 space-y-4 overflow-y-auto"><select required className="w-full p-2 border rounded text-sm" value={newIncident.propertyId} onChange={e => setNewIncident({...newIncident, propertyId: e.target.value})}><option value="">Seleccionar Propiedad*</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select><input required type="text" placeholder="Título Incidencia*" className="w-full p-2 border rounded text-sm" value={newIncident.title} onChange={e => setNewIncident({...newIncident, title: e.target.value})} /><textarea placeholder="Descripción detallada..." className="w-full p-2 border rounded text-sm h-24" value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})}></textarea><select className="w-full p-2 border rounded text-sm" value={newIncident.priority} onChange={e => setNewIncident({...newIncident, priority: e.target.value as any})}><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option></select></div>
                        <div className="p-4 bg-gray-50 border-t flex gap-2">
                            <button type="button" onClick={() => setShowIncidentModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button>
                            <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700"><Send className="w-4 h-4"/> Enviar Reporte</button>
                        </div>
                    </form>
                </div>
            )}
            
            {showCandidateModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCandidateModal(false)}>
                    <form onSubmit={handleSendCandidate} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600"/> Enviar Candidato</h3><button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button></div>
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]"><div><label className="text-xs font-bold text-gray-500 block mb-1">Propiedad*</label><select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({...newCandidate, propertyId: e.target.value, roomId: ''})}><option value="">Seleccionar...</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Habitación*</label><select required disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({...newCandidate, roomId: e.target.value})}><option value="">Seleccionar...</option>{properties.find(p => p.id === newCandidate.propertyId)?.rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Nombre Candidato*</label><input required type="text" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateName} onChange={e => setNewCandidate({...newCandidate, candidateName: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 block mb-1">Teléfono</label><input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({...newCandidate, candidatePhone: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Email</label><input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({...newCandidate, candidateEmail: e.target.value})}/></div></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Info Adicional</label><textarea className="w-full p-2 border rounded text-sm h-20" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({...newCandidate, additionalInfo: e.target.value})} /></div></div>
                        <div className="p-4 bg-gray-50 border-t flex gap-2">
                           <button type="button" onClick={() => setShowCandidateModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button>
                           <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700"><Send className="w-4 h-4"/> Enviar a Oficina</button>
                        </div>
                    </form>
                </div>
            )}

            {isLightboxOpen && <ImageLightbox images={lightboxImages} selectedIndex={lightboxIndex} onClose={() => setIsLightboxOpen(false)} />}
        </div>
    );
};