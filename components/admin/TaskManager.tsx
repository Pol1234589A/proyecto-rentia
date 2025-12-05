
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { StaffMember, Task, TaskPriority, TaskStatus, TaskCategory, TaskBoard } from '../../types';
import { Plus, Calendar, AlertTriangle, CheckCircle, Trash2, Edit2, X, Filter, List, Kanban, Save, Loader2, Wifi, WifiOff, Layout, FolderPlus, Folder, LayoutTemplate, Menu, Search, Clock, ChevronDown, Sparkles, Trophy, Play } from 'lucide-react';

const STAFF_MEMBERS: StaffMember[] = ['Pol', 'Sandra', 'Víctor', 'Ayoub', 'Hugo', 'Colaboradores'];
const PRIORITIES: TaskPriority[] = ['Alta', 'Media', 'Baja'];
const STATUSES: TaskStatus[] = ['Pendiente', 'En Curso', 'Completada', 'Bloqueada'];
const CATEGORIES: TaskCategory[] = ['Gestión', 'Marketing', 'Legal', 'Operaciones', 'Reformas', 'Contabilidad', 'Mantenimiento'];

// Mensajes de celebración aleatorios
const CELEBRATION_MESSAGES = [
    "¡Excelente trabajo! 🚀",
    "¡Una tarea menos! Sigue así 💪",
    "¡Imparable! Gran esfuerzo 🌟",
    "Tarea completada con éxito ✨",
    "¡Fantástico! A por la siguiente 🔥",
    "¡Productividad al máximo! 🚀"
];

const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
        case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
        case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Baja': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100';
    }
};

const getCardStyles = (task: Task) => {
    if (task.status === 'Completada') return 'border border-gray-200 opacity-50 bg-gray-50';

    switch (task.priority) {
        case 'Alta':
            return 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] z-10';
        case 'Media':
            return 'border-l-4 border-l-yellow-400 border-y border-r border-gray-200 hover:-translate-y-0.5 transition-transform duration-75 ease-linear';
        case 'Baja':
            return 'border border-green-100 opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 transition-all duration-700 ease-in-out hover:shadow-sm';
        default:
            return 'border border-gray-200 hover:-translate-y-1 transition-all duration-300';
    }
};

const TaskTimer: React.FC<{ dateStr: string }> = ({ dateStr }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const target = new Date(dateStr);
            target.setHours(23, 59, 59, 999);

            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('Exp');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
                setIsUrgent(days < 2);
            } else {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                setIsUrgent(true);
            }
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    }, [dateStr]);

    if (!timeLeft) return null;

    return (
        <span className={`ml-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
            isExpired ? 'bg-red-100 text-red-700 border border-red-200' :
            isUrgent ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
            'bg-gray-100 text-gray-500 border border-gray-200'
        }`}>
            <Clock className="w-2 h-2" />
            {timeLeft}
        </span>
    );
};

// Componente de Tarjeta para vista Kanban
const KanbanCard: React.FC<{ task: Task, onEdit: (t: Task) => void, onDelete: (id: string) => Promise<void> | void, onStatusChange: (id: string, s: TaskStatus) => void }> = ({ task, onEdit, onDelete, onStatusChange }) => (
    <div className={`bg-white p-4 rounded-lg shadow-sm group relative flex flex-col gap-2 ${getCardStyles(task)}`}>
        <div className="flex justify-between items-start">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                {task.priority}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(task)} className="p-1 hover:bg-gray-100 rounded text-blue-600"><Edit2 className="w-3 h-3"/></button>
                <button onClick={() => onDelete(task.id)} className="p-1 hover:bg-gray-100 rounded text-red-600"><Trash2 className="w-3 h-3"/></button>
            </div>
        </div>
        
        <div>
            <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{task.title}</h4>
            <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-2">
            {task.status === 'Pendiente' && (
                <button 
                    onClick={() => onStatusChange(task.id, 'En Curso')}
                    className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                >
                    <Play className="w-3 h-3" /> Empezar
                </button>
            )}
            {task.status === 'En Curso' && (
                <button 
                    onClick={() => onStatusChange(task.id, 'Completada')}
                    className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                >
                    <CheckCircle className="w-3 h-3" /> Completar
                </button>
            )}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rentia-blue text-white flex items-center justify-center font-bold text-[10px]" title={task.assignee}>
                    {task.assignee.charAt(0)}
                </div>
                <span>{task.assignee}</span>
            </div>
            {task.dueDate && (
                <div className={`flex items-center ${new Date(task.dueDate) < new Date() && task.status !== 'Completada' ? 'text-red-500 font-bold' : ''}`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(task.dueDate).toLocaleDateString()}
                    {task.status !== 'Completada' && <TaskTimer dateStr={task.dueDate} />}
                </div>
            )}
        </div>
    </div>
);

