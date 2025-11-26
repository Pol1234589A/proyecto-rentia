
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onNavigate: (view: 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts') => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Define paths for SEO friendly links
  const navLinks = [
    { name: 'Inicio', view: 'home', path: '/' },
    { name: 'Servicios', view: 'services', path: '/servicios' },
    { name: 'Descuentos', view: 'discounts', path: '/descuentos' },
    { name: 'Habitaciones libres', view: 'rooms', path: '/habitaciones' },
    { name: 'Rentia Hub', url: 'https://www.rentiahub.rentiaroom.com', isExternal: true },
    { name: 'Nosotros', view: 'about', path: '/nosotros' },
    { name: 'Contacto', view: 'contact', path: '/contacto' },
  ];

  const handleLinkClick = (e: React.MouseEvent, view: any) => {
    // Only prevent default for internal links handled by SPA
    if (!view) return;
    e.preventDefault();
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    // Added 'transform-gpu' to force hardware acceleration and prevent sticky lag on mobile
    <header className="sticky top-0 z-[9999] bg-[#0072CE] shadow-md font-sans no-print transform-gpu translate-z-0">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          
          {/* Logo Area */}
          <a 
            href="/" 
            className="flex-shrink-0 flex items-center cursor-pointer touch-manipulation" 
            onClick={(e) => handleLinkClick(e, 'home')}
            aria-label="Volver a inicio"
          >
            <img 
              className="h-auto w-32 md:w-40" 
              src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" 
              alt="RentiaRoom" 
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
            {navLinks.map((link) => (
              link.isExternal ? (
                <a 
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#edcd20] font-medium text-[15px] transition-colors"
                >
                  {link.name}
                </a>
              ) : (
                <a
                  key={link.name}
                  href={link.path}
                  onClick={(e) => handleLinkClick(e, link.view)}
                  className="text-white hover:text-[#edcd20] font-medium text-[15px] transition-colors cursor-pointer"
                >
                  {link.name}
                </a>
              )
            ))}
             <a 
              href="/oportunidades"
              onClick={(e) => handleLinkClick(e, 'list')}
              className="text-white hover:text-[#edcd20] font-bold border-b-2 border-[#edcd20] px-1 py-1 text-[15px] transition-colors cursor-pointer"
            >
              Oportunidades
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-3 rounded-md text-white hover:text-[#edcd20] hover:bg-[#005b9f] focus:outline-none transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
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
        <div className="lg:hidden bg-[#0072CE] border-t border-[#005b9f] fixed inset-x-0 top-[80px] bottom-0 z-[9998] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-4 pb-20 space-y-2">
            {navLinks.map((link) => (
              link.isExternal ? (
                <a 
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-left px-4 py-4 rounded-lg text-lg font-medium text-white hover:bg-[#005b9f] hover:text-[#edcd20] transition-colors touch-manipulation border-b border-white/10"
                >
                  {link.name}
                </a>
              ) : (
                <a
                  key={link.name}
                  href={link.path}
                  onClick={(e) => handleLinkClick(e, link.view)}
                  className="block w-full text-left px-4 py-4 rounded-lg text-lg font-medium text-white hover:bg-[#005b9f] hover:text-[#edcd20] transition-colors touch-manipulation border-b border-white/10 cursor-pointer"
                >
                  {link.name}
                </a>
              )
            ))}
            <a 
              href="/oportunidades"
              onClick={(e) => handleLinkClick(e, 'list')}
              className="block w-full text-left px-4 py-4 rounded-lg text-lg font-bold text-[#1c1c1c] bg-[#edcd20] border border-[#edcd20] touch-manipulation cursor-pointer mt-4 text-center shadow-lg"
            >
              Oportunidades Inversión
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
