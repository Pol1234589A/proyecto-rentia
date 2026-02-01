import { DiscountsView } from "@/components/DiscountsView";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Descuentos y Beneficios para Inquilinos | RentiaRoom',
    description: 'Ahorra en tus gastos mensuales con nuestros convenios exclusivos. Beneficios para la comunidad de inquilinos de RentiaRoom en Murcia.',
};

export default function DiscountsPage() {
    return <DiscountsView />;
}
