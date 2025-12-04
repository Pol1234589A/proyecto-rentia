
import React, { useState, useEffect, useMemo } from 'react';
import { Users, Building, AlertCircle, CheckCircle, BarChart3, RefreshCw, LayoutDashboard, Calculator, Briefcase, Wrench, Plus, ArrowUpRight, ArrowDownRight, Search, FileText, Trash2, Save, X, DollarSign, Calendar as CalendarIcon, Filter, Download, Pencil, ChevronLeft, ChevronRight, PieChart, Landmark, ChevronDown, Wallet, CreditCard, Clock, Zap, Droplets, Flame, Wifi, Settings, Receipt, Split, Info, MessageCircle, Share2, ClipboardList, UserCheck, Mail, Phone, ArrowRight, UserPlus, Archive, Send, Home, DoorOpen, Menu, Grid, Footprints, MapPin } from 'lucide-react';
import { UserCreator } from '../admin/UserCreator';
import { FileAnalyzer } from '../admin/FileAnalyzer';
import { RoomManager } from '../admin/RoomManager';
import { SalesCRM } from '../admin/SalesCRM';
import { ProfitCalculator } from '../admin/ProfitCalculator';
import { FeedGenerator } from '../admin/FeedGenerator';
import { ContractManager } from '../admin/ContractManager';
import { CalendarManager } from '../admin/CalendarManager';
import { SupplyCalculator } from '../admin/SupplyCalculator';
import { SocialInbox } from '../admin/SocialInbox';
import { TaskManager } from '../admin/TaskManager';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, setDoc, doc, serverTimestamp, orderBy, query, where, getDocs } from 'firebase/firestore';
import { Property, properties as staticProperties } from '../../data/rooms';
import { Contract, Candidate, CandidateStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// --- SUBCOMPONENT: VISITS LOG (Registro de Visitas) ---
interface VisitRecord {
    id: string;
    propertyId: string;
    propertyName: string;
    roomId: string;
    roomName: string;
    workerName: string;
    visitDate: any; // Timestamp
    outcome: 'successful' | 'unsuccessful' | 'pending';
    comments: string;
    commission?: number;
}

const VisitsLog: React.FC = () => {
    const [visits, setVisits] = useState<VisitRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterWorker, setFilterWorker] = useState<string>('all');
    const [filterOutcome, setFilterOutcome] = useState<string>('all');

    useEffect(() => {
        const q = query(collection(db, "room_visits"), orderBy("visitDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: VisitRecord[] = [];
            snapshot.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as VisitRecord);
            });
            setVisits(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredVisits = useMemo(() => {
        return visits.filter(v => {
            const matchWorker = filterWorker === 'all' || v.workerName === filterWorker;
            const matchOutcome = filterOutcome === 'all' || v.outcome === filterOutcome;
            return matchWorker && matchOutcome;
        });
    }, [visits, filterWorker, filterOutcome]);

    const uniqueWorkers = useMemo(() => Array.from(new Set(visits.map(v => v.workerName))), [visits]);

    const getOutcomeBadge = (outcome: string) => {
        switch(outcome) {
            case 'successful': return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-green-200"><CheckCircle className="w-3 h-3"/> Exitosa</span>;
            case 'unsuccessful': return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-red-200"><X className="w-3 h-3"/> No Exitosa</span>;
            default: return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-yellow-200"><Clock className="w-3 h-3"/> Pendiente</span>;
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-400">Cargando registro de visitas...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Footprints className="w-5 h-5 text-rentia-blue" />
                        Registro de Visitas
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Historial de actividad comercial de los trabajadores.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <select 
                        value={filterWorker} 
                        onChange={(e) => setFilterWorker(e.target.value)}
                        className="bg-white border border-gray-200 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rentia-blue min-w-[120px]"
                    >
                        <option value="all">Todos los Comerciales</option>
                        {uniqueWorkers.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <select 
                        value={filterOutcome} 
                        onChange={(e) => setFilterOutcome(e.target.value)}
                        className="bg-white border border-gray-200 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rentia-blue min-w-[120px]"
                    >
                        <option value="all">Todos los Resultados</option>
                        <option value="successful">Exitosas</option>
                        <option value="unsuccessful">No exitosas</option>
                        <option value="pending">Pendientes</option>
                    </select>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto bg-gray-50 p-4">
                {filteredVisits.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                        <Footprints className="w-12 h-12 mb-3 opacity-20" />
                        <p>No se encontraron visitas registradas.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Fecha</th>
                                        <th className="p-4">Comercial</th>
                                        <th className="p-4">Inmueble / Habitación</th>
                                        <th className="p-4">Resultado</th>
                                        <th className="p-4">Comentarios</th>
                                        <th className="p-4 text-right">Comisión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredVisits.map(visit => (
                                        <tr key={visit.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 text-gray-500 whitespace-nowrap text-xs">
                                                {visit.visitDate?.toDate ? visit.visitDate.toDate().toLocaleString() : 'N/A'}
                                            </td>
                                            <td className="p-4 font-bold text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                        {visit.workerName.charAt(0)}
                                                    </div>
                                                    {visit.workerName}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">{visit.propertyName}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <DoorOpen className="w-3 h-3" /> {visit.roomName}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getOutcomeBadge(visit.outcome)}
                                            </td>
                                            <td className="p-4 text-gray-600 text-xs max-w-xs truncate" title={visit.comments}>
                                                {visit.comments || '-'}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-gray-700">
                                                {visit.commission > 0 ? `${visit.commission}€` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {filteredVisits.map(visit => (
                                <div key={visit.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                {visit.workerName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{visit.workerName}</p>
                                                <p className="text-[10px] text-gray-400">
                                                    {visit.visitDate?.toDate ? visit.visitDate.toDate().toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        {getOutcomeBadge(visit.outcome)}
                                    </div>
                                    
                                    <div className="bg-gray-50 p-2 rounded-lg mb-2">
                                        <p className="font-bold text-xs text-gray-800 truncate">{visit.propertyName}</p>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                                            <DoorOpen className="w-3 h-3" /> Habitación: {visit.roomName}
                                        </p>
                                    </div>

                                    {visit.comments && (
                                        <p className="text-xs text-gray-600 italic bg-white border border-dashed border-gray-200 p-2 rounded mb-2">
                                            "{visit.comments}"
                                        </p>
                                    )}

                                    {visit.commission > 0 && (
                                        <div className="flex justify-end border-t border-gray-100 pt-2 mt-2">
                                            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" /> Comisión: {visit.commission}€
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUBCOMPONENT: CANDIDATE MANAGER ---
const CandidateManager: React.FC = () => {
    const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(
            collection(db, "candidate_pipeline"), 
            where("status", "in", ["pending_review", "approved", "rejected"]), 
            orderBy("submittedAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newCandidates: Candidate[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Candidate));
            setAllCandidates(newCandidates);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = async (id: string, status: CandidateStatus) => {
        try {
            await updateDoc(doc(db, "candidate_pipeline", id), { status });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("No se pudo actualizar el estado del candidato. Verifica permisos.");
        }
    };
    
    // Filtrado de candidatos basado en búsqueda
    const filteredCandidates = useMemo(() => {
        if (!searchTerm.trim()) return allCandidates;
        const term = searchTerm.toLowerCase();
        return allCandidates.filter(c => 
            c.candidateName.toLowerCase().includes(term) ||
            (c.candidatePhone && c.candidatePhone.includes(term)) ||
            (c.candidateEmail && c.candidateEmail.toLowerCase().includes(term)) ||
            c.propertyName.toLowerCase().includes(term)
        );
    }, [allCandidates, searchTerm]);

    const candidatesByStatus = useMemo(() => ({
        pending: filteredCandidates.filter(c => c.status === 'pending_review'),
        approved: filteredCandidates.filter(c => c.status === 'approved'),
        rejected: filteredCandidates.filter(c => c.status === 'rejected'),
    }), [filteredCandidates]);

    const renderList = (candidates: Candidate[]) => {
        if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;
        if (candidates.length === 0) return <div className="text-center py-8 text-gray-400">No hay candidatos en esta lista.</div>;

        return (
            <div className="space-y-4">
                {candidates.map(c => (
                    <div key={c.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start gap-4 animate-in fade-in slide-in-from-left-2">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-bold text-lg text-gray-800">{c.candidateName}</span>
                                {c.candidatePhone && (
                                    <a href={`tel:${c.candidatePhone}`} className="text-xs font-medium text-rentia-blue bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1 hover:bg-blue-100 ml-auto md:ml-0">
                                        <Phone className="w-3 h-3"/> <span className="hidden sm:inline">{c.candidatePhone}</span>
                                    </a>
                                )}
                            </div>
                            <div className="text-xs font-medium text-gray-500 mb-2">
                                <p className="font-bold text-gray-700">{c.propertyName}</p>
                                <p>Habitación: {c.roomName}</p>
                            </div>
                            
                            <p className="text-xs text-gray-600 bg-white p-3 border rounded-lg whitespace-pre-line leading-relaxed shadow-sm mb-3">
                                {c.additionalInfo || 'Sin información adicional.'}
                            </p>
                            <p className="text-[10px] text-gray-400">Enviado por: {c.submittedBy} - {c.submittedAt?.toDate ? c.submittedAt.toDate().toLocaleDateString() : 'N/A'}</p>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            {activeTab === 'pending' && <>
                                <button 
                                    onClick={() => handleUpdateStatus(c.id, 'rejected')} 
                                    className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 px-4 py-3 md:py-2 text-sm font-bold rounded-lg border border-red-200 transition-colors shadow-sm flex justify-center items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Rechazar
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(c.id, 'approved')} 
                                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-3 md:py-2 text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Aprobar
                                </button>
                            </>}
                            {activeTab !== 'pending' &&
                                <button onClick={() => handleUpdateStatus(c.id, 'archived')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-xs font-bold rounded-lg border border-gray-200 flex items-center gap-2 justify-center">
                                    <Archive className="w-3 h-3"/> Archivar
                                </button>
                            }
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div id="candidate-manager" className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                <h3 className="text-lg sm:text-xl font-bold text-rentia-black flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-rentia-blue" /> Gestor de Candidatos
                </h3>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar nombre, teléfono..." 
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue bg-gray-50 focus:bg-white transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
            </div>
            
            <div className="flex border-b border-gray-200 mb-6 w-full overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('pending')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0 transition-colors ${activeTab === 'pending' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Pendientes <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">{candidatesByStatus.pending.length}</span></button>
                <button onClick={() => setActiveTab('approved')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0 transition-colors ${activeTab === 'approved' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Aprobados <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{candidatesByStatus.approved.length}</span></button>
                <button onClick={() => setActiveTab('rejected')} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0 transition-colors ${activeTab === 'rejected' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Rechazados <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">{candidatesByStatus.rejected.length}</span></button>
            </div>

            {activeTab === 'pending' && renderList(candidatesByStatus.pending)}
            {activeTab === 'approved' && renderList(candidatesByStatus.approved)}
            {activeTab === 'rejected' && renderList(candidatesByStatus.rejected)}
        </div>
    );
};

// --- INTERFACES CONTABILIDAD PROFESIONAL ---
interface Transaction {
    id: string;
    date: string; // YYYY-MM-DD
    concept: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    status: 'paid' | 'pending';
    reference?: string;
    createdAt: any;
}

// --- INTERFACES SUMINISTROS ---
interface SupplyRecord {
    id: string;
    propertyId: string;
    month: string; // YYYY-MM
    electricity: number;
    water: number;
    gas: number;
    internet: number;
    cleaning: number;
    total: number;
    costPerTenant?: number;
    tenantsCount?: number;
    notes?: string;
    status: 'pending' | 'settled'; 
}

const FinancialChart = ({ data }: { data: { month: string, income: number, expense: number }[] }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000);
    const height = 100;
    
    return (
        <div className="h-40 w-full flex items-end justify-between gap-2 pt-6 pb-2 select-none overflow-x-auto no-scrollbar">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex gap-1 h-full items-end justify-center group relative min-w-[30px]">
                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        In: {d.income.toFixed(0)}€ | Out: {d.expense.toFixed(0)}€
                    </div>
                    {/* Income Bar */}
                    <div 
                        style={{ height: `${(d.income / maxVal) * height}%` }} 
                        className="w-2 sm:w-3 md:w-4 bg-emerald-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all cursor-pointer relative"
                    ></div>
                    {/* Expense Bar */}
                    <div 
                        style={{ height: `${(d.expense / maxVal) * height}%` }} 
                        className="w-2 sm:w-3 md:w-4 bg-rose-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all cursor-pointer relative"
                    ></div>
                    <span className="absolute -bottom-6 text-[8px] sm:text-[10px] text-gray-400 font-mono uppercase">{d.month}</span>
                </div>
            ))}
        </div>
    );
};

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  // --- STATE NAVEGACIÓN ---
  // Añadimos 'visits' al estado
  const [activeTab, setActiveTab] = useState<'overview' | 'real_estate' | 'accounting' | 'tools' | 'contracts' | 'calendar' | 'supplies' | 'calculator' | 'social' | 'tasks' | 'visits'>('overview');
  
  // Mobile Tab State: Includes 'visits'
  const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'tasks' | 'candidates' | 'properties' | 'menu' | 'accounting' | 'supplies' | 'calendar' | 'contracts' | 'social' | 'calculator' | 'tools' | 'visits'>('overview');
  
  // State for Mobile Property View Switching (Rent vs Sale)
  const [mobilePropertyView, setMobilePropertyView] = useState<'rent' | 'sale'>('rent');

  // ... (Estados de datos: stats, candidates, accounting, supplies... se mantienen igual)
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupancyRate: 0,
    activeIncidents: 0,
    monthlyRevenue: 0,
    vacantRooms: 0 
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingCandidatesCount, setPendingCandidatesCount] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [contractsList, setContractsList] = useState<Contract[]>([]); 
  const [selectedPropId, setSelectedPropId] = useState<string>('');
  
  // Nuevo filtro para facturas
  const [supplyFilterProperty, setSupplyFilterProperty] = useState<string>('');
  
  const [supplyMonth, setSupplyMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([]);
  const [isSupplyConfigModalOpen, setIsSupplyConfigModalOpen] = useState(false);
  const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false); 
  
  const [supplyForm, setSupplyForm] = useState({
      electricity: '',
      water: '',
      gas: '',
      internet: '',
      cleaning: '',
      notes: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [form, setForm] = useState({
      date: new Date().toISOString().split('T')[0],
      concept: '',
      amount: '',
      type: 'expense' as 'income' | 'expense',
      category: 'General',
      status: 'paid' as 'paid' | 'pending',
      reference: ''
  });
  
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
      propertyId: '', roomId: '', candidateName: '', additionalInfo: '',
      candidatePhone: '', candidateEmail: ''
  });

  // --- LOAD DATA EFFECTS (Igual que antes) ---
  useEffect(() => {
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      let totalRoomsCount = 0;
      let occupiedCount = 0;
      let revenueCount = 0;
      let renovationCount = 0;
      
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
        vacantRooms: totalRoomsCount - occupiedCount
      });
      setLoadingStats(false);
    });

    const q = query(collection(db, "accounting"), orderBy("date", "desc"));
    const unsubscribeAccounting = onSnapshot(q, (snapshot) => {
        const trans: Transaction[] = [];
        snapshot.forEach((doc) => {
            const d = doc.data();
            trans.push({ 
                id: doc.id,
                date: d.date,
                concept: d.concept,
                amount: d.amount,
                type: d.type,
                category: d.category,
                status: d.status || 'paid',
                reference: d.reference || '',
                createdAt: d.createdAt
            });
        });
        setTransactions(trans);
    });

    const qSupply = query(collection(db, "supply_records"), orderBy("month", "desc"));
    const unsubscribeSupplies = onSnapshot(qSupply, (snapshot) => {
        const recs: SupplyRecord[] = [];
        snapshot.forEach((doc) => {
            recs.push({ ...doc.data(), id: doc.id } as SupplyRecord);
        });
        setSupplyRecords(recs);
    });

    const unsubscribeContracts = onSnapshot(collection(db, "contracts"), (snapshot) => {
        const conList: Contract[] = [];
        snapshot.forEach((doc) => {
            conList.push({ ...doc.data(), id: doc.id } as Contract);
        });
        setContractsList(conList);
    });
    
    const qPending = query(collection(db, "candidate_pipeline"), where("status", "==", "pending_review"));
    const unsubPending = onSnapshot(qPending, (snap) => {
        setPendingCandidatesCount(snap.size);
    });

    return () => { unsubscribeProps(); unsubscribeAccounting(); unsubscribeSupplies(); unsubscribeContracts(); unsubPending(); };
  }, []);

  
  const activeProperty = useMemo(() => {
      return propertiesList.find(p => p.id === selectedPropId);
  }, [propertiesList, selectedPropId]);

  const currentMonthRecord = useMemo(() => {
      return supplyRecords.find(r => r.propertyId === selectedPropId && r.month === supplyMonth);
  }, [supplyRecords, selectedPropId, supplyMonth]);

  useEffect(() => {
      if (currentMonthRecord) {
          setSupplyForm({
              electricity: currentMonthRecord.electricity.toString(),
              water: currentMonthRecord.water.toString(),
              gas: currentMonthRecord.gas.toString(),
              internet: currentMonthRecord.internet.toString(),
              cleaning: currentMonthRecord.cleaning.toString(),
              notes: currentMonthRecord.notes || ''
          });
      } else {
          setSupplyForm({ electricity: '', water: '', gas: '', internet: '', cleaning: '', notes: '' });
      }
  }, [currentMonthRecord, selectedPropId, supplyMonth]);
  
  const handleSendCandidate = async (e: React.FormEvent) => {
    // ... (Logica de candidatos, facturas, etc. idéntica a la anterior)
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

  const saveSupplyRecord = async () => {
      if (!activeProperty) return;
      const elec = parseFloat(supplyForm.electricity) || 0;
      const water = parseFloat(supplyForm.water) || 0;
      const gas = parseFloat(supplyForm.gas) || 0;
      const net = parseFloat(supplyForm.internet) || 0;
      const clean = parseFloat(supplyForm.cleaning) || 0;
      const total = elec + water + gas + net + clean;
      const occupiedRooms = activeProperty.rooms?.filter((r:any) => r.status === 'occupied').length || 1;
      const costPerTenantAvg = occupiedRooms > 0 ? total / occupiedRooms : 0;
      
      const recordData = {
          propertyId: activeProperty.id,
          propertyName: activeProperty.address, 
          month: supplyMonth,
          electricity: elec,
          water: water,
          gas: gas,
          internet: net,
          cleaning: clean,
          total: total,
          tenantsCount: occupiedRooms,
          costPerTenant: costPerTenantAvg,
          notes: supplyForm.notes,
          updatedAt: serverTimestamp(),
          status: 'pending' 
      };
      try {
          if (currentMonthRecord) {
              await updateDoc(doc(db, "supply_records", currentMonthRecord.id), recordData);
          } else {
              await addDoc(collection(db, "supply_records"), recordData);
          }
          alert("Facturas registradas correctamente.");
          setIsSupplyFormOpen(false);
      } catch (e) {
          console.error(e);
          alert("Error al guardar facturas.");
      }
  };

  const deleteSupplyRecord = async (id: string) => {
      if(confirm("¿Seguro que quieres eliminar esta factura?")) {
          try {
              await deleteDoc(doc(db, "supply_records", id));
          } catch(e) {
              alert("Error al eliminar");
          }
      }
  };

  const handleSupplyStatusChange = async (id: string, newStatus: string) => {
      try {
          await updateDoc(doc(db, "supply_records", id), { status: newStatus });
      } catch (e) {
          console.error("Error updating status", e);
          alert("Error al actualizar estado");
      }
  };

  const totalRealBalance = useMemo(() => {
      return transactions.reduce((acc, curr) => {
          return acc + (curr.type === 'income' ? curr.amount : -curr.amount);
      }, 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const matchesSearch = t.concept.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (t.reference && t.reference.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesCategory = filterCategory === 'Todas' || t.category === filterCategory;
          const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
          let matchesDate = true;
          if (dateRange.start) matchesDate = matchesDate && t.date >= dateRange.start;
          if (dateRange.end) matchesDate = matchesDate && t.date <= dateRange.end;
          return matchesSearch && matchesCategory && matchesStatus && matchesDate;
      });
  }, [transactions, searchTerm, filterCategory, filterStatus, dateRange]);

  const financialSummary = useMemo(() => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let currentIncome = 0;
      let currentExpense = 0;
      let prevIncome = 0;
      let prevExpense = 0;
      const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      const pendingIncome = filteredTransactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
      const chartDataMap = new Map<string, { income: number, expense: number }>();
      for(let i=5; i>=0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`; 
          chartDataMap.set(key, { income: 0, expense: 0 });
      }
      transactions.forEach(t => {
          const tDate = new Date(t.date);
          const tMonth = tDate.getMonth();
          const tYear = tDate.getFullYear();
          const key = t.date.substring(0, 7); 
          if (tMonth === currentMonth && tYear === currentYear) {
              if(t.type === 'income') currentIncome += t.amount;
              else currentExpense += t.amount;
          }
          const prevDate = new Date();
          prevDate.setMonth(currentMonth - 1);
          if (tMonth === prevDate.getMonth() && tYear === prevDate.getFullYear()) {
              if(t.type === 'income') prevIncome += t.amount;
              else prevExpense += t.amount;
          }
          if (chartDataMap.has(key)) {
              const val = chartDataMap.get(key)!;
              if(t.type === 'income') val.income += t.amount;
              else val.expense += t.amount;
          }
      });
      const chartData = Array.from(chartDataMap.entries()).map(([key, val]) => ({
          month: key.split('-')[1], 
          ...val
      })).sort((a,b) => parseInt(a.month) - parseInt(b.month)); 
      const incomeChange = prevIncome === 0 ? 100 : ((currentIncome - prevIncome) / prevIncome) * 100;
      const expenseChange = prevExpense === 0 ? 100 : ((currentExpense - prevExpense) / prevExpense) * 100;
      return { 
          income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense, pendingIncome, currentIncome, currentExpense, incomeChange, expenseChange, chartData
      };
  }, [transactions, filteredTransactions]);

  const handleSaveTransaction = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.concept || !form.amount) return;
      const payload = {
          ...form,
          amount: parseFloat(form.amount),
          updatedAt: serverTimestamp()
      };
      try {
          if (editingId) {
              await updateDoc(doc(db, "accounting", editingId), payload);
          } else {
              await addDoc(collection(db, "accounting"), {
                  ...payload,
                  createdAt: serverTimestamp()
              });
          }
          closeModal();
      } catch (error) {
          console.error("Error saving transaction", error);
          alert("Error al guardar movimiento");
      }
  };

  const handleEdit = (t: Transaction) => {
      setForm({
          date: t.date,
          concept: t.concept,
          amount: t.amount.toString(),
          type: t.type,
          category: t.category,
          status: t.status,
          reference: t.reference || ''
      });
      setEditingId(t.id);
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(confirm("¿Eliminar este movimiento contable permanentemente?")) {
          await deleteDoc(doc(db, "accounting", id));
      }
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ date: new Date().toISOString().split('T')[0], concept: '', amount: '', type: 'expense', category: 'General', status: 'paid', reference: '' });
  };

  const exportToCSV = () => {
      const headers = ["Fecha", "Referencia", "Concepto", "Categoría", "Tipo", "Estado", "Importe"];
      const rows = filteredTransactions.map(t => [
          t.date,
          t.reference || '-',
          `"${t.concept}"`, 
          t.category,
          t.type === 'income' ? 'Ingreso' : 'Gasto',
          t.status === 'paid' ? 'Pagado' : 'Pendiente',
          t.amount.toFixed(2)
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `contabilidad_rentiaroom_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
    const desktopTools = [
        { id: 'tasks', label: 'Tareas', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'real_estate', label: 'Inmobiliaria', icon: <Building className="w-4 h-4" /> },
        { id: 'contracts', label: 'Contratos', icon: <FileText className="w-4 h-4" /> },
        { id: 'supplies', label: 'Suministros', icon: <Zap className="w-4 h-4" /> },
        { id: 'social', label: 'Mensajería', icon: <MessageCircle className="w-4 h-4" /> },
        { id: 'calculator', label: 'Calculadora', icon: <Split className="w-4 h-4" /> },
        { id: 'accounting', label: 'Contabilidad', icon: <Calculator className="w-4 h-4" /> },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-4 h-4" /> },
        { id: 'visits', label: 'Visitas', icon: <Footprints className="w-4 h-4" /> }, // NUEVA PESTAÑA VISITAS
        { id: 'tools', label: 'Herramientas', icon: <Wrench className="w-4 h-4" /> },
    ];

    // DEFINICIÓN DEL MENÚ MÓVIL (GRID)
    const mobileMenuOptions = [
        { id: 'accounting', label: 'Contabilidad', icon: <Calculator className="w-6 h-6"/>, color: 'bg-blue-100 text-blue-600' },
        { id: 'supplies', label: 'Suministros', icon: <Zap className="w-6 h-6"/>, color: 'bg-yellow-100 text-yellow-600' },
        { id: 'calendar', label: 'Calendario', icon: <CalendarIcon className="w-6 h-6"/>, color: 'bg-green-100 text-green-600' },
        { id: 'visits', label: 'Visitas', icon: <Footprints className="w-6 h-6"/>, color: 'bg-red-100 text-red-600' }, // NUEVO ÍTEM MÓVIL
        { id: 'contracts', label: 'Contratos', icon: <FileText className="w-6 h-6"/>, color: 'bg-purple-100 text-purple-600' },
        { id: 'social', label: 'Mensajería', icon: <MessageCircle className="w-6 h-6"/>, color: 'bg-pink-100 text-pink-600' },
        { id: 'calculator', label: 'Calc. Inversión', icon: <Split className="w-6 h-6"/>, color: 'bg-orange-100 text-orange-600' },
        { id: 'tools', label: 'Herramientas', icon: <Wrench className="w-6 h-6"/>, color: 'bg-gray-100 text-gray-600' },
    ];

    const renderMobileContent = () => {
        // Wrapper común para sub-secciones con botón de volver
        const SubSectionWrapper = ({ title, children }: { title: string, children?: React.ReactNode }) => (
            <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4 sticky top-0 bg-gray-100 py-2 z-10">
                    <button onClick={() => setActiveMobileTab('menu')} className="p-2 bg-white rounded-full shadow-sm">
                        <ChevronLeft className="w-5 h-5 text-gray-600"/>
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                </div>
                <div className="flex-grow overflow-y-auto pb-20">
                    {children}
                </div>
            </div>
        );

        switch (activeMobileTab) {
            case 'overview': return (
                <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-4">
                    {pendingCandidatesCount > 0 && (
                        <div 
                            className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between shadow-sm cursor-pointer"
                            onClick={() => {
                                setActiveMobileTab('candidates');
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-orange-800 text-sm">Candidatos Pendientes</h4>
                                    <p className="text-xs text-orange-700">Requieren tu aprobación</p>
                                </div>
                            </div>
                            <span className="bg-orange-600 text-white font-bold text-lg px-3 py-1 rounded-full">{pendingCandidatesCount}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Total Habs</span><span className="text-2xl font-bold text-gray-800 block mt-1">{loadingStats ? '-' : stats.totalRooms}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Ocupación</span><span className={`text-2xl font-bold block mt-1 ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>{loadingStats ? '-' : `${stats.occupancyRate}%`}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Incidencias</span><span className="text-2xl font-bold text-red-600 block mt-1">{loadingStats ? '-' : stats.activeIncidents}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border"><span className="text-xs text-gray-500 uppercase font-bold">Vacías</span><span className="text-2xl font-bold text-orange-500 block mt-1">{loadingStats ? '-' : stats.vacantRooms}</span></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border col-span-2"><span className="text-xs text-gray-500 uppercase font-bold">Balance Caja</span><span className={`text-2xl font-bold block mt-1 ${totalRealBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{totalRealBalance.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span></div>
                    </div>
                    <button onClick={() => setShowCandidateModal(true)} className="w-full bg-green-50 text-green-700 p-4 rounded-lg font-bold hover:bg-green-100 border border-green-200 flex justify-between items-center"><span className="flex items-center gap-2"><UserPlus className="w-5 h-5"/> Enviar Candidato</span><ArrowRight/></button>
                    <button onClick={() => setActiveMobileTab('tasks')} className="w-full bg-blue-50 text-blue-700 p-4 rounded-lg font-bold hover:bg-blue-100 border border-blue-200 flex justify-between items-center"><span className="flex items-center gap-2"><ClipboardList className="w-5 h-5"/> Nueva Tarea</span><ArrowRight/></button>
                </div>
            );
            case 'tasks': return <div className="animate-in fade-in"><TaskManager /></div>;
            case 'candidates': return <div className="animate-in fade-in"><CandidateManager /></div>;
            case 'properties': return (
                <div className="flex flex-col h-full">
                    {/* Sub-navigation for Properties Tab */}
                    <div className="flex p-2 bg-gray-100 gap-2 shrink-0 rounded-lg mb-2">
                        <button 
                            onClick={() => setMobilePropertyView('rent')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mobilePropertyView === 'rent' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Alquiler
                        </button>
                        <button 
                            onClick={() => setMobilePropertyView('sale')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mobilePropertyView === 'sale' ? 'bg-white shadow text-rentia-blue' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Venta (CRM)
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-hidden relative">
                        {mobilePropertyView === 'rent' ? (
                            <div className="absolute inset-0 overflow-y-auto pb-24">
                                <RoomManager />
                            </div>
                        ) : (
                            <div className="absolute inset-0 overflow-y-auto pb-24">
                                <SalesCRM />
                            </div>
                        )}
                    </div>
                </div>
            );
            
            // MENU GRID VIEW
            case 'menu': return (
                <div className="animate-in slide-in-from-bottom-4 p-2">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">Más Herramientas</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {mobileMenuOptions.map(opt => (
                            <button 
                                key={opt.id}
                                onClick={() => setActiveMobileTab(opt.id as any)}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all aspect-square"
                            >
                                <div className={`p-3 rounded-full ${opt.color}`}>
                                    {opt.icon}
                                </div>
                                <span className="font-bold text-gray-700 text-sm">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );

            // SUB-SECTIONS (Rendering desktop components adapted)
            case 'visits': return (
                <SubSectionWrapper title="Visitas">
                    <VisitsLog />
                </SubSectionWrapper>
            );
            case 'accounting': return (
                <SubSectionWrapper title="Contabilidad">
                    {/* Reutilizamos lógica de render de 'accounting' pero adaptada a wrapper */}
                    <div className="space-y-6">
                        {/* Resumen simplificado */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Balance Neto</p>
                            <span className={`text-2xl font-bold ${financialSummary.balance >= 0 ? 'text-rentia-blue' : 'text-orange-500'}`}>{financialSummary.balance.toLocaleString()}€</span>
                        </div>
                        {/* Tabla */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky left-0">
                                <h3 className="font-bold text-sm">Movimientos</h3>
                                <button onClick={() => setIsModalOpen(true)} className="bg-rentia-black text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Plus className="w-3 h-3"/> Nuevo</button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs"><tr><th className="p-3">Fecha</th><th className="p-3">Concepto</th><th className="p-3 text-right">Importe</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTransactions.map(t => (
                                        <tr key={t.id} onClick={() => handleEdit(t)} className="hover:bg-gray-50 active:bg-blue-50">
                                            <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{t.date}</td>
                                            <td className="p-3 font-medium text-gray-900 truncate max-w-[120px]">{t.concept}</td>
                                            <td className={`p-3 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)}€</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* MODAL para móvil */}
                        {isModalOpen && ( <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"><div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"><div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center sticky top-0"><h3 className="font-bold">{editingId ? 'Editar' : 'Nuevo'}</h3><button onClick={closeModal}><X className="w-5 h-5"/></button></div><form onSubmit={handleSaveTransaction} className="p-4 space-y-3"><input type="date" className="w-full p-2 border rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /><input type="text" placeholder="Concepto" className="w-full p-2 border rounded" value={form.concept} onChange={e => setForm({...form, concept: e.target.value})} /><div className="flex gap-2"><select className="w-full p-2 border rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}><option value="income">Ingreso (+)</option><option value="expense">Gasto (-)</option></select><input type="number" placeholder="Importe" className="w-full p-2 border rounded" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div><select className="w-full p-2 border rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>General</option><option>Alquiler</option><option>Suministros</option><option>Mantenimiento</option></select><button type="submit" className="w-full bg-rentia-blue text-white py-3 rounded-lg font-bold">Guardar</button></form></div></div> )}
                    </div>
                </SubSectionWrapper>
            );
            case 'calendar': return (
                <SubSectionWrapper title="Calendario">
                    <CalendarManager />
                </SubSectionWrapper>
            );
            case 'supplies': return (
                <SubSectionWrapper title="Suministros">
                    {/* Render simplificado de suministros */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                            <button onClick={() => setIsSupplyFormOpen(true)} className="w-full bg-rentia-black text-white px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Registrar Factura</button>
                        </div>
                        <div className="space-y-2">
                            {supplyRecords.map(rec => (
                                <div key={rec.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{propertiesList.find(p=>p.id===rec.propertyId)?.address}</p>
                                        <p className="text-xs text-gray-500">{rec.month}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{rec.total.toFixed(2)}€</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${rec.status==='settled'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{rec.status==='settled'?'Pagado':'Pendiente'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isSupplyFormOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                                <div className="p-4 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
                                    <h3 className="font-bold">Nueva Factura</h3>
                                    <button onClick={() => setIsSupplyFormOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                                </div>
                                <div className="p-4 space-y-3">
                                    <select className="w-full p-2 border rounded" value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)}><option value="">Propiedad...</option>{propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="month" className="w-full p-2 border rounded" value={supplyMonth} onChange={e => setSupplyMonth(e.target.value)} />
                                        <input type="number" placeholder="Luz" className="w-full p-2 border rounded" value={supplyForm.electricity} onChange={e => setSupplyForm({...supplyForm, electricity: e.target.value})} />
                                        <input type="number" placeholder="Agua" className="w-full p-2 border rounded" value={supplyForm.water} onChange={e => setSupplyForm({...supplyForm, water: e.target.value})} />
                                        <input type="number" placeholder="Internet" className="w-full p-2 border rounded" value={supplyForm.internet} onChange={e => setSupplyForm({...supplyForm, internet: e.target.value})} />
                                    </div>
                                    <button onClick={saveSupplyRecord} className="w-full bg-rentia-black text-white font-bold py-3 rounded-lg">Guardar</button>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </SubSectionWrapper>
            );
            case 'contracts': return (
                <SubSectionWrapper title="Contratos">
                    <ContractManager onClose={() => setActiveMobileTab('menu')} />
                </SubSectionWrapper>
            );
            case 'social': return (
                <SubSectionWrapper title="Mensajería">
                    <SocialInbox />
                </SubSectionWrapper>
            );
            case 'calculator': return (
                <SubSectionWrapper title="Calculadora Suministros">
                    <SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} />
                </SubSectionWrapper>
            );
            case 'tools': return (
                <SubSectionWrapper title="Herramientas Admin">
                    <div className="space-y-4">
                        <UserCreator />
                        <FileAnalyzer />
                        <ProfitCalculator />
                    </div>
                </SubSectionWrapper>
            );
        }
    };
  
    // MAIN RENDER
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
        <div className="md:hidden pb-20 h-[calc(100dvh-120px)] overflow-hidden">
            {renderMobileContent()}
        </div>
        
        <div className="hidden md:block">
            {/* ... (Renderizado de escritorio se mantiene igual) ... */}
            {activeTab === 'overview' && ( 
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Total Habitaciones</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-gray-800">{loadingStats ? '-' : stats.totalRooms}</span><Building className="w-6 h-6 text-blue-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Ocupación Actual</span><div className="flex justify-between items-end mt-2"><span className={`text-3xl font-bold ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>{loadingStats ? '-' : `${stats.occupancyRate}%`}</span><Users className="w-6 h-6 text-green-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Habitaciones Vacías</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-orange-600">{loadingStats ? '-' : stats.vacantRooms}</span><DoorOpen className="w-6 h-6 text-orange-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">En Reformas / Incidencias</span><div className="flex justify-between items-end mt-2"><span className="text-3xl font-bold text-red-600">{loadingStats ? '-' : stats.activeIncidents}</span><AlertCircle className="w-6 h-6 text-red-100 absolute right-4 top-4 transform scale-150" /></div></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 relative overflow-hidden"><span className="text-xs text-gray-500 uppercase font-bold">Balance Total (Caja)</span><div className="flex justify-between items-end mt-2"><span className={`text-3xl font-bold ${totalRealBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>{totalRealBalance.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-sm font-medium ml-1">€</span></span><Landmark className="w-6 h-6 text-purple-100 absolute right-4 top-4 transform scale-150" /></div></div>
                    </div>
                    {pendingCandidatesCount > 0 && (
                        <div 
                            className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 flex items-center justify-between shadow-sm cursor-pointer hover:bg-orange-100 transition-colors"
                            onClick={() => {
                                const element = document.getElementById('candidate-manager');
                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-full text-orange-600 shadow-sm border border-orange-100">
                                    <UserCheck className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-orange-900 text-xl">Tienes {pendingCandidatesCount} candidatos pendientes de revisión</h4>
                                    <p className="text-sm text-orange-700">Haz clic aquí para ir al gestor y aprobarlos o rechazarlos.</p>
                                </div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-orange-400" />
                        </div>
                    )}
                    <button onClick={() => setShowCandidateModal(true)} className="w-full bg-green-50 text-green-700 px-6 py-4 rounded-lg font-bold hover:bg-green-100 transition-colors items-center gap-2 border border-green-200 text-left flex justify-between shadow-sm mb-8"><div className="flex items-center gap-3"><UserPlus className="w-5 h-5"/><span>Enviar Nuevo Candidato al Pipeline</span></div><ArrowRight className="w-5 h-5"/></button>
                    <div id="candidate-manager" className="mt-8">
                        <CandidateManager />
                    </div>
                </div>
            )}
            {activeTab === 'tasks' && ( <div className="animate-in slide-in-from-bottom-4 duration-300"><TaskManager /></div> )}
            {activeTab === 'real_estate' && ( <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300"><RoomManager /><SalesCRM /></div> )}
            {activeTab === 'contracts' && ( <div className="animate-in slide-in-from-bottom-4 duration-300"><ContractManager onClose={() => setActiveTab('real_estate')} /></div> )}
            {activeTab === 'calendar' && ( <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><CalendarManager /></div> )}
            {activeTab === 'calculator' && ( <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} /></div> )}
            {activeTab === 'social' && ( <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><SocialInbox /></div> )}
            {activeTab === 'visits' && ( <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]"><VisitsLog /></div> )}
            {activeTab === 'supplies' && ( 
                <div className="animate-in slide-in-from-bottom-4 duration-300 flex flex-col gap-6">
                    {/* ... (Contenido suministros desktop se mantiene igual) ... */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Zap className="w-5 h-5 text-rentia-blue"/> Histórico de Facturas</h3>
                            <select 
                                value={supplyFilterProperty} 
                                onChange={(e) => setSupplyFilterProperty(e.target.value)} 
                                className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 focus:ring-2 focus:ring-rentia-blue outline-none min-w-[200px]"
                            >
                                <option value="">Todas las propiedades</option>
                                {propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                            </select>
                        </div>
                        <button onClick={() => setIsSupplyFormOpen(true)} className="bg-rentia-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-800 w-full sm:w-auto justify-center"><Plus className="w-4 h-4"/> Añadir Factura</button>
                    </div>
                    {/* LISTA FACTURAS */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs"><tr><th className="p-4 whitespace-nowrap">Propiedad</th><th className="p-4 whitespace-nowrap">Mes</th><th className="p-4 whitespace-nowrap">Total</th><th className="p-4 whitespace-nowrap text-center">Estado</th><th className="p-4 text-center">Acción</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {supplyRecords
                                    .filter(rec => !supplyFilterProperty || rec.propertyId === supplyFilterProperty)
                                    .map(rec => (
                                    <tr key={rec.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800 whitespace-nowrap">{propertiesList.find(p=>p.id===rec.propertyId)?.address}</td>
                                        <td className="p-4 whitespace-nowrap">{rec.month}</td>
                                        <td className="p-4 font-bold whitespace-nowrap">{rec.total.toFixed(2)}€</td>
                                        <td className="p-4 whitespace-nowrap text-center">
                                            <select 
                                                value={rec.status} 
                                                onChange={(e) => handleSupplyStatusChange(rec.id, e.target.value)}
                                                className={`px-2 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${rec.status==='settled'?'bg-green-100 text-green-700 border-green-200':'bg-yellow-100 text-yellow-700 border-yellow-200'}`}
                                            >
                                                <option value="pending">Pendiente</option>
                                                <option value="settled">Pagado</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => deleteSupplyRecord(rec.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                                {supplyRecords.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay facturas registradas.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    
                    {isSupplyFormOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                                <div className="p-4 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
                                    <h3 className="font-bold">Nueva Factura de Suministros</h3>
                                    <button onClick={() => setIsSupplyFormOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                                </div>
                                <div className="p-4 space-y-3">
                                    <select className="w-full p-2 border rounded" value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)}><option value="">Propiedad...</option>{propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="month" className="w-full p-2 border rounded" value={supplyMonth} onChange={e => setSupplyMonth(e.target.value)} />
                                        <input type="number" placeholder="Luz" className="w-full p-2 border rounded" value={supplyForm.electricity} onChange={e => setSupplyForm({...supplyForm, electricity: e.target.value})} />
                                        <input type="number" placeholder="Agua" className="w-full p-2 border rounded" value={supplyForm.water} onChange={e => setSupplyForm({...supplyForm, water: e.target.value})} />
                                        <input type="number" placeholder="Internet" className="w-full p-2 border rounded" value={supplyForm.internet} onChange={e => setSupplyForm({...supplyForm, internet: e.target.value})} />
                                    </div>
                                    <button onClick={saveSupplyRecord} className="w-full bg-rentia-black text-white font-bold py-3 rounded-lg">Guardar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div> 
            )}
            {activeTab === 'tools' && ( <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-300"><FeedGenerator /><UserCreator /><FileAnalyzer /><ProfitCalculator /></div> )}
        </div>
        
        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] grid grid-cols-5 z-50">
            <button onClick={() => setActiveMobileTab('overview')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'overview' ? 'text-rentia-blue' : 'text-gray-400'}`}><BarChart3 className="w-5 h-5"/><span className="text-[10px] font-bold">Resumen</span></button>
            <button onClick={() => setActiveMobileTab('tasks')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'tasks' ? 'text-rentia-blue' : 'text-gray-400'}`}><ClipboardList className="w-5 h-5"/><span className="text-[10px] font-bold">Tareas</span></button>
            <button onClick={() => setActiveMobileTab('candidates')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'candidates' ? 'text-rentia-blue' : 'text-gray-400'}`}><UserCheck className="w-5 h-5"/><span className="text-[10px] font-bold">Candidatos</span></button>
            <button onClick={() => setActiveMobileTab('properties')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'properties' ? 'text-rentia-blue' : 'text-gray-400'}`}><Home className="w-5 h-5"/><span className="text-[10px] font-bold">Inmuebles</span></button>
            {/* NUEVO BOTÓN MENÚ MÓVIL */}
            <button onClick={() => setActiveMobileTab('menu')} className={`py-2 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'menu' ? 'text-rentia-blue' : 'text-gray-400'}`}><Grid className="w-5 h-5"/><span className="text-[10px] font-bold">Más</span></button>
        </div>

        {/* --- MODALS (retained) --- */}
        {showCandidateModal && ( <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCandidateModal(false)}><form onSubmit={handleSendCandidate} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 bg-gray-50 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600"/> Enviar Candidato</h3><button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 -mr-2"><X className="w-5 h-5 text-gray-400"/></button></div><div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad *</label><select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({...newCandidate, propertyId: e.target.value, roomId: ''})}><option value="">Seleccionar...</option>{propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Habitación *</label><select required disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({...newCandidate, roomId: e.target.value})}><option value="">Seleccionar...</option>{propertiesList.find(p => p.id === newCandidate.propertyId)?.rooms.map((r:any) => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}</select></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Candidato *</label><input required type="text" className="w-full p-2 border rounded text-sm font-bold" value={newCandidate.candidateName} onChange={e => setNewCandidate({...newCandidate, candidateName: e.target.value})} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label><input type="tel" className="w-full p-2 border rounded text-sm" value={newCandidate.candidatePhone} onChange={e => setNewCandidate({...newCandidate, candidatePhone: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label><input type="email" className="w-full p-2 border rounded text-sm" value={newCandidate.candidateEmail} onChange={e => setNewCandidate({...newCandidate, candidateEmail: e.target.value})} /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Info Adicional</label><textarea className="w-full p-2 border rounded text-sm h-20 resize-none" value={newCandidate.additionalInfo} onChange={e => setNewCandidate({...newCandidate, additionalInfo: e.target.value})} /></div></div><div className="p-4 bg-gray-50 border-t flex justify-end"><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-md flex items-center gap-2"><Send className="w-4 h-4"/> Enviar a Pipeline</button></div></form></div> )}
        {isModalOpen && ( <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={closeModal}><div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden" onClick={e => e.stopPropagation()}><div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-gray-800">{editingId ? 'Editar' : 'Nuevo'} Movimiento</h3><button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button></div><form onSubmit={handleSaveTransaction} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">{/* ... Form content ... */}</form></div></div> )}
      </div>
    </div>
  );
};
