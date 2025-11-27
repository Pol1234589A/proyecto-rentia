
'use client';

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HomeView } from '../components/HomeView';
import { LegalModals, ModalType } from '../components/LegalModals';

export default function HomePage() {
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);

  const openLegalModal = (type: ModalType) => {
    setActiveLegalModal(type);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        <HomeView />
      </main>

      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />
      <Footer onNavigate={() => {}} openLegalModal={openLegalModal} />
    </div>
  );
}
