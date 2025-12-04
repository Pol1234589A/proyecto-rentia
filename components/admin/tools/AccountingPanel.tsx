
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Calculator, Plus, Trash2, X, Percent } from 'lucide-react';

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
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
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
        reference: '',
        vatRate: 21 
    });

    useEffect(() => {
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
        return () => unsubscribe();
    }, []);

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
        if(confirm("¿Eliminar este movimiento contable permanentemente?")) {
            await deleteDoc(doc(db, "accounting", id));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setForm({ date: new Date().toISOString().split('T')[0], concept: '', amount: '', type: 'expense', category: 'General', status: 'paid', reference: '', vatRate: 21 });
    };

    return (
        <div className="space-y-6">
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

                    <button onClick={() => setIsModalOpen(true)} className="bg-rentia-black text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Plus className="w-3 h-3"/> Nuevo</button>
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
                            const base = t.amount / (1 + vat/100);
                            const tax = t.amount - base;
                            return (
                            <tr key={t.id} onClick={() => handleEdit(t)} className="hover:bg-gray-50 active:bg-blue-50 cursor-pointer">
                                <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{t.date}</td>
                                <td className="p-3 font-medium text-gray-900 truncate max-w-[150px]">{t.concept}</td>
                                <td className="p-3 text-right text-gray-500 text-xs">{base.toFixed(2)}€</td>
                                <td className="p-3 text-right text-gray-500 text-xs">{tax.toFixed(2)}€ ({vat}%)</td>
                                <td className={`p-3 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)}€</td>
                                <td className="p-3 text-center">
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            {isModalOpen && ( 
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto">
                        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center sticky top-0">
                            <h3 className="font-bold">{editingId ? 'Editar' : 'Nuevo'}</h3>
                            <button onClick={closeModal}><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSaveTransaction} className="p-4 space-y-3">
                            <input type="date" className="w-full p-2 border rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                            <input type="text" placeholder="Concepto" className="w-full p-2 border rounded" value={form.concept} onChange={e => setForm({...form, concept: e.target.value})} />
                            <div className="flex gap-2">
                                <select className="w-full p-2 border rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}><option value="income">Ingreso (+)</option><option value="expense">Gasto (-)</option></select>
                                <input type="number" placeholder="Total (Bruto)" className="w-full p-2 border rounded font-bold" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                            </div>
                            <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 whitespace-nowrap flex items-center gap-1"><Percent className="w-3 h-3"/> IVA:</label>
                                <select className="w-full p-1 border rounded text-sm bg-white" value={form.vatRate} onChange={e => setForm({...form, vatRate: Number(e.target.value)})}>
                                    <option value="21">21% (General)</option>
                                    <option value="10">10% (Reducido)</option>
                                    <option value="4">4% (Superreducido)</option>
                                    <option value="0">0% (Exento)</option>
                                </select>
                            </div>
                            <select className="w-full p-2 border rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>General</option><option>Alquiler</option><option>Suministros</option><option>Mantenimiento</option></select>
                            <button type="submit" className="w-full bg-rentia-blue text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Guardar Movimiento</button>
                        </form>
                    </div>
                </div> 
            )}
        </div>
    );
};
