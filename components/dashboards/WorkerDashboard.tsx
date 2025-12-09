
import React, { useState, useEffect, useMemo } from 'react';
// ... imports (se mantienen igual) ...
import { createPortal } from 'react-dom';
import { db, storage } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskStatus, Candidate, CandidateStatus, VisitOutcome, RoomVisit, InternalNews, WorkerInvoice } from '../../types';
import { Property, Room, CleaningConfig } from '../../data/rooms';
import { ClipboardList, Home, CheckCircle, Clock, AlertCircle, MapPin, Search, Calendar, Wrench, Plus, X, AlertTriangle, ChevronLeft, Loader2, WifiOff, Monitor, Tv, Lock, Sun, Bed, Layout, Image as ImageIcon, UserPlus, Send, Users, UserX, UserCheck, ChevronRight, Eye, Megaphone, Bell, ChevronDown, Sparkles, Trophy, Euro, Save, Receipt, Trash2, Download, Upload, FileCheck } from 'lucide-react';
import { ImageLightbox } from '../ImageLightbox';

// ... (helpers and constants same as before) ...
const CELEBRATION_MESSAGES = [
    "¡Excelente trabajo! 🚀",
    "¡Una tarea menos! Sigue así 💪",
    "¡Imparable! Gran esfuerzo 🌟",
    "Tarea completada con éxito ✨",
    "¡Fantástico! A por la siguiente 🔥",
    "¡Productividad al máximo! 🚀",
    "¡Bien hecho! Equipo Rentia 💙"
];

const getPriorityBadge = (p: string) => {
    switch(p) {
        case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
        case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Baja': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100';
    }
};

const getTaskContainerStyles = (task: Task) => {
    if (task.status === 'Completada') return 'border border-gray-200 opacity-50 bg-gray-50';
    switch (task.priority) {
        case 'Alta': return 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] z-10';
        case 'Media': return 'border-l-4 border-l-yellow-400 border-y border-r border-gray-200 hover:-translate-y-0.5 transition-transform duration-75 ease-linear';
        case 'Baja': return 'border border-green-100 opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 transition-all duration-700 ease-in-out hover:shadow-sm';
        default: return 'border border-gray-200';
    }
};

