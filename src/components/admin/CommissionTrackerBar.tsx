
import React, { useState, useMemo, useEffect } from 'react';
import { Property, BillingRecord } from '../../data/rooms';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
    TrendingUp,
    Calendar,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Info,
    BarChart3,
    ArrowUpRight,
    Settings2,
    Filter,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Download,
    Calculator,
    Users,
    Megaphone,
    Building,
    Save,
    RotateCcw
} from 'lucide-react';

interface CommissionTrackerBarProps {
    properties: Property[];
    onDownloadPDF?: () => void;
}

export const CommissionTrackerBar: React.FC<CommissionTrackerBarProps> = ({ properties, onDownloadPDF }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const [selectedYear, setSelectedYear] = useState<number | 'all' | 'custom'>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
    const [customRange, setCustomRange] = useState({
        start: `${currentYear}-01`,
        end: `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    });

    // Gastos de la Agencia (Nóminas, Marketing, etc)
    const [agencyExpenses, setAgencyExpenses] = useState({
        salaries: 0,
        marketing: 0,
        office: 0
    });
    const [isSaving, setIsSaving] = useState(false);

    // Cargar gastos desde Firebase cuando cambia el mes/año
    useEffect(() => {
        const loadExpenses = async () => {
            if (typeof selectedYear !== 'number') return;

            const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            try {
                const docRef = doc(db, "agency_finances", monthKey);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Solo actualizamos si el estado es diferente para evitar ciclos
                    setAgencyExpenses({
                        salaries: data.salaries || 0,
                        marketing: data.marketing || 0,
                        office: data.office || 0
                    });
                } else {
                    setAgencyExpenses({ salaries: 0, marketing: 0, office: 0 });
                }
            } catch (error) {
                console.error("Error loading expenses:", error);
            }
        };

        loadExpenses();
    }, [selectedYear, selectedMonth]);

    // Función de autoguardado debounced
    useEffect(() => {
        if (typeof selectedYear !== 'number') return;

        const timer = setTimeout(async () => {
            const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            setIsSaving(true);
            try {
                await setDoc(doc(db, "agency_finances", monthKey), {
                    ...agencyExpenses,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                setTimeout(() => setIsSaving(false), 1000);
            } catch (error) {
                console.error("Error saving expenses:", error);
                setIsSaving(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [agencyExpenses, selectedYear, selectedMonth]);

    const totalExpenses = (agencyExpenses.salaries || 0) + (agencyExpenses.marketing || 0) + (agencyExpenses.office || 0);

    // Group billing history by year and month
    const { commissionData, incidents, pendingCount } = useMemo(() => {
        const data: Record<number, Record<number, number>> = {};
        const incidentMonths: string[] = [];
        let pCount = 0;

        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        properties.forEach(prop => {
            const history = prop.billingHistory || [];
            const currentMonthRecord = history.find(r => r.month === currentMonthKey);

            if (!currentMonthRecord) {
                pCount++;
            }

            history.forEach(record => {
                const [year, month] = record.month.split('-').map(Number);
                if (!data[year]) data[year] = {};
                if (!data[year][month]) data[year][month] = 0;

                if (record.status === 'incident') {
                    incidentMonths.push(`${prop.address} (${record.month})`);
                } else {
                    data[year][month] += record.rentiaAmount || 0;
                }
            });

            // Cálculo de comisión esperada para el mes actual si no hay registro consolidado
            if (!currentMonthRecord) {
                const expected = (prop.rooms || []).reduce((acc, r) => {
                    // Si no está ocupada o hay reporte de IMPAGO, Rentia no gana comisión este mes
                    if (r.status !== 'occupied' || r.isNonPayment) return acc;

                    const baseComm = r.commissionValue ?? prop.managementCommission ?? 10;
                    const isPercentage = r.commissionType !== 'fixed';
                    let amount = isPercentage ? ((r.price || 0) * (baseComm / 100)) : baseComm;

                    if (!prop.commissionIncludesIVA) amount *= 1.21;

                    return acc + amount;
                }, 0);

                if (!data[currentYear]) data[currentYear] = {};
                if (!data[currentYear][currentMonth]) data[currentYear][currentMonth] = 0;
                data[currentYear][currentMonth] += Math.round(expected);
            }
        });

        return { commissionData: data, incidents: incidentMonths, pendingCount: pCount };
    }, [properties, currentYear, currentMonth]);

    const years = useMemo(() => {
        const availableYears = Object.keys(commissionData).map(Number);
        if (!availableYears.includes(currentYear)) availableYears.push(currentYear);
        return availableYears.sort((a, b) => b - a);
    }, [commissionData, currentYear]);

    const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const yearStats = useMemo(() => {
        if (selectedYear === 'all') {
            const months: Record<number, number> = {};
            let total = 0;
            Object.values(commissionData).forEach(yearMonths => {
                Object.entries(yearMonths).forEach(([m, val]) => {
                    const mNum = Number(m);
                    months[mNum] = (months[mNum] || 0) + val;
                    total += val;
                });
            });
            return { total, months };
        }

        if (selectedYear === 'custom') {
            const months: Record<number, number> = {};
            let total = 0;
            const startKey = customRange.start; // YYYY-MM
            const endKey = customRange.end;

            properties.forEach(prop => {
                (prop.billingHistory || []).forEach(record => {
                    if (record.month >= startKey && record.month <= endKey) {
                        const [y, m] = record.month.split('-').map(Number);
                        // For direct aggregate view, we just sum them up
                        // but since the UI shows month bars, it's tricky if range spans > 12 months.
                        // We will just sum into the month buckets 1-12 for simplicity in the current UI
                        months[m] = (months[m] || 0) + (record.rentiaAmount || 0);
                        total += record.rentiaAmount || 0;
                    }
                });
            });
            return { total, months };
        }

        const months = commissionData[selectedYear] || {};
        const total = Object.values(months).reduce((acc, val) => acc + val, 0);
        return { total, months };
    }, [commissionData, selectedYear, customRange, properties]);

    return (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-xl border border-indigo-500/20 overflow-hidden">
                <div className="px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Left Section: Title & Year Selector */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-400/30">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-white uppercase tracking-wider">Control de Comisiones</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] font-bold text-indigo-300/60 uppercase">Vigencia: Ene 2026</span>
                                    <div className="w-1 h-1 rounded-full bg-indigo-500/40"></div>
                                    <span className="text-[9px] font-bold text-indigo-300/60 uppercase italic">Tiempo Real</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>

                        <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1">
                            <button
                                onClick={() => setSelectedYear('all')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${selectedYear === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                TODOS
                            </button>
                            {years.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${selectedYear === year ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {year}
                                </button>
                            ))}
                            <button
                                onClick={() => setSelectedYear('custom')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 ${selectedYear === 'custom' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Settings2 className="w-3 h-3" /> PERSONALIZADO
                            </button>
                        </div>
                    </div>

                    {/* Custom Range Inputs (Visible only when 'custom' is selected) */}
                    {selectedYear === 'custom' && (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl animate-in zoom-in-95 duration-300">
                            <div className="flex flex-col">
                                <label className="text-[8px] font-black text-amber-500 uppercase ml-1">Desde</label>
                                <input
                                    type="month"
                                    className="bg-transparent text-white text-[10px] font-bold outline-none border-none focus:ring-0 p-0"
                                    value={customRange.start || ''}
                                    onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                    title="Mes de inicio"
                                />
                            </div>
                            <div className="w-2 h-px bg-amber-500/30 mt-3"></div>
                            <div className="flex flex-col">
                                <label className="text-[8px] font-black text-amber-500 uppercase ml-1">Hasta</label>
                                <input
                                    type="month"
                                    className="bg-transparent text-white text-[10px] font-bold outline-none border-none focus:ring-0 p-0"
                                    value={customRange.end || ''}
                                    onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                    title="Mes de fin"
                                />
                            </div>
                        </div>
                    )}

                    {/* Middle Section: Month Strip */}
                    <div className="flex-1 w-full overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 min-w-max px-2">
                            {monthNames.map((name, idx) => {
                                const monthNum = idx + 1;
                                const amount = yearStats.months[monthNum] || 0;
                                const isCurrent = selectedYear === currentYear && monthNum === currentMonth;
                                const isDraft = typeof selectedYear === 'number' && (selectedYear > currentYear || (selectedYear === currentYear && monthNum > currentMonth));

                                return (
                                    <div
                                        key={name}
                                        onClick={() => setSelectedMonth(monthNum)}
                                        className={`flex flex-col items-center px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${selectedMonth === monthNum
                                            ? 'bg-indigo-500/20 border-indigo-500 ring-1 ring-indigo-500/30'
                                            : amount > 0
                                                ? 'bg-white/5 border-white/10'
                                                : 'opacity-30 border-dashed border-white/5'
                                            }`}
                                    >
                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${selectedMonth === monthNum ? 'text-indigo-400' : 'text-gray-500'}`}>
                                            {name}
                                        </span>
                                        <div className="flex items-center gap-0.5">
                                            <span className={`text-xs font-black ${selectedMonth === monthNum ? 'text-white' : 'text-gray-300'}`}>
                                                {amount > 0 ? `${Math.round(amount)}€` : isDraft ? '-' : '0€'}
                                            </span>
                                            {isCurrent && <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Section: Totals */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col gap-1 items-end mr-2">
                            {isSaving && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md animate-pulse">
                                    <RotateCcw className="w-3 h-3 text-blue-400 animate-spin" />
                                    <span className="text-[9px] font-black text-blue-400 uppercase">GUARDANDO...</span>
                                </div>
                            )}
                            {!isSaving && isSaving !== undefined && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[9px] font-black text-emerald-500 uppercase">GUARDADO</span>
                                </div>
                            )}
                            {incidents.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md">
                                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                                    <span className="text-[9px] font-black text-rose-500 uppercase">{incidents.length} INCIDENCIAS</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-6 bg-white/5 p-2 px-4 rounded-xl border border-white/10">
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                    Comisión Bruta {selectedYear === 'all' ? 'Histórica' : selectedYear === 'custom' ? 'Periodo' : 'Anual'}
                                </p>
                                <div className="flex items-center justify-end gap-1">
                                    <span className="text-xl font-black text-indigo-400">
                                        {yearStats.total.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                                    </span>
                                    <span className="text-xs font-bold text-indigo-400/60">€</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="text-right flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                    <span className="text-[10px] font-black uppercase">ROI</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                </div>
                                <p className="text-[10px] font-bold text-white/40">Consolidado</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* --- NEW SECTION: AGENCY EXPENSES & NET PROFIT --- */}
                <div className="bg-white/5 border-t border-white/10 px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-6 overflow-x-auto no-scrollbar">

                    {/* Section Label */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-400/30">
                            <Calculator className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Análisis de Rentabilidad Real</p>
                            <p className="text-[9px] font-bold text-amber-500/60 uppercase mt-1">Cálculo de Beneficio Neto Rentia</p>
                        </div>
                    </div>

                    {/* Expense Inputs - Simplified for now to generic monthly expenses */}
                    <div className="flex items-center gap-4 flex-1 justify-center min-w-max">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase">Nóminas & Equipo</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        className="bg-transparent text-white text-xs font-black w-14 outline-none"
                                        value={agencyExpenses.salaries ?? 0}
                                        onChange={e => setAgencyExpenses(prev => ({ ...prev, salaries: Number(e.target.value) }))}
                                        title="Gasto en nóminas"
                                    />
                                    <span className="text-[10px] text-slate-600 font-bold">€</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                            <Megaphone className="w-3.5 h-3.5 text-purple-400" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase">Marketing & Ads</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        className="bg-transparent text-white text-xs font-black w-14 outline-none"
                                        value={agencyExpenses.marketing ?? 0}
                                        onChange={e => setAgencyExpenses(prev => ({ ...prev, marketing: Number(e.target.value) }))}
                                        title="Gasto en marketing"
                                    />
                                    <span className="text-[10px] text-slate-600 font-bold">€</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                            <Building className="w-3.5 h-3.5 text-orange-400" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-500 uppercase">Oficina & Otros</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        className="bg-transparent text-white text-xs font-black w-14 outline-none"
                                        value={agencyExpenses.office ?? 0}
                                        onChange={e => setAgencyExpenses(prev => ({ ...prev, office: Number(e.target.value) }))}
                                        title="Otros gastos"
                                    />
                                    <span className="text-[10px] text-slate-600 font-bold">€</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-white/10 mx-2"></div>

                        {/* Summary of Expenses */}
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Total Gastos</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xl font-black text-rose-400">{totalExpenses.toLocaleString('es-ES')}</span>
                                <span className="text-xs font-bold text-rose-600">€</span>
                            </div>
                        </div>
                    </div>

                    {/* NET BENEFIT CARD */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 px-6 rounded-2xl flex items-center gap-6 shrink-0 shadow-lg shadow-emerald-500/5">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Resultado Neto Real</p>
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="text-2xl font-black text-white">
                                    {(yearStats.total - totalExpenses).toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                                </span>
                                <span className="text-sm font-black text-emerald-400">€</span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-emerald-500/20"></div>
                        <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>

                </div>
            </div>

            {/* Hint / Function note */}
            <div className="flex items-center justify-between mt-2 px-4">
                <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-gray-400" />
                    <p className="text-[9px] font-medium text-gray-400 italic">
                        Cálculo basado en facturación consolidada e insumos manuales de gastos operativos.
                    </p>
                </div>
                <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center gap-1">
                    <Save className="w-3 h-3" /> Guardar Informe Mensual
                </button>
            </div>
        </div>
    );
};
