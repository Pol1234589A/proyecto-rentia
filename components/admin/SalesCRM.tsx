
import React, { useState, useEffect, useMemo } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { brokerRequests as staticRequests, BrokerRequest } from '../../data/brokerRequests';
import { opportunities as staticOpportunities } from '../../data';
import { Opportunity, OpportunityScenario, Visibility } from '../../types';
import { Briefcase, Building2, UserPlus, Search, Filter, TrendingUp, MapPin, DollarSign, Save, ArrowRight, Users, Eye, EyeOff, Plus, Image as ImageIcon, Trash2, Home, Bed, Layout, Bath, Phone, FileText, Tag, AlertCircle, Handshake, Star, Crown, X, UploadCloud, RefreshCw, Pencil, Sparkles, Wand2, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { cleanImageWithAI } from '../../utils/aiImageCleaner';
import { compressImage } from '../../utils/imageOptimizer';

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
  
  const [newBuyer, setNewBuyer] = useState({
    name: '',       
    contact: '',    
    type: '',       
    specs: '',      
    condition: '',  
    location: '',   
    budget: 0,      
    notes: '',      
    tag: 'own' as const 
  });

  // --- STATE SELLERS (ASSETS) ---
  const [assets, setAssets] = useState<Opportunity[]>(staticOpportunities);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estado para limpieza de imagen individual
  const [cleaningImageIndex, setCleaningImageIndex] = useState<number | null>(null);
  const [manualImageUrl, setManualImageUrl] = useState('');

  // --- ASSET FORM STATE ---
  const initialAssetFormState = {
    title: '',
    type: 'Piso',
    scenario: 'rent_rooms' as OpportunityScenario,
    visibility: 'exact' as Visibility,
    address: '',
    streetName: '', 
    streetNumber: '', 
    city: 'Murcia',
    floor: '',
    hasElevator: false,
    rooms: 0,
    bathrooms: 0,
    sqm: 0,
    description: '',
    images: [] as string[],
    purchasePrice: 0,
    agencyFees: 3000, // Honorarios base
    itpPercent: 8, 
    reformCost: 0,
    furnitureCost: 0,
    notaryExpenses: 1500, 
    yearlyExpenses: 0, 
    roomPrices: [] as {name: string, price: number}[],
    traditionalRent: 0,
  };

  const [assetForm, setAssetForm] = useState(initialAssetFormState);

  // --- PROTECCIÓN CAMBIOS NO GUARDADOS ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Wrapper para actualizar form y marcar como sucio
  const updateForm = (updates: Partial<typeof initialAssetFormState>) => {
      setAssetForm(prev => ({ ...prev, ...updates }));
      setHasUnsavedChanges(true);
  };

  // --- LOAD DATA ---
  useEffect(() => {
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
        setBuyers([...firestoreBuyers, ...staticRequests]);
    });

    const unsubscribeAssets = onSnapshot(collection(db, "opportunities"), (snapshot) => {
        const loadedAssets: Opportunity[] = [];
        snapshot.forEach((doc) => {
            loadedAssets.push({ ...doc.data(), id: doc.id } as Opportunity);
        });
        
        if (loadedAssets.length > 0) {
            setAssets(loadedAssets);
        } else {
            console.log("No assets in DB, using static.");
            setAssets(staticOpportunities);
        }
    }, (error) => {
        console.log("No opportunities found or permission denied, using static.", error);
        setAssets(staticOpportunities);
    });

    return () => { unsubscribeBuyers(); unsubscribeAssets(); };
  }, []);

  // --- HANDLER MAGIC CLEANING (EXISTING IMAGES) ---
  const handleCleanExistingImage = async (url: string, index: number, e: React.MouseEvent) => {
      e.stopPropagation(); 
      e.preventDefault();
      
      if (!process.env.API_KEY) {
          alert("La limpieza automática con IA requiere una API Key configurada. Por favor, configura tu entorno.");
          return;
      }
      
      setCleaningImageIndex(index);
      try {
          // 1. Usar wsrv.nl como proxy de imágenes. 
          const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
          
          let blob: Blob;
          try {
              const response = await fetch(proxyUrl);
              if (!response.ok) throw new Error("Proxy error");
              blob = await response.blob();
          } catch (fetchError) {
              const directResponse = await fetch(url, { mode: 'cors' });
              if (!directResponse.ok) throw new Error("Direct fetch error");
              blob = await directResponse.blob();
          }

          // 2. Procesar con Gemini
          const cleanBlob = await cleanImageWithAI(blob, process.env.API_KEY);
          
          // 3. Comprimir y SUBIR A NUESTRO SERVIDOR
          const fileName = `cleaned_${Date.now()}_${index}.jpg`;
          const cleanFile = new File([cleanBlob], fileName, { type: 'image/jpeg' });
          const compressedBlob = await compressImage(cleanFile);
          
          const storageRef = ref(storage, `opportunities/${fileName}`);
          const snapshot = await uploadBytes(storageRef, compressedBlob);
          const newUrl = await getDownloadURL(snapshot.ref);

          // 4. Actualizar estado local
          const newImages = [...assetForm.images];
          newImages[index] = newUrl;
          setAssetForm(prev => ({ ...prev, images: newImages }));
          setHasUnsavedChanges(true); // Marcar como modificado

      } catch (error) {
          console.error("Error cleaning image:", error);
          alert("No se pudo procesar esta imagen automáticamente.");
      } finally {
          setCleaningImageIndex(null);
      }
  };

  // --- HANDLERS BUYERS ---
  const handleAddBuyer = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const refCode = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
          await addDoc(collection(db, "buyer_requests"), {
              ...newBuyer,
              reference: refCode,
              createdAt: serverTimestamp(),
          });
          setIsAddingBuyer(false);
          setNewBuyer({ name: '', contact: '', type: '', specs: '', location: '', condition: '', budget: 0, notes: '', tag: 'own' });
      } catch (error) { console.error(error); alert('Error al guardar.'); }
  };

  const handleDeleteBuyer = async (id: string) => {
      if (!window.confirm("¿Seguro que quieres eliminar este encargo? Desaparecerá también de la web pública.")) return;
      try {
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
  const handleAddImage = (url: string) => {
      setAssetForm(prev => ({...prev, images: [...prev.images, url]}));
      setHasUnsavedChanges(true);
  };

  const handleRoomCountChange = (count: number) => {
      const currentPrices = [...assetForm.roomPrices];
      const newPrices = [];
      for(let i=0; i<count; i++) {
          if(i < currentPrices.length) newPrices.push(currentPrices[i]);
          else newPrices.push({ name: `Habitación ${i+1}`, price: 0 });
      }
      setAssetForm(prev => ({ ...prev, rooms: count, roomPrices: newPrices }));
      setHasUnsavedChanges(true);
  };

  const updateRoomPrice = (index: number, price: number) => {
      const newPrices = [...assetForm.roomPrices];
      newPrices[index].price = price;
      setAssetForm(prev => ({ ...prev, roomPrices: newPrices }));
      setHasUnsavedChanges(true);
  };

  // --- PREPARAR EDICIÓN ---
  const handleEditAsset = (opp: Opportunity) => {
      if (hasUnsavedChanges) {
          if (!window.confirm("Tienes cambios sin guardar. ¿Deseas descartarlos y editar este activo?")) return;
      }

      // Calcular gastos de notaría aproximados inversos
      const calcItpAmount = opp.financials.purchasePrice * ((opp.financials.itpPercent || 8) / 100);
      const calcNotary = Math.max(0, opp.financials.notaryAndTaxes - calcItpAmount);
      
      // Calculate Default Agency Fees if undefined
      const defaultFees = opp.financials.purchasePrice > 100000 ? opp.financials.purchasePrice * 0.03 : 3000;
      const fees = opp.financials.agencyFees !== undefined ? opp.financials.agencyFees : defaultFees;

      setAssetForm({
          title: opp.title,
          type: 'Piso', 
          scenario: opp.scenario,
          visibility: opp.visibility,
          address: opp.address, 
          streetName: opp.address, 
          streetNumber: '', 
          city: opp.city,
          floor: opp.specs.floor,
          hasElevator: opp.specs.hasElevator,
          rooms: opp.specs.rooms,
          bathrooms: opp.specs.bathrooms,
          sqm: opp.specs.sqm,
          description: opp.description,
          images: opp.images,
          purchasePrice: opp.financials.purchasePrice,
          agencyFees: fees,
          itpPercent: opp.financials.itpPercent || 8,
          reformCost: opp.financials.reformCost,
          furnitureCost: opp.financials.furnitureCost,
          notaryExpenses: Math.round(calcNotary), 
          yearlyExpenses: opp.financials.yearlyExpenses, 
          roomPrices: opp.roomConfiguration || [],
          traditionalRent: opp.financials.monthlyRentTraditional,
      });
      setEditingAssetId(opp.id);
      setIsAddingAsset(true);
      setHasUnsavedChanges(false); // Reset al cargar
      
      setTimeout(() => {
          document.getElementById('asset-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const handleCancelAsset = () => {
      if (hasUnsavedChanges) {
          if (!window.confirm("¿Seguro que quieres cancelar? Perderás los datos no guardados.")) return;
      }
      setIsAddingAsset(false);
      setEditingAssetId(null);
      setAssetForm(initialAssetFormState);
      setHasUnsavedChanges(false);
  };

  // --- HANDLER SAVE (CREATE / UPDATE) ASSET ---
  const handleSaveAsset = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const itpAmount = assetForm.purchasePrice * (assetForm.itpPercent / 100);
      const totalInvestment = assetForm.purchasePrice + itpAmount + assetForm.reformCost + assetForm.furnitureCost + assetForm.notaryExpenses;
      const projectedRoomsIncome = assetForm.roomPrices.reduce((acc, curr) => acc + curr.price, 0);
      
      let finalAddress = assetForm.streetName;
      if (assetForm.streetNumber) finalAddress = `${assetForm.streetName}, ${assetForm.streetNumber}`;
      
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
                  agencyFees: assetForm.agencyFees, // Save agency fees
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

          if (editingAssetId) {
              await updateDoc(doc(db, "opportunities", editingAssetId), opportunityPayload as any);
              alert('Activo actualizado correctamente.');
          } else {
              await addDoc(collection(db, "opportunities"), opportunityPayload);
              alert('Activo publicado correctamente.');
          }
          
          setHasUnsavedChanges(false); // IMPORTANTE: Resetear flag
          setIsAddingAsset(false);
          setEditingAssetId(null);
          setAssetForm(initialAssetFormState);
          
      } catch (error) {
          console.error("Error saving asset:", error);
          alert('Error al guardar activo.');
      }
  };

  const handleSyncStaticData = async () => {
      if (!window.confirm("¿Importar propiedades del archivo 'data.ts' a la base de datos? Esto creará/actualizará las fichas.")) return;
      setIsSyncing(true);
      try {
          const batch = writeBatch(db);
          staticOpportunities.forEach(opp => {
              const docRef = doc(db, "opportunities", opp.id);
              batch.set(docRef, opp, { merge: true });
          });
          await batch.commit();
          alert(`Sincronización completada. ${staticOpportunities.length} oportunidades procesadas.`);
      } catch (error) {
          console.error("Error syncing:", error);
          alert("Error al sincronizar datos.");
      } finally {
          setIsSyncing(false);
      }
  };

  const handleDeleteAsset = async (id: string) => {
      if (!window.confirm("¿Eliminar este activo permanentemente?")) return;
      try {
          await deleteDoc(doc(db, "opportunities", id));
      } catch (e) {
          alert("Error al eliminar");
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
              {/* ... (Contenido de compradores se mantiene igual) ... */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div>
                      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Briefcase className="w-5 h-5 text-rentia-blue" /> Bolsa de Demandas Activa</h4>
                      <p className="text-xs text-gray-500 mt-1">Los datos se sincronizan automáticamente con la sección pública de Colaboradores.</p>
                  </div>
                  <button onClick={() => setIsAddingBuyer(!isAddingBuyer)} className="bg-rentia-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-colors"><UserPlus className="w-4 h-4" /> Añadir Encargo</button>
              </div>
              
              {isAddingBuyer && (
                  // ... (Formulario de compradores se mantiene igual) ...
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 mb-8 animate-in slide-in-from-top-4">
                      {/* ... Campos del formulario ... */}
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
                  {/* ... Tabla de compradores se mantiene igual ... */}
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
                  <div className="flex gap-2">
                      <button 
                        onClick={handleSyncStaticData} 
                        disabled={isSyncing}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors border border-gray-200"
                        title="Subir propiedades del código a la base de datos"
                      >
                          <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                          {isSyncing ? 'Sincronizando...' : 'Sincronizar Stock (data.ts)'}
                      </button>
                      <button 
                        onClick={() => { setIsAddingAsset(!isAddingAsset); setEditingAssetId(null); setAssetForm(initialAssetFormState); setHasUnsavedChanges(false); }} 
                        className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                      >
                          <Plus className="w-4 h-4" /> Registrar Nuevo Activo
                      </button>
                  </div>
              </div>

              {/* FORMULARIO EXTENDIDO DE ALTA/EDICIÓN DE ACTIVO */}
              {isAddingAsset && (
                  <form id="asset-form" onSubmit={handleSaveAsset} className="bg-white rounded-xl shadow-xl border border-gray-200 mb-8 animate-in slide-in-from-top-4 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
                          <h5 className="font-bold text-gray-800 flex items-center gap-2">
                              {editingAssetId ? <Pencil className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                              {editingAssetId ? 'Editar Inmueble' : 'Nuevo Inmueble'}
                          </h5>
                          {hasUnsavedChanges && (
                              <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Cambios pendientes
                              </span>
                          )}
                          <button type="button" onClick={handleCancelAsset}><X className="w-4 h-4 text-gray-400"/></button>
                      </div>

                      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          
                          {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
                          <div className="space-y-6">
                              <div className="space-y-4">
                                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1">Información General</h6>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Oportunidad *</label>
                                      <input type="text" required className="w-full p-2 border rounded-lg text-sm" placeholder="Ej: Piso muy rentable en El Carmen" value={assetForm.title} onChange={e => updateForm({title: e.target.value})} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="col-span-2">
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Calle / Vía (Dirección Completa)</label>
                                          <input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="Av. Constitución" value={assetForm.streetName} onChange={e => updateForm({streetName: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Número (Opcional)</label>
                                          <input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="12, 3ºA" value={assetForm.streetNumber} onChange={e => updateForm({streetNumber: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                                          <input type="text" className="w-full p-2 border rounded-lg text-sm" value={assetForm.city} onChange={e => updateForm({city: e.target.value})} />
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Bed className="w-3 h-3"/> Habitaciones</label>
                                          <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.rooms} onChange={e => handleRoomCountChange(Number(e.target.value))} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Bath className="w-3 h-3"/> Baños</label>
                                          <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.bathrooms} onChange={e => updateForm({bathrooms: Number(e.target.value)})} />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Layout className="w-3 h-3"/> m²</label>
                                          <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.sqm} onChange={e => updateForm({sqm: Number(e.target.value)})} />
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">Descripción</h6>
                                  <textarea className="w-full p-3 border rounded-lg text-sm h-32" placeholder="Describe la propiedad..." value={assetForm.description} onChange={e => updateForm({description: e.target.value})} />
                              </div>

                              {/* Sección 4: Fotos CON UPLOADER MEJORADO */}
                              <div>
                                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3 flex items-center gap-2">
                                      Multimedia <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"><Sparkles className="w-2 h-2"/> IA Auto-Limpieza</span>
                                  </h6>
                                  
                                  {/* Botón de carga */}
                                  <div className="mb-4 space-y-3">
                                      <ImageUploader 
                                          folder="opportunities" 
                                          onUploadComplete={handleAddImage}
                                          label="Subir Foto (Elimina logos automáticamente)"
                                      />
                                      
                                      {/* Opción Manual URL */}
                                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                          <div className="p-1.5 bg-white rounded border border-gray-200 text-gray-400">
                                              <LinkIcon className="w-4 h-4" />
                                          </div>
                                          <input 
                                              type="text" 
                                              placeholder="Pegar URL directa (ej: Archive.org / Drive...)" 
                                              className="flex-1 bg-transparent text-xs outline-none text-gray-600 placeholder:text-gray-400"
                                              value={manualImageUrl}
                                              onChange={(e) => setManualImageUrl(e.target.value)}
                                              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); if(manualImageUrl) { handleAddImage(manualImageUrl); setManualImageUrl(''); } } }}
                                          />
                                          <button 
                                              type="button"
                                              onClick={() => { if(manualImageUrl) { handleAddImage(manualImageUrl); setManualImageUrl(''); } }}
                                              className="text-[10px] font-bold bg-white border border-gray-200 px-3 py-1 rounded hover:bg-gray-100 hover:text-rentia-blue transition-colors uppercase"
                                          >
                                              Añadir
                                          </button>
                                      </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                      {assetForm.images.map((img, idx) => (
                                          <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border group">
                                              <img src={img} alt="preview" className="w-full h-full object-cover" />
                                              {/* Overlay acciones */}
                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                                                  {/* Botón limpieza manual IA */}
                                                  <button
                                                    type="button"
                                                    onClick={(e) => handleCleanExistingImage(img, idx, e)}
                                                    className="p-1.5 bg-white/20 hover:bg-purple-600 rounded-full text-white backdrop-blur-sm transition-colors border border-white/30"
                                                    title="Limpiar logos en esta imagen"
                                                  >
                                                      {cleaningImageIndex === idx ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
                                                  </button>
                                                  
                                                  <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setAssetForm(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}));
                                                        setHasUnsavedChanges(true);
                                                    }}
                                                    className="p-1.5 bg-white/20 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-colors border border-white/30"
                                                    title="Eliminar"
                                                  >
                                                      <Trash2 className="w-4 h-4" />
                                                  </button>
                                              </div>
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
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="col-span-2">
                                      <label className="block text-sm font-bold text-gray-700 mb-1">Precio de Venta (€)</label>
                                      <input type="number" required className="w-full p-2 border rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-rentia-blue" value={assetForm.purchasePrice} onChange={e => updateForm({purchasePrice: Number(e.target.value)})} />
                                  </div>
                                  <div className="col-span-2">
                                      <label className="block text-xs font-bold text-gray-600 mb-1">Honorarios Agencia (€)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm bg-white" value={assetForm.agencyFees} onChange={e => updateForm({agencyFees: Number(e.target.value)})} />
                                      <p className="text-[10px] text-gray-400 mt-1">*Base imponible. En la web se sumará IVA.</p>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">ITP (%)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.itpPercent} onChange={e => updateForm({itpPercent: Number(e.target.value)})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Notaría/Reg (€)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.notaryExpenses} onChange={e => updateForm({notaryExpenses: Number(e.target.value)})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Reforma (€)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.reformCost} onChange={e => updateForm({reformCost: Number(e.target.value)})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Mobiliario (€)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.furnitureCost} onChange={e => updateForm({furnitureCost: Number(e.target.value)})} />
                                  </div>
                                  <div className="col-span-2">
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Gastos Anuales (IBI+Comunidad)</label>
                                      <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.yearlyExpenses} onChange={e => updateForm({yearlyExpenses: Number(e.target.value)})} />
                                  </div>
                              </div>

                              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-blue-50 py-4 -mb-6 border-t border-blue-100">
                                  <button type="button" onClick={handleCancelAsset} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold">Cancelar</button>
                                  <button 
                                    type="submit" 
                                    className={`px-6 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-all ${
                                        hasUnsavedChanges 
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' 
                                        : 'bg-rentia-blue hover:bg-blue-700 text-white'
                                    }`}
                                  >
                                      <Save className="w-4 h-4" /> 
                                      {hasUnsavedChanges ? 'Guardar Cambios' : (editingAssetId ? 'Actualizado' : 'Publicar Activo')}
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
                         <button onClick={handleSyncStaticData} className="mt-4 text-rentia-blue hover:underline font-bold text-sm">Cargar datos de prueba</button>
                      </div>
                  ) : (
                      assets.map(opp => (
                          <div key={opp.id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center hover:shadow-md transition-all">
                              <div>
                                  <h4 className="font-bold text-gray-800">{opp.title}</h4>
                                  <p className="text-sm text-gray-500">{opp.address} ({opp.city})</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="text-right mr-4">
                                      <p className="font-bold text-lg">{opp.financials.purchasePrice.toLocaleString()} €</p>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${opp.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {opp.status}
                                      </span>
                                  </div>
                                  <button 
                                    onClick={() => handleEditAsset(opp)}
                                    className="p-2 text-gray-400 hover:text-rentia-blue hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                    title="Editar activo"
                                  >
                                      <Pencil className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteAsset(opp.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                    title="Eliminar activo"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
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
