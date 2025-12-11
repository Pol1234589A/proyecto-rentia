
import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Plus, Trash2, Save, Printer, DollarSign, AlertCircle, FileText, TrendingDown, TrendingUp, Eraser, Download, X } from 'lucide-react';
import { Property } from '../../../data/rooms';

interface TenantRow {
    id: string;
    roomName: string;
    tenantName: string;
    baseRent: number; // Sobre lo que se comisiona
    realPay: number;  // Lo que realmente paga
    suppliesPay: number; // Suministros que paga el inquilino (si aplica)
    isPaid: boolean;
}

interface AdvancePayment {
    id: string;
    date: string;
    concept: string;
    amount: number;
    category: 'reparacion' | 'suministro' | 'limpieza' | 'otro';
}

interface AdvancedCalculatorProps {
    properties?: Property[];
}

export const AdvancedCalculator: React.FC<AdvancedCalculatorProps> = ({ properties = [] }) => {
    // --- 1. DATOS GENERALES ---
    const [config, setConfig] = useState({
        propertyName: '',
        ownerName: '',
        month: new Date().toISOString().slice(0, 7),
        commissionPercent: 15,
        vatPercent: 21,
        retentionIRPF: 0, // Por si acaso (locales, etc)
    });

    // --- 2. DATOS INQUILINOS ---
    const [tenants, setTenants] = useState<TenantRow[]>([
        { id: '1', roomName: 'H1', tenantName: '', baseRent: 0, realPay: 0, suppliesPay: 0, isPaid: true },
        { id: '2', roomName: 'H2', tenantName: '', baseRent: 0, realPay: 0, suppliesPay: 0, isPaid: true },
        { id: '3', roomName: 'H3', tenantName: '', baseRent: 0, realPay: 0, suppliesPay: 0, isPaid: true },
    ]);

    // --- 3. GASTOS GENERALES (Facturas que llegan a la vivienda) ---
    const [expenses, setExpenses] = useState({
        electricity: 0,
        water: 0,
        gas: 0,
        internet: 0,
        cleaningCost: 0, // Coste real de la limpiadora
    });

    // --- 4. PAGOS ADELANTADOS (Suplidos por Rentia) ---
    const [advances, setAdvances] = useState<AdvancePayment[]>([]);

    // --- CÁLCULOS AUTOMÁTICOS ---
    const totals = useMemo(() => {
        // A. INGRESOS REALES (Lo que entra en el banco de Rentia/Propietario)
        const totalBaseRent = tenants.reduce((acc, t) => acc + (t.isPaid ? t.baseRent : 0), 0);
        const totalRealRent = tenants.reduce((acc, t) => acc + (t.isPaid ? t.realPay : 0), 0);
        const totalSuppliesCollected = tenants.reduce((acc, t) => acc + (t.isPaid ? t.suppliesPay : 0), 0);
        
        // Diferencial (Limpieza cobrada al inquilino implícita en el precio)
        const totalCleaningCollected = totalRealRent - totalBaseRent; 

        // B. COMISIÓN RENTIA
        const commissionBase = totalBaseRent; 
        const commissionAmount = commissionBase * (config.commissionPercent / 100);
        const commissionVAT = commissionAmount * (config.vatPercent / 100);
        const totalAgencyInvoice = commissionAmount + commissionVAT;

        // C. GASTOS A DESCONTAR AL PROPIETARIO
        const totalUtilitiesBill = expenses.electricity + expenses.water + expenses.gas + expenses.internet;
        const totalAdvances = advances.reduce((acc, a) => acc + a.amount, 0);
        
        // D. LIQUIDACIÓN
        // Asumimos que Rentia cobra todo el alquiler. Entonces:
        // A favor del propietario = (Alquiler Real + Suministros Cobrados)
        // A restar = (Comisión + IVA) + (Facturas Suministros Pagadas por Rentia) + (Adelantos/Reparaciones) + (Coste Limpieza Real)
        
        const totalIn = totalRealRent + totalSuppliesCollected;
        const totalOut = totalAgencyInvoice + totalUtilitiesBill + totalAdvances + expenses.cleaningCost;
        
        const netSettlement = totalIn - totalOut;

        return {
            totalBaseRent,
            totalRealRent,
            totalCleaningCollected, // Lo que pagan los inquilinos "extra" por limpieza
            totalSuppliesCollected,
            totalIn,
            commissionAmount,
            commissionVAT,
            totalAgencyInvoice,
            totalUtilitiesBill,
            totalAdvances,
            totalOut,
            netSettlement,
            balanceCleaning: totalCleaningCollected - expenses.cleaningCost // Positivo = ganancia en limpieza, Negativo = la limpieza cuesta más de lo que se cobra
        };
    }, [tenants, config, expenses, advances]);

    // --- HANDLERS ---
    const addTenantRow = () => {
        setTenants([...tenants, { 
            id: Date.now().toString(), 
            roomName: `H${tenants.length + 1}`, 
            tenantName: '', 
            baseRent: 0, 
            realPay: 0, 
            suppliesPay: 0,
            isPaid: true 
        }]);
    };

    const updateTenant = (id: string, field: keyof TenantRow, value: any) => {
        setTenants(prev => prev.map(t => {
            if (t.id !== id) return t;
            const updated = { ...t, [field]: value };
            // Auto-calculate RealPay if BaseRent changes and RealPay was 0 or equal (Smart UX)
            if (field === 'baseRent' && (t.realPay === 0 || t.realPay === t.baseRent)) {
                updated.realPay = Number(value);
            }
            return updated;
        }));
    };

    const removeTenant = (id: string) => setTenants(prev => prev.filter(t => t.id !== id));

    const addAdvance = () => {
        setAdvances([...advances, { 
            id: Date.now().toString(), 
            date: new Date().toISOString().slice(0, 10), 
            concept: '', 
            amount: 0, 
            category: 'reparacion' 
        }]);
    };

    const updateAdvance = (id: string, field: keyof AdvancePayment, value: any) => {
        setAdvances(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };
    
    const removeAdvance = (id: string) => setAdvances(prev => prev.filter(a => a.id !== id));

    const handlePrint = () => window.print();

    // Cargar datos de propiedad seleccionada (Simulación rápida)
    const loadPropertyData = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const propId = e.target.value;
        const prop = properties.find(p => p.id === propId);
        if (prop) {
            setConfig(prev => ({
                ...prev,
                propertyName: prop.address,
                commissionPercent: prop.managementCommission || 15
            }));
            // Cargar habitaciones
            const newTenants = prop.rooms.map(r => ({
                id: r.id,
                roomName: r.name,
                tenantName: r.status === 'occupied' ? 'Ocupado' : 'Vacío',
                baseRent: r.price, // Asumimos precio público como base
                realPay: r.price,  // Inicialmente igual
                suppliesPay: prop.suppliesConfig?.type === 'fixed' ? (prop.suppliesConfig.fixedAmount || 0) : 0,
                isPaid: r.status === 'occupied'
            }));
            setTenants(newTenants);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* TOOLBAR NO IMPRIMIBLE */}
            <div className="bg-white border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 no-print shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rentia-blue rounded-lg text-white">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Liquidaciones</h2>
                        <p className="text-xs text-gray-500">Generador de informes económicos para propietarios</p>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <select onChange={loadPropertyData} className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-rentia-blue outline-none flex-grow md:w-64">
                        <option value="">Cargar Propiedad...</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                    </select>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-bold">
                        <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Imprimir PDF</span>
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL (SCROLLABLE) */}
            <div className="flex-grow overflow-auto p-4 md:p-8 custom-scrollbar">
                
                {/* HOJA DE LIQUIDACIÓN (VISTA PAPEL) */}
                <div className="max-w-4xl mx-auto bg-white shadow-xl border border-gray-200 rounded-xl p-8 md:p-12 print:shadow-none print:border-none print:w-full print:max-w-none">
                    
                    {/* CABECERA DOCUMENTO */}
                    <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                        <div>
                            <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="RentiaRoom" className="h-8 filter invert mb-2" />
                            <p className="text-xs text-gray-500 font-medium">Rentia Investments S.L.</p>
                            <p className="text-xs text-gray-400">C/ Brazal de Álamos, 7, Murcia</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-bold text-gray-800 font-display uppercase tracking-wide">Liquidación Mensual</h1>
                            <div className="mt-2">
                                <input 
                                    type="month" 
                                    value={config.month} 
                                    onChange={e => setConfig({...config, month: e.target.value})}
                                    className="text-right font-mono text-gray-600 border-none focus:ring-0 p-0 bg-transparent cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* DATOS PROPIEDAD */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100 print:bg-gray-50">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Inmueble</label>
                            <input 
                                type="text" 
                                value={config.propertyName} 
                                onChange={e => setConfig({...config, propertyName: e.target.value})}
                                className="w-full bg-transparent border-b border-gray-300 focus:border-rentia-blue outline-none font-bold text-gray-800"
                                placeholder="Dirección de la vivienda"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Propietario</label>
                            <input 
                                type="text" 
                                value={config.ownerName} 
                                onChange={e => setConfig({...config, ownerName: e.target.value})}
                                className="w-full bg-transparent border-b border-gray-300 focus:border-rentia-blue outline-none font-bold text-gray-800"
                                placeholder="Nombre del Propietario"
                            />
                        </div>
                    </div>

                    {/* 1. DESGLOSE INGRESOS */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-rentia-black uppercase border-b-2 border-rentia-blue pb-1 mb-4 flex justify-between">
                            <span>1. Ingresos por Habitaciones</span>
                            <span className="text-green-600">{totals.totalIn.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                        </h3>
                        
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="p-3 w-16">Hab</th>
                                        <th className="p-3">Inquilino</th>
                                        <th className="p-3 text-right bg-blue-50/50 text-blue-800" title="Base sobre la que se calcula comisión">Base (€)</th>
                                        <th className="p-3 text-right" title="Total pagado por inquilino">Total (€)</th>
                                        <th className="p-3 text-right text-gray-400 no-print">Extra/Limp</th>
                                        <th className="p-3 text-center w-10 no-print"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tenants.map((t, idx) => {
                                        const extra = t.realPay - t.baseRent;
                                        return (
                                        <tr key={t.id} className={!t.isPaid ? 'opacity-50 bg-red-50' : ''}>
                                            <td className="p-2"><input type="text" value={t.roomName} onChange={e => updateTenant(t.id, 'roomName', e.target.value)} className="w-full bg-transparent text-center font-bold" /></td>
                                            <td className="p-2"><input type="text" value={t.tenantName} onChange={e => updateTenant(t.id, 'tenantName', e.target.value)} className="w-full bg-transparent" placeholder="Nombre..." /></td>
                                            <td className="p-2 bg-blue-50/30"><input type="number" value={t.baseRent} onChange={e => updateTenant(t.id, 'baseRent', Number(e.target.value))} className="w-full bg-transparent text-right font-mono" /></td>
                                            <td className="p-2"><input type="number" value={t.realPay} onChange={e => updateTenant(t.id, 'realPay', Number(e.target.value))} className="w-full bg-transparent text-right font-mono font-bold" /></td>
                                            <td className="p-2 text-right text-gray-400 text-xs no-print">+{extra}€</td>
                                            <td className="p-2 text-center no-print">
                                                <div className="flex items-center gap-1">
                                                    <input type="checkbox" checked={t.isPaid} onChange={e => updateTenant(t.id, 'isPaid', e.target.checked)} title="Pagado?" />
                                                    <button onClick={() => removeTenant(t.id)} className="text-red-300 hover:text-red-500"><X className="w-3 h-3"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2 text-right no-print">
                            <button onClick={addTenantRow} className="text-xs text-rentia-blue font-bold flex items-center gap-1 ml-auto hover:underline"><Plus className="w-3 h-3"/> Añadir Habitación</button>
                        </div>
                    </div>

                    {/* 2. GASTOS Y SUPLIDOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        
                        {/* 2.1 Factura Agencia */}
                        <div>
                            <h3 className="text-sm font-bold text-rentia-black uppercase border-b-2 border-gray-200 pb-1 mb-4">2. Honorarios Gestión</h3>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <label className="text-gray-600">Base Comisionable</label>
                                    <span className="font-mono">{totals.totalBaseRent.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-gray-600 flex items-center gap-2">
                                        % Comisión
                                        <input type="number" value={config.commissionPercent} onChange={e => setConfig({...config, commissionPercent: Number(e.target.value)})} className="w-12 p-1 text-xs border rounded text-center no-print" />
                                    </label>
                                    <span className="font-mono text-red-600">-{totals.commissionAmount.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-gray-600">IVA ({config.vatPercent}%)</label>
                                    <span className="font-mono text-red-600">-{totals.commissionVAT.toFixed(2)} €</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 flex justify-between items-center font-bold">
                                    <span>Total Factura Rentia</span>
                                    <span>{totals.totalAgencyInvoice.toFixed(2)} €</span>
                                </div>
                            </div>
                        </div>

                        {/* 2.2 Gastos Suplidos */}
                        <div>
                            <h3 className="text-sm font-bold text-rentia-black uppercase border-b-2 border-gray-200 pb-1 mb-4">3. Gastos Suplidos</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Suministros (Luz/Agua/Gas/Net)</span>
                                    <div className="flex gap-1 items-center">
                                        <input type="number" className="w-16 text-right p-1 border rounded text-xs no-print" placeholder="Luz" value={expenses.electricity || ''} onChange={e => setExpenses({...expenses, electricity: Number(e.target.value)})} />
                                        <input type="number" className="w-16 text-right p-1 border rounded text-xs no-print" placeholder="Agua" value={expenses.water || ''} onChange={e => setExpenses({...expenses, water: Number(e.target.value)})} />
                                        <input type="number" className="w-16 text-right p-1 border rounded text-xs no-print" placeholder="Net" value={expenses.internet || ''} onChange={e => setExpenses({...expenses, internet: Number(e.target.value)})} />
                                        <span className="font-mono font-bold text-red-600 w-16 text-right">-{totals.totalUtilitiesBill.toFixed(2)} €</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Servicio Limpieza (Coste)</span>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={expenses.cleaningCost} onChange={e => setExpenses({...expenses, cleaningCost: Number(e.target.value)})} className="w-20 text-right p-1 border rounded text-xs no-print" />
                                        <span className="font-mono font-bold text-red-600">-{expenses.cleaningCost.toFixed(2)} €</span>
                                    </div>
                                </div>
                                
                                {/* Lista Dinámica de Adelantos */}
                                {advances.map(adv => (
                                    <div key={adv.id} className="flex justify-between items-center group">
                                        <div className="flex gap-2 items-center flex-grow">
                                            <input type="text" value={adv.concept} onChange={e => updateAdvance(adv.id, 'concept', e.target.value)} className="bg-transparent border-b border-gray-300 w-full text-xs focus:border-rentia-blue outline-none" placeholder="Concepto reparación..." />
                                            <button onClick={() => removeAdvance(adv.id)} className="text-red-300 hover:text-red-500 no-print"><X className="w-3 h-3"/></button>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            <input type="number" value={adv.amount} onChange={e => updateAdvance(adv.id, 'amount', Number(e.target.value))} className="w-20 text-right p-1 border rounded text-xs no-print" />
                                            <span className="font-mono font-bold text-red-600">-{adv.amount.toFixed(2)} €</span>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addAdvance} className="text-xs text-rentia-blue font-bold hover:underline no-print flex items-center gap-1"><Plus className="w-3 h-3"/> Añadir Gasto Extra</button>

                                <div className="border-t border-gray-200 pt-2 flex justify-between items-center font-bold mt-2">
                                    <span>Total Gastos</span>
                                    <span>{(totals.totalUtilitiesBill + totals.totalAdvances + expenses.cleaningCost).toFixed(2)} €</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LIQUIDACIÓN FINAL */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg print:bg-white print:text-black print:border-2 print:border-black">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h2 className="text-xl font-bold font-display mb-2">Resultado Liquidación</h2>
                                <p className="text-slate-400 text-sm print:text-gray-600">Transferencia a realizar en los próximos 5 días.</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <div className="flex justify-between text-sm opacity-80 print:text-gray-600">
                                    <span>Total Cobrado</span>
                                    <span>{totals.totalIn.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-sm opacity-80 print:text-gray-600">
                                    <span>Total Deducido</span>
                                    <span>-{totals.totalOut.toFixed(2)} €</span>
                                </div>
                                <div className="border-t border-white/20 print:border-black pt-2 mt-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold uppercase tracking-wider">A Pagar al Propietario</span>
                                        <span className="text-3xl font-bold font-display text-rentia-gold print:text-black">{totals.netSettlement.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER AUDITORÍA (SOLO PANTALLA) */}
                    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 no-print">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4"/> Auditoría Interna (No visible en PDF)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-gray-500 uppercase font-bold text-[10px]">Balance Limpieza</p>
                                <p className={`font-bold text-lg ${totals.balanceCleaning >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {totals.balanceCleaning > 0 ? '+' : ''}{totals.balanceCleaning.toFixed(2)} €
                                </p>
                                <p className="text-[10px]">Cobrado extra vs Coste real</p>
                            </div>
                            <div>
                                <p className="text-gray-500 uppercase font-bold text-[10px]">Beneficio Agencia</p>
                                <p className="font-bold text-lg text-blue-600">
                                    {(totals.commissionAmount + (totals.balanceCleaning > 0 ? totals.balanceCleaning : 0)).toFixed(2)} €
                                </p>
                                <p className="text-[10px]">Comisión Neta + Margen Limpieza</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
