
import React, { useState, useMemo, useEffect } from 'react';
import { brokerRequests as staticRequests, BrokerRequest, RequestTag } from '../data/brokerRequests';
import { Briefcase, Search, MapPin, FileText, MessageCircle, ArrowRight, Building2, ShieldCheck, Filter, X, AlertCircle, Handshake, Crown, Star, Network } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ModalType } from './LegalModals';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface BrokerViewProps {
    openLegalModal?: (type: ModalType) => void;
}

export const BrokerView: React.FC<BrokerViewProps> = ({ openLegalModal }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterTag, setFilterTag] = useState<RequestTag | 'all'>('all');
  const [brokerRequests, setBrokerRequests] = useState<BrokerRequest[]>(staticRequests);

  // Load Broker Requests from Firestore and merge with static
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "buyer_requests"), (snapshot) => {
        const firestoreRequests: BrokerRequest[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            firestoreRequests.push({
                id: doc.id,
                reference: data.reference,
                type: data.type,
                specs: data.specs,
                location: data.location,
                condition: data.condition || 'Estándar',
                budget: data.budget,
                notes: data.notes,
                tag: data.tag || 'own'
            });
        });
        // Merge: Static first, then Firestore
        setBrokerRequests([...staticRequests, ...firestoreRequests]);
    }, (error) => {
        console.warn("Firestore access error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Extract unique locations for the dropdown
  const uniqueLocations = useMemo(() => {
      const locs = new Set(brokerRequests.map(req => req.location));
      return Array.from(locs).sort();
  }, [brokerRequests]);

  // Filter logic
  const filteredRequests = useMemo(() => {
      return brokerRequests.filter(req => {
          const term = searchTerm.toLowerCase();
          const matchesSearch = 
              req.reference.toLowerCase().includes(term) ||
              req.type.toLowerCase().includes(term) ||
              req.location.toLowerCase().includes(term) ||
              req.specs.toLowerCase().includes(term);
          
          const matchesLocation = filterLocation ? req.location === filterLocation : true;
          
          // New Tag Filter Logic
          let matchesTag = true;
          if (filterTag !== 'all') {
              if (filterTag === 'collaboration') {
                  matchesTag = req.tag === 'collaboration';
              } else if (filterTag === 'own') {
                  matchesTag = req.tag === 'own' || req.tag === 'exclusive';
              }
          }

          return matchesSearch && matchesLocation && matchesTag;
      });
  }, [brokerRequests, searchTerm, filterLocation, filterTag]);

  const clearFilters = () => {
      setSearchTerm('');
      setFilterLocation('');
      setFilterTag('all');
  };

  const getTagStyle = (tag: RequestTag) => {
      switch(tag) {
          case 'collaboration':
              return { 
                  style: 'bg-indigo-50 text-indigo-700 border-indigo-100', 
                  icon: <Handshake className="w-3 h-3" />, 
                  textKey: 'brokers.tags.collaboration' 
              };
          case 'exclusive':
              return { 
                  style: 'bg-amber-50 text-amber-700 border-amber-100', 
                  icon: <Crown className="w-3 h-3" />, 
                  textKey: 'brokers.tags.exclusive' 
              };
          case 'own':
              return { 
                  style: 'bg-green-50 text-green-700 border-green-100', 
                  icon: <Star className="w-3 h-3" />, 
                  textKey: 'brokers.tags.own' 
              };
          default:
              return { 
                  style: 'bg-gray-50 text-gray-700 border-gray-100', 
                  icon: <Briefcase className="w-3 h-3" />, 
                  textKey: 'brokers.tags.collaboration' 
              };
      }
  };

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
      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-8">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-l-4 border-rentia-gold max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-50 rounded-full text-rentia-gold hidden md:block">
                      <Network className="w-6 h-6" />
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

      {/* Main Content Section */}
      <section className="container mx-auto px-4 pb-20 max-w-6xl">
          
          {/* Filters Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col gap-4">
                  
                  {/* Row 1: Search & Location */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
                      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-grow">
                          {/* Search Input */}
                          <div className="relative w-full md:max-w-xs">
                              <input 
                                  type="text" 
                                  placeholder={t('brokers.filter.search_placeholder')} 
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 text-sm bg-gray-50 focus:bg-white transition-all"
                              />
                              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                          </div>

                          {/* Location Dropdown */}
                          <div className="relative w-full md:max-w-xs">
                              <select 
                                  value={filterLocation}
                                  onChange={(e) => setFilterLocation(e.target.value)}
                                  className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rentia-blue/50 text-sm bg-gray-50 focus:bg-white transition-all appearance-none cursor-pointer"
                              >
                                  <option value="">{t('brokers.filter.all_zones')}</option>
                                  {uniqueLocations.map(loc => (
                                      <option key={loc} value={loc}>{loc}</option>
                                  ))}
                              </select>
                              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                              <div className="absolute right-3 top-3 pointer-events-none">
                                  <Filter className="w-4 h-4 text-gray-400" />
                              </div>
                          </div>
                      </div>

                      {/* Results Count & Clear */}
                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                          <span className="text-xs font-medium text-gray-500">
                              {filteredRequests.length} {t('brokers.filter.results_count')}
                          </span>
                          {(searchTerm || filterLocation || filterTag !== 'all') && (
                              <button 
                                  onClick={clearFilters}
                                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                              >
                                  <X className="w-3 h-3" /> {t('common.close')}
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Row 2: Origin Tags Filter */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 w-full overflow-x-auto no-scrollbar">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-2 flex-shrink-0">
                          {t('brokers.filter.source_label')}
                      </span>
                      <button 
                          onClick={() => setFilterTag('all')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${filterTag === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                      >
                          {t('brokers.filter.all_sources')}
                      </button>
                      <button 
                          onClick={() => setFilterTag('own')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1 ${filterTag === 'own' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:border-green-200'}`}
                      >
                          <Star className="w-3 h-3" />
                          {t('brokers.filter.own_source')}
                      </button>
                      <button 
                          onClick={() => setFilterTag('collaboration')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1 ${filterTag === 'collaboration' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'}`}
                      >
                          <Handshake className="w-3 h-3" />
                          {t('brokers.filter.collab_source')}
                      </button>
                  </div>
              </div>
          </div>

          {/* Status Disclaimer Banner */}
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-lg flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                  <h4 className="text-sm font-bold text-orange-800 mb-1">{t('brokers.disclaimer.title')}</h4>
                  <p className="text-xs text-orange-700 leading-relaxed">
                      {t('brokers.disclaimer.text')}
                  </p>
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="font-bold text-lg text-rentia-black flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-slate-500" />
                      {t('brokers.table.title')}
                  </h2>
              </div>
              
              {/* DESKTOP VIEW: Table */}
              <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-gray-200">
                              <th className="p-4 font-bold min-w-[100px]">{t('brokers.table.ref')}</th>
                              <th className="p-4 font-bold min-w-[200px]">{t('brokers.table.type')}</th>
                              <th className="p-4 font-bold min-w-[200px]">{t('brokers.table.location')}</th>
                              <th className="p-4 font-bold min-w-[120px] text-right">{t('brokers.table.budget')}</th>
                              <th className="p-4 font-bold min-w-[180px] text-center">{t('brokers.table.action')}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                          {filteredRequests.map((req) => {
                              const tagInfo = getTagStyle(req.tag);
                              return (
                                  <tr key={req.id} className="hover:bg-blue-50/30 transition-colors group">
                                      <td className="p-4 align-top">
                                          <div className="font-mono font-bold text-rentia-blue mb-1">{req.reference}</div>
                                          <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${tagInfo.style}`}>
                                              {tagInfo.icon}
                                              {t(tagInfo.textKey)}
                                          </div>
                                      </td>
                                      <td className="p-4 align-top">
                                          <div className="font-bold text-gray-900 mb-0.5">{req.type}</div>
                                          <div className="text-xs text-gray-500 flex items-center gap-1">
                                              <FileText className="w-3 h-3" /> {req.specs}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1 italic opacity-80">
                                              "{req.condition}"
                                          </div>
                                          {req.notes && (
                                              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                  <strong>Nota:</strong> {req.notes}
                                              </div>
                                          )}
                                      </td>
                                      <td className="p-4 align-top">
                                          <div className="flex items-start gap-1.5">
                                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-400" />
                                              <span>{req.location}</span>
                                          </div>
                                      </td>
                                      <td className="p-4 text-right align-top font-bold text-slate-800">
                                          {req.budget > 0 ? `${req.budget.toLocaleString('es-ES')} €` : <span className="text-green-600">Flexible</span>}
                                      </td>
                                      <td className="p-4 text-center align-middle">
                                          <a 
                                              href={`https://api.whatsapp.com/send?phone=34672886369&text=Hola%20Pol,%20tengo%20un%20activo%20que%20encaja%20con%20la%20referencia%20${req.reference}%20(${t(tagInfo.textKey)}).`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5c] text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow text-xs"
                                          >
                                              <MessageCircle className="w-3.5 h-3.5" />
                                              {t('brokers.table.contact_btn')}
                                          </a>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>

              {/* MOBILE VIEW: Cards Stack */}
              <div className="md:hidden bg-gray-50 p-4 space-y-4">
                  {filteredRequests.map((req) => {
                      const tagInfo = getTagStyle(req.tag);
                      return (
                          <div key={req.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex flex-col gap-1">
                                      <span className="font-mono text-xs font-bold text-rentia-blue bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit">
                                          {req.reference}
                                      </span>
                                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider w-fit ${tagInfo.style}`}>
                                          {tagInfo.icon}
                                          {t(tagInfo.textKey)}
                                      </span>
                                  </div>
                              </div>
                              
                              <h4 className="font-bold text-gray-900 mb-1">{req.type}</h4>
                              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> {req.specs}
                              </p>
                              
                              {req.notes && (
                                  <div className="mb-3 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                      {req.notes}
                                  </div>
                              )}

                              <div className="flex items-start gap-2 mb-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="leading-snug">{req.location}</span>
                              </div>

                              <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-2">
                                  <div className="flex flex-col">
                                      <span className="text-[10px] uppercase text-gray-400 font-bold">{t('brokers.table.budget')}</span>
                                      <span className="font-bold text-lg text-slate-800">
                                          {req.budget > 0 ? `${req.budget.toLocaleString('es-ES')} €` : <span className="text-green-600 text-base">Flexible</span>}
                                      </span>
                                  </div>
                                  <a 
                                      href={`https://api.whatsapp.com/send?phone=34672886369&text=Hola%20Pol,%20tengo%20un%20activo%20que%20encaja%20con%20la%20referencia%20${req.reference}%20(${t(tagInfo.textKey)}).`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5c] text-white px-4 py-2.5 rounded-lg font-bold shadow-sm text-sm"
                                  >
                                      <MessageCircle className="w-4 h-4" />
                                      {t('common.contact')}
                                  </a>
                              </div>
                          </div>
                      );
                  })}
              </div>
              
              {filteredRequests.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                          <Filter className="w-8 h-8 opacity-50" />
                      </div>
                      <p>{t('brokers.table.empty')}</p>
                      {(searchTerm || filterLocation || filterTag !== 'all') && (
                          <button onClick={clearFilters} className="text-rentia-blue text-sm font-bold mt-2 hover:underline">
                              Limpiar filtros
                          </button>
                      )}
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
