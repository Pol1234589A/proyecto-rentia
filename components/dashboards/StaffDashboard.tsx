
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Building, AlertCircle, CheckCircle, BarChart3, RefreshCw, LayoutDashboard, Calculator, Briefcase, Wrench, Plus, ArrowUpRight, ArrowDownRight, Search, FileText, Trash2, Save, X, DollarSign, Calendar as CalendarIcon, Filter, Download, Pencil, ChevronLeft, ChevronRight, PieChart, Landmark, ChevronDown, Wallet, CreditCard, Clock, Zap, Droplets, Flame, Wifi, Settings, Receipt, Split, Info, MessageCircle, Share2, ClipboardList, UserCheck, Mail, Phone, ArrowRight, UserPlus, Archive, Send, Home, DoorOpen, Menu, Grid, Footprints, MapPin, Percent, Quote, Sparkles, Activity, Ban, ShieldAlert } from 'lucide-react';
import { UserCreator } from '../admin/UserCreator';
import { FileAnalyzer } from '../admin/FileAnalyzer';
import { RoomManager } from '../admin/RoomManager';
import { SalesCRM } from '../admin/SalesCRM';
import { OpportunityManager } from '../admin/OpportunityManager';
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
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { properties as staticProperties } from '../../data/rooms';
import { useAuth } from '../../contexts/AuthContext';