// Componente de Tarjeta para vista Lista Móvil
const MobileListCard: React.FC<{ task: Task, onEdit: (t: Task) => void, onDelete: (id: string) => Promise<void> | void, onStatusChange: (id: string, s: TaskStatus) => void }> = ({ task, onEdit, onDelete, onStatusChange }) => (
    <div className={`p-4 bg-white rounded-lg shadow-sm border border-gray-200 ${task.status === 'Completada' ? 'opacity-70 bg-gray-50' : ''}`}>
        <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-900 text-sm leading-snug pr-2">{task.title}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                {task.priority}
            </span>
        </div>
        
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-rentia-blue text-white flex items-center justify-center font-bold text-[10px]">
                        {task.assignee.charAt(0)}
                    </div>
                    {task.assignee}
                </span>
                <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{task.status || 'Pendiente'}</span>
            </div>
            
            {task.dueDate && (
                <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 
                    {new Date(task.dueDate).toLocaleDateString()}
                </div>
            )}
        </div>
        
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
             <div className="flex gap-2">
                {task.status === 'Pendiente' && (
                    <button onClick={() => onStatusChange(task.id, 'En Curso')} className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-bold border border-blue-100 flex items-center gap-1"><Play className="w-3 h-3"/> Empezar</button>
                )}
                {task.status === 'En Curso' && (
                    <button onClick={() => onStatusChange(task.id, 'Completada')} className="bg-green-50 text-green-700 px-3 py-1 rounded text-xs font-bold border border-green-100 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Completar</button>
                )}
             </div>

            <div className="flex gap-3">
                <button onClick={() => onEdit(task)} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                    <Edit2 className="w-3 h-3"/> Editar
                </button>
                <button onClick={() => onDelete(task.id)} className="text-red-600 text-xs font-bold flex items-center gap-1 hover:underline">
                    <Trash2 className="w-3 h-3"/> Borrar
                </button>
            </div>
        </div>
    </div>
);

