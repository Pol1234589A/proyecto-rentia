import { ManagementSubmissionForm } from "@/components/owners/ManagementSubmissionForm";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Publicar Propiedad | Gestión de Alquiler Murcia | RentiaRoom',
    description: 'Sube tu propiedad para una gestión integral. Maximizamos el beneficio de tu vivienda mediante el alquiler por habitaciones en Murcia.',
};

export default function ManagementSubmissionPage() {
    return <ManagementSubmissionForm />;
}
