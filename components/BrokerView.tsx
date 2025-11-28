
import React from 'react';
import { brokerRequests } from '../data/brokerRequests';
import { Briefcase, Search, Calendar, MapPin, Euro, FileText, MessageCircle, ArrowRight, Building2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ModalType } from './LegalModals';

interface BrokerViewProps {
    openLegalModal?: (type: ModalType) => void;
}

export const BrokerView: React.FC<BrokerViewProps> = ({ openLegalModal }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-50 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* Header B2B */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-full mb-6">
                <Briefcase className="w-4 h-4 text-rentia-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{t('brokers.hero.badge')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">{t('brokers.hero.title')}</h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                {t('brokers.hero.subtitle')}
            </p>
        </div>
      </section>

      {/* Intro Box */}
      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-l-4 border-rentia-gold max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-50 rounded-full text-rentia-gold hidden md:block">
                      <Search className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-rentia-black mb-2">{t('brokers.intro.title')}</h3>
                      <p className="text-gray-600 leading-relaxed">
                          {t('brokers.intro.text')}
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Table Section */}
      <section className="container mx-auto px-4 pb-20 max-w-6xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="font-bold text-lg text-rentia-black flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-slate-500" />
                      {t('brokers.table.title')}
                  </h2>
                  <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                      {brokerRequests.length} {t('brokers.table.active_req')}
                  </span>
              </div>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-gray-200">
                              <th className="p-4 font-bold min-w-[100px]">{t('brokers.table.ref')}</th>
                              <th className="p-4 font-bold min-w-[100px]">{t('brokers.table.date')}</th>
                              <th className="p-4 font-bold min-w-[200px]">{t('brokers.table.type')}</th>
                              <th className="p-4 font-bold min-w-[200px]">{t('brokers.table.location')}</th>
                              <th className="p-4 font-bold min-w-[120px] text-right">{t('brokers.table.budget')}</th>
                              <th className="p-4 font-bold min-w-[180px] text-center">{t('brokers.table.action')}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                          {brokerRequests.map((req) => (
                              <tr key={req.id} className="hover:bg-blue-50/30 transition-colors group">
                                  <td className="p-4 font-mono font-bold text-rentia-blue bg-gray-50/50 group-hover:bg-transparent">
                                      {req.reference}
                                  </td>
                                  <td className="p-4 text-gray-500">
                                      <div className="flex items-center gap-1.5">
                                          <Calendar className="w-3.5 h-3.5" />
                                          {req.date}
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <div className="font-bold text-gray-900 mb-0.5">{req.type}</div>
                                      <div className="text-xs text-gray-500 flex items-center gap-1">
                                          <FileText className="w-3 h-3" /> {req.specs}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1 italic opacity-80">
                                          "{req.condition}"
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex items-start gap-1.5">
                                          <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-400" />
                                          <span>{req.location}</span>
                                      </div>
                                  </td>
                                  <td className="p-4 text-right font-bold text-slate-800">
                                      {req.budget.toLocaleString('es-ES')} €
                                  </td>
                                  <td className="p-4 text-center">
                                      <a 
                                          href={`https://api.whatsapp.com/send?phone=34672886369&text=Hola%20Pol,%20soy%20compa%C3%B1ero%20del%20sector.%20Tengo%20un%20activo%20que%20encaja%20con%20la%20referencia%20${req.reference}.%20He%20le%C3%ADdo%20la%20pol%C3%ADtica%20de%20privacidad.`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5c] text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow text-xs"
                                      >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          {t('brokers.table.contact_btn')}
                                      </a>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              
              {brokerRequests.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                      <p>{t('brokers.table.empty')}</p>
                  </div>
              )}
              
              {/* GDPR Compliance Footer for Table */}
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-start gap-2 text-[10px] text-gray-500">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                  <p>
                      {t('brokers.table.legal_note')} 
                      <button 
                        onClick={() => openLegalModal && openLegalModal('privacy')} 
                        className="text-rentia-blue hover:underline ml-1 font-medium"
                      >
                          {t('footer.privacy')}
                      </button>.
                  </p>
              </div>
          </div>
      </section>

      {/* Direct Contact */}
      <section className="bg-white border-t border-gray-200 py-12">
          <div className="container mx-auto px-4 text-center">
              <h3 className="text-xl font-bold text-rentia-black mb-4">{t('brokers.footer.title')}</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  {t('brokers.footer.text')}
              </p>
              <a 
                  href="mailto:info@rentiaroom.com"
                  className="text-rentia-blue font-bold hover:underline inline-flex items-center gap-2"
              >
                  info@rentiaroom.com <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-[10px] text-gray-400 mt-4">
                  {t('brokers.footer.legal_contact')}
              </p>
          </div>
      </section>

    </div>
  );
};
