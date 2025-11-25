
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onNavigate: (view: 'home' | 'list' | 'contact' | 'services' | 'rooms' | 'about' | 'discounts') => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Separating internal vs external links
  const navLinks = [
    { name: 'Inicio', action: () => onNavigate('home') },
    { name: 'Servicios', action: () => onNavigate('services') },
    { name: 'Descuentos', action: () => onNavigate('discounts') },
    { name: 'Habitaciones libres', action: () => onNavigate('rooms') },
    { name: 'Rentia Hub', url: 'https://www.rentiahub.rentiaroom.com' },
    { name: 'Nosotros', action: () => onNavigate('about') },
    { name: 'Contacto', action: () => onNavigate('contact') },
  ];

  return (
    <header className="sticky top-0 z-[9999] bg-[#0072CE] shadow-md font-sans no-print">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Logo Area */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <img 
              className="h-auto w-32 md:w-40" 
              src="https://i.ibb.co/QvzK6db3/Logo-Negativo.png" 
              alt="RentiaRoom" 
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
            {navLinks.map((link) => (
              link.url ? (
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
                <button
                  key={link.name}
                  onClick={link.action}
                  className="text-white hover:text-[#edcd20] font-medium text-[15px] transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  {link.name}
                </button>
              )
            ))}
             <button 
              onClick={() => onNavigate('list')} 
              className="text-white hover:text-[#edcd20] font-bold border-b-2 border-[#edcd20] px-1 py-1 text-[15px] transition-colors"
            >
              Oportunidades
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-[#edcd20] hover:bg-[#005b9f] focus:outline-none transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#0072CE] border-t border-[#005b9f] absolute w-full shadow-lg">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              link.url ? (
                <a 
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-left px-4 py-3 rounded-lg text-[15px] font-medium text-white hover:bg-[#005b9f] hover:text-[#edcd20] transition-colors"
                >
                  {link.name}
                </a>
              ) : (
                <button
                  key={link.name}
                  onClick={() => { link.action!(); setIsMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 rounded-lg text-[15px] font-medium text-white hover:bg-[#005b9f] hover:text-[#edcd20] transition-colors"
                >
                  {link.name}
                </button>
              )
            ))}
            <button 
              onClick={() => { onNavigate('list'); setIsMenuOpen(false); }} 
              className="block w-full text-left px-4 py-3 rounded-lg text-[15px] font-bold text-[#1c1c1c] bg-[#edcd20] border border-[#edcd20]"
            >
              Oportunidades
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
