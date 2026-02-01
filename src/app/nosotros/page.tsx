import { AboutView } from "@/components/AboutView";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sobre Nosotros | Expertos en Co-living en Murcia | RentiaRoom',
    description: 'Conoce al equipo de RentiaRoom. Nuestra historia, valores y misión: transformar el mercado del alquiler por habitaciones en Murcia con transparencia y rentabilidad.',
};

export default function AboutPage() {
    return <AboutView />;
}
