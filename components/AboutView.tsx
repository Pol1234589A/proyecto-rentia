
import React from 'react';
import { Users, Briefcase, Heart, Quote, TrendingUp, Home, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CollaborationBanner } from './CollaborationBanner';

export const AboutView: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* --- HERO SECTION --- */}
      <section className="bg-rentia-black text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
            <img 
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80" 
                alt="Equipo RentiaRoom" 
                className="w-full h-full object-cover opacity-30 grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-rentia-black/90 via-rentia-black/70 to-white"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center mt-8">
           <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-rentia-gold font-bold uppercase tracking-wider text-xs mb-4">
              {t('about.hero.badge')}
           </span>
           <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 drop-shadow-xl text-white">
             {t('about.hero.title')}
           </h1>
           <p className="text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
             {t('about.hero.subtitle')}
           </p>
        </div>
      </section>

      {/* --- OUR STORY --- */}
      <section className="py-20 container mx-auto px-4 -mt-12 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1">
                      <h2 className="text-3xl font-bold text-rentia-black font-display mb-6">{t('about.story.title')}</h2>
                      <div className="space-y-5 text-gray-600 leading-relaxed text-lg text-justify">
                          <p>
                              {t('about.story.p1')}
                          </p>
                          <p>
                              {t('about.story.p2')}
                          </p>
                          <p className="bg-gray-50 p-4 rounded-lg border-l-4 border-rentia-gold italic text-gray-700">
                              {t('about.story.highlight')}
                          </p>
                      </div>
                  </div>
                  
                  <div className="relative order-1 lg:order-2">
                      {/* IMAGEN DE GRUPO (POL Y VÍCTOR) */}
                      <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-gray-100 relative group rotate-1 hover:rotate-0 transition-transform duration-500">
                          <img 
                              src="https://i.ibb.co/zT3d68yG/Whats-App-Image-2025-11-21-at-00-46-35-1.jpg" 
                              alt="Pol y Víctor - Fundadores" 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-xs hidden md:block z-10">
                          <Quote className="w-8 h-8 text-rentia-gold mb-2" />
                          <p className="text-rentia-black font-bold text-sm italic">
                              {t('about.story.quote')}
                          </p>
                      </div>
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-rentia-blue/10 rounded-full blur-xl -z-10"></div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- THE TEAM --- */}
      <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-rentia-black font-display mb-4">{t('about.team.title')}</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                      {t('about.team.subtitle')}
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  
                  {/* POL */}
                  <div className="bg-white rounded-xl overflow-hidden shadow-idealista hover:shadow-idealista-hover transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100">
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                           <div className="w-24 h-24 bg-rentia-black rounded-full flex items-center justify-center shadow-md z-10 text-white">
                                <TrendingUp className="w-10 h-10" />
                           </div>
                           <div className="absolute bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 z-10 text-center">
                               <h3 className="text-rentia-black font-bold text-xl font-display">Pol</h3>
                               <p className="text-rentia-gold text-xs font-bold uppercase tracking-wide mt-1">{t('about.team.pol.role')}</p>
                           </div>
                      </div>
                      <div className="p-8 bg-white flex-grow">
                          <p className="text-gray-600 text-sm leading-relaxed">
                             {t('about.team.pol.desc')}
                          </p>
                      </div>
                  </div>

                  {/* VÍCTOR */}
                  <div className="bg-white rounded-xl overflow-hidden shadow-idealista hover:shadow-idealista-hover transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100">
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                           <div className="w-24 h-24 bg-rentia-black rounded-full flex items-center justify-center shadow-md z-10 text-white">
                                <Home className="w-10 h-10" />
                           </div>
                           <div className="absolute bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 z-10 text-center">
                               <h3 className="text-rentia-black font-bold text-xl font-display">Víctor</h3>
                               <p className="text-rentia-gold text-xs font-bold uppercase tracking-wide mt-1">{t('about.team.victor.role')}</p>
                           </div>
                      </div>
                      <div className="p-8 bg-white flex-grow">
                          <p className="text-gray-600 text-sm leading-relaxed">
                              {t('about.team.victor.desc')}
                          </p>
                      </div>
                  </div>

                  {/* SANDRA */}
                  <div className="bg-white rounded-xl overflow-hidden shadow-idealista hover:shadow-idealista-hover transition-all duration-300 hover:-translate-y-2 group flex flex-col border border-gray-100">
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                           <div className="w-24 h-24 bg-rentia-blue rounded-full flex items-center justify-center shadow-md z-10 text-white">
                                <Briefcase className="w-10 h-10" />
                           </div>
                           <div className="absolute bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 z-10 text-center">
                               <h3 className="text-rentia-black font-bold text-xl font-display">Sandra</h3>
                               <p className="text-rentia-blue text-xs font-bold uppercase tracking-wide mt-1">{t('about.team.sandra.role')}</p>
                           </div>
                      </div>
                      <div className="p-8 bg-white flex-grow">
                          <p className="text-gray-600 text-sm leading-relaxed">
                              {t('about.team.sandra.desc')}
                          </p>
                      </div>
                  </div>

              </div>
          </div>
      </section>

      {/* --- VALUES / GRATITUDE --- */}
      <section className="py-24 bg-rentia-blue text-white relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-rentia-gold/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
              <div className="inline-flex p-4 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/10">
                  <Heart className="w-8 h-8 text-rentia-gold fill-current" />
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-8 leading-tight">
                  {t('about.values.title')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
                      <h3 className="text-xl font-bold text-rentia-gold mb-4">{t('about.values.collab_title')}</h3>
                      <p className="text-blue-50 leading-relaxed">
                          {t('about.values.collab_desc')}
                      </p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
                      <h3 className="text-xl font-bold text-rentia-gold mb-4">{t('about.values.owners_title')}</h3>
                      <p className="text-blue-50 leading-relaxed">
                          {t('about.values.owners_desc')}
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-20 bg-white text-center">
          <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-rentia-black mb-8 font-display">{t('about.cta.title')}</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="https://api.whatsapp.com/send?phone=34672886369" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center justify-center bg-rentia-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                  >
                      <Briefcase className="w-5 h-5 mr-2" />
                      {t('about.cta.btn_dir')}
                  </a>
                   <a 
                    href="https://api.whatsapp.com/send?phone=34611948589" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center justify-center bg-white text-rentia-black border-2 border-gray-200 px-8 py-4 rounded-xl font-bold hover:border-rentia-black transition-all"
                  >
                      {t('about.cta.btn_admin')}
                  </a>
              </div>
          </div>
      </section>

      {/* B2B Collaboration Banner */}
      <CollaborationBanner />

    </div>
  );
};
