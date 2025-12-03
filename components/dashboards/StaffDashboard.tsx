import React, { useState, useEffect, useMemo } from 'react';
import { Users, Building, AlertCircle, CheckCircle, BarChart3, RefreshCw, LayoutDashboard, Calculator, Briefcase, Wrench, Plus, ArrowUpRight, ArrowDownRight, Search, FileText, Trash2, Save, X, DollarSign, Calendar as CalendarIcon, Filter, Download, Pencil, ChevronLeft, ChevronRight, PieChart, Landmark, ChevronDown, Wallet, CreditCard, Clock, Zap, Droplets, Flame, Wifi, Settings, Receipt, Split, Info, MessageCircle, Share2, ClipboardList, UserCheck, Mail, Phone, ArrowRight, UserPlus, Archive, Send } from 'lucide-react';
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
import { Property, properties as staticProperties } from '../../data/rooms'; // Import static properties too
import { Contract, Candidate, CandidateStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// --- SUBCOMPONENT: CANDIDATE MANAGER ---
const CandidateManager: React.FC = () => {
    const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

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
            alert("No se pudo actualizar el estado del candidato.");
        }
    };
    
    const candidatesByStatus = useMemo(() => ({
        pending: allCandidates.filter(c => c.status === 'pending_review'),
        approved: allCandidates.filter(c => c.status === 'approved'),
        rejected: allCandidates.filter(c => c.status === 'rejected'),
    }), [allCandidates]);

    const renderList = (candidates: Candidate[]) => {
        if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;
        if (candidates.length === 0) return <div className="text-center py-8 text-gray-400">No hay candidatos en esta lista.</div>;

        return (
            <div className="space-y-4">
                {candidates.map(c => (
                    <div key={c.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2 flex-wrap">
                                <span className="font-bold text-lg text-gray-800">{c.candidateName}</span>
                                <div className="text-xs font-medium text-gray-500">
                                    <p className="font-bold">{c.propertyName}</p>
                                    <p>Habitación: {c.roomName}</p>
                                </div>
                                {c.candidatePhone && (
                                    <a href={`tel:${c.candidatePhone}`} className="text-xs font-medium text-rentia-blue bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1 hover:bg-blue-100">
                                        <Phone className="w-3 h-3"/> {c.candidatePhone}
                                    </a>
                                )}
                                {c.candidateEmail && (
                                    <a href={`mailto:${c.candidateEmail}`} className="text-xs font-medium text-rentia-blue bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1 hover:bg-blue-100">
                                        <Mail className="w-3 h-3"/> {c.candidateEmail}
                                    </a>
                                )}
                            </div>
                            <p className="text-xs text-gray-600 bg-white p-2 border rounded whitespace-pre-line">{c.additionalInfo}</p>
                            <p className="text-[10px] text-gray-400 mt-2">Enviado por: {c.submittedBy} - {c.submittedAt?.toDate().toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                            {activeTab === 'pending' && <>
                                <button onClick={() => handleUpdateStatus(c.id, 'rejected')} className="w-1/2 md:w-auto flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 text-xs font-bold rounded-lg border border-red-100 transition-colors">Rechazar</button>
                                <button onClick={() => handleUpdateStatus(c.id, 'approved')} className="w-1/2 md:w-auto flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors">Aprobar</button>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-rentia-black flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-rentia-blue" /> Gestor de Candidatos
                </h3>
            </div>
            
            <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'pending' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Pendientes <span className="bg-yellow-100 text-yellow-800 text-xs px-2 rounded-full">{candidatesByStatus.pending.length}</span></button>
                <button onClick={() => setActiveTab('approved')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'approved' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Aprobados <span className="bg-green-100 text-green-800 text-xs px-2 rounded-full">{candidatesByStatus.approved.length}</span></button>
                <button onClick={() => setActiveTab('rejected')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'rejected' ? 'border-b-2 border-rentia-blue text-rentia-blue' : 'text-gray-500'}`}>Rechazados <span className="bg-red-100 text-red-800 text-xs px-2 rounded-full">{candidatesByStatus.rejected.length}</span></button>
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
    status: 'pending' | 'settled'; // Pendiente de cobro a inquilinos o liquidado
}

// Subcomponente: Gráfica de Barras Simple (SVG) Responsive
const FinancialChart = ({ data }: { data: { month: string, income: number, expense: number }[] }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000);
    const height = 100;
    
    return (
        <div className="h-40 w-full flex items-end justify-between gap-2 pt-6 pb-2 select-none">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex gap-1 h-full items-end justify-center group relative min-w-[20px]">
                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        In: {d.income.toFixed(0)}€ | Out: {d.expense.toFixed(0)}€
                    </div>
                    {/* Income Bar */}
                    <div 
                        style={{ height: `${(d.income / maxVal) * height}%` }} 
                        className="w-1.5 sm:w-3 md:w-4 bg-emerald-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all cursor-pointer relative"
                    ></div>
                    {/* Expense Bar */}
                    <div 
                        style={{ height: `${(d.expense / maxVal) * height}%` }} 
                        className="w-1.5 sm:w-3 md:w-4 bg-rose-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all cursor-pointer relative"
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
  const [activeTab, setActiveTab] = useState<'overview' | 'real_estate' | 'accounting' | 'tools' | 'contracts' | 'calendar' | 'supplies' | 'calculator' | 'social' | 'tasks'>('overview');

  // --- STATE RESUMEN OPERATIVO ---
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupancyRate: 0,
    activeIncidents: 0,
    monthlyRevenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // --- STATE CONTABILIDAD ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // --- STATE SUMINISTROS ---
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [contractsList, setContractsList] = useState<Contract[]>([]); 
  const [selectedPropId, setSelectedPropId] = useState<string>('');
  const [supplyMonth, setSupplyMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([]);
  const [isSupplyConfigModalOpen, setIsSupplyConfigModalOpen] = useState(false);
  
  // Formulario Facturas Suministros
  const [supplyForm, setSupplyForm] = useState({
      electricity: '',
      water: '',
      gas: '',
      internet: '',
      cleaning: '',
      notes: ''
  });

  // Configuración Propiedad Seleccionada (Para Modal)
  const [configProp, setConfigProp] = useState<any>(null);

  // Filtros Contabilidad
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Formulario Contabilidad General
  const [form, setForm] = useState({
      date: new Date().toISOString().split('T')[0],
      concept: '',
      amount: '',
      type: 'expense' as 'income' | 'expense',
      category: 'General',
      status: 'paid' as 'paid' | 'pending',
      reference: ''
  });
  
  // --- STATE: MODAL ENVIAR CANDIDATO ---
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
      propertyId: '', roomId: '', candidateName: '', additionalInfo: '',
      candidatePhone: '', candidateEmail: ''
  });

  // --- LOAD DATA (USE EFFECT) ---
  useEffect(() => {
    // 1. Propiedades para KPIs y Suministros (MERGED)
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      let totalRoomsCount = 0;
      let occupiedCount = 0;
      let revenueCount = 0;
      let renovationCount = 0;
      
      const firestoreProps: any[] = [];
      snapshot.forEach((doc) => {
        firestoreProps.push({ ...doc.data(), id: doc.id });
      });

      // Merge Logic for Dashboard: Combine Firestore + Static not in DB
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

      // Calculate stats on merged list
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
      
      // Auto-select first if none selected
      if (!selectedPropId && allProps.length > 0) setSelectedPropId(allProps[0].id);

      setStats({
        totalRooms: totalRoomsCount,
        occupancyRate: totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0,
        monthlyRevenue: revenueCount,
        activeIncidents: renovationCount
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

    return () => { unsubscribeProps(); unsubscribeAccounting(); unsubscribeSupplies(); unsubscribeContracts(); };
  }, []);

  
  // Propiedad seleccionada actualmente
  const activeProperty = useMemo(() => {
      return propertiesList.find(p => p.id === selectedPropId);
  }, [propertiesList, selectedPropId]);

  const currentMonthRecord = useMemo(() => {
      return supplyRecords.find(r => r.propertyId === selectedPropId && r.month === supplyMonth);
  }, [supplyRecords, selectedPropId, supplyMonth]);

  const calculatedSplits = useMemo(() => {
      if (!activeProperty || activeProperty.suppliesConfig?.type === 'fixed') return null;
      const totalAmount = (parseFloat(supplyForm.electricity||'0') + parseFloat(supplyForm.water||'0') + parseFloat(supplyForm.gas||'0') + parseFloat(supplyForm.internet||'0') + parseFloat(supplyForm.cleaning||'0'));
      if (totalAmount <= 0) return null;
      const [yearStr, monthStr] = supplyMonth.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; 
      const daysInMonth = new Date(year, month + 1, 0).getDate(); 
      const dailyBillCost = totalAmount / daysInMonth;
      const tenantCosts: Record<string, { name: string, days: number, amount: number, roomName: string }> = {};
      let ownerShare = 0;
      for (let day = 1; day <= daysInMonth; day++) {
          const currentDay = new Date(year, month, day, 12, 0, 0); 
          const activeTenantsToday = contractsList.filter(c => {
              if (c.propertyId !== activeProperty.id) return false;
              const cStart = new Date(c.startDate);
              const cEnd = c.endDate ? new Date(c.endDate) : new Date(2099, 11, 31); 
              cStart.setHours(0,0,0,0);
              cEnd.setHours(23,59,59,999);
              return currentDay >= cStart && currentDay <= cEnd;
          });
          if (activeTenantsToday.length > 0) {
              const costPerHead = dailyBillCost / activeTenantsToday.length;
              activeTenantsToday.forEach(t => {
                  if (!tenantCosts[t.id!]) {
                      tenantCosts[t.id!] = { name: t.tenantName, days: 0, amount: 0, roomName: t.roomName };
                  }
                  tenantCosts[t.id!].days += 1;
                  tenantCosts[t.id!].amount += costPerHead;
              });
          } else {
              ownerShare += dailyBillCost;
          }
      }
      return {
          tenantSplits: Object.values(tenantCosts).sort((a,b) => a.roomName.localeCompare(b.roomName)),
          ownerShare
      };
  }, [activeProperty, supplyForm, supplyMonth, contractsList]);

  // Use Effects for Supply Form
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
  
  // --- NEW: Handle Candidate Submission by Staff ---
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


  // Actions
  const savePropertyConfig = async () => {
      if (!configProp) return;
      try {
          const docRef = doc(db, "properties", configProp.id);
          // If property is static (not in DB yet), setDoc with merge creates it.
          await setDoc(docRef, {
              ...configProp,
              suppliesConfig: {
                  type: configProp.suppliesConfig?.type || 'shared',
                  fixedAmount: configProp.suppliesConfig?.fixedAmount || 0
              }
          }, { merge: true });
          setIsSupplyConfigModalOpen(false);
      } catch (e) {
          console.error("Error saving prop config", e);
          alert("Error al guardar configuración");
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
      let notes = supplyForm.notes;
      if (calculatedSplits && activeProperty.suppliesConfig?.type === 'shared') {
          const breakdown = calculatedSplits.tenantSplits.map(t => `${t.roomName} (${t.name}): ${t.amount.toFixed(2)}€ [${t.days} días]`).join('\n');
          const ownerNote = calculatedSplits.ownerShare > 0.01 ? `\nVacancia (Prop.): ${calculatedSplits.ownerShare.toFixed(2)}€` : '';
          notes = `${notes ? notes + '\n\n' : ''}--- DESGLOSE AUTOMÁTICO (${new Date().toLocaleDateString()}) ---\n${breakdown}${ownerNote}`;
      }
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
          notes: notes,
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
          setSupplyForm(prev => ({...prev, notes: notes || ''}));
      } catch (e) {
          console.error(e);
          alert("Error al guardar facturas.");
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

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-8 animate-in fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER PRINCIPAL --- */}
        <header className="mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-rentia-black flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-rentia-blue" />
                Panel de Control
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Sistema Integrado de Gestión Empresarial</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar max-w-full w-full md:w-auto">
             <button onClick={() => setActiveTab('overview')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Resumen</span>
             </button>
             <button onClick={() => setActiveTab('tasks')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'tasks' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <ClipboardList className="w-4 h-4" /> <span className="hidden sm:inline">Tareas</span>
             </button>
             <button onClick={() => setActiveTab('real_estate')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'real_estate' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Building className="w-4 h-4" /> <span className="hidden sm:inline">Inmobiliaria</span>
             </button>
             <button onClick={() => setActiveTab('contracts')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'contracts' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Contratos</span>
             </button>
             <button onClick={() => setActiveTab('supplies')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'supplies' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Zap className="w-4 h-4" /> <span className="hidden sm:inline">Suministros</span>
             </button>
             <button onClick={() => setActiveTab('social')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'social' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">Mensajería</span>
             </button>
             <button onClick={() => setActiveTab('calculator')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'calculator' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Split className="w-4 h-4" /> <span className="hidden sm:inline">Calculadora</span>
             </button>
             <button onClick={() => setActiveTab('accounting')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'accounting' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Calculator className="w-4 h-4" /> <span className="hidden sm:inline">Contabilidad</span>
             </button>
             <button onClick={() => setActiveTab('calendar')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'calendar' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <CalendarIcon className="w-4 h-4" /> <span className="hidden sm:inline">Calendario</span>
             </button>
             <button onClick={() => setActiveTab('tools')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'tools' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Wrench className="w-4 h-4" /> <span className="hidden sm:inline">Herramientas</span>
             </button>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 relative overflow-hidden">
                        <span className="text-xs text-gray-500 uppercase font-bold">Total Habitaciones</span>
                        <div className="flex justify-between items-end mt-2">
                            <span className="text-3xl font-bold text-gray-800">
                                {loadingStats ? '-' : stats.totalRooms}
                            </span>
                            <Building className="w-6 h-6 text-blue-100 absolute right-4 top-4 transform scale-150" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 relative overflow-hidden">
                        <span className="text-xs text-gray-500 uppercase font-bold">Ocupación Actual</span>
                        <div className="flex justify-between items-end mt-2">
                            <span className={`text-3xl font-bold ${stats.occupancyRate > 90 ? 'text-green-600' : 'text-gray-800'}`}>
                                {loadingStats ? '-' : `${stats.occupancyRate}%`}
                            </span>
                            <Users className="w-6 h-6 text-green-100 absolute right-4 top-4 transform scale-150" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 relative overflow-hidden">
                        <span className="text-xs text-gray-500 uppercase font-bold">En Reformas / Incidencias</span>
                        <div className="flex justify-between items-end mt-2">
                            <span className="text-3xl font-bold text-red-600">
                                {loadingStats ? '-' : stats.activeIncidents}
                            </span>
                            <AlertCircle className="w-6 h-6 text-red-100 absolute right-4 top-4 transform scale-150" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500 relative overflow-hidden">
                        <span className="text-xs text-gray-500 uppercase font-bold">Balance Total (Caja)</span>
                        <div className="flex justify-between items-end mt-2">
                            <span className={`text-3xl font-bold ${totalRealBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                                {totalRealBalance.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                <span className="text-sm font-medium ml-1">€</span>
                            </span>
                            <Landmark className="w-6 h-6 text-purple-100 absolute right-4 top-4 transform scale-150" />
                        </div>
                    </div>
                </div>
                
                <button onClick={() => setShowCandidateModal(true)} className="w-full bg-green-50 text-green-700 px-6 py-4 rounded-lg font-bold hover:bg-green-100 transition-colors items-center gap-2 border border-green-200 text-left flex justify-between shadow-sm mb-8">
                    <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5"/>
                        <span>Enviar Nuevo Candidato al Pipeline</span>
                    </div>
                    <ArrowRight className="w-5 h-5"/>
                </button>

                <div className="mt-8">
                    <CandidateManager />
                </div>
            </div>
        )}

        {/* TAB 2: TASKS (NEW) */}
        {activeTab === 'tasks' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
                <TaskManager />
            </div>
        )}

        {/* TAB 3: REAL ESTATE */}
        {activeTab === 'real_estate' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <RoomManager />
                <SalesCRM />
            </div>
        )}

        {/* TAB 4: CONTRACTS */}
        {activeTab === 'contracts' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
                <ContractManager onClose={() => setActiveTab('real_estate')} />
            </div>
        )}

        {/* TAB 5: CALENDAR */}
        {activeTab === 'calendar' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]">
                <CalendarManager />
            </div>
        )}

        {/* TAB 6: CALCULADORA */}
        {activeTab === 'calculator' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]">
                <SupplyCalculator properties={propertiesList} preSelectedPropertyId={selectedPropId} />
            </div>
        )}

        {/* TAB 7: SOCIAL INBOX */}
        {activeTab === 'social' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 h-[800px]">
                <SocialInbox />
            </div>
        )}

        {/* TAB 8: SUMINISTROS */}
        {activeTab === 'supplies' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-rentia-gold" />
                            Gestión de Suministros
                        </h2>
                        <p className="text-xs text-gray-500">Configuración de viviendas y registro mensual de facturas.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[700px]">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700 text-sm">
                            Viviendas ({propertiesList.length})
                        </div>
                        <div className="overflow-y-auto flex-grow p-2">
                            {propertiesList.map(prop => (
                                <div 
                                    key={prop.id} 
                                    onClick={() => setSelectedPropId(prop.id)}
                                    className={`p-3 rounded-lg mb-2 cursor-pointer border transition-all flex justify-between items-center ${selectedPropId === prop.id ? 'bg-blue-50 border-rentia-blue shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <div className="font-bold text-sm text-gray-800">{prop.address}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {prop.suppliesConfig?.type === 'fixed' ? (
                                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200">
                                                    Fijo: {prop.suppliesConfig.fixedAmount}€
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold border border-orange-200">
                                                    Reparto Gastos
                                                </span>
                                            )}
                                            <span className="text-[10px] text-gray-400">({prop.rooms?.length || 0} habs)</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setConfigProp(prop); setIsSupplyConfigModalOpen(true); }}
                                        className="p-2 text-gray-400 hover:text-rentia-blue hover:bg-white rounded-full"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-gray-600">Periodo:</span>
                                <input 
                                    type="month" 
                                    value={supplyMonth} 
                                    onChange={(e) => setSupplyMonth(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-800 focus:border-rentia-blue outline-none"
                                />
                            </div>
                            {activeProperty && (
                                <div className="text-right">
                                    <div className="text-xs text-gray-500">Vivienda Activa</div>
                                    <div className="font-bold text-rentia-blue text-sm">{activeProperty.address}</div>
                                </div>
                            )}
                        </div>

                        {activeProperty ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                        <Receipt className="w-4 h-4" /> Registro de Facturas Reales
                                    </h3>
                                    {activeProperty.suppliesConfig?.type === 'fixed' && (
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">
                                            Modo: Cuota Fija ({activeProperty.suppliesConfig.fixedAmount}€/hab)
                                        </span>
                                    )}
                                </div>
                                
                                <div className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500"/> Luz (€)</label>
                                            <input type="number" step="0.01" className="w-full p-2 border rounded text-sm font-bold" placeholder="0.00" value={supplyForm.electricity} onChange={e => setSupplyForm({...supplyForm, electricity: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-500"/> Agua (€)</label>
                                            <input type="number" step="0.01" className="w-full p-2 border rounded text-sm font-bold" placeholder="0.00" value={supplyForm.water} onChange={e => setSupplyForm({...supplyForm, water: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500"/> Gas (€)</label>
                                            <input type="number" step="0.01" className="w-full p-2 border rounded text-sm font-bold" placeholder="0.00" value={supplyForm.gas} onChange={e => setSupplyForm({...supplyForm, gas: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Wifi className="w-3 h-3 text-indigo-500"/> Internet (€)</label>
                                            <input type="number" step="0.01" className="w-full p-2 border rounded text-sm font-bold" placeholder="0.00" value={supplyForm.internet} onChange={e => setSupplyForm({...supplyForm, internet: e.target.value})} />
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Limpieza / Extras (€)</label>
                                        <input type="number" step="0.01" className="w-full p-2 border rounded text-sm font-bold md:w-1/4" placeholder="0.00" value={supplyForm.cleaning} onChange={e => setSupplyForm({...supplyForm, cleaning: e.target.value})} />
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Resumen del Mes</h4>
                                        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                                            <div>
                                                <span className="block text-xs text-gray-400">Total Facturas</span>
                                                <span className="text-2xl font-bold text-slate-800">
                                                    {(parseFloat(supplyForm.electricity||'0') + parseFloat(supplyForm.water||'0') + parseFloat(supplyForm.gas||'0') + parseFloat(supplyForm.internet||'0') + parseFloat(supplyForm.cleaning||'0')).toFixed(2)} €
                                                </span>
                                            </div>
                                            
                                            {(!activeProperty.suppliesConfig || activeProperty.suppliesConfig.type === 'shared') && (
                                                <div className="flex-grow w-full md:w-auto md:border-l md:pl-6 border-slate-200">
                                                    {calculatedSplits ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                                                                    <CheckCircle className="w-3 h-3" /> Cálculo Exacto (Prorrateo)
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                                {calculatedSplits.tenantSplits.map(t => (
                                                                    <div key={t.name} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                                                                        <div>
                                                                            <span className="font-bold text-slate-700">{t.roomName}</span>
                                                                            <span className="text-[10px] text-gray-400 block">{t.name} ({t.days} días)</span>
                                                                        </div>
                                                                        <span className="font-bold text-rentia-blue text-sm">{t.amount.toFixed(2)}€</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {calculatedSplits.ownerShare > 0.01 && (
                                                                <div className="text-[10px] text-red-500 mt-1 flex justify-between px-2">
                                                                    <span>Coste Vacancia (Prop.):</span>
                                                                    <span className="font-bold">{calculatedSplits.ownerShare.toFixed(2)}€</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-xs text-gray-400 py-2">
                                                            <Info className="w-4 h-4 mx-auto mb-1 opacity-50" />
                                                            Introduce importes para ver el reparto.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button onClick={saveSupplyRecord} className="bg-rentia-black text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 flex items-center gap-2 shadow-lg">
                                            <Save className="w-4 h-4" /> Guardar Registro
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-white rounded-xl border border-dashed text-gray-400">
                                Selecciona una vivienda para gestionar sus suministros.
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-800 text-sm mb-4">Historial Reciente</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                                        <tr>
                                            <th className="p-3">Mes</th>
                                            <th className="p-3">Propiedad</th>
                                            <th className="p-3 text-right">Total Facturas</th>
                                            <th className="p-3 text-right">Coste/Inq</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {supplyRecords.slice(0, 5).map(rec => (
                                            <tr key={rec.id}>
                                                <td className="p-3 font-mono text-xs">{rec.month}</td>
                                                <td className="p-3 font-bold text-gray-700">{rec.propertyId === activeProperty?.id ? activeProperty?.address : '...'}</td>
                                                <td className="p-3 text-right text-red-600 font-bold">{rec.total.toFixed(2)}€</td>
                                                <td className="p-3 text-right text-blue-600 font-bold">{rec.costPerTenant?.toFixed(2)}€</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {isSupplyConfigModalOpen && configProp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="font-bold text-lg text-gray-800">Configurar Suministros</h3>
                                <p className="text-sm text-gray-500">{configProp.address}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modelo de Cobro</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setConfigProp({...configProp, suppliesConfig: { ...configProp.suppliesConfig, type: 'fixed' }})}
                                            className={`p-3 rounded border text-sm font-bold transition-colors ${configProp.suppliesConfig?.type === 'fixed' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Cuota Fija
                                        </button>
                                        <button 
                                            onClick={() => setConfigProp({...configProp, suppliesConfig: { ...configProp.suppliesConfig, type: 'shared' }})}
                                            className={`p-3 rounded border text-sm font-bold transition-colors ${configProp.suppliesConfig?.type === 'shared' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            Reparto Gastos
                                        </button>
                                    </div>
                                </div>

                                {configProp.suppliesConfig?.type === 'fixed' && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Importe Fijo por Habitación (€)</label>
                                        <input 
                                            type="number" 
                                            value={configProp.suppliesConfig?.fixedAmount || ''}
                                            onChange={(e) => setConfigProp({...configProp, suppliesConfig: { ...configProp.suppliesConfig, fixedAmount: parseFloat(e.target.value) }})}
                                            className="w-full p-3 border rounded-lg font-bold text-purple-700 bg-purple-50 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Ej: 50"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">
                                            * Los inquilinos pagarán esta cantidad fija independientemente del consumo real.
                                        </p>
                                    </div>
                                )}

                                {configProp.suppliesConfig?.type === 'shared' && (
                                    <div className="bg-orange-50 p-3 rounded border border-orange-100 text-xs text-orange-800 animate-in slide-in-from-top-2">
                                        <strong>Modelo Reparto:</strong> El coste total de las facturas se dividirá mensualmente entre el número de habitaciones ocupadas.
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 flex justify-end gap-2">
                                <button onClick={() => setIsSupplyConfigModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded text-sm">Cancelar</button>
                                <button onClick={savePropertyConfig} className="px-6 py-2 bg-rentia-black text-white font-bold rounded text-sm hover:bg-gray-800 shadow">Guardar Cambios</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* TAB 9: ACCOUNTING (RETAINED) */}
        {activeTab === 'accounting' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6">
                
                {/* Header Contabilidad */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-rentia-blue" />
                            Contabilidad Corporativa
                        </h2>
                        <p className="text-xs text-gray-500">Gestión de ingresos, gastos inmobiliarios y costes de empresa.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Apunte
                    </button>
                </div>

                {/* 1. KPIs Financieros Superiores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Caja Total */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                        <div>
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Balance Total</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className={`text-2xl font-bold font-mono ${financialSummary.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                    {financialSummary.balance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                            <span className="text-gray-400">Flujo Neto</span>
                            {financialSummary.balance > 0 ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                        </div>
                    </div>

                    {/* Ingresos Mes */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                        <div>
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Ingresos (Mes)</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold font-mono text-green-600">
                                    {financialSummary.currentIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                            <span className="text-gray-400">vs Mes Anterior</span>
                            <div className={`flex items-center gap-1 font-bold ${financialSummary.incomeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {financialSummary.incomeChange.toFixed(1)}%
                                {financialSummary.incomeChange >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                            </div>
                        </div>
                    </div>

                    {/* Gastos Mes */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                        <div>
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Gastos (Mes)</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold font-mono text-red-500">
                                    {financialSummary.currentExpense.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                            <span className="text-gray-400">vs Mes Anterior</span>
                            <div className={`flex items-center gap-1 font-bold ${financialSummary.expenseChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {financialSummary.expenseChange.toFixed(1)}%
                                {financialSummary.expenseChange <= 0 ? <ArrowDownRight className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                            </div>
                        </div>
                    </div>

                    {/* Pendiente Cobro */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <AlertCircle className="w-16 h-16 text-orange-500" />
                        </div>
                        <div>
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Pendiente Cobro</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold font-mono text-orange-500">
                                    {financialSummary.pendingIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-orange-600 font-medium">
                            Requiere seguimiento
                        </div>
                    </div>
                </div>

                {/* 2. Gráfica de Tendencia */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" /> Flujo de Caja (Últimos 6 meses)
                    </h3>
                    <FinancialChart data={financialSummary.chartData} />
                </div>

                {/* 3. Panel de Filtros y Tabla */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar concepto..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-rentia-blue/50"
                                />
                            </div>
                            <button 
                                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                                className="lg:hidden px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 flex items-center justify-center gap-2"
                            >
                                <Filter className="w-4 h-4" /> Filtros
                            </button>
                        </div>

                        <div className={`flex flex-col sm:flex-row gap-2 w-full lg:w-auto ${showFiltersMobile ? 'flex' : 'hidden lg:flex'}`}>
                            <select 
                                value={filterCategory} 
                                onChange={(e) => setFilterCategory(e.target.value)} 
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
                            >
                                <option value="Todas">Todas las Categorías</option>
                                <option value="Alquiler">Alquiler</option>
                                <option value="Suministros">Suministros</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Gestión">Honorarios</option>
                                <option value="Impuestos">Impuestos</option>
                                <option value="General">General</option>
                            </select>

                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value as any)} 
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="paid">Pagado</option>
                                <option value="pending">Pendiente</option>
                            </select>

                            <input 
                                type="date" 
                                value={dateRange.start} 
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            />
                            
                            <button onClick={exportToCSV} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg border border-gray-200 transition-colors" title="Exportar CSV">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4 w-32">Fecha</th>
                                    <th className="p-4">Concepto</th>
                                    <th className="p-4 w-32">Categoría</th>
                                    <th className="p-4 w-32 text-right">Importe</th>
                                    <th className="p-4 w-24 text-center">Estado</th>
                                    <th className="p-4 w-24 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50 group transition-colors">
                                        <td className="p-4 text-gray-500 font-mono text-xs">{t.date}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{t.concept}</div>
                                            {t.reference && <div className="text-xs text-gray-400 mt-0.5">Ref: {t.reference}</div>}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 border border-gray-200">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-mono font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)} €
                                        </td>
                                        <td className="p-4 text-center">
                                            {t.status === 'paid' ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full animate-pulse">
                                                    <Clock className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"><Pencil className="w-3.5 h-3.5"/></button>
                                                <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400">
                                            No hay movimientos que coincidan con los filtros.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL NUEVO/EDITAR MOVIMIENTO */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">{editingId ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                            </div>
                            
                            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button type="button" onClick={() => setForm({...form, type: 'income'})} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${form.type === 'income' ? 'bg-green-500 text-white shadow' : 'text-gray-500'}`}>Ingreso</button>
                                            <button type="button" onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${form.type === 'expense' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}>Gasto</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                                        <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-rentia-blue/50" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Concepto</label>
                                    <input type="text" required placeholder="Ej: Alquiler Habitación 1..." value={form.concept} onChange={e => setForm({...form, concept: e.target.value})} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/50 outline-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Importe (€)</label>
                                        <input type="number" step="0.01" required placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2 border rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-rentia-blue/50 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                                        <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full p-2 border rounded-lg text-sm bg-white">
                                            <option value="paid">Pagado</option>
                                            <option value="pending">Pendiente</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white">
                                            <option value="General">General</option>
                                            <option value="Alquiler">Alquiler</option>
                                            <option value="Suministros">Suministros</option>
                                            <option value="Mantenimiento">Mantenimiento</option>
                                            <option value="Gestión">Honorarios</option>
                                            <option value="Impuestos">Impuestos</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia (Opcional)</label>
                                        <input type="text" placeholder="ID Factura..." value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue/50 outline-none" />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
                                    <button type="submit" className="bg-rentia-black text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 shadow-md">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* TAB 10: HERRAMIENTAS */}
        {activeTab === 'tools' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-300">
                <FeedGenerator />
                <UserCreator />
                <FileAnalyzer />
                <ProfitCalculator />
            </div>
        )}

        {/* --- MODAL ENVIAR CANDIDATO (STAFF) --- */}
        {showCandidateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <form onSubmit={handleSendCandidate} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" /> Enviar Candidato</h3>
                        <button type="button" onClick={() => setShowCandidateModal(false)} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad *</label>
                                <select required className="w-full p-2 border rounded text-sm" value={newCandidate.propertyId} onChange={e => setNewCandidate({...newCandidate, propertyId: e.target.value, roomId: ''})}>
                                    <option value="">Seleccionar...</option>
                                    {propertiesList.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Habitación *</label>
                                <select required disabled={!newCandidate.propertyId} className="w-full p-2 border rounded text-sm" value={newCandidate.roomId} onChange={e => setNewCandidate({...newCandidate, roomId: e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    {propertiesList.find(p => p.id === newCandidate.propertyId)?.rooms.map((r:any) => <option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}
                                </select>
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
            </div>
        )}
      </div>
    </div>
  );
};