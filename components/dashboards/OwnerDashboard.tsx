
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, auth, storage } from '../../firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword } from 'firebase/auth';
import { Property } from '../../data/rooms';
import { Contract, Candidate, Task, OwnerAdjustment, PropertyDocument, SupplyInvoice, UserProfile } from '../../types';
import { VisitRecord } from '../admin/tools/VisitsLog';
import { Home, Users, Wallet, Footprints, Clock, CheckCircle, X, DollarSign, Calendar, TrendingUp, AlertCircle, Loader2, Lock, Shield, Key, UserCheck, FileText, XCircle, Search, Image as ImageIcon, MapPin, AlertTriangle, Lightbulb, User, Briefcase, Gift, Upload, ExternalLink, Building, Zap, Save, PenTool, Check, FileCheck, ArrowRight } from 'lucide-react';

const SignaturePad: React.FC<{ onSave: (blob: Blob) => void }> = ({ onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    // Función auxiliar para obtener coordenadas precisas relativas al canvas
    // Maneja tanto ratón como táctil
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        } else {
            return { offsetX: 0, offsetY: 0 };
        }
        
        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        // CRÍTICO: Prevenir el scroll en dispositivos táctiles al empezar a firmar
        if (e.cancelable) e.preventDefault();
        
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        
        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        // CRÍTICO: Prevenir el scroll mientras se mueve el dedo
        if (e.cancelable) e.preventDefault();

        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.closePath();
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob((blob) => {
            if (blob) onSave(blob);
        }, 'image/png');
    };

    return (
        <div className="border border-gray-300 rounded-lg p-2 bg-white select-none">
            <canvas
                ref={canvasRef}
                width={500}
                height={200}
                // 'touch-none' es crucial para que el navegador no intente hacer scroll/zoom
                className="w-full h-40 border border-dashed border-gray-200 rounded cursor-crosshair touch-none bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div className="flex justify-between mt-2">
                <button type="button" onClick={clear} className="text-xs text-red-500 hover:underline px-2 py-1">Borrar y Repetir</button>
                <button type="button" onClick={save} disabled={!hasDrawn} className="bg-rentia-blue text-white px-6 py-2 rounded text-xs font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors">Confirmar Firma</button>
            </div>
        </div>
    );
};

