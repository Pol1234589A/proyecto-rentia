
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calculator, Save, Printer, Plus, Trash2, Building, FileText, Download, User } from 'lucide-react';
import { Property } from '../../../data/rooms';

interface Props {
    properties: Property[];
}

export const AdvancedCalculator: React.FC<Props> = ({ properties }) => {
    const [selectedPropId, setSelectedPropId] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    
    const [agencyData, setAgencyData] = useState({
        name: 'Rentia Investments S.L.',
        cif: 'B-75995308',
        address: 'C/ Brazal de Álamos, 7, 30130, Beniel, Murcia',
        representative: 'Pol Matencio Espinosa'
    });

    const [incomes, setIncomes] = useState<{id: number, concept: string, amount: number}[]>([
        { id: 1, concept: 'Alquiler Mensual', amount: 0 }
    ]);
    
    const [expenses, setExpenses] = useState<{id: number, concept: string, amount: number}[]>([]);
    
    const [commissionRate, setCommissionRate] = useState(10);
    const [vatRate, setVatRate] = useState(21);
    const [invoiceNumber, setInvoiceNumber] = useState(`LIQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);

    // Update defaults when property changes
    useEffect(() => {
        const prop = properties.find(p => p.id === selectedPropId);
        if (prop) {
            // Estimate rent based on occupied rooms
            const estimatedRent = prop.rooms
                .filter(r => r.status === 'occupied')
                .reduce((acc, r) => acc + r.price, 0);
            
            setIncomes([{ id: 1, concept: `Rentas ${month}`, amount: estimatedRent }]);
            setCommissionRate(prop.managementCommission || 10);
        }
    }, [selectedPropId, properties, month]);

    // Calculations
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    const commissionBase = totalIncome * (commissionRate / 100);
    const commissionVat = commissionBase * (vatRate / 100);
    const totalCommission = commissionBase + commissionVat;
    
    const netToOwner = totalIncome - totalExpenses - totalCommission;

    const handleSave = async () => {
        if (!selectedPropId) return alert("Selecciona una propiedad");
        const prop = properties.find(p => p.id === selectedPropId);
        
        try {
            await addDoc(collection(db, "agency_invoices"), {
                invoiceNumber,
                date: new Date().toISOString().split('T')[0],
                ownerId: prop?.ownerId || 'unknown',
                ownerName: prop?.address || 'Propietario',
                propertyId: prop?.id,
                propertyAddress: prop?.address,
                totalAmount: netToOwner,
                agencyFee: totalCommission,
                ivaAmount: commissionVat,
                details: {
                    month,
                    incomes,
                    expenses,
                    commissionRate,
                    vatRate,
                    agencyData
                },
                status: 'issued',
                createdAt: serverTimestamp()
            });
            alert("Liquidación guardada correctamente");
        } catch (e) {
            console.error(e);
            alert("Error al guardar");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header / Toolbar */}
            <div className="p-4 bg-white border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-rentia-blue" />
                    <h2 className="font-bold text-gray-800">Generador de Liquidaciones</h2>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <select 
                        value={selectedPropId} 
                        onChange={(e) => setSelectedPropId(e.target.value)}
                        className="p-2 border rounded-lg text-sm bg-white flex-grow md:w-64"
                    >
                        <option value="">Seleccionar Propiedad...</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                    </select>
                    <input 
                        type="month" 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)}
                        className="p-2 border rounded-lg text-sm bg-white"
                    />
                </div>

                <div className="flex gap-2">
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-rentia-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
                        <Save className="w-4 h-4" /> Guardar
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                </div>
            </div>

            {/* Main Content (Preview / Editor) */}
            <div className="flex-grow overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-none md:rounded-xl p-8 min-h-[1000px] print:shadow-none print:w-full print:max-w-none print:p-0">
                    
                    {/* INVOICE HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-6">
                        <div className="w-full sm:w-1/2">
                            <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="RentiaRoom" className="h-12 filter invert mb-4 object-contain" />
                            <div className="text-sm text-gray-600 space-y-1">
                                <input className="font-bold text-gray-900 border-none bg-transparent w-full focus:bg-gray-50 focus:ring-1 focus:ring-blue-200 rounded px-1" value={agencyData.name} onChange={e => setAgencyData({...agencyData, name: e.target.value})} />
                                <div className="flex gap-2 items-center"><span className="font-bold text-xs w-16">NIF:</span> <input className="border-none bg-transparent w-full focus:bg-gray-50 text-xs focus:ring-1 focus:ring-blue-200 rounded px-1" value={agencyData.cif} onChange={e => setAgencyData({...agencyData, cif: e.target.value})} /></div>
                                <div className="flex gap-2 items-center"><span className="font-bold text-xs w-16">Dirección:</span> <input className="border-none bg-transparent w-full focus:bg-gray-50 text-xs focus:ring-1 focus:ring-blue-200 rounded px-1" value={agencyData.address} onChange={e => setAgencyData({...agencyData, address: e.target.value})} /></div>
                                <div className="flex gap-2 items-center"><span className="font-bold text-xs w-16">Admin:</span> <input className="border-none bg-transparent w-full focus:bg-gray-50 text-xs focus:ring-1 focus:ring-blue-200 rounded px-1" value={agencyData.representative} onChange={e => setAgencyData({...agencyData, representative: e.target.value})} /></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-bold text-rentia-blue mb-2">LIQUIDACIÓN</h1>
                            <div className="text-sm text-gray-600">
                                <p>Nº Documento: <span className="font-mono font-bold text-gray-900">{invoiceNumber}</span></p>
                                <p>Fecha: {new Date().toLocaleDateString()}</p>
                                <p className="mt-2 font-bold bg-gray-100 px-2 py-1 rounded inline-block">Mes: {month}</p>
                            </div>
                        </div>
                    </div>

                    {/* PROPERTY INFO */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-4">
                        <div className="p-2 bg-white rounded-full text-gray-400 border border-gray-200">
                            <Building className="w-5 h-5"/>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Propiedad Gestionada</h3>
                            <p className="font-bold text-lg text-gray-800">{properties.find(p => p.id === selectedPropId)?.address || 'Seleccione Propiedad'}</p>
                            <p className="text-sm text-gray-600">{properties.find(p => p.id === selectedPropId)?.city}</p>
                        </div>
                    </div>

                    {/* TABLES */}
                    <div className="grid grid-cols-1 gap-8 mb-8">
                        
                        {/* INCOMES */}
                        <div>
                            <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                                <h4 className="font-bold text-green-700 uppercase text-sm">Ingresos (Cobrados)</h4>
                                <button onClick={() => setIncomes([...incomes, { id: Date.now(), concept: '', amount: 0 }])} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 no-print flex items-center gap-1 transition-colors"><Plus className="w-3 h-3"/> Añadir</button>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {incomes.map((inc, idx) => (
                                        <tr key={inc.id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-2 pr-2">
                                                <input className="w-full border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-200 rounded px-2" placeholder="Concepto..." value={inc.concept} onChange={e => { const n = [...incomes]; n[idx].concept = e.target.value; setIncomes(n); }} />
                                            </td>
                                            <td className="py-2 text-right w-32">
                                                <input type="number" className="w-full text-right border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-200 rounded px-2 font-mono" value={inc.amount} onChange={e => { const n = [...incomes]; n[idx].amount = Number(e.target.value); setIncomes(n); }} />
                                            </td>
                                            <td className="w-8 text-center no-print">
                                                <button onClick={() => setIncomes(incomes.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-300 font-bold bg-green-50/50">
                                        <td className="py-2 px-2">Total Ingresos</td>
                                        <td className="py-2 px-2 text-right text-green-700">{totalIncome.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
                                        <td className="no-print"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* EXPENSES */}
                        <div>
                            <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                                <h4 className="font-bold text-red-700 uppercase text-sm">Gastos (Pagados por Agencia)</h4>
                                <button onClick={() => setExpenses([...expenses, { id: Date.now(), concept: '', amount: 0 }])} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 no-print flex items-center gap-1 transition-colors"><Plus className="w-3 h-3"/> Añadir</button>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {expenses.map((exp, idx) => (
                                        <tr key={exp.id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-2 pr-2">
                                                <input className="w-full border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-200 rounded px-2" placeholder="Concepto..." value={exp.concept} onChange={e => { const n = [...expenses]; n[idx].concept = e.target.value; setExpenses(n); }} />
                                            </td>
                                            <td className="py-2 text-right w-32">
                                                <input type="number" className="w-full text-right border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-200 rounded px-2 font-mono text-red-600" value={exp.amount} onChange={e => { const n = [...expenses]; n[idx].amount = Number(e.target.value); setExpenses(n); }} />
                                            </td>
                                            <td className="w-8 text-center no-print">
                                                <button onClick={() => setExpenses(expenses.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && <tr><td colSpan={3} className="py-4 text-gray-400 italic text-xs text-center border border-dashed border-gray-200 rounded-lg">Sin gastos registrados</td></tr>}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-300 font-bold bg-red-50/50">
                                        <td className="py-2 px-2">Total Gastos</td>
                                        <td className="py-2 px-2 text-right text-red-700">-{totalExpenses.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
                                        <td className="no-print"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* COMMISSION */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-blue-800 uppercase text-sm">Honorarios de Gestión</h4>
                                <div className="flex items-center gap-2 no-print">
                                    <span className="text-xs text-blue-600">Comisión %:</span>
                                    <input type="number" className="w-16 p-1 border rounded text-right text-sm" value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Base Honorarios ({commissionRate}%)</span>
                                    <span>-{commissionBase.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>IVA ({vatRate}%)</span>
                                    <span>-{commissionVat.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                                </div>
                                <div className="flex justify-between font-bold border-t border-blue-200 pt-2 mt-2 text-blue-900">
                                    <span>Total Honorarios (Inc. IVA)</span>
                                    <span>-{totalCommission.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TOTAL */}
                    <div className="border-t-4 border-gray-800 pt-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm font-bold uppercase text-gray-500">Total a Transferir</p>
                                <p className="text-xs text-gray-400">Neto para el propietario</p>
                            </div>
                            <div className="text-4xl font-bold font-mono text-gray-900">
                                {netToOwner.toLocaleString('es-ES', {minimumFractionDigits: 2})} €
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
                        <p>Rentia Investments S.L. - B75995308</p>
                        <p>Este documento sirve como justificante de liquidación de alquileres.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};
