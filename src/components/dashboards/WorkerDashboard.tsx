import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db, storage } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, orderBy, limit, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { Task, TaskStatus, Candidate, CandidateStatus, VisitOutcome, RoomVisit, InternalNews, WorkerInvoice, UserProfile } from '../../types';
import { properties as staticProperties, Property, Room, CleaningConfig } from '../../data/rooms';
import { ClipboardList, Home, CheckCircle, Clock, AlertCircle, MapPin, Search, Calendar, Wrench, Plus, X, AlertTriangle, ChevronLeft, Loader2, WifiOff, Monitor, Tv, Lock, Sun, Bed, Layout, Image as ImageIcon, UserPlus, Send, Users, UserX, UserCheck, ChevronRight, Eye, Megaphone, Bell, ChevronDown, Sparkles, Trophy, Euro, Save, Receipt, Trash2, Download, Upload, FileCheck, Siren, ArrowRight, Phone, MessageCircle, Shield, MousePointerClick, Briefcase, Footprints, BarChart3, Building, Grid, Globe, FileText } from 'lucide-react';
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
    <div className={`bg-white p-4 rounded-xl shadow-sm relative transition-all duration-300 ${getTaskContainerStyles(task)}`}>
        <div className="flex justify-between items-start mb-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>{task.priority}</span><div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded flex items-center gap-1 border border-gray-100">{task.category === 'Mantenimiento' && <Wrench className="w-3 h-3" />}{task.category}</div></div>
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
    // ... State setup ...
    const { currentUser } = useAuth();
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
    const [cleaningConfigForm, setCleaningConfigForm] = useState<CleaningConfig>({ enabled: false, days: [], hours: '', costPerHour: 10, included: false });
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
                firestorePropsMap[doc.id] = { ...doc.data(), id: doc.id } as Property;
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

            mergedProps.sort((a, b) => a.address.localeCompare(b.address));
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
    const filteredProperties = useMemo(() => { return properties.filter(p => p.address.toLowerCase().includes(roomSearch.toLowerCase()) || p.city.toLowerCase().includes(roomSearch.toLowerCase())); }, [properties, roomSearch]);
    const openImages = (images: string[], index = 0) => { setLightboxImages(images); setLightboxIndex(index); setIsLightboxOpen(true); };
    const getFeatureIcon = (id: string) => { switch (id) { case 'balcony': return <Sun className="w-3 h-3" />; case 'smart_tv': return <Tv className="w-3 h-3" />; case 'lock': return <Lock className="w-3 h-3" />; case 'desk': return <Monitor className="w-3 h-3" />; default: return <CheckCircle className="w-3 h-3" />; } };
    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => { await updateDoc(doc(db, "tasks", taskId), { status: newStatus }); if (newStatus === 'Completada') { const randomMsg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]; setCelebrationMessage(randomMsg); setTimeout(() => setCelebrationMessage(null), 3500); } };
    const handleSaveIncident = async (e: React.FormEvent) => { e.preventDefault(); if (!newIncident.propertyId || !newIncident.title) return alert("Selecciona una propiedad y escribe un título."); const selectedProp = properties.find(p => p.id === newIncident.propertyId); const locationText = selectedProp?.address || 'Propiedad'; const taskTitle = `INCIDENCIA: ${newIncident.title} (${locationText})`; await addDoc(collection(db, "tasks"), { title: taskTitle, description: newIncident.description, assignee: workerName, priority: newIncident.priority, status: 'Pendiente', category: 'Mantenimiento', boardId: 'incidents', createdAt: serverTimestamp(), dueDate: new Date().toISOString() }); setShowIncidentModal(false); setNewIncident({ propertyId: '', roomId: 'common', title: '', description: '', priority: 'Media' }); alert("Incidencia reportada correctamente."); };
    const handleSendCandidate = async (e: React.FormEvent) => { e.preventDefault(); if (!newCandidate.propertyId || !newCandidate.candidateName) { return alert("Completa los campos obligatorios: propiedad y nombre."); } const prop = properties.find(p => p.id === newCandidate.propertyId); const room = prop?.rooms?.find(r => r.id === newCandidate.roomId); try { await addDoc(collection(db, "candidate_pipeline"), { ...newCandidate, propertyName: prop?.address || 'N/A', ownerId: prop?.ownerId || null, roomName: room?.name || 'General / A definir', submittedBy: workerName, submittedAt: serverTimestamp(), status: 'pending_review' }); setShowCandidateModal(false); setNewCandidate({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '', priority: 'Media', sourcePlatform: '' }); alert('Candidato enviado a filtrado correctamente.'); } catch (error) { console.error(error); alert('Error al enviar candidato.'); } };
    const handleSaveVisit = async (e: React.FormEvent) => { e.preventDefault(); if (!showVisitLogModal || !selectedProperty) return; try { await addDoc(collection(db, "room_visits"), { propertyId: selectedProperty.id, propertyName: selectedProperty.address, roomId: showVisitLogModal.id, roomName: showVisitLogModal.name, workerName: workerName, visitDate: serverTimestamp(), outcome: newVisitData.outcome, comments: newVisitData.comments, commission: Number(newVisitData.commission) || 0 }); setShowVisitLogModal(null); setNewVisitData({ outcome: 'pending', comments: '', commission: 0 }); alert('Visita registrada correctamente.'); } catch (err) { console.error(err); alert('Error al registrar la visita.'); } };

    const startEditingCleaning = (prop: Property) => { setEditingCleaningPropId(prop.id); setCleaningConfigForm(prop.cleaningConfig || { enabled: false, days: [], hours: '', costPerHour: 10, included: false }); };

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
                                <div key={p.id} onClick={() => setSelectedProperty(p)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all group">
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
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" checked={cleaningConfigForm.enabled} onChange={e => setCleaningConfigForm({ ...cleaningConfigForm, enabled: e.target.checked })} />
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
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">
                                                {p.cleaningConfig?.enabled ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Servicio Activo</span>
                                                        <span>{p.cleaningConfig.days.join(', ')} • {p.cleaningConfig.hours}</span>
                                                        <span>{p.cleaningConfig.costPerHour}€ / hora</span>
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
                                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Concepto *</label><input type="text" required className="w-full p-2 border rounded-lg text-sm" placeholder="Ej: Comisión Alquiler H3" value={newInvoice.concept} onChange={e => setNewInvoice({ ...newInvoice, concept: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Importe (€) *</label><input type="number" step="0.01" required className="w-full p-2 border rounded-lg text-sm" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fecha *</label><input type="date" required className="w-full p-2 border rounded-lg text-sm" value={newInvoice.date} onChange={e => setNewInvoice({ ...newInvoice, date: e.target.value })} /></div>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                                    <input type="file" required onChange={e => setInvoiceFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                                    <div className="flex flex-col items-center gap-1 text-gray-500">
                                        {invoiceFile ? <span className="text-rentia-blue font-bold text-xs">{invoiceFile.name}</span> : <><Upload className="w-5 h-5" /><span className="text-xs">Adjuntar Archivo</span></>}
                                    </div>
                                </div>
                                <div className="flex justify-end"><button type="submit" disabled={isUploadingInvoice} className="bg-rentia-black text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800">{isUploadingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Subir Factura</button></div>
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
                                                <a href={inv.fileUrl} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Download className="w-4 h-4" /></a>
                                                {inv.status === 'pending' && <button onClick={() => handleDeleteInvoice(inv)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
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
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-600"><FileText className="w-5 h-5" /> Mis Protocolos de Trabajo</h3>
                            <p className="text-sm text-gray-500 mb-6">Consulta tus guías y claves de acceso corporativas.</p>

                            {/* Incluimos la vista de protocolos específica que estaba en staff */}
                            <div className="border-t pt-2">
                                <ProtocolsView />
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
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] grid grid-cols-6 z-50">
                    <button onClick={() => setActiveTab('tasks')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'tasks' ? 'text-rentia-blue' : 'text-gray-400'}`}><ClipboardList className="w-6 h-6" /><span className="text-[9px] font-bold">Tareas</span></button>
                    <button onClick={() => setActiveTab('candidates')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'candidates' ? 'text-rentia-blue' : 'text-gray-400'}`}><Users className="w-6 h-6" /><span className="text-[9px] font-bold">Candidatos</span></button>
                    <button onClick={() => setActiveTab('rooms')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'rooms' ? 'text-rentia-blue' : 'text-gray-400'}`}><Home className="w-6 h-6" /><span className="text-[9px] font-bold">Catálogo</span></button>
                    <button onClick={() => setActiveTab('cleaning')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'cleaning' ? 'text-rentia-blue' : 'text-gray-400'}`}><Sparkles className="w-6 h-6" /><span className="text-[9px] font-bold">Limpieza</span></button>
                    <button onClick={() => setActiveTab('invoices')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'invoices' ? 'text-rentia-blue' : 'text-gray-400'}`}><Receipt className="w-6 h-6" /><span className="text-[9px] font-bold">Facturas</span></button>
                    <button onClick={() => setActiveTab('protocols')} className={`py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'protocols' ? 'text-rentia-blue' : 'text-gray-400'}`}><FileText className="w-6 h-6" /><span className="text-[9px] font-bold">Ayuda</span></button>
                </div>
            </div>

            {/* Modals included (VisitLog, Incident, Candidate, etc.) */}
            {selectedProperty && createPortal(
                <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in slide-in-from-bottom-10">
                    <div className="flex-shrink-0 bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 border-b border-gray-100">
                        <button onClick={() => setSelectedProperty(null)} className="flex items-center gap-1 text-rentia-blue text-sm font-bold p-2 -ml-2">
                            <ChevronLeft className="w-5 h-5" /> Volver
                        </button>
                        <h2 className="font-bold text-sm truncate max-w-[50%]">{selectedProperty.address}</h2>
                        <a href={selectedProperty.googleMapsLink} target="_blank" rel="noreferrer" className="p-2 text-gray-500">
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

            {showVisitLogModal && createPortal(<div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowVisitLogModal(null)}><form onSubmit={handleSaveVisit} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-500" /> Registrar Visita a {showVisitLogModal.name}</h3><button type="button" onClick={() => setShowVisitLogModal(null)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400" /></button></div><div className="p-4 space-y-4 overflow-y-auto"><div><label className="text-xs font-bold text-gray-500 block mb-1">Resultado de la Visita</label><select required className="w-full p-2 border rounded text-sm" value={newVisitData.outcome} onChange={e => setNewVisitData({ ...newVisitData, outcome: e.target.value as any })}><option value="successful">Exitosa</option><option value="unsuccessful">No exitosa</option><option value="pending">Pendiente de respuesta</option></select></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Comentarios / Pegas</label><textarea placeholder="Ej: Le ha gustado pero le parece pequeña..." className="w-full p-2 border rounded text-sm h-24" value={newVisitData.comments} onChange={e => setNewVisitData({ ...newVisitData, comments: e.target.value })}></textarea></div><div><label className="text-xs font-bold text-gray-500 block mb-1">Comisión Propuesta al Inquilino (€)</label><input type="number" placeholder="Ej: 150" className="w-full p-2 border rounded text-sm" value={newVisitData.commission} onChange={e => setNewVisitData({ ...newVisitData, commission: Number(e.target.value) })} /></div></div><div className="p-4 bg-gray-50 border-t flex gap-2"><button type="button" onClick={() => setShowVisitLogModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button><button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"><Send className="w-4 h-4" /> Guardar Visita</button></div></form></div>, document.body)}
            {showIncidentModal && createPortal(<div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowIncidentModal(false)}><form onSubmit={handleSaveIncident} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Reportar Incidencia</h3><button type="button" onClick={() => setShowIncidentModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400" /></button></div><div className="p-4 space-y-4 overflow-y-auto"><select required className="w-full p-2 border rounded text-sm" value={newIncident.propertyId} onChange={e => setNewIncident({ ...newIncident, propertyId: e.target.value })}><option value="">Seleccionar Propiedad*</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select><input required type="text" placeholder="Título Incidencia*" className="w-full p-2 border rounded text-sm" value={newIncident.title} onChange={e => setNewIncident({ ...newIncident, title: e.target.value })} /><textarea placeholder="Descripción detallada..." className="w-full p-2 border rounded text-sm h-24" value={newIncident.description} onChange={e => setNewIncident({ ...newIncident, description: e.target.value })}></textarea><select className="w-full p-2 border rounded text-sm" value={newIncident.priority} onChange={e => setNewIncident({ ...newIncident, priority: e.target.value as any })}><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option></select></div><div className="p-4 bg-gray-50 border-t flex gap-2"><button type="button" onClick={() => setShowIncidentModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button><button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700"><Send className="w-4 h-4" /> Enviar Reporte</button></div></form></div>, document.body)}
            {showCandidateModal && createPortal(
                <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCandidateModal(false)}>
                    <form onSubmit={handleSendCandidate} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" /> Enviar Candidato</h3>
                            <button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Propiedad*</label><select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({ ...newCandidate, propertyId: e.target.value, roomId: '' })}><option value="">Seleccionar...</option>{properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select></div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Habitación (Opcional)</label>
                                <select disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({ ...newCandidate, roomId: e.target.value })}>
                                    <option value="">Seleccionar...</option>
                                    {(properties.find(p => p.id === newCandidate.propertyId)?.rooms || []).map((r: Room) => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                                    ))}
                                </select>
                            </div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Nombre Candidato*</label><input required type="text" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateName} onChange={e => setNewCandidate({ ...newCandidate, candidateName: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Teléfono</label><input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({ ...newCandidate, candidatePhone: e.target.value })} /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Email</label><input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({ ...newCandidate, candidateEmail: e.target.value })} /></div>
                            </div>
                            {/* Selector de Prioridad NUEVO */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Siren className="w-3 h-3" /> Urgencia / Prioridad</label>
                                <select
                                    className="w-full p-2 border rounded text-sm bg-white"
                                    value={newCandidate.priority}
                                    onChange={e => setNewCandidate({ ...newCandidate, priority: e.target.value as any })}
                                >
                                    <option value="Alta">🔴 Alta - Muy Interesado / Urgente</option>
                                    <option value="Media">🟡 Media - Interesado normal</option>
                                    <option value="Baja">🟢 Baja - Solo curiosidad / Futuro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Plataforma de Origen</label>
                                <input type="text" className="w-full p-2 border rounded text-sm" placeholder="Ej: Idealista, Facebook, Referido..." value={newCandidate.sourcePlatform} onChange={e => setNewCandidate({ ...newCandidate, sourcePlatform: e.target.value })} />
                            </div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Info Adicional</label><textarea className="w-full p-2 border rounded text-sm h-20" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({ ...newCandidate, additionalInfo: e.target.value })} /></div>
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
                            <button onClick={() => setIsGdprOpen(false)}><X className="w-5 h-5" /></button>
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