// ... (KEEP CONSTANTS: MOTIVATIONAL_QUOTES, PRIORITIES, ETC. UNCHANGED) ...
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
                <Quote className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium italic opacity-90">"{quote}"</p>
        </div>
    );
};

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'real_estate' | 'accounting' | 'tools' | 'contracts' | 'calendar' | 'supplies' | 'calculator' | 'social' | 'tasks' | 'visits' | 'sales_tracker' | 'blacklist'>('overview');
  const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'tasks' | 'candidates' | 'properties' | 'menu' | 'accounting' | 'supplies' | 'calendar' | 'contracts' | 'social' | 'calculator' | 'tools' | 'visits' | 'sales_tracker' | 'blacklist'>('overview');
  const [mobilePropertyView, setMobilePropertyView] = useState<'rent' | 'sale'>('rent');

  const [stats, setStats] = useState({
    totalRooms: 0,
    occupancyRate: 0,
    activeIncidents: 0,
    monthlyRevenue: 0,
    vacantRooms: 0,
    estimatedCommission: 0
  });
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingCandidatesCount, setPendingCandidatesCount] = useState(0);
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<string>(''); 
  const [totalRealBalance, setTotalRealBalance] = useState(0);

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ propertyId: '', roomId: '', candidateName: '', additionalInfo: '', candidatePhone: '', candidateEmail: '' });

  useEffect(() => {
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      let totalRoomsCount = 0;
      let occupiedCount = 0;
      let revenueCount = 0;
      let renovationCount = 0;
      let totalCommission = 0; 
      
      const firestoreProps: any[] = [];
      snapshot.forEach((doc) => {
        firestoreProps.push({ ...doc.data(), id: doc.id });
      });

      const dbIds = new Set(firestoreProps.map(p => p.id));
      const missingStatics = staticProperties.filter(p => !dbIds.has(p.id));
      
      const allProps = [...firestoreProps, ...missingStatics].map(data => {
          let inferredConfig = data.suppliesConfig;
          if (!inferredConfig && data.rooms && data.rooms.length > 0) {
              const firstRoomExpense = data.rooms[0].expenses.toLowerCase();
              if (firstRoomExpense.includes('fijos') || firstRoomExpense.includes('incluidos')) {
                  inferredConfig = { type: 'fixed', fixedAmount: 50 }; 
              } else {
                  inferredConfig = { type: 'shared' };
              }
          }
          return { ...data, suppliesConfig: inferredConfig };
      });

      allProps.forEach((data: any) => {
        if (data.rooms && Array.isArray(data.rooms)) {
          data.rooms.forEach((room: any) => {
            totalRoomsCount++;
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

      allProps.sort((a,b) => a.address.localeCompare(b.address));
      setPropertiesList(allProps);
      
      if (!selectedPropId && allProps.length > 0) setSelectedPropId(allProps[0].id);

      setStats({
        totalRooms: totalRoomsCount,
        occupancyRate: totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0,
        monthlyRevenue: revenueCount,
        activeIncidents: renovationCount,
        vacantRooms: totalRoomsCount - occupiedCount,
        estimatedCommission: totalCommission
      });
      setLoadingStats(false);
    });

    const qAccounting = query(collection(db, "accounting"));
    const unsubscribeAccounting = onSnapshot(qAccounting, (snapshot) => {
        let balance = 0;
        snapshot.forEach((doc) => {
            const d = doc.data();
            if (d.type === 'income') balance += d.amount;
            else balance -= d.amount;
        });
        setTotalRealBalance(balance);
    });
    
    const qPending = query(collection(db, "candidate_pipeline"), where("status", "==", "pending_review"));
    const unsubPending = onSnapshot(qPending, (snap) => {
        setPendingCandidatesCount(snap.size);
    });

    return () => { unsubscribeProps(); unsubscribeAccounting(); unsubPending(); };
  }, []);

  const handleSendCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.propertyId || !newCandidate.roomId || !newCandidate.candidateName) {
        return alert("Completa todos los campos: propiedad, habitación y nombre.");
    }
    const prop = propertiesList.find(p => p.id === newCandidate.propertyId);
    const room = prop?.rooms.find((r:any) => r.id === newCandidate.roomId);
    try {
        await addDoc(collection(db, "candidate_pipeline"), {
            ...newCandidate,
            propertyName: prop?.address || 'N/A',
            roomName: room?.name || 'N/A',
            submittedBy: currentUser?.displayName || 'Staff',
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

    // Updated Tools List
    const desktopTools = [
        { id: 'tasks', label: 'Tareas', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'real_estate', label: 'Inmobiliaria', icon: <Building className="w-4 h-4" /> },
        { id: 'sales_tracker', label: 'Ventas', icon: <Activity className="w-4 h-4" /> },
        { id: 'blacklist', label: 'Gestión Riesgos', icon: <ShieldAlert className="w-4 h-4 text-red-500" /> }, 
        { id: 'contracts', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
        { id: 'supplies', label: 'Suministros', icon: <Zap className="w-4 h-4" /> },
        { id: 'social', label: 'Mensajería', icon: <MessageCircle className="w-4 h-4" /> },
        { id: 'calculator', label: 'Calculadora', icon: <Split className="w-4 h-4" /> },
        { id: 'accounting', label: 'Contabilidad', icon: <Calculator className="w-4 h-4" /> },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-4 h-4" /> },
        { id: 'visits', label: 'Visitas', icon: <Footprints className="w-4 h-4" /> }, 
        { id: 'tools', label: 'Admin', icon: <Wrench className="w-4 h-4" /> },
    ];

    const mobileMenuOptions = [
        { id: 'sales_tracker', label: 'Ventas', icon: <Activity className="w-6 h-6"/>, color: 'bg-indigo-100 text-indigo-600' },
        { id: 'blacklist', label: 'Riesgos', icon: <ShieldAlert className="w-6 h-6"/>, color: 'bg-red-100 text-red-600' }, 
        { id: 'accounting', label: 'Contabilidad', icon: <Calculator className="w-6 h-6"/>, color: 'bg-blue-100 text-blue-600' },
        { id: 'supplies', label: 'Suministros', icon: <Zap className="w-6 h-6"/>, color: 'bg-yellow-100 text-yellow-600' },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-6 h-6"/>, color: 'bg-green-100 text-green-600' },
        { id: 'visits', label: 'Visitas', icon: <Footprints className="w-6 h-6"/>, color: 'bg-red-100 text-red-600' },
        { id: 'contracts', label: 'Contratos', icon: <FileText className="w-6 h-6"/>, color: 'bg-purple-100 text-purple-600' },
        { id: 'social', label: 'Mensajería', icon: <MessageCircle className="w-6 h-6"/>, color: 'bg-pink-100 text-pink-600' },
        { id: 'calculator', label: 'Inversión', icon: <Split className="w-6 h-6"/>, color: 'bg-orange-100 text-orange-600' },
        { id: 'tools', label: 'Herramientas', icon: <Wrench className="w-6 h-6"/>, color: 'bg-gray-100 text-gray-600' },
    ];

    const renderMobileContent = () => {
        const SubSectionWrapper = ({ title, children }: { title: string, children?: React.ReactNode }) => (
            <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4 sticky top-0 bg-gray-100 py-2 z-10 px-4">
                    <button onClick={() => setActiveMobileTab('menu')} className="p-2 bg-white rounded-full shadow-sm">
                        <ChevronLeft className="w-5 h-5 text-gray-600"/>
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                </div>
                <div className="flex-grow overflow-y-auto pb-24 px-2">
                    {children}
                </div>
            </div>
        );

        switch (activeMobileTab) {
            case 'overview': return (
                <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-4 h-full overflow-y-auto pb-24 px-4 pt-4">
                    <MotivationalBanner />
                    {pendingCandidatesCount > 0 && (
                        <div 
                            className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between shadow-sm cursor-pointer"
                            onClick={() => { setActiveMobileTab('candidates'); }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-full text-orange-600"><UserCheck className="w-5 h-5" /></div>
                                <div><h4 className="font-bold text-orange-800 text-sm">Candidatos Pendientes</h4><p className="text-xs text-orange-700">Requieren tu aprobación</p></div>
                            </div>
                            <span className="bg-orange-600 text-white font-bold text-lg px-3 py-1 rounded-full">{pendingCandidatesCount}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Total Habs</span><span className="text-2xl font-bold text-gray-800 block mt-1">{loadingStats ? '-' : stats.totalRooms}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Ocupación</span><span className={`text-2xl font-bold block mt-1 ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>{loadingStats ? '-' : `${stats.occupancyRate}%`}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Incidencias</span><span className="text-2xl font-bold text-red-600 block mt-1">{loadingStats ? '-' : stats.activeIncidents}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Vacías</span><span className="text-2xl font-bold text-orange-500 block mt-1">{loadingStats ? '-' : stats.vacantRooms}</span></div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm border col-span-2 border-l-4 border-l-purple-500">
                            <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1"><DollarSign className="w-3 h-3 text-purple-500"/> Comisión Mensual (Est)</span>
                            <span className="text-3xl font-bold text-purple-700 block mt-1">
                                {loadingStats ? '-' : stats.estimatedCommission.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                            </span>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border col-span-2"><span className="text-xs text-gray-500 uppercase font-bold">Balance Caja</span><span className={`text-2xl font-bold block mt-1 ${totalRealBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{totalRealBalance.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span></div>
                    </div>
                    <button onClick={() => setShowCandidateModal(true)} className="w-full bg-green-50 text-green-700 p-4 rounded-lg font-bold hover:bg-green-100 border border-green-200 flex justify-between items-center"><span className="flex items-center gap-2"><UserPlus className="w-5 h-5"/> Enviar Candidato</span><ArrowRight/></button>
                    <button onClick={() => setActiveMobileTab('tasks')} className="w-full bg-blue-50 text-blue-700 p-4 rounded-lg font-bold hover:bg-blue-100 border border-blue-200 flex justify-between items-center"><span className="flex items-center gap-2"><ClipboardList className="w-5 h-5"/> Nueva Tarea</span><ArrowRight/></button>
                </div>
            );
            case 'tasks': return <div className="animate-in fade-in h-full overflow-hidden"><TaskManager /></div>;
            case 'candidates': return <div className="animate-in fade-in h-full overflow-y-auto pb-24"><CandidateManager /></div>;
            case 'properties': return (
                <div className="flex flex-col h-full">
                    <div className="flex p-2 bg-gray-100 gap-2 shrink-0 rounded-lg mb-2">
                        <button onClick={() => setMobilePropertyView('rent')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mobilePropertyView === 'rent' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500 hover:text-gray-700'}`}>Alquiler</button>
                        <button onClick={() => setMobilePropertyView('sale')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mobilePropertyView === 'sale' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500 hover:text-gray-700'}`}>Venta (CRM)</button>
                    </div>
                    <div className="flex-grow overflow-y-auto pb-24">
                        {mobilePropertyView === 'rent' ? <RoomManager /> : <SalesCRM /> }
                    </div>
                </div>
            );
            case 'menu': return (
                <div className="animate-in slide-in-from-bottom-4 p-4 h-full overflow-y-auto pb-24">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">Más Herramientas</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {mobileMenuOptions.map(opt => (
                            <button key={opt.id} onClick={() => setActiveMobileTab(opt.id as any)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all aspect-square">
                                <div className={`p-3 rounded-full ${opt.color}`}>{opt.icon}</div>
                                <span className="font-bold text-gray-700 text-sm text-center leading-tight">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );
            case 'blacklist': return <SubSectionWrapper title="Gestión de Riesgos"><BlacklistManager /></SubSectionWrapper>; 
            case 'sales_tracker': return <SubSectionWrapper title="Seguimiento Ventas"><SalesTracker /></SubSectionWrapper>;
            case 'visits': return <SubSectionWrapper title="Visitas"><VisitsLog /></SubSectionWrapper>;
            case 'accounting': return <SubSectionWrapper title="Contabilidad"><AccountingPanel /></SubSectionWrapper>;
            case 'calendar': return <SubSectionWrapper title="Calendario"><CalendarManager /></SubSectionWrapper>;
            case 'supplies': return <SubSectionWrapper title="Suministros"><SuppliesPanel properties={propertiesList} /></SubSectionWrapper>;
            case 'contracts': return <SubSectionWrapper title="Contratos"><ContractManager onClose={() => setActiveMobileTab('menu')} /></SubSectionWrapper>;
            case 'social': return <SubSectionWrapper title="Mensajería"><SocialInbox /></SubSectionWrapper>;
            case 'calculator': return <SubSectionWrapper title="Calculadora Suministros"><SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} /></SubSectionWrapper>;
            case 'tools': return (
                <SubSectionWrapper title="Herramientas Admin">
                    <div className="space-y-4">
                        <NewsManager /> 
                        <FeedGenerator />
                        <OpportunityManager />
                        <UserCreator />
                        <FileAnalyzer />
                        <ProfitCalculator />
                    </div>
                </SubSectionWrapper>
            );
        }
    };
  
  return (
    <div className="min-h-screen bg-gray-100 p-0 sm:p-4 md:p-6 animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="p-4 md:p-6 mb-4 sm:mb-6 md:bg-white rounded-xl md:shadow-sm md:border md:border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-rentia-black flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-rentia-blue" />
                Panel de Control
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Sistema Integrado de Gestión Empresarial</p>
          </div>
          
          <div className="hidden md:flex flex-wrap gap-1 justify-end bg-gray-100 p-1 rounded-lg max-w-full">
             <button onClick={() => setActiveTab('overview')} className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <BarChart3 className="w-3.5 h-3.5" /> Resumen
             </button>
             {desktopTools.map(tool => (
                 <button key={tool.id} onClick={() => setActiveTab(tool.id as any)} className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === tool.id ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                     {tool.icon} {tool.label}
                 </button>
             ))}
          </div>
        </header>

        {/* --- CONTENT AREA (DUAL RENDER) --- */}
        <div className="md:hidden pb-20 flex flex-col h-[calc(100vh-80px)]">
            {renderMobileContent()}
        </div>
        
        <div className="hidden md:block">
            {/* DESKTOP CONTENT RENDER */}
            {activeTab === 'overview' && ( 
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                    <MotivationalBanner />
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Total Habitaciones</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-gray-800">{loadingStats ? '-' : stats.totalRooms}</span><Building className="w-6 h-6 text-blue-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Ocupación Actual</span><div className="flex justify-between items-end mt-2"><span className={`text-3xl font-bold ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>{loadingStats ? '-' : `${stats.occupancyRate}%`}</span><Users className="w-6 h-6 text-green-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Habitaciones Vacías</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-orange-600">{loadingStats ? '-' : stats.vacantRooms}</span><DoorOpen className="w-6 h-6 text-orange-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 relative overflow-hidden">
                            <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1"><DollarSign className="w-3 h-3 text-purple-500"/> Comisión Mensual (Est)</span>
                            <div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-purple-700">{loadingStats ? '-' : stats.estimatedCommission.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</span><Landmark className="w-6 h-6 text-purple-100 absolute right-4 top-4 transform scale-150" /></div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Balance Total (Caja)</span><div className="flex justify-between items-end mt-2"><span className={`text-3xl font-bold ${totalRealBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{totalRealBalance.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-sm font-medium ml-1">€</span></span><Landmark className="w-6 h-6 text-gray-100 absolute right-4 top-4 transform scale-150" /></div></div>
                    </div>
                    {/* Candidate Alerts */}
                    {pendingCandidatesCount > 0 && (
                        <div 
                            className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 flex items-center justify-between shadow-sm cursor-pointer hover:bg-orange-100 transition-colors"
                            onClick={() => { const element = document.getElementById('candidate-manager'); if (element) element.scrollIntoView({ behavior: 'smooth' }); }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-full text-orange-600 shadow-sm border border-orange-100"><UserCheck className="w-8 h-8" /></div>
                                <div><h4 className="font-bold text-orange-900 text-xl">Tienes {pendingCandidatesCount} candidatos pendientes de revisión</h4><p className="text-sm text-orange-700">Haz clic aquí para ir al gestor y aprobarlos o rechazarlos.</p></div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-orange-400" />
                        </div>
                    )}
                    <button onClick={() => setShowCandidateModal(true)} className="w-full bg-green-50 text-green-700 px-6 py-4 rounded-lg font-bold hover:bg-green-100 transition-colors items-center gap-2 border border-green-200 text-left flex justify-between shadow-sm mb-8"><div className="flex items-center gap-3"><UserPlus className="w-5 h-5"/><span>Enviar Nuevo Candidato al Pipeline</span></div><ArrowRight className="w-5 h-5"/></button>
                    <div id="candidate-manager" className="mt-8"><CandidateManager /></div>
                </div>
            )}
            
            {activeTab === 'tasks' && <div className="animate-in slide-in-from-bottom-4 duration-300"><TaskManager /></div>}
            {activeTab === 'real_estate' && <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300"><RoomManager /><SalesCRM /></div>}
            {activeTab === 'contracts' && <div className="animate-in slide-in-from-bottom-4 duration-300"><ContractManager onClose={() => setActiveTab('real_estate')} /></div>}
            {activeTab === 'calendar' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><CalendarManager /></div>}
            {activeTab === 'calculator' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} /></div>}
            {activeTab === 'social' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SocialInbox /></div>}
            {activeTab === 'visits' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><VisitsLog /></div>}
            {activeTab === 'supplies' && <div className="animate-in slide-in-from-bottom-4 duration-300"><SuppliesPanel properties={propertiesList} /></div>}
            {activeTab === 'accounting' && <div className="animate-in slide-in-from-bottom-4 duration-300"><AccountingPanel /></div>}
            {activeTab === 'sales_tracker' && <div className="animate-in slide-in-from-bottom-4 duration-300"><SalesTracker /></div>}
            {activeTab === 'blacklist' && <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><BlacklistManager /></div>} 
            
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] grid grid-cols-4 z-50 md:hidden h-16">
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

        {/* ... (Candidate Modal code) ... */}
        {showCandidateModal && createPortal(
            <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCandidateModal(false)}>
                {/* ... (Modal content) ... */}
                <form onSubmit={handleSendCandidate} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600"/> Enviar Candidato</h3>
                        <button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad *</label>
                                <select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({...newCandidate, propertyId: e.target.value, roomId: ''})}><option value="">Seleccionar...</option>{propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Habitación *</label>
                                <select required disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({...newCandidate, roomId: e.target.value})}><option value="">Seleccionar...</option>{propertiesList.find(p => p.id === newCandidate.propertyId)?.rooms.map((r:any) => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}</select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Candidato *</label>
                            <input required type="text" className="w-full p-2 border rounded text-sm font-bold" value={newCandidate.candidateName} onChange={e => setNewCandidate({...newCandidate, candidateName: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                                <input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({...newCandidate, candidatePhone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({...newCandidate, candidateEmail: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Info Adicional</label>
                            <textarea className="w-full p-2 border rounded text-sm h-20 resize-none" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({...newCandidate, additionalInfo: e.target.value})} />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-md flex items-center gap-2"><Send className="w-4 h-4"/> Enviar a Pipeline</button>
                    </div>
                </form>
            </div>,
            document.body
        )}
      </div>
    </div>
  );
};
