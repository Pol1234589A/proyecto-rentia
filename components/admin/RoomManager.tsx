
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { properties as staticProperties, Property, Room, CleaningConfig } from '../../data/rooms';
import { Save, RefreshCw, Home, ChevronDown, ChevronRight, Building, Plus, Trash2, X, MapPin, ExternalLink, Wind, Image as ImageIcon, FileText, Settings, Hammer, DollarSign, Percent, Sun, Tv, Lock, Monitor, AlertCircle, User, CheckCircle, Sparkles, Clock, Euro, Calendar } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ContractManager } from './ContractManager';
import { Contract } from '../../types';

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
  const [loading, setLoading] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Properties
      const querySnapshot = await getDocs(collection(db, "properties"));
      const props: Property[] = [];
      querySnapshot.forEach((doc) => {
        props.push({ ...doc.data(), id: doc.id } as Property);
      });
      
      // Merge with static if needed, or just use DB.
      if (props.length === 0) {
          setProperties(staticProperties);
      } else {
          // Sort by address
          props.sort((a,b) => a.address.localeCompare(b.address));
          setProperties(props);
      }

      // Fetch Contracts
      const contractsSnap = await getDocs(collection(db, "contracts"));
      const contractsData: Contract[] = [];
      contractsSnap.forEach((doc) => {
          contractsData.push({ ...doc.data(), id: doc.id } as Contract);
      });
      setContracts(contractsData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getActiveContract = (roomId: string) => {
      return contracts.find(c => c.roomId === roomId && (c.status === 'active' || c.status === 'reserved'));
  };

  const handleCreateProperty = async () => {
      setSaving(true);
      try {
          const newId = newPropData.address.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10) + Date.now().toString().slice(-4);
          
          const newRooms: Room[] = [];
          for(let i=1; i<=newPropData.initialRooms; i++) {
              newRooms.push({
                  id: `${newId}_H${i}`,
                  name: `H${i}`,
                  price: 300,
                  status: 'available',
                  availableFrom: 'Inmediata',
                  expenses: 'Gastos fijos aparte',
                  targetProfile: 'both',
                  features: ['lock', 'desk'],
                  commissionType: 'percentage',
                  commissionValue: 10
              });
          }

          const newProp: Property = {
              id: newId,
              address: newPropData.address,
              city: newPropData.city,
              floor: newPropData.floor,
              bathrooms: newPropData.bathrooms,
              image: '',
              googleMapsLink: '',
              rooms: newRooms
          };

          await setDoc(doc(db, "properties", newId), newProp);
          setIsCreating(false);
          setNewPropData({ address: '', city: 'Murcia', floor: '', bathrooms: 1, image: '', initialRooms: 3 });
          fetchData();
      } catch (error) {
          console.error(error);
          alert("Error al crear propiedad");
      } finally {
          setSaving(false);
      }
  };

  const handleDeleteProperty = async (propId: string) => {
      if(!confirm("¿Seguro que quieres eliminar esta propiedad y todas sus habitaciones?")) return;
      try {
          await deleteDoc(doc(db, "properties", propId));
          fetchData();
      } catch (error) {
          console.error(error);
      }
  };

  const handlePropertyFieldChange = (propId: string, field: keyof Property, value: any) => {
      setProperties(prev => prev.map(p => p.id === propId ? { ...p, [field]: value } : p));
  };

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
          const newDays = config.days.includes(day) 
              ? config.days.filter(d => d !== day)
              : [...config.days, day];
          return { ...p, cleaningConfig: { ...config, days: newDays } };
      }));
  };

  const handleRoomChange = (propId: string, roomId: string, field: keyof Room, value: any) => {
      setProperties(prev => prev.map(p => {
          if (p.id !== propId) return p;
          return {
              ...p,
              rooms: p.rooms.map(r => r.id === roomId ? { ...r, [field]: value } : r)
          };
      }));
  };

  // Función específica para añadir imágenes a una habitación de forma segura (sin closures obsoletos)
  const addRoomImage = (propId: string, roomId: string, url: string) => {
      setProperties(prevProperties => {
          return prevProperties.map(p => {
              if (p.id !== propId) return p;
              return {
                  ...p,
                  rooms: p.rooms.map(r => {
                      if (r.id !== roomId) return r;
                      const currentImages = r.images || [];
                      // Evitar duplicados
                      if (!currentImages.includes(url)) {
                          return { ...r, images: [...currentImages, url] };
                      }
                      return r;
                  })
              };
          });
      });
  };

  const handleRoomFeatureToggle = (propId: string, roomId: string, feature: string) => {
      setProperties(prev => prev.map(p => {
          if (p.id !== propId) return p;
          return {
              ...p,
              rooms: p.rooms.map(r => {
                  if (r.id !== roomId) return r;
                  const currentFeatures = r.features || [];
                  const newFeatures = currentFeatures.includes(feature) 
                      ? currentFeatures.filter(f => f !== feature)
                      : [...currentFeatures, feature];
                  return { ...r, features: newFeatures };
              })
          };
      }));
  };

  const handleSaveAll = async (propId: string) => {
      const prop = properties.find(p => p.id === propId);
      if(!prop) return;
      setSaving(true);
      try {
          await setDoc(doc(db, "properties", propId), prop);
          alert("Guardado correctamente");
      } catch (error) {
          console.error(error);
          alert("Error al guardar");
      } finally {
          setSaving(false);
      }
  };

  if (contractModalConfig.isOpen) {
      return (
          <div className="fixed inset-0 z-[10001] bg-white overflow-hidden">
              <ContractManager 
                  initialMode={contractModalConfig.mode}
                  preSelectedRoom={contractModalConfig.preSelectedRoom}
                  contractId={contractModalConfig.contractId}
                  onClose={() => {
                      setContractModalConfig({ isOpen: false, mode: 'list' });
                      fetchData();
                  }}
              />
          </div>
      );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-rentia-blue" />
            Gestión de Habitaciones
            </h3>
            <p className="text-xs text-gray-500 mt-1">Gestiona el inventario, precios, propietarios y contratos.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
                onClick={fetchData} 
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0" 
                title="Recargar datos"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={() => setIsCreating(true)} 
                className="bg-rentia-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 flex-grow sm:flex-grow-0 justify-center"
            >
                <Plus className="w-4 h-4" /> Nuevo Piso
            </button>
        </div>
      </div>

      {/* CREACIÓN NUEVO PISO */}
      {isCreating && (
          <div className="bg-blue-50 p-6 border-b border-blue-100 animate-in slide-in-from-top-4">
              <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-800">Registrar Nueva Propiedad</h4>
                      <button onClick={() => setIsCreating(false)}><X className="w-4 h-4 text-gray-400"/></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input className="border p-2 rounded text-sm" placeholder="Dirección (Calle, Nº)" value={newPropData.address} onChange={e => setNewPropData({...newPropData, address: e.target.value})} />
                      <input className="border p-2 rounded text-sm" placeholder="Ciudad" value={newPropData.city} onChange={e => setNewPropData({...newPropData, city: e.target.value})} />
                      <input className="border p-2 rounded text-sm" placeholder="Planta (ej: 3º Izq)" value={newPropData.floor} onChange={e => setNewPropData({...newPropData, floor: e.target.value})} />
                      <input type="number" className="border p-2 rounded text-sm" placeholder="Nº Habitaciones Iniciales" value={newPropData.initialRooms} onChange={e => setNewPropData({...newPropData, initialRooms: Number(e.target.value)})} />
                  </div>
                  <div className="flex justify-end">
                      <button onClick={handleCreateProperty} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-blue-700">
                          {saving ? 'Creando...' : 'Crear Propiedad'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* LISTA DE PROPIEDADES */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50">
        {properties.map(prop => {
            return (
            <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white hover:bg-gray-50 transition-colors cursor-pointer gap-4" onClick={() => setExpandedProp(expandedProp === prop.id ? null : prop.id)}>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {expandedProp === prop.id ? <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0"/> : <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0"/>}
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                            {prop.image ? <img src={prop.image} className="w-full h-full object-cover rounded-lg" alt=""/> : <Home className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm truncate">{prop.address}</h4>
                            <p className="text-xs text-gray-500">{prop.city} • {prop.rooms.length} Habs</p>
                        </div>
                    </div>
                    {/* Botones de acción en cabecera */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProperty(prop.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* DETALLE EXPANDIDO */}
                {expandedProp === prop.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 animate-in slide-in-from-top-2">
                        {/* Configuración General Piso */}
                        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                            <h5 className="font-bold text-xs text-gray-500 uppercase mb-3 flex items-center gap-2"><Settings className="w-3 h-3"/> Configuración Propiedad</h5>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <input value={prop.address} onChange={(e) => handlePropertyFieldChange(prop.id, 'address', e.target.value)} className="border p-2 rounded text-sm" placeholder="Dirección" />
                                <input value={prop.floor} onChange={(e) => handlePropertyFieldChange(prop.id, 'floor', e.target.value)} className="border p-2 rounded text-sm" placeholder="Planta" />
                                <input value={prop.googleMapsLink} onChange={(e) => handlePropertyFieldChange(prop.id, 'googleMapsLink', e.target.value)} className="border p-2 rounded text-sm" placeholder="Link Maps" />
                                {/* Nuevo campo: Día de Transferencia */}
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400"/>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="31"
                                        value={prop.transferDay || ''} 
                                        onChange={(e) => handlePropertyFieldChange(prop.id, 'transferDay', Number(e.target.value))} 
                                        className="border p-2 pl-9 rounded text-sm w-full" 
                                        placeholder="Día Pago (1-31)" 
                                        title="Día de transferencia al propietario"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <ImageUploader folder="properties" label="Portada" compact onUploadComplete={(url) => handlePropertyFieldChange(prop.id, 'image', url)} />
                            </div>

                            {/* SECCIÓN CONFIGURACIÓN LIMPIEZA */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <h6 className="font-bold text-sm text-indigo-900">Servicio de Limpieza (App Inquilino)</h6>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded border border-indigo-200">
                                        <input 
                                            type="checkbox" 
                                            checked={prop.cleaningConfig?.enabled || false} 
                                            onChange={(e) => handleCleaningChange(prop.id, 'enabled', e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-indigo-700">Activar Servicio</span>
                                    </label>
                                    
                                    {prop.cleaningConfig?.enabled && (
                                        <>
                                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-indigo-200">
                                                <Clock className="w-3 h-3 text-indigo-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Horario (10:00 - 13:00)" 
                                                    className="text-xs border-none focus:ring-0 w-32 p-0"
                                                    value={prop.cleaningConfig?.hours || ''}
                                                    onChange={(e) => handleCleaningChange(prop.id, 'hours', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-indigo-200">
                                                <Euro className="w-3 h-3 text-indigo-400" />
                                                <input 
                                                    type="number" 
                                                    placeholder="Coste/Hora" 
                                                    className="text-xs border-none focus:ring-0 w-20 p-0"
                                                    value={prop.cleaningConfig?.costPerHour || ''}
                                                    onChange={(e) => handleCleaningChange(prop.id, 'costPerHour', Number(e.target.value))}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {prop.cleaningConfig?.enabled && (
                                    <div className="flex flex-wrap gap-2">
                                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                                            <button
                                                key={day}
                                                onClick={() => toggleCleaningDay(prop.id, day)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                                    prop.cleaningConfig?.days.includes(day)
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-white text-gray-500 border border-indigo-100 hover:border-indigo-300'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-4">
                                <button onClick={() => handleSaveAll(prop.id)} className="bg-rentia-black text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2 hover:bg-gray-800"><Save className="w-3 h-3"/> Guardar Todo</button>
                            </div>
                        </div>

                        {/* Lista Habitaciones */}
                        <div className="grid grid-cols-1 gap-4">
                            {prop.rooms.map((room, idx) => {
                                const contract = getActiveContract(room.id);
                                return (
                                <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rentia-blue"></div>
                                    <div className="p-4 flex flex-col gap-4">
                                        
                                        {/* Fila 1: Título y Precio */}
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-3">
                                                <input value={room.name} onChange={(e) => handleRoomChange(prop.id, room.id, 'name', e.target.value)} className="font-bold text-sm w-16 bg-gray-50 border border-gray-200 rounded px-2 py-1" />
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${room.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{room.status}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-500">Precio:</span>
                                                <input type="number" value={room.price} onChange={(e) => handleRoomChange(prop.id, room.id, 'price', Number(e.target.value))} className="w-20 font-bold text-rentia-blue bg-blue-50 border border-blue-100 rounded px-2 py-1 text-right" />
                                                <span className="text-xs text-gray-400">€</span>
                                            </div>
                                        </div>

                                        {/* Fila 2: Estados y Fechas */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Estado</label>
                                                <select value={room.status} onChange={(e) => handleRoomChange(prop.id, room.id, 'status', e.target.value)} className="w-full border rounded p-1.5 bg-white text-xs">
                                                    <option value="available">Disponible</option>
                                                    <option value="occupied">Ocupada</option>
                                                    <option value="reserved">Reservada</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Disponibilidad</label>
                                                <input type="date" value={dateToInput(room.availableFrom)} onChange={(e) => handleRoomChange(prop.id, room.id, 'availableFrom', inputToDate(e.target.value))} className="w-full border rounded p-1.5 text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Gastos</label>
                                                <select value={room.expenses} onChange={(e) => handleRoomChange(prop.id, room.id, 'expenses', e.target.value)} className="w-full border rounded p-1.5 bg-white text-xs">
                                                    <option value="Gastos fijos aparte">Fijos aparte</option>
                                                    <option value="Se reparten los gastos">A repartir</option>
                                                    <option value="Gastos incluidos">Incluidos</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Perfil</label>
                                                <select value={room.targetProfile} onChange={(e) => handleRoomChange(prop.id, room.id, 'targetProfile', e.target.value)} className="w-full border rounded p-1.5 bg-white text-xs">
                                                    <option value="both">Indiferente</option>
                                                    <option value="students">Estudiantes</option>
                                                    <option value="workers">Trabajadores</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Fila 3: Características (Checkboxes) */}
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                {id: 'lock', icon: <Lock className="w-3 h-3"/>, label: 'Llave'},
                                                {id: 'balcony', icon: <Sun className="w-3 h-3"/>, label: 'Balcón'},
                                                {id: 'smart_tv', icon: <Tv className="w-3 h-3"/>, label: 'TV'},
                                                {id: 'desk', icon: <Monitor className="w-3 h-3"/>, label: 'Escritorio'},
                                            ].map(feat => (
                                                <button 
                                                    key={feat.id} 
                                                    onClick={() => handleRoomFeatureToggle(prop.id, room.id, feat.id)}
                                                    className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 ${room.features?.includes(feat.id) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                                                >
                                                    {feat.icon} {feat.label}
                                                </button>
                                            ))}
                                            
                                            <button 
                                                onClick={() => handleRoomChange(prop.id, room.id, 'hasAirConditioning', !room.hasAirConditioning)}
                                                className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 ${room.hasAirConditioning ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                                            >
                                                <Wind className="w-3 h-3" /> A/C
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleRoomChange(prop.id, room.id, 'specialStatus', room.specialStatus === 'renovation' ? undefined : 'renovation')}
                                                className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 ${room.specialStatus === 'renovation' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                                            >
                                                <Hammer className="w-3 h-3" /> Reformas
                                            </button>
                                        </div>

                                        {/* Fila 4: Gestión Avanzada (Contratos e Imágenes) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                                            {/* Contratos */}
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><FileText className="w-3 h-3"/> Contrato Activo</span>
                                                    {contract ? (
                                                        <button 
                                                            onClick={() => setContractModalConfig({ isOpen: true, mode: 'details', contractId: contract.id })}
                                                            className="text-[10px] text-blue-600 font-bold hover:underline"
                                                        >
                                                            Ver Detalles
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => setContractModalConfig({ 
                                                                isOpen: true, 
                                                                mode: 'create', 
                                                                preSelectedRoom: { 
                                                                    propertyId: prop.id, 
                                                                    roomId: room.id, 
                                                                    price: room.price, 
                                                                    roomName: room.name, 
                                                                    propertyAddress: prop.address 
                                                                } 
                                                            })}
                                                            className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold hover:bg-green-200 transition-colors"
                                                        >
                                                            + Crear Contrato
                                                        </button>
                                                    )}
                                                </div>
                                                {contract ? (
                                                    <div className="text-xs text-gray-700 flex items-center gap-2">
                                                        <User className="w-3 h-3 text-gray-400"/>
                                                        <span className="font-bold">{contract.tenantName}</span>
                                                        <span className="text-gray-400 text-[10px]">({new Date(contract.endDate).toLocaleDateString()})</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400 italic">Sin inquilino asignado</div>
                                                )}
                                            </div>

                                            {/* Imágenes */}
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Fotos ({room.images?.length || 0})</span>
                                                    <div className="scale-75 origin-right">
                                                        <ImageUploader 
                                                            folder={`rooms/${room.id}`} 
                                                            compact 
                                                            onUploadComplete={(url) => addRoomImage(prop.id, room.id, url)} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                                    {room.images && room.images.map((img, idx) => (
                                                        <div key={idx} className="relative w-8 h-8 flex-shrink-0 group">
                                                            <img src={img} className="w-full h-full object-cover rounded border border-gray-300" />
                                                            <button 
                                                                onClick={() => {
                                                                    const newImages = room.images!.filter((_, i) => i !== idx);
                                                                    handleRoomChange(prop.id, room.id, 'images', newImages);
                                                                }}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-2 h-2"/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            );
        })}
      </div>
    </div>
  );
};
