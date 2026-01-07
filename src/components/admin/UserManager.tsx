
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import { UserProfile } from '../../types';
import { Users, Search, RefreshCw, ShieldAlert, CheckCircle, XCircle, FileText, Loader2, ExternalLink } from 'lucide-react';

export const UserManager: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [resettingId, setResettingId] = useState<string | null>(null);

    useEffect(() => {
        // Cargar usuarios (principalmente propietarios para esta gestión)
        // Puedes quitar el 'where' si quieres ver todos los roles
        const q = query(collection(db, "users"), where("role", "==", "owner"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: UserProfile[] = [];
            snapshot.forEach((doc) => {
                list.push({ ...doc.data(), id: doc.id } as UserProfile);
            });
            setUsers(list);
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

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-rentia-blue" />
                        Gestión de Propietarios y Accesos
                    </h3>
                    <p className="text-xs text-gray-500">Control de firmas RGPD y estado de usuarios.</p>
                </div>
            </div>

            <div className="p-4 border-b border-gray-100">
                <div className="relative max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar propietario..."
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-grow overflow-auto p-4">
                {loading ? <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div> : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Email</th>
                                <th className="p-3 text-center">Estado RGPD</th>
                                <th className="p-3 text-center">Fecha Firma</th>
                                <th className="p-3 text-center">Evidencia</th>
                                <th className="p-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-bold text-gray-800">{user.name}</td>
                                    <td className="p-3 text-gray-500">{user.email}</td>
                                    <td className="p-3 text-center">
                                        {user.gdpr?.signed ? (
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold border border-green-200">
                                                <CheckCircle className="w-3 h-3" /> Firmado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold border border-red-200 animate-pulse">
                                                <XCircle className="w-3 h-3" /> Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center text-xs text-gray-500">
                                        {user.gdpr?.signedAt?.toDate ? user.gdpr.signedAt.toDate().toLocaleDateString() : '-'}
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
                                            <span className="text-gray-300 text-xs italic">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        {user.id && (
                                            <button
                                                onClick={() => handleResetGdpr(user.id!, user.name)}
                                                disabled={resettingId === user.id}
                                                className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ml-auto"
                                                title="Forzar nueva firma al usuario"
                                            >
                                                {resettingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                Invalidar Firma
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
