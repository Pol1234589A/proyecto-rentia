
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Property } from '../../data/rooms';
import { Contract, PropertyDocument, SupplyInvoice, AgencyInvoice } from '../../types';
import { calculateRealOwnerCashflow } from '../../utils/financials';
import { compressImage } from '../../utils/imageOptimizer';
import {
    Building2, MapPin, ChevronDown, TrendingUp, DollarSign,
    Briefcase, User, FileCheck, Megaphone, Lock, FileText,
    Upload, Receipt, Download, Loader2, CreditCard, LayoutDashboard, Plus, CheckCircle, Percent, Gift, Sparkles, Clock, Calendar, AlertCircle, Save, ArrowRight, Trash2, Eye, FilePlus, Info, Printer, X, Wrench, Coins, Settings2
} from 'lucide-react';

type Tab = 'overview' | 'documents' | 'supplies' | 'invoices' | 'profile';

// ... (REQUIRED_DOCS remains unchanged) ...
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
    const [pendingLeads, setPendingLeads] = useState<any[]>([]);

    // User Profile Data (for Bank Account editing)
    const [ownerProfile, setOwnerProfile] = useState<any>(null);
    const [ibanForm, setIbanForm] = useState('');

    // UI State
    const [loading, setLoading] = useState(true);
    const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

    // Forms
    const [supplyForm, setSupplyForm] = useState({ propertyId: '', type: 'luz', amount: '', date: new Date().toISOString().split('T')[0] });
    const [supplyFile, setSupplyFile] = useState<File | null>(null);

    // Investment Forms
    const [investmentInputs, setInvestmentInputs] = useState<Record<string, number>>({});

    // Viewer State
    const [viewingPdf, setViewingPdf] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        // ... (Data fetching logic mostly same, just standardizing imports) ...
        // 0. Fetch User Profile
        const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setOwnerProfile(data);
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
                const prop = { ...data, id: doc.id, investmentAmount: data.investmentAmount || 0 } as Property;
                props.push(prop);
                initInvestments[prop.id] = prop.investmentAmount || 0;
            });
            setProperties(props);
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
        const qAgencyInv = query(collection(db, 'agency_invoices'), where('ownerId', '==', currentUser.uid), orderBy('date', 'desc'));
        const unsubAgencyInv = onSnapshot(qAgencyInv, (snapshot) => {
            const agInvs: AgencyInvoice[] = [];
            snapshot.forEach((doc) => {
                agInvs.push({ ...doc.data(), id: doc.id } as AgencyInvoice);
            });
            setAgencyInvoices(agInvs);
        });

        // 4. Fetch Management Leads (Viviendas en revisión)
        const qLeads = query(collection(db, 'management_leads'), where('linkedOwnerId', '==', currentUser.uid));
        const unsubLeads = onSnapshot(qLeads, (snapshot) => {
            const leads: any[] = [];
            snapshot.forEach((doc) => {
                leads.push({ ...doc.data(), id: doc.id });
            });
            setPendingLeads(leads);
        });

        return () => {
            unsubUser();
            unsubProps();
            unsubContracts();
            unsubAgencyInv();
            unsubLeads();
        };
    }, [currentUser]);

    // Fetch Sub-collections based on Properties
    useEffect(() => {
        if (properties.length === 0) return;
        const propIds = properties.map(p => p.id);

        // Documents & Invoices Logic: Support for >10 properties by chunking
        const chunkArray = (arr: any[], size: number) => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
            }
            return chunks;
        };

        const propChunks = chunkArray(propIds, 10);
        const allUnsubs: (() => void)[] = [];

        propChunks.forEach(chunk => {
            const qDocs = query(collection(db, "property_documents"), where("propertyId", "in", chunk));
            const unsubDocs = onSnapshot(qDocs, (snap) => {
                setDocuments(prev => {
                    const filtered = prev.filter(d => !chunk.includes(d.propertyId));
                    const next = [...filtered];
                    snap.forEach(d => next.push({ ...d.data(), id: d.id } as PropertyDocument));
                    return next;
                });
            });

            const qInvoices = query(collection(db, "supply_invoices"), where("propertyId", "in", chunk));
            const unsubInvoices = onSnapshot(qInvoices, (snap) => {
                setInvoices(prev => {
                    const filtered = prev.filter(i => !chunk.includes(i.propertyId));
                    const next = [...filtered];
                    snap.forEach(d => next.push({ ...d.data(), id: d.id } as SupplyInvoice));
                    next.sort((a, b) => (b.uploadedAt?.toMillis() || 0) - (a.uploadedAt?.toMillis() || 0));
                    return next;
                });
            });

            allUnsubs.push(unsubDocs, unsubInvoices);
        });

        return () => { allUnsubs.forEach(unsub => unsub()); };
    }, [properties]);

    const toggleExpand = (id: string) => {
        setExpandedPropId(expandedPropId === id ? null : id);
    };

    const handleSmartUpload = async (e: React.ChangeEvent<HTMLInputElement>, propertyId: string, docKey: string, docLabel: string) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        setUploadingDocKey(docKey);
        try {
            let blobToUpload: Blob = file;
            let finalName = file.name;

            // OPTIMIZACIÓN DE IMAGEN
            if (file.type.startsWith('image/') && !file.type.includes('gif')) {
                try {
                    blobToUpload = await compressImage(file);
                    finalName = file.name.substring(0, file.name.lastIndexOf('.')) + '.webp';
                } catch (err) {
                    console.warn("Falló la optimización, subiendo original", err);
                }
            }

            const storageRef = ref(storage, `properties/${propertyId}/docs/${docKey}_${Date.now()}_${finalName}`);
            await uploadBytes(storageRef, blobToUpload);
            const url = await getDownloadURL(storageRef);

            // Guardar en Firestore
            await addDoc(collection(db, "property_documents"), {
                propertyId,
                type: docKey,
                label: docLabel,
                url,
                fileName: finalName,
                uploadedAt: serverTimestamp(),
                ownerId: currentUser.uid,
                status: 'pending_review'
            });

            alert(`${docLabel} subido correctamente.`);
        } catch (error) {
            console.error(error);
            alert(`Error al subir ${docLabel}`);
        } finally {
            setUploadingDocKey(null);
        }
    };

    const handleUploadInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplyFile || !supplyForm.propertyId || !supplyForm.amount || !currentUser) return alert("Completa todos los campos");

        setUploading(true);
        try {
            let blobToUpload: Blob = supplyFile;
            let finalName = supplyFile.name;

            // OPTIMIZACIÓN DE IMAGEN
            if (supplyFile.type.startsWith('image/') && !supplyFile.type.includes('gif')) {
                try {
                    blobToUpload = await compressImage(supplyFile);
                    finalName = supplyFile.name.substring(0, supplyFile.name.lastIndexOf('.')) + '.webp';
                } catch (err) {
                    console.warn("Falló la optimización, subiendo original", err);
                }
            }

            const storageRef = ref(storage, `invoices/${supplyForm.propertyId}/${Date.now()}_${finalName}`);
            await uploadBytes(storageRef, blobToUpload);
            const url = await getDownloadURL(storageRef);

            await addDoc(collection(db, "supply_invoices"), {
                propertyId: supplyForm.propertyId,
                type: supplyForm.type,
                amount: parseFloat(supplyForm.amount),
                periodStart: supplyForm.date,
                periodEnd: supplyForm.date,
                fileUrl: url,
                fileName: finalName,
                status: 'pending',
                uploadedAt: serverTimestamp(),
                ownerId: currentUser.uid
            });

            setSupplyFile(null);
            setSupplyForm({ ...supplyForm, amount: '' });
            alert("Factura enviada correctamente.");
            setActiveTab('supplies');
        } catch (error) {
            console.error(error);
            alert("Error al subir factura.");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveInvestment = async (propId: string) => {
        const val = investmentInputs[propId] || 0;
        try {
            await updateDoc(doc(db, 'properties', propId), { investmentAmount: val });
            alert("Inversión guardada.");
        } catch (e) {
            alert("Error al guardar.");
        }
    };

    const handleUpdateIban = async () => {
        if (!currentUser) return;
        if (!ibanForm || ibanForm.length < 10) return alert("Introduce un IBAN válido");

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { bankAccount: ibanForm });
            alert("Información de pago actualizada correctamente.");
        } catch (e) {
            alert("Error al actualizar IBAN.");
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm("¿Seguro que quieres eliminar este documento?")) return;
        try {
            await deleteDoc(doc(db, "property_documents", docId));
            alert("Documento eliminado.");
        } catch (e) {
            alert("Error al eliminar.");
        }
    };

    // --- NEW: REAL CASHFLOW CALCULATION ---
    // Calculates global stats based on REAL DATA from all properties
    const realFinancials = useMemo(() => {
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalFee = 0;
        let totalNet = 0;
        let totalInvestment = 0;

        properties.forEach(p => {
            const propInvoices = invoices.filter(i => i.propertyId === p.id);
            const propContracts = contracts.filter(c => c.propertyId === p.id);
            const investment = investmentInputs[p.id] || p.investmentAmount || 0;
            const stats = calculateRealOwnerCashflow(
                propInvoices,
                propContracts,
                p.managementCommission || 15,
                { ibi: p.ibiYearly, community: p.communityMonthly, insurance: p.insuranceYearly },
                investment
            );
            totalRevenue += stats.revenue;
            totalExpenses += stats.expenses;
            totalFee += stats.fee;
            totalNet += stats.net;
            totalInvestment += investment;
        });

        const globalRoi = totalInvestment > 0 ? ((totalNet * 12) / totalInvestment) * 100 : 0;

        return {
            revenue: Math.round(totalRevenue),
            expenses: Math.round(totalExpenses),
            fee: Math.round(totalFee),
            net: Math.round(totalNet),
            roi: globalRoi
        };
    }, [invoices, contracts, properties, investmentInputs]);

    const totalProperties = properties.length;
    const totalRooms = properties.reduce((acc, p) => acc + (p.rooms?.length || 0), 0);
    const occupiedRooms = properties.reduce((acc, p) => acc + (p.rooms?.filter(r => r.status === 'occupied').length || 0), 0);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-rentia-blue" /></div>;
    }

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

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Propiedades</p>
                            <p className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-rentia-blue" /> {totalProperties}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Ocupación</p>
                            <p className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className={`w-5 h-5 ${occupancyRate >= 90 ? 'text-green-500' : 'text-yellow-500'}`} /> {occupancyRate}%
                            </p>
                        </div>

                        {/* REAL INCOME CARD */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-help group relative" title="Ingresos basados exclusivamente en contratos activos en el sistema">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Ingresos Brutos</p>
                            <p className="text-2xl font-bold text-rentia-blue flex items-center gap-2">
                                <DollarSign className="w-5 h-5" /> {realFinancials.revenue}€
                            </p>
                            <p className="text-[9px] text-gray-400 mt-1">Basado en contratos activos</p>
                        </div>

                        {/* ROI CARD - REMOVED */}
                        {/* <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Rentabilidad (Net ROI)</p>
                            <p className="text-2xl font-bold text-rentia-black flex items-center gap-2">
                                <Percent className="w-5 h-5 text-purple-500" /> {realFinancials.roi.toFixed(1)}%
                            </p>
                            <p className="text-[9px] text-gray-400 mt-1">Basado en Inversión Inicial</p>
                        </div> */}

                        {/* REAL NET CARD */}
                        <div className={`p-4 rounded-xl shadow-lg relative overflow-hidden group transition-all duration-300 ${realFinancials.net > 0 ? 'bg-rentia-black text-white' : 'bg-red-500 text-white'}`}>
                            <p className="text-xs text-white/70 font-bold uppercase mb-1 relative z-10">Cashflow Neto</p>
                            <div className="flex items-center gap-2 relative z-10">
                                <p className="text-2xl font-bold">
                                    {realFinancials.net.toFixed(0)}€ <span className="text-xs font-normal opacity-80">/ mes</span>
                                </p>
                            </div>
                            <p className="text-[9px] text-white/60 relative z-10 mt-1">Ingresos - Gastos - Honorarios</p>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform"></div>
                        </div>
                    </div>
                </header>

                {/* NAVIGATION TABS */}
                <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar border-b border-gray-200">
                    {/* ... Tabs logic same as before ... */}
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

                {/* --- TAB CONTENT (Rest of the rendering logic) --- */}
                {properties.length === 0 && pendingLeads.length > 0 && (
                    <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center animate-in zoom-in-95 mb-8">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Tu vivienda está en revisión</h3>
                        <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
                            Hemos recibido correctamente la información de <strong>{pendingLeads[0].property?.address}</strong>.
                            Nuestro equipo está validando el activo para activarlo en tu portal. Recibirás un aviso en breve.
                        </p>
                        <div className="flex justify-center gap-2">
                            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Estado: Validando Documentación</span>
                        </div>
                    </div>
                )}

                {properties.length === 0 && pendingLeads.length === 0 && !loading && (
                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 mb-8">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800">No tienes activos asignados</h3>
                        <p className="text-gray-500 text-sm">Si eres propietario, contacta con administración para vincular tus activos.</p>
                    </div>
                )}

                {activeTab === 'overview' && properties.length > 0 && (
                    <div className="space-y-6">
                        {/* ... (Property cards loop using real data) ... */}
                        {properties.map(p => {
                            const isExpanded = expandedPropId === p.id;
                            const propOccupancy = p.rooms.filter(r => r.status === 'occupied').length;

                            // Filter invoices for this property
                            const propInvoices = invoices.filter(i => i.propertyId === p.id);
                            // Filter contracts for this property
                            const propContracts = contracts.filter(c => c.propertyId === p.id);

                            // Calculate real financial for this specific property
                            const propInvestment = investmentInputs[p.id] || p.investmentAmount || 0;
                            const propRealStats = calculateRealOwnerCashflow(
                                propInvoices,
                                propContracts,
                                p.managementCommission || 15,
                                {
                                    ibi: p.ibiYearly,
                                    community: p.communityMonthly,
                                    insurance: p.insuranceYearly
                                },
                                propInvestment
                            );

                            return (
                                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                                    <div
                                        className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleExpand(p.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-rentia-blue shrink-0">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">{p.address}</h3>
                                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {p.city} • {p.rooms.length} Habs
                                                </p>
                                            </div>
                                        </div>

                                        {/* REAL CASHFLOW MINI-BADGE */}
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Cashflow Real</div>
                                            <div className={`font-bold ${propRealStats.net > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {propRealStats.net.toFixed(0)}€ / mes
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="bg-gray-50 border-t border-gray-100 p-4 md:p-6 animate-in slide-in-from-top-2">
                                            {/* ... Expanded details ... */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                <div className="bg-white p-4 rounded border">
                                                    <span className="text-xs text-gray-500">Ingresos (Contratos)</span>
                                                    <p className="font-bold text-green-600">+{propRealStats.revenue}€</p>
                                                </div>
                                                <div className="bg-white p-4 rounded border">
                                                    <span className="text-xs text-gray-500">Gastos (Facturas)</span>
                                                    <p className="font-bold text-red-500">-{propRealStats.expenses.toFixed(0)}€</p>
                                                </div>
                                                <div className="bg-white p-4 rounded border">
                                                    <span className="text-xs text-gray-500">Honorarios (Est.)</span>
                                                    <p className="font-bold text-blue-500">-{propRealStats.fee.toFixed(0)}€</p>
                                                </div>
                                            </div>

                                            {/* ROOMS LIST */}
                                            <div className="mb-8">
                                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <LayoutDashboard className="w-4 h-4 text-rentia-blue" />
                                                    Listado de Habitaciones
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {p.rooms.map((room, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col gap-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-bold text-gray-800">{room.name}</span>
                                                                <span className={`w-2 h-2 rounded-full ${room.status === 'occupied' ? 'bg-green-500' : room.status === 'reserved' ? 'bg-yellow-500' : 'bg-blue-400'}`}></span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-1">
                                                                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{room.status}</span>
                                                                <span className="text-xs font-black text-rentia-blue">{room.price}€</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* PROPERTY CONFIGURATION FORM */}
                                            <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                            <Settings2 className="w-5 h-5 text-rentia-blue" />
                                                            Configuración de la Vivienda
                                                        </h4>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Completa estos datos para calcular tu beneficio real neto</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSaveInvestment(p.id)}
                                                        className="bg-rentia-black text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                                                    >
                                                        <Save className="w-4 h-4" /> Guardar Cambios
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
                                                            IBI (Anual)
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rentia-blue outline-none transition-shadow"
                                                                value={p.ibiYearly || ''}
                                                                onChange={(e) => updateDoc(doc(db, 'properties', p.id), { ibiYearly: parseFloat(e.target.value) })}
                                                                placeholder="0€"
                                                            />
                                                            <span className="absolute right-3 top-3.5 text-gray-400 text-xs font-bold pointer-events-none">€</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
                                                            Comunidad (Mes)
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rentia-blue outline-none transition-shadow"
                                                                value={p.communityMonthly || ''}
                                                                onChange={(e) => updateDoc(doc(db, 'properties', p.id), { communityMonthly: parseFloat(e.target.value) })}
                                                                placeholder="0€"
                                                            />
                                                            <span className="absolute right-3 top-3.5 text-gray-400 text-xs font-bold pointer-events-none">€</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
                                                            Seguro (Anual)
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rentia-blue outline-none transition-shadow"
                                                                value={p.insuranceYearly || ''}
                                                                onChange={(e) => updateDoc(doc(db, 'properties', p.id), { insuranceYearly: parseFloat(e.target.value) })}
                                                                placeholder="0€"
                                                            />
                                                            <span className="absolute right-3 top-3.5 text-gray-400 text-xs font-bold pointer-events-none">€</span>
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
                )}

                {activeTab === 'invoices' && (
                    <div className="animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Printer className="w-5 h-5 text-rentia-blue" />
                                    Tus Facturas y Liquidaciones (Rentia)
                                </h3>
                            </div>

                            {agencyInvoices.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>Aún no hay facturas de rentia registradas para tu cuenta.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b">
                                            <tr>
                                                <th className="px-6 py-4">Fecha</th>
                                                <th className="px-6 py-4">Nº Liquidación</th>
                                                <th className="px-6 py-4">Mes Correspondiente</th>
                                                <th className="px-6 py-4 text-right">Importe Neto</th>
                                                <th className="px-6 py-4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {agencyInvoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                                                        {new Date(inv.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-bold text-gray-500">{inv.invoiceNumber}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded tracking-widest border border-blue-100">
                                                            {inv.details?.month || 'S/M'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-black text-lg text-gray-900">{(inv.totalAmount || 0).toFixed(2)}€</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            {inv.fileUrl ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => setViewingPdf(inv.fileUrl || null)}
                                                                        className="p-2 text-rentia-blue hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors font-bold text-xs"
                                                                        title="Ver en el navegador"
                                                                    >
                                                                        <Eye className="w-4 h-4" /> Ver
                                                                    </button>
                                                                    <a
                                                                        href={inv.fileUrl}
                                                                        download={inv.fileName || `Factura_Rentia_${inv.invoiceNumber}.pdf`}
                                                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors font-bold text-xs"
                                                                        title="Descargar PDF"
                                                                    >
                                                                        <Download className="w-4 h-4" /> Bajar
                                                                    </a>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] text-orange-500 font-bold flex items-center gap-1 italic">
                                                                    <Clock className="w-3 h-3" /> Generando PDF...
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* TAB: DOCUMENTS */}
                {activeTab === 'documents' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileCheck className="w-5 h-5 text-green-600" />
                                    Documentación Obligatoria
                                </h3>
                                <div className="space-y-4">
                                    {REQUIRED_DOCS.map(docReq => {
                                        const uploadedDoc = documents.find(d => d.type === docReq.key);
                                        return (
                                            <div key={docReq.key} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-rentia-blue transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${uploadedDoc ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                                        {uploadedDoc ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800">{docReq.label} {docReq.required && <span className="text-red-500">*</span>}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{docReq.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {uploadedDoc ? (
                                                        <>
                                                            <button onClick={() => window.open(uploadedDoc.url, '_blank')} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Ver archivo"><Eye className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeleteDocument(uploadedDoc.id)} className="p-2 text-red-300 hover:text-red-500 rounded-lg group-hover:opacity-100 opacity-0 transition-opacity" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                                        </>
                                                    ) : (
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                onChange={(e) => handleSmartUpload(e, properties[0]?.id || 'common', docReq.key, docReq.label)}
                                                                disabled={uploadingDocKey === docReq.key}
                                                            />
                                                            <button className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${uploadingDocKey === docReq.key ? 'bg-gray-100 text-gray-400' : 'bg-rentia-blue text-white hover:bg-blue-700'}`}>
                                                                {uploadingDocKey === docReq.key ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Subir'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                    Contratos Actuales
                                </h3>
                                {contracts.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-xl text-center border border-dashed">No hay contratos activos todavía.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {contracts.map(c => (
                                            <div key={c.id} className="p-3 border rounded-xl flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold text-xs uppercase">
                                                        {c.roomName?.charAt(0) || 'H'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800">{c.tenantName}</p>
                                                        <p className="text-[10px] text-gray-500">{c.propertyName} • {c.roomName}</p>
                                                    </div>
                                                </div>
                                                {c.fileUrl && (
                                                    <button onClick={() => window.open(c.fileUrl, '_blank')} className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200" title="Ver Contrato">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: SUPPLIES */}
                {activeTab === 'supplies' && (
                    <div className="animate-in fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Upload Form */}
                            <div className="lg:col-span-1">
                                <form onSubmit={handleUploadInvoice} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-rentia-blue" />
                                        Subir Nueva Factura
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Propiedad</label>
                                            <select required className="w-full text-sm p-2.5 border rounded-xl bg-gray-50" value={supplyForm.propertyId} onChange={e => setSupplyForm({ ...supplyForm, propertyId: e.target.value })}>
                                                <option value="">Seleccionar propiedad...</option>
                                                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Tipo Suministro</label>
                                                <select className="w-full text-sm p-2.5 border rounded-xl bg-gray-50" value={supplyForm.type} onChange={e => setSupplyForm({ ...supplyForm, type: e.target.value as any })}>
                                                    <option value="luz">💡 Luz</option>
                                                    <option value="agua">🚰 Agua</option>
                                                    <option value="gas">🔥 Gas</option>
                                                    <option value="internet">🌐 Internet</option>
                                                    <option value="otro">📄 Otro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Importe Bruto</label>
                                                <div className="relative">
                                                    <input type="number" step="0.01" required className="w-full text-sm p-2.5 pl-8 border rounded-xl font-bold bg-gray-50" value={supplyForm.amount} onChange={e => setSupplyForm({ ...supplyForm, amount: e.target.value })} placeholder="0.00" />
                                                    <DollarSign className="w-4 h-4 absolute left-2.5 top-3 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Fecha Factura</label>
                                            <input type="date" className="w-full text-sm p-2.5 border rounded-xl bg-gray-50" value={supplyForm.date} onChange={e => setSupplyForm({ ...supplyForm, date: e.target.value })} />
                                        </div>
                                        <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-rentia-blue transition-colors relative">
                                            <input type="file" required accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setSupplyFile(e.target.files?.[0] || null)} />
                                            {supplyFile ? (
                                                <div className="text-center">
                                                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                                                    <p className="text-xs font-bold mt-1 text-gray-700 max-w-[150px] truncate">{supplyFile.name}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <FilePlus className="w-8 h-8 text-gray-300" />
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Adjuntar PDF / Foto</p>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full bg-rentia-blue text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            disabled={uploading}
                                        >
                                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Receipt className="w-5 h-5" /> Enviar para Deducción</>}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* List of Recent Invoices */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800">Histórico de Facturas</h3>
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{invoices.length} Cargadas</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Fecha</th>
                                                    <th className="px-6 py-4">Suministro</th>
                                                    <th className="px-6 py-4">Propiedad</th>
                                                    <th className="px-6 py-4 text-right">Importe</th>
                                                    <th className="px-6 py-4">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {invoices.length === 0 ? (
                                                    <tr><td colSpan={5} className="p-12 text-center text-gray-400 italic">No has subido facturas aún.</td></tr>
                                                ) : (
                                                    invoices.map(inv => (
                                                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                                                                {new Date(inv.periodStart).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-6 py-4 capitalize font-bold text-gray-800">
                                                                {inv.type === 'luz' ? '💡 Luz' : inv.type === 'agua' ? '🚰 Agua' : inv.type === 'gas' ? '🔥 Gas' : inv.type === 'internet' ? '🌐 Internet' : '📄 Otros'}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap max-w-[150px] truncate">
                                                                {properties.find(p => p.id === inv.propertyId)?.address || 'N/D'}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-gray-800">{inv.amount}€</td>
                                                            <td className="px-6 py-4">
                                                                <button onClick={() => window.open(inv.fileUrl, '_blank')} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors group-hover:bg-blue-100">
                                                                    <Download className="w-4 h-4" />
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
                        </div>
                    </div>
                )}

                {/* TAB: PROFILE */}
                {activeTab === 'profile' && (
                    <div className="animate-in fade-in space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Profile Card */}
                            <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-blue-100 text-rentia-blue rounded-full flex items-center justify-center mb-4 relative group">
                                    <User className="w-12 h-12" />
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                                        <Eye className="w-6 h-6" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{ownerProfile?.name || currentUser?.displayName}</h3>
                                <p className="text-sm text-gray-500 mb-6">{currentUser?.email}</p>

                                <div className="w-full space-y-3 pt-6 border-t font-medium">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Teléfono:</span>
                                        <span className="text-gray-800">{ownerProfile?.phone || 'No definido'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">DNI:</span>
                                        <span className="text-gray-800 text-xs font-mono">{ownerProfile?.dni || 'No definido'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bank & Security Settings */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-lg">
                                        <CreditCard className="w-6 h-6 text-rentia-blue" />
                                        Información de Pago (IBAN)
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Aquí es donde recibirás tus liquidaciones mensuales. Asegúrate de que el titular coincida con el contrato.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Número de Cuenta (IBAN)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-grow p-4 bg-gray-50 border rounded-xl font-mono text-gray-800 text-lg uppercase tracking-wider focus:ring-2 focus:ring-rentia-blue outline-none"
                                                    placeholder="ES00 0000 0000 0000 0000 0000"
                                                    value={ibanForm}
                                                    onChange={(e) => setIbanForm(e.target.value.toUpperCase())}
                                                />
                                                <button
                                                    onClick={handleUpdateIban}
                                                    className="bg-rentia-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                                >
                                                    <Save className="w-5 h-5" /> Guardar
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 font-medium flex gap-3">
                                            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <p>RentiaRoom cumple con la normativa PCI-DSS y GDPR. Tus datos bancarios están cifrados y solo se usan para el envío de rentas.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-orange-50 p-8 rounded-2xl border-2 border-dashed border-orange-200">
                                    <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                        Zona Peligrosa
                                    </h3>
                                    <p className="text-sm text-orange-700 mb-4">Si deseas darte de baja del sistema o revocar el acceso a tus datos, contacta con legal@rentiaroom.com</p>
                                    <button className="text-orange-600 font-bold text-sm underline hover:text-orange-800">Cerrar sesión en todos los dispositivos</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PDF VIEWER MODAL */}
                {viewingPdf && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-rentia-blue" /> Visor de Factura</h3>
                                <div className="flex gap-4 items-center">
                                    <button
                                        onClick={() => window.open(viewingPdf, '_blank')}
                                        className="text-xs font-bold text-gray-500 hover:text-rentia-blue flex items-center gap-1"
                                    >
                                        <Download className="w-4 h-4" /> Abrir en nueva pestaña
                                    </button>
                                    <button onClick={() => setViewingPdf(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
                                </div>
                            </div>
                            <div className="flex-grow bg-gray-200">
                                <iframe
                                    src={viewingPdf}
                                    className="w-full h-full border-none"
                                    title="Invoice Viewer"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
