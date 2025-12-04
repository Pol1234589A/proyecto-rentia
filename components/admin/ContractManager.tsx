import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { UserProfile, Contract } from '../../types';
import { Property } from '../../data/rooms';
import { Check, ChevronRight, ChevronLeft, UserPlus, Search, Calendar, DollarSign, FileText, Save, Loader2, AlertCircle, Building, User, Upload, Plus, FilePlus, Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, ChevronDown, X, Eye, Link } from 'lucide-react';
import { ImageUploader } from './ImageUploader'; // Import ImageUploader to reuse for PDF upload if needed, or simple input

interface ContractManagerProps {
    initialMode?: 'list' | 'create' | 'details';
    preSelectedRoom?: { propertyId: string, roomId: string, price: number, roomName: string, propertyAddress: string };
    contractId?: string;
    onClose?: () => void;
}

const numberToLetters = (num: number): string => {
    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    if (num === 0) return 'CERO';
    if (num >= 100) return num.toString(); // Simplificado para el ejemplo, idealmente usar librería completa
    let letras = '';
    const d = Math.floor(num / 10);
    const u = num % 10;
    if (d === 0) letras = unidades[u];
    else if (d === 1) letras = especiales[u];
    else if (d === 2 && u === 0) letras = 'VEINTE';
    else if (d === 2) letras = 'VEINTI' + unidades[u];
    else letras = decenas[d] + (u > 0 ? ' Y ' + unidades[u] : '');
    return letras;
};

const getLongDate = (dateStr?: string) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
};

