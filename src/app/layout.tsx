import type { Metadata, Viewport } from 'next';
import { Poppins, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { MainLayout } from '@/components/MainLayout';
import { GlobalBusinessSchema } from '@/components/seo/GlobalBusinessSchema';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const viewport: Viewport = {
  themeColor: '#0072CE',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.rentiaroom.es'),
  title: {
    template: '%s | RentiaRoom Murcia',
    default: 'RentiaRoom | Gestión Integral de Alquiler por Habitaciones en Murcia',
  },
  description: 'Líderes en Gestión de Alquiler por Habitaciones en Murcia. Maximizamos tu rentabilidad mediante alquiler seguro, inquilinos filtrados y gestión pasiva para propietarios.',
  keywords: ['Gestión de alquiler habitaciones Murcia', 'Inversión inmobiliaria Murcia', 'Alquiler de habitaciones Murcia', 'Rentabilidad alquiler Murcia', 'Room renting management', 'Coliving Murcia'],
  authors: [{ name: 'RentiaRoom Team' }],
  creator: 'Rentia Investments S.L.',
  publisher: 'Rentia Investments S.L.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.rentiaroom.es',
    siteName: 'RentiaRoom Murcia',
    title: 'RentiaRoom | Líderes en Gestión de Habitaciones en Murcia',
    description: 'Transformamos tu vivienda en un activo de alta rentabilidad. Gestión integral de alquiler por habitaciones sin preocupaciones.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'RentiaRoom Murcia - Gestión Inmobiliaria',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentiaRoom | Gestión de Habitaciones Murcia',
    description: 'Expertos en explotación de viviendas por habitaciones. Alta rentabilidad, cero preocupaciones.',
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // To be replaced by user later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} ${spaceGrotesk.variable} antialiased`} suppressHydrationWarning>
        <GlobalBusinessSchema />
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}
