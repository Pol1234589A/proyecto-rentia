
'use client';

import React, { useState } from 'react';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { DetailView } from '../../../components/DetailView';
import { LegalModals, ModalType } from '../../../components/LegalModals';
import { opportunities } from '../../../data';
import { useParams, useRouter } from 'next/navigation';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);

  const selectedOpportunity = opportunities.find(o => o.id === params.id);

  if (!selectedOpportunity) {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Oportunidad no encontrada</h2>
                    <button onClick={() => router.push('/oportunidades')} className="text-rentia-blue hover:underline">Volver al listado</button>
                </div>
            </main>
            <Footer onNavigate={() => {}} openLegalModal={setActiveLegalModal} />
        </div>
    );
  }

  const handleNext = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedOpportunity.id);
    if (currentIndex < opportunities.length - 1) {
      router.push(`/oportunidades/${opportunities[currentIndex + 1].id}`);
    }
  };

  const handlePrev = () => {
    const currentIndex = opportunities.findIndex(o => o.id === selectedOpportunity.id);
    if (currentIndex > 0) {
      router.push(`/oportunidades/${opportunities[currentIndex - 1].id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        <DetailView 
          opportunity={selectedOpportunity} 
          onBack={() => router.push('/oportunidades')}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={opportunities.findIndex(o => o.id === selectedOpportunity.id) < opportunities.length - 1}
          hasPrev={opportunities.findIndex(o => o.id === selectedOpportunity.id) > 0}
        />
      </main>
      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />
      <Footer onNavigate={() => {}} openLegalModal={setActiveLegalModal} />
    </div>
  );
}
