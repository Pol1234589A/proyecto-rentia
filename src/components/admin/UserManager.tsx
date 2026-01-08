
import React, { useState, useEffect } from 'react';
import { db, functions } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { UserProfile } from '../../types';
import { Users, Search, RefreshCw, ShieldAlert, CheckCircle, XCircle, FileText, Loader2, ExternalLink, Shield, User, Briefcase, Key, Trash2 } from 'lucide-react';

export const UserManager: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [resettingId, setResettingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        // Cargar todos los usuarios del sistema
        const q = query(collection(db, "users"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: UserProfile[] = [];
            snapshot.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as UserProfile);
            });
            setUsers(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleResetGdpr = async (userId: string, userName: string) => {
        if (!confirm(`ATENCIÓN: ¿Seguro que quieres invalidar la firma de ${userName}? \n\nEsto bloqueará su acceso al panel hasta que vuelva a firmar el nuevo acuerdo.`)) return;

        setResettingId(userId);
        try {
            await updateDoc(doc(db, "users", userId), {
                "gdpr.signed": false,
                "gdpr.signedAt": null,
                "gdpr.documentVersion": null,
                "gdpr.htmlSnapshot": null // Borramos la evidencia anterior
            });
            alert(`Firma invalidada para ${userName}. Deberá firmar al entrar.`);
        } catch (error) {
            console.error(error);
            alert("Error al resetear firma.");
        } finally {
            setResettingId(null);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`⚠️ ALERTA MÁXIMA: ¿Seguro que quieres eliminar por completo a ${userName}? \n\nEsta acción borrará su cuenta de acceso (Email/Password) y su perfil de la base de datos de forma IRREVERSIBLE.`)) return;

        const secondConfirm = confirm(`¿Estás TOTALMENTE seguro? No hay vuelta atrás.`);
        if (!secondConfirm) return;

        setDeletingId(userId);
        try {
            const deleteFn = httpsCallable(functions, 'admin_deleteUser');
            const result = await deleteFn({ uid: userId });
            console.log("Delete result:", result);
            alert("Usuario eliminado correctamente de Auth y Firestore.");
        } catch (error: any) {
            console.error("Delete Error:", error);
            alert("Error al eliminar usuario: " + (error.message || "Error desconocido. Es posible que no tengas permisos suficientes o que la función no esté desplegada."));
        } finally {
            setDeletingId(null);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'admin':
            case 'staff':
                return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-200 uppercase"><Shield className="w-3 h-3" /> Admin/Staff</span>;
            case 'owner':
                return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-200 uppercase"><Briefcase className="w-3 h-3" /> Propietario</span>;
            case 'tenant':
                return <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-teal-200 uppercase"><User className="w-3 h-3" /> Inquilino</span>;
            default:
                return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-gray-200 uppercase">{role || 'Usuario'}</span>;
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-rentia-blue" />
                        Gestión de Usuarios y Accesos
                    </h3>
                    <p className="text-xs text-gray-500">Control de roles, firmas RGPD y estado de cuentas de toda la plataforma.</p>
                </div>
                <div className="bg-white px-3 py-1 rounded-full border text-[10px] font-bold text-gray-500 flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> {users.length} Usuarios Registrados
                </div>
            </div>

            <div className="p-4 border-b border-gray-100">
                <div className="relative max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o rol..."
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-grow overflow-auto p-4">
                {loading ? <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div> : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Email</th>
                                <th className="p-3 text-center">Rol</th>
                                <th className="p-3 text-center">Email Verificado</th>
                                <th className="p-3 text-center">Estado RGPD</th>
                                <th className="p-3 text-center">Fecha Firma</th>
                                <th className="p-3 text-center">Evidencia</th>
                                <th className="p-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 font-bold text-gray-800">{user.name}</td>
                                    <td className="p-3 text-gray-500">{user.email}</td>
                                    <td className="p-3 text-center font-medium">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="p-3 text-center">
                                        {user.emailVerified ? (
                                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">
                                                <CheckCircle className="w-3 h-3" /> Verificado (DOI)
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${user.doubleOptIn?.verificationSent ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {user.doubleOptIn?.verificationSent ? 'Enviado (Pendiente)' : 'No Verificado'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        {user.gdpr?.signed ? (
                                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">
                                                <CheckCircle className="w-3 h-3" /> Firmado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-200">
                                                <XCircle className="w-3 h-3" /> Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center text-xs text-gray-500">
                                        {user.gdpr?.signedAt?.toDate ? user.gdpr.signedAt.toDate().toLocaleDateString() : (user.gdpr?.signedAt ? new Date(user.gdpr.signedAt).toLocaleDateString() : '-')}
                                    </td>
                                    <td className="p-3 text-center">
                                        {user.gdpr?.htmlSnapshot ? (
                                            <button
                                                onClick={() => {
                                                    const win = window.open("", "_blank");
                                                    if (win) win.document.write(user.gdpr?.htmlSnapshot || "");
                                                }}
                                                className="text-rentia-blue hover:text-blue-800 transition-colors inline-flex items-center gap-1 font-bold text-xs"
                                                title="Ver documento firmado"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Ver
                                            </button>
                                        ) : (
                                            <span className="text-gray-300 text-[10px] italic">No disp.</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.id && (
                                                <button
                                                    onClick={() => handleResetGdpr(user.id!, user.name)}
                                                    disabled={resettingId === user.id || deletingId === user.id}
                                                    className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                                                    title="Forzar nueva firma al usuario"
                                                >
                                                    {resettingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                    Invalidar Firma
                                                </button>
                                            )}
                                            {user.id && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id!, user.name)}
                                                    disabled={deletingId === user.id || resettingId === user.id}
                                                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 p-1.5 rounded text-[10px] font-bold transition-colors flex items-center justify-center disabled:opacity-50"
                                                    title="ELIMINAR USUARIO POR COMPLETO"
                                                >
                                                    {deletingId === user.id ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-gray-400 italic">No se han encontrado usuarios con ese criterio.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
