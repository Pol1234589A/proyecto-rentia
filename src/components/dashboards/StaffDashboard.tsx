
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { properties as staticProperties, Property, Room } from '../../data/rooms';
import { useAuth } from '../../contexts/AuthContext';
import { UserCreator } from '../admin/UserCreator';
import { UserManager } from '../admin/UserManager';
import { FileAnalyzer } from '../admin/FileAnalyzer';
import { SalesCRM } from '../admin/SalesCRM';
import { OpportunityManager } from '../admin/OpportunityManager';
import { OpportunityRequestManager } from '../admin/OpportunityRequestManager';
import { ProfitCalculator } from '../admin/ProfitCalculator';
import { FeedGenerator } from '../admin/FeedGenerator';
import { ContractManager } from '../admin/ContractManager';
import { CalendarManager } from '../admin/CalendarManager';
import { SupplyCalculator } from '../admin/SupplyCalculator';
import { SocialInbox } from '../admin/SocialInbox';
import { TaskManager } from '../admin/TaskManager';
import { VisitsLog } from '../admin/tools/VisitsLog';
import { CandidateManager } from '../admin/tools/CandidateManager';
import { AccountingPanel } from '../admin/tools/AccountingPanel';
import { SuppliesPanel } from '../admin/tools/SuppliesPanel';
import { NewsManager } from '../admin/NewsManager';
import { SalesTracker } from '../admin/SalesTracker';
import { BlacklistManager } from '../admin/tools/BlacklistManager';
import { WorkerInvoicesPanel } from '../admin/tools/WorkerInvoicesPanel';
import { TransferRequestManager } from '../admin/TransferRequestManager';
import { AdvancedCalculator } from '../admin/tools/AdvancedCalculator';
import { ManagementLeadsManager } from '../admin/ManagementLeadsManager';
import { RoomManager } from '../admin/RoomManager';
import { SiteConfigManager } from '../admin/SiteConfigManager';
import { BlogManager } from '../admin/BlogManager';
import { VisualEditor } from '../admin/VisualEditor'; // Import new editor
import { AgencyInvoicesPanel } from '../admin/AgencyInvoicesPanel';
import { PropertyBillingPanel } from '../admin/PropertyBillingPanel';
import { LayoutDashboard, Calculator, Briefcase, Wrench, Plus, Search, FileText, Save, X, DollarSign, Calendar as CalendarIcon, Filter, Pencil, PieChart, Landmark, Wallet, Clock, Zap, Settings, Receipt, Split, Info, MessageCircle, Share2, ClipboardList, UserCheck, Mail, Phone, ArrowRight, UserPlus, Inbox, Home, DoorOpen, Menu, Activity, ShieldAlert, UserCog, Siren, Footprints, BarChart3, Building, Grid, Globe, Send, Users, Key, Layout, Palette, Printer, Book, BookOpen, CreditCard } from 'lucide-react';
import { ProtocolsView } from './staff/ProtocolsView';
import { TrainingView } from './staff/TrainingView';
import { GlobalAiAssistant } from './staff/GlobalAiAssistant';


const MOTIVATIONAL_QUOTES = [
    "El único modo de hacer un gran trabajo es amar lo que haces. – Steve Jobs",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día. – Robert Collier",
    "No busques el momento perfecto, solo busca el momento y hazlo perfecto.",
    "La excelencia es un viaje, no un destino."
];

const MotivationalBanner = () => {
    const [quote, setQuote] = useState('');

    useEffect(() => {
        const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        setQuote(randomQuote);
    }, []);

    return (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="bg-white/20 p-2 rounded-full">
                <Info className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium italic opacity-90">"{quote}"</p>
        </div>
    );
};