export const OwnerDashboard: React.FC = () => {
  const { currentUser, isSimulated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'docs' | 'invoices' | 'financials' | 'security'>('overview');
  
  // Data
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<PropertyDocument[]>([]);
  const [uploadedInvoices, setUploadedInvoices] = useState<SupplyInvoice[]>([]);

  // Forms
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [communityForm, setCommunityForm] = useState({ presidentPhone: '', adminCompany: '', adminContact: '' });
  const [invoiceForm, setInvoiceForm] = useState({ type: 'luz', periodStart: '', periodEnd: '', amount: '' });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('escritura');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // UI States
  const [isGdprOpen, setIsGdprOpen] = useState(false);
  const [gdprStep, setGdprStep] = useState(1);
  const [signing, setSigning] = useState(false);

  // Financial Stats (Derived)
  const stats = useMemo(() => {
      let totalGross = 0;
      properties.forEach(p => {
          p.rooms.forEach(r => {
              if (r.status === 'occupied') totalGross += r.price;
          });
      });
      return { grossIncome: totalGross };
  }, [properties]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 0. User Profile
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setUserData(data);
            setProfileForm(data);
            if (!data.gdpr?.signed) setIsGdprOpen(true);
        }

        // 1. Properties
        const propsQuery = query(collection(db, "properties"), where("ownerId", "==", currentUser.uid));
        const propsSnap = await getDocs(propsQuery);
        const ownerProperties: Property[] = [];
        propsSnap.forEach(doc => ownerProperties.push({ ...doc.data(), id: doc.id } as Property));
        ownerProperties.sort((a,b) => a.address.localeCompare(b.address));
        setProperties(ownerProperties);
        if (ownerProperties.length > 0) {
            setSelectedPropertyId(ownerProperties[0].id);
            if (ownerProperties[0].communityInfo) setCommunityForm(ownerProperties[0].communityInfo as any);
        }

        const propIds = ownerProperties.map(p => p.id);

        if (propIds.length > 0) {
            // New: Documents
            const docsQuery = query(collection(db, "property_documents"), where("propertyId", "in", propIds));
            const docsSnap = await getDocs(docsQuery);
            const dList: PropertyDocument[] = [];
            docsSnap.forEach(d => dList.push({ ...d.data(), id: d.id } as PropertyDocument));
            setUploadedDocs(dList);

            // New: Invoices
            const invQuery = query(collection(db, "supply_invoices"), where("propertyId", "in", propIds));
            const invSnap = await getDocs(invQuery);
            const iList: SupplyInvoice[] = [];
            invSnap.forEach(d => iList.push({ ...d.data(), id: d.id } as SupplyInvoice));
            setUploadedInvoices(iList);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      try {
          await updateDoc(doc(db, "users", currentUser.uid), profileForm);
          alert("Perfil actualizado correctamente.");
      } catch (e) {
          alert("Error al actualizar perfil.");
      }
  };

  const handleUpdateCommunity = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPropertyId) return;
      try {
          await updateDoc(doc(db, "properties", selectedPropertyId), {
              communityInfo: communityForm
          });
          alert("Información de comunidad guardada.");
      } catch (e) {
          alert("Error al guardar información.");
      }
  };

  const handleUploadInvoice = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!invoiceFile || !selectedPropertyId) return alert("Falta archivo o propiedad");
      
      try {
          const storageRef = ref(storage, `invoices/${selectedPropertyId}/${Date.now()}_${invoiceFile.name}`);
          await uploadBytes(storageRef, invoiceFile);
          const url = await getDownloadURL(storageRef);

          await addDoc(collection(db, "supply_invoices"), {
              propertyId: selectedPropertyId,
              ...invoiceForm,
              amount: Number(invoiceForm.amount),
              fileUrl: url,
              uploadedAt: serverTimestamp(),
              status: 'pending'
          });
          
          alert("Factura subida correctamente.");
          setInvoiceFile(null);
          setInvoiceForm({ type: 'luz', periodStart: '', periodEnd: '', amount: '' });
      } catch (e) {
          console.error(e);
          alert("Error al subir factura.");
      }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!docFile || !selectedPropertyId) return alert("Falta archivo o propiedad");

      try {
          const storageRef = ref(storage, `documents/${selectedPropertyId}/${Date.now()}_${docFile.name}`);
          await uploadBytes(storageRef, docFile);
          const url = await getDownloadURL(storageRef);

          await addDoc(collection(db, "property_documents"), {
              propertyId: selectedPropertyId,
              name: docFile.name,
              type: docType,
              url: url,
              uploadedAt: serverTimestamp()
          });
          alert("Documento subido.");
          setDocFile(null);
      } catch (e) {
          alert("Error al subir documento.");
      }
  };

  const handleGdprSign = async (blob: Blob) => {
      if (!currentUser) return;
      setSigning(true);
      try {
          const storageRef = ref(storage, `signatures/${currentUser.uid}/${Date.now()}_gdpr.png`);
          await uploadBytes(storageRef, blob);
          const url = await getDownloadURL(storageRef);

          let ip = 'unknown';
          try {
            const ipReq = await fetch('https://api.ipify.org?format=json');
            if (ipReq.ok) {
                const ipRes = await ipReq.json();
                ip = ipRes.ip;
            }
          } catch (ipError) {
            console.warn("Could not fetch IP for signature log", ipError);
          }

          await updateDoc(doc(db, "users", currentUser.uid), {
              gdpr: {
                  signed: true,
                  signedAt: serverTimestamp(),
                  ip: ip,
                  signatureUrl: url,
                  documentVersion: 'v1.0-2025'
              }
          });

          setIsGdprOpen(false);
          // Refrescar estado local para cerrar banner rojo inmediatamente
          setUserData(prev => prev ? { ...prev, gdpr: { ...prev.gdpr, signed: true } as any } : null);
          alert("Documento firmado y registrado legalmente. Gracias.");
      } catch (e: any) {
          console.error("Signature Error:", e);
          alert(`Error al procesar la firma: ${e.code || e.message || 'Error desconocido'}. Inténtalo de nuevo.`);
      } finally {
          setSigning(false);
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-rentia-black font-display">Área Privada Propietario</h1>
            <p className="text-gray-500">Gestión integral de tus activos inmobiliarios.</p>
          </div>
          {userData?.gdpr?.signed ? (
              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                  <CheckCircle className="w-3 h-3"/> RGPD Firmado
              </span>
          ) : (
              <button onClick={() => setIsGdprOpen(true)} className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-200 animate-pulse">
                  <AlertTriangle className="w-3 h-3"/> Pendiente Firma RGPD
              </button>
          )}
        </header>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar bg-white p-2 rounded-xl shadow-sm w-fit border border-gray-100">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'bg-rentia-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Resumen</button>
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'bg-rentia-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}><User className="w-4 h-4"/> Mi Perfil</button>
            <button onClick={() => setActiveTab('docs')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'docs' ? 'bg-rentia-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}><FileText className="w-4 h-4"/> Documentación</button>
            <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'invoices' ? 'bg-rentia-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}><Zap className="w-4 h-4"/> Suministros</button>
            <button onClick={() => setActiveTab('financials')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'financials' ? 'bg-rentia-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Finanzas</button>
        </div>

        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase">Propiedades</p>
                        <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase">Ingresos Mensuales</p>
                        <p className="text-3xl font-bold text-green-600">{stats.grossIncome}€</p>
                    </div>
                </div>
                {properties.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="font-bold text-lg">{p.address}</h3>
                            <p className="text-sm text-gray-500">{p.city} • {p.rooms.length} Habitaciones</p>
                        </div>
                        {p.driveLink && (
                            <a href={p.driveLink} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200">
                                <ExternalLink className="w-4 h-4" /> Carpeta Drive
                            </a>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* 2. PROFILE TAB */}
        {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <UserCheck className="w-5 h-5 text-rentia-blue"/> Datos Personales
                    </h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                <input type="text" className="w-full p-2 border rounded" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI / NIE</label>
                                <input type="text" className="w-full p-2 border rounded" value={profileForm.dni} onChange={e => setProfileForm({...profileForm, dni: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                                <input type="text" className="w-full p-2 border rounded" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input type="email" className="w-full p-2 border rounded bg-gray-50" value={profileForm.email} disabled />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Fiscal</label>
                            <input type="text" className="w-full p-2 border rounded" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IBAN (Pagos)</label>
                            <input type="text" className="w-full p-2 border rounded font-mono" value={profileForm.bankAccount} onChange={e => setProfileForm({...profileForm, bankAccount: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-rentia-black text-white py-2 rounded-lg font-bold hover:bg-gray-800">Actualizar Datos</button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Building className="w-5 h-5 text-rentia-blue"/> Info Comunidad
                    </h3>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad</label>
                        <select className="w-full p-2 border rounded mb-4" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                        </select>
                    </div>
                    <form onSubmit={handleUpdateCommunity} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono Presidente</label>
                            <input type="text" className="w-full p-2 border rounded" value={communityForm.presidentPhone} onChange={e => setCommunityForm({...communityForm, presidentPhone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empresa Administradora</label>
                            <input type="text" className="w-full p-2 border rounded" value={communityForm.adminCompany} onChange={e => setCommunityForm({...communityForm, adminCompany: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contacto Admin (Email/Tel)</label>
                            <input type="text" className="w-full p-2 border rounded" value={communityForm.adminContact} onChange={e => setCommunityForm({...communityForm, adminContact: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Guardar Info Comunidad</button>
                    </form>
                </div>
            </div>
        )}

        {/* 3. DOCUMENTATION TAB */}
        {activeTab === 'docs' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Upload className="w-5 h-5"/> Subir Documento</h3>
                    <form onSubmit={handleUploadDoc} className="space-y-4">
                        <select className="w-full p-2 border rounded bg-white text-sm" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                        </select>
                        <select className="w-full p-2 border rounded bg-white text-sm" value={docType} onChange={e => setDocType(e.target.value)}>
                            <option value="escritura">Escrituras</option>
                            <option value="catastro">Ref. Catastral</option>
                            <option value="certificado_energetico">Cert. Energético</option>
                            <option value="plano">Planos</option>
                            <option value="licencia">Licencia</option>
                            <option value="reforma">Doc. Reforma</option>
                            <option value="otro">Otro</option>
                        </select>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                            <input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <p className="text-xs text-gray-500">{docFile ? docFile.name : 'Click para seleccionar archivo (PDF/IMG)'}</p>
                        </div>
                        <button type="submit" className="w-full bg-rentia-black text-white py-2 rounded-lg font-bold text-sm">Subir Archivo</button>
                    </form>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-bold text-lg mb-4">Documentos Archivados</h3>
                    {uploadedDocs.length === 0 ? <p className="text-gray-400 text-sm italic">No hay documentos.</p> : uploadedDocs.map(doc => (
                        <div key={doc.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5"/></div>
                                <div>
                                    <p className="font-bold text-sm text-gray-800 capitalize">{doc.type.replace('_', ' ')}</p>
                                    <p className="text-xs text-gray-500">{doc.name}</p>
                                </div>
                            </div>
                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-rentia-blue bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100">Ver / Descargar</a>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 4. INVOICES TAB */}
        {activeTab === 'invoices' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Zap className="w-5 h-5"/> Registrar Factura</h3>
                    <form onSubmit={handleUploadInvoice} className="space-y-4">
                        <select className="w-full p-2 border rounded bg-white text-sm" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <select className="w-full p-2 border rounded bg-white text-sm" value={invoiceForm.type} onChange={e => setInvoiceForm({...invoiceForm, type: e.target.value})}>
                                <option value="luz">Luz</option>
                                <option value="agua">Agua</option>
                                <option value="internet">Internet</option>
                                <option value="gas">Gas</option>
                                <option value="comunidad">Comunidad</option>
                            </select>
                            <input type="number" step="0.01" placeholder="Importe €" className="w-full p-2 border rounded text-sm" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[10px] uppercase font-bold text-gray-400">Inicio</label><input type="date" className="w-full p-2 border rounded text-xs" value={invoiceForm.periodStart} onChange={e => setInvoiceForm({...invoiceForm, periodStart: e.target.value})} /></div>
                            <div><label className="text-[10px] uppercase font-bold text-gray-400">Fin</label><input type="date" className="w-full p-2 border rounded text-xs" value={invoiceForm.periodEnd} onChange={e => setInvoiceForm({...invoiceForm, periodEnd: e.target.value})} /></div>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                            <input type="file" onChange={e => setInvoiceFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <p className="text-xs text-gray-500">{invoiceFile ? invoiceFile.name : 'Subir PDF Factura'}</p>
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-700">Registrar Gasto</button>
                    </form>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-bold text-lg mb-4">Histórico Facturas Subidas</h3>
                    {uploadedInvoices.length === 0 ? <p className="text-gray-400 text-sm italic">No hay facturas registradas.</p> : uploadedInvoices.map(inv => (
                        <div key={inv.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><DollarSign className="w-5 h-5"/></div>
                                <div>
                                    <p className="font-bold text-sm text-gray-800 capitalize">{inv.type} <span className="text-gray-400">|</span> {inv.amount}€</p>
                                    <p className="text-xs text-gray-500">{inv.periodStart} - {inv.periodEnd}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${inv.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{inv.status}</span>
                                {inv.fileUrl && <a href={inv.fileUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-rentia-blue"><ExternalLink className="w-4 h-4"/></a>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>

      {/* GDPR MODAL */}
      {isGdprOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-rentia-black flex items-center gap-2"><Shield className="w-6 h-6 text-rentia-blue"/> Protección de Datos</h2>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Paso {gdprStep}/2</div>
                  </div>
                  
                  <div className="p-8 overflow-y-auto leading-relaxed text-gray-600 text-sm space-y-4">
                      {gdprStep === 1 ? (
                          <>
                              <p className="font-bold text-gray-800">CONSENTIMIENTO EXPLÍCITO PARA EL TRATAMIENTO DE DATOS PERSONALES</p>
                              <p>De conformidad con lo establecido en el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), RENTIA INVESTMENTS S.L. le informa que sus datos personales serán tratados con la finalidad de gestionar la relación contractual de administración de su propiedad inmobiliaria.</p>
                              
                              <h4 className="font-bold text-gray-800 mt-4">1. Responsable del Tratamiento</h4>
                              <p>RENTIA INVESTMENTS S.L., con NIF B-75995308 y domicilio en C/ Brazal de Álamos, 7, 30130, Beniel, Murcia.</p>

                              <h4 className="font-bold text-gray-800 mt-4">2. Finalidad y Legitimación</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                  <li>Gestión administrativa, fiscal y contable de los alquileres.</li>
                                  <li>Tramitación de incidencias, seguros y suministros.</li>
                                  <li>Comunicación con inquilinos y administradores de fincas en su nombre.</li>
                                  <li>La legitimación se basa en la ejecución del contrato de mandato de gestión.</li>
                              </ul>

                              <h4 className="font-bold text-gray-800 mt-4">3. Derechos</h4>
                              <p>Usted tiene derecho a acceder, rectificar y suprimir los datos, así como otros derechos detallados en nuestra política de privacidad, dirigiéndose a info@rentiaroom.com.</p>
                          </>
                      ) : (
                          <div className="space-y-6">
                              <p>Por favor, firme en el recuadro para aceptar las condiciones y formalizar el tratamiento de sus datos. Esta firma tendrá plena validez legal para la gestión de su propiedad.</p>
                              
                              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-xs text-yellow-800 flex gap-2">
                                  <AlertCircle className="w-5 h-5 shrink-0"/>
                                  <div>
                                      <strong>Registro de Auditoría:</strong> Se registrará su dirección IP, fecha y hora como prueba de consentimiento. Se generará un certificado digital automáticamente.
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Su Firma Digital</label>
                                  <SignaturePad onSave={handleGdprSign} />
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                      {gdprStep === 1 ? (
                          <button onClick={() => setGdprStep(2)} className="bg-rentia-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2">
                              He leído y acepto <ArrowRight className="w-4 h-4"/>
                          </button>
                      ) : (
                          <button disabled={true} className="text-xs text-gray-400 italic">
                              {signing ? 'Generando certificado legal...' : 'Firme arriba para finalizar'}
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
