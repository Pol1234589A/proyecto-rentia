
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { properties as staticProperties, Property, Room } from '../../data/rooms';
import { Save, RefreshCw, Home, ChevronDown, ChevronRight, Building, Plus, Trash2, X, MapPin, ExternalLink, Wind, Image as ImageIcon, FileText, Settings, Hammer, DollarSign, Percent, Sun, Tv, Lock, Monitor, AlertCircle, User, CheckCircle } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ContractManager } from './ContractManager';
import { Contract, UserProfile } from '../../types';

// ... (INTERFACES AND HELPERS KEPT AS IS) ...
interface AdminProperty extends Property {
    // Extend if needed
}
const dateToInput = (dateStr?: string) => { /*...*/ return ''; };
const inputToDate = (isoDate: string) => { /*...*/ return 'Consultar'; };
const maskDni = (dni?: string) => { /*...*/ return ''; };

export const RoomManager: React.FC = () => {
  const [properties, setProperties] = useState<AdminProperty[]>(staticProperties);
  const [contracts, setContracts] = useState<Contract[]>([]); 
  const [owners, setOwners] = useState<UserProfile[]>([]); 
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedProp, setExpandedProp] = useState<string | null>(null);
  const [expandedRoomSettings, setExpandedRoomSettings] = useState<string | null>(null);
  
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
      address: '', city: 'Murcia', floor: '', bathrooms: 1, image: '', initialRooms: 3 
  });

  const fetchData = async () => {
    // ... (Keep existing fetch logic) ...
    setLoading(true);
    try {
        // ...
        setLoading(false);
    } catch (e) { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getActiveContract = (roomId: string) => {
      return contracts.find(c => c.roomId === roomId && (c.status === 'active' || c.status === 'reserved'));
  };

  const handleCreateProperty = async () => { /* ... */ };
  const handleDeleteProperty = async (propId: string) => { /* ... */ };
  const handlePropertyFieldChange = (propId: string, field: keyof Property, value: string) => { /* ... */ };
  const handleRoomChange = (propId: string, roomId: string, field: keyof Room, value: any) => { /* ... */ };
  const handleRoomFeatureToggle = (propId: string, roomId: string, feature: string) => { /* ... */ };
  const handleRoomImageOperation = (propId: string, roomId: string, action: 'add' | 'remove' | 'update', index?: number, value?: string) => { /* ... */ };
  const handleSaveAll = async (propId: string) => { /* ... */ };

  if (contractModalConfig.isOpen) {
      return (
          // MODIFICADO: z-index alto para tapar header
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
              {/* ... (Create Form UI kept same) ... */}
              <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-800">Registrar Nueva Propiedad</h4>
                      <button onClick={() => setIsCreating(false)}><X className="w-4 h-4 text-gray-400"/></button>
                  </div>
                  {/* ... inputs ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input className="border p-2 rounded text-sm" placeholder="Dirección (Calle, Nº)" value={newPropData.address} onChange={e => setNewPropData({...newPropData, address: e.target.value})} />
                      {/* ... other inputs ... */}
                  </div>
                  <div className="flex justify-end">
                      <button onClick={handleCreateProperty} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-blue-700">
                          {saving ? 'Creando...' : 'Crear Propiedad'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ... (Rest of RoomManager rendering logic kept same) ... */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50">
        {properties.map(prop => {
            return (
            <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* ... Property Header & Body ... */}
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
                    {/* ... Actions ... */}
                </div>

                {expandedProp === prop.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 animate-in slide-in-from-top-2">
                        {/* ... Edit Forms ... */}
                        <div className="grid grid-cols-1 gap-4">
                            {prop.rooms.map((room, idx) => {
                                // ... Room details ...
                                return (
                                <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    {/* ... Room content ... */}
                                    <div className="p-3 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold bg-gray-200 px-2 py-1 rounded">{room.name}</span>
                                            {/* ... */}
                                        </div>
                                        {/* ... */}
                                    </div>
                                    {/* ... */}
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
