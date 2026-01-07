import { ServicesView } from "@/components/ServicesView";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Servicios de Gestión de Alquiler | RentiaRoom Murcia',
    description: 'Descubre nuestros servicios de gestión integral de alquiler por habitaciones. Reformas, gestión de inquilinos, y rentabilidad garantizada en Murcia.',
};

export default function ServicesPage() {
    return <ServicesView />;
}
