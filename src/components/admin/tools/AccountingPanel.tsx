
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { Calculator, Plus, Trash2, X, Percent, Gift, Wallet, AlertCircle } from 'lucide-react';
import { Property } from '../../../data/rooms';
import { OwnerAdjustment } from '../../../types';

interface Transaction {
    id: string;
    date: string;
    concept: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    status: 'paid' | 'pending';
    reference?: string;
    vatRate?: number;
    createdAt?: any;
}

export const AccountingPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'owner_adjustments'>('general');

    // General Accounting State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Owner Adjustments State
    const [adjustments, setAdjustments] = useState<OwnerAdjustment[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [adjForm, setAdjForm] = useState({
        propertyId: '',
        amount: '',
        concept: '',
        type: 'discount' as 'discount' | 'charge',
        appliedToMonth: new Date().toISOString().slice(0, 7) // YYYY-MM
    });

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        concept: '',
        amount: '',
        type: 'expense' as 'income' | 'expense',
        category: 'General',
        status: 'paid' as 'paid' | 'pending',
        reference: '',
        vatRate: 21
    });

    useEffect(() => {
        // Load Transactions
        const q = query(collection(db, "accounting"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
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
                    vatRate: d.vatRate !== undefined ? d.vatRate : 0,
                    createdAt: d.createdAt
                });
            });
            setTransactions(trans);
        });

        // Load Properties (for adjustments)
        const fetchProps = async () => {
            const snap = await getDocs(collection(db, "properties"));
            const props: Property[] = [];
            snap.forEach(doc => props.push({ ...doc.data(), id: doc.id } as Property));
            setProperties(props);
        };
        fetchProps();

        // Load Adjustments
        const qAdj = query(collection(db, "adjustments"), orderBy("date", "desc"));
        const unsubAdj = onSnapshot(qAdj, (snapshot) => {
            const adjList: OwnerAdjustment[] = [];
            snapshot.forEach((doc) => {
                adjList.push({ ...doc.data(), id: doc.id } as OwnerAdjustment);
            });
            setAdjustments(adjList);
        });

        return () => { unsubscribe(); unsubAdj(); };
    }, []);

    // --- GENERAL ACCOUNTING LOGIC ---
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = (t.concept || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
        const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
        return {
            income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense
        };
    }, [filteredTransactions]);

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
            reference: t.reference || '',
            vatRate: t.vatRate !== undefined ? t.vatRate : 21
        });
        setEditingId(t.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar este movimiento contable permanentemente?")) {
            await deleteDoc(doc(db, "accounting", id));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setForm({ date: new Date().toISOString().split('T')[0], concept: '', amount: '', type: 'expense', category: 'General', status: 'paid', reference: '', vatRate: 21 });
    };

    // --- OWNER ADJUSTMENTS LOGIC ---
    const handleSaveAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjForm.propertyId || !adjForm.amount || !adjForm.concept) return alert("Faltan datos");

        const prop = properties.find(p => p.id === adjForm.propertyId);
        if (!prop || !prop.ownerId) return alert("La propiedad seleccionada no tiene propietario asignado o no existe.");

        try {
            await addDoc(collection(db, "adjustments"), {
                propertyId: prop.id,
                propertyName: prop.address,
                ownerId: prop.ownerId,
                amount: parseFloat(adjForm.amount),
                concept: adjForm.concept,
                type: adjForm.type,
                appliedToMonth: adjForm.appliedToMonth,
                date: serverTimestamp()
            });
            setIsAdjustmentModalOpen(false);
            setAdjForm({ propertyId: '', amount: '', concept: '', type: 'discount', appliedToMonth: new Date().toISOString().slice(0, 7) });
            alert("Ajuste guardado. El propietario lo verá en su panel.");
        } catch (error) {
            console.error(error);
            alert("Error al guardar ajuste.");
        }
    };

    const handleDeleteAdjustment = async (id: string) => {
        if (confirm("¿Borrar este ajuste?")) {
            await deleteDoc(doc(db, "adjustments", id));
        }
    };

    return (
        <div className="space-y-6">

            {/* Nav Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'general' ? 'bg-rentia-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Contabilidad General
                </button>
                <button
                    onClick={() => setActiveTab('owner_adjustments')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'owner_adjustments' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <Gift className="w-4 h-4" /> Ajustes Propietarios
                </button>
            </div>

            {/* TAB: GENERAL ACCOUNTING */}
            {activeTab === 'general' && (
                <>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-rentia-blue" />
                                Balance Neto (Vista Actual)
                            </p>
                            <span className={`text-2xl font-bold ${financialSummary.balance >= 0 ? 'text-rentia-blue' : 'text-orange-500'}`}>
                                {financialSummary.balance.toLocaleString()}€
                            </span>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            <p>Ingresos: <span className="text-green-600 font-bold">+{financialSummary.income.toFixed(2)}€</span></p>
                            <p>Gastos: <span className="text-red-600 font-bold">-{financialSummary.expense.toFixed(2)}€</span></p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                        <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 sticky left-0">
                            <h3 className="font-bold text-sm">Movimientos</h3>

                            {/* Filtros básicos */}
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="bg-white border text-xs p-1.5 rounded w-32"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <select
                                    className="bg-white border text-xs p-1.5 rounded"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option>Todas</option>
                                    <option>Alquiler</option>
                                    <option>Suministros</option>
                                    <option>Mantenimiento</option>
                                    <option>General</option>
                                </select>
                            </div>

                            <button onClick={() => setIsModalOpen(true)} className="bg-rentia-black text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Nuevo</button>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Concepto</th>
                                    <th className="p-3 text-right">Base</th>
                                    <th className="p-3 text-right">IVA</th>
                                    <th className="p-3 text-right">Total</th>
                                    <th className="p-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.map(t => {
                                    const vat = t.vatRate || 0;
                                    const base = t.amount / (1 + vat / 100);
                                    const tax = t.amount - base;
                                    return (
                                        <tr key={t.id} onClick={() => handleEdit(t)} className="hover:bg-gray-50 active:bg-blue-50 cursor-pointer">
                                            <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{t.date}</td>
                                            <td className="p-3 font-medium text-gray-900 truncate max-w-[150px]">{t.concept}</td>
                                            <td className="p-3 text-right text-gray-500 text-xs">{base.toFixed(2)}€</td>
                                            <td className="p-3 text-right text-gray-500 text-xs">{tax.toFixed(2)}€ ({vat}%)</td>
                                            <td className={`p-3 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)}€</td>
                                            <td className="p-3 text-center">
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* TAB: OWNER ADJUSTMENTS */}
            {activeTab === 'owner_adjustments' && (
                <div className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden">
                    <div className="p-6 border-b border-purple-100 bg-purple-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-purple-900 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-purple-600" />
                                Ajustes y Descuentos a Propietarios
                            </h3>
                            <p className="text-xs text-purple-700 mt-1">Registra regalos, descuentos o cargos extra que se aplicarán en la liquidación mensual.</p>
                        </div>
                        <button onClick={() => setIsAdjustmentModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Añadir Ajuste
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Propiedad</th>
                                    <th className="p-4">Concepto</th>
                                    <th className="p-4">Mes Aplicación</th>
                                    <th className="p-4 text-right">Importe</th>
                                    <th className="p-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {adjustments.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay ajustes registrados.</td></tr>
                                ) : (
                                    adjustments.map(adj => (
                                        <tr key={adj.id} className="hover:bg-purple-50/30">
                                            <td className="p-4 font-bold text-gray-700">{adj.propertyName}</td>
                                            <td className="p-4">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2 ${adj.type === 'discount' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {adj.type === 'discount' ? 'Descuento/Regalo' : 'Cargo Extra'}
                                                </span>
                                                {adj.concept}
                                            </td>
                                            <td className="p-4 font-mono text-xs">{adj.appliedToMonth}</td>
                                            <td className={`p-4 text-right font-bold ${adj.type === 'discount' ? 'text-green-600' : 'text-red-600'}`}>
                                                {adj.type === 'discount' ? '+' : '-'}{adj.amount}€
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleDeleteAdjustment(adj.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL TRANSACTION (GENERAL) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto">
                        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center sticky top-0">
                            <h3 className="font-bold">{editingId ? 'Editar' : 'Nuevo'}</h3>
                            <button onClick={closeModal}><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveTransaction} className="p-4 space-y-3">
                            <input type="date" className="w-full p-2 border rounded" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            <input type="text" placeholder="Concepto" className="w-full p-2 border rounded" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} />
                            <div className="flex gap-2">
                                <select className="w-full p-2 border rounded" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}><option value="income">Ingreso (+)</option><option value="expense">Gasto (-)</option></select>
                                <input type="number" placeholder="Total (Bruto)" className="w-full p-2 border rounded font-bold" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                            </div>
                            <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 whitespace-nowrap flex items-center gap-1"><Percent className="w-3 h-3" /> IVA:</label>
                                <select className="w-full p-1 border rounded text-sm bg-white" value={form.vatRate} onChange={e => setForm({ ...form, vatRate: Number(e.target.value) })}>
                                    <option value="21">21% (General)</option>
                                    <option value="10">10% (Reducido)</option>
                                    <option value="4">4% (Superreducido)</option>
                                    <option value="0">0% (Exento)</option>
                                </select>
                            </div>
                            <select className="w-full p-2 border rounded" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>General</option><option>Alquiler</option><option>Suministros</option><option>Mantenimiento</option></select>
                            <button type="submit" className="w-full bg-rentia-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Guardar Movimiento</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL OWNER ADJUSTMENT */}
            {isAdjustmentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                            <h3 className="font-bold text-purple-900 flex items-center gap-2"><Gift className="w-5 h-5" /> Nuevo Ajuste</h3>
                            <button onClick={() => setIsAdjustmentModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad</label>
                                <select required className="w-full p-2 border rounded-lg text-sm bg-white" value={adjForm.propertyId} onChange={e => setAdjForm({ ...adjForm, propertyId: e.target.value })}>
                                    <option value="">Seleccionar...</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Ajuste</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setAdjForm({ ...adjForm, type: 'discount' })} className={`p-2 rounded border text-sm font-bold ${adjForm.type === 'discount' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-600'}`}>
                                        Descuento / Regalo (A favor Owner)
                                    </button>
                                    <button type="button" onClick={() => setAdjForm({ ...adjForm, type: 'charge' })} className={`p-2 rounded border text-sm font-bold ${adjForm.type === 'charge' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white text-gray-600'}`}>
                                        Cargo Extra (A pagar por Owner)
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Importe (€)</label>
                                    <input type="number" required step="0.01" className="w-full p-2 border rounded-lg font-bold" value={adjForm.amount} onChange={e => setAdjForm({ ...adjForm, amount: e.target.value })} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes Aplicación</label>
                                    <input type="month" required className="w-full p-2 border rounded-lg text-sm" value={adjForm.appliedToMonth} onChange={e => setAdjForm({ ...adjForm, appliedToMonth: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Concepto / Motivo</label>
                                <input type="text" required className="w-full p-2 border rounded-lg text-sm" value={adjForm.concept} onChange={e => setAdjForm({ ...adjForm, concept: e.target.value })} placeholder="Ej: Regalo Navidad, Compensación..." />
                            </div>

                            <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 flex gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>Este ajuste aparecerá reflejado automáticamente en el panel financiero del propietario para el mes seleccionado.</p>
                            </div>

                            <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-lg">Guardar Ajuste</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
