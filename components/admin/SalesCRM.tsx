import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { brokerRequests as staticRequests, BrokerRequest } from '../../data/brokerRequests';
import { Opportunity, OpportunityScenario, Visibility } from '../../types';
import { Briefcase, Building2, UserPlus, Search, Filter, TrendingUp, MapPin, DollarSign, Save, ArrowRight, Users, Eye, EyeOff, Plus, Image as ImageIcon, Trash2, Home, Bed, Layout, Bath, Phone, FileText, Tag, AlertCircle, Handshake, Star, Crown, X } from 'lucide-react';

// Extended interface to include CRM specific fields like name/contact if available
interface ExtendedBrokerRequest extends BrokerRequest {
    name?: string;
    contact?: string;
}

export const SalesCRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'buyers' | 'sellers'>('buyers');
  
  // --- STATE BUYERS ---
  const [buyers, setBuyers] = useState<ExtendedBrokerRequest[]>(staticRequests);
  const [isAddingBuyer, setIsAddingBuyer] = useState(false);
  
  // Formulario alineado con la vista pública + datos privados
  const [newBuyer, setNewBuyer] = useState({
    name: '',       // Privado
    contact: '',    // Privado
    type: '',       // Público (Ej: Piso, Casa)
    specs: '',      // Público (Ej: Min 3 Hab)
    condition: '',  // Público (Ej: A reformar) - NUEVO CAMPO AÑADIDO AL STATE
    location: '',   // Público
    budget: 0,      // Público
    notes: '',      // Público (Notas públicas)
    tag: 'own' as const // Público (Badge)
  });

  // --- STATE SELLERS (ASSETS) ---
  const [assets, setAssets] = useState<Opportunity[]>([]);
  const [sortOrder, setSortOrder] = useState<'yield_desc' | 'price_asc' | 'price_desc'>('yield_desc');
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  // --- ASSET FORM STATE ---
  const [assetForm, setAssetForm] = useState({
    // General
    title: '',
    type: 'Piso',
    scenario: 'rent_rooms' as OpportunityScenario,
    visibility: 'exact' as Visibility,
    
    // Location
    address: '',
    streetName: '', 
    streetNumber: '', 
    city: 'Murcia',
    floor: '',
    hasElevator: false,
    
    // Specs
    rooms: 0,
    bathrooms: 0,
    sqm: 0,
    
    // Description & Media
    description: '',
    images: [] as string[],
    newImageUrl: '', 
    
    // Financials
    purchasePrice: 0,
    itpPercent: 8, 
    reformCost: 0,
    furnitureCost: 0,
    notaryExpenses: 1500, 
    yearlyExpenses: 0, 
    
    // Rental Scenarios
    roomPrices: [] as {name: string, price: number}[],
    traditionalRent: 0,
  });

  // --- LOAD DATA ---
  useEffect(() => {
    // Cargar compradores de Firestore y mezclar con estáticos para visualización completa
    const unsubscribeBuyers = onSnapshot(collection(db, "buyer_requests"), (snapshot) => {
        const firestoreBuyers: ExtendedBrokerRequest[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            firestoreBuyers.push({
                id: doc.id,
                reference: data.reference,
                type: data.type,
                specs: data.specs,
                location: data.location,
                condition: data.condition || 'Estándar',
                budget: data.budget,
                notes: data.notes,
                tag: data.tag || 'own',
                name: data.name,     
                contact: data.contact 
            });
        });
        // IMPORTANTE: Primero los de Firestore (más recientes/editables), luego los estáticos
        setBuyers([...firestoreBuyers, ...staticRequests]);
    });

    const unsubscribeAssets = onSnapshot(collection(db, "opportunities"), (snapshot) => {
        const loadedAssets: Opportunity[] = [];
        snapshot.forEach((doc) => {
            loadedAssets.push({ ...doc.data(), id: doc.id } as Opportunity);
        });
        setAssets(loadedAssets);
    }, (error) => {
        console.log("No opportunities found", error);
    });

    return () => { unsubscribeBuyers(); unsubscribeAssets(); };
  }, []);

  // --- HANDLERS BUYERS ---
  const handleAddBuyer = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const refCode = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
          // Guardamos todos los campos necesarios para que la vista pública (/colaboradores) funcione igual
          await addDoc(collection(db, "buyer_requests"), {
              ...newBuyer,
              reference: refCode,
              createdAt: serverTimestamp(),
          });
          setIsAddingBuyer(false);
          setNewBuyer({ name: '', contact: '', type: '', specs: '', location: '', condition: '', budget: 0, notes: '', tag: 'own' });
          // No necesitamos alert, el snapshot actualiza la UI
      } catch (error) { console.error(error); alert('Error al guardar.'); }
  };

  const handleDeleteBuyer = async (id: string) => {
      if (!window.confirm("¿Seguro que quieres eliminar este encargo? Desaparecerá también de la web pública.")) return;
      
      try {
          // Verificar si es estático
          const isStatic = staticRequests.some(r => r.id === id);
          if (isStatic) {
              alert("Los datos de demostración estáticos no se pueden borrar desde el CRM. Borra solo los creados aquí.");
              return;
          }

          await deleteDoc(doc(db, "buyer_requests", id));
      } catch (error) {
          console.error("Error deleting buyer:", error);
          alert("Error al eliminar. Verifica permisos.");
      }
  };

  // --- ASSET FORM HELPERS ---
  const addImage = () => {
      if(assetForm.newImageUrl) {
          setAssetForm(prev => ({...prev, images: [...prev.images, prev.newImageUrl], newImageUrl: ''}));
      }
  };

  const handleRoomCountChange = (count: number) => {
      const currentPrices = [...assetForm.roomPrices];
      const newPrices = [];
      for(let i=0; i<count; i++) {
          if(i < currentPrices.length) newPrices.push(currentPrices[i]);
          else newPrices.push({ name: `Habitación ${i+1}`, price: 0 });
      }
      setAssetForm(prev => ({ ...prev, rooms: count, roomPrices: newPrices }));
  };

  const updateRoomPrice = (index: number, price: number) => {
      const newPrices = [...assetForm.roomPrices];
      newPrices[index].price = price;
      setAssetForm(prev => ({ ...prev, roomPrices: newPrices }));
  };

  // --- HANDLER ADD ASSET ---
  const handleSaveAsset = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const itpAmount = assetForm.purchasePrice * (assetForm.itpPercent / 100);
      const totalInvestment = assetForm.purchasePrice + itpAmount + assetForm.reformCost + assetForm.furnitureCost + assetForm.notaryExpenses;
      const projectedRoomsIncome = assetForm.roomPrices.reduce((acc, curr) => acc + curr.price, 0);
      
      let finalAddress = assetForm.streetName;
      if (assetForm.visibility === 'exact') finalAddress = `${assetForm.streetName}, ${assetForm.streetNumber}`;
      if (assetForm.visibility === 'hidden') finalAddress = 'Dirección Oculta'; 

      try {
          const opportunityPayload: Omit<Opportunity, 'id'> = {
              title: assetForm.title,
              address: finalAddress, 
              city: assetForm.city,
              description: assetForm.description,
              features: ['Oportunidad Reciente', `${assetForm.rooms} Habitaciones`, `${assetForm.sqm} m²`],
              areaBenefits: [],
              images: assetForm.images.length > 0 ? assetForm.images : ['https://placehold.co/600x400?text=No+Image'],
              videos: [],
              scenario: assetForm.scenario,
              visibility: assetForm.visibility,
              
              specs: {
                  rooms: assetForm.rooms,
                  bathrooms: assetForm.bathrooms,
                  sqm: assetForm.sqm,
                  floor: assetForm.floor,
                  hasElevator: assetForm.hasElevator
              },
              roomConfiguration: assetForm.roomPrices,
              financials: {
                  purchasePrice: assetForm.purchasePrice,
                  itpPercent: assetForm.itpPercent,
                  reformCost: assetForm.reformCost,
                  furnitureCost: assetForm.furnitureCost,
                  notaryAndTaxes: assetForm.notaryExpenses + itpAmount, 
                  totalInvestment: totalInvestment,
                  monthlyRentProjected: projectedRoomsIncome,
                  monthlyRentTraditional: assetForm.traditionalRent,
                  yearlyExpenses: assetForm.yearlyExpenses,
                  marketValue: totalInvestment * 1.15, 
                  appreciationRate: 3
              },
              status: 'available',
              tags: [assetForm.scenario === 'sale_living' ? 'Vivienda' : 'Inversión']
          };

          await addDoc(collection(db, "opportunities"), opportunityPayload);
          
          setIsAddingAsset(false);
          setAssetForm({ ...assetForm, title: '', address: '', images: [], roomPrices: [], purchasePrice: 0 });
          alert('Activo publicado correctamente.');
      } catch (error) {
          console.error("Error adding asset:", error);
          alert('Error al crear activo.');
      }
  };

  const getTagBadge = (tag: string) => {
      switch(tag) {
          case 'collaboration': return <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-indigo-100"><Handshake className="w-3 h-3"/> Colaboración</span>;
          case 'exclusive': return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-amber-100"><Crown className="w-3 h-3"/> Exclusiva</span>;
          default: return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-green-100"><Star className="w-3 h-3"/> Propia</span>;
      }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col mt-8">
      {/* Header CRM */}
      <div className="p-6 border-b border-gray-100 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h3 className="font-bold text-xl flex items-center gap-2">
                <Users className="w-6 h-6 text-rentia-gold" />
                CRM Compraventas
            </h3>
            <p className="text-slate-400 text-xs mt-1">Gestión centralizada de encargos y activos.</p>
        </div>
        
        <div className="flex bg-slate-800 rounded-lg p-1 w-full md:w-auto">
            <button onClick={() => setActiveTab('buyers')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'buyers' ? 'bg-rentia-gold text-rentia-black shadow' : 'text-slate-400 hover:text-white'}`}>Encargos Compra ({buyers.length})</button>
            <button onClick={() => setActiveTab('sellers')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'sellers' ? 'bg-rentia-gold text-rentia-black shadow' : 'text-slate-400 hover:text-white'}`}>Cartera Venta ({assets.length})</button>
        </div>
      </div>

      {/* --- TAB: COMPRADORES (ENCARGOS) --- */}
      {activeTab === 'buyers' && (
          <div className="p-4 md:p-6 bg-gray-50 min-h-[500px]">
              
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div>
                      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Briefcase className="w-5 h-5 text-rentia-blue" /> Bolsa de Demandas Activa</h4>
                      <p className="text-xs text-gray-500 mt-1">Los datos se sincronizan automáticamente con la sección pública de Colaboradores.</p>
                  </div>
                  <button onClick={() => setIsAddingBuyer(!isAddingBuyer)} className="bg-rentia-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-colors"><UserPlus className="w-4 h-4" /> Añadir Encargo</button>
              </div>
              
              {isAddingBuyer && (
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 mb-8 animate-in slide-in-from-top-4">
                      <div className="flex justify-between items-center border-b pb-2 mb-4">
                          <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">Nuevo Encargo de Compra</h5>
                          <button onClick={() => setIsAddingBuyer(false)}><X className="w-4 h-4 text-gray-400"/></button>
                      </div>
                      
                      <form onSubmit={handleAddBuyer}>
                          {/* Datos Privados */}
                          <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-100">
                              <span className="text-[10px] font-bold text-yellow-700 uppercase mb-2 block flex items-center gap-1"><EyeOff className="w-3 h-3"/> Datos Privados (Solo visibles en CRM)</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre Cliente</label>
                                      <input type="text" placeholder="Ej: Juan Pérez" className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none bg-white" value={newBuyer.name} onChange={e => setNewBuyer({...newBuyer, name: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-600 mb-1 block">Teléfono / Contacto</label>
                                      <input type="text" placeholder="Ej: 600 000 000" className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none bg-white" value={newBuyer.contact} onChange={e => setNewBuyer({...newBuyer, contact: e.target.value})} />
                                  </div>
                              </div>
                          </div>

                          {/* Datos Públicos */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div className="md:col-span-2">
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo de Inmueble (Público)</label>
                                  <input type="text" required placeholder="Ej: Piso en el centro para reformar" className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" value={newBuyer.type} onChange={e => setNewBuyer({...newBuyer, type: e.target.value})} />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">Origen / Tag</label>
                                  <select className="w-full p-2 border rounded text-sm bg-white" value={newBuyer.tag} onChange={e => setNewBuyer({...newBuyer, tag: e.target.value as any})}>
                                      <option value="own">Propia (Verde)</option>
                                      <option value="collaboration">Colaboración (Azul)</option>
                                      <option value="exclusive">Exclusiva (Dorado)</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">Presupuesto Máx (€)</label>
                                  <input type="number" placeholder="Ej: 150000 (0 para Flexible)" className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" value={newBuyer.budget} onChange={e => setNewBuyer({...newBuyer, budget: Number(e.target.value)})} />
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">Zona / Ubicación</label>
                                  <input type="text" required placeholder="Ej: El Carmen, Vistalegre" className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" value={newBuyer.location} onChange={e => setNewBuyer({...newBuyer, location: e.target.value})} />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">Specs (Habitaciones/Extras)</label>
                                  <input type="text" placeholder="Ej: Min 3 habs, con garaje..." className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" value={newBuyer.specs} onChange={e => setNewBuyer({...newBuyer, specs: e.target.value})} />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">Condición / Estado</label>
                                  <input type="text" placeholder="Ej: Buen estado / A reformar" className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" value={newBuyer.condition} onChange={e => setNewBuyer({...newBuyer, condition: e.target.value})} />
                              </div>
                          </div>

                          <div className="mb-4">
                              <label className="text-xs font-bold text-gray-500 mb-1 block">Notas Públicas</label>
                              <textarea placeholder="Detalles visibles en la web: 'Pago al contado', 'Urgente', etc..." className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none h-16 resize-none" value={newBuyer.notes} onChange={e => setNewBuyer({...newBuyer, notes: e.target.value})} />
                          </div>

                          <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setIsAddingBuyer(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded text-sm font-bold hover:bg-gray-200">Cancelar</button>
                              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-green-700 shadow-md flex items-center gap-2"><Save className="w-4 h-4"/> Guardar Encargo</button>
                          </div>
                      </form>
                  </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                                <tr>
                                    <th className="p-4 w-32">Ref / Origen</th>
                                    <th className="p-4 w-48 bg-yellow-50/50 text-yellow-700">Cliente (Privado)</th>
                                    <th className="p-4 w-64">Requerimiento</th>
                                    <th className="p-4 w-48">Zona</th>
                                    <th className="p-4 w-32 text-right">Presupuesto</th>
                                    <th className="p-4">Notas Públicas</th>
                                    <th className="p-4 w-16 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {buyers.map((req, idx) => (
                                    <tr key={req.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4 align-top">
                                            <div className="font-mono font-bold text-rentia-blue mb-1">{req.reference}</div>
                                            {getTagBadge(req.tag)}
                                        </td>
                                        <td className="p-4 align-top bg-yellow-50/30 border-r border-yellow-100/50">
                                            {req.name ? (
                                                <>
                                                    <div className="font-bold text-gray-900">{req.name}</div>
                                                    {req.contact && (
                                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <Phone className="w-3 h-3" /> {req.contact}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">Sin datos contacto</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-gray-800 mb-1">{req.type}</div>
                                            <div className="text-xs text-gray-500 flex items-start gap-1">
                                                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" /> 
                                                <span>{req.specs}</span>
                                            </div>
                                            {req.condition && <div className="text-xs text-gray-400 mt-1 italic">Est: {req.condition}</div>}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-gray-400" />
                                                {req.location}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-right font-mono font-bold text-gray-700">
                                            {req.budget > 0 ? req.budget.toLocaleString('es-ES') + ' €' : <span className="text-green-600">Flexible</span>}
                                        </td>
                                        <td className="p-4 align-top text-xs text-gray-600 max-w-xs">
                                            {req.notes ? (
                                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                                    {req.notes}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <button 
                                                onClick={() => handleDeleteBuyer(req.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar Encargo"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {buyers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">
                                            No hay encargos registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- TAB: VENDEDORES (ACTIVOS) --- */}
      {activeTab === 'sellers' && (
          <div className="p-4 md:p-6 bg-gray-50 min-h-[500px]">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-rentia-blue" /> Cartera de Activos
                  </h4>
                  <button onClick={() => setIsAddingAsset(!isAddingAsset)} className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors">
                      <Plus className="w-4 h-4" /> Registrar Nuevo Activo
                  </button>
              </div>

              {/* FORMULARIO EXTENDIDO DE ALTA DE ACTIVO */}
              {isAddingAsset && (
                  <form onSubmit={handleSaveAsset} className="bg-white rounded-xl shadow-xl border border-gray-200 mb-8 animate-in slide-in-from-top-4 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                          <h5 className="font-bold text-gray-800">Nuevo Inmueble</h5>
                          <div className="flex items-center gap-4">
                              <select 
                                value={assetForm.scenario} 
                                onChange={(e) => setAssetForm({...assetForm, scenario: e.target.value as OpportunityScenario})}
                                className="text-sm bg-white border border-gray-300 rounded px-2 py-1 font-bold text-rentia-blue focus:outline-none"
                              >
                                  <option value="rent_rooms">Inversión: Habitaciones</option>
                                  <option value="rent_traditional">Inversión: Tradicional</option>
                                  <option value="rent_both">Inversión: Mixto</option>
                                  <option value="sale_living">Venta: Cliente Final</option>
                              </select>
                          </div>
                      </div>

                      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          
                          {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
                          <div className="space-y-6">
                              
                              {/* Sección 1: Información Básica */}
                              <div className="space-y-4">
                                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1">Información General</h6>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Oportunidad *</label>
                                      <input type="text" required className="w-full p-2 border rounded-lg text-sm" placeholder="Ej: Piso muy rentable en El Carmen" value={assetForm.title} onChange={e => setAssetForm({...assetForm, title: e.target.value})} />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Inmueble</label>
                                          <select className="w-full p-2 border rounded-lg text-sm bg-white" value={assetForm.type} onChange={e => setAssetForm({...assetForm, type: e.target.value})}>
                                              <option>Piso</option>
                                              <option>Casa / Chalet</option>
                                              <option>Dúplex</option>
                                              <option>Edificio</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad Dirección</label>
                                          <div className="flex gap-2">
                                              <button type="button" onClick={() => setAssetForm({...assetForm, visibility: 'exact'})} className={`flex-1 p-2 rounded-lg border text-xs font-bold flex justify-center items-center gap-1 ${assetForm.visibility === 'exact' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                  <Eye className="w-3 h-3" /> Exacta
                                              </button>
                                              <button type="button" onClick={() => setAssetForm({...assetForm, visibility: 'street_only'})} className={`flex-1 p-2 rounded-lg border text-xs font-bold flex justify-center items-center gap-1 ${assetForm.visibility === 'street_only' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                  <MapPin className="w-3 h-3" /> Calle
                                              </button>
                                              <button type="button" onClick={() => setAssetForm({...assetForm, visibility: 'hidden'})} className={`flex-1 p-2 rounded-lg border text-xs font-bold flex justify-center items-center gap-1 ${assetForm.visibility === 'hidden' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                  <EyeOff className="w-3 h-3" /> Oculta
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* Sección 2: Localización y Características */}
                              <div className="space-y-4">
                                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1">Localización y Specs</h6>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="col-span-2">
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Calle / Vía</label>
                                          <input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="Av. Constitución" value={assetForm.streetName} onChange={e => setAssetForm({...assetForm, streetName: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                                          <input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="12, 3ºA" value={assetForm.streetNumber} onChange={e => setAssetForm({...assetForm, streetNumber: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                                          <input type="text" className="w-full p-2 border rounded-lg text-sm" value={assetForm.city} onChange={e => setAssetForm({...assetForm, city: e.target.value})} />
                                      </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Bed className="w-3 h-3"/> Habitaciones</label>
                                          <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.rooms} onChange={e => handleRoomCountChange(Number(e.target.value))} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Bath className="w-3 h-3"/> Baños</label>
                                          <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.bathrooms} onChange={e => setAssetForm({...assetForm, bathrooms: Number(e.target.value)})} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Layout className="w-3 h-3"/> m²</label>
                                          <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.sqm} onChange={e => setAssetForm({...assetForm, sqm: Number(e.target.value)})} />
                                      </div>
                                  </div>
                              </div>

                              {/* Sección 3: Descripción */}
                              <div>
                                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">Descripción</h6>
                                  <textarea className="w-full p-3 border rounded-lg text-sm h-32" placeholder="Describe la propiedad..." value={assetForm.description} onChange={e => setAssetForm({...assetForm, description: e.target.value})} />
                                  <div className="flex justify-end mt-2">
                                      <button type="button" className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded border border-purple-100 flex items-center gap-1 hover:bg-purple-100">
                                          ✨ Mejorar con IA (Próximamente)
                                      </button>
                                  </div>
                              </div>

                              {/* Sección 4: Fotos */}
                              <div>
                                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">Multimedia</h6>
                                  <div className="flex gap-2 mb-2">
                                      <input type="text" placeholder="https://..." className="flex-1 p-2 border rounded-lg text-sm" value={assetForm.newImageUrl} onChange={e => setAssetForm({...assetForm, newImageUrl: e.target.value})} />
                                      <button type="button" onClick={addImage} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg border border-gray-200"><Plus className="w-4 h-4" /></button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {assetForm.images.map((img, idx) => (
                                          <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border group">
                                              <img src={img} alt="preview" className="w-full h-full object-cover" />
                                              <button 
                                                type="button" 
                                                onClick={() => setAssetForm(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))}
                                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          {/* COLUMNA DERECHA: ECONÓMICO Y ESCENARIOS */}
                          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 h-fit space-y-6">
                              <h5 className="font-bold text-rentia-blue flex items-center gap-2 border-b border-blue-200 pb-2">
                                  <DollarSign className="w-5 h-5" /> Datos Económicos
                              </h5>

                              {/* Precio y Gastos Compra */}
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="col-span-2">
                                      <label className="block text-sm font-bold text-gray-700 mb-1">Precio de Venta (€)</label>
                                      <input type="number" required className="w-full p-2 border rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-rentia-blue" value={assetForm.purchasePrice} onChange={e => setAssetForm({...assetForm, purchasePrice: Number(e.target.value)})} />
                                  </div>
                                  
                                  <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">ITP (%)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.itpPercent} onChange={e => setAssetForm({...assetForm, itpPercent: Number(e.target.value)})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Notaría/Reg (€)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.notaryExpenses} onChange={e => setAssetForm({...assetForm, notaryExpenses: Number(e.target.value)})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Reforma (€)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.reformCost} onChange={e => setAssetForm({...assetForm, reformCost: Number(e.target.value)})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Mobiliario (€)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.furnitureCost} onChange={e => setAssetForm({...assetForm, furnitureCost: Number(e.target.value)})} />
                                  </div>
                                  <div className="col-span-2">
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Gastos Anuales (IBI+Comunidad)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.yearlyExpenses} onChange={e => setAssetForm({...assetForm, yearlyExpenses: Number(e.target.value)})} />
                                  </div>
                              </div>

                              {/* Configuración Escenario */}
                              <div className="border-t border-blue-200 pt-4">
                                  <h6 className="text-sm font-bold text-gray-800 mb-3">Configuración de Rentabilidad</h6>
                                  
                                  {assetForm.scenario === 'sale_living' && (
                                      <div className="p-4 bg-white rounded-lg text-center text-gray-500 text-sm italic">
                                          Modo Cliente Final activo. No se mostrarán datos de rentabilidad.
                                      </div>
                                  )}

                                  {(assetForm.scenario === 'rent_rooms' || assetForm.scenario === 'rent_both') && (
                                      <div className="mb-4">
                                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Alquiler por Habitaciones</p>
                                          <div className="space-y-2 bg-white p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                                              {assetForm.roomPrices.map((room, idx) => (
                                                  <div key={idx} className="flex gap-2 items-center">
                                                      <span className="text-xs font-medium w-24">{room.name}</span>
                                                      <input 
                                                          type="number" 
                                                          className="flex-1 p-1 border rounded text-sm text-right" 
                                                          value={room.price}
                                                          onChange={(e) => updateRoomPrice(idx, Number(e.target.value))}
                                                          placeholder="€"
                                                      />
                                                      <span className="text-xs text-gray-500">€/mes</span>
                                                  </div>
                                              ))}
                                              {assetForm.roomPrices.length === 0 && <p className="text-xs text-red-400">Define el nº de habitaciones en Specs.</p>}
                                          </div>
                                          <div className="text-right mt-2 text-sm font-bold text-rentia-blue">
                                              Total: {assetForm.roomPrices.reduce((a,b) => a + b.price, 0)} €/mes
                                          </div>
                                      </div>
                                  )}

                                  {(assetForm.scenario === 'rent_traditional' || assetForm.scenario === 'rent_both') && (
                                      <div className="mb-4">
                                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Alquiler Tradicional</p>
                                          <div className="flex gap-2 items-center">
                                              <input 
                                                  type="number" 
                                                  className="w-full p-2 border rounded text-sm" 
                                                  value={assetForm.traditionalRent}
                                                  onChange={(e) => setAssetForm({...assetForm, traditionalRent: Number(e.target.value)})}
                                                  placeholder="Renta Mensual Total"
                                              />
                                              <span className="text-sm font-bold text-gray-600">€/mes</span>
                                          </div>
                                      </div>
                                  )}
                              </div>

                              <div className="pt-4 flex justify-end gap-3">
                                  <button type="button" onClick={() => setIsAddingAsset(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold">Cancelar</button>
                                  <button type="submit" className="bg-rentia-blue text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
                                      <Save className="w-4 h-4" /> Publicar Activo
                                  </button>
                              </div>
                          </div>
                      </div>
                  </form>
              )}

              {/* LISTA DE ACTIVOS EXISTENTE */}
              <div className="space-y-4">
                  {assets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-xl border border-gray-200 shadow-sm border-dashed">
                         <div className="bg-gray-100 p-6 rounded-full mb-6"><Briefcase className="w-12 h-12 text-gray-400" /></div>
                         <h2 className="text-2xl font-bold text-rentia-black font-display mb-2">No hay activos en venta</h2>
                      </div>
                  ) : (
                      assets.map(opp => (
                          <div key={opp.id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center hover:shadow-md transition-all">
                              <div>
                                  <h4 className="font-bold text-gray-800">{opp.title}</h4>
                                  <p className="text-sm text-gray-500">{opp.address} ({opp.city})</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-lg">{opp.financials.purchasePrice.toLocaleString()} €</p>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${opp.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {opp.status}
                                  </span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}
    </div>
  );
};