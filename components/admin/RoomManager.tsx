import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { properties as staticProperties, Property, Room } from '../../data/rooms';
import { Save, RefreshCw, Home, CheckCircle, ChevronDown, ChevronRight, Building, Plus, Trash2, X, MapPin, ExternalLink, Fan, Wind, Image as ImageIcon, FileText, Settings, Bed, Bath, Layout, Tv, Eye, PlayCircle, Monitor, Sun, Lock, User, AlertCircle, Hammer } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ContractManager } from './ContractManager';
import { Contract } from '../../types';

interface AdminProperty extends Property {
    // Extend if needed
}

// Helpers para fechas
const dateToInput = (dateStr?: string) => {
    if (!dateStr || dateStr === 'Inmediata' || dateStr === 'Consultar') return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`; 
};

const inputToDate = (isoDate: string) => {
    if (!isoDate) return 'Consultar';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`; 
};

export const RoomManager: React.FC = () => {
  const [properties, setProperties] = useState<AdminProperty[]>(staticProperties);
  const [contracts, setContracts] = useState<Contract[]>([]); // Estado para contratos
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedProp, setExpandedProp] = useState<string | null>(null);
  const [expandedRoomSettings, setExpandedRoomSettings] = useState<string | null>(null);
  
  // Estado del Modal de Contratos
  const [contractModalConfig, setContractModalConfig] = useState<{
      isOpen: boolean;
      mode: 'list' | 'create' | 'details';
      preSelectedRoom?: { propertyId: string, roomId: string, price: number, roomName: string, propertyAddress: string };
      contractId?: string;
  }>({ isOpen: false, mode: 'list' });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPropData, setNewPropData] = useState({ 
      address: '', 
      city: 'Murcia', 
      floor: '',
      bathrooms: 1,
      image: '',
      initialRooms: 3 
  });

  const fetchData = async () => {
    setLoading(true);
    setMessage(null);
    
    // 1. Cargar Propiedades (Público / Menos Restrictivo)
    try {
      const propsSnap = await getDocs(collection(db, "properties"));
      let firestoreProps: AdminProperty[] = [];
      
      propsSnap.forEach((doc) => {
          firestoreProps.push({ ...doc.data(), id: doc.id } as AdminProperty);
      });

      // Merge Logic for Admin: Ensure static properties exist or are shown
      const dbIds = new Set(firestoreProps.map(p => p.id));
      const missingStatics = staticProperties.filter(p => !dbIds.has(p.id));
      
      // If missing statics, we add them to the view (and optionally offer to sync them later)
      const combinedProps = [...firestoreProps, ...missingStatics];
      
      combinedProps.sort((a, b) => a.address.localeCompare(b.address));
      setProperties(combinedProps);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      setMessage({ type: 'error', text: "Error de conexión al cargar propiedades." });
    }

    // 2. Cargar Contratos (Restrictivo - Puede fallar si no hay permisos)
    try {
      const contractsSnap = await getDocs(collection(db, "contracts"));
      const contractsList: Contract[] = [];
      contractsSnap.forEach((doc) => {
          contractsList.push({ ...doc.data(), id: doc.id } as Contract);
      });
      setContracts(contractsList);
    } catch (error: any) {
      console.warn("No se pudieron cargar contratos (posiblemente falta de permisos de Staff):", error);
      // No mostramos error en UI para no bloquear la vista de habitaciones si solo fallan los contratos
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper para buscar contrato activo de una habitación
  const getActiveContract = (roomId: string) => {
      return contracts.find(c => c.roomId === roomId && (c.status === 'active' || c.status === 'reserved'));
  };

  const handleCreateProperty = async () => {
    if (!newPropData.address || !newPropData.city) {
        setMessage({ type: 'error', text: "Dirección y Ciudad son obligatorias." });
        return;
    }
    setSaving(true);
    try {
        const newId = `PROP_${Date.now()}`;
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${newPropData.address}, ${newPropData.city}`)}`;
        const initialRoomsList: Room[] = [];
        for (let i = 1; i <= newPropData.initialRooms; i++) {
            initialRoomsList.push({
                id: `${newId}_H${i}`,
                name: `H${i}`,
                price: 300,
                status: 'available',
                availableFrom: 'Inmediata',
                expenses: 'Gastos fijos aparte',
                targetProfile: 'both',
                hasAirConditioning: false,
                hasFan: false,
                images: []
            });
        }
        const newProperty: Property = {
            id: newId,
            address: newPropData.address,
            city: newPropData.city,
            floor: newPropData.floor,
            image: newPropData.image,
            bathrooms: newPropData.bathrooms,
            googleMapsLink: mapLink,
            rooms: initialRoomsList
        };
        await setDoc(doc(db, "properties", newId), newProperty);
        setMessage({ type: 'success', text: "Propiedad creada correctamente." });
        setIsCreating(false);
        setNewPropData({ address: '', city: 'Murcia', floor: '', bathrooms: 1, image: '', initialRooms: 3 });
        fetchData(); 
    } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: "Error al crear la propiedad." });
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteProperty = async (propId: string) => {
      if (!window.confirm("ATENCIÓN: ¿Estás seguro de ELIMINAR este piso?")) return;
      setSaving(true);
      try {
          await deleteDoc(doc(db, "properties", propId));
          // Update local state by removing it, but only if it was in DB.
          setProperties(prev => prev.filter(p => p.id !== propId));
      } catch (error) {
          setMessage({ type: 'error', text: "Error al eliminar (o era estático y no está en DB)." });
          setProperties(prev => prev.filter(p => p.id !== propId));
      } finally {
          setSaving(false);
      }
  };

  const handlePropertyFieldChange = (propId: string, field: keyof Property, value: string) => {
      setProperties(prevProps => prevProps.map(prop => {
          if (prop.id !== propId) return prop;
          return { ...prop, [field]: value };
      }));
  };

  const handleRoomChange = (propId: string, roomId: string, field: keyof Room, value: any) => {
    setProperties(prevProps => prevProps.map(prop => {
      if (prop.id !== propId) return prop;
      return {
        ...prop,
        rooms: prop.rooms.map(room => {
          if (room.id !== roomId) return room;
          return { ...room, [field]: value };
        })
      };
    }));
  };

  const handleRoomFeatureToggle = (propId: string, roomId: string, feature: string) => {
      setProperties(prevProps => prevProps.map(prop => {
          if (prop.id !== propId) return prop;
          return {
              ...prop,
              rooms: prop.rooms.map(room => {
                  if (room.id !== roomId) return room;
                  const currentFeatures = room.features || [];
                  const newFeatures = currentFeatures.includes(feature)
                      ? currentFeatures.filter(f => f !== feature)
                      : [...currentFeatures, feature];
                  return { ...room, features: newFeatures };
              })
          };
      }));
  };

  const handleRoomImageOperation = (propId: string, roomId: string, action: 'add' | 'remove' | 'update', index?: number, value?: string) => {
      setProperties(prevProps => prevProps.map(prop => {
          if (prop.id !== propId) return prop;
          return {
              ...prop,
              rooms: prop.rooms.map(room => {
                  if (room.id !== roomId) return room;
                  const currentImages = room.images || [];
                  let newImages = [...currentImages];
                  if (action === 'add' && value) newImages.push(value);
                  else if (action === 'remove' && index !== undefined) newImages = newImages.filter((_, i) => i !== index);
                  else if (action === 'update' && index !== undefined && value !== undefined) newImages[index] = value;
                  return { ...room, images: newImages };
              })
          };
      }));
  };

  const handleSaveAll = async (propId: string) => {
    const propToSave = properties.find(p => p.id === propId);
    if (!propToSave) return;

    setSaving(true);
    setMessage(null);
    try {
        const docRef = doc(db, "properties", propId);
        await setDoc(docRef, propToSave, { merge: true }); // Use setDoc with merge to ensure it creates if static didn't exist in DB
        
        setMessage({ type: 'success', text: "Guardado correctamente." });
        setTimeout(() => setShowSuccessModal(true), 100);
        setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error: any) {
        console.error("Error saving:", error);
        setMessage({ type: 'error', text: "Error al guardar." });
    } finally {
        setSaving(false);
    }
  };

  // --- RENDERIZADO DEL MODAL CONTRATOS ---
  if (contractModalConfig.isOpen) {
      return (
          <div className="fixed inset-0 z-50 bg-white overflow-hidden">
              <ContractManager 
                  initialMode={contractModalConfig.mode}
                  preSelectedRoom={contractModalConfig.preSelectedRoom}
                  contractId={contractModalConfig.contractId}
                  onClose={() => {
                      setContractModalConfig({ isOpen: false, mode: 'list' });
                      fetchData(); // Refresh to see status updates
                  }}
              />
          </div>
      );
  }

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-rentia-blue" />
            Gestión de Habitaciones
            </h3>
            <p className="text-xs text-gray-500 mt-1">Gestiona el inventario, precios y contratos.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={fetchData} 
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors" 
                title="Recargar datos"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={() => setIsCreating(true)} 
                className="bg-rentia-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
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
                      <input className="border p-2 rounded text-sm" placeholder="Planta (Ej: 3º Izq)" value={newPropData.floor} onChange={e => setNewPropData({...newPropData, floor: e.target.value})} />
                      <input type="number" className="border p-2 rounded text-sm" placeholder="Nº Baños" value={newPropData.bathrooms} onChange={e => setNewPropData({...newPropData, bathrooms: Number(e.target.value)})} />
                      <div className="md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 block mb-1">Nº Habitaciones Iniciales</label>
                          <input type="number" className="border p-2 rounded text-sm w-full" value={newPropData.initialRooms} onChange={e => setNewPropData({...newPropData, initialRooms: Number(e.target.value)})} />
                      </div>
                  </div>
                  <div className="flex justify-end">
                      <button onClick={handleCreateProperty} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-blue-700">
                          {saving ? 'Creando...' : 'Crear Propiedad'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Feedback Message */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
            {message.text}
        </div>
      )}

      {/* Property List */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50">
        {properties.map(prop => {
            const hasChanges = false; // Simplified for now
            return (
            <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Property Header Row */}
                <div className="p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedProp(expandedProp === prop.id ? null : prop.id)}>
                    <div className="flex items-center gap-3">
                        {expandedProp === prop.id ? <ChevronDown className="w-5 h-5 text-gray-400"/> : <ChevronRight className="w-5 h-5 text-gray-400"/>}
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                            {prop.image ? <img src={prop.image} className="w-full h-full object-cover rounded-lg" alt=""/> : <Home className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm">{prop.address}</h4>
                            <p className="text-xs text-gray-500">{prop.city} • {prop.rooms.length} Habs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => handleSaveAll(prop.id)}
                            className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                            <Save className="w-3 h-3" /> Guardar
                        </button>
                        <button onClick={() => handleDeleteProperty(prop.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Expanded Content */}
                {expandedProp === prop.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 animate-in slide-in-from-top-2">
                        
                        {/* Property General Info Edit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-lg border border-gray-200">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dirección</label>
                                <input className="w-full p-2 border rounded text-sm" value={prop.address} onChange={e => handlePropertyFieldChange(prop.id, 'address', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Enlace Mapa</label>
                                <div className="flex gap-2">
                                    <input className="w-full p-2 border rounded text-sm" value={prop.googleMapsLink} onChange={e => handlePropertyFieldChange(prop.id, 'googleMapsLink', e.target.value)} />
                                    <a href={prop.googleMapsLink} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 rounded text-gray-500 hover:text-blue-500"><ExternalLink className="w-4 h-4"/></a>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Foto Portada (URL)</label>
                                <input className="w-full p-2 border rounded text-sm" value={prop.image} onChange={e => handlePropertyFieldChange(prop.id, 'image', e.target.value)} />
                            </div>
                            <div className="flex items-end">
                                <ImageUploader folder="properties" onUploadComplete={(url) => handlePropertyFieldChange(prop.id, 'image', url)} compact label="Subir Portada" />
                            </div>
                        </div>

                        {/* Rooms Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            {prop.rooms.map((room, idx) => {
                                const activeContract = getActiveContract(room.id);
                                return (
                                <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Room Header */}
                                    <div className="p-3 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold bg-gray-200 px-2 py-1 rounded">{room.name}</span>
                                            <select 
                                                className={`text-xs font-bold px-2 py-1 rounded border outline-none ${
                                                    room.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    room.status === 'occupied' ? 'bg-red-100 text-red-700 border-red-200' : 
                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }`}
                                                value={room.status}
                                                onChange={(e) => handleRoomChange(prop.id, room.id, 'status', e.target.value)}
                                            >
                                                <option value="available">DISPONIBLE</option>
                                                <option value="occupied">ALQUILADA</option>
                                                <option value="reserved">RESERVADA</option>
                                            </select>
                                            
                                            {/* Contract Indicator */}
                                            {activeContract ? (
                                                <button 
                                                    onClick={() => setContractModalConfig({ isOpen: true, mode: 'details', contractId: activeContract.id })}
                                                    className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100"
                                                >
                                                    <FileText className="w-3 h-3" /> Contrato: {activeContract.tenantName}
                                                </button>
                                            ) : (
                                                room.status === 'occupied' && (
                                                    <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Sin contrato</span>
                                                )
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Quick Action: New Contract */}
                                            {room.status === 'available' && (
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
                                                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1 rounded font-bold transition-colors flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Alquilar
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={() => setExpandedRoomSettings(expandedRoomSettings === room.id ? null : room.id)}
                                                className={`p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 ${expandedRoomSettings === room.id ? 'bg-gray-200 text-gray-700' : ''}`}
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Edit Row */}
                                    <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Precio (€)</label>
                                            <input type="number" className="w-full p-1.5 border rounded text-sm font-bold text-gray-700" value={room.price} onChange={e => handleRoomChange(prop.id, room.id, 'price', Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Disponible Desde</label>
                                            <div className="flex gap-1">
                                                <input 
                                                    type="date" 
                                                    className="w-full p-1.5 border rounded text-xs text-gray-700" 
                                                    value={dateToInput(room.availableFrom)} 
                                                    onChange={e => handleRoomChange(prop.id, room.id, 'availableFrom', inputToDate(e.target.value))} 
                                                />
                                                <button onClick={() => handleRoomChange(prop.id, room.id, 'availableFrom', 'Inmediata')} className="text-[10px] px-2 bg-gray-100 hover:bg-green-100 rounded border">Ahora</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Gastos</label>
                                            <select className="w-full p-1.5 border rounded text-xs" value={room.expenses} onChange={e => handleRoomChange(prop.id, room.id, 'expenses', e.target.value)}>
                                                <option value="Gastos fijos aparte">Fijos Aparte</option>
                                                <option value="Se reparten los gastos">A Repartir</option>
                                                <option value="Gastos incluidos">Incluidos</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4">
                                            <button 
                                                onClick={() => handleRoomChange(prop.id, room.id, 'hasAirConditioning', !room.hasAirConditioning)}
                                                className={`p-1.5 rounded border ${room.hasAirConditioning ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                                                title="Aire Acondicionado"
                                            >
                                                <Wind className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleRoomChange(prop.id, room.id, 'specialStatus', room.specialStatus === 'renovation' ? undefined : 'renovation')}
                                                className={`p-1.5 rounded border ${room.specialStatus === 'renovation' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                                                title="En Reformas"
                                            >
                                                <Hammer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Settings */}
                                    {expandedRoomSettings === room.id && (
                                        <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-1">
                                            
                                            {/* Feature Toggles */}
                                            <div className="mb-4">
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Equipamiento Extra</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { id: 'balcony', icon: <Sun className="w-3 h-3"/>, label: 'Balcón' },
                                                        { id: 'smart_tv', icon: <Tv className="w-3 h-3"/>, label: 'Smart TV' },
                                                        { id: 'lock', icon: <Lock className="w-3 h-3"/>, label: 'Cerradura' },
                                                        { id: 'desk', icon: <Monitor className="w-3 h-3"/>, label: 'Escritorio' },
                                                    ].map(feat => (
                                                        <button
                                                            key={feat.id}
                                                            onClick={() => handleRoomFeatureToggle(prop.id, room.id, feat.id)}
                                                            className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 transition-all ${
                                                                room.features?.includes(feat.id) 
                                                                ? 'bg-rentia-blue text-white border-rentia-blue shadow-sm' 
                                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            {feat.icon} {feat.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Extended Details */}
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">Tipo de Cama</label>
                                                    <select 
                                                        className="w-full p-2 border rounded text-xs bg-white"
                                                        value={room.bedType || ''}
                                                        onChange={(e) => handleRoomChange(prop.id, room.id, 'bedType', e.target.value)}
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        <option value="single">Individual (90cm)</option>
                                                        <option value="double">Doble (135cm)</option>
                                                        <option value="king">King (150cm+)</option>
                                                        <option value="sofa">Sofá Cama</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">Tamaño (m²)</label>
                                                    <input 
                                                        type="number" 
                                                        className="w-full p-2 border rounded text-xs" 
                                                        value={room.sqm || ''}
                                                        onChange={(e) => handleRoomChange(prop.id, room.id, 'sqm', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">Descripción Pública</label>
                                                    <textarea 
                                                        className="w-full p-2 border rounded text-xs h-16 resize-none"
                                                        placeholder="Detalles específicos de la habitación..."
                                                        value={room.description || ''}
                                                        onChange={(e) => handleRoomChange(prop.id, room.id, 'description', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Image Management */}
                                            <div>
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Galería Habitación</h5>
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {room.images?.map((img, i) => (
                                                        <div key={i} className="relative w-20 h-20 flex-shrink-0 group">
                                                            <img src={img} className="w-full h-full object-cover rounded border border-gray-200" alt=""/>
                                                            <button 
                                                                onClick={() => handleRoomImageOperation(prop.id, room.id, 'remove', i)}
                                                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer relative overflow-hidden">
                                                        <div className="text-center">
                                                            <Plus className="w-6 h-6 text-gray-400 mx-auto" />
                                                            <span className="text-[9px] text-gray-400">Añadir</span>
                                                        </div>
                                                        <div className="absolute inset-0 opacity-0 cursor-pointer">
                                                            <ImageUploader 
                                                                folder={`rooms/${prop.id}/${room.id}`} 
                                                                onUploadComplete={(url) => handleRoomImageOperation(prop.id, room.id, 'add', undefined, url)} 
                                                                label=""
                                                                compact
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
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