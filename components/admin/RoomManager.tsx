import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { properties as staticProperties, Property, Room, CleaningConfig, OwnerRecommendation } from '../../data/rooms';
import { Save, RefreshCw, Home, ChevronDown, ChevronRight, Building, Plus, Trash2, X, MapPin, ExternalLink, Wind, Image as ImageIcon, FileText, Settings, Hammer, DollarSign, Percent, Sun, Tv, Lock, Monitor, AlertCircle, User, CheckCircle, Sparkles, Clock, Euro, Calendar, ShieldCheck, ShieldAlert, FileCheck, Download, CreditCard, Phone, Mail, Megaphone, Zap, Info, Send } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ContractManager } from './ContractManager';
import { Contract, UserProfile, PropertyDocument, SupplyInvoice } from '../../types';
import { SensitiveDataDisplay } from '../common/SecurityComponents';

// Helpers
const dateToInput = (dateStr?: string) => {
  if (!dateStr) return '';
  if (dateStr === 'Inmediata') return new Date().toISOString().split('T')[0];
  if (dateStr === 'Consultar') return '';
  try {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  } catch (e) { return ''; }
};

const inputToDate = (isoDate: string) => {
  if (!isoDate) return 'Consultar';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export const RoomManager: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  
  // Real-time State for Owner Integration
  const [ownersMap, setOwnersMap] = useState<Record<string, UserProfile>>({});
  const [documentsMap, setDocumentsMap] = useState<Record<string, PropertyDocument[]>>({});
  const [invoicesMap, setInvoicesMap] = useState<Record<string, SupplyInvoice[]>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedProp, setExpandedProp] = useState<string | null>(null);
  
  // Modal states
  const [contractModalConfig, setContractModalConfig] = useState<{
      isOpen: boolean;
      mode: 'list' | 'create' | 'details';
      preSelectedRoom?: { propertyId: string, roomId: string, price: number, roomName: string, propertyAddress: string };
      contractId?: string;
  }>({ isOpen: false, mode: 'list' });

  const [isCreating, setIsCreating] = useState(false);
  const [newPropData, setNewPropData] = useState({ 
      address: '', city: 'Murcia', floor: '', bathrooms: 1, image: '', initialRooms: 3 
  });
  
  // Estado para nueva recomendación PROPIEDAD
  const [newRec, setNewRec] = useState<{ text: string, type: 'price' | 'improvement' | 'info' }>({ text: '', type: 'info' });

  // Estado para gestión de recomendaciones de HABITACIÓN (Input temporal)
  const [roomRecInputs, setRoomRecInputs] = useState<Record<string, string>>({});

  // Fetch Contracts (Static Fetch is fine for contracts unless real-time is strictly needed)
  const fetchContracts = async () => {
    try {
      const contractsSnap = await getDocs(collection(db, "contracts"));
      const contractsData: Contract[] = [];
      contractsSnap.forEach((doc) => {
          contractsData.push({ ...doc.data(), id: doc.id } as Contract);
      });
      setContracts(contractsData);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  };

  useEffect(() => { 
      // 1. Initial Contracts Load
      fetchContracts();

      // 2. Real-time Properties Listener (CRITICAL FOR SYNC WITH WORKER DASHBOARD)
      const unsubProperties = onSnapshot(collection(db, "properties"), (snapshot) => {
          const firestorePropsMap: Record<string, Property> = {};
          
          snapshot.forEach((doc) => {
              firestorePropsMap[doc.id] = { ...doc.data(), id: doc.id } as Property;
          });

          // Merge Logic: Static props serve as base, Firestore props overwrite them.
          const mergedProperties: Property[] = [];
          
          // 2.1 Add Static Props (checking if they exist in Firestore)
          staticProperties.forEach(staticProp => {
              if (firestorePropsMap[staticProp.id]) {
                  mergedProperties.push(firestorePropsMap[staticProp.id]);
                  delete firestorePropsMap[staticProp.id]; // Remove so we don't duplicate
              } else {
                  mergedProperties.push(staticProp);
              }
          });
          
          // 2.2 Add remaining Firestore Props (newly created ones)
          Object.values(firestorePropsMap).forEach(p => mergedProperties.push(p));
          
          mergedProperties.sort((a,b) => a.address.localeCompare(b.address));
          setProperties(mergedProperties);
          setLoading(false);
      });

      // 3. Other Real-time Listeners for Status Updates (RGPD & Docs)
      const unsubOwners = onSnapshot(query(collection(db, "users"), where("role", "==", "owner")), (snapshot) => {
          const oMap: Record<string, UserProfile> = {};
          snapshot.forEach((doc) => {
              oMap[doc.id] = { ...doc.data(), id: doc.id } as UserProfile;
          });
          setOwnersMap(oMap);
      });

      const unsubDocs = onSnapshot(collection(db, "property_documents"), (snapshot) => {
          const dMap: Record<string, PropertyDocument[]> = {};
          snapshot.forEach((doc) => {
              const data = doc.data() as PropertyDocument;
              if (!dMap[data.propertyId]) dMap[data.propertyId] = [];
              dMap[data.propertyId].push({ ...data, id: doc.id });
          });
          setDocumentsMap(dMap);
      });

      const unsubInvoices = onSnapshot(collection(db, "supply_invoices"), (snapshot) => {
          const iMap: Record<string, SupplyInvoice[]> = {};
          snapshot.forEach((doc) => {
              const data = doc.data() as SupplyInvoice;
              if (!iMap[data.propertyId]) iMap[data.propertyId] = [];
              iMap[data.propertyId].push({ ...data, id: doc.id });
          });
          setInvoicesMap(iMap);
      });

      return () => { unsubProperties(); unsubOwners(); unsubDocs(); unsubInvoices(); };
  }, []);

  const getActiveContract = (roomId: string) => {
      return contracts.find(c => c.roomId === roomId && (c.status === 'active' || c.status === 'reserved'));
  };

  // ... (Create & Delete Handlers) ...
  const handleCreateProperty = async () => {
      setSaving(true);
      try {
          const newId = newPropData.address.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10) + Date.now().toString().slice(-4);
          const newRooms: Room[] = [];
          for(let i=1; i<=newPropData.initialRooms; i++) {
              newRooms.push({ id: `${newId}_H${i}`, name: `H${i}`, price: 300, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both', features: ['lock', 'desk'], commissionType: 'percentage', commissionValue: 10 });
          }
          const newProp: Property = { id: newId, address: newPropData.address, city: newPropData.city, floor: newPropData.floor, bathrooms: newPropData.bathrooms, image: '', googleMapsLink: '', rooms: newRooms };
          await setDoc(doc(db, "properties", newId), newProp);
          setIsCreating(false);
          setNewPropData({ address: '', city: 'Murcia', floor: '', bathrooms: 1, image: '', initialRooms: 3 });
      } catch (error) { console.error(error); alert("Error al crear propiedad"); } finally { setSaving(false); }
  };

  const handleDeleteProperty = async (propId: string) => {
      if(!confirm("¿Seguro que quieres eliminar esta propiedad y todas sus habitaciones?")) return;
      try { await deleteDoc(doc(db, "properties", propId)); } catch (error) { console.error(error); }
  };

  const handlePropertyFieldChange = (propId: string, field: keyof Property, value: any) => {
      setProperties(prev => prev.map(p => p.id === propId ? { ...p, [field]: value } : p));
  };

  // --- FIXED: SAVE FUNCTION FOR CLEANING TOGGLE ---
  const toggleCleaningService = async (propId: string) => {
      // 1. Encontrar la propiedad en el estado actual
      const propertyToUpdate = properties.find(p => p.id === propId);
      if (!propertyToUpdate) return;

      const currentConfig = propertyToUpdate.cleaningConfig || { enabled: false, days: [], hours: '', costPerHour: 10, included: false };
      const newEnabledState = !currentConfig.enabled;
      
      const newConfig = {
          ...currentConfig,
          enabled: newEnabledState
      };

      // 2. Actualización Optimista (UI instantánea)
      setProperties(prev => prev.map(p => {
          if (p.id !== propId) return p;
          return { ...p, cleaningConfig: newConfig };
      }));

      // 3. Guardar en Firestore
      try {
          const propertyRef = doc(db, "properties", propId);
          const docSnap = await getDoc(propertyRef);
          
          if (docSnap.exists()) {
              // Si el documento ya existe, solo actualizamos el campo específico
              await setDoc(propertyRef, { cleaningConfig: newConfig }, { merge: true });
          } else {
             // Si el documento NO existe (es propiedad estática convirtiéndose a dinámica), guardamos TODO el objeto
             // IMPORTANTE: Excluir el campo 'id' si está dentro del objeto para evitar duplicidad, aunque Firestore lo maneja.
             const { id, ...dataToSave } = propertyToUpdate;
             await setDoc(propertyRef, { ...dataToSave, cleaningConfig: newConfig }, { merge: true });
          }
      } catch (e) {
          console.error("Error saving cleaning toggle:", e);
          alert("Error al sincronizar el estado del servicio. Comprueba tu conexión.");
          // Revertir estado si falla
          setProperties(properties); // Esto podría no ser perfecto sin un estado previo guardado, pero en onSnapshot se corregirá
      }
  };

  // Modificación local de datos (días, horas) sin guardar en BD todavía
  const handleCleaningChange = (propId: string, field: keyof CleaningConfig, value: any) => {
      setProperties(prev => prev.map(p => {
          if (p.id !== propId) return p;
          const currentConfig = p.cleaningConfig || { enabled: false, days: [], hours: '', costPerHour: 10, included: false };
          return { ...p, cleaningConfig: { ...currentConfig, [field]: value } };
      }));
  };

  const toggleCleaningDay = (propId: string, day: string) => {
      setProperties(prev => prev.map(p => {
          if (p.id !== propId) return p;
          const config = p.cleaningConfig || { enabled: true, days: [], hours: '', costPerHour: 10, included: false };
          const newDays = config.days.includes(day) ? config.days.filter(d => d !== day) : [...config.days, day];
          return { ...p, cleaningConfig: { ...config, days: newDays } };
      }));
  };

  const handleRoomChange = (propId: string, roomId: string, field: keyof Room, value: any) => {
      setProperties(prev => prev.map(p => {
          if (p.id !== propId) return p;
          return { ...p, rooms: p.rooms.map(r => r.id === roomId ? { ...r, [field]: value } : r) };
      }));
  };

  const handleRoomFeatureToggle = (propId: string, roomId: string, feature: string) => {
      setProperties(prev => prev.map(p => {
          if (p.id !== propId) return p;
          return { ...p, rooms: p.rooms.map(r => r.id === roomId ? { ...r, features: (r.features || []).includes(feature) ? r.features?.filter(f => f !== feature) : [...(r.features || []), feature] } : r) };
      }));
  };

  // RECOMMENDATION LOGIC (PROPERTY LEVEL)
  const handleAddRecommendation = async (propId: string) => {
      if (!newRec.text) return;
      const prop = properties.find(p => p.id === propId);
      if (!prop) return;

      const newRecommendation: OwnerRecommendation = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          text: newRec.text,
          type: newRec.type
      };

      const updatedRecs = [...(prop.ownerRecommendations || []), newRecommendation];
      
      setProperties(prev => prev.map(p => p.id === propId ? { ...p, ownerRecommendations: updatedRecs } : p));
      await updateDoc(doc(db, "properties", propId), { ownerRecommendations: updatedRecs });
      setNewRec({ text: '', type: 'info' });
  };

  const handleDeleteRecommendation = async (propId: string, recId: string) => {
      const prop = properties.find(p => p.id === propId);
      if (!prop) return;
      
      const updatedRecs = (prop.ownerRecommendations || []).filter(r => r.id !== recId);
      setProperties(prev => prev.map(p => p.id === propId ? { ...p, ownerRecommendations: updatedRecs } : p));
      await updateDoc(doc(db, "properties", propId), { ownerRecommendations: updatedRecs });
  };

  // RECOMMENDATION LOGIC (ROOM LEVEL)
  const handleAddRoomRecommendation = async (propId: string, roomId: string) => {
      const text = roomRecInputs[roomId];
      if (!text) return;

      const prop = properties.find(p => p.id === propId);
      if (!prop) return;

      const updatedRooms = prop.rooms.map(r => {
          if (r.id === roomId) {
              const newRec: OwnerRecommendation = {
                  id: Date.now().toString(),
                  date: new Date().toISOString(),
                  text: text,
                  type: 'info' // Default for room specific
              };
              return { ...r, recommendations: [...(r.recommendations || []), newRec] };
          }
          return r;
      });

      setProperties(prev => prev.map(p => p.id === propId ? { ...p, rooms: updatedRooms } : p));
      await updateDoc(doc(db, "properties", propId), { rooms: updatedRooms });
      setRoomRecInputs(prev => ({...prev, [roomId]: ''}));
  };

  const handleDeleteRoomRecommendation = async (propId: string, roomId: string, recId: string) => {
      const prop = properties.find(p => p.id === propId);
      if (!prop) return;

      const updatedRooms = prop.rooms.map(r => {
          if (r.id === roomId) {
              return { ...r, recommendations: (r.recommendations || []).filter(rec => rec.id !== recId) };
          }
          return r;
      });

      setProperties(prev => prev.map(p => p.id === propId ? { ...p, rooms: updatedRooms } : p));
      await updateDoc(doc(db, "properties", propId), { rooms: updatedRooms });
  };

  // Save changes to DB
  const handleSaveAll = async (propId: string) => {
      setSaving(true);
      const prop = properties.find(p => p.id === propId);
      if (prop) {
          try {
              // Usar setDoc con merge para asegurar que se crea/actualiza todo correctamente
              await setDoc(doc(db, "properties", propId), prop, { merge: true });
              alert("Cambios guardados");
          } catch (e) {
              console.error(e);
              alert("Error al guardar");
          }
      }
      setSaving(false);
  };

  if (loading) return <div className="text-center py-10"><RefreshCw className="animate-spin w-8 h-8 text-rentia-blue mx-auto"/></div>;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Building className="w-6 h-6 text-rentia-blue" />
                  Gestión de Habitaciones
              </h2>
              <p className="text-sm text-gray-500 mt-1">{properties.length} Propiedades activas</p>
          </div>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-md"
          >
              {isCreating ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
              {isCreating ? 'Cancelar' : 'Nueva Propiedad'}
          </button>
      </div>

      {/* Create New Form */}
      {isCreating && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-in slide-in-from-top-4">
              <h3 className="font-bold mb-4 text-gray-700">Alta Nueva Propiedad</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input type="text" placeholder="Dirección" className="border p-2 rounded" value={newPropData.address} onChange={e => setNewPropData({...newPropData, address: e.target.value})} />
                  <input type="text" placeholder="Ciudad" className="border p-2 rounded" value={newPropData.city} onChange={e => setNewPropData({...newPropData, city: e.target.value})} />
                  <input type="text" placeholder="Planta" className="border p-2 rounded" value={newPropData.floor} onChange={e => setNewPropData({...newPropData, floor: e.target.value})} />
                  <input type="number" placeholder="Habitaciones" className="border p-2 rounded" value={newPropData.initialRooms} onChange={e => setNewPropData({...newPropData, initialRooms: Number(e.target.value)})} />
              </div>
              <button onClick={handleCreateProperty} disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 w-full md:w-auto">
                  {saving ? 'Guardando...' : 'Crear Propiedad'}
              </button>
          </div>
      )}

      {/* Property List */}
      <div className="space-y-4">
          {properties.map(p => {
              const isExpanded = expandedProp === p.id;
              const ownerData = p.ownerId ? ownersMap[p.ownerId] : null;
              
              return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all">
                  {/* Property Header */}
                  <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 bg-white" onClick={() => setExpandedProp(isExpanded ? null : p.id)}>
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${ownerData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              <Home className="w-6 h-6" />
                          </div>
                          <div>
                              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                  {p.address}
                                  {ownerData && <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded border border-green-200">RGPD OK</span>}
                                  {p.ownerRecommendations && p.ownerRecommendations.length > 0 && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded flex items-center gap-1"><Megaphone className="w-3 h-3"/> Avisos</span>}
                              </h3>
                              <p className="text-sm text-gray-500">{p.city} • {p.rooms.length} Habs</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <button onClick={(e) => {e.stopPropagation(); handleDeleteProperty(p.id)}} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                  </div>

                  {isExpanded && (
                      <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2">
                          
                          {/* OWNER INFO SECTION */}
                          <div className="bg-white p-4 rounded-xl border border-blue-100 mb-6 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <User className="w-4 h-4 text-rentia-blue"/> Datos Propietario
                                  {ownerData?.gdpr?.signed ? <span className="text-green-600 flex items-center gap-1 ml-auto"><ShieldCheck className="w-4 h-4"/> RGPD Firmado</span> : <span className="text-red-500 flex items-center gap-1 ml-auto"><ShieldAlert className="w-4 h-4"/> Pendiente Firma</span>}
                              </h4>
                              {ownerData ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                      <div><span className="text-gray-500 block text-xs">Nombre</span><span className="font-bold">{ownerData.name}</span></div>
                                      <div><span className="text-gray-500 block text-xs">DNI</span><SensitiveDataDisplay value={ownerData.dni || ''} type="dni"/></div>
                                      <div><span className="text-gray-500 block text-xs">Teléfono</span><SensitiveDataDisplay value={ownerData.phone || ''} type="phone"/></div>
                                      <div><span className="text-gray-500 block text-xs">Email</span><SensitiveDataDisplay value={ownerData.email} type="email"/></div>
                                      <div className="md:col-span-2 lg:col-span-4 bg-gray-50 p-2 rounded border border-gray-200 flex items-center gap-2">
                                          <span className="text-gray-500 text-xs font-bold">IBAN Pago:</span>
                                          <SensitiveDataDisplay value={ownerData.bankAccount || ''} type="iban" className="font-mono text-gray-700"/>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center text-gray-400 italic py-2">
                                      Propiedad no asignada a ningún usuario propietario.
                                      <div className="mt-2 text-xs bg-yellow-50 text-yellow-700 p-2 rounded border border-yellow-200">
                                          Ve a la sección "Usuarios" para crear el perfil y asignarle esta propiedad.
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* RECOMMENDATIONS SECTION */}
                          <div className="bg-white p-4 rounded-xl border border-yellow-100 mb-6 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Megaphone className="w-4 h-4 text-yellow-500"/> Recomendaciones al Propietario
                              </h4>
                              
                              {/* Add New Rec */}
                              <div className="flex gap-2 mb-4">
                                  <input 
                                    type="text" 
                                    placeholder="Escribe recomendación (ej: Bajar precio H3)" 
                                    className="flex-grow p-2 border rounded text-sm"
                                    value={newRec.text}
                                    onChange={e => setNewRec({...newRec, text: e.target.value})}
                                  />
                                  <select 
                                    className="p-2 border rounded text-sm bg-gray-50"
                                    value={newRec.type}
                                    onChange={e => setNewRec({...newRec, type: e.target.value as any})}
                                  >
                                      <option value="info">Info</option>
                                      <option value="price">Precio</option>
                                      <option value="improvement">Mejora</option>
                                  </select>
                                  <button onClick={() => handleAddRecommendation(p.id)} className="bg-rentia-black text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-1">
                                      <Plus className="w-3 h-3"/> Aplicar
                                  </button>
                              </div>

                              {/* List Recs */}
                              <div className="space-y-2">
                                  {p.ownerRecommendations?.map(rec => (
                                      <div key={rec.id} className={`p-3 rounded-lg border flex justify-between items-center text-sm ${rec.type === 'price' ? 'bg-green-50 border-green-200 text-green-800' : rec.type === 'improvement' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                                          <div className="flex items-center gap-2">
                                              {rec.type === 'price' && <DollarSign className="w-4 h-4"/>}
                                              {rec.type === 'improvement' && <Hammer className="w-4 h-4"/>}
                                              <div>
                                                  <p className="font-bold">{rec.text}</p>
                                                  <p className="text-[10px] opacity-70">{new Date(rec.date).toLocaleDateString()}</p>
                                              </div>
                                          </div>
                                          <button onClick={() => handleDeleteRecommendation(p.id, rec.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* GENERAL CONFIG */}
                          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-gray-500"/> Configuración Inmueble
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                  <div className="md:col-span-1">
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dirección</label>
                                      <input type="text" className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={p.address} onChange={e => handlePropertyFieldChange(p.id, 'address', e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Planta</label>
                                      <input type="text" className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={p.floor} onChange={e => handlePropertyFieldChange(p.id, 'floor', e.target.value)} />
                                  </div>
                                  <div className="md:col-span-2">
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Google Maps Link</label>
                                      <input type="text" className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={p.googleMapsLink} onChange={e => handlePropertyFieldChange(p.id, 'googleMapsLink', e.target.value)} />
                                  </div>
                              </div>
                              
                              {/* NEW ROW: PAYMENT DAY & COMMISSION */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                       <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Día Pago (1-31)</label>
                                       <input 
                                          type="number" 
                                          min="1" 
                                          max="31" 
                                          className="w-full p-2 border rounded-lg text-sm bg-white font-mono" 
                                          value={p.transferDay || ''} 
                                          onChange={(e) => handlePropertyFieldChange(p.id, 'transferDay', Number(e.target.value))} 
                                          placeholder="Ej: 5"
                                       />
                                  </div>
                                  <div>
                                       <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1 text-rentia-blue">% Gestión (+IVA)</label>
                                       <div className="relative">
                                          <input 
                                              type="number" 
                                              step="0.1" 
                                              className="w-full p-2 border border-rentia-blue/30 rounded-lg text-sm bg-blue-50 font-bold text-rentia-blue focus:ring-rentia-blue focus:border-rentia-blue" 
                                              value={p.managementCommission || ''} 
                                              onChange={(e) => handlePropertyFieldChange(p.id, 'managementCommission', Number(e.target.value))} 
                                              placeholder="10"
                                          />
                                          <Percent className="absolute right-3 top-2.5 w-3 h-3 text-rentia-blue/50 pointer-events-none" />
                                       </div>
                                  </div>
                              </div>

                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                          <Sparkles className="w-4 h-4 text-blue-600" />
                                          <span className="text-sm font-bold text-blue-800">Limpieza</span>
                                      </div>
                                      <button 
                                          onClick={() => toggleCleaningService(p.id)}
                                          className={`text-xs font-bold px-3 py-1 rounded transition-colors ${p.cleaningConfig?.enabled ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-600 text-white shadow-sm'}`}
                                      >
                                          {p.cleaningConfig?.enabled ? 'Desactivar' : 'Activar'}
                                      </button>
                                  </div>
                                  
                                  {p.cleaningConfig?.enabled && (
                                    <div className="mt-3 pt-3 border-t border-blue-200 w-full animate-in slide-in-from-top-2">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                                                 <button 
                                                    key={day} 
                                                    onClick={() => toggleCleaningDay(p.id, day)} 
                                                    className={`px-2 py-1 text-[10px] rounded border ${p.cleaningConfig?.days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300'}`}
                                                 >
                                                    {day.slice(0,3)}
                                                 </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                             <input 
                                                type="text" 
                                                placeholder="Horario (Ej: 10:00 - 12:00)" 
                                                className="p-1 border rounded text-xs" 
                                                value={p.cleaningConfig?.hours || ''} 
                                                onChange={(e) => handleCleaningChange(p.id, 'hours', e.target.value)}
                                             />
                                             <div className="relative">
                                                <input 
                                                    type="number" 
                                                    placeholder="Coste/Hora (€)" 
                                                    className="p-1 border rounded text-xs w-full pr-8" 
                                                    value={p.cleaningConfig?.costPerHour || ''} 
                                                    onChange={(e) => handleCleaningChange(p.id, 'costPerHour', Number(e.target.value))}
                                                />
                                                <span className="absolute right-1 top-1.5 text-[8px] text-gray-400">(IVA inc.)</span>
                                             </div>
                                        </div>
                                    </div>
                                  )}
                              </div>
                          </div>

                          <div className="flex justify-end mb-6">
                              <button onClick={() => handleSaveAll(p.id)} disabled={saving} className="bg-rentia-black text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                                  {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                                  Guardar Todo
                              </button>
                          </div>

                          {/* ROOMS LIST */}
                          <div className="space-y-4">
                              {p.rooms.map(room => {
                                  const activeContract = getActiveContract(room.id);
                                  
                                  return (
                                  <div key={room.id} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm ${room.status === 'occupied' ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                                      <div className="flex justify-between items-center mb-4">
                                          <div className="flex items-center gap-3">
                                              <span className="font-bold text-lg">{room.name}</span>
                                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${room.status === 'occupied' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{room.status}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <span className="text-sm font-bold text-gray-500">Precio:</span>
                                              <input 
                                                  type="number" 
                                                  className="w-20 p-1 border rounded text-right font-bold text-rentia-blue" 
                                                  value={room.price} 
                                                  onChange={e => handleRoomChange(p.id, room.id, 'price', Number(e.target.value))}
                                              />
                                          </div>
                                      </div>

                                      {/* Room Controls Grid */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                          <div>
                                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estado</label>
                                              <select 
                                                  className="w-full p-2 border rounded text-sm bg-white"
                                                  value={room.status}
                                                  onChange={e => handleRoomChange(p.id, room.id, 'status', e.target.value)}
                                              >
                                                  <option value="available">Disponible</option>
                                                  <option value="occupied">Ocupada</option>
                                                  <option value="reserved">Reservada</option>
                                              </select>
                                          </div>
                                          
                                          <div>
                                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Disponibilidad</label>
                                              <input 
                                                  type="date" 
                                                  className="w-full p-2 border rounded text-sm"
                                                  value={dateToInput(room.availableFrom)}
                                                  onChange={e => handleRoomChange(p.id, room.id, 'availableFrom', inputToDate(e.target.value))}
                                              />
                                          </div>

                                          <div>
                                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gastos</label>
                                              <select 
                                                  className="w-full p-2 border rounded text-sm bg-white"
                                                  value={room.expenses}
                                                  onChange={e => handleRoomChange(p.id, room.id, 'expenses', e.target.value)}
                                              >
                                                  <option value="Gastos fijos aparte">Fijos Aparte</option>
                                                  <option value="Se reparten los gastos">A Repartir</option>
                                              </select>
                                          </div>
                                          
                                          <div>
                                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Perfil</label>
                                              <select 
                                                  className="w-full p-2 border rounded text-sm bg-white"
                                                  value={room.targetProfile || 'both'}
                                                  onChange={e => handleRoomChange(p.id, room.id, 'targetProfile', e.target.value)}
                                              >
                                                  <option value="both">Indiferente</option>
                                                  <option value="students">Estudiantes</option>
                                                  <option value="workers">Trabajadores</option>
                                              </select>
                                          </div>
                                      </div>

                                      {/* Features Toggles */}
                                      <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-2 rounded-lg">
                                          <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'lock')} className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${room.features?.includes('lock') ? 'bg-white border-rentia-blue text-rentia-blue shadow-sm' : 'border-transparent text-gray-400'}`}><Lock className="w-3 h-3 inline mr-1"/> Llave</button>
                                          <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'balcony')} className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${room.features?.includes('balcony') ? 'bg-white border-rentia-blue text-rentia-blue shadow-sm' : 'border-transparent text-gray-400'}`}><Sun className="w-3 h-3 inline mr-1"/> Balcón</button>
                                          <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'smart_tv')} className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${room.features?.includes('smart_tv') ? 'bg-white border-rentia-blue text-rentia-blue shadow-sm' : 'border-transparent text-gray-400'}`}><Tv className="w-3 h-3 inline mr-1"/> TV</button>
                                          <button onClick={() => handleRoomFeatureToggle(p.id, room.id, 'desk')} className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${room.features?.includes('desk') ? 'bg-white border-rentia-blue text-rentia-blue shadow-sm' : 'border-transparent text-gray-400'}`}><Monitor className="w-3 h-3 inline mr-1"/> Escritorio</button>
                                          <button onClick={() => handleRoomChange(p.id, room.id, 'hasAirConditioning', !room.hasAirConditioning)} className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${room.hasAirConditioning ? 'bg-white border-rentia-blue text-rentia-blue shadow-sm' : 'border-transparent text-gray-400'}`}><Wind className="w-3 h-3 inline mr-1"/> A/C</button>
                                      </div>

                                      {/* Recommendations specific to Room */}
                                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-4">
                                          <h5 className="font-bold text-[10px] text-yellow-800 uppercase mb-2">Recomendaciones Habitación ({room.recommendations?.length || 0})</h5>
                                          <div className="space-y-2">
                                              {room.recommendations?.map((rec, i) => (
                                                  <div key={i} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-yellow-200">
                                                      <span className="text-gray-600">{rec.text}</span>
                                                      <button onClick={() => handleDeleteRoomRecommendation(p.id, room.id, rec.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                                                  </div>
                                              ))}
                                              <div className="flex gap-2 mt-2">
                                                  <input 
                                                      type="text" 
                                                      placeholder="Añadir aviso específico..." 
                                                      className="flex-grow p-1.5 border rounded text-xs"
                                                      value={roomRecInputs[room.id] || ''}
                                                      onChange={e => setRoomRecInputs({...roomRecInputs, [room.id]: e.target.value})}
                                                  />
                                                  <button onClick={() => handleAddRoomRecommendation(p.id, room.id)} className="bg-yellow-500 text-white px-2 rounded hover:bg-yellow-600"><Plus className="w-4 h-4"/></button>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Contract Section */}
                                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                          <div className="flex items-center gap-2">
                                              <FileText className="w-4 h-4 text-gray-400" />
                                              <span className="text-xs font-bold text-gray-600 uppercase">Contrato</span>
                                          </div>
                                          {activeContract ? (
                                              <div className="flex items-center gap-3">
                                                  <div className="text-right">
                                                      <p className="text-sm font-bold text-gray-800">{activeContract.tenantName}</p>
                                                      <p className="text-[10px] text-gray-500">{new Date(activeContract.startDate).toLocaleDateString()} - {activeContract.endDate ? new Date(activeContract.endDate).toLocaleDateString() : 'Indef.'}</p>
                                                  </div>
                                                  <button className="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200" title="Ver Contrato">
                                                      <FileText className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          ) : (
                                              <button onClick={() => setContractModalConfig({ isOpen: true, mode: 'create', preSelectedRoom: { propertyId: p.id, roomId: room.id, price: room.price, roomName: room.name, propertyAddress: p.address } })} className="bg-rentia-black text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-gray-800">
                                                  <Plus className="w-3 h-3"/> Crear Contrato
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              )})}
                          </div>
                      </div>
                  )}
              </div>
          )})}
      </div>

      {/* Contract Modal */}
      {contractModalConfig.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
                  <ContractManager 
                      initialMode={contractModalConfig.mode} 
                      preSelectedRoom={contractModalConfig.preSelectedRoom}
                      onClose={() => setContractModalConfig({ isOpen: false, mode: 'list' })} 
                  />
              </div>
          </div>
      )}
    </div>
  );
};