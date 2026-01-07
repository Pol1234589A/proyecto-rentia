import React, { useState } from 'react';
import { FileText, Key, Eye, EyeOff, CheckCircle, AlertTriangle, MessageSquare, Shield, Smartphone } from 'lucide-react';

export const ProtocolsView: React.FC = () => {
    const [activeSection, setActiveSection] = useState<'general' | 'vanesa'>('vanesa');
    const [signedConfidentiality, setSignedConfidentiality] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [signatureName, setSignatureName] = useState('');
    const [signatureDNI, setSignatureDNI] = useState('');

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
                                    <li>Acceder diariamente a las plataformas: <strong>Idealista, Wallapop y Facebook</strong>.</li>
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
                                <div className="flex-1 text-sm text-gray-600 space-y-3">
                                    <p>Cuando tengas los datos cualificados (Nombre + Ocupación), debes registrarlos en el sistema:</p>
                                    <ol className="list-decimal pl-5 space-y-2 font-medium">
                                        <li>Ve a tu Panel de Control.</li>
                                        <li>Busca el botón verde: <strong>"Enviar Nuevo Candidato al Pipeline"</strong>.</li>
                                        <li>Rellena la ficha con la información obtenida.</li>
                                        <li>El candidato aparecerá automáticamente en el listado general de pendientes.</li>
                                    </ol>
                                </div>
                                <div className="shrink-0 w-full md:w-1/3 border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gray-50">
                                    {/* Placeholder visual del botón */}
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded font-bold text-xs mb-2 shadow-sm">
                                        + Enviar Nuevo Candidato al Pipeline
                                    </div>
                                    <span className="text-xs text-gray-400">Botón disponible en tu Dashboard</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Coordinación (Ayoub) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-purple-500" /> 3. Coordinación de Visitas (Ayoub)
                            </h3>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm text-purple-900 space-y-3">
                                <p><strong>Si el candidato es ACEPTADO:</strong> Aunque el sistema lo muestre a Ayoub, debes enviarle un recordatorio manual.</p>
                                <div className="bg-white p-3 rounded border border-purple-200 font-mono text-xs">
                                    <p className="font-bold mb-1 text-gray-500">📱 WhatsApp a Ayoub (+34 638 28 98 83)</p>
                                    <p>"Hola Ayoub, soy Vanesa. Te recuerdo que tienes un nuevo contacto aceptado en la aplicación para coordinar visita. Por favor, contáctalo lo antes posible."</p>
                                </div>
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
                                                <CredentialCard platform="CRM Rentger" user="administracion@rentiaroom.com" pass="administracion1A!murcia" show={showCredentials} />
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
        </div>
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
