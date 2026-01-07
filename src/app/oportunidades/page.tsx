import { OpportunitiesView } from "@/components/OpportunitiesView";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Oportunidades de Inversión Inmobiliaria | RentiaRoom',
    description: 'Explora oportunidades de inversión en Murcia con alta rentabilidad. Activos analizados para alquiler por habitaciones y coliving.',
};

export default function OpportunitiesPage() {
    return <OpportunitiesView />;
}
