
'use client';

import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { AboutView } from '../../components/AboutView';
import { LegalModals, ModalType } from '../../components/LegalModals';

export default function AboutPage() {
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        <AboutView />
      </main>
      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />
      <Footer onNavigate={() => {}} openLegalModal={setActiveLegalModal} />
    </div>
  );
}
