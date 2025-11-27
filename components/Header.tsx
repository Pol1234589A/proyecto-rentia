
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const navLinks = [
    { nameKey: 'header.home', path: '/' },
    { nameKey: 'header.services', path: '/servicios' },
    { nameKey: 'header.rooms', path: '/habitaciones' },
    { nameKey: 'header.blog', path: '/blog' },
    { nameKey: 'header.discounts', path: '/descuentos' },
    { nameKey: 'header.hub', url: 'https://www.rentiahub.rentiaroom.com', isExternal: true },
    { nameKey: 'header.about', path: '/nosotros' },
    { nameKey: 'header.contact', path: '/contacto' },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (!pathname) return false;
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-[9999] bg-[#0072CE] shadow-md font-sans no-print">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          
          {/* Logo Area */}
          <Link 
            href="/" 
            className="flex-shrink-0 flex items-center cursor-pointer select-none"
            aria-label="Volver a inicio"
          >
            <img 
              className="h-10 md:h-14 w-auto object-contain" 
              src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" 
              alt="RentiaRoom" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
            {navLinks.map((link) => (
              link.isExternal ? (
                <a 
                  key={link.nameKey}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#edcd20] font-medium text-[15px] transition-colors"
                >
                  {t(link.nameKey)}
                </a>
              ) : (
                <Link
                  key={link.nameKey}
                  href={link.path!}
                  className={`font-medium text-[15px] transition-colors ${isActive(link.path) ? 'text-[#edcd20]' : 'text-white hover:text-[#edcd20]'}`}
                >
                  {t(link.nameKey)}
                </Link>
              )
            ))}
             <Link 
              href="/oportunidades"
              className={`font-bold border-b-2 px-1 py-1 text-[15px] transition-colors cursor-pointer ${isActive('/oportunidades') ? 'text-[#edcd20] border-[#edcd20]' : 'text-white border-[#edcd20] hover:text-[#edcd20]'}`}
            >
              {t('header.opportunities')}
            </Link>

            {/* Language Switcher Desktop */}
            <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-white hover:text-[#edcd20] font-medium text-xs border border-white/30 rounded px-2 py-1 transition-colors"
            >
                <Globe className="w-3 h-3" />
                {language === 'es' ? 'EN' : 'ES'}
            </button>
          </nav>

          {/* Mobile Menu Button + Lang */}
          <div className="flex items-center lg:hidden gap-4">
             <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-white font-bold text-xs border border-white/30 rounded px-2 py-1"
            >
                {language === 'es' ? 'EN' : 'ES'}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-3 rounded-md text-white hover:text-[#edcd20] hover:bg-[#005b9f] focus:outline-none transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
              aria-label="Menú principal"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#0072CE] border-t border-[#005b9f] fixed inset-x-0 top-20 md:top-24 bottom-0 z-[9998] overflow-y-auto">
          <div className="px-4 pt-4 pb-20 space-y-2">
            {navLinks.map((link) => (
              link.isExternal ? (
                <a 
                  key={link.nameKey}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-left px-4 py-4 rounded-lg text-lg font-medium text-white hover:bg-[#005b9f] hover:text-[#edcd20] transition-colors border-b border-white/10"
                >
                  {t(link.nameKey)}
                </a>
              ) : (
                <Link
                  key={link.nameKey}
                  href={link.path!}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full text-left px-4 py-4 rounded-lg text-lg font-medium transition-colors border-b border-white/10 ${isActive(link.path) ? 'text-[#edcd20] bg-[#005b9f]' : 'text-white hover:bg-[#005b9f] hover:text-[#edcd20]'}`}
                >
                  {t(link.nameKey)}
                </Link>
              )
            ))}
            <Link 
              href="/oportunidades"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-left px-4 py-4 rounded-lg text-lg font-bold text-[#1c1c1c] bg-[#edcd20] border border-[#edcd20] cursor-pointer mt-4 text-center shadow-lg"
            >
              {t('header.opportunities_mobile')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
