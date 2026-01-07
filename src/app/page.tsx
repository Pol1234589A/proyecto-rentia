import { HomeView } from '@/components/HomeView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión Integral de Alquiler por Habitaciones en Murcia',
  description: 'Especialistas en alquiler de habitaciones en Murcia. Ofrecemos gestión pasiva para propietarios, reformas, y maximización de rentabilidad inmobiliaria.',
  alternates: {
    canonical: 'https://www.rentiaroom.es',
  },
};

export default function Page() {
  return <HomeView />;
}
