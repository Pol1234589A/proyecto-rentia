
import React, { useState } from 'react';
import { X, Lock, User, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useLanguage } from '../../contexts/LanguageContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Login directo contra Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // ASEGURAMOS ROL DE GESTORA PARA VANESA
            if (email === 'vanesa@rentiaroom.com') {
                const { doc, setDoc } = await import('firebase/firestore');
                const { db: firestoreDb } = await import('../../firebase');
                try {
                    await setDoc(doc(firestoreDb, 'users', userCredential.user.uid), {
                        role: 'manager',
                        email: 'vanesa@rentiaroom.com',
                        name: 'Vanesa',
                        active: true
                    }, { merge: true });
                } catch (e) {
                    console.error("No se pudo asegurar el rol de gestora:", e);
                }
            }

            onClose();
        } catch (firebaseError: any) {
            console.error("Login failed", firebaseError);

            // --- AUTO-CREACIÓN DE CUENTA DE VANESA (ADMIN RECOVERY) ---
            if (email === 'vanesa@rentiaroom.com' && (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/user-not-found')) {
                try {
                    // Intentar crear el usuario si no existe
                    const { createUserWithEmailAndPassword } = await import('firebase/auth');
                    const { doc, setDoc } = await import('firebase/firestore');
                    const { db } = await import('../../firebase'); // Dynamic import to avoid circular dep issues in some bundles

                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                    // Crear perfil en Firestore
                    await setDoc(doc(db, 'users', userCredential.user.uid), {
                        email: email,
                        name: 'Vanesa',
                        role: 'manager',
                        active: true,
                        createdAt: new Date().toISOString()
                    });

                    setLoading(false);
                    onClose(); // Login exitoso (el observer de AuthContext lo detectará)
                    return; // Salir, éxito.
                } catch (createError: any) {
                    console.error("Error creando cuenta de Vanesa:", createError);
                    // Si falla la creación (ej. pass incorrecta pero ususario existe), caer al error normal
                }
            }
            // -----------------------------------------------------------

            // Mensajes de error amigables
            if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
                setError('Usuario o contraseña incorrectos.');
            } else if (firebaseError.code === 'auth/too-many-requests') {
                setError('Demasiados intentos fallidos. Inténtalo más tarde.');
            } else {
                setError('Error de acceso. Verifica tus credenciales.');
            }
        } finally {
            if (isOpen) setLoading(false);
        }
    };

    const whatsappResetLink = `https://api.whatsapp.com/send?phone=34611948589&text=Hola%20Sandra,%20soy%20cliente%20y%20he%20olvidado%20mi%20contrase%C3%B1a%20de%20acceso%20al%20%C3%A1rea%20privada.`;

    return (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-500"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative w-full max-w-[380px] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/50">

                    {/* Cabecera */}
                    <div className="relative bg-gradient-to-br from-[#0072CE] to-[#00509e] pt-12 pb-16 px-8 text-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-20">
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] rotate-12"></div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/60 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-all backdrop-blur-sm z-20"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative z-10 mx-auto w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/30 ring-1 ring-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Lock className="w-9 h-9 text-white drop-shadow-md" />
                        </div>

                        <h2 className="relative z-10 text-2xl font-bold text-white font-display tracking-tight mb-1">Área Privada</h2>
                        <p className="relative z-10 text-blue-100 text-[11px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 opacity-90">
                            <ShieldCheck className="w-3 h-3" /> Acceso Seguro
                        </p>
                    </div>

                    {/* Formulario */}
                    <div className="relative px-8 pt-10 pb-8 bg-white -mt-10 rounded-t-[2.5rem]">

                        <form onSubmit={handleLogin} className="space-y-5">

                            {error && (
                                <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 text-left">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-600 leading-snug font-medium">{error}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="group">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0072CE] transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            autoComplete="username"
                                            required
                                            placeholder="Usuario o Email"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072CE]/10 focus:border-[#0072CE] focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400 shadow-sm hover:border-gray-200"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0072CE] transition-colors">
                                            <KeyRound className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            id="password"
                                            autoComplete="current-password"
                                            required
                                            placeholder="Contraseña"
                                            className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072CE]/10 focus:border-[#0072CE] focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400 shadow-sm hover:border-gray-200"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rentia-blue focus:outline-none transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#1c1c1c] text-white font-bold py-4 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2 text-sm">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Accediendo...
                                        </span>
                                    ) : (
                                        <>
                                            Entrar
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <a
                                    href={whatsappResetLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-[#0072CE] transition-colors group"
                                >
                                    <span className="group-hover:underline decoration-dotted">¿Has olvidado tu contraseña?</span>
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
