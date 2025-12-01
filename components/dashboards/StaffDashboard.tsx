
import React, { useState, useEffect, useMemo } from 'react';
import { Users, Building, AlertCircle, CheckCircle, BarChart3, RefreshCw, LayoutDashboard, Calculator, Briefcase, Wrench, Plus, ArrowUpRight, ArrowDownRight, Search, FileText, Trash2, Save, X, DollarSign, Calendar, Filter, Download, Pencil, ChevronLeft, ChevronRight, PieChart, Landmark, ChevronDown, Wallet, CreditCard } from 'lucide-react';
import { UserCreator } from '../admin/UserCreator';
import { FileAnalyzer } from '../admin/FileAnalyzer';
import { RoomManager } from '../admin/RoomManager';
import { SalesCRM } from '../admin/SalesCRM';
import { ProfitCalculator } from '../admin/ProfitCalculator';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { Property } from '../../data/rooms';

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

// Subcomponente: Gráfica de Barras Simple (SVG) Responsive
const FinancialChart = ({ data }: { data: { month: string, income: number, expense: number }[] }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000);
    const height = 100;
    
    return (
        <div className="h-40 w-full flex items-end justify-between gap-2 pt-6 pb-2 select-none">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex gap-1 h-full items-end justify-center group relative min-w-[20px]">
                    {/* Tooltip (Hover Desktop / Tap Mobile visual feedback) */}
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
  // --- STATE NAVEGACIÓN ---
  const [activeTab, setActiveTab] = useState<'overview' | 'real_estate' | 'accounting' | 'tools'>('overview');

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
  
  // Filtros Contabilidad
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Formulario Contabilidad
  const [form, setForm] = useState({
      date: new Date().toISOString().split('T')[0],
      concept: '',
      amount: '',
      type: 'expense' as 'income' | 'expense',
      category: 'General',
      status: 'paid' as 'paid' | 'pending',
      reference: ''
  });

  // --- LOAD DATA ---
  useEffect(() => {
    // 1. Propiedades para KPIs Operativos
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      let totalRoomsCount = 0;
      let occupiedCount = 0;
      let revenueCount = 0;
      let renovationCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as Property;
        if (data.rooms && Array.isArray(data.rooms)) {
          data.rooms.forEach(room => {
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

      setStats({
        totalRooms: totalRoomsCount,
        occupancyRate: totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0,
        monthlyRevenue: revenueCount,
        activeIncidents: renovationCount
      });
      setLoadingStats(false);
    });

    // 2. Contabilidad (Query ordenada)
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

    return () => { unsubscribeProps(); unsubscribeAccounting(); };
  }, []);

  // --- KPI FACTURACIÓN REAL (OVERVIEW) ---
  const realMonthlyRevenue = useMemo(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Filtrar transacciones de ingreso del mes actual
      return transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'income';
        })
        .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  // --- LÓGICA CONTABLE AVANZADA ---
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
      // Cálculo mes actual vs mes anterior para tendencias
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      let currentIncome = 0;
      let currentExpense = 0;
      let prevIncome = 0;
      let prevExpense = 0;

      // Totales globales (filtrados)
      const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      const pendingIncome = filteredTransactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

      // Data para gráfica (últimos 6 meses)
      const chartDataMap = new Map<string, { income: number, expense: number }>();
      // Inicializar últimos 6 meses
      for(let i=5; i>=0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`; // YYYY-MM
          chartDataMap.set(key, { income: 0, expense: 0 });
      }

      transactions.forEach(t => {
          const tDate = new Date(t.date);
          const tMonth = tDate.getMonth();
          const tYear = tDate.getFullYear();
          const key = t.date.substring(0, 7); // YYYY-MM

          // Current Month Logic
          if (tMonth === currentMonth && tYear === currentYear) {
              if(t.type === 'income') currentIncome += t.amount;
              else currentExpense += t.amount;
          }
          // Prev Month Logic
          const prevDate = new Date();
          prevDate.setMonth(currentMonth - 1);
          if (tMonth === prevDate.getMonth() && tYear === prevDate.getFullYear()) {
              if(t.type === 'income') prevIncome += t.amount;
              else prevExpense += t.amount;
          }

          // Chart Data Logic
          if (chartDataMap.has(key)) {
              const val = chartDataMap.get(key)!;
              if(t.type === 'income') val.income += t.amount;
              else val.expense += t.amount;
          }
      });

      const chartData = Array.from(chartDataMap.entries()).map(([key, val]) => ({
          month: key.split('-')[1], // solo MM
          ...val
      })).sort((a,b) => parseInt(a.month) - parseInt(b.month)); // Ordenar simple

      // Calcular % cambio
      const incomeChange = prevIncome === 0 ? 100 : ((currentIncome - prevIncome) / prevIncome) * 100;
      const expenseChange = prevExpense === 0 ? 100 : ((currentExpense - prevExpense) / prevExpense) * 100;

      return { 
          income: totalIncome, 
          expense: totalExpense, 
          balance: totalIncome - totalExpense,
          pendingIncome,
          currentIncome,
          currentExpense,
          incomeChange,
          expenseChange,
          chartData
      };
  }, [transactions, filteredTransactions]);

  // --- CRUD ACTIONS ---
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
          `"${t.concept}"`, // Escapar comas
          t.category,
          t.type === 'income' ? 'Ingreso' : 'Gasto',
          t.status === 'paid' ? 'Pagado' : 'Pendiente',
          t.amount.toFixed(2)
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");
          
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
             <button onClick={() => setActiveTab('real_estate')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'real_estate' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Building className="w-4 h-4" /> <span className="hidden sm:inline">Inmobiliaria</span>
             </button>
             <button onClick={() => setActiveTab('accounting')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'accounting' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Calculator className="w-4 h-4" /> <span className="hidden sm:inline">Contabilidad</span>
             </button>
             <button onClick={() => setActiveTab('tools')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'tools' ? 'bg-white text-rentia-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Wrench className="w-4 h-4" /> <span className="hidden sm:inline">Herramientas</span>
             </button>
          </div>
        </header>

        {/* =================================================================================
            TAB 1: RESUMEN OPERATIVO (KPIs + Tareas)
           ================================================================================= */}
        {activeTab === 'overview' && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
                {/* KPI Row */}
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
                        <span className="text-xs text-gray-500 uppercase font-bold">Facturación Mes (Real)</span>
                        <div className="flex justify-between items-end mt-2">
                            <span className="text-3xl font-bold text-gray-800">
                                {realMonthlyRevenue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                <span className="text-sm text-gray-400 font-medium ml-1">€</span>
                            </span>
                            <BarChart3 className="w-6 h-6 text-purple-100 absolute right-4 top-4 transform scale-150" />
                        </div>
                    </div>
                </div>

                {/* Operational Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Task List */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Tareas Prioritarias</h3>
                            <button className="text-xs bg-rentia-blue text-white px-2 py-1 rounded">Nueva Tarea</button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            <div className="p-4 flex items-start gap-3 hover:bg-gray-50">
                                <div className="mt-1"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Revisión Caldera - Velázquez 12</p>
                                    <p className="text-xs text-gray-500">Urgente. El técnico va hoy a las 16:00.</p>
                                </div>
                            </div>
                            <div className="p-4 flex items-start gap-3 hover:bg-gray-50">
                                <div className="mt-1"><CheckCircle className="w-4 h-4 text-green-500" /></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Firma Contrato H3 - Rosario</p>
                                    <p className="text-xs text-gray-500">Pendiente de recibir justificante de transferencia.</p>
                                </div>
                            </div>
                            <div className="p-4 flex items-start gap-3 hover:bg-gray-50">
                                <div className="mt-1"><Users className="w-4 h-4 text-blue-500" /></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Onboarding Nuevo Propietario (Juan)</p>
                                    <p className="text-xs text-gray-500">Preparar dossier de bienvenida y llaves.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4">Accesos Rápidos</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-3 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 text-center border border-gray-200 hover:border-rentia-blue hover:text-rentia-blue transition-all">
                                Alta Inquilino
                            </button>
                            <button className="p-3 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 text-center border border-gray-200 hover:border-rentia-blue hover:text-rentia-blue transition-all">
                                Crear Incidencia
                            </button>
                            <button className="p-3 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 text-center border border-gray-200 hover:border-rentia-blue hover:text-rentia-blue transition-all">
                                Generar Recibos
                            </button>
                            <button className="p-3 bg-gray-50 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 text-center border border-gray-200 hover:border-rentia-blue hover:text-rentia-blue transition-all">
                                Ver Agenda
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* =================================================================================
            TAB 2: GESTIÓN INMOBILIARIA (ROOMS + SALES)
           ================================================================================= */}
        {activeTab === 'real_estate' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <RoomManager />
                <SalesCRM />
            </div>
        )}

        {/* =================================================================================
            TAB 3: CONTABILIDAD (NUEVO MÓDULO PROFESIONAL)
           ================================================================================= */}
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
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Ingresos (Mes Actual)</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold font-mono text-emerald-600">
                                +{financialSummary.currentIncome.toLocaleString('es-ES', { minimumFractionDigits: 0 })}€
                            </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs">
                            <span className={`font-bold ${financialSummary.incomeChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {financialSummary.incomeChange > 0 ? '+' : ''}{financialSummary.incomeChange.toFixed(1)}%
                            </span>
                            <span className="text-gray-400">vs mes anterior</span>
                        </div>
                    </div>

                    {/* Gastos Mes */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">Gastos (Mes Actual)</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold font-mono text-rose-600">
                                -{financialSummary.currentExpense.toLocaleString('es-ES', { minimumFractionDigits: 0 })}€
                            </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs">
                            <span className={`font-bold ${financialSummary.expenseChange <= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {financialSummary.expenseChange > 0 ? '+' : ''}{financialSummary.expenseChange.toFixed(1)}%
                            </span>
                            <span className="text-gray-400">vs mes anterior</span>
                        </div>
                    </div>

                    {/* Pendiente de Cobro */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-200 bg-orange-50/30">
                        <span className="text-orange-600 text-xs font-bold uppercase tracking-wide">Pendiente de Cobro</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold font-mono text-orange-600">
                                {financialSummary.pendingIncome.toLocaleString('es-ES', { minimumFractionDigits: 0 })}€
                            </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-orange-100 text-xs text-orange-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Facturas emitidas no pagadas
                        </div>
                    </div>
                </div>

                {/* 2. Gráfica y Filtros */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Gráfica */}
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Flujo de Caja (Últimos 6 meses)</h3>
                        <FinancialChart data={financialSummary.chartData} />
                    </div>

                    {/* Quick Filters Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
                        <div className="flex justify-between items-center cursor-pointer md:cursor-default" onClick={() => setShowFiltersMobile(!showFiltersMobile)}>
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filtros Rápidos
                            </h3>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform md:hidden ${showFiltersMobile ? 'rotate-180' : ''}`} />
                        </div>
                        
                        <div className={`${showFiltersMobile ? 'flex' : 'hidden'} md:flex flex-col gap-4 transition-all`}>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Periodo</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="date" 
                                        className="w-full p-2 border rounded text-xs bg-gray-50 text-gray-700" 
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                    />
                                    <input 
                                        type="date" 
                                        className="w-full p-2 border rounded text-xs bg-gray-50 text-gray-700"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Estado</label>
                                <select 
                                    className="w-full p-2 border rounded text-xs bg-gray-50 text-gray-700"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                >
                                    <option value="all">Todos</option>
                                    <option value="paid">Pagado / Cobrado</option>
                                    <option value="pending">Pendiente</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Categoría</label>
                                <select 
                                    className="w-full p-2 border rounded text-xs bg-gray-50 text-gray-700"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option>Todas</option>
                                    <optgroup label="Ingresos">
                                        <option>Alquileres</option>
                                        <option>Honorarios Gestión</option>
                                        <option>Facturación Servicios</option>
                                        <option>Consultoría</option>
                                    </optgroup>
                                    <optgroup label="Gastos Operativos">
                                        <option>Mantenimiento</option>
                                        <option>Limpieza</option>
                                        <option>Suministros</option>
                                        <option>Reparaciones</option>
                                    </optgroup>
                                    <optgroup label="Estructura & Empresa">
                                        <option>Nóminas & SS</option>
                                        <option>Marketing & Publicidad</option>
                                        <option>Oficina & Suministros</option>
                                        <option>Software & Herramientas</option>
                                        <option>Legal & Gestoría</option>
                                        <option>Seguros Empresa</option>
                                        <option>Bancarios & Financieros</option>
                                        <option>Impuestos (IVA/IRPF/IS)</option>
                                        <option>Vehículos & Transporte</option>
                                        <option>Dietas & Viajes</option>
                                        <option>Otros Gastos Generales</option>
                                    </optgroup>
                                </select>
                            </div>
                            
                            <button 
                                onClick={() => { setDateRange({start:'', end:''}); setFilterStatus('all'); setFilterCategory('Todas'); setSearchTerm(''); }}
                                className="text-xs text-rentia-blue hover:underline text-center mt-auto"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Tabla Principal (Ledger) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar por concepto, ref o categoría..." 
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-rentia-blue transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button 
                                onClick={exportToCSV}
                                className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exportar CSV</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Container - SCROLLABLE FOR MOBILE */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                                <tr>
                                    <th className="p-4 w-28">Fecha</th>
                                    <th className="p-4 w-32">Ref / ID</th>
                                    <th className="p-4">Concepto</th>
                                    <th className="p-4 w-40">Categoría</th>
                                    <th className="p-4 w-24 text-center">Estado</th>
                                    <th className="p-4 w-32 text-right">Importe</th>
                                    <th className="p-4 w-20 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.length === 0 ? (
                                    <tr><td colSpan={7} className="p-12 text-center text-gray-400 italic">No se encontraron movimientos.</td></tr>
                                ) : (
                                    filteredTransactions.map(t => (
                                        <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="p-4 text-gray-600 font-mono text-xs">{t.date}</td>
                                            <td className="p-4 text-gray-400 font-mono text-xs">{t.reference || t.id.slice(0,6)}</td>
                                            <td className="p-4 font-medium text-gray-900">{t.concept}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {t.status === 'paid' ? (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-green-200">Pagado</span>
                                                ) : (
                                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-orange-200">Pendiente</span>
                                                )}
                                            </td>
                                            <td className={`p-4 text-right font-bold font-mono text-base ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                            </td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button onClick={() => handleEdit(t)} className="p-1.5 text-gray-400 hover:text-rentia-blue bg-white hover:bg-blue-50 rounded border border-gray-200 transition-colors">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 rounded border border-gray-200 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer Tabla */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                        <span>Mostrando {filteredTransactions.length} movimientos</span>
                        <span className="font-mono">Rentia Accounting v2.1</span>
                    </div>
                </div>

                {/* MODAL FORMULARIO */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-rentia-blue p-4 flex justify-between items-center text-white">
                                <h3 className="font-bold flex items-center gap-2">
                                    {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {editingId ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                                </h3>
                                <button onClick={closeModal} className="hover:bg-white/20 p-1 rounded transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button 
                                                type="button" 
                                                onClick={() => setForm({...form, type: 'income'})}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${form.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                                            >Ingreso</button>
                                            <button 
                                                type="button" 
                                                onClick={() => setForm({...form, type: 'expense'})}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${form.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
                                            >Gasto</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full p-2 border rounded text-sm bg-white focus:border-rentia-blue outline-none"
                                            value={form.date}
                                            onChange={e => setForm({...form, date: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Concepto</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none"
                                        placeholder="Ej: Nómina Staff, Alquiler Oficina..."
                                        value={form.concept}
                                        onChange={e => setForm({...form, concept: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Importe (€)</label>
                                        <input 
                                            type="number" 
                                            required
                                            step="0.01"
                                            className="w-full p-2 border rounded text-sm font-mono font-bold focus:border-rentia-blue outline-none"
                                            value={form.amount}
                                            onChange={e => setForm({...form, amount: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Categoría</label>
                                        <select 
                                            className="w-full p-2 border rounded text-sm bg-white focus:border-rentia-blue outline-none"
                                            value={form.category}
                                            onChange={e => setForm({...form, category: e.target.value})}
                                        >
                                            <optgroup label="Ingresos">
                                                <option>Alquileres</option>
                                                <option>Honorarios Gestión</option>
                                                <option>Facturación Servicios</option>
                                                <option>Consultoría</option>
                                            </optgroup>
                                            <optgroup label="Gastos Operativos">
                                                <option>Mantenimiento</option>
                                                <option>Limpieza</option>
                                                <option>Suministros</option>
                                                <option>Reparaciones</option>
                                            </optgroup>
                                            <optgroup label="Estructura & Empresa">
                                                <option>Nóminas & SS</option>
                                                <option>Marketing & Publicidad</option>
                                                <option>Oficina & Suministros</option>
                                                <option>Software & Herramientas</option>
                                                <option>Legal & Gestoría</option>
                                                <option>Seguros Empresa</option>
                                                <option>Bancarios & Financieros</option>
                                                <option>Impuestos (IVA/IRPF/IS)</option>
                                                <option>Vehículos & Transporte</option>
                                                <option>Dietas & Viajes</option>
                                                <option>Otros Gastos Generales</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Estado</label>
                                        <select 
                                            className="w-full p-2 border rounded text-sm bg-white focus:border-rentia-blue outline-none"
                                            value={form.status}
                                            onChange={e => setForm({...form, status: e.target.value as any})}
                                        >
                                            <option value="paid">Pagado / Cobrado</option>
                                            <option value="pending">Pendiente</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Referencia (Opcional)</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none"
                                            placeholder="Factura #123"
                                            value={form.reference}
                                            onChange={e => setForm({...form, reference: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={closeModal}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-bold hover:bg-gray-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-6 py-2 bg-rentia-blue text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* =================================================================================
            TAB 4: HERRAMIENTAS (USERS + IA + CALCULADORA)
           ================================================================================= */}
        {activeTab === 'tools' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-300">
                <UserCreator />
                <FileAnalyzer />
                <ProfitCalculator />
            </div>
        )}

      </div>
    </div>
  );
};