export const TaskManager: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [boards, setBoards] = useState<TaskBoard[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showBoardModal, setShowBoardModal] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAssignee, setFilterAssignee] = useState<StaffMember | 'All'>('All');
    const [filterPriority, setFilterPriority] = useState<TaskPriority | 'All'>('All');

    // Estado para celebración
    const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

    const [taskFormData, setTaskFormData] = useState<Partial<Task>>({
        title: '', description: '', assignee: 'Pol', priority: 'Media', status: 'Pendiente', category: 'Gestión', dueDate: ''
    });

    const [boardFormData, setBoardFormData] = useState({ title: '', group: 'General' });

    useEffect(() => {
        let isMounted = true;
        setConnectionError(null);

        const qBoards = query(collection(db, "task_boards"), orderBy("createdAt", "asc"));
        const unsubBoards = onSnapshot(qBoards, (snapshot) => {
            if (!isMounted) return;
            const loadedBoards: TaskBoard[] = [];
            snapshot.forEach((doc) => {
                loadedBoards.push({ ...doc.data(), id: doc.id } as TaskBoard);
            });
            setBoards(loadedBoards);
            if (loadedBoards.length > 0 && !selectedBoardId) {
                setSelectedBoardId(loadedBoards[0].id);
            }
        });

        const qTasks = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
            if (!isMounted) return;
            const loadedTasks: Task[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loadedTasks.push({ 
                    ...data, 
                    id: doc.id,
                    status: data.status || 'Pendiente' 
                } as Task);
            });
            setTasks(loadedTasks);
            setConnectionError(null);
        }, (error) => {
            if (!isMounted) return;
            console.error("Firebase Tasks Error:", error.code);
            setConnectionError("Error de conexión");
        });

        return () => { isMounted = false; unsubBoards(); unsubTasks(); };
    }, []); 

    useEffect(() => {
        if (!selectedBoardId && boards.length > 0) {
            setSelectedBoardId(boards[0].id);
        }
    }, [boards, selectedBoardId]);

    const filteredTasks = tasks.filter(t => {
        const effectiveBoardId = selectedBoardId || (boards.length > 0 ? boards[0].id : 'default');
        const taskBoardId = t.boardId || (boards.length > 0 ? boards[0].id : 'default');
        
        if (taskBoardId !== effectiveBoardId) return false;

        const term = searchTerm.toLowerCase();
        const matchesSearch = (t.title || '').toLowerCase().includes(term) || 
                              (t.description || '').toLowerCase().includes(term) ||
                              (t.assignee || '').toLowerCase().includes(term);
        
        if (!matchesSearch) return false;
        if (filterAssignee !== 'All' && t.assignee !== filterAssignee) return false;
        if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
        
        return true;
    });

    const stats = {
        total: filteredTasks.length,
        urgent: filteredTasks.filter(t => t.priority === 'Alta' && t.status !== 'Completada').length,
        pending: filteredTasks.filter(t => (t.status || 'Pendiente') === 'Pendiente').length,
        completed: filteredTasks.filter(t => t.status === 'Completada').length
    };

    const groupedBoards = React.useMemo(() => {
        const groups: Record<string, TaskBoard[]> = {};
        boards.forEach(b => {
            const g = b.group || 'General';
            if (!groups[g]) groups[g] = [];
            groups[g].push(b);
        });
        return groups;
    }, [boards]);

    const handleSaveBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "task_boards"), {
                title: boardFormData.title,
                group: boardFormData.group,
                createdAt: serverTimestamp()
            });
            setShowBoardModal(false);
            setBoardFormData({ title: '', group: 'General' });
        } catch (error: any) {
            alert(`Error al crear tablero: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBoard = async (boardId: string) => {
        if (!confirm("¿Eliminar este tablero?")) return;
        try {
            await deleteDoc(doc(db, "task_boards", boardId));
            if (selectedBoardId === boardId) setSelectedBoardId(null);
        } catch (e: any) {
            alert(`Error al eliminar: ${e.message}`);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const firestorePayload = {
                ...taskFormData,
                boardId: selectedBoardId,
                updatedAt: serverTimestamp()
            };
            if (isEditing) {
                await updateDoc(doc(db, "tasks", isEditing), firestorePayload);
            } else {
                await addDoc(collection(db, "tasks"), {
                    ...firestorePayload,
                    createdAt: serverTimestamp()
                });
            }
            setShowTaskModal(false);
            
            // Disparar celebración si se completó
            if (taskFormData.status === 'Completada') {
                triggerCelebration();
            }

            resetTaskForm();
        } catch (error: any) {
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm("¿Eliminar tarea definitivamente?")) return;
        await deleteDoc(doc(db, "tasks", id));
    };

    const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
        try {
            await updateDoc(doc(db, "tasks", id), { status: newStatus });
            if (newStatus === 'Completada') {
                triggerCelebration();
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const triggerCelebration = () => {
        const randomMsg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
        setCelebrationMessage(randomMsg);
        setTimeout(() => setCelebrationMessage(null), 3500);
    };

    const openEditTask = (task: Task) => {
        setTaskFormData(task);
        setIsEditing(task.id);
        setShowTaskModal(true);
    };

    const resetTaskForm = () => {
        setTaskFormData({
            title: '', description: '', assignee: 'Pol', priority: 'Media', status: 'Pendiente', category: 'Gestión', dueDate: ''
        });
        setIsEditing(null);
    };

    return (
        <div className="bg-gray-50 h-full flex flex-col relative overflow-hidden">
            
            {/* CELEBRATION TOAST */}
            {celebrationMessage && createPortal(
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[10000] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-md">
                        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse fill-current" />
                        <span className="font-bold text-sm md:text-base tracking-wide text-shadow-sm">{celebrationMessage}</span>
                        <Trophy className="w-5 h-5 text-yellow-300" />
                    </div>
                </div>,
                document.body
            )}

            {showMobileSidebar && <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setShowMobileSidebar(false)} />}

            {/* Sidebar Tableros */}
            <div className={`w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full absolute md:relative z-30 transition-transform duration-300 shadow-xl md:shadow-none ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Layout className="w-5 h-5 text-rentia-blue" /> Tableros
                    </h3>
                    <div className="flex gap-1">
                        <button onClick={() => setShowBoardModal(true)} className="p-1.5 hover:bg-white rounded-md text-gray-500 hover:text-rentia-blue transition-colors border border-transparent hover:border-gray-200"><FolderPlus className="w-4 h-4" /></button>
                        <button onClick={() => setShowMobileSidebar(false)} className="md:hidden p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-3 space-y-4">
                    {Object.entries(groupedBoards).length === 0 && <div className="text-center py-4 text-xs text-gray-400">Crea un tablero para empezar.</div>}
                    {Object.entries(groupedBoards).map(([group, groupBoards]) => (
                        <div key={group}>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1"><Folder className="w-3 h-3" /> {group}</h4>
                            <div className="space-y-1">
                                {(groupBoards as TaskBoard[]).map(board => (
                                    <div key={board.id} onClick={() => { setSelectedBoardId(board.id); setShowMobileSidebar(false); }} className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer flex justify-between items-center group transition-colors ${selectedBoardId === board.id ? 'bg-blue-50 text-rentia-blue border border-blue-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
                                        <span className="truncate flex items-center gap-2"><LayoutTemplate className="w-3.5 h-3.5 opacity-70"/>{board.title}</span>
                                        {selectedBoardId === board.id && <button onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col h-full overflow-hidden w-full relative">
                <div className="bg-white border-b border-gray-200 p-4 md:p-6 shrink-0">
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button onClick={() => setShowMobileSidebar(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu className="w-6 h-6" /></button>
                            <div className="flex-1">
                                <h2 className="text-xl md:text-2xl font-bold text-rentia-black flex items-center gap-2 truncate">{boards.find(b => b.id === selectedBoardId)?.title || "Organizador de Tareas"}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs md:text-sm text-gray-500">{boards.find(b => b.id === selectedBoardId)?.group || "Vista General"}</p>
                                    {connectionError && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-yellow-200 animate-pulse"><Wifi className="w-3 h-3" /> {connectionError}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
                            <div className="flex gap-2">
                                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-gray-100 text-rentia-blue' : 'text-gray-400'}`}><Kanban className="w-5 h-5"/></button>
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-rentia-blue' : 'text-gray-400'}`}><List className="w-5 h-5"/></button>
                            </div>
                            <button onClick={() => { if (!selectedBoardId && boards.length === 0) { alert("Crea primero un tablero en la barra lateral."); setShowBoardModal(true); } else { resetTaskForm(); setShowTaskModal(true); } }} className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 shadow-md whitespace-nowrap"><Plus className="w-4 h-4" /> Nueva Tarea</button>
                        </div>
                    </div>

                    {/* Stats & Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-2 sm:pb-0">
                            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-2 whitespace-nowrap"><span className="text-base">{stats.total}</span> Tareas</div>
                            <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2 whitespace-nowrap"><AlertTriangle className="w-3 h-3" /> <span className="text-base">{stats.urgent}</span> Urgentes</div>
                            <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 flex items-center gap-2 whitespace-nowrap"><CheckCircle className="w-3 h-3" /> <span className="text-base">{stats.completed}</span> Fin</div>
                        </div>
                        <div className="flex gap-2 items-center w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                            <div className="relative"><input type="text" placeholder="Buscar tarea..." className="pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-rentia-blue w-32 sm:w-48 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" /></div>
                            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <select className="bg-white border border-gray-200 text-xs md:text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value as any)}><option value="All">Todos</option>{STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                            <select className="bg-white border border-gray-200 text-xs md:text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)}><option value="All">Prioridad</option>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                        </div>
                    </div>
                </div>

                <div className="flex-grow p-4 md:p-6 bg-gray-50 overflow-hidden flex flex-col">
                    {boards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400"><Layout className="w-16 h-16 mb-4 opacity-20" /><p className="mb-4">No tienes ningún tablero creado.</p><button onClick={() => setShowBoardModal(true)} className="bg-rentia-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Crear Primer Tablero</button></div>
                    ) : viewMode === 'kanban' ? (
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-full overflow-y-auto md:overflow-x-auto pb-20 md:pb-4 scroll-smooth">
                            {STATUSES.map(status => (
                                <div key={status} className="flex-shrink-0 w-full md:w-[300px] flex flex-col md:h-full bg-gray-100/50 rounded-xl p-2 border border-gray-200/50">
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">{status}</h3>
                                        <span className="bg-white text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">{filteredTasks.filter(t => (t.status || 'Pendiente') === status).length}</span>
                                    </div>
                                    <div className="space-y-3 md:flex-grow md:overflow-y-auto pr-1 custom-scrollbar pb-10 md:pb-0">
                                        {filteredTasks.filter(t => (t.status || 'Pendiente') === status).map(task => (<KanbanCard key={task.id} task={task} onEdit={openEditTask} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />))}
                                        {filteredTasks.filter(t => (t.status || 'Pendiente') === status).length === 0 && <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs bg-white/50">Vacío</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white md:rounded-xl md:shadow-sm md:border border-gray-200 overflow-hidden min-w-full overflow-x-auto mb-20 md:mb-0">
                            {/* Desktop Table */}
                            <table className="w-full text-left text-sm hidden md:table">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs"><tr><th className="p-4">Tarea</th><th className="p-4">Responsable</th><th className="p-4">Fecha Límite</th><th className="p-4">Prioridad</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTasks.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-900">{t.title}</td>
                                            <td className="p-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">{t.assignee.charAt(0)}</div>{t.assignee}</td>
                                            <td className="p-4 text-gray-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
                                            <td className="p-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityColor(t.priority)}`}>{t.priority}</span></td>
                                            <td className="p-4 text-gray-600 font-medium">{t.status || 'Pendiente'}</td>
                                            <td className="p-4 text-right flex items-center justify-end gap-3">
                                                {t.status === 'Pendiente' && (
                                                    <button onClick={() => handleStatusChange(t.id, 'En Curso')} className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors">Empezar</button>
                                                )}
                                                {t.status === 'En Curso' && (
                                                    <button onClick={() => handleStatusChange(t.id, 'Completada')} className="bg-green-50 text-green-700 px-3 py-1 rounded text-xs font-bold border border-green-100 hover:bg-green-100 transition-colors">Completar</button>
                                                )}
                                                <button onClick={() => openEditTask(t)} className="text-blue-600 hover:underline text-xs font-bold">Editar</button>
                                                <button onClick={() => handleDeleteTask(t.id)} className="text-red-600 hover:underline text-xs font-bold">Borrar</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTasks.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay tareas en esta vista.</td></tr>}
                                </tbody>
                            </table>

                            {/* Mobile List View (Cards Stack) */}
                            <div className="md:hidden flex flex-col gap-3 bg-gray-50 p-2">
                                {filteredTasks.map(t => (
                                    <MobileListCard key={t.id} task={t} onEdit={openEditTask} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
                                ))}
                                {filteredTasks.length === 0 && <div className="p-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">No hay tareas en esta vista.</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showBoardModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-gray-800">Nuevo Tablero</h3><button onClick={() => setShowBoardModal(false)}><X className="w-5 h-5 text-gray-400"/></button></div>
                        <form onSubmit={handleSaveBoard} className="p-6 space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Tablero</label><input required type="text" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" value={boardFormData.title} onChange={e => setBoardFormData({...boardFormData, title: e.target.value})} placeholder="Ej: Instagram Ads" /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grupo / Departamento</label><input required list="groups" type="text" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" value={boardFormData.group} onChange={e => setBoardFormData({...boardFormData, group: e.target.value})} placeholder="Ej: Marketing" /><datalist id="groups"><option value="General" /><option value="Marketing" /><option value="Operaciones" /><option value="Ventas" /><option value="Reformas" /></datalist></div><div className="flex justify-end pt-2"><button type="submit" disabled={loading} className="bg-rentia-black text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800 flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} Crear Tablero</button></div></form>
                    </div>
                </div>
            )}

            {showTaskModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 my-auto">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0"><h3 className="font-bold text-gray-800">{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</h3><button onClick={() => setShowTaskModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button></div>
                        <form onSubmit={handleSaveTask} className="flex flex-col overflow-hidden"><div className="p-6 space-y-4 overflow-y-auto custom-scrollbar"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label><input required type="text" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" value={taskFormData.title} onChange={e => setTaskFormData({...taskFormData, title: e.target.value})} placeholder="Ej: Renovar contrato de Juan..." /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responsable</label><select className="w-full p-2 border rounded-lg text-sm bg-white" value={taskFormData.assignee} onChange={e => setTaskFormData({...taskFormData, assignee: e.target.value as any})}>{STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label><select className="w-full p-2 border rounded-lg text-sm bg-white" value={taskFormData.category} onChange={e => setTaskFormData({...taskFormData, category: e.target.value as any})}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Límite</label><input type="date" className="w-full p-2 border rounded-lg text-sm" value={taskFormData.dueDate} onChange={e => setTaskFormData({...taskFormData, dueDate: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label><select className="w-full p-2 border rounded-lg text-sm bg-white" value={taskFormData.priority} onChange={e => setTaskFormData({...taskFormData, priority: e.target.value as any})}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label><div className="flex bg-gray-100 p-1 rounded-lg">{STATUSES.map(s => (<button key={s} type="button" onClick={() => setTaskFormData({...taskFormData, status: s})} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${taskFormData.status === s ? 'bg-white shadow text-rentia-blue' : 'text-gray-500'}`}>{s}</button>))}</div></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label><textarea className="w-full p-2 border rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-rentia-blue outline-none" value={taskFormData.description} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} placeholder="Detalles de la tarea..." /></div></div><div className="px-6 py-4 flex justify-end gap-2 border-t border-gray-100 bg-gray-50 shrink-0 rounded-b-xl"><button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded font-bold text-sm">Cancelar</button><button type="submit" disabled={loading} className="bg-rentia-black text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800 shadow-md flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Guardar Tarea</button></div></form>
                    </div>
                </div>
            )}
        </div>
    );
};
