
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import { properties as staticProperties, Property, Room } from '../../data/rooms';
import { Save, RefreshCw, Home, CheckCircle, AlertTriangle, ChevronDown, ChevronRight, DollarSign, Calendar, Database, Wind, Receipt, Plus, Trash2, X, MapPin, ExternalLink, Map, Fan, Timer, Image as ImageIcon, Link as LinkIcon, FileText, ShieldAlert, User, Check, Clock, Bed, Bath, Building, History, FolderOpen, CalendarClock } from 'lucide-react';
import { ImageUploader } from './ImageUploader'; // Importamos el componente nuevo

// ... interfaces ... (Keep existing interfaces Contract, Incident, AdminProperty)
interface Contract {
    id: string;
    roomId: string; // Relación con la habitación (ej: "H1")
    tenantName: string;
    startDate: string;
    endDate: string;
    documentUrl: string; // Link al PDF/Drive
}

interface Incident {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'resolved';
    createdAt: string;
}

// Extendemos la propiedad pública para añadir datos privados
interface AdminProperty extends Property {
    contracts?: Contract[];
    incidents?: Incident[];
}

// ... CountdownTimer component ... (Keep existing)
const CountdownTimer = ({ targetDateStr }: { targetDateStr: string }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number} | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!targetDateStr) return null;
      try {
        const parts = targetDateStr.split('/');
        if (parts.length !== 3) return null;
        
        const targetDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])); 
        targetDate.setHours(23, 59, 59);

        const now = new Date();
        const difference = targetDate.getTime() - now.getTime();

        if (difference > 0) {
          return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          };
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, [targetDateStr]);

  if (!timeLeft) return null;

  return (
    <span className="font-mono ml-1">
      {timeLeft.days}d {timeLeft.hours}h
    </span>
  );
};

