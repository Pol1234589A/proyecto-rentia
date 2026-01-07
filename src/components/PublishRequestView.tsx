"use client";

import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User, Briefcase, ChevronLeft, CheckCircle, Loader2, Save, Lock, Megaphone, ShieldCheck, ArrowRight, Shield } from 'lucide-react';
import { LegalModals } from './LegalModals';
import { useLanguage } from '../contexts/LanguageContext';

interface PublishRequestViewProps {
    type: 'individual' | 'agency';
    onNavigate: (path: string) => void;
}

export const PublishRequestView: React.FC<PublishRequestViewProps> = ({ type, onNavigate }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'legal' | 'cookies' | null>(null);

    // El estado userType se fija según la prop, pero permitimos cambiarlo si el usuario se equivocó de link
    const [userType, setUserType] = useState<'individual' | 'agency'>(type);

    const [form, setForm] = useState({
        name: '',
        contact: '',
        email: '',
        requestType: '',
        specs: '',
        location: '',
        budget: '',
        notes: '',
        gdprAccepted: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.gdprAccepted) return alert("Debes aceptar la política de privacidad.");
        if (!form.name || !form.contact) return alert("Los datos de contacto son obligatorios.");

        setLoading(true);
        try {
            const refCode = `WEB-${Math.floor(1000 + Math.random() * 9000)}`;
            const finalTag = userType === 'individual' ? 'own' : 'collaboration';

            await addDoc(collection(db, "buyer_requests"), {
                reference: refCode,
                name: form.name,
                contact: form.contact,
                email: form.email,
                type: form.requestType,
                specs: form.specs,
                location: form.location,
                condition: 'Búsqueda Activa',
                budget: Number(form.budget) || 0,
                notes: form.notes,
                tag: finalTag,
                origin: 'web_landing',
                userType: userType,
                gdprAccepted: true,
                gdprDate: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            setSuccess(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error(error);
            alert("Error al enviar la solicitud.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg w-full border border-green-100 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Recibida!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Hemos registrado tu demanda correctamente.
                        {userType === 'agency'
                            ? ' Nuestro equipo de inversiones revisará el requerimiento y contactará contigo si tenemos activos que encajen.'
                            : ' Te avisaremos en cuanto entre una propiedad que coincida con tu búsqueda.'}
                    </p>
                    <button
                        onClick={() => window.location.hash = '#/colaboradores'}
                        className="bg-rentia-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg w-full sm:w-auto"
                    >
                        Volver al Listado
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header Simple */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => window.location.hash = '#/colaboradores'} className="text-gray-500 hover:text-rentia-blue flex items-center gap-1 text-sm font-bold transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Volver
                    </button>
                    <img src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" alt="Rentia" className="h-6 filter invert opacity-80" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">

                {/* Hero Title */}
                <div className="text-center mb-10">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4 ${userType === 'agency' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                        {userType === 'agency' ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        {userType === 'agency' ? 'Zona Profesional' : 'Zona Particulares'}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-rentia-black font-display mb-3">
                        {userType === 'agency' ? 'Publicar Demanda de Cliente' : 'Publicar mi Búsqueda'}
                    </h1>
                    <p className="text-gray-500 max-w-xl mx-auto">
                        {userType === 'agency'
                            ? 'Herramienta para agencias y personal shoppers. Dinos qué busca tu cliente y crucemos datos con nuestra cartera.'
                            : 'Cuéntanos qué estás buscando y te avisaremos antes de publicar las oportunidades en portales.'}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-rentia-blue to-rentia-gold"></div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8">

                        {/* Selector Tipo (Discreto) */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                                <button type="button" onClick={() => setUserType('individual')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${userType === 'individual' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Particular</button>
                                <button type="button" onClick={() => setUserType('agency')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${userType === 'agency' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}>Agencia / Broker</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Sección Contacto */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 text-rentia-blue border-b border-gray-100 pb-2 mb-4">
                                    <Lock className="w-5 h-5" />
                                    <h3 className="font-bold text-sm uppercase tracking-wide">Datos de Contacto</h3>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Nombre {userType === 'agency' ? 'del Agente / Agencia' : 'Completo'} *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all text-sm"
                                        placeholder={userType === 'agency' ? "Ej: Inmobiliaria Murcia / Juan" : "Ej: María García"}
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Teléfono *</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all text-sm"
                                        placeholder="+34 600 000 000"
                                        value={form.contact}
                                        onChange={e => setForm({ ...form, contact: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Email</label>
                                    <input
                                        type="email"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rentia-blue outline-none transition-all text-sm"
                                        placeholder="correo@ejemplo.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 leading-relaxed">
                                    <ShieldCheck className="w-4 h-4 mb-1 text-blue-600" />
                                    Tus datos son privados. Solo se usarán para notificarte cuando tengamos una oportunidad.
                                </div>
                            </div>

                            {/* Sección Demanda */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 text-green-600 border-b border-gray-100 pb-2 mb-4">
                                    <Megaphone className="w-5 h-5" />
                                    <h3 className="font-bold text-sm uppercase tracking-wide">¿Qué {userType === 'agency' ? 'busca tu cliente' : 'buscas'}?</h3>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Tipo de Inmueble *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                                        placeholder="Ej: Piso para reformar, Ático..."
                                        value={form.requestType}
                                        onChange={e => setForm({ ...form, requestType: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Zona *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                                            placeholder="Ej: Centro"
                                            value={form.location}
                                            onChange={e => setForm({ ...form, location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Presupuesto</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                                            placeholder="0 = Flexible"
                                            value={form.budget}
                                            onChange={e => setForm({ ...form, budget: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Características Clave</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                                        placeholder="Ej: Min 3 habitaciones, con ascensor..."
                                        value={form.specs}
                                        onChange={e => setForm({ ...form, specs: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Notas Adicionales</label>
                                    <textarea
                                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm h-24 resize-none"
                                        placeholder="Detalles importantes..."
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Form */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-gray-50 rounded-xl transition-colors">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 text-rentia-blue rounded border-gray-300 focus:ring-rentia-blue"
                                    checked={form.gdprAccepted}
                                    onChange={e => setForm({ ...form, gdprAccepted: e.target.checked })}
                                />
                                <div className="text-xs text-gray-500 leading-relaxed">
                                    <span className="font-bold block text-gray-800 mb-1">Acepto la Política de Privacidad</span>
                                    Doy mi consentimiento para que Rentia Investments S.L. guarde estos datos con el fin de gestionar mi solicitud. He leído y acepto la <button type="button" onClick={() => setActiveLegalModal('privacy')} className="text-rentia-blue font-bold hover:underline">Política de Privacidad</button> y entiendo que mis datos se tratarán conforme al RGPD/LOPD. Los datos públicos del encargo (sin mis datos de contacto) podrán ser visibles en el listado de demandas de la web.
                                </div>
                            </label>

                            <button
                                type="submit"
                                disabled={loading || !form.gdprAccepted}
                                className="w-full mt-6 bg-rentia-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {loading ? 'Enviando...' : 'Publicar Demanda'}
                            </button>
                        </div>

                    </form>
                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    © 2025 Rentia Investments S.L. - Plataforma segura de gestión inmobiliaria.
                </p>

            </div>

            <LegalModals activeModal={activeLegalModal as any} onClose={() => setActiveLegalModal(null)} />
        </div>
    );
};
