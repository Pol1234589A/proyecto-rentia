
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { StaffMember, Task, TaskPriority, TaskStatus, TaskCategory, TaskBoard } from '../../types';
import { Plus, Calendar, AlertTriangle, CheckCircle, Trash2, Edit2, X, Filter, List, Kanban, Save, Loader2, Wifi, WifiOff, Layout, FolderPlus, Folder, LayoutTemplate, Menu } from 'lucide-react';

const STAFF_MEMBERS: StaffMember[] = ['Pol', 'Sandra', 'Víctor', 'Ayoub', 'Hugo', 'Colaboradores'];
const PRIORITIES: TaskPriority[] = ['Alta', 'Media', 'Baja'];
const STATUSES: TaskStatus[] = ['Pendiente', 'En Curso', 'Completada', 'Bloqueada'];
const CATEGORIES: TaskCategory[] = ['Gestión', 'Marketing', 'Legal', 'Operaciones', 'Reformas', 'Contabilidad'];

const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
        case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
        case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Baja': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100';
    }
};

const TaskCard: React.FC<{ task: Task, onEdit: (t: Task) => void, onDelete: (id: string) => Promise<void> | void }> = ({ task, onEdit, onDelete }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group relative flex flex-col gap-2 hover:-translate-y-1">
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

        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rentia-blue text-white flex items-center justify-center font-bold text-[10px]" title={task.assignee}>
                    {task.assignee.charAt(0)}
                </div>
                <span>{task.assignee}</span>
            </div>
            {task.dueDate && (
                <div className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'Completada' ? 'text-red-500 font-bold' : ''}`}>
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                </div>
            )}
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

    // Filters
    const [filterAssignee, setFilterAssignee] = useState<StaffMember | 'All'>('All');
    const [filterPriority, setFilterPriority] = useState<TaskPriority | 'All'>('All');

    // Forms State
    const [taskFormData, setTaskFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        assignee: 'Pol',
        priority: 'Media',
        status: 'Pendiente',
        category: 'Gestión',
        dueDate: ''
    });

    const [boardFormData, setBoardFormData] = useState({
        title: '',
        group: 'General'
    });

    // --- INITIALIZATION ---
    useEffect(() => {
        let isMounted = true;
        setConnectionError(null);

        // 1. Fetch Boards
        const qBoards = query(collection(db, "task_boards"), orderBy("createdAt", "asc"));
        const unsubBoards = onSnapshot(qBoards, (snapshot) => {
            if (!isMounted) return;
            const loadedBoards: TaskBoard[] = [];
            snapshot.forEach((doc) => {
                loadedBoards.push({ ...doc.data(), id: doc.id } as TaskBoard);
            });
            setBoards(loadedBoards);
            // Si no hay tablero seleccionado y hay tableros, seleccionar el primero
            if (loadedBoards.length > 0 && !selectedBoardId) {
                setSelectedBoardId(loadedBoards[0].id);
            }
        }, (error) => {
            console.error("Firebase Boards Error:", error.code);
            // Ignorar errores de permisos iniciales mientras carga Auth
        });

        // 2. Fetch Tasks
        const qTasks = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
            if (!isMounted) return;
            const loadedTasks: Task[] = [];
            snapshot.forEach((doc) => {
                loadedTasks.push({ ...doc.data(), id: doc.id } as Task);
            });
            setTasks(loadedTasks);
            setConnectionError(null);
        }, (error) => {
            if (!isMounted) return;
            console.error("Firebase Tasks Error:", error.code);
            if (error.code === 'permission-denied') {
                // Mensaje más amigable
                setConnectionError("Sincronizando permisos...");
                // Reintentar o esperar a que Auth se estabilice
            } else if (error.code === 'unavailable') {
                setConnectionError("Modo sin conexión activo.");
            } else {
                setConnectionError("Conectando...");
            }
        });

        return () => { 
            isMounted = false;
            unsubBoards(); 
            unsubTasks(); 
        };
    }, []); 

    // Effect para seleccionar tablero si solo hay uno o ninguno al inicio y boards cambia
    useEffect(() => {
        if (!selectedBoardId && boards.length > 0) {
            setSelectedBoardId(boards[0].id);
        }
    }, [boards, selectedBoardId]);

    // Derived Data
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            // Filtrar por tablero seleccionado
            // Si no tiene boardId, se considera del primer tablero o "General"
            const taskBoardId = t.boardId || (boards.length > 0 ? boards[0].id : 'default');
            const currentBoardId = selectedBoardId || (boards.length > 0 ? boards[0].id : 'default');
            
            if (taskBoardId !== currentBoardId) return false;

            if (filterAssignee !== 'All' && t.assignee !== filterAssignee) return false;
            if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
            return true;
        });
    }, [tasks, filterAssignee, filterPriority, selectedBoardId, boards]);

    const stats = useMemo(() => {
        return {
            total: filteredTasks.length,
            urgent: filteredTasks.filter(t => t.priority === 'Alta' && t.status !== 'Completada').length,
            pending: filteredTasks.filter(t => t.status === 'Pendiente').length,
            completed: filteredTasks.filter(t => t.status === 'Completada').length
        };
    }, [filteredTasks]);

    // Agrupar tableros
    const groupedBoards = useMemo(() => {
        const groups: Record<string, TaskBoard[]> = {};
        boards.forEach(b => {
            const g = b.group || 'General';
            if (!groups[g]) groups[g] = [];
            groups[g].push(b);
        });
        return groups;
    }, [boards]);

    // --- ACTIONS ---

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
            console.error("Error saving board:", error);
            alert(`Error al crear tablero: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBoard = async (boardId: string) => {
        if (!confirm("¿Eliminar este tablero? Las tareas asociadas no se borrarán pero dejarán de ser visibles aquí.")) return;
        try {
            await deleteDoc(doc(db, "task_boards", boardId));
            if (selectedBoardId === boardId) setSelectedBoardId(null);
        } catch (e: any) {
            alert(`Error al eliminar tablero: ${e.message}`);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const firestorePayload = {
                ...taskFormData,
                boardId: selectedBoardId, // Asignar al tablero actual
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
            resetTaskForm();
        } catch (error: any) {
            console.error("Error saving task:", error);
            alert(`Error al guardar en la nube: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm("¿Eliminar tarea definitivamente de la nube?")) return;
        try {
            await deleteDoc(doc(db, "tasks", id));
        } catch (error: any) {
            console.error("Error deleting task:", error);
            alert("Error al eliminar la tarea.");
        }
    };

    const openEditTask = (task: Task) => {
        setTaskFormData(task);
        setIsEditing(task.id);
        setShowTaskModal(true);
    };

    const resetTaskForm = () => {
        setTaskFormData({
            title: '',
            description: '',
            assignee: 'Pol',
            priority: 'Media',
            status: 'Pendiente',
            category: 'Gestión',
            dueDate: ''
        });
        setIsEditing(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen flex h-full relative overflow-hidden">
            
            {/* MOBILE OVERLAY */}
            {showMobileSidebar && (
                <div 
                    className="absolute inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setShowMobileSidebar(false)}
                />
            )}

            {/* SIDEBAR: Tableros y Grupos */}
            <div className={`
                w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full
                absolute md:relative z-30 transition-transform duration-300 shadow-xl md:shadow-none
                ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Layout className="w-5 h-5 text-rentia-blue" />
                        Tableros
                    </h3>
                    <div className="flex gap-1">
                        <button onClick={() => setShowBoardModal(true)} className="p-1.5 hover:bg-white rounded-md text-gray-500 hover:text-rentia-blue transition-colors border border-transparent hover:border-gray-200">
                            <FolderPlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowMobileSidebar(false)} className="md:hidden p-1.5 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-3 space-y-4">
                    {Object.entries(groupedBoards).length === 0 && (
                        <div className="text-center py-4 text-xs text-gray-400">
                            Crea un tablero para empezar.
                        </div>
                    )}

                    {Object.entries(groupedBoards).map(([group, groupBoards]) => (
                        <div key={group}>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
                                <Folder className="w-3 h-3" /> {group}
                            </h4>
                            <div className="space-y-1">
                                {(groupBoards as TaskBoard[]).map(board => (
                                    <div 
                                        key={board.id}
                                        onClick={() => { setSelectedBoardId(board.id); setShowMobileSidebar(false); }}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer flex justify-between items-center group transition-colors ${
                                            selectedBoardId === board.id 
                                            ? 'bg-blue-50 text-rentia-blue border border-blue-100' 
                                            : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                                        }`}
                                    >
                                        <span className="truncate flex items-center gap-2">
                                            <LayoutTemplate className="w-3.5 h-3.5 opacity-70"/>
                                            {board.title}
                                        </span>
                                        {selectedBoardId === board.id && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-grow flex flex-col h-full overflow-hidden w-full relative">
                
                {/* Header / Stats */}
                <div className="bg-white border-b border-gray-200 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => setShowMobileSidebar(true)}
                                className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <div className="flex-1">
                                <h2 className="text-xl md:text-2xl font-bold text-rentia-black flex items-center gap-2 truncate">
                                    {boards.find(b => b.id === selectedBoardId)?.title || "Organizador de Tareas"}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs md:text-sm text-gray-500">
                                        {boards.find(b => b.id === selectedBoardId)?.group || "Vista General"}
                                    </p>
                                    {connectionError && (
                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-yellow-200 animate-pulse">
                                            <Wifi className="w-3 h-3" /> {connectionError}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
                            <div className="flex gap-2">
                                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-gray-100 text-rentia-blue' : 'text-gray-400'}`}><Kanban className="w-5 h-5"/></button>
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-rentia-blue' : 'text-gray-400'}`}><List className="w-5 h-5"/></button>
                            </div>
                            <button 
                                onClick={() => { 
                                    if (!selectedBoardId && boards.length === 0) {
                                        alert("Crea primero un tablero en la barra lateral.");
                                        setShowBoardModal(true);
                                    } else {
                                        resetTaskForm(); 
                                        setShowTaskModal(true); 
                                    }
                                }} 
                                className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 shadow-md whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" /> Nueva Tarea
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-2 sm:pb-0">
                            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-2 whitespace-nowrap">
                                <span className="text-base">{stats.total}</span> Tareas
                            </div>
                            <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2 whitespace-nowrap">
                                <AlertTriangle className="w-3 h-3" /> <span className="text-base">{stats.urgent}</span> Urgentes
                            </div>
                            <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 flex items-center gap-2 whitespace-nowrap">
                                <CheckCircle className="w-3 h-3" /> <span className="text-base">{stats.completed}</span> Fin
                            </div>
                        </div>

                        <div className="flex gap-2 items-center w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <select 
                                className="bg-white border border-gray-200 text-xs md:text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none"
                                value={filterAssignee}
                                onChange={(e) => setFilterAssignee(e.target.value as any)}
                            >
                                <option value="All">Todos</option>
                                {STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select 
                                className="bg-white border border-gray-200 text-xs md:text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none"
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value as any)}
                            >
                                <option value="All">Prioridad</option>
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow p-4 md:p-6 bg-gray-50 overflow-hidden flex flex-col">
                    {boards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Layout className="w-16 h-16 mb-4 opacity-20" />
                            <p className="mb-4">No tienes ningún tablero creado.</p>
                            <button onClick={() => setShowBoardModal(true)} className="bg-rentia-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Crear Primer Tablero</button>
                        </div>
                    ) : viewMode === 'kanban' ? (
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-full overflow-y-auto md:overflow-x-auto pb-20 md:pb-4 scroll-smooth">
                            {STATUSES.map(status => (
                                <div key={status} className="flex-shrink-0 w-full md:w-[300px] flex flex-col md:h-full bg-gray-100/50 rounded-xl p-2 border border-gray-200/50">
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">{status}</h3>
                                        <span className="bg-white text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                                            {filteredTasks.filter(t => t.status === status).length}
                                        </span>
                                    </div>
                                    <div className="space-y-3 md:flex-grow md:overflow-y-auto pr-1 custom-scrollbar">
                                        {filteredTasks.filter(t => t.status === status).map(task => (
                                            <TaskCard key={task.id} task={task} onEdit={openEditTask} onDelete={handleDeleteTask} />
                                        ))}
                                        {filteredTasks.filter(t => t.status === status).length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs bg-white/50">
                                                Vacío
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-full overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Tarea</th>
                                        <th className="p-4">Responsable</th>
                                        <th className="p-4">Fecha Límite</th>
                                        <th className="p-4">Prioridad</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTasks.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-900">{t.title}</td>
                                            <td className="p-4 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">{t.assignee.charAt(0)}</div>
                                                {t.assignee}
                                            </td>
                                            <td className="p-4 text-gray-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityColor(t.priority)}`}>
                                                    {t.priority}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 font-medium">{t.status}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => openEditTask(t)} className="text-blue-600 hover:underline mr-3 text-xs font-bold">Editar</button>
                                                <button onClick={() => handleDeleteTask(t.id)} className="text-red-600 hover:underline text-xs font-bold">Borrar</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTasks.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay tareas en esta vista.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* BOARD Modal */}
            {showBoardModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Nuevo Tablero</h3>
                            <button onClick={() => setShowBoardModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <form onSubmit={handleSaveBoard} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Tablero</label>
                                <input required type="text" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" value={boardFormData.title} onChange={e => setBoardFormData({...boardFormData, title: e.target.value})} placeholder="Ej: Instagram Ads" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grupo / Departamento</label>
                                <input required list="groups" type="text" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" value={boardFormData.group} onChange={e => setBoardFormData({...boardFormData, group: e.target.value})} placeholder="Ej: Marketing" />
                                <datalist id="groups">
                                    <option value="General" />
                                    <option value="Marketing" />
                                    <option value="Operaciones" />
                                    <option value="Ventas" />
                                    <option value="Reformas" />
                                </datalist>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={loading} className="bg-rentia-black text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800 flex items-center gap-2">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
                                    Crear Tablero
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TASK Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 my-auto">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-gray-800">{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                            <button onClick={() => setShowTaskModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        
                        <form onSubmit={handleSaveTask} className="flex flex-col overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                    <input required type="text" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" value={taskFormData.title} onChange={e => setTaskFormData({...taskFormData, title: e.target.value})} placeholder="Ej: Renovar contrato de Juan..." />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responsable</label>
                                        <select className="w-full p-2 border rounded-lg text-sm bg-white" value={taskFormData.assignee} onChange={e => setTaskFormData({...taskFormData, assignee: e.target.value as any})}>
                                            {STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                        <select className="w-full p-2 border rounded-lg text-sm bg-white" value={taskFormData.category} onChange={e => setTaskFormData({...taskFormData, category: e.target.value as any})}>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Límite</label>
                                        <input type="date" className="w-full p-2 border rounded-lg text-sm" value={taskFormData.dueDate} onChange={e => setTaskFormData({...taskFormData, dueDate: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                                        <select className="w-full p-2 border rounded-lg text-sm bg-white" value={taskFormData.priority} onChange={e => setTaskFormData({...taskFormData, priority: e.target.value as any})}>
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        {STATUSES.map(s => (
                                            <button 
                                                key={s} 
                                                type="button" 
                                                onClick={() => setTaskFormData({...taskFormData, status: s})}
                                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${taskFormData.status === s ? 'bg-white shadow text-rentia-blue' : 'text-gray-500'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                    <textarea className="w-full p-2 border rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-rentia-blue outline-none" value={taskFormData.description} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} placeholder="Detalles de la tarea..." />
                                </div>
                            </div>

                            <div className="px-6 py-4 flex justify-end gap-2 border-t border-gray-100 bg-gray-50 shrink-0 rounded-b-xl">
                                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded font-bold text-sm">Cancelar</button>
                                <button type="submit" disabled={loading} className="bg-rentia-black text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800 shadow-md flex items-center gap-2">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                                    Guardar Tarea
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
