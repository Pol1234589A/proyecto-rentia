import React, { useState, useEffect } from 'react';
import { FileText, Key, Eye, EyeOff, CheckCircle, AlertTriangle, MessageSquare, Shield, Smartphone, Clock, XCircle, Check, CheckSquare, Square, Calendar, ClipboardList } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';

export const ProtocolsView: React.FC<{ isVanesa?: boolean, onOpenCandidateModal?: () => void }> = ({ isVanesa = false, onOpenCandidateModal }) => {
    const [activeSection, setActiveSection] = useState<'general' | 'vanesa'>('vanesa');
    const [signedConfidentiality, setSignedConfidentiality] = useState(isVanesa);
    const [showCredentials, setShowCredentials] = useState(false);
    const [signatureName, setSignatureName] = useState('');
    const [signatureDNI, setSignatureDNI] = useState('');

    const [recentCandidates, setRecentCandidates] = useState<any[]>([]);

    useEffect(() => {
        // Query de los últimos candidatos (traemos 20 para asegurar que al filtrar por fecha en cliente queden algunos si hay actividad)
        const q = query(collection(db, "candidate_pipeline"), orderBy("submittedAt", "desc"), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const relevantCandidates = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as any))
                .filter(c => {
                    const date = c.submittedAt?.toDate ? c.submittedAt.toDate() : new Date(c.submittedAt?.seconds * 1000);
                    return date >= sevenDaysAgo;
                })
                .slice(0, 5); // Mostrar solo los 5 más recientes tras filtrar

            setRecentCandidates(relevantCandidates);
        });
        return () => unsubscribe();
    }, []);

    const [myTasks, setMyTasks] = useState<any[]>([]);

    useEffect(() => {
        // Tareas asignadas a Vanesa o generales de "Gestión"
        // Simplificamos query a "pending" y filtramos en cliente para evitar problemas de updates de reglas/indices complejos ahora mismo
        const qTasks = query(collection(db, "tasks"), where("status", "in", ["pending", "in_progress"]));
        const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
            const tasks = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as any))
                .filter(t =>
                    t.assignedTo?.toLowerCase().includes('vanesa') ||
                    t.contactName?.toLowerCase().includes('vanesa') ||
                    t.category === 'management' // Tareas generales de gestión
                )
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setMyTasks(tasks);
        });
        return () => unsubscribeTasks();
    }, []);

    const handleCompleteTask = async (taskId: string) => {
        try {
            await updateDoc(doc(db, "tasks", taskId), {
                status: 'completed',
                completedAt: new Date(),
                completedBy: 'Vanesa'
            });
        } catch (error) {
            console.error("Error completando tarea", error);
        }
    };

    const whatsappMessageAyoub = encodeURIComponent("Hola Ayoub, soy Vanesa. Te recuerdo que tienes un nuevo contacto aceptado en la aplicación para coordinar visita. Por favor, contáctalo lo antes posible.");

    const handleSign = (e: React.FormEvent) => {
        e.preventDefault();
        if (signatureName && signatureDNI) {
            setSignedConfidentiality(true);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-rentia-blue" />
                    Protocolos y Procedimientos
                </h2>
                <p className="text-gray-500 mt-1">Base de conocimiento y flujos de trabajo de Rentia Investments.</p>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setActiveSection('vanesa')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeSection === 'vanesa' ? 'bg-rentia-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Onboarding & Captación (Vanesa)
                    </button>
                    {/* Más pestañas para futuros protocolos */}
                    <button
                        onClick={() => setActiveSection('general')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeSection === 'general' ? 'bg-rentia-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Protocolo General
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeSection === 'vanesa' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Workflow Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Objetivos y Rutina */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" /> 1. Rutina Diaria y Objetivos
                            </h3>
                            <div className="prose prose-sm text-gray-600">
                                <p className="mb-2"><strong>Objetivo Principal:</strong> Obtener información cualificada de potenciales inquilinos para filtrar su viabilidad.</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <div className="flex flex-wrap gap-3 my-3">
                                        <a href="https://www.idealista.com/login" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border-2 border-[#d2fa00] font-bold text-xs rounded-lg hover:bg-[#f9ffcc] transition-colors shadow-sm">
                                            <svg className="w-4 h-4 text-[#bfd600]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" /></svg>
                                            Idealista
                                        </a>
                                        <a href="https://www.tiktok.com/login" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white text-black border-2 border-black font-bold text-xs rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.16c0 2.52-1.12 4.84-2.9 6.24-1.72 1.36-4.03 2.06-6.17 1.67-2.61-.46-5.07-2.3-5.83-4.9-1.07-3.79 1.76-8.1 5.9-8.15.55-.01 1.07.03 1.67.07v4.18c-.37-.04-.77-.04-1.16-.01-1.28.1-2.2 1.32-2.03 2.58.12.98.87 1.79 1.83 1.96 1.34.25 2.65-.58 2.95-1.92.1-1.09.07-2.18.07-3.27V.02z" /></svg>
                                            TikTok
                                        </a>
                                        <a href="https://es.wallapop.com/login" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white text-[#13C1AC] border-2 border-[#13C1AC] font-bold text-xs rounded-lg hover:bg-teal-50 transition-colors shadow-sm">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-7h2v2h-2v-2zm0-6h2v4h-2V7z" /></svg>
                                            Wallapop
                                        </a>
                                        <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white text-[#1877F2] border-2 border-[#1877F2] font-bold text-xs rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                            Facebook
                                        </a>
                                    </div>
                                    <li>Revisar mensajes entrantes.</li>
                                    <li>
                                        <strong>Responder SIEMPRE</strong> con el objetivo de conseguir:
                                        <ul className="list-circle pl-5 mt-1 text-rentia-blue font-medium">
                                            <li>Nombre y Apellidos completos.</li>
                                            <li>Ocupación (Estudia, Trabaja, Ingresos demostrables).</li>
                                        </ul>
                                    </li>
                                </ul>
                                <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <p className="text-sm text-blue-800">
                                        💡 <strong>Nota:</strong> Una vez obtenidos estos datos, pasamos al filtro de la persona en nuestra base de datos interna.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Registro en Sistema */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" /> 2. Registro de Candidatos
                            </h3>
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className={`flex-1 text-sm text-gray-600 space-y-3 ${onOpenCandidateModal ? '' : 'opacity-100'}`}>
                                    <p>Cuando tengas los datos cualificados (Nombre + Ocupación), regístralos inmediatamente:</p>
                                    <ol className="list-decimal pl-5 space-y-2 font-medium text-gray-800">
                                        <li>Pulsa el botón de acción rápida aquí al lado.</li>
                                        <li>Rellena la ficha básica (Nombre, Teléfono, Ocupación).</li>
                                        <li>El sistema lo clasificará automáticamente.</li>
                                    </ol>
                                </div>
                                <div className="shrink-0 w-full md:w-1/3 bg-green-50 rounded-xl p-6 border border-green-100 flex flex-col items-center justify-center text-center shadow-sm">
                                    {onOpenCandidateModal ? (
                                        <button
                                            onClick={onOpenCandidateModal}
                                            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-bold text-sm mb-2 shadow-md hover:bg-green-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                            Registrar Candidato Ahora
                                        </button>
                                    ) : (
                                        <div className="p-3 bg-gray-100 rounded text-xs text-gray-500 italic">Botón activo en el Dashboard Principal</div>
                                    )}
                                    <span className="text-[10px] text-green-700 font-medium">Acceso directo habilitado</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Candidates Feed */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" /> Últimos Candidatos Enviados
                            </h3>
                            <div className="space-y-3">
                                {recentCandidates.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">No hay actividad reciente.</p>
                                ) : (
                                    recentCandidates.map(candidate => {
                                        const isApproved = candidate.status === 'accepted' || candidate.status === 'approved';
                                        const isRejected = candidate.status === 'rejected';
                                        return (
                                            <div key={candidate.id} className={`p-3 rounded-lg border flex items-center justify-between ${isApproved ? 'bg-green-50 border-green-200' : isRejected ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-gray-700">{candidate.candidateName}</span>
                                                    <span className="text-xs text-gray-500">{candidate.propertyName || 'Propiedad no esp.'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isApproved && (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-800 px-2 py-1 rounded animate-pulse">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            AVISAR A AYOUB
                                                        </div>
                                                    )}
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isApproved ? 'bg-green-200 text-green-800' : isRejected ? 'bg-red-200 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                                                        {isApproved ? 'APROBADO' : isRejected ? 'RECHAZADO' : 'PENDIENTE'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 3. Coordinación (Ayoub) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-purple-500" /> 3. Coordinación de Visitas (Ayoub)
                            </h3>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm text-purple-900 space-y-3">
                                <p><strong>Si el candidato es ACEPTADO:</strong> Aunque el sistema lo muestre a Ayoub, debes enviarle un recordatorio manual.</p>
                                <div className="mt-2">
                                    <a
                                        href={`https://wa.me/34638289883?text=${whatsappMessageAyoub}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full bg-[#25D366] text-white px-4 py-3 rounded-lg font-bold text-sm shadow-sm hover:shadow-md hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                        Notificar a Ayoub (WhatsApp)
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* 4. Mis Tareas Asignadas */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-indigo-500" /> 4. Mis Tareas de Gestión
                            </h3>
                            <div className="space-y-2">
                                {myTasks.length === 0 ? (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-400">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">¡Todo al día! No tienes tareas pendientes.</p>
                                    </div>
                                ) : (
                                    myTasks.map(task => (
                                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className="mt-0.5 text-gray-400 hover:text-green-500 transition-colors"
                                                title="Marcar como completada"
                                            >
                                                <Square className="w-5 h-5 group-hover:hidden" />
                                                <CheckSquare className="w-5 h-5 hidden group-hover:block" />
                                            </button>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800 leading-tight">{task.title}</p>
                                                {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
                                                <div className="flex items-center gap-2 mt-2">
                                                    {task.priority === 'high' && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">URGENTE</span>}
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {task.dueDate ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : 'Sin fecha'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Credentials & Security */}
                    <div className="space-y-6">
                        {/* Confidentiality Agreement */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-gray-900" /> Claves y Accesos
                            </h3>

                            {!signedConfidentiality ? (
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs leading-relaxed border border-yellow-100">
                                        <div className="font-bold flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3" /> Atención</div>
                                        Para visualizar las credenciales corporativas, debes firmar este compromiso de confidencialidad.
                                    </div>
                                    <form onSubmit={handleSign} className="space-y-3">
                                        <div className="text-xs text-gray-500 text-justify">
                                            Yo, con los datos abajo firmantes, me comprometo a mantener la más estricta confidencialidad respecto a las credenciales de acceso facilitadas. Entiendo que estos datos son propiedad de Rentia Investments S.L. y su distribución o uso no autorizado está prohibido.
                                        </div>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Nombre y Apellidos"
                                            className="w-full text-sm border p-2 rounded"
                                            value={signatureName}
                                            onChange={e => setSignatureName(e.target.value)}
                                        />
                                        <input
                                            required
                                            type="text"
                                            placeholder="DNI / NIE"
                                            className="w-full text-sm border p-2 rounded"
                                            value={signatureDNI}
                                            onChange={e => setSignatureDNI(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="w-full bg-rentia-black text-white py-2 rounded-lg text-xs font-bold hover:bg-gray-800"
                                            disabled={!signatureName || !signatureDNI}
                                        >
                                            Firmar y Mostrar Claves
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="bg-green-50 text-green-700 p-2 rounded text-xs flex items-center gap-2 border border-green-100">
                                        <CheckCircle className="w-3 h-3" /> Firmado por: {signatureName}
                                    </div>

                                    <div className="space-y-3">
                                        <button onClick={() => setShowCredentials(!showCredentials)} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                            {showCredentials ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            {showCredentials ? 'Ocultar Credenciales' : 'Ver Credenciales Descifradas'}
                                        </button>

                                        <div className="grid gap-3">
                                            <CredentialCard platform="Idealista" user="info@rentiaroom.com" pass="rentiaroom25A!" show={showCredentials} />
                                            <CredentialCard platform="Gmail (Wallapop)" user="rentiaroom@gmail.com" pass="adminrentiaA!" show={showCredentials} note="Usar para Wallapop" />
                                            <CredentialCard platform="Milanuncios" user="rtrygestion@gmail.com" pass="victorpol26A!" show={showCredentials} />
                                            <CredentialCard platform="Facebook" user="Verificar Páginas" pass="-" show={showCredentials} />
                                            <CredentialCard platform="Fotocasa" user="info@rentiaroom.com" pass="Polvictorjose04!" show={showCredentials} />
                                            <div className="pt-2 border-t mt-2">
                                                <CredentialCard
                                                    platform="TikTok Oficial"
                                                    user="rtrygestion@gmail.com"
                                                    pass="victorpol26A!"
                                                    show={showCredentials}
                                                    note="⚠️ Usar App Móvil | Recordar: MURCIA"
                                                />
                                                <div className="bg-pink-50 p-2 rounded text-[10px] text-pink-800 border border-pink-100 mt-1">
                                                    <p className="font-bold mb-0.5">Gestión TikTok:</p>
                                                    <ul className="list-disc pl-3 space-y-0.5">
                                                        <li>Revisar Mensajes Privados (DMs)</li>
                                                        <li>Responder comentarios en vídeos</li>
                                                        <li>Aclarar siempre ubicación: <strong>Murcia</strong></li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t mt-2">
                                                <CredentialCard
                                                    platform="CRM Rentger (Contratos)"
                                                    user="info@rentiaroom.com"
                                                    pass="polvictorjoseA!1"
                                                    show={showCredentials}
                                                    note="★ Firma Contratos y Base de Datos Oficial"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'general' && (
                <div className="text-center py-20 bg-white rounded-xl text-gray-400 border border-gray-200 border-dashed">
                    <p>El protocolo general de la empresa se desarrollará a partir del modelo de Vanesa.</p>
                </div>
            )}
        </div >
    );
};

const CredentialCard: React.FC<{ platform: string, user: string, pass: string, show: boolean, note?: string }> = ({ platform, user, pass, show, note }) => (
    <div className="p-3 bg-gray-50 rounded border border-gray-100 text-xs">
        <div className="font-bold text-gray-700 mb-1">{platform}</div>
        <div className="flex flex-col gap-1">
            <span className="text-gray-500 select-all">Usuario: <span className="text-gray-800">{user}</span></span>
            <span className="text-gray-500 flex items-center gap-1">
                Contraseña:
                <span className={`font-mono bg-white px-1 rounded border border-gray-200 select-all ${show ? 'text-gray-800' : 'text-transparent bg-gray-200 select-none'}`}>
                    {show ? pass : '••••••••'}
                </span>
            </span>
            {note && <span className="text-[10px] text-orange-600 bg-orange-50 px-1 rounded mt-1 inline-block w-fit">{note}</span>}
        </div>
    </div>
);