const NewsBanner: React.FC = () => {
    const [news, setNews] = useState<InternalNews[]>([]);
    useEffect(() => {
        const q = query(collection(db, "internal_news"), orderBy("createdAt", "desc"), limit(3));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: InternalNews[] = [];
            snapshot.forEach((doc) => { list.push({ ...doc.data(), id: doc.id } as InternalNews); });
            setNews(list);
        });
        return () => unsubscribe();
    }, []);
    if (news.length === 0) return null;
    return (
        <div className="mb-6 space-y-3 animate-in slide-in-from-top-4">
            {news.map(item => (
                <div key={item.id} className={`rounded-xl p-4 border flex items-start gap-4 shadow-sm ${item.priority === 'Alta' ? 'bg-red-50 border-red-200 text-red-900' : item.priority === 'Normal' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <div className={`p-2 rounded-full flex-shrink-0 ${item.priority === 'Alta' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-blue-600 shadow-sm'}`}>{item.priority === 'Alta' ? <AlertTriangle className="w-5 h-5"/> : <Megaphone className="w-5 h-5"/>}</div>
                    <div><h4 className="font-bold text-sm mb-1 flex items-center gap-2">{item.title}{item.priority === 'Alta' && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Urgente</span>}</h4><p className="text-xs opacity-90 whitespace-pre-wrap leading-relaxed">{item.content}</p><p className="text-[10px] mt-2 opacity-60 flex items-center gap-1"><Clock className="w-3 h-3"/> {item.createdAt?.toDate().toLocaleDateString()} - {item.author}</p></div>
                </div>
            ))}
        </div>
    );
};

interface TaskCardProps { task: Task; onStatusChange: (taskId: string, newStatus: TaskStatus) => void; }
const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => (
    <div className={`bg-white p-4 rounded-xl shadow-sm relative transition-all duration-300 ${getTaskContainerStyles(task)}`}>
        <div className="flex justify-between items-start mb-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>{task.priority}</span><div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded flex items-center gap-1 border border-gray-100">{task.category === 'Mantenimiento' && <Wrench className="w-3 h-3"/>}{task.category}</div></div>
        <h4 className="font-bold text-gray-800 text-sm mb-2 leading-snug break-words">{task.title}</h4>
        <p className="text-xs text-gray-500 mb-4 whitespace-pre-line bg-gray-50 p-3 rounded border border-gray-100">{task.description}</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-gray-50 gap-3">
            {task.dueDate && (<div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'Completada' ? 'text-red-500 font-bold' : 'text-gray-400'}`}><Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}</div>)}
            <div className="flex gap-2 w-full sm:w-auto">
                {task.status !== 'En Curso' && task.status !== 'Completada' && (<button onClick={() => onStatusChange(task.id, 'En Curso')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm active:scale-95 transition-all"><Clock className="w-3 h-3" /> Empezar</button>)}
                {task.status !== 'Completada' && (<button onClick={() => onStatusChange(task.id, 'Completada')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-xs font-bold border border-green-100 hover:bg-green-100 active:scale-95 transition-all"><CheckCircle className="w-3 h-3" /> Hecho</button>)}
                {task.status === 'En Curso' && (<button onClick={() => onStatusChange(task.id, 'Pendiente')} className="p-2 text-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><X className="w-4 h-4" /></button>)}
            </div>
        </div>
    </div>
);

export const WorkerDashboard: React.FC = () => {
    // ... (Hooks and State kept identical) ...
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'tasks' | 'candidates' | 'rooms' | 'cleaning' | 'invoices'>('tasks');
    const [workerName, setWorkerName] = useState<string>('');
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [myCandidates, setMyCandidates] = useState<Candidate[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invoices, setInvoices] = useState<WorkerInvoice[]>([]);
    const [newInvoice, setNewInvoice] = useState({ amount: '', concept: '', date: new Date().toISOString().split('T')[0] });
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
    const [roomSearch, setRoomSearch] = useState('');
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
    const [candidateFilter, setCandidateFilter] = useState<CandidateStatus>('pending_review');
    const [showCompletedTasks, setShowCompletedTasks] = useState(false);
    const [newIncident, setNewIncident] = useState({ propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' as 'Alta' | 'Media' | 'Baja' });
    const [newCandidate, setNewCandidate] = useState({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '' });
    const [showVisitLogModal, setShowVisitLogModal] = useState<Room | null>(null);
    const [newVisitData, setNewVisitData] = useState({ outcome: 'pending' as VisitOutcome, comments: '', commission: 0 });
    const [editingCleaningPropId, setEditingCleaningPropId] = useState<string | null>(null);
    const [cleaningConfigForm, setCleaningConfigForm] = useState<CleaningConfig>({ enabled: false, days: [], hours: '', costPerHour: 10, included: false });

    // ... (UseEffects kept identical) ...
    useEffect(() => { if (currentUser) setWorkerName(currentUser.displayName || 'Ayoub'); }, [currentUser]);
    useEffect(() => {
        if (!workerName || !currentUser) return;
        setLoading(true);
        // ... (Task, Props, Candidate subscriptions) ...
        const qTasks = query(collection(db, "tasks"));
        const unsubTasks = onSnapshot(qTasks, snapshot => {
            const allTasks: Task[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
            const tasksList = allTasks.filter(t => t.assignee === workerName);
            tasksList.sort((a, b) => { const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity; const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity; return dateA - dateB; });
            setMyTasks(tasksList);
            setLoading(false);
        });
        const unsubProps = onSnapshot(collection(db, "properties"), snapshot => {
            const propsList: Property[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property));
            propsList.sort((a,b) => a.address.localeCompare(b.address));
            setProperties(propsList);
        });
        const qSubmitted = query(collection(db, "candidate_pipeline"), where("submittedBy", "==", workerName));
        const qAssigned = query(collection(db, "candidate_pipeline"), where("assignedTo", "==", workerName));
        const unsubSubmitted = onSnapshot(qSubmitted, snapshot => { updateCandidates(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Candidate)), 'submitted'); });
        const unsubAssigned = onSnapshot(qAssigned, snapshot => { updateCandidates(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Candidate)), 'assigned'); });
        
        // Invoices Subscription
        const qInvoices = query(collection(db, "worker_invoices"), where("workerId", "==", currentUser.uid), orderBy("date", "desc"));
        const unsubInvoices = onSnapshot(qInvoices, (snapshot) => {
            const list: WorkerInvoice[] = [];
            snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as WorkerInvoice));
            setInvoices(list);
        });

        let submittedCandidates: Candidate[] = [];
        let assignedCandidates: Candidate[] = [];
        const updateCandidates = (list: Candidate[], source: 'submitted' | 'assigned') => {
            if (source === 'submitted') submittedCandidates = list; else assignedCandidates = list;
            const all = [...submittedCandidates, ...assignedCandidates];
            const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
            unique.sort((a, b) => { const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0; const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0; return timeB - timeA; });
            setMyCandidates(unique);
        };
        return () => { unsubTasks(); unsubProps(); unsubSubmitted(); unsubAssigned(); unsubInvoices(); };
    }, [workerName, currentUser]);

    // ... (Helpers and Handlers kept identical) ...
    const tasksByStatus = useMemo(() => { return myTasks.reduce((acc, task) => { const status = task.status || 'Pendiente'; if (!acc[status]) acc[status] = []; acc[status].push(task); return acc; }, {} as Record<string, Task[]>); }, [myTasks]);
    const candidatesByStatus = useMemo(() => ({ pending_review: myCandidates.filter(c => c.status === 'pending_review'), approved: myCandidates.filter(c => c.status === 'approved'), rejected: myCandidates.filter(c => c.status === 'rejected'), }), [myCandidates]);
    const filteredProperties = useMemo(() => { return properties.filter(p => p.address.toLowerCase().includes(roomSearch.toLowerCase()) || p.city.toLowerCase().includes(roomSearch.toLowerCase())); }, [properties, roomSearch]);
    const openImages = (images: string[], index = 0) => { setLightboxImages(images); setLightboxIndex(index); setIsLightboxOpen(true); };
    const getFeatureIcon = (id: string) => { switch(id) { case 'balcony': return <Sun className="w-3 h-3"/>; case 'smart_tv': return <Tv className="w-3 h-3"/>; case 'lock': return <Lock className="w-3 h-3"/>; case 'desk': return <Monitor className="w-3 h-3"/>; default: return <CheckCircle className="w-3 h-3"/>; } };
    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => { await updateDoc(doc(db, "tasks", taskId), { status: newStatus }); if (newStatus === 'Completada') { const randomMsg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]; setCelebrationMessage(randomMsg); setTimeout(() => setCelebrationMessage(null), 3500); } };
    const handleSaveIncident = async (e: React.FormEvent) => { e.preventDefault(); if (!newIncident.propertyId || !newIncident.title) return alert("Selecciona una propiedad y escribe un título."); const selectedProp = properties.find(p => p.id === newIncident.propertyId); const locationText = selectedProp?.address || 'Propiedad'; const taskTitle = `INCIDENCIA: ${newIncident.title} (${locationText})`; await addDoc(collection(db, "tasks"), { title: taskTitle, description: newIncident.description, assignee: workerName, priority: newIncident.priority, status: 'Pendiente', category: 'Mantenimiento', boardId: 'incidents', createdAt: serverTimestamp(), dueDate: new Date().toISOString() }); setShowIncidentModal(false); setNewIncident({ propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' }); alert("Incidencia reportada correctamente."); };
    
    // MODIFICADO: Guardar ownerId
    const handleSendCandidate = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!newCandidate.propertyId || !newCandidate.candidateName) { return alert("Completa los campos obligatorios: propiedad y nombre."); } 
        const prop = properties.find(p => p.id === newCandidate.propertyId); 
        const room = prop?.rooms?.find(r => r.id === newCandidate.roomId); 
        try { 
            await addDoc(collection(db, "candidate_pipeline"), { 
                ...newCandidate, 
                propertyName: prop?.address || 'N/A', 
                ownerId: prop?.ownerId || null, // Guardar ID propietario
                roomName: room?.name || 'General / A definir', 
                submittedBy: workerName, 
                submittedAt: serverTimestamp(), 
                status: 'pending_review' 
            }); 
            setShowCandidateModal(false); 
            setNewCandidate({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '' }); 
            alert('Candidato enviado a filtrado correctamente.'); 
        } catch (error) { 
            console.error(error); alert('Error al enviar candidato.'); 
        } 
    };
    
    const handleSaveVisit = async (e: React.FormEvent) => { e.preventDefault(); if (!showVisitLogModal || !selectedProperty) return; try { await addDoc(collection(db, "room_visits"), { propertyId: selectedProperty.id, propertyName: selectedProperty.address, roomId: showVisitLogModal.id, roomName: showVisitLogModal.name, workerName: workerName, visitDate: serverTimestamp(), outcome: newVisitData.outcome, comments: newVisitData.comments, commission: Number(newVisitData.commission) || 0 }); setShowVisitLogModal(null); setNewVisitData({ outcome: 'pending', comments: '', commission: 0 }); alert('Visita registrada correctamente.'); } catch (err) { console.error(err); alert('Error al registrar la visita.'); } };
    const startEditingCleaning = (prop: Property) => { setEditingCleaningPropId(prop.id); setCleaningConfigForm(prop.cleaningConfig || { enabled: false, days: [], hours: '', costPerHour: 10, included: false }); };
    const handleCleaningSave = async () => { if (!editingCleaningPropId) return; try { await updateDoc(doc(db, "properties", editingCleaningPropId), { cleaningConfig: cleaningConfigForm }); setEditingCleaningPropId(null); } catch (e) { console.error(e); alert("Error al guardar configuración de limpieza."); } };
    const toggleCleaningDay = (day: string) => { setCleaningConfigForm(prev => { const newDays = prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]; return { ...prev, days: newDays }; }); };
    const handleUploadInvoice = async (e: React.FormEvent) => { e.preventDefault(); if (!invoiceFile || !newInvoice.amount || !newInvoice.concept) return alert("Completa todos los campos"); if (!currentUser) return; setIsUploadingInvoice(true); try { const fileName = `invoice_${Date.now()}_${invoiceFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`; const storageRef = ref(storage, `worker_invoices/${currentUser.uid}/${fileName}`); await uploadBytes(storageRef, invoiceFile); const url = await getDownloadURL(storageRef); await addDoc(collection(db, "worker_invoices"), { workerId: currentUser.uid, workerName: workerName, amount: parseFloat(newInvoice.amount), concept: newInvoice.concept, date: newInvoice.date, status: 'pending', fileUrl: url, fileName: invoiceFile.name, createdAt: serverTimestamp() }); setNewInvoice({ amount: '', concept: '', date: new Date().toISOString().split('T')[0] }); setInvoiceFile(null); alert("Factura subida correctamente."); } catch (error) { console.error(error); alert("Error al subir la factura."); } finally { setIsUploadingInvoice(false); } };
    const handleDeleteInvoice = async (invoice: WorkerInvoice) => { if (invoice.status === 'paid') return alert("No puedes borrar una factura ya pagada."); if (confirm("¿Eliminar esta factura pendiente?")) { try { await deleteDoc(doc(db, "worker_invoices", invoice.id)); } catch (error) { alert("Error al eliminar."); } } };

    // --- Render Content ---
    const renderContent = () => {
        // ... (Cases for tasks, candidates, rooms, cleaning kept identical) ...
        switch (activeTab) {
            case 'tasks': {
                const inProgress = tasksByStatus['En Curso'] || []; const pending = tasksByStatus['Pendiente'] || []; const completed = tasksByStatus['Completada'] || []; const blocked = tasksByStatus['Bloqueada'] || []; const priorityOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2 }; pending.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                return (<div className="space-y-6 pb-8"><NewsBanner />{loading && <Loader2 className="w-6 h-6 animate-spin text-rentia-blue mx-auto mt-8"/>}{!loading && myTasks.length === 0 && (<div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl"><ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No tienes tareas asignadas.</p></div>)}{inProgress.length > 0 && (<div className="animate-in fade-in slide-in-from-left-2"><h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2 px-1"><Clock className="w-4 h-4 animate-pulse" /> En Curso ({inProgress.length})</h3><div className="space-y-3">{inProgress.map(task => <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />)}</div></div>)}{pending.length > 0 && (<div className="animate-in fade-in slide-in-from-left-2 delay-100"><h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2 px-1 border-t border-gray-200 pt-4 mt-4"><ClipboardList className="w-4 h-4" /> Pendientes ({pending.length})</h3><div className="space-y-3">{pending.map(task => <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />)}</div></div>)}{(completed.length > 0 || blocked.length > 0) && (<div className="pt-6 border-t border-gray-200"><button onClick={() => setShowCompletedTasks(!showCompletedTasks)} className="w-full py-3 flex items-center justify-between text-gray-500 text-sm font-bold bg-white border border-gray-200 rounded-xl px-4 hover:bg-gray-50 transition-colors shadow-sm"><span className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Historial Completado ({completed.length + blocked.length})</span><ChevronDown className={`w-4 h-4 transition-transform ${showCompletedTasks ? 'rotate-180' : ''}`} /></button>{showCompletedTasks && (<div className="space-y-3 mt-4 animate-in slide-in-from-top-2">{blocked.map(t => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} />)}{completed.map(t => <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} />)}</div>)}</div>)}</div>);
            }
            case 'candidates': return (<div className="space-y-4"><div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar gap-1">{(['pending_review', 'approved', 'rejected'] as CandidateStatus[]).map(status => (<button key={status} onClick={() => setCandidateFilter(status)} className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-md transition-all capitalize whitespace-nowrap ${candidateFilter === status ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>{status === 'pending_review' ? 'Pendientes' : status === 'approved' ? 'Aprobados' : 'Rechazados'} ({candidatesByStatus[status]?.length || 0})</button>))}</div>{(candidatesByStatus[candidateFilter] && candidatesByStatus[candidateFilter].length > 0) ? candidatesByStatus[candidateFilter].map(c => (<div key={c.id} className="bg-white border p-3 rounded-lg text-xs shadow-sm relative overflow-hidden">{c.assignedTo === workerName && (<div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg border-b border-l border-blue-200">¡Asignado para Visita!</div>)}<p className="font-bold text-sm text-gray-800 mt-1">{c.candidateName}</p><p className="text-gray-500 text-xs flex items-center gap-1 mt-1"><Home className="w-3 h-3" /> {c.propertyName}</p><p className="text-gray-400 text-[10px] mt-1 italic">{c.roomName}</p></div>)) : <div className="text-center py-10 text-gray-400 text-sm">No hay perfiles.</div>}</div>);
            case 'rooms': return (<div className="space-y-4"><div className="relative"><input type="text" placeholder="Buscar propiedad..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue shadow-sm text-sm" value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} /><Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" /></div>{filteredProperties.length === 0 ? <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl"><Home className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No se encontraron propiedades.</p></div> : filteredProperties.map((prop) => { const rooms = prop.rooms || []; const availCount = rooms.filter(r => r.status === 'available').length; return (<div key={prop.id} onClick={() => setSelectedProperty(prop)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all group flex items-center"><div className="w-24 h-24 bg-gray-200 relative flex-shrink-0">{prop.image ? <img src={prop.image} alt={prop.address} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Home className="w-8 h-8 opacity-30" /></div>}</div><div className="p-3 flex-grow min-w-0"><h3 className="font-bold text-sm leading-tight truncate">{prop.address}</h3><p className="text-xs text-gray-500 truncate">{prop.city}</p><div className="mt-2 text-[10px] font-bold">{availCount > 0 ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{availCount} Libres</span> : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Completo</span>}</div></div><ChevronRight className="w-5 h-5 text-gray-300 mr-4 group-hover:text-rentia-blue"/></div>); })}</div>);
            case 'cleaning': return (<div className="space-y-6"><h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> Configuración de Limpieza</h3><div className="space-y-4">{properties.map(prop => (<div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 border-b border-gray-100 gap-2"><div><h4 className="font-bold text-gray-800 text-sm">{prop.address}</h4><p className="text-xs text-gray-500">{prop.city}</p></div><button onClick={() => editingCleaningPropId === prop.id ? setEditingCleaningPropId(null) : startEditingCleaning(prop)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors">{editingCleaningPropId === prop.id ? 'Cerrar' : 'Configurar'}</button></div>{editingCleaningPropId === prop.id ? (<div className="p-4 bg-indigo-50/50 animate-in slide-in-from-top-2"><div className="flex flex-wrap items-center gap-4 mb-4"><label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded border border-indigo-200"><input type="checkbox" checked={cleaningConfigForm.enabled} onChange={(e) => setCleaningConfigForm({...cleaningConfigForm, enabled: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"/><span className="text-xs font-bold text-indigo-700">Activar Servicio</span></label>{cleaningConfigForm.enabled && (<><div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-indigo-200"><Clock className="w-3 h-3 text-indigo-400" /><input type="text" placeholder="Horario (10:00 - 13:00)" className="text-xs border-none focus:ring-0 w-32 p-0" value={cleaningConfigForm.hours} onChange={(e) => setCleaningConfigForm({...cleaningConfigForm, hours: e.target.value})}/></div><div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-indigo-200"><Euro className="w-3 h-3 text-indigo-400" /><input type="number" placeholder="Coste/Hora" className="text-xs border-none focus:ring-0 w-20 p-0" value={cleaningConfigForm.costPerHour} onChange={(e) => setCleaningConfigForm({...cleaningConfigForm, costPerHour: Number(e.target.value)})}/></div></>)}</div>{cleaningConfigForm.enabled && (<div className="flex flex-wrap gap-2 mb-4">{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (<button key={day} onClick={() => toggleCleaningDay(day)} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${cleaningConfigForm.days.includes(day) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-indigo-100 hover:border-indigo-300'}`}>{day}</button>))}</div>)}<div className="flex justify-end"><button onClick={handleCleaningSave} className="bg-indigo-600 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm"><Save className="w-3 h-3"/> Guardar Configuración</button></div></div>) : (<div className="p-4 flex gap-4 text-xs text-gray-600">{prop.cleaningConfig?.enabled ? (<><div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-400"/> {prop.cleaningConfig.days.join(', ')}</div><div className="flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-400"/> {prop.cleaningConfig.hours}</div></>) : (<span className="text-gray-400 italic">Sin servicio activo</span>)}</div>)}</div>))}</div></div>);
            // ... (Invoices view kept identical) ...
            case 'invoices': return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="font-bold text-lg text-rentia-black flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-rentia-blue" /> Facturación y Pagos
                    </h3>

                    {/* Formulario Subida */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                            <Upload className="w-4 h-4"/> Subir Nueva Factura
                        </h4>
                        <form onSubmit={handleUploadInvoice} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="text" placeholder="Concepto (ej: Comisiones Enero)" className="border p-2 rounded text-sm w-full" value={newInvoice.concept} onChange={e => setNewInvoice({...newInvoice, concept: e.target.value})} required />
                                <input type="number" step="0.01" placeholder="Importe (€)" className="border p-2 rounded text-sm w-full font-bold" value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})} required />
                            </div>
                            <input type="date" className="border p-2 rounded text-sm w-full" value={newInvoice.date} onChange={e => setNewInvoice({...newInvoice, date: e.target.value})} required />
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                                <input type="file" onChange={e => setInvoiceFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                                <p className="text-xs text-gray-500 truncate px-2">{invoiceFile ? invoiceFile.name : 'Click para seleccionar archivo (PDF/IMG)'}</p>
                            </div>
                            <button type="submit" disabled={isUploadingInvoice} className="w-full bg-rentia-black text-white py-2 rounded-lg font-bold text-sm hover:bg-gray-800 flex items-center justify-center gap-2">
                                {isUploadingInvoice ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                                Enviar Factura a Rentia
                            </button>
                        </form>
                    </div>

                    {/* Listado Facturas */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-gray-600 uppercase tracking-wide">Mis Facturas</h4>
                        {invoices.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-xl">No has subido facturas aún.</div>
                        ) : (
                            invoices.map(inv => (
                                <div key={inv.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <p className="font-bold text-gray-800 truncate max-w-full">{inv.concept}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border flex-shrink-0 ${inv.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                {inv.status === 'paid' ? 'Pagada' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{inv.date} • {inv.amount.toFixed(2)}€</p>
                                        
                                        {inv.paymentProofUrl && (
                                            <div className="mt-2">
                                                <a href={inv.paymentProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1">
                                                    <FileCheck className="w-3 h-3"/> Ver Justificante Pago
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0 mt-2 sm:mt-0">
                                        <a href={inv.fileUrl} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none text-center text-xs font-bold bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                                            <Download className="w-3 h-3"/> Ver
                                        </a>
                                        {inv.status === 'pending' && (
                                            <button onClick={() => handleDeleteInvoice(inv)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            );
        }
    }

    if (!workerName) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue"/></div>;

    return (
        // ... (Return JSX kept identical) ...
        <div className="min-h-[100dvh] bg-gray-50 font-sans">
            {celebrationMessage && createPortal(<div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[10000] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none"><div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-md"><Sparkles className="w-5 h-5 text-yellow-300 animate-pulse fill-current" /><span className="font-bold text-sm md:text-base tracking-wide text-shadow-sm">{celebrationMessage}</span><Trophy className="w-5 h-5 text-yellow-300" /></div></div>, document.body)}

            <div className="max-w-6xl mx-auto p-4 md:p-6 pb-32">
                <header className="mb-6"><h1 className="text-xl md:text-2xl font-bold text-rentia-black font-display">Hola, {workerName} <span className="text-xl">🛠️</span></h1>{error && <div className="mt-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2"><WifiOff className="w-4 h-4" />{error}</div>}</header>
                <main>{renderContent()}</main>
                
                {/* FAB */}
                <div className="fixed bottom-24 right-6 z-40">
                    {activeTab === 'tasks' && <button onClick={() => setShowIncidentModal(true)} className="w-14 h-14 bg-red-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"><AlertTriangle className="w-6 h-6" /></button>}
                    {activeTab === 'candidates' && <button onClick={() => setShowCandidateModal(true)} className="w-14 h-14 bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"><UserPlus className="w-6 h-6" /></button>}
                </div>

                {/* Bottom Nav */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] grid grid-cols-5 z-50">
                    <button onClick={() => setActiveTab('tasks')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'tasks' ? 'text-rentia-blue' : 'text-gray-400'}`}><ClipboardList className="w-6 h-6" /><span className="text-[9px] font-bold">Tareas</span></button>
                    <button onClick={() => setActiveTab('candidates')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'candidates' ? 'text-rentia-blue' : 'text-gray-400'}`}><Users className="w-6 h-6" /><span className="text-[9px] font-bold">Candidatos</span></button>
                    <button onClick={() => setActiveTab('rooms')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'rooms' ? 'text-rentia-blue' : 'text-gray-400'}`}><Home className="w-6 h-6" /><span className="text-[9px] font-bold">Catálogo</span></button>
                    <button onClick={() => setActiveTab('cleaning')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'cleaning' ? 'text-rentia-blue' : 'text-gray-400'}`}><Sparkles className="w-6 h-6" /><span className="text-[9px] font-bold">Limpieza</span></button>
                    <button onClick={() => setActiveTab('invoices')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'invoices' ? 'text-rentia-blue' : 'text-gray-400'}`}><Receipt className="w-6 h-6" /><span className="text-[9px] font-bold">Facturas</span></button>
                </div>
            </div>

            {/* Modals included (VisitLog, Incident, Candidate, etc.) - same as before */}
            {/* ... keeping existing modal code ... */}
            {selectedProperty && createPortal(<div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in slide-in-from-bottom-10"><div className="flex-shrink-0 bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 border-b border-gray-100"><button onClick={() => setSelectedProperty(null)} className="flex items-center gap-1 text-rentia-blue text-sm font-bold p-2 -ml-2"><ChevronLeft className="w-5 h-5"/> Volver</button><h2 className="font-bold text-sm truncate max-w-[50%]">{selectedProperty.address}</h2><a href={selectedProperty.googleMapsLink} target="_blank" rel="noreferrer" className="p-2 text-gray-500"><MapPin className="w-5 h-5"/></a></div><div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 pb-20">{(selectedProperty.rooms || []).map(room => (<div key={room.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-gray-800 text-lg">{room.name}</h4><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${room.status==='available'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{room.status}</span></div><p className="text-xl font-bold text-rentia-blue mb-3">{room.price}€<span className="text-sm font-normal text-gray-400">/mes</span></p><div className="flex flex-wrap gap-2 mt-2 mb-4">{room.images && room.images.length > 0 && <button onClick={() => openImages(room.images!)} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded flex items-center gap-1"><ImageIcon className="w-3 h-3"/> {room.images.length} fotos</button>}{room.features?.map(f => <div key={f} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded flex items-center gap-1">{getFeatureIcon(f)} {f}</div>)}</div><div className="pt-3 border-t border-gray-100"><button onClick={() => setShowVisitLogModal(room)} className="w-full bg-indigo-50 text-indigo-700 text-sm font-bold py-3 rounded-lg border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"><Eye className="w-4 h-4" /> Registrar Visita</button></div></div>))}</div></div>, document.body)}
            {showVisitLogModal && createPortal(<div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowVisitLogModal(null)}><form onSubmit={handleSaveVisit} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-500"/> Registrar Visita a {showVisitLogModal.name}</h3><button type="button" onClick={() => setShowVisitLogModal(null)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button></div><div className="p-4 space-y-4 overflow-y-auto"><div><label className="text-xs font-bold text-gray-500 block mb-1">Resultado de la Visita</label><select required className="w-full p-2 border rounded text-sm" value={newVisitData.outcome} onChange={e => setNewVisitData({...newVisitData, outcome: e.target.value as any})}><option value="successful">Exitosa</option><option value="unsuccessful">No exitosa</option><option value="pending">Pendiente de respuesta</option></select></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Comentarios / Pegas</label><textarea placeholder="Ej: Le ha gustado pero le parece pequeña..." className="w-full p-2 border rounded text-sm h-24" value={newVisitData.comments} onChange={e => setNewVisitData({...newVisitData, comments: e.target.value})}></textarea></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Comisión Propuesta al Inquilino (€)</label><input type="number" placeholder="Ej: 150" className="w-full p-2 border rounded text-sm" value={newVisitData.commission} onChange={e => setNewVisitData({...newVisitData, commission: Number(e.target.value)})} /></div></div><div className="p-4 bg-gray-50 border-t flex gap-2"><button type="button" onClick={() => setShowVisitLogModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button><button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"><Send className="w-4 h-4"/> Guardar Visita</button></div></form></div>, document.body)}
            {showIncidentModal && createPortal(<div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowIncidentModal(false)}><form onSubmit={handleSaveIncident} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/> Reportar Incidencia</h3><button type="button" onClick={() => setShowIncidentModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button></div><div className="p-4 space-y-4 overflow-y-auto"><select required className="w-full p-2 border rounded text-sm" value={newIncident.propertyId} onChange={e => setNewIncident({...newIncident, propertyId: e.target.value})}><option value="">Seleccionar Propiedad*</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select><input required type="text" placeholder="Título Incidencia*" className="w-full p-2 border rounded text-sm" value={newIncident.title} onChange={e => setNewIncident({...newIncident, title: e.target.value})} /><textarea placeholder="Descripción detallada..." className="w-full p-2 border rounded text-sm h-24" value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})}></textarea><select className="w-full p-2 border rounded text-sm" value={newIncident.priority} onChange={e => setNewIncident({...newIncident, priority: e.target.value as any})}><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option></select></div><div className="p-4 bg-gray-50 border-t flex gap-2"><button type="button" onClick={() => setShowIncidentModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button><button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700"><Send className="w-4 h-4"/> Enviar Reporte</button></div></form></div>, document.body)}
            {showCandidateModal && createPortal(<div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCandidateModal(false)}><form onSubmit={handleSendCandidate} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600"/> Enviar Candidato</h3><button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button></div><div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]"><div><label className="text-xs font-bold text-gray-500 block mb-1">Propiedad*</label><select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({...newCandidate, propertyId: e.target.value, roomId: ''})}><option value="">Seleccionar...</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Habitación (Opcional)</label><select disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({...newCandidate, roomId: e.target.value})}><option value="">Seleccionar...</option>{properties.find(p => p.id === newCandidate.propertyId)?.rooms?.map(r => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}</select></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Nombre Candidato*</label><input required type="text" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateName} onChange={e => setNewCandidate({...newCandidate, candidateName: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 block mb-1">Teléfono</label><input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({...newCandidate, candidatePhone: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Email</label><input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({...newCandidate, candidateEmail: e.target.value})}/></div></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Info Adicional</label><textarea className="w-full p-2 border rounded text-sm h-20" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({...newCandidate, additionalInfo: e.target.value})} /></div></div><div className="p-4 bg-gray-50 border-t flex gap-2"><button type="button" onClick={() => setShowCandidateModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button><button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700"><Send className="w-4 h-4"/> Enviar a Oficina</button></div></form></div>, document.body)}
            {isLightboxOpen && <ImageLightbox images={lightboxImages} selectedIndex={lightboxIndex} onClose={() => setIsLightboxOpen(false)} />}
        </div>
    );
};