const TEMPLATES = [
    { 
        id: 1, 
        name: 'CONTRATO HABITACIÓN - RENTIAROOM COMPLETO', 
        content: `
        <div style="font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: #000;">
            <h3 style="text-align: center; text-decoration: underline; font-weight: bold; margin-bottom: 20px;">CONTRATO DE ARRENDAMIENTO DE HABITACIÓN</h3>

            <p style="text-align: right;">En la ciudad de {{inmueble_ciudad}}, a {{fecha_actual_texto}}</p>

            <h4 style="font-weight: bold; margin-top: 20px;">REUNIDOS</h4>

            <p><strong>DE UNA PARTE (LA ARRENDADORA):</strong><br/>
            La entidad mercantil / propietario <strong>{{arrendador_nombre}}</strong>, con DNI/CIF {{arrendador_dni}}.<br/>
            En lo sucesivo denominada <strong>EL ARRENDADOR</strong>.</p>

            <p><strong>DE OTRA PARTE (LA ARRENDATARIA):</strong><br/>
            D/Dña. <strong>{{inquilino_nombre}}</strong>, mayor de edad, con DNI {{inquilino_dni}}, con domicilio a efectos de notificaciones en la vivienda objeto de este contrato, y teléfono de contacto: {{inquilino_telefono}} (en adelante, <strong>LA ARRENDATARIA</strong>).</p>

            <p><strong>INTERVIENE:</strong><br/>
            RENTIA INVESTMENTS S.L. (B-75995308), con domicilio en C/ Brazal de Álamos 7, 30130, Beniel (Murcia), representada por su apoderado D. Pol Matencio Espinosa (DNI 44996927A), en calidad de GESTORA del inmueble y mandataria del ARRENDADOR para la gestión y administración del presente contrato.</p>

            <p>Ambas partes, reconociéndose mutua capacidad legal para contratar y obligarse, sin la concurrencia de avalista en este acto,</p>

            <h4 style="font-weight: bold; margin-top: 20px;">EXPONEN</h4>

            <p><strong>PRIMERO.-</strong> EL ARRENDADOR es titular, en concepto de propietario, de la vivienda sita en <strong>{{inmueble_direccion}}, {{inmueble_ciudad}}</strong>.</p>

            <p><strong>SEGUNDO.-</strong> Que la vivienda anteriormente descrita dispone de la certificación de la eficiencia energética de edificios, en cumplimiento de la normativa vigente, declarando EL ARRENDADOR que dicho certificado se encuentra en vigor y a disposición de LA ARRENDATARIA.</p>

            <p><strong>TERCERO.-</strong> Que LA ARRENDATARIA arrienda la <strong>habitación {{inmueble_habitacion}}</strong> del citado inmueble, amueblada y equipada, con acceso a las zonas comunes detalladas en el inventario adjunto.<br/>
            El presente contrato se rige por los artículos 1543 y siguientes del Código Civil, al tratarse de un arrendamiento de habitación, modalidad no regulada expresamente en la Ley 29/1994, de Arrendamientos Urbanos (LAU).</p>

            <h4 style="font-weight: bold; margin-top: 20px;">PACTAN</h4>

            <p><strong>PRIMERO.- OBJETO DEL CONTRATO</strong><br/>
            El presente contrato tiene por objeto el arrendamiento temporal de la habitación {{inmueble_habitacion}}, debidamente amueblada y equipada, sita en el inmueble descrito, con acceso a las zonas comunes.<br/>
            Dicho arrendamiento se destina exclusivamente al uso habitacional temporal de LA ARRENDATARIA por motivos de {{motivo_alquiler}}.<br/>
            Queda expresamente prohibido el ejercicio de cualquier actividad profesional, comercial, industrial o inmoral en la habitación o vivienda.</p>

            <p><strong>SEGUNDO.- DURACIÓN DEL CONTRATO</strong><br/>
            El presente contrato tendrá vigencia desde el <strong>{{fecha_inicio}}</strong>, hasta el <strong>{{fecha_fin}}</strong> incluido, fecha en la que LA ARRENDATARIA deberá desalojar la habitación automáticamente, salvo acuerdo expreso y por escrito de prórroga entre las partes.</p>

            <p><strong>TERCERO.- RENTA Y GASTOS</strong><br/>
            La renta mensual es de <strong>{{renta_letras}} EUROS ({{renta_importe}} €)</strong>.<br/>
            Los gastos de suministros (agua, luz e internet) {{tipo_gastos_texto}}. En caso de no estar incluidos, se calcularán según las facturas recibidas.<br/>
            El pago de la renta deberá abonarse entre los días 1 y 5 de cada mes.<br/>
            El pago se realizará mediante transferencia bancaria a la cuenta:<br/>
            Titular: RENTIA INVESTMENTS, S.L. (NIF: B-75995308)<br/>
            IBAN: ES29 3058 0351 6227 2001 6478</p>

            <p><strong>CUARTO.- FORMA DE PAGO E IMPAGO</strong><br/>
            LA ARRENDATARIA se obliga expresamente a abonar puntualmente la renta mensual pactada. El impago total o parcial facultará al ARRENDADOR para exigir su cumplimiento o la resolución del contrato conforme al artículo 1124 del Código Civil.</p>

            <p><strong>QUINTO.- OBLIGACIONES DE LA ARRENDATARIA</strong><br/>
            LA ARRENDATARIA se obliga a:<br/>
            a) Abonar puntualmente la renta y gastos.<br/>
            b) Destinar la habitación exclusivamente a su uso temporal.<br/>
            c) Mantener las zonas comunes en buen estado de limpieza.<br/>
            d) No introducir mascotas sin autorización.<br/>
            e) No ceder ni subarrendar la habitación.<br/>
            f) No fumar dentro de la vivienda.<br/>
            g) Respetar las normas de convivencia.</p>

            <p><strong>SEXTO.- OBLIGACIONES DEL ARRENDADOR</strong><br/>
            EL ARRENDADOR se compromete a realizar las reparaciones necesarias para garantizar la habitabilidad, salvo aquellas por mal uso del inquilino, y a devolver la fianza en el plazo legal tras la finalización del contrato si no hay incidencias.</p>

            <p><strong>SÉPTIMO.- FIANZA</strong><br/>
            En este acto, LA ARRENDATARIA hace entrega de la cantidad de <strong>{{fianza_importe}} €</strong> en concepto de fianza legal.<br/>
            Esta fianza no podrá destinarse al pago de mensualidades de renta.</p>

            <p><strong>OCTAVO A DECIMOSÉPTIMO.- (ESTÁNDAR)</strong><br/>
            Se aplican las cláusulas estándar relativas a reparaciones, normas de convivencia, prohibición de fumar, acceso del arrendador previo aviso, responsabilidad por daños, prohibición de subarriendo, protección de datos y fuerza mayor.</p>

            <p><strong>DECIMOCTAVO.- INVENTARIO DIGITAL</strong><br/>
            El estado de la habitación se refleja en el inventario visual accesible mediante CÓDIGO QR o enlace facilitado a la entrega de llaves. Se otorga a este archivo digital plena validez jurídica.</p>

            <p><strong>VIGÉSIMO TERCERO.- JURISDICCIÓN</strong><br/>
            Las partes se someten a los Juzgados y Tribunales de la ciudad de Murcia, con renuncia a su fuero propio.</p>

            <p><strong>VIGÉSIMO OCTAVA.– PAGO INICIAL</strong><br/>
            Para la formalización, LA ARRENDATARIA abona:<br/>
            - Parte proporcional mes en curso: {{pago_prorrateado}} €<br/>
            - Fianza: {{fianza_importe}} €<br/>
            <strong>TOTAL A LA FIRMA: {{total_inicial}} €</strong></p>

            <p><strong>VIGÉSIMO NOVENA.- DESISTIMIENTO ANTICIPADO</strong><br/>
            Si LA ARRENDATARIA desiste antes del fin del contrato, perderá la fianza salvo que encuentre un sustituto aceptado por la propiedad.</p>

            <p><strong>CUADRIGÉSIMO TERCERA.- GESTIÓN</strong><br/>
            RENTIA INVESTMENTS S.L. interviene exclusivamente como mandataria del ARRENDADOR para la gestión.</p>

            <br/><br/>
            <p>Y en prueba de conformidad, firman el presente contrato en el lugar y fecha indicados.</p>
            <br/><br/>

            <table style="width: 100%; border: none;">
                <tr>
                    <td style="width: 50%; vertical-align: top;">
                        <strong>EL ARRENDADOR</strong><br/><br/><br/><br/>
                        Fdo.: {{arrendador_nombre}}
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <strong>LA ARRENDATARIA</strong><br/><br/><br/><br/>
                        Fdo.: {{inquilino_nombre}}
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="vertical-align: top; padding-top: 40px;">
                        <strong>LA GESTORA (RENTIA INVESTMENTS S.L.)</strong><br/><br/><br/><br/>
                        Fdo.: Pol Matencio Espinosa
                    </td>
                </tr>
            </table>

            <div style="page-break-before: always;"></div>

            <h3 style="text-align: center; text-decoration: underline;">ANEXO I – NORMAS DE CONVIVENCIA</h3>
            <ul>
                <li><strong>Descanso:</strong> Silencio a partir de las 22:00h.</li>
                <li><strong>Limpieza:</strong> Turnos obligatorios para basura y cocina. Fregar tras usar.</li>
                <li><strong>Visitas:</strong> No se permite la pernoctación frecuente de personas ajenas sin autorización.</li>
                <li><strong>Fumar:</strong> Terminantemente prohibido en toda la vivienda.</li>
                <li><strong>Electrodomésticos:</strong> Uso responsable. Lavadora máx 22:30h.</li>
            </ul>
            <p>El incumplimiento grave de estas normas podrá dar lugar a la resolución del contrato.</p>
        </div>
        `
    }
];

