
import React from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Metadata } from 'next';
import './globals.css'; 

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
