
import React from 'react';
import { Handshake, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const CollaborationBanner: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="bg-white border-t border-gray-200 py-16 no-print">
        <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex p-3 bg-blue-50 rounded-full text-rentia-blue mb-4 shadow-sm border border-blue-100">
                <Handshake className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-rentia-black mb-3 font-display">
                {t('opportunities.collaboration.title')}
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('opportunities.collaboration.subtitle')}
            </p>
            <a
                href="https://api.whatsapp.com/send?phone=34672886369&text=Hola%20Pol,%20soy%20propietario/inmobiliaria%20y%20me%20gustar%C3%ADa%20colaborar%20con%20vosotros."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-rentia-blue text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
                {t('opportunities.collaboration.btn')}
                <ArrowRight className="w-5 h-5" />
            </a>
        </div>
    </section>
  );
};
