import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Wifi, AlertTriangle, MessageCircle, Calendar, Sparkles, Clock, CheckCircle, Home, LogOut, ChevronRight, Download, CreditCard, Euro, User, Loader2, Send, X, AlertOctagon, Info, ShieldCheck, Eye } from 'lucide-react';
import { LegalModals } from '../LegalModals';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, onSnapshot, arrayUnion } from 'firebase/firestore';
import { Contract, Task } from '../../types';
import { Property, CleaningConfig } from '../../data/rooms';

export const TenantDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeContract, setActiveContract] = useState<Contract | null>(null);
    const [property, setProperty] = useState<Property | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'cleaning' | 'profile'>('home');
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ phone: '', bankAccount: '', wifiSsid: '', wifiPassword: '', privacyAccepted: false });
    const [activeLegalModal, setActiveLegalModal] = useState<'legal' | 'privacy' | 'social' | 'cookies' | 'cookiesPanel' | null>(null);
    const [showSignedGdprModal, setShowSignedGdprModal] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Incident Modal State
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [sendingIncident, setSendingIncident] = useState(false);
    const [incidentData, setIncidentData] = useState({
        title: '',
        description: '',
        priority: 'Media' as 'Baja' | 'Media' | 'Alta'
    });

    // Mis Incidencias (Lista y Chat)
    const [myIncidents, setMyIncidents] = useState<Task[]>([]);
    const [viewIncident, setViewIncident] = useState<Task | null>(null);
    const [incidentReply, setIncidentReply] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch User Profile
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const ud = userSnap.data();
                    setUserProfile(ud);
                    setFormData(prev => ({
                        ...prev,
                        phone: ud.phone || '',
                        bankAccount: ud.bankAccount || '',
                        privacyAccepted: ud.gdprAccepted || false
                    }));
                }

                // 2. Buscar contrato activo del usuario
                const q = query(collection(db, "contracts"), where("tenantId", "==", currentUser.uid), where("status", "==", "active"));
                const contractSnap = await getDocs(q);

                if (!contractSnap.empty) {
                    const contractData = { ...contractSnap.docs[0].data(), id: contractSnap.docs[0].id } as Contract;
                    setActiveContract(contractData);
                }
            } catch (error) {
                console.error("Error cargando datos del inquilino:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // 3. Suscribirse a Mis Incidencias
        const qIncidents = query(collection(db, "tasks"), where("tenantId", "==", currentUser.uid));
        const unsubIncidents = onSnapshot(qIncidents, (snap) => {
            const tasks = snap.docs.map(d => ({ ...d.data(), id: d.id } as Task));
            // Ordenar en cliente para evitar necesidad de índice compuesto inmediato
            tasks.sort((a, b) => {
                const tA = a.createdAt?.seconds || 0;
                const tB = b.createdAt?.seconds || 0;
                return tB - tA;
            });
            setMyIncidents(tasks);
        });

        return () => unsubIncidents();
    }, [currentUser]);

    // Fetch property when contract is found (REAL-TIME)
    useEffect(() => {
        if (!activeContract?.propertyId) return;

        const propRef = doc(db, "properties", activeContract.propertyId);
        const unsubProp = onSnapshot(propRef, (propSnap) => {
            if (propSnap.exists()) {
                const pData = propSnap.data() as Property;
                setProperty({ ...pData, id: propSnap.id });
                setFormData(prev => ({
                    ...prev,
                    wifiSsid: pData.wifiConfig?.ssid || '',
                    wifiPassword: pData.wifiConfig?.password || ''
                }));
            }
        });

        return () => unsubProp();
    }, [activeContract?.propertyId]);

    const handleUpdateProfile = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            if (!formData.privacyAccepted) {
                alert("Debes aceptar la política de privacidad para actualizar tus datos.");
                setSaving(false);
                return;
            }

            // 1. Actualizar perfil de usuario
            await updateDoc(doc(db, 'users', currentUser.uid), {
                phone: formData.phone,
                bankAccount: formData.bankAccount
            });

            // 2. Si hay una propiedad asociada, actualizar los datos WiFi de la casa
            if (activeContract?.propertyId) {
                await updateDoc(doc(db, 'properties', activeContract.propertyId), {
                    'wifiConfig.ssid': formData.wifiSsid,
                    'wifiConfig.password': formData.wifiPassword
                });
                // Actualizar estado local de la propiedad para que se vea el cambio en el Dashboard
                setProperty((prev: any) => ({
                    ...prev,
                    wifiConfig: { ssid: formData.wifiSsid, password: formData.wifiPassword }
                }));
            }

            setUserProfile((prev: any) => ({ ...prev, phone: formData.phone, bankAccount: formData.bankAccount }));
            alert("Perfil y configuración de la casa actualizados correctamente");
        } catch (e) {
            console.error(e);
            alert("Error al actualizar la información");
        } finally {
            setSaving(false);
        }
    };

    const generatePdf = async (html: string) => {
        setIsGeneratingPdf(true);
        try {
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.createElement('div');
            element.innerHTML = html;
            element.style.padding = '0';

            const opt = {
                margin: 0.5,
                filename: `RGPD_RentiaRoom_${currentUser?.displayName?.replace(/\s/g, '_') || 'Inquilino'}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            await html2pdf().from(element).set(opt).save();
        } catch (error) {
            console.error("PDF Error:", error);
            alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleSendIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!incidentData.title || !incidentData.description) return;
        if (!currentUser) return;

        setSendingIncident(true);
        try {
            // Crear la tarea de mantenimiento en el sistema global
            await addDoc(collection(db, "tasks"), {
                title: `[INCIDENCIA] ${property?.address || 'Sin Dirección'} - ${incidentData.title} `,
                description: `REPORTE DE INQUILINO: \nNombre: ${currentUser.displayName} \nEmail: ${currentUser.email} \nPropiedad: ${property?.address} \n\nMENSAJE: \n${incidentData.description} `,
                priority: incidentData.priority,
                status: 'Pendiente',
                category: 'Mantenimiento',
                assignee: 'Víctor', // Asignado por defecto a mantenimiento
                tenantId: currentUser.uid,
                propertyId: activeContract?.propertyId || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            alert("Incidencia enviada correctamente. El equipo de mantenimiento la revisará pronto.");
            setShowIncidentModal(false);
            setIncidentData({ title: '', description: '', priority: 'Media' });
        } catch (error) {
            console.error("Error enviando incidencia:", error);
            alert("Hubo un error al enviar tu reporte.");
        } finally {
            setSendingIncident(false);
        }
    };

    const handleReplyIncident = async () => {
        if (!viewIncident || !incidentReply.trim() || !currentUser) return;
        setSendingReply(true);
        try {
            const commentPayload = {
                id: Date.now().toString(),
                author: currentUser.displayName || 'Yo',
                content: incidentReply,
                createdAt: new Date().toISOString(),
                role: 'tenant' as const
            };

            await updateDoc(doc(db, "tasks", viewIncident.id), {
                comments: arrayUnion(commentPayload)
            });
            setIncidentReply('');
        } catch (error) {
            console.error(error);
            alert("Error al enviar respuesta");
        } finally {
            setSendingReply(false);
        }
    };

    // Lógica para calcular la PRÓXIMA LIMPIEZA
    const getNextCleaningDate = (config?: CleaningConfig) => {
        if (!config || !config.enabled || !config.days || config.days.length === 0) return null;

        const dayMap: Record<string, number> = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
        const today = new Date();
        const currentDayIdx = today.getDay();

        // Convertir nombres de días a índices y ordenar
        const cleaningDays = config.days.map(d => dayMap[d]).sort((a, b) => a - b);

        // Buscar el próximo día en la misma semana
        let nextDayIdx = cleaningDays.find(d => d >= currentDayIdx); // Incluye hoy si aún no ha pasado la hora (simplificado: asume que hoy cuenta)

        // Si no hay más días esta semana, coger el primero de la siguiente
        if (nextDayIdx === undefined) {
            nextDayIdx = cleaningDays[0];
        }

        const daysUntil = (nextDayIdx + 7 - currentDayIdx) % 7;
        // Si es hoy (0 días), asumimos que es la próxima visita

        const nextDate = new Date();
        nextDate.setDate(today.getDate() + daysUntil);

        return nextDate; // Objeto Date
    };

    const nextCleaning = getNextCleaningDate(property?.cleaningConfig);
    const nextCleaningStr = nextCleaning ? nextCleaning.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'No programada';

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rentia-blue"></div></div>;
    }

    // --- VISTAS INTERNAS ---

    const HomeView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-rentia-blue to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <h2 className="text-xl font-bold mb-1 relative z-10">Hola, {currentUser?.displayName?.split(' ')[0] || 'Inquilino'} 👋</h2>
                <p className="text-blue-100 text-sm relative z-10 flex items-center gap-1 opacity-90">
                    <Home className="w-3 h-3" /> {property?.address || 'Tu hogar'}
                </p>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={() => property?.whatsappGroupUrl ? window.open(property.whatsappGroupUrl, '_blank') : alert('Grupo de WhatsApp no configurado aún.')}
                        className="flex-1 bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 border border-white/20"
                    >
                        <MessageCircle className="w-5 h-5 text-rentia-gold" />
                        Grupo WhatsApp
                    </button>
                    <button
                        onClick={() => setShowIncidentModal(true)}
                        className="flex-1 bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 border border-white/20"
                    >
                        <AlertTriangle className="w-5 h-5 text-red-300" />
                        Incidencia
                    </button>
                </div>
            </div>

            {/* LISTADO DE MIS INCIDENCIAS ACTIVAS */}
            {myIncidents.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-4"><AlertOctagon className="w-4 h-4 text-orange-500" /> Mis Reportes e Incidencias</h3>
                    <div className="space-y-3">
                        {myIncidents.map(inc => (
                            <div key={inc.id} onClick={() => setViewIncident(inc)} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${inc.status === 'Completada' ? 'bg-green-500' : inc.status === 'En Curso' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{inc.title.replace('[INCIDENCIA]', '').trim()}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(inc.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()} • {inc.priority}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {inc.status === 'Completada' ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Resuelto</span> : <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{inc.status}</span>}
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                        <Wifi className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-widest">Conexión WiFi</h3>
                    <p className="font-bold text-gray-800 text-base truncate">{property?.wifiConfig?.ssid || 'No configurado'}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100 leading-none">{property?.wifiConfig?.password || 'Consulta con Admin'}</p>
                </div>

                <div
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setActiveTab('cleaning')}
                >
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-widest">Limpieza Habitual</h3>
                    <p className="font-bold text-gray-800 text-base truncate">{property?.cleaningConfig?.enabled ? nextCleaning?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }) : 'No activo'}</p>
                    <p className="text-xs text-indigo-600 mt-2 font-bold flex items-center gap-1">Gestionar servicio <ChevronRight className="w-3 h-3" /></p>
                </div>

                {/* Payments Status (Desktop View integration) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden col-span-1 sm:col-span-2 lg:col-span-1">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest">Estado Pagos</h3>
                        <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                            <CheckCircle className="w-3 h-3" /> Al día
                        </span>
                    </div>
                    <div className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Próximo Recibo</p>
                            <p className="text-2xl font-black text-gray-900 leading-none">{activeContract?.rentAmount}€</p>
                            <p className="text-[10px] text-gray-400 mt-2 italic">Vence el día 05 del mes</p>
                        </div>
                        <div className="bg-rentia-blue/10 text-rentia-blue p-4 rounded-2xl">
                            <CreditCard className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const CleaningView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <button onClick={() => setActiveTab('home')} className="text-gray-500 hover:text-rentia-black flex items-center gap-1 text-sm font-bold mb-2">
                <ChevronRight className="w-4 h-4 rotate-180" /> Volver
            </button>

            <h2 className="text-2xl font-bold text-rentia-black font-display">Servicio de Limpieza</h2>

            {!property?.cleaningConfig?.enabled ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Esta propiedad no tiene servicio de limpieza contratado actualmente.</p>
                </div>
            ) : (
                <>
                    {/* NEXT CLEANING CARD */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Próxima Visita</p>
                        <h3 className="text-3xl font-bold font-display mb-1 capitalize">{nextCleaningStr}</h3>
                        <div className="flex items-center gap-2 text-sm opacity-90 mt-2 bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                            <Clock className="w-4 h-4" />
                            {property.cleaningConfig.hours}
                        </div>
                    </div>

                    {/* DETAILS CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">Detalles del Servicio</h3>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Calendar className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Frecuencia</p>
                                    <p className="text-sm font-medium text-gray-800">{property.cleaningConfig.days.join(', ')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600"><Euro className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Coste Servicio</p>
                                    <p className="text-sm font-medium text-gray-800">{property.cleaningConfig.costPerHour}€ / hora</p>
                                </div>
                            </div>
                        </div>

                        {property.cleaningConfig.cleanerName && (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><User className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Personal Asignado</p>
                                        <p className="text-sm font-medium text-gray-800">
                                            {property.cleaningConfig.cleanerName.split(' ')[0]}
                                            {property.cleaningConfig.cleanerPhone ? ` (${property.cleaningConfig.cleanerPhone.slice(0, 6)}***${property.cleaningConfig.cleanerPhone.slice(-3)})` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 mt-2 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                            Recuerda dejar las zonas comunes (pasillos, cocina y baños) despejadas para facilitar el trabajo.
                        </div>
                    </div>

                    {/* TENANT RESPONSIBILITIES CARD */}
                    {property?.tenantCleaningSchedule && (
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white animate-in zoom-in duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 p-2 rounded-xl border border-white/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold">Tus Responsabilidades</h3>
                                    <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider opacity-80">Turnos y Normas</p>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <p className="text-sm font-medium leading-relaxed">
                                    {property.tenantCleaningSchedule}
                                </p>
                            </div>

                            <p className="text-[10px] text-center mt-4 opacity-50 italic">
                                Configurado por el equipo de Rentia para una mejor convivencia.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const DocsView = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold text-rentia-black font-display mb-4">Mis Documentos</h2>

            {activeContract?.fileUrl && (
                <div className="bg-white p-4 rounded-xl border-2 border-rentia-blue/10 shadow-sm flex items-center justify-between group hover:border-rentia-blue transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-rentia-blue rounded-lg group-hover:bg-rentia-blue group-hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-800">Contrato Arrendamiento</p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Vigente • PDF</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.open(activeContract.fileUrl, '_blank')}
                        className="bg-gray-50 hover:bg-rentia-blue hover:text-white text-gray-400 p-2 rounded-lg transition-all"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            )}

            {userProfile?.gdprAccepted && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-rentia-blue transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-800">Protección de Datos (Firmado)</p>
                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                                {userProfile.gdprDate?.toDate ? `Aceptado el ${userProfile.gdprDate.toDate().toLocaleDateString()}` : 'Aceptado (Digital)'}
                            </p>
                        </div>
                    </div>
                    <button
                        disabled={isGeneratingPdf}
                        onClick={() => {
                            const now = userProfile.gdprDate?.toDate ? userProfile.gdprDate.toDate() : new Date();
                            const day = now.getDate();
                            const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
                            const signingDateFormatted = `${day} de ${monthNames[now.getMonth()]} del ${now.getFullYear()}`;

                            const evidenceHtml = userProfile?.gdprEvidence || `
                                <div style="font-family: Arial, sans-serif; line-height: 1.4; color: #333; padding: 40px; border: 1px solid #eee; background: white;">
                                    <div style="text-align: center; border-bottom: 2px solid #0072CE; padding-bottom: 15px; margin-bottom: 25px;">
                                        <h1 style="color: #0072CE; margin: 0; font-size: 16px; text-transform: uppercase;">CONSENTIMIENTO EXPLÍCITO (SERVICIOS)</h1>
                                        <p style="margin: 5px 0 0 0; color: #666; font-size: 10px;">Rentia Investments S.L. - Gestión Documental RGPD</p>
                                    </div>
                                    <p style="text-align: right; font-weight: bold; margin-bottom: 20px; color: #444; font-size: 10px;">Murcia, en fecha ${signingDateFormatted}</p>
                                    
                                    <div style="font-size: 10px; text-align: justify; color: #444;">
                                        <p><strong>RENTIA INVESTMENTS S.L.</strong> es el Responsable del tratamiento (GDPR/LOPDGDD) y le informa:</p>
                                        <p><strong>Fines:</strong> prestación de servicios y envío de comunicaciones por <strong>Email, WhatsApp, SMS o llamadas</strong>.</p>
                                        <p><strong>Derechos:</strong> Acceso, rectificación, portabilidad y supresión enviando email a info@rentiaroom.com.</p>

                                        <div style="margin-top: 15px; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; background: #fffcf5;">
                                            <div style="margin-bottom: 3px;"><strong>Nombre:</strong> ${userProfile?.name || currentUser?.displayName || 'Usuario Registrado'}</div>
                                            <div><strong>DNI/NIE:</strong> ${userProfile?.dni || userProfile?.documentId || 'No proporcionado'}</div>
                                        </div>
                                    </div>

                                    <div style="margin-top: 30px; text-align: center;">
                                        <div style="display: block; margin: auto; max-width: 250px; border: 2px solid #0072CE; padding: 10px; border-radius: 8px; background-color: #f0f7ff;">
                                            <div style="color: #0072CE; font-weight: bold; font-size: 12px; display: block;">FIRMADO DIGITALMENTE</div>
                                            <div style="color: #444; font-size: 9px; font-family: monospace; margin-top: 3px; display: block;">UUID: ${currentUser?.uid}</div>
                                        </div>
                                        <p style="margin-top: 8px; font-size: 10px;">Firma: ________________________ (Digital)</p>
                                    </div>

                                    <div style="margin-top: 30px; border-top: 1px dashed #eee; padding-top: 10px; font-size: 8px; color: #777;">
                                        <strong>ANEXO LEGAL:</strong> Identificación: Rentia Investments S.L. (NIF: B-75995308). Exención: Rentabilidades estimadas.
                                    </div>
                                </div>
                            `;
                            generatePdf(evidenceHtml);
                        }}
                        className="bg-gray-50 hover:bg-rentia-blue hover:text-white text-gray-400 p-2 rounded-lg transition-all disabled:opacity-50"
                    >
                        {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                </div>
            )}

            <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Tus recibos mensuales aparecerán aquí automáticamente cada mes.</p>
            </div>
        </div>
    );

    const ProfileView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 bg-gradient-to-tr from-rentia-blue to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-xl">
                    {currentUser?.displayName?.[0] || 'U'}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{currentUser?.displayName}</h2>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
            </div>

            <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-rentia-blue font-bold text-sm mb-2 border-b border-gray-50 pb-2">
                    <User className="w-4 h-4" /> Datos de Contacto
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono de Contacto</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rentia-blue outline-none transition-all"
                        placeholder="Ej: +34 600 000 000"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IBAN (Para devolución de fianza)</label>
                    <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rentia-blue outline-none transition-all font-mono"
                        placeholder="ES00 0000 0000 0000 0000 0000"
                    />
                    <p className="text-[10px] text-orange-500 font-medium italic">Es imprescindible para devolverte la fianza al finalizar el contrato.</p>
                </div>

                {/* --- SECCIÓN WIFI COMPARTIDA --- */}
                <div className="pt-4 mt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-rentia-blue font-bold text-sm mb-4">
                        <Wifi className="w-4 h-4" /> Configuración WiFi de la Vivienda
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre de Red (SSID)</label>
                            <input
                                type="text"
                                value={formData.wifiSsid}
                                onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
                                className="w-full bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rentia-blue outline-none transition-all font-mono"
                                placeholder="Ej: Movistar_XXXX"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contraseña WiFi</label>
                            <input
                                type="text"
                                value={formData.wifiPassword}
                                onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                                className="w-full bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rentia-blue outline-none transition-all font-mono"
                                placeholder="Min. 8 caracteres"
                            />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2 border border-blue-100/50">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-600 font-medium italic">
                            Nota: Este cambio se sincronizará para **todos** los inquilinos de esta casa. Úsalo para actualizar la clave si ha cambiado.
                        </p>
                    </div>
                    {/* --- AVISO LEGAL Y CONSENTIMIENTO --- */}
                    <div className="pt-4 border-t border-gray-50">
                        {userProfile?.gdprAccepted ? (
                            <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100 mb-2">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">Consentimiento Prestado</p>
                                        <p className="text-[10px] text-green-700 opacity-80">Has aceptado la política de protección de datos conforme al RGPD.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={(e) => { e.preventDefault(); setShowSignedGdprModal(true); }}
                                        className="flex items-center gap-2 text-[10px] text-rentia-blue font-bold bg-white px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors shadow-sm"
                                    >
                                        <Eye className="w-3 h-3" /> Ver lo que firmé
                                    </button>
                                    <button
                                        disabled={isGeneratingPdf}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const now = userProfile.gdprDate?.toDate ? userProfile.gdprDate.toDate() : new Date();
                                            const day = now.getDate();
                                            const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
                                            const signingDateFormatted = `${day} de ${monthNames[now.getMonth()]} del ${now.getFullYear()}`;

                                            const evidenceHtml = userProfile?.gdprEvidence || `
                                                <div style="font-family: Arial, sans-serif; line-height: 1.4; color: #333; padding: 40px; border: 1px solid #eee; background: white;">
                                                    <div style="text-align: center; border-bottom: 2px solid #0072CE; padding-bottom: 15px; margin-bottom: 25px;">
                                                        <h1 style="color: #0072CE; margin: 0; font-size: 16px; text-transform: uppercase;">CONSENTIMIENTO EXPLÍCITO (SERVICIOS)</h1>
                                                        <p style="margin: 5px 0 0 0; color: #666; font-size: 10px;">Rentia Investments S.L. - Gestión Documental RGPD</p>
                                                    </div>
                                                    <p style="text-align: right; font-weight: bold; margin-bottom: 20px; color: #444; font-size: 10px;">Murcia, en fecha ${signingDateFormatted}</p>
                                                    
                                                    <div style="font-size: 10px; text-align: justify; color: #444;">
                                                        <p><strong>RENTIA INVESTMENTS S.L.</strong> es el Responsable del tratamiento (GDPR/LOPDGDD) y le informa:</p>
                                                        <p><strong>Fines:</strong> prestación de servicios y envío de comunicaciones por <strong>Email, WhatsApp, SMS o llamadas</strong>.</p>
                                                        <p><strong>Derechos:</strong> Acceso, rectificación, portabilidad y supresión enviando email a info@rentiaroom.com.</p>

                                                        <div style="margin-top: 15px; border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; background: #fffcf5;">
                                                            <div style="margin-bottom: 3px;"><strong>Nombre:</strong> ${userProfile?.name || currentUser?.displayName || 'Usuario Registrado'}</div>
                                                            <div><strong>DNI/NIE:</strong> ${userProfile?.dni || userProfile?.documentId || 'No proporcionado'}</div>
                                                        </div>
                                                    </div>

                                                    <div style="margin-top: 30px; text-align: center;">
                                                        <div style="display: block; margin: auto; max-width: 250px; border: 2px solid #0072CE; padding: 10px; border-radius: 8px; background-color: #f0f7ff;">
                                                            <div style="color: #0072CE; font-weight: bold; font-size: 12px; display: block;">FIRMADO DIGITALMENTE</div>
                                                            <div style="color: #444; font-size: 9px; font-family: monospace; margin-top: 3px; display: block;">UUID: ${currentUser?.uid}</div>
                                                        </div>
                                                        <p style="margin-top: 8px; font-size: 10px;">Firma: ________________________ (Digital)</p>
                                                    </div>

                                                    <div style="margin-top: 30px; border-top: 1px dashed #eee; padding-top: 10px; font-size: 8px; color: #777;">
                                                        <strong>ANEXO LEGAL:</strong> Identificación: Rentia Investments S.L. (NIF: B-75995308). Exención: Rentabilidades estimadas.
                                                    </div>
                                                </div>
                                            `;
                                            generatePdf(evidenceHtml);
                                        }}
                                        className="flex items-center gap-2 text-[10px] text-gray-600 font-bold bg-white px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isGeneratingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                        {isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                                <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.privacyAccepted ? 'bg-rentia-blue border-rentia-blue' : 'bg-white border-gray-300'}`}>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={formData.privacyAccepted}
                                        onChange={e => setFormData({ ...formData, privacyAccepted: e.target.checked })}
                                    />
                                    {formData.privacyAccepted && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                                <div className="text-xs text-gray-500 leading-relaxed">
                                    <span className="font-bold block text-gray-800 mb-0.5">Gestión de Datos Personales</span>
                                    He leído y acepto la <button onClick={(e) => { e.preventDefault(); setActiveLegalModal('privacy'); }} className="text-rentia-blue font-bold hover:underline">Política de Privacidad</button>. Entiendo que mis datos se tratarán conforme a la normativa española vigente para la gestión de mi perfil y estancia.
                                </div>
                            </label>
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleUpdateProfile}
                            disabled={saving || !formData.privacyAccepted}
                            className="w-full bg-rentia-black text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            {saving ? 'Guardando...' : 'Actualizar Información'}
                        </button>
                    </div>
                </div>

                <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />

                {/* MODAL DE DOCUMENTO FIRMADO */}
                {showSignedGdprModal && (
                    <div className="fixed inset-0 z-[11000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 lg:p-8" onClick={() => setShowSignedGdprModal(false)}>
                        <div className="bg-[#525659] w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            {/* --- HEADER VISUALIZADOR --- */}
                            <div className="bg-[#323639] p-4 flex justify-between items-center text-white border-b border-black/20">
                                <div className="flex items-center gap-4">
                                    <div className="bg-red-500 p-2 rounded-lg">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm">Hoja_Proteccion_Datos_${currentUser?.uid?.substring(0, 6)}.pdf</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vista de Documento Firmado</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={isGeneratingPdf}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const content = userProfile?.gdprEvidence || document.getElementById('print-evidence')?.innerHTML;
                                            if (content) generatePdf(content);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                                        title="Descargar PDF"
                                    >
                                        {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => setShowSignedGdprModal(false)} className="p-2 hover:bg-red-500 rounded-lg transition-colors ml-4">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* --- ÁREA DE PAPEL --- */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 custom-scrollbar scroll-smooth flex justify-center bg-[#525659]">
                                <div id="print-evidence" className="bg-white w-full max-w-[800px] min-h-[1100px] shadow-[0_0_50px_rgba(0,0,0,0.3)] p-12 md:p-20 relative origin-top">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: userProfile?.gdprEvidence || `
                                                <div style="font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #1a1a1a;">
                                                    <div style="text-align: center; border-bottom: 2px solid #0072CE; padding-bottom: 20px; margin-bottom: 30px;">
                                                        <h2 style="color: #0072CE; margin: 0; font-size: 18px; text-transform: uppercase;">CONSENTIMIENTO EXPLÍCITO (SERVICIOS)</h2>
                                                    </div>
                                                    
                                                    <p style="text-align: right; font-weight: bold; font-size: 13px;">Murcia, a ${userProfile.gdprDate?.toDate ? userProfile.gdprDate.toDate().toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES')}</p>

                                                    <div style="font-size: 13px; text-align: justify;">
                                                        <p><strong>RENTIA INVESTMENTS S.L.</strong> es el Responsable del tratamiento (GDPR y LOPDGDD).</p>
                                                        <p><strong>Fines:</strong> gestión de servicios y comunicaciones por <strong>Email, WhatsApp, SMS o llamadas</strong>.</p>
                                                        
                                                        <div style="margin-top: 30px; border: 1px solid #e0e0e0; padding: 25px; border-radius: 10px; background: #fffcf5;">
                                                            <p style="margin: 0 0 5px 0;"><strong>Nombre:</strong> ${userProfile?.name || currentUser?.displayName || 'Usuario Registrado'}</p>
                                                            <p style="margin: 0 0 5px 0;"><strong>DNI/NIE:</strong> ${userProfile?.dni || userProfile?.documentId || 'No proporcionado'}</p>
                                                            <p style="margin: 0;"><strong>Email:</strong> ${currentUser?.email}</p>
                                                            <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">UID: ${currentUser?.uid}</p>
                                                        </div>

                                                        <p style="margin-top: 30px; font-weight: bold; color: #0072CE; text-align: center;">El Interesado consiente el tratamiento de sus datos en los términos expuestos.</p>
                                                    </div>

                                                    <div style="margin-top: 60px; text-align: center;">
                                                        <div style="display: inline-block; border: 1.5px solid #0072CE; padding: 15px 40px; border-radius: 8px;">
                                                            <p style="margin: 0; font-weight: bold; color: #0072CE; font-size: 13px;">FIRMADO DIGITALMENTE</p>
                                                            <p style="margin: 5px 0 0 0; font-size: 10px; color: #666; font-family: monospace;">Certificado RentiaRoom Auth</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div style="margin-top: 100px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #eee; pt: 10px;">
                                                        Este documento tiene validez legal como justificante de aceptación de servicios y política de privacidad.
                                                    </div>
                                                </div>
                                            `
                                        }}
                                        className="prose prose-sm max-w-none text-gray-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-red-600">Cerrar Sesión</p>
                    <p className="text-[10px] text-red-400 uppercase font-black">Desconectarse del dispositivo</p>
                </div>
                <button onClick={logout} className="p-2 bg-white text-red-500 rounded-lg shadow-sm border border-red-100">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    const SidebarItem = ({ tab, icon: Icon, label }: { tab: any, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w - full flex items - center gap - 3 px - 4 py - 3 rounded - xl font - bold transition - all ${activeTab === tab ? 'bg-rentia-blue text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-100'} `}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col md:flex-row shadow-2xl relative overflow-hidden">

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-col p-6 sticky top-0 h-screen">
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-rentia-blue rounded-xl flex items-center justify-center text-white font-black text-xl italic">R</div>
                    <div>
                        <h1 className="font-display font-bold text-lg text-rentia-black leading-tight">Mi Espacio</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inquilinos Rentia</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <SidebarItem tab="home" icon={Home} label="Inicio" />
                    <SidebarItem tab="cleaning" icon={Sparkles} label="Limpieza" />
                    <SidebarItem tab="docs" icon={FileText} label="Documentos" />
                    <SidebarItem tab="profile" icon={User} label="Mi Perfil" />
                </nav>

                <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-rentia-blue font-bold shadow-sm">
                            {currentUser?.displayName?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">{currentUser?.displayName}</p>
                            <p className="text-[10px] text-gray-500 truncate">{currentUser?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col min-h-screen relative">

                {/* Mobile Top Bar */}
                <div className="md:hidden bg-white p-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
                    <h1 className="font-display font-bold text-lg text-rentia-black">Mi Espacio Rentia</h1>
                    <button onClick={logout} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 p-4 md:p-10 lg:p-16 overflow-y-auto">
                    <div className="max-w-5xl mx-auto">
                        {activeTab === 'home' && <HomeView />}
                        {activeTab === 'cleaning' && <CleaningView />}
                        {activeTab === 'docs' && <DocsView />}
                        {activeTab === 'profile' && <ProfileView />}
                    </div>
                </div>

                {/* Bottom Navigation Bar (Mobile Only) */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-40">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex - col items - center gap - 1 transition - colors ${activeTab === 'home' ? 'text-rentia-blue' : 'text-gray-400 hover:text-gray-600'} `}
                    >
                        <Home className={`w - 6 h - 6 ${activeTab === 'home' ? 'fill-current' : ''} `} />
                        <span className="text-[10px] font-bold">Inicio</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('cleaning')}
                        className={`flex flex - col items - center gap - 1 transition - colors ${activeTab === 'cleaning' ? 'text-rentia-blue' : 'text-gray-400 hover:text-gray-600'} `}
                    >
                        <Sparkles className={`w - 6 h - 6 ${activeTab === 'cleaning' ? 'fill-current' : ''} `} />
                        <span className="text-[10px] font-bold">Limpieza</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`flex flex - col items - center gap - 1 transition - colors ${activeTab === 'docs' ? 'text-rentia-blue' : 'text-gray-400 hover:text-gray-600'} `}
                    >
                        <FileText className={`w - 6 h - 6 ${activeTab === 'docs' ? 'fill-current' : ''} `} />
                        <span className="text-[10px] font-bold">Docs</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex - col items - center gap - 1 transition - colors ${activeTab === 'profile' ? 'text-rentia-blue' : 'text-gray-400 hover:text-gray-600'} `}
                    >
                        <User className={`w - 6 h - 6 ${activeTab === 'profile' ? 'fill-current' : ''} `} />
                        <span className="text-[10px] font-bold">Perfil</span>
                    </button>
                </div>
            </main>

            {/* --- INCIDENT MODAL --- */}
            {showIncidentModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-rentia-black/60 backdrop-blur-sm" onClick={() => setShowIncidentModal(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2 rounded-xl text-red-600">
                                    <AlertOctagon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Reportar Avería</h3>
                                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Centro de Mantenimiento</p>
                                </div>
                            </div>
                            <button onClick={() => setShowIncidentModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSendIncident} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest">¿Qué está pasando?</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    placeholder="Ej: Bombilla fundida, Grifo pierde agua..."
                                    value={incidentData.title}
                                    onChange={e => setIncidentData({ ...incidentData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-widest">Describe el problema</label>
                                <textarea
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all h-24 resize-none"
                                    placeholder="Explica detalladamente qué ocurre para que podamos ayudarte rápido..."
                                    value={incidentData.description}
                                    onChange={e => setIncidentData({ ...incidentData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {['Baja', 'Media', 'Alta'].map((p: any) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setIncidentData({ ...incidentData, priority: p })}
                                        className={`py - 2 rounded - xl text - [10px] font - black uppercase tracking - wider border - 2 transition - all ${incidentData.priority === p ? 'bg-rentia-black text-white border-rentia-black shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'} `}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={sendingIncident}
                                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {sendingIncident ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                    Enviar Reporte
                                </button>
                                <p className="text-[10px] text-gray-400 text-center mt-4">
                                    Si es una emergencia (humo, fuego, fuga masiva), contacta directamente por teléfono o servicios de emergencia.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
