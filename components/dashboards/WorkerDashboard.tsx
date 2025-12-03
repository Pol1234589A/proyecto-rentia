
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskStatus } from '../../types';
import { Property } from '../../data/rooms';
import { ClipboardList, Home, CheckCircle, Clock, AlertCircle, MapPin, Search, Calendar, Wrench, Plus, X, AlertTriangle, Save, ChevronRight, Filter, Loader2 } from 'lucide-react';

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
        
        <h4 className="font-bold text-gray-800 text-sm mb-2 leading-snug">{task.title}</h4>
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
    const [mobileTaskFilter, setMobileTaskFilter] = useState<string>('Pendiente');
    
    // Identity State (Nombre verificado para cruzar con tareas)
    const [workerName, setWorkerName] = useState<string>('');
    
    // Data State
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & UI State
    const [roomSearch, setRoomSearch] = useState('');
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    
    // Incident Form State
    const [newIncident, setNewIncident] = useState({
        propertyId: '',
        roomId: 'common', 
        title: '',
        description: '',
        priority: 'Media' as 'Alta' | 'Media' | 'Baja'
    });

    // 1. Identificación Robusta del Trabajador
    useEffect(() => {
        const resolveWorkerIdentity = async () => {
            if (!currentUser) return;
            
            // Intentar obtener el nombre del perfil de Auth
            let resolvedName = currentUser.displayName;

            // Si no está en Auth, consultar Firestore (base de datos de verdad)
            if (!resolvedName) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        resolvedName = userDoc.data().displayName;
                    }
                } catch (e) {
                    console.error("Error fetching worker profile", e);
                }
            }

            // Normalización para Ayoub: Si el nombre contiene "Ayoub", forzar "Ayoub"
            // Esto asegura que si el admin asigna tareas a "Ayoub" pero el perfil es "Ayoub Amrani", funcione igual.
            if (resolvedName && resolvedName.toLowerCase().includes('ayoub')) {
                resolvedName = 'Ayoub';
            }

            setWorkerName(resolvedName || 'Ayoub'); // Fallback final
        };

        resolveWorkerIdentity();
    }, [currentUser]);

    // 2. Cargar Datos (Solo cuando tenemos la identidad confirmada)
    useEffect(() => {
        if (!workerName) return;

        setLoading(true);

        // Escuchar Tareas asignadas EXACTAMENTE a este nombre
        const qTasks = query(
            collection(db, "tasks"), 
            where("assignee", "==", workerName) 
        );

        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
            const tasksList: Task[] = [];
            snapshot.forEach((doc) => {
                tasksList.push({ ...doc.data(), id: doc.id } as Task);
            });
            tasksList.sort((a, b) => {
                if(!a.dueDate) return 1;
                if(!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
            setMyTasks(tasksList);
        });

        // Escuchar Propiedades
        const unsubProps = onSnapshot(collection(db, "properties"), (snapshot) => {
            const propsList: Property[] = [];
            snapshot.forEach((doc) => {
                propsList.push({ ...doc.data(), id: doc.id } as Property);
            });
            propsList.sort((a,b) => a.address.localeCompare(b.address));
            setProperties(propsList);
            setLoading(false);
        });

        return () => { unsubTasks(); unsubProps(); };
    }, [workerName]);

    // --- LOGIC: TASKS ---
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, Task[]> = {
            'Pendiente': [],
            'En Curso': [],
            'Bloqueada': [],
            'Completada': []
        };
        myTasks.forEach(task => {
            const status = task.status || 'Pendiente';
            if (grouped[status]) {
                grouped[status].push(task);
            } else {
                grouped['Pendiente'].push(task);
            }
        });
        return grouped;
    }, [myTasks]);

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        try {
            await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
        } catch (e) {
            console.error("Error updating task", e);
            alert("No se pudo actualizar el estado.");
        }
    };

    const handleSaveIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIncident.propertyId || !newIncident.title) {
            alert("Selecciona una propiedad y escribe un título.");
            return;
        }

        try {
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

            await addDoc(collection(db, "tasks"), {
                title: taskTitle,
                description: fullDescription,
                assignee: workerName, 
                priority: newIncident.priority,
                status: 'Pendiente',
                category: 'Mantenimiento', 
                createdAt: serverTimestamp(),
                dueDate: new Date().toISOString() 
            });

            setShowIncidentModal(false);
            setNewIncident({ propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' });
            alert("Incidencia reportada correctamente.");

        } catch (error) {
            console.error("Error creating incident:", error);
            alert("Error al guardar la incidencia.");
        }
    };

    // --- LOGIC: ROOMS ---
    const availableRooms = useMemo(() => {
        let rooms: any[] = [];
        properties.forEach(prop => {
            if (!prop.rooms) return;
            prop.rooms.forEach(room => {
                if (room.status === 'available' || room.specialStatus === 'renovation') {
                    const searchContent = `${prop.address} ${room.name} ${prop.city}`.toLowerCase();
                    if (searchContent.includes(roomSearch.toLowerCase())) {
                        rooms.push({
                            ...room,
                            propertyAddress: prop.address,
                            propertyCity: prop.city,
                            propertyId: prop.id
                        });
                    }
                }
            });
        });
        return rooms;
    }, [properties, roomSearch]);

    if (!workerName) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-6 animate-in fade-in">
            <div className="max-w-6xl mx-auto p-4 md:p-6">
                
                {/* HEADER MÓVIL OPTIMIZADO */}
                <header className="mb-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-rentia-black font-display flex items-center gap-2">
                                Hola, {workerName} <span className="text-xl">🛠️</span>
                            </h1>
                            <p className="text-gray-500 text-xs mt-0.5">Técnico y Comercial</p>
                        </div>
                        <button 
                            onClick={() => setShowIncidentModal(true)}
                            className="hidden md:flex bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors items-center gap-2 border border-red-200"
                        >
                            <AlertTriangle className="w-4 h-4" /> Reportar Incidencia
                        </button>
                    </div>

                    {/* Tabs Principales Estilo iOS Segmented Control */}
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
                    <div className="space-y-4">
                        
                        {/* FILTRO ESTADOS MÓVIL (Scroll Horizontal) */}
                        <div className="flex md:hidden overflow-x-auto pb-2 gap-2 no-scrollbar -mx-4 px-4">
                            {['Pendiente', 'En Curso', 'Completada', 'Bloqueada'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setMobileTaskFilter(status)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                                        mobileTaskFilter === status 
                                        ? (status === 'Pendiente' ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                                           status === 'En Curso' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                           status === 'Completada' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200')
                                        : 'bg-white text-gray-500 border-gray-200'
                                    }`}
                                >
                                    {status} ({tasksByStatus[status]?.length || 0})
                                </button>
                            ))}
                        </div>

                        {/* VISTA MÓVIL (LISTA FILTRADA) */}
                        <div className="md:hidden space-y-3 pb-20">
                            {tasksByStatus[mobileTaskFilter]?.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center opacity-50">
                                    <ClipboardList className="w-12 h-12 mb-3 text-gray-300" />
                                    <p className="text-sm font-medium text-gray-400">No hay tareas en "{mobileTaskFilter}"</p>
                                </div>
                            ) : (
                                tasksByStatus[mobileTaskFilter]?.map(task => (
                                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                                ))
                            )}
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

                {/* --- TAB: ROOMS (CATÁLOGO) --- */}
                {activeTab === 'rooms' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 pb-20">
                        <div className="mb-4 relative">
                            <input 
                                type="text" 
                                placeholder="Buscar habitación, calle..." 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue shadow-sm text-sm"
                                value={roomSearch}
                                onChange={(e) => setRoomSearch(e.target.value)}
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableRooms.map((room, idx) => (
                                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-row sm:flex-col h-32 sm:h-auto">
                                    <div className="w-32 sm:w-full sm:h-40 bg-gray-200 relative shrink-0">
                                        {room.images && room.images.length > 0 ? (
                                            <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Home className="w-8 h-8 opacity-50" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 sm:right-2 sm:left-auto">
                                            {room.status === 'available' ? (
                                                <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> LIBRE
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> OBRA
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 flex flex-col justify-between flex-grow min-w-0">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm mb-0.5 flex justify-between items-center truncate">
                                                {room.name}
                                                <span className="text-rentia-blue">{room.price} €</span>
                                            </h4>
                                            <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate mb-2">
                                                <MapPin className="w-3 h-3 shrink-0" /> {room.propertyAddress}
                                            </p>
                                        </div>

                                        <button 
                                            className="w-full text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 active:scale-95"
                                            onClick={() => {
                                                const text = `Hola, te paso info de la habitación ${room.name} en ${room.propertyAddress}. Precio: ${room.price}€.`;
                                                navigator.clipboard.writeText(text);
                                                alert("Info copiada.");
                                            }}
                                        >
                                            <ClipboardList className="w-3 h-3" /> Copiar Info
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {availableRooms.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                    <Home className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>No se encontraron habitaciones.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- FLOATING ACTION BUTTON (MOBILE INCIDENT) --- */}
                <button 
                    onClick={() => setShowIncidentModal(true)}
                    className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 active:scale-90 transition-transform"
                >
                    <AlertTriangle className="w-6 h-6" />
                </button>

                {/* --- MODAL INCIDENCIA (FULL SCREEN MOBILE) --- */}
                {showIncidentModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white w-full sm:w-full sm:max-w-md h-[85vh] sm:h-auto sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" /> Nueva Incidencia
                                </h3>
                                <button onClick={() => setShowIncidentModal(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"><X className="w-5 h-5 text-gray-600"/></button>
                            </div>
                            
                            <form onSubmit={handleSaveIncident} className="p-6 space-y-5 overflow-y-auto flex-grow">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad</label>
                                    <select 
                                        className="w-full p-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                                        value={newIncident.propertyId}
                                        onChange={(e) => setNewIncident({...newIncident, propertyId: e.target.value, roomId: 'common'})}
                                        required
                                    >
                                        <option value="">Seleccionar Piso...</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.address}</option>
                                        ))}
                                    </select>
                                </div>

                                {newIncident.propertyId && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ubicación</label>
                                        <select 
                                            className="w-full p-3 border rounded-xl text-sm bg-white"
                                            value={newIncident.roomId}
                                            onChange={(e) => setNewIncident({...newIncident, roomId: e.target.value})}
                                        >
                                            <option value="common">Zonas Comunes (Cocina, Baño...)</option>
                                            {properties.find(p => p.id === newIncident.propertyId)?.rooms.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qué ocurre</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 border rounded-xl text-sm font-bold" 
                                        placeholder="Ej: Fuga de agua en lavabo"
                                        value={newIncident.title}
                                        onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Detalles</label>
                                    <textarea 
                                        className="w-full p-3 border rounded-xl text-sm h-32 resize-none"
                                        placeholder="Descripción detallada del problema..."
                                        value={newIncident.description}
                                        onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prioridad</label>
                                    <div className="flex gap-2">
                                        {['Baja', 'Media', 'Alta'].map(p => (
                                            <button 
                                                key={p}
                                                type="button"
                                                onClick={() => setNewIncident({...newIncident, priority: p as any})}
                                                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all border ${newIncident.priority === p ? (p === 'Alta' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-rentia-black text-white border-rentia-black shadow-md') : 'bg-white text-gray-500 border-gray-200'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </form>
                            
                            <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
                                <button 
                                    onClick={handleSaveIncident} 
                                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-base hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
                                >
                                    <Save className="w-5 h-5" /> Guardar Reporte
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};