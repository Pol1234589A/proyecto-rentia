import { BrokerView } from "@/components/BrokerView";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Colaboradores y Agentes Inmobiliarios | RentiaRoom Murcia',
    description: 'Únete a nuestra red de colaboradores. Una plataforma unificada para propietarios, compradores y agentes. Gestiona activos o encuentra tu próxima inversión.',
};

export default function BrokersPage() {
    return <BrokerView />;
}
