
import React, { useState } from 'react';
import { X, Lock, User, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff, UserPlus } from 'lucide-react';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [isRegistering, setIsRegistering] = useState(false); // New state for toggle
    const [name, setName] = useState(''); // New state for registration name
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                // --- REGISTRO DE NUEVO PROPIETARIO ---
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 1. Actualizar perfil básico (display name)
                await updateProfile(user, { displayName: name });

                // 2. Crear documento en Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    name: name,
                    email: email,
                    role: 'owner', // Rol por defecto para autoregistro
                    active: true,
                    emailVerified: false,
                    createdAt: serverTimestamp(),
                    source: 'login_modal_registration', // Para saber de donde vienen
                    doubleOptIn: {
                        verificationSent: true,
                        acceptedAt: serverTimestamp() // Aceptan términos implícitamente al registrarse
                    }
                });

                // 3. Enviar email de verificación (aunque hemos hecho bypass para entrar, es bueno enviarlo)
                const actionCodeSettings = {
                    url: `https://www.rentiaroom.com/auth/action`,
                    handleCodeInApp: true,
                };
                await sendEmailVerification(user, actionCodeSettings).catch(err => console.error("Error enviando email verif:", err));

                // 4. Cerrar modal y redirigir
                onClose();
                window.location.href = '/intranet';

            } else {
                // --- LOGIN NORMAL ---
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;

                    // RECUPERACIÓN DE PERFIL: Si el usuario existe en Auth pero falló la creación del perfil en Firestore (por ejemplo, por fallo de permisos anterior), lo creamos ahora.
                    const userDoc = await getDoc(doc(db, 'users', user.uid));

                    if (!userDoc.exists()) {
                        console.log("Perfil de usuario no encontrado en login. Creando perfil de recuperación...");
                        await setDoc(doc(db, 'users', user.uid), {
                            name: user.displayName || 'Usuario Recuperado',
                            email: user.email,
                            role: 'owner', // Asumimos owner si se registra por aquí
                            active: true,
                            emailVerified: user.emailVerified,
                            createdAt: serverTimestamp(),
                            source: 'login_modal_recovery'
                        });
                    }

                    // Verificación de Doble Opt-In (DOI) - Bypass temporal solicitado por el usuario
                    /*
                    const allowedEmails = ['vanesa@rentiaroom.com', 'info@rentiaroom.com'];
                    if (userCredential.user && !userCredential.user.emailVerified && !allowedEmails.includes(email)) {
                        await auth.signOut();
                        setError('Tu cuenta requiere verificación. Revisa tu email para completar el Doble Opt-In antes de iniciar sesión.');
                        setLoading(false);
                        return;
                    }
                    */

                    // ASEGURAMOS ROL DE GESTORA PARA ADMINISTRACIÓN (Legacy logic)
                    if (email === 'vanesa@rentiaroom.com') {
                        await setDoc(doc(db, 'users', userCredential.user.uid), {
                            role: 'manager',
                            email: 'vanesa@rentiaroom.com',
                            name: 'Administración',
                            active: true
                        }, { merge: true }).catch(console.error);
                    }

                    onClose();
                } catch (loginError: any) {
                    // Si falla el login normal, lanzamos para que lo capture el catch de abajo
                    throw loginError;
                }
            }
        } catch (firebaseError: any) {
            console.error("Auth failed", firebaseError);

            // Handle Vanesa auto-creation logic locally if needed? No, removing complexity for now.

            // Error handling mejorado
            if (firebaseError.code === 'auth/email-already-in-use') {
                setError('Este correo ya está registrado. Por favor, cambia a la pestaña "Inicia sesión aquí".');
                // Opcional: Podríamos cambiar automáticamente a modo login
                // setIsRegistering(false); 
            } else if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
                setError('Usuario o contraseña incorrectos.');
            } else if (firebaseError.code === 'auth/too-many-requests') {
                setError('Demasiados intentos fallidos. Inténtalo más tarde.');
            } else if (firebaseError.code === 'auth/weak-password') {
                setError('La contraseña es demasiado débil (mínimo 6 caracteres).');
            } else {
                setError('Error de acceso: ' + (firebaseError.message || 'Inténtalo de nuevo.'));
            }
        } finally {
            if (isOpen) setLoading(false);
        }
    };

    const whatsappResetLink = `https://api.whatsapp.com/send?phone=34672886369&text=Hola,%20soy%20cliente%20y%20he%20olvidado%20mi%20contrase%C3%B1a%20de%20acceso%20al%20%C3%A1rea%20privada.`;

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
                    <div className="relative bg-gradient-to-br from-[#0072CE] to-[#00509e] pt-10 pb-16 px-8 text-center overflow-hidden transition-all duration-500">
                        <div className="absolute top-0 left-0 w-full h-full opacity-20">
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] rotate-12"></div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/60 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-all backdrop-blur-sm z-20"
                            title="Cerrar"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative z-10 mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/30 ring-1 ring-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            {isRegistering ? <UserPlus className="w-8 h-8 text-white drop-shadow-md" /> : <Lock className="w-8 h-8 text-white drop-shadow-md" />}
                        </div>

                        <h2 className="relative z-10 text-xl font-bold text-white font-display tracking-tight mb-1">
                            {isRegistering ? 'Alta Propietarios' : 'Área Privada'}
                        </h2>
                        <p className="relative z-10 text-blue-100 text-[10px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 opacity-90">
                            <ShieldCheck className="w-3 h-3" /> {isRegistering ? 'Registro Seguro' : 'Acceso Seguro'}
                        </p>
                    </div>

                    {/* Formulario */}
                    <div className="relative px-8 pt-8 pb-6 bg-white -mt-10 rounded-t-[2.5rem]">

                        <form onSubmit={handleAuth} className="space-y-4">

                            {error && (
                                <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 text-left">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-600 leading-snug font-medium">{error}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {isRegistering && (
                                    <div className="group animate-in slide-in-from-left-2 fade-in duration-300">
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0072CE] transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="name"
                                                required={isRegistering}
                                                placeholder="Nombre Completo"
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072CE]/10 focus:border-[#0072CE] focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400 shadow-sm hover:border-gray-200"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="group">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0072CE] transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            placeholder={isRegistering ? "Tu Email Profesional" : "Usuario o Email"}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072CE]/10 focus:border-[#0072CE] focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400 shadow-sm hover:border-gray-200"
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
                                            required
                                            placeholder={isRegistering ? "Crea una contraseña" : "Contraseña"}
                                            className="w-full pl-12 pr-12 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072CE]/10 focus:border-[#0072CE] focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400 shadow-sm hover:border-gray-200"
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
                                    className={`w-full text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden ${isRegistering ? 'bg-rentia-blue' : 'bg-[#1c1c1c]'}`}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2 text-sm">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            {isRegistering ? 'Creando cuenta...' : 'Accediendo...'}
                                        </span>
                                    ) : (
                                        <>
                                            {isRegistering ? 'Crear Cuenta Gratis' : 'Entrar'}
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Switcher Toggle */}
                            <div className="text-center pt-2 border-t border-gray-100 mt-4 rounded-xl">
                                <p className="text-xs text-gray-500 font-medium mb-2">
                                    {isRegistering ? '¿Ya tienes cuenta?' : '¿Eres nuevo propietario?'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                                    className="text-sm font-bold text-[#0072CE] hover:text-[#00509e] transition-colors hover:underline"
                                >
                                    {isRegistering ? 'Inicia sesión aquí' : 'Regístrate aquí gratis'}
                                </button>
                            </div>

                            {!isRegistering && (
                                <div className="text-center pt-1">
                                    <a
                                        href={whatsappResetLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-400 hover:text-[#0072CE] transition-colors group"
                                    >
                                        <span className="group-hover:underline decoration-dotted">¿Has olvidado tu contraseña?</span>
                                    </a>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
