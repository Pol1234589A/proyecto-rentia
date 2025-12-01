
// ... keep imports ...
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import { properties as staticProperties, Property, Room } from '../../data/rooms';
import { Save, RefreshCw, Home, CheckCircle, AlertTriangle, ChevronDown, ChevronRight, DollarSign, Calendar, Database, Wind, Receipt, Plus, Trash2, X, MapPin, ExternalLink, Map, Fan, Timer, Image as ImageIcon, Link as LinkIcon, FileText, ShieldAlert, User, Check, Clock } from 'lucide-react';

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

  // Estado para crear nueva propiedad
  const [isCreating, setIsCreating] = useState(false);
  const [newPropData, setNewPropData] = useState({ address: '', city: '' });

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

  // ... (Keep handleCreateProperty, handleDeleteProperty, handlePropertyFieldChange, generateMapLink) ...
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
        
        const newProperty: Property = {
            id: newId,
            address: newPropData.address,
            city: newPropData.city,
            image: '', 
            googleMapsLink: mapLink,
            rooms: []
        };

        await setDoc(doc(db, "properties", newId), newProperty);
        
        setMessage({ type: 'success', text: "Propiedad creada correctamente." });
        setIsCreating(false);
        setNewPropData({ address: '', city: '' });
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

  // ... (Keep handleRoomChange, handleRoomImageOperation, handleAddRoom, handleDeleteRoom) ...
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
                  if (action === 'add') newImages.push('');
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

  // ... (Keep internal management handlers) ...
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
          return { ...p, contracts: [...(p.contracts || []), contract] };
      }));
      setNewContract({});
  };

  const handleDeleteContract = (propId: string, contractId: string) => {
      if(!confirm("¿Eliminar contrato?")) return;
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
      // Guardamos tanto los campos públicos como los privados en el mismo documento
      // IMPORTANTE: Sanitizamos 'floor', 'image', etc. para evitar undefined
      await updateDoc(docRef, { 
          address: property.address || '',
          city: property.city || '',
          floor: property.floor || '', // Corrección clave: evitar undefined
          image: property.image || '', // Corrección clave
          googleMapsLink: property.googleMapsLink || '', // Corrección clave
          rooms: property.rooms,
          contracts: property.contracts || [], // Guardar contratos
          incidents: property.incidents || []  // Guardar incidencias
      });
      // Show success modal
      setShowSuccessModal(true);
      // Auto-hide after 3 seconds
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

      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
        {/* ... (Header Content) ... */}
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

      {/* ... (Rest of the component: Create Form, Property List, etc.) ... */}
      {isCreating && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
              <h4 className="text-sm font-bold text-rentia-blue mb-3">Nueva Propiedad</h4>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="w-full md:w-1/3">
                      <label className="text-xs text-gray-500 block mb-1">Dirección</label>
                      <input 
                          type="text" 
                          value={newPropData.address}
                          onChange={(e) => setNewPropData({...newPropData, address: e.target.value})}
                          className="w-full p-2 rounded border border-gray-300 text-sm focus:border-rentia-blue outline-none"
                          placeholder="Ej: Calle Mayor 1"
                      />
                  </div>
                  <div className="w-full md:w-1/3">
                      <label className="text-xs text-gray-500 block mb-1">Ciudad</label>
                      <input 
                          type="text" 
                          value={newPropData.city}
                          onChange={(e) => setNewPropData({...newPropData, city: e.target.value})}
                          className="w-full p-2 rounded border border-gray-300 text-sm focus:border-rentia-blue outline-none"
                          placeholder="Ej: Murcia"
                      />
                  </div>
                  <button 
                      onClick={handleCreateProperty}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                      {saving ? 'Creando...' : <><Save className="w-4 h-4"/> Guardar Piso</>}
                  </button>
              </div>
          </div>
      )}

      {/* Lista de Propiedades */}
      <div className="p-0 overflow-y-auto max-h-[800px] bg-gray-50/50">
        {message && (
            <div className={`m-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                {message.text}
            </div>
        )}

        {properties.length === 0 && !loading && !message && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Database className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">No hay propiedades.</p>
            </div>
        )}

        <div className="divide-y divide-gray-200">
            {properties.map(prop => {
                const available = prop.rooms.filter(r => r.status === 'available');
                const upcoming = prop.rooms.filter(r => r.status === 'occupied' && isSoon(r.availableFrom));
                const occupied = prop.rooms.filter(r => r.status === 'occupied' && !isSoon(r.availableFrom));
                const reserved = prop.rooms.filter(r => r.status === 'reserved');

                return (
                <div key={prop.id} className="bg-white group">
                    {/* ... (Property Item Header - No Changes) ... */}
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
                        
                        <div className="flex flex-wrap items-center gap-2 justify-end max-w-[60%]">
                            {available.length > 0 && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-green-200">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> {available.length} Libres
                                </span>
                            )}
                            {upcoming.map(r => (
                                <span key={r.id} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-orange-200">
                                    <Timer className="w-3 h-3" />
                                    {r.name}: <CountdownTimer targetDateStr={r.availableFrom || ''} />
                                </span>
                            ))}
                            {occupied.length > 0 && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold border border-gray-200">
                                    {occupied.length} Alquiladas
                                </span>
                            )}
                            {reserved.length > 0 && (
                                <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full font-bold border border-yellow-200">
                                    {reserved.length} Reservadas
                                </span>
                            )}
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

                            {/* ... (SECCIÓN DETALLES PROPIEDAD - No Changes) ... */}
                            <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <h4 className="text-xs font-bold text-rentia-blue uppercase mb-3 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Detalles de Ubicación
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dirección Exacta</label>
                                        <input 
                                            type="text" 
                                            value={prop.address}
                                            onChange={(e) => handlePropertyFieldChange(prop.id, 'address', e.target.value)}
                                            className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none"
                                        />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ciudad</label>
                                        <input 
                                            type="text" 
                                            value={prop.city}
                                            onChange={(e) => handlePropertyFieldChange(prop.id, 'city', e.target.value)}
                                            className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none"
                                        />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Planta</label>
                                        <input 
                                            type="text" 
                                            value={prop.floor || ''}
                                            onChange={(e) => handlePropertyFieldChange(prop.id, 'floor', e.target.value)}
                                            className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none"
                                            placeholder="Ej: 3º"
                                        />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Enlace Google Maps</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={prop.googleMapsLink}
                                                onChange={(e) => handlePropertyFieldChange(prop.id, 'googleMapsLink', e.target.value)}
                                                className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none truncate"
                                            />
                                            <button onClick={() => generateMapLink(prop.id)} className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-500"><RefreshCw className="w-4 h-4" /></button>
                                            <a href={prop.googleMapsLink} target="_blank" rel="noreferrer" className="p-2 rounded border bg-white border-green-200 text-green-600"><Map className="w-4 h-4" /></a>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-4 mt-2">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> Foto Principal del Piso (URL)
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={prop.image || ''}
                                                onChange={(e) => handlePropertyFieldChange(prop.id, 'image', e.target.value)}
                                                className="w-full text-sm p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none"
                                            />
                                            {prop.image && <a href={prop.image} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 rounded border border-gray-200 text-gray-500 hover:text-rentia-blue"><ExternalLink className="w-4 h-4" /></a>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- SECCIÓN GESTIÓN INTERNA (PRIVADA) --- */}
                            <div className="mb-6 p-4 bg-slate-100 border border-slate-200 rounded-lg">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4" /> Gestión Interna (Privado)
                                    </h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => setActiveTabPrivate('contracts')} className={`text-xs px-3 py-1 rounded font-bold transition-colors ${activeTabPrivate === 'contracts' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Contratos</button>
                                        <button onClick={() => setActiveTabPrivate('incidents')} className={`text-xs px-3 py-1 rounded font-bold transition-colors ${activeTabPrivate === 'incidents' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>Incidencias</button>
                                    </div>
                                </div>

                                {activeTabPrivate === 'contracts' && (
                                    <div>
                                        <div className="space-y-2 mb-4">
                                            {prop.contracts && prop.contracts.length > 0 ? prop.contracts.map(c => (
                                                <div key={c.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{c.roomId}</span>
                                                        <span className="font-bold text-slate-800 flex items-center gap-1"><User className="w-3 h-3"/> {c.tenantName}</span>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {c.startDate} - {c.endDate}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {c.documentUrl && (
                                                            <a href={c.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1">
                                                                <FileText className="w-3 h-3"/> Ver Contrato
                                                            </a>
                                                        )}
                                                        <button onClick={() => handleDeleteContract(prop.id, c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-4 text-slate-400 text-xs italic">No hay contratos activos registrados.</div>
                                            )}
                                        </div>
                                        {/* Añadir Contrato */}
                                        <div className="bg-slate-200/50 p-3 rounded flex flex-wrap gap-2 items-center">
                                            <span className="text-xs font-bold text-slate-500">Nuevo:</span>
                                            <select className="text-xs p-1.5 rounded" value={newContract.roomId || ''} onChange={e => setNewContract({...newContract, roomId: e.target.value})}>
                                                <option value="">Habitación</option>
                                                {prop.rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                            </select>
                                            <input type="text" placeholder="Nombre Inquilino" className="text-xs p-1.5 rounded w-32" value={newContract.tenantName || ''} onChange={e => setNewContract({...newContract, tenantName: e.target.value})}/>
                                            <input type="date" className="text-xs p-1.5 rounded" value={newContract.startDate || ''} onChange={e => setNewContract({...newContract, startDate: e.target.value})}/>
                                            <input type="date" className="text-xs p-1.5 rounded" value={newContract.endDate || ''} onChange={e => setNewContract({...newContract, endDate: e.target.value})}/>
                                            <input type="text" placeholder="URL Contrato (Drive/PDF)" className="text-xs p-1.5 rounded flex-grow" value={newContract.documentUrl || ''} onChange={e => setNewContract({...newContract, documentUrl: e.target.value})}/>
                                            <button onClick={() => handleAddContract(prop.id)} className="bg-slate-700 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-slate-800">Añadir</button>
                                        </div>
                                    </div>
                                )}

                                {activeTabPrivate === 'incidents' && (
                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                            {prop.incidents && prop.incidents.length > 0 ? prop.incidents.map(inc => (
                                                <div key={inc.id} className={`p-3 rounded border text-sm flex flex-col gap-2 ${inc.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-white border-red-200'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${inc.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{inc.priority}</span>
                                                        <span className="text-[10px] text-slate-400">{inc.createdAt}</span>
                                                    </div>
                                                    <h5 className="font-bold text-slate-800 leading-tight">{inc.title}</h5>
                                                    <p className="text-xs text-slate-600 line-clamp-2">{inc.description}</p>
                                                    <div className="mt-auto pt-2 border-t border-dashed border-slate-200 flex justify-between items-center">
                                                        <select 
                                                            value={inc.status} 
                                                            onChange={(e) => handleUpdateIncidentStatus(prop.id, inc.id, e.target.value as any)}
                                                            className={`text-xs font-bold bg-transparent outline-none cursor-pointer ${inc.status === 'resolved' ? 'text-green-600' : 'text-orange-600'}`}
                                                        >
                                                            <option value="pending">Pendiente</option>
                                                            <option value="in_progress">En curso</option>
                                                            <option value="resolved">Resuelta</option>
                                                        </select>
                                                        {inc.status === 'resolved' && <Check className="w-3 h-3 text-green-600"/>}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="col-span-3 text-center py-4 text-slate-400 text-xs italic">No hay incidencias activas.</div>
                                            )}
                                        </div>
                                        <div className="bg-slate-200/50 p-3 rounded flex flex-wrap gap-2 items-center">
                                            <span className="text-xs font-bold text-slate-500">Nueva Incidencia:</span>
                                            <input type="text" placeholder="Título (ej: Caldera rota)" className="text-xs p-1.5 rounded w-40" value={newIncident.title || ''} onChange={e => setNewIncident({...newIncident, title: e.target.value})}/>
                                            <select className="text-xs p-1.5 rounded" value={newIncident.priority || 'medium'} onChange={e => setNewIncident({...newIncident, priority: e.target.value as any})}>
                                                <option value="low">Baja</option>
                                                <option value="medium">Media</option>
                                                <option value="high">Alta</option>
                                            </select>
                                            <input type="text" placeholder="Descripción detallada..." className="text-xs p-1.5 rounded flex-grow" value={newIncident.description || ''} onChange={e => setNewIncident({...newIncident, description: e.target.value})}/>
                                            <button onClick={() => handleAddIncident(prop.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-red-700">Reportar</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- SECCIÓN HABITACIONES (PÚBLICO) --- */}
                            <div className="space-y-3 pt-2">
                                {/* Header Tabla */}
                                <div className="hidden md:flex gap-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                    <div className="w-20">Habitación</div>
                                    <div className="w-32">Estado</div>
                                    <div className="w-24">Precio (€)</div>
                                    <div className="w-32">Disponibilidad</div>
                                    <div className="w-40">Configuración</div>
                                    <div className="w-32">Gastos</div>
                                    <div className="w-8"></div>
                                </div>

                                {prop.rooms.map(room => (
                                    <div key={room.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-3">
                                        <div className="flex flex-col md:flex-row gap-3 items-center">
                                            {/* Nombre */}
                                            <div className="w-full md:w-20 flex gap-2 items-center">
                                                <input 
                                                    type="text"
                                                    value={room.name}
                                                    onChange={(e) => handleRoomChange(prop.id, room.id, 'name', e.target.value)}
                                                    className="w-full font-bold text-rentia-black bg-gray-100 px-2 py-1 rounded text-sm border-transparent focus:border-rentia-blue focus:bg-white transition-colors outline-none text-center"
                                                />
                                            </div>
                                            {/* Estado */}
                                            <div className="w-full md:w-32">
                                                <select 
                                                    value={room.status}
                                                    onChange={(e) => handleRoomChange(prop.id, room.id, 'status', e.target.value)}
                                                    className={`w-full text-xs p-2 rounded border font-bold focus:ring-2 focus:ring-rentia-blue/20 outline-none cursor-pointer ${
                                                        room.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                        room.status === 'occupied' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    }`}
                                                >
                                                    <option value="available">Libre</option>
                                                    <option value="occupied">Alquilada</option>
                                                    <option value="reserved">Reservada</option>
                                                </select>
                                            </div>
                                            {/* Precio */}
                                            <div className="w-full md:w-24 relative">
                                                <input 
                                                    type="number" 
                                                    value={room.price}
                                                    onChange={(e) => handleRoomChange(prop.id, room.id, 'price', Number(e.target.value))}
                                                    className="w-full text-xs p-2 pl-6 rounded border border-gray-200 focus:border-rentia-blue outline-none font-medium"
                                                />
                                                <DollarSign className="w-3 h-3 text-gray-400 absolute left-2 top-2.5"/>
                                            </div>
                                            {/* Disponibilidad */}
                                            <div className="w-full md:w-32 relative">
                                                <input 
                                                    type="text" 
                                                    value={room.availableFrom || ''}
                                                    onChange={(e) => handleRoomChange(prop.id, room.id, 'availableFrom', e.target.value)}
                                                    placeholder="Inmediata"
                                                    className="w-full text-xs p-2 pl-7 rounded border border-gray-200 focus:border-rentia-blue outline-none"
                                                />
                                                <Calendar className="w-3 h-3 text-gray-400 absolute left-2 top-2.5"/>
                                            </div>
                                            {/* Config */}
                                            <div className="w-full md:w-40 flex gap-2">
                                                <button onClick={() => handleRoomChange(prop.id, room.id, 'hasAirConditioning', !room.hasAirConditioning)} className={`p-2 rounded border transition-colors ${room.hasAirConditioning ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`} title="Aire Acondicionado"><Wind className="w-4 h-4" /></button>
                                                <button onClick={() => handleRoomChange(prop.id, room.id, 'hasFan', !room.hasFan)} className={`p-2 rounded border transition-colors ${room.hasFan ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`} title="Ventilador"><Fan className="w-4 h-4" /></button>
                                                <select value={room.specialStatus || ''} onChange={(e) => handleRoomChange(prop.id, room.id, 'specialStatus', e.target.value || undefined)} className="w-full text-xs p-2 rounded border border-gray-200 focus:border-rentia-blue outline-none text-gray-600">
                                                    <option value="">Normal</option>
                                                    <option value="new">Nueva ✨</option>
                                                    <option value="renovation">Obras 🔨</option>
                                                </select>
                                            </div>
                                            {/* Gastos */}
                                            <div className="w-full md:w-32 relative">
                                                <select value={room.expenses} onChange={(e) => handleRoomChange(prop.id, room.id, 'expenses', e.target.value)} className="w-full text-xs p-2 pl-7 rounded border border-gray-200 focus:border-rentia-blue outline-none text-gray-600">
                                                    <option value="Gastos fijos aparte">Fijos</option>
                                                    <option value="Se reparten los gastos">A repartir</option>
                                                </select>
                                                <Receipt className="w-3 h-3 text-gray-400 absolute left-2 top-2.5"/>
                                            </div>
                                            {/* Borrar Hab */}
                                            <div className="w-full md:w-8 flex justify-end">
                                                <button onClick={() => handleDeleteRoom(prop.id, room.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors border border-red-100 hover:border-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        {/* Galería Imágenes */}
                                        <div className="border-t border-gray-100 pt-2 mt-1">
                                            <details className="group/details">
                                                <summary className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer hover:text-rentia-blue flex items-center gap-1 list-none select-none">
                                                    <ImageIcon className="w-3 h-3" /> Galería Habitación ({room.images?.length || 0}) 
                                                    <ChevronDown className="w-3 h-3 group-open/details:rotate-180 transition-transform" />
                                                </summary>
                                                <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-100">
                                                    {room.images && room.images.map((imgUrl, idx) => (
                                                        <div key={idx} className="flex gap-2 items-center">
                                                            <LinkIcon className="w-3 h-3 text-gray-300" />
                                                            <input type="text" value={imgUrl} onChange={(e) => handleRoomImageOperation(prop.id, room.id, 'update', idx, e.target.value)} className="flex-grow text-xs p-1.5 bg-gray-50 border border-gray-200 rounded focus:border-rentia-blue outline-none" placeholder={`URL Foto ${idx + 1}`} />
                                                            <button onClick={() => handleRoomImageOperation(prop.id, room.id, 'remove', idx)} className="text-red-400 hover:text-red-600 p-1"><X className="w-3 h-3" /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => handleRoomImageOperation(prop.id, room.id, 'add')} className="text-[10px] font-bold text-rentia-blue hover:underline flex items-center gap-1 mt-1"><Plus className="w-3 h-3" /> Añadir Hueco para Foto</button>
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
