
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom'; // Importación necesaria para el Portal
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Property } from '../../data/rooms';
import { Contract, PropertyDocument, SupplyInvoice, AgencyInvoice } from '../../types';
import { 
  Building2, MapPin, ChevronDown, TrendingUp, DollarSign,
  Briefcase, User, FileCheck, Megaphone, Lock, FileText, 
  Upload, Receipt, Download, Loader2, CreditCard, LayoutDashboard, Plus, CheckCircle, Percent, Gift, Sparkles, Clock, Calendar, AlertCircle, Save, ArrowRight, Trash2, Eye, FilePlus, Info, Printer, Scale, X
} from 'lucide-react';
import { ImageUploader } from '../admin/ImageUploader';
import { SensitiveDataDisplay } from '../common/SecurityComponents';

type Tab = 'overview' | 'documents' | 'supplies' | 'invoices' | 'profile';

// Updated configuration: Escritura is now optional
const REQUIRED_DOCS = [
    { key: 'dni', label: 'DNI / NIE Propietario', desc: 'Cara frontal y trasera', required: true },
    { key: 'escritura', label: 'Escritura / Nota Simple', desc: 'Justificante de propiedad', required: false },
    { key: 'seguro', label: 'Póliza de Seguro', desc: 'Seguro de hogar vigente', required: true },
    { key: 'iban', label: 'Certificado Bancario', desc: 'Titularidad de la cuenta', required: true },
    { key: 'cee', label: 'Certificado Energético', desc: 'Etiqueta energética', required: true },
    { key: 'cedula', label: 'Cédula Habitabilidad', desc: 'Si dispone de ella', required: true }
];

