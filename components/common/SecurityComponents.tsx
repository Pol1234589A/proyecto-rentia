
import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

interface SensitiveDataProps {
  value: string;
  type?: 'text' | 'dni' | 'phone' | 'iban' | 'email';
  className?: string;
}

export const SensitiveDataDisplay: React.FC<SensitiveDataProps> = ({ value, type = 'text', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!value) return <span className="text-gray-300">-</span>;

  const getMaskedValue = () => {
    if (type === 'dni') {
      // Mostrar solo últimos 3 caracteres: *****123X
      return '*****' + value.slice(-4);
    }
    if (type === 'phone') {
      // Mostrar solo últimos 3 dígitos: ******789
      return '******' + value.slice(-3);
    }
    if (type === 'iban') {
      // Mostrar solo inicio y fin: ES21 **** **** 1234
      return value.slice(0, 4) + ' **** **** ' + value.slice(-4);
    }
    if (type === 'email') {
      // Mostrar parte del usuario: pol****@gmail.com
      const [user, domain] = value.split('@');
      return user.slice(0, 3) + '****@' + domain;
    }
    // Default text
    return '••••••••••••';
  };

  return (
    <div className={`inline-flex items-center gap-2 group ${className}`}>
      <span className={`font-mono transition-all ${isVisible ? 'text-gray-900 bg-yellow-50 px-1 rounded' : 'text-gray-500'}`}>
        {isVisible ? value : getMaskedValue()}
      </span>
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsVisible(!isVisible); }}
        className="text-gray-400 hover:text-rentia-blue focus:outline-none transition-colors p-1 rounded-full hover:bg-gray-100"
        title={isVisible ? "Ocultar dato" : "Ver dato sensible"}
      >
        {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </div>
  );
};

interface GDPRConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  context?: 'general' | 'incident';
}

export const GDPRCheckbox: React.FC<GDPRConsentProps> = ({ checked, onChange, label, context = 'general' }) => {
  return (
    <div className={`p-4 rounded-lg border mt-4 ${context === 'incident' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center h-5">
          <input
            id="gdpr-consent"
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={`w-4 h-4 rounded cursor-pointer focus:ring-2 ${context === 'incident' ? 'text-red-600 border-red-300 focus:ring-red-500' : 'text-rentia-blue border-gray-300 focus:ring-rentia-blue'}`}
          />
        </div>
        <div className="text-xs">
          <label htmlFor="gdpr-consent" className={`font-bold cursor-pointer flex items-center gap-1 ${context === 'incident' ? 'text-red-800' : 'text-gray-700'}`}>
            <ShieldCheck className={`w-3 h-3 ${context === 'incident' ? 'text-red-600' : 'text-green-600'}`} />
            {label || "Consentimiento de Tratamiento de Datos"}
          </label>
          <p className={`mt-1 leading-relaxed ${context === 'incident' ? 'text-red-700' : 'text-gray-500'}`}>
            {context === 'incident' 
              ? "Declaro bajo responsabilidad que la información es veraz y está respaldada documentalmente. El registro se realiza bajo el Interés Legítimo (Art 6.1.f RGPD) para la prevención del fraude y gestión de riesgos. Datos confidenciales."
              : "Certifico que tengo legitimación para tratar estos datos personales según el RGPD vigente y la LOPD-GDD 3/2018. Los datos serán utilizados exclusivamente para fines de gestión inmobiliaria y contractual dentro de la plataforma RentiaRoom."
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export const SecureLabel: React.FC<{text: string}> = ({ text }) => (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 select-none">
        <Lock className="w-2.5 h-2.5" /> {text}
    </span>
);
