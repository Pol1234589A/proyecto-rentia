
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
  includedAmount?: number; // Cantidad ya incluida en el alquiler (para restar del total)
}

interface CalculationResult {
  tenantId: string;
  name: string;
  daysPresent: number;
  realCost: number; // El coste real calculado
  includedAmount: number; // Lo que ya cubre su alquiler
  amountToPay: number; // El resultado final (Real - Incluido)
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
  const [ownerShare, setOwnerShare] = useState<number>(0);
  const [totalCalculated, setTotalCalculated] = useState<number>(0);
  const [calculationLog, setCalculationLog] = useState<string[]>([]);

  // Derived Property Data
  const activeProperty = properties.find(p => p.id === selectedPropId);
  const isFixedMode = activeProperty?.suppliesConfig?.type === 'fixed';
  const fixedAmount = activeProperty?.suppliesConfig?.fixedAmount || 0;

  // Property Specific Alerts (Memorized Incidents)
  const [propertyAlert, setPropertyAlert] = useState<{ message: string, type: 'warning' | 'info' } | null>(null);

  // Auto-load tenants from property when selected
  useEffect(() => {
    if (activeProperty && activeProperty.address) {
      // RESET ALERT
      setPropertyAlert(null);

      // MEMORIZED LOGIC: Santa Rita 2
      if (activeProperty.address.toLowerCase().includes('santa rita') || activeProperty.address.toLowerCase().includes('santa rita 2')) {
        setPropertyAlert({
          type: 'warning',
          message: "🚿 INCIDENTE MEMORIZADO (19-25 Ene 2026): Hubo una reparación en la ducha por goteo. La gestora ha ordenado un DESCUENTO DE 20€ a cada inquilino en esta mensualidad."
        });
      }
    }

    if (activeProperty && activeProperty.rooms) {
      const activeRooms = activeProperty.rooms.filter((r: any) => r.status === 'occupied' || r.status === 'available');

      if (activeRooms.length > 0) {
        setTenants(activeRooms.map((r: any) => ({
          id: r.id,
          name: r.name ? `${r.name} (Hab)` : `Habitación ${r.id}`,
          startDate: billStart,
          endDate: billEnd,
          fixedFee: fixedAmount,
          includedAmount: 0
        })));
      } else {
        setTenants([{ id: '1', name: '', startDate: billStart, endDate: billEnd, fixedFee: fixedAmount, includedAmount: 0 }]);
      }
    }
  }, [activeProperty, fixedAmount]); // Removed billStart/billEnd to avoid overwrite on standard typing

  // Helpers
  const addTenant = () => {
    setTenants([...tenants, { id: Date.now().toString(), name: '', startDate: billStart, endDate: billEnd, fixedFee: fixedAmount, includedAmount: 0 }]);
  };

  const removeTenant = (id: string) => {
    setTenants(tenants.filter(t => t.id !== id));
  };

  const updateTenant = (id: string, field: keyof TenantInput, value: string | number) => {
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
      // ... (Keep Fixed logic mostly same but adapt to new struct if needed, though typically Fixed Mode ignores bill share)
      // For now, let's keep Fixed Mode as "Auditoría" only.
      // But the user requested "Primero de Mayo" which seems to be SHARED MODE but with INCLUDED amounts.

      // Let's Focus on SHARED MODE update.
    }

    // BOTH MODES (Parallel calculation for Logic consistency, but mostly for Shared)
    if (!isFixedMode) {
      logs.push(`Coste diario factura: ${dailyBillCost.toFixed(4)}€.`);

      for (let d = 0; d < totalDays; d++) {
        const currentDay = new Date(start);
        currentDay.setDate(currentDay.getDate() + d);

        const activeTenants = tenants.filter(t => {
          const tName = t.name || '';
          const tStart = t.startDate ? new Date(t.startDate) : null;
          if (tStart) tStart.setHours(12, 0, 0, 0);

          let tEnd = null;
          if (t.endDate) {
            tEnd = new Date(t.endDate);
            tEnd.setHours(12, 0, 0, 0);
          }

          if (!tStart) return false;
          return tStart <= currentDay && (!tEnd || tEnd >= currentDay);
        });

        if (activeTenants.length > 0) {
          const costPerHead = dailyBillCost / activeTenants.length;
          activeTenants.forEach(t => {
            tempTenantTotals[t.id] += costPerHead;
            tempTenantDays[t.id] += 1;
          });
        } else {
          tempOwnerShare += dailyBillCost;
        }
      }
      setOwnerShare(tempOwnerShare);

      const calculatedSum = Object.values(tempTenantTotals).reduce((a, b) => a + b, 0) + tempOwnerShare;
      setTotalCalculated(calculatedSum);
    } else {
      // Fixed Mode logic placeholder (unchanged for now, focusing on the user request)
      // ...
      setTotalCalculated(0); // Simplify
    }

