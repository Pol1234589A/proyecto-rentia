"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { LegalModals, ModalType } from './LegalModals';
import { useAuth } from '../contexts/AuthContext';
import { CookieBanner } from './common/CookieBanner';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
    const { userRole } = useAuth();

    // Define standalone paths where Header/Footer should NOT appear
    const isStandalone =
        pathname === '/landing' ||
        pathname === '/dossier' ||
        pathname.startsWith('/presentation') ||
        pathname.startsWith('/request') ||
        pathname === '/publicar-propiedad';

    // Intranet logic: Workers/Staff might hide WhatsApp, etc.
    // LegacyApp: !isStandaloneView && !(view === 'intranet' && (userRole === 'worker' || userRole === 'staff'))
    const isIntranet = pathname === '/intranet';
    const hideWhatsApp = isStandalone || (isIntranet && (userRole === 'worker' || userRole === 'staff' || userRole === 'manager'));

    return (
        <div className="min-h-screen flex flex-col font-sans">
            {!isStandalone && <Header />}

            <main className="flex-grow bg-[#f9f9f9] relative z-0">
                {children}
            </main>

            {!hideWhatsApp && <WhatsAppButton />}

            <LegalModals activeModal={activeLegalModal} onClose={() => setActiveLegalModal(null)} />
            <CookieBanner />

            {!isStandalone && <Footer openLegalModal={setActiveLegalModal} />}
        </div>
    );
};
