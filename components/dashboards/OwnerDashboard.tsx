
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Property } from '../../data/rooms';
import { Candidate, OwnerAdjustment, PropertyDocument, SupplyInvoice, UserProfile } from '../../types';
import { Zap, Loader2, Shield, UserCheck, FileText, XCircle, CheckCircle, Upload, Building, User, ArrowRight, MousePointerClick, ShieldCheck, Printer, Droplet, Flame, Wifi, FileCheck, CloudLightning, Clock, Download, AlertTriangle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

// TEXTO LEGAL ROBUSTO (COMPLIANCE RGPD & LOPDGDD)
const LEGAL_TEXT_HTML = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
    <h2 style="text-align: center; color: #0072CE;">ACUERDO DE CONFIDENCIALIDAD Y ENCARGO DE TRATAMIENTO DE DATOS</h2>
    <p><strong>Entre:</strong> RENTIA INVESTMENTS S.L. (en adelante, "El Responsable") y el PROPIETARIO (en adelante, "El Encargado").</p>
    
    <h3>1. OBJETO DEL ACUERDO</h3>
    <p>En el marco de la gestión inmobiliaria, el Propietario tendrá acceso a datos personales de candidatos e inquilinos (nombres, DNI, datos económicos, contacto) facilitados por RENTIA.</p>
    
    <h3>2. OBLIGACIONES DE CONFIDENCIALIDAD</h3>
    <p>El Propietario se compromete a:</p>
    <ul>
      <li>Utilizar los datos <strong>exclusivamente</strong> para la finalidad de formalizar el alquiler y gestionar la relación contractual.</li>
      <li>No comunicar ni ceder estos datos a terceros (salvo obligación legal o administración pública).</li>
      <li>Mantener el secreto profesional respecto a toda la información, incluso después de finalizar la relación.</li>
    </ul>

    <h3>3. MEDIDAS DE SEGURIDAD</h3>
    <p>El Propietario se compromete a no guardar copias locales inseguras de la documentación (nóminas, DNI) una vez finalizada su utilidad, y a custodiar las credenciales de acceso a este panel de forma segura.</p>

    <h3>4. DESTRUCCIÓN DE DATOS</h3>
    <p>Una vez finalizada la relación de arrendamiento, el Propietario deberá destruir o devolver cualquier dato personal del inquilino que obre en su poder fuera de esta plataforma.</p>

    <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
      <p style="font-size: 12px; color: #666;">Documento aceptado digitalmente mediante firma electrónica simple (Clickwrap Agreement) conforme al Reglamento eIDAS.</p>
    </div>
  </div>
`;

export const OwnerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'docs' | 'invoices' | 'candidates'>('overview');
  
  // Data
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<PropertyDocument[]>([]);
  const [uploadedInvoices, setUploadedInvoices] = useState<SupplyInvoice[]>([]);
  const [adjustments, setAdjustments] = useState<OwnerAdjustment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]); 

  // Forms
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  
  // Invoice Upload Form
  const [invoiceForm, setInvoiceForm] = useState({ 
      type: 'luz', 
      periodStart: '', 
      periodEnd: '', 
      amount: '' 
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

  // Doc Upload Form
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('certificado_energetico');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  
  // UI States for Candidates view
  const [expandedCandidatesProp, setExpandedCandidatesProp] = useState<Record<string, boolean>>({});

  // UI States
  const [isGdprOpen, setIsGdprOpen] = useState(false);
  const [gdprStep, setGdprStep] = useState(1);
  const [isGdprChecked, setIsGdprChecked] = useState(false); 
  const [signing, setSigning] = useState(false);

  // Financials Calculation
  const financials = useMemo(() => {
      let income = 0;
      let expenses = 0;
      properties.forEach(p => {
          p.rooms.forEach(r => {
              if (r.status === 'occupied') income += r.price;
          });
      });
      adjustments.forEach(adj => {
          if (adj.type === 'discount') { } 
          else { expenses += adj.amount; }
      });
      return { monthlyIncome: income, monthlyExpenses: expenses, netBalance: income - expenses };
  }, [properties, adjustments]);

  // Required Docs Check
  const requiredDocsStatus = useMemo(() => {
      const required = [
          { type: 'certificado_energetico', label: 'Certificado Energético' },
          { type: 'seguro_hogar', label: 'Seguro de Hogar' }, 
          { type: 'ibi', label: 'Recibo IBI' },
          { type: 'escritura', label: 'Nota Simple / Escritura' }
      ];
      // Check for current selected property
      const currentPropDocs = uploadedDocs.filter(d => d.propertyId === selectedPropertyId);
      
      return required.map(req => {
          const exists = currentPropDocs.some(d => d.type === req.type);
          return { ...req, uploaded: exists };
      });
  }, [uploadedDocs, selectedPropertyId]);

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUserData(data);
            setProfileForm(data);
            if (!data.gdpr?.signed) {
                setIsGdprOpen(true);
            } else {
                setIsGdprOpen(false);
            }
        }
        setLoading(false);
    });

    const fetchData = async () => {
      try {
        // Properties
        const propsQuery = query(collection(db, "properties"), where("ownerId", "==", currentUser.uid));
        const propsSnap = await getDocs(propsQuery);
        const ownerProperties: Property[] = [];
        propsSnap.forEach(doc => ownerProperties.push({ ...doc.data(), id: doc.id } as Property));
        ownerProperties.sort((a,b) => a.address.localeCompare(b.address));
        setProperties(ownerProperties);
        if (ownerProperties.length > 0) {
            setSelectedPropertyId(ownerProperties[0].id);
            setExpandedCandidatesProp({ [ownerProperties[0].address]: true });
        }

        const propIds = ownerProperties.map(p => p.id);

        if (propIds.length > 0) {
            // Documents
            const docsQuery = query(collection(db, "property_documents"), where("propertyId", "in", propIds));
            const unsubDocs = onSnapshot(docsQuery, (snapshot) => {
                const dList: PropertyDocument[] = [];
                snapshot.forEach(d => dList.push({ ...d.data(), id: d.id } as PropertyDocument));
                setUploadedDocs(dList);
            });

            // Invoices
            const invQuery = query(collection(db, "supply_invoices"), where("propertyId", "in", propIds), orderBy("uploadedAt", "desc"));
            const unsubInvoices = onSnapshot(invQuery, (snapshot) => {
                const iList: SupplyInvoice[] = [];
                snapshot.forEach(d => iList.push({ ...d.data(), id: d.id } as SupplyInvoice));
                setUploadedInvoices(iList);
            });
        }

        // Adjustments
        const adjQuery = query(collection(db, "adjustments"), where("ownerId", "==", currentUser.uid), orderBy("date", "desc"));
        const adjSnap = await getDocs(adjQuery);
        const aList: OwnerAdjustment[] = [];
        adjSnap.forEach(d => aList.push({ ...d.data(), id: d.id } as OwnerAdjustment));
        setAdjustments(aList);
        
        // Candidates
        try {
            const candQuery = query(collection(db, "candidate_pipeline"), where("ownerId", "==", currentUser.uid), orderBy("submittedAt", "desc"));
            const candSnap = await getDocs(candQuery);
            const cList: Candidate[] = [];
            candSnap.forEach(d => cList.push({ ...d.data(), id: d.id } as Candidate));
            setCandidates(cList);
        } catch (e) {
            console.warn("Error fetching candidates");
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    return () => unsubUser();
  }, [currentUser]);

  // --- UPLOAD HANDLERS ---

  const handleUploadDoc = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!docFile || !selectedPropertyId) return alert("Selecciona archivo y propiedad.");
      
      setIsUploadingDoc(true);
      try {
          const fileName = `doc_${Date.now()}_${docFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const storageRef = ref(storage, `documents/${selectedPropertyId}/${fileName}`);
          await uploadBytes(storageRef, docFile);
          const url = await getDownloadURL(storageRef);

          await addDoc(collection(db, "property_documents"), {
              propertyId: selectedPropertyId,
              name: docFile.name,
              type: docType,
              url: url,
              uploadedAt: serverTimestamp()
          });

          alert("Documento subido correctamente.");
          setDocFile(null);
      } catch (error) {
          console.error(error);
          alert("Error al subir documento.");
      } finally {
          setIsUploadingDoc(false);
      }
  };

  const handleUploadInvoice = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!invoiceFile || !invoiceForm.amount || !invoiceForm.periodStart) return alert("Completa los datos de la factura.");
      
      setIsUploadingInvoice(true);
      try {
          const fileName = `invoice_${Date.now()}_${invoiceFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const storageRef = ref(storage, `invoices/${selectedPropertyId}/${fileName}`);
          await uploadBytes(storageRef, invoiceFile);
          const url = await getDownloadURL(storageRef);

          await addDoc(collection(db, "supply_invoices"), {
              propertyId: selectedPropertyId,
              type: invoiceForm.type,
              periodStart: invoiceForm.periodStart,
              periodEnd: invoiceForm.periodEnd,
              amount: parseFloat(invoiceForm.amount),
              fileUrl: url,
              status: 'pending', // Important for Staff Panel
              uploadedAt: serverTimestamp()
          });

          alert("Factura enviada. El equipo de Rentia la procesará en el próximo reparto.");
          setInvoiceFile(null);
          setInvoiceForm({ type: 'luz', periodStart: '', periodEnd: '', amount: '' });
      } catch (error) {
          console.error(error);
          alert("Error al subir factura.");
      } finally {
          setIsUploadingInvoice(false);
      }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => { e.preventDefault(); if (!currentUser) return; try { await updateDoc(doc(db, "users", currentUser.uid), profileForm); alert("Perfil actualizado."); } catch (e) { alert("Error."); } };
  
  // --- GDPR ---
  const handleGdprAccept = async () => {
      if (!currentUser || !userData || !isGdprChecked) return;
      setSigning(true);
      try {
          const timestamp = new Date().toISOString();
          const signerInfo = `
            <div style="background:#f9f9f9; padding:15px; border:1px solid #ddd; margin-top:20px;">
                <strong>FIRMADO DIGITALMENTE POR:</strong><br/>
                Nombre: ${userData.name}<br/>
                DNI: ${userData.dni || 'No registrado'}<br/>
                Email: ${userData.email}<br/>
                Fecha: ${timestamp}<br/>
                ID Usuario: ${currentUser.uid}
            </div>
          `;
          const fullEvidenceHtml = LEGAL_TEXT_HTML + signerInfo;
          await updateDoc(doc(db, "users", currentUser.uid), { 
              gdpr: { signed: true, signedAt: serverTimestamp(), ip: 'browser_session', documentVersion: 'v3.0', htmlSnapshot: fullEvidenceHtml } 
          });
          setTimeout(() => { setIsGdprOpen(false); alert("Documento firmado correctamente."); }, 500);
      } catch (e) { console.error("Error signing:", e); alert("Error al registrar la aceptación."); } finally { setSigning(false); }
  };

  const handlePrintAgreement = () => {
      if (userData?.gdpr?.htmlSnapshot) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
              printWindow.document.write(userData.gdpr.htmlSnapshot);
              printWindow.document.close();
              printWindow.print();
          }
      } else { alert("No se encuentra la copia digital."); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rentia-blue"/></div>;

  const candidatesByProperty = useMemo(() => {
      const groups: Record<string, Candidate[]> = {};
      properties.forEach(p => groups[p.address] = []);
      candidates.forEach(c => {
          const propName = c.propertyName || 'Sin asignar';
          if (!groups[propName]) groups[propName] = [];
          groups[propName].push(c);
      });
      return groups;
  }, [candidates, properties]);
  
  const toggleCandidateProp = (prop: string) => { setExpandedCandidatesProp(prev => ({...prev, [prop]: !prev[prop]})); };

  // Helper icons for invoices
  const getSupplyIcon = (type: string) => {
      switch(type) {
          case 'luz': return <Zap className="w-4 h-4 text-yellow-500"/>;
          case 'agua': return <Droplet className="w-4 h-4 text-blue-500"/>;
          case 'gas': return <Flame className="w-4 h-4 text-orange-500"/>;
          case 'internet': return <Wifi className="w-4 h-4 text-purple-500"/>;
          default: return <FileText className="w-4 h-4 text-gray-500"/>;
      }
  };

  return (
    <div className={`min-h-screen bg-gray-50 p-4 md:p-8 animate-in fade-in ${isGdprOpen ? 'overflow-hidden h-screen' : ''}`}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-rentia-black font-display">Área Privada Propietario</h1>
            <p className="text-gray-500 text-sm">Gestión integral de tus activos inmobiliarios.</p>
          </div>
          {userData?.gdpr?.signed ? (
              <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                  <ShieldCheck className="w-3 h-3"/> Contrato Activo
              </span>
          ) : (
              <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-200 animate-pulse">
                  <AlertTriangle className="w-3 h-3"/> Acción Requerida
              </span>
          )}
        </header>

        {/* Scrollable Tabs for Mobile Optimization */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar bg-white p-2 rounded-xl shadow-sm w-full md:w-fit border border-gray-100 -mx-4 px-4 md:mx-0 md:px-2 touch-pan-x">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === 'overview' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>Resumen</button>
            <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 flex-shrink-0 ${activeTab === 'invoices' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><Zap className="w-4 h-4"/> Facturas</button>
            <button onClick={() => setActiveTab('docs')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 flex-shrink-0 ${activeTab === 'docs' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><FileText className="w-4 h-4"/> Documentación</button>
            <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 flex-shrink-0 ${activeTab === 'candidates' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><UserCheck className="w-4 h-4"/> Candidatos</button>
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 flex-shrink-0 ${activeTab === 'profile' ? 'bg-rentia-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><User className="w-4 h-4"/> Perfil</button>
        </div>

        {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"><p className="text-xs text-gray-500 font-bold uppercase">Propiedades</p><p className="text-3xl font-bold text-gray-900">{properties.length}</p></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"><p className="text-xs text-gray-500 font-bold uppercase">Ingresos Brutos Mes</p><p className="text-3xl font-bold text-green-600">{financials.monthlyIncome}€</p></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"><p className="text-xs text-gray-500 font-bold uppercase">Cargos Extra Mes</p><p className="text-3xl font-bold text-red-500">-{financials.monthlyExpenses}€</p></div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 text-sm">Mis Propiedades</div>
                    <div className="p-4 space-y-3">
                        {properties.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-rentia-blue font-bold flex-shrink-0">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm truncate">{p.address}</h4>
                                        <p className="text-xs text-gray-500 truncate">{p.city} • {p.rooms.length} Habitaciones</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Activa</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- PESTAÑA: FACTURAS (SUMINISTROS) --- */}
        {activeTab === 'invoices' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                
                {/* Columna Izq: Subida */}
                <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Upload className="w-5 h-5 text-rentia-blue"/> Subir Factura
                    </h3>
                    
                    <form onSubmit={handleUploadInvoice} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propiedad</label>
                            <select className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo Suministro</label>
                                <select className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" value={invoiceForm.type} onChange={e => setInvoiceForm({...invoiceForm, type: e.target.value})}>
                                    <option value="luz">💡 Luz</option>
                                    <option value="agua">💧 Agua</option>
                                    <option value="gas">🔥 Gas</option>
                                    <option value="internet">📶 Internet</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Importe (€)</label>
                                <input type="number" step="0.01" className="w-full p-3 border rounded-lg text-sm font-bold bg-gray-50 focus:bg-white transition-colors" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} placeholder="0.00" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio Periodo</label>
                                <input type="date" className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" value={invoiceForm.periodStart} onChange={e => setInvoiceForm({...invoiceForm, periodStart: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin Periodo</label>
                                <input type="date" className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" value={invoiceForm.periodEnd} onChange={e => setInvoiceForm({...invoiceForm, periodEnd: e.target.value})} />
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer relative transition-all active:bg-gray-100 active:scale-95 touch-manipulation">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setInvoiceFile(e.target.files?.[0] || null)} accept="application/pdf,image/*" />
                            <div className="flex flex-col items-center gap-1 pointer-events-none">
                                {invoiceFile ? (
                                    <>
                                        <FileCheck className="w-8 h-8 text-green-500 mb-1"/>
                                        <span className="text-xs font-bold text-green-700 truncate max-w-full">{invoiceFile.name}</span>
                                        <span className="text-[10px] text-green-600">Toca para cambiar</span>
                                    </>
                                ) : (
                                    <>
                                        <CloudLightning className="w-8 h-8 text-gray-400 mb-1"/>
                                        <span className="text-sm font-medium text-gray-600">Toca para seleccionar archivo</span>
                                        <span className="text-[10px] text-gray-400">PDF o Imagen</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isUploadingInvoice}
                            className="w-full bg-rentia-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 touch-manipulation"
                        >
                            {isUploadingInvoice ? <Loader2 className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5"/>}
                            {isUploadingInvoice ? 'Subiendo...' : 'Enviar Factura'}
                        </button>
                    </form>
                </div>

                {/* Columna Der: Historial */}
                <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[300px]">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <Clock className="w-5 h-5 text-gray-500"/> Historial de Envíos
                    </h3>
                    
                    <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar max-h-[400px] md:max-h-[500px]">
                        {uploadedInvoices.filter(inv => inv.propertyId === selectedPropertyId).length === 0 ? (
                            <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                                No hay facturas subidas para esta propiedad.
                            </div>
                        ) : (
                            uploadedInvoices.filter(inv => inv.propertyId === selectedPropertyId).map(inv => (
                                <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-full border border-gray-200 shadow-sm flex-shrink-0">
                                            {getSupplyIcon(inv.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-gray-800 capitalize truncate">{inv.type} <span className="font-mono ml-1">{inv.amount}€</span></p>
                                            <p className="text-[10px] text-gray-500 truncate">{inv.periodStart} - {inv.periodEnd}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                            {inv.status === 'pending' ? 'Pendiente' : 'Procesada'}
                                        </span>
                                        <a href={inv.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                            <Download className="w-3 h-3"/> <span className="hidden sm:inline">Descargar</span>
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- PESTAÑA: DOCUMENTOS --- */}
        {activeTab === 'docs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                
                {/* Columna Izq: Estado y Subida */}
                <div className="space-y-6">
                    {/* Checklist */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-600"/> Estado Documentación
                        </h3>
                        <div className="space-y-2">
                            {requiredDocsStatus.map((req, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <span className="text-sm text-gray-700 font-medium truncate pr-2">{req.label}</span>
                                    {req.uploaded ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex-shrink-0">
                                            <CheckCircle className="w-3 h-3"/> OK
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded animate-pulse flex-shrink-0">
                                            <XCircle className="w-3 h-3"/> Pendiente
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subida */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-sm text-gray-800 mb-4 uppercase tracking-wide">Subir Nuevo Documento</h3>
                        <form onSubmit={handleUploadDoc} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Documento</label>
                                <select className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" value={docType} onChange={e => setDocType(e.target.value)}>
                                    <option value="certificado_energetico">Certificado Energético</option>
                                    <option value="seguro_hogar">Póliza Seguro Hogar</option>
                                    <option value="ibi">Recibo IBI</option>
                                    <option value="escritura">Escritura / Nota Simple</option>
                                    <option value="otro">Otro Documento</option>
                                </select>
                            </div>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer relative transition-all active:bg-gray-100 active:scale-95 touch-manipulation">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setDocFile(e.target.files?.[0] || null)} accept="application/pdf,image/*" />
                                <div className="flex flex-col items-center gap-1 pointer-events-none">
                                    {docFile ? (
                                        <>
                                            <FileCheck className="w-8 h-8 text-blue-500 mb-1"/>
                                            <span className="text-xs font-bold text-blue-700 truncate max-w-full">{docFile.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-gray-400 mb-1"/>
                                            <span className="text-sm font-medium text-gray-600">Toca para seleccionar</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isUploadingDoc}
                                className="w-full bg-rentia-blue text-white py-3.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm touch-manipulation"
                            >
                                {isUploadingDoc ? <Loader2 className="w-5 h-5 animate-spin"/> : <Upload className="w-5 h-5"/>}
                                Subir Documento
                            </button>
                        </form>
                    </div>
                </div>

                {/* Columna Der: Lista Archivos */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <FileText className="w-5 h-5 text-gray-500"/> Archivos en la Nube
                    </h3>
                    <div className="space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto custom-scrollbar">
                        {uploadedDocs.filter(d => d.propertyId === selectedPropertyId).length === 0 ? (
                            <div className="text-center py-10 text-gray-400">Carpeta vacía.</div>
                        ) : (
                            uploadedDocs.filter(d => d.propertyId === selectedPropertyId).map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-white transition-colors group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                                            <FileText className="w-4 h-4"/>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-gray-800 truncate">{doc.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">{doc.type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-rentia-blue hover:bg-blue-50 rounded-full transition-colors flex-shrink-0">
                                        <Download className="w-4 h-4"/>
                                    </a>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'candidates' && (
             <div className="space-y-6">
                 {Object.keys(candidatesByProperty).map(propName => (
                     <div key={propName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                         <div 
                            className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleCandidateProp(propName)}
                         >
                             <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                 <Building className="w-4 h-4 text-rentia-blue"/> {propName}
                             </h3>
                             <div className="flex items-center gap-3">
                                 <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-500 font-bold">{candidatesByProperty[propName].length}</span>
                                 {expandedCandidatesProp[propName] ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                             </div>
                         </div>
                         
                         {expandedCandidatesProp[propName] && (
                             <div className="divide-y divide-gray-100">
                                 {candidatesByProperty[propName].length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No hay candidatos activos para esta propiedad.</div>}
                                 {candidatesByProperty[propName].map(candidate => (
                                     <div key={candidate.id} className="p-4 hover:bg-blue-50/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                         <div className="w-full">
                                             <div className="flex items-center justify-between mb-1">
                                                 <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${candidate.status === 'approved' ? 'bg-green-500' : candidate.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                    <h4 className="font-bold text-gray-900 text-sm">{candidate.candidateName}</h4>
                                                 </div>
                                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                                                     candidate.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                     candidate.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                                     'bg-yellow-100 text-yellow-700'
                                                 }`}>
                                                     {candidate.status === 'pending_review' ? 'En Revisión' : candidate.status === 'approved' ? 'Aprobado' : 'Descartado'}
                                                 </span>
                                             </div>
                                             <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200 truncate max-w-[150px]">{candidate.roomName || 'General'}</span>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3"/> {candidate.submittedAt?.toDate().toLocaleDateString()}
                                                </p>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 ))}
                 {Object.keys(candidatesByProperty).length === 0 && <div className="p-8 text-center text-gray-400 border-2 border-dashed rounded-xl">Sin candidatos en proceso.</div>}
             </div>
        )}

        {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <UserCheck className="w-5 h-5 text-rentia-blue"/> Datos Personales
                    </h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label><input type="text" className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI</label><input type="text" className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:bg-white" value={profileForm.dni} onChange={e => setProfileForm({...profileForm, dni: e.target.value})} /></div>
                        </div>
                        <button type="submit" className="w-full bg-rentia-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 touch-manipulation">Actualizar Datos</button>
                    </form>

                    {/* SECCIÓN DOCUMENTOS LEGALES */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                         <h4 className="font-bold text-sm text-gray-700 mb-4 flex items-center gap-2"><FileText className="w-4 h-4"/> Documentación Legal Firmada</h4>
                         {userData?.gdpr?.signed ? (
                             <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex justify-between items-center">
                                 <div>
                                     <p className="text-xs font-bold text-green-800">Acuerdo de Confidencialidad</p>
                                     <p className="text-[10px] text-green-600">Firmado: {userData.gdpr.signedAt?.toDate().toLocaleDateString()}</p>
                                 </div>
                                 <button onClick={handlePrintAgreement} className="flex items-center gap-1 bg-white text-green-700 px-3 py-2 rounded border border-green-300 text-xs font-bold hover:bg-green-100">
                                     <Printer className="w-3 h-3"/> Ver Copia
                                 </button>
                             </div>
                         ) : (
                             <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-xs text-red-700">
                                 Pendiente de firma.
                             </div>
                         )}
                    </div>
                </div>
            </div>
        )}

      </div>

      {/* GDPR MODAL - BLOCKING */}
      {isGdprOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-5 bg-red-600 text-white border-b border-red-700 flex justify-between items-center shrink-0">
                      <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5"/> Acción Requerida: Firma de Contrato</h2>
                      <div className="text-xs font-bold bg-red-800 px-2 py-1 rounded">Paso {gdprStep}/2</div>
                  </div>
                  
                  <div className="p-6 md:p-8 overflow-y-auto leading-relaxed text-gray-600 text-sm space-y-4 bg-gray-50 flex-grow custom-scrollbar">
                      {gdprStep === 1 ? (
                          <>
                            <p className="font-bold text-gray-900 text-base md:text-lg mb-2">Importante: Actualización de Política de Privacidad</p>
                            <p>Para acceder al Panel de Propietario y poder visualizar los datos de sus inquilinos y candidatos, es obligatorio por Ley (RGPD) formalizar un <strong>Acuerdo de Encargo de Tratamiento y Confidencialidad</strong>.</p>
                            
                            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm mt-4 text-xs md:text-sm">
                                <div dangerouslySetInnerHTML={{ __html: LEGAL_TEXT_HTML }} />
                            </div>
                          </>
                      ) : (
                          <div className="space-y-6">
                              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 items-start">
                                  <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5"/>
                                  <div className="text-xs text-yellow-800">
                                      <strong>Aviso Legal:</strong> Al pulsar "Aceptar y Firmar", se generará un sello de tiempo electrónico y se registrarán sus datos de conexión como prueba de conformidad legal. Este documento será vinculante.
                                  </div>
                              </div>

                              <div className="border-t border-gray-200 pt-4 mt-2">
                                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-white rounded-xl border border-gray-200 hover:border-rentia-blue transition-all shadow-sm">
                                      <input 
                                        type="checkbox" 
                                        className="mt-1 w-5 h-5 text-rentia-blue rounded border-gray-300 focus:ring-rentia-blue cursor-pointer"
                                        checked={isGdprChecked}
                                        onChange={(e) => setIsGdprChecked(e.target.checked)}
                                      />
                                      <div className="text-sm text-gray-700">
                                          <strong>He leído, comprendo y acepto íntegramente</strong> el Acuerdo de Confidencialidad y Encargo de Tratamiento expuesto anteriormente. Me comprometo a custodiar los datos de los inquilinos con la máxima diligencia y confidencialidad.
                                      </div>
                                  </label>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-5 border-t border-gray-200 bg-white flex justify-end gap-3 items-center shrink-0">
                      {gdprStep === 1 ? (
                          <button onClick={() => setGdprStep(2)} className="bg-rentia-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2 text-sm w-full md:w-auto justify-center">
                              Leer y Continuar <ArrowRight className="w-4 h-4"/>
                          </button>
                      ) : (
                          <div className="flex flex-col-reverse md:flex-row gap-3 w-full justify-between items-center">
                              <button onClick={() => setGdprStep(1)} className="text-gray-500 hover:underline text-sm py-2">Volver a leer</button>
                              <button 
                                onClick={handleGdprAccept} 
                                disabled={!isGdprChecked || signing}
                                className={`px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all w-full md:w-auto text-sm ${
                                    !isGdprChecked || signing 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                                }`}
                              >
                                  {signing ? (
                                      <><Loader2 className="w-4 h-4 animate-spin"/> Generando Certificado...</>
                                  ) : (
                                      <><MousePointerClick className="w-4 h-4"/> Aceptar y Firmar</>
                                  )}
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
