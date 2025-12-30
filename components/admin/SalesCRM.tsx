
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom'; 
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, deleteDoc, doc, writeBatch, updateDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { brokerRequests as staticRequests, BrokerRequest } from '../../data/brokerRequests';
import { opportunities as staticOpportunities } from '../../data';
import { Opportunity, OpportunityScenario, Visibility } from '../../types';
import { Briefcase, Building2, UserPlus, Search, Filter, TrendingUp, MapPin, DollarSign, Save, ArrowRight, Users, Eye, EyeOff, Plus, Image as ImageIcon, Trash2, Home, Bed, Layout, Bath, Phone, FileText, Tag, AlertCircle, Handshake, Star, Crown, X, UploadCloud, RefreshCw, Pencil, Sparkles, Wand2, Loader2, Link as LinkIcon, AlertTriangle, MonitorPlay, Video, MessageSquare, Mail, Calendar, Bold, Italic, ImagePlus, Type } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { compressImage } from '../../utils/imageOptimizer';
import { GoogleGenAI } from "@google/genai";

interface ExtendedBrokerRequest extends BrokerRequest {
    name?: string;
    contact?: string;
}

interface Lead {
    id: string;
    opportunityId: string;
    opportunityTitle: string;
    userData: {
        name: string;
        email: string;
        phone: string;
    };
    createdAt: any;
    status: string;
}

