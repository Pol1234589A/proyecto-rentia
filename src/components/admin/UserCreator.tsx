
import React, { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { doc, getDocs, collection, writeBatch, serverTimestamp } from "firebase/firestore";
import { db, firebaseConfig } from '../../firebase';
import { UserPlus, Save, AlertCircle, CheckCircle, Loader2, Home, Check, KeyRound, RefreshCw } from 'lucide-react';
import { UserRole } from '../../contexts/AuthContext';
import { GDPRCheckbox } from '../common/SecurityComponents';
import { Property } from '../../data/rooms';

export const UserCreator: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>('tenant');
    const [phone, setPhone] = useState('');
    const [dni, setDni] = useState('');
    const [address, setAddress] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [gdprAccepted, setGdprAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Estado para asignación de propiedades
    const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

    // Cargar propiedades al montar para poder asignarlas
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "properties"));
                const props: Property[] = [];
                querySnapshot.forEach((doc) => {
                    props.push({ ...doc.data(), id: doc.id } as Property);
                });
                // Ordenar alfabéticamente
                props.sort((a, b) => {
                    const addrA = a.address || '';
                    const addrB = b.address || '';
                    return addrA.localeCompare(addrB);
                });
                setAvailableProperties(props);
            } catch (error) {
                console.error("Error cargando propiedades:", error);
            }
        };
        fetchProperties();
    }, []);

    const togglePropertySelection = (propId: string) => {
        setSelectedPropertyIds(prev =>
            prev.includes(propId) ? prev.filter(id => id !== propId) : [...prev, propId]
        );
    };

    const generateStrongPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gdprAccepted) {
            setMessage({ type: 'error', text: 'Debes aceptar el consentimiento RGPD para registrar datos personales.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        // Guardar referencia al auth actual (el admin logueado) para obtener su UID
        const currentAdminAuth = getAuth();
        const currentAdminId = currentAdminAuth.currentUser?.uid || 'system';

        // --- TRUCO PARA NO CERRAR SESIÓN ---
        // Inicializamos una app secundaria de Firebase solo para crear el usuario
        // Esto evita que el Auth principal cambie de usuario
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        try {
            // 1. Crear usuario en la instancia secundaria
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;

            // Actualizar Display Name
            await updateProfile(newUser, { displayName: name });

            // 2. Preparar escritura en lote (Batch) usando la DB principal
            const batch = writeBatch(db);

            // A) Referencia al documento del usuario
            const userDocRef = doc(db, "users", newUser.uid);
            batch.set(userDocRef, {
                email: email,
                role: role,
                name: name,
                phone: phone,
                dni: dni,
                address: address,
                bankAccount: bankAccount,
                createdAt: serverTimestamp(),
                active: true,
                createdBy: currentAdminId
            });

            // B) Si es propietario y ha seleccionado pisos, actualizamos las propiedades
            if (role === 'owner' && selectedPropertyIds.length > 0) {
                selectedPropertyIds.forEach(propId => {
                    const propRef = doc(db, "properties", propId);
                    // Asignamos el ownerId a la propiedad
                    batch.update(propRef, { ownerId: newUser.uid });
                });
            }

            // 3. Ejecutar todo en Firestore
            await batch.commit();

            // 4. Cerrar sesión en la app secundaria y eliminarla para limpiar memoria
            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);

            setMessage({ type: 'success', text: `Usuario ${name} creado correctamente con rol ${(role || 'user').toUpperCase()}.` });

            // Limpiar formulario
            setEmail('');
            setPassword('');
            setName('');
            setPhone('');
            setDni('');
            setAddress('');
            setBankAccount('');
            setGdprAccepted(false);
            setSelectedPropertyIds([]);

        } catch (error: any) {
            console.error("Error creando usuario:", error);
            let errorMsg = "Error al crear usuario.";
            if (error.code === 'auth/email-already-in-use') errorMsg = "El email ya está registrado.";
            if (error.code === 'auth/weak-password') errorMsg = "La contraseña es muy débil (mín 6 caracteres).";
            setMessage({ type: 'error', text: errorMsg });

            // Limpiar app secundaria si falló
            await deleteApp(secondaryApp).catch(() => { });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-rentia-blue" />
                    Alta de Nuevo Usuario
                </h3>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm border shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-8">

                    {/* SECCIÓN 1: ROL Y CREDENCIALES */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">1. Credenciales y Rol</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rol de Usuario *</label>
                                <select
                                    value={role || 'tenant'}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className={`w-full p-2.5 border rounded-lg text-sm font-bold focus:ring-2 outline-none transition-all ${role === 'owner' ? 'border-purple-300 bg-purple-50 text-purple-900 focus:ring-purple-200' :
                                        role === 'staff' ? 'border-blue-300 bg-blue-50 text-blue-900 focus:ring-blue-200' :
                                            'border-gray-200 bg-white focus:ring-rentia-blue/30'
                                        }`}
                                >
                                    <option value="owner">PROPIETARIO (Owner)</option>
                                    <option value="tenant">Inquilino (Tenant)</option>
                                    <option value="agency">Inmobiliaria (Agency)</option>
                                    <option value="broker">Colaborador (Broker)</option>
                                    <option value="worker">Trabajador (Worker)</option>
                                    <option value="staff">Admin (Staff)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Email (Login) *</label>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-rentia-blue outline-none" placeholder="ejemplo@correo.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Contraseña *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:border-rentia-blue outline-none font-mono"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateStrongPassword}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rentia-blue"
                                        title="Generar contraseña segura"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Usa el generador para evitar alertas de seguridad.</p>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: DATOS PERSONALES */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">2. Datos Personales / Fiscales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Nombre Completo / Razón Social *</label>
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-rentia-blue outline-none" placeholder="Nombre y Apellidos" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">DNI / CIF</label>
                                <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-rentia-blue outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Teléfono</label>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-rentia-blue outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Dirección Fiscal</label>
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-rentia-blue outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">IBAN (Pagos/Cobros)</label>
                                <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-rentia-blue outline-none" placeholder="ES00..." />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: ASIGNACIÓN DE PROPIEDADES (SOLO SI ES PROPIETARIO) */}
                    {role === 'owner' && (
                        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-4">
                            <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Home className="w-4 h-4" /> Asignación de Activos
                            </h4>
                            <p className="text-xs text-purple-700 mb-4">Selecciona qué propiedades pertenecen a este propietario. Se vincularán automáticamente al crear la cuenta.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                                {availableProperties.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No hay propiedades disponibles.</p>
                                ) : (
                                    availableProperties.map(prop => {
                                        const isSelected = selectedPropertyIds.includes(prop.id);
                                        return (
                                            <div
                                                key={prop.id}
                                                onClick={() => togglePropertySelection(prop.id)}
                                                className={`
                                        cursor-pointer p-3 rounded-lg border text-sm flex items-center justify-between transition-all
                                        ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-purple-200 text-gray-600 hover:border-purple-400'}
                                    `}
                                            >
                                                <span className="truncate font-medium">{prop.address}</span>
                                                {isSelected && <Check className="w-4 h-4 shrink-0" />}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {selectedPropertyIds.length > 0 && (
                                <div className="mt-3 text-xs text-purple-800 font-bold text-right">
                                    {selectedPropertyIds.length} propiedades seleccionadas
                                </div>
                            )}
                        </div>
                    )}

                    <GDPRCheckbox
                        checked={gdprAccepted}
                        onChange={setGdprAccepted}
                        label="Consentimiento de Registro y Tratamiento"
                    />

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-rentia-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg transform hover:-translate-y-0.5 w-full sm:w-auto justify-center"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Procesando...' : role === 'owner' ? 'Crear Propietario y Vincular' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
