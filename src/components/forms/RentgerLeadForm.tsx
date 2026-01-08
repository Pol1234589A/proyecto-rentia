
import React, { useState } from 'react';
import { RentgerService } from '@/services/rentgerService';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

interface RentgerLeadFormProps {
    propertyId?: string;
    propertyName?: string;
    className?: string;
}

export const RentgerLeadForm: React.FC<RentgerLeadFormProps> = ({ propertyId, propertyName, className }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: propertyName ? `Hola, estoy interesado en ${propertyName}` : ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            await RentgerService.createLead({
                ...formData,
                asset_id: propertyId
            });
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50/50 border border-green-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">¡Solicitud Enviada!</h3>
                <p className="text-green-700">Vanesa o Pol se pondrán en contacto contigo muy pronto.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 text-sm font-semibold text-green-800 hover:underline"
                >
                    Enviar otra consulta
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-4 bg-white/50 backdrop-blur-sm border border-slate-200/60 p-6 rounded-2xl shadow-sm ${className}`}>
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nombre Completo</label>
                <input
                    required
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
                    <input
                        required
                        type="email"
                        placeholder="tu@email.com"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Teléfono</label>
                    <input
                        type="tel"
                        placeholder="+34"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Mensaje</label>
                <textarea
                    rows={3}
                    placeholder="¿En qué podemos ayudarte?"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
            </div>

            <button
                disabled={status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
                {status === 'loading' ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Enviar Interés a Rentger
                    </>
                )}
            </button>

            {status === 'error' && (
                <p className="text-center text-red-500 text-sm font-medium mt-2">
                    Hubo un problema. Por favor, inténtalo de nuevo.
                </p>
            )}

            <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                Al enviar este formulario, tus datos se integrarán directamente en nuestro CRM oficial (Rentger) para darte una respuesta inmediata.
            </p>
        </form>
    );
};
