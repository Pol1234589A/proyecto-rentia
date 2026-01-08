"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth } from '@/firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { CheckCircle, XCircle, Loader2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function AuthActionContent() {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!mode || !oobCode) {
            setStatus('error');
            setMessage('El enlace no es válido o está incompleto.');
            return;
        }

        const handleAction = async () => {
            try {
                if (mode === 'verifyEmail') {
                    // 1. Verificar el código
                    await applyActionCode(auth, oobCode);

                    // 2. Intentar obtener el perfil para personalizar el mensaje
                    // Nota: El usuario podría no estar logueado en este navegador aún
                    const user = auth.currentUser;
                    let roleMessage = '¡Email verificado correctamente! Ya puedes acceder a todas las funciones de tu cuenta.';

                    if (user) {
                        const { doc, getDoc } = await import('firebase/firestore');
                        const { db } = await import('@/firebase');
                        const userDoc = await getDoc(doc(db, 'users', user.uid));

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            if (userData.role === 'owner') {
                                roleMessage = '¡Bienvenido Propietario! Tu cuenta ha sido activada. Ya puedes gestionar tus inmuebles y ver tus liquidaciones.';
                            } else if (userData.role === 'tenant') {
                                roleMessage = '¡Hola! Tu cuenta de inquilino ya está activa. Ya puedes ver tus contratos y recibos.';
                            }
                        }
                    }

                    setStatus('success');
                    setMessage(roleMessage);
                } else if (mode === 'resetPassword') {
                    setStatus('error');
                    setMessage('Por favor, utiliza el formulario de restablecimiento de contraseña en la aplicación.');
                } else {
                    setStatus('error');
                    setMessage('Acción no reconocida.');
                }
            } catch (error: any) {
                console.error("Auth Action Error:", error);
                setStatus('error');
                if (error.code === 'auth/invalid-action-code') {
                    setMessage('El código de verificación ha expirado o ya ha sido utilizado.');
                } else {
                    setMessage('Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo.');
                }
            }
        };

        handleAction();
    }, [mode, oobCode]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
            {/* Logo */}
            <div className="mb-8">
                <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="RentiaRoom" className="h-12 w-auto brightness-0" />
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-gray-100 text-center relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rentia-blue/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                {status === 'loading' && (
                    <div className="flex flex-col items-center py-8">
                        <Loader2 className="w-16 h-16 text-rentia-blue animate-spin mb-6" />
                        <h1 className="text-xl font-bold text-gray-800">Procesando solicitud...</h1>
                        <p className="text-gray-500 mt-2">Estamos validando tu código de seguridad.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Cuenta Verificada!</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            {message}
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/intranet"
                                className="block w-full bg-rentia-black text-white px-6 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                            >
                                Ir a mi Área Privada
                            </Link>
                            <Link href="/" className="block text-sm text-gray-500 hover:text-rentia-blue font-medium transition-colors">
                                Volver a la web principal
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">Ups, algo ha fallado</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            {message}
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-rentia-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            Ir a Inicio <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Support footer */}
            <div className="mt-8 text-center bg-blue-50/50 px-6 py-3 rounded-full border border-blue-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-800 font-medium">Conexión Segura RentiaRoom • Murca, ES</span>
            </div>
        </div>
    );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-rentia-blue animate-spin" />
            </div>
        }>
            <AuthActionContent />
        </Suspense>
    );
}
