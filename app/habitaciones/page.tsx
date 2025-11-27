
'use client';

import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { RoomsView } from '../../components/RoomsView';
import { LegalModals, ModalType } from '../../components/LegalModals';

export default function RoomsPage() {
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow bg-[#f9f9f9] relative z-0">
        <RoomsView />
      </main>
      <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />
      <Footer onNavigate={() => {}} openLegalModal={setActiveLegalModal} />
    </div>
  );
}