    // Format Results
    const finalResults: CalculationResult[] = tenants.map(t => {
      const realCost = tempTenantTotals[t.id] || 0;
      const included = t.includedAmount || 0;
      // If Real Cost > Included => Pay Difference. If Real Cost < Included => Pay 0 (Covered).
      // Logic from user: "resta por abonar 4,41 €". 
      const toPay = Math.max(0, realCost - included);

      return {
        tenantId: t.id,
        name: t.name || 'Sin Nombre',
        daysPresent: tempTenantDays[t.id] || 0,
        realCost: realCost,
        includedAmount: included,
        amountToPay: toPay
      };
    }).filter(r => r.daysPresent > 0 || r.amountToPay > 0); // Show details even if paying 0 if they were present

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
              : 'Modo Reparto / Híbrido: Distribuye la factura y descuenta importes incluidos.'}
          </p>
        </div>

        {/* Selector de Propiedad */}
        <div className="relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <select
            value={selectedPropId}
            onChange={(e) => setSelectedPropId(e.target.value)}
            className="w-full sm:w-auto pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue"
            title="Seleccionar Propiedad"
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
              {isFixedMode ? `Sistema: Cuota Fija (${fixedAmount}€/hab)` : 'Sistema: Gastos a Repartir (o Híbrido)'}
            </span>
            {!isFixedMode && <span className="text-[10px] bg-white/50 px-2 py-1 rounded">Algoritmo Día a Día Activo</span>}
          </div>

          {/* Alert for Specific Properties */}
          {propertyAlert && (
            <div className="mb-6 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
              <AlertCircle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm uppercase mb-1">Nota Memorizada</h4>
                <p className="text-sm font-medium leading-relaxed">{propertyAlert.message}</p>
              </div>
            </div>
          )}

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
                        title="Importe Factura"
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
                      title="Fecha Inicio"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Fin Periodo</label>
                    <input
                      type="date"
                      value={billEnd}
                      onChange={(e) => setBillEnd(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rentia-blue outline-none"
                      title="Fecha Fin"
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
                    title="Añadir Inquilino Manualmente"
                  >
                    <Plus className="w-3 h-3" /> Añadir
                  </button>
                </div>

                <div className="space-y-3">
                  {tenants.map((t, index) => (
                    <div key={t.id} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-gray-50 p-3 rounded-lg border border-gray-200 animate-in slide-in-from-left-2">
                      <div className="w-full md:w-32 flex-grow">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre / Hab</label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => updateTenant(t.id, 'name', e.target.value)}
                          className="w-full p-2 border rounded text-sm font-medium"
                          placeholder={`Hab ${index + 1}`}
                          title="Nombre Inquilino"
                        />
                      </div>
                      <div className="w-full md:w-28">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Entrada</label>
                        <input
                          type="date"
                          value={t.startDate}
                          onChange={(e) => updateTenant(t.id, 'startDate', e.target.value)}
                          className="w-full p-2 border rounded text-xs"
                          title="Fecha Entrada"
                        />
                      </div>
                      <div className="w-full md:w-28">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Salida (Opc)</label>
                        <input
                          type="date"
                          value={t.endDate}
                          onChange={(e) => updateTenant(t.id, 'endDate', e.target.value)}
                          className="w-full p-2 border rounded text-xs"
                          title="Fecha Salida"
                        />
                      </div>
                      <div className="w-full md:w-24">
                        <label className="block text-[10px] font-bold text-rentia-blue uppercase mb-1">Incluido (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={t.includedAmount || 0}
                          onChange={(e) => updateTenant(t.id, 'includedAmount', parseFloat(e.target.value))}
                          className="w-full p-2 border border-blue-200 rounded text-sm font-bold text-blue-700 text-center"
                          placeholder="0"
                          title="Cantidad Incluida"
                        />
                      </div>
                      {tenants.length > 1 && (
                        <button onClick={() => removeTenant(t.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mb-0.5" title="Eliminar Inquilino">
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
                title="Calcular"
              >
                <Calculator className="w-5 h-5" />
                {isFixedMode ? 'Auditar Rentabilidad' : 'Calcular Reparto'}
              </button>

            </div>

            {/* RIGHT COLUMN: RESULTS */}
            <div className={`text-white p-6 rounded-xl shadow-xl flex flex-col h-fit ${isFixedMode ? 'bg-purple-900' : 'bg-slate-900'}`}>
              <h3 className="font-bold text-lg mb-6 border-b border-white/20 pb-4">
                Resultados del Reparto
              </h3>

              {results.length > 0 ? (
                <div className="space-y-6 animate-in fade-in">

                  {/* Tenants Table */}
                  <div className="space-y-3">
                    {results.map(r => (
                      <div key={r.tenantId} className="flex flex-col bg-white/10 p-3 rounded-lg border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white text-sm">{r.name}</span>
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white/80">{r.daysPresent} días</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-center text-xs">
                          <div className="bg-black/20 p-2 rounded">
                            <span className="block text-[9px] uppercase text-white/40 mb-1">Coste Real</span>
                            <span className="font-medium text-white/70">{r.realCost.toFixed(2)}€</span>
                          </div>
                          <div className="bg-blue-900/30 p-2 rounded border border-blue-500/30">
                            <span className="block text-[9px] uppercase text-blue-300 mb-1">Incluido</span>
                            <span className="font-medium text-blue-200">{r.includedAmount.toFixed(2)}€</span>
                          </div>
                          <div className="bg-green-600 p-2 rounded shadow-sm">
                            <span className="block text-[9px] uppercase text-green-100 mb-1">A Pagar</span>
                            <span className="font-bold text-white text-base">{r.amountToPay.toFixed(2)}€</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

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
                      <span>{isFixedMode ? 'Total Fijado' : 'Total Calculado'}</span>
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