export const SalesCRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'buyers' | 'sellers' | 'leads'>('buyers');
  
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
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // --- STATE LEADS ---
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // --- ASSET FORM STATE (AMPLIADO) ---
  const initialAssetFormState = {
    title: '',
    type: 'Piso',
    scenario: 'rent_rooms' as OpportunityScenario,
    visibility: 'exact' as Visibility,
    status: 'available' as 'available' | 'reserved' | 'sold',
    active: true, // Default to active
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
    // Campos extendidos para edición completa
    features: '', // String separado por saltos de línea
    areaBenefits: '', // String separado por saltos de línea
    tags: '', // String separado por comas
    driveFolder: '',
    videoUrl: '', // String simple (primer video)
    
    images: [] as string[],
    
    // Financials
    purchasePrice: 0,
    agencyFees: 3000, 
    itpPercent: 8, 
    reformCost: 0,
    furnitureCost: 0,
    notaryExpenses: 1500, 
    yearlyExpenses: 0, 
    marketValue: 0,
    appreciationRate: 3,
    
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

  // Helper para insertar tags HTML en la descripción
  const insertHtmlTag = (tagStart: string, tagEnd: string = '') => {
      const textarea = document.getElementById('description-editor') as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = assetForm.description;
      
      const before = text.substring(0, start);
      const selection = text.substring(start, end);
      const after = text.substring(end);

      let newText = '';
      
      if (tagStart === 'IMG') {
          const url = prompt("Introduce la URL de la imagen:");
          if (url) {
              const imgTag = `<br><img src="${url}" class="w-full rounded-lg my-4 shadow-sm" loading="lazy" /><br>`;
              newText = before + imgTag + after;
          } else {
              return;
          }
      } else {
          newText = before + tagStart + selection + tagEnd + after;
      }

      updateForm({ description: newText });
      
      // Restaurar foco (opcional, básico)
      setTimeout(() => {
          textarea.focus();
      }, 50);
  };

  // --- GENERACIÓN IA ---
  const handleGenerateDescription = async () => {
    if (!process.env.API_KEY) {
        alert("API Key no configurada.");
        return;
    }

    setIsGeneratingAi(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Actúa como un experto copywriter inmobiliario especializado en inversores.
            Escribe una descripción atractiva y profesional para una propiedad en venta con los siguientes datos:
            
            - Título Provisional: ${assetForm.title}
            - Ubicación: ${assetForm.city} (${assetForm.streetName})
            - Tipo: ${assetForm.type}
            - Habitaciones: ${assetForm.rooms}
            - Baños: ${assetForm.bathrooms}
            - Metros: ${assetForm.sqm} m²
            - Planta: ${assetForm.floor} (Ascensor: ${assetForm.hasElevator ? 'Sí' : 'No'})
            - Precio Venta: ${assetForm.purchasePrice}€
            - Enfoque/Escenario: ${assetForm.scenario === 'rent_rooms' ? 'Inversión para alquiler por habitaciones (Coliving)' : 'Vivienda tradicional'}
            
            Estructura la respuesta en HTML básico (usa <h3> para títulos, <p> para párrafos, <ul><li> para listas).
            Destaca la rentabilidad y el potencial. No inventes datos, usa un tono profesional y persuasivo.
            Idioma: Español.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        if (response.text) {
            updateForm({ description: response.text });
        }
    } catch (e: any) {
        console.error("Error generating description", e);
        alert("Error al generar con IA. Inténtalo de nuevo.");
    } finally {
        setIsGeneratingAi(false);
    }
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
        const firestoreAssets: Opportunity[] = [];
        const allDbIds = new Set<string>(); // Track all IDs in DB (even deleted ones)

        snapshot.forEach((doc) => {
            const data = doc.data();
            allDbIds.add(doc.id);

            // Filter out soft-deleted items AND corrupt data
            if ((data as any).deleted) return;
            if (!data.financials || !data.title) return; // SAFETY CHECK: Prevent crash

            firestoreAssets.push({ ...data, id: doc.id } as Opportunity);
        });
        
        // Fusión: Usar datos de Firestore + datos estáticos que NO estén ya en Firestore
        // Importante: Si está en DB (aunque sea deleted), no lo cogemos del estático.
        const missingStatics = staticOpportunities.filter(a => !allDbIds.has(a.id));
        const combinedAssets = [...firestoreAssets, ...missingStatics];
        
        setAssets(combinedAssets);

    }, (error) => {
        console.log("Error loading assets", error);
        setAssets(staticOpportunities);
    });

    // Load Leads
    const qLeads = query(collection(db, "opportunity_leads"), orderBy("createdAt", "desc"));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
        const leadsData: Lead[] = [];
        snapshot.forEach((doc) => {
            leadsData.push({ ...doc.data(), id: doc.id } as Lead);
        });
        setLeads(leadsData);
    });

    return () => { unsubscribeBuyers(); unsubscribeAssets(); unsubscribeLeads(); };
  }, []);

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
      if (!window.confirm("¿Seguro que quieres eliminar este encargo?")) return;
      try {
          await deleteDoc(doc(db, "buyer_requests", id));
      } catch (error) {
          console.error(error);
      }
  };

  const handleDeleteLead = async (id: string) => {
      if (!window.confirm("¿Borrar este lead?")) return;
      try {
          await deleteDoc(doc(db, "opportunity_leads", id));
      } catch (error) {
          console.error(error);
      }
  };

  const handleAddImage = (url: string) => {
      setAssetForm(prev => ({...prev, images: [...prev.images, url]}));
      setHasUnsavedChanges(true);
  };
  
  const handleAddVideo = (url: string) => {
      setAssetForm(prev => ({...prev, videoUrl: url}));
      setHasUnsavedChanges(true);
  };

  const handleEditAsset = (opp: Opportunity) => {
      if (hasUnsavedChanges) {
          if (!window.confirm("Tienes cambios sin guardar. ¿Deseas descartarlos?")) return;
      }
      
      // Safety check for incomplete data
      if (!opp.financials || !opp.specs) {
          alert("Error: Los datos de este activo están incompletos o corruptos.");
          return;
      }
      
      const calcItpAmount = opp.financials.purchasePrice * ((opp.financials.itpPercent || 8) / 100);
      const calcNotary = Math.max(0, opp.financials.notaryAndTaxes - calcItpAmount);
      const fees = opp.financials.agencyFees !== undefined ? opp.financials.agencyFees : 3000;

      setAssetForm({
          title: opp.title,
          type: 'Piso', 
          scenario: opp.scenario,
          visibility: opp.visibility,
          status: opp.status,
          active: opp.active !== false, // Default true if undefined
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
          // Extended fields mapping
          features: opp.features.join('\n'),
          areaBenefits: opp.areaBenefits.join('\n'),
          tags: opp.tags.join(', '),
          driveFolder: opp.driveFolder || '',
          videoUrl: opp.videos && opp.videos.length > 0 ? opp.videos[0] : '',
          
          images: opp.images,
          purchasePrice: opp.financials.purchasePrice,
          agencyFees: fees,
          itpPercent: opp.financials.itpPercent || 8,
          reformCost: opp.financials.reformCost,
          furnitureCost: opp.financials.furnitureCost,
          notaryExpenses: Math.round(calcNotary), 
          yearlyExpenses: opp.financials.yearlyExpenses, 
          marketValue: opp.financials.marketValue,
          appreciationRate: opp.financials.appreciationRate,
          
          roomPrices: opp.roomConfiguration || [],
          traditionalRent: opp.financials.monthlyRentTraditional,
      });
      setEditingAssetId(opp.id);
      setIsAddingAsset(true);
      setHasUnsavedChanges(false);
  };

  const handleCancelAsset = () => {
      if (hasUnsavedChanges) {
          if (!window.confirm("¿Seguro que quieres cancelar? Perderás los datos.")) return;
      }
      setIsAddingAsset(false);
      setEditingAssetId(null);
      setAssetForm(initialAssetFormState);
      setHasUnsavedChanges(false);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const itpAmount = assetForm.purchasePrice * (assetForm.itpPercent / 100);
      // Recalculamos totalInvestment si no se ha metido a mano, pero respetamos lógica
      const totalInvestment = assetForm.purchasePrice + itpAmount + assetForm.reformCost + assetForm.furnitureCost + assetForm.notaryExpenses;
      const projectedRoomsIncome = assetForm.roomPrices.reduce((acc, curr) => acc + curr.price, 0);
      
      // Split strings back to arrays
      const featuresArray = assetForm.features.split('\n').map(s => s.trim()).filter(Boolean);
      const benefitsArray = assetForm.areaBenefits.split('\n').map(s => s.trim()).filter(Boolean);
      const tagsArray = assetForm.tags.split(',').map(s => s.trim()).filter(Boolean);
      const videosArray = assetForm.videoUrl ? [assetForm.videoUrl] : [];

      // Si no hay features manuales, ponemos default
      if (featuresArray.length === 0) {
          featuresArray.push('Oportunidad Reciente', `${assetForm.rooms} Habitaciones`, `${assetForm.sqm} m²`);
      }

      // Si no hay tags manuales, ponemos default
      if (tagsArray.length === 0) {
          tagsArray.push(assetForm.scenario === 'sale_living' ? 'Vivienda' : 'Inversión');
      }
      
      let finalAddress = assetForm.streetName;
      if (assetForm.streetNumber) finalAddress = `${assetForm.streetName}, ${assetForm.streetNumber}`;
      
      try {
          const opportunityPayload: Omit<Opportunity, 'id'> = {
              title: assetForm.title,
              address: finalAddress, 
              city: assetForm.city,
              description: assetForm.description,
              features: featuresArray,
              areaBenefits: benefitsArray,
              images: assetForm.images.length > 0 ? assetForm.images : ['https://placehold.co/600x400?text=No+Image'],
              videos: videosArray,
              driveFolder: assetForm.driveFolder,
              scenario: assetForm.scenario,
              visibility: assetForm.visibility,
              active: assetForm.active, // Save active state
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
                  agencyFees: assetForm.agencyFees, 
                  itpPercent: assetForm.itpPercent,
                  reformCost: assetForm.reformCost,
                  furnitureCost: assetForm.furnitureCost,
                  notaryAndTaxes: assetForm.notaryExpenses + itpAmount, 
                  totalInvestment: totalInvestment,
                  monthlyRentProjected: projectedRoomsIncome,
                  monthlyRentTraditional: assetForm.traditionalRent,
                  yearlyExpenses: assetForm.yearlyExpenses,
                  marketValue: assetForm.marketValue || (totalInvestment * 1.15), 
                  appreciationRate: assetForm.appreciationRate
              },
              status: assetForm.status,
              tags: tagsArray
          };

          if (editingAssetId) {
              // Uso setDoc con merge=true para crear el documento si no existe (caso de activos estáticos)
              await setDoc(doc(db, "opportunities", editingAssetId), opportunityPayload, { merge: true });
              alert('Activo actualizado correctamente.');
          } else {
              await addDoc(collection(db, "opportunities"), opportunityPayload);
              alert('Activo publicado correctamente.');
          }
          
          setHasUnsavedChanges(false);
          setIsAddingAsset(false);
          setEditingAssetId(null);
          setAssetForm(initialAssetFormState);
          
      } catch (error: any) {
          console.error(error);
          alert(`Error: ${error.message}`);
      }
  };
  
  const handleToggleActive = async (id: string, currentStatus: boolean | undefined) => {
      // Default to true if undefined
      const newStatus = !(currentStatus ?? true);
      try {
          await setDoc(doc(db, "opportunities", id), { active: newStatus }, { merge: true });
      } catch (error) {
          console.error("Error toggling active status", error);
      }
  };

  const handleDeleteAsset = async (id: string) => {
       if (!window.confirm("¿Estás seguro de eliminar este activo?")) return;
       try {
           // Use soft-delete to properly hide even static items (by creating a 'deleted' record in DB)
           await setDoc(doc(db, "opportunities", id), { deleted: true }, { merge: true });
       } catch (error) {
           console.error(error);
       }
  };

  const getTagBadge = (tag: string) => { /* logic kept simple */ };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col mt-0 md:mt-8">
      {/* Header CRM */}
      <div className="p-6 border-b border-gray-100 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-xl">
        <div>
            <h3 className="font-bold text-xl flex items-center gap-2">
                <Users className="w-6 h-6 text-rentia-gold" />
                CRM Compraventas
            </h3>
            <p className="text-slate-400 text-xs mt-1">Gestión centralizada de encargos, activos e interesados.</p>
        </div>
        
        <div className="flex bg-slate-800 rounded-lg p-1 w-full md:w-auto">
            <button onClick={() => setActiveTab('buyers')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'buyers' ? 'bg-rentia-gold text-rentia-black shadow' : 'text-slate-400 hover:text-white'}`}>Encargos Compra</button>
            <button onClick={() => setActiveTab('leads')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'leads' ? 'bg-rentia-gold text-rentia-black shadow' : 'text-slate-400 hover:text-white'}`}>Interesados (Leads)</button>
            <button onClick={() => setActiveTab('sellers')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'sellers' ? 'bg-rentia-gold text-rentia-black shadow' : 'text-slate-400 hover:text-white'}`}>Cartera Venta</button>
        </div>
      </div>

      {/* --- TAB: COMPRADORES (ENCARGOS) --- */}
      {activeTab === 'buyers' && (
          <div className="p-4 md:p-6 bg-gray-50 min-h-[500px]">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div>
                      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Briefcase className="w-5 h-5 text-rentia-blue" /> Bolsa de Demandas</h4>
                  </div>
                  <button onClick={() => setIsAddingBuyer(true)} className="bg-rentia-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-colors"><UserPlus className="w-4 h-4" /> Añadir Encargo</button>
              </div>
              
              {/* MODAL / FORMULARIO FLOTANTE PARA COMPRADORES */}
              {isAddingBuyer && createPortal(
                  <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsAddingBuyer(false)}>
                      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                          <div className="p-4 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
                              <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">Nuevo Encargo de Compra</h5>
                              <button onClick={() => setIsAddingBuyer(false)}><X className="w-5 h-5 text-gray-400"/></button>
                          </div>
                          
                          <div className="p-6 overflow-y-auto">
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
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                          <input type="text" required placeholder="Ej: El Carmen" className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" value={newBuyer.location} onChange={e => setNewBuyer({...newBuyer, location: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 mb-1 block">Specs</label>
                                          <input type="text" placeholder="Ej: Min 3 habs..." className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" value={newBuyer.specs} onChange={e => setNewBuyer({...newBuyer, specs: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 mb-1 block">Estado</label>
                                          <input type="text" placeholder="Ej: Buen estado" className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none" value={newBuyer.condition} onChange={e => setNewBuyer({...newBuyer, condition: e.target.value})} />
                                      </div>
                                  </div>

                                  <div className="mb-4">
                                      <label className="text-xs font-bold text-gray-500 mb-1 block">Notas Públicas</label>
                                      <textarea placeholder="Detalles visibles..." className="w-full p-2 border rounded text-sm focus:border-rentia-blue outline-none h-16 resize-none" value={newBuyer.notes} onChange={e => setNewBuyer({...newBuyer, notes: e.target.value})} />
                                  </div>

                                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                      <button type="button" onClick={() => setIsAddingBuyer(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded text-sm font-bold hover:bg-gray-200">Cancelar</button>
                                      <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-green-700 shadow-md flex items-center gap-2"><Save className="w-4 h-4"/> Guardar Encargo</button>
                                  </div>
                              </form>
                          </div>
                      </div>
                  </div>,
                  document.body
              )}

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* ... Tabla de compradores ... */}
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                                <tr>
                                    <th className="p-4 w-32">Ref / Origen</th>
                                    <th className="p-4 w-48 bg-yellow-50/50 text-yellow-700">Cliente (Privado)</th>
                                    <th className="p-4 w-64">Requerimiento</th>
                                    <th className="p-4 w-48">Zona</th>
                                    <th className="p-4 w-32 text-right">Presupuesto</th>
                                    <th className="p-4 w-16 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {buyers.map((req, idx) => (
                                    <tr key={req.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4 align-top">
                                            <div className="font-mono font-bold text-rentia-blue mb-1">{req.reference}</div>
                                            {/* getTagBadge(req.tag) */}
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
                                        </td>
                                        <td className="p-4 align-top">{req.location}</td>
                                        <td className="p-4 align-top text-right font-mono font-bold text-gray-700">
                                            {req.budget > 0 ? req.budget.toLocaleString('es-ES') + ' €' : <span className="text-green-600">Flexible</span>}
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

      {/* --- TAB: LEADS (INTERESADOS) --- */}
      {activeTab === 'leads' && (
          <div className="p-4 md:p-6 bg-gray-50 min-h-[500px]">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div>
                      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-rentia-blue" /> Interesados Web (Leads)</h4>
                      <p className="text-xs text-gray-500 mt-1">Usuarios que han solicitado información sobre oportunidades.</p>
                  </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                                <tr>
                                    <th className="p-4 w-32">Fecha</th>
                                    <th className="p-4 w-48">Interesado</th>
                                    <th className="p-4 w-48">Contacto</th>
                                    <th className="p-4 w-64">Oportunidad</th>
                                    <th className="p-4 w-16 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leads.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">No hay leads registrados aún.</td></tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 text-xs text-gray-500 font-mono">
                                                {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : '-'}
                                                <br/>
                                                {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                            </td>
                                            <td className="p-4 font-bold text-gray-800">
                                                {lead.userData.name}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Mail className="w-3 h-3"/> {lead.userData.email}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Phone className="w-3 h-3"/> {lead.userData.phone}
                                                        {lead.userData.phone && (
                                                            <a href={`https://api.whatsapp.com/send?phone=${lead.userData.phone.replace(/\s+/g, '')}`} target="_blank" className="text-green-600 bg-green-50 p-1 rounded hover:bg-green-100 ml-1">
                                                                <MessageSquare className="w-3 h-3"/>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-rentia-blue">{lead.opportunityTitle}</div>
                                                <span className="text-[10px] text-gray-400 font-mono">ID: {lead.opportunityId}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => handleDeleteLead(lead.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar Lead"
                                                >
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
                        onClick={() => { setIsAddingAsset(true); setEditingAssetId(null); setAssetForm(initialAssetFormState); setHasUnsavedChanges(false); }} 
                        className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                      >
                          <Plus className="w-4 h-4" /> Registrar Nuevo Activo
                      </button>
                  </div>
              </div>

              {/* FORMULARIO EXTENDIDO DE ALTA/EDICIÓN DE ACTIVO (MODAL) */}
              {isAddingAsset && createPortal(
                  <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={handleCancelAsset}>
                      <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl border border-gray-200 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                              <h5 className="font-bold text-gray-800 flex items-center gap-2">
                                  {editingAssetId ? <Pencil className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                                  {editingAssetId ? 'Editar Inmueble' : 'Nuevo Inmueble'}
                              </h5>
                              <button type="button" onClick={handleCancelAsset}><X className="w-4 h-4 text-gray-400"/></button>
                          </div>

                          <div className="flex-grow overflow-y-auto">
                              <form id="asset-form" onSubmit={handleSaveAsset}>
                                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                      
                                      {/* COLUMNA IZQUIERDA: DATOS GENERALES Y DETALLES */}
                                      <div className="space-y-6">
                                          <div className="space-y-4">
                                              <div className="flex justify-between items-center border-b border-gray-100 pb-1 mb-2">
                                                <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Información General</h6>
                                                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-rentia-blue rounded focus:ring-0"
                                                        checked={assetForm.active}
                                                        onChange={(e) => updateForm({ active: e.target.checked })}
                                                    />
                                                    <span className="text-xs font-bold text-gray-600">Visible en Web</span>
                                                </label>
                                              </div>
                                              <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                                                  <input type="text" required className="w-full p-2 border rounded-lg text-sm" placeholder="Ej: Piso muy rentable..." value={assetForm.title} onChange={e => updateForm({title: e.target.value})} />
                                              </div>
                                              
                                              <div className="grid grid-cols-2 gap-4">
                                                  <div className="col-span-2">
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                                      <input type="text" className="w-full p-2 border rounded-lg text-sm" value={assetForm.streetName} onChange={e => updateForm({streetName: e.target.value})} />
                                                  </div>
                                                  <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                                      <input type="text" className="w-full p-2 border rounded-lg text-sm" value={assetForm.city} onChange={e => updateForm({city: e.target.value})} />
                                                  </div>
                                                  <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado Venta</label>
                                                      <select className="w-full p-2 border rounded-lg text-sm bg-white" value={assetForm.status} onChange={e => updateForm({status: e.target.value as any})}>
                                                          <option value="available">Disponible</option>
                                                          <option value="reserved">Reservado</option>
                                                          <option value="sold">Vendido</option>
                                                      </select>
                                                  </div>
                                              </div>

                                              <div className="grid grid-cols-3 gap-4">
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Habitaciones</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.rooms} onChange={e => updateForm({rooms: Number(e.target.value)})} /></div>
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Baños</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.bathrooms} onChange={e => updateForm({bathrooms: Number(e.target.value)})} /></div>
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">M²</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.sqm} onChange={e => updateForm({sqm: Number(e.target.value)})} /></div>
                                              </div>
                                          </div>

                                          {/* DETALLES MARKETING */}
                                          <div className="space-y-3">
                                              <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                  <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marketing y Detalles</h6>
                                                  {/* EDITOR TOOLBAR */}
                                                  <div className="flex items-center gap-1 bg-gray-100 rounded px-1">
                                                      <button type="button" onClick={() => insertHtmlTag('<b>', '</b>')} className="p-1 hover:bg-white rounded text-gray-600" title="Negrita"><Bold className="w-3 h-3" /></button>
                                                      <button type="button" onClick={() => insertHtmlTag('<i>', '</i>')} className="p-1 hover:bg-white rounded text-gray-600" title="Cursiva"><Italic className="w-3 h-3" /></button>
                                                      <button type="button" onClick={() => insertHtmlTag('<br>')} className="p-1 hover:bg-white rounded text-gray-600" title="Salto de línea"><Type className="w-3 h-3" /></button>
                                                      <button type="button" onClick={() => insertHtmlTag('IMG')} className="p-1 hover:bg-white rounded text-gray-600" title="Insertar Imagen"><ImagePlus className="w-3 h-3" /></button>
                                                  </div>
                                              </div>
                                              
                                              <div>
                                                  <div className="flex justify-between items-center mb-1">
                                                     <label className="block text-sm font-medium text-gray-700">Descripción (HTML Habilitado)</label>
                                                     <button 
                                                        type="button" 
                                                        onClick={handleGenerateDescription}
                                                        disabled={isGeneratingAi}
                                                        className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:opacity-90 disabled:opacity-50 transition-all"
                                                     >
                                                        {isGeneratingAi ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3 text-yellow-300"/>}
                                                        {isGeneratingAi ? 'Generando...' : 'Generar con IA'}
                                                     </button>
                                                  </div>
                                                  <textarea id="description-editor" className="w-full p-2 border rounded-lg text-sm h-48 font-mono text-xs leading-relaxed" value={assetForm.description} onChange={e => updateForm({description: e.target.value})} placeholder="Usa la barra superior para formato..." />
                                                  <p className="text-[10px] text-gray-400 mt-1">Puedes usar etiquetas HTML básicas para formato.</p>
                                              </div>

                                              <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">Características (Una por línea)</label>
                                                  <textarea className="w-full p-2 border rounded-lg text-sm h-20" placeholder="Exterior&#10;Reformado..." value={assetForm.features} onChange={e => updateForm({features: e.target.value})} />
                                              </div>

                                              <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">Beneficios Zona (Una por línea)</label>
                                                  <textarea className="w-full p-2 border rounded-lg text-sm h-16" placeholder="Cerca UCAM&#10;Tranvía..." value={assetForm.areaBenefits} onChange={e => updateForm({areaBenefits: e.target.value})} />
                                              </div>

                                              <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                      <label className="block text-xs font-bold text-gray-500 mb-1">Etiquetas (CSV)</label>
                                                      <input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="Rentabilidad, Lujo, Centro" value={assetForm.tags} onChange={e => updateForm({tags: e.target.value})} />
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-gray-500 mb-1">Escenario</label>
                                                      <select className="w-full p-2 border rounded-lg text-sm bg-white" value={assetForm.scenario} onChange={e => updateForm({scenario: e.target.value as any})}>
                                                          <option value="rent_rooms">Inversión (Habitaciones)</option>
                                                          <option value="rent_traditional">Alquiler Tradicional</option>
                                                          <option value="sale_living">Venta para Vivir</option>
                                                      </select>
                                                  </div>
                                              </div>
                                          </div>

                                          {/* Sección Multimedia */}
                                          <div>
                                              <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-3">Multimedia</h6>
                                              
                                              {/* 1. UPLOADER DE IMÁGENES */}
                                              <div className="mb-4">
                                                  <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Fotos</label>
                                                  <ImageUploader folder="opportunities" onUploadComplete={handleAddImage} label="Subir Fotos" />
                                                  <div className="flex flex-wrap gap-2 mt-2">
                                                      {assetForm.images.map((img, idx) => (
                                                          <div key={idx} className="relative w-16 h-16 rounded border">
                                                              <img src={img} className="w-full h-full object-cover" />
                                                              <button type="button" onClick={() => { setAssetForm(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)})); setHasUnsavedChanges(true); }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X className="w-3 h-3"/></button>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>

                                              {/* 2. UPLOADER DE VÍDEO + URL INPUT */}
                                              <div className="grid grid-cols-1 gap-4">
                                                  <div>
                                                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Carpeta Drive</label>
                                                      <input type="text" className="w-full p-2 border rounded-lg text-sm" value={assetForm.driveFolder} onChange={e => updateForm({driveFolder: e.target.value})} />
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Video className="w-3 h-3"/> Video (URL o Archivo)</label>
                                                      <div className="flex gap-2">
                                                          <input 
                                                            type="text" 
                                                            className="flex-grow p-2 border rounded-lg text-sm" 
                                                            placeholder="https://youtube.com/..." 
                                                            value={assetForm.videoUrl} 
                                                            onChange={e => updateForm({videoUrl: e.target.value})} 
                                                          />
                                                          <div className="flex-shrink-0 w-32">
                                                              <ImageUploader 
                                                                folder="opportunities/videos" 
                                                                label="Subir"
                                                                compact={true}
                                                                accept="video/*"
                                                                maxSizeMB={30}
                                                                onUploadComplete={handleAddVideo} 
                                                              />
                                                          </div>
                                                      </div>
                                                      <p className="text-[9px] text-gray-400 mt-1">Usa YouTube para vídeos largos (Tours). Sube aquí solo clips cortos (&lt;30MB).</p>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>

                                      {/* COLUMNA DERECHA: ECONÓMICO */}
                                      <div className="space-y-6">
                                          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 h-fit space-y-6">
                                              <h5 className="font-bold text-rentia-blue flex items-center gap-2 border-b border-blue-200 pb-2"><DollarSign className="w-5 h-5" /> Datos Económicos</h5>
                                              
                                              <div className="grid grid-cols-2 gap-4">
                                                  <div className="col-span-2">
                                                      <label className="block text-sm font-bold text-gray-700 mb-1">Precio Venta (€)</label>
                                                      <input type="number" required className="w-full p-2 border rounded-lg text-lg font-bold" value={assetForm.purchasePrice} onChange={e => updateForm({purchasePrice: Number(e.target.value)})} />
                                                  </div>
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Honorarios</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.agencyFees} onChange={e => updateForm({agencyFees: Number(e.target.value)})} /></div>
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">ITP (%)</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.itpPercent} onChange={e => updateForm({itpPercent: Number(e.target.value)})} /></div>
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Reforma</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.reformCost} onChange={e => updateForm({reformCost: Number(e.target.value)})} /></div>
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Mobiliario</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.furnitureCost} onChange={e => updateForm({furnitureCost: Number(e.target.value)})} /></div>
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Notaría</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.notaryExpenses} onChange={e => updateForm({notaryExpenses: Number(e.target.value)})} /></div>
                                                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Gastos Anuales</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.yearlyExpenses} onChange={e => updateForm({yearlyExpenses: Number(e.target.value)})} /></div>
                                              </div>
                                              
                                              <div className="border-t border-blue-200 pt-4 mt-2">
                                                  <label className="block text-xs font-bold text-gray-500 mb-2">Ingresos Proyectados (Rentas)</label>
                                                  <div className="grid grid-cols-2 gap-4">
                                                      <div><label className="text-[10px] block">Tradicional</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.traditionalRent} onChange={e => updateForm({traditionalRent: Number(e.target.value)})} /></div>
                                                      <div><label className="text-[10px] block">Por Habitaciones (Total)</label><div className="p-2 bg-white rounded border text-sm font-bold text-gray-500">{assetForm.roomPrices.reduce((a, b) => a + b.price, 0)} €</div></div>
                                                  </div>
                                              </div>
                                              
                                              {/* Room Config */}
                                              <div className="mt-4">
                                                  <label className="block text-xs font-bold text-gray-500 mb-2">Configuración Habitaciones (Precios)</label>
                                                  {assetForm.roomPrices.map((room, idx) => (
                                                      <div key={idx} className="flex gap-2 mb-2">
                                                          <input type="text" className="w-1/2 p-1.5 border rounded text-xs" value={room.name} onChange={e => { const newRooms = [...assetForm.roomPrices]; newRooms[idx].name = e.target.value; updateForm({roomPrices: newRooms}); }} />
                                                          <input type="number" className="w-1/2 p-1.5 border rounded text-xs" value={room.price} onChange={e => { const newRooms = [...assetForm.roomPrices]; newRooms[idx].price = Number(e.target.value); updateForm({roomPrices: newRooms}); }} />
                                                      </div>
                                                  ))}
                                                  <button type="button" onClick={() => updateForm({roomPrices: [...assetForm.roomPrices, {name: `Habitación ${assetForm.roomPrices.length+1}`, price: 0}]})} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3"/> Añadir Habitación</button>
                                              </div>

                                              <div className="border-t border-blue-200 pt-4 mt-2">
                                                  <div className="grid grid-cols-2 gap-4">
                                                      <div>
                                                          <label className="block text-xs font-bold text-gray-500 mb-1">Valor Mercado (Tasación)</label>
                                                          <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.marketValue} onChange={e => updateForm({marketValue: Number(e.target.value)})} placeholder="Auto si 0" />
                                                      </div>
                                                      <div>
                                                          <label className="block text-xs font-bold text-gray-500 mb-1">Revalorización (%)</label>
                                                          <input type="number" className="w-full p-2 border rounded-lg text-sm" value={assetForm.appreciationRate} onChange={e => updateForm({appreciationRate: Number(e.target.value)})} />
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </form>
                          </div>

                          <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                              <button type="button" onClick={handleCancelAsset} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold">Cancelar</button>
                              <button type="submit" form="asset-form" className="px-6 py-2 bg-rentia-blue hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center gap-2">
                                  <Save className="w-4 h-4" /> {hasUnsavedChanges ? 'Guardar Cambios' : 'Publicar'}
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
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
                          <div key={opp.id} className={`bg-white rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition-all ${opp.active === false ? 'border-gray-300 opacity-60 bg-gray-50' : 'border-gray-200'}`}>
                              <div>
                                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                      {opp.title}
                                      {opp.active === false && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold uppercase">Oculto</span>}
                                  </h4>
                                  <p className="text-sm text-gray-500">{opp.address} ({opp.city})</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="text-right mr-4 hidden sm:block">
                                      {/* FIXED: Safe navigation operator ?. for financials */}
                                      <p className="font-bold text-lg">{opp.financials?.purchasePrice?.toLocaleString() || 0} €</p>
                                  </div>
                                  <button 
                                    onClick={() => handleToggleActive(opp.id, opp.active)}
                                    className={`p-2 rounded-lg transition-colors ${opp.active === false ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-200' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                                    title={opp.active === false ? "Activar (Mostrar en web)" : "Desactivar (Ocultar)"}
                                  >
                                      {opp.active === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <a 
                                    href={`#/presentation?id=${opp.id}`} 
                                    target="_blank"
                                    rel="noreferrer" 
                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
                                    title="Ver Plantilla Presentación"
                                  >
                                      <MonitorPlay className="w-4 h-4" /> <span className="hidden md:inline">Ver Presentación</span>
                                  </a>
                                  <button onClick={() => handleEditAsset(opp)} className="p-2 text-gray-400 hover:text-rentia-blue hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteAsset(opp.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