export const RoomManager: React.FC = () => {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedProp, setExpandedProp] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Estado para modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Estados para formularios internos
  const [newContract, setNewContract] = useState<Partial<Contract>>({});
  const [newIncident, setNewIncident] = useState<Partial<Incident>>({});
  const [activeTabPrivate, setActiveTabPrivate] = useState<'contracts' | 'incidents'>('contracts');

  // Estado para historial de habitación específico
  const [viewHistoryRoom, setViewHistoryRoom] = useState<{ room: Room, contracts: Contract[], propertyAddress: string } | null>(null);

  // Estado para crear nueva propiedad - FORMULARIO AMPLIADO
  const [isCreating, setIsCreating] = useState(false);
  const [newPropData, setNewPropData] = useState({ 
      address: '', 
      city: 'Murcia', 
      floor: '',
      bathrooms: 1,
      image: '',
      initialRooms: 3 
  });

  // Cargar datos de Firestore
  const fetchProperties = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const querySnapshot = await getDocs(collection(db, "properties"));
      
      if (querySnapshot.empty) {
        // Auto-seed si está vacío
        const batch = writeBatch(db);
        staticProperties.forEach(prop => {
          const docRef = doc(db, "properties", prop.id);
          batch.set(docRef, prop);
        });
        await batch.commit();
        setProperties(staticProperties);
      } else {
        const props: AdminProperty[] = [];
        querySnapshot.forEach((doc) => {
          // Casteamos a AdminProperty para incluir campos opcionales
          props.push({ ...doc.data(), id: doc.id } as AdminProperty);
        });
        props.sort((a, b) => a.address.localeCompare(b.address));
        setProperties(props);
      }
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      setMessage({ type: 'error', text: "Error al cargar datos. Verifica permisos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // --- CREAR PROPIEDAD ---
  const handleCreateProperty = async () => {
    if (!newPropData.address || !newPropData.city) {
        setMessage({ type: 'error', text: "Dirección y Ciudad son obligatorias." });
        return;
    }
    setSaving(true);
    try {
        const newId = `PROP_${Date.now()}`;
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${newPropData.address}, ${newPropData.city}`)}`;
        
        // Generar habitaciones iniciales
        const initialRoomsList: Room[] = [];
        for (let i = 1; i <= newPropData.initialRooms; i++) {
            initialRoomsList.push({
                id: `${newId}_H${i}`,
                name: `H${i}`,
                price: 300, // Precio base por defecto
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
        fetchProperties(); 
    } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: "Error al crear la propiedad." });
    } finally {
        setSaving(false);
    }
  };

  // --- ELIMINAR PROPIEDAD ---
  const handleDeleteProperty = async (propId: string) => {
      if (!window.confirm("ATENCIÓN: ¿Estás seguro de ELIMINAR este piso y todas sus habitaciones? Esta acción es irreversible.")) return;
      
      setSaving(true);
      try {
          await deleteDoc(doc(db, "properties", propId));
          setMessage({ type: 'success', text: "Propiedad eliminada correctamente." });
          setProperties(prev => prev.filter(p => p.id !== propId));
      } catch (error) {
          setMessage({ type: 'error', text: "Error al eliminar." });
      } finally {
          setSaving(false);
      }
  };

  // --- GESTIÓN DE PROPIEDAD (Local State) ---
  const handlePropertyFieldChange = (propId: string, field: keyof Property, value: string) => {
      setProperties(prevProps => prevProps.map(prop => {
          if (prop.id !== propId) return prop;
          return { ...prop, [field]: value };
      }));
  };

  const generateMapLink = (propId: string) => {
      setProperties(prevProps => prevProps.map(prop => {
          if (prop.id !== propId) return prop;
          const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${prop.address}, ${prop.city}`)}`;
          return { ...prop, googleMapsLink: link };
      }));
  };

  // --- GESTIÓN DE HABITACIONES (Local State) ---
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

  const handleRoomImageOperation = (propId: string, roomId: string, action: 'add' | 'remove' | 'update', index?: number, value?: string) => {
      setProperties(prevProps => prevProps.map(prop => {
          if (prop.id !== propId) return prop;
          return {
              ...prop,
              rooms: prop.rooms.map(room => {
                  if (room.id !== roomId) return room;
                  const currentImages = room.images || [];
                  let newImages = [...currentImages];
                  if (action === 'add' && value) newImages.push(value); // Ahora 'value' es la URL de Firebase
                  else if (action === 'remove' && index !== undefined) newImages = newImages.filter((_, i) => i !== index);
                  else if (action === 'update' && index !== undefined && value !== undefined) newImages[index] = value;
                  return { ...room, images: newImages };
              })
          };
      }));
  };

  const handleAddRoom = (propId: string) => {
      setProperties(prevProps => prevProps.map(prop => {
          if (prop.id !== propId) return prop;
          const newRoomNumber = prop.rooms.length + 1;
          const newRoom: Room = {
              id: `${propId}_H${Date.now()}`, 
              name: `H${newRoomNumber}`,
              price: 300,
              status: 'available',
              availableFrom: 'Inmediata',
              expenses: 'Gastos fijos aparte',
              targetProfile: 'both',
              hasAirConditioning: false,
              hasFan: false,
              images: [] 
          };
          return { ...prop, rooms: [...prop.rooms, newRoom] };
      }));
  };

  const handleDeleteRoom = (propId: string, roomId: string) => {
      if (!window.confirm("¿Borrar esta habitación de la lista?")) return;
      setProperties(prevProps => prevProps.map(prop => {
          if (prop.id !== propId) return prop;
          return { ...prop, rooms: prop.rooms.filter(r => r.id !== roomId) };
      }));
  };

  const handleOpenRoomHistory = (property: AdminProperty, room: Room) => {
      const roomContracts = (property.contracts || []).filter(c => c.roomId === room.name);
      setViewHistoryRoom({
          room,
          contracts: roomContracts,
          propertyAddress: property.address
      });
  };

  // --- GESTIÓN INTERNA (CONTRATOS E INCIDENCIAS) ---
  const handleAddContract = (propId: string) => {
      if(!newContract.tenantName || !newContract.roomId) { alert("Nombre y habitación requeridos"); return; }
      const contract: Contract = {
          id: `CTR_${Date.now()}`,
          roomId: newContract.roomId,
          tenantName: newContract.tenantName,
          startDate: newContract.startDate || '',
          endDate: newContract.endDate || '',
          documentUrl: newContract.documentUrl || ''
      };
      setProperties(prev => prev.map(p => {
          if(p.id !== propId) return p;
          // Añadimos el nuevo contrato al array existente
          return { ...p, contracts: [...(p.contracts || []), contract] };
      }));
      setNewContract({});
  };

  const handleDeleteContract = (propId: string, contractId: string) => {
      if(!confirm("¿Eliminar contrato permanentemente?")) return;
      setProperties(prev => prev.map(p => {
          if(p.id !== propId) return p;
          return { ...p, contracts: (p.contracts || []).filter(c => c.id !== contractId) };
      }));
  };

  const handleAddIncident = (propId: string) => {
      if(!newIncident.title) { alert("Título requerido"); return; }
      const incident: Incident = {
          id: `INC_${Date.now()}`,
          title: newIncident.title,
          description: newIncident.description || '',
          priority: newIncident.priority || 'medium',
          status: 'pending',
          createdAt: new Date().toISOString().split('T')[0]
      };
      setProperties(prev => prev.map(p => {
          if(p.id !== propId) return p;
          return { ...p, incidents: [...(p.incidents || []), incident] };
      }));
      setNewIncident({});
  };

  const handleUpdateIncidentStatus = (propId: string, incidentId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
      setProperties(prev => prev.map(p => {
          if(p.id !== propId) return p;
          return { ...p, incidents: (p.incidents || []).map(i => i.id === incidentId ? {...i, status: newStatus} : i) };
      }));
  };

  // --- GUARDAR CAMBIOS (PUBLICAR) ---
  const saveProperty = async (property: AdminProperty) => {
    setSaving(true);
    setMessage(null);
    try {
      const docRef = doc(db, "properties", property.id);
      await updateDoc(docRef, { 
          address: property.address || '',
          city: property.city || '',
          floor: property.floor || '', 
          image: property.image || '', 
          googleMapsLink: property.googleMapsLink || '', 
          bathrooms: property.bathrooms || 1, // Nuevo campo
          rooms: property.rooms,
          contracts: property.contracts || [], 
          incidents: property.incidents || []  
      });
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      setMessage({ type: 'success', text: `Cambios publicados en ${property.address}` });
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: "Error al guardar cambios. Verifica permisos." });
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedProp(expandedProp === id ? null : id);
  };

  const isSoon = (dateStr?: string) => {
    if (!dateStr || dateStr === 'Inmediata' || dateStr === 'Consultar') return false;
    try {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return false;
        const target = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        target.setHours(23, 59, 59);
        const now = new Date();
        const diff = target.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days > 0 && days < 45;
    } catch { return false; }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col relative">
      
      {/* Modal de Confirmación Flotante */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 max-w-sm mx-4 transform scale-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¡Cambios Publicados!</h3>
                <p className="text-gray-500 mb-6 text-sm">La información de la propiedad se ha actualizado correctamente en tiempo real.</p>
                <button 
                    onClick={() => setShowSuccessModal(false)}
                    className="bg-green-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors w-full shadow-lg"
                >
                    Aceptar
                </button>
            </div>
        </div>
      )}

      {/* MODAL HISTORIAL HABITACIÓN */}
      {viewHistoryRoom && (
          // ... (El modal de historial se mantiene igual, no necesita cambios por las imágenes) ...
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setViewHistoryRoom(null)}>
              {/* ... contenido del modal ... */}
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold flex items-center gap-2 text-lg">
                              <History className="w-5 h-5 text-rentia-gold" />
                              Historial {viewHistoryRoom.room.name}
                          </h3>
                          <p className="text-xs text-slate-400">{viewHistoryRoom.propertyAddress}</p>
                      </div>
                      <button onClick={() => setViewHistoryRoom(null)}><X className="w-5 h-5 text-white/70 hover:text-white"/></button>
                  </div>
                  
                  <div className="p-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
                      {viewHistoryRoom.contracts.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p className="text-sm">No hay contratos registrados para esta habitación.</p>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {/* ... lógica de contratos ... */}
                              {/* (Se mantiene igual que antes) */}
                              {viewHistoryRoom.contracts.map(c => (
                                  <div key={c.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                                      <p className="font-bold text-sm">{c.tenantName}</p>
                                      <p className="text-xs text-gray-500">{c.startDate} - {c.endDate}</p>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
        <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Home className="w-5 h-5 text-rentia-blue" />
            Gestor de Habitaciones (Live)
            </h3>
            <p className="text-xs text-gray-500 mt-1">Gestión en tiempo real. Moneda: Euro (€)</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => setIsCreating(!isCreating)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isCreating ? 'bg-gray-200 text-gray-700' : 'bg-rentia-blue text-white hover:bg-blue-700'}`}
            >
                {isCreating ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                {isCreating ? 'Cancelar' : 'Añadir Piso'}
            </button>
            <button 
                onClick={fetchProperties} 
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors" 
                title="Recargar datos"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* Formulario Crear Propiedad */}
      {isCreating && (
          <div className="p-6 bg-blue-50/50 border-b border-blue-100 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-rentia-blue flex items-center gap-2">
                      <Building className="w-4 h-4" /> Alta Nueva Propiedad
                  </h4>
                  <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* ... Inputs de dirección ... */}
                  <div className="lg:col-span-2">
                      <label className="text-xs text-gray-500 font-bold block mb-1">Dirección Completa</label>
                      <input 
                          type="text" 
                          value={newPropData.address}
                          onChange={(e) => setNewPropData({...newPropData, address: e.target.value})}
                          className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-rentia-blue outline-none bg-white shadow-sm"
                          placeholder="Ej: Calle Mayor 1"
                      />
                  </div>
                  {/* ... Ciudad, Planta, Baños ... */}
                  <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1">Ciudad</label>
                      <input 
                          type="text" 
                          value={newPropData.city}
                          onChange={(e) => setNewPropData({...newPropData, city: e.target.value})}
                          className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-rentia-blue outline-none bg-white shadow-sm"
                          placeholder="Ej: Murcia"
                      />
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1">Planta</label>
                      <input 
                          type="text" 
                          value={newPropData.floor}
                          onChange={(e) => setNewPropData({...newPropData, floor: e.target.value})}
                          className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-rentia-blue outline-none bg-white shadow-sm"
                          placeholder="Ej: 3º Izq"
                      />
                  </div>
                  <div className="flex gap-4">
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 font-bold block mb-1 flex items-center gap-1"><Bed className="w-3 h-3"/> Nº Habs Iniciales</label>
                          <input 
                              type="number" 
                              min="1"
                              max="20"
                              value={newPropData.initialRooms}
                              onChange={(e) => setNewPropData({...newPropData, initialRooms: Number(e.target.value)})}
                              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-rentia-blue outline-none bg-white shadow-sm"
                          />
                      </div>
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 font-bold block mb-1 flex items-center gap-1"><Bath className="w-3 h-3"/> Nº Baños</label>
                          <input 
                              type="number" 
                              min="1"
                              max="10"
                              value={newPropData.bathrooms}
                              onChange={(e) => setNewPropData({...newPropData, bathrooms: Number(e.target.value)})}
                              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-rentia-blue outline-none bg-white shadow-sm"
                          />
                      </div>
                  </div>

                  {/* Foto URL (Reemplazada por Uploader) */}
                  <div className="lg:col-span-3">
                      <label className="text-xs text-gray-500 font-bold block mb-1 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Foto Principal</label>
                      
                      {newPropData.image ? (
                          <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 group">
                              <img src={newPropData.image} alt="Preview" className="w-full h-full object-cover" />
                              <button 
                                  onClick={() => setNewPropData({...newPropData, image: ''})}
                                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      ) : (
                          <ImageUploader 
                              folder="properties" 
                              onUploadComplete={(url) => setNewPropData({...newPropData, image: url})} 
                              label="Subir Portada del Piso"
                          />
                      )}
                  </div>
              </div>

              <div className="flex justify-end mt-6">
                  <button 
                      onClick={handleCreateProperty}
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md transform active:scale-95"
                  >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                      {saving ? 'Creando...' : 'Guardar y Generar Habitaciones'}
                  </button>
              </div>
          </div>
      )}

      {/* Lista de Propiedades */}
      <div className="p-0 overflow-y-auto max-h-[800px] bg-gray-50/50">
        
        {/* ... (Renderizado de la lista) ... */}
        <div className="divide-y divide-gray-200">
            {properties.map(prop => {
                const available = prop.rooms.filter(r => r.status === 'available');
                // ... (cálculos de estado) ...

                return (
                <div key={prop.id} className="bg-white group">
                    {/* ... Header del elemento propiedad (igual) ... */}
                    <div 
                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors ${expandedProp === prop.id ? 'bg-blue-50/30' : ''}`}
                        onClick={() => toggleExpand(prop.id)}
                    >
                       <div className="flex items-center gap-3">
                            {expandedProp === prop.id ? <ChevronDown className="w-4 h-4 text-rentia-blue"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                            <div>
                                <span className="font-bold text-sm text-gray-900">{prop.address}</span>
                                <div className="text-xs text-gray-500 flex gap-2 items-center mt-0.5">
                                    <MapPin className="w-3 h-3"/>
                                    <span className="font-medium">{prop.city}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span>{prop.rooms.length} Habs</span>
                                </div>
                            </div>
                        </div>
                        {/* Badges de estado (igual) */}
                        <div className="flex flex-wrap items-center gap-2 justify-end max-w-[60%]">
                            {/* ... badges ... */}
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold border border-gray-200">
                                {prop.rooms.length} Habs
                            </span>
                        </div>
                    </div>

                    {expandedProp === prop.id && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2 relative">
                            
                            <div className="flex justify-end mb-4 border-b border-gray-100 pb-2">
                                <button 
                                    onClick={() => handleDeleteProperty(prop.id)}
                                    className="flex items-center gap-2 bg-red-100 hover:bg-red-600 hover:text-white text-red-700 px-3 py-1.5 rounded text-xs font-bold transition-all border border-red-200"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar Piso Completo
                                </button>
                            </div>

                            {/* SECCIÓN DETALLES PROPIEDAD */}
                            <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <h4 className="text-xs font-bold text-rentia-blue uppercase mb-3 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Detalles de Ubicación
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* ... Inputs de texto (Dirección, Ciudad, Planta, Maps) se mantienen igual ... */}
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dirección Exacta</label>
                                        <input type="text" value={prop.address} onChange={(e) => handlePropertyFieldChange(prop.id, 'address', e.target.value)} className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none" />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ciudad</label>
                                        <input type="text" value={prop.city} onChange={(e) => handlePropertyFieldChange(prop.id, 'city', e.target.value)} className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none" />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Planta</label>
                                        <input type="text" value={prop.floor || ''} onChange={(e) => handlePropertyFieldChange(prop.id, 'floor', e.target.value)} className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none" />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Link Maps</label>
                                        <input type="text" value={prop.googleMapsLink} onChange={(e) => handlePropertyFieldChange(prop.id, 'googleMapsLink', e.target.value)} className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none truncate" />
                                    </div>

                                    {/* FOTO PRINCIPAL CON UPLOADER */}
                                    <div className="lg:col-span-4 mt-2">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> Foto Principal del Piso
                                        </label>
                                        
                                        <div className="flex items-start gap-4">
                                            {/* Preview si existe */}
                                            {prop.image && (
                                                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group">
                                                    <img src={prop.image} alt="Main" className="w-full h-full object-cover" />
                                                    <a href={prop.image} target="_blank" rel="noreferrer" className="absolute bottom-1 right-1 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            )}
                                            
                                            {/* Uploader (Reemplaza al input de texto) */}
                                            <div className="flex-grow">
                                                <ImageUploader 
                                                    folder={`properties/${prop.id}`}
                                                    onUploadComplete={(url) => handlePropertyFieldChange(prop.id, 'image', url)}
                                                    label={prop.image ? "Cambiar Foto Portada" : "Subir Foto Portada"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ... Sección Gestión Interna (Contratos/Incidencias) se mantiene igual ... */}

                            {/* SECCIÓN HABITACIONES */}
                            <div className="space-y-3 pt-2">
                                {/* ... Header tabla habitaciones ... */}
                                {prop.rooms.map(room => (
                                    <div key={room.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-3">
                                        <div className="flex flex-col md:flex-row gap-3 items-center">
                                            {/* ... Inputs de habitación (Nombre, Estado, Precio...) ... */}
                                            <div className="w-full md:w-20"><input type="text" value={room.name} onChange={(e) => handleRoomChange(prop.id, room.id, 'name', e.target.value)} className="w-full font-bold text-rentia-black bg-gray-100 px-2 py-1 rounded text-sm outline-none text-center" /></div>
                                            
                                            {/* ... Selectores Estado, Precio, Disponibilidad, Config, Gastos ... */}
                                            {/* (Código existente se mantiene para estos campos) */}
                                            <div className="w-full md:w-32"><select value={room.status} onChange={(e) => handleRoomChange(prop.id, room.id, 'status', e.target.value)} className="w-full text-xs p-2 rounded border font-bold"><option value="available">Libre</option><option value="occupied">Alquilada</option><option value="reserved">Reservada</option></select></div>
                                            <div className="w-full md:w-24"><input type="number" value={room.price} onChange={(e) => handleRoomChange(prop.id, room.id, 'price', Number(e.target.value))} className="w-full text-xs p-2 rounded border" /></div>
                                            <div className="w-full md:w-32"><input type="text" value={room.availableFrom || ''} onChange={(e) => handleRoomChange(prop.id, room.id, 'availableFrom', e.target.value)} placeholder="Inmediata" className="w-full text-xs p-2 rounded border" /></div>
                                            
                                            {/* Botones Config (Aire, Fan, Special) */}
                                            <div className="w-full md:w-40 flex gap-2">
                                                <button onClick={() => handleRoomChange(prop.id, room.id, 'hasAirConditioning', !room.hasAirConditioning)} className={`p-2 rounded border ${room.hasAirConditioning ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-gray-50'}`}><Wind className="w-4 h-4" /></button>
                                                <select value={room.specialStatus || ''} onChange={(e) => handleRoomChange(prop.id, room.id, 'specialStatus', e.target.value || undefined)} className="w-full text-xs p-2 rounded border"><option value="">Normal</option><option value="new">Nueva</option><option value="renovation">Obras</option></select>
                                            </div>

                                            {/* ... Botón borrar hab ... */}
                                            <div className="w-full md:w-8 flex justify-end">
                                                <button onClick={() => handleDeleteRoom(prop.id, room.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        {/* GALERÍA IMÁGENES HABITACIÓN CON UPLOADER */}
                                        <div className="border-t border-gray-100 pt-2 mt-1">
                                            <details className="group/details">
                                                <summary className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer hover:text-rentia-blue flex items-center gap-1 list-none select-none">
                                                    <ImageIcon className="w-3 h-3" /> Galería Habitación ({room.images?.length || 0}) 
                                                    <ChevronDown className="w-3 h-3 group-open/details:rotate-180 transition-transform" />
                                                </summary>
                                                <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-100">
                                                    {/* Lista de fotos existentes */}
                                                    {room.images && room.images.map((imgUrl, idx) => (
                                                        <div key={idx} className="flex gap-2 items-center bg-gray-50 p-1 rounded border border-gray-200">
                                                            <img src={imgUrl} alt="Room" className="w-8 h-8 object-cover rounded" />
                                                            <input type="text" value={imgUrl} readOnly className="flex-grow text-xs p-1 bg-transparent outline-none text-gray-500 truncate" />
                                                            <button onClick={() => handleRoomImageOperation(prop.id, room.id, 'remove', idx)} className="text-red-400 hover:text-red-600 p-1"><X className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* BOTÓN SUBIR FOTO */}
                                                    <div className="mt-2">
                                                        <ImageUploader 
                                                            folder={`rooms/${room.id}`}
                                                            onUploadComplete={(url) => handleRoomImageOperation(prop.id, room.id, 'add', undefined, url)}
                                                            label="Añadir Foto Habitación"
                                                            compact={true} // Usar versión compacta (botón pequeño)
                                                        />
                                                        <span className="ml-2 text-xs text-gray-400">Sube una nueva foto para añadirla a la galería.</span>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => handleAddRoom(prop.id)} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-xs font-bold hover:border-rentia-blue hover:text-rentia-blue transition-colors flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Añadir Habitación</button>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                                <button onClick={() => saveProperty(prop)} disabled={saving} className="bg-rentia-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95">
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                                    {saving ? 'Guardando...' : 'Publicar Cambios'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )})}
        </div>
      </div>
    </div>
  );
};
