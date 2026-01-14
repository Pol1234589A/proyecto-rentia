"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ModalType } from './LegalModals';
import { useLanguage } from '../contexts/LanguageContext';
import { Building2 } from 'lucide-react';
import { PartnerTransferModal } from './partner/PartnerTransferModal';
import { useConfig } from '../contexts/ConfigContext';

interface FooterProps {
  openLegalModal: (type: ModalType) => void;
}

export const Footer: React.FC<FooterProps> = ({ openLegalModal }) => {
  const { t } = useLanguage();
  const config = useConfig();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <footer className="bg-[#0072CE] text-white pt-16 font-sans no-print">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Column 1: Logo & Slogan */}
            <div className="space-y-6">
              <Link
                href="/"
                aria-label="Ir a inicio"
              >
                <img
                  src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png"
                  alt="RentiaRoom"
                  className="h-12 w-auto brightness-0 invert object-contain"
                />
              </Link>
              <p className="text-white text-[15px] leading-relaxed">
                {t('footer.slogan')}
              </p>
            </div>

            {/* Column 2: Links */}
            <div>
              <h6 className="text-xl font-bold mb-6 text-white">{t('footer.links_title')}</h6>
              <ul className="space-y-3 text-[15px] text-white">
                <li>
                  <Link
                    href="/oportunidades"
                    className="hover:text-[#edcd20] transition-colors text-left cursor-pointer font-semibold block py-1"
                  >
                    {t('header.opportunities_mobile')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/servicios"
                    className="hover:text-[#edcd20] transition-colors text-left cursor-pointer block py-1"
                  >
                    {t('header.services')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/colaboradores"
                    className="hover:text-[#edcd20] transition-colors text-left cursor-pointer block py-1 flex items-center gap-2"
                  >
                    {t('footer.brokers_link')}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.rentiahub.rentiaroom.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#edcd20] transition-colors text-left cursor-pointer block py-1"
                  >
                    {t('header.hub')}
                  </a>
                </li>
                <li>
                  <button onClick={() => openLegalModal('legal')} className="hover:text-[#edcd20] transition-colors text-left cursor-pointer block py-1">
                    {t('footer.legal')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openLegalModal('privacy')} className="hover:text-[#edcd20] transition-colors text-left cursor-pointer block py-1">
                    {t('footer.privacy')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openLegalModal('cookiesPanel')} className="hover:text-[#edcd20] transition-colors text-left flex items-center gap-2 cursor-pointer block py-1">
                    ⚙️ {t('footer.cookies')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h6 className="text-xl font-bold mb-6 text-white">{t('footer.contact_title')}</h6>
              <div className="space-y-4 text-[14px] text-white">
                <p className="font-bold border-b border-white/20 pb-2 mb-3">{config.general.address}</p>



                <p className="pt-4 mt-2 border-t border-white/20">
                  <a href={`mailto:${config.general.email}`} className="hover:text-[#edcd20] transition-colors block py-1">
                    ✉️ {config.general.email}
                  </a>
                </p>
              </div>

              {/* Social Icons (Dynamic) */}
              <div className="flex space-x-3 mt-6">
                {config.general.facebook && (
                  <a href={config.general.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white hover:text-[#0072CE] transition-colors" aria-label="Facebook">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>
                  </a>
                )}
                {config.general.instagram && (
                  <a href={config.general.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white hover:text-[#0072CE] transition-colors" aria-label="Instagram">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7-74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 11.7 29.5 9 99.5 9 132.1s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>
                  </a>
                )}
                {config.general.linkedin && (
                  <a href={config.general.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white hover:text-[#0072CE] transition-colors" aria-label="LinkedIn">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.5 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>
                  </a>
                )}
                {config.general.tiktok && (
                  <a href={config.general.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-md border-2 border-white text-white hover:bg-white hover:text-[#0072CE] transition-colors" aria-label="TikTok">
                    <svg viewBox="0 0 448 512" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path></svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#002849] py-6 text-center">
          <p className="text-white/50 text-[12px] font-light">
            {t('footer.rights')}
            <span className="mx-2 text-white/20">|</span>
            <button onClick={() => setIsTransferModalOpen(true)} className="hover:text-white transition-colors text-white/30">
              Acceso Gestión de Activos
            </button>
          </p>
        </div>
      </footer>
      <PartnerTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />
    </>
  );
};
