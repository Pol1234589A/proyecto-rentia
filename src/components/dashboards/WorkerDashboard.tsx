import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db, storage } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, orderBy, limit, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Task, TaskStatus, Candidate, CandidateStatus, VisitOutcome, RoomVisit, InternalNews, WorkerInvoice, UserProfile } from '../../types';
import { properties as staticProperties, Property, Room, CleaningConfig } from '../../data/rooms';
import { ClipboardList, Home, CheckCircle, Clock, AlertCircle, MapPin, Search, Calendar, Wrench, Plus, X, AlertTriangle, ChevronLeft, Loader2, WifiOff, Monitor, Tv, Lock, Sun, Bed, Layout, Image as ImageIcon, UserPlus, Users, User, UserX, UserCheck, Send, ChevronRight, Eye, Megaphone, Bell, ChevronDown, Sparkles, Trophy, Euro, Save, Receipt, Trash2, Download, Upload, FileCheck, Siren, ArrowRight, Phone, MessageCircle, Shield, MousePointerClick, Briefcase, Footprints, BarChart3, Building, Grid, Globe, FileText } from 'lucide-react';
import { ImageLightbox } from '../ImageLightbox';
import { SensitiveDataDisplay } from '../common/SecurityComponents';
import { ProtocolsView } from './staff/ProtocolsView';

// TEXTO LEGAL PARA TRABAJADORES/COLABORADORES
const WORKER_LEGAL_TEXT = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
    <h2 style="text-align: center; color: #0072CE;">ACUERDO DE CONFIDENCIALIDAD Y DEBER DE SECRETO</h2>
    <p><strong>Para:</strong> Trabajadores y Colaboradores de RENTIA INVESTMENTS S.L.</p>
    
    <h3>1. ACCESO A DATOS PERSONALES</h3>
    <p>En el desempeño de sus funciones (visitas comerciales, gestión de incidencias, contacto con candidatos), el Trabajador/Colaborador tendrá acceso a datos de carácter personal (nombres, teléfonos, DNI, situaciones económicas) de clientes y potenciales inquilinos.</p>
    
    <h3>2. OBLIGACIONES DEL COLABORADOR</h3>
    <ul>
      <li><strong>Confidencialidad Estricta:</strong> Se compromete a guardar el máximo secreto profesional respecto a todos los datos personales e información confidencial a la que tenga acceso.</li>
      <li><strong>Finalidad Limitada:</strong> Los datos de contacto (teléfonos, emails) solo podrán utilizarse para la gestión encomendada (ej. agendar una visita). Queda prohibido usar estos datos para fines propios o cederlos a terceros.</li>
      <li><strong>No Almacenamiento Local:</strong> No se permite crear bases de datos paralelas o guardar copias de documentación sensible en dispositivos personales no autorizados una vez finalizada la gestión.</li>
    </ul>

    <h3>3. CONSECUENCIAS DEL INCUMPLIMIENTO</h3>
    <p>El incumplimiento de este deber de confidencialidad podrá dar lugar a las responsabilidades disciplinarias, contractuales y legales correspondientes, incluyendo sanciones bajo la normativa RGPD y LOPDGDD.</p>

    <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
      <p style="font-size: 12px; color: #666;">Al pulsar "Aceptar y Firmar", usted confirma que ha leído, comprendido y acepta estas obligaciones de confidencialidad.</p>
    </div>
  </div>
`;

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
    switch (p) {
        case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
        case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Baja': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100';
    }
};

const getTaskContainerStyles = (task: Task) => {
    if (task.status === 'Completada') return 'border border-gray-100 opacity-60 bg-gray-50 bg-opacity-50 blur-[0.3px]';
    switch (task.priority) {
        case 'Alta': return 'border-l-4 border-l-red-500 bg-white shadow-[0_4px_20px_rgba(239,68,68,0.1)] ring-1 ring-red-100';
        case 'Media': return 'border-l-4 border-l-orange-400 bg-white shadow-lg shadow-orange-900/5 ring-1 ring-orange-100';
        case 'Baja': return 'border-l-4 border-l-emerald-400 bg-white shadow-sm ring-1 ring-emerald-50';
        default: return 'border border-gray-100 bg-white shadow-sm';
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
        }, (error) => {
            console.error("Error en el banner de noticias:", error);
        });
        return () => unsubscribe();
    }, []);
    if (news.length === 0) return null;
    return (
        <div className="mb-6 space-y-3 animate-in slide-in-from-top-4">
            {news.map(item => (
                <div key={item.id} className={`rounded-xl p-4 border flex items-start gap-4 shadow-sm ${item.priority === 'Alta' ? 'bg-red-50 border-red-200 text-red-900' : item.priority === 'Normal' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <div className={`p-2 rounded-full flex-shrink-0 ${item.priority === 'Alta' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-blue-600 shadow-sm'}`}>{item.priority === 'Alta' ? <AlertTriangle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}</div>
                    <div><h4 className="font-bold text-sm mb-1 flex items-center gap-2">{item.title}{item.priority === 'Alta' && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Urgente</span>}</h4><p className="text-xs opacity-90 whitespace-pre-wrap leading-relaxed">{item.content}</p><p className="text-[10px] mt-2 opacity-60 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.createdAt?.toDate().toLocaleDateString()} - {item.author}</p></div>
                </div>
            ))}
        </div>
    );
};

