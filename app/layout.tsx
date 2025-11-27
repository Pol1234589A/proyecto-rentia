
import React from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Metadata } from 'next';
import './globals.css'; // Asumiendo existencia o usar style tag si es entorno puro

export const metadata: Metadata = {
  title: 'RentiaRoom Murcia | Gestión de Habitaciones, Inversión y Alquiler',
  description: 'Líderes en Murcia en Gestión Integral de alquiler por habitaciones. Oportunidades de inversión inmobiliaria (+8%) y habitaciones premium.',
  keywords: 'gestión alquiler habitaciones murcia, inversión inmobiliaria, rentiaroom',
  icons: {
    icon: 'https://i.ibb.co/QvzK6db3/Logo-Negativo.png',
    apple: 'https://i.ibb.co/QvzK6db3/Logo-Negativo.png'
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.rentiaroom.com/',
    siteName: 'RentiaRoom',
    images: [
      {
        url: 'https://i.ibb.co/QvzK6db3/Logo-Negativo.png',
        width: 800,
        height: 600,
        alt: 'RentiaRoom Logo',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Tailwind CSS via CDN para mantener estilos idénticos sin config extra de build */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    rentia: {
                      black: '#1c1c1c',
                      gold: '#edcd20',
                      goldLight: '#f5e68c',
                      gray: '#f5f5f5',
                      text: '#333333',
                      blue: '#0072CE',
                      darkBlue: '#002849'
                    }
                  },
                  fontFamily: {
                    sans: ['Poppins', 'sans-serif'],
                    display: ['Space Grotesk', 'sans-serif'],
                  },
                  boxShadow: {
                    'idealista': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    'idealista-hover': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
                  }
                }
              }
            }
          `
        }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .cursor-zoom-in { cursor: zoom-in; }
          html { scroll-behavior: smooth; }
          @media print {
            header, footer, .no-print, .whatsapp-button { display: none !important; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}</style>
      </head>
      <body className="bg-gray-100 text-rentia-text font-sans antialiased">
        <LanguageProvider>
          {children}
          <WhatsAppButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
