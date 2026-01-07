"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Globe, Lock, LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LoginModal } from './auth/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps { }

type ViewType = 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts' | 'blog' | 'brokers' | 'intranet';

interface NavLink {
  nameKey: string;
  path: string;
  url?: string;
  isExternal?: boolean;
}

export const Header: React.FC<HeaderProps> = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { userRole, logout } = useAuth();
  const router = useRouter();

  const toggleLanguage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const navLinks: NavLink[] = [
    { nameKey: 'header.home', path: '/' },
    { nameKey: 'header.services', path: '/servicios' },
    { nameKey: 'header.rooms', path: '/habitaciones' },
    { nameKey: 'header.blog', path: '/blog' },
    { nameKey: 'header.discounts', path: '/descuentos' },
    { nameKey: 'header.about', path: '/nosotros' },
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleIntranetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (userRole) {
      router.push('/intranet');
    } else {
      setIsLoginOpen(true);
    }
    setIsMenuOpen(false);
  };

  return (
    <>
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
                className="h-10 md:h-12 w-auto object-contain"
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
                    href={link.path}
                    className="text-white hover:text-[#edcd20] font-medium text-[15px] transition-colors cursor-pointer"
                  >
                    {t(link.nameKey)}
                  </Link>
                )
              ))}
              <Link
                href="/oportunidades"
                className="text-white hover:text-[#edcd20] font-bold border-b-2 border-[#edcd20] px-1 py-1 text-[15px] transition-colors cursor-pointer"
              >
                {t('header.opportunities')}
              </Link>

              {/* Language Switcher Desktop */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-white hover:text-[#edcd20] font-medium text-xs border border-white/30 rounded px-2 py-1 transition-colors cursor-pointer"
              >
                <Globe className="w-3 h-3" />
                {language === 'es' ? 'EN' : 'ES'}
              </button>

              {/* LOGIN BUTTON DESKTOP */}
              {userRole ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleIntranetClick}
                    className="flex items-center gap-1 bg-white text-rentia-blue font-bold text-xs px-3 py-1.5 rounded-full hover:bg-rentia-gold hover:text-rentia-black transition-colors"
                  >
                    <Lock className="w-3 h-3" /> Area Privada
                  </button>
                  <button onClick={logout} className="text-white/70 hover:text-white" title="Salir">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-1 text-white/80 hover:text-white font-medium text-xs border border-white/20 hover:border-white/50 rounded px-3 py-1.5 transition-colors"
                >
                  <Lock className="w-3 h-3" /> Login
                </button>
              )}
            </nav>

            {/* Mobile Menu Button + Lang */}
            <div className="flex items-center lg:hidden gap-4">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-white font-bold text-xs border border-white/30 rounded px-2 py-1 cursor-pointer"
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
                    href={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left px-4 py-4 rounded-lg text-lg font-medium text-white hover:bg-[#005b9f] hover:text-[#edcd20] transition-colors border-b border-white/10 cursor-pointer"
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

              {/* Mobile Login Button */}
              <button
                onClick={handleIntranetClick}
                className="block w-full text-left px-4 py-4 rounded-lg text-lg font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer mt-4 text-center flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                {userRole ? 'Ir al Área Privada' : 'Acceso Clientes'}
              </button>
              {userRole && (
                <button onClick={logout} className="block w-full text-center py-2 text-white/60 text-sm">Cerrar Sesión</button>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
};
