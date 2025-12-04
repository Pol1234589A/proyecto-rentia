
import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, Users, DollarSign, Plus, Trash2, AlertCircle, FileText, CheckCircle, Search, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Property } from '../../data/rooms';

interface SupplyCalculatorProps {
  properties: any[]; // Recibimos la lista completa para poder seleccionar
  preSelectedPropertyId?: string;
}

interface TenantInput {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  fixedFee?: number; // Solo para modo fijo
}

interface CalculationResult {
  tenantId: string;
  name: string;
  daysPresent: number;
  amountToPay: number; // En modo fijo, esto es lo que "aporta" el inquilino
}

export const SupplyCalculator: React.FC<SupplyCalculatorProps> = ({ properties, preSelectedPropertyId }) => {
  // Selection State
  const [selectedPropId, setSelectedPropId] = useState<string>(preSelectedPropertyId || '');
  
  // Bill State
  const [billAmount, setBillAmount] = useState<string>('');
  const [billStart, setBillStart] = useState<string>('');
  const [billEnd, setBillEnd] = useState<string>('');

  // Tenants State
  const [tenants, setTenants] = useState<TenantInput[]>([]);

  // Results State
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [ownerShare, setOwnerShare] = useState<number>(0); // En modo split: vacancia. En modo fixed: balance.
  const [totalCalculated, setTotalCalculated] = useState<number>(0);
  const [calculationLog, setCalculationLog] = useState<string[]>([]);

  // Derived Property Data
  const activeProperty = properties.find(p => p.id === selectedPropId);
  const isFixedMode = activeProperty?.suppliesConfig?.type === 'fixed';
  const fixedAmount = activeProperty?.suppliesConfig?.fixedAmount || 0;

  // Auto-load tenants from property when selected
  useEffect(() => {
    if (activeProperty && activeProperty.rooms) {
        // Pre-cargar inquilinos activos basados en la propiedad (Simulación basada en estado 'occupied')
        // En una app real, esto vendría de los contratos activos. Aquí lo simulamos o dejamos vacío para rellenar.
        const activeRooms = activeProperty.rooms.filter((r: any) => r.status === 'occupied');
        if (activeRooms.length > 0) {
            setTenants(activeRooms.map((r: any) => ({
                id: r.id,
                name: `Inquilino ${r.name}`,
                startDate: billStart, // Por defecto sugerimos las fechas de la factura
                endDate: billEnd,
                fixedFee: fixedAmount
            })));
        } else {
            setTenants([{ id: '1', name: '', startDate: billStart, endDate: billEnd, fixedFee: fixedAmount }]);
        }
    }
  }, [activeProperty, fixedAmount]); // Remove billStart/billEnd from dependency to avoid overwrite loop if user edits

  // Helpers
  const addTenant = () => {
    setTenants([...tenants, { id: Date.now().toString(), name: '', startDate: billStart, endDate: billEnd, fixedFee: fixedAmount }]);
  };

  const removeTenant = (id: string) => {
    setTenants(tenants.filter(t => t.id !== id));
  };

  const updateTenant = (id: string, field: keyof TenantInput, value: string) => {
    setTenants(tenants.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const getDaysDiff = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start day
  };

  // --- THE ALGORITHM ---
  const calculate = () => {
    const amount = parseFloat(billAmount);
    if (!amount || !billStart || !billEnd) {
        alert("Por favor rellena importe y fechas.");
        return;
    }

    const start = new Date(billStart);
    const end = new Date(billEnd);
    
    // Normalize times
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);

    if (end < start) {
      alert("La fecha de fin debe ser posterior a la de inicio.");
      return;
    }

    const totalDays = getDaysDiff(start, end);
    const dailyBillCost = amount / totalDays;

    let tempOwnerShare = 0;
    let tempTotalFixedCollection = 0;
    
    const tempTenantTotals: Record<string, number> = {};
    const tempTenantDays: Record<string, number> = {};

    // Initialize
    tenants.forEach(t => {
      tempTenantTotals[t.id] = 0;
      tempTenantDays[t.id] = 0;
    });

    const logs: string[] = [];
    logs.push(`Periodo: ${totalDays} días.`);

    if (isFixedMode) {
        // --- MODO AUDITORÍA (FIXED) ---
        // Calculamos cuánto DEBERÍA haber pagado cada inquilino según sus días
        tenants.forEach(t => {
            const tStart = new Date(t.startDate || start);
            const tEnd = t.endDate ? new Date(t.endDate) : end;
            
            // Intersection of Tenant Stay vs Bill Period
            const effectiveStart = tStart < start ? start : tStart;
            const effectiveEnd = tEnd > end ? end : tEnd;
            
            let days = 0;
            if (effectiveStart <= effectiveEnd) {
                days = getDaysDiff(effectiveStart, effectiveEnd);
            }
            
            tempTenantDays[t.id] = days;
            // Coste diario fijo = Cuota Mensual / 30
            const dailyFixedRate = (t.fixedFee || fixedAmount) / 30; 
            const totalForTenant = days * dailyFixedRate;
            
            tempTenantTotals[t.id] = totalForTenant;
            tempTotalFixedCollection += totalForTenant;
        });

        // Balance: Lo que cobramos - Lo que pagamos de factura
        const balance = tempTotalFixedCollection - amount;
        setOwnerShare(balance); // Aquí ownerShare se usa como Balance Neto
        setTotalCalculated(tempTotalFixedCollection); // Total recaudado

        logs.push(`Modo Cuota Fija (${fixedAmount}€/mes).`);
        logs.push(`Recaudación Teórica: ${tempTotalFixedCollection.toFixed(2)}€`);
        logs.push(`Factura Real: ${amount.toFixed(2)}€`);
        logs.push(`Balance: ${balance > 0 ? '+' : ''}${balance.toFixed(2)}€`);

    } else {
        // --- MODO REPARTO (SHARED) ---
        logs.push(`Coste diario factura: ${dailyBillCost.toFixed(4)}€.`);
        
        // DAY BY DAY ITERATION
        for (let d = 0; d < totalDays; d++) {
            const currentDay = new Date(start);
            currentDay.setDate(currentDay.getDate() + d);
            
            const activeTenants = tenants.filter(t => {
                if (!t.name || !t.startDate) return false;
                const tStart = new Date(t.startDate);
                tStart.setHours(12, 0, 0, 0);
                let tEnd = null;
                if (t.endDate) {
                    tEnd = new Date(t.endDate);
                    tEnd.setHours(12, 0, 0, 0);
                }
                return tStart <= currentDay && (!tEnd || tEnd >= currentDay);
            });

            if (activeTenants.length > 0) {
                const costPerHead = dailyBillCost / activeTenants.length;
                activeTenants.forEach(t => {
                    tempTenantTotals[t.id] += costPerHead;
                    tempTenantDays[t.id] += 1;
                });
            } else {
                // House empty -> Owner pays
                tempOwnerShare += dailyBillCost;
            }
        }
        setOwnerShare(tempOwnerShare); // Coste por vacancia
        setTotalCalculated(Object.values(tempTenantTotals).reduce((a, b) => a + b, 0) + tempOwnerShare);
    }

    // Format Results
    const finalResults: CalculationResult[] = tenants.map(t => ({
      tenantId: t.id,
      name: t.name || 'Sin Nombre',
      daysPresent: tempTenantDays[t.id] || 0,
      amountToPay: tempTenantTotals[t.id] || 0
    })).filter(r => r.amountToPay > 0); 

    setResults(finalResults);
    setCalculationLog(logs);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-rentia-blue" />
            Calculadora de Suministros
            </h3>
            <p className="text-xs text-gray-500 mt-1">
            {isFixedMode 
                ? 'Modo Auditoría: Compara factura real vs cuotas fijas cobradas.' 
                : 'Modo Reparto: Distribuye la factura exacta según días de estancia.'}
            </p>
        </div>
        
        {/* Selector de Propiedad */}
        <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <select 
                value={selectedPropId} 
                onChange={(e) => setSelectedPropId(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue"
            >
                <option value="">Seleccionar Propiedad...</option>
                {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.address}</option>
                ))}
            </select>
        </div>
      </div>

      {!selectedPropId ? (
          <div className="flex flex-col items-center justify-center flex-grow p-12 text-gray-400">
              <Calculator className="w-16 h-16 mb-4 opacity-20" />
              <p>Selecciona una propiedad para comenzar.</p>
          </div>
      ) : (
      <div className="p-6 flex-grow overflow-y-auto">
        
        {/* Banner de Modo */}
        <div className={`mb-6 p-3 rounded-lg border flex items-center justify-between ${isFixedMode ? 'bg-purple-50 border-purple-100 text-purple-800' : 'bg-orange-50 border-orange-100 text-orange-800'}`}>
            <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                {isFixedMode ? <CheckCircle className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {isFixedMode ? `Sistema: Cuota Fija (${fixedAmount}€/hab)` : 'Sistema: Gastos a Repartir'}
            </span>
            {!isFixedMode && <span className="text-[10px] bg-white/50 px-2 py-1 rounded">Algoritmo Día a Día Activo</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Invoice Data */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rentia-blue" /> 1. Datos de la Factura Real
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Importe Factura (€)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input 
                      type="number" 
                      step="0.01" 
                      value={billAmount} 
                      onChange={(e) => setBillAmount(e.target.value)} 
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-rentia-blue outline-none" 
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Inicio Periodo</label>
                  <input 
                    type="date" 
                    value={billStart} 
                    onChange={(e) => setBillStart(e.target.value)} 
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Fin Periodo</label>
                  <input 
                    type="date" 
                    value={billEnd} 
                    onChange={(e) => setBillEnd(e.target.value)} 
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* 2. Tenants Data */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-rentia-blue" /> 2. Inquilinos activos en periodo
                </h4>
                <button 
                  onClick={addTenant} 
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Añadir
                </button>
              </div>

              <div className="space-y-3">
                {tenants.map((t, index) => (
                  <div key={t.id} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-gray-50 p-3 rounded-lg border border-gray-200 animate-in slide-in-from-left-2">
                    <div className="w-full md:w-auto flex-grow">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre</label>
                      <input 
                        type="text" 
                        value={t.name} 
                        onChange={(e) => updateTenant(t.id, 'name', e.target.value)} 
                        className="w-full p-2 border rounded text-sm font-medium" 
                        placeholder={`Inquilino ${index + 1}`}
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Entrada</label>
                      <input 
                        type="date" 
                        value={t.startDate} 
                        onChange={(e) => updateTenant(t.id, 'startDate', e.target.value)} 
                        className="w-full p-2 border rounded text-sm" 
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Salida (Opcional)</label>
                      <input 
                        type="date" 
                        value={t.endDate} 
                        onChange={(e) => updateTenant(t.id, 'endDate', e.target.value)} 
                        className="w-full p-2 border rounded text-sm" 
                      />
                    </div>
                    {tenants.length > 1 && (
                      <button onClick={() => removeTenant(t.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mb-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={calculate} 
              className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 ${isFixedMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-rentia-black hover:bg-gray-800'}`}
            >
              <Calculator className="w-5 h-5" /> 
              {isFixedMode ? 'Auditar Rentabilidad Factura' : 'Calcular Reparto Justo'}
            </button>

          </div>

          {/* RIGHT COLUMN: RESULTS */}
          <div className={`text-white p-6 rounded-xl shadow-xl flex flex-col h-fit ${isFixedMode ? 'bg-purple-900' : 'bg-slate-900'}`}>
            <h3 className="font-bold text-lg mb-6 border-b border-white/20 pb-4">
                {isFixedMode ? 'Resultado Auditoría' : 'Resumen Reparto'}
            </h3>
            
            {results.length > 0 ? (
              <div className="space-y-6 animate-in fade-in">
                
                {/* Tenants Table */}
                <div className="space-y-3">
                  {results.map(r => (
                    <div key={r.tenantId} className="flex justify-between items-center bg-white/10 p-3 rounded-lg border border-white/10">
                      <div>
                        <p className="font-bold text-white text-sm">{r.name}</p>
                        <p className="text-xs text-white/60">{r.daysPresent} días en periodo</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-white">
                            {r.amountToPay.toFixed(2)} €
                        </p>
                        {isFixedMode && <p className="text-[10px] text-white/50">Cobrado (Estimado)</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- MODO FIXED: BALANCE --- */}
                {isFixedMode && (
                    <div className={`p-4 rounded-lg border ${ownerShare >= 0 ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-white uppercase flex items-center gap-1">
                                {ownerShare >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
                                Balance Propietario
                            </span>
                            <span className={`font-bold text-xl ${ownerShare >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {ownerShare > 0 ? '+' : ''}{ownerShare.toFixed(2)} €
                            </span>
                        </div>
                        <p className="text-[10px] text-white/70 leading-tight mt-2">
                            {ownerShare >= 0 
                                ? "¡Bien! Has cobrado más en cuotas fijas de lo que cuesta la factura." 
                                : "Atención: La factura es mayor que lo recaudado en cuotas fijas."}
                        </p>
                    </div>
                )}

                {/* --- MODO SHARED: VACANCIA --- */}
                {!isFixedMode && ownerShare > 0.01 && (
                  <div className="bg-red-900/30 p-4 rounded-lg border border-red-900/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-red-300 uppercase">A cargo Propietario</span>
                      <span className="font-bold text-red-400">{ownerShare.toFixed(2)} €</span>
                    </div>
                    <p className="text-[10px] text-red-200/70 leading-tight">
                      * Corresponde a días donde la vivienda estuvo totalmente vacía.
                    </p>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t border-white/20 pt-4 mt-2">
                  <div className="flex justify-between items-center text-white/60 text-xs mb-1">
                    <span>{isFixedMode ? 'Total Recaudado' : 'Total Calculado'}</span>
                    <span>{totalCalculated.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60 text-xs">
                    <span>Factura Original</span>
                    <span>{parseFloat(billAmount).toFixed(2)} €</span>
                  </div>
                </div>

                {/* Logs */}
                <div className="bg-black/20 p-3 rounded border border-white/10 text-[10px] font-mono text-white/50">
                    {calculationLog.map((log, i) => <div key={i}>{log}</div>)}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-grow text-white/30 py-12">
                <Calculator className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm text-center">Introduce datos y calcula.</p>
              </div>
            )}
          </div>

        </div>
      </div>
      )}
    </div>
  );
};