const STEPS = [
    { id: 1, label: 'Datos' },
    { id: 2, label: 'Partes' },
    { id: 3, label: 'Renta' },
    { id: 4, label: 'Fianza' },
    { id: 5, label: 'Docs' },
    { id: 6, label: 'Fin' },
];

export const ContractManager: React.FC<ContractManagerProps> = ({ initialMode = 'list', preSelectedRoom, contractId, onClose }) => {
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'details'>(initialMode);
    
    // Create Wizard State
    const [step, setStep] = useState(1);
    
    // Data Lists
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);

    // Create/Edit State
    const [isExternalContract, setIsExternalContract] = useState(false); // NEW: Flag for Rentger contracts
    const [externalRef, setExternalRef] = useState(''); // NEW: Rentger Reference
    const [contractData, setContractData] = useState<Partial<Contract>>({
        alias: '', startDate: new Date().toISOString().split('T')[0], endDate: '', rentAmount: 0, status: 'pending', expensesType: 'fixed', isProrated: true, depositAmount: 0, extraDeposit: 0
    });
    
    // Details View State
    const [viewContract, setViewContract] = useState<Contract | null>(null);

    // Editor State
    const [editorContent, setEditorContent] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);

    // User Selection State
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedOwner, setSelectedOwner] = useState<UserProfile | null>(null);
    const [selectedTenant, setSelectedTenant] = useState<UserProfile | null>(null);
    const [showUserModal, setShowUserModal] = useState<'owner' | 'tenant' | 'guarantor' | null>(null);
    const [newUserForm, setNewUserForm] = useState<Partial<UserProfile>>({ role: 'tenant', name: '', email: '', dni: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (contractId) {
            loadContractDetails(contractId);
        } else if (preSelectedRoom) {
            setupNewContract(preSelectedRoom);
        }
    }, [contractId, preSelectedRoom]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersSnap, propsSnap, contractsSnap] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "properties")),
                getDocs(collection(db, "contracts"))
            ]);

            const uList: UserProfile[] = [];
            usersSnap.forEach(d => uList.push({ ...d.data(), id: d.id } as UserProfile));
            setUsers(uList);

            const pList: Property[] = [];
            propsSnap.forEach(d => pList.push({ ...d.data(), id: d.id } as Property));
            setProperties(pList);

            const cList: Contract[] = [];
            contractsSnap.forEach(d => cList.push({ ...d.data(), id: d.id } as Contract));
            setContracts(cList);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const setupNewContract = (roomData: any) => {
        setViewMode('create');
        setIsExternalContract(false); // Reset to false default
        setContractData({
            alias: `${roomData.propertyAddress} - ${roomData.roomName}`,
            propertyId: roomData.propertyId,
            roomId: roomData.roomId,
            roomName: roomData.roomName,
            rentAmount: roomData.price,
            depositAmount: roomData.price,
            startDate: new Date().toISOString().split('T')[0],
            status: 'pending'
        });
        setSelectedPropertyId(roomData.propertyId);
        setSelectedRoomId(roomData.roomId);
        setStep(1);
    };

    const loadContractDetails = async (id: string) => {
        setLoading(true);
        try {
            const docRef = doc(db, "contracts", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = { ...docSnap.data(), id: docSnap.id } as Contract;
                setViewContract(data);
                setViewMode('details');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC: CREATE USER ---
    const handleCreateUser = async () => {
        if (!newUserForm.name || !newUserForm.email) return alert("Nombre y Email obligatorios");
        const newId = `USER_${Date.now()}`;
        // Fix: Ensure the role assigned to the new user is a valid UserProfile role.
        const newUser: UserProfile = { ...newUserForm as UserProfile, role: showUserModal || 'tenant', createdAt: new Date().toISOString() };
        await setDoc(doc(db, "users", newId), newUser);
        setUsers([...users, { ...newUser, id: newId }]);
        if (showUserModal === 'owner') setSelectedOwner({ ...newUser, id: newId });
        if (showUserModal === 'tenant') setSelectedTenant({ ...newUser, id: newId });
        setShowUserModal(null);
    };

    // --- LOGIC: GENERATE CONTENT ---
    const generateContractContent = (rawHtml: string) => {
        let content = rawHtml;
        
        // Calcular prorrateo inicial (días restantes del mes)
        const start = new Date(contractData.startDate!);
        const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - start.getDate() + 1;
        const proratedAmount = (contractData.rentAmount! / 30) * daysRemaining;
        const totalInitial = proratedAmount + (contractData.depositAmount || 0);

        // Buscar datos propiedad
        const prop = properties.find(p => p.id === selectedPropertyId);
        const room = prop?.rooms.find(r => r.id === selectedRoomId);

        const replacements: Record<string, string> = {
            '{{fecha_actual_texto}}': getLongDate(),
            '{{fecha_inicio}}': getLongDate(contractData.startDate),
            '{{fecha_fin}}': getLongDate(contractData.endDate),
            
            '{{arrendador_nombre}}': selectedOwner?.name || '_________________',
            '{{arrendador_dni}}': selectedOwner?.dni || '_________',
            
            '{{inquilino_nombre}}': selectedTenant?.name || '_________________',
            '{{inquilino_dni}}': selectedTenant?.dni || '_________',
            '{{inquilino_telefono}}': selectedTenant?.phone || '_________',
            
            '{{inmueble_direccion}}': prop?.address || '_________________',
            '{{inmueble_ciudad}}': prop?.city || 'Murcia',
            '{{inmueble_habitacion}}': room?.name || '___',
            
            '{{renta_importe}}': String(contractData.rentAmount || 0),
            '{{renta_letras}}': numberToLetters(contractData.rentAmount || 0),
            '{{fianza_importe}}': String(contractData.depositAmount || 0),
            
            '{{pago_prorrateado}}': proratedAmount.toFixed(2),
            '{{total_inicial}}': totalInitial.toFixed(2),
            
            '{{tipo_gastos_texto}}': contractData.expensesType === 'fixed' ? 'están incluidos' : 'NO están incluidos y se repartirán',
            '{{motivo_alquiler}}': 'estudios/trabajo temporal'
        };

        Object.entries(replacements).forEach(([k, v]) => {
            // Replace globally
            content = content.split(k).join(v);
        });
        
        return content;
    };

    // --- LOGIC: SAVE CONTRACT ---
    const handleFinish = async () => {
        if (!selectedOwner || !selectedTenant) return alert("Faltan partes. Por favor revisa el paso 2.");
        setLoading(true);
        try {
            // Build Payload (Common for both types)
            const payload: any = {
                ...contractData,
                ownerId: selectedOwner.id!,
                ownerName: selectedOwner.name,
                tenantId: selectedTenant.id!,
                tenantName: selectedTenant.name,
                createdAt: serverTimestamp(),
                isExternal: isExternalContract
            };

            if (isExternalContract) {
                // If External: Save reference ID and maybe PDF link (skipped here, assume manual)
                payload.documents = [`<p>Contrato Externo / Rentger. Ref: ${externalRef || 'N/A'}</p>`]; 
                payload.externalRef = externalRef;
            } else {
                // If Internal: Save generated HTML
                payload.documents = [editorContent];
            }

            await addDoc(collection(db, "contracts"), payload);
            
            // Update Room Status
            if (selectedPropertyId && selectedRoomId) {
                const propRef = doc(db, "properties", selectedPropertyId);
                const prop = properties.find(p => p.id === selectedPropertyId);
                if (prop) {
                    const newRooms = prop.rooms.map(r => r.id === selectedRoomId ? { ...r, status: 'occupied' as const } : r);
                    await updateDoc(propRef, { rooms: newRooms });
                }
            }
            alert("Contrato Registrado Correctamente");
            setViewMode('list');
            loadData(); // Refresh list
        } catch (e) {
            alert("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC: STEP VALIDATION ---
    const canProceed = () => {
        if (step === 1) return !!contractData.startDate;
        if (step === 2) return !!selectedOwner && !!selectedTenant;
        if (step === 3) return contractData.rentAmount !== undefined;
        return true;
    };

    const handleNextStep = () => {
        if (!canProceed()) {
            alert("Por favor completa los campos requeridos en este paso.");
            return;
        }
        setStep(step + 1);
    };

    // --- RENDER HELPERS ---
    const UserSearch = ({ role, selected, onSelect }: any) => {
        const filtered = users.filter(u => u.role === role && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="bg-white p-4 border rounded-lg mb-4">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">{role}</h4>
                {selected ? (
                    <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                        <span className="font-bold text-sm text-blue-700">{selected.name}</span>
                        <button onClick={() => onSelect(null)} className="text-xs text-red-500">Cambiar</button>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2 mb-2">
                            <input type="text" placeholder="Buscar..." className="w-full p-2 border rounded text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <button onClick={() => setShowUserModal(role)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold">Nuevo</button>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                            {filtered.map(u => (
                                <div key={u.id} onClick={() => onSelect(u)} className="p-2 hover:bg-gray-50 cursor-pointer text-sm">{u.name}</div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        )
    };

    const ManualUserEntry = ({ role, value, onChange }: any) => (
        <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre {role === 'owner' ? 'Propietario' : 'Inquilino'} (Manual)</label>
            <input 
                type="text" 
                className="w-full p-2 border rounded text-sm bg-orange-50 border-orange-200"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Nombre del ${role === 'owner' ? 'Propietario' : 'Inquilino'}`}
            />
        </div>
    );

    // --- VIEW: LIST ---
    if (viewMode === 'list') {
        return (
            <div className="flex flex-col h-full bg-gray-50">
                <div className="bg-white px-6 py-4 border-b flex justify-between items-center shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5 text-rentia-blue"/> Contratos</h2>
                    <div className="flex gap-2">
                        <button onClick={() => { setContractData({}); setStep(1); setViewMode('create'); }} className="bg-rentia-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700"><Plus className="w-4 h-4"/> Nuevo Contrato</button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Alias / Ref</th>
                                    <th className="p-4">Inquilino</th>
                                    <th className="p-4">Propiedad</th>
                                    <th className="p-4 text-center">Tipo</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contracts.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800">{c.alias || 'Sin Alias'}</td>
                                        <td className="p-4">{c.tenantName}</td>
                                        <td className="p-4 text-gray-500">{c.roomName}</td>
                                        <td className="p-4 text-center">
                                            {/* @ts-ignore - Assuming extended type or ignoring strict check for dynamic field */}
                                            {c.isExternal ? (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center gap-1">
                                                    <Link className="w-3 h-3"/> Rentger
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">Nativo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => { setViewContract(c); setViewMode('details'); }} className="text-rentia-blue hover:underline font-bold text-xs flex items-center gap-1 justify-end"><Eye className="w-3 h-3"/> Ver</button>
                                        </td>
                                    </tr>
                                ))}
                                {contracts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay contratos creados.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: DETAILS ---
    if (viewMode === 'details' && viewContract) {
        // @ts-ignore
        const isExternal = viewContract.isExternal;
        
        return (
            <div className="flex flex-col h-full bg-gray-100">
                <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{viewContract.alias}</h2>
                            {isExternal && <span className="text-xs text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded">Gestión Externa (Rentger)</span>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-grow p-8 overflow-y-auto flex justify-center">
                    {isExternal ? (
                        <div className="bg-white shadow-lg p-12 max-w-2xl w-full rounded-xl text-center border border-orange-200">
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                                <Link className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Contrato Gestionado Externamente</h3>
                            <p className="text-gray-500 mb-6">
                                Este contrato está registrado en Rentger u otra plataforma externa. 
                                <br/>Los detalles financieros se sincronizan manualmente.
                            </p>
                            {/* @ts-ignore */}
                            {viewContract.externalRef && (
                                <div className="bg-gray-100 p-4 rounded-lg inline-block">
                                    <span className="text-xs font-bold text-gray-500 block uppercase">Referencia Externa</span>
                                    {/* @ts-ignore */}
                                    <span className="text-lg font-mono font-bold">{viewContract.externalRef}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white shadow-lg p-12 max-w-4xl w-full min-h-[800px]" dangerouslySetInnerHTML={{__html: viewContract.documents ? viewContract.documents[0] : '<p>Sin documento</p>'}}></div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW: WIZARD (CREATE) ---
    return (
        <div className="flex flex-col h-full bg-gray-50 animate-in fade-in">
            {/* Header Wizard */}
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-rentia-blue bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors">
                        <ChevronLeft className="w-3 h-3" /> Volver al listado
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">Nuevo Contrato</h2>
                </div>
                
                {/* Stepper */}
                <div className="flex gap-2">
                    {STEPS.map(s => (
                        <div key={s.id} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s.id ? 'bg-rentia-blue text-white' : 'bg-gray-200 text-gray-500'}`}>{s.id}</div>
                    ))}
                </div>

                <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Salir de configuración"><X className="w-5 h-5"/></button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-6 max-w-4xl mx-auto w-full">
                
                {step === 1 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-lg mb-4">1. Datos Básicos</h3>
                        
                        {/* TOGGLE EXTERNAL CONTRACT */}
                        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-4">
                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    name="toggle" 
                                    id="toggle" 
                                    checked={isExternalContract}
                                    onChange={(e) => setIsExternalContract(e.target.checked)}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-orange-500"
                                    style={{ right: isExternalContract ? '0' : 'auto', left: isExternalContract ? 'auto' : '0' }}
                                />
                                <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${isExternalContract ? 'bg-orange-500' : 'bg-gray-300'}`}></label>
                            </div>
                            <div>
                                <label htmlFor="toggle" className="font-bold text-gray-800 cursor-pointer block">Contrato ya existente en Rentger</label>
                                <p className="text-xs text-gray-500">Activa esto para registrar solo los datos básicos sin generar un nuevo documento legal.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-gray-500 block">Alias</label><input className="w-full p-2 border rounded" value={contractData.alias} onChange={e => setContractData({...contractData, alias: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 block">Inicio</label><input type="date" className="w-full p-2 border rounded" value={contractData.startDate} onChange={e => setContractData({...contractData, startDate: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 block">Fin</label><input type="date" className="w-full p-2 border rounded" value={contractData.endDate} onChange={e => setContractData({...contractData, endDate: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-lg mb-4">2. Partes</h3>
                        {isExternalContract ? (
                            <div className="space-y-4">
                                <div className="bg-orange-50 p-3 rounded text-xs text-orange-800 mb-2 border border-orange-100">
                                    <strong>Modo Rápido:</strong> Introduce los nombres manualmente para el registro interno. No se creará perfil de usuario.
                                </div>
                                <ManualUserEntry 
                                    role="owner" 
                                    value={selectedOwner?.name || ''} 
                                    onChange={(val: string) => setSelectedOwner({ id: `EXT_OWNER_${Date.now()}`, name: val, role: 'owner', email: 'no-email@external.com' })} 
                                />
                                <ManualUserEntry 
                                    role="tenant" 
                                    value={selectedTenant?.name || ''} 
                                    onChange={(val: string) => setSelectedTenant({ id: `EXT_TENANT_${Date.now()}`, name: val, role: 'tenant', email: 'no-email@external.com' })} 
                                />
                            </div>
                        ) : (
                            <>
                                <UserSearch role="owner" selected={selectedOwner} onSelect={setSelectedOwner} />
                                <UserSearch role="tenant" selected={selectedTenant} onSelect={setSelectedTenant} />
                            </>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-lg mb-4">3. Renta</h3>
                        <label className="block mb-1 font-bold text-sm">Mensualidad (€)</label>
                        <input type="number" className="w-full p-3 border rounded text-lg font-bold" value={contractData.rentAmount} onChange={e => setContractData({...contractData, rentAmount: Number(e.target.value)})} />
                        
                        <div className="mt-4">
                            <label className="block mb-1 font-bold text-sm">Gastos</label>
                            <select 
                                value={contractData.expensesType} 
                                onChange={e => setContractData({...contractData, expensesType: e.target.value as any})}
                                className="w-full p-2 border rounded"
                            >
                                <option value="fixed">Incluidos / Fijos</option>
                                <option value="shared">A Repartir (No incluidos)</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-lg mb-4">4. Fianzas</h3>
                        <label className="block mb-1 font-bold text-sm">Fianza Legal (€)</label>
                        <input type="number" className="w-full p-3 border rounded" value={contractData.depositAmount} onChange={e => setContractData({...contractData, depositAmount: Number(e.target.value)})} />
                    </div>
                )}

                {step === 5 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm h-[600px] flex flex-col">
                        <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
                            5. Documentación
                            {!isExternalContract && (
                                <button 
                                    onClick={() => setEditorContent(generateContractContent(TEMPLATES[0].content))} 
                                    className="text-xs bg-rentia-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2"
                                >
                                    <FileText className="w-3 h-3"/> Cargar Plantilla Legal
                                </button>
                            )}
                        </h3>
                        
                        <div className="flex-grow bg-gray-100 p-4 overflow-y-auto border rounded">
                            {isExternalContract ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                                        <Link className="w-8 h-8 text-orange-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-2">Modo Contrato Externo</h4>
                                    <p className="text-gray-500 max-w-md mb-8">
                                        No generaremos un documento nuevo. Introduce la referencia de Rentger para vincularlo.
                                    </p>
                                    
                                    <div className="w-full max-w-sm text-left">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia Rentger (Opcional)</label>
                                        <input 
                                            type="text" 
                                            value={externalRef} 
                                            onChange={(e) => setExternalRef(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:border-rentia-blue outline-none"
                                            placeholder="Ej: CON-2025-001" 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    className="bg-white shadow-lg p-12 min-h-full outline-none prose max-w-none text-justify"
                                    contentEditable
                                    ref={editorRef}
                                    dangerouslySetInnerHTML={{ __html: editorContent }}
                                    style={{ fontFamily: 'Times New Roman, serif', fontSize: '11pt', lineHeight: '1.5' }}
                                ></div>
                            )}
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                        <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="font-bold text-2xl mb-2">Listo para {isExternalContract ? 'registrar' : 'firmar'}</h3>
                        <p className="text-gray-500 mb-6">El contrato se guardará y la habitación pasará a estar ocupada.</p>
                        <p className="text-sm bg-gray-100 p-3 rounded inline-block">
                            Se generará un registro con fecha: {new Date().toLocaleDateString()}
                        </p>
                    </div>
                )}

            </div>

            {/* Footer Nav */}
            <div className="bg-white p-4 border-t flex justify-between max-w-4xl mx-auto w-full">
                <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-6 py-2 border rounded font-bold text-gray-600 disabled:opacity-50">Anterior</button>
                {step < 6 ? (
                    <button onClick={handleNextStep} className="px-6 py-2 bg-rentia-black text-white rounded font-bold hover:bg-gray-800">Siguiente</button>
                ) : (
                    <button onClick={handleFinish} disabled={loading} className="px-8 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">{loading ? 'Guardando...' : 'Finalizar'}</button>
                )}
            </div>

            {/* User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                        <h3 className="font-bold text-lg mb-4">Nuevo {showUserModal}</h3>
                        <div className="space-y-3">
                            <input className="w-full p-2 border rounded" placeholder="Nombre Completo" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} />
                            <input className="w-full p-2 border rounded" placeholder="Email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
                            <input className="w-full p-2 border rounded" placeholder="DNI / NIE" value={newUserForm.dni} onChange={e => setNewUserForm({...newUserForm, dni: e.target.value})} />
                            <input className="w-full p-2 border rounded" placeholder="Teléfono" value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowUserModal(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
                            <button onClick={handleCreateUser} className="px-4 py-2 bg-rentia-blue text-white rounded font-bold">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};