export const OwnerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [invoices, setInvoices] = useState<SupplyInvoice[]>([]);
  const [agencyInvoices, setAgencyInvoices] = useState<AgencyInvoice[]>([]);
  
  // User Profile Data (for Bank Account editing)
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [ibanForm, setIbanForm] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null); // Para controlar el spinner de cada hueco
  
  // Forms
  const [supplyForm, setSupplyForm] = useState({ propertyId: '', type: 'luz', amount: '', date: new Date().toISOString().split('T')[0] });
  const [supplyFile, setSupplyFile] = useState<File | null>(null);

  // Investment Forms (Transient state for inputs)
  const [investmentInputs, setInvestmentInputs] = useState<Record<string, number>>({});

  // Invoice Viewer State
  const [viewingInvoice, setViewingInvoice] = useState<AgencyInvoice | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // 0. Fetch User Profile (Realtime)
    const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setOwnerProfile(data);
            // Solo establecer si no se está editando activamente (o inicializar)
            setIbanForm(prev => prev === '' ? (data.bankAccount || '') : prev);
        }
    });

    // 1. Fetch Properties
    const qProps = query(collection(db, 'properties'), where('ownerId', '==', currentUser.uid));
    const unsubProps = onSnapshot(qProps, (snapshot) => {
      const props: Property[] = [];
      const initInvestments: Record<string, number> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // @ts-ignore - investmentAmount might be missing in older docs
        const prop = { ...data, id: doc.id, investmentAmount: data.investmentAmount || 0 } as Property;
        props.push(prop);
        initInvestments[prop.id] = prop.investmentAmount || 0;
      });
      setProperties(props);
      // Only set initial inputs if not already set (to avoid overwriting user typing)
      setInvestmentInputs(prev => Object.keys(prev).length === 0 ? initInvestments : prev);

      if (props.length > 0 && !expandedPropId) {
          setExpandedPropId(props[0].id);
      }
      setLoading(false);
    });

    // 2. Fetch Contracts
    const qContracts = query(collection(db, 'contracts'), where('ownerId', '==', currentUser.uid));
    const unsubContracts = onSnapshot(qContracts, (snapshot) => {
        const conts: Contract[] = [];
        snapshot.forEach((doc) => {
            conts.push({ ...doc.data(), id: doc.id } as Contract);
        });
        setContracts(conts);
    });

    // 3. Fetch Agency Invoices (Liquidaciones)
    // FIX: Eliminado 'orderBy' para evitar error de índice faltante. Ordenamos en cliente.
    const qAgencyInv = query(collection(db, 'agency_invoices'), where('ownerId', '==', currentUser.uid));
    const unsubAgencyInv = onSnapshot(qAgencyInv, (snapshot) => {
        const agInvs: AgencyInvoice[] = [];
        snapshot.forEach((doc) => {
            agInvs.push({ ...doc.data(), id: doc.id } as AgencyInvoice);
        });
        // Ordenar en cliente (más rápido y sin necesidad de índice compuesto)
        agInvs.sort((a, b) => b.date.localeCompare(a.date));
        setAgencyInvoices(agInvs);
    });

    return () => {
      unsubUser();
      unsubProps();
      unsubContracts();
      unsubAgencyInv();
    };
  }, [currentUser]);

  // 3. Fetch Sub-collections based on Properties
  useEffect(() => {
      if (properties.length === 0) return;
      const propIds = properties.map(p => p.id);

      // Documents
      const qDocs = query(collection(db, "property_documents"), where("propertyId", "in", propIds.slice(0, 10))); 
      const unsubDocs = onSnapshot(qDocs, (snap) => {
          const docs: PropertyDocument[] = [];
          snap.forEach(d => docs.push({ ...d.data(), id: d.id } as PropertyDocument));
          setDocuments(docs);
      });

      // Supply Invoices
      const qInvoices = query(collection(db, "supply_invoices"), where("propertyId", "in", propIds.slice(0, 10))); 
      const unsubInvoices = onSnapshot(qInvoices, (snap) => {
          const invs: SupplyInvoice[] = [];
          snap.forEach(d => invs.push({ ...d.data(), id: d.id } as SupplyInvoice));
          invs.sort((a,b) => (b.uploadedAt?.toMillis() || 0) - (a.uploadedAt?.toMillis() || 0));
          setInvoices(invs);
      });

      return () => { unsubDocs(); unsubInvoices(); };
  }, [properties]);

  // ... (RESTO DEL ARCHIVO SE MANTIENE IGUAL, solo cambia la importación del principio para añadir createPortal si faltaba y la query) ...
  const toggleExpand = (id: string) => {
    setExpandedPropId(expandedPropId === id ? null : id);
  };
  
  // (Mantengo todo el resto del código del componente igual, solo se modifica la query en el useEffect)
  
  const handleSmartUpload = async (e: React.ChangeEvent<HTMLInputElement>, propertyId: string, docKey: string, docLabel: string) => {
      const file = e.target.files?.[0];
      if (!file || !currentUser) return;

      setUploadingDocKey(`${propertyId}-${docKey}`);
      try {
          const storageRef = ref(storage, `documents/${propertyId}/${docKey}_${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);

          await addDoc(collection(db, "property_documents"), {
              propertyId: propertyId,
              name: docLabel, 
              type: docKey,   
              url: url,
              uploadedAt: serverTimestamp(),
              ownerId: currentUser.uid
          });

          e.target.value = ''; 
          alert("Documento subido correctamente.");
      } catch (error) {
          console.error(error);
          alert("Error al subir documento.");
      } finally {
          setUploadingDocKey(null);
      }
  };

  const handleUploadInvoice = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supplyFile || !supplyForm.propertyId || !supplyForm.amount) return alert("Rellena todos los campos");
      
      setUploading(true);
      try {
          const storageRef = ref(storage, `invoices/${supplyForm.propertyId}/${Date.now()}_${supplyFile.name}`);
          await uploadBytes(storageRef, supplyFile);
          const url = await getDownloadURL(storageRef);

          await addDoc(collection(db, "supply_invoices"), {
              propertyId: supplyForm.propertyId,
              type: supplyForm.type,
              amount: parseFloat(supplyForm.amount),
              periodStart: supplyForm.date,
              periodEnd: supplyForm.date,
              fileUrl: url,
              status: 'pending',
              uploadedAt: serverTimestamp()
          });
          
          setSupplyFile(null);
          setSupplyForm({ ...supplyForm, amount: '' });
          alert("Factura subida correctamente");
      } catch (error) {
          console.error(error);
          alert("Error al subir");
      } finally {
          setUploading(false);
      }
  };

  const handleSaveInvestment = async (propId: string) => {
      const amount = investmentInputs[propId];
      if (amount === undefined || amount < 0 || isNaN(amount)) {
          return alert("Por favor introduce un valor numérico válido.");
      }
      try {
          await setDoc(doc(db, "properties", propId), {
              investmentAmount: Number(amount)
          }, { merge: true });
          alert("Inversión guardada correctamente. Tu ROI se recalculará automáticamente.");
      } catch (error: any) {
          console.error("Error saving investment:", error);
          alert(`Error al guardar: ${error.message || 'Permisos insuficientes o error de conexión'}`);
      }
  };

  const handleUpdateIban = async () => {
      if (!currentUser) return;
      try {
          await updateDoc(doc(db, "users", currentUser.uid), {
              bankAccount: ibanForm
          });
          alert("Cuenta bancaria actualizada correctamente.");
      } catch (error) {
          console.error(error);
          alert("Error al actualizar la cuenta.");
      }
  };

  const handleDeleteDocument = async (docId: string) => {
      if(!confirm("¿Seguro que quieres eliminar este documento?")) return;
      try {
          await deleteDoc(doc(db, "property_documents", docId));
      } catch (e) {
          console.error(e);
          alert("Error al eliminar");
      }
  };

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((acc, p) => acc + (p.rooms?.length || 0), 0);
  const occupiedRooms = properties.reduce((acc, p) => acc + (p.rooms?.filter(r => r.status === 'occupied').length || 0), 0);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const monthlyIncome = contracts.filter(c => c.status === 'active').reduce((acc, c) => acc + c.rentAmount, 0);
  const totalInvestment = properties.reduce((acc, p) => acc + (p.investmentAmount || 0), 0);
  const annualizedIncome = monthlyIncome * 12;
  const dynamicROI = totalInvestment > 0 ? (annualizedIncome / totalInvestment) * 100 : 0;

  if (loading) {
      return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-rentia-blue" /></div>;
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER & STATS */}
        <header className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-rentia-black font-display">
                        Bienvenido, {currentUser?.displayName?.split(' ')[0] || 'Propietario'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Resumen de tu cartera de activos.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('supplies')} className="bg-rentia-blue text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Subir Factura
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Propiedades</p>
                    <p className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-rentia-blue"/> {totalProperties}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Ocupación</p>
                    <p className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className={`w-5 h-5 ${occupancyRate >= 90 ? 'text-green-500' : 'text-yellow-500'}`}/> {occupancyRate}%
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Ingresos Brutos</p>
                    <p className="text-2xl font-bold text-rentia-blue flex items-center gap-2">
                        <DollarSign className="w-5 h-5"/> {monthlyIncome}€
                    </p>
                </div>
                
                <div className={`p-4 rounded-xl shadow-lg relative overflow-hidden group transition-all duration-300 ${totalInvestment > 0 ? 'bg-rentia-black text-white' : 'bg-red-500 text-white cursor-pointer hover:bg-red-600'}`} onClick={() => totalInvestment === 0 && setActiveTab('profile')}>
                    <p className="text-xs text-white/70 font-bold uppercase mb-1 relative z-10">Rentabilidad Global</p>
                    {totalInvestment > 0 ? (
                        <div className="flex items-center gap-2 relative z-10">
                            <p className={`text-2xl font-bold flex items-center gap-1 ${dynamicROI >= 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {dynamicROI.toFixed(1)}% <span className="text-xs text-white/50 font-normal">anual</span>
                            </p>
                        </div>
                    ) : (
                        <div className="relative z-10">
                             <p className="text-sm font-bold flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> Configurar aquí
                             </p>
                             <p className="text-[9px] leading-tight mt-1 text-white/90">
                                Calcula tu ROI real configurando la inversión inicial.
                             </p>
                        </div>
                    )}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform"></div>
                </div>
            </div>
        </header>

        {/* NAVIGATION TABS */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'overview' ? 'border-rentia-blue text-rentia-blue bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
                <LayoutDashboard className="w-4 h-4" /> Mis Propiedades
            </button>
            <button 
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-3 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'invoices' ? 'border-rentia-blue text-rentia-blue bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
                <Printer className="w-4 h-4" /> Facturas Rentia
            </button>
            <button 
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-3 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'documents' ? 'border-rentia-blue text-rentia-blue bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
                <FileText className="w-4 h-4" /> Documentos
            </button>
            <button 
                onClick={() => setActiveTab('supplies')}
                className={`px-6 py-3 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'supplies' ? 'border-rentia-blue text-rentia-blue bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
                <Receipt className="w-4 h-4" /> Suministros
            </button>
            <button 
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'profile' ? 'border-rentia-blue text-rentia-blue bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
                <User className="w-4 h-4" /> Mi Perfil
            </button>
        </div>

        {/* --- TAB CONTENT --- */}
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            
            {/* 1. OVERVIEW (PROPERTIES) */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* ... (Contenido propiedades se mantiene) ... */}
                    {properties.map(p => {
                            const isExpanded = expandedPropId === p.id;
                            const propOccupancy = p.rooms.filter(r => r.status === 'occupied').length;
                            const propInvestment = p.investmentAmount || 0;
                            
                            // CALCULATE PROPERTY SPECIFIC ROI (Simplified for brevity in XML)
                            const propCurrentIncome = p.rooms.filter(r => r.status === 'occupied').reduce((acc, r) => acc + r.price, 0);
                            const propRoi = propInvestment > 0 ? (propCurrentIncome * 12 / propInvestment) * 100 : 0;

                            return (
                                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                                    <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer bg-white hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(p.id)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-rentia-blue shrink-0"><Building2 className="w-6 h-6" /></div>
                                            <div><h3 className="font-bold text-gray-800 text-lg">{p.address}</h3><p className="text-gray-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3"/> {p.city} <span className="mx-1">•</span> {p.rooms.length} Habs</p></div>
                                        </div>
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                            <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-600 font-bold border border-gray-200">Comisión: {p.managementCommission ? `${p.managementCommission}% + IVA` : '-'}</div>
                                            <div className="text-right"><div className="text-xs text-gray-400 font-bold uppercase">Estado</div><div className={`font-bold ${propOccupancy === p.rooms.length ? 'text-green-600' : 'text-orange-500'}`}>{propOccupancy}/{p.rooms.length} Ocupadas</div></div>
                                            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown className="w-5 h-5 text-gray-400" /></div>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="bg-gray-50 border-t border-gray-100 p-4 md:p-6 animate-in slide-in-from-top-2">
                                            {/* ROI Indicator */}
                                            <div className={`mb-6 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3 border transition-colors ${propInvestment > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                                                <div className="flex items-center gap-3">
                                                     <div className={`p-2 rounded-full ${propInvestment > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}><TrendingUp className="w-4 h-4" /></div>
                                                     <div>
                                                         {propInvestment > 0 ? ( <><span className="text-xs text-yellow-800 font-bold uppercase block">Rentabilidad actual de este activo</span><span className="text-lg font-bold text-yellow-900">{propRoi.toFixed(2)}% <span className="text-xs font-normal opacity-80">anualizado</span></span></> ) : ( <><span className="text-xs text-red-800 font-bold uppercase block">Rentabilidad desconocida</span><span className="text-sm text-red-900">Configura la inversión para ver el dato real.</span></> )}
                                                     </div>
                                                </div>
                                                {(!propInvestment || propInvestment <= 0) && (<button onClick={(e) => { e.stopPropagation(); setActiveTab('profile'); }} className="text-xs bg-white text-red-700 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center gap-1 shadow-sm">Configurar Inversión <ArrowRight className="w-3 h-3" /></button>)}
                                            </div>

                                            {/* Cleaning Card */}
                                            {p.cleaningConfig?.enabled && (
                                                <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in">
                                                    <div><h4 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Servicio de Limpieza Activo</h4><div className="flex items-center gap-4 text-sm text-indigo-900"><div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-indigo-500"/><span className="font-medium">{(p.cleaningConfig.days || []).join(', ')}</span></div><div className="flex items-center gap-1"><Clock className="w-4 h-4 text-indigo-500"/><span className="font-medium">{p.cleaningConfig.hours || 'Horario flexible'}</span></div></div></div>
                                                    <div className="bg-white px-4 py-2 rounded-lg border border-indigo-100 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Coste Servicio</p><p className="text-lg font-bold text-indigo-700">{p.cleaningConfig.costPerHour}€ <span className="text-xs font-normal">/ hora</span></p></div>
                                                </div>
                                            )}

                                            {/* Recommendations */}
                                            {p.ownerRecommendations && p.ownerRecommendations.length > 0 && (
                                                <div className="mb-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                                                    <h4 className="text-xs font-bold text-yellow-800 uppercase mb-3 flex items-center gap-2"><Megaphone className="w-4 h-4"/> Avisos de Gestión</h4>
                                                    <div className="space-y-2">
                                                        {p.ownerRecommendations.map(rec => (<div key={rec.id} className="flex gap-2 text-sm text-yellow-900 bg-white/50 p-2 rounded border border-yellow-200/50"><span className="font-bold text-yellow-700 min-w-[80px]">{new Date(rec.date).toLocaleDateString()}:</span><span>{rec.text}</span></div>))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Rooms Table */}
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Estado de Habitaciones</h4>
                                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-100"><tr><th className="p-3 pl-4">Habitación</th><th className="p-3 text-right">Precio</th><th className="p-3 pl-6">Estado</th><th className="p-3">Inquilino</th><th className="p-3 text-center">Contrato</th></tr></thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {p.rooms.map(room => {
                                                                const activeContract = contracts.find(c => c.propertyId === p.id && c.roomId === room.id && c.status === 'active');
                                                                const roomRecommendations = room.recommendations || [];
                                                                return (
                                                                    <React.Fragment key={room.id}>
                                                                        <tr className="hover:bg-blue-50/30 transition-colors">
                                                                            <td className="p-3 pl-4 font-bold text-gray-800">{room.name}</td>
                                                                            <td className="p-3 text-right font-mono text-gray-600">{room.price}€</td>
                                                                            <td className="p-3 pl-6"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${room.status === 'occupied' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{room.status === 'occupied' ? 'Alquilada' : 'Disponible'}</span></td>
                                                                            <td className="p-3">{activeContract ? (<div className="flex items-center gap-1.5 font-medium text-gray-900"><User className="w-3.5 h-3.5 text-gray-400" /> {activeContract.tenantName}</div>) : (<span className="text-gray-400 italic text-xs">-</span>)}</td>
                                                                            <td className="p-3 text-center">{activeContract && (activeContract as any).fileUrl ? (<a href={(activeContract as any).fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-rentia-blue hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-100 transition-colors"><FileCheck className="w-3 h-3" /> Ver</a>) : (<span className="text-gray-300 text-[10px]">-</span>)}</td>
                                                                        </tr>
                                                                        {roomRecommendations.length > 0 && (<tr><td colSpan={5} className="px-4 pb-3 pt-0"><div className="bg-orange-50 border-l-2 border-orange-300 p-2 rounded-r text-xs ml-4"><span className="font-bold text-orange-800 block mb-1 flex items-center gap-1"><Megaphone className="w-3 h-3"/> Sugerencias:</span><ul className="list-disc list-inside text-orange-900 space-y-0.5">{roomRecommendations.map((rec, i) => (<li key={i}>{rec.text}</li>))}</ul></div></td></tr>)}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    )}
                </div>
            )}

            {/* 2. INVOICES TAB (UPDATED) */}
            {activeTab === 'invoices' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Printer className="w-5 h-5 text-rentia-blue" /> Facturas y Liquidaciones
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Histórico de facturas emitidas por RentiaRoom.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Nº Factura</th>
                                    <th className="p-4">Periodo</th>
                                    <th className="p-4 text-right">Transferido (Neto)</th>
                                    <th className="p-4 text-right">Honorarios (Bruto)</th>
                                    <th className="p-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {agencyInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400">
                                            No hay facturas disponibles todavía.
                                        </td>
                                    </tr>
                                ) : (
                                    agencyInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-500 text-xs">
                                                {inv.date}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-gray-800">
                                                {inv.invoiceNumber}
                                            </td>
                                            <td className="p-4">
                                                {inv.details?.month || '-'}
                                            </td>
                                            <td className="p-4 text-right font-bold text-green-600">
                                                {inv.totalAmount.toLocaleString('es-ES', {minimumFractionDigits: 2})} €
                                            </td>
                                            <td className="p-4 text-right text-gray-500">
                                                {inv.agencyFee.toLocaleString('es-ES', {minimumFractionDigits: 2})} €
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => setViewingInvoice(inv)}
                                                    className="bg-blue-50 text-rentia-blue hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-blue-100 flex items-center justify-center gap-1 mx-auto"
                                                >
                                                    <Eye className="w-3 h-3" /> Ver / Imprimir
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* ... (RESTO DE TABS IGUAL: Documents, Supplies, Profile) ... */}
            {activeTab === 'documents' && (
                <div className="space-y-8">
                     {/* ... Content of Documents Tab ... (No changes needed here for now) */}
                     {/* B. BIBLIOTECA GENERAL (LISTADO SIMPLE) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-rentia-blue" /> Biblioteca de Archivos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documents.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-gray-400 border border-dashed rounded-lg bg-gray-50">
                                    No hay documentos subidos.
                                </div>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                                        <div>
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1" title={doc.name}>{doc.name}</h4>
                                                    <p className="text-[10px] text-gray-500 capitalize">{properties.find(p => p.id === doc.propertyId)?.address || 'Propiedad desconocida'}</p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mb-2">Subido: {doc.uploadedAt?.toDate().toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <a 
                                                href={doc.url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 border border-gray-200 transition-colors"
                                            >
                                                <Download className="w-3 h-3" /> Descargar
                                            </a>
                                            <button 
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. SUPPLIES TAB */}
            {activeTab === 'supplies' && (
                <div className="space-y-6">
                    {/* ... (Contenido Supply Tab Igual) ... */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-rentia-blue" /> Subir Factura
                        </h3>
                        <form onSubmit={handleUploadInvoice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad</label>
                                <select 
                                    className="w-full p-2 border rounded-lg text-sm"
                                    value={supplyForm.propertyId}
                                    onChange={e => setSupplyForm({...supplyForm, propertyId: e.target.value})}
                                >
                                    <option value="">Seleccionar...</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                </select>
                            </div>
                            {/* ... (Resto del formulario de supplies) ... */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                <select className="w-full p-2 border rounded-lg text-sm" value={supplyForm.type} onChange={e => setSupplyForm({...supplyForm, type: e.target.value})}><option value="luz">Luz</option><option value="agua">Agua</option><option value="gas">Gas</option><option value="internet">Internet</option><option value="otro">Otro</option></select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Importe (€)</label>
                                <input type="number" step="0.01" className="w-full p-2 border rounded-lg text-sm" value={supplyForm.amount} onChange={e => setSupplyForm({...supplyForm, amount: e.target.value})} />
                            </div>
                            <div className="md:col-span-1 flex flex-col gap-2">
                                <input type="file" id="invoice-file" className="hidden" accept="application/pdf,image/*" onChange={e => setSupplyFile(e.target.files?.[0] || null)} />
                                <label htmlFor="invoice-file" className={`w-full py-2 px-3 border border-dashed rounded-lg text-xs font-bold text-center cursor-pointer transition-colors ${supplyFile ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100'}`}>{supplyFile ? supplyFile.name : 'Adjuntar Archivo'}</label>
                            </div>
                            <div className="md:col-span-4 flex justify-end">
                                <button type="submit" disabled={uploading} className="bg-rentia-black text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>} Subir Factura</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* 5. PROFILE TAB (Same as before) */}
            {activeTab === 'profile' && (
                 <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
                    {/* ... (Profile Content) ... */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-rentia-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">{currentUser?.displayName?.charAt(0) || 'U'}</div>
                        <div><h2 className="text-xl font-bold text-gray-900">{currentUser?.displayName}</h2><p className="text-gray-500">{currentUser?.email}</p><span className="inline-block mt-1 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded border border-purple-200 uppercase">Propietario Verificado</span></div>
                    </div>
                    {/* ... (Rest of Profile) ... */}
                </div>
            )}

        </div>
      </div>

      {/* --- INVOICE VIEWER MODE (FULL SCREEN OVERLAY) --- */}
      {viewingInvoice && viewingInvoice.details && createPortal(
          <div className="fixed inset-0 z-[9999] bg-gray-100 overflow-auto font-sans flex flex-col">
               
               {/* ESTILOS DE IMPRESIÓN PARA PROPIETARIO */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #invoice-print-area, #invoice-print-area * {
                            visibility: visible;
                        }
                        #invoice-print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            margin: 0;
                            padding: 0;
                            background: white;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                    }
                `}</style>

               {/* TOOLBAR FIXED TOP */}
               <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center print:hidden z-50 shadow-sm shrink-0">
                   <h2 className="font-bold text-gray-800 flex items-center gap-2">
                       <FileText className="w-5 h-5 text-rentia-blue" />
                       Visor de Factura
                   </h2>
                   <div className="flex gap-3">
                       <button onClick={() => window.print()} className="flex items-center gap-2 bg-rentia-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
                           <Printer className="w-4 h-4" /> Imprimir / PDF
                       </button>
                       <button onClick={() => setViewingInvoice(null)} className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                           <X className="w-4 h-4" /> Cerrar
                       </button>
                   </div>
               </div>

               {/* DOCUMENTO (Visual de Factura idéntico al de Admin) */}
               <div className="flex-grow overflow-auto p-4 md:p-8 bg-gray-100">
                    <div id="invoice-print-area" className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-2xl my-4 print:shadow-none print:m-0 print:w-full print:max-w-none relative border border-gray-200 print:border-none">
                            
                            {/* 1. CABECERA FACTURA */}
                            <div className="p-12 pb-6 border-b border-gray-100 flex justify-between items-start">
                                <div className="w-1/2">
                                    <img src="https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/IMAGENES%20DE%20EMPRESA%2FLOGOS%2FPNG%2FLogo.png?alt=media&token=3d8358f0-2acc-4b82-824f-9e0a3c940240" alt="RentiaRoom" className="h-12 mb-4" />
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p className="font-bold text-gray-900">{viewingInvoice.details.agencyData.name}</p>
                                        <p>NIF: {viewingInvoice.details.agencyData.cif}</p>
                                        <div className="break-words w-full pr-4">
                                            {viewingInvoice.details.agencyData.address}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-1/3 text-right">
                                    <h1 className="text-2xl font-bold text-gray-900 font-display uppercase tracking-widest mb-1">LIQUIDACIÓN</h1>
                                    <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-4">Y FACTURA DE HONORARIOS</h2>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between bg-gray-50 p-2 rounded">
                                            <span className="font-bold text-gray-500 uppercase text-xs">Nº Factura</span>
                                            <span className="font-mono font-bold">{viewingInvoice.invoiceNumber}</span>
                                        </div>
                                        <div className="flex justify-between bg-gray-50 p-2 rounded">
                                            <span className="font-bold text-gray-500 uppercase text-xs">Fecha</span>
                                            <span className="font-mono font-bold">{viewingInvoice.date}</span>
                                        </div>
                                        <div className="flex justify-between bg-gray-50 p-2 rounded">
                                            <span className="font-bold text-gray-500 uppercase text-xs">Periodo</span>
                                            <span className="font-mono font-bold">{viewingInvoice.details.month}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. RECEPTOR */}
                            <div className="px-12 py-6 bg-gray-50/30 flex justify-between">
                                <div className="w-1/2 pr-4">
                                    <h3 className="text-xs font-bold text-rentia-blue uppercase tracking-wider mb-2">Receptor (Cliente):</h3>
                                    <div className="space-y-1 text-sm text-gray-800">
                                        <p className="font-bold text-lg break-words">{viewingInvoice.details.clientData.name}</p>
                                        <p>NIF/DNI: {viewingInvoice.details.clientData.nif}</p>
                                        <p className="break-words w-full">{viewingInvoice.details.clientData.address}</p>
                                        {viewingInvoice.details.clientData.iban && (
                                            <div className="flex gap-2 items-center bg-yellow-50 p-1 rounded mt-1 border border-yellow-100 w-full">
                                                <span className="text-xs font-bold text-rentia-blue shrink-0">Cuenta:</span> 
                                                <span className="font-mono text-xs break-all">{viewingInvoice.details.clientData.iban}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-1/3">
                                    <h3 className="text-xs font-bold text-rentia-blue uppercase tracking-wider mb-2">Propiedad Gestionada:</h3>
                                    <div className="text-sm text-gray-700 bg-white border border-gray-100 p-2 rounded h-auto min-h-[5rem] break-words">
                                        {viewingInvoice.details.clientData.propertyAddress}
                                    </div>
                                </div>
                            </div>

                            {/* 3. CUERPO */}
                            <div className="px-12 py-8 pb-64">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-200 pb-2 mb-6">Detalle de Gestión y Liquidación</h3>
                                
                                {/* Disclaimer */}
                                <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800 flex gap-2 items-start text-justify">
                                    <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p>
                                        <strong>MANDATO DE GESTIÓN:</strong> Conforme al Art. 79.Dos.3º de la Ley del IVA (LIVA), los importes detallados en "Ingresos por Alquileres" son recibidos por cuenta y orden del propietario, teniendo la consideración de <strong>suplidos</strong> a efectos fiscales. Estos fondos no constituyen ingreso para la agencia y son transferidos íntegramente al titular. 
                                        La única operación sujeta a IVA por parte de Rentia Investments S.L. es la detallada en el apartado "Factura por Honorarios de Gestión".
                                    </p>
                                </div>

                                {/* TABLA INGRESOS */}
                                <div className="mb-8">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">1. Cobros por Cuenta del Cliente (Suplidos)</h4>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-xs text-gray-500 font-bold uppercase">
                                            <tr>
                                                <th className="p-2 text-left">Habitación</th>
                                                <th className="p-2 text-left">Inquilino</th>
                                                <th className="p-2 text-right">Renta</th>
                                                <th className="p-2 text-right">Suministros</th>
                                                <th className="p-2 text-right">Limpieza</th>
                                                <th className="p-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {viewingInvoice.details.tenants.map((t: any) => (
                                                <tr key={t.id}>
                                                    <td className="p-2 font-bold">{t.roomName}</td>
                                                    <td className="p-2">{t.tenantName}</td>
                                                    <td className="p-2 text-right">{t.baseRent}€</td>
                                                    <td className="p-2 text-right">{t.supplies}€</td>
                                                    <td className="p-2 text-right">{t.hasCleaning ? t.cleaningAmount : '-'}€</td>
                                                    <td className="p-2 text-right font-bold">{(t.baseRent + t.supplies + (t.hasCleaning ? t.cleaningAmount : 0)).toLocaleString()}€</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t border-gray-300 font-bold bg-gray-50">
                                            <tr>
                                                <td colSpan={5} className="p-2 text-right text-xs uppercase">Total Recaudado (Fondo Cliente)</td>
                                                <td className="p-2 text-right">{viewingInvoice.details.totals.totalCashIn.toLocaleString()} €</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* DESGLOSE HONORARIOS (Fixed Padding Box) */}
                                <div className="mb-8 px-4 pb-4 pt-8 bg-white border-2 border-rentia-blue rounded-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-rentia-blue text-white text-[9px] px-2 py-1 uppercase font-bold rounded-bl">Factura Oficial Honorarios</div>
                                    <h4 className="text-xs font-bold text-rentia-blue uppercase mb-3 border-b border-blue-100 pb-1 flex justify-between items-center">
                                        <span>2. Factura por Honorarios de Gestión</span>
                                        <span className="text-[10px] text-gray-500 font-normal">Factura Nº {viewingInvoice.invoiceNumber}</span>
                                    </h4>
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <span>Base Imponible (Sobre Renta Base de {viewingInvoice.details.totals.totalBaseRent}€)</span>
                                        <span className="font-mono">{viewingInvoice.details.totals.feeBase.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <span>IVA Vigente</span>
                                        <span className="font-mono">{viewingInvoice.details.totals.feeVAT.toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between items-center text-base font-bold text-blue-900 border-t border-blue-100 pt-2 mt-2">
                                        <span>TOTAL FACTURA (A DEDUCIR)</span>
                                        <span>-{viewingInvoice.details.totals.totalAgencyFee.toFixed(2)} €</span>
                                    </div>
                                </div>

                                {/* AJUSTES */}
                                <div className="mb-8">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">3. Otros Pagos y Ajustes</h4>
                                    {viewingInvoice.details.adjustments.length > 0 ? (
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-gray-100">
                                                {viewingInvoice.details.adjustments.map((adj: any) => (
                                                    <tr key={adj.id}>
                                                        <td className="p-2 w-24">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${adj.type === 'descuento' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{adj.type}</span>
                                                        </td>
                                                        <td className="p-2">{adj.concept}</td>
                                                        <td className="p-2 text-right w-32 font-bold">{adj.amount}€</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic py-2">Sin ajustes adicionales.</p>
                                    )}
                                </div>
                            </div>

                            {/* 4. TOTAL Y PIE */}
                            <div className="bg-gray-900 text-white px-6 py-4 absolute bottom-0 w-full print:relative">
                                <div className="flex justify-between items-end mb-3">
                                    <div className="text-xs text-gray-400 space-y-0.5 w-1/2">
                                        <p className="font-bold text-white uppercase text-[10px]">Resultado Liquidación</p>
                                        <p className="text-[9px]">Compensación de saldos y transferencia del remanente.</p>
                                        <p className="text-[9px]">El importe se transferirá a la cuenta indicada.</p>
                                    </div>
                                    <div className="text-right leading-none">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">A TRANSFERIR</p>
                                        <p className="text-3xl font-bold font-mono">{viewingInvoice.details.totals.netToOwner.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-700 pt-2 text-[8px] text-gray-500 text-justify leading-tight">
                                    <p className="mb-1"><strong>PROTECCIÓN DE DATOS:</strong> Responsable: Rentia Investments S.L. | Finalidad: Gestión de la relación contractual inmobiliaria, administrativa, contable y fiscal. | Legitimación: Ejecución de contrato y cumplimiento legal. | Destinatarios: No se cederán datos a terceros, salvo obligación legal. | Derechos: Acceder, rectificar y suprimir los datos, así como otros derechos, ante info@rentiaroom.com.</p>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-1 text-gray-400 border-t border-gray-800 mt-1 pt-1">
                                        <span>{viewingInvoice.details.agencyData.name} · NIF: {viewingInvoice.details.agencyData.cif} · {viewingInvoice.details.agencyData.address}</span>
                                        <span className="text-right max-w-lg">{viewingInvoice.details.agencyData.registry}</span>
                                    </div>
                                </div>
                            </div>
                    </div>
               </div>
          </div>,
          document.body
      )}
    </div>
  );
};
