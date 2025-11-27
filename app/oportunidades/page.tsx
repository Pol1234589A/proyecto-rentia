
'use client';

import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { OpportunityCard } from '../../components/OpportunityCard';
import { LegalModals, ModalType } from '../../components/LegalModals';
import { opportunities } from '../../data';
import { TrendingUp, Bell, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../contexts/LanguageContext';

export default function OpportunitiesPage() {
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const router = useRouter();
  const { t } = useLanguage();

  const handleCardClick = (id: string) => {
    router.push(`/oportunidades/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        {/* Hero Section */}
        <section className="relative py-20 md:py-24 bg-rentia-black overflow-hidden">
            <div className="absolute inset-0 w-full h-full z-0">
                <img 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80" 
                    alt="Oportunidades para Inversores RentiaRoom" 
                    className="w-full h-full object-cover grayscale opacity-60"
                />
                <div className="absolute inset-0 bg-rentia-blue/60 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center text-white">
                <div className="inline-flex items-center gap-2 bg-rentia-gold text-rentia-black px-4 py-1 rounded-full mb-6 font-bold text-sm shadow-lg uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4" />
                    {t('opportunities.hero.badge')}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 drop-shadow-md">
                    {t('opportunities.hero.title')}
                </h1>
                <p className="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto drop-shadow-sm font-light leading-relaxed">
                    {t('opportunities.hero.subtitle')}
                </p>
            </div>
        </section>

        {/* Opportunities List */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {opportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {opportunities.map(opp => (
                        <OpportunityCard key={opp.id} opportunity={opp} onClick={handleCardClick} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                    <div className="bg-blue-50 p-6 rounded-full mb-6">
                    <Bell className="w-12 h-12 text-rentia-blue" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-rentia-black font-display mb-4">{t('opportunities.empty.title')}</h2>
                    <p className="text-gray-600 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
                    {t('opportunities.empty.text')}
                    <br/><br/>
                    <span className="font-semibold text-rentia-black">{t('opportunities.empty.cta')}</span>
                    </p>
                    
                    <a 
                    href="https://whatsapp.com/channel/0029VbBsvhOIt5rpshbpYN1P" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform w-full md:w-auto justify-center"
                    >
                    <MessageCircle className="w-6 h-6" />
                    {t('opportunities.empty.btn')}
                    </a>
                    <p className="text-xs text-gray-400 mt-4">{t('opportunities.empty.note')}</p>
                </div>
            )}
        </div>
      </main>
      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />
      <Footer onNavigate={() => {}} openLegalModal={setActiveLegalModal} />
    </div>
  );
}