export const StaffDashboard: React.FC = () => {
    const { currentUser, userRole } = useAuth();
    const isInternal = userRole === 'staff' || userRole === 'agency' || userRole === 'manager';
    const isWorker = userRole === 'worker';

    const [activeTab, setActiveTab] = useState<'overview' | 'room_manager' | 'real_estate' | 'accounting' | 'tools' | 'contracts' | 'calendar' | 'supplies' | 'calculator' | 'social' | 'tasks' | 'visits' | 'sales_tracker' | 'blacklist' | 'requests' | 'worker_invoices' | 'user_manager' | 'transfers' | 'advanced_calc' | 'management_leads' | 'site_config' | 'blog_manager' | 'visual_editor' | 'agency_invoices' | 'billing_info' | 'protocols' | 'candidates' | 'training'>('overview');
    const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'tasks' | 'candidates' | 'properties' | 'menu' | 'accounting' | 'supplies' | 'calendar' | 'contracts' | 'social' | 'calculator' | 'tools' | 'visits' | 'sales_tracker' | 'blacklist' | 'requests' | 'worker_invoices' | 'user_manager' | 'advanced_calc' | 'management_leads' | 'site_config' | 'blog_manager' | 'visual_editor' | 'agency_invoices' | 'billing_info' | 'protocols' | 'training'>('overview');

    const isManagerRole = userRole === 'manager';
    const isAdminUI = userRole === 'manager' || currentUser?.email === 'vanesa@rentiaroom.com' || currentUser?.email === 'info@rentiaroom.com' || currentUser?.email === 'rentiaroom@gmail.com' || currentUser?.email === 'matencioespinosapol@gmail.com';

    // ... (Keep existing state and effects unchanged) ...
    const [stats, setStats] = useState({
        totalRooms: 0,
        occupancyRate: 0,
        activeIncidents: 0,
        maintenanceIncidents: 0, // Nuevo contador de tareas de mantenimiento
        monthlyRevenue: 0,
        vacantRooms: 0,
        estimatedCommission: 0
    });

    const [loadingStats, setLoadingStats] = useState(true);
    const [pendingCandidatesCount, setPendingCandidatesCount] = useState(0);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
    const [pendingMgmtLeadsCount, setPendingMgmtLeadsCount] = useState(0);
    const [propertiesList, setPropertiesList] = useState<Property[]>([]);
    const [selectedPropId, setSelectedPropId] = useState<string>('');
    const [totalRealBalance, setTotalRealBalance] = useState(0);

    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [newCandidate, setNewCandidate] = useState({
        propertyId: '',
        roomId: '',
        candidateName: '',
        additionalInfo: '',
        candidatePhone: '',
        candidateEmail: '',
        sourcePlatform: '',
        priority: 'Media' as 'Alta' | 'Media' | 'Baja'
    });



    // Filtros para TaskManager cuando se navega desde widgets
    const [taskFilter, setTaskFilter] = useState<{ category?: any, status?: any }>({});
    const [showIncidentModal, setShowIncidentModal] = useState(false);

    useEffect(() => {
        // ... (Keep existing effect logic) ...
        const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
            let totalRoomsCount = 0;
            let occupiedCount = 0;
            let revenueCount = 0;
            let renovationCount = 0;
            let totalCommission = 0;

            const firestoreProps: Property[] = [];
            snapshot.forEach((doc) => {
                firestoreProps.push({ ...doc.data(), id: doc.id } as Property);
            });

            const dbIds = new Set(firestoreProps.map(p => p.id));
            const missingStatics = staticProperties.filter(p => !dbIds.has(p.id));

            const allProps = [...firestoreProps, ...missingStatics].map(data => {
                return data;
            });

            allProps.forEach((data: any) => {
                totalRoomsCount += data.totalRooms || (data.rooms ? data.rooms.length : 0);
                if (data.rooms && Array.isArray(data.rooms)) {
                    data.rooms.forEach((room: any) => {
                        if (room.status === 'occupied') {
                            occupiedCount++;
                            revenueCount += Number(room.price) || 0;

                            if (room.commissionValue) {
                                if (room.commissionType === 'fixed') {
                                    totalCommission += Number(room.commissionValue);
                                } else {
                                    const baseCommission = (Number(room.price) * Number(room.commissionValue) / 100);
                                    totalCommission += baseCommission * 1.21;
                                }
                            }
                        }
                        if (room.specialStatus === 'renovation') {
                            renovationCount++;
                        }
                    });
                }
            });

            allProps.sort((a, b) => a.address.localeCompare(b.address));
            setPropertiesList(allProps);
            if (!selectedPropId && allProps.length > 0) setSelectedPropId(allProps[0].id);

            setStats(prev => ({
                ...prev,
                totalRooms: totalRoomsCount,
                occupancyRate: totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0,
                monthlyRevenue: revenueCount,
                activeIncidents: renovationCount,
                vacantRooms: totalRoomsCount - occupiedCount,
                estimatedCommission: totalCommission
            }));
            setLoadingStats(false);
        }, (error) => {
            console.error("Error cargando estadísticas de propiedades:", error);
            setLoadingStats(false);
        });

        // Escuchar tareas de mantenimiento (incidencias reales)
        const qMaint = query(
            collection(db, "tasks"),
            where("category", "==", "Mantenimiento"),
            where("status", "in", ["Pendiente", "En Curso", "Bloqueada"])
        );
        const unsubMaint = onSnapshot(qMaint, (snap) => {
            setStats(prev => ({
                ...prev,
                maintenanceIncidents: snap.size
            }));
        }, (error) => {
            console.error("Error cargando incidencias de mantenimiento:", error);
        });

        const isInternalRole = userRole === 'staff' || userRole === 'agency';
        const isWorkerRole = userRole === 'worker';

        let unsubscribeAccounting = () => { };
        if (isInternalRole) {
            const qAccounting = query(collection(db, "accounting"));
            unsubscribeAccounting = onSnapshot(qAccounting, (snapshot) => {
                let balance = 0;
                snapshot.forEach((doc) => {
                    const d = doc.data();
                    if (d.type === 'income') balance += d.amount;
                    else balance -= d.amount;
                });
                setTotalRealBalance(balance);
            }, (error) => {
                console.error("Error cargando contabilidad:", error);
            });
        }

        const qPending = query(collection(db, "candidate_pipeline"), where("status", "==", "pending_review"));
        const unsubPending = onSnapshot(qPending, (snap) => {
            setPendingCandidatesCount(snap.size);
        }, (error) => {
            console.error("Error cargando candidatos pendientes:", error);
        });

        let unsubRequests = () => { };
        if (isInternalRole) {
            const qRequests = query(collection(db, "opportunity_requests"), where("status", "==", "new"));
            unsubRequests = onSnapshot(qRequests, (snap) => {
                setPendingRequestsCount(snap.size);
            }, (error) => {
                console.error("Error cargando solicitudes de oportunidad:", error);
            });
        }

        let unsubTransfers = () => { };
        if (isInternalRole) {
            const qTransfers = query(collection(db, "pending_transfers"), where("status", "==", "pending_review"));
            unsubTransfers = onSnapshot(qTransfers, (snap) => {
                setPendingTransfersCount(snap.size);
            }, (error) => {
                console.error("Error cargando transferencias pendientes:", error);
            });
        }

        let unsubMgmt = () => { };
        if (isInternalRole || isWorkerRole) {
            const qMgmt = query(collection(db, "management_leads"), where("status", "==", "new"));
            unsubMgmt = onSnapshot(qMgmt, (snap) => {
                setPendingMgmtLeadsCount(snap.size);
            }, (error) => {
                console.error("Error cargando leads de gestión:", error);
            });
        }

        return () => {
            unsubscribeProps();
            unsubscribeAccounting();
            unsubPending();
            unsubRequests();
            unsubTransfers();
            unsubMgmt();
            unsubMaint();
        };
    }, [userRole]);

    const handleSendCandidate = async (e: React.FormEvent) => {
        // ... (Keep existing handler) ...
        e.preventDefault();
        if (!newCandidate.propertyId || !newCandidate.candidateName) {
            return alert("Completa los campos obligatorios: propiedad y nombre.");
        }
        const prop = propertiesList.find(p => p.id === newCandidate.propertyId);
        const room = prop?.rooms.find((r: any) => r.id === newCandidate.roomId);

        try {
            await addDoc(collection(db, "candidate_pipeline"), {
                ...newCandidate,
                propertyName: prop?.address || 'N/A',
                ownerId: prop?.ownerId || null,
                roomName: room?.name || 'General / A definir',
                submittedBy: currentUser?.displayName || 'Staff',
                submittedAt: serverTimestamp(),
                status: 'pending_review'
            });
            setShowCandidateModal(false);
            setNewCandidate({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '', sourcePlatform: '', priority: 'Media' });
            alert('Candidato enviado a filtrado correctamente.');
        } catch (error) {
            console.error(error);
            alert('Error al enviar candidato.');
        }
    };

    const desktopTools = [
        { id: 'tasks', label: 'Tareas', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'room_manager', label: 'Habitaciones', icon: <DoorOpen className="w-4 h-4" /> },
        { id: 'real_estate', label: 'Oportunidades', icon: <Building className="w-4 h-4" /> },
        { id: 'protocols', label: 'Protocolos', icon: <FileText className="w-4 h-4 text-indigo-500" /> },
        { id: 'management_leads', label: 'Leads Gestión', icon: <Key className="w-4 h-4" />, count: pendingMgmtLeadsCount },
        { id: 'requests', label: 'Solicitudes', icon: <Inbox className="w-4 h-4" />, count: pendingRequestsCount },
        { id: 'transfers', label: 'Traspasos', icon: <Share2 className="w-4 h-4" />, count: pendingTransfersCount },
        { id: 'blacklist', label: 'Gestión Riesgos', icon: <ShieldAlert className="w-4 h-4 text-red-500" /> },
        { id: 'contracts', label: 'Contratos (MANTENIMIENTO)', icon: <FileText className="w-4 h-4 text-indigo-600" /> },
        { id: 'supplies', label: 'Suministros', icon: <Zap className="w-4 h-4" /> },
        { id: 'worker_invoices', label: 'Facturas Trabajadores', icon: <Receipt className="w-4 h-4" /> },
        { id: 'calculator', label: 'Reparto Gastos', icon: <Split className="w-4 h-4" /> },
        { id: 'accounting', label: 'Contabilidad', icon: <Calculator className="w-4 h-4" /> },
        { id: 'billing_info', label: 'Información Facturación', icon: <CreditCard className="w-4 h-4 text-emerald-500" /> },
        { id: 'agency_invoices', label: 'Facturas Rentia', icon: <Printer className="w-4 h-4" /> },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-4 h-4" /> },
        { id: 'visits', label: 'Visitas', icon: <Footprints className="w-4 h-4" /> },
        { id: 'user_manager', label: 'Usuarios', icon: <UserCog className="w-4 h-4" /> },
        { id: 'site_config', label: 'Configuración Web', icon: <Settings className="w-4 h-4 text-indigo-600" /> },
        { id: 'blog_manager', label: 'Blog / Noticias', icon: <Layout className="w-4 h-4 text-purple-600" /> },
        { id: 'training', label: 'Formación', icon: <BookOpen className="w-4 h-4 text-purple-500" /> },
        { id: 'tools', label: 'Admin', icon: <Wrench className="w-4 h-4" /> },
    ];

    const adminTools = [
        { id: 'protocols', label: 'Protocolos y Claves', icon: <Key className="w-4 h-4 text-indigo-500" /> },
        { id: 'room_manager', label: 'Gestión Habitaciones', icon: <DoorOpen className="w-4 h-4 text-green-400" /> },
        { id: 'contracts', label: 'Contratos (MANTENIMIENTO)', icon: <FileText className="w-4 h-4 text-pink-400" /> },
        { id: 'tasks', label: 'Mis Tareas', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'management_leads', label: 'Captación', icon: <Key className="w-4 h-4" />, count: pendingMgmtLeadsCount },
        { id: 'billing_info', label: 'Información Facturación', icon: <CreditCard className="w-4 h-4 text-emerald-500" /> },
        { id: 'requests', label: 'Solicitudes', icon: <Inbox className="w-4 h-4" />, count: pendingRequestsCount },
        { id: 'agency_invoices', label: 'Facturas Rentia', icon: <Printer className="w-4 h-4" /> },
        { id: 'training', label: 'Formación', icon: <BookOpen className="w-4 h-4 text-purple-500" /> },
    ];


    const mobileMenuOptions = [
        { id: 'room_manager', label: 'Habitaciones', icon: <DoorOpen className="w-6 h-6" />, color: 'bg-green-100 text-green-600' },
        { id: 'contracts', label: 'Contratos (MANTENIMIENTO)', icon: <FileText className="w-6 h-6" />, color: 'bg-pink-100 text-pink-600' },
        { id: 'tasks', label: 'Tareas', icon: <ClipboardList className="w-6 h-6" />, color: 'bg-orange-100 text-orange-600', count: 0 },
        { id: 'management_leads', label: 'Captación', icon: <Key className="w-6 h-6" />, color: 'bg-indigo-100 text-indigo-600', count: pendingMgmtLeadsCount },
        { id: 'requests', label: 'Solicitudes', icon: <Inbox className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600', count: pendingRequestsCount },
        { id: 'billing_info', label: 'Info Facturación', icon: <CreditCard className="w-6 h-6" />, color: 'bg-emerald-100 text-emerald-600' },
        { id: 'agency_invoices', label: 'Facturas', icon: <Printer className="w-6 h-6" />, color: 'bg-gray-100 text-gray-600' },
        { id: 'protocols', label: 'Protocolos', icon: <Book className="w-6 h-6" />, color: 'bg-sky-100 text-sky-600' },
        { id: 'training', label: 'Formación', icon: <BookOpen className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },

        // Admin Extra Tools (Hidden for Vanesa in view logic if desired, but simplifying mobile menu for all)
        { id: 'site_config', label: 'Config Web', icon: <Settings className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-400' },
        { id: 'training', label: 'Formación', icon: <BookOpen className="w-6 h-6" />, color: 'bg-purple-50 text-purple-400' },
        { id: 'accounting', label: 'Contabilidad', icon: <Calculator className="w-6 h-6" />, color: 'bg-blue-50 text-blue-400' },
    ];

    const renderMobileContent = () => {
        if (activeMobileTab === 'menu') {
            // ... Keep existing menu logic ...
            return (
                <div className="p-4 grid grid-cols-3 gap-3 overflow-y-auto pb-24">
                    {mobileMenuOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => setActiveMobileTab(option.id as any)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border bg-white shadow-sm transition-transform active:scale-95 ${option.color.replace('text-', 'border-').replace('bg-', 'border-opacity-20 ')}`}
                        >
                            <div className={`p-2 rounded-full mb-2 ${option.color}`}>
                                {option.icon}
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{option.label}</span>
                            {option.count ? <span className="mt-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{option.count}</span> : null}
                        </button>
                    ))}
                </div>
            );
        }

        switch (activeMobileTab) {
            // ... (Keep existing cases) ...
            case 'overview': return (
                <div className="p-4 space-y-4 overflow-y-auto pb-24">
                    <MotivationalBanner />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100"><p className="text-[10px] text-gray-500 font-bold uppercase">Habitaciones</p><p className="text-2xl font-bold text-gray-800">{stats.totalRooms}</p></div>
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100"><p className="text-[10px] text-gray-500 font-bold uppercase">Ocupación</p><p className={`text-2xl font-bold ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>{stats.occupancyRate}%</p></div>
                    </div>
                    {pendingCandidatesCount > 0 && <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-between shadow-sm" onClick={() => setActiveMobileTab('candidates')}><div className="flex items-center gap-3"><UserCheck className="w-5 h-5 text-orange-600" /><div><p className="font-bold text-orange-900">{pendingCandidatesCount} Candidatos</p><p className="text-xs text-orange-700">Revisar pendientes</p></div></div><ArrowRight className="w-4 h-4 text-orange-400" /></div>}
                    {pendingRequestsCount > 0 && <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between shadow-sm" onClick={() => setActiveMobileTab('requests')}><div className="flex items-center gap-3"><Inbox className="w-5 h-5 text-blue-600" /><div><p className="font-bold text-blue-900">{pendingRequestsCount} Solicitudes</p><p className="text-xs text-blue-700">Nuevas oportunidades</p></div></div><ArrowRight className="w-4 h-4 text-blue-400" /></div>}
                    {pendingMgmtLeadsCount > 0 && <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between shadow-sm" onClick={() => setActiveMobileTab('management_leads')}><div className="flex items-center gap-3"><Key className="w-5 h-5 text-purple-600" /><div><p className="font-bold text-purple-900">{pendingMgmtLeadsCount} Leads Gestión</p><p className="text-xs text-purple-700">Propiedades nuevas</p></div></div><ArrowRight className="w-4 h-4 text-purple-400" /></div>}
                </div>
            );
            case 'tasks': return <div className="h-full overflow-y-auto pb-24"><TaskManager /></div>;
            case 'candidates': return <div className="h-full overflow-y-auto pb-24"><CandidateManager /></div>;
            case 'properties': return (
                <div className="h-full overflow-y-auto p-4 space-y-4 pb-24">
                    <SalesCRM />
                </div>
            );
            case 'visual_editor': return <div className="h-full overflow-y-auto pb-24"><VisualEditor /></div>; // NEW
            case 'contracts': return <div className="h-full overflow-y-auto pb-24"><ContractManager onClose={() => setActiveMobileTab('menu')} /></div>;
            case 'calendar': return <div className="h-full overflow-y-auto pb-24"><CalendarManager /></div>;
            case 'supplies': return <div className="h-full overflow-y-auto pb-24"><SuppliesPanel properties={propertiesList} /></div>;
            case 'accounting': return <div className="h-full overflow-y-auto pb-24"><AccountingPanel /></div>;
            case 'advanced_calc': return <div className="h-full overflow-y-auto pb-24"><AdvancedCalculator properties={propertiesList} /></div>;
            case 'visits': return <div className="h-full overflow-y-auto pb-24"><VisitsLog /></div>;
            case 'sales_tracker': return <div className="h-full overflow-y-auto pb-24"><SalesTracker /></div>;
            case 'blacklist': return <div className="h-full overflow-y-auto pb-24"><BlacklistManager /></div>;
            case 'requests': return <div className="h-full overflow-y-auto pb-24"><OpportunityRequestManager /></div>;
            case 'management_leads': return <div className="h-full overflow-y-auto pb-24"><ManagementLeadsManager /></div>;
            case 'worker_invoices': return <div className="h-full overflow-y-auto pb-24"><WorkerInvoicesPanel /></div>;
            case 'user_manager': return <div className="h-full overflow-y-auto pb-24"><UserManager /></div>;
            case 'site_config': return <div className="h-full overflow-y-auto pb-24"><SiteConfigManager /></div>;
            case 'blog_manager': return <div className="h-full overflow-y-auto pb-24"><BlogManager /></div>;
            case 'protocols': return <div className="h-full overflow-y-auto pb-24"><ProtocolsView /></div>;
            case 'training': return <div className="h-full overflow-y-auto pb-24"><TrainingView /></div>;
            case 'agency_invoices': return <div className="h-full overflow-y-auto pb-24"><AgencyInvoicesPanel /></div>;
            case 'billing_info': return <div className="h-full overflow-y-auto pb-24"><PropertyBillingPanel properties={propertiesList} /></div>;
            case 'calculator': return <div className="h-full overflow-y-auto pb-24"><SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} /></div>;
            case 'social': return <div className="h-full overflow-y-auto pb-24"><SocialInbox /></div>;
            case 'tools': return <div className="h-full overflow-y-auto p-4 space-y-4 pb-24"><NewsManager /><ProfitCalculator /></div>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-0 sm:p-4 md:p-6 animate-in fade-in">
            <div className="max-w-7xl mx-auto">

                {/* --- HEADER --- */}
                <header className={`p-4 md:p-6 mb-4 sm:mb-6 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-500 ${isAdminUI ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 border-indigo-500/30' : 'bg-white border-gray-200'}`}>
                    <div>
                        <h1 className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${isAdminUI ? 'text-white' : 'text-rentia-black'}`}>
                            <LayoutDashboard className={`w-5 h-5 sm:w-6 sm:h-6 ${isAdminUI ? 'text-indigo-400' : 'text-rentia-blue'}`} />
                            {isAdminUI ? 'Gestión: Administración' : 'Panel de Control'}
                        </h1>
                        <p className={`text-xs sm:text-sm mt-1 ${isAdminUI ? 'text-indigo-200/70' : 'text-gray-500'}`}>{isAdminUI ? 'Administración y Operaciones RentiaRoom' : 'Sistema Integrado de Gestión Empresarial'}</p>
                    </div>

                    <div className={`hidden md:flex flex-wrap gap-2 justify-end p-2 rounded-xl max-w-full ${isAdminUI ? '' : 'bg-gray-100'}`}>
                        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm border ${activeTab === 'overview' ? (isAdminUI ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/30' : 'bg-white text-rentia-blue border-transparent') : (isAdminUI ? 'bg-gray-900/40 text-white border-white/10 hover:bg-gray-900/60' : 'text-gray-500 hover:text-gray-700 border-transparent')}`}>
                            <BarChart3 className="w-4 h-4" /> Resumen
                        </button>
                        {(isAdminUI ? adminTools : desktopTools).map(tool => (
                            <button key={tool.id} onClick={() => setActiveTab(tool.id as any)} className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm border ${activeTab === tool.id ? (isAdminUI ? 'bg-pink-600 text-white border-pink-500 shadow-pink-500/30' : 'bg-white text-rentia-blue border-transparent') : (isAdminUI ? 'bg-gray-900/40 text-white border-white/10 hover:bg-gray-900/60' : 'text-gray-500 hover:text-gray-700 border-transparent')}`}>
                                {tool.icon} {tool.label}
                                {tool.count ? <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-indigo-900">{tool.count}</span> : null}
                            </button>
                        ))}
                    </div>
                </header>

                {/* --- CONTENT AREA (DUAL RENDER) --- */}
                <div className="md:hidden pb-20 flex flex-col h-[calc(100vh-80px)]">
                    {renderMobileContent()}
                </div>

                <div className="hidden md:block">
                    {/* GLOBAL AI ASSISTANT (Persistent help) */}
                    <GlobalAiAssistant />

                    {/* DESKTOP CONTENT RENDER */}
                    {activeTab === 'overview' && (
                        // ... (Keep existing overview render) ...
                        <div className="animate-in slide-in-from-bottom-4 duration-300">
                            <MotivationalBanner />
                            {/* Stats Grid */}
                            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdminUI ? 'md:grid-cols-3' : 'md:grid-cols-5'} gap-4 mb-8`}>
                                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Total Habitaciones</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-gray-800">{loadingStats ? '-' : stats.totalRooms}</span><Building className="w-6 h-6 text-blue-100 absolute right-4 top-4 transform scale-150" /></div></div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Ocupación Actual</span><div className="flex justify-between items-end mt-2"><span className={`text-3xl font-bold ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>{loadingStats ? '-' : `${stats.occupancyRate}%`}</span><Users className="w-6 h-6 text-green-100 absolute right-4 top-4 transform scale-150" /></div></div>
                                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Habitaciones Vacías</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-orange-600">{loadingStats ? '-' : stats.vacantRooms}</span><DoorOpen className="w-6 h-6 text-orange-100 absolute right-4 top-4 transform scale-150" /></div></div>

                                {!isAdminUI && (
                                    <>
                                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 relative overflow-hidden">
                                            <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1"><DollarSign className="w-3 h-3 text-purple-500" /> Comisión Mensual (Est)</span>
                                            <div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-purple-700">{loadingStats ? '-' : stats.estimatedCommission.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</span><Landmark className="w-6 h-6 text-purple-100 absolute right-4 top-4 transform scale-150" /></div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Balance Total (Caja)</span><div className="flex justify-between items-end mt-2"><span className={`text-3xl font-bold ${totalRealBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{totalRealBalance.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-sm font-medium ml-1">€</span></span><Landmark className="w-6 h-6 text-gray-100 absolute right-4 top-4 transform scale-150" /></div></div>
                                    </>
                                )}
                            </div>
                            {/* Alerts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {pendingCandidatesCount > 0 && (
                                    <div
                                        className="bg-orange-50 border border-orange-200 rounded-lg p-6 flex items-center justify-between shadow-sm cursor-pointer hover:bg-orange-100 transition-colors"
                                        onClick={() => { const element = document.getElementById('candidate-manager'); if (element) element.scrollIntoView({ behavior: 'smooth' }); }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-full text-orange-600 shadow-sm border border-orange-100"><UserCheck className="w-8 h-8" /></div>
                                            <div><h4 className="font-bold text-orange-900 text-xl">{pendingCandidatesCount} Candidatos</h4><p className="text-sm text-orange-700">Pendientes de revisión</p></div>
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-orange-400" />
                                    </div>
                                )}
                                <div
                                    className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-red-50"
                                    onClick={() => setShowIncidentModal(true)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-red-50 p-2 md:p-3 rounded-xl border border-red-100">
                                            <Siren className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                                        </div>
                                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Averías</span>
                                    </div>
                                    <h4 className="text-gray-500 text-xs md:text-sm font-medium mb-1">Incidencias Activas</h4>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl md:text-3xl font-black text-rentia-black leading-none">{stats.maintenanceIncidents}</span>
                                        <span className="text-xs text-gray-500 pb-1">tareas</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-red-500 h-full" style={{ width: `${Math.min(stats.maintenanceIncidents * 10, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                {pendingRequestsCount > 0 && (
                                    <div
                                        className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-100 transition-colors"
                                        onClick={() => setActiveTab('requests')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-full text-blue-600 shadow-sm border border-blue-100"><Inbox className="w-8 h-8" /></div>
                                            <div><h4 className="font-bold text-blue-900 text-xl">{pendingRequestsCount} Solicitudes</h4><p className="text-sm text-blue-700">Nuevas oportunidades recibidas</p></div>
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-blue-400" />
                                    </div>
                                )}
                                {pendingMgmtLeadsCount > 0 && (
                                    <div
                                        className="bg-purple-50 border border-purple-200 rounded-lg p-6 flex items-center justify-between shadow-sm cursor-pointer hover:bg-purple-100 transition-colors"
                                        onClick={() => setActiveTab('management_leads')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-full text-purple-600 shadow-sm border border-purple-100"><Key className="w-8 h-8" /></div>
                                            <div><h4 className="font-bold text-purple-900 text-xl">{pendingMgmtLeadsCount} Leads Gestión</h4><p className="text-sm text-purple-700">Propietarios interesados</p></div>
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-purple-400" />
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setShowCandidateModal(true)} className="w-full bg-green-50 text-green-700 px-6 py-4 rounded-lg font-bold hover:bg-green-100 transition-colors items-center gap-2 border border-green-200 text-left flex justify-between shadow-sm mb-8"><div className="flex items-center gap-3"><UserPlus className="w-5 h-5" /><span>Enviar Nuevo Candidato al Pipeline</span></div><ArrowRight className="w-5 h-5" /></button>
                            <div id="candidate-manager" className="mt-8"><CandidateManager /></div>
                        </div>
                    )}

                    {/* Add Visual Editor Case */}
                    {activeTab === 'visual_editor' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><VisualEditor /></div>}

                    {activeTab === 'transfers' && <div className="animate-in slide-in-from-bottom-4 duration-300"><TransferRequestManager /></div>}
                    {activeTab === 'tasks' && <div className="animate-in slide-in-from-bottom-4 duration-300"><TaskManager key={taskFilter.category} initialCategoryFilter={taskFilter.category} initialStatusFilter={taskFilter.status} properties={propertiesList} /></div>}
                    {activeTab === 'room_manager' && <div className="h-full overflow-y-auto pb-24"><RoomManager /></div>}
                    {/* ... (Keep other tabs) ... */}
                    {activeTab === 'real_estate' && <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300"><SalesCRM /></div>}
                    {activeTab === 'contracts' && <div className="animate-in slide-in-from-bottom-4 duration-300"><ContractManager onClose={() => setActiveTab('real_estate')} /></div>}
                    {activeTab === 'calendar' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><CalendarManager /></div>}
                    {activeTab === 'calculator' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} /></div>}
                    {activeTab === 'advanced_calc' && <div className="animate-in slide-in-from-bottom-4 duration-300"><AdvancedCalculator properties={propertiesList} /></div>}
                    {activeTab === 'agency_invoices' && <div className="animate-in slide-in-from-bottom-4 duration-300"><AgencyInvoicesPanel /></div>}
                    {activeTab === 'billing_info' && <div className="animate-in slide-in-from-bottom-4 duration-300"><PropertyBillingPanel properties={propertiesList} /></div>}
                    {activeTab === 'social' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SocialInbox /></div>}
                    {activeTab === 'visits' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><VisitsLog /></div>}
                    {activeTab === 'supplies' && <div className="animate-in slide-in-from-bottom-4 duration-300"><SuppliesPanel properties={propertiesList} /></div>}
                    {activeTab === 'accounting' && <div className="animate-in slide-in-from-bottom-4 duration-300"><AccountingPanel /></div>}
                    {activeTab === 'sales_tracker' && <div className="animate-in slide-in-from-bottom-4 duration-300"><SalesTracker /></div>}
                    {activeTab === 'blacklist' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><BlacklistManager /></div>}
                    {activeTab === 'requests' && <div className="animate-in slide-in-from-bottom-4 duration-300"><OpportunityRequestManager /></div>}
                    {activeTab === 'management_leads' && <div className="animate-in slide-in-from-bottom-4 duration-300"><ManagementLeadsManager /></div>}
                    {activeTab === 'worker_invoices' && <div className="animate-in slide-in-from-bottom-4 duration-300"><WorkerInvoicesPanel /></div>}
                    {activeTab === 'user_manager' && <div className="animate-in slide-in-from-bottom-4 duration-300"><UserManager /></div>}
                    {activeTab === 'site_config' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SiteConfigManager /></div>}
                    {activeTab === 'blog_manager' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><BlogManager /></div>}
                    {activeTab === 'agency_invoices' && <div className="animate-in slide-in-from-bottom-4 duration-300"><AgencyInvoicesPanel /></div>}
                    {activeTab === 'protocols' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-full"><ProtocolsView onOpenCandidateModal={() => setShowCandidateModal(true)} /></div>}
                    {activeTab === 'training' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-full"><TrainingView /></div>}
                    {/* Reuse Candidate Manager for explicit tab if needed, or redirect logic */}
                    {activeTab === 'candidates' && <div className="animate-in slide-in-from-bottom-4 duration-300"><CandidateManager /></div>}

                    {activeTab === 'tools' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-300">
                            <NewsManager />
                            <FeedGenerator />
                            <OpportunityManager />
                            <UserCreator />
                            <FileAnalyzer />
                            <ProfitCalculator />
                        </div>
                    )}
                </div>

                {/* MOBILE NAVIGATION BAR */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] grid grid-cols-5 z-50 md:hidden h-16">
                    <button onClick={() => setActiveMobileTab('overview')} className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'overview' ? 'text-rentia-blue' : 'text-gray-400'}`}>
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Resumen</span>
                    </button>
                    <button onClick={() => setActiveMobileTab('tasks')} className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'tasks' ? 'text-rentia-blue' : 'text-gray-400'}`}>
                        <ClipboardList className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Tareas</span>
                    </button>
                    <button onClick={() => setActiveMobileTab('candidates')} className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'candidates' ? 'text-rentia-blue' : 'text-gray-400'}`}>
                        <UserCheck className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Candidatos</span>
                    </button>
                    <button onClick={() => setActiveMobileTab('menu')} className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'menu' ? 'text-rentia-blue' : 'text-gray-400'}`}>
                        <Menu className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Menú</span>
                    </button>
                </div>

                {/* Candidate Modal */}
                {showCandidateModal && createPortal(
                    <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCandidateModal(false)}>
                        <form onSubmit={handleSendCandidate} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" /> Enviar Candidato</h3>
                                <button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 -mr-2" title="Cerrar"><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Propiedad*</label><select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({ ...newCandidate, propertyId: e.target.value, roomId: '' })} title="Seleccionar Propiedad"><option value="">Seleccionar...</option>{propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select></div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">Habitación (Opcional)</label>
                                    <select disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({ ...newCandidate, roomId: e.target.value })} title="Seleccionar Habitación">
                                        <option value="">Seleccionar...</option>
                                        {(propertiesList.find(p => p.id === newCandidate.propertyId)?.rooms || []).map((r: Room) => (
                                            <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                                        ))}
                                    </select>
                                </div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Nombre Candidato*</label><input required type="text" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateName} onChange={e => setNewCandidate({ ...newCandidate, candidateName: e.target.value })} title="Nombre del Candidato" placeholder="Nombre completo" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Teléfono</label><input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({ ...newCandidate, candidatePhone: e.target.value })} title="Teléfono del Candidato" placeholder="Ej: 600000000" /></div>
                                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Email</label><input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({ ...newCandidate, candidateEmail: e.target.value })} title="Email del Candidato" placeholder="email@ejemplo.com" /></div>
                                </div>
                                {/* Selector de Prioridad NUEVO */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Siren className="w-3 h-3" /> Urgencia / Prioridad</label>
                                    <select
                                        className="w-full p-2 border rounded text-sm bg-white"
                                        value={newCandidate.priority}
                                        onChange={e => setNewCandidate({ ...newCandidate, priority: e.target.value as any })}
                                        title="Seleccionar Prioridad"
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
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Info Adicional</label><textarea className="w-full p-2 border rounded text-sm h-20" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({ ...newCandidate, additionalInfo: e.target.value })} title="Información Adicional" placeholder="Notas sobre el candidato..." /></div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t flex gap-2">
                                <button type="button" onClick={() => setShowCandidateModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Cancelar</button>
                                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700"><Send className="w-4 h-4" /> Enviar a Pipeline</button>
                            </div>
                        </form>
                    </div>,
                    document.body
                )}

                {/* MODAL GESTIO DE INCIDENCIAS */}
                {showIncidentModal && createPortal(
                    <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                        <Siren className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">Centro de Incidencias</h3>
                                        <p className="text-xs text-gray-500">Gestión centralizada de mantenimientos y averías</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowIncidentModal(false)} className="bg-white border border-gray-200 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shadow-sm" title="Cerrar Panel de Incidencias">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden relative bg-gray-50">
                                <div className="absolute inset-0 p-2 overflow-auto">
                                    <TaskManager
                                        initialCategoryFilter="Mantenimiento"
                                        whitelistedBoardNames={['INCIDENCIAS', 'Mantenimiento', 'Incidencias', 'Averias']}
                                        hideSidebar={true}
                                        titleOverride="Panel de Incidencias"
                                        properties={propertiesList}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};