interface TaskCardProps { task: Task; onStatusChange: (taskId: string, newStatus: TaskStatus) => void; }
const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => (
    <div className={`p-5 rounded-2xl relative transition-all duration-500 active:scale-[0.98] ${getTaskContainerStyles(task)}`}>
        <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full w-fit border uppercase tracking-[0.05em] ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                </span>
                <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-1 opacity-70">
                    {task.category === 'Mantenimiento' ? <Wrench className="w-3 h-3 text-orange-500" /> : <Sparkles className="w-3 h-3 text-purple-400" />}
                    {task.category}
                </div>
            </div>
            {task.dueDate && (
                <div className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 ${new Date(task.dueDate) < new Date() && task.status !== 'Completada' ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
                    <Clock className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                </div>
            )}
        </div>

        <h4 className="font-extrabold text-gray-900 text-[15px] mb-2 leading-tight tracking-tight">
            {task.title}
        </h4>

        <p className="text-[12px] text-gray-500 mb-5 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 italic">
            {task.description}
        </p>

        <div className="flex items-center gap-2 pt-2">
            {task.status !== 'Completada' && (
                <>
                    {task.status !== 'En Curso' ? (
                        <button
                            onClick={() => onStatusChange(task.id, 'En Curso')}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3.5 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            <Clock className="w-4 h-4" /> EMPEZAR
                        </button>
                    ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 p-3.5 rounded-xl text-xs font-black border border-blue-100">
                            <Loader2 className="w-4 h-4 animate-spin" /> EN CURSO
                        </div>
                    )}
                    <button
                        onClick={() => onStatusChange(task.id, 'Completada')}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-3.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        <CheckCircle className="w-4 h-4" /> COMPLETAR
                    </button>
                </>
            )}
            {task.status === 'Completada' && (
                <div className="w-full text-center py-2 text-emerald-600 font-black text-xs flex items-center justify-center gap-2 bg-emerald-50 rounded-xl">
                    <CheckCircle className="w-4 h-4" /> TAREA FINALIZADA
                </div>
            )}
        </div>
    </div>
);

export const WorkerDashboard: React.FC = () => {
    // ... State setup ...
    const { currentUser } = useAuth();
    const { adminContact, directorContact } = useConfig();
    const [activeTab, setActiveTab] = useState<'tasks' | 'candidates' | 'rooms' | 'cleaning' | 'invoices' | 'protocols'>('tasks');
    const [workerName, setWorkerName] = useState<string>('');
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [candidateSubTab, setCandidateSubTab] = useState<'assigned' | 'submitted'>('assigned');
    const [expandedVisitProps, setExpandedVisitProps] = useState<Record<string, boolean>>({});
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
    const [properties, setProperties] = useState<Property[]>([]); // Will contain mixed Static + Firestore
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
    const [showCompletedTasks, setShowCompletedTasks] = useState(false);
    const [newIncident, setNewIncident] = useState({ propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' as 'Alta' | 'Media' | 'Baja' });
    const [newCandidate, setNewCandidate] = useState({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '', priority: 'Media' as 'Alta' | 'Media' | 'Baja', sourcePlatform: '' });
    const [showVisitLogModal, setShowVisitLogModal] = useState<Room | null>(null);
    const [newVisitData, setNewVisitData] = useState({ outcome: 'pending' as VisitOutcome, comments: '', commission: 0 });
    const [editingCleaningPropId, setEditingCleaningPropId] = useState<string | null>(null);
    const [cleaningConfigForm, setCleaningConfigForm] = useState<CleaningConfig>({ enabled: false, days: [], hours: '', costPerHour: 10, included: false, cleanerName: '', cleanerPhone: '' });
    const [isGdprOpen, setIsGdprOpen] = useState(false);
    const [isGdprChecked, setIsGdprChecked] = useState(false);
    const [signing, setSigning] = useState(false);

    // --- SYNC PROFILE ---
    useEffect(() => {
        if (currentUser) {
            const fetchUserData = async () => {
                let finalName = currentUser.displayName || 'Trabajador';
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as UserProfile;
                        setUserData(data);
                        if (data.name) finalName = data.name;
                        else if ((data as any).displayName) finalName = (data as any).displayName;
                    }
                } catch (e) { console.error(e); } finally { setWorkerName(finalName); }
            };
            fetchUserData();
        }
    }, [currentUser]);

    // --- MAIN DATA FETCHING ---
    useEffect(() => {
        if (!workerName || !currentUser) return;
        setLoading(true);

        const searchTerms = workerName.toLowerCase().split(' ').filter(part => part.length > 2);
        searchTerms.push(workerName.toLowerCase());

        const qTasks = query(collection(db, "tasks"));
        const unsubTasks = onSnapshot(qTasks, snapshot => {
            const allTasks: Task[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
            const tasksList = allTasks.filter(t => {
                const assignee = (t.assignee || '').toLowerCase();
                return searchTerms.some(term => assignee.includes(term));
            });
            tasksList.sort((a, b) => {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return dateA - dateB;
            });
            setMyTasks(tasksList);
            setLoading(false);
        }, (error) => {
            console.error("Error cargando tareas:", error);
            setLoading(false);
        });

        // --- PROPERTIES MERGE LOGIC (CRITICAL FOR SYNC) ---
        const unsubProps = onSnapshot(collection(db, "properties"), snapshot => {
            const firestorePropsMap: Record<string, Property> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                firestorePropsMap[doc.id] = {
                    ...data,
                    id: doc.id,
                    rooms: Array.isArray(data.rooms) ? data.rooms : []
                } as Property;
            });

            // 1. Start with static base
            const mergedProps: Property[] = [];

            // 2. Mix Static + Firestore Overrides
            staticProperties.forEach(staticProp => {
                if (firestorePropsMap[staticProp.id]) {
                    // Firestore version replaces static version (contains status updates/cleaning config)
                    mergedProps.push(firestorePropsMap[staticProp.id]);
                    delete firestorePropsMap[staticProp.id]; // Mark as handled
                } else {
                    mergedProps.push(staticProp);
                }
            });

            // 3. Add remaining purely Firestore properties (newly created)
            Object.values(firestorePropsMap).forEach(p => mergedProps.push(p));

            mergedProps.sort((a, b) => {
                const addrA = a.address || '';
                const addrB = b.address || '';
                return addrA.localeCompare(addrB);
            });
            setProperties(mergedProps);
        }, (error) => {
            console.error("Error cargando propiedades:", error);
        });

        const qCandidates = query(collection(db, "candidate_pipeline"));
        const unsubCandidates = onSnapshot(qCandidates, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Candidate));
            list.sort((a, b) => {
                const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
                const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
                return timeB - timeA;
            });
            setAllCandidates(list);
        }, (error) => {
            console.error("Error cargando candidatos:", error);
        });

        const qInvoices = query(collection(db, "worker_invoices"), where("workerId", "==", currentUser.uid));
        const unsubInvoices = onSnapshot(qInvoices, (snapshot) => {
            const list: WorkerInvoice[] = [];
            snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as WorkerInvoice));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setInvoices(list);
        }, (error) => {
            console.error("Error cargando facturas de trabajador:", error);
        });

        return () => { unsubTasks(); unsubProps(); unsubCandidates(); unsubInvoices(); };
    }, [workerName, currentUser]);

    // ... (Memorized filters and other helpers remain the same) ...
    const { assignedList, submittedList } = useMemo(() => {
        if (!workerName) return { assignedList: [], submittedList: [] };
        const lowerName = workerName.toLowerCase();
        const nameParts = lowerName.split(' ').filter(p => p.length > 2);
        const isMatch = (fieldValue: string | undefined) => {
            if (!fieldValue) return false;
            const lowerVal = fieldValue.toLowerCase();
            return lowerVal.includes(lowerName) || nameParts.some(part => lowerVal.includes(part));
        };
        return {
            assignedList: allCandidates.filter(c => isMatch(c.assignedTo)),
            submittedList: allCandidates.filter(c => isMatch(c.submittedBy))
        };
    }, [allCandidates, workerName]);

    const groupedAssignedVisits = useMemo(() => {
        const groups: Record<string, Candidate[]> = {};
        assignedList.forEach(c => {
            const prop = c.propertyName || 'Otras';
            if (!groups[prop]) groups[prop] = [];
            groups[prop].push(c);
        });
        return groups;
    }, [assignedList]);

    const toggleVisitProp = (prop: string) => { setExpandedVisitProps(prev => ({ ...prev, [prop]: !prev[prop] })); };

    const CandidateCardWorker: React.FC<{ c: Candidate }> = ({ c }) => (
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            {c.priority && (<div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg border-b border-l ${c.priority === 'Alta' ? 'bg-red-100 text-red-700 border-red-200' : c.priority === 'Media' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200'}`}> Prioridad {c.priority} </div>)}
            <div className="pr-12">
                <h4 className="font-bold text-gray-900 text-base">{c.candidateName}</h4>
                {candidateSubTab === 'submitted' && (<p className="text-gray-500 text-xs flex items-center gap-1 mt-1"> <Home className="w-3.5 h-3.5" /> {c.propertyName} </p>)}
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-400 text-[10px] italic flex items-center gap-1"> <Bed className="w-3 h-3" /> Interés: {c.roomName} </p>
                    {candidateSubTab === 'submitted' && (<span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${c.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : c.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}> {c.status === 'pending_review' ? 'Pendiente' : c.status === 'approved' ? 'Aprobado' : 'Rechazado'} </span>)}
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-3">
                {userData?.gdpr?.signed ? (
                    <div className="flex gap-2">
                        {c.candidatePhone && (<a href={`tel:${c.candidatePhone}`} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-100 flex items-center gap-1 hover:bg-green-100"> <Phone className="w-3 h-3" /> Llamar </a>)}
                        <a href={`https://api.whatsapp.com/send?phone=${c.candidatePhone}`} target="_blank" className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-green-600"> <MessageCircle className="w-3 h-3" /> WhatsApp </a>
                    </div>
                ) : (
                    <button onClick={() => setIsGdprOpen(true)} className="w-full bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"> <Lock className="w-3 h-3" /> Firmar Acuerdo para ver contacto </button>
                )}
                {candidateSubTab === 'assigned' && (
                    <div className="flex justify-end"> <button onClick={() => { const prop = properties.find(p => p.address === c.propertyName); if (prop) { const room = prop.rooms?.find(r => r.name === c.roomName) || prop.rooms?.[0]; setSelectedProperty(prop); setShowVisitLogModal(room || null); } else { alert("Propiedad no encontrada para registrar visita."); } }} className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline"> Registrar Resultado Visita <ArrowRight className="w-3 h-3" /> </button> </div>
                )}
            </div>
        </div>
    );

    const tasksByStatus = useMemo(() => { return myTasks.reduce((acc, task) => { const status = task.status || 'Pendiente'; if (!acc[status]) acc[status] = []; acc[status].push(task); return acc; }, {} as Record<string, Task[]>); }, [myTasks]);
    const filteredProperties = useMemo(() => {
        return properties.filter(p =>
            (p.address || '').toLowerCase().includes(roomSearch.toLowerCase()) ||
            (p.city || '').toLowerCase().includes(roomSearch.toLowerCase())
        );
    }, [properties, roomSearch]);
    const openImages = (images: string[], index = 0) => { setLightboxImages(images); setLightboxIndex(index); setIsLightboxOpen(true); };
    const getFeatureIcon = (id: string) => { switch (id) { case 'balcony': return <Sun className="w-3 h-3" />; case 'smart_tv': return <Tv className="w-3 h-3" />; case 'lock': return <Lock className="w-3 h-3" />; case 'desk': return <Monitor className="w-3 h-3" />; default: return <CheckCircle className="w-3 h-3" />; } };
    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => { await updateDoc(doc(db, "tasks", taskId), { status: newStatus }); if (newStatus === 'Completada') { const randomMsg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]; setCelebrationMessage(randomMsg); setTimeout(() => setCelebrationMessage(null), 3500); } };
    const handleSaveIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIncident.propertyId || !newIncident.title) return alert("Selecciona una propiedad y escribe un título.");
        const selectedProp = properties.find(p => p.id === newIncident.propertyId);
        const locationText = selectedProp?.address || 'Propiedad';
        const taskTitle = `INCIDENCIA: ${newIncident.title} (${locationText})`;

        await addDoc(collection(db, "tasks"), {
            title: taskTitle,
            description: newIncident.description,
            assignee: workerName,
            priority: newIncident.priority,
            status: 'Pendiente',
            category: 'Mantenimiento',
            boardId: 'incidents',
            propertyId: newIncident.propertyId,
            ownerId: selectedProp?.ownerId || null,
            createdAt: serverTimestamp(),
            dueDate: new Date().toISOString()
        });

        setShowIncidentModal(false);
        setNewIncident({ propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' });
        alert("Incidencia reportada correctamente.");
    };
    const handleSendCandidate = async (e: React.FormEvent) => { e.preventDefault(); if (!newCandidate.propertyId || !newCandidate.candidateName) { return alert("Completa los campos obligatorios: propiedad y nombre."); } const prop = properties.find(p => p.id === newCandidate.propertyId); const room = prop?.rooms?.find(r => r.id === newCandidate.roomId); try { await addDoc(collection(db, "candidate_pipeline"), { ...newCandidate, propertyName: prop?.address || 'N/A', ownerId: prop?.ownerId || null, roomName: room?.name || 'General / A definir', submittedBy: workerName, submittedAt: serverTimestamp(), status: 'pending_review' }); setShowCandidateModal(false); setNewCandidate({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '', priority: 'Media', sourcePlatform: '' }); alert('Candidato enviado a filtrado correctamente.'); } catch (error) { console.error(error); alert('Error al enviar candidato.'); } };
    const handleSaveVisit = async (e: React.FormEvent) => { e.preventDefault(); if (!showVisitLogModal || !selectedProperty) return; try { await addDoc(collection(db, "room_visits"), { propertyId: selectedProperty.id, propertyName: selectedProperty.address, roomId: showVisitLogModal.id, roomName: showVisitLogModal.name, workerName: workerName, visitDate: serverTimestamp(), outcome: newVisitData.outcome, comments: newVisitData.comments, commission: Number(newVisitData.commission) || 0 }); setShowVisitLogModal(null); setNewVisitData({ outcome: 'pending', comments: '', commission: 0 }); alert('Visita registrada correctamente.'); } catch (err) { console.error(err); alert('Error al registrar la visita.'); } };

    const startEditingCleaning = (prop: Property) => { setEditingCleaningPropId(prop.id); setCleaningConfigForm(prop.cleaningConfig || { enabled: false, days: [], hours: '', costPerHour: 10, included: false, cleanerName: '', cleanerPhone: '' }); };

    // UPDATED SAVE: Handle robust save for workers (create doc if needed)
    const handleCleaningSave = async () => {
        if (!editingCleaningPropId) return;

        try {
            const propToUpdate = properties.find(p => p.id === editingCleaningPropId);
            if (!propToUpdate) return;

            // We use setDoc with merge = true. 
            // This ensures if the document doesn't exist in Firestore yet (pure static property), it gets created with all fields.
            // If it exists, it just updates the cleaningConfig.
            await setDoc(doc(db, "properties", editingCleaningPropId), {
                ...propToUpdate, // Include full object just in case it's a new write
                cleaningConfig: cleaningConfigForm
            }, { merge: true });

            setEditingCleaningPropId(null);
            alert("Configuración actualizada.");
        } catch (e) {
            console.error(e);
            alert("Error al guardar configuración de limpieza.");
        }
    };

    const toggleCleaningDay = (day: string) => { setCleaningConfigForm(prev => { const newDays = prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]; return { ...prev, days: newDays }; }); };
    const handleUploadInvoice = async (e: React.FormEvent) => { e.preventDefault(); if (!invoiceFile || !newInvoice.amount || !newInvoice.concept) return alert("Completa todos los campos"); if (!currentUser) return; setIsUploadingInvoice(true); try { const fileName = `invoice_${Date.now()}_${invoiceFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`; const storageRef = ref(storage, `worker_invoices/${currentUser.uid}/${fileName}`); await uploadBytes(storageRef, invoiceFile); const url = await getDownloadURL(storageRef); await addDoc(collection(db, "worker_invoices"), { workerId: currentUser.uid, workerName: workerName, amount: parseFloat(newInvoice.amount), concept: newInvoice.concept, date: newInvoice.date, status: 'pending', fileUrl: url, fileName: invoiceFile.name, createdAt: serverTimestamp() }); setNewInvoice({ amount: '', concept: '', date: new Date().toISOString().split('T')[0] }); setInvoiceFile(null); alert("Factura subida correctamente."); } catch (error) { console.error(error); alert("Error al subir la factura."); } finally { setIsUploadingInvoice(false); } };
    const handleDeleteInvoice = async (invoice: WorkerInvoice) => { if (invoice.status === 'paid') return alert("No puedes borrar una factura ya pagada."); if (confirm("¿Eliminar esta factura pendiente?")) { try { await deleteDoc(doc(db, "worker_invoices", invoice.id)); } catch (error) { alert("Error al eliminar."); } } };

    const handleGdprAccept = async () => {
        if (!currentUser || !isGdprChecked) return;
        setSigning(true);
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                gdpr: {
                    signed: true,
                    signedAt: serverTimestamp(),
                    ip: 'recorded', // In a real app we might fetch IP
                    documentVersion: 'v1',
                    htmlSnapshot: WORKER_LEGAL_TEXT
                }
            });
            setIsGdprOpen(false);
            // Refresh user data (handled by onSnapshot in App or useEffect here depending on implementation, but here we have local state userData)
            setUserData(prev => prev ? { ...prev, gdpr: { ...prev.gdpr, signed: true } } : null);
            alert("Acuerdo firmado correctamente. Ahora puedes ver los datos de contacto.");
        } catch (error) {
            console.error(error);
            alert("Error al firmar.");
        } finally {
            setSigning(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'tasks':
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <NewsBanner />

                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Mis Tareas Asignadas</h2>
                                <p className="text-xs text-gray-500">{myTasks.filter(t => t.status !== 'Completada').length} pendientes</p>
                            </div>
                            <button onClick={() => setShowCompletedTasks(!showCompletedTasks)} className="text-xs text-rentia-blue font-bold hover:underline">
                                {showCompletedTasks ? 'Ocultar Completadas' : 'Ver Historial'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(tasksByStatus).map(([status, tasks]: [string, Task[]]) => {
                                if (!showCompletedTasks && status === 'Completada') return null;
                                return (
                                    <div key={status} className="space-y-3">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            {status === 'Pendiente' && <Clock className="w-3 h-3" />}
                                            {status === 'En Curso' && <Loader2 className="w-3 h-3" />}
                                            {status === 'Completada' && <CheckCircle className="w-3 h-3" />}
                                            {status} ({tasks.length})
                                        </h3>
                                        {tasks.map(task => (
                                            <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                                        ))}
                                    </div>
                                );
                            })}
                            {myTasks.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-400">
                                    <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No tienes tareas asignadas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'candidates':
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit mb-4">
                            <button onClick={() => setCandidateSubTab('assigned')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${candidateSubTab === 'assigned' ? 'bg-rentia-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Mis Visitas ({assignedList.length})</button>
                            <button onClick={() => setCandidateSubTab('submitted')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${candidateSubTab === 'submitted' ? 'bg-rentia-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Mis Captaciones ({submittedList.length})</button>
                        </div>

                        {candidateSubTab === 'assigned' ? (
                            <div className="space-y-4">
                                {Object.entries(groupedAssignedVisits).map(([propName, cands]: [string, Candidate[]]) => (
                                    <div key={propName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleVisitProp(propName)}>
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-rentia-blue" /> {propName}</h3>
                                            <div className="flex items-center gap-3"><span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cands.length}</span>{expandedVisitProps[propName] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}</div>
                                        </div>
                                        {expandedVisitProps[propName] && (
                                            <div className="p-4 grid gap-3 border-t border-gray-100 animate-in slide-in-from-top-2">
                                                {cands.map(c => <CandidateCardWorker key={c.id} c={c} />)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {assignedList.length === 0 && <div className="text-center py-12 text-gray-400"><p>No tienes visitas asignadas pendientes.</p></div>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {submittedList.map(c => <CandidateCardWorker key={c.id} c={c} />)}
                                {submittedList.length === 0 && <div className="col-span-full text-center py-12 text-gray-400"><p>No has enviado candidatos todavía.</p></div>}
                            </div>
                        )}
                    </div>
                );

            case 'rooms':
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="relative mb-4"><Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" /><input type="text" placeholder="Buscar propiedad..." className="w-full pl-10 pr-4 py-2 border rounded-xl shadow-sm focus:ring-2 focus:ring-rentia-blue outline-none" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProperties.map((p: Property) => (
                                <div key={p.id} onClick={() => setSelectedProperty(p)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all group" title={`Ver detalles de ${p.address}`}>
                                    <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-gray-800 line-clamp-1 group-hover:text-rentia-blue">{p.address}</h4><span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{p.rooms?.length || 0} Habs</span></div>
                                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</p>
                                    <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                        {p.rooms?.map((r: Room) => (
                                            <div key={r.id} className={`w-3 h-3 rounded-full flex-shrink-0 ${r.status === 'available' ? 'bg-green-500' : r.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'}`} title={`H${r.name}: ${r.status}`}></div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-xs">
                                        <span className="font-bold text-gray-400 group-hover:text-rentia-blue">Ver detalles</span>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rentia-blue" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'cleaning':
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> Configuración de Limpieza</h3>
                            <div className="space-y-4">
                                {properties.map(p => (
                                    <div key={p.id} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-sm text-gray-800">{p.address}</h4>
                                            {editingCleaningPropId === p.id ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingCleaningPropId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                                                    <button onClick={handleCleaningSave} className="text-xs bg-green-600 text-white px-3 py-1 rounded font-bold hover:bg-green-700">Guardar</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEditingCleaning(p)} className="text-xs text-blue-600 font-bold hover:underline">Editar</button>
                                            )}
                                        </div>

                                        {editingCleaningPropId === p.id ? (
                                            <div className="bg-white p-3 rounded border border-blue-100 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-600">Activo</span>
                                                    <label className="relative inline-flex items-center cursor-pointer" title="Activar/Desactivar servicio">
                                                        <input type="checkbox" className="sr-only peer" checked={cleaningConfigForm.enabled} onChange={e => setCleaningConfigForm({ ...cleaningConfigForm, enabled: e.target.checked })} aria-label="Activar servicio de limpieza" />
                                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                                    </label>
                                                </div>
                                                {cleaningConfigForm.enabled && (
                                                    <>
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-600 block mb-1">Días</span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                                                    <button key={d} onClick={() => toggleCleaningDay(d)} className={`px-2 py-1 text-[10px] rounded border ${cleaningConfigForm.days.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{d.slice(0, 3)}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input type="text" placeholder="Horario" className="w-full p-1.5 border rounded text-xs" value={cleaningConfigForm.hours} onChange={e => setCleaningConfigForm({ ...cleaningConfigForm, hours: e.target.value })} />
                                                            <input type="number" placeholder="Coste/h" className="w-full p-1.5 border rounded text-xs" value={cleaningConfigForm.costPerHour} onChange={e => setCleaningConfigForm({ ...cleaningConfigForm, costPerHour: Number(e.target.value) })} />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input type="tel" placeholder="Teléfono Limpiadora" className="w-full p-1.5 border rounded text-xs" value={cleaningConfigForm.cleanerPhone} onChange={e => setCleaningConfigForm({ ...cleaningConfigForm, cleanerPhone: e.target.value })} title="Teléfono de la limpiadora" />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">
                                                {p.cleaningConfig?.enabled ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Servicio Activo</span>
                                                        <span>{p.cleaningConfig.days.join(', ')} • {p.cleaningConfig.hours}</span>
                                                        <span>{p.cleaningConfig.costPerHour}€ / h • <span className="text-indigo-600 font-bold">{p.cleaningConfig.cleanerName?.split(' ')[0] || 'Limpiadora'}</span> ({p.cleaningConfig.cleanerPhone ? `${p.cleaningConfig.cleanerPhone.slice(0, 6)}***${p.cleaningConfig.cleanerPhone.slice(-3)}` : 'Sin tlf'})</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Servicio inactivo</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'invoices':
                return (
                    <div className="space-y-6 animate-in fade-in">
                        {/* Invoice Form */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Receipt className="w-5 h-5 text-rentia-blue" /> Subir Factura</h3>
                            <form onSubmit={handleUploadInvoice} className="space-y-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Concepto *</label><input type="text" required className="w-full p-2 border rounded-lg text-sm" placeholder="Ej: Comisión Alquiler H3" value={newInvoice.concept} onChange={e => setNewInvoice({ ...newInvoice, concept: e.target.value })} title="Concepto de la factura" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Importe (€) *</label><input type="number" step="0.01" required className="w-full p-2 border rounded-lg text-sm" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })} title="Importe de la factura" placeholder="0.00" /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fecha *</label><input type="date" required className="w-full p-2 border rounded-lg text-sm" value={newInvoice.date} onChange={e => setNewInvoice({ ...newInvoice, date: e.target.value })} title="Fecha de la factura" /></div>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                                    <input type="file" required onChange={e => setInvoiceFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                                    <div className="flex flex-col items-center gap-1 text-gray-500">
                                        {invoiceFile ? <span className="text-rentia-blue font-bold text-xs">{invoiceFile.name}</span> : <><Upload className="w-5 h-5" /><span className="text-xs">Adjuntar Archivo</span></>}
                                    </div>
                                </div>
                                <div className="flex justify-end"><button type="submit" disabled={isUploadingInvoice} className="bg-rentia-black text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800" title="Subir factura">{isUploadingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Subir Factura</button></div>
                            </form>
                        </div>

                        {/* Invoice List */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-gray-700 text-sm uppercase">Mis Facturas</h4>
                            {invoices.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 border border-dashed rounded-lg bg-gray-50">No has subido facturas aún.</div>
                            ) : (
                                invoices.map(inv => (
                                    <div key={inv.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                                        <div>
                                            <h5 className="font-bold text-gray-800 text-sm">{inv.concept}</h5>
                                            <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()} • <span className={inv.status === 'paid' ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>{inv.status === 'paid' ? 'PAGADA' : 'PENDIENTE'}</span></p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-lg text-gray-800">{inv.amount}€</span>
                                            <div className="flex gap-2">
                                                <a href={inv.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Descargar factura"><Download className="w-4 h-4" /></a>
                                                {inv.status === 'pending' && <button onClick={() => handleDeleteInvoice(inv)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar factura"><Trash2 className="w-4 h-4" /></button>}
                                                {inv.status === 'paid' && inv.paymentProofUrl && (
                                                    <a href={inv.paymentProofUrl} target="_blank" rel="noreferrer" className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Ver Justificante Pago"><FileCheck className="w-4 h-4" /></a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'protocols':
                return (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-0"></div>

                            <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-gray-900 relative z-10">
                                <Shield className="w-6 h-6 text-rentia-blue" />
                                Central de Soporte y Ayuda
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                {/* Admin Contact */}
                                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-center gap-4 transition-all hover:bg-white hover:shadow-md group">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{adminContact.role}</p>
                                            <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full">{adminContact.startHour}:00 - {adminContact.endHour}:00</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900">{adminContact.name}</h4>
                                        <div className="flex gap-3 mt-2">
                                            <a href={`tel:+${adminContact.phone}`} className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors" title={`Llamar a ${adminContact.name}`}>
                                                <Phone className="w-3.5 h-3.5" /> +{adminContact.phone.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')}
                                            </a>
                                            <a href={`https://wa.me/${adminContact.phone}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-green-600 hover:opacity-80 flex items-center gap-1" title={`WhatsApp a ${adminContact.name}`}>
                                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Director Contact */}
                                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-center gap-4 transition-all hover:bg-white hover:shadow-md group">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{directorContact.role}</p>
                                            <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full">{directorContact.startHour}:00 - {directorContact.endHour}:00</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900">{directorContact.name}</h4>
                                        <div className="flex gap-3 mt-2">
                                            <a href={`tel:+${directorContact.phone}`} className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors" title={`Llamar a ${directorContact.name}`}>
                                                <Phone className="w-3.5 h-3.5" /> +{directorContact.phone.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')}
                                            </a>
                                            <a href={`https://wa.me/${directorContact.phone}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-green-600 hover:opacity-80 flex items-center gap-1" title={`WhatsApp a ${directorContact.name}`}>
                                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Horario de Atención de Oficina</p>
                                        <p className="text-blue-100 text-xs mt-1 leading-relaxed">
                                            Nuestro equipo de gestión está disponible para resolver cualquier duda administrativa o operativa de **Lunes a Viernes de 9:00 a 14:00**.
                                            Fuera de este horario, por favor deja un mensaje y te atenderemos lo antes posible.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!workerName) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue" /></div>;

    return (
        <div className="min-h-[100dvh] bg-[#f8fbff] font-sans pb-32">
            {celebrationMessage && createPortal(<div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[10000] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none"><div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-md"><Sparkles className="w-5 h-5 text-yellow-300 animate-pulse fill-current" /><span className="font-bold text-sm md:text-base tracking-wide text-shadow-sm">{celebrationMessage}</span><Trophy className="w-5 h-5 text-yellow-300" /></div></div>, document.body)}

            {/* MODERN APP HEADER */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-5 flex justify-between items-center shadow-sm">
                <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-0.5">Rentia Portal</p>
                    <h1 className="text-xl font-black text-gray-900 leading-none">Hola, {workerName.split(' ')[0]} 👋</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20">
                        {workerName.charAt(0)}
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto p-6">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-pulse">
                        <Siren className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {renderContent()}
                </main>

                {/* APP-LIKE FAB DESIGN */}
                <div className="fixed bottom-28 right-6 z-40 flex flex-col gap-3">
                    {activeTab === 'tasks' && (
                        <button
                            onClick={() => setShowIncidentModal(true)}
                            className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-[2rem] shadow-2xl shadow-rose-500/40 flex items-center justify-center active:scale-90 transition-all group scale-100 hover:scale-110"
                            title="Reportar incidencia"
                        >
                            <AlertTriangle className="w-8 h-8 drop-shadow-md" />
                        </button>
                    )}
                    {activeTab === 'candidates' && (
                        <button
                            onClick={() => setShowCandidateModal(true)}
                            className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] shadow-2xl shadow-emerald-500/40 flex items-center justify-center active:scale-90 transition-all group scale-100 hover:scale-110"
                            title="Añadir candidato"
                        >
                            <UserPlus className="w-8 h-8 drop-shadow-md" />
                        </button>
                    )}
                </div>

                {/* PREMIUM TAB BAR */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] grid grid-cols-6 z-50 px-2 pb-8 pt-4">
                    {[
                        { id: 'tasks', icon: ClipboardList, label: 'Tareas' },
                        { id: 'candidates', icon: Users, label: 'Visitas' },
                        { id: 'rooms', icon: Grid, label: 'Stocks' },
                        { id: 'cleaning', icon: Sparkles, iconClass: 'text-purple-500', label: 'Limpieza' },
                        { id: 'invoices', icon: Receipt, label: 'Pagos' },
                        { id: 'protocols', icon: Shield, label: 'Ayuda' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
                        >
                            {activeTab === item.id && (
                                <span className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full animate-ping" />
                            )}
                            <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-blue-500/10' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className={`text-[9px] font-black uppercase tracking-wider ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Modals included (VisitLog, Incident, Candidate, etc.) */}
            {selectedProperty && createPortal(
                <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in slide-in-from-bottom-10">
                    <div className="flex-shrink-0 bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 border-b border-gray-100">
                        <button onClick={() => setSelectedProperty(null)} className="flex items-center gap-1 text-rentia-blue text-sm font-bold p-2 -ml-2" title="Volver al listado">
                            <ChevronLeft className="w-5 h-5" /> Volver
                        </button>
                        <h2 className="font-bold text-sm truncate max-w-[50%]">{selectedProperty.address}</h2>
                        <a href={selectedProperty.googleMapsLink} target="_blank" rel="noreferrer" className="p-2 text-gray-500" title="Ver en Google Maps">
                            <MapPin className="w-5 h-5" />
                        </a>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 pb-20">
                        {(selectedProperty.rooms || []).map((room: Room) => (
                            <div key={room.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 text-lg">{room.name}</h4>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${room.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {room.status}
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-rentia-blue mb-3">
                                    {room.price}€<span className="text-sm font-normal text-gray-400">/mes</span>
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                                    {room.images && room.images.length > 0 && (
                                        <button onClick={() => openImages(room.images!, 0)} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> {room.images.length} fotos
                                        </button>
                                    )}
                                    {room.features && room.features.map((f: string) => (
                                        <div key={f} className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                            {getFeatureIcon(f)} {f}
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-gray-100">
                                    <button onClick={() => setShowVisitLogModal(room)} className="w-full bg-indigo-50 text-indigo-700 text-sm font-bold py-3 rounded-lg border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors">
                                        <Eye className="w-4 h-4" /> Registrar Visita
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}

            {showVisitLogModal && createPortal(<div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowVisitLogModal(null)}><form onSubmit={handleSaveVisit} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-500" /> Registrar Visita a {showVisitLogModal.name}</h3><button type="button" onClick={() => setShowVisitLogModal(null)} className="p-2 -mr-2" title="Cerrar"><X className="w-5 h-5 text-gray-400" /></button></div><div className="p-4 space-y-4 overflow-y-auto"><div><label className="text-xs font-bold text-gray-500 block mb-1">Resultado de la Visita</label><select required className="w-full p-2 border rounded text-sm" value={newVisitData.outcome} onChange={e => setNewVisitData({ ...newVisitData, outcome: e.target.value as any })} title="Resultado de la Visita"><option value="successful">Exitosa</option><option value="unsuccessful">No exitosa</option><option value="pending">Pendiente de respuesta</option></select></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Comentarios / Pegas</label><textarea placeholder="Ej: Le ha gustado pero le parece pequeña..." className="w-full p-2 border rounded text-sm h-24" value={newVisitData.comments} onChange={e => setNewVisitData({ ...newVisitData, comments: e.target.value })} title="Comentarios de la visita"></textarea></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Comisión Propuesta al Inquilino (€)</label><input type="number" placeholder="Ej: 150" className="w-full p-2 border rounded text-sm" value={newVisitData.commission} onChange={e => setNewVisitData({ ...newVisitData, commission: Number(e.target.value) })} title="Comisión propuesta" /></div></div><div className="p-4 bg-gray-50 border-t flex gap-2"><button type="button" onClick={() => setShowVisitLogModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200" title="Cancelar">Cancelar</button><button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700" title="Guardar Visita"><Send className="w-4 h-4" /> Guardar Visita</button></div></form></div>, document.body)}
            {showIncidentModal && createPortal(<div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowIncidentModal(false)}><form onSubmit={handleSaveIncident} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Reportar Incidencia</h3><button type="button" onClick={() => setShowIncidentModal(false)} className="p-2 -mr-2" title="Cerrar"><X className="w-5 h-5 text-gray-400" /></button></div><div className="p-4 space-y-4 overflow-y-auto"><select required className="w-full p-2 border rounded text-sm" value={newIncident.propertyId} onChange={e => setNewIncident({ ...newIncident, propertyId: e.target.value })} title="Seleccionar Propiedad"><option value="">Seleccionar Propiedad*</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select><input required type="text" placeholder="Título Incidencia*" className="w-full p-2 border rounded text-sm" value={newIncident.title} onChange={e => setNewIncident({ ...newIncident, title: e.target.value })} title="Título de la incidencia" /><textarea placeholder="Descripción detallada..." className="w-full p-2 border rounded text-sm h-24" value={newIncident.description} onChange={e => setNewIncident({ ...newIncident, description: e.target.value })} title="Descripción de la incidencia"></textarea><select className="w-full p-2 border rounded text-sm" value={newIncident.priority} onChange={e => setNewIncident({ ...newIncident, priority: e.target.value as any })} title="Prioridad de la incidencia"><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option></select></div><div className="p-4 bg-gray-50 border-t flex gap-2"><button type="button" onClick={() => setShowIncidentModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200" title="Cancelar">Cancelar</button><button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700" title="Enviar Reporte"><Send className="w-4 h-4" /> Enviar Reporte</button></div></form></div>, document.body)}
            {showCandidateModal && createPortal(
                <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCandidateModal(false)}>
                    <form onSubmit={handleSendCandidate} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" /> Enviar Candidato</h3>
                            <button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 -mr-2" title="Cerrar"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Propiedad*</label><select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({ ...newCandidate, propertyId: e.target.value, roomId: '' })} title="Seleccionar Propiedad"><option value="">Seleccionar...</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select></div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Habitación (Opcional)</label>
                                <select disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({ ...newCandidate, roomId: e.target.value })} title="Seleccionar Habitación">
                                    <option value="">Seleccionar...</option>
                                    {(properties.find(p => p.id === newCandidate.propertyId)?.rooms || []).map((r: Room) => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                                    ))}
                                </select>
                            </div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Nombre Candidato*</label><input required type="text" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateName} onChange={e => setNewCandidate({ ...newCandidate, candidateName: e.target.value })} title="Nombre del candidato" placeholder="Nombre completo" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Teléfono</label><input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({ ...newCandidate, candidatePhone: e.target.value })} title="Teléfono del candidato" placeholder="Ej: 600000000" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Email</label><input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({ ...newCandidate, candidateEmail: e.target.value })} title="Email del candidato" placeholder="email@ejemplo.com" /></div>
                            </div>
                            {/* Selector de Prioridad NUEVO */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Siren className="w-3 h-3" /> Urgencia / Prioridad</label>
                                <select
                                    className="w-full p-2 border rounded text-sm bg-white"
                                    value={newCandidate.priority}
                                    onChange={e => setNewCandidate({ ...newCandidate, priority: e.target.value as any })}
                                    title="Prioridad del candidato"
                                >
                                    <option value="Alta">🔴 Alta - Muy Interesado / Urgente</option>
                                    <option value="Media">🟡 Media - Interesado normal</option>
                                    <option value="Baja">🟢 Baja - Solo curiosidad / Futuro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Plataforma de Origen</label>
                                <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Ej: Idealista, Facebook, Referido..." value={newCandidate.sourcePlatform} onChange={e => setNewCandidate({ ...newCandidate, sourcePlatform: e.target.value })} title="Plataforma de origen" />
                            </div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Info Adicional</label><textarea className="w-full p-2 border rounded text-sm h-20" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({ ...newCandidate, additionalInfo: e.target.value })} title="Información adicional" placeholder="Notas sobre el candidato..." /></div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex gap-2">
                            <button type="button" onClick={() => setShowCandidateModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button>
                            <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700"><Send className="w-4 h-4" /> Enviar a Pipeline</button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
            {isLightboxOpen && <ImageLightbox images={lightboxImages} selectedIndex={lightboxIndex} onClose={() => setIsLightboxOpen(false)} />}

            {/* GDPR MODAL */}
            {isGdprOpen && (
                <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 bg-red-600 text-white border-b border-red-700 flex justify-between items-center shrink-0">
                            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5" /> Acuerdo de Confidencialidad</h2>
                            <button onClick={() => setIsGdprOpen(false)} title="Cerrar"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto leading-relaxed text-gray-600 text-sm space-y-4 bg-gray-50 flex-grow custom-scrollbar">
                            <p className="font-bold text-gray-900 text-base md:text-lg mb-2">Importante: Deber de Secreto</p>
                            <p>Para acceder a los datos de contacto de candidatos y clientes, es obligatorio por Ley (RGPD) formalizar un compromiso de confidencialidad.</p>

                            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mt-4 text-xs md:text-sm">
                                <div dangerouslySetInnerHTML={{ __html: WORKER_LEGAL_TEXT }} />
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <label className="flex items-start gap-3 cursor-pointer p-4 bg-white rounded-xl border border-gray-200 hover:border-red-600 transition-all shadow-sm">
                                    <input
                                        type="checkbox"
                                        className="mt-1 w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-600 cursor-pointer"
                                        checked={isGdprChecked}
                                        onChange={(e) => setIsGdprChecked(e.target.checked)}
                                    />
                                    <div className="text-sm text-gray-700">
                                        <strong>He leído y comprendo mis obligaciones</strong> respecto a la protección de datos y confidencialidad. Acepto el compromiso legal.
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-white flex justify-end gap-3 items-center shrink-0">
                            <button onClick={() => setIsGdprOpen(false)} className="text-gray-500 hover:underline text-sm font-bold px-4">Cancelar</button>
                            <button
                                onClick={handleGdprAccept}
                                disabled={!isGdprChecked || signing}
                                className={`px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all w-full md:w-auto text-sm ${!isGdprChecked || signing
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                                    }`}
                                title="Aceptar y Firmar compromiso"
                            >
                                {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MousePointerClick className="w-4 h-4" />}
                                Aceptar y Firmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};