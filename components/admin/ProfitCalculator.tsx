
import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Percent, RefreshCw, Briefcase } from 'lucide-react';

export const ProfitCalculator: React.FC = () => {
  // Estados de entrada
  const [purchasePrice, setPurchasePrice] = useState<number>(100000);
  const [itp, setItp] = useState<number>(8);
  const [notary, setNotary] = useState<number>(1500);
  const [reform, setReform] = useState<number>(15000);
  const [monthlyRent, setMonthlyRent] = useState<number>(1200);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(100);

  // Estados de resultado
  const [results, setResults] = useState({
    totalInvestment: 0,
    grossYield: 0,
    netYield: 0,
    annualCashflow: 0
  });

  useEffect(() => {
    const taxes = purchasePrice * (itp / 100);
    const totalInv = purchasePrice + taxes + notary + reform;
    
    const annualIncome = monthlyRent * 12;
    const annualExpenses = monthlyExpenses * 12;
    const netIncome = annualIncome - annualExpenses;

    setResults({
      totalInvestment: totalInv,
      grossYield: totalInv > 0 ? (annualIncome / totalInv) * 100 : 0,
      netYield: totalInv > 0 ? (netIncome / totalInv) * 100 : 0,
      annualCashflow: netIncome
    });
  }, [purchasePrice, itp, notary, reform, monthlyRent, monthlyExpenses]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-rentia-blue" />
          Calculadora de Inversión
        </h3>
      </div>

      <div className="p-6 flex-grow flex flex-col gap-6">
        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Inversión */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-2">Inversión Inicial</h4>
                
                <div>
                    <label className="text-xs text-gray-500 font-bold block mb-1">Precio Compra (€)</label>
                    <input 
                        type="number" 
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(Number(e.target.value))}
                        className="w-full p-2 border border-gray-200 rounded text-sm focus:border-rentia-blue outline-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1">ITP (%)</label>
                        <input 
                            type="number" 
                            value={itp}
                            onChange={(e) => setItp(Number(e.target.value))}
                            className="w-full p-2 border border-gray-200 rounded text-sm focus:border-rentia-blue outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1">Notaría (€)</label>
                        <input 
                            type="number" 
                            value={notary}
                            onChange={(e) => setNotary(Number(e.target.value))}
                            className="w-full p-2 border border-gray-200 rounded text-sm focus:border-rentia-blue outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold block mb-1">Reforma + Muebles (€)</label>
                    <input 
                        type="number" 
                        value={reform}
                        onChange={(e) => setReform(Number(e.target.value))}
                        className="w-full p-2 border border-gray-200 rounded text-sm focus:border-rentia-blue outline-none"
                    />
                </div>
            </div>

            {/* Explotación */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-2">Explotación Mensual</h4>
                
                <div>
                    <label className="text-xs text-gray-500 font-bold block mb-1">Ingresos Alquiler (€/mes)</label>
                    <input 
                        type="number" 
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        className="w-full p-2 border border-gray-200 rounded text-sm font-bold text-green-700 bg-green-50 focus:border-green-300 outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold block mb-1">Gastos Operativos (€/mes)</label>
                    <input 
                        type="number" 
                        value={monthlyExpenses}
                        onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                        className="w-full p-2 border border-gray-200 rounded text-sm text-red-700 bg-red-50 focus:border-red-300 outline-none"
                        placeholder="IBI, Comunidad, Seguros..."
                    />
                    <p className="text-[10px] text-gray-400 mt-1">*Incluye IBI, comunidad y seguros prorrateados.</p>
                </div>
            </div>
        </div>

        {/* Results Box */}
        <div className="mt-auto bg-slate-900 rounded-xl p-5 text-white shadow-lg">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Inversión Total</span>
                    <span className="text-xl font-bold font-mono text-white flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-rentia-gold" />
                        {results.totalInvestment.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                    </span>
                </div>
                <div>
                    <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Cashflow Neto / Año</span>
                    <span className="text-xl font-bold font-mono text-green-400 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {results.annualCashflow.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€
                    </span>
                </div>
            </div>
            
            <div className="border-t border-slate-700 my-4"></div>
            
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Rentabilidad Bruta</span>
                    <span className="text-2xl font-bold font-display text-white flex items-center gap-1">
                        {results.grossYield.toFixed(2)}<Percent className="w-4 h-4 text-slate-500" />
                    </span>
                </div>
                <div>
                    <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Rentabilidad Neta</span>
                    <span className="text-3xl font-bold font-display text-rentia-gold flex items-center gap-1">
                        <TrendingUp className="w-5 h-5" />
                        {results.netYield.toFixed(2)}<Percent className="w-5 h-5" />
                    </span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
