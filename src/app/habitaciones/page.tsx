import { RoomsView } from "@/components/RoomsView";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Alquiler de Habitaciones en Murcia | Habitaciones Premium | RentiaRoom',
    description: 'Encuentra las mejores habitaciones en alquiler en Murcia. ✅ Especialistas en estudiantes y trabajadores. Vistabella, San Andrés y Centro. Alquiler seguro con RentiaRoom.',
    keywords: 'alquiler habitaciones murcia, habitaciones estudiantes murcia, habitaciones trabajadores murcia, rentiaroom murcia, alquiler piso compartido murcia',
};

export default function RoomsPage() {
    return <RoomsView />;
}
