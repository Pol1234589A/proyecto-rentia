
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { opportunities as staticOpportunities } from '../../data';
import { Opportunity } from '../../types';
import { Save, RefreshCw, TrendingUp, CheckCircle, AlertTriangle, ChevronDown, ChevronRight, UploadCloud, DollarSign } from 'lucide-react';

export const OpportunityManager: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Cargar datos de Firestore
  const fetchOpportunities = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const querySnapshot = await getDocs(collection(db, "opportunities"));
      const props: Opportunity[] = [];
      querySnapshot.forEach((doc) => {
        props.push({ ...doc.data(), id: doc.id } as Opportunity);
      });
      setOpportunities(props);
    } catch (error: any) {
      console.error("Error fetching opportunities:", error);
      let errorText = "Error al cargar datos.";
      if (error.code === 'permission-denied') errorText = "Permisos insuficientes.";
      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Función para subir los datos estáticos a Firebase
  const handleImportStaticData = async () => {
    if (!window.confirm("¿Estás seguro? Esto sobrescribirá la base de datos de Oportunidades.")) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const batch = writeBatch(db);
      
      staticOpportunities.forEach(opp => {
        const docRef = doc(db, "opportunities", opp.id);
        batch.set(docRef, opp);
      });

      await batch.commit();
      setMessage({ type: 'success', text: "Oportunidades importadas correctamente." });
      await fetchOpportunities();
      
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: "Error al importar datos." });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: 'available' | 'reserved' | 'sold') => {
    setOpportunities(prev => prev.map(opp => opp.id === id ? { ...opp, status: newStatus } : opp));
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setOpportunities(prev => prev.map(opp => 
        opp.id === id ? { ...opp, financials: { ...opp.financials, purchasePrice: newPrice } } : opp
    ));
  };

  const saveOpportunity = async (opp: Opportunity) => {
    setSaving(true);
    setMessage(null);
    try {
      const docRef = doc(db, "opportunities", opp.id);
      await updateDoc(docRef, { 
          status: opp.status,
          'financials.purchasePrice': opp.financials.purchasePrice
      });
      setMessage({ type: 'success', text: `Cambios guardados en ${opp.title}` });
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: "Error al guardar cambios." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col mt-8">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
        <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rentia-blue" />
            Gestor de Inversiones (Live)
            </h3>
            <p className="text-xs text-gray-500 mt-1">Gestiona el estado y precio de los activos de inversión.</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={fetchOpportunities} 
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors" 
                title="Recargar datos"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {(opportunities.length === 0) && (
                <button 
                    onClick={handleImportStaticData}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                    <UploadCloud className="w-4 h-4" /> Importar Inicial
                </button>
            )}
        </div>
      </div>

      <div className="p-0 overflow-y-auto max-h-[600px] bg-gray-50">
        {message && (
            <div className={`m-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                {message.text}
            </div>
        )}

        <div className="divide-y divide-gray-200">
            {opportunities.map(opp => (
                <div key={opp.id} className="bg-white">
                    <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
                    >
                        <div className="flex items-center gap-3">
                            {expandedId === opp.id ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                            <div>
                                <span className="font-bold text-sm text-gray-800">{opp.title}</span>
                                <div className="text-xs text-gray-500 flex gap-2">
                                    <span>{opp.city}</span>
                                    <span>•</span>
                                    <span className={`font-bold uppercase ${opp.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>{opp.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {expandedId === opp.id && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estado</label>
                                    <select 
                                        value={opp.status}
                                        onChange={(e) => handleStatusChange(opp.id, e.target.value as any)}
                                        className="w-full text-sm p-2 rounded border border-gray-300 bg-white"
                                    >
                                        <option value="available">Disponible</option>
                                        <option value="reserved">Reservado</option>
                                        <option value="sold">Vendido</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Precio Compra</label>
                                    <input 
                                        type="number" 
                                        value={opp.financials.purchasePrice}
                                        onChange={(e) => handlePriceChange(opp.id, Number(e.target.value))}
                                        className="w-full text-sm p-2 rounded border border-gray-300 focus:border-rentia-blue outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => saveOpportunity(opp)}
                                    disabled={saving}
                                    className="bg-rentia-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                    {saving ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
