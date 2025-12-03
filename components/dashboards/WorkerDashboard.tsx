import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskStatus } from '../../types';
import { Property, Room } from '../../data/rooms';
// Fix: Import the 'Send' icon from lucide-react.
import { ClipboardList, Home, CheckCircle, Clock, AlertCircle, MapPin, Search, Calendar, Wrench, Plus, X, AlertTriangle, Save, ChevronRight, Filter, Loader2, WifiOff, Monitor, Tv, Lock, Sun, Bed, Layout, Image as ImageIcon, UserPlus, Send } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'tasks' | 'rooms'>('tasks');
    
    // Identity State (Nombre verificado para cruzar con tareas)
    const [workerName, setWorkerName] = useState<string>('');
    
    // Data State
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters & UI State
    const [roomSearch, setRoomSearch] = useState('');
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false); // NEW STATE
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    
    // Lightbox State
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Form States
    const [newIncident, setNewIncident] = useState({
        propertyId: '',
        roomId: 'common', 
        title: '',
        description: '',
        priority: 'Media' as 'Alta' | 'Media' | 'Baja'
    });
    
    const [newCandidate, setNewCandidate] = useState({
        propertyId: '',
        roomId: '',
        candidateName: '',
        additionalInfo: ''
    });

    // 1. Identificación Robusta del Trabajador
    useEffect(() => {
        const resolveWorkerIdentity = async () => {
            if (!currentUser) return;
            
            let resolvedName = currentUser.displayName;
            if (!resolvedName) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        resolvedName = userDoc.data().displayName;
                    }
                } catch (e) { console.error("Error fetching worker profile", e); }
            }
            if (resolvedName && resolvedName.toLowerCase().includes('ayoub')) {
                resolvedName = 'Ayoub';
            }
            setWorkerName(resolvedName || 'Ayoub');
        };
        resolveWorkerIdentity();
    }, [currentUser]);

    // 2. Cargar Datos
    useEffect(() => {
        if (!workerName) return;

        setLoading(true);
        setError(null);

        const qTasks = query(collection(db, "tasks"), where("assignee", "==", workerName));
        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
            const tasksList: Task[] = [];
            snapshot.forEach((doc) => tasksList.push({ ...doc.data(), id: doc.id } as Task));
            tasksList.sort((a, b) => {
                if(!a.dueDate) return 1; if(!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
            setMyTasks(tasksList);
            setLoading(false);
        }, (err) => {
            setError("No se pudieron cargar las tareas. Verifica permisos.");
            setLoading(false);
        });

        const unsubProps = onSnapshot(collection(db, "properties"), (snapshot) => {
            const propsList: Property[] = [];
            snapshot.forEach((doc) => propsList.push({ ...doc.data(), id: doc.id } as Property));
            propsList.sort((a,b) => a.address.localeCompare(b.address));
            setProperties(propsList);
        });

        return () => { unsubTasks(); unsubProps(); };
    }, [workerName]);
    
    // --- LOGIC: TASKS ---
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, Task[]> = { 'Pendiente': [], 'En Curso': [], 'Bloqueada': [], 'Completada': [] };
        myTasks.forEach(task => {
            const status = task.status || 'Pendiente';
            if (grouped[status]) grouped[status].push(task);
            else grouped['Pendiente'].push(task);
        });
        return grouped;
    }, [myTasks]);

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
    };

    const handleSaveIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIncident.propertyId || !newIncident.title) return alert("Selecciona una propiedad y escribe un título.");

        const selectedProp = properties.find(p => p.id === newIncident.propertyId);
        let locationText = selectedProp?.address || 'Propiedad desconocida';
        if (newIncident.roomId !== 'common') {
            const room = selectedProp?.rooms.find(r => r.id === newIncident.roomId);
            locationText += ` - ${room?.name || 'Habitación'}`;
        } else {
            locationText += ` - Zonas Comunes`;
        }
        const taskTitle = `INCIDENCIA: ${newIncident.title}`;
        const fullDescription = `[Ubicación: ${locationText}]\n\n${newIncident.description}`;

        let targetBoardId = '';
        const boardsRef = collection(db, "task_boards");
        const qBoard = query(boardsRef, where("title", "==", "Incidencias"));
        const boardSnap = await getDocs(qBoard);
        if (!boardSnap.empty) {
            targetBoardId = boardSnap.docs[0].id;
        } else {
            const newBoard = await addDoc(boardsRef, { title: "Incidencias", group: "Mantenimiento", createdAt: serverTimestamp() });
            targetBoardId = newBoard.id;
        }

        await addDoc(collection(db, "tasks"), {
            title: taskTitle, description: fullDescription, assignee: workerName, 
            priority: newIncident.priority, status: 'Pendiente', category: 'Mantenimiento', 
            boardId: targetBoardId, createdAt: serverTimestamp(), dueDate: new Date().toISOString() 
        });

        setShowIncidentModal(false);
        setNewIncident({ propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' });
        alert("Incidencia reportada correctamente en el tablón.");
    };
    
    // NEW: Candidate Submission Logic
    const handleSendCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCandidate.propertyId || !newCandidate.roomId || !newCandidate.candidateName) {
            return alert("Completa todos los campos: propiedad, habitación y nombre.");
        }
        
        const prop = properties.find(p => p.id === newCandidate.propertyId);
        const room = prop?.rooms.find(r => r.id === newCandidate.roomId);

        try {
            await addDoc(collection(db, "candidate_pipeline"), {
                candidateName: newCandidate.candidateName,
                additionalInfo: newCandidate.additionalInfo,
                propertyId: newCandidate.propertyId,
                propertyName: prop?.address || 'N/A',
                roomId: newCandidate.roomId,
                roomName: room?.name || 'N/A',
                submittedBy: workerName,
                submittedAt: serverTimestamp(),
                status: 'pending_review'
            });
            setShowCandidateModal(false);
            setNewCandidate({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '' });
            alert('Candidato enviado a filtrado correctamente.');
        } catch (error) {
            console.error(error);
            alert('Error al enviar candidato.');
        }
    };

    // --- LOGIC: PROPERTIES FILTER ---
    const filteredProperties = useMemo(() => {
        return properties.filter(p => 
            p.address.toLowerCase().includes(roomSearch.toLowerCase()) || 
            p.city.toLowerCase().includes(roomSearch.toLowerCase())
        );
    }, [properties, roomSearch]);

    // --- HELPERS ---
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
                
                {/* HEADER */}
                <header className="mb-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-rentia-black font-display flex items-center gap-2">
                                Hola, {workerName} <span className="text-xl">🛠️</span>
                            </h1>
                            <p className="text-gray-500 text-xs mt-0.5">Técnico y Comercial</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowCandidateModal(true)}
                                className="hidden md:flex bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors items-center gap-2 border border-green-200"
                            >
                                <UserPlus className="w-4 h-4" /> Enviar Candidato
                            </button>
                            <button 
                                onClick={() => setShowIncidentModal(true)}
                                className="hidden md:flex bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors items-center gap-2 border border-red-200"
                            >
                                <AlertTriangle className="w-4 h-4" /> Reportar Incidencia
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                            <WifiOff className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                        <button 
                            onClick={() => setActiveTab('tasks')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'tasks' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <ClipboardList className="w-4 h-4" /> Mis Tareas
                            {myTasks.filter(t => t.status !== 'Completada').length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'tasks' ? 'bg-white text-rentia-black' : 'bg-gray-200 text-gray-600'}`}>
                                    {myTasks.filter(t => t.status !== 'Completada').length}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('rooms')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'rooms' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Home className="w-4 h-4" /> Catálogo
                        </button>
                    </div>
                </header>

                {/* --- TAB: TAREAS --- */}
                {activeTab === 'tasks' && (
                    <div>
                        
                        {/* KANBAN MÓVIL (Scroll Horizontal) */}
                        <div className="md:hidden flex gap-4 overflow-x-auto pb-20 -mx-4 px-4 no-scrollbar snap-x snap-mandatory">
                            {['Pendiente', 'En Curso', 'Completada', 'Bloqueada'].map((status) => (
                                <div key={status} className="flex flex-col w-[85vw] sm:w-[320px] flex-shrink-0 snap-start bg-gray-100 p-3 rounded-xl">
                                    <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${
                                        status === 'Pendiente' ? 'border-orange-200' :
                                        status === 'En Curso' ? 'border-blue-200' :
                                        status === 'Completada' ? 'border-green-200' : 'border-red-200'
                                    }`}>
                                        <h3 className="font-bold text-gray-700 text-sm uppercase">{status}</h3>
                                        <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border">{tasksByStatus[status]?.length || 0}</span>
                                    </div>
                                    <div className="space-y-3 flex-grow">
                                        {tasksByStatus[status]?.map(task => (
                                            <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                                        ))}
                                        {tasksByStatus[status]?.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                                                Sin tareas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* VISTA DESKTOP (KANBAN COMPLETO) */}
                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {['Pendiente', 'En Curso', 'Bloqueada', 'Completada'].map((status) => (
                                <div key={status} className="flex flex-col h-full min-w-[280px]">
                                    <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${status === 'Pendiente' ? 'border-orange-200' : status === 'En Curso' ? 'border-blue-200' : status === 'Completada' ? 'border-green-200' : 'border-red-200'}`}>
                                        <h3 className="font-bold text-gray-700 text-sm uppercase">{status}</h3>
                                        <span className="text-xs font-bold text-gray-400">{tasksByStatus[status]?.length || 0}</span>
                                    </div>
                                    <div className="space-y-3 flex-grow">
                                        {tasksByStatus[status]?.map(task => (
                                            <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                                        ))}
                                        {tasksByStatus[status]?.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-xs">
                                                Sin tareas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TAB: PROPERTIES (PRESENTACIÓN) --- */}
                {activeTab === 'rooms' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 pb-20">
                        <div className="mb-6 relative">
                            <input 
                                type="text" 
                                placeholder="Buscar propiedad (calle o ciudad)..." 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue shadow-sm text-sm"
                                value={roomSearch}
                                onChange={(e) => setRoomSearch(e.target.value)}
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProperties.map((prop) => {
                                const availCount = prop.rooms.filter(r => r.status === 'available').length;
                                return (
                                    <div 
                                        key={prop.id} 
                                        onClick={() => setSelectedProperty(prop)}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                                    >
                                        <div className="h-48 bg-gray-200 relative">
                                            {prop.image ? (
                                                <img src={prop.image} alt={prop.address} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Home className="w-12 h-12 opacity-30" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 text-white">
                                                <h3 className="font-bold text-lg leading-tight">{prop.address}</h3>
                                                <p className="text-xs opacity-90">{prop.city}</p>
                                            </div>
                                            {availCount > 0 && (
                                                <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> {availCount} Libres
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex justify-between items-center">
                                            <div className="text-xs text-gray-500 font-medium">
                                                {prop.rooms.length} Habitaciones Total
                                            </div>
                                            <button className="text-xs font-bold text-rentia-blue bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-rentia-blue group-hover:text-white transition-colors">
                                                Ver Ficha
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {filteredProperties.length === 0 && (
                            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <Home className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No se encontraron propiedades.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- MODAL PRESENTACIÓN (FICHA TÉCNICA) --- */}
                {selectedProperty && (
                    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
                        {/* Header Modal */}
                        <div className="bg-white border-b border-gray-100 p-4 shadow-sm flex justify-between items-center z-10 sticky top-0">
                            <div>
                                <h2 className="font-bold text-lg text-gray-900 leading-tight">{selectedProperty.address}</h2>
                                <p className="text-xs text-gray-500">{selectedProperty.city} • {selectedProperty.rooms.length} Habitaciones</p>
                            </div>
                            <div className="flex gap-2">
                                <a 
                                    href={selectedProperty.googleMapsLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                                >
                                    <MapPin className="w-5 h-5" />
                                </a>
                                <button 
                                    onClick={() => setSelectedProperty(null)}
                                    className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-grow overflow-y-auto p-4 md:p-8 bg-gray-50">
                            <div className="max-w-4xl mx-auto space-y-6">
                                
                                {/* Room Cards Loop */}
                                {selectedProperty.rooms.map((room) => {
                                    const isAvailable = room.status === 'available';
                                    const isReno = room.specialStatus === 'renovation';
                                    
                                    return (
                                        <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-sm font-bold bg-gray-200 px-2 py-1 rounded text-gray-700">{room.name}</span>
                                                    {isAvailable ? (
                                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 uppercase">Disponible</span>
                                                    ) : isReno ? (
                                                        <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200 uppercase">En Obras</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-red-50 text-red-400 px-2 py-0.5 rounded border border-red-100 uppercase">Ocupada</span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="block font-bold text-lg text-rentia-blue">{room.price} €</span>
                                                </div>
                                            </div>

                                            {/* Room Details */}
                                            <div className="p-5">
                                                
                                                {/* Image Gallery Row */}
                                                {room.images && room.images.length > 0 ? (
                                                    <div className="flex gap-3 overflow-x-auto pb-4 mb-4 no-scrollbar snap-x">
                                                        {room.images.map((img, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                onClick={() => openImages(room.images!, idx)}
                                                                className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden cursor-zoom-in border border-gray-100 snap-start relative group"
                                                            >
                                                                <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={`Room ${room.name}`} />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="h-24 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs mb-4">
                                                        <ImageIcon className="w-5 h-5 mr-2 opacity-50" /> Sin fotos disponibles
                                                    </div>
                                                )}

                                                {/* Description & Features */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="md:col-span-2">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Descripción</h4>
                                                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                                            {room.description || "Habitación completamente equipada ideal para estudiantes o trabajadores. Consultar disponibilidad exacta."}
                                                        </p>
                                                        {room.availableFrom && (
                                                            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                                <Calendar className="w-3 h-3" /> Disponible: {room.availableFrom}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Equipamiento</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                                                <Layout className="w-3 h-3 text-gray-400" /> {room.sqm ? `${room.sqm} m²` : 'Estándar'}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-700">
                                                                <Bed className="w-3 h-3 text-gray-400" /> 
                                                                {room.bedType === 'double' ? 'Cama Doble' : room.bedType === 'king' ? 'Cama King' : 'Cama Individual'}
                                                            </div>
                                                            {room.features?.map(f => (
                                                                <div key={f} className="flex items-center gap-2 text-xs text-gray-700">
                                                                    {getFeatureIcon(f)} 
                                                                    {f === 'balcony' ? 'Balcón Privado' : f === 'smart_tv' ? 'Smart TV' : f === 'lock' ? 'Cerradura' : 'Escritorio'}
                                                                </div>
                                                            ))}
                                                            {room.hasAirConditioning && (
                                                                <div className="flex items-center gap-2 text-xs text-gray-700">
                                                                    <WifiOff className="w-3 h-3 text-blue-400 rotate-45" /> Aire Acond.
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <button 
                                                            className="w-full mt-4 bg-rentia-black text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                                                            onClick={() => {
                                                                const text = `Hola, te paso info de la habitación ${room.name} en ${selectedProperty.address}. Precio: ${room.price}€.\nFotos: ${room.images?.[0] || ''}`;
                                                                navigator.clipboard.writeText(text);
                                                                alert("Info copiada al portapapeles");
                                                            }}
                                                        >
                                                            <ClipboardList className="w-3 h-3" /> Copiar para Cliente
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- FLOATING ACTION BUTTONS (MOBILE) --- */}
                <div className="md:hidden fixed bottom-6 right-6 flex flex-col gap-3 z-40">
                    <button 
                        onClick={() => setShowCandidateModal(true)}
                        className="w-14 h-14 bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <UserPlus className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => setShowIncidentModal(true)}
                        className="w-14 h-14 bg-red-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <AlertTriangle className="w-6 h-6" />
                    </button>
                </div>

                {/* --- MODAL INCIDENCIA (FULL SCREEN MOBILE) --- */}
                {showIncidentModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white w-full sm:w-full sm:max-w-md h-[85vh] sm:h-auto sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
                            <form onSubmit={handleSaveIncident} className="flex flex-col h-full">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Nueva Incidencia</h3>
                                    <button type="button" onClick={() => setShowIncidentModal(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X className="w-5 h-5 text-gray-600"/></button>
                                </div>
                                <div className="p-6 space-y-5 overflow-y-auto flex-grow">
                                    {/* Form Fields... */}
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
                                    <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-base hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"><Save className="w-5 h-5" /> Guardar Reporte</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                
                {/* --- NEW: MODAL CANDIDATO --- */}
                {showCandidateModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <form onSubmit={handleSendCandidate} className="bg-white w-full sm:w-full sm:max-w-md h-[85vh] sm:h-auto sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" /> Enviar Candidato</h3>
                                <button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X className="w-5 h-5 text-gray-600"/></button>
                            </div>
                            <div className="p-6 space-y-5 overflow-y-auto flex-grow">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad *</label>
                                    <select required className="w-full p-3 border rounded-xl text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({...newCandidate, propertyId: e.target.value, roomId: ''})}>
                                        <option value="">Seleccionar Piso...</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                    </select>
                                </div>
                                {newCandidate.propertyId && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Habitación *</label>
                                        <select required className="w-full p-3 border rounded-xl text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({...newCandidate, roomId: e.target.value})}>
                                            <option value="">Seleccionar Habitación...</option>
                                            {properties.find(p => p.id === newCandidate.propertyId)?.rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Candidato *</label>
                                    <input required type="text" className="w-full p-3 border rounded-xl text-sm font-bold" value={newCandidate.candidateName} onChange={e => setNewCandidate({...newCandidate, candidateName: e.target.value})} placeholder="Ej: Ana García" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Info Adicional</label>
                                    <textarea className="w-full p-3 border rounded-xl text-sm h-24 resize-none" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({...newCandidate, additionalInfo: e.target.value})} placeholder="Ej: Estudiante de máster, viene recomendado..." />
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
                                <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-base hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg"><Send className="w-5 h-5"/> Enviar a Oficina</button>
                            </div>
                        </form>
                    </div>
                )}


                {/* --- LIGHTBOX (GLOBAL) --- */}
                {isLightboxOpen && (
                    <ImageLightbox 
                        images={lightboxImages} 
                        selectedIndex={lightboxIndex} 
                        onClose={() => setIsLightboxOpen(false)} 
                    />
                )}

            </div>
        </div>
    );
};