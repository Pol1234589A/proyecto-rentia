
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, ShieldCheck, Send, Loader2, FileText } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ContactLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityTitle: string;
}

export const ContactLeadModal: React.FC<ContactLeadModalProps> = ({ isOpen, onClose, opportunityId, opportunityTitle }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Texto legal exacto que el usuario "firma" al aceptar
  const legalConsentText = `
    Declaro que he leído y acepto la Política de Privacidad.
    Autorizo a Rentia Investments S.L. a guardar mis datos personales (Nombre, Email, Teléfono)
    con la finalidad exclusiva de contactarme en relación a la propiedad "${opportunityTitle}" (Ref: ${opportunityId}).
    Entiendo que mis datos no serán cedidos a terceros salvo obligación legal y que puedo ejercer mis derechos de acceso, rectificación y supresión.
  `;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprAccepted) return alert("Es obligatorio aceptar el consentimiento de protección de datos.");
    
    setLoading(true);
    try {
      // Creamos el "archivo firmado" digital
      const signedRecord = {
        opportunityId,
        opportunityTitle,
        userData: { ...formData },
        consent: {
          accepted: true,
          legalTextSnapshot: legalConsentText.trim(),
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent, // Huella del dispositivo
          language: navigator.language
        },
        status: 'new',
        createdAt: serverTimestamp()
      };

      // Almacenamos en la colección de leads
      await addDoc(collection(db, "opportunity_leads"), signedRecord);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ name: '', email: '', phone: '' });
        setGdprAccepted(false);
      }, 3000);

    } catch (error) {
      console.error("Error al enviar contacto:", error);
      alert("Hubo un error al enviar la solicitud. Por favor, inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-slate-900 p-5 flex justify-between items-start text-white">
            <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rentia-gold" />
                    Solicitar Información
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1">{opportunityTitle}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {success ? (
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-800">¡Solicitud Enviada!</h4>
                <p className="text-gray-500 text-sm">Hemos guardado tus datos de forma segura. Un agente te contactará en breve.</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50"
                            placeholder="Tu nombre"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                        <input 
                            type="tel" 
                            required 
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50"
                            placeholder="+34 600 000 000"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rentia-blue/50"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                </div>

                {/* GDPR Block */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-start gap-3">
                        <input 
                            type="checkbox" 
                            id="gdpr-check" 
                            className="mt-1 w-4 h-4 text-rentia-blue rounded border-gray-300 focus:ring-rentia-blue cursor-pointer"
                            checked={gdprAccepted}
                            onChange={e => setGdprAccepted(e.target.checked)}
                        />
                        <div className="text-xs text-gray-600 leading-relaxed">
                            <label htmlFor="gdpr-check" className="font-bold text-gray-800 cursor-pointer flex items-center gap-1 mb-1">
                                <ShieldCheck className="w-3 h-3 text-green-600" /> Confirmar Protección de Datos
                            </label>
                            {legalConsentText}
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading || !gdprAccepted}
                    className="w-full bg-rentia-black text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {loading ? 'Firmando y Enviando...' : 'Enviar y Contactar'}
                </button>

            </form>
        )}
      </div>
    </div>,
    document.body
  );
};
