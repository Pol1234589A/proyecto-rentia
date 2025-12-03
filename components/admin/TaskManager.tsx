import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { StaffMember, Task, TaskPriority, TaskStatus, TaskCategory } from '../../types';
import { Plus, Calendar, User, Clock, AlertTriangle, CheckCircle, MoreVertical, Trash2, Edit2, X, Filter, List, Kanban, Save, Link, RefreshCw } from 'lucide-react';

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
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col gap-2">
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
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterAssignee, setFilterAssignee] = useState<StaffMember | 'All'>('All');
    const [filterPriority, setFilterPriority] = useState<TaskPriority | 'All'>('All');

    // Form State
    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        assignee: 'Pol',
        priority: 'Media',
        status: 'Pendiente',
        category: 'Gestión',
        dueDate: ''
    });

    // --- GOOGLE CALENDAR CONFIG ---
    const calendarId = localStorage.getItem('rentia_calendar_id');
    const googleApiKey = localStorage.getItem('rentia_calendar_api_key');

    useEffect(() => {
        const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTasks: Task[] = [];
            snapshot.forEach((doc) => {
                loadedTasks.push({ ...doc.data(), id: doc.id } as Task);
            });
            setTasks(loadedTasks);
        });
        return () => unsubscribe();
    }, []);

    // Derived Data
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (filterAssignee !== 'All' && t.assignee !== filterAssignee) return false;
            if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
            return true;
        });
    }, [tasks, filterAssignee, filterPriority]);

    const stats = useMemo(() => {
        return {
            total: filteredTasks.length,
            urgent: filteredTasks.filter(t => t.priority === 'Alta' && t.status !== 'Completada').length,
            pending: filteredTasks.filter(t => t.status === 'Pendiente').length,
            completed: filteredTasks.filter(t => t.status === 'Completada').length
        };
    }, [filteredTasks]);

    // --- ACTIONS ---

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const taskPayload = {
                ...formData,
                updatedAt: serverTimestamp()
            };

            if (isEditing) {
                await updateDoc(doc(db, "tasks", isEditing), taskPayload);
            } else {
                await addDoc(collection(db, "tasks"), {
                    ...taskPayload,
                    createdAt: serverTimestamp()
                });
            }

            if (formData.dueDate && calendarId) {
                console.log("Syncing to Google Calendar...", formData.title, formData.dueDate);
            }

            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Error al guardar tarea.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar tarea definitivamente?")) return;
        try {
            await deleteDoc(doc(db, "tasks", id));
        } catch (e) {
            console.error(e);
        }
    };

    const openEdit = (task: Task) => {
        setFormData(task);
        setIsEditing(task.id);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
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
        <div className="bg-gray-50 min-h-screen flex flex-col h-full">
            
            {/* Header / Stats */}
            <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-rentia-black flex items-center gap-2">
                            <List className="w-6 h-6 text-rentia-gold" />
                            Organizador de Tareas
                        </h2>
                        <p className="text-sm text-gray-500">Gestión centralizada del equipo Staff.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('kanban')} className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-gray-100 text-rentia-blue' : 'text-gray-400'}`}><Kanban className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-rentia-blue' : 'text-gray-400'}`}><List className="w-5 h-5"/></button>
                        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 shadow-md">
                            <Plus className="w-4 h-4" /> Nueva Tarea
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-4">
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100 flex items-center gap-2">
                            <span className="text-xl">{stats.total}</span> Tareas Totales
                        </div>
                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-bold border border-red-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> <span className="text-xl">{stats.urgent}</span> Urgentes
                        </div>
                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold border border-green-100 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> <span className="text-xl">{stats.completed}</span> Completadas
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select 
                            className="bg-white border border-gray-200 text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none"
                            value={filterAssignee}
                            onChange={(e) => setFilterAssignee(e.target.value as any)}
                        >
                            <option value="All">Todos los Responsables</option>
                            {STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select 
                            className="bg-white border border-gray-200 text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none"
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as any)}
                        >
                            <option value="All">Todas Prioridades</option>
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-grow p-6 overflow-x-auto">
                {viewMode === 'kanban' ? (
                    <div className="flex gap-6 min-w-[1000px] h-full">
                        {STATUSES.map(status => (
                            <div key={status} className="flex-1 min-w-[250px] flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{status}</h3>
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {filteredTasks.filter(t => t.status === status).length}
                                    </span>
                                </div>
                                <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredTasks.filter(t => t.status === status).map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={openEdit} onDelete={handleDelete} />
                                    ))}
                                    {filteredTasks.filter(t => t.status === status).length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-lg text-gray-300 text-xs">
                                            Sin tareas
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                                            <button onClick={() => openEdit(t)} className="text-blue-600 hover:underline mr-3 text-xs font-bold">Editar</button>
                                            <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline text-xs font-bold">Borrar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal - Fixed to handle overflow and centering properly */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 my-auto">
                        
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-gray-800">{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        
                        <form onSubmit={handleSaveTask} className="flex flex-col overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                    <input required type="text" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej: Renovar contrato de Juan..." />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responsable</label>
                                        <select className="w-full p-2 border rounded-lg text-sm bg-white" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value as any})}>
                                            {STAFF_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                        <select className="w-full p-2 border rounded-lg text-sm bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Límite</label>
                                        <input type="date" className="w-full p-2 border rounded-lg text-sm" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                                        <select className="w-full p-2 border rounded-lg text-sm bg-white" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
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
                                                onClick={() => setFormData({...formData, status: s})}
                                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${formData.status === s ? 'bg-white shadow text-rentia-blue' : 'text-gray-500'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                    <textarea className="w-full p-2 border rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-rentia-blue outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detalles de la tarea..." />
                                </div>
                            </div>

                            <div className="px-6 py-4 flex justify-end gap-2 border-t border-gray-100 bg-gray-50 shrink-0 rounded-b-xl">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded font-bold text-sm">Cancelar</button>
                                <button type="submit" disabled={loading} className="bg-rentia-black text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800 shadow-md flex items-center gap-2">
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
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